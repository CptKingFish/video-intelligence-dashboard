"""
score_video.py
Score a new video against a prebuilt stimulation direction.

For each timestep's brain vector x:
    x_z   = (x - vert_mean) / vert_std                # same standardization
    score = (x_z - midpoint) . direction              # signed: >0 stimulating-like
    cos   = cosine(x_z, stim_centroid)                # similarity to stim centroid

The signed projection is the abliteration-style readout: how far this moment
sits on the stimulating side of the boring<->stimulating axis. The cosine is an
alternative "how much does this look like the stimulated-brain prototype."

Outputs a per-timestep CSV, a PNG curve, and prints the most stimulating
segments. Timestep index is mapped to video seconds using the video duration
/ number of timesteps (override with --tr if you know the model's TR).

Usage:
    python score_video.py --video clip.mp4 --model stimulation_model.npz
"""

from __future__ import annotations

import argparse
import csv

import numpy as np

import tribe_brain as tb


def _seconds_per_step(video_path: str, n_steps: int, tr: float | None) -> float:
    if tr is not None:
        return tr
    # derive from container duration if available, else fall back to a TR of 1.49s
    try:
        import subprocess
        out = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nokey=1:noprint_wrappers=1", video_path],
            capture_output=True, text=True, check=True,
        )
        return float(out.stdout.strip()) / n_steps
    except Exception:
        return 1.49  # typical fMRI TR used in these datasets


def top_segments(scores: np.ndarray, sps: float, frac: float = 0.75, min_len: int = 2):
    """Contiguous runs whose score exceeds the `frac` quantile."""
    thr = np.quantile(scores, frac)
    hot = scores > thr
    segs, start = [], None
    for i, h in enumerate(hot):
        if h and start is None:
            start = i
        elif not h and start is not None:
            if i - start >= min_len:
                segs.append((start, i))
            start = None
    if start is not None and len(scores) - start >= min_len:
        segs.append((start, len(scores)))
    return sorted(
        ({"t_start": s * sps, "t_end": e * sps, "peak": float(scores[s:e].max())}
         for s, e in segs),
        key=lambda d: d["peak"], reverse=True,
    )


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--video", required=True)
    ap.add_argument("--model", default="stimulation_model.npz", help="direction from build_direction.py")
    ap.add_argument("--cache", default="./cache")
    ap.add_argument("--emb-cache", default="./embeddings")
    ap.add_argument("--tr", type=float, default=None, help="seconds per timestep (auto if omitted)")
    ap.add_argument("--out-csv", default="scores.csv")
    ap.add_argument("--out-png", default="scores.png")
    args = ap.parse_args()

    m = np.load(args.model)
    direction = m["direction"]
    midpoint = m["midpoint"]
    vert_mean = m["vert_mean"]
    vert_std = m["vert_std"]
    stim_centroid = m["stim_centroid"]

    print("Loading TRIBE v2 ...")
    model = tb.load_model(cache_folder=args.cache)
    print(f"Embedding {args.video} ...")
    X = tb.embed_video(model, args.video, emb_cache_dir=args.emb_cache)  # (N, dim)
    if X.shape[1] != direction.shape[0]:
        raise ValueError(f"dim mismatch: video {X.shape} vs model dim {direction.shape[0]}")

    X_z = (X - vert_mean) / vert_std
    proj = (X_z - midpoint) @ direction
    cos = (X_z @ stim_centroid) / (
        np.linalg.norm(X_z, axis=1) * np.linalg.norm(stim_centroid) + 1e-9
    )

    sps = _seconds_per_step(args.video, X.shape[0], args.tr)
    times = np.arange(X.shape[0]) * sps

    with open(args.out_csv, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["timestep", "time_sec", "stim_projection", "cosine_to_stim"])
        for i in range(X.shape[0]):
            w.writerow([i, round(times[i], 3), round(float(proj[i]), 5), round(float(cos[i]), 5)])

    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        plt.figure(figsize=(12, 4))
        plt.plot(times, proj, lw=1.4)
        plt.axhline(0, color="k", lw=0.6, alpha=0.5)
        plt.fill_between(times, 0, proj, where=proj > 0, alpha=0.25)
        plt.xlabel("video time (s)")
        plt.ylabel("stimulation projection")
        plt.title("Predicted stimulation over time (>0 = stimulating-like)")
        plt.tight_layout()
        plt.savefig(args.out_png, dpi=130)
        print(f"  curve -> {args.out_png}")
    except ImportError:
        print("  (matplotlib not installed; skipping PNG)")

    print(f"  per-timestep scores -> {args.out_csv}")
    print("\nMost stimulating segments:")
    for seg in top_segments(proj, sps)[:8]:
        print(f"  {seg['t_start']:6.1f}s - {seg['t_end']:6.1f}s   peak={seg['peak']:+.3f}")


if __name__ == "__main__":
    main()

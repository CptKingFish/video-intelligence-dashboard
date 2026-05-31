"""
build_direction.py
Compute a "stimulation direction" in TRIBE v2 brain-response space, the same
way abliteration computes a refusal direction: difference of class means.

    stimulating clips --TRIBE v2-->  S  (n_s timesteps, dim)
    boring clips      --TRIBE v2-->  B  (n_b timesteps, dim)

    d_raw = mean(S) - mean(B)           # the contrastive direction (dim,)
    d_hat = d_raw / ||d_raw||           # unit vector

Per-vertex standardization is applied first (z-score using stats pooled over
BOTH sets). Cortical vertices have wildly different BOLD variance; without
this, a few high-variance regions dominate the dot product and the direction
stops meaning "stimulating vs boring." This is the brain-space analogue of
working in a normalized activation space before taking the abliteration diff.

We also store the midpoint mu = (mean(S)+mean(B))/2 in standardized space, so
scoring can measure signed distance from the decision boundary rather than
raw projection magnitude.

Usage:
    python build_direction.py --stimulating ./stim_videos \
                              --boring ./boring_videos \
                              --out stimulation_model.npz
"""

from __future__ import annotations

import argparse

import numpy as np

import tribe_brain as tb


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--stimulating", required=True, help="folder of stimulating videos")
    ap.add_argument("--boring", required=True, help="folder of boring/baseline videos")
    ap.add_argument("--out", default="stimulation_model.npz", help="output direction file")
    ap.add_argument("--cache", default="./cache", help="TRIBE v2 weights cache folder")
    ap.add_argument("--emb-cache", default="./embeddings", help="per-video embedding cache")
    args = ap.parse_args()

    print("Loading TRIBE v2 ...")
    model = tb.load_model(cache_folder=args.cache)

    print(f"Embedding stimulating videos in {args.stimulating!r} ...")
    stim_list = tb.embed_folder(model, args.stimulating, emb_cache_dir=args.emb_cache)
    print(f"Embedding boring videos in {args.boring!r} ...")
    bore_list = tb.embed_folder(model, args.boring, emb_cache_dir=args.emb_cache)

    S = tb.pool(stim_list)  # (n_s, dim)
    B = tb.pool(bore_list)  # (n_b, dim)
    if S.shape[1] != B.shape[1]:
        raise ValueError(f"dim mismatch: stimulating {S.shape} vs boring {B.shape}")

    # --- per-vertex standardization (stats pooled across both classes) ---
    pooled = np.concatenate([S, B], axis=0)
    vert_mean = pooled.mean(axis=0)
    vert_std = pooled.std(axis=0) + 1e-6
    S_z = (S - vert_mean) / vert_std
    B_z = (B - vert_mean) / vert_std

    # --- abliteration-style contrastive direction ---
    mean_s = S_z.mean(axis=0)
    mean_b = B_z.mean(axis=0)
    d_raw = mean_s - mean_b
    norm = np.linalg.norm(d_raw)
    if norm == 0:
        raise ValueError("Stimulating and boring means are identical; need more/different data.")
    d_hat = d_raw / norm
    mu = 0.5 * (mean_s + mean_b)  # midpoint in standardized space

    # quick separability sanity check: projected class scores
    s_scores = (S_z - mu) @ d_hat
    b_scores = (B_z - mu) @ d_hat
    sep = (s_scores.mean() - b_scores.mean()) / (0.5 * (s_scores.std() + b_scores.std()) + 1e-9)

    np.savez(
        args.out,
        direction=d_hat.astype(np.float32),
        midpoint=mu.astype(np.float32),
        vert_mean=vert_mean.astype(np.float32),
        vert_std=vert_std.astype(np.float32),
        stim_centroid=mean_s.astype(np.float32),
        n_stim_videos=len(stim_list),
        n_bore_videos=len(bore_list),
        n_stim_frames=S.shape[0],
        n_bore_frames=B.shape[0],
        dim=S.shape[1],
    )

    print("\n--- stimulation direction built ---")
    print(f"  dim                : {S.shape[1]} vertices")
    print(f"  stimulating frames : {S.shape[0]} from {len(stim_list)} videos")
    print(f"  boring frames      : {B.shape[0]} from {len(bore_list)} videos")
    print(f"  class separation   : {sep:.2f}  (Cohen's-d-like; >0.8 is a strong, usable signal)")
    print(f"  saved              : {args.out}")


if __name__ == "__main__":
    main()

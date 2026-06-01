"""
tribe_brain.py
Shared helpers for the TRIBE v2 "stimulation direction" pipeline.

TRIBE v2 (Meta FAIR) predicts whole-brain fMRI responses to naturalistic
stimuli. For a video it returns an array of shape (n_timesteps, n_vertices)
on the fsaverage5 cortical mesh (~20,484 vertices). Predictions are already
shifted ~5s to compensate for hemodynamic lag, so timestep t aligns with the
stimulus that caused it.

This module wraps model loading + per-video embedding with on-disk caching so
you never re-run the (expensive) forward pass on the same file twice.
"""

from __future__ import annotations

import hashlib
import os
from pathlib import Path
from typing import Iterable

import numpy as np

VIDEO_EXTS = {".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v"}


def load_model(cache_folder: str = "./cache"):
    """Load the pretrained TRIBE v2 model. Heavy import is done lazily so the
    scoring step (pure numpy) doesn't require torch/tribev2 to be installed."""
    from tribev2 import TribeModel  # noqa: WPS433 (intentional lazy import)

    return TribeModel.from_pretrained("facebook/tribev2", cache_folder=cache_folder)


def _cache_key(video_path: str) -> str:
    """Stable key from path + size + mtime, so edits to a file invalidate it."""
    p = Path(video_path).resolve()
    stat = p.stat()
    raw = f"{p}|{stat.st_size}|{int(stat.st_mtime)}"
    return hashlib.sha1(raw.encode()).hexdigest()[:16]


def embed_video(
    model,
    video_path: str,
    emb_cache_dir: str = "./embeddings",
) -> np.ndarray:
    """Return TRIBE v2 brain embeddings of shape (n_timesteps, n_vertices).

    Cached as .npy under emb_cache_dir keyed by file identity.
    """
    os.makedirs(emb_cache_dir, exist_ok=True)
    key = _cache_key(video_path)
    cache_path = Path(emb_cache_dir) / f"{Path(video_path).stem}.{key}.npy"

    if cache_path.exists():
        return np.load(cache_path)

    df = model.get_events_dataframe(video_path=str(video_path))
    preds, _segments = model.predict(events=df)
    preds = np.asarray(preds, dtype=np.float32)  # (n_timesteps, n_vertices)
    np.save(cache_path, preds)
    return preds


def list_videos(folder: str) -> list[str]:
    """All video files in a folder (non-recursive), sorted."""
    folder_p = Path(folder)
    files = [
        str(p) for p in sorted(folder_p.iterdir())
        if p.suffix.lower() in VIDEO_EXTS
    ]
    if not files:
        raise FileNotFoundError(f"No videos found in {folder!r} ({sorted(VIDEO_EXTS)})")
    return files


def embed_folder(
    model,
    folder: str,
    emb_cache_dir: str = "./embeddings",
) -> list[np.ndarray]:
    """Embed every video in a folder, returning a list of (N_i, dim) arrays."""
    out = []
    for vp in list_videos(folder):
        emb = embed_video(model, vp, emb_cache_dir=emb_cache_dir)
        print(f"  embedded {Path(vp).name:40s} -> {emb.shape}")
        out.append(emb)
    return out


def pool(embeddings: Iterable[np.ndarray]) -> np.ndarray:
    """Stack a list of (N_i, dim) arrays into one (sum N_i, dim) array."""
    return np.concatenate(list(embeddings), axis=0)

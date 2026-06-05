from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

MODEL_PATH = Path(os.getenv("MODEL_PATH", str(Path(__file__).parent / "stimulation_model.npz")))
CACHE_DIR = os.getenv("TRIBE_CACHE_DIR", str(Path(__file__).parent / "cache"))
EMB_CACHE_DIR = os.getenv("EMB_CACHE_DIR", str(Path(__file__).parent / "embeddings"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

_npz: dict | None = None
_tribe_model = None


def _load_npz() -> dict:
    global _npz
    if _npz is None:
        m = np.load(MODEL_PATH)
        _npz = {k: m[k] for k in ("direction", "midpoint", "vert_mean", "vert_std", "stim_centroid")}
    return _npz


def _load_tribe_model():
    global _tribe_model
    if _tribe_model is None:
        import tribe_brain as tb
        _tribe_model = tb.load_model(cache_folder=CACHE_DIR)
    return _tribe_model


def _seconds_per_step(video_path: str, n_steps: int) -> float:
    try:
        import subprocess
        out = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nokey=1:noprint_wrappers=1", video_path],
            capture_output=True, text=True, check=True,
        )
        return float(out.stdout.strip()) / n_steps
    except Exception:
        return 1.49


@asynccontextmanager
async def lifespan(app: FastAPI):
    _load_npz()
    _load_tribe_model()
    yield


app = FastAPI(title="Intelliral API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SimilarityRequest(BaseModel):
    video_path: str


class TimestepScore(BaseModel):
    timestep: int
    time_sec: float
    stim_projection: float
    cosine_to_stim: float


class SimilarityResponse(BaseModel):
    scores: list[TimestepScore]


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/similarity-matching", response_model=SimilarityResponse)
async def similarity_matching(request: SimilarityRequest) -> SimilarityResponse:
    video_path = request.video_path

    if not Path(video_path).exists():
        raise HTTPException(status_code=404, detail=f"Video file not found: {video_path}")

    try:
        import tribe_brain as tb

        m = _load_npz()
        tribe_model = _load_tribe_model()

        X = tb.embed_video(tribe_model, video_path, emb_cache_dir=EMB_CACHE_DIR)

        if X.shape[1] != m["direction"].shape[0]:
            raise HTTPException(
                status_code=422,
                detail=f"Dimension mismatch: video {X.shape[1]} vs model {m['direction'].shape[0]}",
            )

        X_z = (X - m["vert_mean"]) / m["vert_std"]
        proj = (X_z - m["midpoint"]) @ m["direction"]
        cos = (X_z @ m["stim_centroid"]) / (
            np.linalg.norm(X_z, axis=1) * np.linalg.norm(m["stim_centroid"]) + 1e-9
        )

        sps = _seconds_per_step(video_path, X.shape[0])
        times = np.arange(X.shape[0]) * sps

        return SimilarityResponse(scores=[
            TimestepScore(
                timestep=i,
                time_sec=round(float(times[i]), 3),
                stim_projection=round(float(proj[i]), 5),
                cosine_to_stim=round(float(cos[i]), 5),
            )
            for i in range(X.shape[0])
        ])

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

# Brain-stimulation direction from TRIBE v2

Build a “what a stimulated brain looks like” vector from video, then score any
new video for which moments are stimulating — using the same math as
abliteration (difference of class means), but in brain-response space instead
of LLM activation space.

## How it works

TRIBE v2 (Meta FAIR) maps a video to predicted fMRI activity of shape
`(n_timesteps, ~20484 vertices)` on the fsaverage5 cortical mesh. We:

1. **Embed** stimulating clips → `S`, boring clips → `B`.
1. **Standardize** per vertex (z-score, stats pooled over both sets).
1. **Direction** `d = normalize(mean(S) - mean(B))` — the stimulation axis.
1. **Score** a new clip: `score[t] = (x_z[t] - midpoint) · d`. Positive means
   that moment sits on the stimulating side of the axis.

This is directly analogous to a refusal direction (`mean(harmful) - mean(harmless)`), just with brain vectors as the activations.

## Setup

```bash
git clone https://github.com/facebookresearch/tribev2
cd tribev2 && pip install -e .          # add ".[plotting]" for brain maps
pip install numpy matplotlib            # for scoring/plots
```

Put these three files (`tribe_brain.py`, `build_direction.py`,
`score_video.py`) somewhere on your `PYTHONPATH` (e.g. the repo root).
First run downloads weights from `huggingface.co/facebook/tribev2`. A GPU is
strongly recommended.

## Workflow

```bash
# 1. Build the direction from two folders of clips
python build_direction.py --stimulating ./stim_videos \
                          --boring ./boring_videos \
                          --out stimulation_model.npz

# 2. Score any new video
python score_video.py --video new_clip.mp4 --model stimulation_model.npz
```

You get `scores.csv` (per-timestep projection + cosine), `scores.png` (the
curve over time), and a printed list of the most stimulating segments.
Embeddings are cached per file, so re-runs are fast.

## Things worth knowing

- **The direction captures whatever systematically differs between your two
  sets — not “stimulation” in the abstract.** If your stimulating clips also
  happen to have more faces, motion, or louder audio than the boring ones,
  the axis encodes that too. Curate the two sets so the _only_ consistent
  difference is the thing you care about, and use many clips per side — the
  `class separation` number printed at build time tells you if the signal is
  real (aim for > 0.8).
- TRIBE v2 predicts a **group-average** brain, already shifted ~5s for
  hemodynamic lag, so the score curve aligns with stimulus time.
- **License:** TRIBE v2 weights are **CC BY-NC 4.0 — non-commercial only.**
  Fine for research/prototyping; not for a commercial product without sorting
  out licensing with Meta.

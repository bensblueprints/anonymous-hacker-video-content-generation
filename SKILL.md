---
name: anonymous-hacker-video-content-generation
description: Generate paced Anonymous hacker videos safely.
version: 0.1.0
author: Benji Boyce (bensblueprints), Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [ai-video, minimax-h3, fal-ai, reels, cybersecurity]
    related_skills: []
---

# Anonymous Hacker Video Content Generation

Create photorealistic, paragraph-aware vertical videos featuring one consistent hood-up Guy Fawkes character. The workflow preserves the real scale of handheld products, keeps H3 motion purposeful, and limits cybersecurity demonstrations to owned or expressly authorized lab equipment.

## When to Use

- Build 9:16 Anonymous/Guy-Fawkes educational Reels.
- Preserve exact product scale from a real in-hand photograph.
- Change locations/actions when the narration changes paragraph or topic.
- Generate MiniMax H3 Max clips through fal.ai and synchronize narration.
- Do not use this workflow for operational attacks, unauthorized access, credential theft, persistence, or evasion.

## Prerequisites

- Python 3.10+ and Pillow.
- `ffmpeg` and `ffprobe` on `PATH`.
- `FAL_KEY` for live image/video generation; validation, dry-run, and QC do not require it.
- A narration file, timed scene plan, and real in-hand reference when product scale matters.

Install dependencies with `terminal(command="python3 -m pip install -r requirements.txt")`.

## How to Run

Use `terminal` from the repository root. Public source: https://github.com/bensblueprints/anonymous-hacker-video-content-generation

```text
python3 scripts/anonymous_hacker_video.py validate --project examples/project.example.json --scenes examples/scenes.example.json
python3 scripts/anonymous_hacker_video.py dry-run --project examples/project.example.json --scenes examples/scenes.example.json
python3 scripts/anonymous_hacker_video.py stage-a --project project.json --source real-in-hand.jpg --output stage-a.png
python3 scripts/anonymous_hacker_video.py stage-b --project project.json --source stage-a.png --scene "Full-body operations room host shot" --output host.png
python3 scripts/anonymous_hacker_video.py topic-frame --project project.json --source stage-a.png --topic "Bad USB" --location "owned lab desk" --action "seated, cable ready beside laptop" --output badusb.png
python3 scripts/anonymous_hacker_video.py generate --project project.json --scenes scenes.json
python3 scripts/anonymous_hacker_video.py render --project project.json --scenes scenes.json
python3 scripts/anonymous_hacker_video.py qc-sheet --videos output/scene_001_raw.mp4 output/scene_002_raw.mp4 --output output/qc.jpg
```

## Procedure

1. **Map narration first.** Group narration into 8–12 second clips, then mark every paragraph/topic/location change. Completion criterion: every scene has a topic, location, target duration, and 2–4 second pacing beats.
2. **Create Stage A.** Direct-edit the supplied real in-hand photograph. Change the person into the character while preserving the product's exact pixel size, position, orientation, and grip. Completion criterion: side-by-side QC matches the source product scale.
3. **Create Stage B.** Use only the approved Stage-A image as the authoritative character/product reference for the first 9:16 scene. Completion criterion: output is 1080×1920 and the product remains palm-sized relative to hand and mask.
4. **Create topic frames.** At a paragraph/topic/location change, generate a new first frame using `topic-frame`; do not force the prior final frame into the wrong environment. Completion criterion: every `chain_from_previous: false` scene has its own intentional input image.
5. **Generate selectively.** Chain the previous final frame only within one coherent action/location. Completion criterion: config validation rejects cross-location chaining.
6. **Keep pace.** Place a purposeful prop action, head turn, lighting beat, camera beat, or clean cut every 2–4 seconds. Avoid slow idle holds, drifting, swaying, and backward walking. Completion criterion: each 10–12 second clip contains 2–3 readable beats.
7. **Render and inspect.** Allocate clip frames from cumulative narration boundaries at 24 fps (never round every clip independently), center-crop before scaling to 1080×1920, attach narration, and build a four-frame-per-clip QC sheet. Completion criterion: the total frame count matches the rounded final narration boundary; inspect product size, hands, face/mask, duplicates, direction of travel, and semantic continuity before delivery.

## Character Lock

- Exactly one adult male.
- Clean white Guy Fawkes mask covering the entire face.
- Plain black hoodie with hood fully raised.
- Fitted black gloves, black cargo pants, and complete black lace-up combat boots when framed.
- Photorealistic anatomy; no exposed face, duplicates, extra fingers, or weapons.

## Product Scale Lock

When scale matters, the real in-hand photograph is authoritative. Stage A edits that photograph directly; Stage B uses the approved edit as its sole reference. Video prompts keep the product near the torso with arms tucked, fixed apparent pixel width, and no lens-thrust, push-in, or zoom.

Reject and regenerate a clip if the product grows, duplicates, or becomes a tablet-sized prop. Regenerate every downstream clip that chained from the rejected final frame.

## Pacing Rules

- Purposeful visual beat every 2–4 seconds.
- Two or three actions per 10–12 second clip.
- No prolonged idle hold or generic slow sway.
- Never walk backward unless the script explicitly calls for it.
- Use grounded forward motion with natural weight transfer.
- Use hard cuts at semantic topic boundaries; chain only within a scene.

## Pitfalls

- A loose multi-reference prompt does not reliably preserve product scale; use the staged edit.
- Chaining every clip creates implausible walking and wrong locations.
- Moving a product toward the lens can look like physical enlargement even when anatomy remains valid.
- H3 output is frame-quantized at 24 fps; narration controls the final exact runtime.
- AI-generated laptop text can become operational-looking gibberish. Request blank or abstract non-legible text and reject unsafe frames.

## Verification

- `validate` reports the expected scene count and duration.
- `dry-run` succeeds without `FAL_KEY` and shows scale, pacing, safety, and movement locks in every prompt.
- `pytest -q` passes without network access.
- `python3 -m compileall scripts tests` succeeds.
- Final files probe as 1080×1920 H.264 with narration audio.
- QC sheet shows one character, one product, realistic hands, correct movement direction, and topic-appropriate locations.

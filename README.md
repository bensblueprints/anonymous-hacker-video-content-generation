# Anonymous Hacker Video Content Generation

A config-driven Python toolkit and Hermes skill for producing photorealistic 9:16 educational cybersecurity videos with a consistent hood-up Guy Fawkes character, accurate handheld-product scale, faster purposeful pacing, paragraph-aware scene changes, selective MiniMax H3 Max chaining, FFmpeg timing, and visual QC.

## Why this workflow exists

Two common failures shaped this project:

1. Product references used loosely can turn a palm-sized device into an oversized prop.
2. Chaining every generated clip can force the character to drift, walk backward, or remain in the wrong location when narration changes topic.

The solution is staged reference editing plus semantic scene planning:

- Stage A edits the user's real in-hand photo directly while preserving the product's exact scale and grip.
- Stage B uses the approved Stage-A image as the sole character/product reference for the first 9:16 scene.
- New paragraphs/topics get deliberate new first-frame compositions.
- Last-frame chaining happens only inside one coherent action/location.
- Every 10–12 second clip receives 2–3 purposeful pacing beats.

## Features

- Direct in-hand reference transformation
- Full-body 9:16 character staging
- Topic-specific scene-frame generation
- fal.ai Nano Banana image editing
- fal.ai MiniMax H3 Max image-to-video
- Selective final-frame chaining
- Cumulative-boundary 24 fps timing and 1080×1920 rendering with FFmpeg, preventing long-video frame drift
- Optional frame-accurate Remotion glitch/color/title pass with procedural FFmpeg transition sound design
- Narration offset and assembly
- Four-sample-per-clip QC sheets
- Offline config validation and dry-run
- Ethical-only cybersecurity prompt locks

## Requirements

- Python 3.10+
- `ffmpeg` and `ffprobe`
- `FAL_KEY` for live generation

```bash
python3 -m pip install -r requirements.txt
export FAL_KEY='your-fal-key'
```

Do not commit `.env` or API credentials. `.env.example` contains placeholders only.

## Quick start

```bash
python3 scripts/anonymous_hacker_video.py validate \
  --project examples/project.example.json \
  --scenes examples/scenes.example.json

python3 scripts/anonymous_hacker_video.py dry-run \
  --project examples/project.example.json \
  --scenes examples/scenes.example.json
```

### 1. Stage the real in-hand reference

```bash
python3 scripts/anonymous_hacker_video.py stage-a \
  --project project.json \
  --source assets/real-in-hand-reference.jpg \
  --output output/stage-a-anonymous.png
```

This changes the person into the Anonymous character while preserving the real product's pixel size, placement, orientation, and grip.

### 2. Create the first 9:16 scene

```bash
python3 scripts/anonymous_hacker_video.py stage-b \
  --project project.json \
  --source output/stage-a-anonymous.png \
  --scene 'Full-body host in a green-lit operations room' \
  --output output/opening-host.png
```

### 3. Create a new frame at a topic boundary

```bash
python3 scripts/anonymous_hacker_video.py topic-frame \
  --project project.json \
  --source output/stage-a-anonymous.png \
  --topic 'Bad USB' \
  --location 'owned cybersecurity lab desk' \
  --action 'seated at a chair with a cable ready beside an open laptop' \
  --output output/badusb-desk.png
```

### 4. Generate, render, and inspect

```bash
python3 scripts/anonymous_hacker_video.py generate --project project.json --scenes scenes.json
python3 scripts/anonymous_hacker_video.py render --project project.json --scenes scenes.json
python3 scripts/anonymous_hacker_video.py qc-sheet \
  --videos output/scene_001_raw.mp4 output/scene_002_raw.mp4 \
  --output output/qc-contact-sheet.jpg
```

## Scene planning

Each scene has an explicit topic, location, action, target duration, and pacing beats. Use `chain_from_previous: true` only when the prior clip is in the same location and continues the same physical action. Use `false` and supply a new topic-frame image at a paragraph or location change.

The example plan demonstrates:

- opening and permission-warning host scenes
- a hard cut to a seated Bad USB desk scene
- a chained connected-laptop continuation
- purposeful beats every 2–4 seconds
- no backward walking

## Optional viral post-production

`postproduction/remotion-viral/` contains a deterministic 7,103-frame example that keeps the accepted video continuous while adding short static/RGB accents, major-topic color washes, safe-margin title cards, and procedural FFmpeg sound effects mixed beneath narration. It also includes 49 narration-synchronized presentation cards that summarize each capability, misuse warning, and safe-lab alternative as it is spoken; enumerated points reveal sequentially like a slide deck rather than behaving as full captions. Render representative card stills first, then use 600–900-frame ranges at low Remotion concurrency on 16 GB machines.

## Safety

This project is for educational and ethical cybersecurity storytelling. It intentionally instructs prompts not to show operational attack commands, payloads, real credentials, theft, persistence, evasion, or unauthorized access. Demonstrations should use owned equipment, virtual machines, blank test media, or express written permission.

## Testing

```bash
python3 -m compileall scripts tests
pytest -q
python3 scripts/anonymous_hacker_video.py --help
```

## Hermes skill

`SKILL.md` can be installed as a user-local Hermes skill with the included script and examples. The skill captures the staged-reference, pacing, chaining, timing, and QC procedure.

## License

MIT

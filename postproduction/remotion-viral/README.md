# Remotion + FFmpeg Viral Post-Production

A deterministic 9:16 post-production example for long-form vertical cybersecurity videos.

It keeps the source video as one continuous, frame-accurate layer while Remotion adds:

- brief static and RGB/glitch accents at clip boundaries;
- heavier color-wash transitions at major topic changes;
- numbered topic title cards and opening/closing overlays;
- subtle grain, scanlines, vignette, and micro-jitter.

FFmpeg then restores the original narration and mixes procedural, license-clean static ticks, whooshes, and low impacts underneath it.

## Use

1. Copy the clean master to `public/source.mp4`.
2. Edit `src/timeline.ts` to match the project's FPS, duration, clip boundaries, and major topics.
3. Edit the timing constants in `build_sound_mix.py` to match the same timeline.
4. Install and validate:

```bash
npm install
npm run build
npm run compositions
```

5. Render the silent visual layer:

```bash
npx remotion render FlipperZeroReel out/vfx.mp4 \
  --codec=h264 --crf=18 --concurrency=2 --muted
```

6. Mux the narration and sound design:

```bash
python3 build_sound_mix.py \
  --video out/vfx.mp4 \
  --source public/source.mp4 \
  --output out/final_with_sound.mp4
```

The example composition is 1080×1920, 24 fps, and 7,103 frames. It rounds cumulative timing boundaries to frame numbers and never overlaps or shortens the narration timeline.

## Safety and publishing

Do not commit `public/source.mp4`, rendered videos, procedural WAV files, credentials, or machine-specific paths. Keep transition sounds well beneath narration and inspect a short major-transition preview before a full render.

import React from 'react';
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  interpolate,
  useCurrentFrame,
} from 'remotion';
import {
  FPS,
  WIDTH,
  HEIGHT,
  DURATION_IN_FRAMES,
  buildBoundaryEffects,
  MAJOR_TOPICS,
  secToFrame,
  HOOK_DURATION_FRAMES,
  CTA_START_FRAME,
  hashNoise,
} from './timeline';
import {
  GrainLayer,
  ScanlinesLayer,
  VignetteLayer,
  StaticLayer,
  RgbSplitLayer,
  TearSlicesLayer,
  ColorWashLayer,
  flickerIntensity,
  majorWashIntensity,
  heavyIntensity,
} from './effects';
import {OpeningHook, MajorTitleLabel, EndCta} from './overlays';

// ============================================
// FlipperZeroReel — full-length VFX pass over the source video.
// Source video is muted; audio track is present but the render is
// configured silent (parent FFmpeg pass adds sound).
// ============================================

export const FlipperZeroReel: React.FC<{videoSrc: string}> = ({videoSrc}) => {
  const frame = useCurrentFrame();
  const boundaries = buildBoundaryEffects();

  // Find any active boundary effect at this frame (they never overlap:
  // min clip gap is ~7.5s ≫ max effect length 18 frames).
  let activeFlicker = 0;
  let activeMajor: (typeof boundaries)[number] | null = null;
  for (const b of boundaries) {
    const local = frame - b.frame;
    if (local < 0 || local >= b.durationFrames) continue;
    if (b.type === 'flicker') {
      activeFlicker = Math.max(activeFlicker, flickerIntensity(local, b.durationFrames));
    } else {
      activeMajor = b;
    }
  }

  // Base sub-buckle jitter: tiny constant transform so nothing is static-flat
  const jitterX = hashNoise(frame, 1, 999) * 1.4 - 0.7;
  const jitterY = hashNoise(frame, 2, 999) * 1.0 - 0.5;

  // Opening hook boost
  const hookBoost = frame < HOOK_DURATION_FRAMES ? 0.5 : 0;

  // Major transition components
  const majorLocal = activeMajor ? frame - activeMajor.frame : -1;
  const washI = activeMajor
    ? majorWashIntensity(majorLocal, activeMajor.durationFrames)
    : 0;
  const heavyI = activeMajor
    ? heavyIntensity(majorLocal, activeMajor.durationFrames)
    : 0;
  const flickerI = Math.max(
    activeFlicker,
    hookBoost > 0 && frame > 2 ? 0.35 : 0
  );

  const glitchTotal = Math.min(
    1,
    activeFlicker * 0.9 + washI * 0.6 + hookBoost
  );

  return (
    <AbsoluteFill style={{backgroundColor: '#000', overflow: 'hidden'}}>
      {/* --- Source video, muted, full frame --- */}
      <AbsoluteFill
        style={{
          transform: `translate(${jitterX}px, ${jitterY}px) scale(1.006)`,
        }}
      >
        <OffthreadVideo
          src={videoSrc}
          muted
          style={{width: WIDTH, height: HEIGHT, objectFit: 'cover'}}
        />
      </AbsoluteFill>

      {/* --- RGB split during glitch moments --- */}
      <RgbSplitLayer frame={frame} intensity={glitchTotal * 0.85} />

      {/* --- Tear slices (heavy, clears fast) --- */}
      <TearSlicesLayer
        frame={frame}
        intensity={Math.max(heavyI, activeFlicker * 0.7)}
      />

      {/* --- Analog static blocks (heavy, clears fast) --- */}
      <StaticLayer
        frame={frame}
        intensity={Math.max(heavyI * 0.8, activeFlicker * 0.55)}
      />

      {/* --- Major color wash --- */}
      {activeMajor ? (
        <ColorWashLayer
          progress={
            activeMajor ? majorLocal / activeMajor.durationFrames : 0
          }
          color={activeMajor.color ?? '#7ef29d'}
          accent={activeMajor.accent ?? '#ffffff'}
          intensity={washI * 0.9}
        />
      ) : null}

      {/* --- Major title labels --- */}
      {MAJOR_TOPICS.map((topic, index) => (
        <MajorTitleLabel
          key={topic.label}
          label={topic.label}
          color={topic.color}
          accent={topic.accent}
          startFrame={secToFrame(topic.startSec)}
          index={index}
        />
      ))}

      {/* --- Opening hook (first 2s) --- */}
      {frame < HOOK_DURATION_FRAMES ? <OpeningHook /> : null}

      {/* --- CTA near end --- */}
      <EndCta startFrame={CTA_START_FRAME} />

      {/* --- Continuous subtle treatment --- */}
      <ScanlinesLayer opacity={0.07} />
      <GrainLayer frame={frame} opacity={0.05} />
      <VignetteLayer strength={0.5} />

      {/* Source audio muted — parent pipeline mixes sound from source. */}
      {/* <Audio src={videoSrc} /> */}
    </AbsoluteFill>
  );
};

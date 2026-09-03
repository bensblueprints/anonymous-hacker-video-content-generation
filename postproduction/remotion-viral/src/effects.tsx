import React from 'react';
import {AbsoluteFill, interpolate, Easing} from 'remotion';
import {hashNoise, hashNoiseSigned} from './timeline';

// ============================================
// Deterministic procedural noise only — no Math.random anywhere.
// ============================================

// --------------------------------------------
// Film grain — sparse deterministic dots
// --------------------------------------------
export const GrainLayer: React.FC<{frame: number; opacity?: number}> = ({
  frame,
  opacity = 0.05,
}) => {
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < 60; i++) {
    const nx = hashNoise(i, frame, 11);
    const ny = hashNoise(i, frame, 23);
    const lum = hashNoise(i, frame, 37);
    const size = 2 + hashNoise(i, frame, 41) * 4;
    dots.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          left: `${nx * 100}%`,
          top: `${ny * 100}%`,
          width: size,
          height: size,
          background: lum > 0.5 ? '#ffffff' : '#000000',
          opacity: 0.25 + lum * 0.45,
          borderRadius: '50%',
        }}
      />
    );
  }
  return (
    <AbsoluteFill style={{opacity, pointerEvents: 'none'}}>{dots}</AbsoluteFill>
  );
};

// --------------------------------------------
// Scanlines — static repeating gradient
// --------------------------------------------
export const ScanlinesLayer: React.FC<{opacity?: number}> = ({
  opacity = 0.07,
}) => {
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        background:
          'repeating-linear-gradient(to bottom, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.12) 1px, transparent 1px, transparent 4px)',
        opacity,
        mixBlendMode: 'overlay',
      }}
    />
  );
};

// --------------------------------------------
// Vignette — subtle radial darkening at edges
// --------------------------------------------
export const VignetteLayer: React.FC<{strength?: number}> = ({
  strength = 0.55,
}) => {
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        background:
          'radial-gradient(ellipse 74% 64% at 50% 46%, transparent 55%, rgba(0,0,0,0.6) 100%)',
        opacity: strength,
      }}
    />
  );
};

// --------------------------------------------
// Analog static — blocky TV snow
// --------------------------------------------
export const StaticLayer: React.FC<{
  frame: number;
  intensity: number; // 0..1
  seed?: number;
}> = ({frame, intensity, seed = 101}) => {
  if (intensity <= 0) return null;
  const cols = 27;
  const rows = 48;
  const cells: React.ReactNode[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const n = hashNoise(col, row * 31 + frame * 7, seed);
      if (n < 0.82) continue;
      const lum = hashNoise(col, row * 31 + frame * 13, seed + 110);
      cells.push(
        <div
          key={`${row}-${col}`}
          style={{
            position: 'absolute',
            left: `${(col / cols) * 100}%`,
            top: `${(row / rows) * 100}%`,
            width: `${100 / cols + 0.2}%`,
            height: `${100 / rows + 0.2}%`,
            background: lum > 0.5 ? '#e8f0ff' : '#0a0f14',
            opacity: 0.25 + n * 0.75,
          }}
        />
      );
    }
  }
  return <AbsoluteFill style={{opacity: intensity * 0.85}}>{cells}</AbsoluteFill>;
};

// --------------------------------------------
// RGB split — chromatic aberration via offset tinted overlays.
// Screen-blended red/cyan gradient bars offset in opposite directions;
// reads as channel misregistration without duplicating the video element.
// --------------------------------------------
export const RgbSplitLayer: React.FC<{
  frame: number;
  intensity: number; // 0..1
}> = ({frame, intensity}) => {
  if (intensity <= 0.01) return null;
  const dx = 8 + Math.abs(hashNoiseSigned(frame, 3, 307)) * 16 * intensity;

  const bar = (color: string, sign: number): React.ReactNode => (
    <AbsoluteFill
      style={{
        transform: `translateX(${sign * dx}px)`,
        mixBlendMode: 'screen',
        opacity: 0.5 * intensity,
        background: `linear-gradient(90deg, transparent 0%, ${color} 12%, transparent 26%, transparent 74%, ${color} 88%, transparent 100%)`,
      }}
    />
  );

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {bar('rgba(255,40,40,0.85)', -1)}
      {bar('rgba(40,220,255,0.85)', 1)}
    </AbsoluteFill>
  );
};

// --------------------------------------------
// Horizontal tear slices — displaced translucent strips
// --------------------------------------------
export const TearSlicesLayer: React.FC<{
  frame: number;
  intensity: number;
  seed?: number;
}> = ({frame, intensity, seed = 501}) => {
  if (intensity <= 0.01) return null;
  const slices: React.ReactNode[] = [];
  const count = 6;
  for (let i = 0; i < count; i++) {
    const top = hashNoise(i, frame, seed) * 92;
    const h = 2 + hashNoise(i, frame, seed + 7) * 7;
    const shift = hashNoiseSigned(i, frame, seed + 13) * 60 * intensity;
    const lum = hashNoise(i, frame, seed + 19);
    slices.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${top}%`,
          height: `${h}%`,
          transform: `translateX(${shift}px)`,
          background:
            lum > 0.5
              ? 'rgba(255,255,255,0.10)'
              : 'rgba(10,15,20,0.16)',
          mixBlendMode: lum > 0.5 ? 'screen' : 'multiply',
        }}
      />
    );
  }
  return <AbsoluteFill style={{pointerEvents: 'none'}}>{slices}</AbsoluteFill>;
};

// --------------------------------------------
// Color wash — two-tone sweep used for major transitions
// --------------------------------------------
export const ColorWashLayer: React.FC<{
  progress: number; // 0..1 across the wash
  color: string;
  accent: string;
  intensity: number;
}> = ({progress, color, accent, intensity}) => {
  if (intensity <= 0.01) return null;
  const sweep = interpolate(progress, [0, 0.45, 1], [0, 30, 110], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        opacity: intensity,
        background: `linear-gradient(100deg, ${color}E6 0%, ${accent}B0 ${sweep}%, transparent ${Math.min(
          sweep + 34,
          100
        )}%)`,
        mixBlendMode: 'screen',
      }}
    />
  );
};

// --------------------------------------------
// Glitch envelope helpers (deterministic)
// --------------------------------------------

// Minor boundary flicker: hard hit for ~4 frames, decay to zero by ~9
export function flickerIntensity(localFrame: number, duration: number): number {
  if (localFrame < 0 || localFrame >= duration) return 0;
  if (localFrame <= 1) return 1;
  if (localFrame <= 3) return 0.8;
  // decays fast: readable <0.5 by frame ~5
  return interpolate(localFrame, [3, duration], [0.7, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
}

// Major transition: strong wash first frames, tint lingers, blocks clear fast
export function majorWashIntensity(
  localFrame: number,
  duration: number
): number {
  if (localFrame < 0 || localFrame >= duration) return 0;
  if (localFrame <= 2) return 1;
  return interpolate(localFrame, [2, duration], [0.95, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
}

// Heavy obscuring elements (static/tears) must clear within ~10 frames (0.4s)
export function heavyIntensity(localFrame: number, duration: number): number {
  if (localFrame < 0 || localFrame >= duration) return 0;
  if (localFrame <= 1) return 1;
  return interpolate(localFrame, [1, Math.min(9, duration)], [1, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
}

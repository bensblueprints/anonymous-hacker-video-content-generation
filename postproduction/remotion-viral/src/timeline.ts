// Deterministic timeline data for the Flipper Zero Reel.
// All boundaries in seconds (from QC of the source video, 24fps, 7103 frames).

export const FPS = 24;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const VIDEO_DURATION_SEC = 295.958333;
export const DURATION_IN_FRAMES = 7103;

// All clip boundaries (seconds) — these get the brief analog flicker.
export const CLIP_BOUNDARIES_SEC = [
  10.9, 18.38, 28.92, 40.11, 51.32, 62.63, 71.91, 80.4, 90.89, 101.9, 111.96,
  120.4, 129.18, 139.42, 150.77, 160.78, 172.18, 184.92, 193.86, 203.16, 213.18,
  224.32, 234.05, 244.14, 252.78, 261.96, 274.01, 284.08,
];

// Major topic boundaries (seconds) — more pronounced color-wash transitions
// plus animated major title labels. The final label is the ethical-use outro.
export const MAJOR_TOPICS = [
  {label: '5 — BAD USB', startSec: 40.11, color: '#ff4d4d', accent: '#ffb199'},
  {label: '4 — ACCESS CARDS', startSec: 90.89, color: '#ff9e3d', accent: '#ffd6a8'},
  {label: '3 — SUB-GHZ', startSec: 139.42, color: '#ffe14d', accent: '#fff3b0'},
  {label: '2 — WI-FI DISRUPTION', startSec: 184.92, color: '#4dff88', accent: '#b8ffd0'},
  {label: '1 — CAPTURED DATA', startSec: 234.05, color: '#4dc3ff', accent: '#b3e6ff'},
  {label: 'USE IT ETHICALLY', startSec: 274.01, color: '#b96dff', accent: '#e0c7ff'},
];

export const secToFrame = (sec: number): number => Math.round(sec * FPS);

// Clip-boundary glitch: 5-9 frames. Deterministic variation by index.
export function flickerDurationForIndex(i: number): number {
  return 5 + ((i * 7) % 5); // cycles 5,6,7,8,9
}

// Major transition: 12-18 frames. Deterministic variation by index.
export function majorDurationForIndex(i: number): number {
  return 12 + ((i * 5) % 7); // cycles 12..18
}

export interface BoundaryEffect {
  frame: number;
  type: 'flicker' | 'major';
  durationFrames: number;
  label?: string;
  color?: string;
  accent?: string;
  index: number;
}

// Build all boundary effects. Major boundaries get a color wash + title;
// non-major boundaries get just the brief glitch flicker.
export function buildBoundaryEffects(): BoundaryEffect[] {
  const majorStarts = new Map<number, (typeof MAJOR_TOPICS)[number]>();
  for (const t of MAJOR_TOPICS) {
    majorStarts.set(t.startSec, t);
  }

  const effects: BoundaryEffect[] = [];
  let flickerIdx = 0;
  let majorIdx = 0;

  for (let i = 0; i < CLIP_BOUNDARIES_SEC.length; i++) {
    const sec = CLIP_BOUNDARIES_SEC[i];
    const frame = secToFrame(sec);
    const major = majorStarts.get(sec);

    if (major) {
      effects.push({
        frame,
        type: 'major',
        durationFrames: majorDurationForIndex(majorIdx),
        label: major.label,
        color: major.color,
        accent: major.accent,
        index: majorIdx,
      });
      majorIdx++;
    } else {
      effects.push({
        frame,
        type: 'flicker',
        durationFrames: flickerDurationForIndex(flickerIdx),
        index: flickerIdx,
      });
      flickerIdx++;
    }
  }

  return effects;
}

// Opening hook: first 2 seconds (frames 0..47)
export const HOOK_DURATION_FRAMES = 2 * FPS; // 48

// CTA: starts at the last section boundary, holds until end
export const CTA_START_SEC = 284.08;
export const CTA_START_FRAME = secToFrame(CTA_START_SEC); // ~6818

// Deterministic pseudo-noise: integer hash -> [0,1)
export function hashNoise(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695040) | 0;
  h = (h ^ (h >>> 13)) | 0;
  h = Math.imul(h, 1274126177) | 0;
  h = (h ^ (h >>> 16)) | 0;
  return (h >>> 0) / 4294967296;
}

// Signed variant -> [-1, 1)
export function hashNoiseSigned(x: number, y: number, seed = 0): number {
  return hashNoise(x, y, seed) * 2 - 1;
}

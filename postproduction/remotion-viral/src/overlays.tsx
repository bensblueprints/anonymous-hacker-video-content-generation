import React from 'react';
import {AbsoluteFill, interpolate, Easing, useCurrentFrame} from 'remotion';
import {MAJOR_TOPICS, FPS, hashNoise} from './timeline';
import type {CapabilityCardData} from './capabilities';

// ============================================
// Overlays: opening hook, major title labels, CTA
// System fonts only (Helvetica / Menlo stacks) — no network media.
// ============================================

const MONO = 'Menlo, Monaco, "Courier New", monospace';
const SANS = 'Helvetica Neue, Helvetica, Arial, sans-serif';

// --------------------------------------------
// Opening hook — first 2 seconds
// Big "5 THINGS" over "FLIPPER ZERO", glitch bar sweep.
// --------------------------------------------
export const OpeningHook: React.FC = () => {
  const frame = useCurrentFrame();
  const dur = 48;

  const popIn = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const fadeOut = interpolate(frame, [dur - 10, dur - 1], [1, 0], {
    extrapolateLeft: 'clamp',
  });
  const opacity = Math.min(popIn, fadeOut);

  const barY = interpolate(frame, [0, dur], [30, 88], {
    extrapolateRight: 'clamp',
  });
  const jitter = frame < 14 ? hashNoise(frame, 0, 909) * 8 - 4 : 0;

  const slideUp = interpolate(frame, [4, 16], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        opacity,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* dark scrim so the hook is readable */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(to bottom, rgba(4,8,12,0.72) 0%, rgba(4,8,12,0.42) 40%, rgba(4,8,12,0.72) 100%)',
        }}
      />
      <div style={{transform: `translateY(${slideUp + jitter}px)`, textAlign: 'center'}}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 44,
            letterSpacing: 14,
            color: '#7ef29d',
            textShadow: '0 0 18px rgba(126,242,157,0.8)',
            marginBottom: 18,
          }}
        >
          FLIPPER ZERO
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 168,
            lineHeight: 1,
            color: '#ffffff',
            textShadow: '6px 0 0 rgba(255,60,60,0.55), -6px 0 0 rgba(60,200,255,0.55)',
            letterSpacing: -2,
          }}
        >
          5 THINGS
        </div>
        <div
          style={{
            marginTop: 26,
            fontFamily: MONO,
            fontSize: 34,
            letterSpacing: 6,
            color: '#cfd8dc',
          }}
        >
          YOU SHOULD NEVER DO
        </div>
      </div>
      {/* sweeping glitch bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${barY}%`,
          height: 26,
          background:
            'linear-gradient(90deg, transparent, rgba(126,242,157,0.5) 30%, rgba(255,255,255,0.75) 50%, rgba(126,242,157,0.5) 70%, transparent)',
          mixBlendMode: 'screen',
        }}
      />
    </AbsoluteFill>
  );
};

// --------------------------------------------
// Major title label — slides in with the major transition, holds ~2.2s
// --------------------------------------------
export const MajorTitleLabel: React.FC<{
  label: string;
  color: string;
  accent: string;
  startFrame: number;
  index: number;
}> = ({label, color, accent, startFrame, index}) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  const hold = Math.round(2.4 * FPS); // visible ~2.4s
  if (local < 0 || local > hold) return null;

  const slideIn = interpolate(local, [0, 12], [-80, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const fadeIn = interpolate(local, [0, 6], [0, 1], {extrapolateRight: 'clamp'});
  const fadeOut = interpolate(local, [hold - 10, hold], [1, 0], {
    extrapolateLeft: 'clamp',
  });
  const opacity = Math.min(fadeIn, fadeOut);
  const letterJitter =
    local < 8 ? hashNoise(local, index, 777) * 5 - 2.5 : 0;
  const verticalOffset = index === 5 ? 300 : -320;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          transform: `translateY(${verticalOffset}px) translateX(${slideIn + letterJitter}px)`,
          opacity,
          textAlign: 'center',
          padding: '26px 54px',
          background: 'rgba(6,10,14,0.78)',
          border: `3px solid ${color}`,
          borderLeft: `14px solid ${color}`,
          borderRadius: 6,
          boxShadow: `0 0 40px ${color}66`,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 26,
            letterSpacing: 10,
            color: accent,
            marginBottom: 6,
          }}
        >
          {index < 5 ? `/// ${5 - index}` : '/// FINAL RULE'}
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 74,
            lineHeight: 1.05,
            color: '#ffffff',
            textShadow: `4px 0 0 ${color}AA, -3px 0 0 ${accent}66`,
          }}
        >
          {label}
        </div>
        {/* animated underline */}
        <div style={{marginTop: 14, height: 8, background: 'rgba(255,255,255,0.12)'}}>
          <div
            style={{
              height: '100%',
              background: color,
              width: `${interpolate(local, [2, 16], [0, 100], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.out(Easing.cubic),
              })}%`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --------------------------------------------
// End CTA — last section, lower-third accent
// --------------------------------------------
export const EndCta: React.FC<{startFrame: number}> = ({startFrame}) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  if (local < 0) return null;

  const popIn = interpolate(local, [0, 14], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back ? Easing.back(1.4) : Easing.cubic),
  });
  const pulse = 0.85 + 0.15 * Math.sin(local / 6);
  const endFade = interpolate(frame, [7060, 7103], [1, 0.85], {
    extrapolateLeft: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 210,
      }}
    >
      <div
        style={{
          opacity: Math.min(popIn, endFade),
          textAlign: 'center',
          transform: `scale(${Math.min(popIn, 1) * pulse})`,
        }}
      >
        <div
          style={{
            display: 'inline-block',
            fontFamily: MONO,
            fontSize: 40,
            letterSpacing: 8,
            fontWeight: 700,
            color: '#0a0e12',
            background: '#7ef29d',
            padding: '20px 44px',
            borderRadius: 999,
            boxShadow: '0 0 34px rgba(126,242,157,0.55)',
          }}
        >
          FOLLOW FOR MORE
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: MONO,
            fontSize: 26,
            letterSpacing: 4,
            color: '#cfd8dc',
            textShadow: '0 0 12px rgba(0,0,0,0.9)',
          }}
        >
          FLIPPER ZERO · USE IT ETHICALLY
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --------------------------------------------
// Narration-synchronized presentation card.
// Concise capability/risk/safe-lab summaries, not subtitles.
// --------------------------------------------
export const CapabilityCard: React.FC<{
  card: CapabilityCardData;
  index: number;
  total: number;
}> = ({card, index, total}) => {
  const frame = useCurrentFrame();
  const startFrame = Math.round(card.startSec * FPS);
  const endFrame = Math.round(card.endSec * FPS);
  const local = frame - startFrame;
  const duration = endFrame - startFrame;
  if (local < 0 || local >= duration) return null;

  const enter = interpolate(local, [0, 9], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.25)),
  });
  const fadeOut = interpolate(local, [Math.max(10, duration - 8), duration], [1, 0], {
    extrapolateLeft: 'clamp',
  });
  const opacity = Math.min(enter, fadeOut);
  const slideDirection = card.position === 'lower' ? 1 : -1;
  const translateY = (1 - enter) * 54 * slideDirection;
  const headlineSize = card.headline.length > 38 ? 55 : card.headline.length > 28 ? 62 : 72;
  const justifyContent =
    card.position === 'upper' ? 'flex-start' : card.position === 'lower' ? 'flex-end' : 'center';

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        alignItems: 'center',
        justifyContent,
        padding: '220px 68px 285px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 944,
          opacity,
          transform: `translateY(${translateY}px) scale(${0.94 + enter * 0.06})`,
          background: 'linear-gradient(135deg, rgba(5,10,15,0.93), rgba(10,17,24,0.83))',
          border: `2px solid ${card.accent}99`,
          borderLeft: `14px solid ${card.accent}`,
          borderRadius: 16,
          padding: '30px 40px 28px',
          boxShadow: `0 18px 58px rgba(0,0,0,0.65), 0 0 34px ${card.accent}44`,
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14}}>
          <div
            style={{
              fontFamily: MONO,
              fontWeight: 800,
              fontSize: 25,
              lineHeight: 1,
              letterSpacing: 5,
              color: card.accent,
            }}
          >
            {card.kicker}
          </div>
          <div style={{fontFamily: MONO, fontSize: 21, color: '#9fb0bc', letterSpacing: 2}}>
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </div>
        </div>

        <div
          style={{
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: headlineSize,
            lineHeight: 1.02,
            letterSpacing: -1.2,
            color: '#fff',
            textShadow: '0 4px 18px rgba(0,0,0,0.9)',
          }}
        >
          {card.headline}
        </div>

        {card.bullets?.length ? (
          <div style={{marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10}}>
            {card.bullets.map((bullet, bulletIndex) => {
              const revealAt = 12 + bulletIndex * 14;
              const bulletIn = interpolate(local, [revealAt, revealAt + 7], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.out(Easing.cubic),
              });
              return (
                <div
                  key={bullet}
                  style={{
                    display: 'flex',
                    gap: 15,
                    alignItems: 'center',
                    opacity: bulletIn,
                    transform: `translateX(${(1 - bulletIn) * 30}px)`,
                    fontFamily: SANS,
                    fontWeight: 700,
                    fontSize: 32,
                    lineHeight: 1.12,
                    color: '#e7edf1',
                  }}
                >
                  <span style={{color: card.accent, fontFamily: MONO, fontSize: 28}}>▸</span>
                  <span>{bullet}</span>
                </div>
              );
            })}
          </div>
        ) : null}

        <div style={{height: 5, background: 'rgba(255,255,255,0.12)', marginTop: 23, overflow: 'hidden'}}>
          <div
            style={{
              height: '100%',
              width: `${((index + 1) / total) * 100}%`,
              background: card.accent,
              boxShadow: `0 0 14px ${card.accent}`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --------------------------------------------
// Hook title used at the very top: which topic index text for label rows
// --------------------------------------------
export const topicLabelCount = MAJOR_TOPICS.length;

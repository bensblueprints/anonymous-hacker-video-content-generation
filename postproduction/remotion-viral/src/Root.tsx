import React from 'react';
import {Composition, staticFile} from 'remotion';
import {FPS, WIDTH, HEIGHT, DURATION_IN_FRAMES} from './timeline';
import {MAJOR_TOPICS, CLIP_BOUNDARIES_SEC} from './timeline';
import {FlipperZeroReel} from './FlipperZeroReel';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="FlipperZeroReel"
        component={FlipperZeroReel}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          videoSrc: staticFile('source.mp4'),
        }}
      />
      <Composition
        id="TimelineManifest"
        component={TimelineManifestCard}
        durationInFrames={1}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};

const TimelineManifestCard: React.FC = () => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0a0e12',
        color: '#7ef29d',
        fontFamily: 'Menlo, monospace',
        padding: 80,
        fontSize: 28,
        lineHeight: 1.5,
        overflow: 'hidden',
      }}
    >
      <div>Flipper Zero Reel — VFX Timeline</div>
      <div style={{color: '#fff'}}>{DURATION_IN_FRAMES} frames @ {FPS} fps</div>
      <div style={{marginTop: 24}}>Major topics:</div>
      {MAJOR_TOPICS.map((t) => (
        <div key={t.label} style={{color: '#cfd8dc'}}>
          {t.label} @ {t.startSec.toFixed(2)}s → frame {Math.round(t.startSec * FPS)}
        </div>
      ))}
      <div style={{marginTop: 24, color: '#8b9bb4'}}>
        {CLIP_BOUNDARIES_SEC.length} clip boundaries · manifest: transition_manifest.json
      </div>
    </div>
  );
};

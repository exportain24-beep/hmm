'use client';

import {Player} from '@remotion/player';
import {useMemo, useState} from 'react';
import {estimateTimeline} from '../../../src/shared/estimate';
import type {ContentSpec} from '../../../src/shared/types';
import {HeyMarinerVideo} from '../../../src/video/HeyMarinerVideo';

export const Preview = ({specs}: {specs: ContentSpec[]}) => {
  const [id, setId] = useState(specs[0]?.id ?? '');
  const spec = specs.find((s) => s.id === id) ?? specs[0];
  const timeline = useMemo(() => (spec ? estimateTimeline(spec) : null), [spec]);
  if (!spec || !timeline) return <p>No specs found in content/bank or content/queue.</p>;
  return (
    <div style={{display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap'}}>
      <div style={{width: 320}}>
        {specs.map((s) => (
          <button key={s.id} onClick={() => setId(s.id)} style={{display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', border: '1px solid #24476F', background: s.id === id ? '#14B8A6' : '#102A4C', color: s.id === id ? '#061223' : '#fff'}}>
            <div style={{fontWeight: 700, fontSize: 14}}>{s.title}</div>
            <div style={{fontSize: 12, opacity: 0.8}}>{s.template} · {s.pillar}</div>
          </button>
        ))}
      </div>
      <Player
        key={spec.id}
        component={HeyMarinerVideo}
        inputProps={{spec, timeline, logo: null}}
        durationInFrames={Math.round(timeline.totalSeconds * timeline.fps)}
        fps={timeline.fps}
        compositionWidth={timeline.width}
        compositionHeight={timeline.height}
        controls
        style={{height: '86vh', aspectRatio: `${timeline.width} / ${timeline.height}`, borderRadius: 16, overflow: 'hidden'}}
      />
    </div>
  );
};

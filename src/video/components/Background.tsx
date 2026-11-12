import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {C} from '../theme';

/** Navy chart-table backdrop: gradient, drifting chart grid, slow glow and a swell line. Never flat, never black. */
export const Background: React.FC<{accent: string}> = ({accent}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const t = frame / fps;
  const drift = (t * 6) % 120;
  const gx = 50 + 18 * Math.sin(t * 0.22);
  const gy = 28 + 10 * Math.cos(t * 0.17);
  const wave = (yBase: number, amp: number, phase: number) => {
    let d = `M 0 ${yBase}`;
    for (let x = 0; x <= width; x += 40) d += ` L ${x} ${yBase + amp * Math.sin(x / 170 + t * 0.9 + phase) + amp * 0.5 * Math.sin(x / 67 - t * 0.6 + phase)}`;
    return d + ` L ${width} ${height} L 0 ${height} Z`;
  };
  return (
    <AbsoluteFill style={{background: `linear-gradient(165deg, ${C.panel} 0%, ${C.navy} 42%, ${C.deep} 100%)`}}>
      <AbsoluteFill style={{background: `radial-gradient(60% 38% at ${gx}% ${gy}%, ${accent}2E 0%, transparent 70%)`}} />
      <svg width={width} height={height} style={{position: 'absolute', opacity: 0.11}}>
        <defs>
          <pattern id="grid" width="120" height="120" patternUnits="userSpaceOnUse" patternTransform={`translate(${-drift} ${drift * 0.5})`}>
            <path d="M 120 0 L 0 0 0 120" fill="none" stroke={C.mist} strokeWidth="1.5" />
            <path d="M 60 0 L 60 120 M 0 60 L 120 60" fill="none" stroke={C.mist} strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />
      </svg>
      <svg width={width} height={height} style={{position: 'absolute'}}>
        <path d={wave(height * 0.9, 14, 0)} fill={accent} opacity={0.07} />
        <path d={wave(height * 0.935, 10, 2)} fill={C.white} opacity={0.045} />
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(3,9,20,0.55) 100%)'}} />
    </AbsoluteFill>
  );
};

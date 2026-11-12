import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {TEMPLATES} from '../shared/templates';
import type {VideoProps} from '../shared/types';
import {Background} from './components/Background';
import {Logo, Mark} from './components/Logo';
import {accentOf, C, fit, FONT_HEAD} from './theme';

/** Strong visual + short headline + brand. Never the whole script. */
export const Thumbnail: React.FC<VideoProps> = ({spec, logo}) => {
  const {width, height} = useVideoConfig();
  const accent = accentOf(spec.template);
  const vertical = height > width;
  const u = Math.min(width, height) / 1080;
  const badge = spec.series ? spec.series.toUpperCase() : TEMPLATES[spec.template]?.badge ?? '';
  const words = spec.thumbnailText.split(/\s+/);
  return (
    <AbsoluteFill>
      <Background accent={accent} />
      <div style={{position: 'absolute', right: -180 * u, bottom: vertical ? 260 * u : -260 * u, opacity: 0.16, transform: 'rotate(18deg)'}}>
        <Mark size={1000 * u} accent={accent} />
      </div>
      <div style={{position: 'absolute', left: 70 * u, right: 70 * u, top: vertical ? 420 * u : 70 * u, bottom: vertical ? 520 * u : 70 * u, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
        <div style={{alignSelf: 'flex-start', background: accent, color: C.deep, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 44 * u, letterSpacing: 3, padding: `${14 * u}px ${30 * u}px`, borderRadius: 16 * u}}>{badge}</div>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fit(spec.thumbnailText, vertical ? 190 : 210, 12, 0.5) * u, lineHeight: 1.0, letterSpacing: -4, color: C.white, textShadow: '0 12px 40px rgba(0,0,0,0.5)'}}>
          {words.map((w, i) => (
            <span key={i} style={{color: i === words.length - 1 || /\d/.test(w) ? accent : C.white}}>{w} </span>
          ))}
        </div>
        <Logo height={96 * u} logo={logo} accent={accent} />
      </div>
    </AbsoluteFill>
  );
};

import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {layoutFor, type Layout} from '../../shared/layout';
import type {ContentSpec, SceneSpec, SceneTiming} from '../../shared/types';
import {MotifArt, pickMotif} from './Motifs';
import {C, enter, fit, FONT_BODY, FONT_HEAD} from '../theme';

export type SceneProps = {spec: ContentSpec; scene: SceneSpec; timing: SceneTiming; accent: string; logo: string | null};

export const useScene = (timing: SceneTiming) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const L = layoutFor(width, height);
  const seconds = timing.end - timing.start;
  const t = frame / fps;
  // every scene fades/slides in and eases out, so cuts are never hard
  const inA = enter(frame, fps, 0, 0.35);
  const outA = 1 - enter(frame, fps, seconds - 0.22, 0.2);
  return {frame, fps, t, seconds, L, width, height, inA, outA, vis: inA * outA};
};

/** Kicker label + heading block used by most scenes. */
export const Title: React.FC<{scene: SceneSpec; accent: string; L: Layout; frame: number; fps: number; size?: number; align?: 'left' | 'center'}> = ({scene, accent, L, frame, fps, size = 78, align = 'left'}) => {
  const a = enter(frame, fps, 0.05, 0.45);
  const b = enter(frame, fps, 0.16, 0.5);
  const heading = scene.heading ?? '';
  return (
    <div style={{position: 'absolute', left: L.title.x, top: L.title.y, width: L.title.w, height: L.title.h, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: align === 'center' ? 'center' : 'flex-start', textAlign: align}}>
      {scene.label ? (
        <div style={{display: 'flex', alignItems: 'center', gap: 14 * L.u, opacity: a, transform: `translateX(${(1 - a) * -30}px)`, marginBottom: 14 * L.u}}>
          <div style={{width: 44 * L.u * a, height: 6 * L.u, background: accent, borderRadius: 3}} />
          <div style={{fontFamily: FONT_HEAD, fontWeight: 600, fontSize: 34 * L.u, letterSpacing: 3, color: accent}}>{scene.label}</div>
        </div>
      ) : null}
      <div style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: fit(heading, size, 30) * L.u, lineHeight: 1.1, color: C.white, letterSpacing: -1, opacity: b, transform: `translateY(${(1 - b) * 26}px)`}}>
        {heading}
      </div>
    </div>
  );
};

export const Card: React.FC<{children: React.ReactNode; accent?: string; style?: React.CSSProperties; L: Layout}> = ({children, accent, style, L}) => (
  <div style={{background: 'linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.045))', border: `2px solid ${C.white}24`, borderLeft: accent ? `${8 * L.u}px solid ${accent}` : undefined, borderRadius: 28 * L.u, padding: `${34 * L.u}px ${38 * L.u}px`, boxShadow: '0 24px 60px rgba(0,0,0,0.35)', ...style}}>
    {children}
  </div>
);

export const bodyStyle = (L: Layout, size = 48): React.CSSProperties => ({fontFamily: FONT_BODY, fontWeight: 500, fontSize: size * L.u, lineHeight: 1.36, color: C.white});
export const Content: React.FC<{L: Layout; children: React.ReactNode; justify?: 'flex-start' | 'center'}> = ({L, children, justify = 'flex-start'}) => (
  <div style={{position: 'absolute', left: L.content.x, top: L.content.y, width: L.content.w, height: L.content.h, display: 'flex', flexDirection: 'column', justifyContent: justify, gap: 22 * L.u}}>{children}</div>
);

/** Framed animation stage (same frame as the 3D scenes). Text for the scene is laid over it, never on a still background. */
export const Stage2D: React.FC<{spec: ContentSpec; scene: SceneSpec; L: Layout; t: number; seconds: number; accent: string; dim?: number; children?: React.ReactNode}> = ({spec, scene, L, t, seconds, accent, dim = 0, children}) => (
  <div style={{position: 'absolute', left: L.panel.x, top: L.panel.y, width: L.panel.w, height: L.panel.h, borderRadius: 34 * L.u, overflow: 'hidden', background: '#020812', border: `3px solid ${C.white}2E`, boxShadow: '0 30px 80px rgba(0,0,0,0.5)'}}>
    <MotifArt motif={pickMotif(spec, scene)} t={t} seconds={seconds} accent={accent} id={scene.id} width={L.panel.w} height={L.panel.h} dim={dim} />
    <div style={{position: 'absolute', inset: 0}}>{children}</div>
  </div>
);

/** Full-frame animation behind hook, term, takeaway and end card. */
export const FullBleed: React.FC<{spec: ContentSpec; scene: SceneSpec; t: number; seconds: number; accent: string; width: number; height: number; dim?: number}> = ({spec, scene, t, seconds, accent, width, height, dim = 0.45}) => (
  <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
    <MotifArt motif={pickMotif(spec, scene)} t={t} seconds={seconds} accent={accent} id={`${scene.id}full`} width={width} height={height} dim={dim} />
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(4,14,30,0.82) 0%, rgba(4,14,30,0.12) 26%, rgba(4,14,30,0.10) 58%, rgba(4,14,30,0.92) 86%)'}} />
  </div>
);

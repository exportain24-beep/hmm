// Animation-led scenes: a moving maritime illustration carries every scene; text is short and sits on top of it.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Logo, Mark} from '../components/Logo';
import {FullBleed, Stage2D, Title, useScene, type SceneProps} from '../components/SceneShell';
import {BRAND, C, clamp01, cueAt, enter, fit, FONT_BODY, FONT_HEAD, SOCIAL} from '../theme';

const Wrap: React.FC<{vis: number; children: React.ReactNode}> = ({vis, children}) => <AbsoluteFill style={{opacity: vis}}>{children}</AbsoluteFill>;
const shadow = '0 4px 24px rgba(2,8,20,0.85), 0 1px 3px rgba(2,8,20,0.9)';

export const HookScene: React.FC<SceneProps> = ({spec, scene, timing, accent}) => {
  const {frame, fps, t, L, vis, seconds, width, height} = useScene(timing);
  const words = (scene.heading ?? '').split(/\s+/);
  const size = fit(scene.heading ?? '', L.vertical ? 116 : 100, 30, 0.6) * L.u;
  const spread = Math.min(0.16, Math.max(0.07, (seconds * 0.35) / words.length));
  const k = enter(frame, fps, 0, 0.4);
  return (
    <Wrap vis={vis}>
      <FullBleed spec={spec} scene={scene} t={t} seconds={seconds} accent={accent} width={width} height={height} dim={0.28} />
      <div style={{position: 'absolute', left: L.margin, top: L.title.y + 10 * L.u, width: width - 2 * L.margin}}>
        {scene.label ? <div style={{fontFamily: FONT_HEAD, fontWeight: 600, fontSize: 34 * L.u, letterSpacing: 4, color: accent, marginBottom: 20 * L.u, opacity: k, transform: `translateX(${(1 - k) * -30}px)`, textShadow: shadow}}>{scene.label}</div> : null}
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: size, lineHeight: 1.06, letterSpacing: -2, color: C.white, textShadow: shadow}}>
          {words.map((w, i) => {
            const a = enter(frame, fps, 0.08 + i * spread, 0.34);
            const emph = /\d/.test(w) || i === words.length - 1;
            return <span key={i} style={{display: 'inline-block', marginRight: size * 0.24, opacity: a, transform: `translateY(${(1 - a) * 46}px) scale(${0.9 + 0.1 * a})`, color: emph ? accent : C.white}}>{w}</span>;
          })}
        </div>
        <div style={{height: 10 * L.u, width: `${enter(frame, fps, 0.3 + words.length * spread, 0.6) * 46}%`, background: accent, borderRadius: 6, marginTop: 30 * L.u}} />
      </div>
    </Wrap>
  );
};

export const TermScene: React.FC<SceneProps> = ({spec, scene, timing, accent}) => {
  const {frame, fps, t, L, vis, width, height, seconds} = useScene(timing);
  const term = scene.heading ?? '';
  const size = fit(term, L.vertical ? 220 : 190, 6, 0.4) * L.u;
  const b = enter(frame, fps, 0.55, 0.5);
  return (
    <Wrap vis={vis}>
      <FullBleed spec={spec} scene={scene} t={t} seconds={seconds} accent={accent} width={width} height={height} dim={0.3} />
      <div style={{position: 'absolute', left: L.margin, top: L.title.y + 20 * L.u, width: width - 2 * L.margin, textAlign: 'center'}}>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: size, letterSpacing: -3, lineHeight: 1.1, color: C.white, whiteSpace: 'nowrap', textShadow: shadow}}>
          {term.split('').map((ch, i) => {
            const a = enter(frame, fps, 0.1 + i * 0.045, 0.4);
            return <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', opacity: a, transform: `translateY(${(1 - a) * 70 + Math.sin(t * 1.6 + i * 0.6) * 4}px)`}}>{ch}</span>;
          })}
        </div>
        <div style={{width: `${enter(frame, fps, 0.4, 0.6) * 30}%`, height: 8 * L.u, background: accent, borderRadius: 5, margin: `${18 * L.u}px auto 0`}} />
        {scene.body ? (
          <div style={{display: 'inline-block', marginTop: 34 * L.u, background: 'rgba(4,14,30,0.78)', border: `2px solid ${accent}`, borderRadius: 22 * L.u, padding: `${16 * L.u}px ${30 * L.u}px`, fontFamily: FONT_HEAD, fontWeight: 600, fontSize: fit(scene.body, 46, 34, 0.62) * L.u, lineHeight: 1.25, color: C.white, opacity: b, transform: `translateY(${(1 - b) * 30}px)`, maxWidth: width - 2 * L.margin}}>{scene.body}</div>
        ) : null}
      </div>
    </Wrap>
  );
};

const QaTitle: React.FC<SceneProps & {frame: number; fps: number; L: ReturnType<typeof useScene>['L']}> = ({scene, accent, frame, fps, L}) => (
  <div style={{position: 'absolute', left: L.title.x, top: L.title.y, width: L.title.w, height: L.title.h, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
    <div style={{alignSelf: 'flex-start', background: accent, color: C.deep, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fit(scene.label ?? '', 54, 16) * L.u, letterSpacing: 1, padding: `${12 * L.u}px ${26 * L.u}px`, borderRadius: 14 * L.u, transform: `scale(${0.7 + 0.3 * enter(frame, fps, 0, 0.35)})`, transformOrigin: 'left center', opacity: enter(frame, fps, 0, 0.3)}}>{scene.label}</div>
    <div style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: fit(scene.heading ?? '', 72, 30) * L.u, lineHeight: 1.12, color: C.white, marginTop: 22 * L.u, opacity: enter(frame, fps, 0.25, 0.45), transform: `translateY(${(1 - enter(frame, fps, 0.25, 0.45)) * 24}px)`}}>{scene.heading}</div>
  </div>
);

/** statement + qa: heading on top, the animation tells the rest. No paragraph on screen. */
export const StatementScene: React.FC<SceneProps> = (props) => {
  const {spec, scene, timing, accent} = props;
  const {frame, fps, t, L, vis, seconds} = useScene(timing);
  return (
    <Wrap vis={vis}>
      {scene.kind === 'qa' ? <QaTitle {...props} frame={frame} fps={fps} L={L} /> : <Title scene={scene} accent={accent} L={L} frame={frame} fps={fps} />}
      <Stage2D spec={spec} scene={scene} L={L} t={t} seconds={seconds} accent={accent} />
    </Wrap>
  );
};

/** bullets + checklist: short chips rise over the animation exactly when each point is spoken. */
export const BulletsScene: React.FC<SceneProps> = ({spec, scene, timing, accent}) => {
  const {frame, fps, t, L, vis, seconds} = useScene(timing);
  const items = scene.items ?? [];
  const check = scene.kind === 'checklist';
  return (
    <Wrap vis={vis}>
      <Title scene={scene} accent={accent} L={L} frame={frame} fps={fps} />
      <Stage2D spec={spec} scene={scene} L={L} t={t} seconds={seconds} accent={accent}>
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(4,14,30,0) 20%, rgba(4,14,30,0.78) 75%)'}} />
        <div style={{position: 'absolute', left: 26 * L.u, right: 26 * L.u, bottom: 26 * L.u, display: 'flex', flexDirection: 'column', gap: 14 * L.u}}>
          {items.map((it, i) => {
            const at = cueAt(timing.cueTimes, i, items.length, seconds);
            const a = enter(frame, fps, at, 0.4);
            const tick = enter(frame, fps, at + 0.12, 0.3);
            const glow = 1 - enter(frame, fps, at + 0.3, 0.9);
            return (
              <div key={i} style={{opacity: a, transform: `translateX(${(1 - a) * -80}px) scale(${1 + 0.03 * glow})`, transformOrigin: 'left center', display: 'flex', alignItems: 'center', gap: 20 * L.u, background: 'rgba(6,18,35,0.86)', border: `3px solid ${glow > 0.05 ? accent : `${C.white}30`}`, borderRadius: 22 * L.u, padding: `${14 * L.u}px ${20 * L.u}px`}}>
                <div style={{flex: 'none', width: 62 * L.u, height: 62 * L.u, borderRadius: check ? 16 * L.u : 31 * L.u, background: check ? (tick > 0.5 ? accent : 'transparent') : accent, border: `4px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 34 * L.u, color: C.deep}}>
                  {check ? <svg width={36 * L.u} height={36 * L.u} viewBox="0 0 24 24"><path d="M4 12.5 L10 18 L20 6" fill="none" stroke={C.deep} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="26" strokeDashoffset={26 * (1 - tick)} /></svg> : i + 1}
                </div>
                <div style={{fontFamily: FONT_HEAD, fontWeight: 600, fontSize: fit(it.title, 44, 30, 0.72) * L.u, color: C.white, lineHeight: 1.15}}>{it.title}</div>
              </div>
            );
          })}
        </div>
      </Stage2D>
    </Wrap>
  );
};

export const CompareScene: React.FC<SceneProps> = ({spec, scene, timing, accent}) => {
  const {frame, fps, t, L, vis, seconds} = useScene(timing);
  const items = scene.items ?? [];
  return (
    <Wrap vis={vis}>
      <Title scene={scene} accent={accent} L={L} frame={frame} fps={fps} />
      <Stage2D spec={spec} scene={scene} L={L} t={t} seconds={seconds} accent={accent} dim={0.55}>
        <div style={{position: 'absolute', inset: 26 * L.u, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 * L.u}}>
          {items.map((it, i) => {
            const at = timing.cueTimes[i] !== undefined ? timing.cueTimes[i] : 0.5 + i * Math.min(0.55, (seconds - 2) / items.length);
            const a = enter(frame, fps, at, 0.4);
            const warn = i >= items.length - 2;
            const bar = enter(frame, fps, at + 0.15, 0.7);
            return (
              <div key={i} style={{position: 'relative', overflow: 'hidden', opacity: a, transform: `translateX(${(1 - a) * 60}px)`, display: 'flex', alignItems: 'center', gap: 22 * L.u, background: 'rgba(6,18,35,0.82)', border: `2px solid ${C.white}26`, borderRadius: 22 * L.u, padding: `${20 * L.u}px ${24 * L.u}px`}}>
                <div style={{position: 'absolute', left: 0, bottom: 0, height: 6 * L.u, width: `${bar * (30 + (70 * (i + 1)) / items.length)}%`, background: warn ? C.amber : accent}} />
                <div style={{flex: 'none', minWidth: 112 * L.u, textAlign: 'center', fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fit(it.title, 54, 4, 0.5) * L.u, color: C.deep, background: warn ? C.amber : accent, borderRadius: 16 * L.u, padding: `${6 * L.u}px ${16 * L.u}px`}}>{it.title}</div>
                <div style={{flex: 1, fontFamily: FONT_BODY, fontWeight: 500, fontSize: 34 * L.u, color: C.mist}}>{it.text}</div>
                <div style={{flex: 'none', fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 54 * L.u, color: warn ? C.amber : C.white}}>{it.value}</div>
              </div>
            );
          })}
        </div>
      </Stage2D>
    </Wrap>
  );
};

export const StatScene: React.FC<SceneProps> = ({spec, scene, timing, accent}) => {
  const {frame, fps, L, vis, t, seconds} = useScene(timing);
  const it = scene.items?.[0];
  const raw = it?.value ?? '';
  const m = raw.match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/);
  const p = enter(frame, fps, 0.3, 1.1);
  const shown = m ? `${m[1]}${(Number(m[2]) * p).toFixed(m[2].includes('.') ? m[2].split('.')[1].length : 0)}${m[3]}` : raw;
  const R = 230 * L.u;
  return (
    <Wrap vis={vis}>
      <Title scene={scene} accent={accent} L={L} frame={frame} fps={fps} />
      <Stage2D spec={spec} scene={scene} L={L} t={t} seconds={seconds} accent={accent} dim={0.25}>
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{position: 'relative', width: 2 * R, height: 2 * R, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <svg width={2 * R} height={2 * R} style={{position: 'absolute', transform: `rotate(${-90 + t * 14}deg)`}}>
              <circle cx={R} cy={R} r={R - 18} fill="rgba(4,14,30,0.82)" stroke={`${C.white}30`} strokeWidth={14} />
              <circle cx={R} cy={R} r={R - 18} fill="none" stroke={accent} strokeWidth={14} strokeLinecap="round" strokeDasharray={2 * Math.PI * (R - 18)} strokeDashoffset={2 * Math.PI * (R - 18) * (1 - p * 0.86)} />
            </svg>
            <div style={{textAlign: 'center', transform: `scale(${1 + 0.02 * Math.sin(t * 3)})`}}>
              <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fit(raw, 180, 4, 0.5) * L.u, color: C.white, lineHeight: 1}}>{shown}</div>
              <div style={{fontFamily: FONT_BODY, fontWeight: 600, fontSize: 38 * L.u, color: accent, marginTop: 10 * L.u}}>{it?.title}</div>
            </div>
          </div>
        </div>
      </Stage2D>
    </Wrap>
  );
};

export const TimelineScene: React.FC<SceneProps> = ({spec, scene, timing, accent}) => {
  const {frame, fps, t, L, vis, seconds} = useScene(timing);
  const items = scene.items ?? [];
  const gap = Math.min(290, 660 / Math.max(1, items.length)) * L.u;
  const lastAt = cueAt(timing.cueTimes, items.length - 1, items.length, seconds);
  return (
    <Wrap vis={vis}>
      <Title scene={scene} accent={accent} L={L} frame={frame} fps={fps} />
      <Stage2D spec={spec} scene={scene} L={L} t={t} seconds={seconds} accent={accent} dim={0.5}>
        <div style={{position: 'absolute', left: 50 * L.u, right: 30 * L.u, top: 70 * L.u, height: gap * items.length}}>
          <div style={{position: 'absolute', left: 26 * L.u, top: 30 * L.u, width: 8 * L.u, borderRadius: 4, background: `${C.white}33`, height: gap * (items.length - 1)}} />
          <div style={{position: 'absolute', left: 26 * L.u, top: 30 * L.u, width: 8 * L.u, borderRadius: 4, background: accent, height: gap * (items.length - 1) * clamp01(enter(frame, fps, 0.4, Math.max(0.6, lastAt)))}} />
          {items.map((it, i) => {
            const a = enter(frame, fps, cueAt(timing.cueTimes, i, items.length, seconds), 0.45);
            const pulse = (t * 0.8) % 1;
            return (
              <div key={i} style={{position: 'absolute', top: i * gap, left: 0, right: 0, display: 'flex', gap: 34 * L.u, alignItems: 'flex-start', opacity: 0.25 + 0.75 * a}}>
                <div style={{flex: 'none', position: 'relative', width: 60 * L.u, height: 60 * L.u}}>
                  {a > 0.5 ? <div style={{position: 'absolute', inset: -pulse * 30 * L.u, borderRadius: 200, border: `4px solid ${accent}`, opacity: 1 - pulse}} /> : null}
                  <div style={{position: 'absolute', inset: 0, borderRadius: 30 * L.u, background: a > 0.5 ? accent : C.navy, border: `6px solid ${accent}`, transform: `scale(${0.7 + 0.3 * a})`}} />
                </div>
                <div style={{transform: `translateX(${(1 - a) * 40}px)`}}>
                  <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 70 * L.u, color: accent, lineHeight: 1, textShadow: shadow}}>{it.value}</div>
                  <div style={{fontFamily: FONT_HEAD, fontWeight: 600, fontSize: fit(it.title, 44, 30, 0.75) * L.u, color: C.white, marginTop: 10 * L.u, lineHeight: 1.2, textShadow: shadow}}>{it.title}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Stage2D>
    </Wrap>
  );
};

export const TakeawayScene: React.FC<SceneProps> = ({spec, scene, timing, accent}) => {
  const {frame, fps, t, L, vis, width, height, seconds} = useScene(timing);
  const a = enter(frame, fps, 0.1, 0.5);
  const w = width - 2 * L.margin;
  const h = (L.vertical ? 520 : 400) * L.u;
  const top = L.title.y + 20 * L.u;
  const per = 2 * (w + h);
  return (
    <Wrap vis={vis}>
      <FullBleed spec={spec} scene={scene} t={t} seconds={seconds} accent={accent} width={width} height={height} dim={0.22} />
      <div style={{position: 'absolute', left: L.margin, top, width: w, height: h, transform: `scale(${0.92 + 0.08 * a})`, opacity: a}}>
        <svg width={w} height={h} style={{position: 'absolute'}}>
          <rect x={4} y={4} width={w - 8} height={h - 8} rx={36 * L.u} fill="rgba(4,14,30,0.80)" stroke={`${C.white}30`} strokeWidth={3} />
          <rect x={4} y={4} width={w - 8} height={h - 8} rx={36 * L.u} fill="none" stroke={accent} strokeWidth={7} strokeDasharray={`${per * 0.22} ${per}`} strokeDashoffset={-((t * 0.16) % 1) * per} strokeLinecap="round" />
        </svg>
        <div style={{position: 'absolute', inset: 0, padding: 50 * L.u, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
          <div style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 34 * L.u, letterSpacing: 4, color: accent}}>{scene.label ?? 'KEY TAKEAWAY'}</div>
          <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fit(scene.heading ?? '', 88, 28, 0.6) * L.u, lineHeight: 1.1, letterSpacing: -1.5, color: C.white, marginTop: 20 * L.u}}>{scene.heading}</div>
        </div>
      </div>
    </Wrap>
  );
};

export const EndCardScene: React.FC<SceneProps> = ({spec, scene, timing, accent, logo}) => {
  const {frame, fps, t, L, inA, width, height, seconds} = useScene(timing);
  const a = enter(frame, fps, 0.05, 0.6);
  const b = enter(frame, fps, 0.5, 0.5);
  const c = enter(frame, fps, 0.8, 0.5);
  const cy = height * (L.vertical ? 0.3 : 0.4);
  return (
    <AbsoluteFill style={{opacity: inA}}>
      <FullBleed spec={spec} scene={{...scene, motif: 'voyage'}} t={t + 20} seconds={seconds} accent={accent} width={width} height={height} dim={0.18} />
      <div style={{position: 'absolute', left: 0, right: 0, top: cy - 150 * L.u, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30 * L.u}}>
        <div style={{transform: `scale(${0.6 + 0.4 * a}) translateY(${(1 - a) * 40}px)`, opacity: a}}>
          {logo ? <Logo height={260 * L.u} logo={logo} accent={accent} /> : <Mark size={210 * L.u} accent={accent} />}
        </div>
        {logo ? null : <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 112 * L.u, letterSpacing: -3, color: C.white, opacity: b, lineHeight: 1, textShadow: shadow}}>Hey<span style={{color: accent}}>Mariner</span></div>}
        <div style={{fontFamily: FONT_BODY, fontWeight: 600, fontSize: 40 * L.u, color: C.white, opacity: b, textShadow: shadow}}>{BRAND.tagline}</div>
        <div style={{background: accent, color: C.deep, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 42 * L.u, padding: `${16 * L.u}px ${40 * L.u}px`, borderRadius: 60 * L.u, opacity: c, transform: `translateY(${(1 - c) * 24}px)`}}>{BRAND.website}</div>
        <div style={{fontFamily: FONT_BODY, fontWeight: 600, fontSize: 32 * L.u, color: C.white, opacity: c, textShadow: shadow}}>{SOCIAL.handles.instagram} on every platform</div>
      </div>
    </AbsoluteFill>
  );
};

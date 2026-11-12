// 2D motion-graphic scenes. Every scene is a pure function of the current frame.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Mark, Logo} from '../components/Logo';
import {bodyStyle, Card, Content, Title, useScene, type SceneProps} from '../components/SceneShell';
import {BRAND, C, clamp01, cueAt, enter, fit, FONT_BODY, FONT_HEAD, SOCIAL} from '../theme';

const Wrap: React.FC<{vis: number; children: React.ReactNode}> = ({vis, children}) => <AbsoluteFill style={{opacity: vis}}>{children}</AbsoluteFill>;

export const HookScene: React.FC<SceneProps> = ({scene, timing, accent}) => {
  const {frame, fps, t, L, vis, seconds, width, height} = useScene(timing);
  const words = (scene.heading ?? '').split(/\s+/);
  const size = fit(scene.heading ?? '', L.vertical ? 118 : 104, 30, 0.6) * L.u;
  const spread = Math.min(0.16, Math.max(0.07, (seconds * 0.35) / words.length));
  const k = enter(frame, fps, 0, 0.4);
  const top = L.vertical ? L.title.y + 40 * L.u : L.title.y;
  return (
    <Wrap vis={vis}>
      <div style={{position: 'absolute', left: width / 2 - 520 * L.u, top: height * (L.vertical ? 0.4 : 0.5) - 520 * L.u, opacity: 0.09 * k, transform: `rotate(${t * 9}deg) scale(${0.9 + 0.1 * k})`}}>
        <Mark size={1040 * L.u} color={C.white} accent={accent} />
      </div>
      <div style={{position: 'absolute', left: L.margin, top, width: width - 2 * L.margin, height: (L.vertical ? 980 : 640) * L.u, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
        {scene.label ? (
          <div style={{fontFamily: FONT_HEAD, fontWeight: 600, fontSize: 34 * L.u, letterSpacing: 4, color: accent, marginBottom: 26 * L.u, opacity: k, transform: `translateX(${(1 - k) * -30}px)`}}>{scene.label}</div>
        ) : null}
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: size, lineHeight: 1.06, letterSpacing: -2, color: C.white}}>
          {words.map((w, i) => {
            const a = enter(frame, fps, 0.08 + i * spread, 0.34);
            const emph = /\d/.test(w) || i === words.length - 1;
            return (
              <span key={i} style={{display: 'inline-block', marginRight: size * 0.24, opacity: a, transform: `translateY(${(1 - a) * 46}px) scale(${0.9 + 0.1 * a})`, color: emph ? accent : C.white}}>
                {w}
              </span>
            );
          })}
        </div>
        <div style={{height: 10 * L.u, width: `${enter(frame, fps, 0.3 + words.length * spread, 0.6) * 46}%`, background: accent, borderRadius: 6, marginTop: 34 * L.u}} />
      </div>
    </Wrap>
  );
};

export const TermScene: React.FC<SceneProps> = ({scene, timing, accent}) => {
  const {frame, fps, t, L, vis, width} = useScene(timing);
  const term = scene.heading ?? '';
  const size = fit(term, L.vertical ? 230 : 200, 6, 0.4) * L.u;
  const b = enter(frame, fps, 0.55, 0.5);
  return (
    <Wrap vis={vis}>
      <div style={{position: 'absolute', left: L.margin, top: L.title.y + 30 * L.u, width: width - 2 * L.margin, textAlign: 'center'}}>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 600, fontSize: 32 * L.u, letterSpacing: 5, color: accent, opacity: enter(frame, fps, 0, 0.4)}}>{scene.label ?? 'THE TERM'}</div>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: size, letterSpacing: -3, lineHeight: 1.1, color: C.white, marginTop: 30 * L.u, whiteSpace: 'nowrap'}}>
          {term.split('').map((ch, i) => {
            const a = enter(frame, fps, 0.1 + i * 0.045, 0.4);
            return (
              <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', opacity: a, transform: `translateY(${(1 - a) * 70 + Math.sin(t * 1.6 + i * 0.6) * 3}px)`, textShadow: `0 0 ${50 * a}px ${accent}66`}}>
                {ch}
              </span>
            );
          })}
        </div>
        <div style={{width: `${enter(frame, fps, 0.4, 0.6) * 30}%`, height: 8 * L.u, background: accent, borderRadius: 5, margin: `${26 * L.u}px auto 0`}} />
      </div>
      {scene.body ? (
        <div style={{position: 'absolute', left: L.content.x, top: L.content.y + (L.vertical ? 180 : 110) * L.u, width: L.content.w, opacity: b, transform: `translateY(${(1 - b) * 36}px)`}}>
          <Card L={L} accent={accent}>
            <div style={{...bodyStyle(L, fit(scene.body, 54, 60)), fontWeight: 600, textAlign: 'center'}}>{scene.body}</div>
          </Card>
        </div>
      ) : null}
    </Wrap>
  );
};

export const StatementScene: React.FC<SceneProps> = ({scene, timing, accent}) => {
  const {frame, fps, L, vis} = useScene(timing);
  const a = enter(frame, fps, 0.4, 0.55);
  const isQa = scene.kind === 'qa';
  return (
    <Wrap vis={vis}>
      {isQa ? (
        <div style={{position: 'absolute', left: L.title.x, top: L.title.y, width: L.title.w, height: L.title.h, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
          <div style={{alignSelf: 'flex-start', background: accent, color: C.deep, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fit(scene.label ?? '', 54, 16) * L.u, letterSpacing: 1, padding: `${12 * L.u}px ${26 * L.u}px`, borderRadius: 14 * L.u, transform: `scale(${0.7 + 0.3 * enter(frame, fps, 0, 0.35)})`, transformOrigin: 'left center', opacity: enter(frame, fps, 0, 0.3)}}>
            {scene.label}
          </div>
          <div style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: fit(scene.heading ?? '', 72, 30) * L.u, lineHeight: 1.12, color: C.white, marginTop: 22 * L.u, opacity: enter(frame, fps, 0.25, 0.45), transform: `translateY(${(1 - enter(frame, fps, 0.25, 0.45)) * 24}px)`}}>
            {scene.heading}
          </div>
        </div>
      ) : (
        <Title scene={scene} accent={accent} L={L} frame={frame} fps={fps} />
      )}
      {scene.body ? (
        <Content L={L}>
          <div style={{opacity: a, transform: `translateY(${(1 - a) * 40}px)`, marginTop: 20 * L.u}}>
            <Card L={L} accent={accent}>
              <div style={bodyStyle(L, fit(scene.body, 60, 110, 0.74))}>
                {scene.body.split(/\s+/).map((w, i) => (
                  <span key={i} style={{opacity: 0.25 + 0.75 * enter(frame, fps, 0.5 + i * 0.045, 0.3)}}>{w} </span>
                ))}
              </div>
            </Card>
          </div>
        </Content>
      ) : null}
    </Wrap>
  );
};

export const BulletsScene: React.FC<SceneProps> = ({scene, timing, accent}) => {
  const {frame, fps, L, vis, seconds} = useScene(timing);
  const items = scene.items ?? [];
  const check = scene.kind === 'checklist';
  const compact = items.length > 4 || !L.vertical;
  return (
    <Wrap vis={vis}>
      <Title scene={scene} accent={accent} L={L} frame={frame} fps={fps} />
      <Content L={L}>
        {items.map((it, i) => {
          const at = cueAt(timing.cueTimes, i, items.length, seconds);
          const a = enter(frame, fps, at, 0.4);
          const tick = enter(frame, fps, at + 0.12, 0.3);
          return (
            <div key={i} style={{opacity: a, transform: `translateX(${(1 - a) * 70}px)`, display: 'flex', alignItems: 'center', gap: 26 * L.u, background: 'linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))', border: `2px solid ${C.white}22`, borderRadius: 24 * L.u, padding: `${(compact ? 24 : 36) * L.u}px ${32 * L.u}px`}}>
              <div style={{flex: 'none', width: 84 * L.u, height: 84 * L.u, borderRadius: check ? 20 * L.u : 42 * L.u, background: check ? `${accent}${tick > 0.5 ? 'FF' : '00'}` : accent, border: `4px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 44 * L.u, color: C.deep}}>
                {check ? (
                  <svg width={44 * L.u} height={44 * L.u} viewBox="0 0 24 24"><path d="M4 12.5 L10 18 L20 6" fill="none" stroke={C.deep} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="26" strokeDashoffset={26 * (1 - tick)} /></svg>
                ) : i + 1}
              </div>
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{fontFamily: FONT_HEAD, fontWeight: 600, fontSize: fit(it.title, compact ? 46 : 54, 26, 0.74) * L.u, color: C.white, lineHeight: 1.18}}>{it.title}</div>
                {it.text ? <div style={{...bodyStyle(L, compact ? 34 : 38), color: C.mist, marginTop: 8 * L.u, lineHeight: 1.25}}>{it.text}</div> : null}
              </div>
            </div>
          );
        })}
      </Content>
    </Wrap>
  );
};

export const CompareScene: React.FC<SceneProps> = ({scene, timing, accent}) => {
  const {frame, fps, L, vis, seconds} = useScene(timing);
  const items = scene.items ?? [];
  return (
    <Wrap vis={vis}>
      <Title scene={scene} accent={accent} L={L} frame={frame} fps={fps} />
      <Content L={L}>
        {items.map((it, i) => {
          const at = timing.cueTimes[i] !== undefined ? timing.cueTimes[i] : 0.5 + (i * Math.min(0.55, (seconds - 2) / items.length));
          const a = enter(frame, fps, at, 0.4);
          const warn = i >= items.length - 2;
          return (
            <div key={i} style={{opacity: a, transform: `translateY(${(1 - a) * 30}px)`, display: 'flex', alignItems: 'center', gap: 24 * L.u, background: 'rgba(255,255,255,0.07)', border: `2px solid ${C.white}20`, borderRadius: 22 * L.u, padding: `${26 * L.u}px ${28 * L.u}px`}}>
              <div style={{flex: 'none', minWidth: 120 * L.u, textAlign: 'center', fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fit(it.title, 56, 4, 0.5) * L.u, color: C.deep, background: warn ? C.amber : accent, borderRadius: 16 * L.u, padding: `${8 * L.u}px ${18 * L.u}px`}}>{it.title}</div>
              <div style={{flex: 1, ...bodyStyle(L, 34), color: C.mist}}>{it.text}</div>
              <div style={{flex: 'none', fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 52 * L.u, color: warn ? C.amber : C.white}}>{it.value}</div>
            </div>
          );
        })}
      </Content>
    </Wrap>
  );
};

export const StatScene: React.FC<SceneProps> = ({scene, timing, accent}) => {
  const {frame, fps, L, vis, t} = useScene(timing);
  const it = scene.items?.[0];
  const raw = it?.value ?? '';
  const m = raw.match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/);
  const p = enter(frame, fps, 0.3, 1.1);
  const shown = m ? `${m[1]}${(Number(m[2]) * p).toFixed(m[2].includes('.') ? m[2].split('.')[1].length : 0)}${m[3]}` : raw;
  const R = 250 * L.u;
  return (
    <Wrap vis={vis}>
      <Title scene={scene} accent={accent} L={L} frame={frame} fps={fps} align="center" />
      <Content L={L} justify="center">
        <div style={{alignSelf: 'center', position: 'relative', width: 2 * R, height: 2 * R, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <svg width={2 * R} height={2 * R} style={{position: 'absolute', transform: 'rotate(-90deg)'}}>
            <circle cx={R} cy={R} r={R - 18} fill="rgba(255,255,255,0.05)" stroke={`${C.white}22`} strokeWidth={14} />
            <circle cx={R} cy={R} r={R - 18} fill="none" stroke={accent} strokeWidth={14} strokeLinecap="round" strokeDasharray={2 * Math.PI * (R - 18)} strokeDashoffset={2 * Math.PI * (R - 18) * (1 - p)} />
          </svg>
          <div style={{textAlign: 'center', transform: `scale(${1 + 0.015 * Math.sin(t * 3)})`}}>
            <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fit(raw, 190, 4, 0.5) * L.u, color: C.white, lineHeight: 1}}>{shown}</div>
            <div style={{fontFamily: FONT_BODY, fontWeight: 600, fontSize: 38 * L.u, color: accent, marginTop: 10 * L.u}}>{it?.title}</div>
          </div>
        </div>
      </Content>
    </Wrap>
  );
};

export const TimelineScene: React.FC<SceneProps> = ({scene, timing, accent}) => {
  const {frame, fps, L, vis, seconds} = useScene(timing);
  const items = scene.items ?? [];
  const gap = Math.min(300, 720 / Math.max(1, items.length)) * L.u;
  const lastAt = cueAt(timing.cueTimes, items.length - 1, items.length, seconds);
  return (
    <Wrap vis={vis}>
      <Title scene={scene} accent={accent} L={L} frame={frame} fps={fps} />
      <Content L={L}>
        <div style={{position: 'relative', marginLeft: 20 * L.u, marginTop: 20 * L.u, height: gap * items.length}}>
          <div style={{position: 'absolute', left: 26 * L.u, top: 30 * L.u, width: 8 * L.u, borderRadius: 4, background: `${C.white}26`, height: gap * (items.length - 1)}} />
          <div style={{position: 'absolute', left: 26 * L.u, top: 30 * L.u, width: 8 * L.u, borderRadius: 4, background: accent, height: gap * (items.length - 1) * clamp01(enter(frame, fps, 0.4, Math.max(0.6, lastAt)))}} />
          {items.map((it, i) => {
            const a = enter(frame, fps, cueAt(timing.cueTimes, i, items.length, seconds), 0.45);
            return (
              <div key={i} style={{position: 'absolute', top: i * gap, left: 0, right: 0, display: 'flex', gap: 34 * L.u, alignItems: 'flex-start', opacity: 0.2 + 0.8 * a}}>
                <div style={{flex: 'none', width: 60 * L.u, height: 60 * L.u, borderRadius: 30 * L.u, background: a > 0.5 ? accent : C.navy, border: `6px solid ${accent}`, transform: `scale(${0.7 + 0.3 * a})`}} />
                <div style={{transform: `translateX(${(1 - a) * 40}px)`}}>
                  <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 64 * L.u, color: accent, lineHeight: 1}}>{it.value}</div>
                  <div style={{...bodyStyle(L, fit(it.title, 44, 30, 0.75)), fontWeight: 600, marginTop: 10 * L.u}}>{it.title}</div>
                  {it.text ? <div style={{...bodyStyle(L, 32), color: C.mist}}>{it.text}</div> : null}
                </div>
              </div>
            );
          })}
        </div>
      </Content>
    </Wrap>
  );
};

export const TakeawayScene: React.FC<SceneProps> = ({scene, timing, accent}) => {
  const {frame, fps, t, L, vis, width, height} = useScene(timing);
  const a = enter(frame, fps, 0.1, 0.5);
  const w = width - 2 * L.margin;
  const h = (L.vertical ? 640 : 460) * L.u;
  const top = L.vertical ? height * 0.36 - h / 2 : L.title.y + 20;
  const per = 2 * (w + h);
  return (
    <Wrap vis={vis}>
      <div style={{position: 'absolute', left: L.margin, top, width: w, height: h, transform: `scale(${0.92 + 0.08 * a})`, opacity: a}}>
        <svg width={w} height={h} style={{position: 'absolute'}}>
          <rect x={4} y={4} width={w - 8} height={h - 8} rx={36 * L.u} fill="rgba(255,255,255,0.07)" stroke={`${C.white}22`} strokeWidth={3} />
          <rect x={4} y={4} width={w - 8} height={h - 8} rx={36 * L.u} fill="none" stroke={accent} strokeWidth={7} strokeDasharray={`${per * 0.22} ${per}`} strokeDashoffset={-((t * 0.16) % 1) * per} strokeLinecap="round" />
        </svg>
        <div style={{position: 'absolute', inset: 0, padding: 56 * L.u, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
          <div style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 34 * L.u, letterSpacing: 4, color: accent}}>{scene.label ?? 'KEY TAKEAWAY'}</div>
          <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fit(scene.heading ?? '', 92, 28, 0.6) * L.u, lineHeight: 1.1, letterSpacing: -1.5, color: C.white, marginTop: 24 * L.u}}>{scene.heading}</div>
        </div>
      </div>
    </Wrap>
  );
};

export const EndCardScene: React.FC<SceneProps> = ({timing, accent, logo}) => {
  const {frame, fps, t, L, inA, width, height} = useScene(timing);
  const a = enter(frame, fps, 0.05, 0.6);
  const b = enter(frame, fps, 0.5, 0.5);
  const c = enter(frame, fps, 0.8, 0.5);
  const cy = height * (L.vertical ? 0.36 : 0.42);
  return (
    <AbsoluteFill style={{opacity: inA}}>
      {[0, 1, 2].map((i) => {
        const r = (((t * 0.35 + i / 3) % 1) * 620 + 160) * L.u;
        return <div key={i} style={{position: 'absolute', left: width / 2 - r, top: cy - r, width: 2 * r, height: 2 * r, borderRadius: r, border: `3px solid ${accent}`, opacity: 0.22 * (1 - ((t * 0.35 + i / 3) % 1))}} />;
      })}
      <div style={{position: 'absolute', left: 0, right: 0, top: cy - 170 * L.u, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34 * L.u}}>
        <div style={{transform: `scale(${0.6 + 0.4 * a}) rotate(${(1 - a) * -90}deg)`, opacity: a}}>
          {logo ? <Logo height={190 * L.u} logo={logo} accent={accent} /> : <Mark size={210 * L.u} accent={accent} />}
        </div>
        {logo ? null : (
          <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 112 * L.u, letterSpacing: -3, color: C.white, opacity: b, transform: `translateY(${(1 - b) * 30}px)`, lineHeight: 1}}>
            Hey<span style={{color: accent}}>Mariner</span>
          </div>
        )}
        <div style={{fontFamily: FONT_BODY, fontWeight: 500, fontSize: 40 * L.u, color: C.mist, opacity: b}}>{BRAND.tagline}</div>
        <div style={{marginTop: 10 * L.u, background: accent, color: C.deep, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 42 * L.u, padding: `${16 * L.u}px ${40 * L.u}px`, borderRadius: 60 * L.u, opacity: c, transform: `translateY(${(1 - c) * 24}px)`}}>
          {BRAND.website}
        </div>
        <div style={{fontFamily: FONT_BODY, fontWeight: 600, fontSize: 32 * L.u, color: `${C.white}B3`, opacity: c}}>{SOCIAL.handles.instagram} on every platform</div>
      </div>
    </AbsoluteFill>
  );
};

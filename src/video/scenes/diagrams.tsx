// Technical 2D diagrams drawn in SVG: radar plot (CPA/TCPA) and under-keel-clearance cross-section.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Title, useScene, type SceneProps} from '../components/SceneShell';
import {C, clamp01, enter, FONT_BODY, FONT_HEAD, lerp, ramp} from '../theme';

const Panel: React.FC<{L: ReturnType<typeof useScene>['L']; children: React.ReactNode}> = ({L, children}) => (
  <div style={{position: 'absolute', left: L.panel.x, top: L.panel.y, width: L.panel.w, height: L.panel.h, borderRadius: 34 * L.u, overflow: 'hidden', background: '#04101F', border: `3px solid ${C.white}26`, boxShadow: '0 30px 80px rgba(0,0,0,0.45)'}}>{children}</div>
);

export const RadarScene: React.FC<SceneProps> = ({scene, timing, accent}) => {
  const {frame, fps, t, L, vis, seconds} = useScene(timing);
  const v = scene.visual?.type === 'radar' ? scene.visual : {type: 'radar' as const, cpaNm: 0.5, tcpaMin: 10, limitNm: 1};
  const W = L.panel.w;
  const H = L.panel.h;
  const R = Math.min(W * 0.42, H * 0.44);
  const cx = W * (L.vertical ? 0.5 : 0.36);
  const cy = H * 0.5;
  const range = 3; // nm on the outer ring
  const px = (nm: number) => (nm / range) * R;
  const c0 = timing.cueTimes[0] ?? seconds * 0.35;
  const c1 = timing.cueTimes[1] ?? seconds * 0.7;
  // relative track: closest point at bearing 325 deg, target arrives from the starboard bow
  const brg = (325 * Math.PI) / 180;
  const pc = {x: Math.sin(brg) * v.cpaNm, y: -Math.cos(brg) * v.cpaNm};
  const dir = {x: -Math.cos(brg), y: -Math.sin(brg)};
  const prog = clamp01(t / Math.max(1, seconds));
  const along = lerp(2.55, 1.15, prog);
  const tgt = {x: pc.x - dir.x * along, y: pc.y - dir.y * along};
  const sweep = (t * 150) % 360;
  const showCpa = enter(frame, fps, c0, 0.5);
  const alarm = enter(frame, fps, c1, 0.3);
  const tcpa = v.tcpaMin * 60 * (along / 2.55);
  const mm = Math.floor(tcpa / 60);
  const ss = Math.floor(tcpa % 60);
  const green = '#39FF9C';
  const trail = [0.25, 0.5, 0.75, 1].map((k) => ({x: tgt.x - dir.x * k * 0.32, y: tgt.y - dir.y * k * 0.32, o: 0.5 - k * 0.1}));
  const boxX = L.vertical ? 30 * L.u : W * 0.7;
  const boxY = L.vertical ? H - 190 * L.u : H * 0.3;
  return (
    <AbsoluteFill style={{opacity: vis}}>
      <Title scene={scene} accent={accent} L={L} frame={frame} fps={fps} />
      <Panel L={L}>
        <svg width={W} height={H}>
          <defs>
            <radialGradient id="ppi"><stop offset="0%" stopColor="#0B3B2E" /><stop offset="100%" stopColor="#031A14" /></radialGradient>
            <clipPath id="ppiclip"><circle cx={cx} cy={cy} r={R} /></clipPath>
          </defs>
          <circle cx={cx} cy={cy} r={R} fill="url(#ppi)" stroke={green} strokeWidth={3} />
          <g clipPath="url(#ppiclip)">
            {[1, 2].map((n) => <circle key={n} cx={cx} cy={cy} r={px(n)} fill="none" stroke={green} strokeOpacity={0.28} strokeWidth={1.5} />)}
            {[0, 30, 60, 90, 120, 150].map((d) => <line key={d} x1={cx - R * Math.sin((d * Math.PI) / 180)} y1={cy + R * Math.cos((d * Math.PI) / 180)} x2={cx + R * Math.sin((d * Math.PI) / 180)} y2={cy - R * Math.cos((d * Math.PI) / 180)} stroke={green} strokeOpacity={0.13} strokeWidth={1.2} />)}
            {[0, 8, 16, 24, 32].map((k) => {
              const a = ((sweep - k) * Math.PI) / 180;
              return <line key={k} x1={cx} y1={cy} x2={cx + R * Math.sin(a)} y2={cy - R * Math.cos(a)} stroke={green} strokeOpacity={0.75 - k * 0.022} strokeWidth={k === 0 ? 4 : 12} />;
            })}
            <circle cx={cx} cy={cy} r={px(v.limitNm)} fill={alarm > 0.5 ? `${C.red}22` : 'none'} stroke={alarm > 0.5 ? C.red : C.amber} strokeWidth={3} strokeDasharray="14 10" />
            <line x1={cx} y1={cy} x2={cx} y2={cy - R} stroke={green} strokeOpacity={0.6} strokeWidth={2} />
            {trail.map((p, i) => <circle key={i} cx={cx + px(p.x)} cy={cy + px(p.y)} r={7 * L.u} fill={green} opacity={p.o} />)}
            <line x1={cx + px(tgt.x)} y1={cy + px(tgt.y)} x2={cx + px(pc.x + dir.x * 1.6)} y2={cy + px(pc.y + dir.y * 1.6)} stroke={alarm > 0.5 ? C.red : green} strokeWidth={3} strokeDasharray="10 8" opacity={showCpa} />
            <line x1={cx} y1={cy} x2={cx + px(pc.x)} y2={cy + px(pc.y)} stroke={C.white} strokeWidth={4} opacity={showCpa} />
            <circle cx={cx + px(pc.x)} cy={cy + px(pc.y)} r={(10 + 4 * Math.sin(t * 6)) * L.u} fill="none" stroke={alarm > 0.5 ? C.red : C.white} strokeWidth={4} opacity={showCpa} />
            <rect x={cx + px(tgt.x) - 13 * L.u} y={cy + px(tgt.y) - 13 * L.u} width={26 * L.u} height={26 * L.u} fill="none" stroke={green} strokeWidth={3} />
            <circle cx={cx + px(tgt.x)} cy={cy + px(tgt.y)} r={9 * L.u} fill={green} />
          </g>
          <path d={`M ${cx} ${cy - 16 * L.u} L ${cx + 10 * L.u} ${cy + 12 * L.u} L ${cx - 10 * L.u} ${cy + 12 * L.u} Z`} fill={C.white} />
          <text x={cx + px(v.limitNm) * 0.72} y={cy + px(v.limitNm) * 0.72 + 30 * L.u} fill={alarm > 0.5 ? C.red : C.amber} fontFamily={FONT_BODY} fontWeight={700} fontSize={24 * L.u}>{`CPA limit ${v.limitNm.toFixed(1)} nm`}</text>
        </svg>
        <div style={{position: 'absolute', left: boxX, top: boxY, display: 'flex', gap: 16 * L.u, flexDirection: L.vertical ? 'row' : 'column'}}>
          {[{k: 'CPA', val: `${v.cpaNm.toFixed(1)} nm`, hot: true}, {k: 'TCPA', val: `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`, hot: false}].map((b) => (
            <div key={b.k} style={{background: b.hot && alarm > 0.5 ? C.red : 'rgba(4,16,31,0.9)', border: `3px solid ${b.hot && alarm > 0.5 ? C.red : green}`, borderRadius: 18 * L.u, padding: `${12 * L.u}px ${24 * L.u}px`, minWidth: 210 * L.u, transform: `scale(${b.hot ? 1 + 0.05 * alarm * Math.abs(Math.sin(t * 5)) : 1})`}}>
              <div style={{fontFamily: FONT_BODY, fontWeight: 700, fontSize: 26 * L.u, color: b.hot && alarm > 0.5 ? C.white : green, letterSpacing: 2}}>{b.k}</div>
              <div style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 54 * L.u, color: C.white, lineHeight: 1.1}}>{b.val}</div>
            </div>
          ))}
          {alarm > 0.5 ? <div style={{alignSelf: 'center', fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 40 * L.u, color: C.red, opacity: 0.6 + 0.4 * Math.abs(Math.sin(t * 5))}}>TOO CLOSE</div> : null}
        </div>
      </Panel>
    </AbsoluteFill>
  );
};

export const UkcScene: React.FC<SceneProps> = ({scene, timing, accent}) => {
  const {frame, fps, t, L, vis, seconds} = useScene(timing);
  const v = scene.visual?.type === 'ukc' ? scene.visual : {type: 'ukc' as const, depth: 14, draft: 11.5, squat: 0.8};
  const W = L.panel.w;
  const H = L.panel.h;
  const c = (i: number, def: number) => timing.cueTimes[i] ?? seconds * def;
  const aDepth = enter(frame, fps, c(0, 0.15), 0.5);
  const aDraft = enter(frame, fps, c(1, 0.4), 0.5);
  const sq = ramp(frame, fps, c(2, 0.6), c(2, 0.6) + 1.4);
  const surf = H * 0.2;
  const bed = H * 0.86;
  const m = (bed - surf) / v.depth; // px per metre
  const keel = surf + (v.draft + v.squat * sq) * m;
  const hullW = W * 0.34;
  const hx = W * 0.5;
  const ukc = v.depth - v.draft - v.squat * sq;
  const waveY = (x: number) => surf + 6 * Math.sin(x / 60 + t * 1.6) + 3 * Math.sin(x / 23 - t * 2.1);
  let wave = `M 0 ${waveY(0)}`;
  for (let x = 20; x <= W; x += 20) wave += ` L ${x} ${waveY(x)}`;
  const top = surf - 110 * L.u + v.squat * sq * m;
  const hull = `M ${hx - hullW / 2} ${top} L ${hx + hullW / 2} ${top} L ${hx + hullW / 2} ${keel - 34 * L.u} Q ${hx + hullW / 2} ${keel} ${hx + hullW / 2 - 40 * L.u} ${keel} L ${hx - hullW / 2 + 40 * L.u} ${keel} Q ${hx - hullW / 2} ${keel} ${hx - hullW / 2} ${keel - 34 * L.u} Z`;
  const Dim: React.FC<{x: number; y1: number; y2: number; label: string; color: string; o: number; side?: 'l' | 'r'}> = ({x, y1, y2, label, color, o, side = 'r'}) => (
    <g opacity={o}>
      <line x1={x} y1={y1} x2={x} y2={y1 + (y2 - y1) * o} stroke={color} strokeWidth={5} />
      <line x1={x - 14} y1={y1} x2={x + 14} y2={y1} stroke={color} strokeWidth={5} />
      <line x1={x - 14} y1={y2} x2={x + 14} y2={y2} stroke={color} strokeWidth={5} />
      <text x={side === 'r' ? x + 22 : x - 22} y={(y1 + y2) / 2 + 12 * L.u} textAnchor={side === 'r' ? 'start' : 'end'} fill={color} fontFamily={FONT_HEAD} fontWeight={700} fontSize={34 * L.u}>{label}</text>
    </g>
  );
  return (
    <AbsoluteFill style={{opacity: vis}}>
      <Title scene={scene} accent={accent} L={L} frame={frame} fps={fps} />
      <Panel L={L}>
        <svg width={W} height={H}>
          <defs>
            <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1B8FB8" /><stop offset="100%" stopColor="#0A3A5C" /></linearGradient>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0D2747" /><stop offset="100%" stopColor="#1D4A73" /></linearGradient>
          </defs>
          <rect width={W} height={H} fill="url(#sky)" />
          <path d={`${wave} L ${W} ${bed} L 0 ${bed} Z`} fill="url(#sea)" />
          <path d={`M 0 ${bed} Q ${W * 0.3} ${bed - 14} ${W * 0.55} ${bed + 2} T ${W} ${bed - 6} L ${W} ${H} L 0 ${H} Z`} fill="#B08D57" />
          <path d={`M 0 ${bed + 26} Q ${W * 0.4} ${bed + 10} ${W} ${bed + 30} L ${W} ${H} L 0 ${H} Z`} fill="#8C6D3F" />
          <path d={hull} fill="#B4432E" stroke="#0A1626" strokeWidth={4} />
          <rect x={hx - hullW / 2} y={top} width={hullW} height={Math.max(0, waveY(hx) - top) + 4} fill="#1E3A5F" />
          <rect x={hx - hullW * 0.22} y={top - 90 * L.u} width={hullW * 0.44} height={90 * L.u} fill="#F1F5F9" />
          <rect x={hx - hullW * 0.05} y={top - 150 * L.u} width={hullW * 0.1} height={60 * L.u} fill={accent} />
          <Dim x={W * 0.1} y1={surf} y2={bed} label={`Depth ${v.depth.toFixed(1)} m`} color={C.white} o={aDepth} />
          <Dim x={hx - hullW / 2 - 40 * L.u} y1={surf} y2={surf + v.draft * m} label={`Draught ${v.draft.toFixed(1)} m`} color="#FCA5A5" o={aDraft} side="l" />
          {sq > 0.02 ? <Dim x={hx + hullW / 2 + 40 * L.u} y1={surf + v.draft * m} y2={keel} label={`Squat ${(v.squat * sq).toFixed(1)} m`} color={C.amber} o={1} /> : null}
          <g opacity={aDraft}>
            <rect x={hx - 150 * L.u} y={(keel + bed) / 2 - 38 * L.u} width={300 * L.u} height={76 * L.u} rx={16 * L.u} fill={ukc < 2 ? C.amber : accent} />
            <text x={hx} y={(keel + bed) / 2 + 14 * L.u} textAnchor="middle" fill={C.deep} fontFamily={FONT_HEAD} fontWeight={800} fontSize={40 * L.u}>{`UKC ${ukc.toFixed(1)} m`}</text>
          </g>
        </svg>
      </Panel>
    </AbsoluteFill>
  );
};

// Animated maritime backdrops. Every text scene sits on top of one of these, so the screen is never
// "text on a still background". All motion is a pure function of time t (seconds). Drawn in SVG: cheap to render.
import React from 'react';
import type {ContentSpec, Motif, SceneSpec} from '../../shared/types';
import {C} from '../theme';
import {EXTRA_MOTIFS} from './MotifsExtra';

type P = {t: number; accent: string; id: string};
const W = 1000;
const H = 900;
const TAU = Math.PI * 2;
/** deterministic pseudo-random 0..1 */
const rnd = (i: number, k = 1) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const wavePath = (y: number, amp: number, len: number, phase: number, close = true) => {
  let d = `M -20 ${y + amp * Math.sin(phase - 20 / len)}`;
  for (let x = 0; x <= W + 20; x += 25) d += ` L ${x} ${(y + amp * Math.sin(x / len + phase) + amp * 0.4 * Math.sin(x / (len * 0.37) - phase * 1.7)).toFixed(1)}`;
  return close ? `${d} L ${W + 20} ${H + 20} L -20 ${H + 20} Z` : d;
};

const Ship: React.FC<{x: number; y: number; s: number; t: number; accent: string}> = ({x, y, s, t, accent}) => (
  <g transform={`translate(${x} ${y + 5 * Math.sin(t * 1.4)}) rotate(${1.6 * Math.sin(t * 1.1)}) scale(${s})`}>
    {[0, 1, 2].map((i) => {
      const k = (t * 0.45 + i / 3) % 1;
      return <circle key={i} cx={-196 - k * 90} cy={-150 - k * 110} r={12 + k * 34} fill="#DCE7F3" opacity={0.42 * (1 - k)} />;
    })}
    <path d="M -260 -40 L 250 -40 L 300 -62 L 262 30 L -236 30 Z" fill="#0F2D4D" />
    <path d="M -246 6 L 272 6 L 262 30 L -236 30 Z" fill="#B4432E" />
    <rect x={-226} y={-128} width={74} height={88} fill="#F1F5F9" />
    <rect x={-216} y={-116} width={54} height={10} fill="#0F2D4D" />
    <rect x={-204} y={-170} width={26} height={44} fill={accent} />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <g key={i}>
        <rect x={-130 + i * 58} y={-70} width={52} height={30} fill={['#E2574C', '#3B82F6', '#F59E0B', '#22C55E', '#E2574C', '#3B82F6'][i]} />
        {i % 3 !== 2 ? <rect x={-130 + i * 58} y={-102} width={52} height={30} fill={['#F59E0B', '#22C55E', '#3B82F6', '#E2574C', '#22C55E', '#F59E0B'][i]} /> : null}
      </g>
    ))}
    <path d={`M 288 ${14 + 3 * Math.sin(t * 5)} q 26 -22 46 4 q -22 8 -46 -4`} fill="#E0F7FF" opacity={0.85} />
  </g>
);

const Voyage: React.FC<P> = ({t, accent, id}) => {
  const sx = ((t * 16 + 380) % (W + 700)) - 350;
  return (
    <>
      <defs>
        <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0B2545" /><stop offset="60%" stopColor="#1B5E8C" /><stop offset="100%" stopColor="#5FB7C9" /></linearGradient>
        <radialGradient id={`sun${id}`}><stop offset="0%" stopColor="#FFE9B0" /><stop offset="35%" stopColor="#FFC45A" stopOpacity="0.9" /><stop offset="100%" stopColor="#FFC45A" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#sky${id})`} />
      <circle cx={720} cy={430 - 22 * Math.sin(t * 0.12)} r={230 + 12 * Math.sin(t * 0.9)} fill={`url(#sun${id})`} />
      {[0, 1, 2, 3].map((i) => {
        const cx = ((rnd(i) * W + t * (9 + i * 5)) % (W + 400)) - 200;
        return <ellipse key={i} cx={cx} cy={110 + i * 62} rx={150 - i * 16} ry={24} fill="#FFFFFF" opacity={0.13} />;
      })}
      {[0, 1, 2].map((i) => {
        const bx = ((t * (34 + i * 9) + i * 330) % (W + 200)) - 100;
        const by = 190 + i * 46 + 16 * Math.sin(t * 0.8 + i);
        const f = 12 * Math.sin(t * 7 + i * 2);
        return <path key={i} d={`M ${bx - 22} ${by - f} Q ${bx - 10} ${by - 12} ${bx} ${by} Q ${bx + 10} ${by - 12} ${bx + 22} ${by - f}`} fill="none" stroke="#0B1F3A" strokeWidth={4} strokeLinecap="round" opacity={0.7} />;
      })}
      <path d={wavePath(540, 10, 150, t * 0.5)} fill="#1C7FA6" />
      <path d={wavePath(590, 14, 120, -t * 0.7 + 1)} fill="#176D93" />
      <Ship x={sx} y={612} s={0.86} t={t} accent={accent} />
      <path d={wavePath(646, 16, 105, t * 1.0 + 2)} fill="#125A7E" />
      <path d={wavePath(730, 20, 90, -t * 1.2 + 4)} fill="#0E4868" />
      <path d={wavePath(820, 22, 76, t * 1.45)} fill="#0A3552" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x={(rnd(i, 3) * W + t * 40) % W} y={670 + rnd(i, 5) * 190} width={46 + rnd(i, 7) * 60} height={4} rx={2} fill="#E0F7FF" opacity={0.22 + 0.2 * Math.sin(t * 2 + i)} />)}
    </>
  );
};

const Radar: React.FC<P> = ({t, id}) => {
  const cx = W / 2;
  const cy = H / 2;
  const R = 400;
  const sweep = (t * 95) % 360;
  const g = '#39FF9C';
  return (
    <>
      <defs><radialGradient id={`ppi${id}`}><stop offset="0%" stopColor="#0C4635" /><stop offset="100%" stopColor="#02140F" /></radialGradient><clipPath id={`rc${id}`}><circle cx={cx} cy={cy} r={R} /></clipPath></defs>
      <rect width={W} height={H} fill="#020C12" />
      <circle cx={cx} cy={cy} r={R} fill={`url(#ppi${id})`} stroke={g} strokeWidth={4} />
      <g clipPath={`url(#rc${id})`}>
        {[1, 2, 3].map((n) => <circle key={n} cx={cx} cy={cy} r={(R * n) / 4} fill="none" stroke={g} strokeOpacity={0.3} strokeWidth={2} />)}
        {[0, 30, 60, 90, 120, 150].map((d) => <line key={d} x1={cx - R * Math.sin((d * Math.PI) / 180)} y1={cy + R * Math.cos((d * Math.PI) / 180)} x2={cx + R * Math.sin((d * Math.PI) / 180)} y2={cy - R * Math.cos((d * Math.PI) / 180)} stroke={g} strokeOpacity={0.14} strokeWidth={1.5} />)}
        {Array.from({length: 14}, (_, k) => {
          const a = ((sweep - k * 3.2) * Math.PI) / 180;
          return <line key={k} x1={cx} y1={cy} x2={cx + R * Math.sin(a)} y2={cy - R * Math.cos(a)} stroke={g} strokeOpacity={0.8 - k * 0.055} strokeWidth={k ? 22 : 5} />;
        })}
        {Array.from({length: 7}, (_, i) => {
          const brg = rnd(i, 2) * 360;
          const r = (0.25 + rnd(i, 4) * 0.68) * R - ((t * (4 + rnd(i, 6) * 8)) % 60);
          const since = (sweep - brg + 360) % 360;
          const o = Math.max(0.12, 1 - since / 300);
          const a = (brg * Math.PI) / 180;
          return <g key={i} opacity={o}><circle cx={cx + r * Math.sin(a)} cy={cy - r * Math.cos(a)} r={11} fill={g} /><line x1={cx + r * Math.sin(a)} y1={cy - r * Math.cos(a)} x2={cx + (r - 46) * Math.sin(a + 0.12)} y2={cy - (r - 46) * Math.cos(a + 0.12)} stroke={g} strokeWidth={3} strokeDasharray="8 6" /></g>;
        })}
        <path d={`M ${cx - 300} ${cy + 250} q 120 -70 210 -10 q 60 60 -40 120 q -130 40 -170 -110`} fill={g} opacity={0.14 + 0.1 * Math.max(0, 1 - ((sweep - 215 + 360) % 360) / 200)} />
        <line x1={cx} y1={cy} x2={cx} y2={cy - R} stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={2} />
      </g>
      <path d={`M ${cx} ${cy - 22} L ${cx + 14} ${cy + 16} L ${cx - 14} ${cy + 16} Z`} fill="#FFFFFF" />
    </>
  );
};

const Chart: React.FC<P> = ({t, accent}) => {
  const route: [number, number][] = [[90, 800], [260, 610], [470, 560], [600, 380], [820, 300], [940, 110]];
  const seg = route.slice(1).map((p, i) => Math.hypot(p[0] - route[i][0], p[1] - route[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  const prog = ((t * 0.07) % 1) * total;
  let acc = 0;
  let pos = route[0];
  let ang = 0;
  for (let i = 0; i < seg.length; i++) {
    if (prog <= acc + seg[i]) {
      const k = (prog - acc) / seg[i];
      pos = [route[i][0] + (route[i + 1][0] - route[i][0]) * k, route[i][1] + (route[i + 1][1] - route[i][1]) * k];
      ang = (Math.atan2(route[i + 1][1] - route[i][1], route[i + 1][0] - route[i][0]) * 180) / Math.PI;
      break;
    }
    acc += seg[i];
  }
  const contour = (k: number) => `M ${-40} ${250 + k * 105} C 200 ${130 + k * 110 + 14 * Math.sin(t * 0.5 + k)}, 380 ${420 + k * 90}, 560 ${300 + k * 100 + 12 * Math.cos(t * 0.4 + k)} S 900 ${470 + k * 86}, 1040 ${330 + k * 100}`;
  return (
    <>
      <rect width={W} height={H} fill="#DCEBF5" />
      <path d={`${contour(4)} L 1040 940 L -40 940 Z`} fill="#BBDDF2" />
      <path d={`${contour(2.6)} L 1040 -40 L -40 -40 Z`} fill="#F4FAFD" />
      <path d="M -40 -40 L 520 -40 C 470 70, 330 60, 250 150 S 60 210, -40 190 Z" fill="#E9D7A5" stroke="#8C7440" strokeWidth={3} />
      {[0, 1, 2, 3, 4].map((k) => <path key={k} d={contour(k)} fill="none" stroke="#3E7CA8" strokeWidth={k === 2 ? 5 : 2.5} strokeOpacity={0.75} strokeDasharray={k === 2 ? undefined : '18 10'} strokeDashoffset={-t * 14} />)}
      {Array.from({length: 26}, (_, i) => <text key={i} x={60 + rnd(i, 1) * 880} y={230 + rnd(i, 2) * 640} fontFamily="Inter, sans-serif" fontSize={26} fontStyle="italic" fill="#1F4F78" opacity={0.55 + 0.25 * Math.sin(t * 1.5 + i)}>{Math.round(6 + rnd(i, 3) * 38)}</text>)}
      <polyline points={route.map((p) => p.join(',')).join(' ')} fill="none" stroke="#C0392B" strokeWidth={5} strokeDasharray="22 12" strokeDashoffset={-t * 30} />
      {route.map((p, i) => <g key={i}><circle cx={p[0]} cy={p[1]} r={13 + 5 * Math.sin(t * 3 + i)} fill="none" stroke="#C0392B" strokeWidth={4} /><circle cx={p[0]} cy={p[1]} r={5} fill="#C0392B" /></g>)}
      <g transform={`translate(${pos[0]} ${pos[1]}) rotate(${ang})`}>
        <ellipse cx={0} cy={0} rx={120} ry={56} fill={accent} opacity={0.2 + 0.08 * Math.sin(t * 4)} />
        <path d="M -34 -14 L 18 -14 L 40 0 L 18 14 L -34 14 Z" fill="#0B1F3A" stroke="#FFFFFF" strokeWidth={3} />
        <line x1={40} y1={0} x2={150} y2={0} stroke="#0B1F3A" strokeWidth={4} />
      </g>
      <g transform={`translate(850 720) rotate(${8 * Math.sin(t * 0.6)})`} opacity={0.85}>
        <circle r={96} fill="none" stroke="#1F4F78" strokeWidth={4} /><circle r={74} fill="none" stroke="#1F4F78" strokeWidth={1.5} strokeDasharray="4 8" />
        <path d="M 0 -92 L 16 0 L 0 92 L -16 0 Z" fill="#1F4F78" /><path d="M -92 0 L 0 -14 L 92 0 L 0 14 Z" fill="#7FA9C9" />
        <text y={-104} textAnchor="middle" fontFamily="Poppins, sans-serif" fontWeight={700} fontSize={30} fill="#1F4F78">N</text>
      </g>
    </>
  );
};

const Engine: React.FC<P> = ({t, accent}) => {
  const w = t * 3.2;
  const teeth = (n: number, r: number) => Array.from({length: n}, (_, i) => <rect key={i} x={-9} y={-r - 16} width={18} height={22} fill="#7C8798" transform={`rotate(${(360 / n) * i})`} />);
  return (
    <>
      <rect width={W} height={H} fill="#0E1B2B" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => <rect key={i} x={i * 125 - 10} y={0} width={4} height={H} fill="#16283D" />)}
      <rect x={0} y={770} width={W} height={130} fill="#152233" /><rect x={0} y={770} width={W} height={8} fill="#F59E0B" opacity={0.7} />
      {[0, 1, 2, 3].map((i) => {
        const cx = 190 + i * 205;
        const ph = w + (i * Math.PI) / 2;
        const crankY = 640;
        const r = 62;
        const px = cx + r * Math.sin(ph);
        const py = crankY - r * Math.cos(ph);
        const pistonY = py - Math.sqrt(210 * 210 - (px - cx) * (px - cx));
        const fire = Math.max(0, Math.cos(ph)) ** 6;
        return (
          <g key={i}>
            <rect x={cx - 74} y={170} width={148} height={330} rx={10} fill="#22364D" stroke="#3A536F" strokeWidth={5} />
            <rect x={cx - 60} y={184} width={120} height={Math.max(0, pistonY - 46 - 184)} fill="#FF8A3D" opacity={0.15 + 0.75 * fire} />
            <rect x={cx - 60} y={pistonY - 46} width={120} height={92} rx={8} fill="#C9D3DF" /><rect x={cx - 60} y={pistonY - 30} width={120} height={6} fill="#7C8798" /><rect x={cx - 60} y={pistonY - 16} width={120} height={6} fill="#7C8798" />
            <line x1={cx} y1={pistonY + 20} x2={px} y2={py} stroke="#94A3B8" strokeWidth={20} strokeLinecap="round" />
            <circle cx={cx} cy={crankY} r={r + 22} fill="#1B2C42" stroke="#3A536F" strokeWidth={5} />
            <line x1={cx} y1={crankY} x2={px} y2={py} stroke="#64748B" strokeWidth={26} strokeLinecap="round" /><circle cx={px} cy={py} r={15} fill={accent} /><circle cx={cx} cy={crankY} r={18} fill="#CBD5E1" />
            <rect x={cx - 30} y={120} width={60} height={50} fill="#3A536F" /><circle cx={cx} cy={110} r={10 + 26 * fire} fill="#FFB36B" opacity={0.6 * fire} />
          </g>
        );
      })}
      <line x1={90} y1={640} x2={930} y2={640} stroke="#475569" strokeWidth={14} />
      <g transform={`translate(905 640) rotate(${(w * 180) / Math.PI})`}><circle r={74} fill="#334155" stroke="#7C8798" strokeWidth={8} />{teeth(14, 74)}<circle r={20} fill="#CBD5E1" /><rect x={-5} y={-66} width={10} height={132} fill="#7C8798" /></g>
      <path d="M 40 70 L 960 70" stroke="#3A536F" strokeWidth={30} /><path d="M 40 70 L 960 70" stroke={accent} strokeWidth={8} strokeDasharray="34 26" strokeDashoffset={-t * 120} />
      {[190, 395, 600, 805].map((x) => <rect key={x} x={x - 9} y={70} width={18} height={56} fill="#3A536F" />)}
      <g transform="translate(110 830)"><circle r={52} fill="#0B1522" stroke="#CBD5E1" strokeWidth={5} /><line x1={0} y1={0} x2={40 * Math.cos(-2.2 + 0.5 * Math.sin(t * 2.3))} y2={40 * Math.sin(-2.2 + 0.5 * Math.sin(t * 2.3))} stroke="#EF4444" strokeWidth={5} strokeLinecap="round" /><circle r={6} fill="#CBD5E1" /></g>
    </>
  );
};

const Tank: React.FC<P> = ({t, accent}) => (
  <>
    <rect width={W} height={H} fill="#0C1826" />
    <rect x={0} y={0} width={W} height={150} fill="#16314D" /><rect x={0} y={150} width={W} height={18} fill="#3A536F" />
    <rect x={120} y={168} width={760} height={640} rx={26} fill="#101B29" stroke="#3A536F" strokeWidth={16} />
    {[0, 1, 2, 3].map((i) => <rect key={i} x={120 + 152 * (i + 1) - 6} y={176} width={12} height={624} fill="#1B2C42" />)}
    <rect x={128} y={690} width={744} height={110} fill="#5A3B1E" opacity={0.75} /><rect x={128} y={684 + 4 * Math.sin(t * 1.3)} width={744} height={12} fill="#6B4725" opacity={0.7} />
    <rect x={430} y={132} width={140} height={44} fill="#0C1826" stroke="#F59E0B" strokeWidth={8} />
    <g stroke="#CBD5E1" strokeWidth={8}><line x1={470} y1={150} x2={470} y2={690} /><line x1={530} y1={150} x2={530} y2={690} />{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <line key={i} x1={470} y1={210 + i * 64} x2={530} y2={210 + i * 64} />)}</g>
    {Array.from({length: 46}, (_, i) => {
      const bx = 160 + rnd(i, 1) * 680 + 26 * Math.sin(t * (0.5 + rnd(i, 2)) + i);
      const by = 660 - ((t * (16 + rnd(i, 3) * 26) + rnd(i, 4) * 460) % 460);
      const toxic = i % 3 === 0;
      return <circle key={i} cx={bx} cy={by} r={8 + rnd(i, 5) * 16} fill={toxic ? '#EF4444' : '#FACC15'} opacity={0.16 + 0.26 * rnd(i, 6)} />;
    })}
    <g transform="translate(250 84)"><g transform={`rotate(${t * 420})`}>{[0, 1, 2].map((i) => <ellipse key={i} cx={0} cy={-26} rx={14} ry={28} fill="#CBD5E1" transform={`rotate(${i * 120})`} />)}</g><circle r={9} fill="#64748B" /><circle r={48} fill="none" stroke="#CBD5E1" strokeWidth={5} /></g>
    {[0, 1, 2].map((i) => <path key={i} d={`M ${330 + i * 30 + ((t * 60) % 30)} 84 l 22 0`} stroke={accent} strokeWidth={6} strokeLinecap="round" opacity={0.8} />)}
    <g transform="translate(760 20)"><rect width={200} height={116} rx={16} fill="#0B1522" stroke={accent} strokeWidth={5} /><text x={18} y={38} fontFamily="Inter, sans-serif" fontWeight={700} fontSize={24} fill={accent}>O2 % VOL</text><text x={18} y={96} fontFamily="Poppins, sans-serif" fontWeight={700} fontSize={56} fill="#FFFFFF">{(20.9 - 4.5 * Math.max(0, Math.sin(t * 0.7))).toFixed(1)}</text><circle cx={170} cy={30} r={10} fill={Math.sin(t * 0.7) > 0.3 ? '#EF4444' : '#22C55E'} opacity={0.6 + 0.4 * Math.sin(t * 8)} /></g>
  </>
);

const Globe: React.FC<P> = ({t, accent, id}) => {
  const cx = W / 2;
  const cy = H / 2 + 10;
  const R = 350;
  const rot = t * 0.35;
  const pt = (lon: number, lat: number) => {
    const l = lon + rot;
    return {x: cx + R * Math.cos(lat) * Math.sin(l), y: cy - R * Math.sin(lat), front: Math.cos(l) * Math.cos(lat) > 0};
  };
  return (
    <>
      <defs><radialGradient id={`gl${id}`} cx="38%" cy="32%"><stop offset="0%" stopColor="#2A8FB8" /><stop offset="100%" stopColor="#0B2F52" /></radialGradient><clipPath id={`gc${id}`}><circle cx={cx} cy={cy} r={R} /></clipPath></defs>
      <rect width={W} height={H} fill="#06162B" />
      {Array.from({length: 40}, (_, i) => <circle key={i} cx={rnd(i, 1) * W} cy={rnd(i, 2) * H} r={1.5 + rnd(i, 3) * 2.5} fill="#FFFFFF" opacity={0.25 + 0.4 * Math.abs(Math.sin(t * (0.6 + rnd(i, 4)) + i))} />)}
      <circle cx={cx} cy={cy} r={R + 26 + 8 * Math.sin(t * 1.3)} fill="none" stroke={accent} strokeOpacity={0.25} strokeWidth={3} />
      <circle cx={cx} cy={cy} r={R} fill={`url(#gl${id})`} />
      <g clipPath={`url(#gc${id})`}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = rot + (i * Math.PI) / 6;
          return <ellipse key={i} cx={cx} cy={cy} rx={Math.abs(R * Math.sin(a))} ry={R} fill="none" stroke="#BFE6F5" strokeOpacity={0.3} strokeWidth={2} />;
        })}
        {[-60, -30, 0, 30, 60].map((lat) => <ellipse key={lat} cx={cx} cy={cy - R * Math.sin((lat * Math.PI) / 180)} rx={R * Math.cos((lat * Math.PI) / 180)} ry={R * Math.cos((lat * Math.PI) / 180) * 0.12} fill="none" stroke="#BFE6F5" strokeOpacity={0.3} strokeWidth={2} />)}
        {Array.from({length: 9}, (_, i) => {
          const p = pt(rnd(i, 1) * TAU, (rnd(i, 2) - 0.5) * 2.0);
          return p.front ? <ellipse key={i} cx={p.x} cy={p.y} rx={60 + rnd(i, 3) * 70} ry={36 + rnd(i, 4) * 40} fill="#3FB58A" opacity={0.5} transform={`rotate(${rnd(i, 5) * 90} ${p.x} ${p.y})`} /> : null;
        })}
        {Array.from({length: 5}, (_, i) => {
          const p = pt(i * 1.26 + 0.4, 0.75 - i * 0.33);
          const k = (t * 0.6 + i * 0.2) % 1;
          return p.front ? <g key={i}><circle cx={p.x} cy={p.y} r={14 + k * 60} fill="none" stroke={accent} strokeWidth={5} opacity={1 - k} /><circle cx={p.x} cy={p.y} r={12} fill={accent} /></g> : null;
        })}
      </g>
      {[0, 1].map((i) => {
        const a = t * (0.5 + i * 0.22) + i * 2.4;
        const x = cx + (R + 70) * Math.cos(a);
        const y = cy + (R + 70) * Math.sin(a) * 0.36;
        return <g key={i} opacity={Math.sin(a) > -0.2 ? 1 : 0.25}><path d={`M ${x - 26} ${y - 8} L ${x + 16} ${y - 8} L ${x + 30} ${y} L ${x + 16} ${y + 8} L ${x - 26} ${y + 8} Z`} fill="#FFFFFF" /><line x1={x - 30} y1={y} x2={x - 90} y2={y} stroke="#FFFFFF" strokeWidth={3} strokeDasharray="6 8" opacity={0.6} /></g>;
      })}
    </>
  );
};

const Lighthouse: React.FC<P> = ({t, accent}) => {
  const a = Math.sin(t * 0.9);
  const beam = (dir: number, o: number) => <path d={`M 250 250 L ${250 + dir * 900} ${250 - 190} L ${250 + dir * 900} ${250 + 150} Z`} fill="#FFF3B0" opacity={o} />;
  return (
    <>
      <rect width={W} height={H} fill="#07162A" />
      {Array.from({length: 46}, (_, i) => <circle key={i} cx={rnd(i, 1) * W} cy={rnd(i, 2) * 480} r={1.5 + rnd(i, 3) * 2.4} fill="#FFFFFF" opacity={0.3 + 0.5 * Math.abs(Math.sin(t * (0.7 + rnd(i, 4)) + i))} />)}
      <g transform="translate(250 0)">
      {beam(1, 0.5 * Math.max(0, a) ** 2)}{beam(-1, 0.5 * Math.max(0, -a) ** 2)}
      <circle cx={250} cy={250} r={46 + 60 * Math.abs(a)} fill="#FFF3B0" opacity={0.22} />
      <path d="M 205 290 L 295 290 L 318 640 L 182 640 Z" fill="#F1F5F9" /><path d="M 199 380 L 301 380 L 307 470 L 193 470 Z" fill={C.red} /><path d="M 187 560 L 313 560 L 318 640 L 182 640 Z" fill={C.red} />
      <rect x={196} y={270} width={108} height={22} fill="#0B1F3A" /><rect x={214} y={214} width={72} height={58} fill="#FFF3B0" opacity={0.75 + 0.25 * Math.abs(a)} /><path d="M 204 214 L 296 214 L 250 168 Z" fill="#0B1F3A" />
      <path d="M 60 700 Q 120 610 200 630 L 330 630 Q 420 640 470 710 Z" fill="#111E30" />
      </g>
      <path d={wavePath(690, 12, 130, t * 0.6)} fill="#0F3B5C" /><path d={wavePath(745, 16, 100, -t * 0.9 + 2)} fill="#0C2F4B" />
      <g transform={`translate(${((t * 22) % (W + 300)) - 120} ${722 + 6 * Math.sin(t * 1.5)})`}><path d="M -70 -10 L 70 -10 L 54 16 L -58 16 Z" fill="#0B1522" /><rect x={-50} y={-38} width={30} height={28} fill="#1E293B" /><circle cx={-35} cy={-46} r={5} fill="#FFFFFF" /><circle cx={60} cy={-14} r={5} fill="#22FF66" /></g>
      <path d={wavePath(805, 20, 82, t * 1.3)} fill="#082338" />
      <rect x={0} y={0} width={W} height={H} fill={accent} opacity={0.03} />
    </>
  );
};

const MAP: Record<Motif, React.FC<P>> = {voyage: Voyage, radar: Radar, chart: Chart, engine: Engine, tank: Tank, globe: Globe, lighthouse: Lighthouse, ...EXTRA_MOTIFS};

export {pickMotif} from '../../shared/motifs';

/** Stable 32-bit hash of a string. */
const hash = (str: string) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
};

/** The animated picture itself. `seed` (the video id) gives every video its own camera move, framing,
 * colour grade and animation phase, and each scene of a video moves differently from the one before. */
export const MotifArt: React.FC<{motif: Motif; t: number; seconds: number; accent: string; id: string; width: number; height: number; dim?: number; seed?: string; index?: number}> = ({motif, t, seconds, accent, id, width, height, dim = 0, seed = '', index = 0}) => {
  const M = MAP[motif] ?? Voyage;
  const k = Math.min(1, t / Math.max(1, seconds));
  const e = k * k * (3 - 2 * k);
  const safeId = id.replace(/[^a-zA-Z0-9]/g, '');
  const h = hash(`${seed}|${motif}`);
  const move = (h + index * 3) % 6;
  const zoom = 1.14 + ((h >>> 3) % 5) * 0.04;
  const fx = (((h >>> 6) % 7) - 3) * 22;
  const fy = (((h >>> 9) % 5) - 2) * 18;
  const hue = (((h >>> 12) % 9) - 4) * 4.5;
  const sat = 0.95 + ((h >>> 16) % 5) * 0.07;
  const phase = ((h >>> 20) % 9) * 1.37;
  let s = zoom;
  let dx = fx;
  let dy = fy;
  if (move === 0) s = zoom + 0.08 * e;
  else if (move === 1) s = zoom + 0.1 - 0.08 * e;
  else if (move === 2) dx = fx - 50 + 100 * e;
  else if (move === 3) dx = fx + 50 - 100 * e;
  else if (move === 4) dy = fy + 40 - 80 * e;
  else { dx = fx - 40 + 80 * e; dy = fy + 30 - 60 * e; s = zoom + 0.04 * e; }
  // never show the edge of the art: keep the pan inside the zoom margin
  const mx = ((s - 1) * W) / (2 * s) - 4;
  const my = ((s - 1) * H) / (2 * s) - 4;
  dx = Math.max(-mx, Math.min(mx, dx));
  dy = Math.max(-my, Math.min(my, dy));
  const hr = (hue * Math.PI) / 180;
  const cos = Math.cos(hr);
  const sin = Math.sin(hr);
  // hue rotation and saturation as one colour matrix (keeps the art on-brand, only shifts its grade)
  const m = [
    0.213 + cos * 0.787 - sin * 0.213, 0.715 - cos * 0.715 - sin * 0.715, 0.072 - cos * 0.072 + sin * 0.928,
    0.213 - cos * 0.213 + sin * 0.143, 0.715 + cos * 0.285 + sin * 0.14, 0.072 - cos * 0.072 - sin * 0.283,
    0.213 - cos * 0.213 - sin * 0.787, 0.715 - cos * 0.715 + sin * 0.715, 0.072 + cos * 0.928 + sin * 0.072,
  ];
  const sm = (r: number, c: number) => {
    const lum = [0.213, 0.715, 0.072][c];
    return (r === c ? sat : 0) + lum * (1 - sat);
  };
  const mat = [0, 1, 2].map((r) => [0, 1, 2].map((c) => [0, 1, 2].reduce((acc, j) => acc + sm(r, j) * m[j * 3 + c], 0)));
  const values = `${mat[0].join(' ')} 0 0 ${mat[1].join(' ')} 0 0 ${mat[2].join(' ')} 0 0 0 0 0 1 0`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={{position: 'absolute', left: 0, top: 0, display: 'block'}}>
      <defs><filter id={`grade${safeId}`} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values={values} /></filter></defs>
      <g filter={`url(#grade${safeId})`}>
        <g transform={`translate(${W / 2} ${H / 2}) scale(${s.toFixed(4)}) translate(${(-W / 2 + dx).toFixed(2)} ${(-H / 2 + dy).toFixed(2)})`}>
          <M t={t + phase} accent={accent} id={safeId} />
        </g>
      </g>
      {dim > 0 ? <rect width={W} height={H} fill="#041020" opacity={dim} /> : null}
    </svg>
  );
};

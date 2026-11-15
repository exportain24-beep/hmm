// "diagram" scene: a detailed, ship-related 2D explainer drawn from a list of elements on a 1000x800 canvas.
// Each element appears on the spoken word in its "on" field, so the picture builds up exactly as the voice explains.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {DiagramEl, SceneSpec, SceneTiming} from '../../shared/types';
import {Title, useScene, type SceneProps} from '../components/SceneShell';
import {C, clamp01, FONT_BODY, FONT_HEAD} from '../theme';

const VW = 1000;
const VH = 800;
const ink = '#0B1A2C';
const ease = (k: number) => k * k * (3 - 2 * k);
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, '');

/** Time (scene-local seconds) of each element's "on" word, matched in narration order. */
export const diagramTimes = (els: DiagramEl[], timing: SceneTiming): number[] => {
  let from = 0;
  return els.map((e, i) => {
    if (!e.on) return 0.15 + i * 0.04;
    const target = norm(e.on.split(/\s+/)[0] ?? '');
    const w = timing.words.find((x) => x.start - timing.start >= from - 1e-6 && norm(x.text) === target);
    const at = w ? w.start - timing.start : from + 0.5;
    from = at;
    return Math.max(0, at - 0.08);
  });
};
const wordTime = (word: string | undefined, timing: SceneTiming, after = 0): number | null => {
  if (!word) return null;
  const target = norm(word.split(/\s+/)[0] ?? '');
  const w = timing.words.find((x) => x.start - timing.start >= after - 1e-6 && norm(x.text) === target);
  return w ? w.start - timing.start : null;
};

// ---------- backgrounds ----------
const Backdrop: React.FC<{bg: string; t: number}> = ({bg, t}) => {
  if (bg === 'sea' || bg === 'night') {
    const night = bg === 'night';
    return (
      <g>
        <defs>
          <linearGradient id="dsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={night ? '#0A1530' : '#7CC3EA'} /><stop offset="1" stopColor={night ? '#1C2E57' : '#D7EEF8'} /></linearGradient>
          <linearGradient id="dsea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={night ? '#123A5C' : '#2F86B8'} /><stop offset="1" stopColor={night ? '#06182B' : '#0E4C78'} /></linearGradient>
        </defs>
        <rect width={VW} height={VH} fill="url(#dsky)" />
        {night ? Array.from({length: 30}, (_, i) => <circle key={i} cx={(i * 337) % VW} cy={(i * 131) % 300} r={1.6} fill="#fff" opacity={0.6} />) : <circle cx={850} cy={110} r={46} fill="#FFF3C4" opacity={0.9} />}
        <rect y={520} width={VW} height={280} fill="url(#dsea)" />
        <path d={`M0 520 ${Array.from({length: 26}, (_, i) => `L ${i * 40} ${520 + 5 * Math.sin(i * 0.9 + t * 2)}`).join(' ')} L 1000 520`} stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={3} fill="none" />
      </g>
    );
  }
  if (bg === 'chart') return (
    <g>
      <rect width={VW} height={VH} fill="#F3EBD3" />
      <path d="M0 0 L 380 0 C 330 120 420 250 330 380 C 260 470 300 620 220 800 L 0 800 Z" fill="#E7D49C" stroke="#7A6A3C" strokeWidth={3} />
      {[60, 120, 190].map((d, i) => <path key={i} d={`M ${380 + d} 0 C ${330 + d} 120 ${420 + d} 250 ${330 + d} 380 C ${260 + d} 470 ${300 + d} 620 ${220 + d} 800`} fill="none" stroke="#5B8DB8" strokeWidth={2} strokeDasharray={i === 1 ? '10 6' : undefined} opacity={0.7} />)}
      {Array.from({length: 18}, (_, i) => <text key={i} x={470 + ((i * 97) % 500)} y={60 + ((i * 173) % 700)} fontFamily={FONT_BODY} fontSize={20} fill="#5B6B7A" opacity={0.7}>{(i * 7) % 30 + 4}</text>)}
    </g>
  );
  if (bg === 'engine') return (
    <g>
      <rect width={VW} height={VH} fill="#1A2633" />
      {Array.from({length: 11}, (_, i) => <line key={i} x1={i * 100} y1={0} x2={i * 100} y2={VH} stroke="#22313F" strokeWidth={2} />)}
      {Array.from({length: 9}, (_, i) => <line key={i} x1={0} y1={i * 100} x2={VW} y2={i * 100} stroke="#22313F" strokeWidth={2} />)}
      <rect y={700} width={VW} height={100} fill="#243443" />
      {Array.from({length: 25}, (_, i) => <line key={i} x1={i * 40} y1={700} x2={i * 40} y2={800} stroke="#2E4050" strokeWidth={3} />)}
    </g>
  );
  if (bg === 'deck') return (
    <g>
      <rect width={VW} height={VH} fill="#9FD3F0" />
      <rect y={430} width={VW} height={370} fill="#5F7E66" />
      <rect y={430} width={VW} height={10} fill="#E8EEF2" />
      {Array.from({length: 12}, (_, i) => <line key={i} x1={i * 90} y1={440} x2={i * 90 - 120} y2={800} stroke="#56735C" strokeWidth={3} />)}
    </g>
  );
  // blueprint (default)
  return (
    <g>
      <rect width={VW} height={VH} fill="#0D2A4A" />
      {Array.from({length: 21}, (_, i) => <line key={i} x1={i * 50} y1={0} x2={i * 50} y2={VH} stroke="#FFFFFF" strokeOpacity={i % 4 ? 0.05 : 0.12} />)}
      {Array.from({length: 17}, (_, i) => <line key={i} x1={0} y1={i * 50} x2={VW} y2={i * 50} stroke="#FFFFFF" strokeOpacity={i % 4 ? 0.05 : 0.12} />)}
    </g>
  );
};

// ---------- shapes (drawn at local origin, scaled by s) ----------
type Draw = (e: DiagramEl, k: number, t: number, accent: string) => React.ReactNode;

const shipSide = (variant: string, len: number, color: string, t: number) => {
  const L = len;
  const H = L * 0.16;
  const hull = `M ${-L / 2} ${-H} L ${L / 2 - L * 0.06} ${-H} L ${L / 2} ${-H * 1.15} L ${L / 2 - L * 0.04} 0 L ${-L / 2 + L * 0.03} 0 Q ${-L / 2} 0 ${-L / 2} ${-H * 0.4} Z`;
  const deckY = -H;
  const sup = (x: number, w: number, h: number) => (
    <g>
      <rect x={x} y={deckY - h} width={w} height={h} fill="#F2F4F6" stroke={ink} strokeWidth={2} />
      {Array.from({length: Math.max(1, Math.floor(w / 18))}, (_, i) => <rect key={i} x={x + 6 + i * 18} y={deckY - h + 8} width={10} height={7} fill="#2E4A6A" />)}
      <rect x={x + w * 0.35} y={deckY - h - h * 0.45} width={w * 0.3} height={h * 0.45} fill="#D64532" stroke={ink} strokeWidth={2} />
    </g>
  );
  let cargo: React.ReactNode = null;
  if (variant === 'container') {
    const cols = ['#C8463A', '#2F6FB5', '#E0A32E', '#3D8F5A', '#8A5A9E', '#D9DDE2'];
    cargo = Array.from({length: 14}, (_, c) => Array.from({length: 3}, (_, r) => <rect key={`${c}${r}`} x={-L / 2 + L * 0.1 + c * L * 0.052} y={deckY - (r + 1) * H * 0.32} width={L * 0.05} height={H * 0.3} fill={cols[(c * 3 + r) % 6]} stroke={ink} strokeWidth={1} />));
  } else if (variant === 'tanker') {
    cargo = <g><rect x={-L / 2 + L * 0.08} y={deckY - 6} width={L * 0.7} height={6} fill="#9AA4AD" />{Array.from({length: 5}, (_, i) => <rect key={i} x={-L / 2 + L * 0.12 + i * L * 0.13} y={deckY - 18} width={6} height={18} fill="#C94A3A" />)}</g>;
  } else if (variant === 'bulk') {
    cargo = Array.from({length: 5}, (_, i) => <rect key={i} x={-L / 2 + L * 0.1 + i * L * 0.14} y={deckY - H * 0.25} width={L * 0.1} height={H * 0.25} fill="#2F5F8A" stroke={ink} strokeWidth={1.5} />);
  }
  const supX = variant === 'pilotboat' || variant === 'tug' ? -L * 0.15 : L / 2 - L * 0.22;
  const supW = variant === 'pilotboat' || variant === 'tug' ? L * 0.32 : L * 0.14;
  const supH = variant === 'pilotboat' || variant === 'tug' ? H * 0.9 : H * 1.4;
  return (
    <g transform={`translate(0 ${2 * Math.sin(t * 1.4)})`}>
      {cargo}
      {sup(supX - (variant === 'pilotboat' || variant === 'tug' ? 0 : 0), supW, supH)}
      <path d={hull} fill={color} stroke={ink} strokeWidth={3} />
      <path d={`M ${-L / 2 + 4} ${-H * 0.3} L ${L / 2 - L * 0.04} ${-H * 0.3} L ${L / 2 - L * 0.04} 0 L ${-L / 2 + L * 0.03} 0 Z`} fill="#A8382C" opacity={0.9} />
      {variant === 'pilotboat' ? <text x={-L * 0.3} y={-H * 0.5} fontFamily={FONT_HEAD} fontWeight={800} fontSize={H * 0.45} fill="#fff">PILOT</text> : null}
    </g>
  );
};

const shipTop = (len: number, color: string) => {
  const L = len;
  const B = L * 0.18;
  return (
    <g>
      <path d={`M ${L / 2} 0 Q ${L * 0.32} ${-B / 2} ${L * 0.15} ${-B / 2} L ${-L / 2} ${-B / 2} L ${-L / 2} ${B / 2} L ${L * 0.15} ${B / 2} Q ${L * 0.32} ${B / 2} ${L / 2} 0 Z`} fill={color} stroke={ink} strokeWidth={3} />
      <rect x={-L * 0.42} y={-B * 0.35} width={L * 0.16} height={B * 0.7} fill="#F2F4F6" stroke={ink} strokeWidth={2} />
      <circle cx={L * 0.3} cy={0} r={B * 0.08} fill="#F2F4F6" />
    </g>
  );
};


/** COLREG Part C light sets for a vessel 50 m or more in length (Rules 23-30); explicit fields override. */
const lightPreset = (status: string | undefined, makingWay: boolean): Partial<DiagramEl> => {
  const way = {sidelights: makingWay, stern: makingWay};
  switch (status) {
    case 'power': return {masthead: 2, sidelights: true, stern: true};
    case 'sailing': return {masthead: 0, sidelights: true, stern: true};
    case 'nuc': return {masthead: 0, allround: ['red', 'red'], ...way};
    case 'ram': return {masthead: makingWay ? 2 : 0, allround: ['red', 'white', 'red'], ...way};
    case 'cbd': return {masthead: 2, sidelights: true, stern: true, allround: ['red', 'red', 'red']};
    case 'anchored': return {masthead: 0, sidelights: false, stern: false, anchor: 2};
    case 'aground': return {masthead: 0, sidelights: false, stern: false, anchor: 2, allround: ['red', 'red']};
    case 'trawling': return {masthead: 2, allround: ['green', 'white'], ...way};
    case 'fishing': return {masthead: 0, allround: ['red', 'white'], ...way};
    case 'pilot': return {masthead: 0, allround: ['white', 'red'], sidelights: true, stern: true};
    case 'towing': return {masthead: 0, mastheadVertical: 2, sidelights: true, stern: true, towing: true};
    case 'towing-long': return {masthead: 0, mastheadVertical: 3, sidelights: true, stern: true, towing: true};
    default: return {};
  }
};

const SHAPES: Record<string, Draw> = {
  ship: (e, _k, t) => (e.view === 'top' ? shipTop(e.len ?? 300, e.color ?? '#20324F') : shipSide(e.variant ?? 'general', e.len ?? 520, e.color ?? '#20324F', t)),
  hull: (e) => {
    const w = e.w ?? 260;
    const h = e.h ?? 600;
    return (
      <g>
        <rect x={0} y={0} width={w} height={h} fill={e.color ?? '#20324F'} stroke={ink} strokeWidth={3} />
        <rect x={0} y={h * 0.82} width={w} height={h * 0.18} fill="#A8382C" />
        <rect x={0} y={-14} width={w} height={14} fill="#E8EEF2" stroke={ink} strokeWidth={2} />
        {Array.from({length: 8}, (_, i) => <line key={i} x1={0} y1={h * 0.1 * (i + 1)} x2={w} y2={h * 0.1 * (i + 1)} stroke="#FFFFFF" strokeOpacity={0.06} strokeWidth={2} />)}
      </g>
    );
  },
  quay: (e) => <g><rect x={0} y={0} width={e.w ?? 400} height={e.h ?? 160} fill="#9AA0A6" stroke={ink} strokeWidth={3} /><rect x={0} y={0} width={e.w ?? 400} height={10} fill="#F5C518" /></g>,
  seabed: (e) => <path d={`M -10 0 C 200 ${-(e.h ?? 30)} 400 ${e.h ?? 30} 600 0 S 900 ${-(e.h ?? 30)} 1010 0 L 1010 200 L -10 200 Z`} fill="#A08356" stroke={ink} strokeWidth={2} />,
  ladder: (e, k) => {
    const len = e.len ?? 320;
    const rungs = Math.floor(len / 31);
    const shown = Math.round(rungs * clamp01(k * 1.15));
    return (
      <g>
        <line x1={0} y1={0} x2={0} y2={len} stroke="#C9A26B" strokeWidth={6} />
        <line x1={48} y1={0} x2={48} y2={len} stroke="#C9A26B" strokeWidth={6} />
        {Array.from({length: shown}, (_, i) => {
          const spreader = (i + 1) % 9 === 5;
          return <rect key={i} x={spreader ? -40 : -6} y={i * 31 + 12} width={spreader ? 128 : 60} height={spreader ? 10 : 8} rx={3} fill={spreader ? '#E0A32E' : '#8A5A36'} stroke={ink} strokeWidth={1.5} />;
        })}
      </g>
    );
  },
  person: (e) => (
    <g fill={e.color ?? '#F26B1D'} stroke={ink} strokeWidth={2}>
      <circle cx={0} cy={-62} r={13} />
      <rect x={-13} y={-46} width={26} height={44} rx={8} />
      <rect x={-12} y={-4} width={9} height={36} rx={4} /><rect x={3} y={-4} width={9} height={36} rx={4} />
      <rect x={-24} y={-44} width={9} height={34} rx={4} transform="rotate(-12 -20 -44)" /><rect x={15} y={-44} width={9} height={34} rx={4} transform="rotate(12 20 -44)" />
    </g>
  ),
  lifeboat: (e, _k, t) => (
    <g transform={`rotate(${e.r ? 0 : 1.5 * Math.sin(t * 1.3)})`}>
      <path d="M -120 -30 Q 0 -80 120 -30 L 128 22 Q 0 52 -128 22 Z" fill={e.color ?? '#F26B1D'} stroke={ink} strokeWidth={3} />
      <rect x={-118} y={8} width={236} height={18} fill="#F4F4F0" />
      {[0, 1, 2, 3].map((i) => <circle key={i} cx={-66 + i * 44} cy={-18} r={8} fill="#1D2B4F" />)}
      <rect x={-12} y={-70} width={24} height={10} fill="#E8B93A" />
    </g>
  ),
  davit: () => <g fill="none" stroke="#DFE3E8" strokeWidth={14} strokeLinecap="round"><path d="M 0 0 L 0 -140 Q 0 -170 40 -170 L 120 -170" /><line x1={120} y1={-170} x2={120} y2={-120} strokeWidth={3} /></g>,
  liferaft: () => <g><rect x={-60} y={-30} width={120} height={60} rx={30} fill="#F4F4F0" stroke={ink} strokeWidth={3} /><line x1={-60} y1={0} x2={60} y2={0} stroke={ink} strokeWidth={2} /><rect x={-14} y={-38} width={28} height={10} fill="#F26B1D" /></g>,
  lifebuoy: () => <g><circle r={40} fill="none" stroke="#F26B1D" strokeWidth={18} /><circle r={40} fill="none" stroke="#fff" strokeWidth={18} strokeDasharray="31.4 31.4" /></g>,
  anchor: (e) => (
    <g>
      {e.chain ? Array.from({length: Math.floor(e.chain / 22)}, (_, i) => <ellipse key={i} cx={0} cy={-e.chain! + i * 22} rx={i % 2 ? 4 : 8} ry={11} fill="none" stroke="#94A3B8" strokeWidth={4} />) : null}
      <rect x={-6} y={0} width={12} height={70} fill="#475569" />
      <rect x={-34} y={12} width={68} height={10} fill="#475569" />
      <path d="M -60 52 Q 0 110 60 52 L 46 46 Q 0 88 -46 46 Z" fill="#475569" stroke={ink} strokeWidth={2} />
    </g>
  ),
  bollard: () => <g fill="#2B2F36" stroke={ink} strokeWidth={2}><rect x={-40} y={-6} width={80} height={12} /><rect x={-30} y={-46} width={18} height={40} rx={4} /><rect x={12} y={-46} width={18} height={40} rx={4} /></g>,
  winch: () => <g stroke={ink} strokeWidth={2}><rect x={-60} y={-30} width={120} height={50} fill="#2F5F8A" /><circle cx={0} cy={-5} r={34} fill="#94A3B8" /><circle cx={0} cy={-5} r={12} fill="#2B2F36" /></g>,
  engine: (e) => (
    <g stroke={ink} strokeWidth={2}>
      <rect x={-200} y={-150} width={400} height={150} fill={e.color ?? '#3D6F8F'} />
      {Array.from({length: 6}, (_, i) => <g key={i}><rect x={-185 + i * 64} y={-200} width={52} height={50} fill="#9AA4AD" /><rect x={-165 + i * 64} y={-226} width={12} height={26} fill="#C94A3A" /></g>)}
      <rect x={-200} y={-10} width={400} height={18} fill="#2C5068" />
      <rect x={-150} y={-120} width={110} height={34} fill="#E8E2C8" />
    </g>
  ),
  pump: (_e, _k, t) => <g stroke={ink} strokeWidth={2}><circle r={50} fill="#2F5F8A" /><g transform={`rotate(${t * 300})`}>{[0, 1, 2, 3, 4].map((i) => <path key={i} d="M 0 0 Q 20 -14 40 -6" stroke="#CBD5E1" strokeWidth={7} fill="none" transform={`rotate(${i * 72})`} />)}</g><circle r={10} fill="#CBD5E1" /><rect x={-60} y={46} width={120} height={18} fill="#334155" /></g>,
  valve: (e) => <g stroke={ink} strokeWidth={2}><path d="M -26 -18 L 26 18 L 26 -18 L -26 18 Z" fill={e.color ?? '#DC2626'} /><rect x={-4} y={-52} width={8} height={34} fill="#94A3B8" /><rect x={-26} y={-60} width={52} height={10} rx={5} fill={e.color ?? '#DC2626'} /></g>,
  pipe: (e, _k, t) => {
    const pts = e.points ?? [[0, 0], [200, 0]];
    const d = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ');
    return <g><path d={d} stroke="#334155" strokeWidth={30} fill="none" strokeLinejoin="round" /><path d={d} stroke="#1E3A5F" strokeWidth={18} fill="none" strokeLinejoin="round" />{e.flow ? <path d={d} stroke={e.color ?? '#38BDF8'} strokeWidth={6} fill="none" strokeDasharray="20 22" strokeDashoffset={-t * 120} /> : null}</g>;
  },
  tank: (e, k) => {
    const w = e.w ?? 260;
    const h = e.h ?? 320;
    const lvl = clamp01(e.level ?? 0.5) * ease(k);
    return (
      <g>
        <rect x={0} y={0} width={w} height={h} rx={18} fill="#1E293B" stroke={ink} strokeWidth={4} />
        <rect x={6} y={h - 6 - (h - 12) * lvl} width={w - 12} height={(h - 12) * lvl} rx={12} fill={e.color ?? '#38BDF8'} opacity={0.85} />
        <rect x={w / 2 - 30} y={-24} width={60} height={24} fill="#475569" stroke={ink} strokeWidth={2} />
      </g>
    );
  },
  gauge: (e, k) => {
    const v = clamp01(e.value ?? 0.6) * ease(k);
    const a = -Math.PI * 1.2 + Math.PI * 1.4 * v;
    return (
      <g>
        <circle r={70} fill="#0B1522" stroke="#CBD5E1" strokeWidth={6} />
        {e.danger != null ? <path d={`M ${56 * Math.cos(-Math.PI * 1.2 + Math.PI * 1.4 * e.danger)} ${56 * Math.sin(-Math.PI * 1.2 + Math.PI * 1.4 * e.danger)} A 56 56 0 0 1 ${56 * Math.cos(Math.PI * 0.2)} ${56 * Math.sin(Math.PI * 0.2)}`} stroke="#EF4444" strokeWidth={10} fill="none" /> : null}
        <line x1={0} y1={0} x2={52 * Math.cos(a)} y2={52 * Math.sin(a)} stroke="#F8FAFC" strokeWidth={6} strokeLinecap="round" />
        <circle r={8} fill="#CBD5E1" />
        {e.text ? <text y={40} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={20} fill="#CBD5E1">{e.text}</text> : null}
      </g>
    );
  },
  detector: (e, _k, t) => (
    <g>
      <rect x={-50} y={-80} width={100} height={160} rx={16} fill="#F5C518" stroke={ink} strokeWidth={3} />
      <rect x={-38} y={-62} width={76} height={50} rx={6} fill="#0B2236" />
      <text x={0} y={-28} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={24} fill={e.color ?? '#3FD38A'}>{e.text ?? '20.9%'}</text>
      <circle cx={0} cy={30} r={14} fill={e.color === '#EF4444' && Math.sin(t * 10) > 0 ? '#EF4444' : '#334155'} />
    </g>
  ),
  extinguisher: () => <g stroke={ink} strokeWidth={2}><rect x={-22} y={-90} width={44} height={110} rx={18} fill="#C62828" /><rect x={-10} y={-108} width={20} height={20} fill="#334155" /><path d="M 10 -100 Q 40 -110 44 -80" stroke="#334155" strokeWidth={6} fill="none" /></g>,
  fire: (e, _k, t) => {
    const s = e.size ?? 100;
    const h = s * (1 + 0.15 * Math.sin(t * 9));
    return <g><path d={`M ${-s * 0.5} 0 C ${-s * 0.6} ${-h * 0.5} ${-s * 0.1} ${-h * 0.6} 0 ${-h} C ${s * 0.15} ${-h * 0.6} ${s * 0.65} ${-h * 0.5} ${s * 0.5} 0 Z`} fill="#F97316" /><path d={`M ${-s * 0.28} 0 C ${-s * 0.3} ${-h * 0.35} 0 ${-h * 0.4} 0 ${-h * 0.66} C ${s * 0.1} ${-h * 0.4} ${s * 0.35} ${-h * 0.35} ${s * 0.28} 0 Z`} fill="#FDE047" /></g>;
  },
  smoke: (_e, _k, t) => <g>{Array.from({length: 12}, (_, i) => { const k = (t * 0.25 + i / 12) % 1; return <circle key={i} cx={30 * Math.sin(i * 2.1) + 60 * k * Math.sin(i)} cy={-k * 260} r={20 + 50 * k} fill="#64748B" opacity={0.5 * (1 - k)} />; })}</g>,
  buoy: (e) => {
    const k = e.variant ?? 'port';
    const col = k === 'starboard' ? '#16A34A' : k === 'port' ? '#DC2626' : k === 'special' ? '#EAB308' : '#111827';
    const top = k === 'starboard' ? <path d="M -16 -96 L 16 -96 L 0 -122 Z" fill={col} /> : k === 'port' ? <rect x={-14} y={-118} width={28} height={22} fill={col} /> : k.startsWith('n') ? <g fill="#111827"><path d="M -14 -100 L 14 -100 L 0 -122 Z" /><path d="M -14 -124 L 14 -124 L 0 -146 Z" /></g> : null;
    const body = k === 'north' || k === 'south' || k === 'east' || k === 'west' ? <g><rect x={-26} y={-90} width={52} height={45} fill={k === 'north' || k === 'east' ? '#111827' : '#EAB308'} /><rect x={-26} y={-45} width={52} height={45} fill={k === 'north' || k === 'east' ? '#EAB308' : '#111827'} /></g> : <path d="M -28 0 L -18 -90 L 18 -90 L 28 0 Z" fill={col} stroke={ink} strokeWidth={2} />;
    return <g>{body}<rect x={-3} y={-96} width={6} height={10} fill="#334155" />{top}</g>;
  },
  light: (e, _k, t) => <g><circle r={18} fill={e.color ?? '#FDE047'} /><circle r={18 + 30 * ((t * 0.8) % 1)} fill="none" stroke={e.color ?? '#FDE047'} strokeWidth={3} opacity={1 - ((t * 0.8) % 1)} /></g>,
  sector: (e) => {
    const r = e.r2 ?? 220;
    const a0 = ((e.from ?? -112.5) - 90) * Math.PI / 180;
    const a1 = ((e.to ?? 112.5) - 90) * Math.PI / 180;
    const big = Math.abs((e.to ?? 112.5) - (e.from ?? -112.5)) > 180 ? 1 : 0;
    return <path d={`M 0 0 L ${r * Math.cos(a0)} ${r * Math.sin(a0)} A ${r} ${r} 0 ${big} 1 ${r * Math.cos(a1)} ${r * Math.sin(a1)} Z`} fill={e.color ?? '#FDE047'} opacity={0.28} stroke={e.color ?? '#FDE047'} strokeWidth={2} />;
  },
  compass: (_e, _k, t) => <g><circle r={90} fill="#F8FAFC" stroke={ink} strokeWidth={4} />{['N', 'E', 'S', 'W'].map((d, i) => <text key={d} x={68 * Math.sin(i * Math.PI / 2)} y={-68 * Math.cos(i * Math.PI / 2) + 9} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={24} fill={i ? ink : '#DC2626'}>{d}</text>)}<g transform={`rotate(${8 * Math.sin(t)})`}><path d="M 0 -50 L 10 0 L 0 50 L -10 0 Z" fill="#DC2626" /><path d="M 0 0 L 10 0 L 0 50 L -10 0 Z" fill={ink} /></g></g>,
  radar: (_e, _k, t) => <g><circle r={120} fill="#022C22" stroke="#14532D" strokeWidth={5} />{[40, 80].map((r) => <circle key={r} r={r} fill="none" stroke="#2BD46B" strokeOpacity={0.35} />)}<line x1={0} y1={0} x2={120 * Math.sin(t * 2)} y2={-120 * Math.cos(t * 2)} stroke="#4ADE80" strokeWidth={4} /><circle cx={50} cy={-40} r={6} fill="#86EFAC" /><circle cx={-30} cy={60} r={6} fill="#86EFAC" /></g>,
  clock: (e, k) => {
    const h = (e.value ?? 0.5) * 24 * ease(clamp01(k));
    const a = (h / 24) * Math.PI * 2 - Math.PI / 2;
    return <g><circle r={90} fill="#0F172A" stroke="#CBD5E1" strokeWidth={6} />{Array.from({length: 24}, (_, i) => { const b = (i / 24) * Math.PI * 2 - Math.PI / 2; return <line key={i} x1={78 * Math.cos(b)} y1={78 * Math.sin(b)} x2={(i % 6 ? 70 : 62) * Math.cos(b)} y2={(i % 6 ? 70 : 62) * Math.sin(b)} stroke="#94A3B8" strokeWidth={i % 6 ? 2 : 4} />; })}<line x1={0} y1={0} x2={60 * Math.cos(a)} y2={60 * Math.sin(a)} stroke="#F8FAFC" strokeWidth={6} strokeLinecap="round" /><circle r={8} fill="#F8FAFC" /></g>;
  },
  doc: (e) => <g><rect x={-80} y={-100} width={160} height={200} rx={8} fill="#FEF3C7" stroke="#D97706" strokeWidth={4} />{Array.from({length: 6}, (_, i) => <rect key={i} x={-58} y={-60 + i * 24} width={i % 2 ? 90 : 116} height={8} rx={4} fill="#D6B98C" />)}<text x={0} y={-74} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={18} fill="#92400E">{e.text ?? 'CERTIFICATE'}</text></g>,
  container: (e) => <g><rect x={-80} y={-40} width={160} height={80} fill={e.color ?? '#C8463A'} stroke={ink} strokeWidth={3} />{Array.from({length: 7}, (_, i) => <line key={i} x1={-70 + i * 23} y1={-34} x2={-70 + i * 23} y2={34} stroke={ink} strokeOpacity={0.3} strokeWidth={3} />)}</g>,
  hatch: () => <g><rect x={-140} y={-30} width={280} height={30} fill="#2F5F8A" stroke={ink} strokeWidth={3} /><rect x={-150} y={0} width={300} height={14} fill="#334155" /></g>,
  ecdis: (e, _k, t) => <g><rect x={-170} y={-120} width={340} height={240} rx={14} fill="#020617" stroke="#334155" strokeWidth={6} /><rect x={-155} y={-105} width={310} height={210} fill="#0C4A6E" /><path d="M -155 60 C -60 20 0 90 155 30 L 155 105 L -155 105 Z" fill="#E9D8A6" /><path d="M -130 -70 L 120 0" stroke="#FF4FA3" strokeWidth={4} strokeDasharray="12 8" /><path d="M -155 40 C -60 0 0 70 155 10" stroke={e.color ?? '#38BDF8'} strokeWidth={4} fill="none" /><circle cx={-130 + ((t * 25) % 250)} cy={-70 + ((t * 25) % 250) * 0.28} r={8} fill="#F97316" /></g>,

  // COLREG: a vessel at night seen from a relative bearing (0 = from right ahead, 90 = her starboard beam,
  // 180 = right astern, 270 = her port beam). Which lights show is computed from the COLREG arcs:
  // masthead and sidelights 112.5 deg from ahead, sternlight 135 deg astern, all-round lights always.
  nightvessel: (e0, k, t) => {
    const e = {...lightPreset(e0.status, e0.makingWay !== false), ...Object.fromEntries(Object.entries(e0).filter(([, v]) => v !== undefined))} as DiagramEl;
    const b = (((e.bearing ?? 0) % 360) + 360) % 360;
    const L = e.len ?? 420;
    const fore = b <= 112.5 || b >= 247.5;
    const showGreen = b <= 112.5;
    const showRed = b >= 247.5 || b === 0;
    const showStern = b >= 112.5 && b <= 247.5;
    // foreshortening: side-on at the beam, a narrow silhouette head-on or from astern
    const side = Math.abs(Math.sin((b * Math.PI) / 180));
    const half = (L / 2) * Math.max(0.16, side);
    const bowRight = b < 180; // her starboard side faces us: bow on the right
    const bowX = (bowRight ? 1 : -1) * half;
    const sternX = -bowX;
    const H = L * 0.13;
    const glow = (x: number, y: number, c: string, key: string, r = 13) => (
      <g key={key}>
        <circle cx={x} cy={y} r={r * 3.2} fill={c} opacity={0.18 + 0.05 * Math.sin(t * 3)} />
        <circle cx={x} cy={y} r={r} fill={c} />
        <circle cx={x} cy={y} r={r * 0.45} fill="#FFFFFF" opacity={0.8} />
      </g>
    );
    const col: Record<string, string> = {white: '#F8FAFC', red: '#FF3B3B', green: '#22E06B', yellow: '#FFD23F', blue: '#4FA3FF'};
    const lights: React.ReactNode[] = [];
    const mastX = bowX * 0.45;
    const mast2X = sternX * 0.25;
    if (e.mastheadVertical) { if (fore) for (let i = 0; i < e.mastheadVertical; i++) lights.push(glow(mastX, -H - 70 - i * 44, col.white, `mv${i}`)); }
    else {
      if (fore && (e.masthead ?? 1) >= 1) lights.push(glow(mastX, -H - 70, col.white, 'm1'));
      if (fore && (e.masthead ?? 1) >= 2) lights.push(glow(mast2X, -H - 120, col.white, 'm2'));
    }
    const sideY = -H - 18;
    if (e.sidelights !== false) {
      if (b === 0 || b === 360) { lights.push(glow(-half * 0.9 - 14, sideY, col.green, 'g')); lights.push(glow(half * 0.9 + 14, sideY, col.red, 'r')); }
      else {
        if (showGreen) lights.push(glow(bowX * 0.55, sideY, col.green, 'g'));
        if (showRed) lights.push(glow(bowX * 0.55, sideY, col.red, 'r'));
      }
    }
    if (showStern && e.stern !== false) lights.push(glow(sternX * 0.9, -H * 0.6, col.white, 's'));
    if (showStern && e.towing) lights.push(glow(sternX * 0.9, -H * 0.6 - 40, col.yellow, 'tw'));
    // all-round signal lights in a vertical line on their own mast, clear above the masthead lights
    const ar = e.allround ?? [];
    const arX = (mastX + mast2X) / 2;
    ar.forEach((c, i) => lights.push(glow(arX, -H - 175 - (ar.length - 1 - i) * 46, col[c] ?? c, `a${i}`)));
    if ((e.anchor ?? 0) >= 1) lights.push(glow(bowX * 0.85, -H - 40, col.white, 'an1'));
    if ((e.anchor ?? 0) >= 2) lights.push(glow(sternX * 0.85, -H - 10, col.white, 'an2', 11));
    return (
      <g opacity={0.35 + 0.65 * ease(clamp01(k * 1.5))}>
        <path d={`M ${-half} ${-H} L ${half} ${-H} L ${half * 0.92} 0 L ${-half * 0.92} 0 Z`} fill="#0B1220" stroke="#1E293B" strokeWidth={3} />
        <rect x={mast2X - 4} y={-H - 130} width={8} height={130} fill="#111827" />
        <rect x={mastX - 3} y={-H - 80} width={6} height={80} fill="#111827" />
        {(e.allround ?? []).length ? <rect x={(mastX + mast2X) / 2 - 4} y={-H - 190 - ((e.allround ?? []).length - 1) * 46} width={8} height={190 + ((e.allround ?? []).length - 1) * 46} fill="#111827" /> : null}
        {lights}
        <path d={`M ${-half * 1.4} 6 Q 0 18 ${half * 1.4} 6`} stroke="#FFFFFF" strokeOpacity={0.12} strokeWidth={3} fill="none" />
      </g>
    );
  },
  // COLREG day shapes, top to bottom: ball, cone-up, cone-down, cylinder, diamond
  dayshape: (e) => (
    <g>
      <line x1={0} y1={-10} x2={0} y2={(e.shapes?.length ?? 1) * 70 + 10} stroke="#334155" strokeWidth={4} />
      {(e.shapes ?? ['ball']).map((sh, i) => {
        const y = 30 + i * 70;
        const f = '#0B0F14';
        if (sh === 'ball') return <circle key={i} cx={0} cy={y} r={28} fill={f} />;
        if (sh === 'cone-up') return <path key={i} d={`M -30 ${y + 26} L 30 ${y + 26} L 0 ${y - 28} Z`} fill={f} />;
        if (sh === 'cone-down') return <path key={i} d={`M -30 ${y - 26} L 30 ${y - 26} L 0 ${y + 28} Z`} fill={f} />;
        if (sh === 'cylinder') return <rect key={i} x={-22} y={y - 30} width={44} height={60} rx={6} fill={f} />;
        return <path key={i} d={`M 0 ${y - 32} L 28 ${y} L 0 ${y + 32} L -28 ${y} Z`} fill={f} />;
      })}
    </g>
  ),
  // one line of a calculation (formula, substitution or result)
  eq: (e, k, _t, accent) => {
    const text = e.text ?? '';
    const w = Math.max(120, text.length * 19.5 + 52);
    const result = e.variant === 'result';
    return (
      <g transform={`translate(${(1 - ease(clamp01(k * 2))) * -30} 0)`}>
        <rect x={-w / 2} y={-34} width={w} height={64} rx={14} fill={result ? (e.color ?? accent) : '#0B1A2C'} stroke={e.color ?? accent} strokeWidth={3} />
        <text y={10} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={32} fill={result ? ink : '#F8FAFC'}>{text}</text>
      </g>
    );
  },

  // ---------- annotations ----------
  arrow: (e, k, _t, accent) => {
    const [x2, y2] = e.to ?? [e.x + 100, e.y];
    const dx = x2 - e.x;
    const dy = y2 - e.y;
    const len = Math.hypot(dx, dy) || 1;
    const p = ease(clamp01(k * 1.6));
    const ex = dx * p;
    const ey = dy * p;
    const ux = dx / len;
    const uy = dy / len;
    const c = e.color ?? accent;
    return <g><line x1={0} y1={0} x2={ex} y2={ey} stroke={c} strokeWidth={e.w ?? 8} strokeLinecap="round" /><path d={`M ${ex} ${ey} L ${ex - ux * 26 - uy * 15} ${ey - uy * 26 + ux * 15} L ${ex - ux * 26 + uy * 15} ${ey - uy * 26 - ux * 15} Z`} fill={c} opacity={p > 0.2 ? 1 : 0} /></g>;
  },
  dim: (e, k) => {
    const [x2, y2] = e.to ?? [e.x, e.y + 100];
    const dx = x2 - e.x;
    const dy = y2 - e.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len * 14;
    const ny = dx / len * 14;
    const p = ease(clamp01(k * 1.6));
    const c = e.color ?? '#FDE047';
    return (
      <g>
        <line x1={-nx} y1={-ny} x2={nx} y2={ny} stroke={c} strokeWidth={4} />
        <line x1={dx - nx} y1={dy - ny} x2={dx + nx} y2={dy + ny} stroke={c} strokeWidth={4} opacity={p > 0.95 ? 1 : 0} />
        <line x1={0} y1={0} x2={dx * p} y2={dy * p} stroke={c} strokeWidth={4} strokeDasharray="12 7" />
        {e.text ? <g transform={`translate(${dx / 2 + nx * 2.4} ${dy / 2 + ny * 2.4})`} opacity={clamp01(k * 2 - 0.6)}><rect x={-(e.text.length * 16.5 + 28) / 2} y={-24} width={e.text.length * 16.5 + 28} height={44} rx={10} fill={c} /><text y={9} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={26} fill={ink}>{e.text}</text></g> : null}
      </g>
    );
  },
  label: (e, k, _t, accent) => {
    const text = e.text ?? '';
    const w = Math.max(70, text.length * 18.5 + 40);
    const lead = e.to ? <line x1={0} y1={0} x2={(e.to[0] - e.x) * ease(clamp01(k * 1.6))} y2={(e.to[1] - e.y) * ease(clamp01(k * 1.6))} stroke={e.color ?? accent} strokeWidth={4} /> : null;
    return <g>{lead}{e.to ? <circle cx={e.to[0] - e.x} cy={e.to[1] - e.y} r={8} fill={e.color ?? accent} opacity={clamp01(k * 2 - 0.8)} /> : null}<rect x={-w / 2} y={-28} width={w} height={52} rx={12} fill={e.color ?? accent} stroke={ink} strokeWidth={2} /><text y={10} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={28} fill={ink}>{text}</text></g>;
  },
  text: (e) => <text textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={900} fontSize={e.size ?? 56} fill={e.color ?? '#FFFFFF'} stroke={ink} strokeWidth={2} paintOrder="stroke">{e.text}</text>,
  zone: (e, _k, t) => {
    const c = e.color ?? '#EF4444';
    const pulse = 0.22 + 0.1 * Math.sin(t * 4);
    if (e.points) return <path d={e.points.map((p, i) => `${i ? 'L' : 'M'} ${p[0] - e.x} ${p[1] - e.y}`).join(' ') + ' Z'} fill={c} opacity={pulse} stroke={c} strokeWidth={4} strokeDasharray="14 8" />;
    return <circle r={e.r2 ?? 80} fill={c} opacity={pulse} stroke={c} strokeWidth={4} strokeDasharray="14 8" />;
  },
  ring: (e, k, t, accent) => <circle r={(e.r2 ?? 60) * (0.6 + 0.4 * ease(clamp01(k * 2))) + 4 * Math.sin(t * 5)} fill="none" stroke={e.color ?? accent} strokeWidth={7} />,
  tick: (_e, k) => <g transform={`scale(${0.5 + 0.5 * ease(clamp01(k * 2))})`}><circle r={34} fill="#16A34A" /><path d="M -15 2 L -4 14 L 17 -12" stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" /></g>,
  cross: (_e, k) => <g transform={`scale(${0.5 + 0.5 * ease(clamp01(k * 2))})`}><circle r={34} fill="#DC2626" /><path d="M -13 -13 L 13 13 M 13 -13 L -13 13" stroke="#fff" strokeWidth={8} strokeLinecap="round" /></g>,
  badge: (e, k, _t, accent) => <g transform={`scale(${0.6 + 0.4 * ease(clamp01(k * 2))})`}><circle r={30} fill={e.color ?? accent} stroke={ink} strokeWidth={3} /><text y={11} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={900} fontSize={32} fill={ink}>{e.text ?? '1'}</text></g>,
  value: (e, k) => {
    const v = (e.from ?? 0) + ((e.to2 ?? 100) - (e.from ?? 0)) * ease(k);
    const s = v.toFixed(e.decimals ?? 0);
    return <g><text textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={900} fontSize={e.size ?? 84} fill={e.color ?? '#FDE047'} stroke={ink} strokeWidth={3} paintOrder="stroke">{s}<tspan fontSize={(e.size ?? 84) * 0.5}>{e.unit ?? ''}</tspan></text></g>;
  },
  path: (e, k, _t, accent) => {
    const pts = (e.points ?? [[0, 0], [200, 0]]).map((p) => [p[0] - e.x, p[1] - e.y]);
    const d = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ');
    const p = ease(k);
    const seg = Math.max(0, Math.min(pts.length - 1.0001, p * (pts.length - 1)));
    const i = Math.floor(seg);
    const f = seg - i;
    const mx = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f;
    const my = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f;
    const ang = (Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]) * 180) / Math.PI;
    return <g><path d={d} stroke={e.color ?? accent} strokeWidth={5} fill="none" strokeDasharray="16 10" />{e.mover ? <g transform={`translate(${mx} ${my}) rotate(${ang})`}>{e.mover === 'ship' ? shipTop(110, '#20324F') : <circle r={12} fill={e.color ?? accent} />}</g> : null}</g>;
  },
};

export const DIAGRAM_TYPES = Object.keys(SHAPES);

const Element: React.FC<{e: DiagramEl; t: number; at: number; timing: SceneTiming; accent: string}> = ({e, t, at, timing, accent}) => {
  // progress of the element's own animation: counters and movers take longer than a simple appear
  const dur = e.type === 'path' ? 2.6 : e.type === 'value' ? 1.4 : e.type === 'ladder' || e.type === 'tank' || e.type === 'gauge' ? 1.2 : 0.9;
  const k = clamp01((t - at) / dur);
  if (t < at) return null;
  const off = wordTime(e.off, timing, at);
  const fadeOut = off != null ? 1 - clamp01((t - off) / 0.4) : 1;
  if (fadeOut <= 0) return null;
  // optional move to a new position on a later word
  let x = e.x;
  let y = e.y;
  if (e.move) {
    const mt = wordTime(e.move.on, timing, at) ?? at + 1.5;
    const mk = ease(clamp01((t - mt) / (e.move.dur ?? 1.4)));
    x = x + (e.move.to[0] - x) * mk;
    y = y + (e.move.to[1] - y) * mk;
  }
  const appear = e.anim === 'none' ? 1 : ease(clamp01(((t - at) / 0.9) * 2.2));
  const pop = e.anim === 'pop' ? 0.6 + 0.4 * appear + 0.06 * Math.sin(Math.min(1, k * 2) * Math.PI) : 1;
  const slide = e.anim === 'slide' ? (1 - appear) * 60 : 0;
  const pulse = e.pulse ? 1 + 0.05 * Math.sin(t * 5) : 1;
  const s = (e.s ?? 1) * pop * pulse;
  const draw = SHAPES[e.type];
  if (!draw) return null;
  return (
    <g transform={`translate(${x} ${y + slide}) rotate(${e.r ?? 0}) scale(${(e.flip ? -1 : 1) * s} ${s})`} opacity={appear * fadeOut}>
      {draw(e, k, t, accent)}
    </g>
  );
};

/** The diagram picture itself (also used for previews). */
export const DiagramSvg: React.FC<{d: {bg?: string; elements: DiagramEl[]}; t: number; timing: SceneTiming; accent: string; width: number; height: number}> = ({d, t, timing, accent, width, height}) => {
  const times = diagramTimes(d.elements, timing);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <Backdrop bg={d.bg ?? 'blueprint'} t={t} />
      {d.elements.map((e, i) => <Element key={i} e={e} t={t} at={times[i]} timing={timing} accent={accent} />)}
    </svg>
  );
};

export const DiagramScene: React.FC<SceneProps> = ({scene, timing, accent}) => {
  const {frame, fps, t, L, vis} = useScene(timing);
  const d = scene.diagram ?? {elements: []};
  return (
    <AbsoluteFill style={{opacity: vis}}>
      <Title scene={scene} accent={accent} L={L} frame={frame} fps={fps} />
      <div style={{position: 'absolute', left: L.panel.x, top: L.panel.y, width: L.panel.w, height: L.panel.h, borderRadius: 34 * L.u, overflow: 'hidden', border: `3px solid ${C.white}2E`, boxShadow: '0 30px 80px rgba(0,0,0,0.5)'}}>
        <DiagramSvg d={d} t={t} timing={timing} accent={accent} width={L.panel.w} height={L.panel.h} />
      </div>
    </AbsoluteFill>
  );
};

export type {SceneSpec};

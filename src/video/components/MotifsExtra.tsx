// More animated maritime backdrops (same 1000x900 canvas and rules as Motifs.tsx: pure functions of t, SVG only).
import React from 'react';

export type MP = {t: number; accent: string; id: string};
const W = 1000;
const H = 900;
const rnd = (i: number, k = 1) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const wave = (y: number, amp: number, len: number, ph: number) => {
  let d = `M -20 ${y}`;
  for (let x = -20; x <= W + 20; x += 25) d += ` L ${x} ${(y + amp * Math.sin(x / len + ph)).toFixed(1)}`;
  return `${d} L ${W + 20} ${H + 20} L -20 ${H + 20} Z`;
};
const Gauge: React.FC<{x: number; y: number; r: number; v: number; color: string; label?: string}> = ({x, y, r, v, color, label}) => {
  const a = -Math.PI * 1.2 + Math.PI * 1.4 * v;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="#0B1522" stroke="#CBD5E1" strokeWidth={5} />
      <path d={`M ${r * 0.78 * Math.cos(-Math.PI * 1.2)} ${r * 0.78 * Math.sin(-Math.PI * 1.2)} A ${r * 0.78} ${r * 0.78} 0 1 1 ${r * 0.78 * Math.cos(Math.PI * 0.2)} ${r * 0.78 * Math.sin(Math.PI * 0.2)}`} fill="none" stroke={color} strokeWidth={6} opacity={0.55} />
      <line x1={0} y1={0} x2={r * 0.7 * Math.cos(a)} y2={r * 0.7 * Math.sin(a)} stroke="#F8FAFC" strokeWidth={5} strokeLinecap="round" />
      <circle r={7} fill="#CBD5E1" />
      {label ? <text y={r * 0.55} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={700} fontSize={r * 0.3} fill={color}>{label}</text> : null}
    </g>
  );
};

/** Ship alongside a quay: mooring lines tension and the snap-back zone pulses red. */
export const Mooring: React.FC<MP> = ({t, accent}) => {
  const surge = 10 * Math.sin(t * 0.6);
  const tension = 0.5 + 0.5 * Math.sin(t * 0.6);
  return (
    <>
      <rect width={W} height={H} fill="#13324F" />
      <path d={wave(420, 6, 90, t * 0.8)} fill="#1D5F86" />
      <rect x={0} y={640} width={W} height={260} fill="#6B7280" /><rect x={0} y={640} width={W} height={18} fill="#F59E0B" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={i * 150 + 20} y={670} width={110} height={6} fill="#4B5563" />)}
      <g transform={`translate(${surge} 0)`}>
        <path d="M 60 300 L 940 300 L 900 520 L 100 520 Z" fill="#0F2D4D" /><rect x={100} y={480} width={800} height={40} fill="#B4432E" />
        <rect x={140} y={200} width={160} height={100} fill="#F1F5F9" /><rect x={150} y={215} width={140} height={14} fill="#0F2D4D" />
        {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={340 + i * 110} y={240} width={96} height={60} fill={['#E2574C', '#3B82F6', '#22C55E', '#F59E0B', '#3B82F6'][i]} />)}
        <circle cx={180} cy={520} r={14} fill="#CBD5E1" /><circle cx={820} cy={520} r={14} fill="#CBD5E1" />
      </g>
      {[[180, 300], [820, 700]].map(([sx, bx], i) => {
        const x1 = sx + surge;
        const sag = 40 * (1 - tension);
        const mx = (x1 + bx) / 2;
        return (
          <g key={i}>
            <path d={`M ${mx - 150} 640 A 190 120 0 0 1 ${mx + 150} 640`} fill="#EF4444" opacity={0.15 + 0.3 * tension} />
            <path d={`M ${x1} 520 Q ${mx} ${600 + sag} ${bx} 648`} fill="none" stroke="#F8E7A1" strokeWidth={9} strokeDasharray={tension > 0.85 ? '22 6' : 'none'} />
            <g transform={`translate(${bx} 660)`}><rect x={-22} y={-30} width={44} height={44} rx={8} fill="#1F2937" /><ellipse cy={-30} rx={30} ry={10} fill="#374151" /></g>
          </g>
        );
      })}
      <g transform="translate(470 760)"><circle r={26} fill="#FACC15" /><rect x={-10} y={26} width={20} height={58} rx={8} fill={accent} /><circle r={26} fill="none" stroke="#EF4444" strokeWidth={5} opacity={tension} /></g>
    </>
  );
};

/** Emergency switchboard: alternator rotor, frequency and voltage gauges, breaker lamps. */
export const Generator: React.FC<MP> = ({t, accent}) => {
  const run = Math.min(1, Math.max(0, (t % 12) / 3));
  return (
    <>
      <rect width={W} height={H} fill="#101826" />
      <rect x={40} y={60} width={560} height={780} rx={18} fill="#1E2A3B" stroke="#334155" strokeWidth={8} />
      <Gauge x={180} y={210} r={90} v={0.1 + 0.62 * run} color="#22C55E" label="Hz" />
      <Gauge x={460} y={210} r={90} v={0.1 + 0.66 * run} color={accent} label="V" />
      {[0, 1, 2, 3].map((i) => {
        const on = run > 0.25 * (i + 1) - 0.05;
        return (
          <g key={i} transform={`translate(${130 + i * 120} 420)`}>
            <rect x={-44} y={-40} width={88} height={150} rx={10} fill="#0B1522" stroke="#475569" strokeWidth={4} />
            <circle cy={-6} r={22} fill={on ? '#22C55E' : '#7F1D1D'} opacity={on ? 0.7 + 0.3 * Math.sin(t * 6 + i) : 0.8} />
            <rect x={-12} y={36} width={24} height={52} rx={6} fill="#94A3B8" transform={`rotate(${on ? 0 : -35} 0 62)`} />
          </g>
        );
      })}
      <rect x={90} y={640} width={460} height={140} rx={10} fill="#0B1522" stroke="#475569" strokeWidth={4} />
      {Array.from({length: 18}, (_, i) => <rect key={i} x={110 + i * 24} y={720 - 60 * run * (0.4 + 0.6 * rnd(i, 2 + Math.floor(t * 4)))} width={16} height={60 * run * (0.4 + 0.6 * rnd(i, 2 + Math.floor(t * 4)))} fill={accent} opacity={0.8} />)}
      <g transform="translate(800 470)">
        <rect x={-170} y={-260} width={340} height={520} rx={30} fill="#1E2A3B" stroke="#334155" strokeWidth={8} />
        <circle r={150} fill="#0F172A" stroke="#64748B" strokeWidth={10} />
        <g transform={`rotate(${t * 400 * run})`}>{[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={-18} y={-140} width={36} height={110} rx={8} fill="#B87333" transform={`rotate(${i * 60})`} />)}</g>
        <circle r={34} fill="#CBD5E1" />
        {[0, 1, 2].map((i) => <path key={i} d={`M ${-120 + i * 20} -210 q 20 -30 40 0`} stroke="#FACC15" strokeWidth={6} fill="none" opacity={run * (0.3 + 0.7 * Math.abs(Math.sin(t * 5 + i)))} />)}
      </g>
    </>
  );
};

/** Pipe network with a centrifugal pump, flowing liquid, valves and a pressure gauge. */
export const Pump: React.FC<MP> = ({t, accent}) => {
  const flow = -t * 160;
  const pipe = (d: string, k: number) => (
    <g key={k}><path d={d} stroke="#334155" strokeWidth={46} fill="none" strokeLinejoin="round" /><path d={d} stroke="#1E3A5F" strokeWidth={30} fill="none" strokeLinejoin="round" /><path d={d} stroke={accent} strokeWidth={10} fill="none" strokeDasharray="30 34" strokeDashoffset={flow} strokeLinejoin="round" opacity={0.9} /></g>
  );
  return (
    <>
      <rect width={W} height={H} fill="#0F1B2A" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <line key={i} x1={0} y1={i * 140} x2={W} y2={i * 140} stroke="#16283D" strokeWidth={3} />)}
      {pipe('M -20 640 L 330 640', 0)}
      {pipe('M 560 560 L 760 560 L 760 220 L 1020 220', 1)}
      {pipe('M 760 400 L 1020 400', 2)}
      <g transform="translate(450 600)">
        <circle r={140} fill="#1E2A3B" stroke="#475569" strokeWidth={10} />
        <g transform={`rotate(${t * 520})`}>{[0, 1, 2, 3, 4, 5, 6].map((i) => <path key={i} d="M 0 0 Q 60 -40 110 -20" stroke="#94A3B8" strokeWidth={16} fill="none" strokeLinecap="round" transform={`rotate(${(360 / 7) * i})`} />)}</g>
        <circle r={30} fill="#CBD5E1" />
        <rect x={-180} y={140} width={360} height={60} rx={10} fill="#334155" />
      </g>
      {[[760, 300], [900, 400]].map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}><path d="M -34 -26 L 34 26 L 34 -26 L -34 26 Z" fill="#DC2626" /><rect x={-6} y={-70} width={12} height={44} fill="#94A3B8" /><rect x={-36} y={-82} width={72} height={14} rx={6} fill="#DC2626" transform={`rotate(${10 * Math.sin(t + i)} 0 -75)`} /></g>)}
      <Gauge x={180} y={300} r={110} v={0.55 + 0.12 * Math.sin(t * 1.3)} color={accent} label="bar" />
      {Array.from({length: 10}, (_, i) => <circle key={i} cx={(i * 110 + t * 90) % 1100 - 50} cy={640 + 6 * Math.sin(t * 3 + i)} r={5} fill="#E0F2FE" opacity={0.6} />)}
    </>
  );
};

/** Fire in a machinery space: animated flames, rising smoke, CO2 bank and an alarm beacon. */
export const Fire: React.FC<MP> = ({t}) => {
  const flame = (cx: number, base: number, s: number, k: number) => {
    const h = s * (1 + 0.18 * Math.sin(t * 9 + k) + 0.1 * Math.sin(t * 15 + k * 2));
    return (
      <g key={k} transform={`translate(${cx} ${base})`}>
        <path d={`M ${-s * 0.5} 0 C ${-s * 0.6} ${-h * 0.5} ${-s * 0.1} ${-h * 0.6} 0 ${-h} C ${s * 0.15} ${-h * 0.6} ${s * 0.65} ${-h * 0.5} ${s * 0.5} 0 Z`} fill="#F97316" opacity={0.9} />
        <path d={`M ${-s * 0.28} 0 C ${-s * 0.3} ${-h * 0.35} 0 ${-h * 0.4} 0 ${-h * 0.66} C ${s * 0.1} ${-h * 0.4} ${s * 0.35} ${-h * 0.35} ${s * 0.28} 0 Z`} fill="#FDE047" />
      </g>
    );
  };
  const beacon = 0.5 + 0.5 * Math.sin(t * 7);
  return (
    <>
      <rect width={W} height={H} fill="#140C0A" />
      <rect width={W} height={H} fill="#7C2D12" opacity={0.25 + 0.1 * Math.sin(t * 8)} />
      <rect x={0} y={700} width={W} height={200} fill="#1C1917" /><rect x={0} y={700} width={W} height={10} fill="#F59E0B" opacity={0.6} />
      <rect x={300} y={430} width={420} height={270} rx={12} fill="#292524" stroke="#44403C" strokeWidth={6} />
      {Array.from({length: 26}, (_, i) => {
        const k = (t * (0.18 + rnd(i) * 0.12) + rnd(i, 2)) % 1;
        return <circle key={i} cx={420 + rnd(i, 3) * 200 + 120 * k * (rnd(i, 4) - 0.5)} cy={430 - k * 420} r={30 + 70 * k} fill="#44403C" opacity={0.5 * (1 - k)} />;
      })}
      {flame(400, 440, 120, 1)}{flame(510, 440, 170, 2)}{flame(620, 440, 130, 3)}
      {[0, 1, 2, 3].map((i) => <g key={i} transform={`translate(${790 + i * 52} 470)`}><rect x={-20} y={0} width={40} height={230} rx={18} fill="#B91C1C" /><rect x={-10} y={-24} width={20} height={26} fill="#78716C" /></g>)}
      <text x={792} y={450} fontFamily="Inter, sans-serif" fontWeight={800} fontSize={34} fill="#FCA5A5">CO2</text>
      <g transform="translate(130 150)"><rect x={-40} y={20} width={80} height={24} fill="#57534E" /><path d="M -34 20 A 34 34 0 0 1 34 20 Z" fill="#EF4444" opacity={0.5 + 0.5 * beacon} /><circle cy={0} r={90 * beacon} fill="#EF4444" opacity={0.18 * beacon} /></g>
    </>
  );
};

/** Enclosed lifeboat lowered down the ship's side by its davit. */
export const Lifeboat: React.FC<MP> = ({t, accent}) => {
  const k = (t % 14) / 14;
  const drop = Math.min(1, Math.max(0, (k - 0.15) / 0.6));
  const by = 260 + drop * 360;
  return (
    <>
      <rect width={W} height={H} fill="#1B4F72" />
      <rect width={W} height={300} fill="#2E86C1" opacity={0.35} />
      <rect x={0} y={80} width={420} height={820} fill="#0F2D4D" /><rect x={0} y={80} width={420} height={24} fill="#F1F5F9" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={40} y={150 + i * 120} width={60} height={40} rx={8} fill="#F8FAFC" opacity={0.8} />)}
      <path d="M 380 120 L 520 120 L 560 170" stroke="#CBD5E1" strokeWidth={22} fill="none" strokeLinecap="round" />
      <line x1={560} y1={170} x2={560} y2={by - 50} stroke="#E5E7EB" strokeWidth={5} /><line x1={720} y1={170} x2={720} y2={by - 50} stroke="#E5E7EB" strokeWidth={5} />
      <path d="M 540 160 L 740 160" stroke="#CBD5E1" strokeWidth={14} />
      <g transform={`translate(640 ${by}) rotate(${2 * Math.sin(t * 1.4)})`}>
        <path d="M -150 -50 Q 0 -110 150 -50 L 160 40 Q 0 80 -160 40 Z" fill="#F97316" />
        <rect x={-150} y={0} width={300} height={44} fill="#F8FAFC" />
        {[0, 1, 2, 3].map((i) => <circle key={i} cx={-90 + i * 60} cy={-30} r={12} fill="#0F172A" />)}
        <rect x={-40} y={-96} width={80} height={20} rx={8} fill={accent} />
      </g>
      <path d={`M 0 ${650} ${Array.from({length: 42}, (_, i) => `L ${i * 25} ${650 + 12 * Math.sin(i * 0.5 + t * 1.6)}`).join(' ')} L ${W + 20} 900 L 0 900 Z`} fill="#154360" />
      <path d={wave(720, 18, 70, -t * 1.4)} fill="#0E3550" />
      {drop >= 1 ? [0, 1, 2].map((i) => <ellipse key={i} cx={640} cy={660} rx={(180 + i * 70) * ((t * 0.8 + i / 3) % 1)} ry={18 * ((t * 0.8 + i / 3) % 1)} fill="none" stroke="#E0F2FE" strokeWidth={4} opacity={1 - ((t * 0.8 + i / 3) % 1)} />) : null}
    </>
  );
};

/** Anchoring: windlass gypsy turns, chain pays out and the anchor settles on the seabed. */
export const Anchor: React.FC<MP> = ({t, accent}) => {
  const k = (t % 16) / 16;
  const pay = Math.min(1, k / 0.7);
  const ay = 300 + pay * 430;
  return (
    <>
      <rect width={W} height={H} fill="#0A2740" />
      <rect width={W} height={260} fill="#5DADE2" opacity={0.25} />
      <path d={wave(250, 10, 90, t * 0.9)} fill="#14537A" />
      <rect x={0} y={790} width={W} height={110} fill="#A08356" />{Array.from({length: 20}, (_, i) => <ellipse key={i} cx={rnd(i) * W} cy={800 + rnd(i, 2) * 80} rx={10 + rnd(i, 3) * 20} ry={6} fill="#8B6F46" />)}
      <path d="M 0 120 L 380 120 L 300 330 L 0 330 Z" fill="#0F2D4D" /><path d="M 0 300 L 310 300 L 300 330 L 0 330 Z" fill="#B4432E" />
      <g transform="translate(150 90)"><circle r={56} fill="#334155" stroke="#94A3B8" strokeWidth={6} /><g transform={`rotate(${pay * 1800})`}>{[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={-8} y={-56} width={16} height={24} fill="#CBD5E1" transform={`rotate(${i * 60})`} />)}</g></g>
      {Array.from({length: 40}, (_, i) => {
        const f = i / 39;
        const x = 300 + 260 * f + 40 * Math.sin(f * 3);
        const y = 300 + (ay - 300) * f;
        return <ellipse key={i} cx={x} cy={y} rx={9} ry={14} fill="none" stroke="#94A3B8" strokeWidth={5} transform={`rotate(${i % 2 ? 90 : 0} ${x} ${y})`} />;
      })}
      <g transform={`translate(${560 + 40 * Math.sin(3)} ${ay})`}><rect x={-8} y={0} width={16} height={70} fill="#475569" /><path d="M -60 50 Q 0 110 60 50 L 44 44 Q 0 86 -44 44 Z" fill="#475569" /><rect x={-34} y={8} width={68} height={12} fill={accent} /></g>
      {pay >= 1 ? <ellipse cx={560} cy={790} rx={120 * ((t * 0.5) % 1)} ry={14} fill="#C8AE7E" opacity={1 - ((t * 0.5) % 1)} /> : null}
      {Array.from({length: 14}, (_, i) => <circle key={i} cx={rnd(i, 7) * W} cy={780 - ((t * 30 + rnd(i, 8) * 500) % 500)} r={4} fill="#E0F2FE" opacity={0.3} />)}
    </>
  );
};

/** Container crane moving a box between quay and ship. */
export const Cargo: React.FC<MP> = ({t, accent}) => {
  const k = (t % 10) / 10;
  const tx = k < 0.5 ? 220 + 1040 * k : 740 - 1040 * (k - 0.5);
  const ly = 300 + 140 * Math.abs(Math.sin(k * Math.PI * 2));
  return (
    <>
      <rect width={W} height={H} fill="#1F3B57" /><rect width={W} height={H * 0.5} fill="#F59E0B" opacity={0.12} />
      <circle cx={850} cy={150} r={70} fill="#FDE68A" opacity={0.5} />
      <path d={wave(640, 6, 80, t)} fill="#1A5276" />
      <path d="M 430 560 L 980 560 L 950 690 L 460 690 Z" fill="#0F2D4D" />
      {[0, 1, 2, 3, 4, 5].map((c) => [0, 1, 2].map((r) => <rect key={`${c}${r}`} x={470 + c * 80} y={500 - r * 50} width={74} height={46} fill={['#E2574C', '#3B82F6', '#22C55E', '#F59E0B'][(c + r) % 4]} />))}
      <rect x={0} y={690} width={W} height={210} fill="#4B5563" />
      {[0, 1].map((r) => [0, 1, 2].map((c) => <rect key={`q${c}${r}`} x={30 + c * 90} y={640 - r * 50} width={84} height={46} fill={['#8B5CF6', '#EF4444', '#0EA5E9'][(c + r) % 3]} />))}
      <rect x={130} y={110} width={26} height={580} fill="#F59E0B" /><rect x={330} y={110} width={26} height={580} fill="#F59E0B" />
      <rect x={60} y={110} width={900} height={36} fill="#F59E0B" /><path d="M 60 110 L 240 40 L 300 110" stroke="#F59E0B" strokeWidth={14} fill="none" />
      <rect x={tx - 40} y={140} width={80} height={30} fill="#374151" />
      <line x1={tx - 24} y1={170} x2={tx - 24} y2={ly} stroke="#E5E7EB" strokeWidth={4} /><line x1={tx + 24} y1={170} x2={tx + 24} y2={ly} stroke="#E5E7EB" strokeWidth={4} />
      <rect x={tx - 48} y={ly} width={96} height={14} fill="#111827" /><rect x={tx - 46} y={ly + 14} width={92} height={50} fill={accent} />
    </>
  );
};

/** Heavy weather: storm clouds, lightning, rain, steep seas and a pitching ship. */
export const Weather: React.FC<MP> = ({t, accent}) => {
  const flash = Math.max(0, Math.sin(t * 1.3) ** 40);
  const pitch = 7 * Math.sin(t * 0.9);
  return (
    <>
      <rect width={W} height={H} fill="#111827" /><rect width={W} height={H} fill="#E5E7EB" opacity={0.5 * flash} />
      {[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx={((rnd(i) * W + t * 20) % (W + 300)) - 150} cy={90 + i * 40} rx={260} ry={70} fill="#374151" opacity={0.85} />)}
      {flash > 0.05 ? <path d="M 640 120 L 600 260 L 650 260 L 590 420" stroke="#FDE047" strokeWidth={8} fill="none" opacity={flash} /> : null}
      {Array.from({length: 70}, (_, i) => {
        const x = (rnd(i) * W + t * 300) % W;
        const y = (rnd(i, 2) * H + t * 900) % H;
        return <line key={i} x1={x} y1={y} x2={x - 14} y2={y + 34} stroke="#93C5FD" strokeWidth={2} opacity={0.5} />;
      })}
      <path d={wave(560, 40, 110, t * 1.2)} fill="#1E3A5F" />
      <g transform={`translate(500 560) rotate(${pitch})`}><path d="M -230 -40 L 230 -40 L 280 -70 L 240 20 L -210 20 Z" fill="#0F2D4D" /><rect x={-200} y={-120} width={70} height={80} fill="#F1F5F9" /><rect x={-110} y={-80} width={260} height={40} fill="#B4432E" /></g>
      <path d={wave(620, 50, 90, -t * 1.6)} fill="#163050" />
      <path d={wave(720, 30, 70, t * 2)} fill="#0E2238" />
      {Array.from({length: 18}, (_, i) => <circle key={i} cx={(rnd(i, 4) * W + t * 120) % W} cy={600 + rnd(i, 5) * 60 + 20 * Math.sin(t * 2 + i)} r={6 + rnd(i, 6) * 10} fill="#F8FAFC" opacity={0.35} />)}
      <g transform="translate(860 300)"><circle r={70} fill="#0B1522" stroke="#CBD5E1" strokeWidth={5} /><line x1={0} y1={0} x2={50 * Math.cos(-0.6 - 0.3 * Math.sin(t))} y2={50 * Math.sin(-0.6 - 0.3 * Math.sin(t))} stroke={accent} strokeWidth={6} strokeLinecap="round" /><text y={46} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={700} fontSize={20} fill="#CBD5E1">hPa</text></g>
    </>
  );
};

/** 24-hour watch ring: work and rest blocks fill around the clock; sun and moon swap over the porthole. */
export const Clock: React.FC<MP> = ({t, accent}) => {
  const cx = 470;
  const cy = 450;
  const hours = (t * 2.2) % 24;
  const blocks = [[0, 4, 'w'], [4, 8, 'r'], [8, 12, 'w'], [12, 16, 'r'], [16, 20, 'w'], [20, 24, 'r']] as const;
  const arc = (a0: number, a1: number, r: number) => {
    const p = (h: number) => [cx + r * Math.cos((h / 24) * Math.PI * 2 - Math.PI / 2), cy + r * Math.sin((h / 24) * Math.PI * 2 - Math.PI / 2)];
    const [x0, y0] = p(a0); const [x1, y1] = p(a1);
    return `M ${x0} ${y0} A ${r} ${r} 0 ${a1 - a0 > 12 ? 1 : 0} 1 ${x1} ${y1}`;
  };
  const day = Math.sin((hours / 24) * Math.PI * 2 - Math.PI / 2) < 0;
  return (
    <>
      <rect width={W} height={H} fill="#0F172A" />
      {Array.from({length: 40}, (_, i) => <circle key={i} cx={rnd(i) * W} cy={rnd(i, 2) * H} r={1.5 + rnd(i, 3) * 2} fill="#E2E8F0" opacity={0.25 + 0.25 * Math.sin(t * 2 + i)} />)}
      <circle cx={cx} cy={cy} r={330} fill="#111C30" stroke="#334155" strokeWidth={6} />
      {blocks.map(([a, b, k], i) => {
        const shown = Math.max(a, Math.min(b, hours));
        return (
          <g key={i}>
            <path d={arc(a + 0.1, b - 0.1, 290)} stroke={k === 'w' ? '#334155' : '#1E293B'} strokeWidth={56} fill="none" />
            {shown > a ? <path d={arc(a + 0.1, Math.max(a + 0.2, shown - 0.1), 290)} stroke={k === 'w' ? accent : '#6366F1'} strokeWidth={56} fill="none" /> : null}
          </g>
        );
      })}
      {Array.from({length: 24}, (_, h) => {
        const a = (h / 24) * Math.PI * 2 - Math.PI / 2;
        return <line key={h} x1={cx + 236 * Math.cos(a)} y1={cy + 236 * Math.sin(a)} x2={cx + (h % 6 ? 222 : 200) * Math.cos(a)} y2={cy + (h % 6 ? 222 : 200) * Math.sin(a)} stroke="#94A3B8" strokeWidth={h % 6 ? 3 : 6} />;
      })}
      <line x1={cx} y1={cy} x2={cx + 190 * Math.cos((hours / 24) * Math.PI * 2 - Math.PI / 2)} y2={cy + 190 * Math.sin((hours / 24) * Math.PI * 2 - Math.PI / 2)} stroke="#F8FAFC" strokeWidth={10} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={18} fill="#F8FAFC" />
      <g transform="translate(860 170)"><circle r={90} fill={day ? '#38BDF8' : '#1E1B4B'} stroke="#94A3B8" strokeWidth={12} />{day ? <circle r={34} fill="#FDE047" /> : <path d="M 10 -36 A 36 36 0 1 0 10 36 A 26 26 0 1 1 10 -36" fill="#E2E8F0" />}</g>
    </>
  );
};

/** Ship's bridge seen from inside: windows on the sea, console screens and the wheel. */
export const Bridge: React.FC<MP> = ({t, accent}) => {
  const sweep = (t * 90) % 360;
  return (
    <>
      <rect width={W} height={H} fill="#0B1220" />
      <rect x={0} y={60} width={W} height={380} fill="#1F6E9C" />
      <rect x={0} y={60} width={W} height={180} fill="#7DC3E8" opacity={0.6} />
      <path d={wave(260, 5, 60, t * 0.7).replace(/Z$/, '') + ' Z'} fill="#175A80" />
      <g transform={`translate(${(t * 12) % 1200 - 100} 250)`}><path d="M -50 0 L 60 0 L 70 -8 L -40 -8 Z" fill="#0F2D4D" /><rect x={-30} y={-24} width={18} height={16} fill="#F1F5F9" /></g>
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={i * 250 - 14} y={60} width={28} height={380} fill="#0B1220" />)}
      <rect x={0} y={40} width={W} height={30} fill="#0B1220" /><rect x={0} y={430} width={W} height={470} fill="#111827" />
      <path d="M 0 500 L 1000 500 L 1000 900 L 0 900 Z" fill="#1F2937" />
      <g transform="translate(220 640)"><rect x={-150} y={-110} width={300} height={220} rx={12} fill="#020617" stroke="#334155" strokeWidth={6} /><circle r={90} fill="#022C22" stroke="#14532D" strokeWidth={4} /><path d={`M 0 0 L ${90 * Math.cos((sweep * Math.PI) / 180)} ${90 * Math.sin((sweep * Math.PI) / 180)}`} stroke="#4ADE80" strokeWidth={4} />{[0, 1, 2].map((i) => <circle key={i} cx={60 * Math.cos(i * 2.1)} cy={50 * Math.sin(i * 2.1)} r={6} fill="#86EFAC" opacity={0.5 + 0.5 * Math.cos(((sweep - i * 120) * Math.PI) / 180)} />)}</g>
      <g transform="translate(780 640)"><rect x={-150} y={-110} width={300} height={220} rx={12} fill="#020617" stroke="#334155" strokeWidth={6} /><rect x={-130} y={-90} width={260} height={180} fill="#0C4A6E" /><path d="M -110 60 Q -40 -10 20 20 T 120 -50" stroke="#FDE047" strokeWidth={5} fill="none" strokeDasharray="12 8" strokeDashoffset={-t * 40} /><circle cx={-110 + ((t * 20) % 230)} cy={60 - ((t * 20) % 230) * 0.48} r={9} fill={accent} /></g>
      <g transform={`translate(500 760) rotate(${20 * Math.sin(t * 0.5)})`}><circle r={110} fill="none" stroke="#92400E" strokeWidth={20} />{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <line key={i} x1={0} y1={0} x2={140 * Math.cos((i * Math.PI) / 4)} y2={140 * Math.sin((i * Math.PI) / 4)} stroke="#B45309" strokeWidth={12} strokeLinecap="round" />)}<circle r={28} fill="#CBD5E1" /></g>
    </>
  );
};

/** Inspection: clipboard items tick off while a magnifier scans a certificate; a stamp lands. */
export const Inspection: React.FC<MP> = ({t, accent}) => {
  const k = (t % 10) / 10;
  const ticks = Math.floor(k * 7);
  const stamp = Math.max(0, Math.min(1, (k - 0.75) / 0.08));
  const mx = 640 + 150 * Math.sin(t * 0.9);
  const my = 420 + 120 * Math.cos(t * 0.7);
  return (
    <>
      <rect width={W} height={H} fill="#1E293B" />
      {Array.from({length: 10}, (_, i) => <rect key={i} x={0} y={i * 90} width={W} height={2} fill="#334155" />)}
      <g transform="translate(90 120) rotate(-4)">
        <rect width={340} height={640} rx={20} fill="#B45309" /><rect x={20} y={60} width={300} height={560} rx={6} fill="#F8FAFC" /><rect x={110} y={20} width={120} height={60} rx={12} fill="#94A3B8" />
        {Array.from({length: 6}, (_, i) => (
          <g key={i} transform={`translate(50 ${110 + i * 82})`}>
            <rect width={42} height={42} rx={6} fill="none" stroke="#334155" strokeWidth={4} />
            {i < ticks ? <path d="M 8 22 L 18 32 L 36 10" stroke="#16A34A" strokeWidth={7} fill="none" strokeLinecap="round" /> : null}
            <rect x={62} y={10} width={170 - (i % 3) * 30} height={10} rx={5} fill="#CBD5E1" /><rect x={62} y={28} width={120} height={8} rx={4} fill="#E2E8F0" />
          </g>
        ))}
      </g>
      <g transform="translate(520 180) rotate(3)">
        <rect width={400} height={540} rx={10} fill="#FEF3C7" stroke="#D97706" strokeWidth={6} /><rect x={30} y={30} width={340} height={480} fill="none" stroke="#D97706" strokeWidth={2} />
        <rect x={110} y={70} width={180} height={18} rx={9} fill="#92400E" />{Array.from({length: 8}, (_, i) => <rect key={i} x={60} y={130 + i * 38} width={280 - (i % 2) * 60} height={8} rx={4} fill="#D6B98C" />)}
        <g transform={`translate(270 440) scale(${1 + 1.5 * (1 - stamp)}) rotate(-12)`} opacity={stamp}><circle r={64} fill="none" stroke="#DC2626" strokeWidth={8} /><circle r={48} fill="none" stroke="#DC2626" strokeWidth={3} /><text textAnchor="middle" y={10} fontFamily="Inter, sans-serif" fontWeight={900} fontSize={28} fill="#DC2626">OK</text></g>
      </g>
      <g transform={`translate(${mx} ${my})`}><circle r={90} fill="#BAE6FD" opacity={0.25} /><circle r={90} fill="none" stroke="#0F172A" strokeWidth={16} /><circle r={90} fill="none" stroke={accent} strokeWidth={5} /><rect x={58} y={58} width={30} height={120} rx={12} fill="#0F172A" transform="rotate(-45 58 58)" /></g>
    </>
  );
};

export const EXTRA_MOTIFS = {mooring: Mooring, generator: Generator, pump: Pump, fire: Fire, lifeboat: Lifeboat, anchor: Anchor, cargo: Cargo, weather: Weather, clock: Clock, bridge: Bridge, inspection: Inspection} as const;

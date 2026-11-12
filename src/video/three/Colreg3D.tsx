// COLREG two-vessel simulations (Rules 13, 14, 15). Chart axes: x = east, z = south, headings clockwise from north.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Title, useScene, type SceneProps} from '../components/SceneShell';
import {C, clamp01, enter} from '../theme';
import {Ocean, SeaLine, SeaRing, SeaSector, Vessel} from './Models';
import {makeProjector, Stage, Tag, type Cam} from './Stage';

type Scenario = 'crossing' | 'head-on' | 'overtaking';
type State = {x: number; z: number; hdg: number};
const ss = (t: number, a: number, b: number) => {
  const k = clamp01((t - a) / (b - a));
  return k * k * (3 - 2 * k);
};

/** Deterministic kinematics. ta = moment the avoiding action starts. Without action the vessels meet at tc. */
export const simulate = (scn: Scenario, t: number, ta: number): {a: State; b: State; tc: number; meet: [number, number]; aStart: State; bStart: State} => {
  const tc = ta + 6.2;
  const D = 11;
  const dt = 1 / 30;
  let aStart: State;
  let bStart: State;
  let va: number;
  let vb: number;
  let hdgA: (s: number) => number;
  let hdgB: (s: number) => number;
  let meet: [number, number] = [0, 0];
  if (scn === 'crossing') {
    va = vb = D / tc;
    aStart = {x: 0, z: D, hdg: 0};
    bStart = {x: D, z: 0, hdg: 270};
    hdgA = (s) => 68 * (ss(s, ta, ta + 1.6) - ss(s, ta + 5.6, ta + 7.8)); // bold alteration to starboard, then back on course astern of her
    hdgB = () => 270;
  } else if (scn === 'head-on') {
    va = vb = D / tc;
    aStart = {x: 0, z: D, hdg: 0};
    bStart = {x: 0, z: -D, hdg: 180};
    const d = (s: number) => 34 * (ss(s, ta, ta + 1.5) - ss(s, ta + 4.6, ta + 6.4));
    hdgA = (s) => d(s);
    hdgB = (s) => 180 + d(s); // each alters to starboard: port-to-port passing
  } else {
    vb = 0.42;
    va = vb + 6.4 / (tc - 1.2);
    aStart = {x: 0, z: D, hdg: 0};
    bStart = {x: 0, z: D - 6.4, hdg: 0};
    meet = [0, D - 6.4 - vb * tc];
    hdgA = (s) => 34 * (ss(s, ta, ta + 1.3) - ss(s, ta + 3.1, ta + 4.4));
    hdgB = () => 0;
  }
  const a = {...aStart};
  const b = {...bStart};
  for (let s = 0; s < t; s += dt) {
    a.hdg = hdgA(s);
    b.hdg = hdgB(s);
    const ra = (a.hdg * Math.PI) / 180;
    const rb = (b.hdg * Math.PI) / 180;
    a.x += Math.sin(ra) * va * dt;
    a.z -= Math.cos(ra) * va * dt;
    b.x += Math.sin(rb) * vb * dt;
    b.z -= Math.cos(rb) * vb * dt;
  }
  return {a, b, tc, meet, aStart, bStart};
};

const TEXT: Record<Scenario, {a0: string; b0: string; a1: string; b1: string; risk: string}> = {
  crossing: {a0: 'YOU', b0: 'ON YOUR STARBOARD SIDE', a1: 'GIVE-WAY', b1: 'STAND-ON', risk: 'STEADY BEARING: RISK OF COLLISION'},
  'head-on': {a0: 'YOU', b0: 'RECIPROCAL COURSE', a1: 'ALTER TO STARBOARD', b1: 'ALTER TO STARBOARD', risk: 'HEAD-ON: RISK OF COLLISION'},
  overtaking: {a0: 'YOU', b0: 'VESSEL AHEAD', a1: 'OVERTAKING: KEEP CLEAR', b1: 'KEEPS COURSE AND SPEED', risk: 'MORE THAN 22.5° ABAFT HER BEAM'},
};

export const Colreg3DScene: React.FC<SceneProps> = ({scene, timing, accent}) => {
  const {frame, fps, t, L, vis, seconds} = useScene(timing);
  const scn: Scenario = scene.visual?.type === 'colreg' ? scene.visual.scenario : 'crossing';
  const c0 = timing.cueTimes[0] ?? seconds * 0.3;
  const c1 = timing.cueTimes[1] ?? seconds * 0.6;
  const ta = Math.max(c0 + 1.2, c1 - 1.8);
  const {a, b, meet, aStart, bStart} = simulate(scn, t, ta);
  const risk = enter(frame, fps, c0, 0.4) * (1 - enter(frame, fps, ta + 0.6, 0.6));
  const acted = enter(frame, fps, ta, 0.5);
  const cz = scn === 'overtaking' ? (a.z + b.z) / 2 - 0.5 : 0;
  const cam: Cam = {pos: [1.6 * Math.sin(t * 0.16), 25 - 1.5 * clamp01(t / seconds), cz + 17], target: [0, 0, cz + 0.6], fov: 40};
  const proj = makeProjector(cam, L.panel.w, L.panel.h);
  const pa = proj(a.x, 1.2, a.z);
  const pb = proj(b.x, 1.2, b.z);
  const tx = TEXT[scn];
  const pulse = 0.5 + 0.5 * Math.sin(t * 7);
  return (
    <AbsoluteFill style={{opacity: vis}}>
      <Title scene={scene} accent={accent} L={L} frame={frame} fps={fps} size={66} />
      <Stage
        L={L}
        cam={cam}
        sky="#0E3558"
        fog={[30, 62]}
        overlay={
          <>
            <Tag at={pa} text={acted > 0.5 ? tx.a1 : tx.a0} color={C.tealBright} L={L} />
            <Tag at={pb} text={acted > 0.5 ? tx.b1 : tx.b0} color={C.amber} L={L} />
            {risk > 0.05 ? (
              <div style={{position: 'absolute', left: 0, right: 0, bottom: 26 * L.u, display: 'flex', justifyContent: 'center', opacity: risk}}>
                <div style={{background: C.red, color: C.white, fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 32 * L.u, padding: `${10 * L.u}px ${26 * L.u}px`, borderRadius: 14 * L.u, letterSpacing: 1}}>{tx.risk}</div>
              </div>
            ) : null}
          </>
        }
      >
        <Ocean time={t} />
        {scn !== 'overtaking' ? (
          <>
            <SeaLine from={[aStart.x, aStart.z]} to={[meet[0], meet[1]]} color="#FF5A5A" opacity={0.75 * risk} />
            <SeaLine from={[bStart.x, bStart.z]} to={[meet[0], meet[1]]} color="#FF5A5A" opacity={0.75 * risk} />
            <SeaRing x={meet[0]} z={meet[1]} radius={0.7 + 0.5 * pulse} color="#FF3B3B" opacity={risk} />
            <SeaLine from={[a.x, a.z]} to={[b.x, b.z]} color="#FFFFFF" width={0.06} opacity={0.6 * risk} />
          </>
        ) : (
          <SeaSector x={b.x} z={b.z} radius={5.2} fromBearing={112.5} toBearing={247.5} color="#FFFFFF" opacity={0.3 * enter(frame, fps, c0, 0.6)} />
        )}
        <SeaRing x={a.x} z={a.z} radius={2.1} color={C.tealBright} opacity={0.55} thickness={0.1} />
        <Vessel x={a.x} z={a.z} heading={a.hdg} time={t} kind="container" hull="#12506B" scale={0.62} />
        <Vessel x={b.x} z={b.z} heading={b.hdg} time={t + 3} kind={scn === 'overtaking' ? 'cargo' : 'tanker'} hull="#8A3324" speed={scn === 'overtaking' ? 0.5 : 1} scale={0.62} />
      </Stage>
    </AbsoluteFill>
  );
};

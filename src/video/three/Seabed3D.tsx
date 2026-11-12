// Seabed cross-section scenes: ECDIS safety contour and CATZOC survey confidence.
import React, {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import * as THREE from 'three';
import {Title, useScene, type SceneProps} from '../components/SceneShell';
import {C, clamp01, enter, FONT_HEAD, lerp, ramp} from '../theme';
import {Vessel} from './Models';
import {makeProjector, Stage, Tag, type Cam} from './Stage';

const K = 0.22; // world units per metre of depth
const HALF = 9; // half width of the section
const DEPTH_Z = 7;
const DEEP = 30;
const SHALLOW = 3;
const xAtDepth = (d: number) => -HALF + (2 * HALF * (DEEP - d)) / (DEEP - SHALLOW);

const Extruded: React.FC<{pts: [number, number][]; color: string; opacity?: number}> = ({pts, color, opacity = 1}) => {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {depth: DEPTH_Z, bevelEnabled: false});
    g.translate(0, 0, -DEPTH_Z / 2);
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(pts)]);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color={color} flatShading roughness={0.9} transparent={opacity < 1} opacity={opacity} depthWrite={opacity >= 1} />
    </mesh>
  );
};

export const Contour3DScene: React.FC<SceneProps> = ({scene, timing, accent}) => {
  const {frame, fps, t, L, vis, seconds} = useScene(timing);
  const v = scene.visual?.type === 'safety-contour' ? scene.visual : {type: 'safety-contour' as const, draft: 10, enteredValue: 12, contours: [5, 10, 15, 20, 30]};
  const contours = v.contours.filter((d) => d >= SHALLOW && d <= DEEP);
  // ECDIS behaviour: if the entered value is not an available contour, the next deeper one is used.
  const used = [...contours].sort((p, q) => p - q).find((d) => d >= v.enteredValue) ?? Math.max(...contours);
  const c0 = timing.cueTimes[0] ?? seconds * 0.3;
  const c1 = timing.cueTimes[1] ?? seconds * 0.62;
  const entered = enter(frame, fps, c0, 0.5);
  const snap = ramp(frame, fps, c1, c1 + 0.9);
  const cam: Cam = {pos: [-1.2 + 1.4 * Math.sin(t * 0.2), 6.6, 16.6 - 0.8 * clamp01(t / seconds)], target: [0.6, -2.5, 0], fov: 38};
  const proj = makeProjector(cam, L.panel.w, L.panel.h);
  const xe = xAtDepth(v.enteredValue);
  const xu = xAtDepth(used);
  const xm = lerp(xe, xu, snap);
  const shipX = lerp(-7.6, xu - 3.4, clamp01(t / Math.max(1, seconds)));
  const marker = proj(xm, 0.2, DEPTH_Z / 2);
  return (
    <AbsoluteFill style={{opacity: vis}}>
      <Title scene={scene} accent={accent} L={L} frame={frame} fps={fps} size={66} />
      <Stage
        L={L}
        cam={cam}
        sky="#103257"
        overlay={
          <>
            {contours.map((d) => {
              const p = proj(xAtDepth(d), -d * K, DEPTH_Z / 2);
              const hot = d === used && snap > 0.6;
              return <Tag key={d} at={p} text={`${d} m`} color={hot ? C.amber : 'rgba(255,255,255,0.92)'} L={L} dy={34} size={hot ? 30 : 24} />;
            })}
            <Tag at={marker} text={snap > 0.6 ? `ECDIS uses ${used} m` : `You enter ${v.enteredValue} m`} color={snap > 0.6 ? C.amber : C.white} L={L} dy={-70} opacity={entered} size={32} />
            {snap > 0.6 ? (
              <>
                <Tag at={proj((xu - HALF) / 2, 0.1, 0)} text="SAFE WATER" color="rgba(255,255,255,0.95)" L={L} dy={-150} opacity={enter(frame, fps, c1 + 0.8, 0.4)} />
                <Tag at={proj((xu + HALF) / 2, 0.1, 0)} text="UNSAFE WATER" color="#2563EB" dark={false} L={L} dy={-150} opacity={enter(frame, fps, c1 + 1.0, 0.4)} />
              </>
            ) : null}
            <div style={{position: 'absolute', left: 24 * L.u, top: 20 * L.u, fontFamily: FONT_HEAD, fontWeight: 600, fontSize: 24 * L.u, color: `${C.white}B3`, letterSpacing: 2}}>SEABED SECTION · DRAUGHT {v.draft} m</div>
          </>
        }
      >
        <Extruded pts={[[-HALF, -DEEP * K], [HALF, -SHALLOW * K], [HALF, -7.6], [-HALF, -7.6]]} color="#B79257" />
        <Extruded pts={[[-HALF, 0], [HALF, 0], [HALF, -SHALLOW * K], [-HALF, -DEEP * K]]} color="#2A9BD0" opacity={0.42} />
        {contours.map((d) => {
          const hot = d === used ? snap : 0;
          return (
            <mesh key={d} position={[xAtDepth(d), -d * K + 0.06, 0]}>
              <boxGeometry args={[0.07 + 0.2 * hot, 0.08, DEPTH_Z + 0.05]} />
              <meshBasicMaterial color={hot > 0.5 ? C.amber : '#FFFFFF'} transparent opacity={0.55 + 0.45 * hot} />
            </mesh>
          );
        })}
        {/* the value the officer typed, sliding to the contour ECDIS actually uses */}
        <mesh position={[xm, (-lerp(v.enteredValue, used, snap) * K) / 2, 0]}>
          <boxGeometry args={[0.05, lerp(v.enteredValue, used, snap) * K, DEPTH_Z]} />
          <meshBasicMaterial color={snap > 0.6 ? C.amber : '#FFFFFF'} transparent opacity={0.32 * entered} depthWrite={false} />
        </mesh>
        {/* chart colours on the surface: shallow side blue = unsafe, deep side light = safe */}
        <mesh position={[(xu + HALF) / 2, 0.03, 0]}>
          <boxGeometry args={[HALF - xu, 0.02, DEPTH_Z]} />
          <meshBasicMaterial color="#2563EB" transparent opacity={0.6 * snap} depthWrite={false} />
        </mesh>
        <mesh position={[(xu - HALF) / 2, 0.03, 0]}>
          <boxGeometry args={[xu + HALF, 0.02, DEPTH_Z]} />
          <meshBasicMaterial color="#F8FAFC" transparent opacity={0.2 * snap} depthWrite={false} />
        </mesh>
        <Vessel x={shipX} z={0} heading={90} time={t} scale={0.72} kind="tanker" hull="#8A3324" speed={0.6} />
      </Stage>
    </AbsoluteFill>
  );
};

const bedY = (x: number, z: number) => -3.3 + 0.42 * Math.sin(x * 0.9) * Math.cos(z * 1.1) + 0.22 * Math.sin(x * 2.3 + z * 1.7);

export const Zoc3DScene: React.FC<SceneProps> = ({scene, timing, accent}) => {
  const {frame, fps, t, L, vis, seconds} = useScene(timing);
  const c0 = timing.cueTimes[0] ?? seconds * 0.12;
  const c1 = timing.cueTimes[1] ?? seconds * 0.55;
  const full = ramp(frame, fps, c0, Math.max(c0 + 2.2, c1 - 0.6));
  const sparse = ramp(frame, fps, c1, c1 + 2.4);
  const danger = enter(frame, fps, c1 + 1.6, 0.4);
  const bed = useMemo(() => {
    const g = new THREE.PlaneGeometry(2 * HALF, 8, 44, 20);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setY(i, bedY(p.getX(i), p.getZ(i)));
    g.computeVertexNormals();
    return g;
  }, []);
  const cam: Cam = {pos: [1.5 * Math.sin(t * 0.18), 7.4, 15.4 - 0.7 * clamp01(t / seconds)], target: [0, -1.7, 0], fov: 40};
  const proj = makeProjector(cam, L.panel.w, L.panel.h);
  const surveyX = -HALF + HALF * full;
  const rocks: {x: number; z: number; h: number; side: 'a' | 'c'}[] = [{x: -6.2, z: 1.2, h: 1.3, side: 'a'}, {x: -2.6, z: -1.6, h: 1.0, side: 'a'}, {x: 5.2, z: 1.3, h: 1.7, side: 'c'}];
  const pulse = 0.5 + 0.5 * Math.sin(t * 7);
  const lines = [-2.6, 0, 2.6];
  return (
    <AbsoluteFill style={{opacity: vis}}>
      <Title scene={scene} accent={accent} L={L} frame={frame} fps={fps} size={66} />
      <Stage
        L={L}
        cam={cam}
        sky="#0F2E50"
        overlay={
          <>
            <div style={{position: 'absolute', left: 22 * L.u, top: 20 * L.u, opacity: enter(frame, fps, c0, 0.4), background: C.tealBright, color: C.deep, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 28 * L.u, padding: `${8 * L.u}px ${18 * L.u}px`, borderRadius: 12 * L.u}}>ZOC A1 ★★★★★★ full coverage</div>
            <div style={{position: 'absolute', right: 22 * L.u, top: 20 * L.u, opacity: enter(frame, fps, c1, 0.4), background: C.amber, color: C.deep, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 28 * L.u, padding: `${8 * L.u}px ${18 * L.u}px`, borderRadius: 12 * L.u}}>ZOC C ★★★ partial coverage</div>
            {rocks.filter((r) => r.side === 'a').map((r, i) => (
              <Tag key={i} at={proj(r.x, bedY(r.x, r.z) + r.h, r.z)} text="FOUND" color={C.tealBright} L={L} dy={-34} size={22} opacity={surveyX > r.x ? 1 : 0} />
            ))}
            <Tag at={proj(5.2, bedY(5.2, 1.3) + 1.7, 1.3)} text="NOT DETECTED" color={C.red} dark={false} L={L} dy={-40} size={26} opacity={danger} />
          </>
        }
      >
        <mesh geometry={bed}><meshStandardMaterial color="#B79257" flatShading roughness={0.95} /></mesh>
        <mesh position={[0, -5.6, 0]}><boxGeometry args={[2 * HALF, 4, 8]} /><meshStandardMaterial color="#8C6D3F" flatShading /></mesh>
        {rocks.map((r, i) => (
          <mesh key={i} position={[r.x, bedY(r.x, r.z) + r.h / 2 - 0.1, r.z]}>
            <coneGeometry args={[0.55, r.h, 6]} />
            <meshStandardMaterial color={r.side === 'c' && danger > 0.5 ? '#EF4444' : '#6B5B45'} flatShading emissive={r.side === 'c' ? '#EF4444' : '#000000'} emissiveIntensity={r.side === 'c' ? danger * pulse * 0.9 : 0} />
          </mesh>
        ))}
        {/* A1: multibeam swath covers the whole seabed */}
        <mesh position={[(-HALF + surveyX) / 2, -2.55, 0]}>
          <boxGeometry args={[Math.max(0.01, surveyX + HALF), 0.02, 8]} />
          <meshBasicMaterial color={C.tealBright} transparent opacity={0.3} depthWrite={false} />
        </mesh>
        {full > 0.01 && full < 0.995 ? (
          <mesh position={[surveyX, -1.3, 0]} scale={[0.12, 1, 1]}>
            <coneGeometry args={[4, 2.6, 4]} />
            <meshBasicMaterial color={C.tealBright} transparent opacity={0.4} depthWrite={false} />
          </mesh>
        ) : null}
        {/* C: widely spaced sounding lines leave gaps */}
        {lines.map((z) => (
          <mesh key={z} position={[(HALF * sparse) / 2, -2.5, z]}>
            <boxGeometry args={[Math.max(0.01, HALF * sparse), 0.03, 0.14]} />
            <meshBasicMaterial color={C.amber} transparent opacity={0.95} />
          </mesh>
        ))}
        <mesh position={[0, -1.6, 0]}><boxGeometry args={[0.04, 3.4, 8]} /><meshBasicMaterial color="#FFFFFF" transparent opacity={0.22} depthWrite={false} /></mesh>
        <mesh position={[0, 0, 0]}><boxGeometry args={[2 * HALF, 0.02, 8]} /><meshBasicMaterial color="#38BDF8" transparent opacity={0.22} depthWrite={false} /></mesh>
        {full < 0.995 ? <Vessel x={surveyX} z={0} heading={90} time={t} scale={0.5} kind="cargo" hull="#12506B" speed={0.5} /> : null}
        {sparse > 0.01 && sparse < 0.995 ? <Vessel x={HALF * sparse} z={0} heading={90} time={t} scale={0.5} kind="cargo" hull="#8A3324" speed={0.5} /> : null}
      </Stage>
    </AbsoluteFill>
  );
};

// Reusable procedural maritime 3D components. No external model files: nothing to download, nothing to break.
import React, {useMemo} from 'react';
import * as THREE from 'three';

/** Animated low-poly sea surface. `time` in seconds. */
export const Ocean: React.FC<{time: number; size?: number; color?: string; y?: number; opacity?: number; amp?: number}> = ({time, size = 70, color = '#17678F', y = 0, opacity = 1, amp = 0.13}) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(size, size, 44, 44);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      p.setY(i, amp * (Math.sin(x * 0.55 + time * 1.3) + 0.7 * Math.sin(z * 0.8 - time * 1.05) + 0.5 * Math.sin((x + z) * 1.3 + time * 1.8)));
    }
    g.computeVertexNormals();
    return g;
  }, [time, size, amp]);
  return (
    <mesh geometry={geo} position={[0, y, 0]}>
      <meshStandardMaterial color={color} flatShading roughness={0.55} metalness={0.15} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
};

const hullShape = (L: number, B: number) => {
  const s = new THREE.Shape();
  const h = L / 2;
  const b = B / 2;
  s.moveTo(-h, -b * 0.82);
  s.lineTo(h * 0.5, -b);
  s.quadraticCurveTo(h * 0.86, -b * 0.82, h, 0);
  s.quadraticCurveTo(h * 0.86, b * 0.82, h * 0.5, b);
  s.lineTo(-h, b * 0.82);
  s.quadraticCurveTo(-h * 1.06, 0, -h, -b * 0.82);
  return s;
};

export type ShipKind = 'cargo' | 'container' | 'tanker';

/**
 * Stylised merchant ship. Local axes: +X = bow, +Y = up, +Z = starboard.
 * Navigation lights follow COLREG colours: red to port, green to starboard, white masthead and stern.
 */
export const ShipModel: React.FC<{kind?: ShipKind; hull?: string; lights?: boolean; lightScale?: number}> = ({kind = 'cargo', hull = '#1E3A5F', lights = true, lightScale = 1}) => {
  const L = 4.4;
  const B = 0.82;
  const geo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(hullShape(L, B), {depth: 0.62, bevelEnabled: false, curveSegments: 6});
    g.rotateX(-Math.PI / 2); // shape Y -> -Z (beam), extrusion -> +Y (up)
    return g;
  }, []);
  const deckGeo = useMemo(() => {
    const g = new THREE.ShapeGeometry(hullShape(L * 0.985, B * 0.9), 6);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const boxes = kind === 'container'
    ? [-0.5, 0.15, 0.8, 1.4].flatMap((x, i) => [{x, y: 0.62, c: ['#E2574C', '#3B82F6', '#F59E0B', '#22C55E'][i % 4]}, {x, y: 0.86, c: ['#F59E0B', '#E2574C', '#22C55E', '#3B82F6'][i % 4]}])
    : [];
  const r = 0.07 * lightScale;
  return (
    <group>
      <mesh geometry={geo} position={[0, -0.2, 0]}>
        <meshStandardMaterial color={hull} flatShading roughness={0.7} />
      </mesh>
      <mesh geometry={deckGeo} position={[0, 0.425, 0]}>
        <meshStandardMaterial color="#7C8798" flatShading roughness={0.9} />
      </mesh>
      {/* accommodation block aft, bridge wings, funnel */}
      <mesh position={[-1.45, 0.82, 0]}><boxGeometry args={[0.7, 0.8, 0.62]} /><meshStandardMaterial color="#F1F5F9" flatShading /></mesh>
      <mesh position={[-1.3, 1.16, 0]}><boxGeometry args={[0.3, 0.14, 0.86]} /><meshStandardMaterial color="#E2E8F0" flatShading /></mesh>
      <mesh position={[-1.72, 1.36, 0]}><boxGeometry args={[0.24, 0.42, 0.3]} /><meshStandardMaterial color="#14B8A6" flatShading /></mesh>
      {/* foremast and after mast */}
      <mesh position={[1.75, 0.85, 0]}><boxGeometry args={[0.05, 0.85, 0.05]} /><meshStandardMaterial color="#CBD5E1" /></mesh>
      <mesh position={[-1.3, 1.62, 0]}><boxGeometry args={[0.05, 0.8, 0.05]} /><meshStandardMaterial color="#CBD5E1" /></mesh>
      {kind === 'cargo' ? [-0.55, 0.15, 0.85].map((x) => (
        <mesh key={x} position={[x, 0.5, 0]}><boxGeometry args={[0.56, 0.14, 0.56]} /><meshStandardMaterial color="#B45309" flatShading /></mesh>
      )) : null}
      {kind === 'tanker' ? (
        <>
          <mesh position={[0.25, 0.5, 0]}><boxGeometry args={[2.7, 0.07, 0.09]} /><meshStandardMaterial color="#DC2626" /></mesh>
          <mesh position={[0.3, 0.52, 0]}><boxGeometry args={[0.12, 0.1, 0.74]} /><meshStandardMaterial color="#F59E0B" /></mesh>
        </>
      ) : null}
      {boxes.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, 0]}><boxGeometry args={[0.56, 0.22, 0.62]} /><meshStandardMaterial color={b.c} flatShading /></mesh>
      ))}
      {lights ? (
        <>
          <mesh position={[1.75, 1.32, 0]}><sphereGeometry args={[r, 10, 10]} /><meshBasicMaterial color="#FFFFFF" /></mesh>
          <mesh position={[-1.3, 2.06, 0]}><sphereGeometry args={[r, 10, 10]} /><meshBasicMaterial color="#FFFFFF" /></mesh>
          <mesh position={[-1.3, 1.18, 0.46]}><sphereGeometry args={[r * 1.15, 10, 10]} /><meshBasicMaterial color="#22FF66" /></mesh>
          <mesh position={[-1.3, 1.18, -0.46]}><sphereGeometry args={[r * 1.15, 10, 10]} /><meshBasicMaterial color="#FF2D2D" /></mesh>
          <mesh position={[-2.22, 0.55, 0]}><sphereGeometry args={[r, 10, 10]} /><meshBasicMaterial color="#FFFFFF" /></mesh>
        </>
      ) : null}
    </group>
  );
};

/** Places a ship on the chart plane. x = east, z = south, heading in degrees clockwise from north. */
export const Vessel: React.FC<{x: number; z: number; heading: number; time: number; scale?: number; kind?: ShipKind; hull?: string; speed?: number}> = ({x, z, heading, time, scale = 0.8, kind, hull, speed = 1}) => {
  const rotY = Math.PI / 2 - (heading * Math.PI) / 180;
  const bob = 0.04 * Math.sin(time * 1.7 + x);
  const wake = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-1.9, 0);
    s.lineTo(-5.2, 0.62);
    s.lineTo(-5.2, -0.62);
    s.closePath();
    const g = new THREE.ShapeGeometry(s);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  return (
    <group position={[x, bob, z]} rotation={[0, rotY, 0]} scale={scale}>
      {/* soft contact shadow and bow foam make the hull sit in the water instead of floating on it */}
      <mesh position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[2.6, 0.62, 1]}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial color="#021a2c" transparent opacity={0.32} depthWrite={false} />
      </mesh>
      <mesh position={[2.15, 0.19, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.5 + 0.06 * Math.sin(time * 6), 0.55, 1]}>
        <ringGeometry args={[0.55, 0.85, 24, 1, -1.2, 2.4]} />
        <meshBasicMaterial color="#F0FBFF" transparent opacity={0.55 * Math.min(1, speed)} depthWrite={false} />
      </mesh>
      <group rotation={[0.025 * Math.sin(time * 1.3 + z), 0, 0.03 * Math.sin(time * 1.1)]}>
        <ShipModel kind={kind} hull={hull} />
      </group>
      <mesh geometry={wake} position={[0, 0.2, 0]} scale={[Math.min(1, 0.35 + speed * 0.65), 1, 1]}>
        <meshBasicMaterial color="#E0F7FF" transparent opacity={0.24} depthWrite={false} />
      </mesh>
    </group>
  );
};

/** Flat line on the water between two chart points (track, bearing line). */
export const SeaLine: React.FC<{from: [number, number]; to: [number, number]; color: string; width?: number; opacity?: number; y?: number}> = ({from, to, color, width = 0.12, opacity = 0.9, y = 0.28}) => {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const len = Math.hypot(dx, dz);
  if (len < 0.01) return null;
  return (
    <mesh position={[(from[0] + to[0]) / 2, y, (from[1] + to[1]) / 2]} rotation={[0, -Math.atan2(dz, dx), 0]}>
      <boxGeometry args={[len, 0.02, width]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
};

/** Flat ring on the water (collision point, CPA marker). */
export const SeaRing: React.FC<{x: number; z: number; radius: number; color: string; opacity?: number; thickness?: number}> = ({x, z, radius, color, opacity = 1, thickness = 0.16}) => (
  <mesh position={[x, 0.3, z]} rotation={[-Math.PI / 2, 0, 0]}>
    <ringGeometry args={[Math.max(0.01, radius - thickness), radius, 40]} />
    <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} />
  </mesh>
);

/** Flat sector on the water, e.g. the 135 degree sternlight arc. Bearings in degrees clockwise from north. */
export const SeaSector: React.FC<{x: number; z: number; radius: number; fromBearing: number; toBearing: number; color: string; opacity?: number}> = ({x, z, radius, fromBearing, toBearing, color, opacity = 0.35}) => {
  // circle angle a (in XY) maps to chart direction (cos a, sin a) -> after rotateX(-90deg): (cos a, -sin a) in XZ. bearing b = 90deg - a.
  const start = ((90 - toBearing) * Math.PI) / 180;
  const length = ((toBearing - fromBearing) * Math.PI) / 180;
  return (
    <mesh position={[x, 0.26, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[radius, 36, start, length]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
};

export const Buoy: React.FC<{x: number; z: number; color?: string; time: number}> = ({x, z, color = '#EF4444', time}) => (
  <group position={[x, 0.1 + 0.05 * Math.sin(time * 2 + x), z]} rotation={[0.08 * Math.sin(time * 1.4), 0, 0.08 * Math.cos(time * 1.2)]}>
    <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.16, 0.26, 0.5, 10]} /><meshStandardMaterial color={color} flatShading /></mesh>
    <mesh position={[0, 0.72, 0]}><coneGeometry args={[0.14, 0.4, 10]} /><meshStandardMaterial color={color} flatShading /></mesh>
  </group>
);

// Shared 3D stage: a framed viewport with a Remotion-driven Three.js canvas and a 2D label layer on top.
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import React from 'react';
import * as THREE from 'three';
import type {Layout} from '../../shared/layout';
import {C, FONT_HEAD} from '../theme';

export type Cam = {pos: [number, number, number]; target: [number, number, number]; fov: number};

/** Sets the camera from props every frame (deterministic, no controls, no useFrame). */
const CameraRig: React.FC<{cam: Cam}> = ({cam}) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  camera.fov = cam.fov;
  camera.near = 0.1;
  camera.far = 400;
  camera.position.set(cam.pos[0], cam.pos[1], cam.pos[2]);
  camera.lookAt(cam.target[0], cam.target[1], cam.target[2]);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return null;
};

/** World point -> pixel inside the panel, with the same camera the canvas uses. */
export const makeProjector = (cam: Cam, w: number, h: number) => {
  const c = new THREE.PerspectiveCamera(cam.fov, w / h, 0.1, 400);
  c.position.set(cam.pos[0], cam.pos[1], cam.pos[2]);
  c.lookAt(cam.target[0], cam.target[1], cam.target[2]);
  c.updateProjectionMatrix();
  c.updateMatrixWorld();
  return (x: number, y: number, z: number) => {
    const v = new THREE.Vector3(x, y, z).project(c);
    return {x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h};
  };
};

export const Stage: React.FC<{L: Layout; cam: Cam; sky?: string; fog?: [number, number]; children: React.ReactNode; overlay?: React.ReactNode}> = ({L, cam, sky = '#123A63', fog, children, overlay}) => {
  const w = L.panel.w;
  const h = L.panel.h;
  return (
    <div style={{position: 'absolute', left: L.panel.x, top: L.panel.y, width: w, height: h, borderRadius: 34 * L.u, overflow: 'hidden', background: '#020812', border: `3px solid ${C.white}2E`, boxShadow: '0 30px 80px rgba(0,0,0,0.5)'}}>
      <ThreeCanvas width={w} height={h} style={{position: 'absolute', left: 0, top: 0}} camera={{fov: cam.fov, position: cam.pos, near: 0.1, far: 400}}>
        <CameraRig cam={cam} />
        <color attach="background" args={[sky]} />
        {fog ? <fog attach="fog" args={[sky, fog[0], fog[1]]} /> : null}
        <hemisphereLight args={['#DFF4FF', '#0B3A5A', 1.25]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[8, 18, 10]} intensity={2.6} />
        <directionalLight position={[-10, 8, -6]} intensity={0.7} color="#9AD8FF" />
        {children}
      </ThreeCanvas>
      <div style={{position: 'absolute', inset: 0}}>{overlay}</div>
    </div>
  );
};

/** Label chip anchored to a projected point. */
export const Tag: React.FC<{at: {x: number; y: number}; text: string; color: string; L: Layout; opacity?: number; dy?: number; dark?: boolean; size?: number}> = ({at, text, color, L, opacity = 1, dy = -56, dark = true, size = 28}) => (
  <div style={{position: 'absolute', left: at.x, top: at.y + dy * L.u, transform: 'translate(-50%, -50%)', background: color, color: dark ? C.deep : C.white, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: size * L.u, letterSpacing: 0.6, padding: `${7 * L.u}px ${16 * L.u}px`, borderRadius: 12 * L.u, whiteSpace: 'nowrap', opacity, boxShadow: '0 8px 20px rgba(0,0,0,0.35)'}}>
    {text}
  </div>
);

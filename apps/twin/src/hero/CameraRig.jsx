import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { IDLE_VIEW } from "./scene/layout.js";

const DRIFT_SPEED = 0.028;

// Cinematic spherical camera: slow auto-drift when idle, subtle
// mouse-driven parallax layered on top (never baked into the persisted
// angle, so it can't accumulate drift), and a smooth "fly-to" whenever
// `focus` (a {target, radius, theta, phi} preset) is set. `paused` stops
// the idle drift (used while something is hovered/selected, so the camera
// doesn't slide the target out from under a stationary mouse mid-tooltip).
export default function CameraRig({ focus, paused }) {
  const { camera, pointer } = useThree();
  const idleTheta = useRef(IDLE_VIEW.theta);
  const curTheta = useRef(IDLE_VIEW.theta);
  const curPhi = useRef(IDLE_VIEW.phi);
  const curRadius = useRef(IDLE_VIEW.radius);
  const curTarget = useRef(new THREE.Vector3(...IDLE_VIEW.target));
  const workingPos = useRef(new THREE.Vector3());
  const goalTargetVec = useRef(new THREE.Vector3());

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    if (!paused && !focus) idleTheta.current += delta * DRIFT_SPEED;

    const goalTheta = focus ? focus.theta : idleTheta.current;
    const goalPhi = focus ? focus.phi : IDLE_VIEW.phi;
    const goalRadius = focus ? focus.radius : IDLE_VIEW.radius;
    const goalTargetArr = focus ? focus.target : IDLE_VIEW.target;

    const ease = 1 - Math.pow(0.0025, delta);
    curTheta.current += (goalTheta - curTheta.current) * ease;
    curPhi.current += (goalPhi - curPhi.current) * ease;
    curRadius.current += (goalRadius - curRadius.current) * ease;
    goalTargetVec.current.set(goalTargetArr[0], goalTargetArr[1], goalTargetArr[2]);
    curTarget.current.lerp(goalTargetVec.current, ease);

    // Mouse parallax: a small transient offset, not stored back into the
    // persisted angle, so it never fights the drift/fly-to state.
    const parallaxTheta = pointer.x * 0.09;
    const parallaxPhi = THREE.MathUtils.clamp(pointer.y * -0.04, -0.1, 0.1);

    const theta = curTheta.current + parallaxTheta;
    const phi = THREE.MathUtils.clamp(curPhi.current + parallaxPhi, 0.45, 1.45);
    const r = curRadius.current;

    workingPos.current.set(
      curTarget.current.x + r * Math.sin(phi) * Math.sin(theta),
      curTarget.current.y + r * Math.cos(phi),
      curTarget.current.z + r * Math.sin(phi) * Math.cos(theta)
    );

    camera.position.lerp(workingPos.current, Math.min(1, delta * 6));
    camera.lookAt(curTarget.current);
  });

  return null;
}

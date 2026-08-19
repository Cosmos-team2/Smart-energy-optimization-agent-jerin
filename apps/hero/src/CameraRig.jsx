import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { IDLE_VIEW } from "./scene/layout.js";

// Idle drift is a BOUNDED oscillation around IDLE_VIEW.theta (never an
// unbounded increment) — this is what guarantees the camera can never
// rotate all the way around into the unpopulated back side of the campus.
const DRIFT_SPEED = 0.12;
const DRIFT_AMPLITUDE = 0.32;

// Hard azimuth bounds for idle/parallax framing. Focus presets (fly-to on
// click) are trusted, hand-tuned values and are exempt from this clamp.
const AZIMUTH_MIN = IDLE_VIEW.theta - 0.6;
const AZIMUTH_MAX = IDLE_VIEW.theta + 0.6;

export default function CameraRig({ focus, paused }) {
  const { camera, pointer } = useThree();
  const idleTheta = useRef(IDLE_VIEW.theta);
  const curTheta = useRef(IDLE_VIEW.theta);
  const curPhi = useRef(IDLE_VIEW.phi);
  const curRadius = useRef(IDLE_VIEW.radius);
  const curTarget = useRef(new THREE.Vector3(...IDLE_VIEW.target));
  const workingPos = useRef(new THREE.Vector3());
  const goalTargetVec = useRef(new THREE.Vector3());

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime;

    // Bounded sinusoidal idle drift — smoothly frozen (not snapped) while
    // paused (hover/select) or while a focus fly-to is active.
    const driftTarget =
      !paused && !focus ? IDLE_VIEW.theta + Math.sin(t * DRIFT_SPEED) * DRIFT_AMPLITUDE : idleTheta.current;
    idleTheta.current += (driftTarget - idleTheta.current) * Math.min(1, delta * 1.5);

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

    let theta = curTheta.current + parallaxTheta;
    if (!focus) theta = THREE.MathUtils.clamp(theta, AZIMUTH_MIN, AZIMUTH_MAX);
    const phi = THREE.MathUtils.clamp(curPhi.current + parallaxPhi, 0.5, 1.35);
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

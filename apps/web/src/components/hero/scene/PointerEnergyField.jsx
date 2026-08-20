import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { COLORS } from "../palette.js";

// A subtle energy field that follows the mouse in world space.
// The pointer's NDC coords are unprojected onto the ground plane (y=0)
// to find a world position. Particles near that position gently bend/float
// toward it, and a very soft purple radial glow sits under the cursor.
//
// Intensity is LOW by design — this should feel like "the facility is
// aware of me", not "a cursor effect was added".

const PARTICLE_COUNT = 32;
const INTERACT_RADIUS = 6;    // world-space radius of pointer influence
const ATTRACT_STRENGTH = 0.018; // how strongly particles bend toward pointer

export default function PointerEnergyField() {
  const { camera, size } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const meshRef = useRef();
  const glowRef = useRef();
  const pointerWorld = useRef(new THREE.Vector3());
  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const ndcPointer = useMemo(() => new THREE.Vector2(), []);

  // Particle state: position + velocity + rest position
  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, () => {
      const x = (Math.random() - 0.5) * 22;
      const z = (Math.random() - 0.5) * 18;
      const y = Math.random() * 5 + 0.4;
      return {
        pos: new THREE.Vector3(x, y, z),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.004,
          (Math.random() - 0.5) * 0.01
        ),
        rest: new THREE.Vector3(x, y, z),
        phase: Math.random() * Math.PI * 2,
        speed: 0.2 + Math.random() * 0.25,
        size: 0.035 + Math.random() * 0.04,
      };
    });
  }, []);

  // Track the CSS pointer position → update ndcPointer
  // We listen on the canvas via onPointerMove in HeroPage and pass down
  // as a shared ref, OR we track it here via a global handler.
  // Using a ref-based window listener to avoid prop drilling.
  const pointerNDC = useRef({ x: 0, y: 0 });
  useMemo(() => {
    const handler = (e) => {
      pointerNDC.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerNDC.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("pointermove", handler, { passive: true });
    return () => window.removeEventListener("pointermove", handler);
  }, []);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = clock.getElapsedTime();

    // Unproject pointer onto ground plane
    ndcPointer.set(pointerNDC.current.x, pointerNDC.current.y);
    raycaster.setFromCamera(ndcPointer, camera);
    const hit = new THREE.Vector3();
    raycaster.ray.intersectPlane(groundPlane, hit);
    if (hit.length() > 0.001) {
      pointerWorld.current.lerp(hit, 0.08); // smooth follow
    }

    // Move glow disc to pointer position (on ground, slightly above)
    if (glowRef.current) {
      glowRef.current.position.x = pointerWorld.current.x;
      glowRef.current.position.z = pointerWorld.current.z;
      glowRef.current.position.y = 0.06;
    }

    // Update particles
    particles.forEach((p, i) => {
      // Idle float
      p.pos.y = p.rest.y + Math.sin(t * p.speed + p.phase) * 0.18;

      // Attraction toward pointer within radius
      const dx = pointerWorld.current.x - p.pos.x;
      const dz = pointerWorld.current.z - p.pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < INTERACT_RADIUS && dist > 0.01) {
        const factor = (1 - dist / INTERACT_RADIUS) * ATTRACT_STRENGTH;
        p.vel.x += (dx / dist) * factor;
        p.vel.z += (dz / dist) * factor;
      }

      // Restore toward rest position (XZ only)
      p.vel.x += (p.rest.x - p.pos.x) * 0.004;
      p.vel.z += (p.rest.z - p.pos.z) * 0.004;

      // Damping
      p.vel.x *= 0.92;
      p.vel.z *= 0.92;

      p.pos.x += p.vel.x;
      p.pos.z += p.vel.z;

      // Write to instanced mesh
      dummy.position.copy(p.pos);
      const s = p.size * (dist < INTERACT_RADIUS ? 1 + (1 - dist / INTERACT_RADIUS) * 0.5 : 1);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      if (meshRef.current) {
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
    });

    if (meshRef.current) {
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Instanced pointer-reactive particles */}
      <instancedMesh ref={meshRef} args={[null, null, PARTICLE_COUNT]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial
          color={COLORS.purple}
          transparent
          opacity={0.18}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Very soft ground glow disc under cursor */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <circleGeometry args={[2.8, 24]} />
        <meshBasicMaterial
          color={COLORS.purple}
          transparent
          opacity={0.04}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

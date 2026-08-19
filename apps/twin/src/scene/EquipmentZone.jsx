import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import * as THREE from "three";

import EquipmentRig from "./EquipmentRig.jsx";

const MAX_HEIGHT = 2.2;
const BASE_HEIGHT = 0.4;

function heightForRatio(ratio) {
  return BASE_HEIGHT + Math.min(1, ratio) * MAX_HEIGHT;
}

// value/ratio are derived directly from spike-data.json's timeline (real
// base_kw / hvac_kw / comp_kw readings). spike flags come from that same
// data's is_spike_event field for the two zones rec_042 targets.
//
// ghostRatio (optional) draws a translucent red outline at the BASELINE
// height behind the current block — only passed in Optimized mode at the
// spike slot, to make the reduction visible in the model itself, not just
// in text. statusBadge (optional) labels a rec_042 action currently in
// effect (pre-cooling / soft ramp / delayed restart).
export default function EquipmentZone({ zone, value, ratio, spike, ghostRatio, ghostValue, statusBadge, tintColor }) {
  const heightRef = useRef(0.4);
  const haloRef = useRef();
  const haloMatRef = useRef();

  const targetHeight = heightForRatio(ratio);
  const ghostHeight = ghostRatio != null ? heightForRatio(ghostRatio) : null;

  useFrame((_, delta) => {
    heightRef.current = THREE.MathUtils.lerp(heightRef.current, targetHeight, Math.min(1, delta * 4));

    if (haloRef.current && haloMatRef.current) {
      if (spike) {
        const t = (performance.now() * 0.0012) % 1;
        haloRef.current.scale.setScalar(1 + t * 0.9);
        haloMatRef.current.opacity = 0.5 * (1 - t);
      } else {
        haloMatRef.current.opacity = 0;
      }
    }
  });

  return (
    <group position={zone.position}>
      {/* zone floor pad */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[1.65, 1.65, 0.06, 32]} />
        <meshStandardMaterial color="#1a212c" />
      </mesh>
      <mesh position={[0, 0.065, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.55, 1.64, 32]} />
        <meshBasicMaterial color={zone.color} transparent opacity={0.55} />
      </mesh>
      {/* subtle outer zone boundary */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.95, 2.0, 40]} />
        <meshBasicMaterial color={zone.color} transparent opacity={0.18} />
      </mesh>
      {/* pulsing "ping" halo shown only while this zone is spiking */}
      <mesh ref={haloRef} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.7, 1.85, 40]} />
        <meshBasicMaterial ref={haloMatRef} color="#ff4d4f" transparent opacity={0} />
      </mesh>

      <EquipmentRig kind={zone.kind} color={zone.color} heightRef={heightRef} spike={spike} tintColor={tintColor} />

      {/* Ghost outline: "this is how tall baseline would be right now" */}
      {ghostHeight != null && (
        <mesh position={[0, ghostHeight / 2, 0]}>
          <boxGeometry args={[1.4, ghostHeight, 1.4]} />
          <meshBasicMaterial color="#ff4d4f" wireframe transparent opacity={0.45} />
        </mesh>
      )}

      {/* Fixed-height nameplate stack, clear of the tallest possible block
          (maxHeight above) so it never collides with the value/spike text. */}
      <Billboard position={[0, 4.35, 0]}>
        <Text fontSize={0.32} color="#e6edf3" anchorX="center" anchorY="middle">
          {zone.label}
        </Text>
      </Billboard>
      <Billboard position={[0, 4.02, 0]}>
        <Text fontSize={0.19} color="#8b98a5" anchorX="center" anchorY="middle">
          {zone.id}
        </Text>
      </Billboard>
      <Billboard position={[0, 3.6, 0]}>
        <Text fontSize={0.3} color={zone.color} anchorX="center" anchorY="middle">
          {`${value.toFixed(1)} kW`}
        </Text>
      </Billboard>
      {spike && (
        <Billboard position={[0, 3.22, 0]}>
          <Text fontSize={0.28} color="#ff4d4f" anchorX="center" anchorY="middle" outlineWidth={0.012} outlineColor="#3d0d0e">
            {"⚠ SPIKE"}
          </Text>
        </Billboard>
      )}
      {!spike && statusBadge && (
        <Billboard position={[0, 3.22, 0]}>
          <Text fontSize={0.22} color={statusBadge.color} anchorX="center" anchorY="middle">
            {statusBadge.text}
          </Text>
        </Billboard>
      )}
      {ghostHeight != null && (
        <Billboard position={[0, 2.95, 0]}>
          <Text fontSize={0.17} color="#ff8a8a" anchorX="center" anchorY="middle">
            {`baseline was ${ghostValue.toFixed(1)} kW`}
          </Text>
        </Billboard>
      )}
    </group>
  );
}

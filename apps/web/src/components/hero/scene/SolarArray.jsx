import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { COLORS } from "../palette.js";

// Instanced rooftop solar array. Purely decorative set-dressing (the
// current spike-data.json timeline doesn't carry solar_ghi), built as one
// instanced mesh so N panels cost one draw call instead of N.
export default function SolarArray({ rows = 3, cols = 5, size = [4.4, 2.6] }) {
  const panelRef = useRef();
  const frameRef = useRef();
  const [w, d] = size;
  const cellW = w / cols;
  const cellD = d / rows;

  const positions = useMemo(() => {
    const out = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        out.push([-w / 2 + cellW * c + cellW / 2, 0, -d / 2 + cellD * r + cellD / 2]);
      }
    }
    return out;
  }, [rows, cols, w, d, cellW, cellD]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!panelRef.current) return;
    positions.forEach((p, i) => {
      dummy.position.set(p[0], 0.14, p[2]);
      dummy.rotation.set(-0.28, 0, 0);
      dummy.updateMatrix();
      panelRef.current.setMatrixAt(i, dummy.matrix);
      if (frameRef.current) frameRef.current.setMatrixAt(i, dummy.matrix);
    });
    panelRef.current.instanceMatrix.needsUpdate = true;
    if (frameRef.current) frameRef.current.instanceMatrix.needsUpdate = true;
  }, [positions, dummy]);

  return (
    <group>
      <instancedMesh ref={frameRef} args={[null, null, positions.length]}>
        <boxGeometry args={[cellW * 0.92, 0.03, cellD * 0.92]} />
        <meshStandardMaterial color={COLORS.metalDark} roughness={0.6} metalness={0.5} />
      </instancedMesh>
      <instancedMesh ref={panelRef} args={[null, null, positions.length]} position={[0, 0.005, 0]}>
        <boxGeometry args={[cellW * 0.84, 0.02, cellD * 0.84]} />
        <meshStandardMaterial color="#0a1a2e" roughness={0.25} metalness={0.6} emissive="#123049" emissiveIntensity={0.2} />
      </instancedMesh>
      {/* support legs at array corners */}
      {[[-w / 2 + 0.1, -d / 2 + 0.1], [w / 2 - 0.1, -d / 2 + 0.1], [-w / 2 + 0.1, d / 2 - 0.1], [w / 2 - 0.1, d / 2 - 0.1]].map(
        (p, i) => (
          <mesh key={i} position={[p[0], -0.1, p[1]]}>
            <cylinderGeometry args={[0.03, 0.03, 0.2, 6]} />
            <meshStandardMaterial color={COLORS.metalDark} roughness={0.7} />
          </mesh>
        )
      )}
    </group>
  );
}

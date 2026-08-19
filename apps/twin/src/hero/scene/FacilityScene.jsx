import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

import Environment from "./Environment.jsx";
import Building from "./Building.jsx";
import Chiller from "./Chiller.jsx";
import CoolingTower from "./CoolingTower.jsx";
import Ahu from "./Ahu.jsx";
import SolarArray from "./SolarArray.jsx";
import Compressor from "./Compressor.jsx";
import AirReceiver from "./AirReceiver.jsx";
import Transformer from "./Transformer.jsx";
import Substation from "./Substation.jsx";
import GridMast from "./GridMast.jsx";
import EnergyNetwork from "./EnergyNetwork.jsx";
import Hotspot from "./Hotspot.jsx";

import { LAYOUT } from "./layout.js";
import { STATE_STYLE, channelsForPhase } from "./energyStates.js";

function fmtKw(v) {
  return `${v.toFixed(1)} kW`;
}

// Assembles the full miniature industrial campus and wires each hero piece
// of equipment up to the shared hover/select interaction state and the
// story-driven energy channels.
export default function FacilityScene({ phase, current, hoveredId, selectedId, onHover, onSelect }) {
  const channels = channelsForPhase(phase);
  const hvacGlow = useRef(0.3);
  const compressorGlow = useRef(0.3);
  const trunkGlow = useRef(0.35);

  const hvacSpin = useRef(1.2);
  const compressorSpin = useRef(1);

  useFrame(() => {
    const hvacStyle = STATE_STYLE[channels.hvac];
    const compStyle = STATE_STYLE[channels.compressor];
    const trunkStyle = STATE_STYLE[channels.trunk];

    const pulse = (base, hot) => (hot ? base + Math.sin(performance.now() * 0.006) * 0.18 : base);

    hvacGlow.current = pulse(hvacStyle.glow, channels.hvac === "hot");
    compressorGlow.current = pulse(compStyle.glow, channels.compressor === "hot");
    trunkGlow.current = trunkStyle.glow;

    hvacSpin.current = 0.6 + hvacStyle.speed * 1.4;
    compressorSpin.current = 0.6 + compStyle.speed * 1.4;
  });

  const hvacStatus =
    phase === "peak" ? "SPIKE — SOFT RAMP NEEDED" : phase === "transition" ? "SOFT RAMP ACTIVE" : "NORMAL";
  const compressorStatus =
    phase === "peak" ? "SPIKE — RESTART SURGE" : phase === "transition" ? "DELAYED — STAGGERED" : "NORMAL";

  return (
    <group>
      <Environment />
      <GridMast glowRef={trunkGlow} />

      <group position={LAYOUT.building.position}>
        <Building />

        <Hotspot
          id="ahu"
          position={LAYOUT.ahu}
          ringRadius={1.1}
          label="Air Handling Unit — z_hvac_3"
          load={fmtKw(current.hvac_kw)}
          status={hvacStatus}
          hovered={hoveredId === "ahu"}
          active={selectedId === "ahu"}
          onHover={onHover}
          onSelect={onSelect}
        >
          <Ahu glowRef={hvacGlow} spinRef={hvacSpin} />
        </Hotspot>

        <Hotspot
          id="chillers"
          position={LAYOUT.chillers[0]}
          ringRadius={1.6}
          label="Chiller Plant — eq_chiller_2"
          load={fmtKw(current.hvac_kw)}
          status={hvacStatus}
          hovered={hoveredId === "chillers"}
          active={selectedId === "chillers"}
          onHover={onHover}
          onSelect={onSelect}
        >
          <group position={[0, 0, 0]}>
            <Chiller glowRef={hvacGlow} spinRef={hvacSpin} />
          </group>
          <group position={[LAYOUT.chillers[1][0] - LAYOUT.chillers[0][0], 0, LAYOUT.chillers[1][2] - LAYOUT.chillers[0][2]]}>
            <Chiller glowRef={hvacGlow} spinRef={hvacSpin} />
          </group>
        </Hotspot>

        <Hotspot
          id="coolingTower"
          position={LAYOUT.coolingTower}
          ringRadius={0.95}
          label="Cooling Tower"
          status="AUXILIARY"
          hovered={hoveredId === "coolingTower"}
          active={selectedId === "coolingTower"}
          onHover={onHover}
          onSelect={onSelect}
        >
          <CoolingTower spinRef={hvacSpin} />
        </Hotspot>

        <group position={LAYOUT.solarArrayCenter}>
          <SolarArray rows={3} cols={5} size={LAYOUT.solarArraySize} />
        </group>
      </group>

      <Hotspot
        id="compressor"
        position={LAYOUT.compressor}
        ringRadius={1.3}
        label="Air Compressor 1 — z_compressor_1"
        load={fmtKw(current.comp_kw)}
        status={compressorStatus}
        hovered={hoveredId === "compressor"}
        active={selectedId === "compressor"}
        onHover={onHover}
        onSelect={onSelect}
      >
        <Compressor glowRef={compressorGlow} />
      </Hotspot>

      <Hotspot
        id="airReceiver"
        position={LAYOUT.airReceiver}
        ringRadius={0.75}
        label="Air Receiver Tank"
        status="AUXILIARY"
        hovered={hoveredId === "airReceiver"}
        active={selectedId === "airReceiver"}
        onHover={onHover}
        onSelect={onSelect}
      >
        <AirReceiver />
      </Hotspot>

      <Hotspot
        id="transformer"
        position={LAYOUT.transformer}
        ringRadius={1.5}
        label="Grid Transformer"
        load={fmtKw(current.total_kw)}
        status={phase === "peak" ? "HIGH DEMAND" : "NORMAL"}
        hovered={hoveredId === "transformer"}
        active={selectedId === "transformer"}
        onHover={onHover}
        onSelect={onSelect}
      >
        <Transformer glowRef={trunkGlow} />
      </Hotspot>

      <Hotspot
        id="substation"
        position={LAYOUT.substation}
        ringRadius={1.7}
        label="Electrical Switchgear — z_baseload_1"
        load={fmtKw(current.base_kw)}
        status="NORMAL"
        hovered={hoveredId === "substation"}
        active={selectedId === "substation"}
        onHover={onHover}
        onSelect={onSelect}
      >
        <Substation glowRef={trunkGlow} />
      </Hotspot>

      <EnergyNetwork phase={phase} />
    </group>
  );
}

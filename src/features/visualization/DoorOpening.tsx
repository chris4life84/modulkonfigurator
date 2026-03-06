import * as THREE from 'three';

const FRAME_THICKNESS = 0.04;
const FRAME_DEPTH = 0.13;
const GLASS_THICKNESS = 0.012;

interface DoorOpeningProps {
  /** Door width in meters */
  width: number;
  /** Door height in meters */
  height: number;
  /** Position relative to wall group (wall-local coordinates) */
  position: [number, number, number];
  /** True for double terrace door (2 panes + center divider) */
  double?: boolean;
}

export function DoorOpening({ width, height, position, double = false }: DoorOpeningProps) {
  const halfW = width / 2;
  const halfH = height / 2;

  return (
    <group position={position}>
      {/* Glass panels */}
      {double ? (
        <>
          {/* Double door: two panes split by center divider */}
          <GlassPanel
            position={[-halfW / 2, halfH, 0]}
            width={halfW - FRAME_THICKNESS * 1.5}
            height={height - FRAME_THICKNESS * 2}
          />
          <GlassPanel
            position={[halfW / 2, halfH, 0]}
            width={halfW - FRAME_THICKNESS * 1.5}
            height={height - FRAME_THICKNESS * 2}
          />
        </>
      ) : (
        /* Single door: one full pane */
        <GlassPanel
          position={[0, halfH, 0]}
          width={width - FRAME_THICKNESS * 2}
          height={height - FRAME_THICKNESS * 2}
        />
      )}

      {/* Frame - left */}
      <FrameBar
        position={[-halfW, halfH, 0]}
        size={[FRAME_THICKNESS, height, FRAME_DEPTH]}
      />
      {/* Frame - right */}
      <FrameBar
        position={[halfW, halfH, 0]}
        size={[FRAME_THICKNESS, height, FRAME_DEPTH]}
      />
      {/* Frame - center divider (only for double door) */}
      {double && (
        <FrameBar
          position={[0, halfH, 0]}
          size={[FRAME_THICKNESS * 0.6, height, FRAME_DEPTH]}
        />
      )}
      {/* Frame - top */}
      <FrameBar
        position={[0, height, 0]}
        size={[width + FRAME_THICKNESS, FRAME_THICKNESS, FRAME_DEPTH]}
      />
      {/* Threshold */}
      <mesh position={[0, FRAME_THICKNESS / 2, 0]}>
        <boxGeometry args={[width + FRAME_THICKNESS, FRAME_THICKNESS, FRAME_DEPTH + 0.02]} />
        <meshStandardMaterial color="#4A4A4A" roughness={0.4} metalness={0.2} />
      </mesh>
    </group>
  );
}

function GlassPanel({
  position,
  width,
  height,
}: {
  position: [number, number, number];
  width: number;
  height: number;
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, height, GLASS_THICKNESS]} />
      <meshPhysicalMaterial
        color="#C8E4FF"
        transmission={0.85}
        roughness={0.05}
        metalness={0}
        ior={1.5}
        thickness={0.5}
        transparent
        opacity={0.35}
        side={THREE.DoubleSide}
        envMapIntensity={0.8}
      />
    </mesh>
  );
}

function FrameBar({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color="#555555"
        roughness={0.3}
        metalness={0.3}
      />
    </mesh>
  );
}

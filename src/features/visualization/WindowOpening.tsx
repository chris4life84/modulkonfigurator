import * as THREE from 'three';

const FRAME_THICKNESS = 0.035;
const FRAME_DEPTH = 0.13;
const GLASS_THICKNESS = 0.010;

interface WindowOpeningProps {
  /** Window width in meters */
  width: number;
  /** Window height in meters */
  height: number;
  /** Position relative to wall group (wall-local coordinates, bottom-center of window) */
  position: [number, number, number];
  /** If true, window sits on the floor (no sill) */
  floorLevel?: boolean;
}

export function WindowOpening({ width, height, position, floorLevel = false }: WindowOpeningProps) {
  const halfH = height / 2;

  return (
    <group position={[position[0], position[1] + halfH, position[2]]}>
      {/* Glass pane */}
      <mesh>
        <boxGeometry args={[width - FRAME_THICKNESS * 2, height - FRAME_THICKNESS * 2, GLASS_THICKNESS]} />
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

      {/* Frame - top */}
      <mesh position={[0, halfH - FRAME_THICKNESS / 2, 0]} castShadow>
        <boxGeometry args={[width, FRAME_THICKNESS, FRAME_DEPTH]} />
        <meshStandardMaterial color="#555555" roughness={0.3} metalness={0.3} />
      </mesh>
      {/* Frame - bottom */}
      <mesh position={[0, -halfH + FRAME_THICKNESS / 2, 0]} castShadow>
        <boxGeometry args={[width, FRAME_THICKNESS, FRAME_DEPTH]} />
        <meshStandardMaterial color="#555555" roughness={0.3} metalness={0.3} />
      </mesh>
      {/* Frame - left */}
      <mesh position={[-width / 2 + FRAME_THICKNESS / 2, 0, 0]} castShadow>
        <boxGeometry args={[FRAME_THICKNESS, height, FRAME_DEPTH]} />
        <meshStandardMaterial color="#555555" roughness={0.3} metalness={0.3} />
      </mesh>
      {/* Frame - right */}
      <mesh position={[width / 2 - FRAME_THICKNESS / 2, 0, 0]} castShadow>
        <boxGeometry args={[FRAME_THICKNESS, height, FRAME_DEPTH]} />
        <meshStandardMaterial color="#555555" roughness={0.3} metalness={0.3} />
      </mesh>

      {/* Window sill (bottom ledge, slightly protruding) – only for elevated windows */}
      {!floorLevel && (
        <mesh position={[0, -halfH - 0.01, FRAME_DEPTH / 2 + 0.01]} castShadow>
          <boxGeometry args={[width + 0.04, 0.02, FRAME_DEPTH + 0.03]} />
          <meshStandardMaterial color="#505050" roughness={0.3} metalness={0.3} />
        </mesh>
      )}
    </group>
  );
}

import * as THREE from 'three';

const FRAME_THICKNESS = 0.04;
const FRAME_DEPTH = 0.13;
const GLASS_THICKNESS = 0.012;

// Door handle constants
const HANDLE_HEIGHT = 1.05; // Height above floor
const HANDLE_INSET = 0.08; // Distance from frame edge

const handleMaterial = new THREE.MeshStandardMaterial({
  color: '#C0C0C0',
  roughness: 0.3,
  metalness: 0.8,
});

interface DoorOpeningProps {
  /** Door width in meters */
  width: number;
  /** Door height in meters */
  height: number;
  /** Position relative to wall group (wall-local coordinates) */
  position: [number, number, number];
  /** True for double terrace door (2 panes + center divider) */
  double?: boolean;
  /** Hinge side as seen from outside ('left' or 'right'). Default: 'left' */
  hingeSide?: 'left' | 'right';
  /** Whether door opens outward. Default: true */
  opensOutward?: boolean;
}

export function DoorOpening({
  width, height, position, double = false,
  hingeSide = 'left', opensOutward = true,
}: DoorOpeningProps) {
  const halfW = width / 2;
  const halfH = height / 2;

  // Handle Z offset: outside face (+Z) or inside face (-Z) of the glass
  const handleZ = opensOutward ? GLASS_THICKNESS / 2 + 0.015 : -(GLASS_THICKNESS / 2 + 0.015);

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
      {/* Frame - center divider (only for double door, full thickness) */}
      {double && (
        <FrameBar
          position={[0, halfH, 0]}
          size={[FRAME_THICKNESS, height, FRAME_DEPTH]}
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

      {/* Door handles */}
      {double ? (
        /* Double door: ONE handle on the center divider, side based on hingeSide */
        <DoorHandle
          x={0}
          y={HANDLE_HEIGHT}
          z={handleZ}
          facingRight={hingeSide === 'left'}
        />
      ) : (
        /* Single door: handle on the frame opposite to hinges */
        <DoorHandle
          x={hingeSide === 'left' ? halfW : -halfW}
          y={HANDLE_HEIGHT}
          z={handleZ}
          facingRight={hingeSide === 'left'}
        />
      )}
    </group>
  );
}

/** L-shaped door handle: rosette plate + horizontal lever + short downward tip */
function DoorHandle({
  x, y, z, facingRight,
}: {
  x: number;
  y: number;
  z: number;
  facingRight: boolean;
}) {
  const leverDir = facingRight ? -1 : 1;

  return (
    <group position={[x, y, z]}>
      {/* Rosette (mounting plate) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} material={handleMaterial}>
        <cylinderGeometry args={[0.022, 0.022, 0.008, 16]} />
      </mesh>

      {/* Horizontal lever */}
      <mesh
        position={[leverDir * 0.05, 0, 0.004]}
        rotation={[0, 0, 0]}
        material={handleMaterial}
      >
        <boxGeometry args={[0.10, 0.012, 0.012]} />
      </mesh>

      {/* Downward tip at the end of lever */}
      <mesh
        position={[leverDir * 0.095, -0.015, 0.004]}
        material={handleMaterial}
      >
        <boxGeometry args={[0.012, 0.03, 0.012]} />
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

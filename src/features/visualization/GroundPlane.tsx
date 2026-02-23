import * as THREE from 'three';

interface GroundPlaneProps {
  size?: number;
  gridStep?: number;
}

export function GroundPlane({ size = 40, gridStep = 1.5 }: GroundPlaneProps) {
  const divisions = Math.round(size / gridStep);

  return (
    <group>
      {/* Ground surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#f1f5f9" side={THREE.DoubleSide} />
      </mesh>

      {/* Grid lines */}
      <gridHelper
        args={[size, divisions, '#cbd5e1', '#e2e8f0']}
        position={[0, 0, 0]}
      />
    </group>
  );
}

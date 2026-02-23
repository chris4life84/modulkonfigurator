import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import type { PlacedModule } from '../../types/grid';
import { GRID_CELL_SIZE } from '../../types/grid';

const OUTER_HEIGHT = 2.5;
const ROOF_THICKNESS = 0.08;

interface Module3DProps {
  module: PlacedModule;
  color: string;
  label: string;
  selected?: boolean;
  onClick?: () => void;
}

function darkenColor(hex: string, amount: number): string {
  const c = new THREE.Color(hex);
  c.multiplyScalar(1 - amount);
  return `#${c.getHexString()}`;
}

export function Module3D({ module: m, color, label, selected, onClick }: Module3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const widthM = m.width * GRID_CELL_SIZE;
  const depthM = m.height * GRID_CELL_SIZE;

  // Position: center of the module in world coordinates
  const posX = m.gridX * GRID_CELL_SIZE + widthM / 2;
  const posZ = m.gridY * GRID_CELL_SIZE + depthM / 2;
  const posY = OUTER_HEIGHT / 2;

  const edgesGeometry = useMemo(() => {
    const box = new THREE.BoxGeometry(widthM, OUTER_HEIGHT, depthM);
    return new THREE.EdgesGeometry(box);
  }, [widthM, depthM]);

  const roofColor = darkenColor(color, 0.15);
  const edgeColor = darkenColor(color, 0.3);

  return (
    <group position={[posX, 0, posZ]}>
      {/* Main walls */}
      <mesh
        ref={meshRef}
        position={[0, posY, 0]}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = onClick ? 'pointer' : 'default';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <boxGeometry args={[widthM, OUTER_HEIGHT, depthM]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={hovered ? 0.95 : 0.85}
          side={THREE.DoubleSide}
          emissive={selected ? color : '#000000'}
          emissiveIntensity={selected ? 0.3 : 0}
        />
      </mesh>

      {/* Roof cap */}
      <mesh position={[0, OUTER_HEIGHT + ROOF_THICKNESS / 2, 0]} castShadow>
        <boxGeometry args={[widthM + 0.05, ROOF_THICKNESS, depthM + 0.05]} />
        <meshStandardMaterial color={roofColor} />
      </mesh>

      {/* Edge wireframe for definition */}
      <lineSegments position={[0, posY, 0]} geometry={edgesGeometry}>
        <lineBasicMaterial color={edgeColor} transparent opacity={0.5} />
      </lineSegments>

      {/* Selection ring */}
      {selected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.max(widthM, depthM) * 0.6, Math.max(widthM, depthM) * 0.65, 32]} />
          <meshBasicMaterial color="#1e293b" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Floating label */}
      <Html
        position={[0, OUTER_HEIGHT + 0.6, 0]}
        center
        distanceFactor={12}
        style={{ pointerEvents: 'none' }}
      >
        <div className="whitespace-nowrap rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur-sm">
          {label}
          <span className="ml-1 text-[10px] font-normal text-gray-400">
            {widthM.toFixed(1)}×{depthM.toFixed(1)}m
          </span>
        </div>
      </Html>
    </group>
  );
}

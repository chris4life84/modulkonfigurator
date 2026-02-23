import { useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { PlacedModule } from '../../types/grid';
import { GRID_CELL_SIZE } from '../../types/grid';
import { MODULE_DEFINITIONS } from '../../data/module-types';
import { getBoundingBox } from '../../utils/grid';
import { Module3D } from './Module3D';
import { GroundPlane } from './GroundPlane';

interface Scene3DProps {
  modules: PlacedModule[];
  selectedModuleId?: string | null;
  onModuleClick?: (id: string) => void;
}

function computeCamera(modules: PlacedModule[]) {
  const bbox = getBoundingBox(modules);
  const centerX = ((bbox.minX + bbox.maxX) / 2) * GRID_CELL_SIZE;
  const centerZ = ((bbox.minY + bbox.maxY) / 2) * GRID_CELL_SIZE;
  const maxDim = Math.max(bbox.widthM, bbox.heightM, 4);
  const distance = maxDim * 1.4;

  return {
    position: [centerX + distance * 0.8, distance * 0.6, centerZ + distance * 0.8] as [number, number, number],
    target: [centerX, 1.0, centerZ] as [number, number, number],
  };
}

export function Scene3D({ modules, selectedModuleId, onModuleClick }: Scene3DProps) {
  const camera = useMemo(() => computeCamera(modules), [modules]);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: camera.position, fov: 50, near: 0.1, far: 200 }}
      style={{ background: '#f8fafc' }}
      onPointerMissed={() => {
        /* deselect when clicking empty space */
      }}
    >
      <Suspense fallback={null}>
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 15, 10]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <hemisphereLight
          args={['#dbeafe', '#f1f5f9', 0.3]}
        />

        {/* Ground */}
        <GroundPlane />

        {/* Modules */}
        {modules.map((m) => {
          const def = MODULE_DEFINITIONS[m.type];
          return (
            <Module3D
              key={m.id}
              module={m}
              color={def?.color ?? '#9ca3af'}
              label={def?.name ?? m.type}
              selected={m.id === selectedModuleId}
              onClick={onModuleClick ? () => onModuleClick(m.id) : undefined}
            />
          );
        })}

        {/* Controls */}
        <OrbitControls
          target={camera.target}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={3}
          maxDistance={30}
          enableDamping
          dampingFactor={0.08}
        />
      </Suspense>
    </Canvas>
  );
}

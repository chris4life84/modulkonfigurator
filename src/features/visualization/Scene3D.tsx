import { useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { PlacedModule } from '../../types/grid';
import { GRID_CELL_SIZE } from '../../types/grid';
import { MODULE_DEFINITIONS } from '../../data/module-types';
import { getBoundingBox } from '../../utils/grid';
import { Module3D } from './Module3D';
import { GroundPlane } from './GroundPlane';
import { EnvironmentSetup } from './EnvironmentSetup';
import { GardenVegetation } from './GardenVegetation';

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
  const shadowCenter = useMemo(() => {
    if (modules.length === 0) return [0, 0, 0] as [number, number, number];
    const bbox = getBoundingBox(modules);
    const cx = ((bbox.minX + bbox.maxX) / 2) * GRID_CELL_SIZE;
    const cz = ((bbox.minY + bbox.maxY) / 2) * GRID_CELL_SIZE;
    return [cx, 0.01, cz] as [number, number, number];
  }, [modules]);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: camera.position, fov: 50, near: 0.1, far: 200 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.5,
      }}
      onPointerMissed={() => {
        /* deselect when clicking empty space */
      }}
    >
      <Suspense fallback={null}>
        {/* Environment: Sky, Fog, Lighting */}
        <EnvironmentSetup />

        {/* Ground with grass and foundation */}
        <GroundPlane modules={modules} />

        {/* Low-poly garden trees and bushes */}
        {modules.length > 0 && <GardenVegetation modules={modules} />}

        {/* Contact shadows for grounding effect */}
        {modules.length > 0 && (
          <ContactShadows
            position={shadowCenter}
            opacity={0.25}
            scale={20}
            blur={2.5}
            far={4}
            resolution={512}
          />
        )}

        {/* Modules */}
        {modules.map((m) => {
          const def = MODULE_DEFINITIONS[m.type];
          return (
            <Module3D
              key={m.id}
              module={m}
              allModules={modules}
              color={def?.color ?? '#9ca3af'}
              label={def?.name ?? m.type}
              selected={m.id === selectedModuleId}
              onClick={onModuleClick ? () => onModuleClick(m.id) : undefined}
            />
          );
        })}

        {/* Direction labels */}
        {modules.length > 0 && <DirectionLabels modules={modules} />}

        {/* Controls */}
        <OrbitControls
          target={camera.target}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={3}
          maxDistance={40}
          enableDamping
          dampingFactor={0.08}
        />
      </Suspense>
    </Canvas>
  );
}

/** Subtle direction labels around the building (Vorne/Hinten/Links/Rechts) */
function DirectionLabels({ modules }: { modules: PlacedModule[] }) {
  const positions = useMemo(() => {
    const bbox = getBoundingBox(modules);
    const cx = ((bbox.minX + bbox.maxX) / 2) * GRID_CELL_SIZE;
    const cz = ((bbox.minY + bbox.maxY) / 2) * GRID_CELL_SIZE;
    const minX = bbox.minX * GRID_CELL_SIZE;
    const maxX = bbox.maxX * GRID_CELL_SIZE;
    const minZ = bbox.minY * GRID_CELL_SIZE;
    const maxZ = bbox.maxY * GRID_CELL_SIZE;
    const offset = 1.2; // distance from building edge

    return {
      front: [cx, 0.05, maxZ + offset] as [number, number, number],
      back: [cx, 0.05, minZ - offset] as [number, number, number],
      left: [minX - offset, 0.05, cz] as [number, number, number],
      right: [maxX + offset, 0.05, cz] as [number, number, number],
    };
  }, [modules]);

  const labelStyle: React.CSSProperties = {
    color: '#888',
    fontSize: '4px',
    fontWeight: 400,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    pointerEvents: 'none' as const,
    userSelect: 'none' as const,
    whiteSpace: 'nowrap' as const,
    opacity: 0.7,
  };

  return (
    <>
      <Html position={positions.front} center distanceFactor={40} style={{ pointerEvents: 'none' }}>
        <div style={labelStyle}>Vorne</div>
      </Html>
      <Html position={positions.back} center distanceFactor={40} style={{ pointerEvents: 'none' }}>
        <div style={labelStyle}>Hinten</div>
      </Html>
      <Html position={positions.left} center distanceFactor={40} style={{ pointerEvents: 'none' }}>
        <div style={labelStyle}>Links</div>
      </Html>
      <Html position={positions.right} center distanceFactor={40} style={{ pointerEvents: 'none' }}>
        <div style={labelStyle}>Rechts</div>
      </Html>
    </>
  );
}

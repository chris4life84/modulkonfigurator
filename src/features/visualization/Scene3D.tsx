import { useMemo, useState, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { PlacedModule } from '../../types/grid';
import { GRID_CELL_SIZE } from '../../types/grid';
import { MODULE_DEFINITIONS } from '../../data/module-types';
import { getBoundingBox } from '../../utils/grid';
import { Module3D } from './Module3D';
import { Pergola3D } from './Pergola3D';
import { GroundPlane } from './GroundPlane';
import { EnvironmentSetup } from './EnvironmentSetup';
import { GardenVegetation } from './GardenVegetation';

interface Scene3DProps {
  modules: PlacedModule[];
  selectedModuleId?: string | null;
  onModuleClick?: (id: string) => void;
  onBackgroundClick?: () => void;
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

export function Scene3D({ modules, selectedModuleId, onModuleClick, onBackgroundClick }: Scene3DProps) {
  const [showLabels, setShowLabels] = useState(true);
  const camera = useMemo(() => computeCamera(modules), [modules]);

  // Log camera position/target on OrbitControls change (for preview image coordinates)
  const handleCameraChange = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const fiber = (canvas as any).__r$;
    if (!fiber) return;
    const cam = fiber.getState().camera;
    if (cam) {
      console.log(
        `Camera: position=[${cam.position.x.toFixed(2)}, ${cam.position.y.toFixed(2)}, ${cam.position.z.toFixed(2)}] target=[${fiber.getState().controls?.target?.x?.toFixed(2) ?? '?'}, ${fiber.getState().controls?.target?.y?.toFixed(2) ?? '?'}, ${fiber.getState().controls?.target?.z?.toFixed(2) ?? '?'}]`
      );
    }
  }, []);
  const shadowCenter = useMemo(() => {
    if (modules.length === 0) return [0, 0, 0] as [number, number, number];
    const bbox = getBoundingBox(modules);
    const cx = ((bbox.minX + bbox.maxX) / 2) * GRID_CELL_SIZE;
    const cz = ((bbox.minY + bbox.maxY) / 2) * GRID_CELL_SIZE;
    return [cx, 0.01, cz] as [number, number, number];
  }, [modules]);

  return (
    <div className="relative h-full w-full">
      {/* Toggle direction labels button – top left */}
      <button
        onClick={() => setShowLabels((v) => !v)}
        className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-md border border-gray-300 bg-white/80 px-2 py-1 text-[11px] font-medium text-gray-600 shadow-sm backdrop-blur-sm hover:bg-white hover:text-gray-800"
        title={showLabels ? 'Richtungen ausblenden' : 'Richtungen einblenden'}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="8" cy="8" r="6" />
          <line x1="8" y1="2" x2="8" y2="5" />
          <line x1="8" y1="11" x2="8" y2="14" />
          <line x1="2" y1="8" x2="5" y2="8" />
          <line x1="11" y1="8" x2="14" y2="8" />
        </svg>
        {showLabels ? 'Richtungen aus' : 'Richtungen ein'}
      </button>

      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: camera.position, fov: 50, near: 0.1, far: 200 }}
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.5,
        }}
        onPointerMissed={() => {
          onBackgroundClick?.();
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
            const props = {
              module: m,
              allModules: modules,
              color: def?.color ?? '#9ca3af',
              label: def?.name ?? m.type,
              selected: m.id === selectedModuleId,
              onClick: onModuleClick ? () => onModuleClick(m.id) : undefined,
            };
            if (m.type === 'pergola') {
              return <Pergola3D key={m.id} {...props} />;
            }
            return <Module3D key={m.id} {...props} />;
          })}

          {/* Direction labels */}
          {showLabels && modules.length > 0 && <DirectionLabels modules={modules} />}

          {/* Controls */}
          <OrbitControls
            target={camera.target}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={3}
            maxDistance={40}
            enableDamping
            dampingFactor={0.08}
            onEnd={handleCameraChange}
          />
        </Suspense>
      </Canvas>
    </div>
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
    const offset = 2.5; // distance from building edge

    return {
      front: [cx, 0.05, maxZ + offset] as [number, number, number],
      back: [cx, 0.05, minZ - offset] as [number, number, number],
      left: [minX - offset, 0.05, cz] as [number, number, number],
      right: [maxX + offset, 0.05, cz] as [number, number, number],
    };
  }, [modules]);

  const labelStyle: React.CSSProperties = {
    color: '#8a9099',
    fontSize: '4px',
    fontWeight: 400,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    pointerEvents: 'none' as const,
    userSelect: 'none' as const,
    whiteSpace: 'nowrap' as const,
    background: 'rgba(255,255,255,0.45)',
    padding: '1px 3px',
    borderRadius: '2px',
  };

  return (
    <>
      <Html position={positions.front} center distanceFactor={55} style={{ pointerEvents: 'none' }}>
        <div style={labelStyle}>Vorne</div>
      </Html>
      <Html position={positions.back} center distanceFactor={55} style={{ pointerEvents: 'none' }}>
        <div style={labelStyle}>Hinten</div>
      </Html>
      <Html position={positions.left} center distanceFactor={55} style={{ pointerEvents: 'none' }}>
        <div style={labelStyle}>Links</div>
      </Html>
      <Html position={positions.right} center distanceFactor={55} style={{ pointerEvents: 'none' }}>
        <div style={labelStyle}>Rechts</div>
      </Html>
    </>
  );
}

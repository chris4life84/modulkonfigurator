import { useMemo } from 'react';
import * as THREE from 'three';
import type { PlacedModule } from '../../types/grid';
import { GRID_CELL_SIZE } from '../../types/grid';
import { getBoundingBox } from '../../utils/grid';

interface GroundPlaneProps {
  size?: number;
  modules?: PlacedModule[];
}

/** Configure a PBR texture: repeat wrapping, anisotropy, mipmaps */
function configureTex(tex: THREE.Texture, srgb: boolean): THREE.Texture {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  return tex;
}

/**
 * Ground plane with seamless grass texture + granite foundation pad.
 * The procedural Sky provides the backdrop; fog blends grass edges
 * into the horizon naturally — no alpha fade needed.
 */
export function GroundPlane({ size = 100, modules = [] }: GroundPlaneProps) {
  // Load leafy grass PBR textures (Polyhaven leafy_grass_2k)
  const grassMaps = useMemo(() => {
    const loader = new THREE.TextureLoader();

    const diffuse = configureTex(
      loader.load('/textures/pbr/grass/rocky_terrain_02_diff_4k.jpg'),
      true,
    );
    diffuse.repeat.set(20, 20); // 4K texture — fewer tiles needed for detail

    const bump = configureTex(
      loader.load('/textures/pbr/grass/rocky_terrain_02_disp_4k.png'),
      false,
    );
    bump.repeat.set(20, 20);

    return { diffuse, bump };
  }, []);

  return (
    <group>
      {/* Grass ground plane – extends to fog horizon */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial
          map={grassMaps.diffuse}
          bumpMap={grassMaps.bump}
          bumpScale={0.15}
          roughness={0.92}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Granite foundation pad under modules */}
      {modules.length > 0 && <FoundationPad modules={modules} />}
    </group>
  );
}

/** Granite pad that sits under the module group */
function FoundationPad({ modules }: { modules: PlacedModule[] }) {
  const bbox = getBoundingBox(modules);
  const padding = 0.3; // Extra space around modules

  const width = bbox.widthM + padding * 2;
  const depth = bbox.heightM + padding * 2;
  const centerX = (bbox.minX * GRID_CELL_SIZE + bbox.maxX * GRID_CELL_SIZE) / 2;
  const centerZ = (bbox.minY * GRID_CELL_SIZE + bbox.maxY * GRID_CELL_SIZE) / 2;
  const height = 0.04;

  // Load granite tile PBR textures (Polyhaven granite_tile_2k)
  const graniteMaps = useMemo(() => {
    const loader = new THREE.TextureLoader();

    const diffuse = configureTex(
      loader.load('/textures/pbr/granite/granite_tile_diff_2k.jpg'),
      true,
    );
    // ~1m per tile → realistic granite slab size
    diffuse.repeat.set(width / 1.0, depth / 1.0);

    const bump = configureTex(
      loader.load('/textures/pbr/granite/granite_tile_disp_2k.png'),
      false,
    );
    bump.repeat.set(width / 1.0, depth / 1.0);

    return { diffuse, bump };
  }, [width, depth]);

  return (
    <mesh
      position={[centerX, height / 2 - 0.01, centerZ]}
      receiveShadow
    >
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial
        map={graniteMaps.diffuse}
        bumpMap={graniteMaps.bump}
        bumpScale={0.08}
        roughness={0.75}
        metalness={0.05}
      />
    </mesh>
  );
}

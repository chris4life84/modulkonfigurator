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
 * Ground plane with Grass005 PBR texture + granite foundation pad.
 * Full PBR: Color, Normal, Roughness maps for realistic grass rendering.
 */
export function GroundPlane({ size = 100, modules = [] }: GroundPlaneProps) {
  const grassMaps = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const repeat = 25;

    const color = configureTex(
      loader.load('/textures/pbr/grass/grass005_color_2k.png'),
      true,
    );
    color.repeat.set(repeat, repeat);

    const normal = configureTex(
      loader.load('/textures/pbr/grass/grass005_normal_2k.png'),
      false,
    );
    normal.repeat.set(repeat, repeat);

    const roughness = configureTex(
      loader.load('/textures/pbr/grass/grass005_rough_2k.png'),
      false,
    );
    roughness.repeat.set(repeat, repeat);

    return { color, normal, roughness };
  }, []);

  return (
    <group>
      {/* Grass ground plane – extends to fog horizon */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial
          map={grassMaps.color}
          normalMap={grassMaps.normal}
          roughnessMap={grassMaps.roughness}
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
  const padding = 0.3;

  const width = bbox.widthM + padding * 2;
  const depth = bbox.heightM + padding * 2;
  const centerX = (bbox.minX * GRID_CELL_SIZE + bbox.maxX * GRID_CELL_SIZE) / 2;
  const centerZ = (bbox.minY * GRID_CELL_SIZE + bbox.maxY * GRID_CELL_SIZE) / 2;
  const height = 0.04;

  const graniteMaps = useMemo(() => {
    const loader = new THREE.TextureLoader();

    const diffuse = configureTex(
      loader.load('/textures/pbr/granite/granite_tile_diff_2k.jpg'),
      true,
    );
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

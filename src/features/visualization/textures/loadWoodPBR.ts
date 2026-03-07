import * as THREE from 'three';

/**
 * PBR texture set for wood lamellen walls.
 * Loaded from /textures/pbr/wood/ (Polyhaven: planks_brown_10, resized to 1K).
 */
export interface WoodPBRMaps {
  diffuse: THREE.Texture;
  roughness: THREE.Texture;
  bump?: THREE.Texture;
  normal?: THREE.Texture;
}

let _cached: WoodPBRMaps | null = null;
let _loadAttempted = false;

/**
 * Configure a texture for PBR usage: repeat wrapping, anisotropy, mipmaps.
 */
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
 * Load PBR texture maps for wood walls.
 * Returns null if textures fail to load (graceful fallback to image/procedural).
 *
 * Maps loaded:
 *  - diffuse (color/albedo) – sRGB
 *  - roughness – linear
 *  - bump (from displacement map) – linear
 *  - normal (optional, if nor_1k.png exists) – linear
 */
export function loadWoodPBR(): WoodPBRMaps | null {
  if (_cached) return _cached;
  if (_loadAttempted) return null;
  _loadAttempted = true;

  try {
    const loader = new THREE.TextureLoader();

    const diffuse = configureTex(
      loader.load('/textures/pbr/wood/diff_1k.jpg', undefined, undefined, () => { _cached = null; }),
      true,
    );
    const roughness = configureTex(
      loader.load('/textures/pbr/wood/rough_1k.jpg'),
      false,
    );
    const bump = configureTex(
      loader.load('/textures/pbr/wood/disp_1k.jpg'),
      false,
    );

    _cached = { diffuse, roughness, bump };

    // Optional normal map (user may export from Blender later)
    loader.load(
      '/textures/pbr/wood/nor_1k.png',
      (tex) => {
        if (_cached) {
          _cached.normal = configureTex(tex, false);
        }
      },
      undefined,
      () => { /* Normal map not available – that's fine */ },
    );

    return _cached;
  } catch {
    return null;
  }
}

/**
 * Clone all PBR maps with synchronized UV transforms.
 * Ensures diffuse, roughness, bump, and normal all use the same tiling.
 *
 * IMPORTANT: center is only set to (0.5, 0.5) when rotation != 0,
 * because center shifts the UV origin and breaks cross-segment alignment
 * when segments have different repeat values (wall segments around openings).
 */
export function clonePBRMaps(
  maps: WoodPBRMaps,
  repeat: [number, number],
  offset: [number, number],
  rotation = 0,
): WoodPBRMaps {
  const cloneMap = (t: THREE.Texture): THREE.Texture => {
    const c = t.clone();
    c.needsUpdate = true;
    c.anisotropy = 16;
    c.repeat.set(repeat[0], repeat[1]);
    c.offset.set(offset[0], offset[1]);
    // Only set center for rotation; with center=(0,0) and rotation=0,
    // the UV formula is simply: uv * repeat + offset — guaranteeing
    // consistent patterns across wall segments of different sizes.
    if (rotation !== 0) {
      c.center.set(0.5, 0.5);
    }
    c.rotation = rotation;
    return c;
  };

  return {
    diffuse: cloneMap(maps.diffuse),
    roughness: cloneMap(maps.roughness),
    bump: maps.bump ? cloneMap(maps.bump) : undefined,
    normal: maps.normal ? cloneMap(maps.normal) : undefined,
  };
}

// ─── Wall PBR Loader (beige wall texture) ────────────────────────────

let _wallCached: WoodPBRMaps | null = null;
let _wallLoadAttempted = false;

/**
 * Load PBR textures for exterior wall surfaces (beige/plaster style).
 * Only diffuse + roughness available (no bump/normal).
 */
export function loadWallPBR(): WoodPBRMaps | null {
  if (_wallCached) return _wallCached;
  if (_wallLoadAttempted) return null;
  _wallLoadAttempted = true;

  try {
    const loader = new THREE.TextureLoader();

    const diffuse = configureTex(
      loader.load('/textures/pbr/wall/diff_2k.jpg', undefined, undefined, () => {
        _wallCached = null;
      }),
      true,
    );
    const roughness = configureTex(
      loader.load('/textures/pbr/wall/rough_2k.jpg'),
      false,
    );

    _wallCached = { diffuse, roughness };
    return _wallCached;
  } catch {
    return null;
  }
}

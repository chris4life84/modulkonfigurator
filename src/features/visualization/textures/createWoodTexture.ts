import * as THREE from 'three';

/**
 * Wood lamellen texture system.
 *
 * Primary: Image-based texture from /textures/wood-lamellen.jpg
 *   - The image shows vertical lamellen, rotated 90° for horizontal display
 *
 * Fallback: Procedural canvas-based vertical lamellen texture
 */

const CANVAS_CACHE = new Map<string, THREE.CanvasTexture>();
let _imageTexture: THREE.Texture | null = null;
let _imageLoadAttempted = false;

/**
 * Load the image-based wood lamellen texture.
 * Returns a cached texture or attempts to load /textures/wood-lamellen.jpg.
 * The image is rotated 90° so vertical lamellen appear horizontal on walls.
 */
export function loadWoodImageTexture(): THREE.Texture | null {
  if (_imageTexture) return _imageTexture;
  if (_imageLoadAttempted) return null;

  _imageLoadAttempted = true;

  try {
    const loader = new THREE.TextureLoader();
    const texture = loader.load(
      '/textures/wood-lamellen.jpg',
      // onLoad
      (tex) => {
        tex.needsUpdate = true;
      },
      // onProgress
      undefined,
      // onError – fallback to procedural
      () => {
        _imageTexture = null;
      },
    );

    // Rotate 90° for horizontal lamellen
    texture.center.set(0.5, 0.5);
    texture.rotation = Math.PI / 2;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;

    _imageTexture = texture;
    return texture;
  } catch {
    return null;
  }
}

// Seeded pseudo-random for deterministic textures
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Creates a procedural vertical Lamellen (vertical wood slat cladding) texture.
 * Used as fallback when the image texture is not available.
 */
export function createWoodTexture(
  woodColor: string = '#D0A868',
  width = 512,
  height = 512,
): THREE.CanvasTexture {
  const key = `vlamellen-${woodColor}-${width}-${height}`;
  if (CANVAS_CACHE.has(key)) return CANVAS_CACHE.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const rand = seededRandom(42);

  // Parse base color
  const base = new THREE.Color(woodColor);
  const baseR = Math.round(base.r * 255);
  const baseG = Math.round(base.g * 255);
  const baseB = Math.round(base.b * 255);

  // OSB-like background behind the slats (visible through gaps)
  ctx.fillStyle = '#4A4238';
  ctx.fillRect(0, 0, width, height);

  // Vertical Lamellen parameters
  const slatCount = 18;
  const gapSize = Math.round(width / slatCount * 0.15);
  const slatWidth = Math.round((width - gapSize * slatCount) / slatCount);
  const totalUnit = slatWidth + gapSize;

  for (let i = 0; i < slatCount; i++) {
    const x = i * totalUnit;

    const variation = (rand() - 0.5) * 25;
    const r = Math.max(0, Math.min(255, baseR + variation));
    const g = Math.max(0, Math.min(255, baseG + variation * 0.7));
    const b = Math.max(0, Math.min(255, baseB + variation * 0.4));

    const slatGradient = ctx.createLinearGradient(x, 0, x + slatWidth, 0);
    const brightFactor = 1.15;
    const darkFactor = 0.94;

    slatGradient.addColorStop(0, `rgb(${Math.round(r * darkFactor)},${Math.round(g * darkFactor)},${Math.round(b * darkFactor)})`);
    slatGradient.addColorStop(0.15, `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`);
    slatGradient.addColorStop(0.45, `rgb(${Math.min(255, Math.round(r * brightFactor))},${Math.min(255, Math.round(g * brightFactor))},${Math.min(255, Math.round(b * brightFactor))})`);
    slatGradient.addColorStop(0.8, `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`);
    slatGradient.addColorStop(1, `rgb(${Math.round(r * darkFactor * 0.9)},${Math.round(g * darkFactor * 0.9)},${Math.round(b * darkFactor * 0.9)})`);

    ctx.fillStyle = slatGradient;
    ctx.fillRect(x, 0, slatWidth, height);

    for (let line = 0; line < 4; line++) {
      const lx = x + 2 + rand() * (slatWidth - 4);
      const alpha = 0.02 + rand() * 0.04;
      ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
      ctx.lineWidth = 0.3 + rand() * 0.5;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      for (let y = 0; y < height; y += 30) {
        ctx.lineTo(lx + (rand() - 0.5) * 0.8, y);
      }
      ctx.stroke();
    }

    const shadowGradient = ctx.createLinearGradient(x + slatWidth - 2, 0, x + slatWidth + gapSize * 0.4, 0);
    shadowGradient.addColorStop(0, 'rgba(0,0,0,0.3)');
    shadowGradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowGradient;
    ctx.fillRect(x + slatWidth - 2, 0, gapSize * 0.5 + 2, height);
  }

  // Subtle noise for natural feel
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (rand() - 0.5) * 8;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;

  CANVAS_CACHE.set(key, texture);
  return texture;
}

/** Wood color presets matching the Holzart options (Blenden/Lamellen colors) */
export const WOOD_COLORS: Record<string, string> = {
  fichte: '#E8D8A8',     // Nordic spruce – very warm, light
  espe: '#F2E4B0',       // Aspen – sunny, bright golden
  zeder: '#D0A070',      // Red cedar – warm, brighter
  robinie: '#D0A868',    // Robinia – warm golden, much lighter
};

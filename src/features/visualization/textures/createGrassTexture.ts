import * as THREE from 'three';
import { assetPath } from '../../../utils/asset-path';

/**
 * Grass texture system.
 *
 * Primary: Seamless Polyhaven grass texture from /textures/pbr/grass/diff_1k.jpg
 * Fallback: Procedural canvas-based grass texture
 */

let _grassImageTexture: THREE.Texture | null = null;
let _grassImageLoadAttempted = false;

/** Configure a grass texture with tiling, anisotropy, mipmaps */
function configureGrassTex(tex: THREE.Texture): void {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 12); // ~4.2m per tile on 50m plane – less visible repetition
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
}

/**
 * Load the image-based grass texture.
 * Uses seamless Polyhaven grass, falls back to procedural texture on error.
 */
export function loadGrassImageTexture(): THREE.Texture | null {
  if (_grassImageTexture) return _grassImageTexture;
  if (_grassImageLoadAttempted) return null;

  _grassImageLoadAttempted = true;

  try {
    const loader = new THREE.TextureLoader();

    const texture = loader.load(
      assetPath('/textures/pbr/grass/diff_1k.jpg'),
      (tex) => { tex.needsUpdate = true; },
      undefined,
      () => { _grassImageTexture = null; },
    );

    configureGrassTex(texture);
    _grassImageTexture = texture;
    return texture;
  } catch {
    return null;
  }
}

let cached: THREE.CanvasTexture | null = null;

export function createGrassTexture(
  size = 512,
): THREE.CanvasTexture {
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  let seed = 77;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // Base green – muted, friendly garden lawn
  ctx.fillStyle = '#7BAD6E';
  ctx.fillRect(0, 0, size, size);

  // Blotchy variation (large scale)
  for (let i = 0; i < 60; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 20 + rand() * 60;
    const green = 90 + Math.floor(rand() * 50);
    const alpha = 0.05 + rand() * 0.12;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, `rgba(${40 + Math.floor(rand() * 30)},${green},${30 + Math.floor(rand() * 20)},${alpha})`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Small grass blade strokes
  for (let i = 0; i < 3000; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const green = 80 + Math.floor(rand() * 80);
    const alpha = 0.08 + rand() * 0.15;
    ctx.strokeStyle = `rgba(${30 + Math.floor(rand() * 40)},${green},${20 + Math.floor(rand() * 30)},${alpha})`;
    ctx.lineWidth = 0.5 + rand() * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 4, y - 2 - rand() * 6);
    ctx.stroke();
  }

  // Per-pixel noise
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (rand() - 0.5) * 10;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  texture.colorSpace = THREE.SRGBColorSpace;

  cached = texture;
  return texture;
}

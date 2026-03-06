import * as THREE from 'three';

/**
 * Creates a procedural EPDM roof membrane texture.
 * Dark anthracite with subtle surface variation.
 */

let cached: THREE.CanvasTexture | null = null;

export function createRoofTexture(
  size = 256,
): THREE.CanvasTexture {
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base anthracite – lighter for brighter, friendlier scene
  ctx.fillStyle = '#484848';
  ctx.fillRect(0, 0, size, size);

  // Subtle noise for EPDM rubber feel
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  let seed = 123;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < data.length; i += 4) {
    const noise = (rand() - 0.5) * 18;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  // Very subtle seam lines (EPDM sheets)
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < size; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;

  cached = texture;
  return texture;
}

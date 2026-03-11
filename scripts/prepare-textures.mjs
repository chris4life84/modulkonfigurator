/**
 * Prepare PBR textures for web: resize 4K → 1K
 * Run: node scripts/prepare-textures.mjs
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SRC_WOOD = 'C:/Users/PC/Downloads/planks_brown_10_4k.blend/textures';
const DST_WOOD = 'public/textures/pbr/wood';

fs.mkdirSync(DST_WOOD, { recursive: true });

const SIZE = 1024;

const tasks = [
  {
    src: path.join(SRC_WOOD, 'planks_brown_10_diff_4k.jpg'),
    dst: path.join(DST_WOOD, 'diff_1k.jpg'),
    label: 'Diffuse (color)',
  },
  {
    src: path.join(SRC_WOOD, 'planks_brown_10_rough_4k.jpg'),
    dst: path.join(DST_WOOD, 'rough_1k.jpg'),
    label: 'Roughness',
  },
  {
    src: path.join(SRC_WOOD, 'planks_brown_10_disp_4k.png'),
    dst: path.join(DST_WOOD, 'disp_1k.jpg'),
    label: 'Displacement → Bump',
  },
];

for (const task of tasks) {
  if (!fs.existsSync(task.src)) {
    console.error(`✗ Source not found: ${task.src}`);
    continue;
  }

  await sharp(task.src)
    .resize(SIZE, SIZE, { fit: 'cover' })
    .jpeg({ quality: 85 })
    .toFile(task.dst);

  const stat = fs.statSync(task.dst);
  const kb = Math.round(stat.size / 1024);
  console.log(`✓ ${task.label}: ${task.dst} (${kb} KB)`);
}

console.log('\nDone! PBR textures ready in', DST_WOOD);
console.log('\nNote: EXR Normal Map cannot be processed by sharp.');
console.log('To add normal map, export from Blender as PNG (1024x1024) → public/textures/pbr/wood/nor_1k.png');

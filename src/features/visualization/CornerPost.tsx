import { useMemo } from 'react';
import { createWoodTexture } from './textures/createWoodTexture';

const POST_SIZE = 0.08;

interface CornerPostProps {
  /** Position of post base center */
  position: [number, number, number];
  /** Height of the post */
  height: number;
  /** Wood color (darker than walls by default) */
  woodColor?: string;
}

export function CornerPost({
  position,
  height,
  woodColor = '#8D7440',
}: CornerPostProps) {
  const texture = useMemo(() => createWoodTexture(woodColor, 128, 128), [woodColor]);

  return (
    <mesh
      position={[position[0], position[1] + height / 2, position[2]]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[POST_SIZE, height, POST_SIZE]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.7}
        metalness={0}
      />
    </mesh>
  );
}

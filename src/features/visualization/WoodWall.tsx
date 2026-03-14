import { useMemo } from 'react';
import * as THREE from 'three';
import type { WallOpening } from '../../types/walls';
import { createWoodTexture, loadWoodImageTexture } from './textures/createWoodTexture';
import { loadWoodPBR, loadWallPBR, clonePBRMaps, type WoodPBRMaps } from './textures/loadWoodPBR';

const WALL_THICKNESS = 0.13;

// Shared edge material for box side faces at wall corners.
// Color matched to PaintedWood007C average tone — blends with PBR wall texture.
const wallEdgeMaterial = new THREE.MeshStandardMaterial({
  color: '#C4B48A',
  roughness: 0.8,
  metalness: 0,
  // Push edge faces slightly behind in depth buffer to prevent Z-fighting
  // at wall corners where two wall boxes overlap in the same 3D space.
  polygonOffset: true,
  polygonOffsetFactor: 2,
  polygonOffsetUnits: 2,
});

interface WoodWallProps {
  /** Wall width in meters */
  wallWidth: number;
  /** Wall height in meters */
  wallHeight: number;
  /** Position of the wall center */
  position: [number, number, number];
  /** Rotation around Y axis */
  rotationY?: number;
  /** Openings (doors/windows) in this wall */
  openings?: WallOpening[];
  /** Base wood color for texture */
  woodColor?: string;
  /** If true, render as smooth interior wall (no wood texture) */
  isInterior?: boolean;
}

interface WallSegment {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Compute solid wall segments around openings.
 * Returns rectangles in wall-local space (0,0 = bottom-left of wall).
 */
function computeWallSegments(
  wallWidth: number,
  wallHeight: number,
  openings: WallOpening[],
): WallSegment[] {
  if (openings.length === 0) {
    return [{ x: 0, y: 0, w: wallWidth, h: wallHeight }];
  }

  const segments: WallSegment[] = [];

  // Sort openings by position
  const sorted = [...openings].sort((a, b) => a.position - b.position);

  // Convert openings to absolute coordinates
  const absOpenings = sorted.map((o) => {
    const centerX = o.position * wallWidth;
    const left = Math.max(0, centerX - o.width / 2);
    const right = Math.min(wallWidth, centerX + o.width / 2);
    const bottom = o.offsetY;
    const top = Math.min(wallHeight, o.offsetY + o.height);
    return { left, right, bottom, top };
  });

  // For each opening, create segments around it
  let prevRight = 0;

  for (const opening of absOpenings) {
    // Left segment (full height, from previous edge to opening left)
    if (opening.left > prevRight + 0.01) {
      segments.push({
        x: prevRight,
        y: 0,
        w: opening.left - prevRight,
        h: wallHeight,
      });
    }

    // Segment above the opening
    if (opening.top < wallHeight - 0.01) {
      segments.push({
        x: opening.left,
        y: opening.top,
        w: opening.right - opening.left,
        h: wallHeight - opening.top,
      });
    }

    // Segment below the opening (for windows)
    if (opening.bottom > 0.01) {
      segments.push({
        x: opening.left,
        y: 0,
        w: opening.right - opening.left,
        h: opening.bottom,
      });
    }

    prevRight = opening.right;
  }

  // Right segment after last opening
  if (prevRight < wallWidth - 0.01) {
    segments.push({
      x: prevRight,
      y: 0,
      w: wallWidth - prevRight,
      h: wallHeight,
    });
  }

  // Filter out tiny slivers (< 3cm) that look bad at corners
  return segments.filter((s) => s.w > 0.03 && s.h > 0.03);
}

export function WoodWall({
  wallWidth,
  wallHeight,
  position,
  rotationY = 0,
  openings = [],
  woodColor = '#9B7530',
  isInterior = false,
}: WoodWallProps) {
  // Prefer image-based texture, fall back to procedural canvas
  const imageTexture = useMemo(() => loadWoodImageTexture(), []);
  const canvasTexture = useMemo(() => createWoodTexture(woodColor), [woodColor]);
  const texture = imageTexture ?? canvasTexture;
  const isImageBased = !!imageTexture;

  // Load PBR maps ONCE at wall level — shared by all segments for consistency
  // PBR maps for both exterior AND interior walls (same wood texture)
  const pbrMaps = useMemo(() => loadWoodPBR() ?? loadWallPBR(), []);

  // Clamp openings to match OpeningsGroup (15cm margin from wall edges)
  // This ensures the hole in the wall matches the rendered window/door frame
  const clampedOpenings = useMemo(() => {
    const margin = 0.15;
    const maxW = Math.max(0.3, wallWidth - margin * 2);
    return openings.map((o) => {
      const w = Math.min(o.width, maxW);
      const halfW = w / 2;
      const minPos = (halfW + margin) / wallWidth;
      const maxPos = 1 - minPos;
      const pos = Math.max(minPos, Math.min(maxPos, o.position));
      return { ...o, width: w, position: pos };
    });
  }, [openings, wallWidth]);

  const segments = useMemo(
    () => computeWallSegments(wallWidth, wallHeight, clampedOpenings),
    [wallWidth, wallHeight, clampedOpenings],
  );

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {segments.map((seg, i) => (
        <WallSegmentMesh
          key={i}
          segment={seg}
          wallWidth={wallWidth}
          wallHeight={wallHeight}
          texture={texture}
          isImageBased={isImageBased}
          isInterior={isInterior}
          pbrMaps={pbrMaps}
        />
      ))}
    </group>
  );
}

interface WallSegmentMeshProps {
  segment: WallSegment;
  wallWidth: number;
  wallHeight: number;
  texture: THREE.Texture;
  isImageBased: boolean;
  isInterior?: boolean;
  /** PBR maps passed from parent WoodWall for consistent texture across all segments */
  pbrMaps: WoodPBRMaps | null;
}

function WallSegmentMesh({ segment, wallWidth, wallHeight, texture, isImageBased, isInterior = false, pbrMaps }: WallSegmentMeshProps) {

  const clonedTexture = useMemo(() => {
    const t = texture.clone();
    t.needsUpdate = true;
    t.anisotropy = 16;

    if (isImageBased) {
      // Image texture with rotation: needs center for rotation pivot
      t.center.set(0.5, 0.5);
      t.rotation = Math.PI / 2;
      const scale = 1.0;
      t.repeat.set(segment.w / scale, segment.h / scale);
      // Adjust offset to compensate for center shift:
      // With center=(0.5,0.5) the UV formula is: (uv - 0.5) * repeat + 0.5 + offset
      // We need: texture_at_uv0 = segment.x/scale → offset = segment.x/scale - 0.5 + 0.5*repeat.x
      // But since rotation=PI/2 swaps axes, we use raw offset for the rotated mapping
      t.offset.set(segment.x / scale, segment.y / scale);
    } else {
      // Canvas texture: scale UV to match segment relative to full wall
      t.repeat.set(segment.w / wallWidth, segment.h / wallHeight);
      t.offset.set(segment.x / wallWidth, segment.y / wallHeight);
    }

    return t;
  }, [texture, segment, wallWidth, wallHeight, isImageBased]);

  // Textured material for ALL faces (including edges)
  // Interior walls: smooth flat color without wood texture
  // Exterior walls: PBR wood texture with diffuse + roughnessMap + bumpMap
  const faceMaterial = useMemo(() => {
    if (pbrMaps) {
      const scale = 1.0;
      const repeat: [number, number] = [segment.w / scale, segment.h / scale];
      const offset: [number, number] = [segment.x / scale, segment.y / scale];
      const cloned = clonePBRMaps(pbrMaps, repeat, offset, 0);

      const mat = new THREE.MeshStandardMaterial({
        map: cloned.diffuse,
        roughnessMap: cloned.roughness,
        roughness: 1.0,
        metalness: 0,
      });

      if (cloned.bump) {
        mat.bumpMap = cloned.bump;
        mat.bumpScale = 0.02;
      }
      if (cloned.normal) {
        mat.normalMap = cloned.normal;
        mat.normalScale = new THREE.Vector2(0.8, 0.8);
      }

      return mat;
    }

    // Fallback: image or procedural texture
    return new THREE.MeshStandardMaterial({
      map: clonedTexture,
      roughness: 0.45,
      metalness: 0,
    });
  }, [pbrMaps, clonedTexture, segment, isInterior]);

  // Multi-material: textured front/back faces, plain edge material for box sides.
  // BoxGeometry groups: 0=+X, 1=-X, 2=+Y, 3=-Y, 4=+Z(front), 5=-Z(back)
  const meshMaterial = useMemo((): THREE.Material | THREE.Material[] => {
    const edge = wallEdgeMaterial;
    return [edge, edge, edge, edge, faceMaterial, faceMaterial];
  }, [faceMaterial, isInterior]);

  // Position segment center relative to wall origin (bottom-left)
  const cx = segment.x + segment.w / 2 - wallWidth / 2;
  const cy = segment.y + segment.h / 2;

  return (
    <mesh
      position={[cx, cy, 0]}
      castShadow
      receiveShadow
      material={meshMaterial}
    >
      <boxGeometry args={[segment.w, segment.h, WALL_THICKNESS]} />
    </mesh>
  );
}

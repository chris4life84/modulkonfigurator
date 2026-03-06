import { Sky, Environment } from '@react-three/drei';

/**
 * Environment setup: Procedural sky + soft lighting for garden house configurator.
 * Uses drei's Sky (Preetham atmospheric model) for a stylized, natural sky.
 * A neutral environment preset provides realistic reflections on glass/metal
 * without using an HDR panorama as background.
 */
export function EnvironmentSetup() {
  return (
    <>
      {/* Procedural sky – warm afternoon sun, garden-friendly atmosphere */}
      <Sky
        distance={450000}
        sunPosition={[80, 20, -40]}
        inclination={0.52}
        azimuth={0.25}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
        rayleigh={1.2}
        turbidity={4}
      />

      {/* Neutral environment map for material reflections only (not visible as background) */}
      <Environment
        preset="park"
        environmentIntensity={0.35}
      />

      {/* Atmospheric fog – hides grass edge, creates depth, matches sky at horizon */}
      <fog attach="fog" args={['#C8D8E8', 40, 120]} />

      {/* Main directional light (sun) – warm golden afternoon light */}
      <directionalLight
        position={[15, 25, 10]}
        intensity={1.8}
        color="#FFF3D4"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={60}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.0005}
      />

      {/* Soft fill light from the opposite side */}
      <directionalLight
        position={[-10, 10, -5]}
        intensity={0.3}
        color="#B0C8E0"
      />

      {/* Ambient fill – warm base to prevent dark areas */}
      <ambientLight intensity={0.55} color="#F5F0E8" />

      {/* Hemisphere light: sky blue above, warm grass-reflected light below */}
      <hemisphereLight
        args={['#87CEEB', '#8B9D6B', 0.4]}
      />
    </>
  );
}

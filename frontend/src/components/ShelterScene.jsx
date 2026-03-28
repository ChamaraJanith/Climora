import { useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { TextureLoader } from 'three';
import * as THREE from 'three';

// CORS-friendly Earth textures from Solar System Scope (CC BY 4.0) & NASA
const EARTH_DAY    = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg';
const EARTH_NIGHT  = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_lights_2048.png';
const EARTH_SPEC   = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg';
const EARTH_CLOUDS = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png';
const EARTH_BUMP   = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg';

function Earth() {
  const earthRef  = useRef();
  const cloudsRef = useRef();
  const glowRef   = useRef();

  const [dayMap, nightMap, specMap, cloudsMap, bumpMap] = useLoader(TextureLoader, [
    EARTH_DAY, EARTH_NIGHT, EARTH_SPEC, EARTH_CLOUDS, EARTH_BUMP,
  ]);

  useFrame((_, delta) => {
    if (earthRef.current)  earthRef.current.rotation.y  += delta * 0.06;
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.07;
  });

  return (
    <group>
      {/* Earth core */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[2, 128, 128]} />
        <meshPhongMaterial
          map={dayMap}
          emissiveMap={nightMap}
          emissive={new THREE.Color(0xffffff)}
          emissiveIntensity={0.6}
          specularMap={specMap}
          specular={new THREE.Color(0x4488ff)}
          shininess={18}
          bumpMap={bumpMap}
          bumpScale={0.05}
        />
      </mesh>

      {/* Cloud layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.03, 128, 128]} />
        <meshPhongMaterial
          map={cloudsMap}
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[2.12, 64, 64]} />
        <meshPhongMaterial
          color={new THREE.Color(0x1a6fff)}
          transparent
          opacity={0.08}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>

      {/* Outer atmosphere rim */}
      <mesh>
        <sphereGeometry args={[2.22, 64, 64]} />
        <meshPhongMaterial
          color={new THREE.Color(0x0066ff)}
          transparent
          opacity={0.04}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default function ShelterScene() {
  return (
    <div className="h-full w-full">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      >
        {/* Space stars */}
        <Stars radius={300} depth={60} count={6000} factor={3} saturation={0.3} fade speed={0.5} />

        {/* Sun-like directional light from the right */}
        <directionalLight position={[5, 3, 5]} intensity={3.5} color="#fff5e0" />
        {/* Subtle fill from the dark side */}
        <ambientLight intensity={0.04} />
        {/* Subtle blue bounce from space */}
        <pointLight position={[-8, -4, -6]} intensity={0.4} color="#1a4fff" />

        <Earth />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          minPolarAngle={Math.PI / 3.5}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>
    </div>
  );
}

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Stars, Float } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

const CyberGlobe = () => {
  const groupRef = useRef();
  const innerRef = useRef();
  const ringRef = useRef();
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
        groupRef.current.rotation.y = t * 0.1;
        groupRef.current.rotation.x = Math.sin(t * 0.2) * 0.1;
    }
    if (innerRef.current) {
        innerRef.current.rotation.y = -t * 0.15;
    }
    if (ringRef.current) {
        ringRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.5) * 0.1;
        ringRef.current.rotation.z = t * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Core Glowing Sphere */}
      <Sphere ref={innerRef} args={[1.5, 64, 64]}>
        <meshPhysicalMaterial
          color="#06b6d4"
          emissive="#06b6d4"
          emissiveIntensity={1}
          transparent={true}
          opacity={0.8}
          roughness={0.2}
          metalness={1}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </Sphere>
      
      {/* Outer Wireframe Grid */}
      <Sphere args={[2, 32, 24]}>
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#1e3a8a"
          emissiveIntensity={0.5}
          wireframe={true}
          transparent={true}
          opacity={0.15}
        />
      </Sphere>

      {/* Orbiting Tech Ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[2.5, 0.02, 16, 100]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} transparent opacity={0.6} />
      </mesh>
      
      {/* Second Tech Ring */}
      <mesh rotation={[Math.PI / 3, 0, 0]}>
         <torusGeometry args={[3, 0.01, 16, 100]} />
         <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={1} transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

export default function ShelterScene() {
  return (
    <div className="h-full w-full relative">
      <Canvas camera={{ position: [0, 0, 7], fov: 60 }} gl={{ antialias: true, alpha: true }}>
        <fog attach="fog" args={['#050b1c', 2, 15]} />
        <ambientLight intensity={0.2} />
        {/* Core light for the globe */}
        <pointLight position={[0, 0, 0]} intensity={2} color="#06b6d4" />
        {/* Beautiful blue/cyan dramatic lighting */}
        <spotLight position={[5, 10, 5]} angle={0.5} penumbra={1} intensity={10} color="#3b82f6" />
        <spotLight position={[-5, -10, -5]} angle={0.5} penumbra={1} intensity={5} color="#22d3ee" />
        
        {/* Background stars */}
        <Stars radius={100} depth={50} count={4000} factor={4} saturation={0.5} fade speed={1} />
        
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
          <CyberGlobe />
        </Float>
        
        <OrbitControls enableZoom={false} enablePan={false} autoRotate={true} autoRotateSpeed={0.5} maxPolarAngle={Math.PI / 1.5} minPolarAngle={Math.PI / 3} />
      </Canvas>
    </div>
  );
}
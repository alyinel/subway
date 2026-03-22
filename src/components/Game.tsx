import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Sky, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField, Vignette } from '@react-three/postprocessing';
import { Player } from './Player';
import { Guard } from './Guard';
import { ObstacleManager } from './ObstacleManager';
import { City } from './City';
import { useGameStore } from '../store';
import * as THREE from 'three';
import { useRef } from 'react';

function CameraController() {
  const status = useGameStore(state => state.status);
  const isJumping = useGameStore(state => state.isJumping);
  const config = useGameStore(state => state.config);
  
  // Ref to store the current lookAt target for smooth interpolation
  const lookAtTarget = useRef(new THREE.Vector3(0, 2, 10));
  
  useFrame((state, delta) => {
    if (status === 'playing') {
      useGameStore.getState().tick(delta);
    }
    
    const yOffset = config.cameraSettings?.yOffset ?? 5;
    const zOffset = config.cameraSettings?.zOffset ?? -10;

    if (status === 'character_select') {
      // Close up view for character selection
      state.camera.position.lerp(new THREE.Vector3(0, 2, -4), 5 * delta);
      lookAtTarget.current.lerp(new THREE.Vector3(0, 1, 0), 5 * delta);
    } else {
      // Normal game view
      // Slight camera shake on jump
      const shakeY = isJumping ? Math.sin(state.clock.elapsedTime * 20) * 0.1 : 0;
      state.camera.position.lerp(new THREE.Vector3(0, yOffset + shakeY, zOffset), 5 * delta);
      lookAtTarget.current.lerp(new THREE.Vector3(0, 2, 10), 5 * delta);
    }
    
    state.camera.lookAt(lookAtTarget.current);
  });
  return null;
}

export function Game() {
  const config = useGameStore(state => state.config);
  const skyColor = config.skyColor || '#87CEEB';
  const roadColor = config.roadColor || '#374151';
  
  const ambientIntensity = config.lightSettings?.ambientIntensity ?? 0.6;
  const directionalIntensity = config.lightSettings?.directionalIntensity ?? 1.5;
  const directionalColor = config.lightSettings?.directionalColor ?? '#ffffff';
  const fov = config.cameraSettings?.fov ?? 60;

  return (
    <Canvas shadows dpr={[1, 2]} gl={{ antialias: false }}>
      <PerspectiveCamera makeDefault position={[0, 5, -10]} fov={fov} />
      <CameraController />
      
      <color attach="background" args={[skyColor]} />
      <fog attach="fog" args={[skyColor, 50, 150]} />
      
      <ambientLight intensity={ambientIntensity} />
      <directionalLight 
        position={[20, 40, -20]} 
        intensity={directionalIntensity} 
        color={directionalColor}
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={100}
        shadow-camera-bottom={-20}
        shadow-camera-far={200}
      />
      
      <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
      
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 50]} receiveShadow>
        <planeGeometry args={[40, 300]} />
        <meshStandardMaterial color={roadColor} roughness={0.8} />
      </mesh>

      {/* Lane markings */}
      {[-1.5, 1.5].map((x, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0, 50]}>
          <planeGeometry args={[0.2, 300]} />
          <meshBasicMaterial color="#fff" transparent opacity={0.5} />
        </mesh>
      ))}

      <Player />
      <Guard />
      <ObstacleManager />
      <City />
      
      <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={20} blur={2} far={4} />

      <EffectComposer>
        <Bloom luminanceThreshold={1} mipmapBlur intensity={0.5} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  );
}

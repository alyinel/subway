import { useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store';
import * as THREE from 'three';
import { GLTFModel } from './GLTFModel';

const LANE_WIDTH = 3;

export function Player() {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  
  const lane = useGameStore((state) => state.lane);
  const isJumping = useGameStore((state) => state.isJumping);
  const isSliding = useGameStore((state) => state.isSliding);
  const status = useGameStore((state) => state.status);
  const powerup = useGameStore((state) => state.powerup);
  const invulnerableTimer = useGameStore((state) => state.invulnerableTimer);
  const character = useGameStore((state) => state.character);
  const config = useGameStore((state) => state.config);

  const customModelUrl = config.characterModels?.[character];

  const targetX = status === 'character_select' ? 0 : -lane * LANE_WIDTH; // Center in select mode
  const targetY = status === 'character_select' ? 1 : powerup === 'fly' ? 6 : isJumping ? 2.5 : isSliding ? 0.5 : 1;
  const targetScaleY = isSliding ? 0.5 : 1;

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (status === 'character_select') {
      // Slowly rotate character in select mode
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 10 * delta);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 15 * delta);
      groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, targetScaleY, 15 * delta);
      
      groupRef.current.rotation.y += delta * 0.5;
      groupRef.current.rotation.x = 0;
      groupRef.current.rotation.z = 0;
      
      // Reset limbs
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      return;
    }

    if (status === 'menu') {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 10 * delta);
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 10 * delta);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 15 * delta);
      groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, targetScaleY, 15 * delta);
      
      // Reset limbs
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      return;
    }

    if (status !== 'playing') return;

    // Reset rotation from character select
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 10 * delta);

    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 10 * delta);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 15 * delta);
    groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, targetScaleY, 15 * delta);

    const t = state.clock.elapsedTime;
    const runSpeed = 20;

    if (powerup === 'fly') {
      // Flying pose
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0.5, 5 * delta);
      if (leftArmRef.current) leftArmRef.current.rotation.x = -Math.PI;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.PI;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0.2;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0.2;
    } else if (powerup === 'hoverboard') {
      // Hoverboard pose
      groupRef.current.rotation.x = 0;
      groupRef.current.rotation.y = Math.sin(t * 5) * 0.1;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -0.5;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.5;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
    } else if (!isJumping && !isSliding) {
      // Running animation
      groupRef.current.rotation.x = 0;
      groupRef.current.rotation.y = 0;
      groupRef.current.rotation.z = Math.sin(t * runSpeed) * 0.05;
      groupRef.current.position.y = 1 + Math.abs(Math.sin(t * runSpeed)) * 0.2;
      
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * runSpeed + Math.PI) * 0.8;
      if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(t * runSpeed) * 0.8;
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t * runSpeed) * 0.8;
      if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(t * runSpeed + Math.PI) * 0.8;
    } else {
      // Jump/Slide pose
      groupRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -Math.PI;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.PI;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
    }
  });

  const isBlinking = invulnerableTimer > 0 && Math.floor(invulnerableTimer * 10) % 2 === 0;

  return (
    <group ref={groupRef} position={[0, 1, 0]} visible={!isBlinking}>
      {customModelUrl ? (
        <Suspense fallback={null}>
          <GLTFModel url={customModelUrl} scale={1} position={[0, -0.5, 0]} />
        </Suspense>
      ) : (
        <>
          {/* Character Models */}
          {character === 'default' && (
            <>
              {/* Torso */}
              <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
                <boxGeometry args={[0.5, 0.7, 0.3]} />
                <meshStandardMaterial color="#ef4444" roughness={0.6} />
              </mesh>
              
              {/* Head */}
              <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshStandardMaterial color="#fcd34d" roughness={0.4} />
              </mesh>
              
              {/* Hat Base */}
              <mesh castShadow receiveShadow position={[0, 0.95, 0]}>
                <cylinderGeometry args={[0.26, 0.26, 0.15, 16]} />
                <meshStandardMaterial color="#3b82f6" roughness={0.8} />
              </mesh>
              {/* Hat Brim */}
              <mesh castShadow receiveShadow position={[0, 0.9, 0.2]}>
                <boxGeometry args={[0.5, 0.05, 0.4]} />
                <meshStandardMaterial color="#3b82f6" roughness={0.8} />
              </mesh>
            </>
          )}

          {character === 'robot' && (
            <>
              {/* Torso */}
              <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
                <boxGeometry args={[0.6, 0.7, 0.4]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
              </mesh>
              
              {/* Head */}
              <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
                <boxGeometry args={[0.4, 0.4, 0.4]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} />
              </mesh>
              
              {/* Eyes */}
              <mesh position={[-0.1, 0.8, 0.21]}>
                <boxGeometry args={[0.1, 0.05, 0.05]} />
                <meshBasicMaterial color="#06b6d4" />
              </mesh>
              <mesh position={[0.1, 0.8, 0.21]}>
                <boxGeometry args={[0.1, 0.05, 0.05]} />
                <meshBasicMaterial color="#06b6d4" />
              </mesh>
            </>
          )}

          {character === 'ninja' && (
            <>
              {/* Torso */}
              <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
                <boxGeometry args={[0.45, 0.7, 0.25]} />
                <meshStandardMaterial color="#1f2937" roughness={0.8} />
              </mesh>
              
              {/* Head */}
              <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
                <sphereGeometry args={[0.22, 16, 16]} />
                <meshStandardMaterial color="#fcd34d" roughness={0.4} />
              </mesh>

              {/* Mask */}
              <mesh castShadow receiveShadow position={[0, 0.75, 0.02]}>
                <sphereGeometry args={[0.23, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
                <meshStandardMaterial color="#111827" roughness={0.9} />
              </mesh>
              
              {/* Headband */}
              <mesh castShadow receiveShadow position={[0, 0.85, 0]}>
                <cylinderGeometry args={[0.23, 0.23, 0.08, 16]} />
                <meshStandardMaterial color="#dc2626" roughness={0.8} />
              </mesh>
            </>
          )}

          {/* Left Arm */}
          <group position={[-0.35, 0.4, 0]} ref={leftArmRef}>
            <mesh position={[0, -0.25, 0]} castShadow>
              {character === 'robot' ? <boxGeometry args={[0.15, 0.4, 0.15]} /> : <capsuleGeometry args={[0.08, 0.4, 4, 8]} />}
              <meshStandardMaterial color={character === 'robot' ? '#94a3b8' : character === 'ninja' ? '#1f2937' : '#fcd34d'} metalness={character === 'robot' ? 0.8 : 0} />
            </mesh>
          </group>

          {/* Right Arm */}
          <group position={[0.35, 0.4, 0]} ref={rightArmRef}>
            <mesh position={[0, -0.25, 0]} castShadow>
              {character === 'robot' ? <boxGeometry args={[0.15, 0.4, 0.15]} /> : <capsuleGeometry args={[0.08, 0.4, 4, 8]} />}
              <meshStandardMaterial color={character === 'robot' ? '#94a3b8' : character === 'ninja' ? '#1f2937' : '#fcd34d'} metalness={character === 'robot' ? 0.8 : 0} />
            </mesh>
          </group>

          {/* Left Leg */}
          <group position={[-0.15, -0.15, 0]} ref={leftLegRef}>
            <mesh position={[0, -0.3, 0]} castShadow>
              {character === 'robot' ? <boxGeometry args={[0.15, 0.5, 0.15]} /> : <capsuleGeometry args={[0.1, 0.5, 4, 8]} />}
              <meshStandardMaterial color={character === 'robot' ? '#64748b' : character === 'ninja' ? '#111827' : '#1d4ed8'} metalness={character === 'robot' ? 0.8 : 0} />
            </mesh>
          </group>

          {/* Right Leg */}
          <group position={[0.15, -0.15, 0]} ref={rightLegRef}>
            <mesh position={[0, -0.3, 0]} castShadow>
              {character === 'robot' ? <boxGeometry args={[0.15, 0.5, 0.15]} /> : <capsuleGeometry args={[0.1, 0.5, 4, 8]} />}
              <meshStandardMaterial color={character === 'robot' ? '#64748b' : character === 'ninja' ? '#111827' : '#1d4ed8'} metalness={character === 'robot' ? 0.8 : 0} />
            </mesh>
          </group>
        </>
      )}

      {/* Hoverboard */}
      {powerup === 'hoverboard' && (
        <mesh position={[0, -0.9, 0]} castShadow>
          <boxGeometry args={[0.8, 0.1, 1.8]} />
          <meshStandardMaterial color="#10b981" metalness={0.5} roughness={0.2} />
          {/* Thrusters */}
          <mesh position={[0, -0.1, -0.7]}>
            <cylinderGeometry args={[0.1, 0.1, 0.2]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </mesh>
      )}

      {/* Fly Jetpack */}
      {powerup === 'fly' && (
        <group position={[0, 0.3, -0.2]}>
          <mesh castShadow>
            <boxGeometry args={[0.4, 0.6, 0.2]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} />
          </mesh>
          {/* Flames */}
          <mesh position={[-0.1, -0.4, 0]}>
            <coneGeometry args={[0.1, 0.4]} />
            <meshBasicMaterial color="#f97316" />
          </mesh>
          <mesh position={[0.1, -0.4, 0]}>
            <coneGeometry args={[0.1, 0.4]} />
            <meshBasicMaterial color="#f97316" />
          </mesh>
        </group>
      )}

      {/* Invincible Aura */}
      {powerup === 'invincible' && (
        <mesh>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.3} wireframe />
        </mesh>
      )}
    </group>
  );
}

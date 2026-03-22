import { useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store';
import * as THREE from 'three';
import { GLTFModel } from './GLTFModel';

export function Guard() {
  const groupRef = useRef<THREE.Group>(null);
  const guardDistance = useGameStore((state) => state.guardDistance);
  const status = useGameStore((state) => state.status);
  const playerLane = useGameStore((state) => state.lane);
  const config = useGameStore((state) => state.config);

  const customModelUrl = config.guardModel;

  useFrame((state, delta) => {
    if (!groupRef.current || status !== 'playing') {
      if (groupRef.current) groupRef.current.visible = false;
      return;
    }

    // Target Z based on guardDistance state
    // 0: far behind (-15), 1: close (-4), 2: caught (-1)
    const targetZ = guardDistance === 0 ? -15 : guardDistance === 1 ? -4 : -1;
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 2 * delta);

    // Hide guard when far behind camera
    if (guardDistance === 0 && groupRef.current.position.z < -11) {
      groupRef.current.visible = false;
    } else {
      groupRef.current.visible = true;
    }

    // Follow player lane slightly delayed
    const targetX = -playerLane * 3;
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 5 * delta);

    // Running wobble
    groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 14) * 0.1;
    groupRef.current.position.y = 1 + Math.abs(Math.sin(state.clock.elapsedTime * 14)) * 0.2;
  });

  return (
    <group ref={groupRef} position={[0, 1, -15]}>
      {customModelUrl ? (
        <Suspense fallback={null}>
          <GLTFModel url={customModelUrl} scale={1} position={[0, -0.5, 0]} />
        </Suspense>
      ) : (
        <>
          {/* Body */}
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <capsuleGeometry args={[0.5, 1.2, 4, 8]} />
            <meshStandardMaterial color="#1f2937" roughness={0.5} />
          </mesh>
          {/* Head */}
          <mesh castShadow receiveShadow position={[0, 1, 0]}>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshStandardMaterial color="#fcd34d" roughness={0.4} />
          </mesh>
          {/* Hat */}
          <mesh castShadow receiveShadow position={[0, 1.3, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
            <meshStandardMaterial color="#111827" />
          </mesh>
          {/* Flashlight */}
          <mesh castShadow receiveShadow position={[0.4, 0.2, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.6]} />
            <meshStandardMaterial color="#000" />
          </mesh>
          <pointLight position={[0.4, 0.2, 0.8]} color="#fef08a" intensity={2} distance={15} />
        </>
      )}
    </group>
  );
}

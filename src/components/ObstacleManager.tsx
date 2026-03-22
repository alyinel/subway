import { useRef, useState, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store';
import * as THREE from 'three';
import { GLTFModel } from './GLTFModel';

const LANE_WIDTH = 3;
const SPAWN_Z = 150;
const DESPAWN_Z = -20;

type ObstacleType = 'barrier' | 'train' | 'car' | 'coin' | 'sign' | 'powerup_invincible' | 'powerup_hoverboard' | 'powerup_fly';

interface Obstacle {
  id: number;
  type: ObstacleType;
  lane: number;
  z: number;
  active: boolean;
}

export function ObstacleManager() {
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const nextId = useRef(0);
  const lastSpawnZ = useRef(0);
  const playerVisualX = useRef(0);
  
  const status = useGameStore((state) => state.status);
  const speed = useGameStore((state) => state.speed);
  const hitObstacle = useGameStore((state) => state.hitObstacle);
  const collectCoin = useGameStore((state) => state.collectCoin);
  const collectPowerup = useGameStore((state) => state.collectPowerup);
  const playerLane = useGameStore((state) => state.lane);
  const isJumping = useGameStore((state) => state.isJumping);
  const isSliding = useGameStore((state) => state.isSliding);
  const config = useGameStore((state) => state.config);

  // Reset on game start
  useFrame(() => {
    if ((status === 'menu' || status === 'character_select') && obstacles.length > 0) {
      setObstacles([]);
      lastSpawnZ.current = 0;
    }
  });

  useFrame((state, delta) => {
    if (status !== 'playing') return;

    // Update player visual X to match Player.tsx
    const targetX = -playerLane * LANE_WIDTH;
    playerVisualX.current = THREE.MathUtils.lerp(playerVisualX.current, targetX, 10 * delta);

    const moveDist = speed * delta;
    useGameStore.getState().updateDistance(moveDist);

    // Spawn new obstacles
    if (lastSpawnZ.current < SPAWN_Z) {
      const spawnCount = Math.floor((SPAWN_Z - lastSpawnZ.current) / 20);
      for (let i = 0; i < spawnCount; i++) {
        const lane = Math.floor(Math.random() * 3) - 1;
        const rand = Math.random();
        let type: ObstacleType = 'coin';
        if (rand > 0.98) type = 'powerup_fly';
        else if (rand > 0.96) type = 'powerup_hoverboard';
        else if (rand > 0.94) type = 'powerup_invincible';
        else if (rand > 0.8) type = 'train';
        else if (rand > 0.6) type = 'car';
        else if (rand > 0.4) type = 'sign';
        else if (rand > 0.2) type = 'barrier';

        setObstacles(prev => [...prev, {
          id: nextId.current++,
          type,
          lane,
          z: SPAWN_Z + i * 20,
          active: true
        }]);

        // Sometimes spawn coins in a line
        if (type === 'coin' && Math.random() > 0.5) {
          for (let j = 1; j < 5; j++) {
            setObstacles(prev => [...prev, {
              id: nextId.current++,
              type: 'coin',
              lane,
              z: SPAWN_Z + i * 20 + j * 3,
              active: true
            }]);
          }
        }
      }
      lastSpawnZ.current += spawnCount * 20;
    }
    lastSpawnZ.current -= moveDist;

    // Move and collide
    setObstacles(prev => prev.map(obs => {
      if (!obs.active) return obs;

      const newZ = obs.z - moveDist;
      
      // Collision detection (player is at Z=0)
      const obsX = -obs.lane * LANE_WIDTH;
      const isSameLane = Math.abs(playerVisualX.current - obsX) < 1.2;

      let zMin = -0.5;
      let zMax = 0.5;
      if (obs.type === 'train') {
        zMin = -5.5;
        zMax = 5.5;
      } else if (obs.type === 'car') {
        zMin = -2;
        zMax = 2;
      }

      // Check if obstacle is currently in the collision zone, or if it passed through it this frame (tunneling)
      const isZCollision = obs.z >= zMin && newZ <= zMax;

      if (isZCollision && isSameLane) {
        if (obs.type === 'coin') {
          collectCoin();
          return { ...obs, z: newZ, active: false };
        } else if (obs.type.startsWith('powerup_')) {
          collectPowerup(obs.type.replace('powerup_', '') as any);
          return { ...obs, z: newZ, active: false };
        } else {
          // It's an obstacle
          const powerup = useGameStore.getState().powerup;
          if (powerup === 'fly') return { ...obs, z: newZ }; // Fly over it

          if (obs.type === 'barrier' && isJumping) return { ...obs, z: newZ }; // Jump over
          if (obs.type === 'car' && isJumping) return { ...obs, z: newZ }; // Jump over
          if (obs.type === 'sign' && isSliding) return { ...obs, z: newZ }; // Slide under

          // Hit!
          const isInstantGameOver = obs.type === 'train' || obs.type === 'car';
          hitObstacle(isInstantGameOver);
          
          return { ...obs, z: newZ, active: false };
        }
      }

      return { ...obs, z: newZ };
    }).filter(obs => obs.z > DESPAWN_Z));
  });

  return (
    <group>
      {obstacles.map(obs => {
        if (!obs.active) return null;
        const x = -obs.lane * LANE_WIDTH;
        
        if (obs.type === 'coin') {
          return (
            <mesh key={obs.id} position={[x, 1, obs.z]} rotation={[Math.PI / 2, 0, Date.now() * 0.005]}>
              {config.obstacleModels?.coin ? (
                <Suspense fallback={null}>
                  <GLTFModel url={config.obstacleModels.coin} scale={1} rotation={[-Math.PI / 2, 0, 0]} />
                </Suspense>
              ) : (
                <>
                  <cylinderGeometry args={[0.4, 0.4, 0.1, 16]} />
                  <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
                </>
              )}
            </mesh>
          );
        } else if (obs.type === 'barrier') {
          return (
            <mesh key={obs.id} position={[x, 0.5, obs.z]} castShadow receiveShadow>
              {config.obstacleModels?.barrier ? (
                <Suspense fallback={null}>
                  <GLTFModel url={config.obstacleModels.barrier} scale={1} position={[0, -0.5, 0]} />
                </Suspense>
              ) : (
                <>
                  <boxGeometry args={[2.5, 1, 0.5]} />
                  <meshStandardMaterial color="#f97316" roughness={0.7} />
                </>
              )}
            </mesh>
          );
        } else if (obs.type === 'train') {
          return (
            <mesh key={obs.id} position={[x, 2, obs.z]} castShadow receiveShadow>
              {config.obstacleModels?.train ? (
                <Suspense fallback={null}>
                  <GLTFModel url={config.obstacleModels.train} scale={1} position={[0, -2, 0]} />
                </Suspense>
              ) : (
                <>
                  <boxGeometry args={[2.8, 4, 12]} />
                  <meshStandardMaterial color="#dc2626" roughness={0.4} metalness={0.6} />
                </>
              )}
            </mesh>
          );
        } else if (obs.type === 'car') {
          return (
            <group key={obs.id} position={[x, 0, obs.z]}>
              {config.obstacleModels?.car ? (
                <Suspense fallback={null}>
                  <GLTFModel url={config.obstacleModels.car} scale={1} />
                </Suspense>
              ) : (
                <>
                  <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
                    <boxGeometry args={[2.4, 1.2, 4.5]} />
                    <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.8} />
                  </mesh>
                  <mesh position={[0, 1.5, -0.5]} castShadow receiveShadow>
                    <boxGeometry args={[2.2, 0.8, 2.5]} />
                    <meshStandardMaterial color="#1e3a8a" roughness={0.2} metalness={0.9} />
                  </mesh>
                </>
              )}
            </group>
          );
        } else if (obs.type === 'sign') {
          return (
            <group key={obs.id} position={[x, 0, obs.z]}>
              {config.obstacleModels?.sign ? (
                <Suspense fallback={null}>
                  <GLTFModel url={config.obstacleModels.sign} scale={1} />
                </Suspense>
              ) : (
                <>
                  <mesh position={[-1, 1, 0]} castShadow>
                    <cylinderGeometry args={[0.1, 0.1, 2]} />
                    <meshStandardMaterial color="#9ca3af" />
                  </mesh>
                  <mesh position={[1, 1, 0]} castShadow>
                    <cylinderGeometry args={[0.1, 0.1, 2]} />
                    <meshStandardMaterial color="#9ca3af" />
                  </mesh>
                  <mesh position={[0, 1.8, 0]} castShadow>
                    <boxGeometry args={[2.5, 0.8, 0.2]} />
                    <meshStandardMaterial color="#2563eb" />
                  </mesh>
                </>
              )}
            </group>
          );
        } else if (obs.type === 'powerup_invincible') {
          return (
            <mesh key={obs.id} position={[x, 1, obs.z]} rotation={[0, Date.now() * 0.005, 0]}>
              {config.powerupModels?.invincible ? (
                <Suspense fallback={null}>
                  <GLTFModel url={config.powerupModels.invincible} scale={1} />
                </Suspense>
              ) : (
                <>
                  <octahedronGeometry args={[0.5]} />
                  <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
                </>
              )}
            </mesh>
          );
        } else if (obs.type === 'powerup_hoverboard') {
          return (
            <mesh key={obs.id} position={[x, 1, obs.z]} rotation={[0, Date.now() * 0.005, 0]}>
              {config.powerupModels?.hoverboard ? (
                <Suspense fallback={null}>
                  <GLTFModel url={config.powerupModels.hoverboard} scale={1} />
                </Suspense>
              ) : (
                <>
                  <boxGeometry args={[0.8, 0.2, 1.5]} />
                  <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
                </>
              )}
            </mesh>
          );
        } else if (obs.type === 'powerup_fly') {
          return (
            <mesh key={obs.id} position={[x, 1, obs.z]} rotation={[0, Date.now() * 0.005, 0]}>
              {config.powerupModels?.fly ? (
                <Suspense fallback={null}>
                  <GLTFModel url={config.powerupModels.fly} scale={1} />
                </Suspense>
              ) : (
                <>
                  <coneGeometry args={[0.4, 1, 4]} />
                  <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.5} />
                </>
              )}
            </mesh>
          );
        }
        return null;
      })}
    </group>
  );
}

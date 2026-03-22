import { useRef, useState, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store';
import { GLTFModel } from './GLTFModel';

interface Building {
  id: number;
  x: number;
  z: number;
  height: number;
  width: number;
  depth: number;
  color: string;
}

const COLORS = ['#1e293b', '#334155', '#475569', '#0f172a'];

export function City() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const nextId = useRef(0);
  const lastSpawnZ = useRef(0);
  const speed = useGameStore(state => state.speed);
  const status = useGameStore(state => state.status);
  const config = useGameStore(state => state.config);

  // Reset on game start
  useFrame(() => {
    if ((status === 'menu' || status === 'character_select') && buildings.length > 0) {
      setBuildings([]);
      lastSpawnZ.current = 0;
    }
  });

  useFrame((state, delta) => {
    if (status !== 'playing') return;
    
    const moveDist = speed * delta;

    if (lastSpawnZ.current < 200) {
      const spawnCount = Math.floor((200 - lastSpawnZ.current) / 15);
      for (let i = 0; i < spawnCount; i++) {
        const z = 200 + i * 15;
        // Left building
        setBuildings(prev => [...prev, {
          id: nextId.current++,
          x: -10 - Math.random() * 5,
          z,
          height: 10 + Math.random() * 40,
          width: 5 + Math.random() * 5,
          depth: 10 + Math.random() * 5,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        }]);
        // Right building
        setBuildings(prev => [...prev, {
          id: nextId.current++,
          x: 10 + Math.random() * 5,
          z,
          height: 10 + Math.random() * 40,
          width: 5 + Math.random() * 5,
          depth: 10 + Math.random() * 5,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        }]);
      }
      lastSpawnZ.current += spawnCount * 15;
    }
    lastSpawnZ.current -= moveDist;

    setBuildings(prev => prev.map(b => ({ ...b, z: b.z - moveDist })).filter(b => b.z > -50));
  });

  return (
    <group>
      {buildings.map(b => (
        <mesh key={b.id} position={[b.x, b.height / 2, b.z]} castShadow receiveShadow>
          {config.environmentModels?.building ? (
            <Suspense fallback={null}>
              <GLTFModel url={config.environmentModels.building} scale={b.width / 2} position={[0, -b.height / 2, 0]} />
            </Suspense>
          ) : (
            <>
              <boxGeometry args={[b.width, b.height, b.depth]} />
              <meshStandardMaterial color={b.color} roughness={0.9} />
            </>
          )}
        </mesh>
      ))}
    </group>
  );
}

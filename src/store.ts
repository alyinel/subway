import { create } from 'zustand';

export type PowerupType = 'none' | 'invincible' | 'hoverboard' | 'fly';
export type CharacterType = 'default' | 'robot' | 'ninja';

export interface GameConfig {
  roadColor?: string;
  skyColor?: string;
  characterModels?: {
    default?: string;
    robot?: string;
    ninja?: string;
  };
  obstacleModels?: {
    train?: string;
    barrier?: string;
    coin?: string;
    car?: string;
    sign?: string;
  };
  powerupModels?: {
    invincible?: string;
    hoverboard?: string;
    fly?: string;
  };
  environmentModels?: {
    buildingA?: string;
    buildingB?: string;
    buildingC?: string;
  };
  guardModel?: string;
  gameSettings?: {
    baseSpeed?: number;
    speedIncrement?: number;
    maxSpeed?: number;
    coinValue?: number;
  };
  lightSettings?: {
    ambientIntensity?: number;
    directionalIntensity?: number;
    directionalColor?: string;
  };
  cameraSettings?: {
    fov?: number;
    yOffset?: number;
    zOffset?: number;
  };
}

interface GameState {
  status: 'menu' | 'playing' | 'gameover' | 'character_select' | 'admin';
  score: number;
  distance: number;
  coins: number;
  speed: number;
  guardDistance: number; // 0 = far, 1 = close, 2 = caught
  lane: number; // -1, 0, 1
  isJumping: boolean;
  isSliding: boolean;
  powerup: PowerupType;
  powerupTimeLeft: number;
  invulnerableTimer: number;
  character: CharacterType;
  config: GameConfig;
  setConfig: (config: GameConfig) => void;
  startGame: () => void;
  endGame: () => void;
  openCharacterSelect: () => void;
  closeCharacterSelect: () => void;
  openAdmin: () => void;
  closeAdmin: () => void;
  setCharacter: (char: CharacterType) => void;
  hitObstacle: (instantGameOver?: boolean) => void;
  collectCoin: () => void;
  setLane: (lane: number) => void;
  jump: () => void;
  slide: () => void;
  updateDistance: (delta: number) => void;
  collectPowerup: (type: PowerupType) => void;
  breakHoverboard: () => void;
  tick: (delta: number) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  status: 'menu',
  score: 0,
  distance: 0,
  coins: 0,
  speed: 20,
  guardDistance: 0,
  lane: 0,
  isJumping: false,
  isSliding: false,
  powerup: 'none',
  powerupTimeLeft: 0,
  invulnerableTimer: 0,
  character: 'default',
  config: {},
  setConfig: (config) => set({ config }),
  startGame: () => set((state) => ({ status: 'playing', score: 0, distance: 0, coins: 0, speed: state.config.gameSettings?.baseSpeed ?? 20, guardDistance: 0, lane: 0, isJumping: false, isSliding: false, powerup: 'none', powerupTimeLeft: 0, invulnerableTimer: 0 })),
  endGame: () => set({ status: 'gameover' }),
  openCharacterSelect: () => set({ status: 'character_select' }),
  closeCharacterSelect: () => set({ status: 'menu' }),
  openAdmin: () => set({ status: 'admin' }),
  closeAdmin: () => set({ status: 'menu' }),
  setCharacter: (char) => set({ character: char }),
  hitObstacle: (instantGameOver = false) => {
    const state = get();
    
    // Powerups protect against everything
    if (state.powerup === 'invincible' || state.powerup === 'fly') {
      return; // Ignore hit
    }
    
    if (state.powerup === 'hoverboard') {
      state.breakHoverboard();
      return;
    }

    // Instant game over ignores the stumble invulnerability timer
    if (instantGameOver) {
      set({ guardDistance: 2, status: 'gameover' });
      return;
    }

    // Normal stumble hit
    if (state.invulnerableTimer > 0) {
      return; // Ignore hit if recently stumbled
    }

    const { guardDistance } = state;
    if (guardDistance === 0) {
      set({ guardDistance: 1, invulnerableTimer: 2 }); // 2 seconds of invulnerability after hit
      // Recover guard distance after some time
      setTimeout(() => {
        if (get().status === 'playing' && get().guardDistance === 1) {
          set({ guardDistance: 0 });
        }
      }, 5000);
    } else {
      set({ guardDistance: 2, status: 'gameover' });
    }
  },
  collectCoin: () => set((state) => ({ coins: state.coins + 1, score: state.score + (state.config.gameSettings?.coinValue ?? 10) })),
  setLane: (lane) => set({ lane: Math.max(-1, Math.min(1, lane)) }),
  jump: () => {
    if (!get().isJumping && !get().isSliding) {
      set({ isJumping: true });
      setTimeout(() => set({ isJumping: false }), 800);
    }
  },
  slide: () => {
    if (!get().isJumping && !get().isSliding) {
      set({ isSliding: true });
      setTimeout(() => set({ isSliding: false }), 800);
    }
  },
  updateDistance: (delta) => set((state) => ({ 
    distance: state.distance + delta,
    score: state.score + delta * 0.1
  })),
  collectPowerup: (type) => set({ 
    powerup: type, 
    powerupTimeLeft: type === 'invincible' ? 30 : type === 'hoverboard' ? 15 : 10 
  }),
  breakHoverboard: () => set({ powerup: 'none', powerupTimeLeft: 0, invulnerableTimer: 2 }),
  tick: (delta) => set((state) => {
    let newPowerup = state.powerup;
    let newTime = state.powerupTimeLeft;
    if (newTime > 0) {
      newTime -= delta;
      if (newTime <= 0) newPowerup = 'none';
    }
    
    const baseSpeed = state.config.gameSettings?.baseSpeed ?? 20;
    const maxSpeed = state.config.gameSettings?.maxSpeed ?? 50;
    const speedIncrement = state.config.gameSettings?.speedIncrement ?? 0.01;

    // Base speed increases over time up to a max
    let newSpeed = Math.min(maxSpeed, baseSpeed + state.distance * speedIncrement);
    
    // Hoverboard gives a temporary speed boost
    if (newPowerup === 'hoverboard') {
      newSpeed += 15;
    }

    return {
      powerup: newPowerup,
      powerupTimeLeft: Math.max(0, newTime),
      invulnerableTimer: Math.max(0, state.invulnerableTimer - delta),
      speed: newSpeed
    };
  }),
  reset: () => set((state) => ({ status: 'menu', score: 0, distance: 0, coins: 0, speed: state.config.gameSettings?.baseSpeed ?? 20, guardDistance: 0, lane: 0, isJumping: false, isSliding: false, powerup: 'none', powerupTimeLeft: 0, invulnerableTimer: 0 }))
}));

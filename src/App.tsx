import { useEffect } from 'react';
import { Game } from './components/Game';
import { AdminPanel } from './components/AdminPanel';
import { useGameStore, GameConfig } from './store';
import { useDrag } from '@use-gesture/react';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function App() {
  const status = useGameStore(state => state.status);
  const score = useGameStore(state => state.score);
  const coins = useGameStore(state => state.coins);
  const startGame = useGameStore(state => state.startGame);
  const setLane = useGameStore(state => state.setLane);
  const jump = useGameStore(state => state.jump);
  const slide = useGameStore(state => state.slide);
  const powerup = useGameStore(state => state.powerup);
  const powerupTimeLeft = useGameStore(state => state.powerupTimeLeft);
  const character = useGameStore(state => state.character);
  const setCharacter = useGameStore(state => state.setCharacter);
  const openCharacterSelect = useGameStore(state => state.openCharacterSelect);
  const closeCharacterSelect = useGameStore(state => state.closeCharacterSelect);
  const openAdmin = useGameStore(state => state.openAdmin);
  const setConfig = useGameStore(state => state.setConfig);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const docRef = doc(db, 'config', 'game');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig(docSnap.data() as GameConfig);
        }
      } catch (err) {
        console.error("Failed to load config:", err);
      }
    };
    loadConfig();
  }, [setConfig]);

  const characters: import('./store').CharacterType[] = ['default', 'robot', 'ninja'];
  const characterNames = {
    default: 'Klasik',
    robot: 'Robot',
    ninja: 'Ninja'
  };

  const handleNextCharacter = () => {
    const currentIndex = characters.indexOf(character);
    const nextIndex = (currentIndex + 1) % characters.length;
    setCharacter(characters[nextIndex]);
  };

  const handlePrevCharacter = () => {
    const currentIndex = characters.indexOf(character);
    const prevIndex = (currentIndex - 1 + characters.length) % characters.length;
    setCharacter(characters[prevIndex]);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== 'playing') return;
      const lane = useGameStore.getState().lane;
      if (e.key === 'ArrowLeft' || e.key === 'a') setLane(lane - 1);
      if (e.key === 'ArrowRight' || e.key === 'd') setLane(lane + 1);
      if (e.key === 'ArrowUp' || e.key === 'w') jump();
      if (e.key === 'ArrowDown' || e.key === 's') slide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, setLane, jump, slide]);

  // Swipe controls
  const bind = useDrag(({ swipe: [swipeX, swipeY] }) => {
    if (status !== 'playing') return;
    const lane = useGameStore.getState().lane;
    if (swipeX === -1) setLane(lane - 1);
    if (swipeX === 1) setLane(lane + 1);
    if (swipeY === -1) jump(); // swipe up (negative Y in browser)
    if (swipeY === 1) slide(); // swipe down
  }, { swipe: { distance: 30 } });

  return (
    <div {...bind()} className="w-full h-screen overflow-hidden bg-black touch-none select-none">
      <Game />
      
      {/* HUD */}
      {status === 'playing' && (
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none">
          <div className="flex flex-col gap-2">
            <div className="text-white font-mono text-3xl font-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
              SCORE: {Math.floor(score)}
            </div>
            {powerup !== 'none' && (
              <div className="text-blue-400 font-mono text-xl font-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] animate-pulse uppercase">
                {powerup}: {Math.ceil(powerupTimeLeft)}s
              </div>
            )}
          </div>
          <div className="text-yellow-400 font-mono text-3xl font-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-400 rounded-full border-4 border-yellow-600 shadow-inner" />
            {coins}
          </div>
        </div>
      )}

      {/* Menus */}
      {status === 'menu' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <h1 className="text-6xl md:text-8xl font-black text-white mb-8 italic tracking-tighter drop-shadow-lg text-center">
            SUBWAY<br/><span className="text-blue-500">RUNNER</span>
          </h1>
          <p className="text-white/80 mb-8 text-center max-w-md text-lg md:text-xl font-medium">
            Swipe or use Arrow Keys to move.<br/>
            Dodge trains and barriers. Collect coins.<br/>
            Don't let the guard catch you!
          </p>
          <button 
            onClick={startGame}
            className="px-10 py-5 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-full text-2xl transition-transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(59,130,246,0.6)] mb-4"
          >
            TAP TO PLAY
          </button>
          <button 
            onClick={openCharacterSelect}
            className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full text-lg transition-colors border border-white/20 mb-4"
          >
            Karakter Seçimi
          </button>
          <button 
            onClick={openAdmin}
            className="px-6 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 font-bold rounded-full text-sm transition-colors border border-gray-600/50"
          >
            Admin Paneli
          </button>
        </div>
      )}

      {status === 'admin' && <AdminPanel />}

      {status === 'character_select' && (
        <div className="absolute inset-0 flex flex-col items-center justify-between py-12 pointer-events-none z-50">
          <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter drop-shadow-lg text-center">
            KARAKTER SEÇİMİ
          </h1>
          
          <div className="flex items-center justify-between w-full max-w-md px-8 pointer-events-auto">
            <button 
              onClick={handlePrevCharacter}
              className="w-16 h-16 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white text-3xl font-bold border border-white/20 transition-transform hover:scale-110 active:scale-95"
            >
              &lt;
            </button>
            
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white drop-shadow-md uppercase tracking-wider">
                {characterNames[character]}
              </h2>
            </div>

            <button 
              onClick={handleNextCharacter}
              className="w-16 h-16 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white text-3xl font-bold border border-white/20 transition-transform hover:scale-110 active:scale-95"
            >
              &gt;
            </button>
          </div>

          <button 
            onClick={closeCharacterSelect}
            className="pointer-events-auto px-10 py-5 bg-green-500 hover:bg-green-400 text-white font-black rounded-full text-2xl transition-transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(34,197,94,0.6)]"
          >
            SEÇ VE GERİ DÖN
          </button>
        </div>
      )}

      {status === 'gameover' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/80 backdrop-blur-md">
          <h1 className="text-7xl md:text-9xl font-black text-white mb-4 italic tracking-tighter drop-shadow-lg">
            CAUGHT!
          </h1>
          <div className="text-3xl text-white mb-2 font-mono font-bold">
            FINAL SCORE: {Math.floor(score)}
          </div>
          <div className="text-2xl text-yellow-400 mb-10 font-mono font-bold">
            COINS: {coins}
          </div>
          <button 
            onClick={startGame}
            className="px-10 py-5 bg-white text-red-900 hover:bg-gray-200 font-black rounded-full text-2xl transition-transform hover:scale-105 active:scale-95 shadow-xl"
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}

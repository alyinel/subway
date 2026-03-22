import React, { useState, useEffect, useRef } from 'react';
import { useGameStore, GameConfig } from '../store';
import { db, auth, storage } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { 
  Box, Users, ShieldAlert, Zap, Building2, 
  Map, Camera, Settings, LayoutTemplate, 
  BarChart3, ScrollText, Upload, RotateCcw, X
} from 'lucide-react';

interface AssetDef {
  id: string;
  category: keyof GameConfig;
  subKey?: string;
  typeLabel: string;
  name: string;
  path: string;
  icon: string;
}

const ASSETS: AssetDef[] = [
  { id: 'char_default', category: 'characterModels', subKey: 'default', typeLabel: 'Karakter', name: 'GHOST', path: 'assets/chars/ghost.glb', icon: '👤' },
  { id: 'char_robot', category: 'characterModels', subKey: 'robot', typeLabel: 'Karakter', name: 'TİTAN', path: 'assets/chars/titan.glb', icon: '🤖' },
  { id: 'char_ninja', category: 'characterModels', subKey: 'ninja', typeLabel: 'Karakter', name: 'VİPER', path: 'assets/chars/viper.glb', icon: '🥷' },
  
  { id: 'obs_train', category: 'obstacleModels', subKey: 'train', typeLabel: 'Engel', name: 'Tren', path: 'assets/obs/train.glb', icon: '🚄' },
  { id: 'obs_barrier', category: 'obstacleModels', subKey: 'barrier', typeLabel: 'Engel', name: 'Bariyer', path: 'assets/obs/barrier.glb', icon: '🚧' },
  { id: 'obs_car', category: 'obstacleModels', subKey: 'car', typeLabel: 'Engel', name: 'Araç', path: 'assets/obs/car.glb', icon: '🚗' },
  { id: 'obs_sign', category: 'obstacleModels', subKey: 'sign', typeLabel: 'Engel', name: 'Tabela', path: 'assets/obs/sign.glb', icon: '🪧' },
  { id: 'obs_coin', category: 'obstacleModels', subKey: 'coin', typeLabel: 'Obje', name: 'Altın', path: 'assets/obs/coin.glb', icon: '🪙' },
  
  { id: 'pow_invincible', category: 'powerupModels', subKey: 'invincible', typeLabel: 'Güç', name: 'NEO MANYETİ', path: 'assets/powers/magnet.glb', icon: '🧲' },
  { id: 'pow_hoverboard', category: 'powerupModels', subKey: 'hoverboard', typeLabel: 'Güç', name: 'HOVER', path: 'assets/powers/hover.glb', icon: '🛹' },
  { id: 'pow_fly', category: 'powerupModels', subKey: 'fly', typeLabel: 'Güç', name: 'TURBO', path: 'assets/powers/turbo.glb', icon: '🚀' },
  
  { id: 'env_bldA', category: 'environmentModels', subKey: 'buildingA', typeLabel: 'Ortam Bina', name: 'Bina A', path: 'assets/env/bld0.glb', icon: '🏢' },
  { id: 'env_bldB', category: 'environmentModels', subKey: 'buildingB', typeLabel: 'Ortam Bina', name: 'Bina B', path: 'assets/env/bld1.glb', icon: '🏗️' },
  { id: 'env_bldC', category: 'environmentModels', subKey: 'buildingC', typeLabel: 'Ortam Bina', name: 'Bina C', path: 'assets/env/bld2.glb', icon: '🏥' },
  
  { id: 'guard', category: 'guardModel', typeLabel: 'Karakter', name: 'BEKÇİ', path: 'assets/chars/guard.glb', icon: '👮' },
];

export function AdminPanel() {
  const closeAdmin = useGameStore(state => state.closeAdmin);
  const config = useGameStore(state => state.config);
  const setConfig = useGameStore(state => state.setConfig);
  
  const [localConfig, setLocalConfig] = useState<GameConfig>(config);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('glb');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoading(true);
      if (user) {
        if (user.email === 'alyinel9@gmail.com' && user.emailVerified) {
          setIsAdmin(true);
          await loadConfig();
        } else {
          setIsAdmin(false);
          setError('Bu panele erişim yetkiniz yok.');
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadConfig = async () => {
    try {
      const docRef = doc(db, 'config', 'game');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as GameConfig;
        setLocalConfig(data);
        setConfig(data);
      }
    } catch (err: any) {
      console.error("Error loading config:", err);
      setError('Ayarlar yüklenirken hata oluştu.');
    }
  };

  const handleSave = async (newConfig: GameConfig) => {
    setSaving(true);
    setError('');
    try {
      await setDoc(doc(db, 'config', 'game'), newConfig);
      setConfig(newConfig);
    } catch (err: any) {
      console.error("Error saving config:", err);
      setError('Ayarlar kaydedilirken hata oluştu: ' + err.message);
    }
    setSaving(false);
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Login error:", err);
      setError('Giriş başarısız.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const triggerUpload = (id: string) => {
    setActiveAssetId(id);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeAssetId) return;
    
    // Check if it's a GLB file
    if (!file.name.toLowerCase().endsWith('.glb')) {
      alert('Lütfen sadece .glb uzantılı dosyalar yükleyin.');
      return;
    }

    const asset = ASSETS.find(a => a.id === activeAssetId);
    if (!asset) return;

    setUploadingId(activeAssetId);
    setUploadProgress(0);

    try {
      // Create a reference to 'assets/...'
      const storageRef = ref(storage, asset.path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => {
          console.error("Upload failed:", error);
          alert("Yükleme başarısız: " + error.message);
          setUploadingId(null);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Update local config
          let newConfig = { ...localConfig };
          if (asset.subKey) {
            newConfig = {
              ...newConfig,
              [asset.category]: {
                ...(newConfig[asset.category] as any || {}),
                [asset.subKey]: downloadURL
              }
            };
          } else {
            newConfig = {
              ...newConfig,
              [asset.category]: downloadURL
            };
          }
          
          setLocalConfig(newConfig);
          await handleSave(newConfig);
          setUploadingId(null);
          
          // Reset file input
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      );
    } catch (err: any) {
      console.error("Upload error:", err);
      alert("Yükleme sırasında bir hata oluştu: " + err.message);
      setUploadingId(null);
    }
  };

  const handleReset = async (asset: AssetDef) => {
    if (!window.confirm(`${asset.name} modelini sıfırlamak istediğinize emin misiniz?`)) return;
    
    let newConfig = { ...localConfig };
    if (asset.subKey) {
      const categoryObj = { ...(newConfig[asset.category] as any || {}) };
      delete categoryObj[asset.subKey];
      newConfig = {
        ...newConfig,
        [asset.category]: categoryObj
      };
    } else {
      delete newConfig[asset.category];
    }
    
    setLocalConfig(newConfig);
    await handleSave(newConfig);
  };

  const getAssetUrl = (asset: AssetDef) => {
    if (asset.subKey) {
      return (localConfig[asset.category] as any)?.[asset.subKey];
    }
    return localConfig[asset.category];
  };

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#050510] z-50">
        <div className="text-[#00f0ff] text-2xl font-mono animate-pulse">SİSTEM BAŞLATILIYOR...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050510] z-50 font-mono">
        <h1 className="text-4xl text-[#00f0ff] font-bold mb-8 tracking-widest">NEON RUSH - EDITOR</h1>
        {error && <div className="text-[#ff0055] mb-4 border border-[#ff0055] p-3 bg-[#ff0055]/10">{error}</div>}
        <button 
          onClick={handleLogin}
          className="px-8 py-4 bg-transparent border-2 border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff]/10 font-bold rounded mb-4 transition-all"
        >
          YETKİLİ GİRİŞİ
        </button>
        <button 
          onClick={closeAdmin}
          className="px-8 py-4 bg-transparent border-2 border-gray-600 text-gray-400 hover:bg-gray-800 font-bold rounded transition-all"
        >
          İPTAL
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-[#050510] z-50 font-mono text-gray-300 overflow-hidden">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onFileChange} 
        accept=".glb" 
        className="hidden" 
      />

      {/* Header */}
      <div className="h-14 border-b border-[#1e1e38] flex items-center justify-between px-6 bg-[#0a0a18]">
        <div className="flex items-center gap-3">
          <span className="bg-[#ff0055] text-white text-xs font-bold px-2 py-1 rounded-sm">ADMIN</span>
          <h1 className="text-[#00f0ff] font-bold tracking-widest text-lg">NEON RUSH - EDITOR</h1>
        </div>
        <button 
          onClick={closeAdmin}
          className="flex items-center gap-2 text-[#ff0055] border border-[#ff0055]/30 hover:bg-[#ff0055]/10 px-3 py-1 rounded text-sm transition-colors"
        >
          <X size={16} />
          KAPAT
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-[#1e1e38] bg-[#0a0a18] flex flex-col overflow-y-auto">
          <div className="p-4 space-y-1">
            <SidebarItem icon={<Box size={18} />} label="GLB Varlıklar" active={activeTab === 'glb'} onClick={() => setActiveTab('glb')} />
            <SidebarItem icon={<Settings size={18} />} label="Oyun Ayarları" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            <SidebarItem icon={<Camera size={18} />} label="Işık & Kamera" active={activeTab === 'camera'} onClick={() => setActiveTab('camera')} />
            {/* <SidebarItem icon={<Users size={18} />} label="Karakterler" />
            <SidebarItem icon={<ShieldAlert size={18} />} label="Engeller" />
            <SidebarItem icon={<Zap size={18} />} label="Güçler" />
            <SidebarItem icon={<Building2 size={18} />} label="Ortam / Binalar" />
            <SidebarItem icon={<Map size={18} />} label="Zemin & Ray" />
            <SidebarItem icon={<Camera size={18} />} label="Işık & Kamera" />
            <SidebarItem icon={<LayoutTemplate size={18} />} label="HUD & UI" />
            <SidebarItem icon={<BarChart3 size={18} />} label="İstatistikler" />
            <SidebarItem icon={<ScrollText size={18} />} label="Sistem Logu" /> */}
          </div>
          <div className="mt-auto p-4 border-t border-[#1e1e38]">
            <button onClick={handleLogout} className="w-full py-2 text-sm text-gray-500 hover:text-white transition-colors">
              Oturumu Kapat
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'glb' && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#00f0ff] mb-2 tracking-wide">GLB VARLIK YÖNETİMİ</h2>
                <p className="text-gray-500 text-sm">Tüm 3D modelleri burada yükleyin ve yönetin. Yüklenen modeller otomatik aktif olur.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {ASSETS.map(asset => {
                  const url = getAssetUrl(asset);
                  const isUploaded = !!url;
                  const isUploading = uploadingId === asset.id;

                  return (
                    <div key={asset.id} className="bg-[#0a0a18] border border-[#1e1e38] rounded-lg overflow-hidden hover:border-[#00f0ff]/50 transition-colors group flex flex-col">
                      {/* Preview Area */}
                      <div className="h-32 bg-[#050510] relative flex items-center justify-center border-b border-[#1e1e38]">
                        <div className="text-6xl filter drop-shadow-[0_0_10px_rgba(0,240,255,0.3)] group-hover:scale-110 transition-transform">
                          {asset.icon}
                        </div>
                        <div className="absolute top-2 right-2 bg-[#0a0a18] border border-[#00f0ff]/30 text-[#00f0ff] text-[10px] font-bold px-1.5 py-0.5 rounded">
                          .GLB
                        </div>
                      </div>

                      {/* Info Area */}
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="text-[#fcd34d] text-[10px] font-bold uppercase tracking-wider mb-1">{asset.typeLabel}</div>
                        <div className="text-white font-bold text-sm mb-1 truncate">{asset.name}</div>
                        <div className="text-gray-600 text-[10px] mb-3 truncate font-sans">{asset.path}</div>
                        
                        <div className="flex items-center gap-2 mb-4 mt-auto">
                          <div className={`w-2 h-2 rounded-full ${isUploaded ? 'bg-[#00ff88] shadow-[0_0_8px_#00ff88]' : 'bg-[#ff0055] shadow-[0_0_8px_#ff0055]'}`}></div>
                          <span className="text-[10px] font-bold tracking-wider text-gray-400">
                            {isUploaded ? 'YÜKLENDİ' : 'BEKLEMEDE'}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button 
                            onClick={() => triggerUpload(asset.id)}
                            disabled={isUploading}
                            className="flex-1 flex items-center justify-center gap-2 bg-[#00f0ff]/5 hover:bg-[#00f0ff]/20 border border-[#00f0ff]/30 text-[#00f0ff] text-xs font-bold py-2 rounded transition-colors disabled:opacity-50"
                          >
                            {isUploading ? (
                              <span>%{Math.round(uploadProgress)}</span>
                            ) : (
                              <>
                                <Upload size={14} />
                                YÜKLE
                              </>
                            )}
                          </button>
                          <button 
                            onClick={() => handleReset(asset)}
                            disabled={!isUploaded || isUploading}
                            className="flex items-center justify-center w-10 bg-[#ff0055]/5 hover:bg-[#ff0055]/20 border border-[#ff0055]/30 text-[#ff0055] rounded transition-colors disabled:opacity-20"
                            title="Sıfırla"
                          >
                            <RotateCcw size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#00f0ff] mb-2 tracking-wide">OYUN AYARLARI</h2>
                <p className="text-gray-500 text-sm">Oyunun temel mekaniklerini ve zorluk seviyesini ayarlayın.</p>
              </div>

              <div className="space-y-6">
                <div className="bg-[#0a0a18] border border-[#1e1e38] p-6 rounded-lg">
                  <h3 className="text-lg font-bold text-white mb-4">Hız Ayarları</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Başlangıç Hızı</label>
                      <input 
                        type="number" 
                        value={localConfig.gameSettings?.baseSpeed ?? 20}
                        onChange={(e) => setLocalConfig({
                          ...localConfig,
                          gameSettings: { ...localConfig.gameSettings, baseSpeed: Number(e.target.value) }
                        })}
                        className="w-full bg-[#050510] border border-[#1e1e38] rounded p-2 text-white focus:border-[#00f0ff] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Maksimum Hız</label>
                      <input 
                        type="number" 
                        value={localConfig.gameSettings?.maxSpeed ?? 50}
                        onChange={(e) => setLocalConfig({
                          ...localConfig,
                          gameSettings: { ...localConfig.gameSettings, maxSpeed: Number(e.target.value) }
                        })}
                        className="w-full bg-[#050510] border border-[#1e1e38] rounded p-2 text-white focus:border-[#00f0ff] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Hızlanma Çarpanı (Mesafe başına)</label>
                      <input 
                        type="number" 
                        step="0.001"
                        value={localConfig.gameSettings?.speedIncrement ?? 0.01}
                        onChange={(e) => setLocalConfig({
                          ...localConfig,
                          gameSettings: { ...localConfig.gameSettings, speedIncrement: Number(e.target.value) }
                        })}
                        className="w-full bg-[#050510] border border-[#1e1e38] rounded p-2 text-white focus:border-[#00f0ff] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-[#0a0a18] border border-[#1e1e38] p-6 rounded-lg">
                  <h3 className="text-lg font-bold text-white mb-4">Ekonomi</h3>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Altın Değeri (Skor)</label>
                    <input 
                      type="number" 
                      value={localConfig.gameSettings?.coinValue ?? 10}
                      onChange={(e) => setLocalConfig({
                        ...localConfig,
                        gameSettings: { ...localConfig.gameSettings, coinValue: Number(e.target.value) }
                      })}
                      className="w-full bg-[#050510] border border-[#1e1e38] rounded p-2 text-white focus:border-[#00f0ff] outline-none"
                    />
                  </div>
                </div>

                <div className="bg-[#0a0a18] border border-[#1e1e38] p-6 rounded-lg">
                  <h3 className="text-lg font-bold text-white mb-4">Çevre Renkleri</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Zemin Rengi (Hex)</label>
                      <input 
                        type="text" 
                        value={localConfig.roadColor ?? '#1a1a2e'}
                        onChange={(e) => setLocalConfig({ ...localConfig, roadColor: e.target.value })}
                        className="w-full bg-[#050510] border border-[#1e1e38] rounded p-2 text-white focus:border-[#00f0ff] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Gökyüzü/Sis Rengi (Hex)</label>
                      <input 
                        type="text" 
                        value={localConfig.skyColor ?? '#0f0f1a'}
                        onChange={(e) => setLocalConfig({ ...localConfig, skyColor: e.target.value })}
                        className="w-full bg-[#050510] border border-[#1e1e38] rounded p-2 text-white focus:border-[#00f0ff] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleSave(localConfig)}
                  disabled={saving}
                  className="w-full py-3 bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-black font-bold rounded transition-colors disabled:opacity-50"
                >
                  {saving ? 'KAYDEDİLİYOR...' : 'AYARLARI KAYDET'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'camera' && (
            <div className="max-w-2xl">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#00f0ff] mb-2 tracking-wide">IŞIK & KAMERA</h2>
                <p className="text-gray-500 text-sm">Oyunun görsel atmosferini ve kamera açılarını ayarlayın.</p>
              </div>

              <div className="space-y-6">
                <div className="bg-[#0a0a18] border border-[#1e1e38] p-6 rounded-lg">
                  <h3 className="text-lg font-bold text-white mb-4">Işık Ayarları</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Ortam Işığı Şiddeti (Ambient)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={localConfig.lightSettings?.ambientIntensity ?? 0.6}
                        onChange={(e) => setLocalConfig({
                          ...localConfig,
                          lightSettings: { ...localConfig.lightSettings, ambientIntensity: Number(e.target.value) }
                        })}
                        className="w-full bg-[#050510] border border-[#1e1e38] rounded p-2 text-white focus:border-[#00f0ff] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Yönlü Işık Şiddeti (Directional)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={localConfig.lightSettings?.directionalIntensity ?? 1.5}
                        onChange={(e) => setLocalConfig({
                          ...localConfig,
                          lightSettings: { ...localConfig.lightSettings, directionalIntensity: Number(e.target.value) }
                        })}
                        className="w-full bg-[#050510] border border-[#1e1e38] rounded p-2 text-white focus:border-[#00f0ff] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Yönlü Işık Rengi (Hex)</label>
                      <input 
                        type="text" 
                        value={localConfig.lightSettings?.directionalColor ?? '#ffffff'}
                        onChange={(e) => setLocalConfig({
                          ...localConfig,
                          lightSettings: { ...localConfig.lightSettings, directionalColor: e.target.value }
                        })}
                        className="w-full bg-[#050510] border border-[#1e1e38] rounded p-2 text-white focus:border-[#00f0ff] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-[#0a0a18] border border-[#1e1e38] p-6 rounded-lg">
                  <h3 className="text-lg font-bold text-white mb-4">Kamera Ayarları</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Görüş Alanı (FOV)</label>
                      <input 
                        type="number" 
                        value={localConfig.cameraSettings?.fov ?? 60}
                        onChange={(e) => setLocalConfig({
                          ...localConfig,
                          cameraSettings: { ...localConfig.cameraSettings, fov: Number(e.target.value) }
                        })}
                        className="w-full bg-[#050510] border border-[#1e1e38] rounded p-2 text-white focus:border-[#00f0ff] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Kamera Yüksekliği (Y Offset)</label>
                      <input 
                        type="number" 
                        step="0.5"
                        value={localConfig.cameraSettings?.yOffset ?? 5}
                        onChange={(e) => setLocalConfig({
                          ...localConfig,
                          cameraSettings: { ...localConfig.cameraSettings, yOffset: Number(e.target.value) }
                        })}
                        className="w-full bg-[#050510] border border-[#1e1e38] rounded p-2 text-white focus:border-[#00f0ff] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Kamera Mesafesi (Z Offset)</label>
                      <input 
                        type="number" 
                        step="0.5"
                        value={localConfig.cameraSettings?.zOffset ?? -10}
                        onChange={(e) => setLocalConfig({
                          ...localConfig,
                          cameraSettings: { ...localConfig.cameraSettings, zOffset: Number(e.target.value) }
                        })}
                        className="w-full bg-[#050510] border border-[#1e1e38] rounded p-2 text-white focus:border-[#00f0ff] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleSave(localConfig)}
                  disabled={saving}
                  className="w-full py-3 bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-black font-bold rounded transition-colors disabled:opacity-50"
                >
                  {saving ? 'KAYDEDİLİYOR...' : 'AYARLARI KAYDET'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      active 
        ? 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20' 
        : 'text-gray-400 hover:bg-[#1e1e38]/50 hover:text-white border border-transparent'
    }`}>
      {icon}
      {label}
    </button>
  );
}

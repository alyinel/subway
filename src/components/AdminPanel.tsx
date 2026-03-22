import React, { useState, useEffect } from 'react';
import { useGameStore, GameConfig } from '../store';
import { 
  Box, Camera, Settings, RotateCcw, X
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('glb');
  
  // Login states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Check if previously logged in (simple session)
    const session = sessionStorage.getItem('admin_session');
    if (session === 'active') {
      setIsAdmin(true);
      loadConfig();
    }
  }, []);

  const loadConfig = () => {
    try {
      const saved = localStorage.getItem('neon_rush_config');
      if (saved) {
        const data = JSON.parse(saved) as GameConfig;
        setLocalConfig(data);
        setConfig(data);
      }
    } catch (err: any) {
      console.error("Error loading config:", err);
      setError('Ayarlar yüklenirken hata oluştu.');
    }
  };

  const handleSave = (newConfig: GameConfig) => {
    setSaving(true);
    setError('');
    try {
      localStorage.setItem('neon_rush_config', JSON.stringify(newConfig));
      setConfig(newConfig);
    } catch (err: any) {
      console.error("Error saving config:", err);
      setError('Ayarlar kaydedilirken hata oluştu: ' + err.message);
    }
    setTimeout(() => setSaving(false), 500); // Fake delay for UX
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Simple hardcoded credentials
    if (username === 'admin' && password === 'admin123') {
      setIsAdmin(true);
      sessionStorage.setItem('admin_session', 'active');
      loadConfig();
    } else {
      setError('Kullanıcı adı veya şifre hatalı.');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('admin_session');
    setUsername('');
    setPassword('');
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
        
        <form onSubmit={handleLogin} className="bg-[#0a0a18] border border-[#1e1e38] p-8 rounded-lg w-full max-w-sm flex flex-col gap-4">
          <h2 className="text-xl text-white font-bold mb-2 text-center">YETKİLİ GİRİŞİ</h2>
          
          {error && <div className="text-[#ff0055] text-sm border border-[#ff0055] p-2 bg-[#ff0055]/10 rounded text-center">{error}</div>}
          
          <div>
            <label className="block text-gray-400 text-xs mb-1">Kullanıcı Adı</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-[#050510] border border-[#1e1e38] rounded p-2 text-white focus:border-[#00f0ff] outline-none"
              placeholder="admin"
            />
          </div>
          
          <div>
            <label className="block text-gray-400 text-xs mb-1">Şifre</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#050510] border border-[#1e1e38] rounded p-2 text-white focus:border-[#00f0ff] outline-none"
              placeholder="admin123"
            />
          </div>

          <button 
            type="submit"
            className="w-full mt-4 px-4 py-3 bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-black font-bold rounded transition-all"
          >
            GİRİŞ YAP
          </button>
          
          <button 
            type="button"
            onClick={closeAdmin}
            className="w-full mt-2 px-4 py-2 bg-transparent border border-gray-600 text-gray-400 hover:bg-gray-800 font-bold rounded transition-all text-sm"
          >
            İPTAL
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-[#050510] z-50 font-mono text-gray-300 overflow-hidden">
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
            <div className="max-w-4xl">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#00f0ff] mb-2 tracking-wide">GLB VARLIK YÖNETİMİ</h2>
                <p className="text-gray-500 text-sm">Modellerin dosya yollarını (örn: /models/car.glb) veya tam URL'lerini girin. Dosyaları projenizin <code className="text-[#ff0055]">public/models/</code> klasörüne manuel olarak atabilirsiniz.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {ASSETS.map(asset => {
                  const value = getAssetUrl(asset) || '';

                  return (
                    <div key={asset.id} className="bg-[#0a0a18] border border-[#1e1e38] rounded-lg p-4 flex items-center gap-4">
                      <div className="w-16 h-16 bg-[#050510] rounded border border-[#1e1e38] flex items-center justify-center text-3xl shrink-0">
                        {asset.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <div className="text-[#fcd34d] text-[10px] font-bold uppercase tracking-wider">{asset.typeLabel}</div>
                            <div className="text-white font-bold text-sm">{asset.name}</div>
                          </div>
                          <button 
                            onClick={() => handleReset(asset)}
                            className="text-[#ff0055] hover:text-[#ff0055]/80 text-xs flex items-center gap-1"
                            title="Sıfırla"
                          >
                            <RotateCcw size={12} />
                            Sıfırla
                          </button>
                        </div>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => {
                            let newConfig = { ...localConfig };
                            if (asset.subKey) {
                              newConfig = {
                                ...newConfig,
                                [asset.category]: {
                                  ...(newConfig[asset.category] as any || {}),
                                  [asset.subKey]: e.target.value
                                }
                              };
                            } else {
                              newConfig = {
                                ...newConfig,
                                [asset.category]: e.target.value
                              };
                            }
                            setLocalConfig(newConfig);
                          }}
                          placeholder={`Örn: /models/${asset.id}.glb`}
                          className="w-full bg-[#050510] border border-[#1e1e38] rounded p-2 text-white text-sm focus:border-[#00f0ff] outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <button 
                onClick={() => handleSave(localConfig)}
                disabled={saving}
                className="w-full py-3 bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-black font-bold rounded transition-colors disabled:opacity-50"
              >
                {saving ? 'KAYDEDİLİYOR...' : 'AYARLARI KAYDET'}
              </button>
            </div>
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

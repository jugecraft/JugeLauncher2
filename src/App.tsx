import { useState, useEffect } from 'react';
import { Layout } from './components/Layout/Layout';
import { LoginScreen } from './components/Login/LoginScreen';
import { invoke } from '@tauri-apps/api/core';
import { Loader2, Play, Download, FolderOpen } from 'lucide-react';
import { ProfileSelector } from './components/Profiles/ProfileSelector';

import { ModManager } from './components/Mods/ModManager';
import { SkinManager } from './components/Skins/SkinManager';
import { SettingsScreen } from './components/Settings/Settings';
import { Console } from './components/Console/Console';
import { useLanguage } from './i18n/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const { t } = useLanguage();
  const [account, setAccount] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [localVersions, setLocalVersions] = useState<any[]>([]);
  const [gameLogs, setGameLogs] = useState<string[]>([]);
  const [showConsole, setShowConsole] = useState(false);

  const handleLoginSuccess = (acc: any) => { setAccount(acc); };

  // Listen for progress and logs
  useEffect(() => {
    let unlistenProgress: () => void;
    let unlistenLogs: () => void;

    async function setupListeners() {
      const { listen } = await import('@tauri-apps/api/event');

      unlistenProgress = await listen('download_progress', (event: any) => {
        const payload = event.payload;
        setStatus(t('dashboard.downloading', { file: payload.file, percent: Math.round(payload.percent).toString() }));
      });


      unlistenLogs = await listen('game_log', (event: any) => {
        setGameLogs(prev => [...prev, event.payload as string]);
      });
    }
    setupListeners();

    return () => {
      if (unlistenProgress) unlistenProgress();
      if (unlistenLogs) unlistenLogs();
    };
  }, []);

  const handleLogout = () => {
    setAccount(null);
    setActiveTab('home');
  };

  const loadLocalData = async () => {
    try {
      console.log("DEBUG: Calling get_local_versions...");
      const versions = await invoke('get_local_versions');
      console.log("DEBUG: Received local versions:", versions);
      setLocalVersions(versions as any[]);
    } catch (e) {
      console.error("Failed to load local data", e);
    }
  };

  useEffect(() => {
    loadLocalData();
  }, []);

  const handleInstall = async () => {
    if (!activeProfile) { setStatus(t('errors.no_profile')); return; }
    setStatus(t('errors.installing_for', { name: activeProfile.name }));
    setLoading(true);
    try {
      const version = activeProfile.version_id;
      const manifestUrl = `https://raw.githubusercontent.com/jugecraft/JugeLauncher2/main/versions/${version}/manifest.json`;

      const msg = await invoke('install_game', { manifestUrl });
      setStatus(msg as string);
    } catch (e: any) {
      setStatus(t('errors.error_generic', { error: e.toString() }));
    }
    finally { setLoading(false); }
  };

  const handlePlay = async () => {
    if (!activeProfile) { setStatus(t('errors.no_profile')); return; }
    setStatus(t('dashboard.launching'));
    setLoading(true);
    try {
      setGameLogs([]); // Clear previous logs
      setShowConsole(true); // Show console immediately
      await invoke('launch_game_cmd', { manifestId: activeProfile.version_id, account: account });
      setStatus(t('dashboard.game_running'));
    } catch (e: any) { setStatus(t('errors.launch_error', { error: e.toString() })); }
    finally { setLoading(false); }
  };

  if (!account) return <LoginScreen onLoginSuccess={handleLoginSuccess} />;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}>
      <div className="h-full flex flex-col pt-0 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="flex-1 flex flex-col relative h-full"
            >
              {/* Hero Background with blurred Minecraft feel */}
              <div className="absolute inset-x-0 top-0 h-[70vh] pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/5 to-transparent z-0" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center opacity-10 grayscale scale-110 blur-sm mix-blend-overlay" />
              </div>

              <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-8 pb-20">
                <div className="animate-fade-in space-y-8 max-w-2xl">
                  <div className="space-y-2">
                    <h1 className="text-7xl font-black tracking-tighter text-white drop-shadow-2xl">
                      {activeProfile ? activeProfile.name : "JUGE LAUNCHER"}
                    </h1>
                    {activeProfile && (
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-xs font-black uppercase tracking-[0.4em] text-accent-secondary opacity-80">Minecraft {activeProfile.version_id}</span>
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-xs font-black uppercase tracking-[0.4em] text-green-500">{t('dashboard.ready')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-8 py-8">
                    <button
                      onClick={handlePlay}
                      disabled={loading}
                      className="group relative flex items-center justify-center"
                    >
                      {/* Glowing effect */}
                      <div className="absolute inset-0 bg-accent-primary blur-[40px] opacity-40 group-hover:opacity-70 group-hover:scale-125 transition-all duration-700 rounded-full" />

                      <div className="relative w-28 h-28 bg-accent-primary hover:bg-accent-secondary text-white rounded-full shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all duration-500 transform hover:scale-110 active:scale-90 flex items-center justify-center border-4 border-white/20">
                        {loading ? (
                          <Loader2 className="w-10 h-10 animate-spin" />
                        ) : (
                          <Play className="w-12 h-12 fill-current ml-2" />
                        )}
                      </div>

                      <span className="absolute top-[120%] text-xs font-black tracking-[0.5em] text-white/40 group-hover:text-white transition-colors uppercase">
                        {t('dashboard.execute')}
                      </span>
                    </button>
                  </div>

                  <p className="text-sm font-medium text-gray-500 max-w-md mx-auto italic">
                    {status || t('dashboard.waiting')}
                  </p>
                </div>
              </div>

              {/* Bottom Controls Bar */}
              <div className="mt-auto px-8 py-8 border-t border-white/[0.03] bg-black/20 backdrop-blur-xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <ProfileSelector onSelect={setActiveProfile} localVersions={localVersions} />

                  <button
                    onClick={handleInstall}
                    disabled={loading}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold border border-white/5 transition-all flex items-center gap-2 group text-sm active:scale-95"
                  >
                    <Download className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                    {t('dashboard.sync')}
                  </button>
                </div>

                <div className="flex items-center gap-4 group cursor-pointer pl-6 border-l border-white/5">
                  <div className="text-right">
                    <p className="text-sm font-bold text-white tracking-tight leading-none mb-1">{account.name}</p>
                    <p className="text-[10px] font-black uppercase text-accent-secondary tracking-widest leading-none">{t('login.type_login', { type: account.account_type })}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center text-white font-black shadow-lg">
                    {account.name[0].toUpperCase()}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'mods' && (
            <motion.div
              key="mods"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="p-8 space-y-6 h-full flex flex-col"
            >
              <div className="flex items-center justify-between shrink-0">
                <div>
                  <h1 className="text-4xl font-black text-white tracking-tight">{t('dashboard.addons_title')}</h1>
                  <p className="text-xs font-black text-accent-secondary tracking-widest mt-1">{t('dashboard.module_manager')}</p>
                </div>
                {activeProfile && (
                  <div className="px-4 py-2 bg-accent-primary/5 border border-accent-primary/20 rounded-xl text-xs font-bold text-accent-primary">
                    {t('dashboard.instance', { name: activeProfile.name.toUpperCase() })}
                  </div>
                )}
              </div>

              <div className="flex-1 glass-panel p-6 rounded-[2rem] border-white/5 overflow-hidden">
                {activeProfile ? (
                  <ModManager versionId={activeProfile.version_id} />
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 bg-accent-primary/5 border border-accent-primary/20 rounded-2xl text-xs font-bold text-accent-primary flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      {t('dashboard.viewing_global')}
                    </div>
                    <ModManager />
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'skins' && (
            <motion.div
              key="skins"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="h-full overflow-y-auto custom-scrollbar glass-panel rounded-[2rem] border-white/5 m-8"
            >
              <SkinManager account={account} />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="h-full overflow-hidden"
            >
              <SettingsScreen />
            </motion.div>
          )}

          {activeTab === 'instances' && (
            <motion.div
              key="instances"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="p-8 h-full flex items-center justify-center"
            >
              <div className="text-center space-y-4">
                <FolderOpen className="w-12 h-12 text-gray-700 mx-auto" />
                <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-600">{t('dashboard.instance_coming_soon')}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showConsole && (
            <Console
              logs={gameLogs}
              onClose={() => setShowConsole(false)}
              onClear={() => setGameLogs([])}
            />
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}

export default App;

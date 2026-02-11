import { useState } from 'react';
import { Layout } from './components/Layout/Layout';
import { LoginScreen } from './components/Login/LoginScreen';
import { invoke } from '@tauri-apps/api/core';
import { Loader2, Play, Download } from 'lucide-react';
import { ProfileSelector } from './components/Profiles/ProfileSelector';

import { ModManager } from './components/Mods/ModManager';

function App() {
  const [account, setAccount] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeProfile, setActiveProfile] = useState<any>(null);
  // ... rest of logic ...

  const handleLoginSuccess = (acc: any) => { setAccount(acc); };

  // Re-declare handlers to ensure they are available
  const handleInstall = async () => {
    if (!activeProfile) { setStatus("No profile selected"); return; }
    setStatus(`Installing version for ${activeProfile.name}...`);
    setLoading(true);
    try {
      const msg = await invoke('install_game', { manifestUrl: "http://localhost:8000/manifest.json" });
      setStatus(msg as string);
    } catch (e: any) { setStatus(`Error: ${e}`); }
    finally { setLoading(false); }
  };

  const handlePlay = async () => {
    if (!activeProfile) { setStatus("No profile selected"); return; }
    setStatus('Launching...');
    setLoading(true);
    try {
      await invoke('launch_game_cmd', { manifestId: activeProfile.version_id, account: account });
      setStatus('Game Running');
    } catch (e: any) { setStatus(`Launch Error: ${e}`); }
    finally { setLoading(false); }
  };

  if (!account) return <LoginScreen onLoginSuccess={handleLoginSuccess} />;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'home' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <ProfileSelector onSelect={setActiveProfile} />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-white font-medium">{account.name}</p>
                <p className="text-xs text-gray-400 capitalize">{account.account_type} Account</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                {account.name[0].toUpperCase()}
              </div>
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
                {activeProfile ? activeProfile.name : "Select a Profile"}
                {activeProfile && (
                  <span className="ml-3 text-lg px-3 py-1 bg-indigo-500/20 rounded-lg text-indigo-300 border border-indigo-500/30">
                    {activeProfile.version_id}
                  </span>
                )}
              </h2>
              <p className="text-gray-400 mb-8 max-w-lg">
                Ready to launch. Status: {status || "Idle"}
              </p>

              <div className="flex gap-4">
                <button
                  onClick={handlePlay}
                  disabled={loading}
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Play fill="currentColor" />}
                  PLAY
                </button>

                <button
                  onClick={handleInstall}
                  disabled={loading}
                  className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold border border-white/10 transition-colors flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Install / Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'mods' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">Addons & Mods</h1>
            {activeProfile && (
              <span className="text-gray-400">Managing for: <strong className="text-white">{activeProfile.name}</strong></span>
            )}
          </div>

          {activeProfile ? (
            <ModManager versionId={activeProfile.version_id} />
          ) : (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-gray-400">Please select a profile on the Dashboard first.</p>
              <button
                onClick={() => setActiveTab('home')}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="text-center py-20 text-gray-500">Settings Coming Soon</div>
      )}

      {activeTab === 'instances' && (
        <div className="text-center py-20 text-gray-500">Instance Manager Coming Soon</div>
      )}
    </Layout>
  );
}

export default App;

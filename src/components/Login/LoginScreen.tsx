import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Send, WifiOff, Loader2, X, Minus } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useMicrosoftLogin } from '../../hooks/useMicrosoftLogin';

interface LoginScreenProps {
    onLoginSuccess: (account: any) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const appWindow = getCurrentWindow();
    const [mode, setMode] = useState<'select' | 'offline' | 'microsoft'>('select');
    const [username, setUsername] = useState('');
    const [offlineLoading, setOfflineLoading] = useState(false);
    const [offlineError, setOfflineError] = useState<string | null>(null);

    const {
        status: msStatus,
        error: msError,
        deviceCode,
        account: msAccount,
        login: startMsLogin,
        cancel: cancelMsLogin
    } = useMicrosoftLogin();

    useEffect(() => {
        if (msAccount) {
            onLoginSuccess(msAccount);
        }
    }, [msAccount, onLoginSuccess]);

    const handleOfflineLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setOfflineLoading(true);
        setOfflineError(null);
        try {
            const account = await invoke('login_offline', { username });
            onLoginSuccess(account);
        } catch (err: any) {
            setOfflineError(err.toString());
        } finally {
            setOfflineLoading(false);
        }
    };

    const handleCopyCode = () => {
        if (deviceCode) {
            navigator.clipboard.writeText(deviceCode.user_code);
        }
    };

    const renderMicrosoftAuth = () => {
        if (msStatus === 'starting' || (msStatus === 'polling' && !deviceCode)) {
            return (
                <div className="py-12 flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-accent-primary animate-spin mb-6" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">Initializing Secure Flow</p>
                </div>
            );
        }

        if (deviceCode) {
            return (
                <div className="space-y-6 animate-fade-in">
                    <div className="space-y-2">
                        <p className="text-sm text-gray-400 font-medium">
                            Visit <a href={deviceCode.verification_uri} target="_blank" rel="noreferrer" className="text-accent-primary font-black hover:underline">{deviceCode.verification_uri}</a>
                        </p>
                        <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">Submit this unique access key</p>
                    </div>

                    <div
                        className="py-6 px-8 bg-black/40 border-2 border-dashed border-accent-primary/30 rounded-3xl text-4xl font-black text-white tracking-[0.3em] flex items-center justify-center cursor-pointer hover:border-accent-primary transition-all active:scale-95"
                        onClick={handleCopyCode}
                    >
                        {deviceCode.user_code}
                    </div>

                    <div className="pt-6 flex flex-col items-center">
                        <div className="flex gap-2 mb-4">
                            <div className="w-2 h-2 rounded-full bg-accent-primary animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-2 h-2 rounded-full bg-accent-primary animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-2 h-2 rounded-full bg-accent-primary animate-bounce" />
                        </div>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Waiting for confirmation...</p>
                    </div>

                    <button
                        onClick={() => {
                            cancelMsLogin();
                            setMode('select');
                        }}
                        className="text-xs font-black text-gray-700 hover:text-white uppercase tracking-widest transition-colors pt-4"
                    >
                        Abort Auth
                    </button>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="flex items-center justify-center min-h-screen relative overflow-hidden bg-bg-primary font-sans">
            {/* Window Controls */}
            <div className="absolute top-0 right-0 p-4 z-[100] flex items-center gap-2">
                <button
                    onClick={() => appWindow.minimize()}
                    className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
                >
                    <Minus className="w-4 h-4" />
                </button>
                <button
                    onClick={() => appWindow.close()}
                    className="p-2 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-500 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center opacity-10 blur-xl scale-110" />
            <div className="absolute inset-0 bg-gradient-to-tr from-accent-primary/10 via-bg-primary/80 to-purple-500/10" />

            <div className="relative z-10 w-full max-w-lg px-8">
                <div className="text-center mb-10 animate-fade-in flex flex-col items-center">
                    <div className="w-32 h-32 mx-auto flex items-center justify-center mb-6 group hover:rotate-6 transition-transform">
                        <img src="/src/assets/logo.png" alt="JugeLauncher" className="w-full h-full object-contain drop-shadow-2xl" />
                    </div>
                    {/* <h1 className="text-5xl font-black text-white tracking-tighter mb-2 italic uppercase">Juge<span className="text-accent-primary">Launcher</span></h1> */}
                    <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px]">Secure Identity Management</p>
                </div>

                <div className="glass-panel border-white/[0.05] p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fade-in [animation-delay:0.2s]">
                    {(msError || offlineError) && (
                        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            {msError || offlineError}
                        </div>
                    )}

                    {mode === 'select' && (
                        <div className="space-y-4">
                            <button
                                onClick={() => {
                                    setMode('microsoft');
                                    startMsLogin();
                                }}
                                className="w-full py-4 px-6 bg-[#00a4ef] hover:bg-[#0078d4] text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#00a4ef]/20 active:scale-[0.98] uppercase tracking-widest"
                            >
                                <span className="text-lg">Ⓜ️</span> Microsoft Account
                            </button>
                            <button
                                onClick={() => setMode('offline')}
                                className="w-full py-4 px-6 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 border border-white/5 active:scale-[0.98] uppercase tracking-widest"
                            >
                                <WifiOff className="w-4 h-4" />
                                Offline Access
                            </button>
                        </div>
                    )}

                    {mode === 'offline' && (
                        <form onSubmit={handleOfflineLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Identity</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:border-accent-primary transition-all font-bold placeholder:text-gray-700"
                                        placeholder="Username"
                                        autoFocus
                                    />
                                    <Send className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setMode('select')}
                                    className="flex-1 py-4 bg-transparent hover:bg-white/5 text-gray-500 rounded-2xl font-black text-xs transition-colors uppercase tracking-widest"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={!username || offlineLoading}
                                    className="flex-[2] py-4 bg-accent-primary hover:bg-accent-secondary text-white rounded-2xl font-black text-xs transition-all shadow-lg shadow-accent-primary/20 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3 uppercase tracking-widest"
                                >
                                    {offlineLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Authorize"}
                                </button>
                            </div>
                        </form>
                    )}

                    {mode === 'microsoft' && renderMicrosoftAuth()}
                </div>

                <p className="text-center mt-8 text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] opacity-50">
                    &copy; 2026 Juge Launcher // Professional Edition
                </p>
            </div>
        </div>
    );
};

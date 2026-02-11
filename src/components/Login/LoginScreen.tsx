import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Send, Key, WifiOff, Loader2, Copy, Check } from 'lucide-react';


interface LoginScreenProps {
    onLoginSuccess: (account: any) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const [mode, setMode] = useState<'select' | 'offline' | 'microsoft'>('select');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Microsoft Auth State
    const [deviceCodeData, setDeviceCodeData] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    const handleOfflineLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const account = await invoke('login_offline', { username });
            onLoginSuccess(account);
        } catch (err: any) {
            setError(err.toString());
        } finally {
            setLoading(false);
        }
    };

    const startMicrosoftLogin = async () => {
        setMode('microsoft');
        setLoading(true);
        setError(null);
        try {
            const data: any = await invoke('start_ms_auth');
            setDeviceCodeData(data);
            setLoading(false);

            // Auto-open browser
            // await invoke('open_browser', { url: data.verification_uri }); 
            // User can click link manually too

            pollForToken(data.device_code);
        } catch (err: any) {
            setError("Failed to start Microsoft Auth: " + err.toString());
            setLoading(false);
        }
    };

    const pollForToken = async (deviceCode: string) => {
        const interval = setInterval(async () => {
            try {
                const account = await invoke('complete_ms_auth', { deviceCode });
                clearInterval(interval);
                onLoginSuccess(account);
            } catch (err: any) {
                if (err.toString().includes("pending")) {
                    // continue polling
                } else {
                    // Real error
                    // clearInterval(interval);
                    // setError(err.toString());
                    // For now, keep polling or until timeout
                }
            }
        }, 5000);

        // Safety timeout 5 mins
        setTimeout(() => clearInterval(interval), 300000);
    };

    const copyCode = () => {
        if (deviceCodeData) {
            navigator.clipboard.writeText(deviceCodeData.user_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen relative z-50">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <div className="relative z-10 w-full max-w-md p-8 rounded-2xl glass-panel border border-white/10 shadow-2xl animate-fade-in">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto bg-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
                        <Key className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                    <p className="text-gray-400">Sign in to JugeLauncher to continue</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                        {error}
                    </div>
                )}

                {mode === 'select' && (
                    <div className="space-y-4">
                        <button
                            onClick={startMicrosoftLogin}
                            className="w-full py-3 px-4 bg-[#00a4ef] hover:bg-[#0078d4] text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                        >
                            Sign in with Microsoft
                        </button>
                        <button
                            onClick={() => setMode('offline')}
                            className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 border border-white/5"
                        >
                            <WifiOff className="w-4 h-4" />
                            Offline Login
                        </button>
                    </div>
                )}

                {mode === 'offline' && (
                    <form onSubmit={handleOfflineLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                placeholder="Steve"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setMode('select')}
                                className="flex-1 py-3 bg-transparent hover:bg-white/5 text-gray-300 rounded-xl font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!username || loading}
                                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Login
                            </button>
                        </div>
                    </form>
                )}

                {mode === 'microsoft' && (
                    <div className="space-y-6 text-center">
                        {loading && !deviceCodeData ? (
                            <div className="py-8 flex flex-col items-center">
                                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                                <p className="text-gray-400">Connecting to Microsoft...</p>
                            </div>
                        ) : deviceCodeData ? (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-300">
                                    Go to <a href={deviceCodeData.verification_uri} target="_blank" rel="noreferrer" className="text-indigo-400 font-medium hover:underline">{deviceCodeData.verification_uri}</a> and enter the code below:
                                </p>
                                <div className="relative group cursor-pointer" onClick={copyCode}>
                                    <div className="py-3 px-6 bg-black/30 border border-indigo-500/50 rounded-xl text-2xl font-mono text-white tracking-widest">
                                        {deviceCodeData.user_code}
                                    </div>
                                    <div className="absolute inset-y-0 right-3 flex items-center">
                                        {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-500 group-hover:text-white" />}
                                    </div>
                                </div>
                                <div className="pt-4 flex flex-col items-center">
                                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mb-2" />
                                    <p className="text-sm text-gray-500">Waiting for you to sign in...</p>
                                </div>
                                <button
                                    onClick={() => setMode('select')}
                                    className="text-sm text-gray-500 hover:text-white mt-4"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Upload, User, Shield, Loader2 } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { motion, AnimatePresence } from 'framer-motion';

interface SkinManagerProps {
    account: any;
}

export const SkinManager: React.FC<SkinManagerProps> = ({ account }) => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [variant, setVariant] = useState<'classic' | 'slim'>('classic');
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<'skin' | 'cape'>('skin');
    const [selectedCape, setSelectedCape] = useState<string | null>(null);

    const handleSelectFile = async () => {
        try {
            const selected = await open({
                multiple: false,
                filters: [{
                    name: 'Image',
                    extensions: ['png']
                }]
            });

            if (selected) {
                const path = typeof selected === 'string' ? selected : (selected as any).path;
                if (activeView === 'skin') {
                    setSelectedFile(path);
                } else {
                    setSelectedCape(path);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpload = async () => {
        const file = activeView === 'skin' ? selectedFile : selectedCape;
        if (!file) return;
        setLoading(true);
        setStatus('Uploading...');

        try {
            if (activeView === 'skin') {
                if (account.account_type === 'Microsoft') {
                    await invoke('upload_skin_cmd', {
                        token: account.access_token,
                        filePath: file,
                        variant
                    });
                    setStatus('Skin uploaded successfully to Mojang!');
                } else {
                    await invoke('set_offline_skin_cmd', { filePath: file });
                    setStatus('Local skin set successfully!');
                }
            } else {
                if (account.account_type === 'Microsoft') {
                    setStatus('Error: Custom capes cannot be uploaded to Mojang. Manage capes at minecraft.net.');
                } else {
                    await invoke('set_offline_cape_cmd', { filePath: file });
                    setStatus('Local cape set successfully!');
                }
            }
        } catch (e: any) {
            setStatus(`Error: ${e.toString()}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-full grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 max-w-7xl mx-auto items-center">
            <div className="h-[500px] flex flex-col items-center justify-center p-8 bg-black/20 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                <div className={`absolute inset-0 bg-gradient-to-br transition-colors duration-500 ${activeView === 'skin' ? 'from-accent-primary/10 to-blue-500/10' : 'from-purple-500/10 to-pink-500/10'} opacity-60`} />
                <div className="relative z-10 text-center space-y-6">
                    <div className="w-64 h-[400px] flex items-center justify-center relative transition-all duration-300 transform hover:scale-105">
                        <img
                            src={activeView === 'skin'
                                ? `https://mc-heads.net/body/${account?.name || 'steve'}/right`
                                : `https://mc-heads.net/cape/${account?.name || 'steve'}`
                            }
                            onError={(e) => {
                                if (activeView === 'cape') e.currentTarget.src = "https://static.wikia.nocookie.net/minecraft_gamepedia/images/1/15/Cape.png";
                            }}
                            alt="Current"
                            className="h-full object-contain drop-shadow-2xl image-pixelated"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                            {activeView === 'skin' ? 'Current Skin' : 'Current Cape'}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">{account?.name || 'Steve'}</h2>
                    </div>
                </div>
            </div>

            <div className="flex flex-col justify-center space-y-8">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <span className={activeView === 'skin' ? 'text-white' : 'text-gray-600'}>Skin</span>
                        <span className="text-gray-600">/</span>
                        <span className={activeView === 'cape' ? 'text-purple-500' : 'text-gray-600'}>Cape</span>
                    </h1>
                    <p className="text-gray-400">Manage your appearance.</p>
                </div>

                <div className="flex gap-4 p-1 bg-white/5 rounded-xl border border-white/5">
                    <button
                        onClick={() => setActiveView('skin')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all ${activeView === 'skin' ? 'bg-accent-primary text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        <User className="w-4 h-4" /> Skins
                    </button>
                    <button
                        onClick={() => setActiveView('cape')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all ${activeView === 'cape' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Shield className="w-4 h-4" /> Capes
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeView === 'skin' ? (
                        <motion.div
                            key="skin-controls"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            <div className="flex gap-4 p-1 bg-white/5 rounded-xl border border-white/5">
                                <button onClick={() => setVariant('classic')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${variant === 'classic' ? 'bg-white/10 text-white' : 'text-gray-500'}`}>Classic</button>
                                <button onClick={() => setVariant('slim')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${variant === 'slim' ? 'bg-white/10 text-white' : 'text-gray-500'}`}>Slim</button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="cape-controls"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl text-center">
                                <p className="text-xs text-purple-400 font-bold">
                                    {account.account_type === 'Microsoft'
                                        ? "Microsoft capes must be managed via minecraft.net"
                                        : "Upload a cape to use securely in launcher (Offline)"}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div
                    onClick={handleSelectFile}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all group ${activeView === 'skin'
                        ? 'border-white/10 hover:bg-white/5 hover:border-accent-primary/50'
                        : 'border-purple-500/20 hover:bg-purple-500/5 hover:border-purple-500/50'
                        }`}
                >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${activeView === 'skin' ? 'bg-accent-primary/10 text-accent-primary' : 'bg-purple-500/10 text-purple-500'}`}>
                        <Upload className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                        <p className={`font-bold transition-colors ${activeView === 'skin' ? 'text-white group-hover:text-accent-primary' : 'text-white group-hover:text-purple-500'}`}>
                            {(activeView === 'skin' ? selectedFile : selectedCape)
                                ? (activeView === 'skin' ? selectedFile : selectedCape)?.split('\\').pop()
                                : `Click to Upload ${activeView === 'skin' ? 'Skin' : 'Cape'} File`
                            }
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Supports .png files only</p>
                    </div>
                </div>

                <div className="pt-4 space-y-4">
                    <button
                        onClick={handleUpload}
                        disabled={loading || !(activeView === 'skin' ? selectedFile : selectedCape)}
                        className={`w-full py-4 text-white rounded-xl font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${activeView === 'skin'
                            ? 'bg-accent-primary hover:bg-accent-secondary shadow-accent-primary/20 hover:shadow-accent-primary/40'
                            : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20 hover:shadow-purple-600/40'
                            }`}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Processing...</span>
                            </div>
                        ) : `Apply ${activeView === 'skin' ? 'Skin' : 'Cape'}`}
                    </button>

                    {status && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-xl border text-sm font-bold text-center ${status.includes('Error') ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}
                        >
                            {status}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Package, Hash, HardDrive, ToggleLeft, ToggleRight, Search, Info, Users, Cpu } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Mod {
    name: string;
    filename: string;
    path: string;
    enabled: boolean;
    size: number;
    version?: string;
    game_version?: string;
    description?: string;
    authors?: string[];
}

interface ModManagerProps {
    versionId?: string;
}

export const ModManager: React.FC<ModManagerProps> = ({ versionId }) => {
    const { t } = useLanguage();
    const [mods, setMods] = useState<Mod[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expandedMod, setExpandedMod] = useState<string | null>(null);

    useEffect(() => {
        loadMods();
    }, [versionId]);

    const loadMods = async () => {
        setLoading(true);
        try {
            const result: Mod[] = versionId
                ? await invoke('get_mods', { versionId })
                : await invoke('get_global_mods');
            setMods(result);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (mod: Mod, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            if (versionId) {
                await invoke('toggle_mod', { versionId, filename: mod.filename, enable: !mod.enabled });
            } else {
                await invoke('toggle_global_mod', { filename: mod.filename, enable: !mod.enabled });
            }
            loadMods();
        } catch (e) {
            console.error(e);
        }
    };

    const filteredMods = mods.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.filename.toLowerCase().includes(search.toLowerCase())
    );

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    if (loading) return (
        <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
            ))}
        </div>
    );

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="relative shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    placeholder={t('mods.search_placeholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-accent-primary transition-colors"
                />
            </div>

            <div className="grid grid-cols-1 gap-3 overflow-y-auto custom-scrollbar pr-2 flex-1 content-start">
                <AnimatePresence>
                    {filteredMods.length > 0 ? filteredMods.map((mod) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={mod.filename}
                            onClick={() => setExpandedMod(expandedMod === mod.filename ? null : mod.filename)}
                            className={`group p-4 rounded-2xl border transition-all cursor-pointer ${mod.enabled ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-black/20 border-white/5 opacity-60'
                                } hover:border-white/10`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${mod.enabled ? 'bg-accent-primary/10 text-accent-primary' : 'bg-gray-800 text-gray-500'}`}>
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-white text-sm truncate flex items-center gap-2">
                                            {mod.name}
                                            {mod.version && <span className="text-[10px] bg-accent-primary/20 text-accent-primary px-2 py-0.5 rounded-full">{mod.version}</span>}
                                            {mod.game_version && <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">{mod.game_version}</span>}
                                        </h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                <HardDrive className="w-3 h-3" /> {formatSize(mod.size)}
                                            </span>
                                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                <Hash className="w-3 h-3" /> {mod.filename}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => handleToggle(mod, e)}
                                    className={`p-2 rounded-xl transition-all ${mod.enabled ? 'bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                        }`}
                                >
                                    {mod.enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                                </button>
                            </div>

                            {/* Expanded Details */}
                            <AnimatePresence>
                                {expandedMod === mod.filename && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pt-4 mt-4 border-t border-white/5 space-y-3">
                                            {mod.description && (
                                                <div className="flex gap-3">
                                                    <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                                                    <p className="text-sm text-gray-300 leading-relaxed">{mod.description}</p>
                                                </div>
                                            )}
                                            {mod.authors && mod.authors.length > 0 && (
                                                <div className="flex items-center gap-3">
                                                    <Users className="w-4 h-4 text-gray-500" />
                                                    <p className="text-xs text-gray-400">Authors: <span className="text-white">{mod.authors.join(', ')}</span></p>
                                                </div>
                                            )}
                                            {/* Compatibility Check */}
                                            {versionId && mod.game_version && !versionId.includes(mod.game_version) && (
                                                <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 p-2 rounded-lg">
                                                    <Cpu className="w-4 h-4" />
                                                    <span className="text-xs font-bold">Version mismatch warning: Mod is for {mod.game_version}</span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )) : (
                        <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl">
                            <p className="text-gray-500 text-sm italic">{t('mods.no_mods')}</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

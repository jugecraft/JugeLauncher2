import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Package, ToggleLeft, ToggleRight, Trash2, Search, Download } from 'lucide-react';

interface Mod {
    name: string;
    filename: string;
    path: string;
    enabled: boolean;
    size: number;
}

interface ModManagerProps {
    versionId: string;
}

export const ModManager: React.FC<ModManagerProps> = ({ versionId }) => {
    const [activeTab, setActiveTab] = useState<'installed' | 'disabled' | 'marketplace'>('installed');
    const [mods, setMods] = useState<Mod[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const fetchMods = async () => {
        if (!versionId) return;
        setLoading(true);
        try {
            const list = await invoke<Mod[]>('get_mods', { versionId });
            setMods(list);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMods();
    }, [versionId]);

    const handleToggle = async (mod: Mod) => {
        try {
            await invoke('toggle_mod', {
                versionId,
                filename: mod.filename,
                enable: !mod.enabled
            });
            await fetchMods();
        } catch (e) {
            console.error(e);
            alert('Failed to toggle mod: ' + e);
        }
    };

    const filteredMods = mods.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) &&
        (activeTab === 'installed' ? m.enabled : activeTab === 'disabled' ? !m.enabled : true)
    );

    return (
        <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden flex flex-col h-[500px]">
            <div className="flex border-b border-white/10">
                <button
                    onClick={() => setActiveTab('installed')}
                    className={`px-6 py-4 font-medium transition-colors ${activeTab === 'installed' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
                >
                    Installed
                </button>
                <button
                    onClick={() => setActiveTab('disabled')}
                    className={`px-6 py-4 font-medium transition-colors ${activeTab === 'disabled' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
                >
                    Disabled
                </button>
                <button
                    onClick={() => setActiveTab('marketplace')}
                    className={`px-6 py-4 font-medium transition-colors ${activeTab === 'marketplace' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
                >
                    Marketplace
                </button>
            </div>

            <div className="p-4 bg-white/5 border-b border-white/5">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search mods..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm outline-none focus:border-indigo-500"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {activeTab === 'marketplace' ? (
                    <div className="grid grid-cols-2 gap-4">
                        {/* Marketplace Placeholders */}
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/5 transition-colors group">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400">
                                        <Package className="w-6 h-6" />
                                    </div>
                                    <button className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                                <h4 className="font-bold text-white">Example Mod {i}</h4>
                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">This is a placeholder description for a mod in the marketplace.</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    filteredMods.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            {loading ? "Loading..." : "No mods found."}
                        </div>
                    ) : (
                        filteredMods.map(mod => (
                            <div key={mod.filename} className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors group">
                                <div className="flex items-center gap-3">
                                    <Package className="w-5 h-5 text-indigo-400" />
                                    <div>
                                        <h4 className="text-sm font-medium text-white">{mod.name}</h4>
                                        <p className="text-xs text-gray-500">{(mod.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggle(mod)}
                                        className={`p-2 rounded-lg transition-colors ${mod.enabled ? 'text-green-400 hover:bg-green-400/10' : 'text-gray-500 hover:bg-gray-500/10'}`}
                                        title={mod.enabled ? "Disable" : "Enable"}
                                    >
                                        {mod.enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                                    </button>
                                    <button className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
    );
};

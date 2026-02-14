import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Save, Folder, Cpu, Monitor, Zap, Coffee, Globe } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export const SettingsScreen: React.FC = () => {
    const { t, language, setLanguage } = useLanguage();
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const s = await invoke('get_settings');
            setSettings(s);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Ensure settings object has the current language
            const settingsToSave = { ...settings, language };
            await invoke('save_settings', { settings: settingsToSave });
            setMessage(t('settings.save') + '!');
            setTimeout(() => setMessage(''), 3000);
        } catch (e: any) {
            setMessage(`Error: ${e}`);
        } finally {
            setSaving(false);
        }
    };

    const handleLanguageChange = (lang: 'en' | 'es') => {
        setLanguage(lang);
        setSettings({ ...settings, language: lang });
    };

    if (loading || !settings) return (
        <div className="flex items-center justify-center h-full">
            <Zap className="w-8 h-8 text-accent-primary animate-pulse" />
        </div>
    );

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-12 animate-fade-in pb-20">
            <div>
                <h1 className="text-4xl font-black text-white tracking-tight">{t('settings.title')}</h1>
                <p className="text-xs font-black text-accent-secondary tracking-widest mt-1">{t('settings.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Language Settings */}
                <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6 md:col-span-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-xl">
                            <Globe className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white">{t('settings.language')}</h3>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => handleLanguageChange('en')}
                            className={`flex-1 py-3 rounded-xl border font-bold transition-all ${language === 'en' ? 'bg-accent-primary border-accent-primary text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                        >
                            English
                        </button>
                        <button
                            onClick={() => handleLanguageChange('es')}
                            className={`flex-1 py-3 rounded-xl border font-bold transition-all ${language === 'es' ? 'bg-accent-primary border-accent-primary text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                        >
                            Español
                        </button>
                    </div>
                </div>

                {/* Memory Settings */}
                <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl">
                            <Cpu className="w-5 h-5 text-blue-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white">{t('settings.memory')}</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block mb-2">{t('settings.max_alloc')}</label>
                            <input
                                type="number"
                                value={settings.max_memory}
                                onChange={(e) => setSettings({ ...settings, max_memory: parseInt(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-primary transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block mb-2">{t('settings.min_alloc')}</label>
                            <input
                                type="number"
                                value={settings.min_memory}
                                onChange={(e) => setSettings({ ...settings, min_memory: parseInt(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-primary transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Display Settings */}
                <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-xl">
                            <Monitor className="w-5 h-5 text-purple-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white">{t('settings.display')}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block mb-2">{t('settings.width')}</label>
                            <input
                                type="number"
                                value={settings.width}
                                onChange={(e) => setSettings({ ...settings, width: parseInt(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-primary transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block mb-2">{t('settings.height')}</label>
                            <input
                                type="number"
                                value={settings.height}
                                onChange={(e) => setSettings({ ...settings, height: parseInt(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-primary transition-colors"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-sm font-bold text-gray-300">{t('settings.fullscreen')}</span>
                        <button
                            onClick={() => setSettings({ ...settings, full_screen: !settings.full_screen })}
                            className={`w-12 h-6 rounded-full transition-colors relative ${settings.full_screen ? 'bg-accent-primary' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.full_screen ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                </div>

                {/* Game Path */}
                <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6 md:col-span-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-xl">
                            <Folder className="w-5 h-5 text-green-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white">{t('settings.game_path')}</h3>
                    </div>

                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Default: %APPDATA%/.minecraft"
                            value={settings.minecraft_dir || ''}
                            onChange={(e) => setSettings({ ...settings, minecraft_dir: e.target.value })}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-primary transition-colors"
                        />
                        {/* In a real tauri app we would use open dialog here */}
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium italic">Leave empty to use the system default directory.</p>
                </div>

                {/* Java Runtime */}
                <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6 md:col-span-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-xl">
                            <Coffee className="w-5 h-5 text-orange-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white">{t('settings.java_path')}</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Auto-detect (recommended)"
                                value={settings.java_path || ''}
                                onChange={(e) => setSettings({ ...settings, java_path: e.target.value || null })}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-primary transition-colors font-mono text-sm"
                            />
                        </div>
                        <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl space-y-2">
                            <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest">⚠️ Important for Forge 1.8.9</p>
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                Forge 1.8.9 and older versions require <span className="text-white font-bold">Java 8</span>. If you get a ClassCastException error, download Java 8 and paste the path to <code className="bg-black/30 px-1 rounded text-accent-primary">java.exe</code> here.
                            </p>
                            <p className="text-[10px] text-gray-500 italic">
                                Example: <code className="bg-black/30 px-1 rounded">C:\Program Files\Java\jre1.8.0_XXX\bin\java.exe</code>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-8 border-t border-white/5">
                <p className={`text-sm font-bold transition-opacity ${message ? 'opacity-100 text-accent-secondary' : 'opacity-0'}`}>
                    {message}
                </p>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3 bg-accent-primary hover:bg-accent-secondary text-white font-black rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                >
                    {saving ? t('settings.saving') : (
                        <>
                            <Save className="w-5 h-5" />
                            {t('settings.save')}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

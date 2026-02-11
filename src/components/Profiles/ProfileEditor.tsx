import React, { useState, useEffect } from 'react';
import { X, Save, Trash } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface Profile {
    id: string;
    name: string;
    version_id: string;
    min_memory: number;
    max_memory: number;
    width: number;
    height: number;
    java_path?: string;
    java_args: string;
}

interface ProfileEditorProps {
    profile: Profile | null; // Null means creating new
    onClose: () => void;
    onSave: () => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ profile, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Profile>>({
        name: 'New Profile',
        version_id: '1.19.4', // Should be dropdown
        min_memory: 1024,
        max_memory: 4096,
        width: 854,
        height: 480,
        java_args: '-XX:+UseG1GC',
    });

    useEffect(() => {
        if (profile) {
            setFormData(profile);
        }
    }, [profile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (profile) {
                // Update
                await invoke('update_profile', { profile: { ...profile, ...formData } });
            } else {
                // Create
                await invoke('create_profile', {
                    name: formData.name,
                    versionId: formData.version_id
                });
                // Note: create_profile command might return new profile, but we just refresh list
            }
            onSave();
        } catch (err) {
            console.error(err);
            alert('Failed to save profile: ' + err);
        }
    };

    const handleDelete = async () => {
        if (!profile) return;
        if (confirm('Are you sure you want to delete this profile?')) {
            await invoke('delete_profile', { id: profile.id });
            onSave();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1a1a20] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                    <h2 className="text-xl font-bold text-white">
                        {profile ? 'Edit Profile' : 'Create Profile'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Profile Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-indigo-500 outline-none"
                            />
                        </div>

                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Version</label>
                            <select
                                value={formData.version_id}
                                onChange={e => setFormData({ ...formData, version_id: e.target.value })}
                                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-indigo-500 outline-none appearance-none"
                            >
                                <option value="1.19.4">1.19.4</option>
                                <option value="1.20.1">1.20.1</option>
                                <option value="1.8.9">1.8.9</option>
                            </select>
                        </div>

                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Java Version</label>
                            <input
                                type="text"
                                placeholder="Auto-detect"
                                value={formData.java_path || ''}
                                onChange={e => setFormData({ ...formData, java_path: e.target.value })}
                                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="bg-white/5 p-4 rounded-xl space-y-4">
                        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Memory Settings</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Min RAM (MB)</label>
                                <input
                                    type="number"
                                    value={formData.min_memory}
                                    onChange={e => setFormData({ ...formData, min_memory: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Max RAM (MB)</label>
                                <input
                                    type="number"
                                    value={formData.max_memory}
                                    onChange={e => setFormData({ ...formData, max_memory: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">JVM Arguments</label>
                        <textarea
                            rows={3}
                            value={formData.java_args}
                            onChange={e => setFormData({ ...formData, java_args: e.target.value })}
                            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-indigo-500 outline-none font-mono text-xs"
                        />
                    </div>
                </form>

                <div className="p-6 border-t border-white/5 bg-white/5 flex items-center justify-between">
                    <div>
                        {profile && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                <Trash className="w-4 h-4" /> Delete
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" /> Save Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

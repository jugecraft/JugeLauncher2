import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ChevronDown, Settings, Plus } from 'lucide-react';
import { ProfileEditor } from './ProfileEditor';

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
    enabled_mods: string[];
}

interface ProfileSelectorProps {
    onSelect: (profile: Profile) => void;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({ onSelect }) => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [selectedId, setSelectedId] = useState<string>('');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

    const fetchProfiles = async () => {
        try {
            const list = await invoke<Profile[]>('get_profiles');
            setProfiles(list);
            if (list.length > 0 && !selectedId) {
                setSelectedId(list[0].id);
                onSelect(list[0]);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchProfiles();
    }, []);

    const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedId(id);
        const p = profiles.find(x => x.id === id);
        if (p) onSelect(p);
    };

    const handleEdit = () => {
        const p = profiles.find(x => x.id === selectedId);
        setEditingProfile(p || null);
        setIsEditorOpen(true);
    };

    const handleCreate = () => {
        setEditingProfile(null);
        setIsEditorOpen(true);
    };

    const handleSave = () => {
        setIsEditorOpen(false);
        fetchProfiles();
    };

    return (
        <>
            <div className="flex items-center gap-2">
                <div className="relative group">
                    <select
                        value={selectedId}
                        onChange={handleSelect}
                        className="appearance-none bg-white/5 border border-white/10 hover:bg-white/10 text-white pl-4 pr-10 py-2 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 min-w-[200px]"
                    >
                        {profiles.map(p => (
                            <option key={p.id} value={p.id} className="bg-gray-900">{p.name} ({p.version_id})</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                <button
                    onClick={handleEdit}
                    className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    title="Edit Profile"
                >
                    <Settings className="w-4 h-4" />
                </button>

                <button
                    onClick={handleCreate}
                    className="p-2 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors"
                    title="Create New Profile"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {isEditorOpen && (
                <ProfileEditor
                    profile={editingProfile}
                    onClose={() => setIsEditorOpen(false)}
                    onSave={handleSave}
                />
            )}
        </>
    );
};

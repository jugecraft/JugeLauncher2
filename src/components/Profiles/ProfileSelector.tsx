import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { useLanguage } from '../../i18n/LanguageContext';

interface ProfileSelectorProps {
    onSelect: (profile: any) => void;
    localVersions: any[];
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({ onSelect, localVersions }) => {
    const { t } = useLanguage();
    const [selectedId, setSelectedId] = useState<string>('');
    const hasInitialized = useRef(false);

    // Initial setup: pick the first available version
    useEffect(() => {
        if (localVersions.length > 0 && !hasInitialized.current) {
            const first = localVersions[0];
            const id = `local-${first.id}`;
            setSelectedId(id);
            onSelect({ name: first.id.toUpperCase(), version_id: first.id, id: 'local' });
            hasInitialized.current = true;
        }
    }, [localVersions, onSelect]);

    const handleVersionClick = (v: any) => {
        const id = `local-${v.id}`;
        setSelectedId(id);
        onSelect({ name: v.id.toUpperCase(), version_id: v.id, id: 'local' });
    };

    return (
        <div className="flex items-center gap-2 p-1 bg-black/20 rounded-2xl border border-white/5 max-w-[500px] overflow-x-auto custom-scrollbar">
            {localVersions.length === 0 ? (
                <div className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    {t('profiles.no_versions')}
                </div>
            ) : (
                localVersions.map(v => {
                    const isSelected = selectedId === `local-${v.id}`;
                    return (
                        <button
                            key={v.id}
                            onClick={() => handleVersionClick(v)}
                            className={clsx(
                                "flex-shrink-0 px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 border outline-none",
                                isSelected
                                    ? "bg-accent-primary text-white border-accent-primary shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                                    : "bg-white/5 text-gray-400 border-transparent hover:bg-white/10 hover:text-white"
                            )}
                        >
                            <span className="text-xs font-black tracking-tight">{v.id}</span>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                        </button>
                    );
                })
            )}
        </div>
    );
};

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { DonationModal } from '../Common/DonationModal';
import { X, Minus, Square, LogOut } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';

interface LayoutProps {
    children: React.ReactNode;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onLogout?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout }) => {
    const [showDonate, setShowDonate] = useState(false);
    const appWindow = getCurrentWindow();
    return (
        <div className="flex h-screen w-screen bg-bg-primary overflow-hidden text-white relative font-sans">
            {/* Background Ambience - More dynamic and Lunar-like */}
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-accent-primary/10 blur-[150px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/5 blur-[150px] pointer-events-none" />

            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onDonate={() => setShowDonate(true)} />
            <DonationModal isOpen={showDonate} onClose={() => setShowDonate(false)} />

            <main className="flex-1 relative z-60 flex flex-col min-w-0 bg-white/[0.02]">
                <header className="h-14 flex items-center justify-between px-8 border-b border-white/[0.03] bg-black/10 backdrop-blur-md select-none relative z-50" data-tauri-drag-region>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-secondary opacity-50">Juge Launcher // {activeTab}</span>
                    </div>

                    <div className="flex items-center gap-2 no-drag">
                        {onLogout && (
                            <button
                                onClick={onLogout}
                                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-red-400 transition-colors mr-2"
                                title="Logout"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        )}
                        <div className="h-4 w-px bg-white/5 mx-2" />
                        <button
                            onClick={() => appWindow.minimize()}
                            className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <button
                            onClick={async () => {
                                await appWindow.toggleMaximize();
                            }}
                            className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                            <Square className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => appWindow.close()}
                            className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar">
                    <div className="h-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

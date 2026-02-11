import React from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
    children: React.ReactNode;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
    return (
        <div className="flex h-screen w-screen bg-stone-950 overflow-hidden text-white relative">
            {/* Background Ambience */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />

            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="flex-1 relative z-10 flex flex-col min-w-0">
                <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-black/20 backdrop-blur-sm" data-tauri-drag-region>
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-medium text-gray-200 capitalize">{activeTab}</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Header Actions */}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
                    <div className="max-w-6xl mx-auto animate-fade-in">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

import React from 'react';
import { Home, Settings, FolderOpen, Grid, Play } from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  account?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'home', icon: Home, label: 'Dashboard' },
    { id: 'mods', icon: Grid, label: 'My Addons' },
    { id: 'instances', icon: FolderOpen, label: 'Instances' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="glass-sidebar w-64 h-full flex flex-col p-4">
      <div className="flex items-center gap-3 px-2 mb-8 mt-2">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Play className="w-5 h-5 text-white fill-current" />
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
          JugeLauncher
        </h1>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group text-left",
                isActive
                  ? "bg-indigo-500/20 text-white border border-indigo-500/30 shadow-sm"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className={clsx("w-5 h-5 transition-colors", isActive ? "text-indigo-400" : "text-gray-500 group-hover:text-gray-300")} />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold ring-2 ring-white/10">
            JL
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Player</p>
            <p className="text-xs text-gray-500 truncate">Online</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

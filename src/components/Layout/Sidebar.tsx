import React from 'react';
import { Home, Settings, FolderOpen, Grid, Heart, User } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  account?: any;
  onDonate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onDonate }) => {
  const menuItems = [
    { id: 'home', icon: Home, label: 'Dashboard' },
    { id: 'mods', icon: Grid, label: 'Addons' },
    { id: 'skins', icon: User, label: 'Skins' },
    { id: 'instances', icon: FolderOpen, label: 'Instances' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="glass-sidebar w-20 hover:w-64 group transition-all duration-500 ease-out h-full flex flex-col p-4 z-50 overflow-hidden relative">
      {/* Background Blur enhancement */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xl -z-10" />

      <div className="flex items-center gap-4 px-2 mb-12 mt-2">
        <motion.div
          whileHover={{ rotate: 12, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-12 h-12 flex items-center justify-center"
        >
          <img src="/src/assets/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-lg" />
        </motion.div>
        <div className="overflow-hidden">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-black tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap"
          >
            JUGE<span className="text-accent-primary">CRAFT</span>
          </motion.h1>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              className={clsx(
                "w-full flex items-center gap-4 px-3 py-3 rounded-2xl transition-all duration-300 relative group/btn",
                isActive
                  ? "text-accent-primary"
                  : "text-gray-500 hover:text-white"
              )}
            >
              {/* Active Background Slide */}
              {isActive && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-accent-primary/10 rounded-2xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              <div className={clsx("min-w-6 flex justify-center z-10", isActive && "drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]")}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="font-bold text-sm tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap uppercase z-10">
                {item.label}
              </span>

              {/* Active Indicator Bar */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 w-1 h-6 bg-accent-primary rounded-r-full shadow-[0_0_15px_rgba(99,102,241,0.8)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}

        <motion.button
          onClick={onDonate}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          className="w-full flex items-center gap-4 px-3 py-3 rounded-2xl transition-all duration-300 relative text-gray-500 hover:text-white hover:bg-white/5 hover:text-pink-500 mt-auto group/donate"
        >
          <div className="min-w-6 flex justify-center">
            <Heart className="w-6 h-6 text-pink-500 group-hover/donate:fill-current transition-all" />
          </div>
          <span className="font-bold text-sm tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap uppercase text-pink-500">
            Donate
          </span>
        </motion.button>
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-4 px-2 py-2 rounded-2xl hover:bg-white/5 cursor-pointer transition-colors overflow-hidden"
        >
          <div className="min-w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-primary to-purple-500 flex items-center justify-center text-sm font-bold shadow-lg shadow-purple-500/20 border border-white/20">
            JL
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            <p className="text-sm font-bold text-white leading-tight">JugeCraft</p>
            <p className="text-[10px] text-accent-secondary font-black uppercase tracking-widest">Premium</p>
          </div>
        </motion.div>
      </div>
    </aside>
  );
};

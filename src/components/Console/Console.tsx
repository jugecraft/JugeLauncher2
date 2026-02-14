import React, { useEffect, useRef } from 'react';
import { Terminal, X, Trash2, Download, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../i18n/LanguageContext';

interface ConsoleProps {
    logs: string[];
    onClose: () => void;
    onClear: () => void;
}

export const Console: React.FC<ConsoleProps> = ({ logs, onClose, onClear }) => {
    const { t } = useLanguage();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = React.useState(false);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const handleCopy = () => {
        navigator.clipboard.writeText(logs.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadLogs = () => {
        const element = document.createElement("a");
        const file = new Blob([logs.join('\n')], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = "juge-launcher-log.txt";
        document.body.appendChild(element);
        element.click();
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="fixed inset-4 md:inset-10 z-[200] flex flex-col glass-panel border-white/10 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-black/40 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent-primary/20 flex items-center justify-center text-accent-primary shadow-inner">
                            <Terminal className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-white font-black text-sm tracking-tight">{t('console.title')}</h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t('console.subtitle')}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className={`p-3 transition-all rounded-xl ${copied ? 'text-green-500 bg-green-500/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                            title={t('console.copy')}
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={downloadLogs}
                            className="p-3 text-gray-500 hover:text-white transition-colors"
                            title={t('console.download')}
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClear}
                            className="p-3 text-gray-500 hover:text-red-500 transition-colors"
                            title={t('console.clear')}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-white/10 mx-2" />
                        <button
                            onClick={onClose}
                            className="p-3 bg-white/5 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Log View */}
                <div
                    ref={scrollRef}
                    className="flex-1 p-8 overflow-y-auto font-mono text-xs leading-relaxed bg-black/60 custom-scrollbar"
                >
                    {logs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
                            <Terminal className="w-12 h-12 opacity-20" />
                            <p className="font-bold uppercase tracking-[0.3em]">{t('console.idle')}</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <span className="text-white/20 select-none w-10 text-right">{i + 1}</span>
                                    <span className={log.includes('[ERROR]') ? 'text-red-400 font-bold' : 'text-gray-300 group-hover:text-white transition-colors'}>
                                        {log}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-3 bg-black/60 border-t border-white/5 flex items-center justify-between text-[10px] font-black text-gray-600 uppercase tracking-widest">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            {t('console.stream_active')}
                        </div>
                        <span>{t('console.lines')}: {logs.length}</span>
                    </div>
                    <div>{t('console.footer')}</div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

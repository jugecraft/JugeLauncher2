import React, { useRef, useEffect } from 'react';
import { X, Heart, ExternalLink } from 'lucide-react';
import yapeQr from '../../assets/yape_qr.svg';
import { useLanguage } from '../../i18n/LanguageContext';

interface DonationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose }) => {
    const { t } = useLanguage();
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />

            {/* Modal */}
            <div
                ref={modalRef}
                className="relative bg-[#1A1B26] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-gradient-to-r from-purple-500/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-500/20 rounded-lg text-pink-500">
                            <Heart className="w-6 h-6 fill-current" />
                        </div>
                        <h2 className="text-xl font-bold text-white">{t('donation.title')}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Motivational Message */}
                    <div className="text-center space-y-2">
                        <p className="text-gray-300 leading-relaxed font-medium">
                            "{t('donation.message')}"
                        </p>
                        <p className="text-sm text-gray-500 italic">
                            {t('donation.motivation')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* PayPal Option */}
                        <a
                            href="https://paypal.me/jugecraft"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-[#0070BA]/10 border border-[#0070BA]/20 hover:bg-[#0070BA]/20 hover:border-[#0070BA]/40 transition-all group"
                        >
                            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-8 mb-1" />
                            <span className="text-sm font-bold text-[#0070BA] group-hover:text-blue-400">{t('donation.paypal_btn')}</span>
                            <ExternalLink className="w-4 h-4 text-[#0070BA] opacity-50 group-hover:opacity-100" />
                        </a>

                        {/* Yape Option */}
                        <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-purple-600/10 border border-purple-600/20 hover:bg-purple-600/20 transition-all relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-1.5 bg-purple-600 text-[10px] font-bold text-white rounded-bl-lg">PERU</div>
                            <div className="h-24 w-24 bg-white p-1 rounded-lg">
                                <img src={yapeQr} alt="Yape QR" className="w-full h-full object-contain" />
                            </div>
                            <div className="text-center">
                                <span className="block text-sm font-bold text-purple-400">{t('donation.yape_btn')}</span>
                                <span className="block text-[10px] text-gray-400">Luis Daniel Suarez Fernandez</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-black/20 text-center border-t border-white/5">
                    <p className="text-xs text-gray-500">{t('donation.footer')}</p>
                </div>
            </div>
        </div>
    );
};

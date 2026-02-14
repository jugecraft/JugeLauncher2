import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from './translations';
import { invoke } from '@tauri-apps/api/core';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (path: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        // Load settings to get language on startup
        invoke('get_settings').then((settings: any) => {
            if (settings && settings.language) {
                console.log("Loaded language from settings:", settings.language);
                setLanguageState(settings.language as Language);
            }
        }).catch(err => console.error("Failed to load language settings:", err));
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
    };

    const t = (path: string, params?: Record<string, string>) => {
        const keys = path.split('.');
        let current: any = translations[language];
        for (const key of keys) {
            if (current === undefined || current[key] === undefined) {
                console.warn(`Translation missing for key: ${path} in language: ${language}`);
                return path;
            }
            current = current[key];
        }

        if (typeof current === 'string' && params) {
            let result = current;
            for (const [key, value] of Object.entries(params)) {
                result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
            }
            return result;
        }

        return current;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useLanguage must be used within LanguageProvider');
    return context;
};

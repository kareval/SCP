'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { es, LocaleKeys } from '@/locales/es';
import { en } from '@/locales/en';
import { it } from '@/locales/it';

type Language = 'es' | 'en' | 'it';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('es');

    // Load language from localStorage on mount
    React.useEffect(() => {
        const savedLanguage = localStorage.getItem('language') as Language;
        if (savedLanguage && ['es', 'en', 'it'].includes(savedLanguage)) {
            setLanguageState(savedLanguage);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    const t = (path: string): string => {
        const keys = path.split('.');
        const localeMap = { es, en, it };
        let current: any = localeMap[language];

        for (const key of keys) {
            if (current[key] === undefined) {
                console.warn(`Translation missing for key: ${path}`);
                return path;
            }
            current = current[key];
        }

        return current as string;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
}

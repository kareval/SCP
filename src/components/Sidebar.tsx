'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRole } from '@/context/RoleContext';
import { LayoutDashboard, FolderKanban, Receipt, Settings, FileText, Globe, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import clsx from 'clsx';
import { RoleSwitcher } from './RoleSwitcher';
import { useTranslation } from '@/context/LanguageContext';

export default function Sidebar() {
    const pathname = usePathname();
    const { role } = useRole();
    const { t, language, setLanguage } = useTranslation();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const navigation = [
        { name: t('nav.dashboard'), href: '/', icon: LayoutDashboard, roles: ['PM', 'Billing'] },
        { name: t('nav.contracts'), href: '/contracts', icon: FileText, roles: ['PM', 'Billing'] },
        { name: t('nav.projects'), href: '/projects', icon: FolderKanban, roles: ['PM'] },
        { name: t('nav.billing'), href: '/billing', icon: Receipt, roles: ['Billing'] },
        { name: t('nav.settings'), href: '/settings', icon: Settings, roles: ['PM', 'Billing'] },
    ];

    return (
        <div className={clsx(
            "flex h-full flex-col bg-primary-dark text-white transition-all duration-300 relative",
            isCollapsed ? "w-20" : "w-64"
        )}>
            {/* Header / Toggle */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-white/10 bg-black/10">
                {!isCollapsed && <h1 className="text-xl font-bold text-white tracking-tight truncate">SCP System</h1>}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={clsx(
                        "p-1.5 rounded-md text-aux-grey hover:text-white hover:bg-white/10 transition-colors",
                        isCollapsed ? "mx-auto" : ""
                    )}
                >
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto overflow-x-hidden">
                {navigation.filter(item => item.roles.includes(role)).map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={isCollapsed ? item.name : undefined}
                            className={clsx(
                                isActive
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-aux-grey hover:bg-white/10 hover:text-white',
                                'group flex items-center rounded-md py-2 text-sm font-medium transition-all duration-200',
                                isCollapsed ? 'justify-center px-0' : 'px-2'
                            )}
                        >
                            <item.icon
                                className={clsx(
                                    isActive ? 'text-white' : 'text-aux-grey group-hover:text-white',
                                    'flex-shrink-0 transition-all duration-200',
                                    isCollapsed ? 'h-6 w-6' : 'mr-3 h-5 w-5'
                                )}
                                aria-hidden="true"
                            />
                            {!isCollapsed && <span className="truncate">{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-white/10 p-4 space-y-4 bg-black/10">
                {!isCollapsed ? (
                    <RoleSwitcher />
                ) : (
                    <div className="flex justify-center" title="Role Switcher">
                        <div className="h-2 w-2 rounded-full bg-aux-grey/50"></div>
                    </div>
                )}

                {/* Language Switcher */}
                {!isCollapsed ? (
                    <div className="flex items-center justify-between text-xs text-aux-grey bg-white/5 p-2 rounded-md">
                        <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <span>{t('common.language')}</span>
                        </div>
                        <div className="flex gap-1">
                            {(['es', 'en', 'it'] as const).map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => setLanguage(lang)}
                                    className={`px-2 py-1 rounded transition-colors ${language === lang ? 'bg-primary text-white font-bold' : 'hover:bg-white/10'}`}
                                >
                                    {lang.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1 items-center">
                        <button
                            onClick={() => setLanguage(language === 'es' ? 'en' : language === 'en' ? 'it' : 'es')}
                            className="bg-white/5 p-2 rounded-md hover:bg-white/10 text-xs font-bold text-white w-full text-center"
                            title="Switch Language"
                        >
                            {language.toUpperCase()}
                        </button>
                    </div>
                )}

                <div className={clsx("flex items-center", isCollapsed ? "justify-center" : "")}>
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary-teal flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0">
                        UD
                    </div>
                    {!isCollapsed && (
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{t('common.demoUser')}</p>
                            <p className="text-xs text-aux-grey truncate">{t('common.activeSession')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

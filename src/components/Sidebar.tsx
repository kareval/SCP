'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRole } from '@/context/RoleContext';
import { LayoutDashboard, FolderKanban, Receipt, Settings, BarChart3, FileText, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import { RoleSwitcher } from './RoleSwitcher';
import { useTranslation } from '@/context/LanguageContext';
import { Globe } from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();
    const { role } = useRole();
    const { t, language, setLanguage } = useTranslation();

    const navigation = [
        { name: t('nav.dashboard'), href: '/', icon: LayoutDashboard, roles: ['PM', 'Billing'] },
        { name: t('nav.contracts'), href: '/contracts', icon: FileText, roles: ['PM', 'Billing'] },
        { name: t('nav.projects'), href: '/projects', icon: FolderKanban, roles: ['PM'] },
        { name: t('nav.billing'), href: '/billing', icon: Receipt, roles: ['Billing'] },
        { name: t('nav.settings'), href: '/settings', icon: Settings, roles: ['PM', 'Billing'] },
    ];

    return (
        <div className="flex h-full w-64 flex-col bg-primary-dark text-white">
            <div className="flex h-16 items-center justify-center border-b border-white/10 bg-black/10">
                <h1 className="text-xl font-bold text-white tracking-tight">SCP System</h1>
            </div>

            <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
                {navigation.filter(item => item.roles.includes(role)).map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                isActive
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-aux-grey hover:bg-white/10 hover:text-white',
                                'group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-all duration-200'
                            )}
                        >
                            <item.icon
                                className={clsx(
                                    isActive ? 'text-white' : 'text-aux-grey group-hover:text-white',
                                    'mr-3 h-5 w-5 flex-shrink-0'
                                )}
                                aria-hidden="true"
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-white/10 p-4 space-y-4 bg-black/10">
                <RoleSwitcher />

                {/* Language Switcher */}
                <div className="flex items-center justify-between text-xs text-aux-grey bg-white/5 p-2 rounded-md">
                    <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>{t('common.language')}</span>
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setLanguage('es')}
                            className={`px-2 py-1 rounded ${language === 'es' ? 'bg-primary text-white font-bold' : 'hover:bg-white/10'}`}
                        >
                            ES
                        </button>
                        <button
                            onClick={() => setLanguage('en')}
                            className={`px-2 py-1 rounded ${language === 'en' ? 'bg-primary text-white font-bold' : 'hover:bg-white/10'}`}
                        >
                            EN
                        </button>
                    </div>
                </div>

                <div className="flex items-center pt-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary-teal flex items-center justify-center text-xs font-bold text-white shadow-sm">
                        UD
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-white">{t('common.demoUser')}</p>
                        <p className="text-xs text-aux-grey">{t('common.activeSession')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

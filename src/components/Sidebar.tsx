'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRole } from '@/context/RoleContext';
import { LayoutDashboard, FolderKanban, Receipt, Settings, BarChart3, FileText, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import { RoleSwitcher } from './RoleSwitcher';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['PM', 'Billing', 'CFO'] },
    { name: 'Contratos', href: '/contracts', icon: FileText, roles: ['PM', 'Billing', 'CFO'] },
    { name: 'Proyectos', href: '/projects', icon: FolderKanban, roles: ['PM', 'CFO'] },
    { name: 'Control Center', href: '/control-center', icon: BarChart3, roles: ['PM', 'CFO'] },
    { name: 'Facturación', href: '/billing', icon: Receipt, roles: ['Billing', 'CFO'] },
    { name: 'Análisis Financiero', href: '/financial-analysis', icon: TrendingUp, roles: ['CFO'] },
    { name: 'Configuración', href: '/settings', icon: Settings, roles: ['PM', 'Billing', 'CFO'] },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { role } = useRole();

    return (
        <div className="flex h-full w-64 flex-col bg-primary-dark text-white">
            <div className="flex h-16 items-center justify-center border-b border-white/10">
                <h1 className="text-xl font-bold text-white">SCP System</h1>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
                {navigation.filter(item => item.roles.includes(role)).map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={clsx(
                                isActive
                                    ? 'bg-primary text-white'
                                    : 'text-aux-grey hover:bg-white/10 hover:text-white',
                                'group flex items-center rounded-md px-2 py-2 text-sm font-medium'
                            )}
                        >
                            <item.icon
                                className={clsx(
                                    isActive ? 'text-white' : 'text-aux-grey group-hover:text-white',
                                    'mr-3 h-6 w-6 flex-shrink-0'
                                )}
                                aria-hidden="true"
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t border-white/10 p-4 space-y-4">
                <RoleSwitcher />
                <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-aux-grey" />
                    <div className="ml-3">
                        <p className="text-sm font-medium text-white">Usuario Demo</p>
                        <p className="text-xs text-aux-grey">Sesión Activa</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

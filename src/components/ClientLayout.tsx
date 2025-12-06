'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    return (
        <>
            {!isLoginPage && <Sidebar />}
            <main className={`flex-1 overflow-y-auto p-8 ${isLoginPage ? 'bg-slate-100 p-0' : ''}`}>
                {children}
            </main>
        </>
    );
}

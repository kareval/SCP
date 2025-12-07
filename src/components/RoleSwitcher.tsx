'use client';

import { useRole } from '@/context/RoleContext';
import { Users } from 'lucide-react';

export function RoleSwitcher() {
    const { role, setRole } = useRole();

    return (
        <div className="flex items-center space-x-2 p-2 bg-aux-grey rounded-md border border-slate-200">
            <Users className="h-4 w-4 text-primary-dark" />
            <span className="text-sm font-medium text-primary-dark">Vista:</span>
            <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'PM' | 'Billing')}
                className="block w-full rounded-md border-gray-300 py-1 pl-2 pr-8 text-xs focus:border-primary focus:outline-none focus:ring-primary sm:text-sm bg-white text-primary-dark"
            >
                <option value="PM">Jefe Proyecto</option>
                <option value="Billing">Facturación</option>
            </select>
        </div>
    );
}

'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Role = 'PM' | 'Billing';

interface RoleContextType {
    role: Role;
    setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
    const [role, setRole] = useState<Role>('PM'); // Default to PM

    return (
        <RoleContext.Provider value={{ role, setRole }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 bg-white p-2 rounded-md shadow-lg border border-gray-200 flex gap-2 text-xs">
                <button onClick={() => setRole('PM')} className={`px-2 py-1 rounded ${role === 'PM' ? 'bg-primary text-white' : 'bg-gray-100'}`}>PM</button>
                <button onClick={() => setRole('Billing')} className={`px-2 py-1 rounded ${role === 'Billing' ? 'bg-primary text-white' : 'bg-gray-100'}`}>Billing</button>
            </div>
        </RoleContext.Provider>
    );
}

export function useRole() {
    const context = useContext(RoleContext);
    if (context === undefined) {
        throw new Error('useRole must be used within a RoleProvider');
    }
    return context;
}

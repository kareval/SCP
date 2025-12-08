import { Resource } from '@/types';

const RESOURCES_STORAGE_KEY = 'scp_resources';

const DEFAULT_RESOURCES: Resource[] = [
    {
        id: 'res-1',
        name: 'Consultor Senior',
        role: 'Consultor',
        costRate: 60,
        billRate: 120,
        currency: 'EUR',
        active: true
    },
    {
        id: 'res-2',
        name: 'Consultor Junior',
        role: 'Consultor',
        costRate: 30,
        billRate: 70,
        currency: 'EUR',
        active: true
    },
    {
        id: 'res-3',
        name: 'Gerente de Proyecto',
        role: 'Management',
        costRate: 80,
        billRate: 150,
        currency: 'EUR',
        active: true
    },
    {
        id: 'res-4',
        name: 'Desarrollador',
        role: 'Tecnología',
        costRate: 45,
        billRate: 90,
        currency: 'EUR',
        active: true
    }
];

export const resourceService = {
    getResources: (): Resource[] => {
        if (typeof window === 'undefined') return DEFAULT_RESOURCES;
        const stored = localStorage.getItem(RESOURCES_STORAGE_KEY);
        if (!stored) {
            localStorage.setItem(RESOURCES_STORAGE_KEY, JSON.stringify(DEFAULT_RESOURCES));
            return DEFAULT_RESOURCES;
        }
        return JSON.parse(stored);
    },

    saveResource: (resource: Resource): void => {
        const resources = resourceService.getResources();
        const index = resources.findIndex(r => r.id === resource.id);
        if (index >= 0) {
            resources[index] = resource;
        } else {
            resources.push(resource);
        }
        localStorage.setItem(RESOURCES_STORAGE_KEY, JSON.stringify(resources));
    },

    deleteResource: (id: string): void => {
        const resources = resourceService.getResources().filter(r => r.id !== id);
        localStorage.setItem(RESOURCES_STORAGE_KEY, JSON.stringify(resources));
    }
};

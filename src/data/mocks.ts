import { Client, Project, Invoice } from '../types';

export const MOCK_CLIENTS: Client[] = [
    { id: 'c1', name: 'Acme Corp', contactPerson: 'John Doe', email: 'john@acme.com' },
    { id: 'c2', name: 'Globex Inc', contactPerson: 'Jane Smith', email: 'jane@globex.com' },
];

export const MOCK_PROJECTS: Project[] = [
    {
        id: 'p1',
        title: 'Migración SAP S/4HANA - Fase 1',
        clientId: 'c1',
        status: 'In Progress',
        type: 'Fixed',
        budget: 50000,
        justifiedAmount: 15000,
        billedAmount: 0,
        completionPercentage: 30,
        startDate: '2024-01-15',
        isAdvance: false,
        budgetLines: [
            { id: 'bl1', concept: 'Consultoría Inicial', amount: 10000, type: 'OPEX' },
            { id: 'bl2', concept: 'Licencias', amount: 40000, type: 'CAPEX' },
        ],
    },
    {
        id: 'p2',
        title: 'Mantenimiento Evolutivo Q1',
        clientId: 'c2',
        status: 'Justified',
        type: 'TM',
        budget: 12000,
        justifiedAmount: 12000,
        billedAmount: 0,
        startDate: '2024-02-01',
        isAdvance: false,
        budgetLines: [
            { id: 'bl3', concept: 'Bolsa de Horas', amount: 12000, type: 'OPEX' },
        ],
    },
    {
        id: 'p3',
        title: 'Proyecto Futuro (Anticipo)',
        clientId: 'c1',
        status: 'Draft',
        type: 'Fixed',
        budget: 20000,
        justifiedAmount: 0,
        billedAmount: 20000,
        startDate: '2024-06-01',
        isAdvance: true,
        budgetLines: [],
    }
];

export const MOCK_INVOICES: Invoice[] = [
    {
        id: 'inv1',
        number: 'INV-2024-001',
        date: '2024-01-30',
        amount: 20000,
        projectId: 'p3',
        status: 'Sent',
        isAdvance: true,
        taxRate: 21,
        concept: 'Anticipo Proyecto P3',
    }
];

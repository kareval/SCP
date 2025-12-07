import { Client, Project, Invoice, Contract, WorkLog } from '../types';

export const MOCK_CLIENTS: Client[] = [
    { id: 'c1', name: 'TechGlobal Corp', contactPerson: 'Alice Johnson', email: 'alice@techglobal.com' },
    { id: 'c2', name: 'Retail Solutions SA', contactPerson: 'Bob Smith', email: 'bob@retail.com' },
    { id: 'c3', name: 'Gov Public Sector', contactPerson: 'Charlie Brown', email: 'charlie@gov.com' },
];

export const MOCK_CONTRACTS: Contract[] = [
    {
        id: 'ctr1',
        title: 'Acuerdo Marco Transformación Digital 2024-2026',
        code: 'AM-TD-24',
        clientId: 'c1',
        tcv: 500000,
        acquisitionCost: 15000,
        startDate: '2024-01-01',
        endDate: '2026-12-31',
        status: 'Active'
    },
    {
        id: 'ctr2',
        title: 'Soporte Evolutivo Retail',
        code: 'SER-24',
        clientId: 'c2',
        tcv: 120000,
        acquisitionCost: 2000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        status: 'Active'
    },
    {
        id: 'ctr3',
        title: 'Consultoría Estratégica Gov',
        clientId: 'c3',
        tcv: 50000,
        acquisitionCost: 500,
        startDate: '2023-06-01',
        endDate: '2023-12-31',
        status: 'Closed'
    }
];

export const MOCK_PROJECTS: Project[] = [
    // Contract 1 Projects
    {
        id: 'p1',
        contractId: 'ctr1',
        title: 'Migración Cloud Azure',
        clientId: 'c1',
        status: 'In Progress',
        type: 'Fixed',
        budget: 150000,
        justifiedAmount: 45000,
        billedAmount: 20000,
        startDate: '2024-02-01',
        endDate: '2024-11-30',
        isAdvance: false,
        strategicBreakdown: { alignment: 25, innovation: 20, customerImpact: 15, viability: 15 }, // Score: 75
        strategicScore: 75,
        budgetLines: [],
    },
    {
        id: 'p2',
        contractId: 'ctr1',
        title: 'Implementación CRM Dynamics',
        clientId: 'c1',
        status: 'In Progress',
        type: 'TM',
        budget: 80000,
        justifiedAmount: 30000,
        billedAmount: 30000,
        startDate: '2024-03-01',
        isAdvance: false,
        strategicBreakdown: { alignment: 28, innovation: 25, customerImpact: 18, viability: 18 }, // Score 89
        strategicScore: 89,
        budgetLines: [],
    },

    // Contract 2 Projects
    {
        id: 'p3',
        contractId: 'ctr2',
        title: 'Mantenimiento Q1 2024',
        clientId: 'c2',
        status: 'Billed',
        type: 'TM',
        budget: 30000,
        justifiedAmount: 30000,
        billedAmount: 30000,
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        isAdvance: false,
        budgetLines: [],
    },
    {
        id: 'p4',
        contractId: 'ctr2',
        title: 'Mantenimiento Q2 2024',
        clientId: 'c2',
        status: 'In Progress',
        type: 'TM',
        budget: 30000,
        justifiedAmount: 15000,
        billedAmount: 0,
        startDate: '2024-04-01',
        endDate: '2024-06-30',
        isAdvance: false,
        budgetLines: [],
    },

    // Orphan Project (No Contract)
    {
        id: 'p5',
        title: 'PoC Inteligencia Artificial Interna',
        clientId: 'c1',
        status: 'In Progress',
        type: 'Fixed',
        budget: 15000,
        justifiedAmount: 5000,
        billedAmount: 0,
        startDate: '2024-05-01',
        isAdvance: false,
        strategicBreakdown: { alignment: 30, innovation: 30, customerImpact: 5, viability: 10 }, // High Innovation
        strategicScore: 75,
        budgetLines: [],
    },

    // Deferred Revenue Case
    {
        id: 'p6',
        contractId: 'ctr1',
        title: 'Licenciamiento Anticipado 2025',
        clientId: 'c1',
        status: 'Budgeted',
        type: 'Fixed',
        budget: 50000,
        justifiedAmount: 0,
        billedAmount: 50000, // Billed upfront
        startDate: '2025-01-01',
        isAdvance: true,
        budgetLines: [],
    }
];

export const MOCK_INVOICES: Invoice[] = [
    {
        id: 'inv1', number: 'INV-2024-001', date: '2024-02-15',
        baseAmount: 20000, taxRate: 21, taxAmount: 4200, totalAmount: 24200,
        projectId: 'p1', status: 'Paid', isAdvance: false, concept: 'Hito 1: Análisis'
    },
    {
        id: 'inv2', number: 'INV-2024-002', date: '2024-03-31',
        baseAmount: 30000, taxRate: 21, taxAmount: 6300, totalAmount: 36300,
        projectId: 'p2', status: 'Paid', isAdvance: false, concept: 'Horas Marzo'
    },
    {
        id: 'inv3', number: 'INV-2024-003', date: '2024-03-31',
        baseAmount: 30000, taxRate: 21, taxAmount: 6300, totalAmount: 36300,
        projectId: 'p3', status: 'Paid', isAdvance: false, concept: 'Mantenimiento Q1 Completo'
    },
    {
        id: 'inv4', number: 'INV-2024-004', date: '2024-05-01',
        baseAmount: 50000, taxRate: 21, taxAmount: 10500, totalAmount: 60500,
        projectId: 'p6', status: 'Sent', isAdvance: true, concept: 'Licencias 2025 (Anticipo)'
    }
];


// Helper to generate logs
const createLogs = (projectId: string, startMonth: number, count: number, amountPerLog: number): WorkLog[] => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `log_${projectId}_${i}`,
        projectId,
        date: new Date(2024, startMonth + i, 15).toISOString(),
        concept: `Trabajo mensual mes ${startMonth + i + 1}`,
        amount: amountPerLog
    }));
};

export const MOCK_WORK_LOGS: WorkLog[] = [
    // P1: 45k justified -> 3 months of 15k (Feb, Mar, Apr)
    ...createLogs('p1', 1, 3, 15000),
    // P2: 30k justified -> 1 month (Mar)
    ...createLogs('p2', 2, 1, 30000),
    // P3: 30k justified -> 3 months 10k (Jan, Feb, Mar)
    ...createLogs('p3', 0, 3, 10000),
    // P4: 15k justified -> 1.5 months (Apr, May)
    ...createLogs('p4', 3, 2, 7500),
    // P5: 5k justified -> May
    ...createLogs('p5', 4, 1, 5000),
];

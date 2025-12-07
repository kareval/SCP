import { Client, Project, Invoice, Contract, WorkLog } from '../types';

const today = new Date();

// Helper: Get a date relative to today by months. 
// offsetMonths < 0 means future, offsetMonths > 0 means past (to match 'monthsAgo' naming), 
// OR simpler: offsetMonths positive = future, negative = past.
// Let's stick to standard add/subtract: 
// relativeMonth(0) = this month. relativeMonth(-1) = last month. relativeMonth(1) = next month.
const relativeDate = (monthOffset: number, day: number = 15) => {
    const d = new Date(today.getFullYear(), today.getMonth() + monthOffset, day);
    return d.toISOString().split('T')[0];
};

export const MOCK_CLIENTS: Client[] = [
    { id: 'c1', name: 'TechGlobal Corp', contactPerson: 'Alice Johnson', email: 'alice@techglobal.com' },
    { id: 'c2', name: 'Retail Solutions SA', contactPerson: 'Bob Smith', email: 'bob@retail.com' },
    { id: 'c3', name: 'Gov Public Sector', contactPerson: 'Charlie Brown', email: 'charlie@gov.com' },
];

export const MOCK_CONTRACTS: Contract[] = [
    {
        id: 'ctr1',
        title: 'Acuerdo Marco Transformación Digital',
        code: 'AM-TD-24',
        clientId: 'c1',
        tcv: 500000,
        acquisitionCost: 15000,
        startDate: relativeDate(-12, 1), // 1 year ago
        endDate: relativeDate(12, 31),   // 1 year future
        status: 'Active'
    },
    {
        id: 'ctr2',
        title: 'Soporte Evolutivo Retail',
        code: 'SER-24',
        clientId: 'c2',
        tcv: 120000,
        acquisitionCost: 2000,
        startDate: relativeDate(-6, 1),
        endDate: relativeDate(6, 31),
        status: 'Active'
    },
    {
        id: 'ctr3',
        title: 'Consultoría Estratégica Gov',
        clientId: 'c3',
        tcv: 50000,
        acquisitionCost: 500,
        startDate: relativeDate(-18, 1),
        endDate: relativeDate(-6, 30),
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
        startDate: relativeDate(-10, 1), // Started 10 months ago
        endDate: relativeDate(2, 28),    // Ends in 2 months
        isAdvance: false,
        strategicBreakdown: { alignment: 25, innovation: 20, customerImpact: 15, viability: 15 },
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
        startDate: relativeDate(-4, 1), // Started 4 months ago
        isAdvance: false,
        strategicBreakdown: { alignment: 28, innovation: 25, customerImpact: 18, viability: 18 },
        strategicScore: 89,
        budgetLines: [],
    },

    // Contract 2 Projects
    {
        id: 'p3',
        contractId: 'ctr2',
        title: 'Mantenimiento Q1 (Simulado)',
        clientId: 'c2',
        status: 'Billed',
        type: 'TM',
        budget: 30000,
        justifiedAmount: 30000,
        billedAmount: 30000,
        startDate: relativeDate(-6, 1),
        endDate: relativeDate(-3, 30),
        isAdvance: false,
        budgetLines: [],
    },
    {
        id: 'p4',
        contractId: 'ctr2',
        title: 'Mantenimiento Actual',
        clientId: 'c2',
        status: 'In Progress',
        type: 'TM',
        budget: 30000,
        justifiedAmount: 15000,
        billedAmount: 0,
        startDate: relativeDate(-2, 1),
        endDate: relativeDate(1, 30),
        isAdvance: false,
        budgetLines: [],
    },

    // Orphan Project
    {
        id: 'p5',
        title: 'PoC Inteligencia Artificial Interna',
        clientId: 'c1',
        status: 'In Progress',
        type: 'Fixed',
        budget: 15000,
        justifiedAmount: 5000,
        billedAmount: 0,
        startDate: relativeDate(-1, 1), // Started last month
        isAdvance: false,
        strategicBreakdown: { alignment: 30, innovation: 30, customerImpact: 5, viability: 10 },
        strategicScore: 75,
        budgetLines: [],
    },

    // Deferred Revenue / Future
    {
        id: 'p6',
        contractId: 'ctr1',
        title: 'Licenciamiento Futuro',
        clientId: 'c1',
        status: 'Budgeted',
        type: 'Fixed',
        budget: 50000,
        justifiedAmount: 0,
        billedAmount: 50000,
        startDate: relativeDate(1, 1), // Starts next month
        isAdvance: true,
        budgetLines: [],
    }
];

// Invoices (Last 6 months logic relies on dates being recent)
export const MOCK_INVOICES: Invoice[] = [
    {
        id: 'inv1', number: 'INV-001', date: relativeDate(-3), // 3 months ago
        baseAmount: 20000, taxRate: 21, taxAmount: 4200, totalAmount: 24200,
        projectId: 'p1', status: 'Paid', isAdvance: false, concept: 'Hito 1: Análisis'
    },
    {
        id: 'inv2', number: 'INV-002', date: relativeDate(-2), // 2 months ago
        baseAmount: 30000, taxRate: 21, taxAmount: 6300, totalAmount: 36300,
        projectId: 'p2', status: 'Paid', isAdvance: false, concept: 'Horas Mes Anterior'
    },
    {
        id: 'inv3', number: 'INV-003', date: relativeDate(-1), // 1 month ago
        baseAmount: 30000, taxRate: 21, taxAmount: 6300, totalAmount: 36300,
        projectId: 'p3', status: 'Paid', isAdvance: false, concept: 'Mantenimiento Trimestral'
    },
    {
        id: 'inv4', number: 'INV-004', date: relativeDate(0), // This month
        baseAmount: 50000, taxRate: 21, taxAmount: 10500, totalAmount: 60500,
        projectId: 'p6', status: 'Sent', isAdvance: true, concept: 'Licencias Anticipadas'
    }
];

// Helper to generate logs
const createLogs = (projectId: string, startOffset: number, count: number, amountPerLog: number): WorkLog[] => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `log_${projectId}_${i}`,
        projectId,
        date: relativeDate(startOffset + i, 15),
        concept: `Trabajo ${projectId}`,
        amount: amountPerLog
    }));
};

export const MOCK_WORK_LOGS: WorkLog[] = [
    // P1 (Started -10): Logs around -5 to -3
    ...createLogs('p1', -5, 3, 15000),
    // P2 (Started -4): Log at -2
    ...createLogs('p2', -2, 1, 30000),
    // P3 (Started -6): Logs -6 to -4
    ...createLogs('p3', -6, 3, 10000),
    // P4 (Started -2): Log at -1
    ...createLogs('p4', -1, 2, 7500),
    // P5 (Started -1): Log at 0
    ...createLogs('p5', 0, 1, 5000),
];

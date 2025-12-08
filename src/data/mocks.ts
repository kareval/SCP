import { Client, Project, Invoice, Contract, WorkLog, Resource, ProjectResource, ProjectBaseline } from '../types';

const today = new Date();

// Helper: Get a date relative to today by months.
const relativeDate = (monthOffset: number, day: number = 15) => {
    const d = new Date(today.getFullYear(), today.getMonth() + monthOffset, day);
    return d.toISOString().split('T')[0];
};

// ============ CLIENTS ============
export const MOCK_CLIENTS: Client[] = [
    { id: 'c1', name: 'TechGlobal Corp', contactPerson: 'Alice Johnson', email: 'alice@techglobal.com' },
    { id: 'c2', name: 'Retail Solutions SA', contactPerson: 'Bob Smith', email: 'bob@retail.com' },
    { id: 'c3', name: 'Gov Public Sector', contactPerson: 'Charlie Brown', email: 'charlie@gov.com' },
    { id: 'c4', name: 'Interno (SAPIMSA)', contactPerson: 'Internal', email: 'internal@sapimsa.com' },
];

// ============ CONTRACTS ============
export const MOCK_CONTRACTS: Contract[] = [
    {
        id: 'ctr1',
        title: 'Acuerdo Marco Transformación Digital',
        code: 'AM-TD-24',
        clientId: 'c1',
        tcv: 500000,
        acquisitionCost: 15000,
        startDate: relativeDate(-12, 1),
        endDate: relativeDate(12, 31),
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
];

// ============ RESOURCES (Global Rate Cards) ============
export const MOCK_RESOURCES: Resource[] = [
    { id: 'res-1', name: 'Consultor Senior', role: 'Consultor', costRate: 60, billRate: 120, currency: 'EUR', active: true },
    { id: 'res-2', name: 'Consultor Junior', role: 'Consultor', costRate: 30, billRate: 70, currency: 'EUR', active: true },
    { id: 'res-3', name: 'Gerente de Proyecto', role: 'Management', costRate: 80, billRate: 150, currency: 'EUR', active: true },
    { id: 'res-4', name: 'Desarrollador', role: 'Tecnología', costRate: 45, billRate: 90, currency: 'EUR', active: true },
];

// ============ PROJECTS ============
export const MOCK_PROJECTS: Project[] = [
    // === CASE 1: GOLDEN PATH (Success) ===
    // High Margin, Ahead of Schedule, No Risks
    {
        id: 'p-high-margin',
        contractId: 'ctr1',
        title: 'Proyecto Transformación Digital (Éxito)',
        clientId: 'c1',
        status: 'In Progress',
        type: 'TM',
        revenueMethod: 'Input',
        budget: 150000,
        totalEstimatedCosts: 80000,
        justifiedAmount: 90000, // 60% Revenue
        billedAmount: 85000,    // Good Cash Flow
        startDate: relativeDate(-5, 1),
        endDate: relativeDate(3, 28),
        isAdvance: false,
        budgetLines: [],
        contingencyReserve: 5, // 5% Reserve (Unused)
        strategicScore: 92,
        strategicBreakdown: { alignment: 28, innovation: 28, customerImpact: 18, viability: 18 },
        expectedROI: 45.5,
        team: [{ ...MOCK_RESOURCES[3], overrideBillRate: 110 }],
    },

    // === CASE 2: RISK PROJECT (Low CPI & Reserve Usage) ===
    // Costs are running high, eating into margin and reserve
    {
        id: 'p-risk-cpi',
        contractId: 'ctr2',
        title: 'Proyecto Migración Legacy (Riesgo CPI)',
        clientId: 'c2',
        status: 'In Progress',
        type: 'TM',
        revenueMethod: 'Input',
        budget: 60000,
        totalEstimatedCosts: 70000, // Updated Estimate > Budget (Ouch)
        justifiedAmount: 30000,
        billedAmount: 25000,
        startDate: relativeDate(-3, 1),
        endDate: relativeDate(2, 1),
        isAdvance: false,
        budgetLines: [],
        contingencyReserve: 10, // 10% Reserve (6k) - Critical for this scenario
        strategicScore: 65,
        strategicBreakdown: { alignment: 20, innovation: 10, customerImpact: 20, viability: 15 },
        team: [{ ...MOCK_RESOURCES[0] }],
    },

    // === CASE 3: INTERNAL R&D (No Revenue) ===
    // Pure cost center
    {
        id: 'p-internal',
        title: 'Iniciativa I+D GenAI',
        clientId: 'c4',
        status: 'In Progress',
        type: 'Internal',
        revenueMethod: 'Input',
        budget: 0,
        totalEstimatedCosts: 30000,
        justifiedAmount: 0,
        billedAmount: 0,
        startDate: relativeDate(-2, 1),
        isAdvance: false,
        budgetLines: [],
        strategicScore: 95,
        strategicBreakdown: { alignment: 30, innovation: 30, customerImpact: 20, viability: 15 },
    },

    // === CASE 4: SCHEDULE RISK (Late) ===
    // Fixed Price, Deadline passed
    {
        id: 'p-risk-schedule',
        contractId: 'ctr1',
        title: 'Implementación ERP (Retrasado)',
        clientId: 'c1',
        status: 'In Progress',
        type: 'Fixed',
        revenueMethod: 'Output',
        budget: 85000,
        justifiedAmount: 60000, // 70% done
        billedAmount: 60000,
        startDate: relativeDate(-8, 1),
        endDate: relativeDate(-1, 1), // Ended last month!
        isAdvance: false,
        budgetLines: [],
        milestones: [
            { id: 'm1', name: 'Diseño', percentage: 30, completed: true, actualDate: relativeDate(-7) },
            { id: 'm2', name: 'Desarrollo', percentage: 40, completed: true, actualDate: relativeDate(-2) },
            { id: 'm3', name: 'UAT y Despliegue', percentage: 30, completed: false } // Late
        ],
        contingencyReserve: 8,
        strategicScore: 80,
        strategicBreakdown: { alignment: 25, innovation: 15, customerImpact: 25, viability: 15 },
    },

    // === CASE 5: STARTUP (Pre-billing) ===
    // Just started, advances invoiced
    {
        id: 'p-deferred',
        contractId: 'ctr1',
        title: 'Consultoría Estratégica 2026',
        clientId: 'c1',
        status: 'Budgeted',
        type: 'Fixed',
        revenueMethod: 'Linear',
        budget: 40000,
        justifiedAmount: 0, // No work done yet
        billedAmount: 20000, // 50% Advance
        startDate: relativeDate(1, 1), // Starts next month
        isAdvance: true,
        budgetLines: [],
        billingForecast: [
            { id: 'f1', date: relativeDate(0), amount: 20000, isAdvance: true, notes: 'Pago Inicial 50%' },
            { id: 'f2', date: relativeDate(3), amount: 20000, isAdvance: false, notes: 'Pago Final' }
        ],
        strategicScore: 88,
        strategicBreakdown: { alignment: 25, innovation: 20, customerImpact: 25, viability: 18 },
    },

    // === CASE 6: HIGH WIP (Underbilled) ===
    // Work done but not invoiced
    {
        id: 'p-risk-wip',
        contractId: 'ctr1',
        title: 'Mantenimiento Evolutivo (High WIP)',
        clientId: 'c1',
        status: 'In Progress',
        type: 'TM',
        revenueMethod: 'Input',
        budget: 120000,
        totalEstimatedCosts: 60000,
        justifiedAmount: 45000, // Revenue Recognized
        billedAmount: 5000,     // Only 5k billed -> 40k WIP Asset
        startDate: relativeDate(-3, 1),
        endDate: relativeDate(6, 1),
        isAdvance: false,
        budgetLines: [],
        contingencyReserve: 3,
        strategicScore: 70,
        strategicBreakdown: { alignment: 20, innovation: 15, customerImpact: 20, viability: 15 },
    }
];

// ============ INVOICES ============
export const MOCK_INVOICES: Invoice[] = [
    // High Margin - Steady billing
    {
        id: 'inv1', number: 'INV-2024-001', date: relativeDate(-3),
        baseAmount: 40000, taxRate: 21, taxAmount: 8400, totalAmount: 48400,
        projectId: 'p-high-margin', status: 'Paid', isAdvance: false, concept: 'Hito 1: Inicio'
    },
    {
        id: 'inv2', number: 'INV-2024-002', date: relativeDate(-1),
        baseAmount: 45000, taxRate: 21, taxAmount: 9450, totalAmount: 54450,
        projectId: 'p-high-margin', status: 'Sent', isAdvance: false, concept: 'Hito 2: Desarrollo'
    },
    // Risk CPI - Billing stopped due to issues? Or just normal billing?
    {
        id: 'inv3', number: 'INV-2024-003', date: relativeDate(-2),
        baseAmount: 15000, taxRate: 21, taxAmount: 3150, totalAmount: 18150,
        projectId: 'p-risk-cpi', status: 'Paid', isAdvance: false, concept: 'Mensualidad 1'
    },
    // Delivered but unpaid
    {
        id: 'inv4', number: 'INV-2024-004', date: relativeDate(-1),
        baseAmount: 10000, taxRate: 21, taxAmount: 2100, totalAmount: 12100,
        projectId: 'p-risk-cpi', status: 'Sent', isAdvance: false, concept: 'Mensualidad 2'
    },
    // Schedule Risk (Late project) - Billed almost everything
    {
        id: 'inv5', number: 'INV-2024-005', date: relativeDate(-6),
        baseAmount: 30000, taxRate: 21, taxAmount: 6300, totalAmount: 36300,
        projectId: 'p-risk-schedule', status: 'Paid', isAdvance: false, concept: 'Pago Inicial'
    },
    {
        id: 'inv6', number: 'INV-2024-006', date: relativeDate(-2),
        baseAmount: 30000, taxRate: 21, taxAmount: 6300, totalAmount: 36300,
        projectId: 'p-risk-schedule', status: 'Paid', isAdvance: false, concept: 'Pago Intermedio'
    },
    // Deferred Revenue (Startup)
    {
        id: 'inv7', number: 'INV-2024-007', date: relativeDate(0),
        baseAmount: 20000, taxRate: 21, taxAmount: 4200, totalAmount: 24200,
        projectId: 'p-deferred', status: 'Sent', isAdvance: true, concept: 'Anticipo 50%'
    },
    // High WIP (Underbilled)
    {
        id: 'inv8', number: 'INV-2024-008', date: relativeDate(-1),
        baseAmount: 5000, taxRate: 21, taxAmount: 1050, totalAmount: 6050,
        projectId: 'p-risk-wip', status: 'Paid', isAdvance: false, concept: 'Arranque'
    }
];

// ============ WORK LOGS (with Resource & Cost) ============
export const MOCK_WORK_LOGS: WorkLog[] = [
    // === High Margin: Efficient Execution ===
    // Revenue High, Cost Low
    { id: 'log-hm-1', projectId: 'p-high-margin', date: relativeDate(-4, 10), concept: 'Arquitectura Base', amount: 20000, hours: 150, resourceId: 'res-3', costAmount: 12000 },
    { id: 'log-hm-2', projectId: 'p-high-margin', date: relativeDate(-3, 15), concept: 'Desarrollo Core', amount: 30000, hours: 250, resourceId: 'res-4', costAmount: 11250 },
    { id: 'log-hm-3', projectId: 'p-high-margin', date: relativeDate(-1, 20), concept: 'Integración', amount: 40000, hours: 300, resourceId: 'res-4', costAmount: 13500 },

    // === Risk CPI: Disaster ===
    // Revenue Low, Cost Huge (Rework)
    { id: 'log-rc-1', projectId: 'p-risk-cpi', date: relativeDate(-2, 10), concept: 'Intento de Migración 1', amount: 10000, hours: 300, resourceId: 'res-1', costAmount: 18000 }, // Cost 18k, Rev 10k!
    { id: 'log-rc-2', projectId: 'p-risk-cpi', date: relativeDate(-1, 5), concept: 'Bugfixing Crítico', amount: 5000, hours: 200, resourceId: 'res-1', costAmount: 12000 }, // Cost 12k, Rev 5k!
    { id: 'log-rc-3', projectId: 'p-risk-cpi', date: relativeDate(0, 1), concept: 'Soporte Emergencia', amount: 5000, hours: 100, resourceId: 'res-1', costAmount: 6000 },

    // === Internal: Pure Cost ===
    { id: 'log-int-1', projectId: 'p-internal', date: relativeDate(-1, 10), concept: 'Investigación', amount: 0, hours: 100, resourceId: 'res-4', costAmount: 4500 },
    { id: 'log-int-2', projectId: 'p-internal', date: relativeDate(0, 5), concept: 'PoC Development', amount: 0, hours: 200, resourceId: 'res-4', costAmount: 9000 },

    // === High WIP: Work Done, Not Billed ===
    { id: 'log-wip-1', projectId: 'p-risk-wip', date: relativeDate(-2, 10), concept: 'Sprint 1', amount: 15000, hours: 150, resourceId: 'res-4', costAmount: 6750 },
    { id: 'log-wip-2', projectId: 'p-risk-wip', date: relativeDate(-1, 10), concept: 'Sprint 2', amount: 15000, hours: 150, resourceId: 'res-4', costAmount: 6750 },
    { id: 'log-wip-3', projectId: 'p-risk-wip', date: relativeDate(0, 5), concept: 'Sprint 3', amount: 15000, hours: 150, resourceId: 'res-4', costAmount: 6750 },
];

// ============ SEED FUNCTION ============
export const seedDatabase = async (projectService: any) => {
    console.log('🌱 Seeding database with demo data...');

    // Seed Projects
    for (const project of MOCK_PROJECTS) {
        try {
            await projectService.createProject(project);
            console.log(`  ✅ Project: ${project.title}`);
        } catch (e) {
            console.log(`  ⚠️ Project already exists: ${project.title}`);
        }
    }

    // Seed Work Logs
    for (const log of MOCK_WORK_LOGS) {
        try {
            await projectService.addWorkLog(log.projectId, log);
            console.log(`  ✅ WorkLog: ${log.concept}`);
        } catch (e) {
            console.log(`  ⚠️ WorkLog error: ${log.id}`);
        }
    }

    // Seed Invoices
    for (const invoice of MOCK_INVOICES) {
        try {
            await projectService.createInvoice(invoice);
            console.log(`  ✅ Invoice: ${invoice.number}`);
        } catch (e) {
            console.log(`  ⚠️ Invoice error: ${invoice.id}`);
        }
    }

    console.log('🎉 Seeding complete!');
};

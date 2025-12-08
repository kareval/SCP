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
    // === CASE 1: High Margin Project (>30%) ===
    {
        id: 'p-high-margin',
        contractId: 'ctr1',
        title: 'Proyecto Margen Alto',
        clientId: 'c1',
        status: 'In Progress',
        type: 'TM',
        revenueMethod: 'Input',
        budget: 100000,
        totalEstimatedCosts: 40000,
        justifiedAmount: 50000, // 50% progress
        billedAmount: 40000,
        startDate: relativeDate(-4, 1),
        endDate: relativeDate(2, 28),
        isAdvance: false,
        budgetLines: [],
        strategicScore: 85,
        strategicBreakdown: { alignment: 25, innovation: 25, customerImpact: 20, viability: 15 },
    },

    // === CASE 2: Low Margin Project (<15%) ===
    {
        id: 'p-low-margin',
        contractId: 'ctr2',
        title: 'Proyecto Margen Bajo',
        clientId: 'c2',
        status: 'In Progress',
        type: 'TM',
        revenueMethod: 'Input',
        budget: 50000,
        totalEstimatedCosts: 45000, // High cost relative to budget
        justifiedAmount: 25000,
        billedAmount: 20000,
        startDate: relativeDate(-3, 1),
        endDate: relativeDate(3, 30),
        isAdvance: false,
        budgetLines: [],
        strategicScore: 60,
        strategicBreakdown: { alignment: 20, innovation: 10, customerImpact: 15, viability: 15 },
    },

    // === CASE 3: Internal Project (No Revenue) ===
    {
        id: 'p-internal',
        title: 'Proyecto Interno I+D',
        clientId: 'c4',
        status: 'In Progress',
        type: 'Internal',
        revenueMethod: 'Input',
        budget: 0, // No budget/revenue
        totalEstimatedCosts: 20000,
        justifiedAmount: 0,
        billedAmount: 0,
        startDate: relativeDate(-2, 1),
        isAdvance: false,
        budgetLines: [],
        strategicScore: 90,
        strategicBreakdown: { alignment: 25, innovation: 25, customerImpact: 20, viability: 20 },
    },

    // === CASE 4: Project with Team & Override Rates ===
    {
        id: 'p-team-override',
        contractId: 'ctr1',
        title: 'Proyecto con Equipo Dedicado',
        clientId: 'c1',
        status: 'In Progress',
        type: 'TM',
        revenueMethod: 'Input',
        budget: 80000,
        totalEstimatedCosts: 50000,
        justifiedAmount: 30000,
        billedAmount: 25000,
        startDate: relativeDate(-3, 1),
        endDate: relativeDate(3, 28),
        isAdvance: false,
        budgetLines: [],
        team: [
            { ...MOCK_RESOURCES[0], overrideCostRate: 70, overrideBillRate: 140 }, // Senior with premium rate
            { ...MOCK_RESOURCES[3] }, // Developer with global rates
        ] as ProjectResource[],
        strategicScore: 75,
        strategicBreakdown: { alignment: 20, innovation: 20, customerImpact: 20, viability: 15 },
    },

    // === CASE 5: Project with Baseline (Budget Changed) ===
    {
        id: 'p-baseline',
        contractId: 'ctr1',
        title: 'Proyecto con Línea Base',
        clientId: 'c1',
        status: 'In Progress',
        type: 'Fixed',
        revenueMethod: 'Linear',
        budget: 120000, // Current budget (increased)
        justifiedAmount: 40000,
        billedAmount: 30000,
        startDate: relativeDate(-6, 1),
        endDate: relativeDate(6, 30),
        isAdvance: false,
        budgetLines: [],
        originalBaseline: {
            capturedAt: relativeDate(-5, 1),
            budget: 100000, // Original budget was 100k
            startDate: relativeDate(-6, 1),
            endDate: relativeDate(4, 30), // Original end was earlier
            totalEstimatedCosts: 60000,
        } as ProjectBaseline,
        strategicScore: 70,
        strategicBreakdown: { alignment: 20, innovation: 15, customerImpact: 20, viability: 15 },
    },

    // === CASE 6: Output-based Project (Milestones) ===
    {
        id: 'p-milestones',
        contractId: 'ctr2',
        title: 'Proyecto con Hitos',
        clientId: 'c2',
        status: 'In Progress',
        type: 'Fixed',
        revenueMethod: 'Output',
        budget: 60000,
        justifiedAmount: 24000, // 40% completed
        billedAmount: 18000,
        startDate: relativeDate(-4, 1),
        endDate: relativeDate(4, 30),
        isAdvance: false,
        budgetLines: [],
        milestones: [
            { id: 'm1', name: 'Análisis y Diseño', percentage: 20, completed: true, actualDate: relativeDate(-2, 15) },
            { id: 'm2', name: 'Desarrollo Fase 1', percentage: 20, completed: true, actualDate: relativeDate(-1, 20) },
            { id: 'm3', name: 'Desarrollo Fase 2', percentage: 30, completed: false },
            { id: 'm4', name: 'Testing y Go-Live', percentage: 30, completed: false },
        ],
        strategicScore: 65,
        strategicBreakdown: { alignment: 15, innovation: 20, customerImpact: 15, viability: 15 },
    },

    // === CASE 7: Advance/Deferred Revenue ===
    {
        id: 'p-deferred',
        contractId: 'ctr1',
        title: 'Licenciamiento Futuro',
        clientId: 'c1',
        status: 'Budgeted',
        type: 'Fixed',
        revenueMethod: 'Linear',
        budget: 50000,
        justifiedAmount: 0,
        billedAmount: 50000, // Billed in advance
        startDate: relativeDate(1, 1),
        isAdvance: true,
        budgetLines: [],
        strategicScore: 50,
        strategicBreakdown: { alignment: 15, innovation: 10, customerImpact: 15, viability: 10 },
    },
];

// ============ INVOICES ============
export const MOCK_INVOICES: Invoice[] = [
    {
        id: 'inv1', number: 'INV-001', date: relativeDate(-3),
        baseAmount: 40000, taxRate: 21, taxAmount: 8400, totalAmount: 48400,
        projectId: 'p-high-margin', status: 'Paid', isAdvance: false, concept: 'Facturación Parcial'
    },
    {
        id: 'inv2', number: 'INV-002', date: relativeDate(-2),
        baseAmount: 20000, taxRate: 21, taxAmount: 4200, totalAmount: 24200,
        projectId: 'p-low-margin', status: 'Paid', isAdvance: false, concept: 'Horas Mes Anterior'
    },
    {
        id: 'inv3', number: 'INV-003', date: relativeDate(-1),
        baseAmount: 25000, taxRate: 21, taxAmount: 5250, totalAmount: 30250,
        projectId: 'p-team-override', status: 'Sent', isAdvance: false, concept: 'Sprint 1-2'
    },
    {
        id: 'inv4', number: 'INV-004', date: relativeDate(-2),
        baseAmount: 18000, taxRate: 21, taxAmount: 3780, totalAmount: 21780,
        projectId: 'p-milestones', status: 'Paid', isAdvance: false, concept: 'Hito 1: Análisis'
    },
    {
        id: 'inv5', number: 'INV-005', date: relativeDate(0),
        baseAmount: 50000, taxRate: 21, taxAmount: 10500, totalAmount: 60500,
        projectId: 'p-deferred', status: 'Sent', isAdvance: true, concept: 'Licencias Anticipadas'
    },
];

// ============ WORK LOGS (with Resource & Cost) ============
export const MOCK_WORK_LOGS: WorkLog[] = [
    // High Margin Project - Good ratio (Revenue 50k, Cost 20k = 60% margin)
    { id: 'log-hm-1', projectId: 'p-high-margin', date: relativeDate(-3, 10), concept: 'Desarrollo módulo principal', amount: 25000, hours: 200, resourceId: 'res-4', costAmount: 9000 },
    { id: 'log-hm-2', projectId: 'p-high-margin', date: relativeDate(-2, 10), concept: 'Integración APIs', amount: 25000, hours: 180, resourceId: 'res-4', costAmount: 8100 },

    // Low Margin Project - Poor ratio (Revenue 25k, Cost 20k = 20% margin)
    { id: 'log-lm-1', projectId: 'p-low-margin', date: relativeDate(-2, 10), concept: 'Desarrollo complejo', amount: 12500, hours: 180, resourceId: 'res-1', costAmount: 10800 },
    { id: 'log-lm-2', projectId: 'p-low-margin', date: relativeDate(-1, 10), concept: 'Correcciones urgentes', amount: 12500, hours: 160, resourceId: 'res-1', costAmount: 9600 },

    // Internal Project - Only Cost, No Revenue
    { id: 'log-int-1', projectId: 'p-internal', date: relativeDate(-1, 10), concept: 'Investigación I+D', amount: 0, hours: 80, resourceId: 'res-4', costAmount: 3600 },
    { id: 'log-int-2', projectId: 'p-internal', date: relativeDate(0, 5), concept: 'Prototipo IA', amount: 0, hours: 100, resourceId: 'res-2', costAmount: 3000 },

    // Team Override Project - Uses custom rates
    { id: 'log-to-1', projectId: 'p-team-override', date: relativeDate(-2, 10), concept: 'Consultoría Senior (Override)', amount: 14000, hours: 100, resourceId: 'res-1', costAmount: 7000 }, // 140 bill, 70 cost
    { id: 'log-to-2', projectId: 'p-team-override', date: relativeDate(-1, 10), concept: 'Desarrollo', amount: 16000, hours: 170, resourceId: 'res-4', costAmount: 7650 }, // Standard 90/45

    // Baseline Project
    { id: 'log-bl-1', projectId: 'p-baseline', date: relativeDate(-4, 10), concept: 'Fase Inicial', amount: 20000, hours: 150, resourceId: 'res-3', costAmount: 12000 },
    { id: 'log-bl-2', projectId: 'p-baseline', date: relativeDate(-2, 10), concept: 'Desarrollo Core', amount: 20000, hours: 200, resourceId: 'res-4', costAmount: 9000 },

    // Milestones Project - No logs (revenue from milestones)
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

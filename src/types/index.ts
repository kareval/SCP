export type ProjectStatus = 'Draft' | 'Budgeted' | 'Approved' | 'In Progress' | 'Justified' | 'Accepted' | 'Billed' | 'Closed';

export interface Client {
    id: string;
    name: string;
    contactPerson: string;
    email: string;
}

export interface BudgetLine {
    id: string;
    concept: string;
    amount: number;
    type: 'CAPEX' | 'OPEX';
}

export type ProjectType = 'TM' | 'Fixed';

export interface WorkLog {
    id: string;
    projectId: string;
    date: string;
    concept: string;
    amount: number; // Revenue recognized
    hours?: number; // Optional for T&M
}

export type RevenueMethod = 'Input' | 'Output' | 'Linear';

export interface Milestone {
    id: string;
    name: string;
    percentage: number;
    completed: boolean;
    targetDate?: string; // Fecha estimada de consecución
    actualDate?: string; // Fecha real de cumplimiento
}

export interface Contract {
    id: string;
    code?: string; // Short identifier (e.g., C-2024-001)
    title: string;
    clientId: string;
    tcv: number; // Total Contract Value
    acquisitionCost?: number; // Coste de Adquisición (CAC)
    startDate: string;
    endDate: string;
    status: 'Active' | 'Closed';
}

export interface Project {
    id: string;
    contractId?: string; // Link to Parent Contract
    title: string;
    clientId: string;
    status: ProjectStatus;
    type: ProjectType;
    budget: number;
    justifiedAmount: number; // Revenue Recognized
    billedAmount: number;
    completionPercentage?: number; // For Fixed Price (Legacy/Simple)

    // Strategic Metrics
    strategicScore?: number; // 0-100 Valor Estratégico (Calculated Sum)
    strategicBreakdown?: {
        alignment: number;      // Max 30
        innovation: number;     // Max 30
        customerImpact: number; // Max 20
        viability: number;      // Max 20
    };
    expectedROI?: number; // Return on Investment Estimado (%)

    // Advanced Revenue Recognition
    revenueMethod?: RevenueMethod;
    totalEstimatedCosts?: number; // For Input Method
    milestones?: Milestone[]; // For Output Method
    linearMonthlyAmount?: number; // For Linear Method
    hourlyRate?: number; // For T&M Projects

    // Time-Phased Budgeting
    phases?: ProjectPhase[];
    monthlyBudget?: MonthlyBudget[];

    // Billing Forecast
    billingForecast?: BillingForecastItem[];

    startDate?: string;
    endDate?: string;
    budgetLines: BudgetLine[];
    isAdvance: boolean;

    // Simulation Storage
    lastEACSimulation?: {
        progress: number;
        lastUpdated: string;
    };
}

export interface ProjectPhase {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    budgetAllocation: number; // Amount allocated to this phase
}

export interface MonthlyBudget {
    phaseId: string;
    month: string; // YYYY-MM
    amount: number;
}

export interface BillingForecastItem {
    id: string;
    date: string; // YYYY-MM-DD
    amount: number;
    isAdvance: boolean; // If true, it's an advance payment (Deferred Revenue)
    notes?: string;
}

export interface Invoice {
    id: string;
    number: string;
    date: string;
    dueDate?: string; // New: Date payment is expected
    paymentDate?: string; // New: Date payment was received
    amount: number;
    taxRate: number; // New: Default 21%
    concept: string; // New: Description
    notes?: string; // New: Internal notes
    projectId: string;
    status: 'Draft' | 'Sent' | 'Paid' | 'Overdue'; // New: Overdue status
    isAdvance: boolean;
}

export interface MonthlyStatement {
    month: string; // YYYY-MM
    projectId: string;
    items: {
        concept: string;
        amount: number;
        billId?: string;
        notes?: string;
    }[];
}

export type BillingStatus = 'UpToDate' | 'ReadyToBill' | 'Overdue';

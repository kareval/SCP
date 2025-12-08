import { LocaleKeys } from './es';

export const en: LocaleKeys = {
    common: {
        loading: 'Loading...',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        back: 'Back',
        confirmDelete: 'Are you sure you want to delete this item?',
        active: 'Active',
        closed: 'Closed',
        language: 'Language',
        user: 'User',
        demoUser: 'Demo User',
        activeSession: 'Active Session',
        saving: 'Saving...',
        select: 'Select...',
        title: 'Title',
        monthly: 'Monthly',
        quarterly: 'Quarterly',
        yearly: 'Yearly',
        reset: 'Reset',
        all: 'All',
        perMonth: 'Per Month',
        update: 'Update',
        import: 'Import',
        file: 'File'
    },
    nav: {
        dashboard: 'Dashboard',
        projects: 'Projects',
        contracts: 'Contracts',
        billing: 'Billing',
        settings: 'Settings'
    },
    dashboard: {
        strategicPortfolio: 'Strategic Portfolio',
        financialTab: 'Financial Overview',
        strategicTab: 'Strategic Overview',
        billingTrend: 'Billing Trend (6 months)',
        efficiency: 'Operational Efficiency (Justified vs Budget)',
        clientConcentration: 'Client Concentration (TCV)',
        strategicRadar: 'Strategic Score Radar',
        subtitle: 'Financial KPIs and Strategic Analysis',
        exportMatrix: 'Export (Matrix)',
        internalProjects: {
            title: 'Internal Projects',
            disclaimer: '* Not included in production revenue metrics',
            totalHours: 'Total Hours',
            totalCost: 'Total Cost'
        },
        revenueMatrix: {
            title: 'Revenue Matrix'
        },
        kpi: {
            budgetActive: 'Active Budget',
            justified: 'Justified',
            billed: 'Billed',
            wip: 'WIP (Pending)',
            tcv: 'Total Contract Value',
            backlog: 'Global Backlog',
            revenueYear: 'Annual Revenue',
            activeProjects: 'In active projects',
            productionDone: 'Production done',
            risk: 'Risk of non-payment',
            advances: 'Down payments',
            totalContracted: 'Total Contracted Portfolio',
            toExecute: 'Pending execution',
            recognized: 'Recognized this year'
        },
        billingTrendSubtitle: 'Monthly billing last 6 months',
        efficiencySubtitle: 'Justification progress vs Total Budget',
        executed: 'Executed',
        clientConcentrationSubtitle: 'Portfolio Value (TCV) by Client',
        strategicRadarSubtitle: 'Average score by criteria',
        averageScore: 'Average Score',
        table: {
            contractProject: 'Contract / Project',
            total: 'Total'
        }
    },
    projects: {
        title: 'Projects',
        newProject: 'New Project',
        tabs: {
            strategic: 'Strategic Portfolio',
            execution: 'Execution Control',
            operational: 'Operational Mgmt'
        },
        card: {
            client: 'Client',
            budget: 'Budget',
            revenue: 'Revenue',
            billed: 'Billed',
            wip: 'WIP',
            deferred: 'Deferred'
        },
        portfolioMatrix: {
            title: 'Portfolio Prioritization Matrix',
            description: 'Visualization of Value (Y Axis) vs. Effort/Cost (X Axis). Bubble size represents project volume (Revenue).',
            xAxis: 'Cost / Effort (Budget)',
            yAxis: 'Strategic Value (0-100)',
            bubble: 'Volume (Revenue)',
            highStrategy: 'High Strategy'
        },
        form: {
            tabs: {
                operational: 'Operational Mgmt',
                strategic: 'Strategic Mgmt'
            },
            generalInfo: 'General Information',
            financialInfo: 'Financial Information',
            strategicInfo: 'Strategic Valuation',
            budget: 'Budget',
            strategicScore: 'Strategic Score',
            roi: 'Expected ROI',
            type: 'Project Type',
            revenueMethod: 'Revenue Recognition Method',
            criteria: {
                alignment: 'Strategic Alignment (OKRs)',
                innovation: 'Innovation & Market',
                customerImpact: 'Customer Impact (Tier 1)',
                viability: 'Viability & Risk',
                tooltips: {
                    alignment: 'Degree of contribution to key objectives and alignment with long-term vision.',
                    innovation: 'Potential to generate new market opportunities, IP, or competitive advantages.',
                    customerImpact: 'Perceived customer value, business criticality, and loyalty potential (Tier 1).',
                    viability: 'Technical and operational feasibility. Evaluates complexity, resources, and risks.'
                }
            }
        },
        detail: {
            tabs: {
                activity: 'Activity & Progress',
                billing: 'Billing',
                eac: 'EAC Analysis',
                strategic: 'Strategic Vision',
                costs: 'Cost Breakdown',
                details: 'Project Details'
            },
            costs: {
                resource: 'Resource',
                role: 'Role',
                hours: 'Hours',
                avgRate: 'Avg Cost Rate',
                totalCost: 'Total Cost',
                percent: '% of Total',
                noData: 'No costs recorded',
                unknownResource: 'Unknown Resource'
            },
            activity: {
                register: 'Log Activity',
                milestones: 'Project Milestones',
                date: 'Date',
                concept: 'Concept',
                hours: 'Hours',
                costIncurred: 'Incurred Cost (€)',
                revenueAmount: 'Revenue Amount (€)',
                history: 'Activity History',
                noActivity: 'No activity registered',
                thisMonth: 'this month',
                totalMonth: 'Month Total',
                submit: 'Register'
            },
            cards: {
                tooltips: {
                    budget: 'Total approved budget (BAC). Includes contingency reserves if defined.',
                    revenue: 'Earned Revenue based on actual progress (Milestones, Cost, or Linear).',
                    margin: 'Real Gross Margin (Revenue - Direct Costs). Indicates current operational profitability.',
                    billed: 'Total amount billed to client to date (including advances).',
                    backlog: 'Revenue pending recognition (Budget - Revenue). Secured future work.'
                }
            }
        }
    },
    contracts: {
        title: 'Master Contracts',
        newContract: 'New Contract',
        form: {
            tabs: {
                general: 'General Data',
                strategic: 'Commercial Efficiency'
            },
            tcv: 'Total Value (TCV)',
            cac: 'Acquisition Cost (CAC)',
            ratio: 'Efficiency Ratio',
            client: 'Client',
            startDate: 'Start Date',
            endDate: 'End Date',
            status: 'Status'
        }
    },
    billing: {
        title: 'Billing',
        newInvoice: 'New Manual Invoice',
        tabs: {
            pending: 'Pending Billing',
            history: 'Invoice History',
            reconciliation: 'Reconciliation'
        },
        kpi: {
            invoicedYtd: 'Invoiced YTD',
            outstanding: 'Outstanding',
            overdue: 'Overdue',
            forecast: 'Forecast Due',
            wip: 'WIP (Unbilled Work)'
        },
        table: {
            number: 'Invoice #',
            date: 'Date',
            project: 'Project',
            concept: 'Concept',
            amount: 'Amount',
            status: 'Status',
            dueDate: 'Due Date',
            pdf: 'PDF'
        },
        status: {
            paid: 'Paid',
            sent: 'Sent',
            draft: 'Draft'
        },
        actions: {
            billWip: 'Bill WIP',
            downloadPdf: 'Download PDF'
        }
    },
    resources: {
        title: 'Resources & Rates',
        add: 'New Resource',
        importCsv: 'Import CSV',
        name: 'Name',
        role: 'Role',
        costRate: 'Cost Rate (€)',
        billRate: 'Bill Rate (€)',
        margin: 'Margin',
        actions: 'Actions',
        successImport: 'Resources imported: ',
        errorImport: 'Error importing CSV. Format: name,role,costRate,billRate'
    },
    eac: {
        title: 'EAC Analysis',
        bac: 'BAC',
        simulation: 'Simulation',
        saveSimulation: 'Save Simulation',
        simulationSaved: 'Simulation saved successfully.',
        errorSaving: 'Error saving.',
        inputData: 'Input Data',
        adjustProgress: 'Adjust actual progress to recalculate.',
        totalBudget: 'Total Budget (BAC)',
        totalBudgetDesc: 'Budget at Completion. Total approved budget.',
        actualCost: 'Actual Cost (AC)',
        actualCostDesc: 'Actual Cost. Total cost incurred to date.',
        sumCosts: 'Sum of all recorded costs.',
        physicalProgress: 'Actual Physical Progress (%)',
        physicalProgressTooltip: 'Real percentage of scope completion, independent of cost.',
        physicalProgressDesc: 'Indicates the percentage of work actually completed, regardless of cost.',
        financialProjection: 'Financial Projection',
        ev: 'Earned Value (EV)',
        evTooltip: 'Budgeted value of work performed (BAC * % Progress)',
        eac: 'Estimate at Completion (EAC)',
        eacTooltip: 'Total estimated cost at completion (BAC / CPI).',
        variation: 'Variance at Completion (VAC)',
        variationTooltip: 'Expected budget deviation (BAC - EAC). Positive is good.',
        cpi: 'Cost Performance Index (CPI)',
        cpiTooltip: 'Cost efficiency (EV / AC). > 1.0 is efficient.',
        tcpi: 'To Complete Performance Index (TCPI)',
        tcpiTooltip: 'Efficiency required on maintaining work to meet budget.',
        performanceCurve: 'Performance Curve',
        planned: 'Planned (PV)',
        projection: 'Projection'
    }
};

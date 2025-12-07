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
        language: 'Language'
    },
    nav: {
        dashboard: 'Control Panel',
        projects: 'Projects',
        contracts: 'Contracts',
        billing: 'Billing',
        settings: 'Settings'
    },
    dashboard: {
        financialTab: 'Financial Overview',
        strategicTab: 'Strategic Overview',
        billingTrend: 'Billing Trend (6 months)',
        efficiency: 'Operational Efficiency (Justified vs Budget)',
        clientConcentration: 'Client Concentration (TCV)',
        strategicRadar: 'Strategic Score Radar',
        kpi: {
            budgetActive: 'Active Budget',
            justified: 'Justified',
            billed: 'Billed',
            wip: 'WIP (Risk)',
            tcv: 'Total Contract Value',
            backlog: 'Global Backlog',
            revenueYear: 'Annual Revenue'
        }
    },
    projects: {
        title: 'Projects',
        newProject: 'New Project',
        tabs: {
            strategic: 'Strategic Portfolio',
            execution: 'Execution Control'
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
                viability: 'Viability & Risk'
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
            ratio: 'Efficiency Ratio'
        }
    }
};

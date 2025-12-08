import { Project, WorkLog } from '@/types';
import { calculateProjectRevenue } from './calculations';

/**
 * Earned Value Management (EVM) Utilities
 * Professional standard calculations for PV, EV, AC, SPI, CPI, EAC.
 */

/**
 * Calculates Planned Value (PV) at a specific date.
 * Represents the authorized budget assigned to scheduled work.
 */
export const calculatePV = (project: Project, date: Date = new Date()): number => {
    if (!project.monthlyBudget || project.monthlyBudget.length === 0) {
        // Fallback: Linear distribution if no monthly budget
        if (!project.startDate || !project.endDate) return 0;
        const start = new Date(project.startDate).getTime();
        const end = new Date(project.endDate).getTime();
        const now = date.getTime();

        if (now < start) return 0;
        if (now > end) return project.budget;

        const progress = (now - start) / (end - start);
        return project.budget * progress;
    }

    // Sum monthly budgets up to the target date
    // We assume monthlyBudget items have 'month' in 'YYYY-MM' format
    const targetMonthStr = date.toISOString().slice(0, 7);
    let cumulativePV = 0;

    // Sort to be safe, though usually sorted
    const sortedBudgets = [...project.monthlyBudget].sort((a, b) => a.month.localeCompare(b.month));

    for (const mb of sortedBudgets) {
        if (mb.month < targetMonthStr) {
            cumulativePV += mb.amount;
        } else if (mb.month === targetMonthStr) {
            // Pro-rate the current month
            // Simple approach: Assume linear spend within the month
            const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
            const dayOfMonth = date.getDate();
            const monthProgress = Math.min(dayOfMonth / daysInMonth, 1);
            cumulativePV += mb.amount * monthProgress;
            break;
        }
    }

    return Math.min(cumulativePV, project.budget);
};

/**
 * Calculates Schedule Performance Index (SPI).
 * SPI = EV / PV.
 * < 1.0: Behind Schedule
 * > 1.0: Ahead of Schedule
 */
export const calculateSPI = (EV: number, PV: number): number => {
    if (PV === 0) return 1; // Start of project, neutral
    return EV / PV;
};

/**
 * Calculates Cost Performance Index (CPI).
 * CPI = EV / AC.
 * < 1.0: Over Budget
 * > 1.0: Under Budget
 */
export const calculateCPI = (EV: number, AC: number): number => {
    if (AC === 0) return 1; // No cost yet, neutral
    return EV / AC;
};

/**
 * Calculates To-Complete Performance Index (TCPI).
 * Efficiency needed to finish on Budget (BAC).
 * (BAC - EV) / (BAC - AC)
 */
export const calculateTCPI = (BAC: number, EV: number, AC: number): number => {
    const workRemaining = Math.max(0, BAC - EV);
    const fundsRemaining = BAC - AC;

    if (fundsRemaining <= 0) {
        return workRemaining > 0 ? 999 : 0; // Infinite/Impossible if funds exhausted but work remains
    }
    return workRemaining / fundsRemaining;
};

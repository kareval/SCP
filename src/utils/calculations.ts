import { Project, WorkLog } from '@/types';

/**
 * Calculates the revenue (Earned Value) for a project based on its revenue recognition method.
 *
 * Strategies:
 * - Linear: Based on elapsed months vs. linearMonthlyAmount, capped at budget.
 * - Input (Cost-based): (Incurred Costs / Total Estimated Costs) * Budget.
 * - Output (Milestone-based): Sum of completed milestone percentages * Budget.
 * - TM (Time & Materials): Revenue = Incurred Costs.
 * 
 * @param project The project object.
 * @param incurredCosts Total actual costs incurred (optional, required for Input/TM).
 * @returns The calculated revenue amount.
 */
export function calculateProjectRevenue(project: Project, incurredCosts: number = 0): number {
    // 1. Linear Method
    if (project.revenueMethod === 'Linear' && project.startDate && project.linearMonthlyAmount) {
        const start = new Date(project.startDate);
        const now = new Date();
        const end = project.endDate ? new Date(project.endDate) : now;

        // Strict linear: use current date, capped at project end date.
        const targetDate = now > end ? end : now;

        if (targetDate >= start) {
            const timeDiff = Math.max(0, targetDate.getTime() - start.getTime());
            const daysDiff = timeDiff / (1000 * 3600 * 24);
            const approximateMonths = daysDiff / 30.44;

            let revenue = approximateMonths * project.linearMonthlyAmount;
            return Math.min(revenue, project.budget);
        }
        return 0;
    }

    // 2. Input Method (Cost-based % of completion)
    if (project.revenueMethod === 'Input' && project.totalEstimatedCosts && project.totalEstimatedCosts > 0) {
        const progress = Math.min(incurredCosts / project.totalEstimatedCosts, 1);
        return progress * project.budget;
    }

    // 3. Output Method (Milestone-based)
    if (project.revenueMethod === 'Output' && project.milestones) {
        const progress = project.milestones
            .filter(m => m.completed)
            .reduce((acc, m) => acc + m.percentage, 0);
        return (progress / 100) * project.budget;
    }

    // 4. Time & Materials and Internal (Revenue = Costs)
    if (project.type === 'TM' || project.type === 'Internal') {
        return incurredCosts;
    }


    // Fallback (e.g., manual updates if justifiedAmount is used directly)
    return project.justifiedAmount || 0;
}

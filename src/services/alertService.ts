import { Project, WorkLog } from '@/types';
import { calculateProjectRevenue } from '@/utils/calculations';
import { calculatePV, calculateSPI, calculateCPI } from '@/utils/evm';

export interface ProjectAlert {
    id: string;
    type: 'critical' | 'warning' | 'info';
    category: 'financial' | 'schedule' | 'budget' | 'operational';
    title: string;
    description: string;
    projectId: string;
    projectTitle: string;
}

export const analyzeProjectRisks = (project: Project, logs: WorkLog[] = []): ProjectAlert[] => {
    const alerts: ProjectAlert[] = [];
    const projectLogs = logs.filter(l => l.projectId === project.id);

    // 1. Calculate Metrics
    const AC = projectLogs.reduce((acc, log) => acc + log.amount, 0);
    const revenue = calculateProjectRevenue(project, AC); // Matches EV for most types
    const EV = revenue;
    const BAC = project.budget;
    const PV = calculatePV(project);

    // Calculate Indices using centralized logic
    const CPI = calculateCPI(EV, AC);
    const SPI = calculateSPI(EV, PV);

    // 2. Financial Alerts (CPI)
    if (project.type === 'Fixed' || project.type === 'TM' || project.revenueMethod === 'Input') { // Broaden scope slightly if appropriate
        // Low CPI
        if (CPI < 0.85) {
            alerts.push({
                id: `cpi-${project.id}`,
                type: 'critical',
                category: 'financial',
                title: 'Baja Eficiencia de Costes (CPI < 0.85)',
                description: `El índice de rendimiento de costes es ${CPI.toFixed(2)}. El proyecto cuesta más de lo que produce.`,
                projectId: project.id,
                projectTitle: project.title
            });
        } else if (CPI < 0.95) {
            alerts.push({
                id: `cpi-${project.id}`,
                type: 'warning',
                category: 'financial',
                title: 'Eficiencia de Costes Degradada',
                description: `El CPI es ${CPI.toFixed(2)}. Vigilar margen.`,
                projectId: project.id,
                projectTitle: project.title
            });
        }

        // Over Budget Forecast (EAC)
        const EAC = CPI > 0 ? BAC / CPI : BAC;
        if (EAC > BAC) {
            alerts.push({
                id: `overbudget-${project.id}`,
                type: 'critical',
                category: 'budget',
                title: 'Proyección de Sobrecoste',
                description: `Estimación fin proyecto: ${EAC.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} (Presupuesto: ${BAC.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}).`,
                projectId: project.id,
                projectTitle: project.title
            });
        } else if (project.contingencyReserve && EAC > (BAC * (1 - project.contingencyReserve / 100))) {
            alerts.push({
                id: `reserve-${project.id}`,
                type: 'warning',
                category: 'budget',
                title: 'Consumiendo Reserva',
                description: `La proyección (${EAC.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}) consume la reserva.`,
                projectId: project.id,
                projectTitle: project.title
            });
        }
    }

    // 3. Schedule Alerts (SPI) - NEW
    if (SPI < 0.90 && project.status === 'In Progress') {
        alerts.push({
            id: `spi-${project.id}`,
            type: 'warning',
            category: 'schedule',
            title: 'Retraso en Cronograma (SPI < 0.9)',
            description: `El proyecto avanza más lento de lo planeado (SPI: ${SPI.toFixed(2)}).`,
            projectId: project.id,
            projectTitle: project.title
        });
    }

    // 4. Time Expiry / Burn Rate (Legacy checks kept for robustness)
    if (project.endDate && project.startDate) {
        const end = new Date(project.endDate).getTime();
        const now = new Date().getTime();
        const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0 && project.status === 'In Progress') {
            alerts.push({
                id: `overdue-${project.id}`,
                type: 'critical',
                category: 'schedule',
                title: 'Proyecto Vencido',
                description: `Fecha fin superada hace ${Math.abs(daysRemaining)} días.`,
                projectId: project.id,
                projectTitle: project.title
            });
        }
    }

    // 5. Billing Alerts (WIP High)
    const WIP = Math.max(0, EV - (project.billedAmount || 0));
    if (WIP > 15000) {
        alerts.push({
            id: `wip-${project.id}`,
            type: 'warning',
            category: 'financial',
            title: 'Alto WIP Acumulado',
            description: `Tienes ${WIP.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} pendientes de facturar.`,
            projectId: project.id,
            projectTitle: project.title
        });
    }

    return alerts;
};

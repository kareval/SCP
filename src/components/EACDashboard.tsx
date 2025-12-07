'use client';

import { useEffect, useState } from 'react';
import { Project, WorkLog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Info, TrendingUp, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import Link from 'next/link';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button"; // Assuming Button component exists OR use standard button
import { projectService } from '@/services/projectService';
import { calculateProjectRevenue } from '@/utils/calculations';
import { Save } from "lucide-react";

interface EACDashboardProps {
    initialProject: Project;
    initialLogs: WorkLog[];
    isEmbedded?: boolean;
}

export default function EACDashboard({ initialProject, initialLogs, isEmbedded = false }: EACDashboardProps) {
    const [project, setProject] = useState<Project>(initialProject);
    const [workLogs, setWorkLogs] = useState<WorkLog[]>(initialLogs);
    const [manualProgress, setManualProgress] = useState<number>(initialProject.lastEACSimulation?.progress || 0);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Only set default progress if NO persisted simulation exists
        if (project.lastEACSimulation) {
            setManualProgress(project.lastEACSimulation.progress);
            return;
        }

        // Initial Guess for Progress if no simulation
        if (project.revenueMethod === 'Output' && project.milestones) {
            const progress = project.milestones
                .filter(m => m.completed)
                .reduce((acc, m) => acc + m.percentage, 0);
            setManualProgress(progress);
        } else if (project.revenueMethod === 'Input' && project.totalEstimatedCosts) {
            const totalCost = workLogs.reduce((acc, log) => acc + log.amount, 0);
            const progress = Math.min((totalCost / project.totalEstimatedCosts) * 100, 100);
            setManualProgress(Number(progress.toFixed(2)));
        } else if (project.revenueMethod === 'Linear') {
            // New consolidated linear logic
            const revenue = calculateProjectRevenue(project);
            const progress = project.budget > 0 ? Math.min((revenue / project.budget) * 100, 100) : 0;
            setManualProgress(Number(progress.toFixed(2)));
        }
    }, [project, workLogs]);

    // 1. Calculate AC (Actual Cost)
    const AC = workLogs.reduce((acc, log) => acc + log.amount, 0);

    // 2. Calculate EV (Earned Value)
    const BAC = project.budget;
    // For Linear, EV is simply the Unified Revenue. For Input/Output, ManualProgress is derived from unified logic anyway.
    // However, ManualProgress is a UI slider/state. To match unified logic 100%, we should assume:
    // If user hasn't touched the slider (we set it in useEffect), then it matches.
    // But `calculateProjectRevenue` is the source of truth for "Revenue".
    // "Revenue" IS "Earned Value" in strict terms for Fixed Price.
    const revenue = calculateProjectRevenue(project, AC);

    // If we want EV to react to manual slider changes for "What-If" analysis?
    // Then we keep EV = BAC * (manualProgress / 100).
    // The useEffect syncs manualProgress to calculated state on load.
    // So this is correct for "What-If" but also matches actual if untouched.
    const EV = BAC * (manualProgress / 100);

    // 3. Calculate CPI (Cost Performance Index)
    const CPI = AC > 0 ? EV / AC : 1;

    // 4. Calculate EAC (Estimate at Completion)
    const EAC = CPI > 0 ? BAC / CPI : BAC;

    // Variation
    // Variation
    const variation = BAC - EAC;

    // 5. Calculate TCPI (To Complete Performance Index)
    // Work Remaining (BAC - EV) / Funds Remaining (BAC - AC)
    // How efficient we need to be to finish on budget.
    const workRemaining = Math.max(0, BAC - EV);
    const fundsRemaining = BAC - AC;
    const TCPI = fundsRemaining > 0 ? workRemaining / fundsRemaining : (workRemaining > 0 ? 999 : 0); // 999 indicates impossible/infinite

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    {!isEmbedded && (
                        <>
                            <Link href="/projects" className="text-primary-dark/60 hover:text-primary-dark">
                                <ArrowLeft className="h-6 w-6" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-primary-dark">Análisis EAC: {project.title}</h1>
                                <div className="flex items-center space-x-2 text-sm text-primary-dark/60">
                                    <span>{project.clientId}</span>
                                    <span>•</span>
                                    <Badge variant="outline">BAC: {BAC.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</Badge>
                                    {project.lastEACSimulation && (
                                        <>
                                            <span>•</span>
                                            <span className="text-xs text-primary/80">
                                                Simulación: {new Date(project.lastEACSimulation.lastUpdated).toLocaleDateString()}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                    {/* If embedded, we might want just the simulation info or nothing? 
                        If we hide the whole left part, we lose the "Simulation Date" info.
                        Let's show the Simulation Date info near the button or somewhere else if embedded?
                        For now, per "remove header", I'll hide the whole left block. 
                     */}
                </div>
                <Button
                    onClick={async () => {
                        setIsSaving(true);
                        try {
                            const updated = {
                                ...project,
                                lastEACSimulation: {
                                    progress: manualProgress,
                                    lastUpdated: new Date().toISOString()
                                }
                            };
                            await projectService.updateProject(updated);
                            setProject(updated);
                            alert("Simulación guardada correctamente.");
                        } catch (e) {
                            console.error(e);
                            alert("Error al guardar.");
                        } finally {
                            setIsSaving(false);
                        }
                    }}
                    disabled={isSaving}
                    variant="outline"
                    className="flex items-center gap-2"
                >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Guardando...' : 'Guardar Simulación'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Control Panel */}
                <Card className="lg:col-span-1 border-l-4 border-l-primary">
                    <CardHeader>
                        <CardTitle className="text-primary-dark">Datos de Entrada</CardTitle>
                        <CardDescription>Ajusta el avance real para recalcular.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>

                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm font-medium text-primary-dark">Presupuesto Total (BAC)</label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger><Info className="h-4 w-4 text-primary-dark/40" /></TooltipTrigger>
                                        <TooltipContent><p>Budget at Completion. Presupuesto total aprobado para el proyecto.</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <div className="text-2xl font-bold text-primary-dark">{BAC.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                        </div>

                        <div>

                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm font-medium text-primary-dark">Coste Real Actual (AC)</label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger><Info className="h-4 w-4 text-primary-dark/40" /></TooltipTrigger>
                                        <TooltipContent><p>Actual Cost. Coste real incurrido hasta la fecha.</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <div className="text-2xl font-bold text-primary-dark">{AC.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                            <p className="text-xs text-primary-dark/60 mt-1">Suma de todos los costes registrados.</p>
                        </div>

                        <div>

                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-primary-dark">Avance Físico Real (%)</label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger><Info className="h-4 w-4 text-primary-dark/40" /></TooltipTrigger>
                                        <TooltipContent><p>Porcentaje de completitud real del alcance, independiente del coste.</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={manualProgress}
                                    onChange={(e) => setManualProgress(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <span className="text-xl font-bold text-primary w-16 text-right">{manualProgress}%</span>
                            </div>
                            <p className="text-xs text-primary-dark/60 mt-2">
                                Indica el porcentaje de trabajo <strong>realmente completado</strong>, independientemente del coste.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Results Panel */}
                <Card className="lg:col-span-2 bg-slate-50">
                    <CardHeader>
                        <CardTitle className="text-primary-dark flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Proyección Financiera
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* EV Card */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 h-full flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium text-primary-dark">Valor Ganado (EV)</h3>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><Info className="h-4 w-4 text-primary-dark/40" /></TooltipTrigger>
                                            <TooltipContent><p>Valor presupuestado del trabajo realizado (BAC * % Avance)</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className="text-2xl font-bold text-primary">{EV.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                            </div>
                        </div>

                        {/* EAC Card */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 h-full flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium text-primary-dark">Estimación al Cierre (EAC)</h3>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><Info className="h-4 w-4 text-primary-dark/40" /></TooltipTrigger>
                                            <TooltipContent><p>Proyección de coste final basada en el rendimiento actual (BAC / CPI)</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className="text-3xl font-bold text-primary-dark">{EAC.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                                <div className="mt-2 text-xs text-primary-dark/60">
                                    vs Presupuesto: {BAC.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                </div>
                            </div>
                        </div>

                        {/* CPI Card */}
                        <div className={`p-4 rounded-lg shadow-sm border ${CPI >= 1 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} h-full flex flex-col justify-between`}>
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className={`font-medium ${CPI >= 1 ? 'text-green-800' : 'text-red-800'}`}>Eficiencia (CPI)</h3>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><Info className={`h-4 w-4 ${CPI >= 1 ? 'text-green-800/40' : 'text-red-800/40'}`} /></TooltipTrigger>
                                            <TooltipContent><p>EV / AC. Mayor a 1 es eficiente.</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className="flex items-end gap-2">
                                    <div className={`text-3xl font-bold ${CPI >= 1 ? 'text-green-700' : 'text-red-700'}`}>{CPI.toFixed(2)}</div>
                                    <div className="text-sm mb-1 font-medium">
                                        {CPI >= 1 ? (
                                            <span className="text-green-700 flex items-center"><CheckCircle className="h-3 w-3 mr-1" /> Eficiente</span>
                                        ) : (
                                            <span className="text-red-700 flex items-center"><AlertTriangle className="h-3 w-3 mr-1" /> Ineficiente</span>
                                        )}
                                    </div>
                                </div>
                                <p className={`text-xs mt-2 ${CPI >= 1 ? 'text-green-800/70' : 'text-red-800/70'}`}>
                                    Por cada euro gastado, generas <strong>{CPI.toFixed(2)}€</strong> de valor.
                                </p>
                            </div>
                        </div>

                        {/* Variation Card */}
                        <div className={`p-4 rounded-lg shadow-sm border ${variation >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} h-full flex flex-col justify-between`}>
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className={`font-medium ${variation >= 0 ? 'text-green-800' : 'text-red-800'}`}>Desviación Proyectada</h3>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><Info className={`h-4 w-4 ${variation >= 0 ? 'text-green-800/40' : 'text-red-800/40'}`} /></TooltipTrigger>
                                            <TooltipContent><p>Diferencia entre Presupuesto y Estimación Final (BAC - EAC). Positivo es ahorro.</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className={`text-2xl font-bold ${variation >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                    {variation >= 0 ? '+' : ''}{variation.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                </div>
                                <p className={`text-xs mt-2 ${variation >= 0 ? 'text-green-800/70' : 'text-red-800/70'}`}>
                                    {variation >= 0
                                        ? 'El proyecto terminará por debajo del presupuesto.'
                                        : 'Se prevé un sobrecoste al finalizar el proyecto.'}
                                </p>
                            </div>
                        </div>

                        {/* TCPI Card */}
                        <div className={`p-4 rounded-lg shadow-sm border ${TCPI <= 1 ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'} h-full flex flex-col justify-between`}>
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className={`font-medium ${TCPI <= 1 ? 'text-green-800' : 'text-orange-800'}`}>Rendimiento Requerido (TCPI)</h3>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><Info className={`h-4 w-4 ${TCPI <= 1 ? 'text-green-800/40' : 'text-orange-800/40'}`} /></TooltipTrigger>
                                            <TooltipContent><p>(BAC - EV) / (BAC - AC). Eficiencia necesaria en el trabajo restante para cumplir el presupuesto.</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className="text-3xl font-bold text-primary-dark">{TCPI > 100 ? '>100' : TCPI.toFixed(2)}</div>
                                <p className={`text-xs mt-2 ${TCPI <= 1 ? 'text-green-800/70' : 'text-orange-800/70'}`}>
                                    {TCPI <= 1
                                        ? 'Es factible terminar en presupuesto.'
                                        : 'Se requiere una eficiencia mucho mayor para recuperar el presupuesto.'}
                                </p>
                            </div>
                        </div>

                        {/* Margin Projected Card */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 h-full flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium text-primary-dark">Margen Proyectado</h3>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><Info className="h-4 w-4 text-primary-dark/40" /></TooltipTrigger>
                                            <TooltipContent><p>(BAC - EAC) / BAC</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className={`text-2xl font-bold ${(BAC - EAC) / BAC >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                    {(((BAC - EAC) / BAC) * 100).toFixed(1)}%
                                </div>
                                <p className="text-xs text-primary-dark/60 mt-1">
                                    Rentabilidad estimada al cierre.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Accounting Position Panel (CFO Feature) */}
                <Card className="lg:col-span-3 bg-slate-50 border-t-4 border-t-purple-600">
                    <CardHeader>
                        <CardTitle className="text-primary-dark flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-purple-600" />
                            Posición Contable
                        </CardTitle>
                        <CardDescription>Análisis de devengo vs facturación (WIP vs Deferred).</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Billed Amount */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-medium text-primary-dark">Total Facturado</h3>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger><Info className="h-4 w-4 text-primary-dark/40" /></TooltipTrigger>
                                        <TooltipContent><p>Monto total acumulado de las facturas emitidas al cliente.</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <div className="text-2xl font-bold text-primary-dark">
                                {(project.billedAmount || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                            </div>
                            <p className="text-xs text-primary-dark/60 mt-1">Facturas emitidas hasta la fecha.</p>
                        </div>

                        {/* WIP (Asset) */}
                        <div className={`p-4 rounded-lg shadow-sm border ${Math.max(0, EV - (project.billedAmount || 0)) > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 opacity-50'}`}>
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-medium text-green-800">WIP (Activo / A Facturar)</h3>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger><Info className="h-4 w-4 text-green-800/40" /></TooltipTrigger>
                                        <TooltipContent><p>Trabajo realizado (ingreso reconocido) pendiente de facturar.</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <div className="text-2xl font-bold text-green-700">
                                {Math.max(0, EV - (project.billedAmount || 0)).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                            </div>
                            <p className="text-xs text-green-800/70 mt-1">Trabajo realizado (EV) pendiente de facturar.</p>
                        </div>

                        {/* Deferred Revenue (Liability) */}
                        <div className={`p-4 rounded-lg shadow-sm border ${Math.max(0, (project.billedAmount || 0) - EV) > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200 opacity-50'}`}>
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-medium text-orange-800">Ingresos Diferidos (Pasivo)</h3>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger><Info className="h-4 w-4 text-orange-800/40" /></TooltipTrigger>
                                        <TooltipContent><p>Dinero facturado por adelantado que aún no se ha ganado con trabajo (Ingreso futuro).</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <div className="text-2xl font-bold text-orange-700">
                                {Math.max(0, (project.billedAmount || 0) - EV).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                            </div>
                            <p className="text-xs text-orange-800/70 mt-1">Facturado por adelantado (Deuda de servicio).</p>
                        </div>

                        {/* Billing Forecast Summary */}
                        {project.billingForecast && project.billingForecast.length > 0 && (
                            <div className="col-span-1 md:col-span-3 mt-4 pt-4 border-t border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-semibold text-primary-dark">Previsión de Flujo de Caja (Próximos 3 meses)</h4>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><Info className="h-4 w-4 text-primary-dark/40" /></TooltipTrigger>
                                            <TooltipContent><p>Estimación de facturación futura basada en hitos o calendario.</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {project.billingForecast
                                        .filter(item => new Date(item.date) >= new Date())
                                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                        .slice(0, 3)
                                        .map(item => (
                                            <div key={item.id} className="bg-white p-3 rounded border border-gray-200 flex justify-between items-center">
                                                <div>
                                                    <div className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</div>
                                                    <div className="text-sm font-medium">{item.notes || 'Facturación prevista'}</div>
                                                </div>
                                                <div className="font-bold text-primary">
                                                    {item.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Chart Placeholder (Visual Representation) */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-primary-dark">Curva de Rendimiento</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative h-64 w-full bg-white border-l border-b border-gray-300 p-4">
                        {/* This is a simple CSS visualization of the 3 lines */}
                        <div className="absolute left-0 bottom-0 w-full h-full pointer-events-none">
                            <svg className="w-full h-full overflow-visible">
                                {/* Planned Value (PV) Curve - Blue Line */}
                                {project.monthlyBudget && project.monthlyBudget.length > 0 && project.startDate && project.endDate && (() => {
                                    // Generate all months between start and end date
                                    const start = new Date(project.startDate);
                                    const end = new Date(project.endDate);
                                    const allMonths: string[] = [];
                                    let current = new Date(start);
                                    // Ensure we include the end month
                                    const endMonthStr = end.toISOString().slice(0, 7);

                                    while (current <= end || current.toISOString().slice(0, 7) === endMonthStr) {
                                        const mStr = current.toISOString().slice(0, 7);
                                        if (!allMonths.includes(mStr)) {
                                            allMonths.push(mStr);
                                        }
                                        current.setMonth(current.getMonth() + 1);
                                        if (allMonths.length > 60) break;
                                    }

                                    if (allMonths.length === 0) return null;

                                    let cumulativePV = 0;
                                    const points = allMonths.map((month, index) => {
                                        const monthTotal = project.monthlyBudget!
                                            .filter(mb => mb.month === month)
                                            .reduce((acc, curr) => acc + curr.amount, 0);
                                        cumulativePV += monthTotal;

                                        const x = (index / (allMonths.length - 1)) * 100;
                                        const y = 100 - (Math.min(cumulativePV / (BAC * 1.5), 1) * 100);
                                        return `${x}%,${y}%`;
                                    });

                                    if (allMonths.length === 1) {
                                        const y = 100 - (Math.min(cumulativePV / (BAC * 1.5), 1) * 100);
                                        return (
                                            <line x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#3b82f6" strokeWidth="2" strokeDasharray="4" />
                                        );
                                    }

                                    return (
                                        <polyline
                                            points={points.join(' ')}
                                            fill="none"
                                            stroke="#3b82f6"
                                            strokeWidth="2"
                                            strokeDasharray="4"
                                        />
                                    );
                                })()}

                                {/* Baseline (Budget) - Dotted Gray Line (Reference) */}
                                <line x1="0" y1={`${100 - (Math.min(BAC / (BAC * 1.5), 1) * 100)}%`} x2="100%" y2={`${100 - (Math.min(BAC / (BAC * 1.5), 1) * 100)}%`} stroke="#9ca3af" strokeWidth="1" strokeDasharray="2" />
                                <text x="100%" y={`${100 - (Math.min(BAC / (BAC * 1.5), 1) * 100)}%`} dy="-5" dx="-20" fill="#9ca3af" fontSize="10">BAC</text>

                                {/* AC Line */}
                                <line x1="0" y1="100%" x2={`${manualProgress}%`} y2={`${100 - (Math.min(AC / (BAC * 1.5), 1) * 100)}%`} stroke="#ef4444" strokeWidth="2" />
                                <circle cx={`${manualProgress}%`} cy={`${100 - (Math.min(AC / (BAC * 1.5), 1) * 100)}%`} r="4" fill="#ef4444" />
                                <text x={`${manualProgress}%`} y={`${100 - (Math.min(AC / (BAC * 1.5), 1) * 100)}%`} dy="-10" dx="5" fill="#ef4444" fontSize="10">AC</text>

                                {/* EV Line - Solid Green Line */}
                                <line x1="0" y1="100%" x2={`${manualProgress}%`} y2={`${100 - (Math.min(EV / (BAC * 1.5), 1) * 100)}%`} stroke="#22c55e" strokeWidth="2" />
                                <circle cx={`${manualProgress}%`} cy={`${100 - (Math.min(EV / (BAC * 1.5), 1) * 100)}%`} r="4" fill="#22c55e" />
                                <text x={`${manualProgress}%`} y={`${100 - (Math.min(EV / (BAC * 1.5), 1) * 100)}%`} dy="15" dx="5" fill="#22c55e" fontSize="10">EV</text>

                                {/* Forecast Line - Dashed Red Line projecting to EAC */}
                                <line
                                    x1={`${manualProgress}%`}
                                    y1={`${100 - (Math.min(AC / (BAC * 1.5), 1) * 100)}%`}
                                    x2="100%"
                                    y2={`${100 - (Math.min(EAC / (BAC * 1.5), 1) * 100)}%`}
                                    stroke="#ef4444"
                                    strokeWidth="2"
                                    strokeDasharray="4"
                                />
                                <text x="100%" y={`${100 - (Math.min(EAC / (BAC * 1.5), 1) * 100)}%`} dy="-5" dx="-20" fill="#ef4444" fontSize="10" fontWeight="bold">EAC</text>
                            </svg>
                        </div>
                    </div>
                    <div className="flex justify-center gap-6 mt-4 text-xs">
                        <div className="flex items-center gap-1"><div className="w-3 h-1 bg-gray-400 border-t border-dashed"></div> Presupuesto (BAC)</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-1 border-t-2 border-dashed border-blue-500"></div> Planificado (PV)</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-1 bg-red-500"></div> Coste Real (AC)</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-1 bg-green-500"></div> Valor Ganado (EV)</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-1 border-t-2 border-dashed border-red-500"></div> Proyección</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

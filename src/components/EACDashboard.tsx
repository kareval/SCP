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
import { Button } from "@/components/ui/button";
import { projectService } from '@/services/projectService';
import { calculateProjectRevenue } from '@/utils/calculations';
import { Save } from "lucide-react";
import { useTranslation } from '@/context/LanguageContext';
import { calculatePV, calculateSPI, calculateCPI, calculateTCPI } from '@/utils/evm';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';


interface EACDashboardProps {
    initialProject: Project;
    initialLogs: WorkLog[];
    isEmbedded?: boolean;
}

export default function EACDashboard({ initialProject, initialLogs, isEmbedded = false }: EACDashboardProps) {
    const { t } = useTranslation();
    const [project, setProject] = useState<Project>(initialProject);
    const [workLogs, setWorkLogs] = useState<WorkLog[]>(initialLogs);
    const [manualProgress, setManualProgress] = useState<number>(initialProject.lastEACSimulation?.progress || 0);
    const [isSaving, setIsSaving] = useState(false);

    // Sync state with props
    useEffect(() => {
        setProject(initialProject);
        setWorkLogs(initialLogs);
    }, [initialProject, initialLogs]);

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
    // Note: calculateProjectRevenue currently calculates EV based on method.
    // However, manualProgress slider overrides this for What-If in this dashboard.
    // const revenue = calculateProjectRevenue(project, AC); 
    const EV = BAC * (manualProgress / 100);

    // 3. Calculate Performance Indices (CPI, SPI, TCPI)
    const PV = calculatePV(project);
    const SPI = calculateSPI(EV, PV);
    // CPI: Default to 1 if no AC to avoid infinity, but if EV > 0 and AC = 0, it's infinite efficiency. 
    // calculateCPI handles AC=0 by returning 1.
    const CPI = calculateCPI(EV, AC);
    const TCPI = calculateTCPI(BAC, EV, AC);

    // 4. Calculate EAC (Estimate at Completion) - Scenarios
    const reserveAmount = (BAC * (project.contingencyReserve || 0)) / 100;

    // Standard / Trend (Likely): Assumes current CPI continues
    const EAC = CPI > 0 ? BAC / CPI : BAC;

    // Optimistic: AC + (BAC - EV) - Reserve (Execution at budget rate, no risk usage)
    const EAC_Optimistic = AC + Math.max(0, (BAC - EV) - reserveAmount);

    // Variation
    const variation = BAC - EAC;

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
                                <h1 className="text-3xl font-bold text-primary-dark">{t('eac.title')}: {project.title}</h1>
                                <div className="flex items-center space-x-2 text-sm text-primary-dark/60">
                                    <span>{project.clientId}</span>
                                    <span>•</span>
                                    <Badge variant="outline">{t('eac.bac')}: {BAC.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</Badge>
                                    {project.lastEACSimulation && (
                                        <>
                                            <span>•</span>
                                            <span className="text-xs text-primary/80">
                                                {t('eac.simulation')}: {new Date(project.lastEACSimulation.lastUpdated).toLocaleDateString()}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
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
                            alert(t('eac.simulationSaved'));
                        } catch (e) {
                            console.error(e);
                            alert(t('eac.errorSaving'));
                        } finally {
                            setIsSaving(false);
                        }
                    }}
                    disabled={isSaving}
                    variant="outline"
                    className="flex items-center gap-2"
                >
                    <Save className="h-4 w-4" />
                    {isSaving ? t('common.saving') : t('eac.saveSimulation')}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Control Panel */}
                <Card className="lg:col-span-1 border-l-4 border-l-primary">
                    <CardHeader>
                        <CardTitle className="text-primary-dark">{t('eac.inputData')}</CardTitle>
                        <CardDescription>{t('eac.adjustProgress')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm font-medium text-primary-dark">{t('eac.totalBudget')}</label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger><Info className="h-4 w-4 text-primary-dark/40" /></TooltipTrigger>
                                        <TooltipContent><p>{t('eac.totalBudgetDesc')}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <div className="text-2xl font-bold text-primary-dark">{BAC.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm font-medium text-primary-dark">{t('eac.actualCost')}</label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger><Info className="h-4 w-4 text-primary-dark/40" /></TooltipTrigger>
                                        <TooltipContent><p>{t('eac.actualCostDesc')}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <div className="text-2xl font-bold text-primary-dark">{AC.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                            <p className="text-xs text-primary-dark/60 mt-1">{t('eac.sumCosts')}</p>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-primary-dark">{t('eac.physicalProgress')}</label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger><Info className="h-4 w-4 text-primary-dark/40" /></TooltipTrigger>
                                        <TooltipContent><p>{t('eac.physicalProgressTooltip')}</p></TooltipContent>
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
                                {t('eac.physicalProgressDesc')}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Results Panel */}
                <Card className="lg:col-span-2 bg-slate-50">
                    <CardHeader>
                        <CardTitle className="text-primary-dark flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            {t('eac.financialProjection')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* EV Card */}
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 h-full flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-medium text-primary-dark">{t('eac.ev')}</h3>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger><Info className="h-4 w-4 text-primary-dark/40" /></TooltipTrigger>
                                                <TooltipContent><p>{t('eac.evTooltip')}</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <div className="text-2xl font-bold text-primary">{EV.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                                </div>
                            </div>

                            {/* EAC Summary Card */}
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 h-full flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-medium text-primary-dark">{t('eac.eac')} (Probable)</h3>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger><Info className="h-4 w-4 text-primary-dark/40" /></TooltipTrigger>
                                                <TooltipContent><p>{t('eac.eacTooltip')}</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <div className="text-3xl font-bold text-primary-dark">{EAC.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                                    <div className="mt-2 space-y-1 bg-slate-50 p-2 rounded border border-slate-100">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-primary-dark/60" title="EAC si el resto va según presupuesto">Optimista:</span>
                                            <span className="font-medium text-green-700">{EAC_Optimistic.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                                        </div>
                                        {reserveAmount > 0 && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-primary-dark/60">Reserva ({project.contingencyReserve}%):</span>
                                                <span className="font-medium text-yellow-700">{reserveAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                                            </div>
                                        )}
                                        <div className="text-[10px] text-right text-slate-400 mt-1 pt-1 border-t border-slate-200">
                                            CPI: {CPI.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Scenario Comparison Chart */}
                        <div className="h-64 w-full bg-white p-4 rounded border border-gray-200">
                            <h4 className="text-sm font-semibold text-primary-dark mb-4 text-center">Escenarios de Cierre (Cono de Incertidumbre)</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={[
                                        {
                                            name: 'Escenarios',
                                            Optimista: Math.round(EAC_Optimistic),
                                            Probable: Math.round(EAC),
                                            Pesimista: Math.round(EAC + reserveAmount), // Pessimistic logic
                                            Presupuesto: Math.round(BAC)
                                        }
                                    ]}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" hide />
                                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`} />
                                    <RechartsTooltip
                                        formatter={(value: number) => value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="Optimista" fill="#22c55e" name="Optimista" barSize={40} />
                                    <Bar dataKey="Probable" fill="#3b82f6" name="Probable" barSize={40} />
                                    <Bar dataKey="Pesimista" fill="#ef4444" name="Pesimista" barSize={40} />
                                    <Bar dataKey="Presupuesto" fill="#9ca3af" name="BAC (Límite)" barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                            {/* CPI & SPI Mini Cards */}
                            <div className={`p-4 rounded-lg shadow-sm border ${CPI >= 1 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <h3 className="text-xs font-semibold uppercase text-slate-500 mb-1">{t('eac.cpi')}</h3>
                                <div className={`text-xl font-bold ${CPI >= 1 ? 'text-green-700' : 'text-red-700'}`}>{CPI.toFixed(2)}</div>
                            </div>
                            <div className={`p-4 rounded-lg shadow-sm border ${SPI >= 0.95 ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                                <h3 className="text-xs font-semibold uppercase text-slate-500 mb-1">SPI</h3>
                                <div className={`text-xl font-bold ${SPI >= 0.95 ? 'text-green-700' : 'text-orange-700'}`}>{SPI.toFixed(2)}</div>
                            </div>
                            <div className={`p-4 rounded-lg shadow-sm border ${variation >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <h3 className="text-xs font-semibold uppercase text-slate-500 mb-1">{t('eac.variation')}</h3>
                                <div className={`text-xl font-bold ${variation >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                    {variation >= 0 ? '+' : ''}{variation.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                                </div>
                            </div>
                            <div className={`p-4 rounded-lg shadow-sm border ${TCPI <= 1 ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                                <h3 className="text-xs font-semibold uppercase text-slate-500 mb-1">{t('eac.tcpi')}</h3>
                                <div className="text-xl font-bold text-slate-700">{TCPI > 100 ? '>100' : TCPI.toFixed(2)}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Accounting Position Panel */}
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


        </div>
    );
}

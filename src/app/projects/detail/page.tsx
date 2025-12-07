'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { projectService } from '@/services/projectService';
import { Project, Invoice, WorkLog, Milestone } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Info, Plus, Calendar, CheckSquare, Square, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRole } from '@/context/RoleContext';
import { calculateProjectRevenue } from '@/utils/calculations';
import EACDashboard from '@/components/EACDashboard';

// Simple Gauge Component for Margin
const MarginGauge = ({ value }: { value: number }) => {
    // Value should be 0-100
    const clampedValue = Math.min(Math.max(value, 0), 100);
    const radius = 40;
    const stroke = 10;
    const normalizedRadius = radius - stroke / 2;
    const circumference = normalizedRadius * Math.PI;
    const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

    // Color logic
    const getColor = (v: number) => {
        if (v < 20) return "text-red-500";
        if (v < 40) return "text-orange-500";
        return "text-green-500";
    };

    const colorClass = getColor(clampedValue);

    return (
        <div className="relative flex items-center justify-center p-4">
            {/* Semi-circle Gauge */}
            <svg
                height={radius * 2}
                width={radius * 2}
                viewBox={`0 0 ${radius * 2} ${radius}`}
                className="overflow-visible"
            >
                {/* Background Arc */}
                <path
                    d={`M ${stroke} ${radius} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 - stroke} ${radius}`}
                    fill="none"
                    stroke="#e5e7eb" // gray-200
                    strokeWidth={stroke}
                    strokeLinecap="round"
                />
                {/* Foreground Arc */}
                <path
                    d={`M ${stroke} ${radius} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 - stroke} ${radius}`}
                    fill="none"
                    className={colorClass}
                    stroke="currentColor"
                    strokeWidth={stroke}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                />
            </svg>
            <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <span className={`text-2xl font-bold ${colorClass}`}>
                    {clampedValue.toFixed(0)}%
                </span>
            </div>
        </div>
    );
};

function ProjectDetailsContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const { role } = useRole();
    const [project, setProject] = useState<Project | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'activity' | 'billing' | 'details' | 'eac'>('activity');

    // Form State for WorkLog
    const [logConcept, setLogConcept] = useState('');
    const [logAmount, setLogAmount] = useState('');
    const [logHours, setLogHours] = useState('');
    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);

    // Filter State
    const [filterType, setFilterType] = useState<'all' | 'month'>('month');
    const [currentDate, setCurrentDate] = useState(new Date());

    const filteredLogs = workLogs.filter(log => {
        if (filterType === 'all') return true;
        const logDateObj = new Date(log.date);
        return logDateObj.getMonth() === currentDate.getMonth() &&
            logDateObj.getFullYear() === currentDate.getFullYear();
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const [projectsData, invoicesData] = await Promise.all([
                    projectService.getProjects(),
                    projectService.getInvoices()
                ]);
                const foundProject = projectsData.find(p => p.id === id);
                if (foundProject) {
                    setProject(foundProject);
                    setInvoices(invoicesData.filter(i => i.projectId === id));
                    const logs = await projectService.getWorkLogs(id);
                    setWorkLogs(logs);
                }
            } catch (error) {
                console.error("Error fetching project details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const refreshProject = async () => {
        if (!id) return;
        const [projectsData] = await Promise.all([projectService.getProjects()]);
        const foundProject = projectsData.find(p => p.id === id);
        if (foundProject) {
            setProject(foundProject);
            const logs = await projectService.getWorkLogs(id);
            setWorkLogs(logs);
        }
    };

    const handleAddWorkLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!project) return;

        const amount = Number(logAmount);
        const hours = logHours ? Number(logHours) : undefined;

        const newLog: WorkLog = {
            id: crypto.randomUUID(),
            projectId: project.id,
            date: logDate,
            concept: logConcept,
            amount: amount,
            hours: hours
        };

        try {
            // Sanitize undefined values for Firestore
            const logToSave = JSON.parse(JSON.stringify(newLog));
            await projectService.addWorkLog(project.id, logToSave);

            // Calculate new Revenue
            let newRevenue = 0;

            // We need the updated list of logs including the new one to calculate correctly
            const updatedLogs = [...workLogs, newLog];
            const totalAmount = updatedLogs.reduce((acc, log) => acc + log.amount, 0);

            if (project.revenueMethod === 'Input' && project.totalEstimatedCosts) {
                // Input Method (Cost-to-Cost): Revenue = (Total Costs / Estimated Costs) * Budget
                const progress = Math.min(totalAmount / project.totalEstimatedCosts, 1); // Cap at 100%
                newRevenue = progress * project.budget;
            } else {
                // T&M / Fixed (Manual): Revenue = Sum of all logged amounts
                newRevenue = totalAmount;
            }

            const updatedProject = { ...project, justifiedAmount: newRevenue };
            await projectService.updateProject(updatedProject);

            await refreshProject();

            // Reset form
            setLogConcept('');
            setLogAmount('');
            setLogHours('');
        } catch (error) {
            console.error("Error adding work log:", error);
            alert("Error al registrar actividad");
        }
    };

    const handleDeleteWorkLog = async (logId: string, amount: number) => {
        if (!project || !confirm('¿Estás seguro de que quieres borrar esta actividad?')) return;

        try {
            await projectService.deleteWorkLog(project.id, logId);

            // Calculate new Revenue
            let newRevenue = 0;
            const updatedLogs = workLogs.filter(l => l.id !== logId);
            const totalAmount = updatedLogs.reduce((acc, log) => acc + log.amount, 0);

            if (project.revenueMethod === 'Input' && project.totalEstimatedCosts) {
                const progress = Math.min(totalAmount / project.totalEstimatedCosts, 1);
                newRevenue = progress * project.budget;
            } else {
                newRevenue = totalAmount;
            }

            const updatedProject = { ...project, justifiedAmount: newRevenue };
            await projectService.updateProject(updatedProject);

            await refreshProject();
        } catch (error) {
            console.error("Error deleting work log:", error);
            alert("Error al borrar actividad");
        }
    };

    const handleToggleMilestone = async (milestone: Milestone) => {
        if (!project || !project.milestones) return;

        const updatedMilestones = project.milestones.map(m =>
            m.id === milestone.id ? {
                ...m,
                completed: !m.completed,
                actualDate: !m.completed ? new Date().toISOString() : undefined // Set or clear actual date
            } : m
        );

        // Calculate new Revenue based on completed milestones
        const totalPercentageCompleted = updatedMilestones
            .filter(m => m.completed)
            .reduce((acc, m) => acc + m.percentage, 0);

        const newRevenue = (totalPercentageCompleted / 100) * project.budget;

        const updatedProject = {
            ...project,
            milestones: updatedMilestones,
            justifiedAmount: newRevenue
        };

        try {
            await projectService.updateProject(updatedProject);
            await refreshProject();
        } catch (error) {
            console.error("Error updating milestone:", error);
            alert("Error al actualizar hito");
        }
    };

    if (loading) return <div className="p-8">Cargando proyecto...</div>;
    if (!project) return <div className="p-8">Proyecto no encontrado</div>;

    // Financial Calculations
    // Calculate Revenue Dynamically to ensure consistency with Progress/Logs
    const totalIncurredCosts = workLogs.reduce((acc, log) => acc + log.amount, 0);

    // Unified Revenue Calc
    const calculatedRevenue = calculateProjectRevenue(project, totalIncurredCosts);

    const revenue = calculatedRevenue;
    const billed = project.billedAmount;
    const wip = revenue > billed ? revenue - billed : 0;
    const deferred = billed > revenue ? billed - revenue : 0;

    // Input Method Progress (Visual)
    const inputProgress = project.revenueMethod === 'Input' && project.totalEstimatedCosts
        ? (totalIncurredCosts / project.totalEstimatedCosts) * 100
        : 0;

    return (
        <div className="space-y-6">
            {/* Header & Navigation (Keep existing) */}
            <div className="flex items-center space-x-4">
                <Link href="/projects" className="text-primary-dark/60 hover:text-primary-dark">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-primary-dark">{project.title}</h1>
                    <div className="flex items-center space-x-2 text-sm text-primary-dark/60">
                        <span>{project.clientId}</span>
                        <span>•</span>
                        <Badge variant="outline">{project.type === 'TM' ? 'Time & Materials' : 'Fixed Price'}</Badge>
                        <span>•</span>
                        <Badge className={
                            project.status === 'Accepted' ? 'bg-secondary-teal/20 text-secondary-teal' : 'bg-tertiary-blue/20 text-tertiary-blue'
                        }>
                            {project.status}
                        </Badge>
                        {project.revenueMethod && (
                            <>
                                <span>•</span>
                                <Badge variant="secondary" className="bg-primary/10 text-primary">
                                    Método: {project.revenueMethod}
                                </Badge>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Financial Health Cards */}
            <div className={`grid grid-cols-1 md:grid-cols-3 ${deferred > 0 ? 'xl:grid-cols-6' : 'xl:grid-cols-5'} gap-4`}>
                <Card className="flex flex-col h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-sm font-medium text-primary-dark/60">Presupuesto</CardTitle>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger><Info className="h-3 w-3 text-primary-dark/40" /></TooltipTrigger>
                                    <TooltipContent><p>Valor total del contrato (BAC).</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-center flex-grow">
                        <div className="text-xl md:text-2xl font-bold text-primary-dark">{project.budget.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-primary flex flex-col h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-primary">Revenue</CardTitle>
                        <Dialog>
                            <DialogTrigger>
                                <Info className="h-4 w-4 text-primary cursor-pointer hover:text-primary-dark" />
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Conceptos Financieros</DialogTitle>
                                    <DialogDescription className="space-y-4 pt-4">
                                        <div>
                                            <h4 className="font-bold text-primary">Revenue (Ingreso Reconocido)</h4>
                                            <p>Es el valor del trabajo que realmente has entregado o realizado.</p>
                                        </div>
                                        <div className="p-2 bg-aux-red/10 rounded border border-aux-red/30">
                                            <h4 className="font-bold text-aux-red">WIP (Work In Progress)</h4>
                                            <p className="text-aux-red">Trabajo realizado pero NO facturado.</p>
                                        </div>
                                    </DialogDescription>
                                </DialogHeader>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-center flex-grow">
                        <div className="text-xl md:text-2xl font-bold text-primary-dark">{revenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                        {project.revenueMethod === 'Input' && (
                            <div className="mt-2 w-full">
                                <div className="h-1 w-full bg-aux-grey/30 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${inputProgress}%` }} />
                                </div>
                                <p className="text-xs text-primary-dark/60 mt-1">{inputProgress.toFixed(0)}% Completado</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="flex flex-col h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-sm font-medium text-primary-dark/60">Facturado</CardTitle>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger><Info className="h-3 w-3 text-primary-dark/40" /></TooltipTrigger>
                                    <TooltipContent><p>Importe total enviado al cliente (Facturas emitidas).</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-center flex-grow">
                        <div className="text-xl md:text-2xl font-bold text-primary-dark">{billed.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                    </CardContent>
                </Card>

                {/* Deferred Revenue Card (Conditional) */}
                {deferred > 0 && (
                    <Card className="bg-orange-50 border-orange-100 flex flex-col h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-sm font-medium text-orange-800">Ingresos Diferidos</CardTitle>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger><Info className="h-3 w-3 text-orange-800/40" /></TooltipTrigger>
                                        <TooltipContent><p>Facturado por adelantado aún no devengado (Facturado - Revenue).</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col justify-center flex-grow">
                            <div className="text-xl md:text-2xl font-bold text-orange-700">
                                {deferred.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Backlog Card */}
                <Card className="bg-slate-50 flex flex-col h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-primary-dark/60">Backlog</CardTitle>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger><Info className="h-3 w-3 text-primary-dark/40" /></TooltipTrigger>
                                <TooltipContent><p>Pendiente de ejecutar (Presupuesto - Revenue)</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-center flex-grow">
                        <div className="text-xl md:text-2xl font-bold text-slate-700">
                            {(project.budget - revenue).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </div>
                    </CardContent>
                </Card>


            </div>

            {/* Tabs */}
            <div className="border-b border-aux-grey">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'activity'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-primary-dark/60 hover:text-primary-dark hover:border-aux-grey'
                            }`}
                    >
                        Actividad y Progreso
                    </button>
                    <button
                        onClick={() => setActiveTab('billing')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'billing'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-primary-dark/60 hover:text-primary-dark hover:border-aux-grey'
                            }`}
                    >
                        Facturación
                    </button>
                    <button
                        onClick={() => setActiveTab('eac')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'eac'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-primary-dark/60 hover:text-primary-dark hover:border-aux-grey'
                            }`}
                    >
                        Análisis EAC
                    </button>
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'details'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-primary-dark/60 hover:text-primary-dark hover:border-aux-grey'
                            }`}
                    >
                        Detalles del Proyecto
                    </button>
                </nav>
            </div>

            {/* Tab Content: Activity */}
            {activeTab === 'activity' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Input Form - ONLY FOR PM */}
                    <div className="lg:col-span-1">
                        {role === 'PM' ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-primary-dark">
                                        {project.revenueMethod === 'Output' ? 'Hitos del Proyecto' : 'Registrar Actividad'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {project.revenueMethod === 'Output' ? (
                                        <div className="space-y-3">
                                            {project.milestones?.map((milestone) => {
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);

                                                let delayNode = null;
                                                let isLate = false;

                                                if (milestone.targetDate) {
                                                    const target = new Date(milestone.targetDate);
                                                    target.setHours(0, 0, 0, 0);

                                                    if (!milestone.completed) {
                                                        // Active Delay
                                                        if (target < today) {
                                                            const diffTime = Math.abs(today.getTime() - target.getTime());
                                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                            isLate = true;
                                                            delayNode = (
                                                                <span className="text-red-600 font-bold ml-1">
                                                                    (Retraso: {diffDays} días)
                                                                </span>
                                                            );
                                                        }
                                                    } else if (milestone.actualDate) {
                                                        // Historical Delay
                                                        const actual = new Date(milestone.actualDate);
                                                        actual.setHours(0, 0, 0, 0);

                                                        if (actual > target) {
                                                            const diffTime = Math.abs(actual.getTime() - target.getTime());
                                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                            delayNode = (
                                                                <span className="text-orange-600 ml-1">
                                                                    (+{diffDays} días)
                                                                </span>
                                                            );
                                                        } else {
                                                            delayNode = (
                                                                <span className="text-green-600 ml-1 text-[10px]">
                                                                    (En fecha)
                                                                </span>
                                                            );
                                                        }
                                                    }
                                                }

                                                return (
                                                    <div
                                                        key={milestone.id}
                                                        className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${milestone.completed
                                                            ? 'bg-secondary-teal/10 border-secondary-teal/30'
                                                            : isLate
                                                                ? 'bg-red-50 border-red-200 hover:bg-red-100'
                                                                : 'bg-white border-aux-grey hover:bg-aux-grey/10'
                                                            }`}
                                                        onClick={() => handleToggleMilestone(milestone)}
                                                    >
                                                        <div className="flex items-center gap-3 w-full">
                                                            {milestone.completed
                                                                ? <CheckSquare className="h-5 w-5 text-secondary-teal shrink-0" />
                                                                : <Square className={`h-5 w-5 shrink-0 ${isLate ? 'text-red-400' : 'text-primary-dark/40'}`} />
                                                            }
                                                            <div className="flex flex-col w-full">
                                                                <div className="flex justify-between items-center w-full">
                                                                    <p className={`font-medium ${milestone.completed ? 'text-secondary-teal' : isLate ? 'text-red-700' : 'text-primary-dark'}`}>
                                                                        {milestone.name}
                                                                    </p>
                                                                    <p className="text-xs text-primary-dark/60 whitespace-nowrap">{milestone.percentage}%</p>
                                                                </div>

                                                                <div className="flex flex-col gap-0.5 mt-1">
                                                                    {milestone.targetDate && !milestone.completed && (
                                                                        <p className={`text-xs ${isLate ? 'text-red-600 font-medium' : 'text-primary-dark/50'}`}>
                                                                            Previsto: {new Date(milestone.targetDate).toLocaleDateString()} {delayNode}
                                                                        </p>
                                                                    )}
                                                                    {milestone.actualDate && milestone.completed && (
                                                                        <p className="text-xs text-secondary-teal/80">
                                                                            Completado: {new Date(milestone.actualDate).toLocaleDateString()} {delayNode}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {(!project.milestones || project.milestones.length === 0) && (
                                                <p className="text-sm text-primary-dark/60 italic">No hay hitos definidos.</p>
                                            )}
                                        </div>
                                    ) : (
                                        <form onSubmit={handleAddWorkLog} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-primary-dark">Fecha</label>
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        value={logDate}
                                                        onChange={(e) => setLogDate(e.target.value)}
                                                        className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 pl-10 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                                        required
                                                    />
                                                    <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-primary-dark/40" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-primary-dark">Concepto</label>
                                                <input
                                                    type="text"
                                                    value={logConcept}
                                                    onChange={(e) => setLogConcept(e.target.value)}
                                                    className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                                    placeholder="Ej: Desarrollo Frontend..."
                                                    required
                                                />
                                            </div>
                                            {project.type === 'TM' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-primary-dark">Horas</label>
                                                    <input
                                                        type="number"
                                                        value={logHours}
                                                        onChange={(e) => {
                                                            const h = e.target.value;
                                                            setLogHours(h);
                                                            if (project.hourlyRate && h) {
                                                                setLogAmount((Number(h) * project.hourlyRate).toFixed(2));
                                                            }
                                                        }}
                                                        className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                                        placeholder="0"
                                                    />
                                                    {project.hourlyRate && (
                                                        <p className="text-xs text-primary-dark/60 mt-1">
                                                            Tarifa aplicada: {project.hourlyRate} €/h
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-sm font-medium text-primary-dark">
                                                    {project.revenueMethod === 'Input' ? 'Coste Incurrido (€)' : 'Importe Revenue (€)'}
                                                </label>
                                                <input
                                                    type="number"
                                                    value={logAmount}
                                                    onChange={(e) => setLogAmount(e.target.value)}
                                                    className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                                    placeholder="0.00"
                                                    required
                                                />
                                                <p className="text-xs text-primary-dark/60 mt-1">
                                                    {project.revenueMethod === 'Input'
                                                        ? 'Coste real asociado a esta actividad.'
                                                        : 'Valor monetario a reconocer.'}
                                                </p>
                                            </div>
                                            <button
                                                type="submit"
                                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-aux-red focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Registrar
                                            </button>
                                        </form>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="bg-aux-grey/20 border-dashed border-aux-grey">
                                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                                    <Info className="h-10 w-10 text-primary-dark/40 mb-2" />
                                    <h3 className="text-lg font-medium text-primary-dark">Modo Visualización</h3>
                                    <p className="text-sm text-primary-dark/60 max-w-xs">
                                        Como perfil de <strong>Facturación</strong>, solo puedes verificar la actividad registrada por el Jefe de Proyecto.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Log List */}
                    <div className="lg:col-span-2">
                        {/* Utilization & Leakage Summary */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <Card className="bg-blue-50 border-blue-100">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-blue-800">Tasa de Utilización</p>
                                        <p className="text-lg font-bold text-blue-700">100%</p>
                                    </div>
                                    <CheckCircle className="h-5 w-5 text-blue-500" />
                                </CardContent>
                            </Card>
                            {project.type === 'TM' && (
                                <Card className="bg-orange-50 border-orange-100">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-orange-800">Revenue Leakage</p>
                                            <p className="text-lg font-bold text-orange-700">0 €</p>
                                        </div>
                                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-primary-dark">Historial de Actividad</CardTitle>
                                <div className="flex items-center space-x-2 bg-aux-grey/10 p-1 rounded-md">
                                    <button
                                        onClick={() => setFilterType('all')}
                                        className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${filterType === 'all'
                                            ? 'bg-white text-primary shadow-sm'
                                            : 'text-primary-dark/60 hover:text-primary-dark'
                                            }`}
                                    >
                                        Todo
                                    </button>
                                    <button
                                        onClick={() => setFilterType('month')}
                                        className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${filterType === 'month'
                                            ? 'bg-white text-primary shadow-sm'
                                            : 'text-primary-dark/60 hover:text-primary-dark'
                                            }`}
                                    >
                                        Por Mes
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {filterType === 'month' && (
                                    <div className="flex items-center justify-between mb-4 bg-aux-grey/5 p-2 rounded-md">
                                        <button
                                            onClick={() => {
                                                const newDate = new Date(currentDate);
                                                newDate.setMonth(newDate.getMonth() - 1);
                                                setCurrentDate(newDate);
                                            }}
                                            className="p-1 hover:bg-white hover:shadow-sm rounded-full transition-all text-primary-dark/60 hover:text-primary-dark"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                        </button>
                                        <span className="font-medium text-primary-dark capitalize">
                                            {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                        </span>
                                        <button
                                            onClick={() => {
                                                const newDate = new Date(currentDate);
                                                newDate.setMonth(newDate.getMonth() + 1);
                                                setCurrentDate(newDate);
                                            }}
                                            className="p-1 hover:bg-white hover:shadow-sm rounded-full transition-all text-primary-dark/60 hover:text-primary-dark"
                                        >
                                            <ArrowLeft className="h-4 w-4 rotate-180" />
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                    {filteredLogs.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-primary-dark/40 mb-1">No hay actividad registrada</p>
                                            {filterType === 'month' && (
                                                <p className="text-xs text-primary-dark/30">en este mes</p>
                                            )}
                                        </div>
                                    ) : (
                                        filteredLogs.map((log) => (
                                            <div key={log.id} className="flex items-center justify-between border-b border-aux-grey/50 pb-3 last:border-0 last:pb-0 hover:bg-aux-grey/5 p-2 rounded-md transition-colors">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1 bg-primary/10 p-1.5 rounded-full">
                                                        <CheckSquare className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-primary-dark text-sm">{log.concept}</p>
                                                        <div className="flex items-center gap-2 text-xs text-primary-dark/50 mt-0.5">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {new Date(log.date).toLocaleDateString()}
                                                            </span>
                                                            {log.hours && (
                                                                <span className="bg-aux-grey/20 px-1.5 py-0.5 rounded text-primary-dark/70">
                                                                    {log.hours}h
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-primary text-sm whitespace-nowrap">
                                                        {log.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                    </span>
                                                    {role === 'PM' && (
                                                        <button
                                                            onClick={() => handleDeleteWorkLog(log.id, log.amount)}
                                                            className="p-1 text-aux-red hover:bg-aux-red/10 rounded transition-colors"
                                                            title="Borrar actividad"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {filteredLogs.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-aux-grey flex justify-between items-center text-sm">
                                        <span className="text-primary-dark/60">Total {filterType === 'month' ? 'Mes' : 'Acumulado'}:</span>
                                        <span className="font-bold text-primary-dark text-lg">
                                            {filteredLogs.reduce((acc, log) => acc + log.amount, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Tab Content: Billing */}
            {activeTab === 'billing' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-primary-dark">Facturas Emitidas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {invoices.length === 0 ? (
                                <p className="text-center text-primary-dark/60 py-4">No hay facturas registradas.</p>
                            ) : (
                                invoices.map((invoice) => (
                                    <div key={invoice.id} className="flex items-center justify-between border-b border-aux-grey pb-4 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-medium text-primary-dark">{invoice.number}</p>
                                            <p className="text-sm text-primary-dark/60">{new Date(invoice.date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-primary-dark">
                                                {invoice.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                            </span>
                                            <Badge className="ml-2 bg-secondary-teal text-white" variant="outline">{invoice.status}</Badge>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tab Content: Details */}
            {activeTab === 'details' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-primary-dark">Detalles del Proyecto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                            <div>
                                <dt className="text-sm font-medium text-primary-dark/60">Cliente</dt>
                                <dd className="mt-1 text-sm text-primary-dark font-semibold">{project.clientId}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-primary-dark/60">Fechas</dt>
                                <dd className="mt-1 text-sm text-primary-dark">
                                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-primary-dark/60">Tipo de Proyecto</dt>
                                <dd className="mt-1 text-sm text-primary-dark">{project.type === 'TM' ? 'Time & Materials' : 'Precio Fijo (Fixed Price)'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-primary-dark/60">Estado</dt>
                                <dd className="mt-1 text-sm text-primary-dark">{project.status}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-primary-dark/60">Método de Revenue</dt>
                                <dd className="mt-1 text-sm text-primary-dark">{project.revenueMethod || 'Manual / No definido'}</dd>
                            </div>
                            {project.contractId && (
                                <div>
                                    <dt className="text-sm font-medium text-primary-dark/60">Contrato Marco</dt>
                                    <dd className="mt-1 text-sm text-primary-dark">
                                        <Link href={`/contracts/edit/${project.contractId}`} className="text-primary hover:underline">
                                            Ver Contrato
                                        </Link>
                                    </dd>
                                </div>
                            )}

                            <div className="md:col-span-2 mt-4 pt-4 border-t border-aux-grey/30">
                                <h4 className="text-base font-semibold text-primary-dark mb-2">Implicación Financiera</h4>
                                <div className={`p-4 rounded-md border text-sm ${project.type === 'TM'
                                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                                    : 'bg-orange-50 border-orange-200 text-orange-800'
                                    }`}>
                                    {project.type === 'TM' ? (
                                        <>
                                            <p className="font-bold mb-1">Time & Materials</p>
                                            <p>
                                                En este modelo, la facturación y el reconocimiento de ingresos dependen directamente de las horas y gastos reportados.
                                                <br />
                                                <strong>Riesgo:</strong> Bajo para la empresa. El cliente asume el riesgo de eficiencia.
                                                <br />
                                                <strong>Acción Clave:</strong> Asegurar que todas las horas se reportan y aprueban mensualmente para evitar "Revenue Leakage".
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="font-bold mb-1">Precio Fijo ({project.revenueMethod || 'General'})</p>
                                            <p className="mb-2">
                                                El presupuesto es cerrado. El ingreso se reconoce según el avance, no necesariamente según lo facturado.
                                                <br />
                                                <strong>Riesgo:</strong> Alto para la empresa. Cualquier sobrecoste reduce el margen directo.
                                            </p>
                                            {project.revenueMethod === 'Input' && (
                                                <p className="text-xs bg-white/50 p-2 rounded">
                                                    <strong>Método Input (Cost-to-Cost):</strong> El avance se calcula como (Coste Real / Coste Estimado).
                                                    Si gastas más de lo estimado sin avanzar realmente, inflarás el avance artificialmente. ¡Vigila el ETC (Estimate to Complete)!
                                                </p>
                                            )}
                                            {project.revenueMethod === 'Output' && (
                                                <p className="text-xs bg-white/50 p-2 rounded">
                                                    <strong>Método Output (Hitos):</strong> Solo reconoces ingreso cuando completas hitos certificables.
                                                    Puedes tener mucho coste incurrido (WIP) y 0 ingreso si no cierras el hito. Prioriza cerrar hitos.
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </dl>
                    </CardContent>
                </Card>
            )}

            {/* Tab Content: EAC */}
            {activeTab === 'eac' && (
                <EACDashboard initialProject={project} initialLogs={workLogs} isEmbedded={true} />
            )}
        </div>
    );
}

export default function ProjectDetailsPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <ProjectDetailsContent />
        </Suspense>
    );
}

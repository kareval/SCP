'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { projectService } from '@/services/projectService';
import { resourceService } from '@/services/resourceService';
import { Project, Invoice, WorkLog, Milestone, Resource, ProjectBaseline, ProjectResource } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Info, Plus, Calendar, CheckSquare, Square, Trash2, AlertTriangle, CheckCircle, Save, TrendingUp, Users, X, FileText, Download, BarChart2, Target } from 'lucide-react';
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
import { useTranslation } from '@/context/LanguageContext';
import { Label } from '@/components/ui/label';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

// Simple Badge Component for Margin
const MarginBadge = ({ value }: { value: number }) => {
    // Value should be 0-100
    const clampedValue = Math.min(Math.max(value, -100), 100);

    // Color logic
    const getColor = (v: number) => {
        if (v < 20) return "text-red-700 bg-red-50 border-red-200";
        if (v < 40) return "text-orange-700 bg-orange-50 border-orange-200";
        return "text-green-700 bg-green-50 border-green-200";
    };

    const colorClass = getColor(clampedValue);

    return (
        <div className={`flex flex-col items-center justify-center py-1 px-2 rounded-md border min-w-[60px] ${colorClass}`}>
            <span className="text-lg font-bold leading-none">
                {clampedValue.toFixed(0)}%
            </span>
            <span className="text-[9px] uppercase font-bold tracking-wider opacity-80 mt-1">Margen</span>
        </div>
    );
};

function ProjectDetailsContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const { t } = useTranslation();
    const { role } = useRole();
    const [project, setProject] = useState<Project | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'activity' | 'billing' | 'details' | 'eac' | 'strategic'>('activity');

    // Form State for WorkLog
    const [logConcept, setLogConcept] = useState('');
    const [logAmount, setLogAmount] = useState(''); // Revenue
    const [logHours, setLogHours] = useState('');
    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedResourceId, setSelectedResourceId] = useState<string>('');
    const [logCost, setLogCost] = useState(0); // Internal state for calculating margin

    // Team Management State
    const [newTeamMemberId, setNewTeamMemberId] = useState<string>('');
    const [overrideCost, setOverrideCost] = useState<string>('');
    const [overrideBill, setOverrideBill] = useState<string>('');
    const [showAddMember, setShowAddMember] = useState(false);

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
                setResources(resourceService.getResources().filter(r => r.active));
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

    // Auto-calculate rates when resource or hours change
    useEffect(() => {
        if (selectedResourceId && logHours && project) {
            const hours = Number(logHours);

            // Check if resource is in Team (Override Priority)
            const teamMember = project.team?.find(m => m.id === selectedResourceId);
            const globalResource = resources.find(r => r.id === selectedResourceId);

            const costRate = teamMember?.overrideCostRate ?? globalResource?.costRate ?? 0;
            const billRate = teamMember?.overrideBillRate ?? globalResource?.billRate ?? 0;

            if (costRate || billRate) {
                setLogCost(hours * costRate);
                setLogAmount((hours * billRate).toFixed(2));
            }
        }
    }, [selectedResourceId, logHours, resources, project]);

    const handleAddWorkLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!project) return;

        const amount = Number(logAmount);
        const hours = logHours ? Number(logHours) : undefined;
        // Recalculate cost safery check
        let costAmount = 0;
        if (selectedResourceId && hours) {
            const teamMember = project.team?.find(m => m.id === selectedResourceId);
            const globalResource = resources.find(r => r.id === selectedResourceId);
            const costRate = teamMember?.overrideCostRate ?? globalResource?.costRate ?? 0;
            costAmount = hours * costRate;
        }

        const newLog: WorkLog = {
            id: crypto.randomUUID(),
            projectId: project.id,
            date: logDate,
            concept: logConcept,
            amount: amount,
            hours: hours,
            resourceId: selectedResourceId || undefined,
            costAmount: costAmount
        };

        try {
            const logToSave = JSON.parse(JSON.stringify(newLog));
            await projectService.addWorkLog(project.id, logToSave);

            // Calculate new Revenue Logic
            let newRevenue = 0;
            const updatedLogs = [...workLogs, newLog];
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

            // Reset form
            setLogConcept('');
            setLogAmount('');
            setLogHours('');
            setSelectedResourceId('');
            setLogCost(0);
        } catch (error) {
            console.error("Error adding work log:", error);
            alert("Error al registrar actividad");
        }
    };

    const handleDeleteWorkLog = async (logId: string, amount: number) => {
        if (!project || !confirm('¿Estás seguro de que quieres borrar esta actividad?')) return;
        try {
            await projectService.deleteWorkLog(project.id, logId);
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

    const handleSetBaseline = async () => {
        if (!project || !confirm("¿Capturar Línea Base del presupuesto actual?")) return;

        const baseline: ProjectBaseline = {
            capturedAt: new Date().toISOString(),
            budget: project.budget,
            startDate: project.startDate,
            endDate: project.endDate,
            totalEstimatedCosts: project.totalEstimatedCosts
        };

        const updatedProject = { ...project, originalBaseline: baseline };
        await projectService.updateProject(updatedProject);
        refreshProject();
    };

    const handleAddTeamMember = async () => {
        if (!project || !newTeamMemberId) return;

        const globalResource = resources.find(r => r.id === newTeamMemberId);
        if (!globalResource) return;

        const newMember: ProjectResource = {
            ...globalResource,
            overrideCostRate: overrideCost ? Number(overrideCost) : undefined,
            overrideBillRate: overrideBill ? Number(overrideBill) : undefined,
        };

        const currentTeam = project.team || [];
        const updatedTeam = [...currentTeam.filter(m => m.id !== newMember.id), newMember];

        const updatedProject = { ...project, team: updatedTeam };
        await projectService.updateProject(updatedProject);
        await refreshProject();

        setShowAddMember(false);
        setNewTeamMemberId('');
        setOverrideCost('');
        setOverrideBill('');
    };

    const handleRemoveTeamMember = async (memberId: string) => {
        if (!project || !confirm('¿Quitar recurso del equipo del proyecto?')) return;
        const updatedTeam = (project.team || []).filter(m => m.id !== memberId);
        const updatedProject = { ...project, team: updatedTeam };
        await projectService.updateProject(updatedProject);
        await refreshProject();
    };

    // Existing milestone handler logic
    const handleToggleMilestone = async (milestone: Milestone) => {
        if (!project || !project.milestones) return;
        const updatedMilestones = project.milestones.map(m =>
            m.id === milestone.id ? {
                ...m,
                completed: !m.completed,
                actualDate: !m.completed ? new Date().toISOString() : undefined
            } : m
        );
        const totalPercentageCompleted = updatedMilestones.filter(m => m.completed).reduce((acc, m) => acc + m.percentage, 0);
        const newRevenue = (totalPercentageCompleted / 100) * project.budget;
        const updatedProject = { ...project, milestones: updatedMilestones, justifiedAmount: newRevenue };
        try { await projectService.updateProject(updatedProject); await refreshProject(); } catch (error) { console.error(error); }
    };

    if (loading) return <div className="p-8">Cargando proyecto...</div>;
    if (!project) return <div className="p-8">Proyecto no encontrado</div>;

    // Financial Metrics
    const totalRevenue = workLogs.reduce((acc, log) => acc + log.amount, 0);
    const totalCost = workLogs.reduce((acc, log) => acc + (log.costAmount || 0), 0);
    const grossMargin = totalRevenue - totalCost;
    const grossMarginPercent = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;
    const billed = project.billedAmount;
    const inputProgress = project.revenueMethod === 'Input' && project.totalEstimatedCosts ? (totalRevenue / project.totalEstimatedCosts) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/projects" className="text-primary-dark/60 hover:text-primary-dark"><ArrowLeft className="h-6 w-6" /></Link>
                    <div>
                        <h1 className="text-3xl font-bold text-primary-dark">{project.title}</h1>
                        <div className="flex items-center space-x-2 text-sm text-primary-dark/60">
                            <span>{project.clientId}</span>
                            <span>•</span>
                            <Badge variant="outline">{project.type === 'TM' ? 'Time & Materials' : 'Fixed Price'}</Badge>
                            <span>•</span>
                            <Badge className={project.status === 'Accepted' ? 'bg-secondary-teal/20 text-secondary-teal' : 'bg-tertiary-blue/20 text-tertiary-blue'}>{project.status}</Badge>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!project.originalBaseline && (project.status === 'Budgeted' || project.status === 'Approved') && (
                        <button onClick={handleSetBaseline} className="flex items-center text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100 transition-colors">
                            <Save className="h-3 w-3 mr-1" /> Línea Base
                        </button>
                    )}
                </div>
            </div>

            {/* Financial Health Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                {/* Presupuesto */}
                <Card>
                    <CardHeader className="pb-1">
                        <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">Presupuesto</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-xl font-bold text-primary-dark">{project.budget.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                        {project.originalBaseline && project.originalBaseline.budget !== project.budget && (
                            <div className="mt-1 text-xs text-slate-400">Base: <span className="line-through">{project.originalBaseline.budget.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span></div>
                        )}
                        {project.contingencyReserve && project.contingencyReserve > 0 && (
                            <div className="text-xs text-amber-600 mt-1 font-medium">
                                Incluye Reserva: {(project.budget * (project.contingencyReserve / 100)).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} ({project.contingencyReserve}%)
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Revenue */}
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="pb-1">
                        <CardTitle className="text-xs font-medium text-primary uppercase tracking-wide">Revenue</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-xl font-bold text-primary-dark">{totalRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                        {project.revenueMethod === 'Input' && <div className="mt-1 text-xs text-slate-500">{inputProgress.toFixed(0)}% Completado</div>}
                    </CardContent>
                </Card>

                {/* Margen Bruto - Rediseñado */}
                <Card className={`border-l-4 ${grossMargin >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
                    <CardHeader className="pb-1 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                            {project.type === 'Internal' ? 'Coste Total' : 'Margen Bruto'}
                        </CardTitle>
                        {project.type !== 'Internal' && (
                            <span className={`text-sm font-bold px-2 py-0.5 rounded ${grossMarginPercent >= 30 ? 'bg-green-100 text-green-700' : grossMarginPercent >= 15 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                {grossMarginPercent.toFixed(0)}%
                            </span>
                        )}
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className={`text-xl font-bold ${grossMargin >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {project.type === 'Internal' ? totalCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) : grossMargin.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </div>
                        {project.type !== 'Internal' && <div className="mt-1 text-xs text-slate-500">Coste: {totalCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>}
                    </CardContent>
                </Card>

                {/* Facturado */}
                <Card>
                    <CardHeader className="pb-1">
                        <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">Facturado</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-xl font-bold text-primary-dark">{billed.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                    </CardContent>
                </Card>

                {/* Backlog */}
                <Card className="bg-slate-50">
                    <CardHeader className="pb-1">
                        <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">Backlog</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-xl font-bold text-slate-700">{(project.budget - totalRevenue).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <div className="border-b border-aux-grey">
                <nav className="-mb-px flex space-x-8">
                    {(['activity', 'billing', 'eac', 'strategic', 'details'] as const).map(tabKey => (
                        <button key={tabKey} onClick={() => setActiveTab(tabKey)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tabKey ? 'border-primary text-primary' : 'border-transparent text-primary-dark/60 hover:text-primary-dark'}`}>{t(`projects.detail.tabs.${tabKey}`)}</button>
                    ))}
                </nav>
            </div>

            {/* Tab: Activity */}
            {activeTab === 'activity' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        {role === 'PM' ? (
                            <Card>
                                <CardHeader><CardTitle className="text-primary-dark">{project.revenueMethod === 'Output' ? t('projects.detail.activity.milestones') : t('projects.detail.activity.register')}</CardTitle></CardHeader>
                                <CardContent>
                                    {project.revenueMethod === 'Output' ? (
                                        <div className="space-y-4">{project.milestones?.map(m => (<div key={m.id} onClick={() => handleToggleMilestone(m)} className={`flex justify-between p-3 border rounded cursor-pointer ${m.completed ? 'bg-teal-50 border-teal-200' : 'bg-white'}`}><span className="font-medium">{m.name}</span>{m.completed ? <CheckSquare className="text-teal-600" /> : <Square className="text-slate-400" />}</div>))}</div>
                                    ) : (
                                        <form onSubmit={handleAddWorkLog} className="space-y-4">
                                            <div>
                                                <Label>Fecha</Label>
                                                <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2" required />
                                            </div>
                                            <div>
                                                <Label>Recurso</Label>
                                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={selectedResourceId} onChange={e => setSelectedResourceId(e.target.value)}>
                                                    <option value="">Seleccionar...</option>
                                                    {project.team && project.team.length > 0 && (
                                                        <optgroup label="Equipo del Proyecto">
                                                            {project.team.map(r => <option key={r.id} value={r.id}>{r.name} ({r.role}) - Equipo</option>)}
                                                        </optgroup>
                                                    )}
                                                    <optgroup label="Recursos Globales">
                                                        {resources.filter(r => !project.team?.some(tm => tm.id === r.id)).map(r => <option key={r.id} value={r.id}>{r.name} ({r.role})</option>)}
                                                    </optgroup>
                                                </select>
                                                {selectedResourceId && (
                                                    <p className="text-xs text-blue-600 mt-1">
                                                        Coste: {project.team?.find(t => t.id === selectedResourceId)?.overrideCostRate ?? resources.find(r => r.id === selectedResourceId)?.costRate}€ |
                                                        Venta: {project.team?.find(t => t.id === selectedResourceId)?.overrideBillRate ?? resources.find(r => r.id === selectedResourceId)?.billRate}€
                                                    </p>
                                                )}
                                            </div>
                                            <div><Label>Concepto</Label><input type="text" value={logConcept} onChange={e => setLogConcept(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" required placeholder="Tarea..." /></div>
                                            {(project.type === 'TM' || project.type === 'Internal') && <div><Label>Horas</Label><input type="number" value={logHours} onChange={e => setLogHours(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="0" /></div>}
                                            <div><Label>Importe (€)</Label><input type="number" value={logAmount} onChange={e => setLogAmount(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="0.00" required /></div>
                                            <button type="submit" className="w-full flex justify-center py-2 px-4 rounded shadow-sm text-sm font-medium text-white bg-primary hover:bg-red-700"><Plus className="mr-2 h-4 w-4" /> Registrar</button>
                                        </form>
                                    )}
                                </CardContent>
                            </Card>
                        ) : <div>Solo lectura</div>}
                    </div>
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader className="flex justify-between"><CardTitle>Actividad Reciente</CardTitle></CardHeader>
                            <CardContent className="max-h-[500px] overflow-y-auto space-y-2">
                                {filteredLogs.map(log => {
                                    const resName = resources.find(r => r.id === log.resourceId)?.name;
                                    const margin = (log.amount || 0) - (log.costAmount || 0);
                                    return (
                                        <div key={log.id} className="flex justify-between items-center p-3 hover:bg-slate-50 border-b">
                                            <div>
                                                <p className="font-medium text-sm text-primary-dark">{log.concept}</p>
                                                <div className="flex gap-2 text-xs text-slate-500"><span>{new Date(log.date).toLocaleDateString()}</span>{log.hours && <span>• {log.hours}h</span>}{resName && <span>• {resName}</span>}</div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-primary">{log.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                                                {project.type !== 'Internal' && <p className={`text-[10px] ${margin >= 0 ? 'text-green-600' : 'text-red-500'}`}>Mg: {margin.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</p>}
                                                {role === 'PM' && <button onClick={() => handleDeleteWorkLog(log.id, log.amount)} className="text-red-400 ml-2"><Trash2 className="h-4 w-4" /></button>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Tab: Billing */}
            {activeTab === 'billing' && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Facturación</CardTitle>
                            <Link href="/billing">
                                <button className="flex items-center text-sm bg-primary text-white px-3 py-2 rounded hover:bg-primary-dark">
                                    <Plus className="h-4 w-4 mr-2" /> Nueva Factura
                                </button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                                        <tr>
                                            <th className="p-3">Número</th>
                                            <th className="p-3">Fecha</th>
                                            <th className="p-3">Estado</th>
                                            <th className="p-3 text-right">Base</th>
                                            <th className="p-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {invoices.length === 0 ? (
                                            <tr><td colSpan={5} className="p-4 text-center text-slate-400">No hay facturas registradas</td></tr>
                                        ) : (
                                            invoices.map(inv => (
                                                <tr key={inv.id} className="hover:bg-slate-50">
                                                    <td className="p-3 font-medium text-primary-dark">{inv.number}</td>
                                                    <td className="p-3 text-slate-500">{new Date(inv.date).toLocaleDateString()}</td>
                                                    <td className="p-3"><Badge variant="outline" className={inv.status === 'Paid' ? 'text-green-600 bg-green-50' : 'text-slate-600'}>{inv.status}</Badge></td>
                                                    <td className="p-3 text-right">{inv.baseAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                    <td className="p-3 text-right font-bold">{inv.totalAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tab: EAC */}
            {activeTab === 'eac' && (
                <EACDashboard initialProject={project} initialLogs={workLogs} />
            )}

            {/* Tab: Strategic */}
            {activeTab === 'strategic' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>Alineación Estratégica</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col items-center justify-center p-6">
                            <div className="flex flex-col items-center mb-8">
                                <Target className="h-16 w-16 text-primary mb-4" />
                                <div className="text-6xl font-bold text-primary-dark tracking-tight">
                                    {project.strategicScore ?? 0}
                                    <span className="text-2xl text-slate-400 font-normal ml-1">/100</span>
                                </div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mt-2">Puntuación Global</p>
                            </div>

                            <div className="w-full grid grid-cols-2 gap-4">
                                {project.strategicBreakdown && Object.entries(project.strategicBreakdown).map(([key, val]) => {
                                    const max = (key === 'alignment' || key === 'innovation') ? 30 : 20;
                                    const ratio = (val / max) * 100;
                                    return (
                                        <div key={key} className="flex flex-col p-3 bg-slate-50 rounded-lg border border-slate-100 relative overflow-hidden group hover:border-primary/20 transition-colors">
                                            <div className="absolute bottom-0 left-0 h-1 bg-primary/10 w-full">
                                                <div className="h-full bg-primary" style={{ width: `${ratio}%` }}></div>
                                            </div>
                                            <span className="text-[10px] uppercase text-slate-500 font-bold truncate mb-1" title={t(`projects.form.criteria.${key}`)}>
                                                {t(`projects.form.criteria.${key}`)}
                                            </span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xl font-bold text-primary-dark">{val}</span>
                                                <span className="text-xs text-slate-400">/{max}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>Radar de Competencias</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-[400px]">
                            {project.strategicBreakdown ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                                        { subject: t('projects.form.criteria.alignment'), A: (project.strategicBreakdown.alignment / 30) * 100, raw: project.strategicBreakdown.alignment, max: 30, fullMark: 100 },
                                        { subject: t('projects.form.criteria.innovation'), A: (project.strategicBreakdown.innovation / 30) * 100, raw: project.strategicBreakdown.innovation, max: 30, fullMark: 100 },
                                        { subject: t('projects.form.criteria.customerImpact'), A: (project.strategicBreakdown.customerImpact / 20) * 100, raw: project.strategicBreakdown.customerImpact, max: 20, fullMark: 100 },
                                        { subject: t('projects.form.criteria.viability'), A: (project.strategicBreakdown.viability / 20) * 100, raw: project.strategicBreakdown.viability, max: 20, fullMark: 100 },
                                    ]}>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar
                                            name="Puntuación"
                                            dataKey="A"
                                            stroke="#ef4444"
                                            fill="#ef4444"
                                            fillOpacity={0.4}
                                        />
                                        <RechartsTooltip
                                            formatter={(value: number, name: string, props: any) => [`${props.payload.raw} / ${props.payload.max}`, 'Puntuación Real']}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400">
                                    No hay datos suficientes para visualizar
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tab: Details / Team */}
            {activeTab === 'details' && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Equipo del Proyecto</CardTitle>
                            <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                                <DialogTrigger>
                                    <button className="flex items-center text-sm bg-primary text-white px-3 py-2 rounded hover:bg-primary-dark">
                                        <Plus className="h-4 w-4 mr-2" /> Añadir Miembro
                                    </button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Asignar Recurso al Proyecto</DialogTitle></DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div>
                                            <Label>Recurso Global</Label>
                                            <select className="w-full border rounded p-2" value={newTeamMemberId} onChange={e => setNewTeamMemberId(e.target.value)}>
                                                <option value="">Seleccionar...</option>
                                                {resources.filter(r => !project.team?.some(t => t.id === r.id)).map(r => (
                                                    <option key={r.id} value={r.id}>{r.name} - {r.role} (Std: {r.billRate}€)</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Coste Personalizado (€/h)</Label>
                                                <input type="number" className="w-full border rounded p-2" placeholder="Opcional" value={overrideCost} onChange={e => setOverrideCost(e.target.value)} />
                                                <p className="text-xs text-slate-400">Dejar vacío para usar {newTeamMemberId ? resources.find(r => r.id === newTeamMemberId)?.costRate : 'Estándar'}</p>
                                            </div>
                                            <div>
                                                <Label>Venta Personalizada (€/h)</Label>
                                                <input type="number" className="w-full border rounded p-2" placeholder="Opcional" value={overrideBill} onChange={e => setOverrideBill(e.target.value)} />
                                                <p className="text-xs text-slate-400">Dejar vacío para usar {newTeamMemberId ? resources.find(r => r.id === newTeamMemberId)?.billRate : 'Estándar'}</p>
                                            </div>
                                        </div>
                                        <button onClick={handleAddTeamMember} className="w-full bg-primary text-white py-2 rounded mt-2">Guardar Asignación</button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            {!project.team || project.team.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                    <p>No hay recursos asignados específicamente.</p>
                                    <p className="text-sm">Se usarán las tarifas globales por defecto.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {project.team.map(member => (
                                        <div key={member.id} className="flex justify-between items-center p-3 border rounded hover:bg-slate-50">
                                            <div>
                                                <p className="font-bold text-primary-dark">{member.name}</p>
                                                <p className="text-sm text-slate-500">{member.role}</p>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="text-xs uppercase text-slate-400">Coste</p>
                                                    <p className={`font-mono ${member.overrideCostRate ? 'text-amber-600 font-bold' : ''}`}>
                                                        {member.overrideCostRate ?? member.costRate}€
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs uppercase text-slate-400">Venta</p>
                                                    <p className={`font-mono ${member.overrideBillRate ? 'text-blue-600 font-bold' : ''}`}>
                                                        {member.overrideBillRate ?? member.billRate}€
                                                    </p>
                                                </div>
                                                <button onClick={() => handleRemoveTeamMember(member.id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

export default function ProjectDetailsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProjectDetailsContent />
        </Suspense>
    );
}

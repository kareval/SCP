'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { projectService } from '@/services/projectService';
import { contractService } from '@/services/contractService';
import { Project, ProjectType, RevenueMethod, Milestone, Contract } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BudgetPlanner } from "@/components/BudgetPlanner";
import { BillingPlanner } from "@/components/BillingPlanner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function EditProjectClient({ id }: { id: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [project, setProject] = useState<Project | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        clientId: '',
        contractId: '',
        type: 'TM' as ProjectType,
        budget: 0,
        description: '',
        revenueMethod: undefined as RevenueMethod | undefined,
        totalEstimatedCosts: 0,
        status: 'Budgeted' as Project['status'],
        startDate: '',
        endDate: '',
        hourlyRate: 0,
        linearMonthlyAmount: 0
    });

    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [newMilestoneName, setNewMilestoneName] = useState('');
    const [newMilestonePercentage, setNewMilestonePercentage] = useState('');
    const [newMilestoneDate, setNewMilestoneDate] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [contractsData, projectsData] = await Promise.all([
                    contractService.getContracts(),
                    projectService.getProjects()
                ]);
                setContracts(contractsData.filter(c => c.status === 'Active'));

                const found = projectsData.find(p => p.id === id);
                if (found) {
                    setProject(found);
                    setFormData({
                        title: found.title,
                        clientId: found.clientId,
                        contractId: found.contractId || '',
                        type: found.type,
                        budget: found.budget,
                        description: '',
                        revenueMethod: found.revenueMethod || 'Input',
                        totalEstimatedCosts: found.totalEstimatedCosts || 0,
                        status: found.status,
                        startDate: found.startDate || '',
                        endDate: found.endDate || '',
                        hourlyRate: found.hourlyRate || 0,
                        linearMonthlyAmount: found.linearMonthlyAmount || 0
                    });
                    if (found.milestones) {
                        setMilestones(found.milestones);
                    }
                } else {
                    alert('Proyecto no encontrado');
                    router.push('/projects');
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, router]);

    const handleAddMilestone = () => {
        if (!newMilestoneName || !newMilestonePercentage) return;
        const percentage = Number(newMilestonePercentage);
        if (isNaN(percentage) || percentage <= 0) return;

        const newMilestone: Milestone = {
            id: crypto.randomUUID(),
            name: newMilestoneName,
            percentage: percentage,
            completed: false,
            targetDate: newMilestoneDate || undefined
        };

        setMilestones([...milestones, newMilestone]);
        setNewMilestoneName('');
        setNewMilestonePercentage('');
        setNewMilestoneDate('');
    };

    const handleRemoveMilestone = (id: string) => {
        setMilestones(milestones.filter(m => m.id !== id));
    };

    // Auto-calculate Linear Monthly Amount
    useEffect(() => {
        if (formData.type === 'Fixed' && formData.revenueMethod === 'Linear' && formData.budget > 0 && formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;

            if (months > 0) {
                // If the stored amount is 0 or user just switched method, auto-cal.
                // We might want to allow override. But "precalcula" suggests we set it.
                // We can check if it matches the calc, otherwise update.
                const amount = formData.budget / months;
                // Only update if significantly different to avoid loops or overwriting manual edits? 
                // User requirement was "precalcula". I will overwrite on change of budget/dates.
                setFormData(prev => ({ ...prev, linearMonthlyAmount: Number(amount.toFixed(2)) }));
            }
        }
    }, [formData.budget, formData.revenueMethod, formData.type, formData.startDate, formData.endDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!project) return;
        setLoading(true);

        try {
            const updatedProject: Project = {
                ...project,
                title: formData.title,
                clientId: formData.clientId,
                contractId: formData.contractId || undefined,
                status: formData.status,
                type: formData.type,
                budget: Number(formData.budget),
                revenueMethod: formData.revenueMethod,
                totalEstimatedCosts: formData.revenueMethod === 'Input' ? Number(formData.totalEstimatedCosts) : undefined,
                milestones: formData.revenueMethod === 'Output' ? milestones : undefined,
                startDate: formData.startDate,
                endDate: formData.endDate,
                hourlyRate: formData.type === 'TM' ? Number(formData.hourlyRate) : undefined,
                linearMonthlyAmount: (formData.type === 'Fixed' && formData.revenueMethod === 'Linear') ? Number(formData.linearMonthlyAmount) : undefined
            };

            const projectToSave = JSON.parse(JSON.stringify(updatedProject));
            await projectService.updateProject(projectToSave);
            // Don't redirect immediately to allow editing other tabs if needed, or show success message
            alert('Proyecto actualizado correctamente');
            setProject(updatedProject); // Update local state
        } catch (error) {
            console.error('Error updating project:', error);
            alert('Error al actualizar el proyecto');
        } finally {
            setLoading(false);
        }
    };

    const handleContractChange = (contractId: string) => {
        const contract = contracts.find(c => c.id === contractId);
        setFormData({
            ...formData,
            contractId,
            clientId: contract ? contract.clientId : formData.clientId
        });
    };

    const handleProjectUpdate = (updatedProject: Project) => {
        setProject(updatedProject);
    };

    if (loading) return <div className="p-8">Cargando proyecto...</div>;
    if (!project) return <div className="p-8">Proyecto no encontrado</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Link href="/projects" className="text-primary-dark/60 hover:text-primary-dark">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-3xl font-bold text-primary-dark">Editar Proyecto</h1>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="planning">Planificación</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card className="max-w-2xl">
                        <CardHeader>
                            <CardTitle className="text-primary-dark">Detalles del Proyecto</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-primary-dark">Contrato Marco (Opcional)</label>
                                    <select
                                        value={formData.contractId}
                                        onChange={(e) => handleContractChange(e.target.value)}
                                        className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none"
                                    >
                                        <option value="">-- Seleccionar Contrato --</option>
                                        {contracts.map(c => (
                                            <option key={c.id} value={c.id}>{c.title} ({c.clientId})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-primary-dark">Título del Proyecto</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-primary-dark">Cliente</label>
                                    <input
                                        type="text"
                                        value={formData.clientId}
                                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                        className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-primary-dark">Fecha Inicio</label>
                                        <input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-primary-dark">Fecha Fin</label>
                                        <input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-primary-dark">Tipo de Proyecto</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value as ProjectType })}
                                            className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none"
                                        >
                                            <option value="TM">Time & Materials (T&M)</option>
                                            <option value="Fixed">Precio Fijo (Fixed Price)</option>
                                        </select>
                                        <div className="mt-2">
                                            {formData.type === 'TM' ? (
                                                <Alert className="bg-blue-50 border-blue-200">
                                                    <Info className="h-4 w-4 text-blue-600" />
                                                    <AlertTitle className="text-blue-800 text-xs font-bold">Time & Materials</AlertTitle>
                                                    <AlertDescription className="text-blue-700 text-xs mt-1">
                                                        Se factura por horas/gastos incurridos. El riesgo lo asume el cliente.
                                                        <br />
                                                        <strong>Revenue = Suma de horas reportadas x {formData.hourlyRate ? `${formData.hourlyRate}€/h` : 'Tarifa'}.</strong>
                                                    </AlertDescription>
                                                </Alert>
                                            ) : (
                                                <Alert className="bg-orange-50 border-orange-200">
                                                    <Info className="h-4 w-4 text-orange-600" />
                                                    <AlertTitle className="text-orange-800 text-xs font-bold">Precio Fijo</AlertTitle>
                                                    <AlertDescription className="text-orange-700 text-xs">
                                                        Presupuesto cerrado. El riesgo lo asume la empresa.
                                                        <br />Requiere definir un método de reconocimiento de ingresos (Input/Output).
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-primary-dark">Presupuesto Inicial (€)</label>
                                        <input
                                            type="number"
                                            value={formData.budget}
                                            onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                                            className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none"
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                </div>

                                {formData.type === 'TM' && (
                                    <div>
                                        <label className="block text-sm font-medium text-primary-dark">Tarifa por Hora (€)</label>
                                        <input
                                            type="number"
                                            value={formData.hourlyRate || ''}
                                            onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                                            className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none"
                                            min="0"
                                            step="0.01"
                                            placeholder="Ej: 50.00"
                                        />
                                        <p className="text-xs text-primary-dark/60 mt-1">
                                            Se usará para calcular automáticamente el importe al registrar horas.
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-primary-dark">Estado</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as Project['status'] })}
                                        className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none"
                                    >
                                        <option value="Budgeted">Presupuestado</option>
                                        <option value="Accepted">Aceptado</option>
                                        <option value="In Progress">En Progreso</option>
                                        <option value="Justified">Justificado</option>
                                        <option value="Completed">Completado</option>
                                        <option value="Closed">Cerrado</option>
                                    </select>
                                </div>

                                <div className="border-t border-aux-grey pt-4 mt-4">
                                    <h3 className="text-lg font-medium text-primary-dark mb-4">Reconocimiento de Ingresos</h3>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-primary-dark">Método de Reconocimiento</label>
                                        <select
                                            value={formData.revenueMethod || ''}
                                            onChange={(e) => setFormData({ ...formData, revenueMethod: (e.target.value as RevenueMethod) || undefined })}
                                            className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none"
                                        >
                                            <option value="">-- Manual / Sin Método Específico --</option>
                                            <option value="Input">Input Method (Cost-to-Cost)</option>
                                            <option value="Output">Output Method (Milestones)</option>
                                            <option value="Linear">Lineal (Ingreso Fijo Mensual)</option>
                                        </select>
                                        <div className="mt-2">
                                            {formData.revenueMethod === 'Input' && (
                                                <Alert className="bg-gray-50 border-gray-200">
                                                    <Info className="h-4 w-4 text-gray-600" />
                                                    <AlertTitle className="text-gray-800 text-xs font-bold">Cost-to-Cost (Input)</AlertTitle>
                                                    <AlertDescription className="text-gray-700 text-xs">
                                                        El avance se mide por el coste incurrido vs estimado.
                                                        <br /><strong>% Avance =</strong> (Coste Real / Coste Total Estimado)
                                                        <br /><strong>Revenue =</strong> % Avance x Presupuesto
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                            {formData.revenueMethod === 'Output' && (
                                                <Alert className="bg-gray-50 border-gray-200">
                                                    <Info className="h-4 w-4 text-gray-600" />
                                                    <AlertTitle className="text-gray-800 text-xs font-bold">Hitos (Output)</AlertTitle>
                                                    <AlertDescription className="text-gray-700 text-xs">
                                                        El avance se mide por hitos completados.
                                                        <br /><strong>Revenue =</strong> Suma de % de Hitos Completados x Presupuesto
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                            {formData.revenueMethod === 'Linear' && (
                                                <Alert className="bg-gray-50 border-gray-200">
                                                    <Info className="h-4 w-4 text-gray-600" />
                                                    <AlertTitle className="text-gray-800 text-xs font-bold">Lineal (Fixed Monthly)</AlertTitle>
                                                    <AlertDescription className="text-gray-700 text-xs">
                                                        Ingreso fijo cada mes.
                                                        <br /><strong>Revenue =</strong> Meses transcurridos x Ingreso Mensual
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </div>
                                    </div>

                                    {formData.revenueMethod === 'Input' && (
                                        <div>
                                            <label className="block text-sm font-medium text-primary-dark">Costes Totales Estimados (€)</label>
                                            <input
                                                type="number"
                                                value={formData.totalEstimatedCosts}
                                                onChange={(e) => setFormData({ ...formData, totalEstimatedCosts: Number(e.target.value) })}
                                                className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none"
                                                min="0"
                                                step="0.01"
                                                required
                                            />
                                        </div>
                                    )}

                                    {formData.revenueMethod === 'Output' && (
                                        <div className="space-y-4">
                                            <div className="bg-aux-grey/10 p-4 rounded-md border border-aux-grey/30">
                                                <label className="block text-sm font-medium text-primary-dark mb-2">Definir Hitos</label>
                                                <div className="flex gap-2 mb-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Nombre del Hito"
                                                        value={newMilestoneName}
                                                        onChange={(e) => setNewMilestoneName(e.target.value)}
                                                        className="flex-1 rounded-md border border-aux-grey px-3 py-1 text-sm focus:border-primary focus:ring-primary focus:outline-none"
                                                    />
                                                    <input
                                                        type="date"
                                                        value={newMilestoneDate}
                                                        onChange={(e) => setNewMilestoneDate(e.target.value)}
                                                        className="w-32 rounded-md border border-aux-grey px-2 py-1 text-sm focus:border-primary focus:ring-primary focus:outline-none"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="%"
                                                        value={newMilestonePercentage}
                                                        onChange={(e) => setNewMilestonePercentage(e.target.value)}
                                                        className="w-20 rounded-md border border-aux-grey px-3 py-1 text-sm focus:border-primary focus:ring-primary focus:outline-none"
                                                        min="0"
                                                        max="100"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleAddMilestone}
                                                        className="bg-primary text-white p-1.5 rounded-md hover:bg-aux-red"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                <div className="space-y-2 mt-2">
                                                    {milestones.map((m) => (
                                                        <div key={m.id} className="flex justify-between items-center bg-white p-2 rounded border border-aux-grey/50 text-sm">
                                                            <span className="text-primary-dark">
                                                                {m.name}
                                                                {m.targetDate && <span className="text-xs text-primary-dark/60 ml-2">({new Date(m.targetDate).toLocaleDateString()})</span>}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-primary">{m.percentage}%</span>
                                                                <button type="button" onClick={() => handleRemoveMilestone(m.id)} className="text-aux-red hover:text-red-700">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {milestones.length === 0 && <p className="text-xs text-primary-dark/40 text-center">No hay hitos definidos.</p>}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {formData.revenueMethod === 'Linear' && (
                                        <div>
                                            <label className="block text-sm font-medium text-primary-dark">Ingreso Mensual Fijo (€)</label>
                                            <input
                                                type="number"
                                                value={formData.linearMonthlyAmount || ''}
                                                onChange={(e) => setFormData({ ...formData, linearMonthlyAmount: Number(e.target.value) })}
                                                className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none"
                                                min="0"
                                                step="0.01"
                                                required
                                            />
                                            <p className="text-xs text-primary-dark/60 mt-1">
                                                Calculado automáticamente: Presupuesto Total / Meses de duración
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full rounded-md bg-primary text-white px-4 py-2 hover:bg-aux-red disabled:opacity-50 font-medium"
                                    >
                                        {loading ? 'Actualizando...' : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="planning">
                    <div className="space-y-8">
                        <BudgetPlanner project={project} onUpdate={handleProjectUpdate} />
                        <div className="border-t pt-8">
                            <BillingPlanner project={project} onUpdate={handleProjectUpdate} />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

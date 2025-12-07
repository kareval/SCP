'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { projectService } from '@/services/projectService';
import { contractService } from '@/services/contractService';
import { Project, ProjectType, RevenueMethod, Milestone, Contract } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, Info, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/context/LanguageContext';

export default function NewProjectPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        clientId: '',
        contractId: '',
        type: 'TM' as ProjectType,
        budget: 0,
        description: '',
        revenueMethod: undefined as RevenueMethod | undefined,
        totalEstimatedCosts: 0,
        hourlyRate: 0,
        linearMonthlyAmount: 0,
        startDate: '',
        endDate: '',
        strategicScore: 0,
        expectedROI: 0,
        strategicBreakdown: {
            alignment: 0,
            innovation: 0,
            customerImpact: 0,
            viability: 0
        }
    });

    // Auto-calculate Total Strategic Score
    useEffect(() => {
        const { alignment, innovation, customerImpact, viability } = formData.strategicBreakdown;
        const total = alignment + innovation + customerImpact + viability;
        setFormData(prev => ({ ...prev, strategicScore: total }));
    }, [formData.strategicBreakdown]);

    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [newMilestoneName, setNewMilestoneName] = useState('');
    const [newMilestonePercentage, setNewMilestonePercentage] = useState('');
    const [newMilestoneDate, setNewMilestoneDate] = useState('');

    useEffect(() => {
        const fetchContracts = async () => {
            try {
                const data = await contractService.getContracts();
                setContracts(data.filter(c => c.status === 'Active'));
            } catch (error) {
                console.error("Error fetching contracts:", error);
            }
        };
        fetchContracts();
    }, []);

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
                const amount = formData.budget / months;
                setFormData(prev => ({ ...prev, linearMonthlyAmount: Number(amount.toFixed(2)) }));
            }
        }
    }, [formData.budget, formData.revenueMethod, formData.type, formData.startDate, formData.endDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const newProject: Project = {
                id: crypto.randomUUID(),
                title: formData.title,
                clientId: formData.clientId,
                contractId: formData.contractId || undefined,
                status: 'Budgeted',
                type: formData.type,
                budget: Number(formData.budget),
                justifiedAmount: 0,
                billedAmount: 0,
                completionPercentage: 0,
                isAdvance: false,
                budgetLines: [],
                revenueMethod: formData.type === 'Fixed' ? formData.revenueMethod : undefined,
                totalEstimatedCosts: (formData.type === 'Fixed' && formData.revenueMethod === 'Input') ? Number(formData.totalEstimatedCosts) : undefined,
                milestones: (formData.type === 'Fixed' && formData.revenueMethod === 'Output') ? milestones : undefined,
                linearMonthlyAmount: (formData.type === 'Fixed' && formData.revenueMethod === 'Linear') ? Number(formData.linearMonthlyAmount) : undefined,
                startDate: formData.startDate || undefined,
                endDate: formData.endDate || undefined,
                hourlyRate: formData.type === 'TM' ? Number(formData.hourlyRate) : undefined,
                strategicScore: Number(formData.strategicScore) || undefined,
                expectedROI: Number(formData.expectedROI) || undefined,
                strategicBreakdown: formData.strategicBreakdown
            };

            // Sanitize undefined values for Firestore
            const projectToSave = JSON.parse(JSON.stringify(newProject));
            await projectService.createProject(projectToSave);
            router.push('/projects');
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Error al crear el proyecto');
        } finally {
            setLoading(false);
        }
    };

    // Auto-fill Client ID when Contract is selected
    const handleContractChange = (contractId: string) => {
        const contract = contracts.find(c => c.id === contractId);
        setFormData({
            ...formData,
            contractId,
            clientId: contract ? contract.clientId : formData.clientId
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Link href="/projects" className="text-primary-dark/60 hover:text-primary-dark">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-3xl font-bold text-primary-dark">{t('projects.newProject')}</h1>
            </div>

            <Card className="max-w-4xl">
                <CardHeader>
                    <CardTitle className="text-primary-dark">{t('projects.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Tabs defaultValue="operational" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="operational">{t('projects.tabs.operational')}</TabsTrigger>
                                <TabsTrigger value="strategic">{t('projects.tabs.strategic')}</TabsTrigger>
                            </TabsList>

                            {/* TAB: Operational Management */}
                            <TabsContent value="operational" className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-primary-dark">{t('contracts.title')} (Opcional)</label>
                                    <select
                                        value={formData.contractId}
                                        onChange={(e) => handleContractChange(e.target.value)}
                                        className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none"
                                    >
                                        <option value="">{t('common.select')}</option>
                                        {contracts.map(c => (
                                            <option key={c.id} value={c.id}>{c.title} ({c.clientId})</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-primary-dark/60 mt-1">
                                        Vincular este proyecto a un contrato marco existente.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-primary-dark">{t('common.title')}</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-primary-dark">{t('contracts.form.client')}</label>
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
                                        <label className="block text-sm font-medium text-primary-dark">{t('projects.form.type')}</label>
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
                                                        Se factura por horas/gastos incurridos.
                                                        <br />
                                                        <strong>Revenue = Suma de horas x {formData.hourlyRate ? `${formData.hourlyRate}€/h` : 'Tarifa'}.</strong>
                                                    </AlertDescription>
                                                </Alert>
                                            ) : (
                                                <Alert className="bg-orange-50 border-orange-200">
                                                    <Info className="h-4 w-4 text-orange-600" />
                                                    <AlertTitle className="text-orange-800 text-xs font-bold">Precio Fijo</AlertTitle>
                                                    <AlertDescription className="text-orange-700 text-xs">
                                                        Presupuesto cerrado.
                                                        <br />Determinar método de ingreso.
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-primary-dark">{t('projects.form.budget')} (€)</label>
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

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-primary-dark">{t('contracts.form.startDate')}</label>
                                        <input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-primary-dark">{t('contracts.form.endDate')}</label>
                                        <input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none"
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
                                    </div>
                                )}

                                {formData.type === 'Fixed' && (
                                    <div className="border-t border-aux-grey pt-4 mt-4">
                                        <h3 className="text-lg font-medium text-primary-dark mb-4">{t('projects.form.revenueMethod')}</h3>

                                        <div className="mb-4">
                                            <select
                                                value={formData.revenueMethod || ''}
                                                onChange={(e) => setFormData({ ...formData, revenueMethod: (e.target.value as RevenueMethod) || undefined })}
                                                className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none"
                                            >
                                                <option value="">{t('common.select')}</option>
                                                <option value="Input">Input Method (Cost-to-Cost)</option>
                                                <option value="Output">Output Method (Milestones)</option>
                                                <option value="Linear">Lineal (Ingreso Fijo Mensual)</option>
                                            </select>
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
                                            </div>
                                        )}
                                    </div>
                                )}
                            </TabsContent>

                            {/* TAB: Strategic Management */}
                            <TabsContent value="strategic" className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-medium text-primary-dark">{t('projects.form.strategicInfo')}</h3>

                                        {/* Alignment (Max 30) */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <label className="text-sm font-medium text-primary-dark">{t('projects.form.criteria.alignment')}</label>
                                                <span className="text-sm font-bold text-primary">{formData.strategicBreakdown.alignment} / 30</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="30"
                                                value={formData.strategicBreakdown.alignment}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    strategicBreakdown: { ...formData.strategicBreakdown, alignment: Number(e.target.value) }
                                                })}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>

                                        {/* Innovation (Max 30) */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <label className="text-sm font-medium text-primary-dark">{t('projects.form.criteria.innovation')}</label>
                                                <span className="text-sm font-bold text-primary">{formData.strategicBreakdown.innovation} / 30</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="30"
                                                value={formData.strategicBreakdown.innovation}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    strategicBreakdown: { ...formData.strategicBreakdown, innovation: Number(e.target.value) }
                                                })}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>

                                        {/* Customer Impact (Max 20) */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <label className="text-sm font-medium text-primary-dark">{t('projects.form.criteria.customerImpact')}</label>
                                                <span className="text-sm font-bold text-primary">{formData.strategicBreakdown.customerImpact} / 20</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="20"
                                                value={formData.strategicBreakdown.customerImpact}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    strategicBreakdown: { ...formData.strategicBreakdown, customerImpact: Number(e.target.value) }
                                                })}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>

                                        {/* Viability (Max 20) */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <label className="text-sm font-medium text-primary-dark">{t('projects.form.criteria.viability')}</label>
                                                <span className="text-sm font-bold text-primary">{formData.strategicBreakdown.viability} / 20</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="20"
                                                value={formData.strategicBreakdown.viability}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    strategicBreakdown: { ...formData.strategicBreakdown, viability: Number(e.target.value) }
                                                })}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center h-full max-h-[300px]">
                                            <h4 className="text-sm font-medium text-primary-dark/60 uppercase tracking-wider mb-2">{t('projects.form.strategicScore')}</h4>
                                            <div className="text-5xl font-bold text-primary mb-2">{formData.strategicScore}</div>
                                            <div className="text-sm text-primary-dark/40">Total (0-100)</div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-primary-dark mb-1">{t('projects.form.roi')} (%)</label>
                                            <input
                                                type="number"
                                                value={formData.expectedROI}
                                                onChange={(e) => setFormData({ ...formData, expectedROI: Number(e.target.value) })}
                                                className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none"
                                                step="0.1"
                                                placeholder="Ej. 15.5"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="pt-4 border-t border-aux-grey mt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-md bg-primary text-white px-4 py-2 hover:bg-aux-red disabled:opacity-50 font-medium transition-colors"
                            >
                                {loading ? t('common.loading') : t('common.save')}
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

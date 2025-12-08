'use client';

import { useEffect, useState } from 'react';
import { projectService } from '@/services/projectService';
import { Project, Invoice, BillingForecastItem, WorkLog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { AlertCircle, CheckCircle, FileText, Plus, X, Calendar, DollarSign, Search, Filter, AlertTriangle, Download } from 'lucide-react';
import { generateMonthlyBreakdownPDF, generateInvoicePDF } from '@/lib/pdfGenerator';
import { useRole } from '@/context/RoleContext';
import { useTranslation } from '@/context/LanguageContext';

export default function BillingPage() {
    const { t } = useTranslation();
    const { role } = useRole();
    const [projects, setProjects] = useState<Project[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'invoices' | 'reconciliation'>('pending');
    const [showPdfDownload, setShowPdfDownload] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('feature_enablePdfGeneration');
        if (stored) setShowPdfDownload(JSON.parse(stored));
    }, []);

    // Invoice Form State
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        taxRate: 21,
        status: 'Draft',
        isAdvance: false
    });

    // WIP Invoice State
    const [isWipModalOpen, setIsWipModalOpen] = useState(false);
    const [projectLogs, setProjectLogs] = useState<WorkLog[]>([]);
    const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());

    const handleOpenWipModal = async (project: Project) => {
        setLoading(true);
        try {
            // Fetch logs just in time
            const logs = await projectService.getWorkLogs(project.id);
            // Filter unbilled logs
            const unbilled = logs.filter(l => !l.billedInvoiceId);
            setProjectLogs(unbilled);
            setSelectedLogIds(new Set(unbilled.map(l => l.id))); // Select all by default
            setSelectedProject(project);
            setIsWipModalOpen(true);

            // Pre-fill invoice data based on selection
            updateWipInvoiceData(unbilled, project);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const updateWipInvoiceData = (logs: WorkLog[], project: Project) => {
        const total = logs.reduce((acc, l) => acc + l.amount, 0);
        setNewInvoice({
            date: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            taxRate: 21,
            status: 'Draft',
            isAdvance: false,
            baseAmount: total,
            concept: `Servicios - ${logs.length} actividades hasta ${new Date().toLocaleDateString()}`,
            // We store the linked IDs temporarily in the invoice object creation flow or manage them separately
            // For simplicity, we'll access 'selectedLogIds' when saving
        });
    };

    const toggleLogSelection = (logId: string) => {
        const newSet = new Set(selectedLogIds);
        if (newSet.has(logId)) newSet.delete(logId);
        else newSet.add(logId);
        setSelectedLogIds(newSet);

        // Recalculate amount
        const selectedLogs = projectLogs.filter(l => newSet.has(l.id));
        if (selectedProject) updateWipInvoiceData(selectedLogs, selectedProject);
    };

    const handleCreateWipInvoice = async () => {
        if (!selectedProject || !newInvoice.baseAmount) return;

        const base = Number(newInvoice.baseAmount);
        const rate = newInvoice.taxRate || 21;
        const tax = base * (rate / 100);
        const total = base + tax;

        const invoice: Invoice = {
            id: crypto.randomUUID(),
            number: newInvoice.number || `DRAFT-${Date.now()}`, // Temporary number if not provided
            projectId: selectedProject.id,
            date: newInvoice.date!,
            dueDate: newInvoice.dueDate,

            baseAmount: base,
            taxRate: rate,
            taxAmount: tax,
            totalAmount: total,

            concept: newInvoice.concept || '',
            status: newInvoice.status as any,
            isAdvance: false,
            notes: `Generado desde WIP (${selectedLogIds.size} items)`,
            linkedWorkLogIds: Array.from(selectedLogIds)
        };

        try {
            await projectService.createInvoice(invoice);

            if (invoice.status === 'Sent' || invoice.status === 'Paid') {
                const updatedProject = {
                    ...selectedProject,
                    billedAmount: selectedProject.billedAmount + invoice.baseAmount
                };
                await projectService.updateProject(updatedProject);
            }

            setIsWipModalOpen(false);
            setSelectedProject(null);
            await fetchData();
        } catch (error) {
            console.error("Error creating WIP invoice:", error);
            alert("Error al crear factura WIP");
        }
    };

    const fetchData = async () => {
        try {
            const [projectsData, invoicesData] = await Promise.all([
                projectService.getProjects(),
                projectService.getInvoices()
            ]);
            setProjects(projectsData);
            setInvoices(invoicesData);
        } catch (error) {
            console.error("Error fetching billing data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // KPI Calculations
    const currentYear = new Date().getFullYear();
    const invoicedYTD = invoices
        .filter(i => new Date(i.date).getFullYear() === currentYear && i.status !== 'Draft')
        .reduce((acc, i) => acc + i.baseAmount, 0);

    const outstandingAmount = invoices
        .filter(i => i.status === 'Sent')
        .reduce((acc, i) => acc + i.totalAmount, 0);

    const overdueAmount = invoices
        .filter(i => i.status === 'Sent' && i.dueDate && new Date(i.dueDate) < new Date())
        .reduce((acc, i) => acc + i.totalAmount, 0);

    // Pending Billing Calculation (Forecast due + WIP)
    const pendingBilling = projects.reduce((acc, p) => {
        const wip = Math.max(0, p.justifiedAmount - p.billedAmount);
        const forecastDue = p.billingForecast
            ?.filter(f => new Date(f.date) <= new Date())
            .reduce((sum, f) => sum + f.amount, 0) || 0;
        return acc + (p.revenueMethod === 'Output' ? forecastDue : wip);
    }, 0);


    const handleCreateInvoice = async () => {
        if (!selectedProject || !newInvoice.baseAmount || !newInvoice.number) return;

        const base = Number(newInvoice.baseAmount);
        const rate = newInvoice.taxRate || 21;
        const tax = base * (rate / 100);
        const total = base + tax;

        const invoice: Invoice = {
            id: crypto.randomUUID(),
            number: newInvoice.number,
            projectId: selectedProject.id,
            date: newInvoice.date!,
            dueDate: newInvoice.dueDate,

            baseAmount: base,
            taxRate: rate,
            taxAmount: tax,
            totalAmount: total,

            concept: newInvoice.concept || `Servicios Profesionales - ${selectedProject.title}`,
            status: newInvoice.status as any,
            isAdvance: newInvoice.isAdvance || false,
            notes: newInvoice.notes
        };

        try {
            await projectService.createInvoice(invoice);

            // Update Project Billed Amount ONLY if Sent or Paid
            if (invoice.status === 'Sent' || invoice.status === 'Paid') {
                const updatedProject = {
                    ...selectedProject,
                    billedAmount: selectedProject.billedAmount + invoice.baseAmount
                };
                await projectService.updateProject(updatedProject);
            }

            setIsInvoiceModalOpen(false);
            setNewInvoice({
                date: new Date().toISOString().split('T')[0],
                dueDate: '',
                taxRate: 21,
                status: 'Draft',
                isAdvance: false
            });
            setSelectedProject(null);
            await fetchData();
        } catch (error) {
            console.error("Error creating invoice:", error);
            alert("Error al crear la factura");
        }
    };

    const openInvoiceModal = (project?: Project, forecastItem?: BillingForecastItem) => {
        if (project) {
            setSelectedProject(project);
            setNewInvoice(prev => ({
                ...prev,
                baseAmount: forecastItem ? forecastItem.amount : 0,
                concept: forecastItem ? forecastItem.notes : `Servicios - ${project.title}`,
                date: forecastItem ? forecastItem.date : new Date().toISOString().split('T')[0],
                // Auto-set due date to +30 days
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }));
        }
        setIsInvoiceModalOpen(true);
    };

    if (loading) return <div className="p-8">Cargando facturación...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-primary-dark">{t('billing.title')}</h1>
                <Button onClick={() => openInvoiceModal()} className="bg-primary text-white">
                    <Plus className="mr-2 h-4 w-4" /> {t('billing.newInvoice')}
                </Button>
            </div>

            {/* ... (Keep KPI Cards) ... */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-primary-dark/60">{t('billing.kpi.invoicedYtd')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary-dark">{invoicedYTD.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-primary-dark/60">{t('billing.kpi.outstanding')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-tertiary-blue">{outstandingAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-primary-dark/60">{t('billing.kpi.overdue')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-aux-red">{overdueAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 border-dashed border-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-primary-dark/60">{t('billing.kpi.forecast')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-600">{pendingBilling.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                    </CardContent>
                </Card>
            </div>


            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="pending">{t('billing.tabs.pending')}</TabsTrigger>
                    <TabsTrigger value="invoices">{t('billing.tabs.history')}</TabsTrigger>
                    <TabsTrigger value="reconciliation">{t('billing.tabs.reconciliation')}</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                    <div className="grid gap-4">
                        {projects.map(project => {
                            const pendingForecasts = project.billingForecast?.filter(f => !f.amount /* Logic to check if billed */) || [];
                            const upcomingForecasts = project.billingForecast?.filter(f => {
                                const date = new Date(f.date);
                                const today = new Date();
                                const nextMonth = new Date();
                                nextMonth.setDate(today.getDate() + 30);
                                return date <= nextMonth;
                            }) || [];

                            const wip = Math.max(0, project.justifiedAmount - project.billedAmount);

                            if (upcomingForecasts.length === 0 && wip < 100) return null;

                            return (
                                <Card key={project.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between">
                                            <div>
                                                <CardTitle className="text-lg">{project.title}</CardTitle>
                                                <CardDescription>{project.clientId} - {project.type}</CardDescription>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">WIP (Trabajo no facturado)</p>
                                                <p className="font-bold text-lg text-primary">{wip.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Forecasts List */}
                                        {upcomingForecasts.length > 0 && (
                                            <div className="mb-4">
                                                <h4 className="text-sm font-medium mb-2 text-primary-dark/80">Hitos / Previsiones Próximas</h4>
                                                <div className="space-y-2">
                                                    {upcomingForecasts.map(item => (
                                                        <div key={item.id} className="flex justify-between items-center p-2 bg-slate-50 rounded border text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                                <span>{new Date(item.date).toLocaleDateString()}</span>
                                                                <span className="text-slate-500">- {item.notes}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold">{item.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                                                                <Button size="sm" variant="outline" onClick={() => openInvoiceModal(project, item)}>Generar</Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-2">
                                            {project.type !== 'Fixed' && wip > 0 && (
                                                <Button onClick={() => handleOpenWipModal(project)} variant="default" className="bg-primary">
                                                    Facturar WIP ({wip.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€)
                                                </Button>
                                            )}
                                            <Button onClick={() => openInvoiceModal(project)} variant="secondary">Crear Factura Manual</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>

                <TabsContent value="invoices">
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Facturas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-muted-foreground">
                                        <tr>
                                            <th className="p-3 font-medium">{t('billing.table.number')}</th>
                                            <th className="p-3 font-medium">{t('billing.table.date')}</th>
                                            <th className="p-3 font-medium">{t('billing.table.project')}</th>
                                            <th className="p-3 font-medium">{t('billing.table.concept')}</th>
                                            <th className="p-3 font-medium text-right">{t('billing.table.amount')}</th>
                                            <th className="p-3 font-medium text-center">{t('billing.table.status')}</th>
                                            <th className="p-3 font-medium text-center">{t('billing.table.dueDate')}</th>
                                            {showPdfDownload && <th className="p-3 font-medium text-center">{t('billing.table.pdf')}</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoices.map(invoice => {
                                            const project = projects.find(p => p.id === invoice.projectId);
                                            const isOverdue = invoice.status === 'Sent' && invoice.dueDate && new Date(invoice.dueDate) < new Date();
                                            return (
                                                <tr key={invoice.id} className="border-t hover:bg-muted/50">
                                                    <td className="p-3 font-medium">{invoice.number}</td>
                                                    <td className="p-3">{new Date(invoice.date).toLocaleDateString()}</td>
                                                    <td className="p-3">{project?.title || 'Sin Proyecto'}</td>
                                                    <td className="p-3 truncate max-w-[200px]">{invoice.concept || '-'}</td>
                                                    <td className="p-3 text-right font-bold">{invoice.baseAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                    <td className="p-3 text-center">
                                                        <Badge className={
                                                            invoice.status === 'Paid' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                                                                invoice.status === 'Sent' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                                                                    'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                                        }>
                                                            {invoice.status === 'Paid' ? t('billing.status.paid') : invoice.status === 'Sent' ? t('billing.status.sent') : t('billing.status.draft')}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        {isOverdue ? (
                                                            <span className="text-red-600 font-bold flex items-center justify-center gap-1">
                                                                <AlertCircle className="h-3 w-3" /> {new Date(invoice.dueDate!).toLocaleDateString()}
                                                            </span>
                                                        ) : (
                                                            invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'
                                                        )}
                                                    </td>
                                                    {showPdfDownload && (
                                                        <td className="p-3 text-center">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => project && generateInvoicePDF(invoice, project)}
                                                                title={t('billing.actions.downloadPdf')}
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reconciliation">
                    <div className="grid gap-4">
                        {projects.map(project => {
                            const projectInvoices = invoices.filter(i => i.projectId === project.id && i.status !== 'Draft');
                            const totalBilled = projectInvoices.reduce((acc, i) => acc + i.baseAmount, 0);
                            const discrepancy = project.justifiedAmount - totalBilled;
                            const wip = Math.max(0, discrepancy);
                            const deferred = Math.max(0, -discrepancy);

                            return (
                                <Card key={project.id}>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <div>
                                            <CardTitle className="text-lg text-primary-dark">{project.title}</CardTitle>
                                            <p className="text-sm text-primary-dark/60">{project.clientId}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {discrepancy === 0 ? (
                                                <Badge className="bg-secondary-teal text-white"><CheckCircle className="h-3 w-3 mr-1" /> Conciliado</Badge>
                                            ) : wip > 0 ? (
                                                <Badge className="bg-aux-red text-white"><AlertCircle className="h-3 w-3 mr-1" /> WIP (Pendiente Facturar)</Badge>
                                            ) : (
                                                <Badge className="bg-tertiary-blue text-white"><AlertTriangle className="h-3 w-3 mr-1" /> Deferred (Anticipo)</Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Revenue (Devengado)</p>
                                                <p className="font-bold text-lg">{project.justifiedAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Facturado (Enviado/Pagado)</p>
                                                <p className="font-bold text-lg">{totalBilled.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Posición Contable</p>
                                                <p className={`font-bold text-lg ${wip > 0 ? 'text-aux-red' : deferred > 0 ? 'text-tertiary-blue' : 'text-green-600'}`}>
                                                    {wip > 0 ? `+${wip.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} (Activo)` :
                                                        deferred > 0 ? `-${deferred.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} (Pasivo)` :
                                                            '0,00 €'}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Create Invoice Modal (Manual / Forecast) */}
            <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Crear Nueva Factura</DialogTitle>
                        <DialogDescription>
                            Registra una nueva factura para el proyecto.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="col-span-2">
                            <Label>Proyecto</Label>
                            <select
                                className="w-full rounded-md border border-input px-3 py-2 text-sm"
                                value={selectedProject?.id || ''}
                                onChange={(e) => setSelectedProject(projects.find(p => p.id === e.target.value) || null)}
                            >
                                <option value="">Seleccionar Proyecto...</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.title}</option>
                                ))}
                            </select>
                        </div>
                        {/* ... Existing fields ... */}
                        <div>
                            <Label>Nº Factura</Label>
                            <Input
                                value={newInvoice.number || ''}
                                onChange={(e) => setNewInvoice({ ...newInvoice, number: e.target.value })}
                                placeholder="F-2024-XXX"
                            />
                        </div>

                        <div>
                            <Label>Estado</Label>
                            <select
                                className="w-full rounded-md border border-input px-3 py-2 text-sm"
                                value={newInvoice.status}
                                onChange={(e) => setNewInvoice({ ...newInvoice, status: e.target.value as any })}
                            >
                                <option value="Draft">Borrador</option>
                                <option value="Sent">Enviada</option>
                                <option value="Paid">Pagada</option>
                            </select>
                        </div>

                        <div>
                            <Label>Fecha Emisión</Label>
                            <Input
                                type="date"
                                value={newInvoice.date}
                                onChange={(e) => setNewInvoice({ ...newInvoice, date: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label>Fecha Vencimiento</Label>
                            <Input
                                type="date"
                                value={newInvoice.dueDate}
                                onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2">
                            <Label>Concepto</Label>
                            <Input
                                value={newInvoice.concept || ''}
                                onChange={(e) => setNewInvoice({ ...newInvoice, concept: e.target.value })}
                                placeholder="Descripción de los servicios..."
                            />
                        </div>

                        <div>
                            <Label>Importe Base (€)</Label>
                            <Input
                                type="number"
                                value={newInvoice.baseAmount || ''}
                                onChange={(e) => setNewInvoice({ ...newInvoice, baseAmount: Number(e.target.value) })}
                            />
                        </div>

                        <div>
                            <Label>IVA (%)</Label>
                            <Input
                                type="number"
                                value={newInvoice.taxRate}
                                onChange={(e) => setNewInvoice({ ...newInvoice, taxRate: Number(e.target.value) })}
                            />
                        </div>

                        <div className="col-span-2 flex items-center space-x-2 pt-2">
                            <input
                                type="checkbox"
                                id="isAdvance"
                                checked={newInvoice.isAdvance}
                                onChange={(e) => setNewInvoice({ ...newInvoice, isAdvance: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="isAdvance" className="cursor-pointer font-medium">
                                ¿Es un Anticipo? (Genera Ingreso Diferido)
                            </Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsInvoiceModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateInvoice} disabled={!selectedProject || !newInvoice.baseAmount}>Guardar Factura</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* NEW: Bill WIP Modal */}
            <Dialog open={isWipModalOpen} onOpenChange={setIsWipModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Facturar WIP - {selectedProject?.title}</DialogTitle>
                        <DialogDescription>
                            Selecciona las actividades pendientes para incluirlas en la factura.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="border rounded-md max-h-[300px] overflow-y-auto bg-slate-50 p-2">
                            {projectLogs.length === 0 ? (
                                <p className="text-center text-muted-foreground p-4">No hay actividad pendiente de facturar.</p>
                            ) : (
                                projectLogs.map(log => (
                                    <div key={log.id} className="flex items-center space-x-3 p-2 border-b last:border-0 hover:bg-slate-100">
                                        <input
                                            type="checkbox"
                                            checked={selectedLogIds.has(log.id)}
                                            onChange={() => toggleLogSelection(log.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <div className="flex-1 text-sm">
                                            <div className="font-medium">{log.concept}</div>
                                            <div className="text-muted-foreground text-xs">{new Date(log.date).toLocaleDateString()} {log.hours ? `(${log.hours}h)` : ''}</div>
                                        </div>
                                        <div className="font-bold text-sm">
                                            {log.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            {/* Simplified Invoice Form for WIP */}
                            <div>
                                <Label>Nº Factura</Label>
                                <Input
                                    value={newInvoice.number || ''}
                                    onChange={(e) => setNewInvoice({ ...newInvoice, number: e.target.value })}
                                    placeholder="F-2024-XXX"
                                />
                            </div>
                            <div>
                                <Label>Fecha Vencimiento (+30 días)</Label>
                                <Input
                                    type="date"
                                    value={newInvoice.dueDate}
                                    onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                                />
                            </div>
                            <div className="col-span-2">
                                <Label>Concepto Factura</Label>
                                <Input
                                    value={newInvoice.concept || ''}
                                    onChange={(e) => setNewInvoice({ ...newInvoice, concept: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center bg-primary/5 p-4 rounded-md">
                            <span className="font-bold text-lg text-primary-dark">Total Base Seleccionado:</span>
                            <span className="font-bold text-2xl text-primary">
                                {Number(newInvoice.baseAmount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                            </span>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsWipModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateWipInvoice} disabled={selectedLogIds.size === 0 || !newInvoice.number}>
                            Generar Factura ({selectedLogIds.size} items)
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

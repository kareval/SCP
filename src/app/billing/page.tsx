'use client';

import { useEffect, useState } from 'react';
import { projectService } from '@/services/projectService';
import { Project, Invoice, BillingForecastItem } from '@/types';
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
import { AlertCircle, CheckCircle, FileText, Plus, X, Calendar, DollarSign, Search, Filter, AlertTriangle } from 'lucide-react';
import { generateMonthlyBreakdownPDF } from '@/lib/pdfGenerator';
import { useRole } from '@/context/RoleContext';

export default function BillingPage() {
    const { role } = useRole();
    const [projects, setProjects] = useState<Project[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'invoices' | 'reconciliation'>('pending');

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
        .reduce((acc, i) => acc + i.amount, 0);

    const outstandingAmount = invoices
        .filter(i => i.status === 'Sent')
        .reduce((acc, i) => acc + i.amount, 0);

    const overdueAmount = invoices
        .filter(i => i.status === 'Sent' && i.dueDate && new Date(i.dueDate) < new Date())
        .reduce((acc, i) => acc + i.amount, 0);

    // Pending Billing Calculation (Forecast due + WIP)
    // This is a simplified estimation
    const pendingBilling = projects.reduce((acc, p) => {
        const wip = Math.max(0, p.justifiedAmount - p.billedAmount);
        const forecastDue = p.billingForecast
            ?.filter(f => new Date(f.date) <= new Date())
            .reduce((sum, f) => sum + f.amount, 0) || 0;
        // We take the max of WIP or Forecast as a rough "Ready to Bill" indicator, 
        // or just sum WIP if we want to be conservative about work done.
        // Let's use WIP as the primary driver for "Ready to Bill" in T&M/Input, and Forecast for Output.
        return acc + (p.revenueMethod === 'Output' ? forecastDue : wip);
    }, 0);


    const handleCreateInvoice = async () => {
        if (!selectedProject || !newInvoice.amount || !newInvoice.number) return;

        const invoice: Invoice = {
            id: crypto.randomUUID(),
            number: newInvoice.number,
            projectId: selectedProject.id,
            date: newInvoice.date!,
            dueDate: newInvoice.dueDate,
            amount: Number(newInvoice.amount),
            taxRate: newInvoice.taxRate || 21,
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
                    billedAmount: selectedProject.billedAmount + invoice.amount
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
                amount: forecastItem ? forecastItem.amount : 0,
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
                <h1 className="text-3xl font-bold text-primary-dark">Facturación</h1>
                <Button onClick={() => openInvoiceModal()} className="bg-primary text-white">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Factura
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-primary-dark/60">Facturado Año Actual</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary-dark">{invoicedYTD.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-primary-dark/60">Pendiente de Cobro</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-tertiary-blue">{outstandingAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-primary-dark/60">Vencido</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-aux-red">{overdueAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 border-dashed border-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-primary-dark/60">Estimado a Facturar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-600">{pendingBilling.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="pending">Pendiente de Facturar</TabsTrigger>
                    <TabsTrigger value="invoices">Facturas</TabsTrigger>
                    <TabsTrigger value="reconciliation">Conciliación</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                    <div className="grid gap-4">
                        {projects.map(project => {
                            const pendingForecasts = project.billingForecast?.filter(f => !f.amount /* Logic to check if billed? For now just show all future */) || [];
                            // Better logic: Show items with date <= today + 30 days
                            const upcomingForecasts = project.billingForecast?.filter(f => {
                                const date = new Date(f.date);
                                const today = new Date();
                                const nextMonth = new Date();
                                nextMonth.setDate(today.getDate() + 30);
                                return date <= nextMonth;
                            }) || [];

                            const wip = Math.max(0, project.justifiedAmount - project.billedAmount);

                            if (upcomingForecasts.length === 0 && wip < 100) return null; // Skip if nothing to bill

                            return (
                                <Card key={project.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between">
                                            <div>
                                                <CardTitle className="text-lg">{project.title}</CardTitle>
                                                <CardDescription>{project.clientId}</CardDescription>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">WIP (Trabajo no facturado)</p>
                                                <p className="font-bold text-lg text-primary">{wip.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
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
                                        <div className="flex justify-end">
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
                                            <th className="p-3 font-medium">Nº Factura</th>
                                            <th className="p-3 font-medium">Fecha</th>
                                            <th className="p-3 font-medium">Proyecto</th>
                                            <th className="p-3 font-medium">Concepto</th>
                                            <th className="p-3 font-medium text-right">Importe</th>
                                            <th className="p-3 font-medium text-center">Estado</th>
                                            <th className="p-3 font-medium text-center">Vencimiento</th>
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
                                                    <td className="p-3 text-right font-bold">{invoice.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                    <td className="p-3 text-center">
                                                        <Badge className={
                                                            invoice.status === 'Paid' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                                                                invoice.status === 'Sent' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                                                                    'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                                        }>
                                                            {invoice.status === 'Paid' ? 'Pagada' : invoice.status === 'Sent' ? 'Enviada' : 'Borrador'}
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
                            const totalBilled = projectInvoices.reduce((acc, i) => acc + i.amount, 0);
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
                                                <p className="text-muted-foreground">Revenue (Justificado)</p>
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

            {/* Create Invoice Modal */}
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
                                value={newInvoice.amount || ''}
                                onChange={(e) => setNewInvoice({ ...newInvoice, amount: Number(e.target.value) })}
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
                        <Button onClick={handleCreateInvoice} disabled={!selectedProject || !newInvoice.amount}>Guardar Factura</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

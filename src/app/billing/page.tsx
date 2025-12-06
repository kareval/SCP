'use client';

import { useEffect, useState } from 'react';
import { projectService } from '@/services/projectService';
import { Project, Invoice } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, FileText, Plus, X } from 'lucide-react';
import { generateMonthlyBreakdownPDF } from '@/lib/pdfGenerator';
import { useRole } from '@/context/RoleContext';

export default function BillingPage() {
    const { role } = useRole();
    const [projects, setProjects] = useState<Project[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'reconciliation' | 'advances'>('reconciliation');

    // Billing Form State
    const [billingProjectId, setBillingProjectId] = useState<string | null>(null);
    const [invoiceAmount, setInvoiceAmount] = useState<string>('');
    const [invoiceId, setInvoiceId] = useState<string>('');

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

    const handleRegisterInvoice = async (project: Project) => {
        if (!invoiceAmount || !invoiceId) return;

        const amount = Number(invoiceAmount);
        const newInvoice: Invoice = {
            id: crypto.randomUUID(), // Internal ID
            number: invoiceId, // Actual Invoice Number
            projectId: project.id,
            amount: amount,
            date: new Date().toISOString().split('T')[0],
            status: 'Paid', // Default to Paid for simplicity
            isAdvance: false
        };

        try {
            await projectService.createInvoice(newInvoice);

            // Update Project Billed Amount
            const updatedProject = {
                ...project,
                billedAmount: project.billedAmount + amount
            };
            await projectService.updateProject(updatedProject);

            // Reset Form and Refresh
            setBillingProjectId(null);
            setInvoiceAmount('');
            setInvoiceId('');
            await fetchData();
        } catch (error) {
            console.error("Error registering invoice:", error);
            alert("Error al registrar la factura");
        }
    };

    if (loading) return <div className="p-8">Cargando facturación...</div>;

    const projectsToReconcile = projects.filter(p =>
        p.status === 'In Progress' ||
        p.status === 'Justified' ||
        p.status === 'Accepted' ||
        p.status === 'Billed'
    );
    const advanceProjects = projects.filter(p => p.isAdvance);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-primary-dark">Facturación y Conciliación</h1>
                <div className="flex space-x-2">
                    <button
                        onClick={() => {
                            setBillingProjectId('NEW'); // Special flag for new invoice
                            setInvoiceAmount('');
                            setInvoiceId('');
                        }}
                        className="flex items-center px-4 py-2 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary-dark"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Registrar Nueva Factura
                    </button>
                    <button
                        onClick={() => setActiveTab('reconciliation')}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'reconciliation' ? 'bg-primary-dark text-white' : 'bg-white text-primary-dark border'}`}
                    >
                        Conciliación
                    </button>
                    <button
                        onClick={() => setActiveTab('advances')}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'advances' ? 'bg-primary-dark text-white' : 'bg-white text-primary-dark border'}`}
                    >
                        Anticipos
                    </button>
                </div>
            </div>

            {/* Global Invoice Form Modal/Panel */}
            {billingProjectId === 'NEW' && (
                <Card className="border-primary border-2 shadow-lg mb-6">
                    <CardHeader className="pb-2 bg-primary/5">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-primary-dark">Registrar Nueva Factura</CardTitle>
                            <button onClick={() => setBillingProjectId(null)} className="text-primary-dark/60 hover:text-primary-dark">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-primary-dark mb-1">Proyecto</label>
                                <select
                                    className="w-full rounded-md border border-aux-grey px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                                    onChange={(e) => {
                                        // We store the project ID in a separate state or just use the form data directly if we refactor.
                                        // For now, let's use a temp state or just hack it into the existing flow.
                                        // Actually, let's add a state for selected project in this "NEW" mode.
                                        // But wait, handleRegisterInvoice expects a Project object.
                                        // Let's store the selected project ID in a new state variable `selectedProjectForInvoice`.
                                    }}
                                    // We need a new state for this dropdown. Let's add it in the next step or assume we have it.
                                    // For now, I'll add the UI and then update the state logic.
                                    id="project-select"
                                >
                                    <option value="">-- Seleccionar Proyecto --</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.title} ({p.clientId})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-primary-dark mb-1">Nº Factura</label>
                                <input
                                    type="text"
                                    value={invoiceId}
                                    onChange={(e) => setInvoiceId(e.target.value)}
                                    className="w-full rounded-md border border-aux-grey px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                                    placeholder="F-2024-XXX"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-primary-dark mb-1">Importe (€)</label>
                                <input
                                    type="number"
                                    value={invoiceAmount}
                                    onChange={(e) => setInvoiceAmount(e.target.value)}
                                    className="w-full rounded-md border border-aux-grey px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => {
                                    const select = document.getElementById('project-select') as HTMLSelectElement;
                                    const projectId = select.value;
                                    const project = projects.find(p => p.id === projectId);
                                    if (project) {
                                        handleRegisterInvoice(project);
                                    } else {
                                        alert("Por favor seleccione un proyecto");
                                    }
                                }}
                                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark font-medium"
                            >
                                Guardar Factura
                            </button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'reconciliation' && (
                <div className="grid gap-4">
                    {projectsToReconcile.map((project) => {
                        const projectInvoices = invoices.filter(i => i.projectId === project.id);
                        const totalBilled = projectInvoices.reduce((acc, i) => acc + i.amount, 0);
                        const discrepancy = project.justifiedAmount - totalBilled;
                        const isMatch = discrepancy === 0;
                        const isBillingThis = billingProjectId === project.id;

                        return (
                            <Card key={project.id}>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div>
                                        <CardTitle className="text-lg text-primary-dark">{project.title}</CardTitle>
                                        <p className="text-sm text-primary-dark/60">{project.clientId}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {isMatch ? (
                                            <Badge className="flex items-center gap-1 bg-secondary-teal text-white">
                                                <CheckCircle className="h-3 w-3" /> Conciliado
                                            </Badge>
                                        ) : (
                                            <Badge className="flex items-center gap-1 bg-aux-red text-white">
                                                <AlertCircle className="h-3 w-3" /> Desviación: {discrepancy.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-4 gap-4 text-sm items-center">
                                        <div>
                                            <p className="text-primary-dark/60">Justificado</p>
                                            <p className="font-bold text-lg text-primary-dark">{project.justifiedAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                                        </div>
                                        <div>
                                            <p className="text-primary-dark/60">Facturado</p>
                                            <p className="font-bold text-lg text-primary-dark">{totalBilled.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                                        </div>
                                        <div className="col-span-2 flex justify-end space-x-2">
                                            <button
                                                onClick={() => generateMonthlyBreakdownPDF(project, invoices.filter(i => i.projectId === project.id))}
                                                className="flex items-center px-3 py-1 text-sm border rounded hover:bg-aux-grey/20 text-primary-dark"
                                            >
                                                <FileText className="mr-2 h-4 w-4" />
                                                Ver Desglose Mensual
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setBillingProjectId(isBillingThis ? null : project.id);
                                                    setInvoiceAmount(discrepancy > 0 ? discrepancy.toString() : '');
                                                }}
                                                className="flex items-center px-3 py-1 text-sm bg-primary-dark text-white rounded hover:bg-primary"
                                            >
                                                {isBillingThis ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                                                {isBillingThis ? 'Cancelar' : 'Registrar Factura'}
                                            </button>
                                        </div>
                                    </div>

                                    {isBillingThis && (
                                        <div className="mt-4 p-4 bg-aux-grey/20 rounded-md border border-aux-grey">
                                            <h4 className="font-medium mb-2 text-primary-dark">Nueva Factura</h4>
                                            <div className="flex gap-4 items-end">
                                                <div>
                                                    <label className="block text-xs font-medium text-primary-dark/60">Nº Factura</label>
                                                    <input
                                                        type="text"
                                                        value={invoiceId}
                                                        onChange={(e) => setInvoiceId(e.target.value)}
                                                        className="mt-1 block w-32 rounded-md border border-aux-grey px-2 py-1 text-sm focus:border-primary focus:ring-primary"
                                                        placeholder="F-2024-001"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-primary-dark/60">Importe (€)</label>
                                                    <input
                                                        type="number"
                                                        value={invoiceAmount}
                                                        onChange={(e) => setInvoiceAmount(e.target.value)}
                                                        className="mt-1 block w-32 rounded-md border border-aux-grey px-2 py-1 text-sm focus:border-primary focus:ring-primary"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleRegisterInvoice(project)}
                                                    className="px-3 py-1.5 bg-primary text-white text-sm rounded hover:bg-aux-red"
                                                >
                                                    Guardar
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                    {projectsToReconcile.length === 0 && (
                        <div className="text-center py-10 text-primary-dark/60">
                            No hay proyectos pendientes de conciliación.
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'advances' && (
                <div className="grid gap-4">
                    {advanceProjects.map((project) => (
                        <Card key={project.id} className="border-tertiary-blue bg-tertiary-blue/10">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle className="text-lg text-primary-dark">{project.title}</CardTitle>
                                    <p className="text-sm text-tertiary-blue">{project.clientId}</p>
                                </div>
                                <Badge className="bg-tertiary-blue hover:bg-tertiary-blue/80">Anticipo</Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-tertiary-blue">Total Facturado (Anticipado)</p>
                                        <p className="font-bold text-lg text-primary-dark">{project.billedAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                                    </div>
                                    <div>
                                        <p className="text-tertiary-blue">Trabajo Realizado</p>
                                        <p className="font-bold text-lg text-primary-dark">{project.justifiedAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                                    </div>
                                    <div>
                                        <p className="text-tertiary-blue">Saldo a favor Cliente</p>
                                        <p className="font-bold text-lg text-primary-dark">{(project.billedAmount - project.justifiedAmount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

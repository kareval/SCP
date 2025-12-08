'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { contractService } from '@/services/contractService';
import { Contract } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Info, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/context/LanguageContext';

export default function EditContractClient({ id }: { id: string }) {
    const router = useRouter();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [contract, setContract] = useState<Contract | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        code: '',
        clientId: '',
        tcv: 0,
        acquisitionCost: 0,
        startDate: '',
        endDate: '',
        status: 'Active' as 'Active' | 'Closed'
    });

    useEffect(() => {
        const fetchContract = async () => {
            try {
                const contracts = await contractService.getContracts();
                const found = contracts.find(c => c.id === id);
                if (found) {
                    setContract(found);
                    setFormData({
                        title: found.title,
                        code: found.code || '',
                        clientId: found.clientId,
                        tcv: found.tcv,
                        acquisitionCost: found.acquisitionCost || 0,
                        startDate: found.startDate,
                        endDate: found.endDate,
                        status: found.status
                    });
                } else {
                    alert('Contrato no encontrado');
                    router.push('/contracts');
                }
            } catch (error) {
                console.error("Error fetching contract:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchContract();
    }, [id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contract) return;
        setLoading(true);

        try {
            const updatedContract: Contract = {
                ...contract,
                title: formData.title,
                code: formData.code || null,
                clientId: formData.clientId,
                tcv: Number(formData.tcv),
                acquisitionCost: Number(formData.acquisitionCost),
                startDate: formData.startDate,
                endDate: formData.endDate,
                status: formData.status
            };

            await contractService.updateContract(updatedContract);
            router.push('/contracts');
        } catch (error) {
            console.error('Error updating contract:', error);
            alert('Error al actualizar el contrato');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">{t('common.loading')}</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Link href="/contracts" className="text-primary-dark/60 hover:text-primary-dark">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-3xl font-bold text-primary-dark">{t('common.edit')} {t('contracts.title').slice(0, -1)}</h1>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-primary-dark">{t('contracts.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Tabs defaultValue="general" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="general">{t('contracts.form.tabs.general')}</TabsTrigger>
                                <TabsTrigger value="strategic">{t('contracts.form.tabs.strategic')}</TabsTrigger>
                            </TabsList>

                            {/* TAB: General Data */}
                            <TabsContent value="general" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-medium text-primary-dark">Código (Opcional)</label>
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none"
                                            placeholder="C-2024-001"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-primary-dark">Título</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none"
                                            required
                                        />
                                    </div>
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

                                <div>
                                    <label className="block text-sm font-medium text-primary-dark">{t('contracts.form.tcv')}</label>
                                    <input
                                        type="number"
                                        value={formData.tcv}
                                        onChange={(e) => setFormData({ ...formData, tcv: Number(e.target.value) })}
                                        className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none"
                                        min="0"
                                        step="0.01"
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
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-primary-dark">Fecha Fin</label>
                                        <input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-primary-dark">Estado</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Closed' })}
                                        className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none"
                                    >
                                        <option value="Active">{t('common.active')}</option>
                                        <option value="Closed">{t('common.closed')}</option>
                                    </select>
                                </div>
                            </TabsContent>

                            {/* TAB: Strategic / Efficiency */}
                            <TabsContent value="strategic" className="space-y-6">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <label className="block text-sm font-medium text-primary-dark">{t('contracts.form.cac')}</label>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger><Info className="h-4 w-4 text-primary-dark/40" /></TooltipTrigger>
                                                <TooltipContent><p>Inversión comercial necesaria para ganar este contrato.</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <input
                                        type="number"
                                        value={formData.acquisitionCost}
                                        onChange={(e) => setFormData({ ...formData, acquisitionCost: Number(e.target.value) })}
                                        className="mt-1 block w-full rounded-md border border-aux-grey px-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <HelpCircle className="h-5 w-5 text-tertiary-blue" />
                                        <h3 className="text-sm font-bold text-tertiary-blue">Guía de Conceptos: Eficiencia Comercial</h3>
                                    </div>
                                    <div className="space-y-4 text-sm text-primary-dark/80">
                                        <div>
                                            <p className="font-bold text-primary-dark">LTV (Lifetime Value) ≈ TCV</p>
                                            <p>Valor total que el cliente aporta durante la vida del contrato. En este contexto, usamos el <strong>Valor Total del Contrato (TCV)</strong> como proxy.</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-primary-dark">CAC (Customer Acquisition Cost)</p>
                                            <p>Total gastado en ventas y marketing para conseguir este cliente/contrato específico.</p>
                                        </div>
                                        <div className="bg-white p-3 rounded-md border border-blue-100">
                                            <p className="font-bold text-primary-dark mb-1">Ratio de Eficiencia (LTV:CAC)</p>
                                            <p className="mb-2">Mide cuántas veces recuperas la inversión de captación.</p>
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li><span className="text-green-600 font-bold">Ratio {'>'} 3:</span> Saludable. El cliente genera 3€ por cada 1€ invertido.</li>
                                                <li><span className="text-orange-600 font-bold">Ratio 1-3:</span> Margen bajo. Vigilar costes.</li>
                                                <li><span className="text-red-600 font-bold">Ratio {'<'} 1:</span> Pérdidas. Cuesta más captar al cliente que lo que paga.</li>
                                            </ul>
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
        </div >
    );
}

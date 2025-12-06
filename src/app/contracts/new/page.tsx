'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { contractService } from '@/services/contractService';
import { Contract } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewContractPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        code: '',
        clientId: '',
        tcv: 0,
        startDate: '',
        endDate: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const newContract: Contract = {
                id: crypto.randomUUID(),
                title: formData.title,
                code: formData.code || undefined,
                clientId: formData.clientId,
                tcv: Number(formData.tcv),
                startDate: formData.startDate,
                endDate: formData.endDate,
                status: 'Active'
            };

            await contractService.createContract(newContract);
            router.push('/contracts');
        } catch (error) {
            console.error('Error creating contract:', error);
            alert('Error al crear el contrato');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Link href="/contracts" className="text-primary-dark/60 hover:text-primary-dark">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-3xl font-bold text-primary-dark">Nuevo Contrato</h1>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-primary-dark">Datos del Contrato</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                <label className="block text-sm font-medium text-primary-dark">Título del Contrato</label>
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
                            <label className="block text-sm font-medium text-primary-dark">TCV (Total Contract Value) €</label>
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

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-md bg-primary text-white px-4 py-2 hover:bg-aux-red disabled:opacity-50 font-medium"
                            >
                                {loading ? 'Creando...' : 'Crear Contrato'}
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

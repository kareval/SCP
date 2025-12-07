'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { contractService } from '@/services/contractService';
import { Contract } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Trash2, Pencil } from 'lucide-react';

export default function ContractsPage() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContracts = async () => {
            try {
                const data = await contractService.getContracts();
                setContracts(data);
            } catch (error) {
                console.error("Error fetching contracts:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchContracts();
    }, []);

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de que quieres eliminar este contrato?')) {
            try {
                await contractService.deleteContract(id);
                setContracts(contracts.filter(c => c.id !== id));
            } catch (error) {
                console.error("Error deleting contract:", error);
                alert("Error al eliminar el contrato");
            }
        }
    };

    if (loading) return <div className="p-8">Cargando contratos...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-primary-dark">Contratos Marco</h1>
                    <p className="text-primary-dark/60">Gestión de contratos y TCV</p>
                </div>
                <Link
                    href="/contracts/new"
                    className="flex items-center bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Contrato
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contracts.map((contract) => (
                    <Card key={contract.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="truncate pr-4">
                                {contract.code && (
                                    <p className="text-xs font-mono text-primary-dark/60 mb-1">{contract.code}</p>
                                )}
                                <CardTitle className="text-lg font-bold text-primary-dark truncate" title={contract.title}>
                                    {contract.title}
                                </CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link href={`/contracts/edit/${contract.id}`}>
                                    <button
                                        className="p-1 text-primary-dark hover:bg-primary-dark/10 rounded-full transition-colors"
                                        title="Editar Contrato"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                </Link>
                                <button
                                    onClick={() => handleDelete(contract.id)}
                                    className="p-1 text-aux-red hover:bg-aux-red/10 rounded-full transition-colors"
                                    title="Eliminar Contrato"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-primary-dark/60">Cliente:</span>
                                    <span className="font-medium text-primary-dark">{contract.clientId}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-primary-dark/60">TCV:</span>
                                    <span className="font-bold text-primary">
                                        {contract.tcv.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-primary-dark/60">Vigencia:</span>
                                    <span className="text-primary-dark/80 text-xs">
                                        {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="pt-2 flex items-center justify-between">
                                    <Badge variant={contract.status === 'Active' ? 'default' : 'secondary'} className={contract.status === 'Active' ? 'bg-secondary-teal' : ''}>
                                        {contract.status === 'Active' ? 'Activo' : 'Cerrado'}
                                    </Badge>

                                    {contract.acquisitionCost && contract.acquisitionCost > 0 && (
                                        <div className="flex items-center gap-1" title="Ratio LTV:CAC (Objetivo > 3)">
                                            <span className="text-xs text-primary-dark/60">Eficiencia:</span>
                                            <Badge
                                                variant="outline"
                                                className={`${(contract.tcv / contract.acquisitionCost) >= 3
                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                    : 'bg-red-50 text-red-700 border-red-200'}`}
                                            >
                                                x{(contract.tcv / contract.acquisitionCost).toFixed(1)}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {contracts.length === 0 && (
                    <div className="col-span-full text-center py-10 text-primary-dark/40">
                        No hay contratos registrados.
                    </div>
                )}
            </div>
        </div>
    );
}

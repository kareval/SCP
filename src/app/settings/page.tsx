'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { MOCK_PROJECTS, MOCK_INVOICES, MOCK_CLIENTS } from '@/data/mocks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
    const { logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const seedDatabase = async () => {
        setLoading(true);
        setMessage('Iniciando carga de datos...');
        try {
            const batch = writeBatch(db);

            // Seed Clients
            MOCK_CLIENTS.forEach((client) => {
                const ref = doc(collection(db, 'clients'), client.id);
                batch.set(ref, client);
            });

            // Seed Projects
            MOCK_PROJECTS.forEach((project) => {
                const ref = doc(collection(db, 'projects'), project.id);
                batch.set(ref, project);
            });

            // Seed Invoices
            MOCK_INVOICES.forEach((invoice) => {
                const ref = doc(collection(db, 'invoices'), invoice.id);
                batch.set(ref, invoice);
            });

            await batch.commit();
            setMessage('¡Base de datos cargada con éxito!');
        } catch (error) {
            console.error(error);
            setMessage('Error al cargar datos: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-900">Configuración</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Gestión de Datos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-slate-500">
                        Utiliza este botón para cargar los datos de prueba iniciales en la base de datos de Firestore.
                        ¡Cuidado! Esto podría sobrescribir datos existentes si coinciden los IDs.
                    </p>
                    <button
                        onClick={seedDatabase}
                        disabled={loading}
                        className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Cargando...' : 'Cargar Datos de Prueba (Seed)'}
                    </button>
                    {message && <p className="text-sm font-medium text-slate-900">{message}</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sesión</CardTitle>
                </CardHeader>
                <CardContent>
                    <button
                        onClick={logout}
                        className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                    >
                        Cerrar Sesión
                    </button>
                </CardContent>
            </Card>
        </div>
    );
}

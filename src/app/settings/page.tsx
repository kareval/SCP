'use client';

import { useState, useEffect } from 'react';
import { adminService } from '@/services/adminService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { AlertTriangle, Database, Trash2, RefreshCw, FlaskConical } from 'lucide-react';

export default function SettingsPage() {
    const { logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [enablePdfGeneration, setEnablePdfGeneration] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('feature_enablePdfGeneration');
        if (stored) setEnablePdfGeneration(JSON.parse(stored));
    }, []);

    const togglePdfGeneration = () => {
        const newValue = !enablePdfGeneration;
        setEnablePdfGeneration(newValue);
        localStorage.setItem('feature_enablePdfGeneration', JSON.stringify(newValue));
        setMessage(`Generación de PDF ${newValue ? 'activada' : 'desactivada'}`);
    };

    const handleSeedDatabase = async () => {
        if (!confirm('¿Estás seguro? Esto sobrescribirá datos existentes si coinciden los IDs.')) return;

        setLoading(true);
        setMessage('Iniciando carga de datos...');
        try {
            await adminService.seedDatabase();
            setMessage('¡Base de datos cargada con éxito!');
        } catch (error) {
            console.error(error);
            setMessage('Error al cargar datos: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleClearDatabase = async () => {
        const confirmation = prompt('PELIGRO: Esto borrará TODOS los datos (Proyectos, Facturas, Clientes). Escribe "BORRAR" para confirmar.');
        if (confirmation !== 'BORRAR') return;

        setLoading(true);
        setMessage('Borrando base de datos...');
        try {
            await adminService.clearDatabase();
            setMessage('¡Base de datos borrada completamente!');
            // Optional: Reload to clear state
            window.location.reload();
        } catch (error) {
            console.error(error);
            setMessage('Error al borrar datos: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-slate-900">Configuración del Sistema</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Gestión de Datos
                    </CardTitle>
                    <CardDescription>Herramientas para administrar los datos de la aplicación.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                        <div>
                            <h3 className="font-medium">Cargar Datos de Prueba (Seed)</h3>
                            <p className="text-sm text-slate-500">Rellena la base de datos con proyectos y facturas de ejemplo.</p>
                        </div>
                        <Button
                            onClick={handleSeedDatabase}
                            disabled={loading}
                            variant="outline"
                        >
                            {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                            Cargar Datos
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-indigo-100 bg-indigo-50/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-indigo-700">
                        <FlaskConical className="h-5 w-5" />
                        Funciones Experimentales
                    </CardTitle>
                    <CardDescription>Activa o desactiva funciones en desarrollo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-indigo-100 rounded-lg bg-white">
                        <div>
                            <h3 className="font-medium text-indigo-900">Generación de Facturas PDF</h3>
                            <p className="text-sm text-indigo-600/70">Permite descargar facturas en formato PDF desde el historial.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">{enablePdfGeneration ? 'Activado' : 'Desactivado'}</span>
                            <Button
                                onClick={togglePdfGeneration}
                                variant={enablePdfGeneration ? 'default' : 'outline'}
                                className={enablePdfGeneration ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                            >
                                {enablePdfGeneration ? 'ON' : 'OFF'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-5 w-5" />
                        Zona de Peligro
                    </CardTitle>
                    <CardDescription className="text-red-600/80">Acciones destructivas e irreversibles.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-white">
                        <div>
                            <h3 className="font-medium text-red-700">Borrar Base de Datos</h3>
                            <p className="text-sm text-red-600/70">Elimina permanentemente todos los proyectos, facturas y clientes.</p>
                        </div>
                        <Button
                            onClick={handleClearDatabase}
                            disabled={loading}
                            variant="destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Borrar Todo
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {message && (
                <div className={`p-4 rounded-md ${message.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {message}
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Sesión</CardTitle>
                </CardHeader>
                <CardContent>
                    <Button onClick={logout} variant="secondary">
                        Cerrar Sesión
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

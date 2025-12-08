'use client';

import { useState, useEffect } from 'react';
import { adminService } from '@/services/adminService';
import { resourceService } from '@/services/resourceService';
import { changelogService } from '@/services/changelogService';
import { Resource, SystemChange } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { AlertTriangle, Database, Trash2, RefreshCw, FlaskConical, User, History, Plus, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
    const { logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [enablePdfGeneration, setEnablePdfGeneration] = useState(false);

    // Resource Management State
    const [resources, setResources] = useState<Resource[]>([]);
    const [newResource, setNewResource] = useState<Partial<Resource>>({});
    const [isAddingResource, setIsAddingResource] = useState(false);

    // Changelog State
    const [changes, setChanges] = useState<SystemChange[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('feature_enablePdfGeneration');
        if (stored) setEnablePdfGeneration(JSON.parse(stored));

        // Load initial data
        loadResources();
        setChanges(changelogService.getChanges());
    }, []);

    const loadResources = () => {
        setResources(resourceService.getResources());
    };

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
            window.location.reload();
        } catch (error) {
            console.error(error);
            setMessage('Error al borrar datos: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    // --- Resource Handlers ---
    const handleAddResource = () => {
        if (!newResource.name || !newResource.costRate || !newResource.billRate) {
            alert("Por favor completa los campos obligatorios");
            return;
        }
        const resource: Resource = {
            id: crypto.randomUUID(),
            name: newResource.name!,
            role: newResource.role || 'Consultor',
            costRate: Number(newResource.costRate),
            billRate: Number(newResource.billRate),
            currency: 'EUR',
            active: true
        };
        resourceService.saveResource(resource);
        setNewResource({});
        setIsAddingResource(false);
        loadResources();
    };

    const handleDeleteResource = (id: string) => {
        if (confirm("¿Eliminar recurso?")) {
            resourceService.deleteResource(id);
            loadResources();
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Configuración del Sistema</h1>
                    <p className="text-slate-500">Administra recursos, datos y visualiza el historial de cambios.</p>
                </div>
                <Button onClick={logout} variant="secondary">Cerrar Sesión</Button>
            </div>

            {message && (
                <div className={`p-4 rounded-md ${message.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {message}
                </div>
            )}

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="general">General y Datos</TabsTrigger>
                    <TabsTrigger value="resources">Recursos y Tarifas</TabsTrigger>
                    <TabsTrigger value="changelog">Historial de Mejoras</TabsTrigger>
                </TabsList>

                {/* --- GENERAL TAB --- */}
                <TabsContent value="general" className="space-y-6">
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
                                <Button onClick={handleSeedDatabase} disabled={loading} variant="outline">
                                    {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                                    Cargar Datos
                                </Button>
                            </div>

                            {/* Explanation of Test Cases */}
                            <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                                <h4 className="font-semibold text-blue-800 mb-3">📋 Casos de Prueba Generados:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    <div className="bg-white p-3 rounded border border-blue-100">
                                        <span className="font-bold text-green-700">1. Margen Alto (&gt;30%)</span>
                                        <p className="text-slate-600">T&M con costes bajos. Demuestra badge verde.</p>
                                    </div>
                                    <div className="bg-white p-3 rounded border border-blue-100">
                                        <span className="font-bold text-red-700">2. Margen Bajo (&lt;15%)</span>
                                        <p className="text-slate-600">T&M con costes altos. Demuestra badge rojo.</p>
                                    </div>
                                    <div className="bg-white p-3 rounded border border-blue-100">
                                        <span className="font-bold text-orange-700">3. Proyecto Interno</span>
                                        <p className="text-slate-600">Sin revenue, solo costes (I+D).</p>
                                    </div>
                                    <div className="bg-white p-3 rounded border border-blue-100">
                                        <span className="font-bold text-purple-700">4. Equipo con Tarifas</span>
                                        <p className="text-slate-600">Recursos con overrides de tarifa.</p>
                                    </div>
                                    <div className="bg-white p-3 rounded border border-blue-100">
                                        <span className="font-bold text-indigo-700">5. Con Línea Base</span>
                                        <p className="text-slate-600">Presupuesto aumentó vs baseline.</p>
                                    </div>
                                    <div className="bg-white p-3 rounded border border-blue-100">
                                        <span className="font-bold text-teal-700">6. Hitos (Output)</span>
                                        <p className="text-slate-600">Revenue por milestones, 40% completado.</p>
                                    </div>
                                    <div className="bg-white p-3 rounded border border-blue-100 md:col-span-2">
                                        <span className="font-bold text-amber-700">7. Facturación Anticipada</span>
                                        <p className="text-slate-600">Facturado antes de iniciar (Ingreso Diferido).</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-indigo-100 bg-indigo-50/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-indigo-700">
                                <FlaskConical className="h-5 w-5" />
                                Funciones Experimentales
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border border-indigo-100 rounded-lg bg-white">
                                <div>
                                    <h3 className="font-medium text-indigo-900">Generación de Facturas PDF</h3>
                                    <p className="text-sm text-indigo-600/70">Permite descargar facturas en formato PDF desde el historial.</p>
                                </div>
                                <div className="flex items-center gap-2">
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
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-white">
                                <div>
                                    <h3 className="font-medium text-red-700">Borrar Base de Datos</h3>
                                    <p className="text-sm text-red-600/70">Elimina permanentemente todos los datos.</p>
                                </div>
                                <Button onClick={handleClearDatabase} disabled={loading} variant="destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Borrar Todo
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- RESOURCES TAB --- */}
                <TabsContent value="resources" className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Recursos y Tarifas (Rate Card)
                                </CardTitle>
                                <CardDescription>Gestiona el coste y tarifa de venta de los perfiles.</CardDescription>
                            </div>
                            <Button size="sm" onClick={() => setIsAddingResource(true)}><Plus className="h-4 w-4 mr-2" /> Nuevo Recurso</Button>
                        </CardHeader>
                        <CardContent>
                            {isAddingResource && (
                                <div className="mb-6 p-4 border rounded-md bg-slate-50 space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <Label>Nombre</Label>
                                            <Input value={newResource.name || ''} onChange={e => setNewResource({ ...newResource, name: e.target.value })} placeholder="Ej. Senior Dev" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Rol</Label>
                                            <Input value={newResource.role || ''} onChange={e => setNewResource({ ...newResource, role: e.target.value })} placeholder="Ej. Técnico" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Coste Hora (€)</Label>
                                            <Input type="number" value={newResource.costRate || ''} onChange={e => setNewResource({ ...newResource, costRate: Number(e.target.value) })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Tarifa Venta (€)</Label>
                                            <Input type="number" value={newResource.billRate || ''} onChange={e => setNewResource({ ...newResource, billRate: Number(e.target.value) })} />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" onClick={() => setIsAddingResource(false)}>Cancelar</Button>
                                        <Button onClick={handleAddResource}>Guardar</Button>
                                    </div>
                                </div>
                            )}

                            <div className="border rounded-md overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 text-slate-700 font-medium">
                                        <tr>
                                            <th className="p-3">Nombre</th>
                                            <th className="p-3">Rol</th>
                                            <th className="p-3 text-right">Coste /h</th>
                                            <th className="p-3 text-right">Venta /h</th>
                                            <th className="p-3 text-right">Margen</th>
                                            <th className="p-3 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {resources.map(r => {
                                            const margin = r.active ? ((r.billRate - r.costRate) / r.billRate * 100).toFixed(1) : 0;
                                            return (
                                                <tr key={r.id} className="hover:bg-slate-50 text-slate-700">
                                                    <td className="p-3 font-medium">{r.name}</td>
                                                    <td className="p-3 text-slate-500">{r.role}</td>
                                                    <td className="p-3 text-right">{r.costRate} €</td>
                                                    <td className="p-3 text-right font-medium">{r.billRate} €</td>
                                                    <td className="p-3 text-right text-green-600 font-bold">{margin}%</td>
                                                    <td className="p-3 text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteResource(r.id)} className="text-red-500 hover:text-red-700 h-8 w-8 p-0">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {resources.length === 0 && (
                                            <tr><td colSpan={6} className="p-8 text-center text-slate-400">No hay recursos definidos</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- CHANGELOG TAB --- */}
                <TabsContent value="changelog" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Historial de Mejoras del Sistema
                            </CardTitle>
                            <CardDescription>Registro cronológico de actualizaciones, refactorizaciones y nuevas funcionalidades.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative border-l border-slate-200 ml-4 space-y-8 py-4">
                                {changes.map((change) => (
                                    <div key={change.id} className="relative pl-8">
                                        <span className={`absolute -left-1.5 top-1 h-3 w-3 rounded-full border-2 border-white ${change.category === 'Feature' ? 'bg-blue-500' :
                                            change.category === 'Bugfix' ? 'bg-red-500' :
                                                change.category === 'Refactor' ? 'bg-purple-500' : 'bg-gray-500'
                                            }`} />
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-1">
                                            <h4 className="text-base font-bold text-slate-900">{change.title}</h4>
                                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                                {new Date(change.date).toLocaleDateString()} {new Date(change.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {change.version && ` • v${change.version}`}
                                            </span>
                                        </div>
                                        <div className="text-sm font-medium text-slate-600 mb-2">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${change.category === 'Feature' ? 'bg-blue-100 text-blue-800' :
                                                change.category === 'Bugfix' ? 'bg-red-100 text-red-800' :
                                                    change.category === 'Refactor' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                                                } mr-2`}>
                                                {change.category}
                                            </span>
                                        </div>
                                        <p className="text-slate-700 mb-2">{change.description}</p>
                                        <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Motivación del Cambio:</h5>
                                            <p className="text-sm text-slate-600 italic">"{change.reasoning}"</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

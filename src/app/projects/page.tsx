'use client';

import { useEffect, useState } from 'react';
import { projectService } from '@/services/projectService';
import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus, Trash2, Pencil } from 'lucide-react';

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await projectService.getProjects();
                setProjects(data);
            } catch (error) {
                console.error("Error fetching projects:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
            try {
                await projectService.deleteProject(id);
                setProjects(projects.filter(p => p.id !== id));
            } catch (error) {
                console.error("Error deleting project:", error);
                alert("Error al eliminar el proyecto");
            }
        }
    };

    if (loading) return <div className="p-8">Cargando proyectos...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-primary-dark">Proyectos</h1>
                <Link href="/projects/new">
                    <button className="flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Proyecto
                    </button>
                </Link>
            </div>

            <div className="grid gap-4">
                {projects.map((project) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-xl text-primary-dark">
                                    <Link href={`/projects/detail?id=${project.id}`} className="hover:underline">
                                        {project.title}
                                    </Link>
                                </CardTitle>
                                <p className="text-sm text-primary-dark/60">Cliente: {project.clientId}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={project.status === 'Accepted' ? 'default' : 'secondary'} className={project.status === 'Accepted' ? 'bg-secondary-teal' : ''}>
                                    {project.status}
                                </Badge>
                                <Link href={`/projects/edit/${project.id}`}>
                                    <button
                                        className="p-2 text-primary-dark hover:bg-primary-dark/10 rounded-full transition-colors"
                                        title="Editar Proyecto"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                </Link>
                                <button
                                    onClick={() => handleDelete(project.id)}
                                    className="p-2 text-aux-red hover:bg-aux-red/10 rounded-full transition-colors"
                                    title="Eliminar Proyecto"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-5 gap-4 text-sm">
                                <div>
                                    <p className="text-primary-dark/60">Presupuesto</p>
                                    <p className="font-medium text-primary-dark">{project.budget.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                                </div>
                                <div>
                                    <p className="text-primary-dark/60">Revenue</p>
                                    <p className="font-medium text-primary-dark">{project.justifiedAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                                </div>
                                <div>
                                    <p className="text-primary-dark/60">Facturado</p>
                                    <p className="font-medium text-primary-dark">{project.billedAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                                </div>
                                <div>
                                    <p className="text-primary-dark/60">WIP</p>
                                    <p className={`font-medium ${project.justifiedAmount > project.billedAmount ? 'text-aux-red' : 'text-primary-dark/40'}`}>
                                        {Math.max(0, project.justifiedAmount - project.billedAmount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-primary-dark/60">Deferred</p>
                                    <p className={`font-medium ${project.billedAmount > project.justifiedAmount ? 'text-tertiary-blue' : 'text-primary-dark/40'}`}>
                                        {Math.max(0, project.billedAmount - project.justifiedAmount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

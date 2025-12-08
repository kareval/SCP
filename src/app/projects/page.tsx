'use client';

import { useEffect, useState } from 'react';
import { projectService } from '@/services/projectService';
import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus, Trash2, Pencil, Info } from 'lucide-react';
import { calculateProjectRevenue } from '@/utils/calculations';
import { useTranslation } from '@/context/LanguageContext';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";


export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();

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
        if (confirm(t('common.confirmDelete'))) {
            try {
                await projectService.deleteProject(id);
                setProjects(projects.filter(p => p.id !== id));
            } catch (error) {
                console.error("Error deleting project:", error);
                alert("Error al eliminar el proyecto");
            }
        }
    };

    if (loading) return <div className="p-8">{t('common.loading')}</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-primary-dark">{t('projects.title')}</h1>
                <Link href="/projects/new">
                    <button className="flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('projects.newProject')}
                    </button>
                </Link>
            </div>

            <div className="grid gap-4">
                {projects.map((project) => {
                    const revenue = project.revenueMethod === 'Linear' ? calculateProjectRevenue(project) : (project.justifiedAmount || 0);

                    return (
                        <Card key={project.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl text-primary-dark">
                                        <Link href={`/projects/detail?id=${project.id}`} className="hover:underline">
                                            {project.title}
                                        </Link>
                                    </CardTitle>
                                    <p className="text-sm text-primary-dark/60">{t('projects.card.client')}: {project.clientId}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={project.status === 'Accepted' ? 'default' : 'secondary'} className={project.status === 'Accepted' ? 'bg-secondary-teal' : ''}>
                                        {project.status === 'Accepted' ? t('common.active') : project.status}
                                    </Badge>
                                    <Link href={`/projects/edit/${project.id}`}>
                                        <button
                                            className="p-2 text-primary-dark hover:bg-primary-dark/10 rounded-full transition-colors"
                                            title={t('common.edit')}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(project.id)}
                                        className="p-2 text-aux-red hover:bg-aux-red/10 rounded-full transition-colors"
                                        title={t('common.delete')}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-5 gap-4 text-sm">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-primary-dark/60">{t('projects.card.budget')}</p>
                                        <p className="font-medium text-primary-dark">{project.budget.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                                    </div>
                                    <div className="flex flex-col gap-1 relative">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="absolute -top-5 left-0 flex gap-1 cursor-help w-fit">
                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-slate-300 text-slate-600 bg-white hover:bg-slate-50">
                                                            {project.type === 'Fixed' ? 'Fixed Price' : project.type === 'TM' ? 'T&M' : 'Interno'}
                                                        </Badge>
                                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 text-slate-600 hover:bg-slate-200">
                                                            {project.revenueMethod}
                                                        </Badge>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <div className="space-y-2">
                                                        <div>
                                                            <p className="font-semibold text-xs text-slate-500 mb-0.5">Tipo de Proyecto</p>
                                                            <p className="font-medium">{project.type === 'Fixed' ? 'Precio Fijo' : project.type === 'TM' ? 'Tiempo y Materiales' : 'Interno'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-xs text-slate-500 mb-0.5">Método de Valoración: {project.revenueMethod}</p>
                                                            <p className="text-xs max-w-[200px] text-slate-300">
                                                                {project.revenueMethod === 'Input'
                                                                    ? 'Basado en coste incurrido / coste total estimado.'
                                                                    : project.revenueMethod === 'Output'
                                                                        ? 'Basado en % de hitos completados.'
                                                                        : 'Lineal proporcional al tiempo transcurrido.'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <p className="text-primary-dark/60">{t('projects.card.revenue')}</p>
                                        <p className="font-medium text-primary-dark">{revenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                                    </div>
                                    <div>
                                        <p className="text-primary-dark/60">{t('projects.card.billed')}</p>
                                        <p className="font-medium text-primary-dark">{project.billedAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                                    </div>
                                    <div>
                                        <p className="text-primary-dark/60">{t('projects.card.wip')}</p>
                                        <p className={`font-medium ${revenue > project.billedAmount ? 'text-aux-red' : 'text-primary-dark/40'}`}>
                                            {Math.max(0, revenue - project.billedAmount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-primary-dark/60">{t('projects.card.deferred')}</p>
                                        <p className={`font-medium ${project.billedAmount > revenue ? 'text-tertiary-blue' : 'text-primary-dark/40'}`}>
                                            {Math.max(0, project.billedAmount - revenue).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

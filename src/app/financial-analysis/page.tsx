'use client';

import { useEffect, useState } from 'react';
import { projectService } from '@/services/projectService';
import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowRight, TrendingUp } from 'lucide-react';

export default function FinancialAnalysisPage() {
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

    if (loading) return <div className="p-8">Cargando proyectos...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary-dark">Análisis Financiero (EAC)</h1>
                    <p className="text-primary-dark/60 mt-1">Selecciona un proyecto para realizar la proyección de costes al cierre.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <Link key={project.id} href={`/financial-analysis/${project.id}`}>
                        <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-transparent hover:border-l-primary">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="mb-2">{project.clientId}</Badge>
                                    <TrendingUp className="h-5 w-5 text-primary-dark/40" />
                                </div>
                                <CardTitle className="text-lg text-primary-dark">{project.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-primary-dark/60">Presupuesto (BAC):</span>
                                        <span className="font-medium">{project.budget.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-primary-dark/60">Estado:</span>
                                        <span className="font-medium">{project.status}</span>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-primary text-sm font-medium">
                                    Ver Análisis <ArrowRight className="ml-1 h-4 w-4" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}

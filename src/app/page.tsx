'use client';

import { useEffect, useState } from 'react';
import { projectService } from '@/services/projectService';
import { Project, Invoice } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Euro, FileText, AlertCircle } from 'lucide-react';

import Link from 'next/link';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsData, invoicesData] = await Promise.all([
          projectService.getProjects(),
          projectService.getInvoices()
        ]);
        setProjects(projectsData);
        setInvoices(invoicesData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8">Cargando datos...</div>;

  const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
  const totalJustified = projects.reduce((acc, p) => acc + p.justifiedAmount, 0);
  const totalBilled = invoices.reduce((acc, i) => acc + i.amount, 0);
  const pendingBilling = totalJustified - totalBilled;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary-dark">Panel de Control</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-dark">Presupuesto Total</CardTitle>
            <Euro className="h-4 w-4 text-primary-dark/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-dark">{totalBudget.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
            <p className="text-xs text-primary-dark/60">En proyectos activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-dark">Justificado</CardTitle>
            <FileText className="h-4 w-4 text-primary-dark/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-dark">{totalJustified.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
            <p className="text-xs text-primary-dark/60">Trabajo realizado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-dark">Facturado</CardTitle>
            <Euro className="h-4 w-4 text-primary-dark/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-dark">{totalBilled.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
            <p className="text-xs text-primary-dark/60">Autofacturas recibidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-dark">WIP (Pendiente Facturar)</CardTitle>
            <AlertCircle className="h-4 w-4 text-aux-red" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-aux-red">
              {projects.reduce((acc, p) => acc + Math.max(0, p.justifiedAmount - p.billedAmount), 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
            </div>
            <p className="text-xs text-primary-dark/60">Riesgo de no cobro</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-dark">Deferred Revenue</CardTitle>
            <AlertCircle className="h-4 w-4 text-tertiary-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-tertiary-blue">
              {projects.reduce((acc, p) => acc + Math.max(0, p.billedAmount - p.justifiedAmount), 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
            </div>
            <p className="text-xs text-primary-dark/60">Facturado por adelantado</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-primary-dark mb-4">Proyectos Activos</h2>
        <div className="grid gap-4">
          {projects.slice(0, 5).map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-primary-dark">
                    <Link href={`/projects/detail?id=${project.id}`} className="hover:underline">
                      {project.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-primary-dark/60">{project.clientId}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-dark">
                    {project.justifiedAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </p>
                  <p className="text-xs text-primary-dark/60">Revenue Reconocido</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {projects.length === 0 && (
            <p className="text-slate-500">No hay proyectos activos.</p>
          )}
        </div>
      </div>
    </div>
  );
}

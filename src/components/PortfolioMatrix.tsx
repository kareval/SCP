'use client';

import { Project } from '@/types';
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Label
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface PortfolioMatrixProps {
    projects: Project[];
}

export default function PortfolioMatrix({ projects }: PortfolioMatrixProps) {
    // Filter projects that have relevant data
    const data = projects
        .filter(p => p.status !== 'Closed' && p.status !== 'Draft' && p.type !== undefined)
        .map(p => ({
            id: p.id,
            name: p.title,
            budget: p.budget, // X Axis: Cost/Effort
            score: p.strategicScore || 0, // Y Axis: Value
            roi: p.expectedROI || 0,
            revenue: p.budget, // Z Axis (Size): Revenue Poteitial (using Budget as proxy for Fixed)
            status: p.status
        }))
        .filter(p => p.budget > 0); // Only show projects with non-zero budget

    if (data.length === 0) return null;

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-aux-grey rounded shadow-lg text-sm">
                    <p className="font-bold text-primary-dark mb-1">{data.name}</p>
                    <p className="text-secondary-teal">Score Estratégico: {data.score}</p>
                    <p className="text-primary-dark/80">Presupuesto: {data.budget.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                    {data.roi > 0 && <p className="text-tertiary-blue">ROI Esperado: {data.roi}%</p>}
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle className="text-primary-dark">Matriz de Priorización de Cartera</CardTitle>
                <CardDescription>
                    Visualización de Valor (Eje Y) vs. Esfuerzo/Coste (Eje X).
                    <br />
                    El tamaño de la burbuja representa el volumen del proyecto (Revenue).
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart
                            margin={{
                                top: 20,
                                right: 20,
                                bottom: 20,
                                left: 20,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                type="number"
                                dataKey="budget"
                                name="Presupuesto"
                                unit="€"
                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                label={{ value: 'Coste / Esfuerzo (Presupuesto)', position: 'insideBottom', offset: -10 }}
                            />
                            <YAxis
                                type="number"
                                dataKey="score"
                                name="Score"
                                unit=""
                                domain={[0, 100]}
                                label={{ value: 'Valor Estratégico (0-100)', angle: -90, position: 'insideLeft' }}
                            />
                            <ZAxis type="number" dataKey="revenue" range={[60, 400]} name="Revenue" />
                            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                            {/* Quadrant Lines (approximate middle) */}
                            <ReferenceLine y={50} stroke="#cbd5e1" strokeDasharray="3 3">
                                <Label value="Alta Estrategia" position="insideTopLeft" className="fill-slate-400 text-xs" />
                            </ReferenceLine>

                            <Scatter name="Proyectos" data={data} fill="#2A9D8F" fillOpacity={0.6} stroke="#264653" />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

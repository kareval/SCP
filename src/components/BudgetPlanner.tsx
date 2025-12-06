"use client"

import { useState, useEffect } from "react"
import { Project, ProjectPhase, MonthlyBudget } from "@/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Save, Info } from "lucide-react"
import { projectService } from "@/services/projectService"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface BudgetPlannerProps {
    project: Project
    onUpdate: (updatedProject: Project) => void
}

export function BudgetPlanner({ project, onUpdate }: BudgetPlannerProps) {
    const [phases, setPhases] = useState<ProjectPhase[]>(project.phases || [])
    const [monthlyBudget, setMonthlyBudget] = useState<MonthlyBudget[]>(project.monthlyBudget || [])
    const [newPhaseName, setNewPhaseName] = useState("")

    // Helper to generate months between start and end date
    const getMonths = () => {
        if (!project.startDate || !project.endDate) return []
        const start = new Date(project.startDate)
        const end = new Date(project.endDate)
        const months = []
        let current = new Date(start)

        while (current <= end) {
            months.push(current.toISOString().slice(0, 7)) // YYYY-MM
            current.setMonth(current.getMonth() + 1)
        }
        return months
    }

    const months = getMonths()

    const addPhase = () => {
        if (!newPhaseName) return
        const newPhase: ProjectPhase = {
            id: crypto.randomUUID(),
            name: newPhaseName,
            startDate: project.startDate || "",
            endDate: project.endDate || "",
            budgetAllocation: 0
        }
        setPhases([...phases, newPhase])
        setNewPhaseName("")
    }

    const removePhase = (id: string) => {
        setPhases(phases.filter(p => p.id !== id))
        setMonthlyBudget(monthlyBudget.filter(mb => mb.phaseId !== id))
    }

    const updateMonthlyAmount = (phaseId: string, month: string, amount: number) => {
        const existingIndex = monthlyBudget.findIndex(mb => mb.phaseId === phaseId && mb.month === month)
        const newBudget = [...monthlyBudget]

        if (existingIndex >= 0) {
            newBudget[existingIndex] = { ...newBudget[existingIndex], amount }
        } else {
            newBudget.push({ phaseId, month, amount })
        }
        setMonthlyBudget(newBudget)
    }

    const getAmount = (phaseId: string, month: string) => {
        return monthlyBudget.find(mb => mb.phaseId === phaseId && mb.month === month)?.amount || 0
    }

    const saveChanges = async () => {
        try {
            const updatedProject = { ...project, phases, monthlyBudget }
            await projectService.updateProject(updatedProject)
            onUpdate(updatedProject)
            alert('Planificación guardada correctamente')
        } catch (error) {
            console.error('Error saving planning:', error)
            alert('Error al guardar la planificación')
        }
    }

    const totalAllocated = monthlyBudget.reduce((acc, curr) => acc + curr.amount, 0)
    const remainingBudget = project.budget - totalAllocated

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-primary-dark">Planificación Presupuestaria</h2>
                    <p className="text-sm text-muted-foreground">Define fases y distribuye el presupuesto en el tiempo.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.open(`/financial-analysis/${project.id}`, '_blank')}>
                        Ver Análisis Financiero
                    </Button>
                    <Button onClick={saveChanges} className="bg-primary text-white">
                        <Save className="w-4 h-4 mr-2" /> Guardar Planificación
                    </Button>
                </div>
            </div>

            {project.type === 'TM' ? (
                <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800 text-xs font-bold">Control de Costes Internos (T&M)</AlertTitle>
                    <AlertDescription className="text-blue-700 text-xs">
                        En proyectos Time & Materials, este presupuesto es para <strong>control interno</strong> y estimación de recursos.
                        <br />La facturación real dependerá de las horas incurridas, no de esta planificación.
                    </AlertDescription>
                </Alert>
            ) : (
                <Alert className="bg-orange-50 border-orange-200">
                    <Info className="h-4 w-4 text-orange-600" />
                    <AlertTitle className="text-orange-800 text-xs font-bold">Análisis de Rentabilidad (Fixed Price)</AlertTitle>
                    <AlertDescription className="text-orange-700 text-xs">
                        En proyectos de Precio Fijo, esta planificación define sus <strong>costes previstos</strong>.
                        <br />El margen del proyecto dependerá de que los costes reales no superen esta planificación.
                    </AlertDescription>
                </Alert>
            )}

            {/* Budget Summary */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Presupuesto Total (BAC)</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{project.budget.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Asignado</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-blue-600">{totalAllocated.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Pendiente</CardTitle></CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${remainingBudget < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {remainingBudget.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Phase Management */}
            <Card>
                <CardHeader>
                    <CardTitle>Fases del Proyecto</CardTitle>
                    <CardDescription>Añade las fases principales (ej: Análisis, Desarrollo, Pruebas).</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 mb-4">
                        <Input
                            placeholder="Nombre de la fase..."
                            value={newPhaseName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPhaseName(e.target.value)}
                        />
                        <Button onClick={addPhase} variant="outline"><Plus className="w-4 h-4" /></Button>
                    </div>
                    <div className="space-y-2">
                        {phases.map(phase => (
                            <div key={phase.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                                <span className="font-medium">{phase.name}</span>
                                <Button variant="ghost" size="sm" onClick={() => removePhase(phase.id)} className="text-red-500 hover:text-red-700">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        {phases.length === 0 && <p className="text-sm text-muted-foreground italic">No hay fases definidas.</p>}
                    </div>
                </CardContent>
            </Card>

            {/* Monthly Distribution Grid */}
            {phases.length > 0 && months.length > 0 && (
                <Card className="overflow-hidden">
                    <CardHeader>
                        <CardTitle>Distribución Mensual</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="p-2 text-left min-w-[150px]">Fase</th>
                                    {months.map(m => (
                                        <th key={m} className="p-2 text-right min-w-[100px]">{m}</th>
                                    ))}
                                    <th className="p-2 text-right font-bold">Total Fase</th>
                                </tr>
                            </thead>
                            <tbody>
                                {phases.map(phase => {
                                    const phaseTotal = monthlyBudget
                                        .filter(mb => mb.phaseId === phase.id)
                                        .reduce((acc, curr) => acc + curr.amount, 0)

                                    return (
                                        <tr key={phase.id} className="border-b">
                                            <td className="p-2 font-medium">{phase.name}</td>
                                            {months.map(m => (
                                                <td key={m} className="p-2">
                                                    <Input
                                                        type="number"
                                                        className="text-right h-8"
                                                        value={getAmount(phase.id, m) || ''}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateMonthlyAmount(phase.id, m, Number(e.target.value))}
                                                    />
                                                </td>
                                            ))}
                                            <td className="p-2 text-right font-bold bg-slate-50">
                                                {phaseTotal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </td>
                                        </tr>
                                    )
                                })}
                                {/* Totals Row */}
                                <tr className="bg-slate-200 font-bold">
                                    <td className="p-2">TOTAL MES</td>
                                    {months.map(m => {
                                        const monthTotal = monthlyBudget
                                            .filter(mb => mb.month === m)
                                            .reduce((acc, curr) => acc + curr.amount, 0)
                                        return (
                                            <td key={m} className="p-2 text-right">
                                                {monthTotal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </td>
                                        )
                                    })}
                                    <td className="p-2 text-right text-lg">
                                        {totalAllocated.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

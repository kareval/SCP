import { useState, useEffect } from 'react'
import { Project, BillingForecastItem } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Save, Calendar, DollarSign, Info } from 'lucide-react'
import { projectService } from '@/services/projectService'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface BillingPlannerProps {
    project: Project
    onUpdate: (project: Project) => void
}

export function BillingPlanner({ project, onUpdate }: BillingPlannerProps) {
    const [forecastItems, setForecastItems] = useState<BillingForecastItem[]>(project.billingForecast || [])
    const [newItem, setNewItem] = useState<Partial<BillingForecastItem>>({
        date: '',
        amount: 0,
        isAdvance: false,
        notes: ''
    })

    useEffect(() => {
        setForecastItems(project.billingForecast || [])
    }, [project.billingForecast])

    const handleAddItem = () => {
        if (!newItem.date || !newItem.amount) return

        const item: BillingForecastItem = {
            id: crypto.randomUUID(),
            date: newItem.date,
            amount: Number(newItem.amount),
            isAdvance: newItem.isAdvance || false,
            notes: newItem.notes || ''
        }

        const updatedItems = [...forecastItems, item].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        setForecastItems(updatedItems)
        setNewItem({ date: '', amount: 0, isAdvance: false, notes: '' })
    }

    const handleRemoveItem = (id: string) => {
        setForecastItems(forecastItems.filter(item => item.id !== id))
    }

    const saveChanges = async () => {
        try {
            const updatedProject = { ...project, billingForecast: forecastItems }
            await projectService.updateProject(updatedProject)
            onUpdate(updatedProject)
            alert('Previsión de facturación guardada correctamente')
        } catch (error) {
            console.error('Error saving billing forecast:', error)
            alert('Error al guardar la previsión')
        }
    }

    const totalForecast = forecastItems.reduce((acc, item) => acc + item.amount, 0)

    const isTM = project.type === 'TM';
    const title = isTM ? "Previsión de Facturación (Estimada)" : "Plan de Hitos de Facturación";
    const description = isTM
        ? "Planifica cuándo esperas facturar. Nota: La facturación real dependerá de las horas registradas."
        : "Define el calendario de pagos acordado en el contrato (Hitos de Facturación).";

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-primary-dark">{title}</h2>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <Button onClick={saveChanges} className="bg-primary text-white">
                    <Save className="w-4 h-4 mr-2" /> Guardar Previsión
                </Button>
            </div>

            {isTM ? (
                <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800 text-xs font-bold">Estimación de Cash Flow</AlertTitle>
                    <AlertDescription className="text-blue-700 text-xs">
                        Esta tabla alimenta la previsión de tesorería, pero <strong>no genera facturas</strong>.
                        <br />Deberás emitir las facturas basándote en los partes de horas reales.
                    </AlertDescription>
                </Alert>
            ) : (
                <Alert className="bg-orange-50 border-orange-200">
                    <Info className="h-4 w-4 text-orange-600" />
                    <AlertTitle className="text-orange-800 text-xs font-bold">Calendario de Pagos</AlertTitle>
                    <AlertDescription className="text-orange-700 text-xs">
                        Asegúrate de que la suma total coincida con el presupuesto del contrato.
                        <br />Estos hitos se usarán para alertar sobre fechas de facturación próximas.
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Nueva Entrada</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="space-y-2">
                            <Label>Fecha Prevista</Label>
                            <div className="relative">
                                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    className="pl-8"
                                    value={newItem.date}
                                    onChange={(e) => setNewItem({ ...newItem, date: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Importe (€)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="number"
                                    className="pl-8"
                                    placeholder="0.00"
                                    value={newItem.amount || ''}
                                    onChange={(e) => setNewItem({ ...newItem, amount: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Notas</Label>
                            <Input
                                type="text"
                                placeholder="Hito 1, Anticipo..."
                                value={newItem.notes || ''}
                                onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center space-x-2 pb-3">
                            <input
                                type="checkbox"
                                id="isAdvance"
                                checked={newItem.isAdvance}
                                onChange={(e) => setNewItem({ ...newItem, isAdvance: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="isAdvance" className="cursor-pointer">¿Es Anticipo?</Label>
                        </div>
                        <Button onClick={handleAddItem} disabled={!newItem.date || !newItem.amount} className="bg-secondary text-white hover:bg-secondary/90">
                            <Plus className="w-4 h-4 mr-2" /> Añadir
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-base">Plan de Facturación</CardTitle>
                        <div className="text-sm font-medium text-primary-dark">
                            Total Previsto: {totalForecast.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="p-3 font-medium">Fecha</th>
                                    <th className="p-3 font-medium">Concepto / Notas</th>
                                    <th className="p-3 font-medium text-right">Importe</th>
                                    <th className="p-3 font-medium text-center">Tipo</th>
                                    <th className="p-3 font-medium text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {forecastItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center text-muted-foreground">No hay previsiones definidas.</td>
                                    </tr>
                                ) : (
                                    forecastItems.map((item) => (
                                        <tr key={item.id} className="border-t hover:bg-muted/50">
                                            <td className="p-3">{new Date(item.date).toLocaleDateString()}</td>
                                            <td className="p-3">{item.notes || '-'}</td>
                                            <td className="p-3 text-right font-medium">{item.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                            <td className="p-3 text-center">
                                                {item.isAdvance ? (
                                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                                                        Anticipo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200">
                                                        Regular
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-right">
                                                <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id)} className="text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

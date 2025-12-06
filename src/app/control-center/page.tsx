'use client';

import { useEffect, useState, Suspense, Fragment } from 'react';
import { projectService } from '@/services/projectService';
import { contractService } from '@/services/contractService';
import { Project, WorkLog, Contract } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, ChevronDown, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function ControlCenterContent() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [viewMode, setViewMode] = useState<'Monthly' | 'Quarterly' | 'Yearly'>('Monthly');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [expandedContracts, setExpandedContracts] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectsData, contractsData] = await Promise.all([
                    projectService.getProjects(),
                    contractService.getContracts()
                ]);

                // Fetch logs for all projects
                const allLogs: WorkLog[] = [];
                for (const p of projectsData) {
                    const pLogs = await projectService.getWorkLogs(p.id);
                    allLogs.push(...pLogs);
                }

                setProjects(projectsData);
                setContracts(contractsData);
                setWorkLogs(allLogs);

                // Expand all contracts by default
                setExpandedContracts(new Set(contractsData.map(c => c.id)));
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const toggleContract = (contractId: string) => {
        const newExpanded = new Set(expandedContracts);
        if (newExpanded.has(contractId)) {
            newExpanded.delete(contractId);
        } else {
            newExpanded.add(contractId);
        }
        setExpandedContracts(newExpanded);
    };

    // --- Calculations ---

    // 1. TCV (Total Contract Value) - Sum of all Contracts TCV
    const totalTCV = contracts.reduce((acc, c) => acc + c.tcv, 0);

    // 2. Matrix Columns Generation
    const getColumns = () => {
        const year = currentDate.getFullYear();
        if (viewMode === 'Monthly') {
            return [
                { label: 'Ene', start: new Date(year, 0, 1), end: new Date(year, 0, 31) },
                { label: 'Feb', start: new Date(year, 1, 1), end: new Date(year, 1, 29) }, // Leap year handled by logic? Simple approx for now
                { label: 'Mar', start: new Date(year, 2, 1), end: new Date(year, 2, 31) },
                { label: 'Abr', start: new Date(year, 3, 1), end: new Date(year, 3, 30) },
                { label: 'May', start: new Date(year, 4, 1), end: new Date(year, 4, 31) },
                { label: 'Jun', start: new Date(year, 5, 1), end: new Date(year, 5, 30) },
                { label: 'Jul', start: new Date(year, 6, 1), end: new Date(year, 6, 31) },
                { label: 'Ago', start: new Date(year, 7, 1), end: new Date(year, 7, 31) },
                { label: 'Sep', start: new Date(year, 8, 1), end: new Date(year, 8, 30) },
                { label: 'Oct', start: new Date(year, 9, 1), end: new Date(year, 9, 31) },
                { label: 'Nov', start: new Date(year, 10, 1), end: new Date(year, 10, 30) },
                { label: 'Dic', start: new Date(year, 11, 1), end: new Date(year, 11, 31) },
            ];
        } else if (viewMode === 'Quarterly') {
            return [
                { label: 'Q1', start: new Date(year, 0, 1), end: new Date(year, 2, 31) },
                { label: 'Q2', start: new Date(year, 3, 1), end: new Date(year, 5, 30) },
                { label: 'Q3', start: new Date(year, 6, 1), end: new Date(year, 8, 30) },
                { label: 'Q4', start: new Date(year, 9, 1), end: new Date(year, 11, 31) },
            ];
        } else {
            // Yearly - Show 5 years range centered on current? Or just selected year?
            // User asked to "escoger periodo anual", implies seeing multiple years or just the year total.
            // Let's show current year and +/- 2 years for context if "Yearly" is selected, or just the selected year.
            // Simpler: Just 1 column for the selected year if "Yearly" means "Show me this year's total".
            // BUT "Periodo anual" might mean columns ARE years. Let's assume columns are years: [Year-2, Year-1, Year, Year+1, Year+2]
            return [
                { label: (year - 2).toString(), start: new Date(year - 2, 0, 1), end: new Date(year - 2, 11, 31) },
                { label: (year - 1).toString(), start: new Date(year - 1, 0, 1), end: new Date(year - 1, 11, 31) },
                { label: year.toString(), start: new Date(year, 0, 1), end: new Date(year, 11, 31) },
                { label: (year + 1).toString(), start: new Date(year + 1, 0, 1), end: new Date(year + 1, 11, 31) },
                { label: (year + 2).toString(), start: new Date(year + 2, 0, 1), end: new Date(year + 2, 11, 31) },
            ];
        }
    };

    const columns = getColumns();

    const getRevenueForPeriod = (projectId: string, start: Date, end: Date) => {
        return workLogs
            .filter(log => {
                const date = new Date(log.date);
                return log.projectId === projectId && date >= start && date <= end;
            })
            .reduce((acc, log) => acc + log.amount, 0);
    };

    const getContractRevenueForPeriod = (contractId: string, start: Date, end: Date) => {
        const contractProjects = projects.filter(p => p.contractId === contractId);
        return contractProjects.reduce((acc, p) => acc + getRevenueForPeriod(p.id, start, end), 0);
    };

    const getTotalRevenueForPeriod = (start: Date, end: Date) => {
        return projects.reduce((acc, p) => acc + getRevenueForPeriod(p.id, start, end), 0);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(`Informe de Control - ${viewMode} - ${currentDate.getFullYear()}`, 14, 20);

        doc.setFontSize(12);
        doc.text(`TCV Total (Contratos): ${totalTCV.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}`, 14, 30);

        const tableData: any[] = [];
        const columns = getColumns();
        const headers = [['Jerarquía / Proyecto', ...columns.map(c => c.label), 'Total']];

        contracts.forEach(contract => {
            const contractProjects = projects.filter(p => p.contractId === contract.id);

            // Contract Header Row
            // Contract Header Row
            const contractLabel = contract.code ? `[${contract.code}]` : `[C] ${contract.title}`;
            const contractRow = [contractLabel, ...columns.map(col => {
                const val = getContractRevenueForPeriod(contract.id, col.start, col.end);
                return val > 0 ? val.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '';
            }), ''];
            tableData.push(contractRow);

            // Project Rows
            contractProjects.forEach(p => {
                const row = [`  - ${p.title}`];
                let projectTotal = 0;
                columns.forEach(col => {
                    const rev = getRevenueForPeriod(p.id, col.start, col.end);
                    projectTotal += rev;
                    row.push(rev > 0 ? rev.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '');
                });
                row.push(projectTotal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
                tableData.push(row);
            });
        });

        // Projects without contract
        const orphanProjects = projects.filter(p => !p.contractId);
        if (orphanProjects.length > 0) {
            tableData.push(['Sin Contrato Asignado', ...Array(columns.length + 1).fill('')]);
            orphanProjects.forEach(p => {
                const row = [`  - ${p.title}`];
                let projectTotal = 0;
                columns.forEach(col => {
                    const rev = getRevenueForPeriod(p.id, col.start, col.end);
                    projectTotal += rev;
                    row.push(rev > 0 ? rev.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '');
                });
                row.push(projectTotal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
                tableData.push(row);
            });
        }

        autoTable(doc, {
            startY: 40,
            head: headers,
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [190, 0, 54] },
            styles: { fontSize: 8 },
        });

        doc.save(`control_center_${viewMode}_${currentDate.getFullYear()}.pdf`);
    };

    if (loading) return <div className="p-8">Cargando datos...</div>;

    // Group projects by contract
    const projectsByContract: Record<string, Project[]> = {};
    contracts.forEach(c => projectsByContract[c.id] = []);
    const orphanProjects: Project[] = [];

    projects.forEach(p => {
        if (p.contractId && projectsByContract[p.contractId]) {
            projectsByContract[p.contractId].push(p);
        } else {
            orphanProjects.push(p);
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary-dark">Centro de Control</h1>
                    <p className="text-primary-dark/60">Visión global por Contratos y Proyectos</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white border border-aux-grey rounded-md p-1">
                        <button
                            onClick={() => setViewMode('Monthly')}
                            className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${viewMode === 'Monthly' ? 'bg-primary text-white' : 'text-primary-dark hover:bg-aux-grey/10'}`}
                        >
                            Mensual
                        </button>
                        <button
                            onClick={() => setViewMode('Quarterly')}
                            className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${viewMode === 'Quarterly' ? 'bg-primary text-white' : 'text-primary-dark hover:bg-aux-grey/10'}`}
                        >
                            Trimestral
                        </button>
                        <button
                            onClick={() => setViewMode('Yearly')}
                            className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${viewMode === 'Yearly' ? 'bg-primary text-white' : 'text-primary-dark hover:bg-aux-grey/10'}`}
                        >
                            Anual
                        </button>
                    </div>

                    <div className="flex items-center gap-2 bg-white border border-aux-grey rounded-md px-2 py-1">
                        <button
                            onClick={() => {
                                const newDate = new Date(currentDate);
                                newDate.setFullYear(newDate.getFullYear() - 1);
                                setCurrentDate(newDate);
                            }}
                            className="p-1 hover:bg-aux-grey/10 rounded-full"
                        >
                            <ChevronDown className="h-4 w-4 rotate-90" />
                        </button>
                        <span className="text-sm font-bold text-primary-dark w-16 text-center">
                            {currentDate.getFullYear()}
                        </span>
                        <button
                            onClick={() => {
                                const newDate = new Date(currentDate);
                                newDate.setFullYear(newDate.getFullYear() + 1);
                                setCurrentDate(newDate);
                            }}
                            className="p-1 hover:bg-aux-grey/10 rounded-full"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
                    >
                        <Download className="h-4 w-4" />
                        Exportar Informe
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-primary text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-white/80">Total Contract Value (TCV)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {totalTCV.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <p className="text-xs text-white/60 mt-1">Suma de todos los contratos activos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-primary-dark/60">Revenue Reconocido ({currentDate.getFullYear()})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary-dark">
                            {projects.reduce((acc, p) => {
                                // Calculate total for the current year
                                const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
                                const endOfYear = new Date(currentDate.getFullYear(), 11, 31);
                                return acc + getRevenueForPeriod(p.id, startOfYear, endOfYear);
                            }, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-primary-dark/60">Global Backlog</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-700">
                            {(totalTCV - projects.reduce((acc, p) => {
                                // Total Revenue ALL TIME (not just this year) for Backlog calculation
                                // We need to sum all logs for all projects
                                return acc + workLogs.filter(l => l.projectId === p.id).reduce((sum, l) => sum + l.amount, 0);
                            }, 0)).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <p className="text-xs text-primary-dark/60 mt-1">Pendiente de ejecutar (TCV - Revenue Total)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-primary-dark/60">Contratos Activos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary-dark">
                            {contracts.filter(c => c.status === 'Active').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Planning Matrix */}
            <Card className="overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-primary-dark">Matriz de Revenue - {viewMode === 'Monthly' ? 'Mensual' : viewMode === 'Quarterly' ? 'Trimestral' : 'Anual'}</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-primary-dark uppercase bg-aux-grey/20">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg w-64">Contrato / Proyecto</th>
                                {columns.map((col, i) => (
                                    <th key={i} className="px-2 py-3 text-right">{col.label}</th>
                                ))}
                                <th className="px-4 py-3 text-right rounded-r-lg font-bold">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contracts.map((contract) => {
                                const isExpanded = expandedContracts.has(contract.id);
                                const contractProjects = projectsByContract[contract.id] || [];

                                // Calculate Contract Totals
                                let contractRowTotal = 0;
                                const contractPeriodTotals = columns.map((col) => {
                                    const val = getContractRevenueForPeriod(contract.id, col.start, col.end);
                                    contractRowTotal += val;
                                    return val;
                                });

                                return (
                                    <Fragment key={contract.id}>
                                        {/* Contract Row */}
                                        <tr className="bg-aux-grey/10 border-b border-aux-grey/30 hover:bg-aux-grey/20 cursor-pointer" onClick={() => toggleContract(contract.id)}>
                                            <td className="px-4 py-3 font-bold text-primary-dark flex items-center gap-2">
                                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                <span title={contract.title}>
                                                    {contract.code ? contract.code : contract.title}
                                                </span>
                                                <span className="text-xs font-normal text-primary-dark/60 ml-2">({contract.tcv.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })})</span>
                                            </td>
                                            {contractPeriodTotals.map((val, index) => (
                                                <td key={index} className="px-2 py-3 text-right font-medium text-primary-dark/80">
                                                    {val > 0 ? val.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '-'}
                                                </td>
                                            ))}
                                            <td className="px-4 py-3 text-right font-bold text-primary">
                                                {contractRowTotal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </td>
                                        </tr>

                                        {/* Project Rows (if expanded) */}
                                        {isExpanded && contractProjects.map(project => {
                                            let projectRowTotal = 0;
                                            return (
                                                <tr key={project.id} className="border-b border-aux-grey/10 hover:bg-aux-grey/5">
                                                    <td className="px-4 py-2 pl-10 text-primary-dark text-xs">
                                                        {project.title}
                                                    </td>
                                                    {columns.map((col, index) => {
                                                        const rev = getRevenueForPeriod(project.id, col.start, col.end);
                                                        projectRowTotal += rev;
                                                        return (
                                                            <td key={index} className="px-2 py-2 text-right text-xs text-primary-dark/60">
                                                                {rev > 0 ? rev.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '-'}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="px-4 py-2 text-right text-xs font-medium text-primary-dark">
                                                        {projectRowTotal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </Fragment>
                                );
                            })}

                            {/* Orphan Projects */}
                            {orphanProjects.length > 0 && (
                                <>
                                    <tr className="bg-aux-grey/10 border-b border-aux-grey/30">
                                        <td className="px-4 py-3 font-bold text-primary-dark" colSpan={columns.length + 2}>Sin Contrato Asignado</td>
                                    </tr>
                                    {orphanProjects.map(project => {
                                        let projectRowTotal = 0;
                                        return (
                                            <tr key={project.id} className="border-b border-aux-grey/10 hover:bg-aux-grey/5">
                                                <td className="px-4 py-2 pl-10 text-primary-dark text-xs">
                                                    {project.title}
                                                </td>
                                                {columns.map((col, index) => {
                                                    const rev = getRevenueForPeriod(project.id, col.start, col.end);
                                                    projectRowTotal += rev;
                                                    return (
                                                        <td key={index} className="px-2 py-2 text-right text-xs text-primary-dark/60">
                                                            {rev > 0 ? rev.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '-'}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-4 py-2 text-right text-xs font-medium text-primary-dark">
                                                    {projectRowTotal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </>
                            )}

                            {/* Grand Totals Row */}
                            <tr className="bg-primary/5 font-bold border-t-2 border-primary/20">
                                <td className="px-4 py-3 text-primary-dark">TOTALES</td>
                                {columns.map((col, index) => (
                                    <td key={index} className="px-2 py-3 text-right text-primary">
                                        {getTotalRevenueForPeriod(col.start, col.end).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </td>
                                ))}
                                <td className="px-4 py-3 text-right text-primary text-lg">
                                    {/* Total of the displayed columns */}
                                    {columns.reduce((acc, col) => acc + getTotalRevenueForPeriod(col.start, col.end), 0).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ControlCenterPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <ControlCenterContent />
        </Suspense>
    );
}

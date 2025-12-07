'use client';

import { useEffect, useState, Fragment, useMemo } from 'react';
import { projectService } from '@/services/projectService';
import { contractService } from '@/services/contractService';
import { adminService } from '@/services/adminService'; // For seed button if needed nearby or general utils
import { Project, Invoice, Contract, WorkLog, Client } from '@/types'; // Added Client import if available or we fetch it
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Euro, FileText, AlertCircle, Download, ChevronDown, ChevronRight, BarChart3, TrendingUp, Wallet, PieChart as PieIcon, Activity, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTranslation } from '@/context/LanguageContext';
import { exportRevenueMatrixToExcel } from '@/utils/excelExport';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import PortfolioMatrix from '@/components/PortfolioMatrix';

// Colors for charts
const COLORS = ['#be0036', '#002e67', '#008000', '#FF8042', '#8884d8'];

export default function Dashboard() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Control Center State
  const [viewMode, setViewMode] = useState<'Monthly' | 'Quarterly' | 'Yearly'>('Monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedContracts, setExpandedContracts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsData, invoicesData, contractsData] = await Promise.all([
          projectService.getProjects(),
          projectService.getInvoices(),
          contractService.getContracts()
        ]);

        // Fetch logs for all projects for logic from Control Center
        const allLogs: WorkLog[] = [];
        for (const p of projectsData) {
          const pLogs = await projectService.getWorkLogs(p.id);
          // Explicitly ensure projectId is set on the log objects, as it might be missing if stored in subcollections depending on data entry
          const pLogsWithId = pLogs.map(log => ({ ...log, projectId: p.id }));
          allLogs.push(...pLogsWithId);
        }

        setProjects(projectsData);
        setInvoices(invoicesData);
        setContracts(contractsData);
        setWorkLogs(allLogs);

        // Expand all contracts by default
        setExpandedContracts(new Set(contractsData.map(c => c.id)));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Chart Data Preparation ---

  // 1. Billing Trend (Last 6 Months)
  const billingTrendData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('es-ES', { month: 'short' });

      // Sum invoices for this month
      const totalInfo = invoices
        .filter(inv => {
          const invDate = new Date(inv.date);
          return invDate.getMonth() === d.getMonth() && invDate.getFullYear() === d.getFullYear();
        })
        .reduce((acc, inv) => acc + inv.baseAmount, 0);

      data.push({ name: monthLabel, amount: totalInfo });
    }
    return data;
  }, [invoices]);

  // 2. Client Concentration (by TCV)
  // We need Client Names. For now, we'll group by clientId and label as "Client X" if name not available in Contract directly (Contract has clientId). 
  // In a real app we would join with Client data. We will map clientId to a nice name if possible or use ID.
  const clientConcentrationData = useMemo(() => {
    const clientMap: Record<string, number> = {};
    contracts.forEach(c => {
      // Ideally fetch client name, for now use ID or a mock lookup if we had it. 
      // Let's assume we want to show distribution.
      const val = clientMap[c.clientId] || 0;
      clientMap[c.clientId] = val + c.tcv;
    });
    return Object.keys(clientMap).map(clientId => ({
      name: clientId, // Would be nice to have name
      value: clientMap[clientId]
    }));
  }, [contracts]);

  // 3. Strategic Radar (Average Scores)
  const strategicRadarData = useMemo(() => {
    let totalAlign = 0, totalInnov = 0, totalImpact = 0, totalViab = 0;
    let count = 0;

    projects.forEach(p => {
      if (p.strategicBreakdown) {
        totalAlign += p.strategicBreakdown.alignment || 0;
        totalInnov += p.strategicBreakdown.innovation || 0;
        totalImpact += p.strategicBreakdown.customerImpact || 0;
        totalViab += p.strategicBreakdown.viability || 0;
        count++;
      }
    });

    if (count === 0) return [];

    return [
      { subject: 'Alineación', A: (totalAlign / count).toFixed(1), fullMark: 30 },
      { subject: 'Innovación', A: (totalInnov / count).toFixed(1), fullMark: 30 },
      { subject: 'Impacto', A: (totalImpact / count).toFixed(1), fullMark: 20 },
      { subject: 'Viabilidad', A: (totalViab / count).toFixed(1), fullMark: 20 },
    ];
  }, [projects]);


  // --- Control Center Logic ---
  const toggleContract = (contractId: string) => {
    const newExpanded = new Set(expandedContracts);
    if (newExpanded.has(contractId)) {
      newExpanded.delete(contractId);
    } else {
      newExpanded.add(contractId);
    }
    setExpandedContracts(newExpanded);
  };

  const getColumns = () => {
    const year = currentDate.getFullYear();
    if (viewMode === 'Monthly') {
      return [
        { label: 'Ene', start: new Date(year, 0, 1), end: new Date(year, 0, 31) },
        { label: 'Feb', start: new Date(year, 1, 1), end: new Date(year, 1, 29) },
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
        const date = new Date(log.date); // Assumes string or Date compatible
        // Valid date check
        if (isNaN(date.getTime())) return false;
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
      const contractLabel = contract.code ? `[${contract.code}]` : `[C] ${contract.title}`;
      const contractRow = [contractLabel, ...columns.map(col => {
        const val = getContractRevenueForPeriod(contract.id, col.start, col.end);
        return val > 0 ? val.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '';
      }), ''];
      tableData.push(contractRow);

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

    // Orphans
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

    doc.save(`dashboard_control_${viewMode}_${currentDate.getFullYear()}.pdf`);
  };

  if (loading) return <div className="p-8">{t('common.loading')}</div>;

  // --- KPIs Calculations ---
  // Financial (from original Dashboard)
  const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
  const totalJustified = projects.reduce((acc, p) => acc + p.justifiedAmount, 0);
  const totalBilled = invoices.reduce((acc, i) => acc + i.baseAmount, 0);
  const wipAmount = totalJustified - totalBilled; // Can be negative if billed > justified (Deferred)

  const efficiencyRatio = totalBudget > 0 ? (totalJustified / totalBudget) * 100 : 0;
  const efficiencyData = [
    { name: 'Justificado', value: totalJustified },
    { name: 'Restante', value: Math.max(0, totalBudget - totalJustified) }
  ];

  // Strategic (from Control Center)
  const totalTCV = contracts.reduce((acc, c) => acc + c.tcv, 0);
  const globalBacklog = totalTCV - projects.reduce((acc, p) => {
    // Note: This matches the old logic but ideally we check billed or justified vs TCV. 
    // Assuming Backlog = TCV - Justified for simplicity or WorkLogs sum.
    // Using WorkLogs sum from previous implementation:
    return acc + workLogs.filter(l => l.projectId === p.id).reduce((sum, l) => sum + l.amount, 0);
  }, 0);

  const currentYearRevenue = projects.reduce((acc, p) => {
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
    const endOfYear = new Date(currentDate.getFullYear(), 11, 31);
    return acc + getRevenueForPeriod(p.id, startOfYear, endOfYear);
  }, 0);

  // Grouping for Matrix
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-dark">{t('nav.dashboard')}</h1>
          <p className="text-primary-dark/60">KPIs Financieros y Análisis Estratégico</p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-4">
          {/* Year Selector for Matrix/Data context */}
          <div className="flex items-center gap-2 bg-white border border-aux-grey rounded-md px-2 py-1">
            <button onClick={() => { const d = new Date(currentDate); d.setFullYear(d.getFullYear() - 1); setCurrentDate(d); }} className="p-1 hover:bg-aux-grey/10 rounded-full"><ChevronDown className="h-4 w-4 rotate-90" /></button>
            <span className="text-sm font-bold text-primary-dark w-16 text-center">{currentDate.getFullYear()}</span>
            <button onClick={() => { const d = new Date(currentDate); d.setFullYear(d.getFullYear() + 1); setCurrentDate(d); }} className="p-1 hover:bg-aux-grey/10 rounded-full"><ChevronRight className="h-4 w-4" /></button>
          </div>

          <button onClick={handleExportPDF} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors">
            <Download className="h-4 w-4" />
            Exportar (Matriz)
          </button>
        </div>
      </div>

      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="financial">{t('dashboard.financialTab')}</TabsTrigger>
          <TabsTrigger value="strategic">{t('dashboard.strategicTab')}</TabsTrigger>
        </TabsList>

        {/* --- FINANCIAL TAB --- */}
        <TabsContent value="financial" className="space-y-6">
          {/* Row 1: Financial KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary-dark">{t('dashboard.kpi.budgetActive')}</CardTitle>
                <Euro className="h-4 w-4 text-primary-dark/60" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary-dark">{totalBudget.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                <p className="text-xs text-primary-dark/60">En proyectos en curso</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary-dark">{t('dashboard.kpi.justified')}</CardTitle>
                <FileText className="h-4 w-4 text-primary-dark/60" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary-dark">{totalJustified.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                <p className="text-xs text-primary-dark/60">Producción realizada</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary-dark">{t('dashboard.kpi.wip')}</CardTitle>
                <AlertCircle className="h-4 w-4 text-aux-red" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-aux-red">{Math.max(0, wipAmount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                <p className="text-xs text-primary-dark/60">Riesgo de no cobro</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary-dark">{t('dashboard.kpi.billed')}</CardTitle>
                <Wallet className="h-4 w-4 text-primary-dark/60" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary-dark">{totalBilled.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                <p className="text-xs text-primary-dark/60 text-right">{Math.max(0, -wipAmount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} (Anticipos)</p>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Strategic KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-primary text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-white/80">{t('dashboard.kpi.tcv')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalTCV.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                <p className="text-xs text-white/60 mt-1">Cartera total contratada</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-50 border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-primary-dark/60">{t('dashboard.kpi.backlog')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-700">{globalBacklog.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                <p className="text-xs text-primary-dark/60 mt-1">Pendiente de ejecutar</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-primary-dark/60">{t('dashboard.kpi.revenueYear')} {currentDate.getFullYear()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary-dark">{currentYearRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                <p className="text-xs text-primary-dark/60 mt-1">Reconocido este año</p>
              </CardContent>
            </Card>
          </div>

          {/* Row 3: Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Billing Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-primary-dark">{t('dashboard.billingTrend')}</CardTitle>
                <CardDescription>Facturación mensual últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={billingTrendData}>
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(val) => `€${val / 1000}k`} />
                    <Tooltip formatter={(val: number) => val.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} />
                    <Bar dataKey="amount" fill="#002e67" radius={[4, 4, 0, 0]} name="Facturado" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Operational Efficiency */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-primary-dark">{t('dashboard.efficiency')}</CardTitle>
                <CardDescription>Progreso de Justificación vs Presupuesto Total</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex flex-col items-center justify-center relative">
                {/* Using Pie to simulate Gauge */}
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={efficiencyData}
                      cx="50%"
                      cy="80%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      <Cell key="cell-justified" fill="#008000" />
                      <Cell key="cell-remaining" fill="#f0f0f0" />
                    </Pie>
                    <Tooltip formatter={(val: number) => val.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-10 flex flex-col items-center">
                  <span className="text-4xl font-bold text-primary-dark">{efficiencyRatio.toFixed(1)}%</span>
                  <span className="text-sm text-gray-500">Ejecutado</span>
                </div>
              </CardContent>
            </Card>
          </div>


          {/* Row 3: Revenue Matrix */}
          <Card className="overflow-hidden shadow-lg border-aux-grey/30">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 flex flex-row items-center justify-between">
              <CardTitle className="text-primary-dark">Matriz de Revenue</CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {(['Monthly', 'Quarterly', 'Yearly'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${viewMode === mode ? 'bg-primary text-white' : 'text-primary-dark hover:bg-aux-grey/10'}`}
                    >
                      {mode === 'Monthly' ? 'Mensual' : mode === 'Quarterly' ? 'Trimestral' : 'Anual'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => exportRevenueMatrixToExcel({
                    contracts,
                    projects,
                    columns,
                    getContractRevenueForPeriod,
                    getRevenueForPeriod,
                    getTotalRevenueForPeriod,
                    projectsByContract,
                    viewMode
                  })}
                  className="flex items-center gap-1.5 bg-secondary-teal text-white px-3 py-1 rounded-sm hover:bg-secondary-teal/90 transition-colors text-xs font-medium"
                  title="Exportar a Excel"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  Excel
                </button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-primary-dark uppercase bg-aux-grey/10">
                  <tr>
                    <th className="px-4 py-4 w-80 font-bold border-b border-gray-200">Contrato / Proyecto</th>
                    {columns.map((col, i) => (
                      <th key={i} className="px-2 py-4 text-right border-b border-gray-200 font-semibold">{col.label}</th>
                    ))}
                    <th className="px-4 py-4 text-right font-bold border-b border-gray-200 bg-gray-50">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contracts.map((contract) => {
                    const isExpanded = expandedContracts.has(contract.id);
                    const contractProjects = projectsByContract[contract.id] || [];

                    let contractRowTotal = 0;
                    const contractPeriodTotals = columns.map((col) => {
                      const val = getContractRevenueForPeriod(contract.id, col.start, col.end);
                      contractRowTotal += val;
                      return val;
                    });

                    return (
                      <Fragment key={contract.id}>
                        <tr className="bg-white hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => toggleContract(contract.id)}>
                          <td className="px-4 py-3 font-semibold text-primary-dark flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-primary/50" /> : <ChevronRight className="h-4 w-4 text-primary/50" />}
                            <div>
                              <div className="text-sm">{contract.code ? contract.code : contract.title}</div>
                              <div className="text-xs text-primary-dark/40 font-normal">TCV: {contract.tcv.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                            </div>
                          </td>
                          {contractPeriodTotals.map((val, index) => (
                            <td key={index} className="px-2 py-3 text-right font-medium text-primary-dark/80 group-hover:text-primary-dark">
                              {val > 0 ? val.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '-'}
                            </td>
                          ))}
                          <td className="px-4 py-3 text-right font-bold text-primary bg-gray-50/50">
                            {contractRowTotal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </td>
                        </tr>

                        {isExpanded && contractProjects.map(project => {
                          let projectRowTotal = 0;
                          return (
                            <tr key={project.id} className="hover:bg-blue-50/30 transition-colors">
                              <td className="px-4 py-2 pl-10 text-primary-dark/70 text-xs border-l-4 border-transparent hover:border-primary/20">
                                {project.title}
                              </td>
                              {columns.map((col, index) => {
                                const rev = getRevenueForPeriod(project.id, col.start, col.end);
                                projectRowTotal += rev;
                                return (
                                  <td key={index} className="px-2 py-2 text-right text-xs text-primary-dark/60">
                                    {rev > 0 ? rev.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : ''}
                                  </td>
                                );
                              })}
                              <td className="px-4 py-2 text-right text-xs font-semibold text-primary-dark/80 bg-gray-50/30">
                                {projectRowTotal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    );
                  })}

                  {/* Grand Totals */}
                  <tr className="bg-primary-dark text-white font-bold text-sm">
                    <td className="px-4 py-4">TOTAL</td>
                    {columns.map((col, index) => (
                      <td key={index} className="px-2 py-4 text-right text-white">
                        {getTotalRevenueForPeriod(col.start, col.end).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                    ))}
                    <td className="px-4 py-4 text-right text-white text-base bg-primary">
                      {columns.reduce((acc, col) => acc + getTotalRevenueForPeriod(col.start, col.end), 0).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- STRATEGIC TAB --- */}
        <TabsContent value="strategic" className="space-y-6">
          {/* Row 1: Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Concentration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-primary-dark">{t('dashboard.clientConcentration')}</CardTitle>
                <CardDescription>Valor de Cartera (TCV) por Cliente</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={clientConcentrationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      label={({ name, percent }: { name?: string | number; percent?: number }) => `${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {clientConcentrationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => val.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Strategic Radar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-primary-dark">{t('dashboard.strategicRadar')}</CardTitle>
                <CardDescription>Media de puntuación por criterio</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={strategicRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis />
                    <Radar name="Puntuación Media" dataKey="A" stroke="#be0036" fill="#be0036" fillOpacity={0.6} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Strategic Portfolio Matrix */}
          <div className="pt-6">
            <h3 className="text-lg font-bold text-primary-dark mb-4">{t('dashboard.strategicPortfolio')}</h3>
            <PortfolioMatrix projects={projects} />
          </div>

        </TabsContent>
      </Tabs>
    </div>
  );
}

export const es = {
    common: {
        loading: 'Cargando...',
        save: 'Guardar',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        edit: 'Editar',
        back: 'Volver',
        confirmDelete: '¿Estás seguro de que quieres eliminar este elemento?',
        active: 'Activo',
        closed: 'Cerrado',
        language: 'Idioma'
    },
    nav: {
        dashboard: 'Panel de Control',
        projects: 'Proyectos',
        contracts: 'Contratos',
        billing: 'Facturación',
        settings: 'Configuración'
    },
    dashboard: {
        financialTab: 'Visión Financiera',
        strategicTab: 'Visión Estratégica',
        billingTrend: 'Tendencia de Facturación (6 meses)',
        efficiency: 'Eficiencia Operativa (Justificado vs Presupuesto)',
        clientConcentration: 'Concentración por Cliente (TCV)',
        strategicRadar: 'Radar de Puntuación Estratégica',
        kpi: {
            budgetActive: 'Presupuesto Activo',
            justified: 'Justificado',
            billed: 'Facturado',
            wip: 'WIP (Pendiente)',
            tcv: 'Valor Total Contratos',
            backlog: 'Backlog Global',
            revenueYear: 'Revenue Anual'
        }
    },
    projects: {
        title: 'Proyectos',
        newProject: 'Nuevo Proyecto',
        tabs: {
            strategic: 'Cartera Estratégica',
            execution: 'Control de Ejecución',
            operational: 'Gestión Operativa'
        },
        card: {
            client: 'Cliente',
            budget: 'Presupuesto',
            revenue: 'Revenue',
            billed: 'Facturado',
            wip: 'WIP',
            deferred: 'Diferido'
        },
        portfolioMatrix: {
            title: 'Matriz de Priorización de Cartera',
            description: 'Visualización de Valor (Eje Y) vs. Esfuerzo/Coste (Eje X). El tamaño de la burbuja representa el volumen del proyecto (Revenue).',
            xAxis: 'Coste / Esfuerzo (Presupuesto)',
            yAxis: 'Valor Estratégico (0-100)',
            bubble: 'Volumen (Revenue)',
            highStrategy: 'Alta Estrategia'
        },
        form: {
            tabs: {
                operational: 'Gestión Operativa',
                strategic: 'Gestión Estratégica'
            },
            generalInfo: 'Información General',
            financialInfo: 'Información Financiera',
            strategicInfo: 'Valoración Estratégica',
            budget: 'Presupuesto',
            strategicScore: 'Puntuación Estratégica',
            roi: 'ROI Esperado',
            type: 'Tipo de Proyecto',
            revenueMethod: 'Método de Reconocimiento de Ingresos',
            criteria: {
                alignment: 'Alineación Estratégica (OKRs)',
                innovation: 'Innovación y Mercado',
                customerImpact: 'Impacto Cliente (Tier 1)',
                viability: 'Viabilidad y Riesgo'
            }
        }
    },
    contracts: {
        title: 'Contratos Marco',
        newContract: 'Nuevo Contrato',
        form: {
            tabs: {
                general: 'Datos Generales',
                strategic: 'Eficiencia Comercial'
            },
            tcv: 'Valor Total (TCV)',
            cac: 'Coste de Adquisición (CAC)',
            ratio: 'Ratio Eficiencia'
        }
    },
    billing: {
        title: 'Facturación',
        newInvoice: 'Nueva Factura Manual',
        tabs: {
            pending: 'Pendiente de Facturar',
            history: 'Histórico Facturas',
            reconciliation: 'Conciliación'
        },
        kpi: {
            invoicedYtd: 'Facturado Año Actual',
            outstanding: 'Pendiente de Cobro',
            overdue: 'Vencido',
            forecast: 'Estimado a Facturar',
            wip: 'WIP (Trabajo no facturado)'
        },
        table: {
            number: 'Nº Factura',
            date: 'Fecha',
            project: 'Proyecto',
            concept: 'Concepto',
            amount: 'Importe',
            status: 'Estado',
            dueDate: 'Vencimiento',
            pdf: 'PDF'
        },
        status: {
            paid: 'Pagada',
            sent: 'Enviada',
            draft: 'Borrador'
        },
        actions: {
            billWip: 'Facturar WIP',
            downloadPdf: 'Descargar PDF'
        }
    }
};

export type LocaleKeys = typeof es;

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
        language: 'Idioma',
        user: 'Usuario',
        demoUser: 'Usuario Demo',
        activeSession: 'Sesión Activa',
        saving: 'Guardando...',
        select: 'Seleccionar...',
        title: 'Título',
        monthly: 'Mensual',
        quarterly: 'Trimestral',
        yearly: 'Anual',
        reset: 'Reset',
        all: 'Todo',
        perMonth: 'Por Mes'
    },
    nav: {
        dashboard: 'Panel de Control',
        projects: 'Proyectos',
        contracts: 'Contratos',
        billing: 'Facturación',
        settings: 'Configuración'
    },
    dashboard: {
        strategicPortfolio: 'Cartera Estratégica',
        financialTab: 'Visión Financiera',
        strategicTab: 'Visión Estratégica',
        billingTrend: 'Tendencia de Facturación (6 meses)',
        efficiency: 'Eficiencia Operativa (Revenue vs Presupuesto)',
        clientConcentration: 'Concentración por Cliente (TCV)',
        strategicRadar: 'Radar de Puntuación Estratégica',
        subtitle: 'KPIs Financieros y Análisis Estratégico',
        exportMatrix: 'Exportar (Matriz)',
        internalProjects: {
            title: 'Proyectos Internos',
            disclaimer: '* No incluido en métricas de revenue de producción',
            totalHours: 'Total Horas',
            totalCost: 'Coste Total'
        },
        revenueMatrix: {
            title: 'Matriz de Revenue'
        },
        kpi: {
            budgetActive: 'Presupuesto Activo',
            justified: 'Revenue (Devengado)',
            billed: 'Facturado',
            wip: 'WIP (Pendiente)',
            tcv: 'Valor Total Contratos',
            backlog: 'Backlog Global',
            revenueYear: 'Revenue Anual',
            activeProjects: 'En proyectos en curso',
            productionDone: 'Producción realizada',
            risk: 'Riesgo de no cobro',
            advances: 'Anticipos',
            totalContracted: 'Cartera total contratada',
            toExecute: 'Pendiente de ejecutar',
            recognized: 'Reconocido este año'
        },
        billingTrendSubtitle: 'Facturación mensual últimos 6 meses',
        efficiencySubtitle: 'Progreso de Revenue vs Presupuesto Total',
        executed: 'Ejecutado',
        clientConcentrationSubtitle: 'Valor de Cartera (TCV) por Cliente',
        strategicRadarSubtitle: 'Media de puntuación por criterio',
        averageScore: 'Puntuación Media',
        table: {
            contractProject: 'Contrato / Proyecto',
            total: 'Total'
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
                viability: 'Viabilidad y Riesgo',
                tooltips: {
                    alignment: 'Grado de contribución a los objetivos clave de la empresa y alineación con la visión a largo plazo.',
                    innovation: 'Potencial para generar nuevas oportunidades de mercado, propiedad intelectual o ventajas competitivas tecnológicas.',
                    customerImpact: 'Valor percibido por el cliente, criticidad para su negocio y potencial de fidelización (Tier 1).',
                    viability: 'Factibilidad técnica y operativa. Evalúa la complejidad, recursos disponibles y riesgos de ejecución.'
                }
            }
        },
        detail: {
            tabs: {
                activity: 'Actividad y Progreso',
                billing: 'Facturación',
                eac: 'Análisis EAC',
                strategic: 'Visión Estratégica',
                details: 'Detalles del Proyecto'
            },
            activity: {
                register: 'Registrar Actividad',
                milestones: 'Hitos del Proyecto',
                date: 'Fecha',
                concept: 'Concepto',
                hours: 'Horas',
                costIncurred: 'Coste Incurrido (€)',
                revenueAmount: 'Importe Revenue (€)',
                history: 'Historial de Actividad',
                noActivity: 'No hay actividad registrada',
                thisMonth: 'en este mes',
                totalMonth: 'Total Mes',
                submit: 'Registrar'
            },
            cards: {
                tooltips: {
                    budget: 'Presupuesto total aprobado (BAC). Incluye reservas de contingencia si están definidas.',
                    revenue: 'Ingreso devengado "Earned Value" basado en el avance (Hitos, Coste o Lineal).',
                    margin: 'Margen Bruto Real (Revenue - Costes Directos). Indica la rentabilidad operativa actual.',
                    billed: 'Importe total facurado al cliente hasta la fecha (incluyendo anticipos).',
                    backlog: 'Ingreso pendiente de reconocer (Presupuesto - Revenue). Trabajo futuro asegurado.'
                }
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
            ratio: 'Ratio Eficiencia',
            client: 'Cliente',
            startDate: 'Fecha Inicio',
            endDate: 'Fecha Fin',
            status: 'Estado'
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
    },
    eac: {
        title: 'Análisis EAC',
        bac: 'BAC',
        simulation: 'Simulación',
        saveSimulation: 'Guardar Simulación',
        simulationSaved: 'Simulación guardada correctamente.',
        errorSaving: 'Error al guardar.',
        inputData: 'Datos de Entrada',
        adjustProgress: 'Ajusta el avance real para recalcular.',
        totalBudget: 'Presupuesto Total (BAC)',
        totalBudgetDesc: 'Budget at Completion. Presupuesto total aprobado para el proyecto.',
        actualCost: 'Coste Real Actual (AC)',
        actualCostDesc: 'Actual Cost. Coste real incurrido hasta la fecha.',
        sumCosts: 'Suma de todos los costes registrados.',
        physicalProgress: 'Avance Físico Real (%)',
        physicalProgressTooltip: 'Porcentaje de completitud real del alcance, independiente del coste.',
        physicalProgressDesc: 'Indica el porcentaje de trabajo realmente completado, independientemente del coste.',
        financialProjection: 'Proyección Financiera',
        ev: 'Valor Ganado (EV)',
        evTooltip: 'Valor presupuestado del trabajo realizado (BAC * % Avance)',
        eac: 'Estimado a la Conclusión (EAC)',
        eacTooltip: 'Coste total estimado al finalizar (BAC / CPI).',
        variation: 'Variación (VAC)',
        variationTooltip: 'Desviación esperada del presupuesto (BAC - EAC). Positivo es bueno.',
        cpi: 'Índice Rentabilidad (CPI)',
        cpiTooltip: 'Eficiencia de costes (EV / AC). > 1.0 es eficiente.',
        tcpi: 'Eficiencia Requerida (TCPI)',
        tcpiTooltip: 'Eficiencia necesaria en el resto para cumplir presupuesto.',
        performanceCurve: 'Curva de Rendimiento',
        planned: 'Planificado (PV)',
        projection: 'Proyección'
    }
};

export type LocaleKeys = typeof es;

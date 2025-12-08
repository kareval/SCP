import { SystemChange } from '@/types';

const CHANGES: SystemChange[] = [
    {
        id: '1.2.2',
        date: '2025-12-08T19:30:00.000Z',
        version: '1.2.2',
        title: 'Auditoría Financiera y SPI',
        description: 'Refinamiento del núcleo financiero (EVM Centralizado). Nuevo KPI de Cronograma (SPI) en Dashboard y Alertas de bajo rendimiento.',
        reasoning: 'Garantizar precisión profesional en cálculos de Valor Ganado y detectar desviaciones de tiempo.',
        category: 'Feature'
    },
    {
        id: '1.2.1',
        date: '2025-12-08T18:00:00.000Z',
        version: '1.2.1',
        title: 'Gestión de Riesgos y Alertas',
        description: 'Implementación del módulo de Riesgos (Reserva de Contingencia), análisis de escenarios EAC (Optimista/Pesimista) y Sistema de Alertas Proactivas (CPI, WIP, Vencimiento).',
        reasoning: 'Necesidad de anticipar desviaciones financieras y operativas antes de que se conviertan en problemas críticos.',
        category: 'Feature'
    },
    {
        id: '1.2.0',
        date: '2025-12-07T10:00:00.000Z',
        version: '1.2.0',
        title: 'Nueva Gestión de Facturación (Billing Overhaul)',
        description: 'Rediseño completo del módulo de facturación. Ahora permite ciclo de vida completo de facturas (Borrador -> Enviada -> Cobrada), conciliación y previsión de flujos de caja.',
        reasoning: 'El sistema anterior no permitía un seguimiento granular del estado de las facturas ni proyecciones de cobro.',
        category: 'Feature'
    },
    {
        id: '1.1.8',
        date: '2025-12-06T14:30:00.000Z',
        version: '1.1.8',
        title: 'Herramientas de Administración de Datos',
        description: 'Añadidas herramientas para gestión de base de datos en Configuración: Seed (Carga de datos de prueba) y Reset completo.',
        reasoning: 'Facilitar pruebas y limpieza de entornos de desarrollo/demo.',
        category: 'Feature'
    },
    {
        id: '1.1.5',
        date: '2025-12-05T16:00:00.000Z',
        version: '1.1.5',
        title: 'Métricas Financieras Avanzadas (CFO)',
        description: 'Implementación de Business Intelligence: Cálculo de Margen Real, Pipeline (Backlog Global), Fugas de Ingresos y Utilización de recursos.',
        reasoning: 'Proporcionar una visión financiera más profunda más allá de la facturación básica.',
        category: 'Feature'
    },
    {
        id: '1.1.2',
        date: '2025-12-04T12:00:00.000Z',
        version: '1.1.2',
        title: 'Planificación Presupuestaria Temporal',
        description: 'Nuevo módulo de Planificación (Budget Planner) que permite distribuir el presupuesto por fases y meses.',
        reasoning: 'Necesidad de comparar la ejecución real mes a mes contra una línea base planificada.',
        category: 'Feature'
    },
    {
        id: '1.1.0',
        date: '2025-12-03T09:00:00.000Z',
        version: '1.1.0',
        title: 'Análisis de Valor Ganado (EBS/EAC)',
        description: 'Implementación del estándar Earned Value Management. Cálculo automático de EV (Earned Value), CPI (Cost Performance Index) y estimaciones a fin de proyecto (EAC).',
        reasoning: 'Estándar de oro para medir el rendimiento real de proyectos complejos.',
        category: 'Feature'
    },
    {
        id: '1.0.8',
        date: '2025-12-02T15:00:00.000Z',
        version: '1.0.8',
        title: 'UX: Menú Replegable y Mejoras de Navegación',
        description: 'Mejoras de usabilidad en la barra lateral y optimización del espacio de pantalla para tablas complejas.',
        reasoning: 'Feedback de usuarios sobre el espacio disponible en pantallas de portátiles.',
        category: 'Refactor'
    },
    {
        id: '1.0.5',
        date: '2025-12-01T11:00:00.000Z',
        version: '1.0.5',
        title: 'Reconocimiento de Ingresos (Revenue Recognition)',
        description: 'Lógica avanzada de reconocimiento de ingresos separada de la facturación. Soporte para métodos: Lineal, % Completado y Time & Materials.',
        reasoning: 'Diferenciar contablemente lo facturado (Cash flow) de lo producido (Revenue/P&L).',
        category: 'Feature'
    },
    {
        id: '1.0.2',
        date: '2025-11-28T10:00:00.000Z',
        version: '1.0.2',
        title: 'Jerarquía de Contratos Marco',
        description: 'Introducción de la entidad "Contrato" para agrupar múltiples proyectos bajo un mismo acuerdo marco (Master Service Agreement).',
        reasoning: 'Clientes grandes requieren gestionar presupuestos globales compartidos entre varios proyectos.',
        category: 'Refactor'
    },
    {
        id: '1.0.0',
        date: '2025-11-25T09:00:00.000Z',
        version: '1.0.0',
        title: 'Lanzamiento Inicial SCP',
        description: 'Versión inicial del Sistema de Control de Presupuesto. Gestión básica de Proyectos, Clientes y reportes mensuales PDF.',
        reasoning: 'MVP para validar la gestión centralizada de proyectos.',
        category: 'Feature'
    }
];

export const changelogService = {
    getChanges: (): SystemChange[] => {
        return CHANGES;
    },
};

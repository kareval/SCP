import { SystemChange } from '@/types';

const CHANGES: SystemChange[] = [
    {
        id: 'chg-004',
        date: '2025-12-08T12:00:00.000Z',
        version: '1.2.0',
        title: 'Menú Lateral Replegable',
        description: 'Se ha implementado la funcionalidad para contraer el menú lateral, optimizando el espacio de trabajo.',
        reasoning: 'Maximizar el área útil para visualización de datos complejos como la Matriz de Ingresos.',
        category: 'Feature'
    },
    {
        id: 'chg-003',
        date: '2025-12-08T11:00:00.000Z',
        version: '1.1.5',
        title: 'Refactorización del Dashboard y Separación de KPI',
        description: 'Se ha corregido el error de construcción en el Dashboard y se han separado los controles temporales.',
        reasoning: 'Necesidad de controlar independientemente la visualización de la Matriz de Ingresos y las Tendencias de Facturación sin afectar a los KPIs globales de ciclo de vida.',
        category: 'Refactor'
    },
    {
        id: 'chg-002',
        date: '2025-12-06T18:00:00.000Z',
        version: '1.1.0',
        title: 'Nuevo Módulo de Facturación y Overhaul',
        description: 'Implementación completa del nuevo sistema de facturación, gestión de facturas pendientes, históricas y conciliación.',
        reasoning: 'El sistema anterior carecía de trazabilidad suficiente para la gestión financiera avanzada y el control de hitos de pago.',
        category: 'Feature'
    },
    {
        id: 'chg-001',
        date: '2025-12-04T10:00:00.000Z',
        version: '1.0.0',
        title: 'Lanzamiento Inicial SCP',
        description: 'Versión inicial del Sistema de Control de Presupuesto.',
        reasoning: 'Greenfield project deployment.',
        category: 'Feature'
    }
];

export const changelogService = {
    getChanges: (): SystemChange[] => {
        return CHANGES;
    },

    // Future: addChange, deleteChange linked to a storage if creating dynamic changelog
};

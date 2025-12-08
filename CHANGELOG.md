# Historial de Mejoras

## [Unreleased]

## [1.2.0] - 2025-12-08
### Añadido
- **Gestión de Riesgos Financieros**:
    - Campo `contingencyReserve` (% de reserva) añadido a los proyectos.
    - Cálculo visual de la reserva en el formulario de edición de proyectos.
    - Análisis EAC (Estimate at Completion) actualizado para incluir escenarios Optimistas y visualización de reservas.
- **Sistema de Alertas Proactivas**:
    - Nuevo servicio de alertas (`alertService`) que monitoriza riesgos financieros, operativos y de planificación.
    - **Panel de Alertas Activas**: Sección en el Dashboard principal que resume los riesgos críticos y advertencias de todos los proyectos activos.
    - **Indicadores en Listado**: Iconos de alerta en las tarjetas de proyecto (Listado de Proyectos) para identificar rápidamente problemas (CPI bajo, Sobrecoste, Vencimiento, etc.).

### Modificado
- **Dashboard Principal**:
    - Se ha reestructurado la pestaña "Financiera" para incluir las alertas.
    - Se ha optimizado la carga de datos para incluir logs de todos los proyectos.
- **Listado de Proyectos**:
    - Ahora muestra iconos de alerta visuales con tooltips detallados sobre los riesgos específicos.
- **Formulario de Proyecto**:
    - Restaurado y mejorado el componente `EditProjectClient` para incluir la gestión de reservas y corregir errores de validación.

### Corregido
- Restaurada la funcionalidad completa de edición de proyectos tras corrupción de archivo.
- Corregidos errores de linting en `EditProjectClient` y `Dashboard`.
- **EAC Dashboard**: Corregido bug de sincronización que impedía ver cambios en tiempo real sin refrescar.
- **Visualización**:
    - Añadido desglose explícito de "Presupuesto Operativo" vs "Venta" en ficha de proyecto.
    - Añadida gráfica comparativa de escenarios (Optimista, Probable, Pesimista) en Dashboard EAC.

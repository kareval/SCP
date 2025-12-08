# Resumen de Características - Sistema de Control Presupuestario (SCP)

Este documento resume las capacidades funcionales y técnicas de la aplicación, diseñada para la gestión financiera avanzada de proyectos de servicios.

## 1. Gestión de Proyectos y Estrategia
El núcleo del sistema permite una definición granular de los proyectos para adaptarse a la realidad contractual.

*   **Tipología de Proyectos Flexible:**
    *   **Time & Materials (T&M):** Facturación por horas/esfuerzo. Soporta tarifas globales y tarifas específicas por proyecto (Overrides).
    *   **Precio Cerrado (Fixed Price):** Facturación por entregables. Control estricto de margen sobre presupuesto.
    *   **Internos/I+D:** Proyectos de coste puro sin ingresos, para control de inversión interna.
*   **Métodos de Reconocimiento de Ingresos (Revenue Recognition):**
    *   **Input Method (Cost-to-Cost):** Ingreso devengado basado en el % de coste incurrido sobre el estimado.
    *   **Output Method (Hitos):** Ingreso devengado estrictamente al completar hitos contractuales.
    *   **Lineal:** Distribución uniforme del ingreso en el tiempo.
*   **Evaluación Estratégica (Radar Chart):**
    *   Valoración cualitativa del proyecto en ejes clave: Alineación Estratégica, Innovación, Impacto en Cliente y Viabilidad.
    *   Cálculo automático de un "Strategic Score" (0-100).

## 2. Control Financiero Avanzado (CFO Mode)
Herramientas diseñadas para la dirección financiera y el control de gestión.

*   **Análisis de Valor Ganado (EVM - Earned Value Management):**
    *   Cálculo en tiempo real de **KPIs estándar**: CPI (Eficiencia de Coste), SPI (Eficiencia de Cronograma), TCPI (Desempeño necesario para terminar en presupuesto).
    *   **Análisis EAC (Estimate at Completion):** Proyección del coste final con tres escenarios:
        *   **Optimista:** Recuperación de eficiencia y uso nulo de reservas.
        *   **Probable (Tendencia):** Proyección basada en el CPI histórico actual.
        *   **Pesimista (Riesgo):** Escenario probable + consumo total de contingencias.
*   **Posición Contable (WIP vs Deferred):**
    *   Cálculo automático de la posición financiera neta en base a `Ingreso Devengado (EV)` vs `Facturado`.
    *   **WIP (Work In Progress):** Activo. Trabajo realizado pendiente de facturar.
    *   **Deferred Revenue (Ingreso Diferido):** Pasivo. Importes facturados por adelantado (anticipos) pendientes de ejecutar.
*   **Gestión de Riesgos y Reservas:**
    *   Definición explícita de **Reserva de Contingencia** (% o importe) separada del Presupuesto Operativo.
    *   Visualización del impacto de la reserva en los escenarios de cierre.

## 3. Planificación y Presupuestación
Módulos para la proyección temporal de ingresos y costes.

*   **Planificación Presupuestaria (Budget Planner):** Distribución del presupuesto por Fases y Meses (Spreadsheet view) para establecer la línea base de costes (PV).
*   **Previsión de Facturación (Billing Planner):** Planificación de hitos de facturación futuros. Permite al CFO prever el flujo de caja (Cash Flow) y la evolución del Desfase de Facturación.

## 4. Gestión Operativa y Seguimiento
Registro de la actividad diaria del equipo.

*   **Imputación de Tiempos (Work Logs):**
    *   Registro de horas por recurso y concepto.
    *   Cálculo automático de **Coste** (basado en Cost Rate del recurso) y **Venta Teórica** (basado en Bill Rate).
    *   Soporte para correcciones y borrado con recálculo automático de devengos.
*   **Gestión de Hitos:** Seguimiento de progreso físico (% completado) y fechas de hitos clave.

## 5. Facturación y Contratos
Ciclo completo de gestión de ingresos.

*   **Gestión de Contratos Marco:** Agrupación de múltiples proyectos bajo un contrato principal (Control de TCV - Total Contract Value).
*   **Ciclo de Facturación:**
    *   Emisión de facturas (Borrador -> Enviada -> Cobrada).
    *   Gestión de **Anticipos** (facturas que no generan ingreso, solo caja y pasivo).
    *   Conciliación visual entre Producción (Revenue) y Facturación.

## 6. Cuadro de Mando y Reporting
Visibilidad global para la toma de decisiones.

*   **Control Center (Global Dashboard):**
    *   Matriz de Ingresos Mensuales por Proyecto.
    *   KPIs agregados de Backlog, Cartera y Rentabilidad.
*   **Sistema de Alertas Proactivas:**
    *   Monitorización automática de riesgos 24/7.
    *   Alertas por **Desviación de Coste** (CPI < 0.85).
    *   Alertas por **Retraso** (SPI < 0.90 o Vencimiento próximo).
    *   Alertas por **Consumo de Presupuesto** acelerado.
*   **Reporting:** Generación de informes mensuales de actividad.

## 7. Administración y Sistema
*   **Gestión de Roles:** Simulación de perfiles (PM vs CFO) para ajustar la visibilidad de datos sensibles.
*   **Auditoría:** Historial de cambios del sistema (Changelog).
*   **Data Management:** Herramientas de "Seed" (Datos de prueba con escenarios realistas: Riesgo, Éxito, Startup) y Reset de base de datos.

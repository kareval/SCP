# Análisis de Tratamiento de Costes y Márgenes
Este documento detalla cómo la aplicación calcula y gestiona los costes para cada tipología de proyecto y escenario, asegurando la consistencia financiera.

## 1. Lógica General de Costes
En todos los casos, el coste se origina principalmente por la imputación de horas de los recursos.

*   **Coste Unitario (Cost Rate):** Cada recurso tiene un coste hora interno estándar.
*   **Overrides (Tarifas de Proyecto):** Es posible definir un coste hora específico para un recurso en un proyecto concreto (e.g., un senior cobrando como junior en un proyecto estratégico).
*   **Fórmula:** `Coste Total = Σ (Horas Imputadas × Cost Rate Aplicable)`

## 2. Tratamiento por Tipo de Proyecto

### A. Proyecto Time & Materials (T&M)
El modelo financiero más directo. El margen depende de la diferencia entre la tarifa de venta y el coste interno.

*   **Ingresos (Revenue):** `Horas × Bill Rate`.
*   **Costes:** `Horas × Cost Rate`.
*   **Margen:** Directamente proporcional a la eficiencia de las tarifas.
*   **Escenario Típico:**
    *   *Consultor Senior (Coste 40€/h, Venta 80€/h)*. Margin ~50%.

### B. Proyecto Precio Cerrado (Fixed Price)
Aquí se desacopla el esfuerzo (coste) del ingreso (precio pactado). El riesgo recae en la eficiencia.

*   **Ingresos (Revenue):** Definidos por el método de reconocimiento (Hitos/Avance/Lineal). **NO dependen de las horas trabajadas.**
*   **Costes:** Realidad del esfuerzo imputado (`Horas × Cost Rate`).
*   **Margen:** `Precio Fijo - Costes Reales`.
*   **Riesgo:** Si se imputan más horas de las estimadas, el coste sube pero el ingreso se mantiene plano -> El margen se erosiona.

### C. Proyecto Interno (I+D)
Proyectos de inversión pura. No generan ingresos de producción.

*   **Ingresos (Revenue):** SIEMPRE 0€.
*   **Costes:** `Horas × Cost Rate`.
*   **Impacto Contable:** Todo el coste se considera inversión o gasto estructural.
*   **Margen:** Negativo (-100% del coste).

## 3. Análisis de Escenarios (Casos de Prueba)

### Caso 1: Golden Path (Éxito)
*   **Tipo:** Fixed Price.
*   **Comportamiento:** El avance físico (Hitos/Input) va alineado con el gasto.
*   **Resultado:** Margen saludable preservado (~30%+).

### Caso 2: Riesgo Financiero (CPI Bajo)
*   **Tipo:** Fixed Price.
*   **Problema:** Se han consumido muchas más horas (Coste) de las planificadas para alcanzar un hito.
*   **Síntoma:** El `Justified Amount` (Ingreso) avanza lento, pero el `Actual Cost` se dispara.
*   **Indicador:** CPI < 1.0 (e.g., 0.6). El margen real cae drásticamente respecto al presupuestado.

### Caso 3: High WIP (Work In Progress)
*   **Tipo:** T&M o Input Method.
*   **Situación:** Se ha trabajado mucho (Coste alto) y se ha devengado ingreso (Revenue alto), pero **no se ha facturado** al cliente (Billed bajo).
*   **Contabilidad:** Genera un ACTIVO en balance (WIP). La empresa ha "adelantado" dinero.

### Caso 4: Startup / Diferido
*   **Tipo:** Fixed Price (Linear/Output).
*   **Situación:** El cliente paga por adelantado (Billed alto), pero el proyecto apenas ha comenzado (Revenue/Coste bajos).
*   **Contabilidad:** Genera un PASIVO (Deferred Revenue). La empresa "debe" trabajo al cliente.

## 4. Matriz de Rentabilidad
| Tipo | Driver de Ingreso | Driver de Coste | Riesgo Principal |
| :--- | :--- | :--- | :--- |
| **T&M** | Horas Trabajadas | Horas Trabajadas | Baja Utilización (No billing) |
| **Fixed** | Hitos / Avance | Horas Trabajadas | Sobre-esfuerzo (Bajada de Margen) |
| **Interno**| N/A (0€) | Horas Trabajadas | Coste de Oportunidad |

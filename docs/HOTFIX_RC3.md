# MICODENT - RC3: caja y sincronizacion financiera

Fecha: 2026-09-24. Trabajo local sobre el hotfix aislado, sin GitHub.
No se modifican BD habituales, .env, uploads, piloto ni instalaciones familiares.
Conserva los pendientes de seguridad e integracion de RC1/RC2: NO aprobado para
despliegue clinico. No hay nueva migracion respecto al hotfix 001.

## Causa y reglas

El pago de laboratorio ya se registraba, pero el KPI principal mostraba produccion:
alli el costo externo se descuenta del abono antes de calcular la comision.
Restar otra vez el desembolso al laboratorio duplicaria ese costo.

Se mantienen dos secciones, ambas con el rango de fechas seleccionado:

- Caja: entradas = abonos vigentes + recargos de tarjeta registrados.
- Salidas = pagos de laboratorio + gastos activos por su fecha de pago.
- Flujo neto registrado = entradas - salidas. Puede ser negativo.
- Produccion: abonos - costos externos aplicados - comisiones generadas - gastos.
- Las comisiones generadas NO equivalen a comisiones pagadas; no se inventa una
  salida de caja. Las penalidades siguen ajustando la comision neta del doctor.
- El flujo no contiene saldo inicial, liquidaciones bancarias ni movimientos no
  registrados. No debe presentarse como saldo bancario, efectivo disponible o
  contabilidad completa. Un mismo desembolso no debe registrarse en Laboratorio
  y nuevamente como Gasto: no existe deduplicacion entre esos dos conceptos.
- Un gasto anulado no suma; reactivarlo lo incorpora una sola vez. Mover su fecha
  lo traslada de periodo. Una anulacion de abono excluye tambien su recargo.
- Los costos historicos desconocidos siguen como Por conciliar en produccion;
  no impiden mostrar movimientos de caja cuya cuantia si esta registrada.

El filtro Doctor mantiene su alcance anterior: tabla por profesional, no caja
global. Laboratorio muestra pendientes/historial de todos los periodos; el resumen
solo suma desembolsos dentro del periodo seleccionado.

## Sincronizacion

El interceptor API emite un evento despues de mutaciones financieras exitosas.
Refresca resumen, gastos, laboratorio y actividad abierta; produccion escucha
el mismo evento. No se guardan datos clinicos ni importes en la notificacion.
Las respuestas antiguas no sustituyen la ultima solicitud del dashboard.
Se eliminaron recargas duplicadas de los manejadores de guardado.

Misma pagina: inmediata al completar el guardado y la consulta posterior.
Pestanas del mismo origen/navegador: evento storage, si el navegador lo permite.
Otras sesiones contra LA MISMA BD: refresco cada 30 s con pagina visible y al
recuperar foco/visibilidad; no es WebSocket ni garantia de tiempo real.
NO sincroniza las bases independientes de las laptops Edy/Miguel.
Un fallo al actualizar el resumen deja un aviso y Reintentar; no se oculta
como si los importes fueran actuales. La restriccion de storage no convierte
un pago confirmado por el servidor en un error de guardado.

## Archivos

- Backend `src/controllers/dashboard.controller.js`: agregado de caja separado.
- Backend `src/controllers/gastos.controller.js`: importe/fecha en alta y edicion,
  bloqueo de fila en edicion/anulacion/reactivacion; mensajes de validacion 400.
- Frontend `src/utils/financeEvents.js`, `src/services/api.js`: notificacion comun.
- Frontend `src/pages/FinanzasDashboard.jsx`: KPIs de caja y refresco completo.
- Frontend `src/pages/Produccion.jsx`: refresco por evento/foco/visibilidad/intervalo.
- Backend `tests/hotfix-integration.cjs`, `tests/finance-browser.cjs`,
  `tests/hotfix-browser.cjs`; frontend `tests/financeEvents.test.mjs`.
- Identificacion RC3 en health, `scripts/package-frontend.js` y
  `scripts/package-hotfix.cjs`; build actualizado en backend/public.

## Verificacion

- 29 pruebas unitarias backend/launcher y 5 frontend aprobadas.
- 15 escenarios API aprobados en MariaDB 10.4.32 y MySQL 8 aislados.
- Pago concurrente/idempotente al laboratorio: salida 90, flujo -90, produccion
  sin doble descuento. Pago con tarjeta 25 + recargo 1; anulacion revierte ambos.
- Gastos 12.34 -> 20.05 -> anulado -> reactivado -> otro periodo: efectos exactos;
  importe negativo/cero/no numerico/con mas de dos decimales y fecha imposible rechazados.
- Edge DEV y build: pago a laboratorio desde UI, alta/edicion/anulacion/reactivacion
  de gasto; resumen, lista y actividad actualizados en otra pestana sin recargar.
  Un guardado rechazado no notifica ni cambia caja. Cero excepciones JS observadas.
- Se repitieron pruebas de recetas, Rx/mapas, firma/sello, menus y permisos doctor.
- Capturas desktop y movil revisadas; sin desbordamiento de pagina.
- Build correcto. Lint de api, financeEvents y Produccion correcto; el dashboard
  conserva errores heredados de set-state-in-effect. No se desactivo
  la regla ni se declara limpio el lint global del proyecto.

Evidencia: `.runtime/qa-1790224606302` (MariaDB, DEV/build y capturas),
`.runtime/qa-1790265108842` (MySQL). Solo datos sinteticos y catalogo Rx autorizado.
No se probaron laptops ni sesiones remotas reales ni contabilidad externa.

## Reversion y limites

Actualizar backend y frontend como conjunto; un backend anterior no tiene caja.
Esta revision no transforma ni borra datos y no requiere restaurar una BD previa.
Ante regresion, conservar datos posteriores, logs privados y version desplegada;
volver al conjunto RC2 compatible con el mismo esquema 001, preservando .env y
uploads. No ejecutar el SQL original ni reemplazar la BD con la demo.
La idempotencia de gastos generales y un libro de caja/conciliacion completa son
trabajo posterior; esta revision no afirma haberlos implementado.

# MICODENT RC4 - Pendientes, resumen y recargo POS

Fecha: 2026-09-24. Cambios locales autorizados. Sin GitHub ni despliegue en laptops.
Workspace: `MICODENT_DEV/.runtime/hotfix-clinico`.
Referencia previa conservada: paquete RC3, manifiesto y ZIP SHA-256
`9d3d9ab3aedf9dc4b475d1d068e669e95ba41b7ca08ae51771dd365cf57e4fa0`.
No se modifica la BD habitual micodent_dev ni la original micodent.

## Cambios

- Se conserva la sincronizacion RC3 de caja, gastos, laboratorio, produccion y
  actividad. Pagar laboratorio reduce el flujo, no vuelve a descontar un costo
  que ya fue aplicado a la produccion. El periodo seleccionado sigue importando.
- Resumen: cuatro indicadores de caja y tres de produccion. Se retiran los KPI
  duplicados Total Cobrado y Gastos Operativos, y la segunda cifra de laboratorio.
  Entradas incluye recargos; el detalle por doctor sigue mostrando abonos sin POS.
  El costo de tratamientos registrados en el periodo no se etiqueta como factura.
- Produccion: encabezados numericos a la derecha, mismo padding y limites de
  columna que sus importes, numeros tabulares y scroll horizontal interno.
- Inicio: se devuelve cada tratamiento con saldo positivo, agrupado por paciente,
  con costo, a cuenta y pendiente. Ya no se limita silenciosamente a 10 pacientes.
  Los tratamientos liquidados desaparecen; anular el pago restituye el pendiente.
  Se conservan deudas de historias archivadas; archivarlas no salda obligaciones.
- Inicio se refresca por eventos financieros, entre pestanas y al recuperar foco;
  consulta cada 30 segundos cuando es visible. Ingresos Hoy incluye recargos.
- La tabla por doctor cuenta pacientes con cobros en el periodo; tratamientos
  sin abonos no inflan ese contador.

## POS y preservacion historica

El boton de ajustes junto al total de recargos permite a administracion guardar
un porcentaje entre 0 y 100, con hasta dos decimales. 0 desactiva el recargo.
Solo usuarios autenticados leen el valor; solo soloAdmin puede modificarlo.
No se otorgan permisos nuevos a Edy ni se cambian perfiles.

Backend calcula en centimos, sin aceptar un recargo calculado por el cliente:
recargo = redondear(abono_en_centimos * porcentaje_en_centesimas / 10000).
El recargo se suma al total a cobrar; no cancela mas deuda ni aumenta comisiones.
Nuevo tratamiento y abono posterior ofrecen Efectivo o Tarjeta (POS), mostrando
porcentaje, recargo y total antes de confirmar.

Se exige la revision POS consultada al confirmar una tarjeta. Si la configuracion
cambio, se rechaza TODO el cobro/tratamiento y se pide reabrir el formulario.
Un cliente antiguo sin revision POS tambien se rechaza, evitando un cobro distinto
del mostrado en una pestana antigua. Efectivo no depende del porcentaje.
Dos administradores editando la misma revision no se pisan: el segundo recibe 409.
El cambio y su auditoria se guardan en una transaccion; cobros bloquean lectura
de configuracion hasta confirmar. El reintento de un cobro ya confirmado conserva
su respuesta original incluso si cambia el porcentaje posteriormente.

No se recalculan abonos anteriores. `pagos.recargo_pos` conserva el importe;
`finanzas_pago_pos` registra porcentaje y revision de tarjetas NUEVAS. Los cobros
anteriores sin ese registro no reciben un porcentaje historico inventado.

## Migracion aditiva 002

`micodent-backend/migrations/002_pos.sql` agrega:

- `finanzas_configuracion`: fila unica utilizada por la aplicacion (id=1),
  porcentaje inicial 4.00, igual al valor fijo previo, y revision.
- `finanzas_pago_pos`: snapshot de porcentaje/revision por pago con FK.
- Marcador 002, escrito por `scripts/migrate-hotfix.js` al completar el proceso.

Reejecutar no sustituye la configuracion guardada ni transforma pagos existentes.
DDL de MySQL/MariaDB no es transaccional de extremo a extremo: si falla, no aprobar
ni abrir el sistema; revisar la copia y reejecutar el proceso verificado. Health
exige ambas migraciones y las estructuras POS; no declara listo un esquema 001.
Solo se ejecuto en instancias sinteticas nuevas, verificando datadir y puertos.

ANTES de aplicar a una instalacion real se requiere respaldo coordinado BD,
uploads, configuracion y version, restauracion comprobada y autorizacion de
despliegue. Actualizar frontend/backend/migracion como conjunto. No importar el
SQL original ni copiar la base sintetica sobre una instalacion existente.

## Archivos principales

Backend: `src/controllers/dashboard.controller.js`, `pos.controller.js`,
`cobros.controller.js`, `src/services/finanzas.js`, `src/routes/dashboard.routes.js`,
`src/index.js`, `migrations/002_pos.sql`, `scripts/migrate-hotfix.js` y scripts de paquete.
Frontend: `src/pages/Dashboard.jsx`, `FinanzasDashboard.jsx`, `Produccion.jsx`,
`PacienteDetalle.jsx`, `src/components/MetodoPago.jsx`, `ConfiguracionPos.jsx`,
`src/services/api.js`, `src/utils/financeEvents.js` y build.
Pruebas: `tests/pos-debt-integration.cjs`, `tests/pos-debt-browser.cjs`, runners
existentes y `micodent-frontend/tests/financeEvents.test.mjs`.

## Pruebas y limites

- 29 unitarias backend/launcher y 5 frontend. Build correcto; mantiene aviso de
  bundle mayor de 500 kB. Lint focal de componentes nuevos y Produccion aprobado;
  el proyecto conserva deuda de lint anterior, no se declara limpio globalmente.
- 17 escenarios API en MariaDB y MySQL: POS 4 -> 5.5, 0, valores invalidos,
  permisos, revision faltante/antigua, transaccion, concurrencia, migracion
  repetida, reintento y conservacion de historicos. Doce pacientes y multiples
  tratamientos prueban que no se ocultan deudas; liquidacion/anulacion correctas.
- Edge DEV y build: selector inicial y posterior POS, configuracion desde UI,
  total 100 + 5.50 y 280 + 15.40; pendientes se actualizan en otra pestana;
  no hay KPI duplicados y las columnas numericas coinciden en alineacion/padding.
  Se mantienen pruebas RC3 de gastos/laboratorio, Rx, firmas, recetas y permisos.
- Capturas escritorio/movil y modales en cuatro resoluciones. Datos sinteticos;
  no constituyen pruebas con la laptop de Edy, hardware POS ni impresora fisica.

El reporte de pendientes ahora devuelve todos los saldos, sin paginacion servidor;
la optimizacion con gran volumen queda para la etapa de rendimiento. No se afirma
sincronizacion entre bases independientes ni contabilidad/bancos completos.
Persisten los requisitos de integracion S1-A/S1-B y aceptacion clinica de RC1/RC2.
RC4 es candidato de desarrollo, no aprobacion de produccion.

Evidencia final: `.runtime/qa-1790267736853` (MariaDB, DEV/build, capturas, PDF),
`.runtime/qa-1790267737160` (MySQL). Ambos con los controles finales de revision
POS obligatoria y contador de pacientes corregido. Resultado: 17 escenarios API
por motor y navegador DEV/build aprobados, cero excepciones JS observadas.

## Reversion

No restaurar una BD antigua descartando cobros posteriores. Conservar tablas 002,
pagos, auditoria y datos nuevos. RC3 entiende los importes almacenados, pero su
codigo vuelve al porcentaje fijo 4: si la configuracion ya cambio, NO reabrir
cobros POS bajo RC3 como rollback transparente. Suspender esos cobros y preparar
un parche compatible o confirmar administrativamente la politica antes de abrir.
No borrar snapshots/configuracion para hacer aparentar compatibilidad.

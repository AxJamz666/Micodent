# MICODENT - Hotfix financiero y clinico RC1

Fecha: 2026-09-23. Estado: implementado y probado en instancias desechables.
No aprobado como ESTABLE de produccion; no instalado en las laptops ni en la BD habitual de DEV.
No se hicieron commits, push ni pull requests por instruccion del propietario.

## Baseline y contencion

Codigo de trabajo: `C:\Users\Jamz\Desktop\MICODENT_DEV\.runtime\hotfix-clinico`.
Entrada conservada: `C:\Users\Jamz\Desktop\MICODENT_DEV\.runtime\baseline-clinica`.
Rama local: `codex/hotfix-clinico-financiero`, base Git `4af578e`, seguida de la importacion clinica.
El manifiesto de entrega identifica los archivos efectivos, no solo el commit previo.

Se conserva Express sirviendo React compilado, `/api/health`, uploads y launcher.
La rama previa `codex/s1b2-cookies-csrf` y el DEV principal permanecen separados.
IMPORTANTE: los cambios S1-A/S1-B aceptados en esa otra rama NO estan integrados
en este candidato clinico. Antes de convertirlo en baseline unica de las 17 fases,
debe completarse su reconciliacion con pruebas MySQL/MariaDB; no se consideran descartados.
La autenticacion heredada todavia admite credenciales antiguas no bcrypt y JWT en
localStorage. Este hotfix no certifica seguridad completa ni cumplimiento clinico/legal.

## Problemas y causas

| Problema | Evidencia y solucion |
| --- | --- |
| Actividad mostraba caracteres numerados | MariaDB devuelve JSON como texto; Object.entries recorria caracteres. Normalizacion defensiva de objeto/texto/doble serializacion y etiquetas humanas. |
| Rx producia pantalla blanca | Reproduccion del contrato JSON antiguo: `(e[n] || []).map is not a function`. Se normalizan colecciones en API y frontend. No fue necesario mover imagenes Base64 ni archivos. |
| Modal fuera de pantalla | Reproduccion de baseline a 1280x720. Altura de viewport, scroll interno y pie separado con Guardar/Firmar accesible. |
| Personal y abonos: pantalla blanca reportada | Flujos completos probados en DEV y BUILD sin excepciones; no se reprodujo el fallo exacto anterior con los registros sinteticos disponibles. No atribuir una causa definitiva a esos dos incidentes. Se corrigen formatos, cierre/refresco y se agrega recuperacion global de errores. |
| Sello no se eliminaba | COALESCE conservaba la imagen al recibir NULL; ahora se distingue omision de eliminacion explicita. PNG mantiene alpha. |
| Impresion recortada | Vista imprimible separada del arbol con scroll/modal, hoja blanca y reglas de impresion. Receta y Rx verificadas en PDF. |
| Login 401 interrumpia el mensaje | Se excluye login de la redireccion global; se conserva el mensaje de credenciales incorrectas. Un 403 tampoco expulsa la sesion. |
| Finanzas sin snapshot por movimiento | Se guarda porcentaje, doctor responsable, costo aplicado, base y margen por abono. No se recalculan comisiones originales. |
| Reintentos y simultaneidad | Idempotencia persistente por usuario, transacciones y bloqueos de tratamiento/laboratorio evitan duplicados y exceder saldos. |
| Dashboard mezclaba conceptos | Se distinguen facturado, cobrado, costos aplicados, comisiones y gastos. Los desembolsos a laboratorio se muestran aparte sin descontarlos otra vez del margen. |
| Arranque y build | BAT delega al launcher visual 4.0.3. Assets/API inexistentes no reciben HTML. Health exige migracion completa y no declara listo un esquema incompleto. |

## Finanzas implementadas

- Cada nuevo abono recupera primero el costo externo pendiente; solo el resto genera comision.
- El porcentaje se obtiene del doctor del tratamiento, no del usuario que registra el cobro.
- Un cambio de porcentaje afecta solamente movimientos nuevos.
- Rx nuevo utiliza el costo externo ingresado, no un precio fijo por radiografia.
- El 20 por Rx que existia en el modelo previo solo se conserva como referencia historica
  al migrar. No constituye verificacion del costo real: debe contrastarse antes del despliegue.
- Anulacion administrativa con motivo y auditoria, conservando el pago original; primero se anula el ultimo abono vigente.
- `pagos_vigentes` excluye anulados de deuda, estadisticas, produccion y dashboard.
- Produccion permite fecha/doctor/paginacion; el doctor solo consulta sus propios movimientos,
  sin costos ni margen de la clinica. Incluye tratamientos sin abono en el rango.
- Los trabajos con costo historico recuperado desconocido quedan POR CONCILIAR.
  No se inventa una recuperacion proporcional ni se presenta su margen como cero.
  Administracion registra el importe respaldado y su referencia antes de nuevos abonos.
  La conciliacion asigna ese importe cronologicamente, sin alterar cobros ni comisiones originales.
- Agregar un costo externo posteriormente no recalcula comisiones anteriores: afecta
  recuperacion pendiente de abonos futuros. El costo debe registrarse antes del cobro siempre que se conozca.
- Salidas a laboratorio tienen proteccion de concurrencia e idempotencia independiente del abono del paciente.

## Archivos principales

Rutas relativas a la carpeta de trabajo indicada arriba:

| Area | Archivos |
| --- | --- |
| Cobros y costos | `micodent-backend/src/services/finanzas.js`, `operacionFinanciera.js`, `src/controllers/cobros.controller.js`, `laboratorio.controller.js` |
| Reportes | `micodent-backend/src/controllers/produccion.controller.js`, `dashboard.controller.js`, `auditoria.controller.js` |
| Historias y usuarios | `micodent-backend/src/controllers/historias.controller.js`, `usuarios.controller.js`, `src/middleware/auth.js`, `src/utils/jsonFields.js` |
| Rutas y servidor | `micodent-backend/src/routes/historias.routes.js`, `dashboard.routes.js`, `src/index.js`, `src/config/db.js` |
| Migracion | `micodent-backend/migrations/001_hotfix_finanzas.sql`, `scripts/migrate-hotfix.js` |
| Produccion e historia | `micodent-frontend/src/pages/Produccion.jsx`, `PacienteDetalle.jsx`, `FinanzasDashboard.jsx`, `AdministracionPersonal.jsx`, `MiPerfil.jsx` |
| UI, API e impresion | `micodent-frontend/src/services/api.js`, `src/utils/data.js`, `src/components/AppErrorBoundary.jsx`, `PrintPortal.jsx`, `OrdenRadiografiaTab.jsx`, `RecetarioTab.jsx`, `CitaModal.jsx`, `ConfirmModal.jsx`, `src/index.css` |
| Navegacion y build | `micodent-frontend/src/App.jsx`, `src/main.jsx`, `src/layouts/MainLayout.jsx`, `vite.config.js`, `postcss.config.js`, `tailwind.config.js` |
| Arranque | `iniciar_micodent.bat`, `comprobar_micodent.bat`, `micodent-arranque.cjs` |
| Version y entrega | ambos `package.json` y `package-lock.json`, `micodent-backend/scripts/package-frontend.js`, `package-hotfix.cjs` |
| Pruebas | `micodent-backend/tests/`, `micodent-frontend/tests/data.test.mjs` |

Se fijaron versiones a las dependencias realmente suministradas (Express 5, Multer 2,
React 19, Vite 8), sin instalar ni actualizar dependencias en la instalacion activa.

## Migracion y conservacion

La migracion agrega `finanzas_version`, `finanzas_costos`, `finanzas_pagos`,
`finanzas_peticiones` y la vista `pagos_vigentes`. No borra ni sobrescribe pagos,
usuarios, historias, firmas ni archivos. El paso JS crea los snapshots y la marca
final de version; ejecutar solo el SQL NO completa la migracion.

Se ejecuto unicamente en instancias nuevas, loopback, puertos efimeros y datadir
verificado antes de escribir. Se probo dos veces consecutivas en cada ensayo.
NO se migro la BD habitual `micodent_dev`, `micodent`, XAMPP ni ninguna laptop.
DDL puede confirmar parcialmente en MySQL/MariaDB: ante fallo mantener la aplicacion
sin uso, investigar en copia y reanudar el procedimiento probado; no borrar tablas.

## Resultados de pruebas

- Backend/launcher: 28 pruebas aprobadas.
- Frontend (formatos y JSON): 3 pruebas aprobadas.
- Integracion: 13 casos aprobados en MariaDB 10.4.32 y en MySQL 8.
- A: abono 120, comision 30, margen 90.
- B: costo 100, abonos 60 y 80: costos 60/40, comisiones 0/10, margenes 0/30.
- C: snapshot antiguo 25%, nuevo 30%; D: responsable distinto del cobrador.
- Duplicados, reintentos, exceso de deuda concurrente, permisos, anulaciones,
  conciliacion, pagos de laboratorio y health sin marca de migracion: aprobados.
- Edge automatizado, DEV y build real Express: login incorrecto, guardar personal,
  crear tratamiento, registrar abono, PNG transparente, eliminar sello, Rx, receta,
  actividad y produccion aprobados, sin excepciones JS observadas.
- Modales: 1280x720, 1366x768, 1920x1080 y 390x844; limites y acciones comprobados.
- Build completo correcto; advertencia de bundle mayor a 500 kB, pendiente optimizacion.
- Lint focalizado de los nuevos componentes/servicios frontend correcto. El lint global
  conserva deuda previa (variables sin uso y efectos); NO se declara limpio ni se desactivan reglas.

Evidencia local sintetica: `.runtime/qa-1790204905811` (MariaDB, navegadores y baseline)
y `.runtime/qa-1790204988709` (MySQL). Incluyen resultados JSON, capturas y PDFs.
No se incluyen datos reales ni evidencia sintetica en la entrega de codigo.

## Preparacion de una instalacion de validacion

1. Identificar PC, rutas, motor/version, puerto, version de codigo y esquema reales.
2. Coordinar una pausa de escrituras. Respaldar BD + uploads + configuracion + codigo
   y runtime; verificar restauracion antes de modificar la instalacion correspondiente.
3. Preparar una carpeta NUEVA con el paquete. Nunca extraer encima del piloto.
4. Preparar dependencias desde los lockfiles en esa carpeta, con Node compatible.
   La entrega no lleva node_modules ni runtime. Los junctions usados para pruebas
   en esta PC tampoco se distribuyen.
5. Usar una copia de BD separada y un usuario limitado a ella. Crear configuracion
   local privada apuntando a esa copia y copiar sus uploads de forma coordinada.
   No distribuir ni reemplazar el .env original.
6. Sobre DEV local verificado `micodent_dev`, despues del backup, ejecutar desde el
   backend `node scripts/migrate-hotfix.js --apply`. El CLI rechaza otro nombre o host.
   Esto es una instruccion para la siguiente activacion controlada, NO un paso ya ejecutado.
7. El build ya esta en `micodent-backend/public`. Para reconstruirlo: compilar frontend
   y ejecutar `node scripts/package-frontend.js` desde backend.
8. Ejecutar `comprobar_micodent.bat`; este comprueba archivos/configuracion, no prueba
   MySQL ni demuestra funcionamiento clinico. Despues iniciar y exigir health completo.
9. Validar login, usuarios, pacientes, HC, abonos, laboratorio, reportes, sello, Rx,
   impresion y conciliaciones contra registros representativos de la copia restaurada.
10. No actualizar aun Edy/Miguel: primero reconciliar seguridad S1-A/S1-B, comprobar
    sus esquemas/versiones y cerrar los dos incidentes originales con datos representativos.
    Una copia DEV jamas debe reemplazar sus bases locales.

## Rollback y limites

Antes de registrar nuevas operaciones, puede volverse al codigo/configuracion
originales conservados, sin destruir la copia de ensayo.
DESPUES de nuevos abonos/anulaciones, NO usar ciegamente el backend antiguo:
ignoraria `pagos_vigentes` y contaria pagos anulados. Mantener una version compatible
con el ledger o hacer correccion hacia adelante en mantenimiento. Conservar exportacion
completa del estado posterior y conciliar los movimientos, nunca restaurar una BD vieja
descartando operaciones nuevas. No eliminar tablas adicionales ni archivos clinicos.

No se garantizan fallos cero, rendimiento a gran escala ni impresion en todas las
impresoras. Las pruebas son sinteticas; falta aceptacion clinica, prueba con datos
representativos en copia privada y despliegue controlado. No se alteraron permisos de Edy.

## Continuidad y mejoras de producto

Continuar sobre este codigo clinico, sin volver al frontend anterior. El siguiente
paso tecnico es compatibilizar S1-A/S1-B con esta baseline y MariaDB antes de reanudar
archivos clinicos/autorizacion. Las otras 17 etapas no se dan por finalizadas por este hotfix.
Mantener las reglas financieras y pruebas como regresion obligatoria.
Recomendaciones posteriores: detalle enlazado de cada movimiento, exportacion controlada
por permisos, desglose de saldo frente a margen y pruebas de volumen/paginacion con
historias reales anonimizadas. No presentar facturado como efectivo disponible.

# E06/M07 - Paquetes clinicos siguientes

Estado: M07-D en curso y pausado por solicitud del propietario; M07-E plan.
M07-A/B/C implementados y probados con datos sinteticos. La migracion M07-D
solo se aplico en MySQL desechable. Ninguna instalacion
clinica ni la base `micodent_dev` habitual se modifica por este documento.

## M07-D - Anulacion no destructiva del odontograma

Problema comprobado: `DELETE /api/historias/odontograma-items/:id` borra de
`odontograma_items` un registro firmado. La auditoria textual no conserva sus
campos clinicos y las adendas tienen `ON DELETE CASCADE`.

Propuesta: migracion aditiva que conserve el item original y registre motivo,
autor y fecha de anulacion en una tabla relacionada. La ruta existente pasaria
a anular en una transaccion, con bloqueo de la fila y rechazo de reintentos.
La respuesta de la historia distinguiria items activos y anulados; el esquema
dental y los conteos operativos usarian solo activos, mientras la trazabilidad
mostraria los anulados con su motivo. No se reescriben items previos.

Archivos existentes afectados: `src/controllers/historias.controller.js`,
`src/controllers/pacientes.controller.js`, `src/index.js`,
`src/components/OdontogramaEditor.jsx`, `src/pages/Historias.jsx` y
`tests/hotfix-integration.cjs`. Se crearian una migracion versionada, su
aplicador con verificacion de destino/respaldo y pruebas especificas. Los
paths de frontend corresponden a `micodent-frontend`; los de backend a
`micodent-backend`.

Precondiciones: inventario de esquema y motor de `micodent_dev`, respaldo
coordinado y verificado de BD + codigo + configuracion, restauracion en copia
aislada, revision del plan de rollback y autorizacion del paquete. La migracion
se prueba dos veces en MySQL desechable antes de aplicarse solo a DEV.
Nunca ejecutar `database/micodent.sql` sobre una base existente.

Pruebas de aprobacion: el item firmado sigue legible en auditoria tras anular;
deja de pintar en el odontograma activo; las adendas se conservan; solo su
autor puede anular segun el permiso vigente; dos anulaciones simultaneas
producen una sola; un fallo de auditoria revierte la anulacion; los registros
historicos no cambian; los conteos y la impresion no muestran activos falsos.

Rollback: volver al codigo anterior solo con un build compatible que respete
la nueva marca de anulacion. No restaurar una BD anterior si se registraron
datos nuevos; preservar la tabla aditiva, exportar y reconciliar los cambios.
No eliminar la migracion ni la tabla para aparentar una reversion exitosa.

## M07-E - Firmas historicas y versiones de consentimiento

Problemas comprobados: recetas y ordenes ya firmadas leen firma/sello/nombre
actuales del perfil; `firmas_consentimiento` conserva solo la ultima version.
Se necesita una migracion aditiva separada para fijar la identidad profesional
y los bytes de firma/sello de cada nueva emision, y para versionar cada cambio
posterior del consentimiento con autor y fecha. La API y las vistas de
impresion deben usar el snapshot para documentos nuevos.

Los documentos anteriores no tienen prueba de los bytes usados al emitirse.
No rellenar esa ausencia con la firma actual como si fuera historica. Mantener
su acceso y marcar claramente la procedencia no verificada en reimpresiones.
Probar cambio posterior de perfil, reemision, datos legados, archivos grandes,
fallo de auditoria, respaldo/restauracion y crecimiento de almacenamiento.

E06 no termina con M07: despues quedan M08/M09/M11 segun
`RUTA_MAESTRA.md`. E07 (Edy) es independiente y sigue sin implementarse.

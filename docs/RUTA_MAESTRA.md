# MICODENT - Ruta maestra de mejora

Actualizada: 2026-09-20. Entorno autorizado: MICODENT_DEV y micodent_dev.
Esta ruta consolida el orden de trabajo acordado; no autoriza por si sola los
paquetes posteriores. Cada paquete necesita alcance, respaldo, pruebas,
reversion y aprobacion propios. No se modifican las laptops ni el piloto.

## Orden de trabajo

| Etapa | Paquete | Resultado y dependencias |
| --- | --- | --- |
| 0 | Recuperacion y versiones, M01/M04 | Inventario por instalacion, respaldo integral verificable, restauracion aislada y version de partida. |
| 1 | S1-A, M05 | Sesiones revocables, contrasenas, restablecimiento protegido, limites persistentes y pruebas. Solo DEV. |
| 2 | Secretos, M02 | Retirar secretos de material compartible y preparar rotacion coordinada; nunca rotar sin mapa de instalaciones. |
| 3 | S1-B | Transporte de sesiones, cookies HttpOnly, CSRF, estado coherente entre pestanas y expiracion. Requiere S1-A y estrategia de despliegue. |
| 4 | Archivos clinicos, M03/M17/M18 | Acceso autorizado, validacion, limites, almacenamiento y respaldos coordinados. No renombrar ni perder archivos existentes. |
| 5 | Autorizacion, M06/M15 | Matriz de capacidades en backend, usuarios/roles y pruebas negativas; preservar historicos financieros aunque cambien roles. |
| 6 | Clinica y trazabilidad, M07/M08/M09/M11 | Auditoria integral, versiones, adendas, firmas historicas, anulaciones y validaciones clinicas. |
| 7 | Edy, paquete independiente | Conceder capacidades clinicas necesarias solo a la cuenta explicitamente identificada de Edy, manteniendo su perfil administrativo y la trazabilidad. No convertir globalmente administradoras en doctoras. Depende de etapas 5 y 6. |
| 8 | Integridad financiera, M12/M13/M14/M15 | Transacciones, concurrencia, duplicados, abonos, gastos, laboratorio, comisiones e invariancia de reportes historicos. Reconciliar antes de migrar. |
| 9 | Agenda y API, M16/M19 | Conflictos de agenda, contratos, validacion, errores consistentes y limites. |
| 10 | BD y rendimiento, M20/M21 | Indices justificados, restricciones, migraciones versionadas y compatibilidad verificada por motor. |
| 11 | Proteccion del trabajo y mantenimiento, M10/M22 | Formularios sin perdida accidental, recuperacion, modularidad y eliminacion de duplicacion comprobada. Los defectos urgentes de perdida de trabajo se adelantan. |
| 12 | Producto clinico premium, M23/M24/M25 | Navegacion, tablas y formularios coherentes, responsive, accesibilidad, iconografia y textos profesionales; verificar flujos con usuarios. |
| 13 | Despliegue local V3, M26 | Incorporar el simulacro validado: Express sirve build React; health real; launcher condicional; sin Vite ni Apache en el runtime clinico. Ver V3_INTEGRACION.md. |
| 14 | Recuperacion operativa, M01/M18 | Respaldos BD + archivos + configuracion + version, retencion, restauraciones repetibles y objetivos de recuperacion. Sin contrasena de respaldo por instruccion actual del propietario; acceso y custodia siguen siendo necesarios. |
| 15 | Actualizaciones de laptops, M27 | Identificar version/esquema/motor de cada laptop, respaldar, actualizar una primero, comprobar datos y luego la otra. No sustituir sus BD con la de DEV. |
| 16 | Aceptacion integral, M28 | Clinica, finanzas, documentos, impresion, permisos, fallos, reinicios y recuperacion. Validacion del personal. |
| 17 | Documentacion y entrega, M29 | Manuales, soporte, recuperacion, matriz de versiones y decision explicita sobre servidor central frente a instalaciones independientes. |

## Reglas de avance

Estado al 2026-09-20: S1-A aceptado por el propietario. M02-A implementado en
DEV (ver M02A_CIERRE.md). M02-B, rotacion de secretos por instalacion, pendiente
de confirmacion especifica para el cambio JWT solo DEV. Se inicio su inventario
y ensayo unitario (M02B_ROTACION_DEV.md); aun no se cambio ninguna clave.
No se considera terminada toda la etapa M02.

- Probar primero sobre copias aisladas. No introducir cuentas sinteticas en las instalaciones de los usuarios.
- Una etapa no se considera aprobada solo porque compile o responda /api/ping.
- Toda migracion requiere copia compatible, conteos, integridad y procedimiento de reversion sin descartar datos nuevos.
- No usar database/micodent.sql para actualizar una instalacion existente.
- No sobrescribir .env, uploads ni datos clinicos durante una actualizacion.
- Separar aprobacion tecnica en DEV de aceptacion clinica y autorizacion de despliegue.
- Priorizar perdida/exposicion de datos sobre mejoras visuales; conservar las funciones actuales mediante pruebas de regresion.

## Incorporacion de la actualizacion V3

El informe y los archivos de C:\Micodent_Simulacro se revisaron en lectura.
No se ejecutaron su BAT ni su backend y no se accedio a su BD.
La arquitectura V3 queda incorporada al objetivo de entrega, pero no se afirma
que ya este integrada en S1-A. El frontend de desarrollo puede seguir usando
Vite; la entrega clinica debe usar exclusivamente el build servido por Express.

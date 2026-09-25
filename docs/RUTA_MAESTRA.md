# MICODENT - Ruta maestra de mejora

Actualizada: 2026-09-24. Entorno autorizado: MICODENT_DEV y copias aisladas.
Esta ruta consolida el orden de trabajo acordado; no autoriza por si sola los
paquetes posteriores. Cada paquete necesita alcance, respaldo, pruebas,
reversion y aprobacion propios. No se modifican las laptops ni el piloto.

## Base funcional para continuar

Por decision del propietario del 2026-09-24, la base funcional de las etapas
restantes es RC4 en `.runtime/hotfix-clinico`, con el launcher V4.0.3 y el hotfix
clinico-financiero. El paquete local verificado es
`.runtime/hotfix-clinico/.runtime/releases/MICODENT-HOTFIX-CLINICO-FINANCIERO-RC4-1790267855292.zip`
(SHA-256 `EF80EA8A71DFEA8B2D7028A7BD198D843224A957DB05BCB9BA538A635FB99C20`).
El propietario autorizo publicar RC4 en la rama
`codex/hotfix-clinico-financiero` con su informe de cierre. La copia local
comprimida sigue siendo un artefacto privado; no se sube al repositorio. RC4
no ha sido desplegado en las laptops.

RC4 se desarrollo sobre la base de codigo previa a S1-A. Los avances S1-A,
M02 y S1-B permanecen en `MICODENT_DEV`/sus ramas, separados de RC4. Por tanto,
RC4 es la referencia funcional, no una integracion ya terminada ni una version
aprobada para produccion. El siguiente trabajo debe conciliar esos cambios con
RC4 en una rama local aislada, conservar ambos comportamientos y ejecutar
regresion de seguridad, clinica, finanzas y arranque. Ninguna etapa ya aceptada
se considera incorporada a RC4 hasta superar esas pruebas.

Cierre tecnico 2026-09-24: S1-A conciliado con RC4 en
`codex/rc4-s1-integracion`, version `rc4-s1a-dev`. Se verificaron migracion
MySQL, preservacion de datos sinteticos, seguridad, finanzas, navegador y
arranque real en entornos aislados. Ver [informe](RC4_S1A_INTEGRACION.md).
No se activo en el DEV habitual ni se desplego. El siguiente paquete es
conciliar M02 sobre esta base, seguido por S1-B; sus avances historicos no se
consideran incorporados automaticamente. El migrador operativo S1-A sigue
limitado a MySQL, aunque se verificaron las estructuras y API con MariaDB.

## Orden de trabajo

| Etapa | Paquete | Resultado y dependencias |
| --- | --- | --- |
| 0 | Recuperacion y versiones, M01/M04 | Inventario por instalacion, respaldo integral verificable, restauracion aislada y version de partida. |
| 1 | S1-A, M05 | Sesiones revocables, contrasenas, restablecimiento protegido, limites persistentes y pruebas. Solo DEV. |
| 2 | Secretos, M02 | Retirar secretos de material compartible y preparar rotacion coordinada; nunca rotar sin mapa de instalaciones. |
| 3 | S1-B | Transporte de sesiones, cookies HttpOnly, CSRF, estado coherente entre pestanas y expiracion. Requiere S1-A y estrategia de despliegue; conciliar con RC4. |
| 4 | Archivos clinicos, M03/M17/M18 | Acceso autorizado, validacion, limites, almacenamiento y respaldos coordinados. No renombrar ni perder archivos existentes. |
| 5 | Autorizacion, M06/M15 | Matriz de capacidades en backend, usuarios/roles y pruebas negativas; preservar historicos financieros aunque cambien roles. |
| 6 | Clinica y trazabilidad, M07/M08/M09/M11 | Auditoria integral, versiones, adendas, firmas historicas, anulaciones y validaciones clinicas. |
| 7 | Edy, paquete independiente | Conceder capacidades clinicas necesarias solo a la cuenta explicitamente identificada de Edy, manteniendo su perfil administrativo y la trazabilidad. No convertir globalmente administradoras en doctoras. Depende de etapas 5 y 6. |
| 8 | Integridad financiera, M12/M13/M14/M15 | Transacciones, concurrencia, duplicados, abonos, gastos, laboratorio, comisiones e invariancia de reportes historicos. Reconciliar antes de migrar. |
| 9 | Agenda y API, M16/M19 | Conflictos de agenda, contratos, validacion, errores consistentes y limites. |
| 10 | BD y rendimiento, M20/M21 | Indices justificados, restricciones, migraciones versionadas y compatibilidad verificada por motor. |
| 11 | Proteccion del trabajo y mantenimiento, M10/M22 | Formularios sin perdida accidental, recuperacion, modularidad y eliminacion de duplicacion comprobada. Los defectos urgentes de perdida de trabajo se adelantan. |
| 12 | Producto clinico premium, M23/M24/M25 | Navegacion, tablas y formularios coherentes, responsive, accesibilidad, iconografia y textos profesionales; verificar flujos con usuarios. |
| 13 | Despliegue local, M26 | RC4 ya incluye Express sirviendo React compilado, health y launcher V4.0.3; faltan integracion con S1, validacion por instalacion y aceptacion operativa. |
| 14 | Recuperacion operativa, M01/M18 | Respaldos BD + archivos + configuracion + version, retencion, restauraciones repetibles y objetivos de recuperacion. Sin contrasena de respaldo por instruccion actual del propietario; acceso y custodia siguen siendo necesarios. |
| 15 | Actualizaciones de laptops, M27 | Identificar version/esquema/motor de cada laptop, respaldar, actualizar una primero, comprobar datos y luego la otra. No sustituir sus BD con la de DEV. |
| 16 | Aceptacion integral, M28 | Clinica, finanzas, documentos, impresion, permisos, fallos, reinicios y recuperacion. Validacion del personal. |
| 17 | Documentacion y entrega, M29 | Manuales, soporte, recuperacion, matriz de versiones y decision explicita sobre servidor central frente a instalaciones independientes. |

Las correcciones RC4 adelantan parte de finanzas, interfaz y arranque. No cierran
por si solas las etapas 8, 12 o 13 ni sustituyen sus pruebas de aceptacion.

## Reglas de avance

Estado al 2026-09-21: S1-A aceptado por el propietario. M02-A implementado en
DEV (ver M02A_CIERRE.md). M02-B: JWT rotado solo en DEV con autorizacion
expresa; comprobaciones tecnicas correctas y acceso habitual de Miguel confirmado
por el propietario el 2026-09-21, quien autoriza continuar en DEV.
Ver M02B_RESULTADO_DEV.md. No se cambiaron credenciales MySQL ni otras
instalaciones. No se considera terminada toda la etapa M02.

S1-B1 implementado en DEV: perfil verificado e identidad ligada a cada pestana,
con pruebas unitarias y navegador simulado. Ver S1B1_SESION_NAVEGADOR.md.
Aceptacion funcional recibida del propietario el 2026-09-21. S1-B2 (cookies/CSRF)
autorizado para continuar en DEV; no declarar
resueltos transporte JWT, proteccion integral del trabajo ni etapa E03 completa.

S1-B2: codigo de cookies/CSRF implementado y pruebas en memoria correctas;
navegador y activacion DEV pendientes. Ver S1B2_COOKIES_CSRF.md. No aprobado.

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

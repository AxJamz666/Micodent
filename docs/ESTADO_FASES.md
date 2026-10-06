# Mapa de etapas en GitHub

## Estado de trabajo 2026-09-28

E00 es preparacion; E01-E17 son las 17 etapas de mejora. Los estados siguientes
describen la rama local de desarrollo RC4 + S1, no una version desplegada ni
aprobada para uso clinico. E06/M07-D quedo pausada en `d8522d1` dentro de
`F:\ChatGPT\MICODENT — Sistema de Gestión Odontológica\MICODENT_DEV\.runtime\rc4-s1-integracion`.
E09/M16-M19 cerro su implementacion tecnica aislada en
`F:\ChatGPT\MICODENT — Sistema de Gestión Odontológica\MICODENT_DEV\.runtime\e09-agenda-api`.
La continuacion M06/M07 sigue local. E09 tiene su propia rama de trabajo;
publicarla no equivale a integrarla ni a desplegarla.

| Etapa | Estado actual | Pendiente principal |
| --- | --- | --- |
| E00 Recuperacion y versiones | Respaldo piloto confirmado por el propietario; desarrollo aislado | Recuperacion operativa repetible por instalacion (E14) |
| E01 S1-A | Incorporada a RC4 y probada en aislamiento | Aceptacion de la combinacion final antes de despliegue |
| E02 Secretos | Controles M02 en RC4; rotacion JWT solo en DEV historico | Contencion/rotacion coordinada por instalacion |
| E03 S1-B | Cookies, CSRF y sesiones probadas en aislamiento | Validacion operativa por laptop |
| E04 Archivos clinicos | M03-A/B probados en aislamiento | Inventario historico y aceptacion por instalacion |
| E05 Autorizacion | M06-A incorporado y probado | M15: decisiones de acceso fino con Miguel y Edy |
| E06 Clinica y trazabilidad | Pausada: M07-A/B/C probados; M07-D guardado en otra rama, aun sin QA final | Anulacion no destructiva, versiones de firmas, identidad de emision, M08/M09/M11 |
| E07 Edy | No iniciada | Paquete propio tras E05/E06; ninguna capacidad concedida |
| E08 Finanzas | RC4 resolvio defectos concretos | Auditoria integral e invariantes historicos pendientes |
| E09 Agenda/API | Cierre tecnico en DEV; sin despliegue ni aceptacion clinica | Validacion operativa E13/E16; dependencias en E09_AGENDA_API_AVANCE.md |
| E10 BD/rendimiento | No iniciada como etapa | Indices, restricciones y migraciones controladas |
| E11 Trabajo/mantenimiento | No iniciada como etapa | Prevencion de perdida de formularios y modularidad |
| E12 UX/UI | Cerrada en DEV; diseno visual aprobado por el propietario | Prueba operativa con usuarios e impresiones reales en E16; ver E12_DISENO_PREMIUM_DEV.md |
| E13 Despliegue local | Launcher RC4 probado; paquete nuevo Gabriela preparado y probado en MariaDB aislada | Instalacion en laptop, backup/restauracion y aceptacion; datos reales bloqueados |
| E14 Recuperacion operativa | Respaldo piloto reportado; etapa abierta | Politica y restauraciones repetibles de BD + archivos |
| E15 Actualizaciones | No iniciada | Identificar, respaldar y actualizar cada laptop por separado |
| E16 Aceptacion integral | No iniciada | Regresion clinica, financiera, fallos y usuarios |
| E17 Documentacion/entrega | No iniciada como cierre | Manuales, soporte y decision de servidor central |

M07-A (`7319aa8`) deja atomicas la emision/auditoria de recetas y ordenes,
evita dos reemisiones del mismo original y audita cambios de firma/sello del
perfil. M07-B (`f9809f3`) conserva la firma del doctor cuando la interfaz envia
solo la del paciente y hace atomico ese guardado con su auditoria. Ambas son
subfases tecnicas de E06, no el cierre de E06. La firma y el sello de recetas y
ordenes antiguas aun proceden del perfil actual; no se puede reconstruir su
imagen exacta al momento de emision con los datos disponibles. El consentimiento
permite reemplazar una firma sin version anterior y la anulacion de un item del
odontograma usa `DELETE`. Se requiere un paquete aditivo con respaldo verificado
para resolver estas tres brechas sin inventar evidencia historica.
M07-C hace atomicos el item nuevo de odontograma y su auditoria, con prueba de
rollback ante fallo de esta. M07-D y M07-E estan planificados en
`M07_SIGUIENTES_PAQUETES.md`; todavia no se aplicaron migraciones.

## Actualizacion 2026-09-24

RC4 consolida el hotfix clinico-financiero y el launcher V4.0.3. Ver
[cierre RC4](HOTFIX_CIERRE_RC4.md) y [detalle RC4](HOTFIX_RC4.md). El propietario
autorizo publicar este candidato en su rama y continuar desde el. La publicacion
no equivale a aceptacion de produccion: E08/E12/E13 siguen parciales. S1-A/S1-B
tenian una linea separada. S1-A ya esta reconciliado tecnicamente con RC4 en
`codex/rc4-s1-integracion`, con pruebas aisladas; ver
[cierre de integracion](RC4_S1A_INTEGRACION.md). M02 y S1-B siguen pendientes de
conciliacion en aquel cierre. M02-A ya esta conciliado en la rama
`codex/rc4-m02-secretos`; ver [resultado](RC4_M02_CIERRE.md). S1-B y la
contencion global M02-B siguen pendientes. No se actualizaron instalaciones
reales ni se abrio PR.

Actualizacion 2026-09-25: S1-B conciliado tecnicamente con RC4, sin activacion
habitual ni despliegue. [Cierre S1-B](RC4_S1B_CIERRE.md) registra la prueba
compilada, la incidencia del proxy Vite y su repeticion correcta. La aceptacion
historica y la tabla siguiente no sustituyen la aceptacion de esta combinacion.

Actualizacion 2026-09-27: M03-A implementado y probado en aislamiento sobre
RC4 + S1-B; [cierre de lectura protegida](RC4_M03A_CIERRE.md). No activado.
E04 permanece abierta: M03-B (cargas y eliminacion recuperable) pendiente.

Actualizacion 2026-09-27: M03-B implementado y probado sobre la rama RC4,
[cierre de archivos clinicos](RC4_M03B_CIERRE.md). E04 queda en aceptacion
funcional: sin despliegue, inventario historico de cada instalacion pendiente.

La tabla siguiente conserva el estado historico previo, no certifica el candidato clinico.

Repositorio privado AxJamz666/Micodent. Etapa 0 de preparacion + etapas 1-17.
Cada etapa tiene milestone e issue; no se autoriza implementarla por crear su
registro. Los estados operativos vivos se consultan en los issues y PR.

| Etapa | Seguimiento | Estado al preparar GitHub |
| --- | --- | --- |
| E00 Base y recuperacion | [#1](https://github.com/AxJamz666/Micodent/issues/1) | Cerrada |
| E01 S1-A | [#2](https://github.com/AxJamz666/Micodent/issues/2) | Aceptada y cerrada |
| E02 Secretos | [#3](https://github.com/AxJamz666/Micodent/issues/3) | JWT DEV rotado; login habitual confirmado por el propietario. M02 global abierto |
| E03 S1-B | [#4](https://github.com/AxJamz666/Micodent/issues/4) | S1-B1 aceptado. S1-B2 en codigo; navegador y activacion pendientes |
| E04 Archivos clinicos | [#5](https://github.com/AxJamz666/Micodent/issues/5) | Planificada |
| E05 Autorizacion | [#6](https://github.com/AxJamz666/Micodent/issues/6) | Planificada |
| E06 Integridad clinica | [#7](https://github.com/AxJamz666/Micodent/issues/7) | Planificada |
| E07 Edy | [#8](https://github.com/AxJamz666/Micodent/issues/8) | Sin autorizacion de implementacion |
| E08 Finanzas | [#9](https://github.com/AxJamz666/Micodent/issues/9) | Planificada |
| E09 Agenda/API | [#10](https://github.com/AxJamz666/Micodent/issues/10) | Planificada |
| E10 BD/rendimiento | [#11](https://github.com/AxJamz666/Micodent/issues/11) | Planificada |
| E11 Trabajo/mantenimiento | [#12](https://github.com/AxJamz666/Micodent/issues/12) | Planificada |
| E12 UX/UI | [#13](https://github.com/AxJamz666/Micodent/issues/13) | Planificada |
| E13 V3/despliegue local | [#14](https://github.com/AxJamz666/Micodent/issues/14) | Simulacro revisado; integracion pendiente |
| E14 Recuperacion operativa | [#15](https://github.com/AxJamz666/Micodent/issues/15) | Planificada |
| E15 Actualizaciones de laptops | [#16](https://github.com/AxJamz666/Micodent/issues/16) | Planificada |
| E16 Aceptacion integral | [#17](https://github.com/AxJamz666/Micodent/issues/17) | Planificada |
| E17 Documentacion/entrega real | [#18](https://github.com/AxJamz666/Micodent/issues/18) | Planificada |

Accion prioritaria separada: [M02-B, issue #19](https://github.com/AxJamz666/Micodent/issues/19).
El 2026-09-21 se roto JWT solo en DEV. Piloto, simulacro y laptops no fueron
modificados; la contencion global sigue pendiente y requiere coordinacion.
Resultado DEV: [M02B_RESULTADO_DEV.md](M02B_RESULTADO_DEV.md).

Reglas del flujo: [TRABAJO_EN_GITHUB.md](TRABAJO_EN_GITHUB.md).
Dependencias tecnicas: [Ruta maestra](RUTA_MAESTRA.md).

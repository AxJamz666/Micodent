# MICODENT - Etapas abiertas y modelo recomendado

Acuerdo del propietario, 2026-09-28. E00 es preparacion; E01-E17 son las
17 etapas. E01/S1-A se considera cerrada como implementacion aceptada en DEV e
integrada tecnicamente con RC4; la regresion final pertenece a E16. E03 y E04
tienen codigo probado, pero siguen abiertas por validacion operativa. El orden
de abajo clasifica riesgo si quedaran pendientes antes del uso principal; no
es una secuencia automatica de ejecucion.

| Top | Etapa abierta | Riesgo principal pendiente | Modelo unico recomendado |
| ---: | --- | --- | --- |
| 1 | E14 Recuperacion operativa | Perdida sin restauracion comprobada de BD, fotos y configuracion | GPT-6 Astra |
| 2 | E06 Clinica y trazabilidad | Borrado de registros firmados y firmas historicas inexactas | GPT-6 Astra |
| 3 | E05 Autorizacion y permisos finos | Exposicion o cambios indebidos de datos clinicos | GPT-6 Astra |
| 4 | E02 Secretos | Credenciales sin contencion coordinada por instalacion | GPT-6 Astra |
| 5 | E04 Archivos clinicos | Anexos perdidos, inaccesibles o expuestos; aceptacion pendiente | GPT-6 Sol |
| 6 | E10 Base de datos y rendimiento | Inconsistencias o fallos al crecer los registros | GPT-6 Astra |
| 7 | E08 Finanzas | Pagos, saldos o comisiones incorrectos | GPT-6 Astra |
| 8 | E16 Aceptacion integral | Desplegar sin validar fallos, recuperacion y flujos completos | GPT-6 Astra |
| 9 | E15 Actualizacion de laptops | Sobrescribir datos o mezclar versiones incompatibles | GPT-6 Astra |
| 10 | E13 Despliegue local | Arranque inestable o servicio no disponible | GPT-6 Sol |
| 11 | E09 Agenda y API | Citas en conflicto u operaciones invalidas | GPT-6 Sol |
| 12 | E07 Permiso especifico de Edy | Acceso clinico mas amplio del necesario | GPT-6 Astra |
| 13 | E11 Proteccion del trabajo | Formularios o cambios sin guardar perdidos | GPT-6 Sol |
| 14 | E03 Cookies y CSRF | Validacion operativa aun pendiente | GPT-6 Sol |
| 15 | E12 UX/UI premium | Confusion de uso e interfaz inconsistente | GPT-6 Sol |
| 16 | E17 Documentacion y entrega | Operacion y mantenimiento dificiles | GPT-6 Sol |

## Protocolo acordado para elegir modelo

Antes de iniciar o retomar trabajo de una etapa, indicar al propietario el
numero y nombre de la etapa, la subfase actual y el modelo unico recomendado
en esta tabla. Pedirle que cambie el modelo en Codex y esperar su confirmacion
explicita antes de analizar, modificar, probar o desplegar trabajo de esa
etapa. No cambiar de modelo automaticamente ni repartir una misma etapa entre
dos modelos como requisito. El propietario puede elegir otro modelo; registrar
su decision y trabajar con ese modelo hasta cerrar o pausar la etapa. Al
cambiar de etapa, repetir el aviso y esperar nueva confirmacion.

Estado al guardar este acuerdo: estamos en E06, clinica y trazabilidad.
M07-A, M07-B y M07-C estan implementados y probados solo en aislamiento. La
siguiente subfase seria M07-D (anulacion no destructiva del odontograma),
seguida de M07-E (versiones de firmas). Para retomar E06 se recomienda GPT-6
Astra. La confirmacion de cambio de modelo aun no se ha recibido. No aplicar
migraciones ni tocar instalaciones clinicas por este documento.

Las recomendaciones de modelo son juicio de trabajo, no una garantia de
seguridad, exactitud o disponibilidad de tokens. Respaldos, pruebas,
aceptacion y autorizacion de despliegue siguen siendo obligatorios.

# MICODENT - Estado de etapas y modelo acordado

Acuerdo actualizado el 2026-09-28. E00 es preparacion; E01-E17 son las 17
etapas. De las 16 abiertas, cuatro usan Astra y doce Sol. El estado describe
la linea local RC4 + S1, no un release clinico aprobado. La asignacion de
modelo no altera las pruebas, respaldos, aceptaciones ni limites de despliegue.

| Etapa | Alcance | Estado | Modelo |
| --- | --- | --- | --- |
| E01 | Sesiones y contrasenas, S1-A | Cerrada en DEV; integracion RC4 probada | GPT-6 Sol (referencia) |
| E02 | Secretos | Parcial: controles; rotacion por instalacion pendiente | GPT-6 Sol |
| E03 | Cookies y CSRF, S1-B | Probada en aislamiento; validacion operativa pendiente | GPT-6 Sol |
| E04 | Archivos clinicos | M03-A/B probados; inventario y aceptacion pendientes | GPT-6 Sol |
| E05 | Autorizacion y usuarios | M06-A probado; decisiones de acceso fino pendientes | GPT-6 Astra |
| E06 | Clinica y trazabilidad | M07-A/B/C probados; M07-D en curso; resto pendiente | GPT-6 Astra |
| E07 | Permiso especifico de Edy | No iniciada | GPT-6 Sol |
| E08 | Finanzas | Correcciones RC4 puntuales; auditoria integral pendiente | GPT-6 Astra |
| E09 | Agenda y API | No iniciada como etapa | GPT-6 Sol |
| E10 | Base de datos y rendimiento | No iniciada como etapa | GPT-6 Sol |
| E11 | Proteccion del trabajo y mantenimiento | No iniciada como etapa | GPT-6 Sol |
| E12 | Diseno y experiencia premium | Mejoras puntuales RC4; revision integral pendiente | GPT-6 Sol |
| E13 | Despliegue local | Launcher RC4 probado en simulacro; laptops pendientes | GPT-6 Sol |
| E14 | Recuperacion operativa | Respaldo piloto; restauraciones por instalacion pendientes | GPT-6 Astra |
| E15 | Actualizacion de laptops | No iniciada | GPT-6 Sol |
| E16 | Aceptacion integral | No iniciada | GPT-6 Sol |
| E17 | Documentacion y entrega | Documentos de trabajo; cierre final pendiente | GPT-6 Sol |

## Protocolo acordado para elegir modelo

Antes de iniciar o retomar trabajo de una etapa, indicar al propietario el
numero y nombre de la etapa, la subfase actual y el modelo unico recomendado
en esta tabla. Pedirle que cambie el modelo en Codex y esperar su confirmacion
explicita antes de analizar, modificar, probar o desplegar trabajo de esa
etapa. No cambiar de modelo automaticamente ni repartir una misma etapa entre
dos modelos como requisito. El propietario puede elegir otro modelo; registrar
su decision y trabajar con ese modelo hasta cerrar o pausar la etapa. Al
cambiar de etapa, repetir el aviso y esperar nueva confirmacion.

Estamos en E06/M07-D (anulacion no destructiva del odontograma). M07-A/B/C
estan implementados y probados solo en aislamiento. El propietario confirmo
"astra lista continua" y despues pidio reanudar E06 con la asignacion de cuatro
etapas Astra. M07-E (versiones de firmas) sigue despues. No aplicar migraciones
a la instalacion habitual ni tocar instalaciones clinicas por este documento.

Las recomendaciones de modelo son juicio de trabajo, no una garantia de
seguridad, exactitud o disponibilidad de tokens. Respaldos, pruebas,
aceptacion y autorizacion de despliegue siguen siendo obligatorios.

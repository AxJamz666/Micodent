# E09 - Agenda y API: avance M16

Estado: implementado y probado en aislamiento; E09 permanece abierta. Rama
local `codex/e09-agenda-api`, basada en `46b21ef`. Modelo confirmado por el
propietario: GPT-6 Sol. La E06/M07-D quedo pausada en `d8522d1`, otra rama.

## Alcance aplicado

- La escritura de citas usa transaccion y un bloqueo MySQL por esquema. Dos
  solicitudes simultaneas no pueden reservar el mismo horario para un doctor.
- Alta, edicion y reactivacion validan conflictos. Cancelar libera horario;
  reactivar vuelve a comprobarlo. Errores devuelven 400, 404, 409 o 503 segun
  corresponda, sin confirmar operaciones parciales.
- Se validan fecha, hora, duracion, doctor y paciente activos, contacto y
  formato de telefono. Una cita historica vinculada a referencias ahora
  inactivas puede seguir recibiendo correcciones de contacto sin reemplazarlas;
  no puede moverse a otro horario mientras dichas referencias sigan inactivas.
- La agenda de React descarta respuestas atrasadas de otro periodo. El modal
  impide envios duplicados y muestra al usuario el conflicto que devuelve la API.
- La copia del frontend compilado usa archivos regulares y comprueba hashes;
  se conserva el comportamiento de mantener chunks antiguos para pestanas
  abiertas durante una actualizacion.
- M19 inicia con un limite de 64 KB para el cuerpo de solicitudes de agenda,
  sin modificar el limite general requerido por otros modulos clinicos.

No se cambia el esquema ni se ejecuta una migracion. No se ha modificado la
base `micodent` ni las instalaciones piloto o familiares. El backend DEV
habitual tampoco se ha activado con esta rama. Todas las pruebas de datos se
ejecutaron en una base MySQL temporal y con registros sinteticos.

## Verificacion

| Prueba | Resultado |
| --- | --- |
| Backend unitario | 85/85 |
| Frontend unitario | 23/23 |
| Build frontend y copia verificada al backend | Correctos |
| Integracion MySQL aislada | Alta/edicion/reactivacion concurrentes, rollback, historicos y regresion clinico-financiera correctos |
| Navegador sobre build compilado | Alta, conflicto 409 y modal movil correctos |
| Escaner de secretos | Codigo sin hallazgos; dos enlaces locales `node_modules` reportados como `SYMLINK_REQUIRES_REVIEW` |

Evidencia de navegador: `E:\MICODENT_QA\qa-1790638172779`.
Ultima regresion backend, incluido rechazo 413 de agenda:
`E:\MICODENT_QA\qa-1790638495023`.
El escaneo no certifica todo el entorno por esos enlaces locales, que no estan
versionados ni forman parte del paquete. Antes de publicar, comprobar el indice
de Git y ejecutar la verificacion sobre un arbol sin dichos enlaces.

## Pendiente para cerrar E09

- M19: definir y probar contratos y limites del resto de endpoints, sin cambiar
  formatos de respuesta que el frontend ya consume. El GET historico de citas
  conserva rangos amplios por compatibilidad; evaluar paginacion o limites con
  un contrato nuevo y mediciones antes de restringirlo.
- Inventariar por grupo las 70 rutas REST actuales antes de imponer limites
  comunes: archivos clinicos, pagos e informes tienen tamanos y riesgos
  distintos. Mantener el contrato `{ ok, data/mensaje }` donde ya existe y
  agregar pruebas negativas de tamano, rango, identificador y permisos.
- Revalidar sobre la configuracion definitiva de MySQL/XAMPP y aceptar el
  flujo de agenda con usuarios de prueba antes de cualquier actualizacion.
- Hacer respaldo y plan de reversion por instalacion al promover este paquete;
  los datos generados despues no se reemplazan con un backup viejo.

No se ha hecho push, PR ni despliegue. Ninguna prueba aislada equivale a
aprobacion de uso clinico.

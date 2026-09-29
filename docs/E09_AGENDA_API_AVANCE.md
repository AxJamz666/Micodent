# E09 - Agenda y API: cierre tecnico en DEV

Estado: implementacion E09/M16-M19 terminada y probada en aislamiento. Rama
de trabajo `codex/e09-agenda-api`, basada en `46b21ef`. Modelo confirmado por el
propietario: GPT-6 Sol. La E06/M07-D quedo pausada en `d8522d1`, otra rama.
Este cierre tecnico no autoriza despliegue ni declara aptitud clinica.

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
- Agenda usa un limite de 64 KB para el cuerpo de sus solicitudes,
  sin modificar el limite general requerido por otros modulos clinicos.
- El login usa un limite propio de 16 KB antes del control de intentos.
- Pacientes usa 64 KB para solicitudes JSON/formulario; su busqueda rechaza
  parametros repetidos o de mas de 200 caracteres. Los datos clinicos siguen
  usando sus rutas y limites previos.
- Dashboard, gastos y laboratorio usan 64 KB para solicitudes JSON/formulario.
  Sus operaciones normales y las regresiones financieras siguen funcionando;
  cuerpos excesivos devuelven 413 antes del controlador. Las rutas ordinarias
  de usuarios tambien usan 64 KB; firma/sello conserva el limite anterior. Las
  historias conservan su limite previo por imagenes y documentos clinicos.
- La busqueda de pacientes admite `limit=1..50` de forma opcional; Agenda
  solicita seis resultados al servidor. Sin `limit`, el contrato anterior
  permanece igual. Esta medida reduce el trafico de Agenda, pero no reemplaza
  la futura paginacion ni elimina el costo de buscar con `LIKE`.
- El buscador de Agenda cancela consultas anteriores al cambiar el texto o
  cerrar el modal y limpia de inmediato los resultados antiguos. La prueba de
  navegador invierte el orden de dos respuestas para impedir que se ofrezca un
  paciente obsoleto.
- La prueba de estructura cubre las 70 rutas de los routers REST y verifica
  que todas conservan autenticacion, salvo el login publico. `ping` y `health`
  son rutas operativas separadas. Las capacidades
  especificas por rol siguen sujetas a E05/E06/E07 y no se modificaron aqui.
- La edicion de un paciente inexistente ahora responde 404 dentro de la
  transaccion, sin crear auditoria; una edicion valida conserva el contrato
  anterior. El archivado y la reactivacion de pacientes siguen haciendo
  varias escrituras sin transaccion y requieren revision en E06.
- Las rutas con ID de paciente rechazan identificadores no canonicos o fuera
  del rango entero seguro antes de consultar MySQL. La prueba negativa cubre
  lectura, auditoria, edicion, archivado y reactivacion sin escrituras.
- Agenda solicita explicitamente pacientes activos al buscar, sin cambiar la
  busqueda general que permite localizar archivados. Los errores de reserva o
  cambio de estado aparecen dentro del modal; en movil no tapan su encabezado.

## Contratos y limites M19

| Grupo API | Rutas | Cuerpo JSON/formulario | Alcance verificado / siguiente responsable |
| --- | ---: | --- | --- |
| `auth` | 4 | 16 KB | Login excesivo 413; sesiones y CSRF pertenecen a E03. |
| `usuarios` | 9 | 64 KB salvo firma/sello (50 MB) | Mutaciones ordinarias excesivas 413; permisos finos E05/E07, activos de firma E04/E06. |
| `citas` | 4 | 64 KB | Validacion, concurrencia, errores 400/404/409/503 y navegador probados en E09. |
| `pacientes` | 7 | 64 KB | Busqueda, limite opcional, IDs y edicion 404 probados; archivo/reactivacion atomicos E06. |
| `dashboard` | 8 | 64 KB | Cuerpo excesivo 413; calculos E08 y listados voluminosos E10. |
| `gastos` | 7 | 64 KB | Cuerpo excesivo 413; invariantes financieros E08. |
| `laboratorio` | 4 | 64 KB | Cuerpo excesivo 413; pagos E08 y listados E10. |
| `historias` | 26 | 50 MB JSON/formulario; multipart 10 MB por archivo | Contratos clinicos, firmas y anulaciones E06; archivos E04; rendimiento E10. |
| `auditoria-financiera` | 1 GET | Limite general, sin mutacion | Trazabilidad financiera E08. |

La prueba estructural verifica autenticacion en las 70 rutas; no demuestra que
todos los endpoints tengan validacion de dominio completa. M19 cierra aqui los
contratos transversales y los del flujo de agenda. Los contratos de dominio
restantes conservan sus etapas y pruebas especificas, sin asumirlos aprobados.

No se cambia el esquema ni se ejecuta una migracion. No se ha modificado la
base `micodent` ni las instalaciones piloto o familiares. El backend DEV
habitual tampoco se ha activado con esta rama. Todas las pruebas de datos se
ejecutaron en una base MySQL temporal y con registros sinteticos.

## Verificacion

| Prueba | Resultado |
| --- | --- |
| Backend unitario | 86/86 |
| Frontend unitario | 23/23 |
| Build frontend y copia verificada al backend | Correctos |
| Integracion MySQL aislada | Alta/edicion/reactivacion concurrentes, rollback, historicos, filtro de activos, limites de cuerpo y regresion clinico-financiera correctos |
| Navegador sobre build compilado | Alta, conflicto 409 dentro del modal, busqueda `limit=6` solo activos, respuesta tardia y modal movil correctos |
| ESLint global | No pasa: 122 hallazgos en frontend; registrar en E11/E12 antes del release. Build y pruebas si pasan. |
| Escaner de secretos | Codigo sin hallazgos; dos enlaces locales `node_modules` reportados como `SYMLINK_REQUIRES_REVIEW` |

Evidencia de navegador: `E:\MICODENT_QA\qa-1790687650669`.
Ultima regresion backend: `E:\MICODENT_QA\qa-1790687887472`.
El escaneo no certifica todo el entorno por esos enlaces locales, que no estan
versionados ni forman parte del paquete. Antes de publicar, comprobar el indice
de Git y ejecutar la verificacion sobre un arbol sin dichos enlaces.

## Dependencias posteriores al cierre tecnico

- El GET historico de citas conserva rangos amplios por compatibilidad; E10
  debe medir volumen y acordar paginacion o un nuevo contrato antes de
  restringirlo. Lo mismo aplica a pacientes, historias, deudores y laboratorio.
- E05/E06/E07/E08 deben probar validacion, permisos y errores de sus endpoints
  de dominio. No reducir globalmente el limite de 50 MB mientras historias y
  firma/sello aun dependen de cargas grandes; E04/E06 deben revisar esas cargas.
- `GET /api/historias` incluye firmas y sellos actuales del doctor en cada
  fila (`src/controllers/historias.controller.js`), y la impresion desde
  `src/pages/Historias.jsx` los consume. No quitarlos sin redisenar ese
  contrato y resolver el versionado historico de firmas en E06/M07-E.
- E08 revisara el contrato de produccion financiera. E11/E12 deben resolver
  el lint global y la advertencia del bundle principal mayor de 500 KB.
- Revalidar sobre la configuracion definitiva de MySQL/XAMPP y aceptar el
  flujo de agenda con usuarios de prueba en E13/E16 antes de actualizar PCs.
- Hacer respaldo y plan de reversion por instalacion al promover este paquete;
  los datos generados despues no se reemplazan con un backup viejo.

No se ha hecho PR ni despliegue. Publicar esta rama tampoco equivale a
aprobacion de uso clinico.

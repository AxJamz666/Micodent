# RC4 + S1-A: cierre tecnico de integracion

Fecha: 2026-09-24. Version: `rc4-s1a-dev`.
Rama: `codex/rc4-s1-integracion`. Solo desarrollo y pruebas aisladas.

## Base, alcance y estado

Integra RC4 `e3704a0e06b90f61bc0272a209560cee101b65d9` con el S1-A
historicamente aceptado `7c22ee2552070be26736b6d518223214aac147ba`.
RC4 conserva su rama publicada y su informe `HOTFIX_CIERRE_RC4.md`.
La fusion no sustituye main ni constituye un release aprobado para la clinica.

Resultado: sesiones registradas y revocables, contrasenas con hash sin respaldo
en texto plano, cambio/restablecimiento protegido, limites de autenticacion y
auditoria de seguridad reconciliados con el hotfix financiero y clinico.
Se conservan los pagos/POS, comisiones historicas, gastos, laboratorio, deudas
agrupadas, firmas/sellos, mapas Rx, impresion y frontend servido por Express.

No se migraron `micodent` ni el `micodent_dev` habitual. No se copiaron archivos
`.env` ni se cambiaron cuentas reales, secretos, permisos de Edy, XAMPP o
instalaciones de las laptops. Las cuentas y movimientos de las pruebas son
sinteticos, en instancias nuevas con puertos temporales y directorios propios.
Los procesos de esas pruebas se cerraron al terminar.

## Cambios relevantes

| Archivos | Cambio y efecto |
| --- | --- |
| `micodent-backend/src/config/environment.js`, `config/db.js` | Destino DEV local y cuenta dedicada; configuracion validada sin consulta lateral al importar el pool. |
| `src/controllers/auth.controller.js`, `src/routes/auth.routes.js`, `src/middleware/auth.js` | Inicio/cierre de sesion y validacion activa de sesiones. Rutas relativas a micodent-backend. |
| `micodent-backend/src/services/session.service.js` | Revocacion, cambio y restablecimiento; revalidacion bajo transaccion para rechazar sesiones obsoletas. |
| `micodent-backend/src/controllers/usuarios.controller.js` | Flujos protegidos manteniendo comision 0, baja logica y tratamiento de firma/sello de RC4. |
| `micodent-backend/src/index.js` | Health verifica seguridad y finanzas; arranque rechaza migracion S1-A invalida; conserva SPA/assets y escucha local de DEV. |
| `micodent-backend/scripts/migrate-s1a.js` | Reconoce exactamente base legacy o RC4, exige identidad y respaldo verificado y comprueba preservacion. |
| `micodent-frontend/src/services/api.js`, `session.js`, paginas y MainLayout | API same-origin/eventos financieros conservados; cierre en servidor y manejo selectivo de errores de sesion. |
| `micodent-backend/tests/s1a-*.cjs`, pruebas hotfix/security y unitarias | Regresion integrada, migracion, navegador y proceso real de arranque. |
| Scripts de empaquetado y `micodent-backend/public` | Build identificado como rc4-s1a-dev, no como entrega clinica; hashes exactos protegidos de conversion de finales de linea por `.gitattributes`. |

Se conserva el contenido exacto de `migrations/001_s1a.js` para no invalidar
checksums historicos. Las migraciones financieras 001/002 no se sustituyen.

## Migracion y preservacion

El migrador acepta los 24 objetos originales o los 31 objetos exactos de RC4
(30 tablas y una vista). S1-A agrega cuatro tablas y `usuarios.auth_version`:
RC4 pasa a 35 objetos, es decir, 34 tablas y una vista.
No se actualizan las contrasenas ni los roles existentes al migrar.

Se requiere UUID de servidor explicito, esquema y cuenta DEV, respaldo SQL no
vacio, `estado_bd.json` e indice SHA-256 valido. Se comparan nombres de objetos,
conteos y hashes de todas las columnas preexistentes antes/despues. Se rechaza
un esquema parcial o una identidad/respaldo incorrectos. La segunda ejecucion
reconoce una migracion ya aplicada. El DDL MySQL no tiene rollback transaccional:
ante fallo parcial se detiene y requiere diagnostico, sin borrado automatico.

En MySQL 8.0.46 se ejecuto el migrador real contra una instancia desechable,
con respaldo sintetico verificado. En MariaDB 10.4.32 se probaron las mismas
sentencias aditivas y su checksum, API y navegador, pero NO el migrador operativo:
este sigue dependiendo de `@@server_uuid` de MySQL. No usarlo en las laptops.

## Pruebas y evidencia local

Los directorios de evidencia son relativos a este worktree y quedan ignorados
por Git. No se publican dumps, capturas, logs ni directorios de datos.

| Verificacion | Resultado | Evidencia |
| --- | --- | --- |
| Backend/launcher unitarios | 36/36 | `npm test` en backend |
| Frontend unitarios | 10/10 | `npm test` en frontend |
| Build frontend | Correcto; aviso de bundle mayor de 500 kB | `npm run build` |
| Lint focalizado de API/sesion/passwordPolicy | Correcto | ESLint sobre los tres archivos afectados |
| MySQL: API, finanzas, migracion, preservacion y arranque real | 22/22 escenarios | `.runtime/qa-1790284658910/results.json` |
| Suite S1-A dentro de MySQL | 18/18 | Log de seguridad en ese directorio |
| MariaDB: estructuras, finanzas y seguridad | 20/20 escenarios; suite S1-A 18/18 | `.runtime/qa-1790284460316` |
| Navegador MySQL, desarrollo y compilado | Correcto, regresion RC4 | `.runtime/qa-1790284285950` |
| Navegador MariaDB, desarrollo y compilado | Correcto, RC4 y cambio de contrasena/logout; sin excepciones JS | `.runtime/qa-1790284460316` |

Los escenarios de seguridad comprueban revocacion, sesiones, contrasenas,
permisos, limites y concurrencia. Los financieros cubren costos externos,
comisiones historicas, pagos simultaneos, anulaciones, laboratorio, gastos,
POS configurable y tratamientos pendientes. El navegador verifica tambien
impresion/mapas Rx, sello condicional y actualizacion financiera entre pestanas.
El proceso real responde health y rechaza iniciar con checksum de S1-A invalido.

Control previo de publicacion: seis archivos del manifiesto de build verificados
contra los bytes locales y el indice Git; migracion S1-A identica a su referencia.
Escaneo del indice y los tres commits antecesores con patrones y comparacion
contra secretos locales conocidos: 216 entradas de texto distintas, sin hallazgos.
No certifica ausencia de secretos desconocidos o codificados. Los SQL permitidos
son exclusivamente las dos migraciones financieras de estructura, no dumps.
La revision de espacios del codigo/documentacion es correcta; los artefactos
generados conservan sus bytes y finales de linea para respetar sus hashes.

La primera ejecucion (`.runtime/qa-1790284097865`) detecto una carrera: el segundo
cambio simultaneo de contrasena respondia 400 en vez de sesion obsoleta 401.
Se corrigio revalidando la sesion dentro de la transaccion; las repeticiones
posteriores aprobaron. Se conserva la evidencia del fallo inicial.

## Limites y criterio de cierre

Cierre tecnico de conciliacion S1-A: implementado y probado localmente.
No equivale a aceptacion clinica, activacion del DEV habitual o produccion.
No hay workflow CI en esta rama: no se afirma aprobacion automatica en GitHub.
La base sigue limitada a loopback y credenciales DEV; no es un servidor LAN.

M02 y S1-B (incluyendo cookies HttpOnly/CSRF) siguen en la otra linea y requieren
conciliacion sobre esta base. No se declara resuelto el transporte de sesiones
ni toda la seguridad. El aviso de tamano del build sigue pendiente de la etapa
de rendimiento. Las pruebas sinteticas no acreditan carga/volumen de una clinica
real ni sustituyen restauracion y aceptacion en cada instalacion.

## Reversion y continuacion

No hay que revertir datos habituales: la integracion solo escribio en entornos
de prueba. RC4 y la linea historica de seguridad permanecen conservados.
Si una futura activacion falla, detener nuevas escrituras, conservar respaldo
posterior y evidencia, y evaluar el defecto antes de cambiar codigo. No restaurar
ciegamente una BD anterior ni borrar tablas de seguridad con sesiones nuevas.
No volver a autenticacion legacy de RC4 como arreglo automatico: perderia las
garantias de revocacion. Priorizar un correctivo sobre esta base o una reversion
compatible de seguridad, probada primero en copia aislada.

Siguiente paquete: conciliar M02 sin rotaciones nuevas ni cambios de instalaciones;
despues S1-B. Conservar RC4 como base funcional, hacer pruebas proporcionales y
publicar un informe/push al cierre de cada etapa. No abrir PR, fusionar main ni
desplegar sin autorizacion independiente.

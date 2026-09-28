# RC4 - M03-B: carga y anulacion recuperable de anexos

Fecha de cierre tecnico: 2026-09-27.
Base: `0bb4c6762fe573e5047d6f180b6dedf85b63eb5` (M03-A sobre RC4 + S1-B).
Rama: `codex/rc4-m03b-carga-anulacion`. Runtime/build: `rc4-m03b-dev`.
Seguimiento: etapa E04, issue #5. Cierre tecnico de M03 en aislamiento;
aceptacion clinica y activacion por instalacion pendientes.

## Resultado

- Cargas nuevas: nombre aleatorio UUID, creacion exclusiva, tamano maximo 10 MB,
  MIME y extension coincidentes, y comprobacion de encabezado/contenido de JPEG,
  PNG, GIF, WebP y PDF. Los archivos pasan por `.staging` dentro de uploads.
- Una carga valida crea el archivo final y registra anexo y auditoria en una
  transaccion. Si la confirmacion de MySQL es incierta, se conservan los bytes
  para conciliacion; no se borran automaticamente archivos potencialmente
  asociados a una fila ya confirmada.
- Al anular un anexo se conserva la fila de `radiografias` y el archivo. La
  nueva tabla `radiografias_anulaciones` registra usuario/fecha de anulacion y
  restauracion. Lectura, lista, historia e impresion excluyen anexos anulados.
- Solo un administrador puede listar anexos anulados y restaurarlos. La vista
  del paciente ofrece esa accion con la sesion verificada. Si falta el archivo,
  la restauracion devuelve conflicto y mantiene el anexo anulado.
- `audit:clinical-files` compara registros, archivos, duplicados, enlaces y
  staging en modo lectura. Devuelve conteos, sin nombres ni datos clinicos.
- Health y el inicio real comprueban checksum y estructura M03-B; un esquema
  sin la migracion no se presenta como listo.

No se tocaron usuarios reales, permisos de Edy, BD habituales, archivos reales,
configuracion, XAMPP, piloto ni laptops. No hay nueva dependencia. La carpeta
`.runtime` utilizada para pruebas contiene solo datos sinteticos.

## Archivos y migracion

| Area | Rutas y efecto |
| --- | --- |
| Backend | `src/config/multer.js`, `src/services/clinicalUpload.js`: carga limitada, temporal y exclusiva. |
| Backend | `src/controllers/historias.controller.js`, `src/routes/historias.routes.js`: transacciones, listas, anulacion y restauracion. |
| Backend | `src/services/clinicalFiles.js`, `src/index.js`: lectura activa y verificacion de esquema. |
| BD | `migrations/003_clinical_files.sql`: tabla aditiva InnoDB con FK, sin UPDATE/DELETE sobre datos existentes. |
| Operacion | `scripts/migrate-clinical-files.js`: identidad DEV/UUID, respaldo integro, comparacion antes/despues e idempotencia. |
| Operacion | `scripts/audit-clinical-files.js`: inventario de solo lectura. |
| Frontend | `src/pages/PacienteDetalle.jsx`, `src/pages/Historias.jsx`, `src/services/api.js`: anulacion, restauracion administrativa y textos. |
| Verificacion | `tests/hotfix-integration.cjs`, `tests/clinical-files-integration.cjs`, `tests/s1a-startup.cjs`, `tests/unit/clinical-upload.test.js`. |
| Distribucion | `scripts/package-frontend.js`, `scripts/package-hotfix.cjs`, `public`, `scripts/check-secrets.js`, `package.json`: version, build y SQL revisado. |

Rutas backend/frontend relativas a sus carpetas `micodent-backend` y
`micodent-frontend` salvo `docs`. Se conserva intacto `database/micodent.sql`;
no debe ejecutarse para actualizar una BD existente.

La migracion requiere `micodent_dev`, cuenta `dev_micodent`, UUID explicito y
un respaldo previo con `micodent_dev.sql`, `estado_bd.json` y `SHA256.json`.
Valida hashes y compara las filas preexistentes. No se aplico a la BD DEV
habitual. El ensayo uso una instancia MySQL nueva y desechable. DDL puede
autoconfirmarse: si falla parcialmente, detenerse, inspeccionar y restaurar
solo en una copia aislada. No ejecutar de nuevo a ciegas.

## Pruebas

| Comprobacion | Resultado |
| --- | --- |
| Backend completo | 80/80 unitarias y launcher |
| Frontend unitario | 23/23 |
| Build | Correcto, JS 575.84 kB; aviso >500 kB vigente |
| MySQL 8.0.46 aislado | 26/26 escenarios, 18/18 seguridad adicional |
| Migrador real en MySQL aislado | Rechaza UUID/respaldo incorrectos; aplica y repite sin modificar tablas previas |
| Carga | Rechaza HTML disfrazado y extension ejecutable; conserva bytes de imagen valida |
| Anulacion/restauracion | GET pasa a 404; PDF/imagen conservados; administrador restaura; doctor recibe 403 |
| Archivo faltante | Restauracion rechazada; estado anulado conservado |
| Inventario sintetico | Sin faltantes, huerfanos, duplicados ni staging pendiente |
| Edge build y Vite | Galeria, PDF, impresion, restauracion desde la vista y nueva anulacion; sin excepciones JS |

Evidencia local privada: `.runtime/qa-1790536617221` para navegador build/Vite,
y `.runtime/qa-1790554629983` para la repeticion posterior de migracion, carga,
archivo faltante y regresion. La evidencia nunca se incluye en el repositorio.
La comprobacion general de ESLint en las dos paginas existentes informa 98
errores de estilo/variables; no se declara esa comprobacion aprobada.
El lint focalizado de API y componente nuevo paso. No hay CI en esta rama.

La prueba de empaquetado DEV verifico 159 archivos mediante manifiesto SHA-256;
excluye BD, uploads, dependencias, runtime y secretos. El resultado permanece
en `.runtime/releases`, fuera de Git. No es una instalacion clinica lista para usar.

## Riesgos y limites

- La firma del archivo valida un formato basico; no equivale a antivirus ni
  garantiza que un PDF sea inocuo o que toda imagen decodifique correctamente.
  La lectura sigue enviando adjuntos con cabeceras restrictivas.
- No se reescribieron ni validaron todos los archivos historicos. Antes de
  activar, inventariar cada instalacion y revisar formatos no compatibles,
  faltantes y referencias duplicadas sin borrar originales.
- Un corte entre archivo y commit puede dejar un huerfano o temporal. El
  inventario lo detecta; su eliminacion o vinculacion requiere revision humana
  frente a la BD y al respaldo. No ejecutar limpieza automatica.
- Los anexos anulados ocupan espacio y deben conservarse en el backup. Una
  politica de retencion/purga legal y operativa aun no esta definida.
- La autorizacion por paciente y la matriz de capacidades clinicas pertenecen
  a M06. Se preservan permisos actuales de carga/anulacion para usuarios
  autenticados; solo restauracion requiere administrador.
- Las pruebas sinteticas no certifican capacidad con galerias grandes,
  restauracion historica completa, MariaDB operativo ni LAN/HTTPS.

## Activacion y recuperacion

Antes de actualizar cualquier instalacion, identificar su version, motor,
esquema y directorio real de uploads. Realizar respaldo coordinado de BD,
uploads (incluido `.staging`), configuracion y codigo; verificar hashes y
restauracion aislada. Detener nuevas cargas durante la captura para mantener
correspondencia BD/archivos. Ejecutar el inventario de solo lectura y resolver
las diferencias existentes; no borrar referencias o imagenes para obtener cero.

Aplicar migracion primero en copia; probar alta, anulacion, lectura denegada,
restauracion, impresion y reinicio. Luego planificar frontend/backend juntos.
Este runner esta restringido a DEV; una instalacion clinica requiere una
adaptacion revisada con identidad, backup y rollback propios. La politica de
cookies S1-B aun requiere HTTPS/LAN antes de servir otras laptops.

Si se detecta error tras activar, suspender nuevas operaciones y preservar
BD/archivos y evidencia. Volver a codigo anterior sin adaptar lecturas puede
mostrar de nuevo anexos anulados; por eso se requiere rollback coordinado del
filtro y de las operaciones. No restaurar ciegamente una BD anterior si ya
hubo trabajo nuevo. Nunca borrar la tabla o los archivos para revertir.

Estado: implementado y probado tecnicamente en aislamiento. E04 puede pasar a
aceptacion funcional, pero no es autorizacion de despliegue. Proximo paquete
del roadmap: M06 autorizacion y usuarios, manteniendo Edy como cambio separado.

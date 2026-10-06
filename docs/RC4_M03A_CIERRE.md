# RC4 - M03-A: lectura protegida de archivos clinicos

Fecha de cierre tecnico: 2026-09-27.
Base: `b321804325cb407d3f6826eeb95eca8a92ae44e6` (RC4 + S1-A + M02-A + S1-B).
Rama: `codex/rc4-m03a-archivos-privados`. Runtime/build: `rc4-m03a-dev`.
Seguimiento: etapa E04, issue #5. M03 completo permanece abierto.

## Alcance y resultado

Implementado y probado exclusivamente en aislamiento. No activado en DEV
habitual, piloto ni laptops; pendiente de aceptacion funcional del propietario.
No se modificaron BD habituales, archivos clinicos reales, .env, secretos,
usuarios, permisos de Edy, servicios ni configuracion XAMPP. No nueva migracion
ni dependencia. No se abrio PR, no se fusiono main ni se publico un release.

- `/uploads` deja de ser publico: devuelve 404 sin revelar existencia.
- `GET /api/historias/radiografias/:id/archivo` exige sesion vigente e identidad
  de pestana mediante el middleware existente. Conserva la politica de lectura
  clinica actual para usuarios autenticados; no agrega permisos por paciente.
- El servidor resuelve el registro con consulta parametrizada y limita el
  archivo al directorio autorizado. Rechaza rutas externas, traversal, streams
  alternativos Windows, enlaces y extensiones activas HTML/SVG.
- Se transmite el descriptor verificado sin transformar ni renombrar bytes.
  Respuestas private/no-store, nosniff, CSP restrictiva y nombre de descarga
  controlado. Solo formatos raster admitidos y PDF.
- La interfaz obtiene un Blob por la API autenticada, con cancelacion,
  liberacion del object URL, estados de carga/error y reintento. Se conserva
  soporte de imagen raster base64 local; no se siguen URLs remotas guardadas.
- Galeria, ampliacion y anexos usan el mismo componente. La impresion se
  bloquea mientras una imagen carga o presenta error. PDF es un adjunto
  descargable: no se imprimen automaticamente sus paginas dentro del informe.
- Firmas, sellos, mapas RX y calculos financieros no se modifican.

## Cambios y compatibilidad

Rutas relativas a la raiz del repositorio:

| Archivo | Cambio |
| --- | --- |
| `micodent-backend/src/services/clinicalFiles.js` | Lectura privada por ID, comprobacion del archivo y respuesta restrictiva. |
| `micodent-backend/src/routes/historias.routes.js` | Endpoint autenticado con pool y directorio existentes. |
| `micodent-backend/src/index.js` | Cierre de acceso publico y version nueva. |
| `micodent-frontend/src/components/ClinicalImage.jsx` | Carga autenticada y presentacion reutilizable. |
| `micodent-frontend/src/services/api.js` | Preserva Blob; interpreta errores JSON binarios sin omitir control de sesion. |
| `micodent-frontend/src/pages/PacienteDetalle.jsx` | Galeria y ampliacion privadas. |
| `micodent-frontend/src/pages/Historias.jsx` | Anexos privados y espera/errores antes de imprimir. |
| `micodent-backend/tests/unit/clinical-files.test.js` | Seis pruebas de lectura, errores, rutas y revocacion. |
| `micodent-backend/tests/clinical-files-integration.cjs` | Fixtures sinteticos y pruebas HTTP/navegador aisladas. |
| `micodent-backend/tests/hotfix-integration.cjs` | Integracion opcional del bloque M03-A en harness existente. |
| `micodent-backend/tests/s1a-startup.cjs` | Expectativa de version nueva. |
| `micodent-backend/scripts/package-frontend.js`, `scripts/package-hotfix.cjs` | Version y documento del paquete DEV. |
| `micodent-backend/public` | Build actualizado con manifiesto SHA-256. |
| `docs/RUTA_MAESTRA.md`, `ESTADO_FASES.md`, `TRABAJO_EN_GITHUB.md` | Estado parcial y referencia de cierre. |

Frontend/backend se deben actualizar juntos. Enlaces antiguos a `/uploads`
dejan de funcionar intencionalmente; recargar pestanas antiguas al activar.
Archivos inexistentes, rutas no compatibles y formatos fuera de la lista fallan
cerrado sin borrar datos. Antes de activar, inventariar formatos historicos en
una copia autorizada: no se certifico todo el corpus real de pacientes.

## Verificacion

| Prueba | Resultado |
| --- | --- |
| Backend/launcher completo | 78/78, incluidas seis nuevas de archivos |
| Frontend unitario | 23/23 |
| Lint focalizado del componente y API | Correcto |
| Build | Correcto; JS 573.55 kB, aviso >500 kB pendiente de rendimiento |
| MySQL 8.0.46 desechable | 24/24 escenarios, incluyendo regresion clinica/financiera y arranque |
| Seguridad adicional con MySQL | 18/18 |
| Edge, build y Vite | Galeria, ampliacion, PDF, impresion y revocacion correctas |
| Red del navegador | Cero solicitudes a /uploads y cero excepciones JS en ambos modos |
| Archivos sinteticos | Bytes/hash iguales antes y despues |

Evidencia privada: `.runtime/qa-1790535205416` dentro del worktree.
Incluye results.json, clinical-files-browser.json, s1a-security-tests.log,
capturas desktop/mobile y PDF de impresion. Se revisaron visualmente las
capturas de ampliacion y galeria movil. El fixture de imagen es el logo publico,
no una foto clinica; el PDF sintetico verifica descarga de bytes, no validez
documental. No publicar la carpeta de evidencia.

Los procesos del harness se cerraron al terminar. No se repitieron auditorias
completas ni las pruebas visuales de todos los modulos. No hay CI en esta rama;
son resultados locales. No se repitio MariaDB ni se certifica despliegue LAN.

## Limites y pendientes M03-B

La subida actual sigue pendiente de validacion del contenido real, nombres
sin colisiones, manejo transaccional de errores/archivos huerfanos y limites
operativos. La eliminacion fisica existente NO se ha cambiado: aun no hay
eliminacion recuperable. Estas deudas impiden declarar M03 completo.

Esta lectura no inspecciona malware ni comprueba firmas binarias; MIME se
elige por extension admitida. Los controles de rutas no protegen frente a un
administrador del sistema operativo. No se pueden revocar copias descargadas.
Object URLs/cancelacion tienen manejo en codigo; no se midio exhaustivamente
memoria, galerias masivas ni todos los casos de limpieza del navegador.
La granularidad de autorizacion pertenece a M06. La revision visual no cierra
responsive/UX de todo el producto ni modifica el diseno existente.

## Respaldo, activacion y reversion

La base Git identificada conserva la referencia de codigo; no equivale a un
nuevo respaldo integral. No se genero otro backup de una instalacion activa
porque no se intervino ninguna. Se usaron instancias y archivos sinteticos.

Una activacion futura requiere respaldo coordinado BD + uploads + configuracion
+ version, restauracion comprobada, inventario de formatos y aceptacion de
frontend/backend juntos. Mantener restricciones S1-B de DEV loopback: no
desplegar este candidato como servidor clinico LAN/produccion.

Si fallan lectura/impresion o se expone un archivo sin autorizacion, suspender
la activacion y conservar evidencia. Revertir el codigo del paquete de forma
coordinada, sin restaurar una BD vieja ni reemplazar archivos actuales. No
descartar movimientos posteriores. Reabrir /uploads publico pierde proteccion;
no es una solucion automatica admisible para una instalacion con datos reales.

Criterio tecnico cumplido: acceso privado, bytes conservados y regresion local
correcta. Aceptacion clinica, activacion y etapa E04 completa: pendientes.
Siguiente alcance: M03-B (carga segura y eliminacion recuperable), con analisis
de migracion, respaldo y pruebas propios; no adelantar Edy ni laptops.

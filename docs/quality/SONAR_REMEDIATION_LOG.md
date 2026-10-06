# SonarQube - Familia 1 (E13 `bbc15f1`)

Fuente de trabajo: `sonar-family1.csv`, filtrado a BLOCKER y CRITICAL.
No se incluyen hallazgos MAJOR/MINOR. Rama local `codex/sonar-family1`.
ESTADO: VALIDADA (2026-10-02, validacion local; reanalisis SonarQube pendiente).

## Issues

Pendientes de procesar secuencialmente: ninguno de Familia 1.

### 1. `a57e1ae1-cc23-4dce-9715-f89d4dfeb9cd`

RULE: `javascript:S2871`
SEVERITY: CRITICAL
ARCHIVO: `micodent-backend/src/controllers/usuarios.controller.js`
LINEA ORIGINAL: 72
DESCRIPCION: `sort()` sin comparador.
DIAGNOSTICO: Aplicable; el orden de bloqueos debe seguir siendo lexicografico.
CAMBIO: Comparador explicito que conserva el orden de cadenas previo.
PRUEBA: `node --check`; `node --test tests/unit/access-policy.test.js`.
RESULTADO: PASS (2/2 tests). La ruta `security.test.js` no existe en esta rama.
ESTADO: CORREGIDO

### 2. `2a07e6eb-b9d4-47a6-854f-b176ce8c17f1`

RULE: `javascript:S2871`
SEVERITY: CRITICAL
ARCHIVO: `micodent-backend/src/controllers/usuarios.controller.js`
LINEA ORIGINAL: 111
DESCRIPCION: Segundo `sort()` sin comparador.
DIAGNOSTICO: Aplicable; orden estable de bloqueos al desactivar usuarios.
CAMBIO: Mismo comparador lexicografico explicito.
PRUEBA: `node --check`; access-policy.
RESULTADO: PASS (2/2 tests). La ruta `security.test.js` no existe en esta rama.
ESTADO: CORREGIDO

### 3. `81dbab81-ffd4-464b-a9c1-95657b9da39e`

RULE: `javascript:S2871`
SEVERITY: CRITICAL
ARCHIVO: `micodent-backend/src/services/session.service.js`
LINEA ORIGINAL: 141
DESCRIPCION: `sort()` implicito para bloquear actor y destinatario.
DIAGNOSTICO: Aplicable; se conserva orden lexicografico y control de concurrencia.
CAMBIO: Comparador de cadenas explicito.
PRUEBA: Sintaxis de ambos archivos; access-policy, password y route-guards.
RESULTADO: PASS (10/10 tests).
ESTADO: CORREGIDO

### 4. `df0b8b7a-ed3b-4b8c-b914-256cbd380088`

RULE: `javascript:S3776`
SEVERITY: CRITICAL
ARCHIVO: `micodent-frontend/src/components/OdontogramaEditor.jsx`
LINEA ORIGINAL: 24
DESCRIPCION: Complejidad cognitiva 16 frente al limite 15.
DIAGNOSTICO: Aplicable; la condicion de borrado estaba incrustada en el render del panel.
CAMBIO: Extraida a `puedeEliminarRegistro`, manteniendo exactamente la condicion anterior.
PRUEBA: `npm test` en frontend.
RESULTADO: PASS (25/25). Scanner Sonar aun no ejecutado.
ESTADO: CORREGIDO

### 5. `a844beca-f4e5-4836-a721-ebe1afe63f7e`

RULE: `javascript:S3776`
SEVERITY: CRITICAL
ARCHIVO: `micodent-frontend/src/pages/AdministracionPersonal.jsx`
LINEA ORIGINAL: 19
DESCRIPCION: Complejidad cognitiva 25 frente al limite 15.
DIAGNOSTICO: Aplicable; render por usuario y texto de error anidado inflaban la funcion principal.
CAMBIO: Extraidos `TarjetaPersonal` y `mensajeDesactivacion`, conservando acciones y jerarquia de permisos.
PRUEBA: ESLint del archivo; `npm test` frontend.
RESULTADO: PASS (ESLint, 25/25 tests). Scanner Sonar aun no ejecutado.
ESTADO: CORREGIDO

### 6. `a27df27f-7ae9-44b6-bd81-37bad0bc4409`

RULE: `javascript:S3776`
SEVERITY: CRITICAL
ARCHIVO: `micodent-frontend/src/pages/FinanzasDashboard.jsx`
LINEA ORIGINAL: 17
DESCRIPCION: Complejidad cognitiva 18 frente al limite 15.
DIAGNOSTICO: Aplicable; selector anidado de estado/pago de laboratorio.
CAMBIO: Extraido `EstadoPagoLaboratorio` con los mismos estados, importes y acciones.
PRUEBA: `npm test` frontend; ESLint del archivo con solo la regla preexistente `react-hooks/set-state-in-effect` desactivada en el comando.
RESULTADO: PASS (25/25 y lint acotado). Scanner Sonar aun no ejecutado.
ESTADO: CORREGIDO

### 7. `675c2c47-7f56-416c-9f83-27f2d04e8ad3`

RULE: `javascript:S3776`
SEVERITY: CRITICAL
ARCHIVO: `micodent-frontend/src/pages/Historias.jsx`
LINEA ORIGINAL: 359
DESCRIPCION: Complejidad cognitiva 16 frente al limite 15 en guardado de historia.
DIAGNOSTICO: Aplicable; bucle de radiografias pendientes dentro del manejador.
CAMBIO: Extraida la subida secuencial a `subirRadiografiasPendientes`, sin cambiar orden ni errores.
PRUEBA: `npm test` frontend.
RESULTADO: PASS (25/25). ESLint general del archivo sigue con 89 problemas preexistentes; scanner Sonar aun no ejecutado.
ESTADO: CORREGIDO

### 8. `5b478699-876b-4a94-bb6a-5a7657fc4b77`

RULE: `javascript:S3776`
SEVERITY: CRITICAL
ARCHIVO: `micodent-frontend/src/pages/Historias.jsx`
LINEA ORIGINAL: 515
DESCRIPCION: Complejidad cognitiva 30 frente al limite 15 en click del odontograma.
DIAGNOSTICO: Aplicable; borrado, arcada y pieza/cara estaban anidados.
CAMBIO: Separados en `borrarEnCara`, `aplicarArcada` y `aplicarPiezaOCara`; el despachador conserva el orden original.
PRUEBA: `npm run build` frontend.
RESULTADO: PASS. Clics manuales del odontograma y scanner Sonar pendientes.
ESTADO: CORREGIDO

### 9. `88a43c2a-412f-43fc-a861-2c2c5f899d1d`

RULE: `javascript:S3776`
SEVERITY: CRITICAL
ARCHIVO: `micodent-frontend/src/pages/Historias.jsx`
LINEA ORIGINAL: 680
DESCRIPCION: Complejidad cognitiva 19 frente al limite 15 en guardado de tratamientos.
DIAGNOSTICO: Aplicable; edicion y alta estaban mezcladas.
CAMBIO: Extraida la rama de edicion a `guardarEdicionTratamiento`; mismas llamadas y avisos.
PRUEBA: `npm test` frontend.
RESULTADO: PASS (25/25). Prueba manual de alta/edicion y scanner Sonar pendientes.
ESTADO: CORREGIDO

### 10. `5aa9ee29-916c-43c4-984e-3b715bd043a7`

RULE: `javascript:S3776`
SEVERITY: CRITICAL
ARCHIVO: `micodent-frontend/src/pages/MiPerfil.jsx`
LINEA ORIGINAL: 82
DESCRIPCION: Complejidad cognitiva 16 frente al limite 15.
DIAGNOSTICO: Aplicable; conversion del sexo duplicada en el render.
CAMBIO: Etiqueta `sexo` calculada una vez y reutilizada, sin alterar datos.
PRUEBA: `npm test` frontend.
RESULTADO: PASS (25/25). Scanner Sonar aun no ejecutado.
ESTADO: CORREGIDO

### 11. `bfa087c9-fad1-442a-a2dd-9e4fd6cf36bc`

RULE: `javascript:S3776`
SEVERITY: CRITICAL
ARCHIVO: `micodent-frontend/src/pages/PacienteDetalle.jsx`
LINEA ORIGINAL: 105
DESCRIPCION: Complejidad cognitiva 24 frente al limite 15.
DIAGNOSTICO: Aplicable; pestañas y anexos acumulaban condiciones en el componente principal.
CAMBIO: Extraidos `PestanasPaciente` y `AnexosPaciente`, conservando estado y manejadores en la ficha.
PRUEBA: `npm test` y `npm run build` frontend.
RESULTADO: PASS (25/25 y build). Prueba manual de anexos y scanner Sonar pendientes.
ESTADO: CORREGIDO

### 12. `514e23d7-19bd-4be2-902c-77f3e93cc109`

RULE: `javascript:S2189`
SEVERITY: BLOCKER
ARCHIVO: `micodent-frontend/src/utils/agendaUtils.js`
LINEA ORIGINAL: 73
DESCRIPCION: Sonar no detecta avance de `cursor` dentro del bucle.
DIAGNOSTICO: Alerta falsa de bucle infinito: `Date.setDate()` si mutaba el objeto. La expresion era poco explicita para el analizador.
CAMBIO: Bucle reemplazado por recorrido acotado a dias de grilla; la diferencia UTC se calcula a partir de fechas locales para evitar el efecto del horario de verano.
PRUEBA: `node --test tests/agendaUtils.test.mjs` (febrero bisiesto, cruce de anio, mes de seis semanas).
RESULTADO: PASS (3/3). Scanner Sonar aun no ejecutado.
ESTADO: CORREGIDO

### 13. `90bf3c01-0590-488c-b844-59215631c2ce`

RULE: `javascript:S2189`
SEVERITY: BLOCKER
ARCHIVO: `micodent-frontend/src/utils/agendaUtils.js`
LINEA ORIGINAL: 73
DESCRIPCION: Sonar senala que `finGrilla` no cambia en la condicion del mismo bucle.
DIAGNOSTICO: Alerta duplicada sobre un limite intencionalmente fijo; no era un bucle infinito. El bucle acotado elimina la condicion ambigua.
CAMBIO: Mismo recorrido con `totalDias` y contador explicito, sin cambiar la secuencia local de fechas.
PRUEBA: `node --test tests/agendaUtils.test.mjs`.
RESULTADO: PASS (3/3). Scanner Sonar aun no ejecutado.
ESTADO: CORREGIDO

## Observaciones pendientes

- OBSERVACION PENDIENTE: `OdontogramaEditor.jsx`, efecto de `piezaActiva`: ESLint `react-hooks/set-state-in-effect` preexistente; posible render adicional.
- OBSERVACION PENDIENTE: `FinanzasDashboard.jsx`, tres efectos de carga: misma regla preexistente; posible render adicional.
- OBSERVACION PENDIENTE: `Historias.jsx`, varias ubicaciones: 89 problemas ESLint ajenos a esta extraccion, principalmente imports sin uso.
- OBSERVACION PENDIENTE: `Historias.jsx`, click del odontograma y guardado de tratamientos: verificar cara, pieza, arcada, alta y edicion en UI.
- OBSERVACION PENDIENTE: `PacienteDetalle.jsx`, pestañas/anexos: verificar subida, anulacion y restauracion en UI.
- OBSERVACION PENDIENTE: Scanner SonarQube no disponible; reanalisis de los 13 issues pendiente.
- OBSERVACION RESUELTA: `micodent-backend/tests/unit/arranque.test.cjs`, prueba Windows cerca de linea 191: fallo ambiental de resolucion CommonJS/ESM, demostrado y validado en carpeta temporal aislada; ver cierre 2026-10-02.

## Validacion final

- Frontend: `npm test` 28/28 PASS; prueba de agenda con `TZ=America/New_York` 3/3 PASS; `npm run build` PASS con aviso de chunk grande.
- Backend: `node --check` en ambos archivos tocados PASS; `npm test` 85/86, un FAIL de arranque Windows ajeno a las lineas modificadas.
- Diff: `git diff --check` sin errores de espacios; avisos de conversion LF/CRLF de Git.
- No se realizaron conexiones a MySQL, cambios de datos, instalaciones ni push.
- Estado anterior: cambios de Familia 1 implementados, cierre local pendiente por 85/86; sustituido por el cierre siguiente.

## Cierre local 2026-10-02 - VALIDADA

- CLASIFICACION: C (entorno/configuracion de pruebas); no A ni D. El test y el lanzador no tienen diferencias frente a `bbc15f1` (`git diff --exit-code` devuelve 0).
- CAUSA: `C:\Users\Jamz\AppData\Local\Temp\package.json` contiene `type: module`. La fixture crea `src/index.js` con `require`; Node v24.14.0 lo interpreta como ESM y termina antes de abrir el puerto. `START` era el timeout posterior, no la causa.
- EVIDENCIA: reproduccion inicial del test falla; sonda sintetica `.js` termina con codigo 1 y `ReferenceError: require is not defined in ES module scope`; el mismo contenido `.cjs` termina con codigo 0. No se modifico el package.json externo.
- ACCION: TEMP/TMP se dirigieron solo durante cada proceso de validacion a una carpeta nueva bajo `micodent-backend`, con alcance CommonJS. Se restauraron las variables al terminar. Sin cambios al test, lanzador, configuracion activa ni dependencias.
- VALIDACION: test problemático 1/1 PASS; suite backend `npm test` 86/86 PASS (0 omitidos); `node --check` de `usuarios.controller.js` y `session.service.js` PASS.
- FRONTEND/BUILD: no repetidos; se conserva 28/28 PASS y build PASS de la sesion anterior. Ningun archivo frontend fue modificado en esta sesion.
- REGRESIONES: ninguna observada; el fallo 85/86 no corresponde a Familia 1. Los 2 BLOCKER y 11 CRITICAL permanecen con sus correcciones previas.
- PENDIENTE: reanalisis SonarQube y pruebas manuales clinicas ya registradas. Al repetir los tests, utilizar una carpeta temporal aislada; una mejora futura podria hacer la fixture CommonJS explicita, fuera de esta sesion.
- LIMPIEZA: fixtures sinteticas eliminadas por los tests. Quedo solo `micodent-backend/.family1-validation-e27d15c5a1d548b4a9220750e83660c1/node-compile-cache`; el borrado de esa carpeta generada fue rechazado por politica automatica. No contiene datos clinicos.
- ARCHIVOS DE ESTA SESION: unicamente `CURRENT_TASK.md` y este registro; cache temporal generada. Sin push. No se inicio Familia 2.

## Familia 2 - Backend mecanico (2026-10-02)

FUENTE: `sonar-family2.csv`, 42 issues filtrados por componente backend y las seis reglas autorizadas. Familia 1 permanece VALIDADA; sus cambios y archivos preexistentes se preservan.
ESTADO: COMPLETA Y VALIDADA LOCALMENTE. Reanalisis SonarQube pendiente.

| ISSUE | RULE | ARCHIVO | LINEA BASE | CAMBIO | VALIDACION | ESTADO |
| --- | --- | --- | --- | --- | --- | --- |
| 1 / 41466d31-b147-459a-b2f7-f274ca23cc57 | S7723 | src/config/browserTransport.js | 4 | `Error` a `new Error`, mismo tipo y mensaje | Sintaxis PASS | CORREGIDO |
| 2 / 7dd08d34-7d27-4f5b-854b-3a6f573710b5 | S7723 | src/config/multer.js | 17 | `new Error` en validacion de root | Sintaxis PASS | CORREGIDO |
| 3 / ff860022-3f04-481a-8265-dced518214c8 | S7723 | src/config/multer.js | 20 | `new Error` en validacion de staging | Sintaxis PASS | CORREGIDO |
| 4 / 4a826540-fc18-452d-af34-ca2e941ac628 | S7773 | src/controllers/dashboard.controller.js | 39 | `Number.parseFloat`, misma funcion estandar | Sintaxis PASS | CORREGIDO |
| 5 / a2dc7baf-ba47-4dc5-9c27-ca0b531fad4c | S7773 | src/controllers/dashboard.controller.js | 142 | `Number.parseFloat` de comision bruta | Sintaxis PASS | CORREGIDO |
| 6 / cc30792f-4870-46ae-9712-b28831e3e7d6 | S7773 | src/controllers/dashboard.controller.js | 143 | `Number.parseFloat` de penalidades | Sintaxis PASS | CORREGIDO |
| 7 / 2f6c9433-4f4d-452a-9f71-1a0a1a162cac | S7773 | src/controllers/dashboard.controller.js | 146 | `Number.parseFloat` de cobrado | Sintaxis PASS | CORREGIDO |
| 8 / 302e2cc2-6c82-4d1b-8c9f-ada647121803 | S7773 | src/controllers/dashboard.controller.js | 149 | `Number.parseFloat` de neto, sin alterar redondeo | Sintaxis PASS | CORREGIDO |
| 9 / 6f9dcc75-2220-4707-9597-4542ce806429 | S7773 | src/controllers/dashboard.controller.js | 168 | `Number.parseFloat` de gastos | Sintaxis PASS | CORREGIDO |
| 10 / 90675c0b-fa8b-4dd5-83cc-7ef450b33a36 | S7773 | src/controllers/dashboard.controller.js | 197 | `Number.parseFloat` de laboratorio | Sintaxis PASS | CORREGIDO |
| 11 / e6caac12-7e8b-4a8d-9cfa-5aa93e291076 | S7776 | src/controllers/gastos.controller.js | 5 | Set de categorias; sus dos usos son solo pertenencia; igualdad SameValueZero conservada | Sintaxis PASS | CORREGIDO |
| 12 / 333f69dd-e012-452c-875b-0e380ab10993 | S7776 | src/controllers/gastos.controller.js | 6 | Set de categorias con mes; dos usos de pertenencia equivalentes | Sintaxis PASS | CORREGIDO |
| 13 / db0856a1-6540-4238-b430-5f5604b2938e | S7773 | src/controllers/gastos.controller.js | 46 | `Number.parseFloat` en validacion | Sintaxis PASS | CORREGIDO |
| 14 / 5877dda9-17be-460e-90a1-d539db87cecf | S7773 | src/controllers/gastos.controller.js | 65 | `Number.parseFloat` en auditoria de alta | Sintaxis PASS | CORREGIDO |
| 15 / 80dfc6a4-7019-4ba5-afae-5828c4d57591 | S7773 | src/controllers/gastos.controller.js | 113 | `Number.parseFloat` en auditoria antes | Sintaxis PASS | CORREGIDO |
| 16 / 6046f8fa-24ec-4cca-bbd9-63460077088c | S7773 | src/controllers/gastos.controller.js | 114 | `Number.parseFloat` en auditoria despues | Sintaxis PASS | CORREGIDO |
| 17 / b47c0b79-3370-49f6-beb7-58c1c733c9ce | S7773 | src/controllers/gastos.controller.js | 150 | `Number.parseFloat` en auditoria anulacion | Sintaxis PASS | CORREGIDO |
| 18 / f035c3f5-5964-4b96-9dd4-02f18a429017 | S7773 | src/controllers/gastos.controller.js | 185 | `Number.parseFloat` en auditoria reactivacion | Sintaxis PASS | CORREGIDO |
| 19 / ad93b1fb-2cde-4ab9-a292-e4d5fae95072 | S7773 | src/controllers/gastos.controller.js | 227 | `Number.parseFloat` en validacion penalidad | Sintaxis PASS | CORREGIDO |
| 20 / 56ca33a0-d003-4376-846b-d9046da70b91 | S7773 | src/controllers/gastos.controller.js | 239 | `Number.parseFloat` en auditoria penalidad | Sintaxis PASS | CORREGIDO |
| 21 / fb63fb16-5a00-416b-a9bc-741a01c75bf2 | S7773 | src/controllers/historias.controller.js | 223 | `Number.isNaN(+historiaId)` conserva ToNumber del isNaN global, incluidos TypeError | Sintaxis y sonda de coercion PASS | CORREGIDO |
| 22 / 09122690-ee63-48bc-914a-d923f4bc5bb1 | S6353 | src/controllers/historias.controller.js | 475 | Clase ASCII `[0-9]` a `\d`; `[1-9]` inicial conservado | Sintaxis PASS | CORREGIDO |
| 23 / 0a346695-1db2-49c6-a86d-ced1d7991d73 | S6353 | src/controllers/historias.controller.js | 547 | Mismo cambio en anulacion de anexo | Sintaxis PASS | CORREGIDO |
| 24 / 444f47f3-a10a-495d-aa1a-7b202a6be86f | S6353 | src/controllers/historias.controller.js | 575 | Mismo cambio en restauracion de anexo | Sintaxis PASS | CORREGIDO |
| 25 / 9554a83c-1ef0-4b78-9cef-339db25b6308 | S7723 | src/controllers/historias.controller.js | 584 | `new Error` en validacion de directorio | Sintaxis PASS | CORREGIDO |
| 26 / 2c221d8c-fb6d-4717-af58-2e9845954be7 | S7773 | src/controllers/historias.controller.js | 681 | `Number.parseFloat` en texto de auditoria; mismo toFixed | Sintaxis PASS | CORREGIDO |
| 27 / 66cdc4a2-30d9-4954-b764-ba665cd2a760 | S7773 | src/controllers/laboratorio.controller.js | 22 | `Number.parseFloat` en total pagado | Sintaxis PASS | CORREGIDO |
| 28 / 2a000e0f-3729-4f82-944c-ea0e9f1bc759 | S7773 | src/controllers/laboratorio.controller.js | 24 | `Number.parseFloat` en saldo | Sintaxis PASS | CORREGIDO |
| 29 / 5b7c9eb3-3a1a-4237-a414-811b3eb8009d | S7773 | src/controllers/laboratorio.controller.js | 25 | `Number.parseFloat` en estado; misma formula | Sintaxis PASS | CORREGIDO |
| 30 / 0d97faf3-cb66-4098-b031-de0a757e5eb1 | S7773 | src/controllers/laboratorio.controller.js | 53 | `Number.parseFloat` para ambos operandos del saldo | Sintaxis PASS | CORREGIDO |
| 31 / fa96fe04-6827-4076-ad31-a044d9a86a94 | S7773 | src/controllers/laboratorio.controller.js | 53 | Segundo operando corregido al atender issue 30 | Sintaxis PASS | YA_RESUELTO_POR_CAMBIO_PREVIO |
| 32 / 28b3094b-f175-4f99-9c7e-42f4cf1483d6 | S7773 | src/controllers/pacientes.controller.js | 111 | `Number.isNaN` sobre resultado numerico de getFullYear al crear | Sintaxis PASS | CORREGIDO |
| 33 / 1e325d64-cc43-4ca9-a63b-ec6dc8884660 | S7773 | src/controllers/pacientes.controller.js | 208 | Mismo cambio al actualizar; mantiene validacion de fecha | Sintaxis PASS | CORREGIDO |
| 34 / 1cc07ec2-3b42-4a9b-a0c0-e9effa974657 | S7772 | src/index.js | 3 | Import explicito del builtin `node:path` | Sintaxis PASS | CORREGIDO |
| 35 / 1e506bec-7301-47ae-819c-c050d0d023dd | S7723 | src/services/browserTransport.js | 13 | `new Error` en validacion de secreto | Sintaxis PASS | CORREGIDO |
| 36 / 0c1a8c44-6c00-488a-87e3-d520a0c59572 | S6353 | src/services/browserTransport.js | 34 | `[0-9]` a `\d`; limites del puerto sin cambios | Sintaxis PASS | CORREGIDO |
| 37 / dc9c75a2-dc16-4101-b75b-3d708387b8a8 | S7723 | src/services/browserTransport.js | 61 | `new Error` en validacion de expiracion | Sintaxis PASS | CORREGIDO |
| 38 / b1b868da-beca-44af-afb7-a247a7be5aae | S6353 | src/services/clinicalFiles.js | 13 | `com[0-9]` a `com\d`; conserva rechazo de nombres reservados | Sintaxis PASS | CORREGIDO |
| 39 / c2a61839-74c8-443b-b559-6060d611a57c | S6353 | src/services/clinicalFiles.js | 13 | `lpt[0-9]` a `lpt\d`; misma clase ASCII | Sintaxis PASS | CORREGIDO |
| 40 / 73cf3efb-55b0-4914-9961-2aecbe60d870 | S6353 | src/services/clinicalFiles.js | 24 | `[0-9]` a `\d`; validacion de id positivo conservada | Sintaxis PASS | CORREGIDO |
| 41 / 54ccdc58-d95d-4060-bdd4-7cbc2b4f8ce5 | S6582 | src/services/clinicalUpload.js | 15 | `!file?.size` conserva rechazo de archivo ausente o vacio | Sintaxis PASS | CORREGIDO |
| 42 / 41711e49-c327-4f3b-b636-c9cb5ac48b66 | S6582 | src/services/session.service.js | 51 | `!user?.activo` conserva rechazo de usuario ausente o inactivo | Sintaxis PASS | CORREGIDO |

Las rutas `src/*` de esta tabla pertenecen a `micodent-backend`. Las reglas llevan el prefijo `javascript:`.

### Validacion final Familia 2

- Lote: 42/42 procesados; 41 CORREGIDO, 1 YA_RESUELTO_POR_CAMBIO_PREVIO (issue 31, segundo operando de la linea corregida en issue 30), 0 PENDIENTE_REVISION, 0 FALSO_POSITIVO. CSV y registro cotejados por key: 42 claves, ninguna ausente.
- Pruebas relacionadas: `node --test tests/unit/finanzas.test.cjs tests/unit/route-guards.test.js tests/unit/cookie-transport.test.js tests/unit/clinical-files.test.js tests/unit/clinical-upload.test.js`: 31/31 PASS.
- Suite backend: `npm test`: 86/86 PASS; 0 fallos, 0 omitidas, incluida la prueba Windows anteriormente afectada por el TEMP global.
- Ambas ejecuciones utilizaron el mismo TEMP/TMP aislado: `micodent-backend/.family2-validation-983fac1bfa1547eb8bf7e66da570c983`. `NODE_DISABLE_COMPILE_CACHE=1` solo durante cada proceso; variables restituidas al terminar. Directorio vacio conservado: el intento inicial con limpieza fue rechazado por politica antes de ejecutarse; las validaciones posteriores no incluyeron borrados.
- Sintaxis: `node --check` de los doce archivos backend modificados, 12/12 PASS. Import `node:path` equivalente al builtin previo; importaciones de rutas/servicios cubiertas por pruebas unitarias.
- Sondas de equivalencia PASS: identidad de parseFloat; coercion de isNaN (incluidos TypeError para BigInt/Symbol); Array.includes frente a Set.has; cortocircuitos de optional chaining; clases ASCII en identificadores y nombres reservados.
- `git diff --check`: PASS. Cambios de Familia 1 preservados, incluido su comparator en session.service.js. Sin regresiones detectadas por estas pruebas; no sustituyen una validacion clinica integral.
- Frontend y build NO REPETIDOS: sin modificaciones de esta familia. Evidencia anterior: frontend 28/28 PASS y build PASS.
- Sin cambios en SQL, bases reales, .env, contratos API, formulas financieras, limites de subida o permisos. Sin nuevas dependencias, commits ni push. No se iniciaron otras familias ni las etapas E01-E17.
- Archivos de codigo de esta familia: `src/config/browserTransport.js`, `src/config/multer.js`, `src/controllers/dashboard.controller.js`, `src/controllers/gastos.controller.js`, `src/controllers/historias.controller.js`, `src/controllers/laboratorio.controller.js`, `src/controllers/pacientes.controller.js`, `src/index.js`, `src/services/browserTransport.js`, `src/services/clinicalFiles.js`, `src/services/clinicalUpload.js`, `src/services/session.service.js`.
- Seguimiento: `docs/quality/sonar-family2.csv`, `docs/quality/SONAR_REMEDIATION_LOG.md`, `docs/quality/CURRENT_TASK.md`.
- Siguiente paso recomendado: reanalizar en SonarQube para confirmar el cierre externo del lote. Esperar instrucciones; no iniciar Familia 3.

## Familia 3 - Frontend accesibilidad y semantica (2026-10-02)

FUENTE: `sonar-family3.csv`, 76 issues frontend de S6848 (5), S1082 (6), S6853 (45), S6819 (18), S6772 (2). Se preservan Familias 1 y 2, sin reprocesarlas ni ejecutar SonarQube.
ESTADO: COMPLETA (cierre local validado). Los 15 modales pendientes estan CORREGIDOS: 69 CORREGIDO, 4 YA_RESUELTO_POR_CAMBIO_PREVIO, 3 FALSO_POSITIVO, 0 pendientes. Sin nuevo analisis SonarQube.

| ISSUE | RULE | ARCHIVO | LINEA BASE | CAMBIO / DIAGNOSTICO | VALIDACION | ESTADO |
| --- | --- | --- | --- | --- | --- | --- |
| 1 / 22963a32-3f5e-4c60-a697-ed89bf423a16 | S6848 | src/components/AgendaDia.jsx | 48 | Slot a button nativo con nombre accesible y disabled si ocupado; mismo handler | JSX y agenda PASS | CORREGIDO |
| 2 / 643de3f4-86c7-4eeb-ba4a-5bfb1256d493 | S1082 | src/components/AgendaDia.jsx | 48 | Teclado nativo resuelto en issue 1; sin listener duplicado | JSX y agenda PASS | YA_RESUELTO_POR_CAMBIO_PREVIO |
| 3 / 5d342e05-10c8-4fa0-bcd3-d5bdcbd353e9 | S1082 | src/components/AgendaSemana.jsx | 39 | Slot a button nativo con nombre accesible; mismo handler | JSX y agenda PASS | CORREGIDO |
| 4 / 9b10bf1e-5474-491b-9ddb-32607811fb37 | S6848 | src/components/AgendaSemana.jsx | 39 | Interaccion nativa resuelta en issue 3 | JSX y agenda PASS | YA_RESUELTO_POR_CAMBIO_PREVIO |
| 5 / 60c55f82-9a3f-433e-938c-da36f3bd367f | S6853 | src/components/CitaModal.jsx | 178 | Paciente: label asociado a buscador; texto p si ya vinculado | JSX PASS | CORREGIDO |
| 6 / 2eb65288-e18d-499c-94bc-56b4ddf9208b | S6853 | src/components/CitaModal.jsx | 206 | Nombre de contacto: htmlFor/id con prefijo useId | JSX PASS | CORREGIDO |
| 7 / 5bf5b00b-9b9d-492a-9274-05f7b592d6d8 | S6853 | src/components/CitaModal.jsx | 211 | Celular: htmlFor/id | JSX PASS | CORREGIDO |
| 8 / c4ceeaf9-5da5-4d45-9481-58efc056ad20 | S6853 | src/components/CitaModal.jsx | 218 | Motivo: htmlFor/id de textarea | JSX PASS | CORREGIDO |
| 9 / 85f3dd19-21e2-415c-98a6-bfb38a4e203a | S6853 | src/components/CitaModal.jsx | 224 | Doctor: htmlFor/id | JSX PASS | CORREGIDO |
| 10 / 676dcca3-b00d-4a86-8d6d-c70d9bd7a655 | S6853 | src/components/CitaModal.jsx | 234 | Fecha: htmlFor/id | JSX PASS | CORREGIDO |
| 11 / 4c51c32b-d244-4da8-a8fe-d5bf22b95b6b | S6853 | src/components/CitaModal.jsx | 239 | Hora: htmlFor/id | JSX PASS | CORREGIDO |
| 12 / be28923e-5d8c-4dc4-b69e-a1c2cd23f7e1 | S6853 | src/components/CitaModal.jsx | 249 | Duracion: fieldset/legend, seleccion aria-pressed; mismos botones y handlers | JSX PASS | CORREGIDO |
| 13 / ae5eca0e-67c3-4df9-af2d-b5e6df808796 | S6819 | src/components/ClinicalImage.jsx | 34 | Estado de carga a output nativo; mismas clases y condicion | JSX PASS | CORREGIDO |
| 14 / 8b2b88e2-a860-459b-a9f8-173c55e77d91 | S6772 | src/components/ClinicalImage.jsx | 37 | Espacio JSX explicito antes del boton de reintento | JSX PASS | CORREGIDO |
| 15 / b9a5db0e-1623-4f56-acae-2826575d8454 | S6819 | src/components/ConfiguracionPos.jsx | 25 | POS: ModalDialog nativo con foco confinado y retorno, Escape bloqueado al guardar; mantiene X/formulario/overlay | Modal 7/7 PASS; Edge POS PASS con API simulada | CORREGIDO |
| 16 / 9d67045f-2d66-4cd3-817b-7315d5d4bf8d | S1082 | src/components/ConfirmModal.jsx | 38 | onClick solo detiene propagacion, no ejecuta una accion; botones hijos ya nativos | Handler y contenedor inspeccionados | FALSO_POSITIVO |
| 17 / 4e0f83d8-1eff-408d-8a31-75509f51f6cb | S6848 | src/components/Diente.jsx | 11 | Button nativo; pieza identificada; disabled sin handler y aria-pressed | JSX y Rx PASS | CORREGIDO |
| 18 / f7549821-0ac8-4d42-9506-1e01c3fe2c48 | S1082 | src/components/Diente.jsx | 11 | Teclado nativo ya resuelto por issue 17 | JSX y Rx PASS | YA_RESUELTO_POR_CAMBIO_PREVIO |
| 19 / 54d254c2-6961-4160-8d4b-8be65fbb3c3d | S6819 | src/components/MetodoPago.jsx | 17 | Output nativo block; mismo estado, texto y clases | JSX y finanzas PASS | CORREGIDO |
| 20 / 77c520fd-b9f3-4949-81ce-b316c5c6488c | S6853 | src/components/OrdenRadiografiaTab.jsx | 102 | Tipo de solicitud agrupado por fieldset/legend y aria-pressed | JSX y Rx PASS | CORREGIDO |
| 21 / f3323040-819f-4465-b34e-85dfb3d6c3f1 | S6819 | src/components/OrdenRadiografiaTab.jsx | 379 | Rx: ModalDialog con nombres actuales, mismos X/handleCrear/handleReemitir/construirCadena; Escape protegido durante guardado; formulario y CSS conservados | Edge con OrdenRadiografiaTab real y servicios simulados: nueva, correccion e historial PASS; foco/Tab/retorno/overlay/X/Escape y envio unico; historia de versiones conservada | CORREGIDO |
| 22 / 214b0108-ea7e-4a21-80e9-142c14c78571 | S6819 | src/components/OrdenRadiografiaTab.jsx | 396 | Rx: ModalDialog con nombres actuales, mismos X/handleCrear/handleReemitir/construirCadena; Escape protegido durante guardado; formulario y CSS conservados | Edge con OrdenRadiografiaTab real y servicios simulados: nueva, correccion e historial PASS; foco/Tab/retorno/overlay/X/Escape y envio unico; historia de versiones conservada | CORREGIDO |
| 23 / fa71a82e-0ab3-454f-a77f-d9724e856fc8 | S6819 | src/components/OrdenRadiografiaTab.jsx | 421 | Rx: ModalDialog con nombres actuales, mismos X/handleCrear/handleReemitir/construirCadena; Escape protegido durante guardado; formulario y CSS conservados | Edge con OrdenRadiografiaTab real y servicios simulados: nueva, correccion e historial PASS; foco/Tab/retorno/overlay/X/Escape y envio unico; historia de versiones conservada | CORREGIDO |
| 24 / 9a45a201-9a93-4828-9592-c6d9dcd6eb1d | S6819 | src/components/RecetarioTab.jsx | 140 | Recetas: ModalDialog con mismos X/Cancelar/handleCrearReceta/handleReemitir/cadena; Escape protegido durante guardado, campos y estilos conservados | Edge con RecetarioTab real y API simulada: nueva/correccion/historial, X/Escape/Cancelar, foco/Tab/retorno, fondo sin cierre y un envio PASS | CORREGIDO |
| 25 / d85f6764-2cd7-4f4f-8d50-a50db36ba309 | S6819 | src/components/RecetarioTab.jsx | 158 | Recetas: ModalDialog con mismos X/Cancelar/handleCrearReceta/handleReemitir/cadena; Escape protegido durante guardado, campos y estilos conservados | Edge con RecetarioTab real y API simulada: nueva/correccion/historial, X/Escape/Cancelar, foco/Tab/retorno, fondo sin cierre y un envio PASS | CORREGIDO |
| 26 / 4a79e00e-c93c-4c59-95c3-bc1bf16a32c0 | S6819 | src/components/RecetarioTab.jsx | 183 | Recetas: ModalDialog con mismos X/Cancelar/handleCrearReceta/handleReemitir/cadena; Escape protegido durante guardado, campos y estilos conservados | Edge con RecetarioTab real y API simulada: nueva/correccion/historial, X/Escape/Cancelar, foco/Tab/retorno, fondo sin cierre y un envio PASS | CORREGIDO |
| 27 / 76da8cd8-a7da-402f-b2b1-eabc33839a31 | S6853 | src/pages/AdministracionPersonal.jsx | 424 | Nombre completo: htmlFor/id, mismo name/value/handler | JSX PASS | CORREGIDO |
| 28 / b434f958-3494-4bd5-af40-a197a43d0fe4 | S6853 | src/pages/AdministracionPersonal.jsx | 429 | Trato: htmlFor/id, mismas opciones | JSX PASS | CORREGIDO |
| 29 / f84fdafb-4505-4911-a423-dbc7118ec746 | S6853 | src/pages/AdministracionPersonal.jsx | 440 | DNI: htmlFor/id, sin alterar formulario | JSX PASS | CORREGIDO |
| 30 / f238461a-97b1-4938-aa26-c34f333ee953 | S6853 | src/pages/AdministracionPersonal.jsx | 445 | Celular: htmlFor/id, sin alterar formulario | JSX PASS | CORREGIDO |
| 31 / c53a530b-9f36-4592-b6e5-56dd3fb97d34 | S6853 | src/pages/AdministracionPersonal.jsx | 450 | Email: htmlFor/id, sin alterar formulario | JSX PASS | CORREGIDO |
| 32 / b33bbe3a-fc1b-4973-9539-d81ac5199fd6 | S6853 | src/pages/AdministracionPersonal.jsx | 457 | Direccion: htmlFor/id, sin alterar formulario | JSX PASS | CORREGIDO |
| 33 / 8b98e237-2586-4d1a-91e0-acee1164a4f9 | S6853 | src/pages/AdministracionPersonal.jsx | 465 | Rol: htmlFor/id, mismo control y restricciones | JSX PASS | CORREGIDO |
| 34 / 3931fd4a-cd7e-4919-a9d4-2d36b3c8cc26 | S6853 | src/pages/AdministracionPersonal.jsx | 491 | Especialidad: htmlFor/id, mismo control y restricciones | JSX PASS | CORREGIDO |
| 35 / 4a9705d2-23af-4b3c-b17b-2ebd7119eb2e | S6853 | src/pages/AdministracionPersonal.jsx | 497 | COP: htmlFor/id, mismo control y restricciones | JSX PASS | CORREGIDO |
| 36 / 96f80c16-324f-450d-9b96-4dd333e0e9f0 | S6853 | src/pages/AdministracionPersonal.jsx | 503 | Comision: htmlFor/id, mismo control y restricciones | JSX PASS | CORREGIDO |
| 37 / e1c6948e-a6aa-47dc-9154-e4c0f749da35 | S6853 | src/pages/AdministracionPersonal.jsx | 515 | ID de acceso: htmlFor/id; mismo estado y handler | JSX PASS | CORREGIDO |
| 38 / 55931ea6-0075-4903-baa2-28db7106f40c | S6853 | src/pages/AdministracionPersonal.jsx | 522 | Contrasena inicial: htmlFor/id; mismo estado y handler | JSX PASS | CORREGIDO |
| 39 / df8facbc-ee5d-4b4a-80b8-9b2a54af161d | S6853 | src/pages/FinanzasDashboard.jsx | 266 | Desde: htmlFor/id; mismo estado y handler | JSX PASS | CORREGIDO |
| 40 / 8e98f1ee-25a0-4258-8a5e-50cf2d5910c2 | S6853 | src/pages/FinanzasDashboard.jsx | 270 | Hasta: htmlFor/id; mismo estado y handler | JSX PASS | CORREGIDO |
| 41 / db5b2abd-c24a-4958-ab46-fa976371fd7e | S6853 | src/pages/FinanzasDashboard.jsx | 279 | Filtro doctor: htmlFor/id; mismo handler | JSX PASS | CORREGIDO |
| 42 / f348d34c-b0ab-4052-a0e8-88857edf3cf7 | S6819 | src/pages/FinanzasDashboard.jsx | 508 | Finanzas: ModalDialog para gasto, penalidad y actividad; mismos cierres, submit y datos; foco/Tab/retorno y Escape sin clic de fondo; no cambios de calculos | Edge con FinanzasDashboard real y API simulada: nuevo/editar gasto, penalidad e historial PASS; un envio por accion, valores al editar y registro visible | CORREGIDO |
| 43 / 24d81ed1-6232-4f90-b695-ffb9ed782060 | S6853 | src/pages/FinanzasDashboard.jsx | 516 | Categoria gasto: htmlFor/id | JSX PASS | CORREGIDO |
| 44 / 0f444408-3d8c-49e4-b2d9-1005f187d243 | S6853 | src/pages/FinanzasDashboard.jsx | 524 | Mes consumo gasto: htmlFor/id | JSX PASS | CORREGIDO |
| 45 / 447835c4-457c-4f4e-b898-a48f77dd2052 | S6853 | src/pages/FinanzasDashboard.jsx | 530 | Descripcion gasto: htmlFor/id | JSX PASS | CORREGIDO |
| 46 / e0dd10ff-f498-41ba-88de-a9435fd7d2d3 | S6853 | src/pages/FinanzasDashboard.jsx | 536 | Monto gasto: htmlFor/id | JSX PASS | CORREGIDO |
| 47 / 56f19bad-e17a-464a-8e03-654dfcc401eb | S6853 | src/pages/FinanzasDashboard.jsx | 541 | Fecha de pago gasto: htmlFor/id | JSX PASS | CORREGIDO |
| 48 / e2307e0b-b361-497b-94a0-ab20c0dbbdf2 | S6819 | src/pages/FinanzasDashboard.jsx | 555 | Finanzas: ModalDialog para gasto, penalidad y actividad; mismos cierres, submit y datos; foco/Tab/retorno y Escape sin clic de fondo; no cambios de calculos | Edge con FinanzasDashboard real y API simulada: nuevo/editar gasto, penalidad e historial PASS; un envio por accion, valores al editar y registro visible | CORREGIDO |
| 49 / 7a2af12d-82d8-409f-8dd6-0e200bf5cca2 | S6853 | src/pages/FinanzasDashboard.jsx | 564 | Penalidad Doctor: htmlFor/id; mismo handler | JSX PASS | CORREGIDO |
| 50 / ed63c99a-1e60-4a9a-916d-7629e1489750 | S6853 | src/pages/FinanzasDashboard.jsx | 573 | Penalidad Monto: htmlFor/id; mismo handler | JSX PASS | CORREGIDO |
| 51 / 174c9d99-008c-4de0-bb63-1f0552861b9d | S6853 | src/pages/FinanzasDashboard.jsx | 578 | Penalidad Fecha: htmlFor/id; mismo handler | JSX PASS | CORREGIDO |
| 52 / bf35db18-e750-42f5-81ca-577194ba0f0b | S6853 | src/pages/FinanzasDashboard.jsx | 584 | Penalidad Motivo: htmlFor/id; mismo handler | JSX PASS | CORREGIDO |
| 53 / 2b4c07c5-ac1c-4d0d-a2d0-06743ef1d0e3 | S6819 | src/pages/FinanzasDashboard.jsx | 595 | Finanzas: ModalDialog para gasto, penalidad y actividad; mismos cierres, submit y datos; foco/Tab/retorno y Escape sin clic de fondo; no cambios de calculos | Edge con FinanzasDashboard real y API simulada: nuevo/editar gasto, penalidad e historial PASS; un envio por accion, valores al editar y registro visible | CORREGIDO |
| 54 / e74b7108-e94e-45b2-9677-82ddb50d5665 | S6772 | src/pages/MiPerfil.jsx | 285 | Espacio JSX explicito junto al input de sello | JSX PASS | CORREGIDO |
| 55 / 69de2e4d-33d4-4454-b15a-cf829122fbba | S6853 | src/pages/PacienteDetalle.jsx | 692 | DNI: htmlFor/id | JSX PASS | CORREGIDO |
| 56 / 58eb0927-2a56-4449-ab08-92945dc650b4 | S6853 | src/pages/PacienteDetalle.jsx | 697 | Celular paciente: htmlFor/id | JSX PASS | CORREGIDO |
| 57 / e87ec819-272a-43b3-9bf4-dbeb27c38fb4 | S6853 | src/pages/PacienteDetalle.jsx | 702 | Nombres: htmlFor/id, mismo control y validacion | JSX PASS | CORREGIDO |
| 58 / 86b5746d-c015-44c4-9fc4-ab94500bd787 | S6853 | src/pages/PacienteDetalle.jsx | 707 | Apellidos: htmlFor/id, mismo control y validacion | JSX PASS | CORREGIDO |
| 59 / 5e5e6827-78f8-49f9-bbca-bbc17215942d | S6853 | src/pages/PacienteDetalle.jsx | 712 | Nacimiento: htmlFor/id, mismo control y validacion | JSX PASS | CORREGIDO |
| 60 / eeeecd97-4f30-462a-8d63-85f0ed260087 | S6853 | src/pages/PacienteDetalle.jsx | 718 | Sexo: htmlFor/id, mismo control y validacion | JSX PASS | CORREGIDO |
| 61 / 41d8206a-24bb-4605-beab-5175ddcbad9a | S6853 | src/pages/PacienteDetalle.jsx | 726 | Domicilio: htmlFor/id; separado de datos del paciente | JSX PASS | CORREGIDO |
| 62 / e126fb91-5a5c-4d2e-9c8d-fb52e9cbae25 | S6853 | src/pages/PacienteDetalle.jsx | 738 | Apoderado nombre: htmlFor/id; separado de datos del paciente | JSX PASS | CORREGIDO |
| 63 / 01f253bb-b9ec-48ee-83b1-edec8a6f7f61 | S6853 | src/pages/PacienteDetalle.jsx | 743 | Apoderado parentesco: htmlFor/id; separado de datos del paciente | JSX PASS | CORREGIDO |
| 64 / 13e9164c-699f-430f-91df-f074dc5333d1 | S6853 | src/pages/PacienteDetalle.jsx | 748 | Apoderado celular: htmlFor/id; separado de datos del paciente | JSX PASS | CORREGIDO |
| 65 / 29893f03-feb9-472a-8027-6340b6aa97dc | S6848 | src/pages/PacienteDetalle.jsx | 838 | Boton nativo superpuesto para abrir anexo; reintento/descarga/anulacion independientes; sin botones anidados | JSX PASS; prueba UI pendiente | CORREGIDO |
| 66 / bf750b5a-b7ea-4cfd-8e2d-4a59280640e4 | S1082 | src/pages/PacienteDetalle.jsx | 838 | Teclado nativo ya resuelto por issue 65 | JSX PASS | YA_RESUELTO_POR_CAMBIO_PREVIO |
| 67 / 8321d7c7-7753-418c-8bea-561ff3ae5f1e | S6819 | src/pages/PacienteDetalle.jsx | 1004 | Tratamiento: ModalDialog con cierre identico a X (incluye reset de edicion/formulario), formulario externo y submit original conservados; Escape protegido por savingTreatment | Edge PacienteDetalle real con API simulada: nuevo/editar, reset, formulario y boton asociado, un envio, X/Escape/Tab/retorno/overlay PASS | CORREGIDO |
| 68 / 222ef7aa-f314-43f9-b301-83b959b5c7f0 | S6853 | src/pages/PacienteDetalle.jsx | 1017 | Tipo de tratamiento: fieldset/legend y aria-pressed, mismos botones | JSX PASS | CORREGIDO |
| 69 / ee0dbe37-e312-46f4-a200-171bbfd24dac | S6853 | src/pages/PacienteDetalle.jsx | 1034 | Nombre laboratorio: htmlFor/id | JSX PASS | CORREGIDO |
| 70 / 03c426c6-fdff-43c7-932a-dcc6647759f4 | S6819 | src/pages/PacienteDetalle.jsx | 1060 | Abono y adenda: ModalDialog, mismos cierres y submit, campos y metodo de pago conservados; Escape protegido por savingPayment en abonos | Edge PacienteDetalle real con API simulada: abono y adenda PASS; X/Escape/Tab/retorno/fondo sin cierre, un envio y contenido clinico original conservado | CORREGIDO |
| 71 / 6502386f-9421-405d-878c-0f510ba5c0dc | S6819 | src/pages/PacienteDetalle.jsx | 1074 | Abono y adenda: ModalDialog, mismos cierres y submit, campos y metodo de pago conservados; Escape protegido por savingPayment en abonos | Edge PacienteDetalle real con API simulada: abono y adenda PASS; X/Escape/Tab/retorno/fondo sin cierre, un envio y contenido clinico original conservado | CORREGIDO |
| 72 / 94957d50-19a8-4723-9b10-5f5063729697 | S6819 | src/pages/PacienteDetalle.jsx | 1091 | Historial de evolucion y HC: ModalDialog conserva pagos/adendas/auditoria/conciliacion y cierres; Escape protegido por savingReconciliation al conciliar, foco y scroll gestionados | Edge PacienteDetalle real y API simulada: contenido historico y auditoria visibles, X/Escape/Tab/retorno/fondo sin cierre, conciliacion unica y cierre al guardar PASS | CORREGIDO |
| 73 / 911606ed-3ec8-4597-8b4c-add72c412151 | S6819 | src/pages/PacienteDetalle.jsx | 1172 | Historial de evolucion y HC: ModalDialog conserva pagos/adendas/auditoria/conciliacion y cierres; Escape protegido por savingReconciliation al conciliar, foco y scroll gestionados | Edge PacienteDetalle real y API simulada: contenido historico y auditoria visibles, X/Escape/Tab/retorno/fondo sin cierre, conciliacion unica y cierre al guardar PASS | CORREGIDO |
| 74 / a0982044-ae40-4f03-aea0-b34f40ed4406 | S6848 | src/pages/Pacientes.jsx | 259 | Contenedor de acciones solo detiene propagacion; no es accion; botones hijos nativos | Handler y contenedor inspeccionados | FALSO_POSITIVO |
| 75 / e21f1bc7-954b-4d89-9cf3-221bc3ee9c27 | S1082 | src/pages/Pacientes.jsx | 259 | Mismo contenedor sin accion; anadir boton/teclado al wrapper seria semantica incorrecta | Handler y contenedor inspeccionados | FALSO_POSITIVO |
| 76 / 878d1162-3bc0-4319-b135-514dc71b1450 | S6819 | src/pages/Produccion.jsx | 57 | Output nativo block; mismo estado de carga | JSX PASS | CORREGIDO |


### Cierre controlado - issues 21, 22, 23

- Rx: ModalDialog con nombres actuales, mismos X/handleCrear/handleReemitir/construirCadena; Escape protegido durante guardado; formulario y CSS conservados.
- Edge con OrdenRadiografiaTab real y servicios simulados: nueva, correccion e historial PASS; foco/Tab/retorno/overlay/X/Escape y envio unico; historia de versiones conservada. modales 8/8 PASS; Edge Rx 3/3 PASS.
- Acumulado de este cierre: 4/15 CORREGIDO; 11 pendientes. Siguiente: Nueva Receta, issue 24.

### Cierre controlado - issues 24, 25, 26

- Recetas: ModalDialog con mismos X/Cancelar/handleCrearReceta/handleReemitir/cadena; Escape protegido durante guardado, campos y estilos conservados.
- Edge con RecetarioTab real y API simulada: nueva/correccion/historial, X/Escape/Cancelar, foco/Tab/retorno, fondo sin cierre y un envio PASS. modales 9/9 PASS; Edge recetas 3/3 PASS.
- Acumulado de este cierre: 7/15 CORREGIDO; 8 pendientes. Siguiente: Nuevo o editar Gasto, issue 42.

### Cierre controlado - issues 42, 48, 53

- Finanzas: ModalDialog para gasto, penalidad y actividad; mismos cierres, submit y datos; foco/Tab/retorno y Escape sin clic de fondo; no cambios de calculos.
- Edge con FinanzasDashboard real y API simulada: nuevo/editar gasto, penalidad e historial PASS; un envio por accion, valores al editar y registro visible. modales 10/10 PASS; Edge finanzas 3/3 PASS.
- Acumulado de este cierre: 10/15 CORREGIDO; 5 pendientes. Siguiente: Nuevo o editar Tratamiento, issue 67.

### Cierre controlado - issues 67

- Tratamiento: ModalDialog con cierre identico a X (incluye reset de edicion/formulario), formulario externo y submit original conservados; Escape protegido por savingTreatment.
- Edge PacienteDetalle real con API simulada: nuevo/editar, reset, formulario y boton asociado, un envio, X/Escape/Tab/retorno/overlay PASS. modales 11/11 PASS; Edge tratamiento PASS.
- Acumulado de este cierre: 11/15 CORREGIDO; 4 pendientes. Siguiente: Registrar Abono, issue 70.

### Cierre controlado - issues 70, 71

- Abono y adenda: ModalDialog, mismos cierres y submit, campos y metodo de pago conservados; Escape protegido por savingPayment en abonos.
- Edge PacienteDetalle real con API simulada: abono y adenda PASS; X/Escape/Tab/retorno/fondo sin cierre, un envio y contenido clinico original conservado. modales 11/11 PASS; Edge paciente 3/3 PASS.
- Acumulado de este cierre: 13/15 CORREGIDO; 2 pendientes. Siguiente: Historial y Correcciones, issue 72.

### Cierre controlado - issues 72, 73

- Historial de evolucion y HC: ModalDialog conserva pagos/adendas/auditoria/conciliacion y cierres; Escape protegido por savingReconciliation al conciliar, foco y scroll gestionados.
- Edge PacienteDetalle real y API simulada: contenido historico y auditoria visibles, X/Escape/Tab/retorno/fondo sin cierre, conciliacion unica y cierre al guardar PASS. modales 11/11 PASS; Edge paciente 5/5 PASS; 15/15 modales comprobados por grupos.
- Acumulado de este cierre: 15/15 CORREGIDO; 0 pendientes. Siguiente: Validacion final frontend y build; NO otro modal/familia.






### Validacion inicial y limites Familia 3 (antes del cierre de modales)

- Lote: 76/76 inspeccionados secuencialmente; 54 CORREGIDO, 4 YA_RESUELTO_POR_CAMBIO_PREVIO, 15 PENDIENTE_REVISION, 3 FALSO_POSITIVO. CSV y registro cotejados por key: 76 entradas, ninguna ausente. Los cuatro resueltos previamente desaparecieron por otro cambio de este mismo lote.
- Pruebas relacionadas previas al cierre: agenda 3/3 PASS; Rx/finanzas 4/4 PASS; nuevas pruebas de accesibilidad `node --test tests/accessibility.test.mjs`: 9/9 PASS.
- Suite frontend completa `npm test`: 37/37 PASS, 0 fallos y 0 omitidas. Las nueve pruebas nuevas usan el parser JSX de ESLint ya instalado: asociaciones reales htmlFor/id, ids por instancia, botones nativos sin handlers de teclado duplicados, controles de anexo independientes, fieldset/legend y output. Son pruebas estructurales de codigo, no simulaciones de un navegador ni una certificacion WCAG.
- `npm run build` (script real `vite build`): PASS, 1832 modulos. Artefactos generados unicamente en frontend `dist/`, no copiados al backend. Avisos: chunk JS de 572.43 kB (>500 kB, aviso ya conocido) y tiempo significativo en plugin vite:build-html. OBSERVACION PENDIENTE: revisar estos avisos fuera de Familia 3, sin alterar limites ni configurar el build para ocultarlos.
- Sintaxis JSX de los doce archivos de codigo: PASS; `git diff --check`: PASS. Sin regresiones detectadas por las pruebas ejecutadas.
- BACKEND NO MODIFICADO en esta familia, ni repetido: los trece archivos con cambios anteriores conservan sus hashes SHA-256 al cotejar inicio/fin; mismos assets/cache preexistentes. Estado previo backend 86/86 PASS.
- Sin cambios en API, BD, .env, autenticacion, permisos, rutas, versiones React/Vite o dependencias. Sin push, SonarQube, Familia 4 ni E01-E17.
- Pendientes: 15 overlays personalizados (issues 15, 21-26, 42, 48, 53, 67, 70-73). Sustituir la etiqueta por dialog/open no garantiza modalidad equivalente: hay que definir showModal/close, sincronizacion con el estado React, Escape/cancel, retorno de foco, fondo inerte, estilos/scroll y escenarios de formularios. No se cambiaron estos overlays ni se silencio la regla.
- Falsos positivos (16, 74, 75): el onClick del contenedor solo ejecuta stopPropagation; la accion pertenece a botones hijos. No se agregaron roles/tab stops ficticios al wrapper. Validacion externa de estas clasificaciones queda pendiente, sin repetir Sonar en esta tarea.
- OBSERVACION PENDIENTE fuera del lote: helpers Field/InputV al final de PacienteDetalle.jsx muestran labels separados sin htmlFor/id; no estan reportados por este subconjunto y no se modificaron.
- Comprobacion manual pendiente: recorrer slots y piezas con Tab/Enter/Espacio (una activacion; slots ocupados y dientes de lectura no se activan); clic en label dirige al campo correcto; selecciones de grupos mantienen su valor; abrir anexo con teclado/clic, reintentar, descargar PDF y anular sin abrir la vista por accidente; comprobar vista e impresion de piezas/Rx. No se afirma que estas pruebas manuales se hayan ejecutado ni que todas las pantallas sean accesibles.
- Archivos de codigo de esta familia (rutas bajo `micodent-frontend/src/`): `components/AgendaDia.jsx`, `components/AgendaSemana.jsx`, `components/CitaModal.jsx`, `components/ClinicalImage.jsx`, `components/Diente.jsx`, `components/MetodoPago.jsx`, `components/OrdenRadiografiaTab.jsx`, `pages/AdministracionPersonal.jsx`, `pages/FinanzasDashboard.jsx`, `pages/MiPerfil.jsx`, `pages/PacienteDetalle.jsx`, `pages/Produccion.jsx`. Anexos/administracion/finanzas/perfil preservan las extracciones previas de Familia 1.
- Pruebas agregadas: `micodent-frontend/tests/accessibility.test.mjs`. Seguimiento: `docs/quality/sonar-family3.csv`, `docs/quality/SONAR_REMEDIATION_LOG.md`, `docs/quality/CURRENT_TASK.md`.
- SIGUIENTE PASO: revision controlada de los 15 modales y validaciones manuales anteriores, previa autorizacion de alcance. DETENERSE; no iniciar Familia 4 ni repetir SonarQube.

### Cierre controlado de modales - checkpoint POS

- Issue 15 CORREGIDO. Se conserva show/save y bloqueo de doble envio existente. X sigue usando setOpen(false). Escape usa ese cierre, salvo guardado activo.
- Dialog nativo abierto con modalidad gestionada: foco inicial en campo, Tab contenido, retorno al disparador, bloqueo/restauracion del scroll. No showModal: preserva las capas actuales de toast/impresion; aria-modal y overlay permanecen. Sin cierre al pulsar fondo ni handler nuevo de submit.
- Tests relacionados 7/7 PASS; prueba de navegador Edge con componente POS real y servicios simulados PASS (sin consultas reales). Comprueba error visible sin perder campos y exito con un solo envio. Harness inicial reparado por resolucion de ruta/preambulo Vite; no cambios de aplicacion derivados de esos fallos de infraestructura.
- Resultado del cierre: 1/15 corregido, 14 pendientes. Siguiente issue 21. Validacion humana de pantallas reales sigue pendiente.


### Cierre final de Familia 3 - VALIDADO

- Alcance exclusivo: los 15 S6819 pendientes (15, 21-26, 42, 48, 53, 67, 70-73), corregidos y registrados modal por modal/grupos pequenos. Los otros 61 issues no se reanalizaron ni reclasificaron. Familia 3 COMPLETA localmente: total 76; 69 CORREGIDO; 4 YA_RESUELTO_POR_CAMBIO_PREVIO; 3 FALSO_POSITIVO; 0 PENDIENTE_REVISION; 0 PENDIENTE_REVISION_JUSTIFICADA; 0 falsos positivos adicionales.
- ModalDialog utiliza dialog nativo abierto, aria-modal, nombre actual y createPortal(document.body), patron ya usado por PrintPortal. Modalidad gestionada: foco inicial, Tab/Shift+Tab confinados, retorno de foco si disparador sigue conectado, Escape/cancel una sola vez, respeto de estados de guardado existentes, bloqueo/restauracion del scroll y ausencia de cierre por fondo. No nuevos handlers de submit ni cambios de operaciones clinicas/financieras.
- Decision: no showModal(), porque el top layer taparia los avisos de error del Toaster externo y afectaria las capas actuales. Mantener open no fue una sustitucion solo de etiqueta: se implemento y probo el ciclo modal completo. CSS nuevo estrictamente acotado a dialog.managed-dialog[open] para neutralizar dimensiones/margenes/borde nativos; paneles, formularios y clases existentes conservados.
- Validacion movil detecto inicialmente el overlay desplazado por el contenedor ancestro de Rx (boxY=24, panel y=40, altura 812 en viewport 390x844). El portal fuera del contenedor corrigio el anclaje, sin cambiar sus campos ni clases. Las comprobaciones de dimensiones y scroll ahora pasan. El harness tambien limpia toasts entre escenarios para evitar que avisos previos pausados al hover tapen el siguiente disparador; no se cambio Toaster de la aplicacion.
- `npm test`: 48/48 PASS, 0 fallos/omitidas (37 existentes + 11 nuevas de ciclo modal/contratos JSX). `node --check`: modalFocus.js y ambos archivos de pruebas PASS; JSX/importaciones confirmados por tests y build. `git diff --check`: PASS.
- Edge headless con componentes reales, servicios simulados y React.StrictMode: POS 1/1, Rx 3/3, recetas 3/3, finanzas 3/3, paciente 5/5 PASS. Repetidos en 1280x720 y 390x844: 30/30 escenarios PASS. Comprueba apertura/X/Escape/Cancelar aplicable, foco inicial/Tab/retorno, fondo sin cierre, guardado/acciones originales una vez, contenido historico, edicion/reset, errores POS visibles con campos conservados y scroll interno. No es una prueba de integracion con BD ni una certificacion WCAG.
- Harness reproducible: `node tests/modal-dialog.browser.mjs <pos|rx|recipe|finance|patient> <1|3|5> [mobile]`, indicando MICODENT_PLAYWRIGHT_MODULE al Playwright ya disponible en el runtime. No dependencia agregada al proyecto. Vite temporal con envFile:false/configFile:false; mocks reemplazan servicios y se bloquea red fuera del servidor de la fixture. Todos los servidores/navegadores de pruebas cerrados.
- Capturas sinteticas generadas en C:/Users/Jamz/AppData/Local/Temp/micodent-family3-modals-20261002 (17 PNG: 15 escritorio + Rx/tratamiento movil). Inspeccion visual de Rx movil y tratamiento escritorio realizada; no hay capturas de pacientes reales.
- `npm run build`: PASS, 1834 modulos; dist frontend generado, NO copiado al backend. Chunk JS 574.47 kB (>500 kB) sigue como aviso conocido fuera de alcance; no se oculto ni ajustaron limites.
- Backend NO MODIFICADO/NO REPETIDO: hash del diff binario antes/despues identico, 4ba1bae6a5086d5b4e460b1c624e1530302f6f34. Assets/cache anteriores preservados. No cambios en API, BD, autenticacion, rutas, .env, dependencias o configuracion universitaria. Sin push, resets, SonarQube, Familia 4 ni E01-E17.
- Archivos de esta sesion: frontend src/components/{ModalDialog,ConfiguracionPos,OrdenRadiografiaTab,RecetarioTab}.jsx; src/pages/{FinanzasDashboard,PacienteDetalle}.jsx; src/utils/modalFocus.js; src/index.css; tests/{modal-dialog.test.mjs,modal-dialog.browser.mjs}; docs/quality/{CURRENT_TASK,SONAR_REMEDIATION_LOG}.md. Sonar-family3.csv conservado como captura del lote inicial, no releido ni alterado; clasificacion final en esta tabla y CURRENT_TASK.
- REGRESIONES: ninguna detectada por tests y browser fixtures. Pendiente validacion humana breve en DEV: abrir/cerrar/guardar estos modales con teclado y comprobar formularios largos en la pantalla usada, incluido lector de pantalla si disponible. Las comprobaciones humanas anteriores fuera de modales siguen pendientes, sin ampliar esta sesion.
- SIGUIENTE PASO: DETENERSE y esperar validacion del usuario/instrucciones. No iniciar Familia 4 ni ejecutar SonarQube.


## Familia 4A - codigo muerto, imports y asignaciones inutiles

FUENTE: subconjunto sonar-family4a.csv filtrado programaticamente del CSV E13 original: 126 issues, S1128=32, S1481=47, S1854=47, solamente Historias.jsx y MiPerfil.jsx. No se reejecuto SonarQube ni se reprocesaron Familias 1-3.

CRITERIO: codigo actual y referencias lexicales/JSX comprobados. Se conservan llamadas y orden de hooks, efectos activos, render/reporte y handlers con API/escrituras/cambios de estado que requieren revision controlada, aun con cero referencias. No limpieza adicional de simbolos fuera del CSV.

### Grupo: MiPerfil.jsx (3 imports)

| KEY | RULE | ARCHIVO | SIMBOLO | CAMBIO | VALIDACION | ESTADO |
| --- | --- | --- | --- | --- | --- | --- |
| 6c94d4bf-e59d-43da-8c07-f5ac6b6e2cac | S1128 | src/pages/MiPerfil.jsx | Mail | Import lucide retirado; cero referencias JSX/lexicales; modulo conserva imports activos | AST/4A/perfil y accesibilidad 14/14 PASS | CORREGIDO |
| 71380c2e-db4d-4562-a448-f71d400c5a73 | S1128 | src/pages/MiPerfil.jsx | Phone | Import lucide retirado; cero referencias JSX/lexicales; modulo conserva imports activos | AST/4A/perfil y accesibilidad 14/14 PASS | CORREGIDO |
| fbed5d4a-1d70-4b72-8685-78f87f39c563 | S1128 | src/pages/MiPerfil.jsx | MapPin | Import lucide retirado; cero referencias JSX/lexicales; modulo conserva imports activos | AST/4A/perfil y accesibilidad 14/14 PASS | CORREGIDO |

- Checkpoint: 3/126 procesados; corregidos 3, previos 0, revision 0, falsos positivos 0. Causas unicas corregidas: 3. 4A 5/5 PASS; accesibilidad 9/9 PASS. Siguiente: Historias.jsx, imports S1128.

### Grupo: Historias.jsx (29 imports)

| KEY | RULE | ARCHIVO | SIMBOLO | CAMBIO | VALIDACION | ESTADO |
| --- | --- | --- | --- | --- | --- | --- |
| f4d79d4a-c3f5-4e18-99f6-798302d9d229 | S1128 | src/pages/Historias.jsx | OdontogramaEditor | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| 0176e16b-5d76-4050-93ea-2aa00d3d82aa | S1128 | src/pages/Historias.jsx | Home | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| 16da2834-4ffd-473d-a298-1032eddf0d8d | S1128 | src/pages/Historias.jsx | Users | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| 1cf9e860-207e-4f05-81b3-6eda8a020ddf | S1128 | src/pages/Historias.jsx | ImageIcon | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| 2615a6c8-9267-4433-8df0-0160a641676c | S1128 | src/pages/Historias.jsx | Save | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| 28ccd5a0-f9bb-44aa-9424-332c18269c2b | S1128 | src/pages/Historias.jsx | X | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| 40b8845e-081f-440c-9408-38c5c21cc95a | S1128 | src/pages/Historias.jsx | User | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| 452f08c0-2aca-42d8-851b-f66e84d93e50 | S1128 | src/pages/Historias.jsx | ChevronDown | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| 4db3e1d9-f7e1-480f-a51b-fb9ffdada118 | S1128 | src/pages/Historias.jsx | Activity | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| 5473a3b2-b6ca-4578-8a15-b35f255a7555 | S1128 | src/pages/Historias.jsx | LayoutGrid | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| 5c05fe08-10c7-4454-b20e-f76a96bf3426 | S1128 | src/pages/Historias.jsx | Edit | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| 5c096bde-9cd2-4f9f-86e0-5b272d39d3a0 | S1128 | src/pages/Historias.jsx | Eraser | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| 5eac815c-a7d1-4410-9ecd-311782a1153d | S1128 | src/pages/Historias.jsx | DollarSign | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| 5ff39a5f-b85d-4525-9cd2-d9adfeed337f | S1128 | src/pages/Historias.jsx | Trash2 | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| 6026df3c-b646-4733-a5e8-f8c0caeb1861 | S1128 | src/pages/Historias.jsx | Search | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| 60e77f0b-6ccb-4181-8f30-a63dea6ed8d6 | S1128 | src/pages/Historias.jsx | Clipboard | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| 7acab236-55a1-40fe-9649-82f84d6dcba2 | S1128 | src/pages/Historias.jsx | Clock | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| 7aefc750-ac63-481f-8c00-ef381578b5ac | S1128 | src/pages/Historias.jsx | Lock | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| 7e61cfdf-b8ac-4e26-8a78-bba18640cd58 | S1128 | src/pages/Historias.jsx | Plus | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| 8163b8dd-90cd-440d-8d9a-86f873578511 | S1128 | src/pages/Historias.jsx | Calendar | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| 8f624b35-c78f-4e50-9f47-e26e775bbd5f | S1128 | src/pages/Historias.jsx | Check | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| c923709a-30d2-4e4e-9c5a-a9896439ec9f | S1128 | src/pages/Historias.jsx | CheckCircle | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| cc4fb3ea-82c8-49be-8b13-5dde8a5f5007 | S1128 | src/pages/Historias.jsx | History | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| d95f66f6-2c14-4127-a743-59c35b824a20 | S1128 | src/pages/Historias.jsx | UploadCloud | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| dfb12cb9-cd12-46b4-b969-679e35d3ba04 | S1128 | src/pages/Historias.jsx | RotateCcw | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| e3f09d8a-4c26-4290-9262-6d5ef8c62948 | S1128 | src/pages/Historias.jsx | CreditCard | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| f8d9ce02-55dc-455a-afd3-7e9c8aa25533 | S1128 | src/pages/Historias.jsx | PenTool | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| fbaad8f5-4596-4895-8763-efa99922ebf3 | S1128 | src/pages/Historias.jsx | ShieldAlert | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |
| fcf48df3-cc17-40fb-9d8e-c4956909476c | S1128 | src/pages/Historias.jsx | Eye | Import sin uso retirado; JSX activo conserva Diente/FirmaMiniBlock/ClinicalImage/FileText/ArrowLeft | 4A/accesibilidad/Rx 16/16 PASS; reporte/efectos/hooks preservados | CORREGIDO |

- Checkpoint: 32/126 procesados; corregidos 32, previos 0, revision 0, falsos positivos 0. Causas unicas corregidas: 32. 4A/accesibilidad/Rx 16/16 PASS. Siguiente: Historias.jsx, bindings sin efectos S1481/S1854.

### Grupo: Historias.jsx (bindings, duplicados y handlers con efectos)

| KEY | RULE | ARCHIVO | SIMBOLO | CAMBIO | VALIDACION | ESTADO |
| --- | --- | --- | --- | --- | --- | --- |
| 7e5a7fe7-9eae-4808-8132-5b73918c96d4 | S1481 | src/pages/Historias.jsx | esAdmin | Variable local de cache sin lectores retirada; sin modificar validacion, rol efectivo ni autenticacion | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| ce503b35-9a44-42cd-9a79-8fb40d45b597 | S1854 | src/pages/Historias.jsx | esAdmin | Variable local de cache sin lectores retirada; sin modificar validacion, rol efectivo ni autenticacion | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 4cb2aeff-3590-45ea-915b-10abc7be0d18 | S1481 | src/pages/Historias.jsx | miUserId | Variable local de cache sin lectores retirada; sin modificar validacion, rol efectivo ni autenticacion | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| ce3572be-8039-46ba-8511-33e70121925b | S1854 | src/pages/Historias.jsx | miUserId | Variable local de cache sin lectores retirada; sin modificar validacion, rol efectivo ni autenticacion | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 88a21de9-f705-497d-875e-a35f78ddeb8e | S1481 | src/pages/Historias.jsx | setSearchTerm | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| a94c2a8a-fda3-4540-8fac-af0d0b3c92cf | S1481 | src/pages/Historias.jsx | searchTerm | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 145117c5-3a89-40ae-ba25-a2038a05555f | S1854 | src/pages/Historias.jsx | setSearchTerm | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 72bbf68e-e8d7-42c5-8c69-0aa8dee04713 | S1854 | src/pages/Historias.jsx | searchTerm | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| ac67cbd5-7477-491b-b7f9-e08296e3be90 | S1481 | src/pages/Historias.jsx | setSearchQuery | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| f6053e65-4d01-44be-b5bf-a64ccc624eb6 | S1481 | src/pages/Historias.jsx | searchQuery | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| c15e6f59-5167-432b-b0b6-742a36259f48 | S1854 | src/pages/Historias.jsx | setSearchQuery | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| f9f81707-25b1-4937-96e6-a23ca434333d | S1854 | src/pages/Historias.jsx | searchQuery | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 0d9670a5-c093-4a03-bfe4-7187316b7286 | S1481 | src/pages/Historias.jsx | activeTab | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| a9d590ca-5c16-4a0b-aed0-36f7132f368b | S1481 | src/pages/Historias.jsx | setActiveTab | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 137eac78-2037-4d8f-a446-5d653582fb67 | S1854 | src/pages/Historias.jsx | activeTab | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| b9d7cd54-a563-4720-9d9f-daef2986bb9a | S1854 | src/pages/Historias.jsx | setActiveTab | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 435c87c3-248c-4f4a-8b89-75b5b2498640 | S1481 | src/pages/Historias.jsx | savingHC | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 258c635a-4ec6-400b-8f4e-c1ae9e57c2da | S1854 | src/pages/Historias.jsx | savingHC | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| c452cbde-2ebe-4f45-b8e7-02ea782310a1 | S1481 | src/pages/Historias.jsx | cargandoHC | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| ccbd1083-fac5-476d-bb37-182beda40c7c | S1854 | src/pages/Historias.jsx | cargandoHC | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| e70c7c7d-68ce-4610-982e-12155338c716 | S1481 | src/pages/Historias.jsx | firmaDoctor | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 1a0eed79-f7fc-4cd7-9e07-d0893fcddf64 | S1854 | src/pages/Historias.jsx | firmaDoctor | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 74b3df83-89c6-4fee-8089-fdb5152f0dc5 | S1481 | src/pages/Historias.jsx | setTratamientoSearch | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 926df02a-44b4-4fd9-ace3-704abe105295 | S1854 | src/pages/Historias.jsx | setTratamientoSearch | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 9502317d-936e-4665-9d34-f9e77c1d2d54 | S1481 | src/pages/Historias.jsx | setAsignadosSearch | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| e4d7dc72-d446-46b5-b801-4e7fe656b8e4 | S1854 | src/pages/Historias.jsx | setAsignadosSearch | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 36fbeb23-8f1c-4fa4-976c-cba46e0b7c2a | S1481 | src/pages/Historias.jsx | isDropdownOpen | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 774b0172-5944-483e-a825-0ad11f4d0735 | S1854 | src/pages/Historias.jsx | isDropdownOpen | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| b20d58c1-cb7a-4084-b13c-76e102bc9019 | S1481 | src/pages/Historias.jsx | setSelectedTool | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 40aed3c0-a7d1-4485-9e0e-341df4ef77eb | S1854 | src/pages/Historias.jsx | setSelectedTool | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 5caa4d37-fc69-436c-9e49-4a3ed476c5b7 | S1481 | src/pages/Historias.jsx | setSelectedColor | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| fa89a369-5001-4962-a66c-438f23bfd627 | S1854 | src/pages/Historias.jsx | setSelectedColor | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| aa9aeb93-8b39-43ec-8725-bfd3245d8d02 | S1481 | src/pages/Historias.jsx | setIsEraserMode | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| b90ed8bf-5b0c-4a91-ae89-a21383c8078d | S1854 | src/pages/Historias.jsx | setIsEraserMode | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| a3b18308-bf44-47d4-adbd-07a96933ed25 | S1481 | src/pages/Historias.jsx | selectedImage | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| eebf8907-3c87-48e9-b089-67cff23bbe72 | S1481 | src/pages/Historias.jsx | setSelectedImage | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 3f540049-a615-4f76-9336-acd05eeb59e1 | S1854 | src/pages/Historias.jsx | setSelectedImage | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| f11d7285-fffa-4c88-b2a4-ca5d8f007311 | S1854 | src/pages/Historias.jsx | selectedImage | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| b9bef17b-c8b5-4fd0-9cfa-099486597ac5 | S1481 | src/pages/Historias.jsx | miFirma | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 70855a4a-1beb-4158-8cbf-ca6e9faa6fea | S1854 | src/pages/Historias.jsx | miFirma | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 062e3800-cd6d-4c0d-8ca6-a7b542f77ecc | S1481 | src/pages/Historias.jsx | miSello | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| c323a1ab-f22c-4362-8dc8-21f845fb81cc | S1854 | src/pages/Historias.jsx | miSello | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| d28ee8c4-8e93-4ba8-88a2-5d86eda194a3 | S1481 | src/pages/Historias.jsx | showNuevoTratamiento | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| e68a783e-ca59-4217-92f3-2373e1a84742 | S1854 | src/pages/Historias.jsx | showNuevoTratamiento | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 56a2b3a8-9fc7-439c-9eb7-d1697e7023f6 | S1481 | src/pages/Historias.jsx | showAbonoModal | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 83826099-4f8b-4755-8336-a98f9cf6d00a | S1854 | src/pages/Historias.jsx | showAbonoModal | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 2631870e-2a65-4c3d-b90c-f4bc9bf01bff | S1481 | src/pages/Historias.jsx | showHistorialModal | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| f7271aaf-fabf-41cd-9b01-dfe1a8f78718 | S1481 | src/pages/Historias.jsx | setShowHistorialModal | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 1ec4acea-8793-495f-97a1-de8155cf1f67 | S1854 | src/pages/Historias.jsx | setShowHistorialModal | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 8f6aab7c-81f1-4d93-b25b-a61c0323e64f | S1854 | src/pages/Historias.jsx | showHistorialModal | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 7f1dc721-7ad5-45d5-8774-68045ac3ab0c | S1481 | src/pages/Historias.jsx | showAdendaModal | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 9fee8ce7-6d8e-4e6c-b412-ad7b0313608e | S1854 | src/pages/Historias.jsx | showAdendaModal | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| a2fc65e5-abbe-4426-879c-6bf6416fbd17 | S1481 | src/pages/Historias.jsx | setSelectedEvolucion | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 8527a7ba-abe1-45bc-9cca-55b6a01da2b0 | S1854 | src/pages/Historias.jsx | setSelectedEvolucion | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 9246b8bb-16b5-49e6-bd55-4d2755fa8738 | S1481 | src/pages/Historias.jsx | showHCAuditModal | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 41b6c1fd-9c08-496c-b780-e5a3fd69dd87 | S1854 | src/pages/Historias.jsx | showHCAuditModal | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| a2b24a0c-5eb3-402c-9e26-a7dcf1fb3159 | S1481 | src/pages/Historias.jsx | hcAuditLogs | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 062dd0ba-5129-43f4-a793-717e1d2878ba | S1854 | src/pages/Historias.jsx | hcAuditLogs | Solo binding sin lecturas retirado; useState, inicializador, orden y setter utilizado conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 0c96da37-5e8d-4234-a57a-abbd66614b52 | S1481 | src/pages/Historias.jsx | recargarOdontograma | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 0a0212db-4cb8-47fb-b607-0efbe39f7e21 | S1854 | src/pages/Historias.jsx | recargarOdontograma | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 0a92fa0b-c61f-4b7e-909a-6080d6d0551b | S1481 | src/pages/Historias.jsx | abrirAuditoriaHC | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 1e19a736-9d12-4f3b-9ed9-6c5d631ced01 | S1854 | src/pages/Historias.jsx | abrirAuditoriaHC | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 8318d184-4e79-4bc1-875a-ec32403bb8ef | S1481 | src/pages/Historias.jsx | handleGuardarDatosHC | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| cf1a62b1-2fcb-446c-b2ef-67b60df68cdc | S1854 | src/pages/Historias.jsx | handleGuardarDatosHC | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 111808b3-5021-4078-be70-d0c2d323eeda | S1481 | src/pages/Historias.jsx | handleToggleArchivadas | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 42a1d76b-d16f-44f4-b91c-ab5d5f3ef88f | S1854 | src/pages/Historias.jsx | handleToggleArchivadas | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| b49561eb-083b-4b94-b6b2-bdfb62063fad | S1481 | src/pages/Historias.jsx | handleBorrarHistoria | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 3f1feab0-6768-4444-9240-9826f611c25a | S1854 | src/pages/Historias.jsx | handleBorrarHistoria | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 99cd3dc7-cea8-4314-b7ff-c0bc0445881a | S1481 | src/pages/Historias.jsx | handleReactivarHistoria | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 8ab2baa7-237e-4539-9694-483b6f792cb9 | S1854 | src/pages/Historias.jsx | handleReactivarHistoria | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 35decd62-2d3a-4b5f-bf39-e2e1238f6846 | S1481 | src/pages/Historias.jsx | handleCaraClick | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 4965045c-d859-4ee3-ae51-804b9d44448f | S1854 | src/pages/Historias.jsx | handleCaraClick | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 93be0f7a-6e2b-4bf3-832b-342f960ddc12 | S1481 | src/pages/Historias.jsx | handleLimpiarOdontograma | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 0aee7b26-b0d8-4e94-9075-5795ebea531b | S1854 | src/pages/Historias.jsx | handleLimpiarOdontograma | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 5a7677fe-79e2-454a-939a-8a6118564549 | S1481 | src/pages/Historias.jsx | handleBuscarPorDni | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| c5475667-cd85-4fcb-94d9-a0dea03d503e | S1854 | src/pages/Historias.jsx | handleBuscarPorDni | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 011da45e-b771-4d1d-a34c-342fac6cab28 | S1481 | src/pages/Historias.jsx | handleFileUpload | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 5240a4b4-05fa-443e-90b3-759983b48717 | S1854 | src/pages/Historias.jsx | handleFileUpload | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 16837cb4-c4c1-4a39-9a12-10a1d0bc2981 | S1481 | src/pages/Historias.jsx | handleEliminarRadiografia | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 4ca774e0-1546-4ec9-a47b-e8a3797fa642 | S1854 | src/pages/Historias.jsx | handleEliminarRadiografia | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 2e2d6a03-4235-4e73-aa39-d8d776ae421b | S1481 | src/pages/Historias.jsx | handleCrearTratamiento | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 061d8f82-e937-4508-a711-e6a7d730da34 | S1854 | src/pages/Historias.jsx | handleCrearTratamiento | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 0344d9f7-bdbc-4fcd-a5e9-b0da9ac65493 | S1481 | src/pages/Historias.jsx | handleEliminarEvolucion | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 39087e8c-c238-4d11-bf8a-4f0d0c11221f | S1854 | src/pages/Historias.jsx | handleEliminarEvolucion | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 424b3607-64da-4c5a-be3d-8cb0a8cf1282 | S1481 | src/pages/Historias.jsx | handleAbonar | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| a2ccbea2-46b0-4e06-b7b8-994d940fed03 | S1854 | src/pages/Historias.jsx | handleAbonar | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 722fe2fa-abed-422f-9c6d-727320e55a89 | S1481 | src/pages/Historias.jsx | handleAgregarAdenda | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 1ad44002-b4af-4ef9-9868-54ae4b7a1eee | S1854 | src/pages/Historias.jsx | handleAgregarAdenda | Caso A: declaracion local sin lectores/invocaciones; eliminada sin tocar controles actuales, efectos, hooks ni reporte | scopeManager 0 lecturas; busqueda src sin referencias al mismo simbolo; pruebas relacionadas 18/18 PASS | CORREGIDO |
| 7d499aee-294b-4683-a3ff-f79b41bc6e7b | S1481 | src/pages/Historias.jsx | getEstadoPagoGlobal | Funcion local pura sin referencias retirada; calculos activos del reporte intactos | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| dbf07f21-d271-4c0b-b381-5960f7eea870 | S1854 | src/pages/Historias.jsx | getEstadoPagoGlobal | Funcion local pura sin referencias retirada; calculos activos del reporte intactos | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| ebd5f5ec-6921-4eba-ba52-6b29e599da95 | S1481 | src/pages/Historias.jsx | categoriasUnicas | Calculo local no mutante sin consumidores retirado; helpers/datos no reportados conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| da79fada-ad88-4704-b0e2-2064a5ba481c | S1854 | src/pages/Historias.jsx | categoriasUnicas | Calculo local no mutante sin consumidores retirado; helpers/datos no reportados conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| 67cb3902-984d-4ba3-ae7b-5e25264ea488 | S1481 | src/pages/Historias.jsx | asignadosFiltrados | Calculo local no mutante sin consumidores retirado; helpers/datos no reportados conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |
| b50c95b4-e709-4dac-8992-0ba1df8c4f27 | S1854 | src/pages/Historias.jsx | asignadosFiltrados | Calculo local no mutante sin consumidores retirado; helpers/datos no reportados conservados | AST cero lecturas; 4A/accesibilidad/Rx 17/17 PASS; hooks/efectos/reporte/handlers protegidos por hash | CORREGIDO |

- Checkpoint: 126/126 procesados; corregidos 96, previos 0, revision 30, falsos positivos 0. Causas unicas corregidas: 59. 4A/accesibilidad/Rx 17/17 PASS; diff --check PASS. Siguiente: Validacion final frontend/build y cierre 4A; no 4B.


### Validacion final Familia 4A

- Estado: INCOMPLETA. Todos los 126 issues del subset fueron procesados; 96 CORREGIDO, 0 YA_RESUELTO_POR_CAMBIO_PREVIO, 30 PENDIENTE_REVISION, 0 FALSO_POSITIVO. Se corrigieron 59 causas unicas, consolidando duplicados S1481/S1854.
- Los 30 pendientes corresponden a 15 handlers legados sin lecturas actuales que contienen/delegan efectos, API o escrituras. Se conservaron sin cambios conforme al limite del lote; su eliminacion requiere revision controlada separada, no una correccion automatica.
- Handlers conservados: recargarOdontograma, abrirAuditoriaHC, handleGuardarDatosHC, handleToggleArchivadas, handleBorrarHistoria, handleReactivarHistoria, handleCaraClick, handleLimpiarOdontograma, handleBuscarPorDni, handleFileUpload, handleEliminarRadiografia, handleCrearTratamiento, handleEliminarEvolucion, handleAbonar, handleAgregarAdenda.
- Frontend: npm test, 54/54 PASS (48 existentes y 6 del lote), sin fallos ni skips. Pruebas relacionadas por grupos: 14/14, 16/16 y 17/17 PASS. Sintaxis del nuevo test: PASS.
- Build frontend: npm run build PASS, 1834 modulos, bundle JS 574.20 kB. Advertencias de chunk >500 kB y tiempos de plugins; optimizacion fuera de alcance.
- Backend: NO MODIFICADO por este lote, tests NO REPETIDOS. Hash del diff backend antes/despues identico: 4ba1bae6a5086d5b4e460b1c624e1530302f6f34.
- Regresiones: ninguna detectada en las comprobaciones ejecutadas. Pruebas de huellas verifican que reporte, efectos activos, orden/inicializadores de hooks, perfil y handlers retenidos siguen intactos. No se ejecuto una validacion manual de flujos clinicos ni con datos reales.
- No se ejecutaron SonarQube, push, backend/BD, instalaciones ni otras familias/etapas. dist frontend se regenero mediante build; no se copio al backend.
- Siguiente paso: esperar autorizacion para Lote 4B. Los 30 pendientes 4A quedan registrados y no se consideran resueltos ni autorizados para eliminacion.


### Revision autorizada de los 15 handlers pendientes

- La conservacion anterior era provisional. Ahora se comprueba invocacion real: crear una arrow function no ejecuta su cuerpo, aunque contenga API o mutaciones.
- Evidencia lexical previa a la eliminacion: ESLint scopeManager sobre JSX actual, 15 variables en scope local de Historias, cero referencias de lectura cada una; unica escritura es la inicializacion ArrowFunctionExpression. No IIFE/call/construct en declaraciones.
- Busqueda acotada de los 15 nombres en todo micodent-frontend/src: fuera de Historias solo aparecen homonimos locales de PacienteDetalle/OdontogramaEditor. No son imports ni referencias al mismo simbolo. Historias exporta exclusivamente su componente por defecto, no handlers; no eval/new Function/publicacion global o registro dinamico de estos nombres.
- Historias conserva solo la rama imprimible ?view, sin formularios de edicion ni callbacks de estos handlers. Sus efectos redirigen ?edit, ?action=create y entrada sin ?view hacia /pacientes. App.jsx:37-39 y 45 conectan las pantallas actuales y reporte, respectivamente.
- Funcionalidad actual comprobada: PacienteDetalle.jsx:731 auditoria, :867 recarga tras guardar odontograma, :874 subida/anulacion de anexos, :928 anulacion de evolucion, :1006 guardar HC, :1022 crear/editar tratamiento, :1075 abonar, :1089 adendas; alta de paciente :445 y formulario :747. Pacientes.jsx:154, :268 y :273 conectan mostrar archivados/archivar/reactivar. OdontogramaEditor.jsx:160, :186, :215 implementa los controles actuales de odontograma.
- Decision: A) REALMENTE NO UTILIZADO para los 15; pertenecen a la pantalla sustituida, no una nueva funcion clinica sin conectar. No uso dinamico demostrado ni observacion funcional nueva. Eliminar exclusivamente esas declaraciones, manteniendo helpers, imports usados, inicializadores/orden de hooks, efectos y reporte. Los helpers/bindings que pierden su ultimo lector se registran, no se limpian en cascada ni se rehace Historias.
- Riesgo/reversion: no cambia flujo accesible ni datos/BD. Una reversion debe reponer solo estas declaraciones y sus tests desde el diff, sin descartar los cambios previos. Tests de huellas protegen ruta/render/efectos/hooks y fuentes clinicas activas.

| HANDLER | ARCHIVO/LINEAS ANTES DE ESTA SESION | LECTURAS REALES | DECLARACION | CASO |
| --- | --- | --- | --- | --- |
| recargarOdontograma | src/pages/Historias.jsx:320-354 | 0 | ArrowFunctionExpression, sin invocacion al declarar | A |
| abrirAuditoriaHC | src/pages/Historias.jsx:356-364 | 0 | ArrowFunctionExpression, sin invocacion al declarar | A |
| handleGuardarDatosHC | src/pages/Historias.jsx:366-445 | 0 | ArrowFunctionExpression, sin invocacion al declarar | A |
| handleToggleArchivadas | src/pages/Historias.jsx:456-460 | 0 | ArrowFunctionExpression, sin invocacion al declarar | A |
| handleBorrarHistoria | src/pages/Historias.jsx:462-471 | 0 | ArrowFunctionExpression, sin invocacion al declarar | A |
| handleReactivarHistoria | src/pages/Historias.jsx:473-481 | 0 | ArrowFunctionExpression, sin invocacion al declarar | A |
| handleCaraClick | src/pages/Historias.jsx:592-597 | 0 | ArrowFunctionExpression, sin invocacion al declarar | A |
| handleLimpiarOdontograma | src/pages/Historias.jsx:599-603 | 0 | ArrowFunctionExpression, sin invocacion al declarar | A |
| handleBuscarPorDni | src/pages/Historias.jsx:612-620 | 0 | ArrowFunctionExpression, sin invocacion al declarar | A |
| handleFileUpload | src/pages/Historias.jsx:622-658 | 0 | ArrowFunctionExpression, sin invocacion al declarar | A |
| handleEliminarRadiografia | src/pages/Historias.jsx:660-679 | 0 | ArrowFunctionExpression, sin invocacion al declarar | A |
| handleCrearTratamiento | src/pages/Historias.jsx:716-760 | 0 | ArrowFunctionExpression, sin invocacion al declarar | A |
| handleEliminarEvolucion | src/pages/Historias.jsx:762-776 | 0 | ArrowFunctionExpression, sin invocacion al declarar | A |
| handleAbonar | src/pages/Historias.jsx:778-808 | 0 | ArrowFunctionExpression, sin invocacion al declarar | A |
| handleAgregarAdenda | src/pages/Historias.jsx:810-834 | 0 | ArrowFunctionExpression, sin invocacion al declarar | A |


- Checkpoint cierre 4A: grupo recargarOdontograma, abrirAuditoriaHC, handleGuardarDatosHC, handleToggleArchivadas, handleBorrarHistoria. Eliminados 5/15; total 106/126 CORREGIDO, 20 PENDIENTE_REVISION. Pruebas relacionadas 18/18 PASS; funciones restantes protegidas por hash. Sin backend/BD/push.



- Checkpoint cierre 4A: grupo handleReactivarHistoria, handleCaraClick, handleLimpiarOdontograma, handleBuscarPorDni, handleFileUpload. Eliminados 10/15; total 116/126 CORREGIDO, 10 PENDIENTE_REVISION. Pruebas relacionadas 18/18 PASS; funciones restantes protegidas por hash. Sin backend/BD/push.



- Checkpoint cierre 4A: grupo handleEliminarRadiografia, handleCrearTratamiento, handleEliminarEvolucion, handleAbonar, handleAgregarAdenda. Eliminados 15/15; total 126/126 CORREGIDO, 0 PENDIENTE_REVISION. Pruebas relacionadas 18/18 PASS; funciones restantes protegidas por hash. Sin backend/BD/push.


### Cierre final de Familia 4A tras revision de handlers

- FAMILIA 4A COMPLETA localmente respecto al lote original: total 126, CORREGIDO 126, YA_RESUELTO_POR_CAMBIO_PREVIO 0, PENDIENTE_REVISION 0, PENDIENTE_REVISION_JUSTIFICADA 0, FALSO_POSITIVO 0. 74 causas unicas corregidas acumuladas (59 previas + 15 handlers de esta sesion). El apartado anterior INCOMPLETA es el estado historico antes de esta autorizacion.
- Revisados 15/15; eliminados como codigo muerto 15; usados/previamente resueltos 0; uso dinamico demostrado 0; OBSERVACION_FUNCIONAL_PENDIENTE 0. Los cuerpos con efectos no se ejecutaban: ninguna referencia real al mismo simbolo. Los homonimos de las pantallas actuales siguen activos e intactos.
- Los 30 registros originales pendientes S1481/S1854 de la tabla se actualizaron a CORREGIDO, sin reprocesar/reclasificar los 96 previos. Claves, CSV filtrado y fuente original conservados. SonarQube NO ejecutado: cierre basado en codigo actual/tests, no en un nuevo reporte del servidor.
- Comprobacion de dependencias: todos los imports conservados aun tienen lectores; retirar estos handlers deja sin lector directo subirRadiografiasPendientes, recargarListaHistorias, borrarEnCara, aplicarArcada, aplicarPiezaOCara, calcularResta y guardarEdicionTratamiento, ademas de bindings locales de estado del flujo legado. No se borran en cascada, no se alteran llamadas/inicializadores/orden de hooks ni se presenta esto como ausencia de cualquier issue nuevo en un futuro escaneo. Su limpieza queda fuera de los 30 issues autorizados y requiere otro alcance.
- Validacion por grupos de cinco: 18/18 PASS en cada grupo. Suite frontend completa npm test: 55/55 PASS, 0 fallos/skips, incluye un nuevo guard de fuentes activas sin cambios y ausencia de referencias a handlers retirados. node --check del test PASS; JSX/importaciones validados por tests y build; git diff --check PASS.
- npm run build: PASS, 1834 modulos. Mismos assets de produccion que antes de retirar estos handlers: index-BtMAbySU.js 574.20 kB y index-B-2o4lNl.css 47.34 kB. Aviso de chunk >500 kB permanece, fuera de alcance. dist generado, no copiado al backend.
- Alcance comprobado contra el estado previo de esta sesion: Historias solo pierde las 15 declaraciones revisadas y actualiza un comentario de hooks; resto conservado (comparacion normalizada por linea). Reporte, efectos, hooks y componente MiPerfil siguen con las huellas previas. Guard adicional comprueba App, Pacientes, PacienteDetalle, OdontogramaEditor, Diente y MiPerfil identicos al inicio.
- Backend NO MODIFICADO/NO REPETIDO; diff binario antes/despues identico 4ba1bae6a5086d5b4e460b1c624e1530302f6f34. Sin cambios en API, BD, autenticacion, .env, rutas, dependencias ni instalaciones. Sin push/reset, 4B, SonarQube, E01-E17 o universidad.
- Archivos modificados en esta sesion: micodent-frontend/src/pages/Historias.jsx, micodent-frontend/tests/sonar-family4a.test.mjs, docs/quality/SONAR_REMEDIATION_LOG.md, docs/quality/CURRENT_TASK.md. Cambios previos ajenos conservados.
- Regresiones: ninguna detectada en comprobaciones ejecutadas; no validacion manual clinica ni integracion con datos reales en esta sesion.
- SIGUIENTE PASO: esperar autorizacion para 4B. DETENERSE; no ejecutar SonarQube.


## Familia 4B - modernizacion sintactica frontend

FUENTE: sonar-family4b.csv, 53 issues exclusivamente frontend en las nueve reglas autorizadas. Familia 1-4A conservadas; sin nuevo escaneo SonarQube.


### Archivo: src/components/ClinicalImage.jsx

| KEY | RULE | ARCHIVO | LINEA BASE | CAMBIO / EVIDENCIA ACTUAL | VALIDACION | ESTADO |
| --- | --- | --- | --- | --- | --- | --- |
| 192709f6-4947-4078-92b5-fcb5d9b1c8a1 | S7723 | src/components/ClinicalImage.jsx | 24 | throw new Error en guard MIME; mismo mensaje y rechazo; callback probado para tipos validos/invalidos sin crear URL al fallar | 4B/accesibilidad 11/11 PASS | CORREGIDO |

- Checkpoint: 1/53 procesados; 1 corregidos; 0 previos; 0 revision; 0 falsos positivos. Siguiente: src/pages/AdministracionPersonal.jsx.


### Archivo: src/pages/AdministracionPersonal.jsx

| KEY | RULE | ARCHIVO | LINEA BASE | CAMBIO / EVIDENCIA ACTUAL | VALIDACION | ESTADO |
| --- | --- | --- | --- | --- | --- | --- |
| 3f86a87b-a744-4422-af65-7e9bc39bbc9f | S7773 | src/pages/AdministracionPersonal.jsx | 74 | Number.parseInt/parseFloat conservan argumentos, coercion, fallback de nivel y payload; ninguna politica de permisos modificada | 4B/accesibilidad/seguridad 17/17 PASS | CORREGIDO |
| 03035a0d-8a97-4266-951c-32ce5659e426 | S7773 | src/pages/AdministracionPersonal.jsx | 117 | Number.parseInt/parseFloat conservan argumentos, coercion, fallback de nivel y payload; ninguna politica de permisos modificada | 4B/accesibilidad/seguridad 17/17 PASS | CORREGIDO |
| 52eca337-eff2-4e15-9c0a-8f75a45e1b7e | S7773 | src/pages/AdministracionPersonal.jsx | 118 | Number.parseInt/parseFloat conservan argumentos, coercion, fallback de nivel y payload; ninguna politica de permisos modificada | 4B/accesibilidad/seguridad 17/17 PASS | CORREGIDO |

- Checkpoint: 4/53 procesados; 4 corregidos; 0 previos; 0 revision; 0 falsos positivos. Siguiente: src/pages/Agenda.jsx.


### Archivo: src/pages/Agenda.jsx

| KEY | RULE | ARCHIVO | LINEA BASE | CAMBIO / EVIDENCIA ACTUAL | VALIDACION | ESTADO |
| --- | --- | --- | --- | --- | --- | --- |
| 0b1e9873-f63e-4d70-8a4a-4df83575bc6d | S7755 | src/pages/Agenda.jsx | 46 | dias.at(-1) sobre array normal generado por obtenerDiasGrillaMes; mismo dia final, sin indices ni rango API distintos | 4B/agenda 7/7 PASS | CORREGIDO |

- Checkpoint: 5/53 procesados; 5 corregidos; 0 previos; 0 revision; 0 falsos positivos. Siguiente: src/pages/Dashboard.jsx.


### Archivo: src/pages/Dashboard.jsx

| KEY | RULE | ARCHIVO | LINEA BASE | CAMBIO / EVIDENCIA ACTUAL | VALIDACION | ESTADO |
| --- | --- | --- | --- | --- | --- | --- |
| 2da2135b-c307-4d59-8eab-f2c02df48926 | S7773 | src/pages/Dashboard.jsx | 106 | Number.parseFloat conserva ingresosHoy, fallback 0 y formato a dos decimales | 4B/datos 7/7 PASS | CORREGIDO |

- Checkpoint: 6/53 procesados; 6 corregidos; 0 previos; 0 revision; 0 falsos positivos. Siguiente: src/pages/FinanzasDashboard.jsx.


### Archivo: src/pages/FinanzasDashboard.jsx

| KEY | RULE | ARCHIVO | LINEA BASE | CAMBIO / EVIDENCIA ACTUAL | VALIDACION | ESTADO |
| --- | --- | --- | --- | --- | --- | --- |
| 65827deb-2495-4bdf-ad76-f3be65ed2470 | S7776 | src/pages/FinanzasDashboard.jsx | 93 | Set de las mismas cuatro categorias, solo includes a has en ambos lectores; sin mutaciones/iteracion ni cambio de mes_consumo | 4B/datos/finanzas/modales 21/21 PASS | CORREGIDO |
| ff7f2212-a7e5-45ec-8af2-3db11fd835e1 | S7773 | src/pages/FinanzasDashboard.jsx | 212 | Number.parseFloat conserva argumento, formato y aritmetica del pago/totales/gastos/laboratorio; AST equivalente | 4B/datos/finanzas/modales 21/21 PASS | CORREGIDO |
| a1ea3e8b-f907-4139-8fcb-7d97f1526d78 | S7773 | src/pages/FinanzasDashboard.jsx | 313 | Number.parseFloat conserva argumento, formato y aritmetica del pago/totales/gastos/laboratorio; AST equivalente | 4B/datos/finanzas/modales 21/21 PASS | CORREGIDO |
| cff3dea3-1e3f-419e-9421-586ca17757bb | S7773 | src/pages/FinanzasDashboard.jsx | 314 | Number.parseFloat conserva argumento, formato y aritmetica del pago/totales/gastos/laboratorio; AST equivalente | 4B/datos/finanzas/modales 21/21 PASS | CORREGIDO |
| 090ae201-a804-4e3e-85c0-7d8639bfd1fe | S7773 | src/pages/FinanzasDashboard.jsx | 315 | Number.parseFloat conserva argumento, formato y aritmetica del pago/totales/gastos/laboratorio; AST equivalente | 4B/datos/finanzas/modales 21/21 PASS | CORREGIDO |
| 1417610e-4420-4be2-bde8-54d541e0cf2d | S7773 | src/pages/FinanzasDashboard.jsx | 315 | Number.parseFloat conserva argumento, formato y aritmetica del pago/totales/gastos/laboratorio; AST equivalente | 4B/datos/finanzas/modales 21/21 PASS | CORREGIDO |
| 6f534e89-9c8c-4dee-b588-f8cff005a352 | S7773 | src/pages/FinanzasDashboard.jsx | 341 | Number.parseFloat conserva argumento, formato y aritmetica del pago/totales/gastos/laboratorio; AST equivalente | 4B/datos/finanzas/modales 21/21 PASS | CORREGIDO |
| 7b654792-70df-4f96-baba-7a02430437fc | S7773 | src/pages/FinanzasDashboard.jsx | 342 | Number.parseFloat conserva argumento, formato y aritmetica del pago/totales/gastos/laboratorio; AST equivalente | 4B/datos/finanzas/modales 21/21 PASS | CORREGIDO |
| 063783fa-e147-4d38-b825-716548a1ea0a | S7773 | src/pages/FinanzasDashboard.jsx | 343 | Number.parseFloat conserva argumento, formato y aritmetica del pago/totales/gastos/laboratorio; AST equivalente | 4B/datos/finanzas/modales 21/21 PASS | CORREGIDO |
| 35b38244-25ad-4549-8c9e-e060727423b5 | S7773 | src/pages/FinanzasDashboard.jsx | 343 | Number.parseFloat conserva argumento, formato y aritmetica del pago/totales/gastos/laboratorio; AST equivalente | 4B/datos/finanzas/modales 21/21 PASS | CORREGIDO |
| 1786c376-87ad-4079-b6cf-c09bb14b559e | S7773 | src/pages/FinanzasDashboard.jsx | 344 | Number.parseFloat conserva argumento, formato y aritmetica del pago/totales/gastos/laboratorio; AST equivalente | 4B/datos/finanzas/modales 21/21 PASS | CORREGIDO |
| 66a8b740-c533-4d90-a51d-8f57c0fd0dd1 | S7773 | src/pages/FinanzasDashboard.jsx | 374 | Number.parseFloat conserva argumento, formato y aritmetica del pago/totales/gastos/laboratorio; AST equivalente | 4B/datos/finanzas/modales 21/21 PASS | CORREGIDO |
| a5cfa5e3-1012-4010-963b-a267a23f65b4 | S7773 | src/pages/FinanzasDashboard.jsx | 422 | Number.parseFloat conserva argumento, formato y aritmetica del pago/totales/gastos/laboratorio; AST equivalente | 4B/datos/finanzas/modales 21/21 PASS | CORREGIDO |
| e7f9002b-ff2e-420a-a22b-0c53a7fcd498 | S7773 | src/pages/FinanzasDashboard.jsx | 477 | Number.parseFloat conserva argumento, formato y aritmetica del pago/totales/gastos/laboratorio; AST equivalente | 4B/datos/finanzas/modales 21/21 PASS | CORREGIDO |
| ab053bad-a20e-4655-9023-ae5a171b5993 | S7773 | src/pages/FinanzasDashboard.jsx | 478 | Number.parseFloat conserva argumento, formato y aritmetica del pago/totales/gastos/laboratorio; AST equivalente | 4B/datos/finanzas/modales 21/21 PASS | CORREGIDO |

- Checkpoint: 21/53 procesados; 21 corregidos; 0 previos; 0 revision; 0 falsos positivos. Siguiente: src/pages/Historias.jsx.


### Archivo: src/pages/Historias.jsx

| KEY | RULE | ARCHIVO | LINEA BASE | CAMBIO / EVIDENCIA ACTUAL | VALIDACION | ESTADO |
| --- | --- | --- | --- | --- | --- | --- |
| 3455f146-4aac-4db9-a797-6ea93c84a203 | S3626 | src/pages/Historias.jsx | 125 | return vacio al final del ultimo if del efecto; sin codigo posterior, mismos destinos/replace probados | 4A/4B/Rx 16/16 PASS; snapshots 4A actualizados tras prueba AST y redirecciones | CORREGIDO |
| 800df6fb-7632-4cfa-89f9-546b025a3f0c | S7773 | src/pages/Historias.jsx | 410 | Expresion de linea base retirada con handlers/getEstadoPagoGlobal en 4A; no reintroducir ni modificar | 4A/4B/Rx 16/16 PASS; snapshots 4A actualizados tras prueba AST y redirecciones | YA_RESUELTO_POR_CAMBIO_PREVIO |
| d679630b-e81e-4e55-8be7-4a5ddde1c346 | S7754 | src/pages/Historias.jsx | 613 | Expresion de linea base retirada con handlers/getEstadoPagoGlobal en 4A; no reintroducir ni modificar | 4A/4B/Rx 16/16 PASS; snapshots 4A actualizados tras prueba AST y redirecciones | YA_RESUELTO_POR_CAMBIO_PREVIO |
| 2ed0c65b-e603-4bfc-befe-f300dd69a925 | S7773 | src/pages/Historias.jsx | 677 | Number.parseFloat en helpers y reporte, mismos argumentos/arimetica y AST equivalente | 4A/4B/Rx 16/16 PASS; snapshots 4A actualizados tras prueba AST y redirecciones | CORREGIDO |
| 6be216ba-8757-4350-8573-09b947732aa9 | S7773 | src/pages/Historias.jsx | 678 | Number.parseFloat en helpers y reporte, mismos argumentos/arimetica y AST equivalente | 4A/4B/Rx 16/16 PASS; snapshots 4A actualizados tras prueba AST y redirecciones | CORREGIDO |
| 0e478339-6596-4fd1-a83c-66581803e018 | S7773 | src/pages/Historias.jsx | 682 | Expresion de linea base retirada con handlers/getEstadoPagoGlobal en 4A; no reintroducir ni modificar | 4A/4B/Rx 16/16 PASS; snapshots 4A actualizados tras prueba AST y redirecciones | YA_RESUELTO_POR_CAMBIO_PREVIO |
| c6c97e89-0872-4f97-a42e-596d187686d5 | S7773 | src/pages/Historias.jsx | 715 | Expresion de linea base retirada con handlers/getEstadoPagoGlobal en 4A; no reintroducir ni modificar | 4A/4B/Rx 16/16 PASS; snapshots 4A actualizados tras prueba AST y redirecciones | YA_RESUELTO_POR_CAMBIO_PREVIO |
| 665c0625-b5c1-47e7-84e6-b7842a35d703 | S7773 | src/pages/Historias.jsx | 726 | Expresion de linea base retirada con handlers/getEstadoPagoGlobal en 4A; no reintroducir ni modificar | 4A/4B/Rx 16/16 PASS; snapshots 4A actualizados tras prueba AST y redirecciones | YA_RESUELTO_POR_CAMBIO_PREVIO |
| e92b68ae-1be4-4a21-a85b-df59bb6c2b7d | S7773 | src/pages/Historias.jsx | 772 | Expresion de linea base retirada con handlers/getEstadoPagoGlobal en 4A; no reintroducir ni modificar | 4A/4B/Rx 16/16 PASS; snapshots 4A actualizados tras prueba AST y redirecciones | YA_RESUELTO_POR_CAMBIO_PREVIO |
| 4fddd6d5-06d2-49f2-b267-96024eba5060 | S7773 | src/pages/Historias.jsx | 773 | Expresion de linea base retirada con handlers/getEstadoPagoGlobal en 4A; no reintroducir ni modificar | 4A/4B/Rx 16/16 PASS; snapshots 4A actualizados tras prueba AST y redirecciones | YA_RESUELTO_POR_CAMBIO_PREVIO |
| 860c4934-4d26-4977-a26f-f071580d04a7 | S7773 | src/pages/Historias.jsx | 829 | Expresion de linea base retirada con handlers/getEstadoPagoGlobal en 4A; no reintroducir ni modificar | 4A/4B/Rx 16/16 PASS; snapshots 4A actualizados tras prueba AST y redirecciones | YA_RESUELTO_POR_CAMBIO_PREVIO |
| a9afe8c0-d00c-428c-aded-341882cd5867 | S7773 | src/pages/Historias.jsx | 830 | Expresion de linea base retirada con handlers/getEstadoPagoGlobal en 4A; no reintroducir ni modificar | 4A/4B/Rx 16/16 PASS; snapshots 4A actualizados tras prueba AST y redirecciones | YA_RESUELTO_POR_CAMBIO_PREVIO |
| 5cda16b3-fa31-4d70-aef0-ef41f7823e37 | S7773 | src/pages/Historias.jsx | 991 | Number.parseFloat en helpers y reporte, mismos argumentos/arimetica y AST equivalente | 4A/4B/Rx 16/16 PASS; snapshots 4A actualizados tras prueba AST y redirecciones | CORREGIDO |
| f23a5615-164d-4ee4-9a8f-2c3e4e5bcd52 | S7773 | src/pages/Historias.jsx | 991 | Number.parseFloat en helpers y reporte, mismos argumentos/arimetica y AST equivalente | 4A/4B/Rx 16/16 PASS; snapshots 4A actualizados tras prueba AST y redirecciones | CORREGIDO |
| ad556090-01a3-4cd9-8269-b13ba4b64e14 | S6353 | src/pages/Historias.jsx | 1076 | [^0-9] a D escapada, flags g conservados; mismos digitos ASCII y caracteres descartados | 4A/4B/Rx 16/16 PASS; snapshots 4A actualizados tras prueba AST y redirecciones | CORREGIDO |

- Checkpoint: 36/53 procesados; 27 corregidos; 9 previos; 0 revision; 0 falsos positivos. Siguiente: src/pages/PacienteDetalle.jsx.


### Archivo: src/pages/PacienteDetalle.jsx

| KEY | RULE | ARCHIVO | LINEA BASE | CAMBIO / EVIDENCIA ACTUAL | VALIDACION | ESTADO |
| --- | --- | --- | --- | --- | --- | --- |
| 410fb665-777f-4f4c-b873-cdcf7bf1cbfc | S7773 | src/pages/PacienteDetalle.jsx | 519 | Number.parseInt/parseFloat con argumentos, payload, fallbacks, validacion, importes y redondeo originales; AST equivalente | 4A/4B/accesibilidad 24/24 PASS; datos/finanzas/modales 24/24 PASS | CORREGIDO |
| 8416f1e7-cbfb-415f-b863-06bbb11c8f44 | S7773 | src/pages/PacienteDetalle.jsx | 520 | Number.parseInt/parseFloat con argumentos, payload, fallbacks, validacion, importes y redondeo originales; AST equivalente | 4A/4B/accesibilidad 24/24 PASS; datos/finanzas/modales 24/24 PASS | CORREGIDO |
| 287a5d3c-b47f-4054-a533-6398829c444e | S7773 | src/pages/PacienteDetalle.jsx | 526 | Number.parseInt/parseFloat con argumentos, payload, fallbacks, validacion, importes y redondeo originales; AST equivalente | 4A/4B/accesibilidad 24/24 PASS; datos/finanzas/modales 24/24 PASS | CORREGIDO |
| 1e9a45a4-b48b-4f51-9a7c-0fe95802fbbf | S7773 | src/pages/PacienteDetalle.jsx | 536 | Number.parseInt/parseFloat con argumentos, payload, fallbacks, validacion, importes y redondeo originales; AST equivalente | 4A/4B/accesibilidad 24/24 PASS; datos/finanzas/modales 24/24 PASS | CORREGIDO |
| 7326a2f2-f810-46ec-a5ab-ae549c893861 | S7773 | src/pages/PacienteDetalle.jsx | 547 | Number.parseInt/parseFloat con argumentos, payload, fallbacks, validacion, importes y redondeo originales; AST equivalente | 4A/4B/accesibilidad 24/24 PASS; datos/finanzas/modales 24/24 PASS | CORREGIDO |
| ff5a4b5f-6e89-4696-933e-295cc047a138 | S7773 | src/pages/PacienteDetalle.jsx | 550 | Number.parseInt/parseFloat con argumentos, payload, fallbacks, validacion, importes y redondeo originales; AST equivalente | 4A/4B/accesibilidad 24/24 PASS; datos/finanzas/modales 24/24 PASS | CORREGIDO |
| 3e8f6b07-30d6-42d7-b7ee-4dd6352c8c90 | S7773 | src/pages/PacienteDetalle.jsx | 581 | Number.parseInt/parseFloat con argumentos, payload, fallbacks, validacion, importes y redondeo originales; AST equivalente | 4A/4B/accesibilidad 24/24 PASS; datos/finanzas/modales 24/24 PASS | CORREGIDO |
| f138a3be-05d9-4740-ba06-6a66e5880d4c | S7773 | src/pages/PacienteDetalle.jsx | 582 | Number.parseInt/parseFloat con argumentos, payload, fallbacks, validacion, importes y redondeo originales; AST equivalente | 4A/4B/accesibilidad 24/24 PASS; datos/finanzas/modales 24/24 PASS | CORREGIDO |
| a72bfc23-05dc-452d-a1cd-7738019180c0 | S7773 | src/pages/PacienteDetalle.jsx | 889 | Number.parseInt/parseFloat con argumentos, payload, fallbacks, validacion, importes y redondeo originales; AST equivalente | 4A/4B/accesibilidad 24/24 PASS; datos/finanzas/modales 24/24 PASS | CORREGIDO |
| cd94bfaf-72c6-4c25-b25d-07f1601eb7df | S7773 | src/pages/PacienteDetalle.jsx | 901 | Number.parseInt/parseFloat con argumentos, payload, fallbacks, validacion, importes y redondeo originales; AST equivalente | 4A/4B/accesibilidad 24/24 PASS; datos/finanzas/modales 24/24 PASS | CORREGIDO |
| c2372185-8cb7-486b-89d7-e9a183006a7a | S7773 | src/pages/PacienteDetalle.jsx | 1122 | Number.parseInt/parseFloat con argumentos, payload, fallbacks, validacion, importes y redondeo originales; AST equivalente | 4A/4B/accesibilidad 24/24 PASS; datos/finanzas/modales 24/24 PASS | CORREGIDO |
| d61bd215-8d05-4733-831a-d85d54b66196 | S7773 | src/pages/PacienteDetalle.jsx | 1139 | Number.parseInt/parseFloat con argumentos, payload, fallbacks, validacion, importes y redondeo originales; AST equivalente | 4A/4B/accesibilidad 24/24 PASS; datos/finanzas/modales 24/24 PASS | CORREGIDO |
| b12dd1ab-8e84-4899-9a1b-d19e40ea1603 | S6353 | src/pages/PacienteDetalle.jsx | 1236 | [^0-9] a D escapada, flags g conservados; sin cambiar filtros pa/dec | 4A/4B/accesibilidad 24/24 PASS; datos/finanzas/modales 24/24 PASS | CORREGIDO |

- Checkpoint: 49/53 procesados; 40 corregidos; 9 previos; 0 revision; 0 falsos positivos. Siguiente: src/services/api.js.


### Archivo: src/services/api.js

| KEY | RULE | ARCHIVO | LINEA BASE | CAMBIO / EVIDENCIA ACTUAL | VALIDACION | ESTADO |
| --- | --- | --- | --- | --- | --- | --- |
| 7c0a4dbe-0c9f-4ea8-acd9-548a79cf367f | S7746 | src/services/api.js | 49 | Promise.reject(error) a throw error solo en callback async response; cancelacion temprana/rechazo final preservan identidad, decode Blob, sesion e interceptor posterior; 13 escenarios diferenciales con Axios real y adapter sintetico | 4B/seguridad/sesion/finanzas 29/29 PASS | CORREGIDO |
| 6b33f509-4085-428a-b2d2-efb00d3e8c28 | S7746 | src/services/api.js | 61 | Promise.reject(error) a throw error solo en callback async response; cancelacion temprana/rechazo final preservan identidad, decode Blob, sesion e interceptor posterior; 13 escenarios diferenciales con Axios real y adapter sintetico | 4B/seguridad/sesion/finanzas 29/29 PASS | CORREGIDO |

- Checkpoint: 51/53 procesados; 42 corregidos; 9 previos; 0 revision; 0 falsos positivos. Siguiente: src/services/sessionState.js.


### Archivo: src/services/sessionState.js

| KEY | RULE | ARCHIVO | LINEA BASE | CAMBIO / EVIDENCIA ACTUAL | VALIDACION | ESTADO |
| --- | --- | --- | --- | --- | --- | --- |
| 3a14f094-bb01-4aa9-93e4-78f93181255d | S7723 | src/services/sessionState.js | 52 | new Error en validSession; mismos tipo/mensaje/condiciones/bordes hex y rechazo; ninguna regla de sesion alterada | 4B/seguridad/sesion 28/28 PASS | CORREGIDO |

- Checkpoint: 52/53 procesados; 43 corregidos; 9 previos; 0 revision; 0 falsos positivos. Siguiente: src/utils/agendaUtils.js.


### Archivo: src/utils/agendaUtils.js

| KEY | RULE | ARCHIVO | LINEA BASE | CAMBIO / EVIDENCIA ACTUAL | VALIDACION | ESTADO |
| --- | --- | --- | --- | --- | --- | --- |
| 1e3a90a0-60c9-49be-bb07-7a28d92d416f | S7778 | src/utils/agendaUtils.js | 5 | Dos slots.push consecutivos a un push de dos strings puros; array local normal, misma secuencia de 24 horarios 08:00-19:30; resto del helper intacto | 4B/agenda 14/14 PASS | CORREGIDO |

- Checkpoint: 53/53 procesados; 44 corregidos; 9 previos; 0 revision; 0 falsos positivos. Siguiente: validacion final frontend/build y cierre 4B; no 4C.


### Cierre y validacion final de Familia 4B

- COMPLETA localmente: 53/53 issues del subset clasificados, 44 CORREGIDO, 9 YA_RESUELTO_POR_CAMBIO_PREVIO, 0 PENDIENTE_REVISION, 0 FALSO_POSITIVO. 53 claves unicas y cobertura exacta del subset. Los 9 previos de Historias desaparecieron al retirar handlers/getEstadoPagoGlobal en 4A; no se reprocesaron issues 4A ni se restauro codigo muerto.
- Cambios de este lote: 34 llamadas de parsers a Number.parseInt/parseFloat conservando argumentos y fallbacks; 2 new Error; 2 regex numericas ASCII equivalentes; una seleccion de ultimo dia con at(-1); un Set de cuatro categorias con dos has; un return vacio terminal eliminado; 2 throw en interceptor response async; un push de dos slots. Ningun issue isNaN en el subset, ninguna conversion de isNaN/coercion.
- Proteccion semantica: huellas AST previas al cambio por archivo, normalizando solo las formas equivalentes autorizadas; argumentos, JSX, handlers, payloads y resto del flujo deben coincidir. Pruebas de calendario, pertenencia/mes, MIME, errores/contexto de sesion, filtros ASCII/Unicode, pagos/redondeo y 24 slots exactos.
- S7746: ambos saltos pertenecen al mismo interceptor async de respuesta. 13 escenarios comparan antes/despues con Axios instalado y adapter sintetico sin red: cancelacion, red, sin config, HTTP 401/login/403/500, cambio de sesion/CSRF, Blob JSON valido/invalido/grande y respuesta de epoch obsoleto. Misma identidad del error propagado y una sola entrega al interceptor posterior; mismos eventos changed/expire y decode de datos. No cambio de contratos ni logica de login/sesion/API.
- npm test frontend: 66/66 PASS (55 existentes + 11 nuevas de 4B), 0 fallos/skips. Grupos relacionados probados despues de cada archivo. npm run build PASS, 1834 modulos; JS index-t7Rs_fyf.js 574.36 kB, CSS index-B-2o4lNl.css 47.34 kB. Avisos chunk >500 kB y tiempos de plugins permanecen fuera de alcance. dist frontend generado, NO copiado al backend.
- Ajustes de pruebas durante la sesion: el primer guard AST necesitaba ignorar start/end y la diferencia del flag optional entre NewExpression/CallExpression; se corrigio el harness y se comprobo equivalencia con la forma anterior. Comparacion Blob JSON en VM normalizada a valores de datos para evitar diferencia de prototipos entre contextos, manteniendo los asserts de identidad de error. Ninguno requirio cambiar funcionalidad.
- Las huellas textuales de 4A detectaron los cambios sintacticos esperados del reporte/efecto y PacienteDetalle. Se actualizaron solo esas huellas despues de comprobar AST equivalente y comportamiento de redirecciones/pagos. No se eliminaron/desactivaron pruebas, no se reclasifico 4A y sigue protegida la ausencia de handlers muertos, hooks y fuentes no afectadas.
- Regresiones: ninguna detectada en tests/build/AST; sin validacion manual clinica ni integracion BD en esta sesion. Observaciones pendientes fuera de lote: advertencia de bundle/timing; dependencias legadas registradas en 4A permanecen sin limpieza en cascada.
- Backend NO MODIFICADO/NO REPETIDO: diff binario antes/despues identico 4ba1bae6a5086d5b4e460b1c624e1530302f6f34. Sin cambios en BD/SQL/.env/autenticacion/rutas/dependencias/configuracion de despliegue; sin push/reset/SonarQube/4C/E01-E17/universidad.
- Archivos de esta sesion: frontend src/components/ClinicalImage.jsx, src/pages/AdministracionPersonal.jsx, src/pages/Agenda.jsx, src/pages/Dashboard.jsx, src/pages/FinanzasDashboard.jsx, src/pages/Historias.jsx, src/pages/PacienteDetalle.jsx, src/services/api.js, src/services/sessionState.js, src/utils/agendaUtils.js; tests/sonar-family4b.test.mjs nuevo y tests/sonar-family4a.test.mjs (huellas validadas); docs/quality/sonar-family4b.csv nuevo; docs/quality/SONAR_REMEDIATION_LOG.md y CURRENT_TASK.md. Trabajo previo conservado.
- SIGUIENTE PASO: esperar autorizacion para 4C. DETENERSE; no ejecutar SonarQube.


## Familia 4C - S2486 (2026-10-03)

Subconjunto E13: 25 issues, 7 archivos; no se reprocesan otras familias. A: fallos operacionales con respuesta controlada y diagnostico privado; B: fallback real conservado; D: codigo previamente retirado. Sin datos reales ni conexion a BD en pruebas.

| KEY | RULE | ARCHIVO | LINEA BASE | CLASE | DIAGNOSTICO | CAMBIO | PRUEBA | ESTADO |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3f3e7094-7085-4aa2-a92e-072df76923aa | javascript:S2486 | micodent-backend/src/controllers/historias.controller.js | 513 | A | Fallo de subida/BD; 500 y rollback ya controlados, confirmacion incierta conserva bytes | Evento especifico y clasificacion fija de conexion; nunca mensaje/SQL/parametros del error; HTTP/JSON intactos | sonar-family4c backend: exito, error privado y ECONNREFUSED PASS; transacciones/bytes cuando aplica | CORREGIDO |
| 585da400-01eb-4f52-a400-c32a46a32c77 | javascript:S2486 | micodent-backend/src/controllers/historias.controller.js | 537 | A | Fallo de consulta de anexos; 500 controlado sin diagnostico operacional | Evento especifico y clasificacion fija de conexion; nunca mensaje/SQL/parametros del error; HTTP/JSON intactos | sonar-family4c backend: exito, error privado y ECONNREFUSED PASS; transacciones/bytes cuando aplica | CORREGIDO |
| a45c3c1b-dd9b-404b-8f29-ee08e8c89b7e | javascript:S2486 | micodent-backend/src/controllers/historias.controller.js | 564 | A | Fallo de anulacion/BD; finally conserva rollback y release | Evento especifico y clasificacion fija de conexion; nunca mensaje/SQL/parametros del error; HTTP/JSON intactos | sonar-family4c backend: exito, error privado y ECONNREFUSED PASS; transacciones/bytes cuando aplica | CORREGIDO |
| 0c8f78d3-fdea-4bd3-8732-7c9cf113adb1 | javascript:S2486 | micodent-backend/src/controllers/historias.controller.js | 595 | A | Fallo de restauracion/BD; no se convierte en exito ni se borran bytes | Evento especifico y clasificacion fija de conexion; nunca mensaje/SQL/parametros del error; HTTP/JSON intactos | sonar-family4c backend: exito, error privado y ECONNREFUSED PASS; transacciones/bytes cuando aplica | CORREGIDO |
| 85e1da46-7ccc-4283-8ad8-c3aa26621ac3 | javascript:S2486 | micodent-backend/src/controllers/historias.controller.js | 735 | A | Fallo de catalogo Rx; 500 controlado sin diagnostico operacional | Evento especifico y clasificacion fija de conexion; nunca mensaje/SQL/parametros del error; HTTP/JSON intactos | sonar-family4c backend: exito, error privado y ECONNREFUSED PASS; transacciones/bytes cuando aplica | CORREGIDO |

- CHECKPOINT 4C: 5/25 clasificados; ultimo backend/src/controllers/historias.controller.js; tests backend 4C 5/5 PASS. Registro solo de fallos operacionales; sin logging para fallbacks opcionales. Rollbacks auxiliares fuera del CSV no modificados.

| 3e648a1c-eae6-4953-b7d0-2273575ea9b8 | javascript:S2486 | micodent-backend/src/controllers/pacientes.controller.js | 87 | A | Fallo de lectura de paciente/auditoria; respuesta 500 existente sin diagnostico | Evento especifico privado y categoria fija; HTTP/JSON/rollback/release sin cambios | sonar-family4c backend: exito y dos categorias de fallo PASS; edicion comprueba rollback/release | CORREGIDO |
| 3fab5dc7-9901-46e7-af22-1bd959f0bf0e | javascript:S2486 | micodent-backend/src/controllers/pacientes.controller.js | 247 | A | Fallo de edicion de paciente; rollback existente y respuesta 500, sin diagnostico | Evento especifico privado y categoria fija; HTTP/JSON/rollback/release sin cambios | sonar-family4c backend: exito y dos categorias de fallo PASS; edicion comprueba rollback/release | CORREGIDO |
| cf8954cd-fba5-4b46-8fab-9cc9f5f3fe1a | javascript:S2486 | micodent-backend/src/controllers/pacientes.controller.js | 321 | A | Fallo de lectura de paciente/auditoria; respuesta 500 existente sin diagnostico | Evento especifico privado y categoria fija; HTTP/JSON/rollback/release sin cambios | sonar-family4c backend: exito y dos categorias de fallo PASS; edicion comprueba rollback/release | CORREGIDO |

- CHECKPOINT 4C: 8/25 clasificados; ultimo backend/src/controllers/pacientes.controller.js; tests backend 4C 8/8 PASS. Solo dependencias simuladas, sin consultas reales. Adquisicion de conexion fuera de try en editarPaciente es preexistente y queda fuera del lote.

| 8261661b-bf68-445f-bb00-7b436aa70c87 | javascript:S2486 | micodent-backend/src/controllers/usuarios.controller.js | 17 | A | Fallo de lectura de usuarios/doctores; respuesta 500 existente sin diagnostico operacional | Evento especifico privado; categoria fija de conexion; no cambia respuesta ni permisos | sonar-family4c backend: exito, fallo privado, fallo conexion PASS | CORREGIDO |
| 89b528d0-6b59-48d8-9af4-c8130184ab01 | javascript:S2486 | micodent-backend/src/controllers/usuarios.controller.js | 180 | A | Fallo de lectura de usuarios/doctores; respuesta 500 existente sin diagnostico operacional | Evento especifico privado; categoria fija de conexion; no cambia respuesta ni permisos | sonar-family4c backend: exito, fallo privado, fallo conexion PASS | CORREGIDO |

- CHECKPOINT 4C: 10/25 clasificados; ultimo backend/src/controllers/usuarios.controller.js; tests backend 4C 10/10 PASS; sintaxis 3 controladores PASS. Diez fallos operacionales con eventos constantes, sin serializar excepciones. Backend completo pendiente; no red/BD real.

| 5ae850f1-ccbe-485f-bd90-592f6bddd0b5 | javascript:S2486 | micodent-frontend/src/pages/Historias.jsx | 302 | A | cargarTodo ya maneja error con aviso fijo; variable capturada sin referencias | Eliminar binding sin uso y explicitar aviso seguro; lista/carga/finally y textos intactos | 4C exito/fallo PASS; AST equivalente salvo binding sin uso; guards 4A/4B actualizados solo tras prueba | CORREGIDO |
| ec458cff-bf71-44fb-ba49-4a8a49286d38 | javascript:S2486 | micodent-frontend/src/pages/Historias.jsx | 344 | D | recargarOdontograma ya eliminado por 4A; corroborado contra HEAD E13 y fuente actual | Ninguno; no reintroducir funcion retirada | 4A ausencia de handlers y referencias PASS | YA_RESUELTO_POR_CAMBIO_PREVIO |
| e11ef08f-aad2-4f2c-b033-70bf7fa3b159 | javascript:S2486 | micodent-frontend/src/pages/Historias.jsx | 450 | A | recargarListaHistorias ya maneja error con aviso fijo; variable capturada sin referencias | Eliminar binding sin uso y explicitar aviso seguro; lista/carga/finally y textos intactos | 4C exito/fallo PASS; AST equivalente salvo binding sin uso; guards 4A/4B actualizados solo tras prueba | CORREGIDO |
| 61db8b23-cd97-4a1d-980e-0c8cdf1d6cf5 | javascript:S2486 | micodent-frontend/src/pages/Historias.jsx | 467 | D | handleBorrarHistoria ya eliminado por 4A; corroborado contra HEAD E13 y fuente actual | Ninguno; no reintroducir funcion retirada | 4A ausencia de handlers y referencias PASS | YA_RESUELTO_POR_CAMBIO_PREVIO |
| c5e6f052-d3d0-4a8d-943f-2f9a70529a73 | javascript:S2486 | micodent-frontend/src/pages/Historias.jsx | 477 | D | handleReactivarHistoria ya eliminado por 4A; corroborado contra HEAD E13 y fuente actual | Ninguno; no reintroducir funcion retirada | 4A ausencia de handlers y referencias PASS | YA_RESUELTO_POR_CAMBIO_PREVIO |
| 10ce52f8-3f43-4185-b982-d0cd24982e5f | javascript:S2486 | micodent-frontend/src/pages/Historias.jsx | 651 | D | handleFileUpload ya eliminado por 4A; corroborado contra HEAD E13 y fuente actual | Ninguno; no reintroducir funcion retirada | 4A ausencia de handlers y referencias PASS | YA_RESUELTO_POR_CAMBIO_PREVIO |
| 323bba96-3686-41eb-bde9-a155c4062899 | javascript:S2486 | micodent-frontend/src/pages/Historias.jsx | 672 | D | handleEliminarRadiografia ya eliminado por 4A; corroborado contra HEAD E13 y fuente actual | Ninguno; no reintroducir funcion retirada | 4A ausencia de handlers y referencias PASS | YA_RESUELTO_POR_CAMBIO_PREVIO |

- CHECKPOINT 4C: 17/25 clasificados; ultimo frontend/src/pages/Historias.jsx; tests frontend relacionado 21/21 PASS; backend 4C 10/10 PASS. 5 issues de funciones retiradas no reprocesados. Actualizadas solo huellas afectadas tras equivalencia AST y escenarios de error; sin cambios UI ni toasts nuevos.

| 9b471d5a-74e3-4ea9-99cf-eee8b2bbc85f | javascript:S2486 | micodent-frontend/src/pages/MiPerfil.jsx | 177 | A | Guardar firma/sello ya avisa de fallo y desactiva saving en finally; binding sin referencias | Omitir binding y explicitar conservacion del borrador para reintento; aviso/payload/finally intactos | 4C exito/fallo de firma/sello y AST equivalente PASS; guards 4A actualizados tras comprobacion | CORREGIDO |

- CHECKPOINT 4C: 18/25 clasificados; ultimo frontend/src/pages/MiPerfil.jsx; tests frontend 4A+4C 11/11 PASS; backend 4C 10/10 PASS. No eventos/toasts nuevos en frontend. Firma y sello no se eliminan ni se invalidan al fallar.

| f8b367bc-8c2d-4d3f-a392-7bdf068d4711 | javascript:S2486 | micodent-frontend/src/pages/PacienteDetalle.jsx | 270 | A | cargarTodo: fallo ya comunicado por aviso fijo; binding err sin uso | Binding omitido; motivo del aviso controlado documentado; ninguna lista se borra como falsa respuesta exitosa | 4C exito/rechazo PASS; refresh incluye non-ok; carga/finally/anexo probados; AST equivalente salvo bindings | CORREGIDO |
| 32b3824b-ed98-491e-8a97-3467f776b538 | javascript:S2486 | micodent-frontend/src/pages/PacienteDetalle.jsx | 309 | A | recargarOdontograma: fallo ya comunicado por aviso fijo; binding err sin uso | Binding omitido; motivo del aviso controlado documentado; ninguna lista se borra como falsa respuesta exitosa | 4C exito/rechazo PASS; refresh incluye non-ok; carga/finally/anexo probados; AST equivalente salvo bindings | CORREGIDO |
| e1b2583f-115a-41e1-a25a-2e42bd10cc57 | javascript:S2486 | micodent-frontend/src/pages/PacienteDetalle.jsx | 330 | A | recargarEvoluciones: fallo ya comunicado por aviso fijo; binding err sin uso | Binding omitido; motivo del aviso controlado documentado; ninguna lista se borra como falsa respuesta exitosa | 4C exito/rechazo PASS; refresh incluye non-ok; carga/finally/anexo probados; AST equivalente salvo bindings | CORREGIDO |
| 536d0699-5eb7-4982-8d67-5ce66ea90f34 | javascript:S2486 | micodent-frontend/src/pages/PacienteDetalle.jsx | 340 | A | recargarRecetas: fallo ya comunicado por aviso fijo; binding err sin uso | Binding omitido; motivo del aviso controlado documentado; ninguna lista se borra como falsa respuesta exitosa | 4C exito/rechazo PASS; refresh incluye non-ok; carga/finally/anexo probados; AST equivalente salvo bindings | CORREGIDO |
| e071cd0e-6891-48b0-b77b-f3bd0bdc46d5 | javascript:S2486 | micodent-frontend/src/pages/PacienteDetalle.jsx | 350 | A | recargarOrdenes: fallo ya comunicado por aviso fijo; binding err sin uso | Binding omitido; motivo del aviso controlado documentado; ninguna lista se borra como falsa respuesta exitosa | 4C exito/rechazo PASS; refresh incluye non-ok; carga/finally/anexo probados; AST equivalente salvo bindings | CORREGIDO |
| 649b49e4-bb6f-4f6e-9ab9-8bee50c257c3 | javascript:S2486 | micodent-frontend/src/pages/PacienteDetalle.jsx | 474 | A | handleFileUpload: fallo ya comunicado por aviso fijo; binding err sin uso | Binding omitido; motivo del aviso controlado documentado; ninguna lista se borra como falsa respuesta exitosa | 4C exito/rechazo PASS; refresh incluye non-ok; carga/finally/anexo probados; AST equivalente salvo bindings | CORREGIDO |

- CHECKPOINT 4C: 24/25 clasificados; ultimo frontend/src/pages/PacienteDetalle.jsx; tests frontend relacionado 28/28 PASS; backend 4C 10/10 PASS. Guardas 4A/4B actualizadas solo tras pruebas. Observacion preexistente: upload muestra exito antes de recargar lista, por lo que fallo de refresh conserva aviso de error posterior; no cambiado en 4C. Los primeros fallos del harness fueron mock de undefined/busy, corregidos solo en tests.

| aa01cfcb-22cf-4680-b50d-362e74813441 | javascript:S2486 | micodent-frontend/src/pages/Pacientes.jsx | 61 | A | Carga por API ya reporta fallo y finaliza loading; binding err sin referencias | Omitir binding; explicar conservacion de ultima lista y aviso fijo, sin cambiar filtros ni formatos | 4C exito/envelope/flat/rechazo/formato invalido PASS; AST equivalente salvo bindings; guard 4A actualizado | CORREGIDO |

- CHECKPOINT 4C: 25/25 clasificados; ultimo frontend/src/pages/Pacientes.jsx; tests frontend 4C 11/11 PASS; backend 4C 10/10 PASS. 25/25: 20 A corregidos, 5 D previos; B=0 C=0, pendientes/falsos positivos=0. Resta suite completa y build.

### Cierre local Familia 4C - COMPLETA

- 25/25 claves E13 registradas una sola vez y cotejadas con sonar-family4c.csv: 20 CORREGIDO, 5 YA_RESUELTO_POR_CAMBIO_PREVIO, 0 PENDIENTE_REVISION, 0 FALSO_POSITIVO. Clasificacion: A=20, B=0, C=0, D=5. No hay fallbacks opcionales entre los catches de este subconjunto; los catches auxiliares fuera del CSV no fueron intervenidos.
- Backend (10 A): las respuestas controladas 500/JSON ya existian; se incorporo diagnostico operacional solo a fallos reales de lectura/persistencia/archivos, siguiendo el registro operacional existente. Cada evento identifica la operacion y usa dos categorias constantes (CONNECTION_REFUSED/OPERATION_FAILED), nunca el texto, codigo libre, stack, SQL, parametros, rutas o datos de la excepcion. No cambios de API, status, permisos ni transacciones.
- Frontend (10 A): ya existia aviso fijo de error y manejo de carga/finally cuando aplicaba. Se quitaron solo bindings err sin referencias y se explico el manejo real (aviso seguro, datos conservados, reintento); no se agregaron logs/toasts, no se suprimio el catch ni se altero persistencia. No son comentarios de ignorar errores: se mantiene la respuesta de fallo existente. Los cinco D pertenecen a handlers de Historias ya retirados por 4A, no reintroducidos.
- Pruebas nuevas pequenas: backend tests/unit/sonar-family4c.test.cjs (10 tests, escenarios exitosos y excepciones privadas/conexion; rollback/release, commit incierto y conservacion de bytes). Frontend tests/sonar-family4c.test.mjs (11 tests, exitos/rechazos, non-ok, payload firma/sello/anexo, filtros y loading/finally; sin llamadas de red ni datos reales).
- Guard AST de los cuatro archivos frontend: identico ejecutable antes/despues excepto bindings de catch demostrados sin referencias; comentarios ignorados, JSX, acciones, contratos y todas las demas sentencias conservados. Tras esa prueba y las funcionales se actualizaron solo huellas correspondientes en sonar-family4a.test.mjs (efecto/hook de carga Historias, MiPerfil y hashes de fuentes clinicas modificadas) y sonar-family4b.test.mjs (Historias/PacienteDetalle); ningun test eliminado/deshabilitado.
- Validacion final: npm test frontend 77/77 PASS (66 existentes + 11 nuevos); npm test backend 96/96 PASS (86 existentes + 10 nuevos), cero fallos/omitidos; node --check en los tres controladores PASS; git diff --check PASS (solo avisos LF/CRLF).
- TEMP/TMP y NODE_DISABLE_COMPILE_CACHE=1 solo para el proceso de suite backend: micodent-backend/.family4c-validation-a8f42ef9981d44779548368c435e22e3. Variables restituidas en finally. Directorio comprobado vacio al terminar; no se cambio el TEMP global ni la fixture Windows, que pasa.
- Build frontend PASS: 1834 modulos; index-t7Rs_fyf.js 574.36 kB; index-B-2o4lNl.css 47.34 kB. Mismos nombres/tamanos que 4B, sin cambios visuales/funcionales compilados. Aviso de chunk >500 kB preexistente, fuera de alcance. dist generado solo en frontend; NO copiado al backend.
- Ajustes del harness: un comando de huellas inicial excedio el limite de argumentos Windows y otro fallo por quoting; se cambio a evaluacion corta con lectura de archivo. Dos fallos iniciales de tests nuevos fueron exclusivamente simulacion de setters con undefined y falta de estado subiendoImagen; corregidos en pruebas, no en codigo del sistema.
- Observaciones pendientes fuera de 4C: conexion adquirida fuera del try en editarPaciente; manejo de rollback auxiliar; exito de upload mostrado antes del refresh, cuyo fallo posterior ya muestra error. No se abre refactor adicional. Validacion manual clinica/integracion con BD real NO realizada; estas pruebas cubren dependencias simuladas y suite existente.
- Archivos de esta sesion (14): micodent-backend/src/controllers/historias.controller.js, micodent-backend/tests/unit/sonar-family4c.test.cjs, docs/quality/sonar-family4c.csv, docs/quality/SONAR_REMEDIATION_LOG.md, docs/quality/CURRENT_TASK.md, micodent-backend/src/controllers/pacientes.controller.js, micodent-backend/src/controllers/usuarios.controller.js, micodent-frontend/src/pages/Historias.jsx, micodent-frontend/tests/sonar-family4c.test.mjs, micodent-frontend/tests/sonar-family4a.test.mjs, micodent-frontend/tests/sonar-family4b.test.mjs, micodent-frontend/src/pages/MiPerfil.jsx, micodent-frontend/src/pages/PacienteDetalle.jsx, micodent-frontend/src/pages/Pacientes.jsx.
- Regresiones: ninguna detectada en tests/build y equivalencia AST frontend. Trabajo previo conservado; sin cambios de BD/SQL/.env/autenticacion/rutas/dependencias, instalaciones de prueba, push/reset ni otras familias.
- SIGUIENTE PASO: esperar autorizacion para 4D. DETENERSE; no ejecutar SonarQube.


## Familia 4D - resto E13 (2026-10-03)

CSV original 371; exclusion por key de 335 procesados en subconjuntos/log; restantes 36, solo ocho reglas autorizadas. No reprocesar familias previas.

| KEY | RULE | ARCHIVO | LINEA E13 | DIAGNOSTICO | CAMBIO | PRUEBA | RESULTADO | ESTADO |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| da527c81-9172-4765-abd7-d938c6af99cb | javascript:S6479 | micodent-frontend/src/components/PiezaSelector.jsx | 12 | Indice como key de fila/lista; dominio ofrece piezas o paciente+historia | Key row/fila.join('-') y paciente_id:nro_historia, sin aleatoriedad ni cambios visuales | 4D unicidad/reordenado y label T/P/T-P/no solicitado; rxTeeth existente | PASS | CORREGIDO |
| 5e7d89fe-5e7c-4ca7-9c46-622edcaff250 | javascript:S6479 | micodent-frontend/src/components/RxTeethPrint.jsx | 14 | Indice como key de fila/lista; dominio ofrece piezas o paciente+historia | Key row/fila.join('-') y paciente_id:nro_historia, sin aleatoriedad ni cambios visuales | 4D unicidad/reordenado y label T/P/T-P/no solicitado; rxTeeth existente | PASS | CORREGIDO |
| 0963a7a4-5a21-48e0-bcb0-caba1bff86b0 | javascript:S4624 | micodent-frontend/src/components/RxTeethPrint.jsx | 20 | Label Rx contenia template anidado | Concatenacion equivalente, mismo label y caracteres | 4D unicidad/reordenado y label T/P/T-P/no solicitado; rxTeeth existente | PASS | CORREGIDO |
| a4a6da06-8c12-4246-8063-c7f917b880d3 | javascript:S6479 | micodent-frontend/src/pages/Dashboard.jsx | 200 | Indice como key de fila/lista; dominio ofrece piezas o paciente+historia | Key row/fila.join('-') y paciente_id:nro_historia, sin aleatoriedad ni cambios visuales | 4D unicidad/reordenado y label T/P/T-P/no solicitado; rxTeeth existente | PASS | CORREGIDO |
| 46729b17-390b-4862-b615-6510e5781ca0 | javascript:S3358 | micodent-frontend/src/pages/FinanzasDashboard.jsx | 486 | Ternario de laboratorio ya sustituido antes de 4D por EstadoPagoLaboratorio con if/return | Ninguno; conservar componente previo | 4D ramas pagados/edicion/pendiente y prioridad; 16/16 grupo PASS | PASS | YA_RESUELTO_POR_CAMBIO_PREVIO |

- CHECKPOINT 4D: 5/36; ultimo RxTeethPrint/PiezaSelector/Dashboard (4 issues); tests frontend grupo 4/4 PASS. Dashboard API no devuelve h.id, se usa composicion de paciente_id y nro_historia verificada en consulta real. Huella 4B Dashboard requiere refresco tras pruebas, pendiente antes de suite final.

| 270aedc4-7ce5-492f-8852-24e0e6850b21 | javascript:S5689 | micodent-backend/src/index.js | 26 | Express default aun habilitaba X-Powered-By | app.disable('x-powered-by'); sin cambiar otros headers | HTTP Express real ping200/missing404/uploads404 sin header ni llamadas BD | PASS | CORREGIDO |
| d0ca234f-1cea-4b78-a303-c41294f6cf38 | javascript:S6847 | micodent-frontend/src/components/ConfirmModal.jsx | 38 | ConfirmModal aun asignaba stopPropagation a div alertdialog | ModalDialog nativo como overlay; tarjeta intacta y propagacion en dialog; onCancel/busy/foco compartidos | 23/23 modal/accesibilidad/4D; callbacks/busy/propagacion y foco compartido | PASS | CORREGIDO |

- CHECKPOINT 4D: 7/36; ultimo S5689 + S6847; tests frontend relacionado 23/23 PASS; backend 4D 1/1 PASS. ConfirmModal sin doble cierre ni cierre por backdrop. Verificacion visual navegador aislado pendiente; no validacion clinica real.

| f2a59568-e2c8-4413-a905-22feccd38592 | javascript:S3358 | micodent-backend/src/controllers/laboratorio.controller.js | 25 | Estado pagado/parcial/pendiente segun total acumulado | if/else con mismas condiciones, orden, valores e identidad de fallback | 4D parsing todas formas/profundidades e identidad; laboratorio cero/parcial/completo/exceso/NaN; finanzas existentes 8/8 PASS | PASS | CORREGIDO |
| 4cea89d9-8418-4182-a8b3-2767b90a3569 | javascript:S3358 | micodent-backend/src/utils/jsonFields.js | 5 | Ternario de formas JSON array/objeto/fallback | if/else con mismas condiciones, orden, valores e identidad de fallback | 4D parsing todas formas/profundidades e identidad; laboratorio cero/parcial/completo/exceso/NaN; finanzas existentes 8/8 PASS | PASS | CORREGIDO |
| 6dda353c-4d6f-4148-bc1f-00ba39b53359 | javascript:S3358 | micodent-backend/src/utils/jsonFields.js | 6 | Ternario de formas JSON array/objeto/fallback | if/else con mismas condiciones, orden, valores e identidad de fallback | 4D parsing todas formas/profundidades e identidad; laboratorio cero/parcial/completo/exceso/NaN; finanzas existentes 8/8 PASS | PASS | CORREGIDO |

- CHECKPOINT 4D: 10/36; ultimo backend laboratorio/jsonFields (3 S3358); tests backend grupo 8/8 PASS; frontend modal 23/23 PASS. Sin recalculo financiero ni cambios de montos. Conservar casos legados cero/NaN; no se introduce normalizacion nueva.

| b51c01e4-e454-4044-a1f4-0ea82cbffa8e | javascript:S3358 | micodent-frontend/src/components/AgendaMes.jsx | 34 | Ternario anidado en formato/estado/mensaje con precedencia identificada | Calculo descriptivo/if-else sin cambiar ramas, textos ni gating de sesion | 4D ramas todas; requestContext 80 combinaciones, sesiones/agenda/Rx/data existentes; 29/29 PASS | PASS | CORREGIDO |
| bb811b11-94a6-4156-af37-961828ed2fd2 | javascript:S3358 | micodent-frontend/src/components/CitaModal.jsx | 261 | Ternario anidado en formato/estado/mensaje con precedencia identificada | Calculo descriptivo/if-else sin cambiar ramas, textos ni gating de sesion | 4D ramas todas; requestContext 80 combinaciones, sesiones/agenda/Rx/data existentes; 29/29 PASS | PASS | CORREGIDO |
| 1d5841b6-56cb-4c84-8632-0c2a6e0e8cd4 | javascript:S3358 | micodent-frontend/src/components/SessionBoundary.jsx | 47 | Ternario anidado en formato/estado/mensaje con precedencia identificada | Calculo descriptivo/if-else sin cambiar ramas, textos ni gating de sesion | 4D ramas todas; requestContext 80 combinaciones, sesiones/agenda/Rx/data existentes; 29/29 PASS | PASS | CORREGIDO |
| 02630457-e534-4432-87a7-858a9fea75d1 | javascript:S3358 | micodent-frontend/src/components/SessionBoundary.jsx | 48 | Ternario anidado en formato/estado/mensaje con precedencia identificada | Calculo descriptivo/if-else sin cambiar ramas, textos ni gating de sesion | 4D ramas todas; requestContext 80 combinaciones, sesiones/agenda/Rx/data existentes; 29/29 PASS | PASS | CORREGIDO |
| dc65ae77-9a91-4568-acd6-e5b7e4dc0a22 | javascript:S3358 | micodent-frontend/src/components/SessionBoundary.jsx | 60 | Ternario anidado en formato/estado/mensaje con precedencia identificada | Calculo descriptivo/if-else sin cambiar ramas, textos ni gating de sesion | 4D ramas todas; requestContext 80 combinaciones, sesiones/agenda/Rx/data existentes; 29/29 PASS | PASS | CORREGIDO |
| 4ddb793d-7d7b-423b-915c-8f775a28c59f | javascript:S3358 | micodent-frontend/src/services/sessionState.js | 74 | Ternario anidado en formato/estado/mensaje con precedencia identificada | Calculo descriptivo/if-else sin cambiar ramas, textos ni gating de sesion | 4D ramas todas; requestContext 80 combinaciones, sesiones/agenda/Rx/data existentes; 29/29 PASS | PASS | CORREGIDO |
| 97553738-b348-4932-af51-ae9a8f855359 | javascript:S3358 | micodent-frontend/src/utils/data.js | 29 | Ternario anidado en formato/estado/mensaje con precedencia identificada | Calculo descriptivo/if-else sin cambiar ramas, textos ni gating de sesion | 4D ramas todas; requestContext 80 combinaciones, sesiones/agenda/Rx/data existentes; 29/29 PASS | PASS | CORREGIDO |
| 98f98ec9-c147-459a-9251-fbe2348e829f | javascript:S3358 | micodent-frontend/src/utils/rxTeeth.js | 21 | Ternario anidado en formato/estado/mensaje con precedencia identificada | Calculo descriptivo/if-else sin cambiar ramas, textos ni gating de sesion | 4D ramas todas; requestContext 80 combinaciones, sesiones/agenda/Rx/data existentes; 29/29 PASS | PASS | CORREGIDO |

- CHECKPOINT 4D: 18/36; ultimo Utilidades, agenda mensual, CitaModal, SessionBoundary y sessionState (8 S3358); tests frontend grupo 29/29 PASS; backend grupo 8/8 PASS. Mock financiero necesitaba transactional, corregido solo en harness; grupo backend luego 8/8 PASS. Gating login prevalece sobre bootstrap conservado. Huellas de sessionState 4B requieren refresco verificado.

| e1bd7bd3-d8b2-47fd-8b7d-634e04744e91 | javascript:S3358 | micodent-frontend/src/components/OdontogramaEditor.jsx | 200 | Ternario en render de formulario/lista, prefijo, credenciales o detalle profesional | if/else o valor descriptivo/render helper local; mismo JSX, closures/handlers y textos | 4D todas ramas odontograma/personal; prefijos/generos/tasas nulas-cero-string/listas/loading/credenciales/desactivacion PASS | PASS | CORREGIDO |
| cc34a2cf-a6a6-4201-a63e-27b53f9a904d | javascript:S3358 | micodent-frontend/src/pages/AdministracionPersonal.jsx | 86 | Ternario en render de formulario/lista, prefijo, credenciales o detalle profesional | if/else o valor descriptivo/render helper local; mismo JSX, closures/handlers y textos | 4D todas ramas odontograma/personal; prefijos/generos/tasas nulas-cero-string/listas/loading/credenciales/desactivacion PASS | PASS | CORREGIDO |
| 7b5d6b57-b0da-417c-a585-b5b79818f434 | javascript:S3358 | micodent-frontend/src/pages/AdministracionPersonal.jsx | 87 | Ternario en render de formulario/lista, prefijo, credenciales o detalle profesional | if/else o valor descriptivo/render helper local; mismo JSX, closures/handlers y textos | 4D todas ramas odontograma/personal; prefijos/generos/tasas nulas-cero-string/listas/loading/credenciales/desactivacion PASS | PASS | CORREGIDO |
| 5d3ea0aa-e746-492f-86f5-969cb85d6bc7 | javascript:S3358 | micodent-frontend/src/pages/AdministracionPersonal.jsx | 164 | Mensaje de desactivacion ya extraido previamente como if/return en mensajeDesactivacion | Ninguno; helper previo y prioridad conservados | 4D todas ramas odontograma/personal; prefijos/generos/tasas nulas-cero-string/listas/loading/credenciales/desactivacion PASS | PASS | YA_RESUELTO_POR_CAMBIO_PREVIO |
| 46f4c88c-5db5-4834-bed3-32237291fa22 | javascript:S3358 | micodent-frontend/src/pages/AdministracionPersonal.jsx | 166 | Mensaje de desactivacion ya extraido previamente como if/return en mensajeDesactivacion | Ninguno; helper previo y prioridad conservados | 4D todas ramas odontograma/personal; prefijos/generos/tasas nulas-cero-string/listas/loading/credenciales/desactivacion PASS | PASS | YA_RESUELTO_POR_CAMBIO_PREVIO |
| 7ce08ded-a784-4f97-8151-ca5de10957fa | javascript:S3358 | micodent-frontend/src/pages/AdministracionPersonal.jsx | 322 | Ternario en render de formulario/lista, prefijo, credenciales o detalle profesional | if/else o valor descriptivo/render helper local; mismo JSX, closures/handlers y textos | 4D todas ramas odontograma/personal; prefijos/generos/tasas nulas-cero-string/listas/loading/credenciales/desactivacion PASS | PASS | CORREGIDO |
| 1ebb9d55-82b8-44aa-aef8-27e6890af697 | javascript:S3358 | micodent-frontend/src/pages/AdministracionPersonal.jsx | 351 | Ternario en render de formulario/lista, prefijo, credenciales o detalle profesional | if/else o valor descriptivo/render helper local; mismo JSX, closures/handlers y textos | 4D todas ramas odontograma/personal; prefijos/generos/tasas nulas-cero-string/listas/loading/credenciales/desactivacion PASS | PASS | CORREGIDO |
| fc885413-d6d2-4115-afa6-7d5d94430dce | javascript:S3358 | micodent-frontend/src/pages/AdministracionPersonal.jsx | 366 | Ternario en render de formulario/lista, prefijo, credenciales o detalle profesional | if/else o valor descriptivo/render helper local; mismo JSX, closures/handlers y textos | 4D todas ramas odontograma/personal; prefijos/generos/tasas nulas-cero-string/listas/loading/credenciales/desactivacion PASS | PASS | CORREGIDO |

- CHECKPOINT 4D: 26/36; ultimo OdontogramaEditor/AdministracionPersonal (8 S3358); tests frontend grupo 19/19 PASS; 4D 10/10 PASS; backend grupo 8/8 PASS. Dos ternarios de desactivacion ya resueltos antes de 4D; no cambiados. Helpers locales conservan closure de formulario. Actualizacion de huellas 4A/4B/4C pendiente tras validacion de todos los cambios.

| 9463a92c-38f3-4575-9457-79c1a1d9d4e4 | javascript:S3358 | micodent-frontend/src/pages/Agenda.jsx | 144 | Condiciones anidadas de vistas/lista o etiqueta de guardado | Helpers locales con if/return y etiquetas calculadas; mismas ramas y handlers | 4D matriz de vistas/guardado y huella JSX original Agenda/Pacientes; grupo 16/16 PASS | PASS | CORREGIDO |
| deb573ba-ebec-446b-8814-2750d51533d2 | javascript:S3358 | micodent-frontend/src/pages/Agenda.jsx | 146 | Condiciones anidadas de vistas/lista o etiqueta de guardado | Helpers locales con if/return y etiquetas calculadas; mismas ramas y handlers | 4D matriz de vistas/guardado y huella JSX original Agenda/Pacientes; grupo 16/16 PASS | PASS | CORREGIDO |
| acb6ce4d-cebe-4698-89fb-fc656373c3e3 | javascript:S3358 | micodent-frontend/src/pages/PacienteDetalle.jsx | 759 | Condiciones anidadas de vistas/lista o etiqueta de guardado | Helpers locales con if/return y etiquetas calculadas; mismas ramas y handlers | 4D matriz de vistas/guardado y huella JSX original Agenda/Pacientes; grupo 16/16 PASS | PASS | CORREGIDO |
| 6698d035-9c08-40b1-bfa3-001a0c5369d6 | javascript:S3358 | micodent-frontend/src/pages/PacienteDetalle.jsx | 1053 | Condiciones anidadas de vistas/lista o etiqueta de guardado | Helpers locales con if/return y etiquetas calculadas; mismas ramas y handlers | 4D matriz de vistas/guardado y huella JSX original Agenda/Pacientes; grupo 16/16 PASS | PASS | CORREGIDO |
| 330d4e50-80c3-4276-b486-1a65767a4a9d | javascript:S3358 | micodent-frontend/src/pages/Pacientes.jsx | 214 | Condiciones anidadas de vistas/lista o etiqueta de guardado | Helpers locales con if/return y etiquetas calculadas; mismas ramas y handlers | 4D matriz de vistas/guardado y huella JSX original Agenda/Pacientes; grupo 16/16 PASS | PASS | CORREGIDO |

- CHECKPOINT 4D: 31/36; ultimo Agenda/Pacientes/PacienteDetalle (5 S3358); tests frontend grupo 16/16 PASS; backend grupo previo 8/8 PASS. Rectificada clasificacion inicial erronea de FinanzasDashboard: ya resuelto previamente, comprobadas sus tres ramas; sin editarlo. Harness de JSX acotado a returns principales, sin cambiar handlers ni markup.

| c449a14a-3fba-46e7-a7ca-1a47055280f7 | javascript:S7721 | micodent-backend/src/services/browserTransport.js | 19 | Funcion usa solo constantes de modulo y argumentos, no captura db/opciones/secretos | Mover cuerpo intacto a modulo; contrato publico/locking/sql/errores y secretos por instancia conservados | Lectura cookie malformada/duplicada/longitudes; conexion explicita y revoke; sesiones/password existentes 23/23 PASS | PASS | CORREGIDO |
| 400ceea4-a712-412a-996d-efa4b925ff08 | javascript:S7721 | micodent-backend/src/services/session.service.js | 31 | Funcion usa solo constantes de modulo y argumentos, no captura db/opciones/secretos | Mover cuerpo intacto a modulo; contrato publico/locking/sql/errores y secretos por instancia conservados | Lectura cookie malformada/duplicada/longitudes; conexion explicita y revoke; sesiones/password existentes 23/23 PASS | PASS | CORREGIDO |
| 3466aaa9-295d-4bbe-a48f-527d3eeaa213 | javascript:S7721 | micodent-backend/src/services/session.service.js | 93 | Funcion usa solo constantes de modulo y argumentos, no captura db/opciones/secretos | Mover cuerpo intacto a modulo; contrato publico/locking/sql/errores y secretos por instancia conservados | Lectura cookie malformada/duplicada/longitudes; conexion explicita y revoke; sesiones/password existentes 23/23 PASS | PASS | CORREGIDO |
| baf4f08c-a4f3-4d1b-9fce-eb45495a0ba9 | javascript:S3800 | micodent-frontend/src/components/OrdenRadiografiaTab.jsx | 68 | calcularEdad solo se consume como texto JSX; vacio string y edad number | Edad retorna String(age), vacio intacto; aritmetica, fechas y texto conservados | Edad vacia/cumpleanos/invalidas; Rx existentes; frontend grupo 16/16 PASS | PASS | CORREGIDO |

- CHECKPOINT 4D: 35/36; ultimo S7721 sesiones (3) y S3800 edad Rx (1); tests frontend grupo 16/16 PASS; backend grupo 23/23 PASS. No se modifican secretos ni restricciones de sesion. Fixture de fechas usa hora local explicita para no depender del desfase UTC; calculo legado intacto.

| 1c45557d-29b8-4fbf-b40a-057890955f54 | javascript:S5693 | micodent-backend/src/config/multer.js | 47 | Hotspot pide revisar limite: 10 MiB explicitos, una imagen/PDF y staging disco; contenido/MIME/formato y autenticacion existentes | Sin cambiar limite ni protecciones: validacion contextual registrada. Tipos jpg/jpeg/png/gif/webp/pdf | HTTP Multer real en raiz temporal: JPEG sintetico 9 MiB aceptado y validStagedFile; 10 MiB+1 rechazado LIMIT_FILE_SIZE; MIME incoherente rechazado; staging vacio tras cada caso; grupo 14/14 PASS | PASS | FALSO_POSITIVO |

- CHECKPOINT 4D: 36/36; ultimo S5693 limite revisado y probado; tests backend archivos/4D 14/14 PASS; frontend Rx/4D 16/16 PASS. S5693 clasificado como hotspot sin defecto demostrado, no como eliminacion de alerta: 10 MiB clinicos acotados y probados; se conserva politica. Reanalisis y revision del hotspot en Sonar pendientes. Sin acceso a BD/almacen clinico real.

## Cierre de Familia 4D (2026-10-03)

ESTADO: COMPLETA; 36/36 clasificados: 32 CORREGIDO, 3 YA_RESUELTO_POR_CAMBIO_PREVIO, 1 FALSO_POSITIVO, 0 PENDIENTE_REVISION_JUSTIFICADA.
Rectificacion: la clave 46729b17-390b-4862-b615-6510e5781ca0 de FinanzasDashboard fue incluida con descripcion de keys en el primer checkpoint por error de seleccion. La fila se rectifico: EstadoPagoLaboratorio ya estaba extraido antes de 4D; sus tres ramas fueron verificadas; no se modifico el componente.

| REGLA | TOTAL | CORREGIDO | YA RESUELTO | FALSO POSITIVO | PENDIENTE |
| --- | --- | --- | --- | --- | --- |
| javascript:S3358 | 25 | 22 | 3 | 0 | 0 |
| javascript:S3800 | 1 | 1 | 0 | 0 | 0 |
| javascript:S4624 | 1 | 1 | 0 | 0 | 0 |
| javascript:S5689 | 1 | 1 | 0 | 0 | 0 |
| javascript:S5693 | 1 | 0 | 0 | 1 | 0 |
| javascript:S6479 | 3 | 3 | 0 | 0 | 0 |
| javascript:S6847 | 1 | 1 | 0 | 0 | 0 |
| javascript:S7721 | 3 | 3 | 0 | 0 | 0 |

VALIDACION AUTOMATIZADA:
- Backend: pruebas especificas sesiones/password 23/23 y archivos/4D 14/14 PASS; suite final npm test 102/102 PASS (96 existentes + 6 nuevas).
- Windows: suite con TEMP/TMP en directorio nuevo dentro de backend; variables restauradas al terminar. Arranque Windows PASS; ningun cambio al launcher ni servicios reales.
- Frontend: especificas agenda/4D 16/16 y Rx/4D 16/16 PASS; suite final npm test 91/91 PASS (77 existentes + 14 nuevas).
- Navegador Edge/Playwright ya instalado: fixture local aislado ConfirmModal PASS en 1280x720 y 390x844; foco inicial/retorno, Tab/Shift+Tab, Escape, Cancelar/Confirmar exactamente una vez, busy impide cierre, backdrop no cierra, scroll restaurado, tarjeta dentro del viewport, sin errores de pagina. Sin API/BD/datos reales; servidor y navegador cerrados.
- npm run build frontend PASS; 1834 modulos transformados.
- Sintaxis: 6 archivos backend con node --check PASS; 22 frontend JS/JSX/tests con parser PASS; importaciones necesarias ejercitadas por tests/build.
- git diff --check PASS.
- Huellas de guardas 4A (solo 3 archivos), 4B (solo 5), 4C (solo 2) actualizadas tras pruebas equivalentes de ramas, keys, sesion y JSX. No se eliminan assertions. Historias/MiPerfil y demas huellas intactas. Se corrigio un error de clave del harness 4C (usaba rutas en lugar de nombres), sin cambios funcionales.
- Se corrigio resolucion de importacion autorreferenciada de fixture virtual Vite y conteo de returns internos del harness; controles finales PASS. Estos fallos de harness no corresponden a regresiones de producto.

S5693: alerta de revision contextual, no un defecto demostrado. Mantener 10 MiB explicitos y un archivo, dos fields, tres parts y fieldSize 2048; tipos jpg/jpeg/png/gif/webp/pdf, rechazo MIME/extension, contenido validado por clinicalUpload y ruta autenticada. Prueba HTTP acepta JPEG sintetico de 9 MiB, rechaza 10 MiB+1 y MIME incompatible; comprueba eliminacion de staging rechazado. No se modifica multer.js en 4D ni se afirma capacidad ilimitada/concurrencia validada. Sonar puede seguir mostrando este hotspot hasta su revision contextual; no se cambio configuracion ni se ejecuto Sonar.

MANUAL CLINICA: PENDIENTE. Comprobar login, agenda dia/semana/mes, ficha/guardar tratamiento, odontograma, orden Rx e impresion, administracion y confirmacion de acciones usando datos de prueba. No sustituido por pruebas contra BD real.
REGRESIONES: ninguna detectada en pruebas ejecutadas; no equivalen a certificacion de toda la instalacion.

OBSERVACION PENDIENTE:
- Archivo micodent-frontend/src/components/OrdenRadiografiaTab.jsx, calcularEdad: fecha ISO sin hora se interpreta como UTC pero usa getDate/getMonth locales. Puede desplazar un dia el cumpleanos en zona -05. Es comportamiento legado conservado; fuera de S3800, cuyo cambio solo uniforma texto. Riesgo: edad mostrada alrededor de cumpleanos. Fase futura sugerida: correccion puntual de fechas con pruebas de zona horaria, previa autorizacion.
- Build: chunk JS 574.53 kB minificado supera aviso 500 kB; PASS, no optimizacion/code-splitting en este lote. Fase futura sugerida: rendimiento, previa autorizacion.

ARCHIVOS MODIFICADOS/CREADOS EN 4D (rutas relativas al worktree F:\ChatGPT\MICODENT — Sistema de Gestión Odontológica\MICODENT_DEV\.runtime\e09-agenda-api):
- docs/quality/sonar-family4d.csv
- docs/quality/CURRENT_TASK.md
- docs/quality/SONAR_REMEDIATION_LOG.md
- micodent-frontend/src/components/RxTeethPrint.jsx
- micodent-frontend/src/components/PiezaSelector.jsx
- micodent-frontend/src/pages/Dashboard.jsx
- micodent-frontend/tests/sonar-family4d.test.mjs
- micodent-backend/src/index.js
- micodent-backend/tests/unit/sonar-family4d.test.cjs
- micodent-frontend/src/components/ConfirmModal.jsx
- micodent-frontend/tests/accessibility.test.mjs
- micodent-backend/src/controllers/laboratorio.controller.js
- micodent-backend/src/utils/jsonFields.js
- micodent-frontend/src/utils/data.js
- micodent-frontend/src/utils/rxTeeth.js
- micodent-frontend/src/components/AgendaMes.jsx
- micodent-frontend/src/components/CitaModal.jsx
- micodent-frontend/src/components/SessionBoundary.jsx
- micodent-frontend/src/services/sessionState.js
- micodent-frontend/src/components/OdontogramaEditor.jsx
- micodent-frontend/src/pages/AdministracionPersonal.jsx
- micodent-frontend/src/pages/Agenda.jsx
- micodent-frontend/src/pages/Pacientes.jsx
- micodent-frontend/src/pages/PacienteDetalle.jsx
- micodent-backend/src/services/browserTransport.js
- micodent-backend/src/services/session.service.js
- micodent-frontend/src/components/OrdenRadiografiaTab.jsx
- micodent-frontend/tests/sonar-family4d.browser.mjs
- micodent-frontend/tests/sonar-family4a.test.mjs
- micodent-frontend/tests/sonar-family4b.test.mjs
- micodent-frontend/tests/sonar-family4c.test.mjs

Se preservan cambios anteriores. Sin dependencias nuevas, push, SQL, cambios .env, permisos, ejecucion Sonar, otras familias ni E01-E17. SIGUIENTE PASO RECOMENDADO: repetir SonarQube sobre codigo corregido y revisar hotspot S5693 con evidencia anterior. DETENIDO.

- CHECKPOINT POST: 74/84; grupo Historias.jsx (74 issues, causas consolidadas); frontend relacionado 32/32 PASS; grupo modal/Rx 16/16 PASS; pendientes 10. Ver POST_SONAR_DELTA.md para claves/causas. Siguiente: Inspeccionar los tres S3358 POST en usuarios.controller.js y session.service.js; preservar comparacion lexicografica y locking; pruebas especificas..

- CHECKPOINT POST: 77/84; grupo Comparadores de usuarios y sesiones; Backend especifico 21/21 PASS.; pendientes 7. Ver POST_SONAR_DELTA.md para claves/causas. Siguiente: Inspeccionar AdministracionPersonal: S3776 y S3800; separar solo una unidad de presentacion y conservar operaciones..

- CHECKPOINT POST: 79/84; grupo Administracion de personal; Frontend relacionado 29/29 PASS.; pendientes 5. Ver POST_SONAR_DELTA.md para claves/causas. Siguiente: Inspeccionar los S3776 de FinanzasDashboard y PacienteDetalle, conservando calculos y datos clinicos..

- CHECKPOINT POST: 81/84; grupo Complejidad de finanzas e historia del paciente; Frontend relacionado 59/59 PASS.; pendientes 3. Ver POST_SONAR_DELTA.md para claves/causas. Siguiente: Corregir los dos avisos del contenedor de acciones de Pacientes; comprobar mouse, teclado, touch y propagacion..

- CHECKPOINT POST: 83/84; grupo Accesibilidad del contenedor de acciones; Frontend relacionado 38/38 PASS; navegador 2/2 viewports PASS.; pendientes 1. Ver POST_SONAR_DELTA.md para claves/causas. Siguiente: Revisar contextual S5693 conservando 10 MiB; despues suites completas frontend/backend y build..

- CHECKPOINT POST: 84/84; grupo Revision contextual de S5693; Multer especifico 1/1 PASS.; pendientes 0. Ver POST_SONAR_DELTA.md para claves/causas. Siguiente: Ejecutar suites completas frontend/backend (TEMP/TMP aislados), build y contabilizacion 84/84; finalizar documentos..

## Cierre POST-Sonar delta

- 84/84 claves del nuevo CSV clasificadas: 83 CORREGIDO; 0 YA_NO_APLICABLE; 1 CONTEXTUAL_REVIEWED (S5693); 0 pendientes. E13 y Familias 1-4D no reprocesados.
- Frontend 97/97 PASS; backend 103/103 PASS con TEMP/TMP aislados, incluida prueba real Windows; frontend build PASS; sintaxis backend y git diff --check PASS.
- Navegador sintetico Pacientes desktop/mobile PASS: mouse, teclado, touch, padding, archivo/reactivacion y acciones unicas; sin API/BD real. Detalle por clave y pruebas en POST_SONAR_DELTA.md.
- Guardas anteriores preservadas y adaptadas al delta autorizado: extraccion de JSX comprobada por reconstruccion AST, operaciones/roles intactos. La expectativa antigua de accesibilidad sobre el contenedor con stopPropagation se reemplazo por el contenedor pasivo; prueba conservada y propagacion probada, no una regresion funcional.
- Se mantiene limite clinico 10 MiB y aviso de bundle >500 kB; no cambios fuera de alcance. Revision contextual local, sin modificar estado de SonarQube.
- Pendiente manual: reporte/redirecciones HC, operaciones de personal, modal nuevo/editar tratamiento/POS, resumen de caja. No declarar prueba con datos reales.
- ESTADO: COMPLETO - LISTO_PARA_REANALISIS_SONAR. Siguiente: repetir SonarQube cuando el usuario autorice. No ejecutado Sonar ni push; no iniciadas otras fases.

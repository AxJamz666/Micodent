# MICODENT - Plan de cobertura y pruebas

FASE: ACADEMIC_TESTS_60_COMPLETE
FECHA: 2026-10-03
ESTADO: P1, P2 Y LOTES A/B/C VALIDADOS; 60/60 CASOS CON LIMITES DOCUMENTADOS; QUALITY GATE PASSED POST P2 INFORMADO POR EL USUARIO
RAIZ VERIFICADA: F:\ChatGPT\MICODENT — Sistema de Gestión Odontológica\MICODENT_DEV\.runtime\e09-agenda-api
REFERENCIA GIT: HEAD bbc15f187b1191169aafc3e8c651da38f9348f17 + cambios locales actuales.
ALCANCE: cobertura y entrega academica, independiente de E01-E17.

## 1. Baseline y evidencia

| Medida | Frontend | Backend |
| --- | ---: | ---: |
| Tests validados previamente | 97/97 PASS | 103/103 PASS |
| Statements | 4.90% | 34.81% |
| Branches | 81.58% | 86.48% |
| Functions | 54.02% | 37.16% |
| Lines | 4.90% | 34.81% |
| Archivos LCOV | 43 | 42 |
| Lineas DA / cubiertas / no cubiertas | 7358 / 361 / 6997 | 3746 / 1304 / 2442 |
| Reporte existente | micodent-frontend/coverage/lcov.info | micodent-backend/coverage/lcov.info |

Build frontend: PASS en baseline anterior. Suites/build NO repetidos para este plan.
Ambos reportes existentes se procesaron programaticamente: 85 registros SF, todos resuelven bajo los dos src. No se editaron ni regeneraron LCOV.

Estado Sonar informado por el usuario, no consultado nuevamente: Overall 18.2%; New Code 0.8%; 239 New Lines to Cover; requisito >=80%; 0 nuevos issues; 0 duplicaciones New Code; 0 issues abiertos de seguridad/fiabilidad/mantenibilidad; 0 hotspots; 1 aceptado S5693 contextual. Gate falla solo por cobertura nueva.

La baseline local corresponde a fuente completa; no es el porcentaje New Code ni debe promediarse para sustituir el calculo de Sonar.

Fuentes: CURRENT_TASK.md, SONAR_REMEDIATION_LOG.md, sonar-project.properties, package.json/configuracion c8 de ambos paquetes, inventario de tests, LCOV, git status/diff y componentes/controladores concretos. No se reprocesaron los CSV ni las correcciones anteriores.

## 2. Lectura correcta de la cobertura

- La columna "lineas ejecutables" siguiente contiene lineas DA reportadas por LCOV/c8, no una clasificacion AST ni necesariamente las mismas lines_to_cover de Sonar.
- c8 usa all=true. Un JSX no cargado recibe un empty-report: lineas a cero, una funcion y una rama sinteticas. Ese 1/1 NO representa las funciones o decisiones reales del componente.
- Branches/Functions elevados con Lines bajas NO demuestran buena cobertura clinica. Funciones nunca invocadas pueden carecer de ramas detalladas en la salida V8.
- Las pruebas AST, hashes de codigo y fragmentos VM protegen equivalencia, pero no se acreditan como ejecucion real del componente/controlador original. No falsear filenames ni editar SF/DA para acreditarlas.
- Pruebas browser.mjs y integration.cjs fuera del comando unitario no se cuentan automaticamente entre 97/103 ni en LCOV. Cypress futuro requiere una integracion explicita para aportar cobertura; no se promete que generara LCOV por defecto.
- Cobertura mide ejecucion, no garantiza aserciones, concurrencia, rendimiento, recuperacion de backups ni aptitud para produccion.

## 3. Analisis completo por archivo

Rutas relativas a la raiz verificada anterior. Porcentaje de lineas = DA con hits > 0 / DA totales. FN y BR no cubiertos se toman del LCOV, con la limitacion empty-report ya descrita.

### micodent-frontend

| Archivo | Lineas ejecutables (LCOV) | Cubiertas | No cubiertas | % | Funciones no cubiertas | Branches no cubiertos |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| micodent-frontend/src/App.jsx | 57 | 0 | 57 | 0% | 1 | 1 |
| micodent-frontend/src/components/AgendaDia.jsx | 88 | 0 | 88 | 0% | 1 | 1 |
| micodent-frontend/src/components/AgendaMes.jsx | 61 | 0 | 61 | 0% | 1 | 1 |
| micodent-frontend/src/components/AgendaSemana.jsx | 70 | 0 | 70 | 0% | 1 | 1 |
| micodent-frontend/src/components/AppErrorBoundary.jsx | 19 | 0 | 19 | 0% | 1 | 1 |
| micodent-frontend/src/components/CitaModal.jsx | 271 | 0 | 271 | 0% | 1 | 1 |
| micodent-frontend/src/components/ClinicalImage.jsx | 45 | 0 | 45 | 0% | 1 | 1 |
| micodent-frontend/src/components/ConfiguracionPos.jsx | 36 | 0 | 36 | 0% | 1 | 1 |
| micodent-frontend/src/components/ConfirmModal.jsx | 70 | 0 | 70 | 0% | 1 | 1 |
| micodent-frontend/src/components/Diente.jsx | 34 | 0 | 34 | 0% | 1 | 1 |
| micodent-frontend/src/components/FirmaMiniBlock.jsx | 51 | 0 | 51 | 0% | 1 | 1 |
| micodent-frontend/src/components/MetodoPago.jsx | 19 | 0 | 19 | 0% | 1 | 1 |
| micodent-frontend/src/components/ModalDialog.jsx | 17 | 0 | 17 | 0% | 1 | 1 |
| micodent-frontend/src/components/OdontogramaEditor.jsx | 325 | 0 | 325 | 0% | 1 | 1 |
| micodent-frontend/src/components/OrdenRadiografiaTab.jsx | 586 | 0 | 586 | 0% | 1 | 1 |
| micodent-frontend/src/components/PiezaSelector.jsx | 33 | 0 | 33 | 0% | 1 | 1 |
| micodent-frontend/src/components/PrintPortal.jsx | 5 | 0 | 5 | 0% | 1 | 1 |
| micodent-frontend/src/components/RecetarioTab.jsx | 295 | 0 | 295 | 0% | 1 | 1 |
| micodent-frontend/src/components/RxTeethPrint.jsx | 31 | 0 | 31 | 0% | 1 | 1 |
| micodent-frontend/src/components/SessionBoundary.jsx | 76 | 0 | 76 | 0% | 1 | 1 |
| micodent-frontend/src/layouts/MainLayout.jsx | 106 | 0 | 106 | 0% | 1 | 1 |
| micodent-frontend/src/pages/AdministracionPersonal.jsx | 565 | 0 | 565 | 0% | 1 | 1 |
| micodent-frontend/src/pages/Agenda.jsx | 171 | 0 | 171 | 0% | 1 | 1 |
| micodent-frontend/src/pages/Dashboard.jsx | 290 | 0 | 290 | 0% | 1 | 1 |
| micodent-frontend/src/pages/FinanzasDashboard.jsx | 661 | 0 | 661 | 0% | 1 | 1 |
| micodent-frontend/src/pages/Historias.jsx | 528 | 0 | 528 | 0% | 1 | 1 |
| micodent-frontend/src/pages/Login.jsx | 115 | 0 | 115 | 0% | 1 | 1 |
| micodent-frontend/src/pages/MiPerfil.jsx | 414 | 0 | 414 | 0% | 1 | 1 |
| micodent-frontend/src/pages/PacienteDetalle.jsx | 1275 | 0 | 1275 | 0% | 1 | 1 |
| micodent-frontend/src/pages/Pacientes.jsx | 305 | 0 | 305 | 0% | 1 | 1 |
| micodent-frontend/src/pages/Produccion.jsx | 76 | 0 | 76 | 0% | 1 | 1 |
| micodent-frontend/src/services/api.js | 180 | 0 | 180 | 0% | 1 | 1 |
| micodent-frontend/src/services/browserSession.js | 8 | 0 | 8 | 0% | 1 | 1 |
| micodent-frontend/src/services/session.js | 20 | 20 | 0 | 100% | 0 | 0 |
| micodent-frontend/src/services/sessionState.js | 114 | 114 | 0 | 100% | 1 | 4 |
| micodent-frontend/src/utils/agendaUtils.js | 108 | 71 | 37 | 65.74% | 4 | 0 |
| micodent-frontend/src/utils/data.js | 40 | 40 | 0 | 100% | 0 | 2 |
| micodent-frontend/src/utils/financeEvents.js | 12 | 12 | 0 | 100% | 0 | 1 |
| micodent-frontend/src/utils/modalFocus.js | 72 | 70 | 2 | 97.22% | 0 | 2 |
| micodent-frontend/src/utils/passwordPolicy.js | 9 | 9 | 0 | 100% | 0 | 0 |
| micodent-frontend/src/utils/printDocument.js | 21 | 0 | 21 | 0% | 1 | 1 |
| micodent-frontend/src/utils/rxTeeth.js | 25 | 25 | 0 | 100% | 0 | 0 |
| micodent-frontend/src/utils/tratamientosDb.js | 54 | 0 | 54 | 0% | 1 | 1 |

### micodent-backend

| Archivo | Lineas ejecutables (LCOV) | Cubiertas | No cubiertas | % | Funciones no cubiertas | Branches no cubiertos |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| micodent-backend/src/config/browserTransport.js | 5 | 5 | 0 | 100% | 0 | 1 |
| micodent-backend/src/config/db.js | 21 | 21 | 0 | 100% | 0 | 0 |
| micodent-backend/src/config/environment.js | 21 | 19 | 2 | 90.48% | 0 | 4 |
| micodent-backend/src/config/multer.js | 51 | 36 | 15 | 70.59% | 3 | 2 |
| micodent-backend/src/controllers/auditoria.controller.js | 20 | 7 | 13 | 35% | 1 | 0 |
| micodent-backend/src/controllers/auth.controller.js | 42 | 38 | 4 | 90.48% | 1 | 4 |
| micodent-backend/src/controllers/citas.controller.js | 214 | 26 | 188 | 12.15% | 15 | 0 |
| micodent-backend/src/controllers/cobros.controller.js | 87 | 15 | 72 | 17.24% | 0 | 0 |
| micodent-backend/src/controllers/dashboard.controller.js | 219 | 25 | 194 | 11.42% | 5 | 0 |
| micodent-backend/src/controllers/gastos.controller.js | 253 | 36 | 217 | 14.23% | 8 | 0 |
| micodent-backend/src/controllers/historias.controller.js | 1014 | 129 | 885 | 12.72% | 21 | 0 |
| micodent-backend/src/controllers/laboratorio.controller.js | 104 | 24 | 80 | 23.08% | 2 | 0 |
| micodent-backend/src/controllers/pacientes.controller.js | 329 | 32 | 297 | 9.73% | 7 | 0 |
| micodent-backend/src/controllers/pos.controller.js | 34 | 10 | 24 | 29.41% | 2 | 0 |
| micodent-backend/src/controllers/produccion.controller.js | 56 | 6 | 50 | 10.71% | 2 | 0 |
| micodent-backend/src/controllers/usuarios.controller.js | 196 | 59 | 137 | 30.1% | 9 | 2 |
| micodent-backend/src/index.js | 235 | 151 | 84 | 64.26% | 1 | 1 |
| micodent-backend/src/middleware/auth.js | 27 | 25 | 2 | 92.59% | 1 | 0 |
| micodent-backend/src/middleware/limitarAutenticacion.js | 42 | 24 | 18 | 57.14% | 1 | 0 |
| micodent-backend/src/routes/auditoria.routes.js | 7 | 7 | 0 | 100% | 0 | 0 |
| micodent-backend/src/routes/auth.routes.js | 12 | 12 | 0 | 100% | 0 | 0 |
| micodent-backend/src/routes/citas.routes.js | 10 | 10 | 0 | 100% | 0 | 0 |
| micodent-backend/src/routes/dashboard.routes.js | 16 | 16 | 0 | 100% | 0 | 0 |
| micodent-backend/src/routes/gastos.routes.js | 15 | 15 | 0 | 100% | 0 | 0 |
| micodent-backend/src/routes/historias.routes.js | 57 | 53 | 4 | 92.98% | 0 | 0 |
| micodent-backend/src/routes/laboratorio.routes.js | 12 | 12 | 0 | 100% | 0 | 0 |
| micodent-backend/src/routes/pacientes.routes.js | 24 | 19 | 5 | 79.17% | 1 | 0 |
| micodent-backend/src/routes/usuarios.routes.js | 20 | 20 | 0 | 100% | 0 | 0 |
| micodent-backend/src/services/accessPolicy.js | 25 | 25 | 0 | 100% | 0 | 0 |
| micodent-backend/src/services/browserTransport.js | 71 | 71 | 0 | 100% | 0 | 3 |
| micodent-backend/src/services/clinicalFiles.js | 54 | 54 | 0 | 100% | 0 | 5 |
| micodent-backend/src/services/clinicalUpload.js | 20 | 20 | 0 | 100% | 0 | 4 |
| micodent-backend/src/services/finanzas.js | 88 | 24 | 64 | 27.27% | 4 | 0 |
| micodent-backend/src/services/operacionFinanciera.js | 21 | 7 | 14 | 33.33% | 0 | 0 |
| micodent-backend/src/services/password.service.js | 46 | 44 | 2 | 95.65% | 0 | 1 |
| micodent-backend/src/services/security.js | 4 | 4 | 0 | 100% | 0 | 0 |
| micodent-backend/src/services/session.service.js | 175 | 131 | 44 | 74.86% | 4 | 10 |
| micodent-backend/src/utils/auditoriaFinanciera.js | 14 | 9 | 5 | 64.29% | 1 | 0 |
| micodent-backend/src/utils/auditoriaSeguridad.js | 12 | 7 | 5 | 58.33% | 1 | 0 |
| micodent-backend/src/utils/fecha.js | 24 | 13 | 11 | 54.17% | 3 | 0 |
| micodent-backend/src/utils/jsonFields.js | 19 | 19 | 0 | 100% | 0 | 0 |
| micodent-backend/src/utils/securityError.js | 30 | 24 | 6 | 80% | 0 | 3 |

## 4. Brechas principales y prioridad New Code

El git diff se inspecciono frente a HEAD junto con el log de familias. La tabla cruza lineas anadidas actuales con DA sin hits. Es un INDICADOR LOCAL, no la lista de las 239 lineas nuevas de Sonar: extracciones/movimientos y periodo de New Code pueden diferir. Untracked se trata como archivo nuevo solo en este indicador. No se decide cobertura contando imports, llaves o etiquetas.

| Archivo | Lineas DA sin cubrir | Anadidas locales con DA=0 | Lineas locales correspondientes | Casos vinculados |
| --- | ---: | ---: | --- | --- |
| micodent-frontend/src/pages/AdministracionPersonal.jsx | 565 | 222 | 19-218,274,285-287,317-318,361,438-447,524,551,556-558 | F01, F02, F03 |
| micodent-frontend/src/pages/PacienteDetalle.jsx | 1275 | 189 | 13,106-230,396-397,436-437,458-459,469-470,480-481,605-606,651-652,658,668,679,682,713-714,767-768,802,814-815,819-820,824-825,829-830,834-835,840-841,848-849,860-861,865-866,870-871,881,937-941,965,977,1080,1084,1094,1098,1111,1115,1146,1163,1192,1196,1224,1260 | F07, F08, F09, F10, F11 |
| micodent-frontend/src/pages/Pacientes.jsx | 305 | 90 | 61-62,136-222,298 | F04, F05, F06 |
| micodent-frontend/src/pages/FinanzasDashboard.jsx | 661 | 88 | 4,18-56,133,252,306-307,310-311,319-320,341,344-346,372-375,405,453,508-509,513-515,525,533-534,539,541-542,547-548,553-554,558-559,568,572,581-582,590-591,595-596,601-602,608,612,647 | F12, F13, F14, F15 |
| micodent-frontend/src/components/OdontogramaEditor.jsx | 325 | 43 | 15-17,128-165,182,237 | F18 |
| micodent-frontend/src/components/CitaModal.jsx | 271 | 22 | 1,19,21,180,189,208-209,213-214,220-221,226-227,236-237,241-242,250-251,254,260,263 | F17 |
| micodent-frontend/src/pages/Historias.jsx | 528 | 21 | 9,34-42,133,140,156,159-160,236,240-241,272,428,513 | F26 |
| micodent-frontend/src/pages/Agenda.jsx | 171 | 19 | 46,112-128,157 | F16, F17 |
| micodent-frontend/src/components/ModalDialog.jsx | 17 | 17 | 1-17 | F20, F21 |
| micodent-frontend/src/components/OrdenRadiografiaTab.jsx | 586 | 12 | 9,76,102-103,106,112,380,393,397,418,422,457 | F22 |
| micodent-backend/src/controllers/gastos.controller.js | 217 | 12 | 42,46,55,65,88,103,113-114,150,185,227,239 | B25, B26 |
| micodent-backend/src/controllers/historias.controller.js | 885 | 11 | 223,475,516,539,549,567,578,587,599,685,740 | B11, B12, B13, B14, B15, B17 |
| micodent-backend/src/controllers/usuarios.controller.js | 137 | 9 | 8-12,24,79,118,188 | B03, B04, B05, B06, B07 |
| micodent-frontend/src/pages/MiPerfil.jsx | 414 | 8 | 3-4,177-178,195,221,245,286 | F24 |
| micodent-frontend/src/components/SessionBoundary.jsx | 76 | 8 | 47-53,65 | F25 |
| micodent-frontend/src/components/RecetarioTab.jsx | 295 | 7 | 7,141,155,159,180,184,225 | F23 |
| micodent-backend/src/controllers/dashboard.controller.js | 194 | 7 | 39,142-143,146,149,168,197 | B29, B30 |
| micodent-frontend/src/components/Diente.jsx | 34 | 7 | 11-15,26,34 | F19 |
| micodent-frontend/src/components/AgendaDia.jsx | 88 | 6 | 48-49,51-52,55-56 | F16 |
| micodent-backend/src/controllers/laboratorio.controller.js | 80 | 6 | 22,24-27,55 | B27, B28 |
| micodent-frontend/src/components/ConfirmModal.jsx | 70 | 6 | 2,38-41,66 | F03, F05, F21 |
| micodent-backend/src/services/session.service.js | 44 | 6 | 22-26,149 | B01, B03, B04 |
| micodent-backend/src/controllers/pacientes.controller.js | 297 | 5 | 88,112,209,250,324 | B08, B09, B10 |
| micodent-frontend/src/components/ConfiguracionPos.jsx | 36 | 4 | 5,25-26,34 | F11 |
| micodent-frontend/src/pages/Dashboard.jsx | 290 | 3 | 106,199-200 | F27 |
| micodent-frontend/src/components/ClinicalImage.jsx | 45 | 3 | 24,34,36 | F09 |
| micodent-frontend/src/components/RxTeethPrint.jsx | 31 | 3 | 13-14,20 | F22 |
| micodent-frontend/src/services/api.js | 180 | 2 | 49,61 | F29, F30 |
| micodent-frontend/src/components/AgendaMes.jsx | 61 | 2 | 26,35 | F16 |
| micodent-frontend/src/utils/modalFocus.js | 2 | 2 | 69-70 | F20 |
| micodent-frontend/src/pages/Produccion.jsx | 76 | 1 | 57 | Sin caso nuevo dedicado: revisar solo si aparece entre las 239 lineas Sonar |
| micodent-frontend/src/components/AgendaSemana.jsx | 70 | 1 | 39 | F16 |
| micodent-frontend/src/components/PiezaSelector.jsx | 33 | 1 | 12 | F19 |
| micodent-frontend/src/components/MetodoPago.jsx | 19 | 1 | 17 | F10, F11 |

Los mayores bloques sin ejecucion son PacienteDetalle (1275 DA), FinanzasDashboard (661), OrdenRadiografiaTab (586), AdministracionPersonal (565), Historias (528), MiPerfil (414) y OdontogramaEditor (325). Backend: historias.controller (885), pacientes.controller (297), gastos.controller (217), dashboard.controller (194), citas.controller (188). Son brechas de fuente completa, no asignaciones de New Code.

Prioridad por evidencia:
- POST: FormularioPersonal/TarjetaPersonal, ModalTratamiento, indicadores de caja, renderPatientList/acciones de fila, reporte vivo de Historias y comparadores de IDs.
- Familias 3/4D: ModalDialog/foco y ConfirmModal; labels, botones nativos, slots de agenda, selectores/piezas RX, estado del boundary.
- Familias 4C/4D: errores sanitizados, parseos y estados en controladores/lecturas de pacientes, historias, usuarios, gastos, laboratorio y dashboard; helpers de sesion ya parcialmente cubiertos.
- Helpers rxTeeth/data/financeEvents ya estan al 100% de lineas: reutilizar su evidencia y probar sus consumidores, no duplicar el mismo test.
- No se crean pruebas de los handlers legacy eliminados de Historias; solo reporte, efectos, redirecciones y UI viva. No anadir tests por imports muertos ni configuracion trivial.

### Infraestructura futura minima

Backend mantiene node:test/CommonJS, c8 y TEMP/TMP aislados. Reutilizar tests/helpers/cookie-app.cjs para la app Express real: interceptar exclusivamente frontera DB/configuracion privada y servicios externos. Ampliar fixture sintetico por consultas verificadas; invocar controladores originales, no copias VM. Aserciones sobre respuestas, payloads SQL, transaccion/auditoria y cero escrituras en rechazos. Tests HTTP pueden mantener el cliente existente; Supertest es una opcion para cookies/status/headers si simplifica el lote, no requisito de instalar ahora.

Frontend mantiene node:test/.test.mjs y c8. Los componentes JSX necesitan DOM, resolucion de imports/assets y transformacion JSX con sourcemaps. React Testing Library sirve para montar e interactuar, pero no proporciona por si sola DOM/transpilacion. RTL/DOM/Supertest no estan instalados actualmente; no se instala nada en esta fase.

Antes de un lote frontend grande: aprobar una prueba de viabilidad de infraestructura con un componente real pequeno (F21), sin reemplazar runner. Reutilizar transformador de la toolchain si es compatible; solo agregar devDependencies minimas cuando se demuestre necesidad. Comprobar que LCOV SF apunta al src original y DA cambia en las lineas efectivamente ejercitadas, no solo en una copia compilada. Si el bridge no funciona, documentar bloqueo tecnico antes de prometer cobertura. No editar manualmente LCOV ni simular ejecucion con eval de fragmentos.

En componentes: mock de frontera API/router/sesion y spies de toast/impresion; mantener componentes hijos reales para el comportamiento bajo prueba. Deferred promises para success/error/respuestas invertidas; relojes controlados para debounce/polling. Limpiar DOM, listeners, timers, mocks, storage y portals despues de cada caso. Nunca montar fuentes que conecten a la BD real.

Fuentes de herramientas: [node:test en Node 24](https://nodejs.org/docs/latest-v24.x/api/test.html), [setup React Testing Library](https://testing-library.com/docs/react-testing-library/setup/), [Supertest oficial](https://github.com/forwardemail/supertest). La compatibilidad exacta del bridge Node24/JSX/c8 debe demostrarse localmente, no se da por hecha.

## 5. Catalogo academico: exactamente 60 casos

30 backend + 30 frontend. Son CASOS LOGICOS, no 60 tests nuevos ni el contador automatico del runner. Un caso con feliz/error/borde puede necesitar subtests. Cada fila tiene resultado verificable y trazabilidad al codigo real.

- P1: 41 casos con alta probabilidad de cubrir cambios; confirmar contra detalle New Code.
- P2: 14 casos clinicos/financieros importantes aunque no todos sean nuevos para Sonar.
- P3: 5 casos ya ejercitados que se reutilizan para completar evidencia academica.
- REUTILIZAR: no reescribir; vincular ejecucion existente a la ficha academica. AMPLIAR: conservar test actual y anadir ejecucion original/aserciones faltantes. NUEVO: comportamiento aun no ejercitado de esa forma.
- Todos son TEST AUTOMATIZADO RETROACTIVO respecto del codigo existente; no llamarlos TDD.
- El resultado esperado describe el contrato comprobado o requisito a verificar, no una afirmacion de PASS. Si un nuevo test descubre discrepancia, documentar y pedir alcance de bugfix separado; no cambiar funcionalidad para obtener cobertura.
- Datos: cuentas/IDs/DNI/firmas/RX completamente sinteticos y temporales. Sin secretos, pacientes reales ni equipos de Edy/Miguel/Gabriela.
- Impacto ALTO/MEDIO/BAJO es estimacion cualitativa de nuevas lineas/ramas realmente ejercitadas; no promesa porcentual.

### Backend: B01-B30

#### B01 - Sesion

TIPO: API. CAMINO: FELIZ. IMPACTO COVERAGE: BAJO. PRIORIDAD: P3. ORIGEN: REUTILIZAR.

OBJETIVO: Login con cookie y bootstrap de pestana.

ARCHIVOS OBJETIVO: `micodent-backend/src/controllers/auth.controller.js`; `micodent-backend/src/services/session.service.js`.

RESULTADO / APROBACION: HttpOnly host-only; sin JWT en JSON; identidad verificada.

TRAZABILIDAD EXISTENTE: micodent-backend/tests/unit/cookie-transport.test.js: login only returns; a fresh tab can bootstrap. No anadir duplicado; registrar evidencia del test ya existente.

#### B02 - Seguridad

TIPO: API. CAMINO: ERROR. IMPACTO COVERAGE: BAJO. PRIORIDAD: P3. ORIGEN: REUTILIZAR.

OBJETIVO: Rechazo de CSRF ausente y permisos insuficientes.

ARCHIVOS OBJETIVO: `micodent-backend/src/middleware/auth.js`; `micodent-backend/src/services/browserTransport.js`; `micodent-backend/src/services/accessPolicy.js`.

RESULTADO / APROBACION: Ninguna mutacion alcanza el controlador sin CSRF; la cookie no concede administracion.

TRAZABILIDAD EXISTENTE: micodent-backend/tests/unit/cookie-transport.test.js: CSRF is bound; cookie identity does not grant administrative permissions. No anadir duplicado; registrar evidencia del test ya existente.

#### B03 - Sesiones/usuarios

TIPO: INTEGRACION. CAMINO: FELIZ/ERROR/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Restablecimiento y reactivacion administrativa con validacion de actor/objetivo.

ARCHIVOS OBJETIVO: `micodent-backend/src/controllers/usuarios.controller.js`; `micodent-backend/src/services/session.service.js`.

RESULTADO / APROBACION: Cambiar solo cuenta autorizada; revocar sesiones previas y auditar; credencial administrativa incorrecta o jerarquia no permitida no produce cambios.

#### B04 - Usuarios

TIPO: INTEGRACION. CAMINO: FELIZ/ERROR/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: AMPLIAR.

OBJETIVO: Edicion/desactivacion y locks ordenados de IDs.

ARCHIVOS OBJETIVO: `micodent-backend/src/controllers/usuarios.controller.js`; `micodent-backend/src/services/session.service.js`.

RESULTADO / APROBACION: IDs invertidos/iguales mantienen orden y deduplicacion; nivel igual/superior rechazado; error fuerza rollback; historial no se borra.

TRAZABILIDAD EXISTENTE: micodent-backend/tests/unit/sonar-post-delta.test.cjs: POST S3358 preserves relational user ID ordering. No sustituir guardas anteriores; ejercer el modulo fuente real.

#### B05 - Usuarios

TIPO: API. CAMINO: FELIZ/ERROR/BORDE. IMPACTO COVERAGE: MEDIO. PRIORIDAD: P2. ORIGEN: NUEVO.

OBJETIVO: Alta de usuario y limites de comision/contrasena.

ARCHIVOS OBJETIVO: `micodent-backend/src/controllers/usuarios.controller.js`; `micodent-backend/src/services/password.service.js`.

RESULTADO / APROBACION: Alta valida almacena hash, nunca texto plano; comision fuera de 0..100 y password invalido rechazados; no otorgar nivel superior al permitido.

#### B06 - Firma y sello

TIPO: INTEGRACION. CAMINO: FELIZ/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Autoservicio conserva campo omitido y solo modifica al actor.

ARCHIVOS OBJETIVO: `micodent-backend/src/controllers/usuarios.controller.js`.

RESULTADO / APROBACION: Actualizar solo firma conserva sello; valor explicito vacio lo limpia; sin cambios no hay UPDATE/auditoria; ID ajeno del payload no cambia destinatario.

#### B07 - Lecturas usuarios

TIPO: API. CAMINO: FELIZ/ERROR. IMPACTO COVERAGE: MEDIO. PRIORIDAD: P1. ORIGEN: AMPLIAR.

OBJETIVO: Listas de personal/doctores y fallo DB.

ARCHIVOS OBJETIVO: `micodent-backend/src/controllers/usuarios.controller.js`.

RESULTADO / APROBACION: Doctores solo activos; proyeccion sin password; error conserva respuesta fija sin SQL/credenciales y registro sanitizado.

TRAZABILIDAD EXISTENTE: micodent-backend/tests/unit/sonar-family4c.test.cjs: lecturas actuales mediante VM. No sustituir guardas anteriores; ejercer el modulo fuente real.

#### B08 - Pacientes

TIPO: INTEGRACION. CAMINO: FELIZ/ERROR. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: AMPLIAR.

OBJETIVO: Alta coordinada paciente/HC/antecedentes/apoderado.

ARCHIVOS OBJETIVO: `micodent-backend/src/controllers/pacientes.controller.js`.

RESULTADO / APROBACION: 201 con id/historiaId/nroHistoria; auditorias en misma transaccion; fallo intermedio rollback y release sin filas parciales.

TRAZABILIDAD EXISTENTE: micodent-backend/tests/unit/sonar-family4c.test.cjs: creacion/edicion mediante VM. No sustituir guardas anteriores; ejercer el modulo fuente real.

#### B09 - Pacientes

TIPO: API. CAMINO: ERROR/BORDE. IMPACTO COVERAGE: MEDIO. PRIORIDAD: P1. ORIGEN: AMPLIAR.

OBJETIVO: DNI duplicado y nacimiento invalido.

ARCHIVOS OBJETIVO: `micodent-backend/src/controllers/pacientes.controller.js`.

RESULTADO / APROBACION: DNI existente devuelve 400; ano fuera de limites o fecha invalida rechazada; rollback y ausencia de INSERT definitivo.

TRAZABILIDAD EXISTENTE: micodent-backend/tests/unit/sonar-family4c.test.cjs: alta con errores mediante VM. No sustituir guardas anteriores; ejercer el modulo fuente real.

#### B10 - Pacientes

TIPO: INTEGRACION. CAMINO: FELIZ/ERROR. IMPACTO COVERAGE: MEDIO. PRIORIDAD: P2. ORIGEN: NUEVO.

OBJETIVO: Archivo/reactivacion y proyeccion de lista.

ARCHIVOS OBJETIVO: `micodent-backend/src/controllers/pacientes.controller.js`; `micodent-backend/src/routes/pacientes.routes.js`.

RESULTADO / APROBACION: Archivo logico paciente/HC conservando historia; reactivacion recupera acceso; IDs invalidos rechazados por middleware sin consulta.

#### B11 - Historias

TIPO: API. CAMINO: FELIZ/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Carga completa con JSON/DECIMAL de MySQL/MariaDB.

ARCHIVOS OBJETIVO: `micodent-backend/src/controllers/historias.controller.js`; `micodent-backend/src/utils/jsonFields.js`.

RESULTADO / APROBACION: Historia, evolucion, pagos, anexos y documentos conservan IDs/valores; JSON objeto/texto/malformado usa contrato actual sin enumerar caracteres.

#### B12 - Antecedentes

TIPO: INTEGRACION. CAMINO: FELIZ/ERROR. IMPACTO COVERAGE: MEDIO. PRIORIDAD: P2. ORIGEN: NUEVO.

OBJETIVO: Guardado de triaje/antecedentes y auditoria.

ARCHIVOS OBJETIVO: `micodent-backend/src/controllers/historias.controller.js`.

RESULTADO / APROBACION: Campos enviados se conservan con auditoria; fallo DB cierra transaccion y devuelve error fijo sin inventar exito.

#### B13 - Evolucion

TIPO: API. CAMINO: FELIZ/ERROR/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P2. ORIGEN: NUEVO.

OBJETIVO: Inmutabilidad firmada y correccion por adenda.

ARCHIVOS OBJETIVO: `micodent-backend/src/controllers/historias.controller.js`.

RESULTADO / APROBACION: Editar bloqueada devuelve 409 sin UPDATE; adenda con motivo/contenido en firmada devuelve 201; ausente 404, adenda incompleta o no firmada 400.

#### B14 - Orden RX/receta

TIPO: API. CAMINO: FELIZ/BORDE. IMPACTO COVERAGE: MEDIO. PRIORIDAD: P2. ORIGEN: NUEVO.

OBJETIVO: Emision y reemision con piezas/opciones y firma historica.

ARCHIVOS OBJETIVO: `micodent-backend/src/controllers/historias.controller.js`.

RESULTADO / APROBACION: Persistir seleccion y campos de documento; reemision conserva referencia al anterior y proyeccion historica; no sobrescribir documento previo.

#### B15 - Anexos

TIPO: INTEGRACION. CAMINO: FELIZ/ERROR. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Listado, anulacion y restauracion con bytes inexistentes.

ARCHIVOS OBJETIVO: `micodent-backend/src/controllers/historias.controller.js`; `micodent-backend/src/services/clinicalFiles.js`.

RESULTADO / APROBACION: Anular oculta sin borrar bytes; restaurar solo con bytes recuperables; si faltan permanece archivado y se comunica fallo; lectura DB fallida sin falso exito.

#### B16 - Archivos privados

TIPO: API. CAMINO: FELIZ/ERROR/BORDE. IMPACTO COVERAGE: BAJO. PRIORIDAD: P3. ORIGEN: REUTILIZAR.

OBJETIVO: Sesion, path traversal y streaming de archivo.

ARCHIVOS OBJETIVO: `micodent-backend/src/services/clinicalFiles.js`; `micodent-backend/src/services/clinicalUpload.js`.

RESULTADO / APROBACION: Bytes exactos solo con cookie/contexto validos; traversal y HTML/SVG bloqueados; MIME real y cierre JPEG/PDF verificados.

TRAZABILIDAD EXISTENTE: micodent-backend/tests/unit/clinical-files.test.js; tests/unit/clinical-upload.test.js. No anadir duplicado; registrar evidencia del test ya existente.

#### B17 - Carga clinica

TIPO: INTEGRACION. CAMINO: ERROR/BORDE. IMPACTO COVERAGE: MEDIO. PRIORIDAD: P2. ORIGEN: AMPLIAR.

OBJETIVO: Rechazos Multer y limpieza de staging del controlador.

ARCHIVOS OBJETIVO: `micodent-backend/src/config/multer.js`; `micodent-backend/src/controllers/historias.controller.js`; `micodent-backend/src/services/clinicalUpload.js`.

RESULTADO / APROBACION: 10 MiB maximo permanece; MIME/firma invalidos rechazados; archivo temporal de esta prueba se limpia en fallos previos a publicacion; no borrar bytes si commit es incierto.

TRAZABILIDAD EXISTENTE: micodent-backend/tests/unit/sonar-family4d.test.cjs: actual Multer; clinical-upload.test.js. No sustituir guardas anteriores; ejercer el modulo fuente real.

#### B18 - Agenda

TIPO: API. CAMINO: FELIZ/ERROR/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P2. ORIGEN: NUEVO.

OBJETIVO: Alta/edicion de cita y solapamiento.

ARCHIVOS OBJETIVO: `micodent-backend/src/controllers/citas.controller.js`.

RESULTADO / APROBACION: Cita valida 201; superpuesta mismo doctor devuelve 409; extremos contiguos permitidos; doctor inactivo/paciente ausente rechazados.

#### B19 - Agenda

TIPO: API. CAMINO: ERROR/BORDE. IMPACTO COVERAGE: MEDIO. PRIORIDAD: P2. ORIGEN: NUEVO.

OBJETIVO: Validacion calendario y duracion.

ARCHIVOS OBJETIVO: `micodent-backend/src/controllers/citas.controller.js`.

RESULTADO / APROBACION: Fecha imposible, hora 24:00, duracion fuera de 30/60/90/120 o cruce de medianoche rechazados antes de escribir.

#### B20 - Agenda

TIPO: INTEGRACION. CAMINO: ERROR/BORDE. IMPACTO COVERAGE: MEDIO. PRIORIDAD: P2. ORIGEN: NUEVO.

OBJETIVO: Lock ocupado y limpieza al fallar transaccion.

ARCHIVOS OBJETIVO: `micodent-backend/src/controllers/citas.controller.js`.

RESULTADO / APROBACION: GET_LOCK ocupado produce 503 sin INSERT; error de operacion revierte; lock liberado y conexion soltada o destruida si liberacion/rollback no son fiables. No demuestra concurrencia real MySQL.

#### B21 - Comisiones

TIPO: UNITARIA. CAMINO: FELIZ/BORDE. IMPACTO COVERAGE: BAJO. PRIORIDAD: P3. ORIGEN: REUTILIZAR.

OBJETIVO: Asignacion costo-primero y exactitud en centimos.

ARCHIVOS OBJETIVO: `micodent-backend/src/services/finanzas.js`.

RESULTADO / APROBACION: Abono = costo aplicado + comision + margen; porcentajes 0/100 y centimos deterministas; se rechazan exponentes/coerciones.

TRAZABILIDAD EXISTENTE: micodent-backend/tests/unit/finanzas.test.cjs: cash commission; reported rows; amount validation. No anadir duplicado; registrar evidencia del test ya existente.

#### B22 - Tratamientos

TIPO: INTEGRACION. CAMINO: FELIZ/ERROR. IMPACTO COVERAGE: ALTO. PRIORIDAD: P2. ORIGEN: NUEVO.

OBJETIVO: Evolucion firmada con abono inicial/laboratorio.

ARCHIVOS OBJETIVO: `micodent-backend/src/controllers/cobros.controller.js`; `micodent-backend/src/services/operacionFinanciera.js`; `micodent-backend/src/services/finanzas.js`.

RESULTADO / APROBACION: Transaccion inserta evolucion firmada, costos y laboratorio cuando aplica; abono inicial mayor a costo rechaza; error no deja elementos parciales.

#### B23 - Cobros/POS

TIPO: INTEGRACION. CAMINO: FELIZ/ERROR/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P2. ORIGEN: NUEVO.

OBJETIVO: Idempotencia y revision POS del pago.

ARCHIVOS OBJETIVO: `micodent-backend/src/services/finanzas.js`; `micodent-backend/src/controllers/cobros.controller.js`; `micodent-backend/src/services/operacionFinanciera.js`.

RESULTADO / APROBACION: Misma clave/payload devuelve respuesta guardada sin pago duplicado; otra huella 409; revision POS obsoleta 409; revision vigente registra recargo e historial sin alterar principal.

#### B24 - Anulacion financiera

TIPO: INTEGRACION. CAMINO: FELIZ/ERROR/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P2. ORIGEN: NUEVO.

OBJETIVO: Anular ultimo abono, no anteriores ni legacy pendiente.

ARCHIVOS OBJETIVO: `micodent-backend/src/controllers/cobros.controller.js`; `micodent-backend/src/services/finanzas.js`.

RESULTADO / APROBACION: Solo ultimo vigente se anula; uno anterior o legacy pendiente devuelve 409; registro original permanece y auditorias reflejan motivo.

#### B25 - Gastos

TIPO: API. CAMINO: FELIZ/ERROR/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Categorias y mes consumo condicional.

ARCHIVOS OBJETIVO: `micodent-backend/src/controllers/gastos.controller.js`.

RESULTADO / APROBACION: Categorias admitidas; mes_consumo se conserva opcionalmente en luz/agua/internet/alquiler y se fuerza null en otras; categoria/importe/fecha invalidos sin escritura. No atribuir validacion de mes no existente al backend.

#### B26 - Gastos

TIPO: INTEGRACION. CAMINO: FELIZ/ERROR. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Editar, anular y reactivar con auditoria.

ARCHIVOS OBJETIVO: `micodent-backend/src/controllers/gastos.controller.js`; `micodent-backend/src/utils/auditoriaFinanciera.js`.

RESULTADO / APROBACION: Cambio autorizado auditado; anulacion logica no borra; reactivacion vuelve a estado activo; fallo DB mantiene respuesta fija sin exponer excepcion.

#### B27 - Laboratorio

TIPO: API. CAMINO: FELIZ/ERROR/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: AMPLIAR.

OBJETIVO: Listado y estado por sumas DECIMAL.

ARCHIVOS OBJETIVO: `micodent-backend/src/controllers/laboratorio.controller.js`.

RESULTADO / APROBACION: Pagado/partial/pendiente siguen contrato por suma; filtro saldo SQL y proyeccion correcta; fallo en trabajos/pagos conserva mensaje fijo.

TRAZABILIDAD EXISTENTE: micodent-backend/tests/unit/sonar-family4d.test.cjs: laboratory status preserves all payment branches (VM). No sustituir guardas anteriores; ejercer el modulo fuente real.

#### B28 - Laboratorio

TIPO: INTEGRACION. CAMINO: FELIZ/ERROR/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P2. ORIGEN: NUEVO.

OBJETIVO: Trabajo y pago parcial/final con saldo maximo.

ARCHIVOS OBJETIVO: `micodent-backend/src/controllers/laboratorio.controller.js`; `micodent-backend/src/services/operacionFinanciera.js`.

RESULTADO / APROBACION: Nombre/importe validos; pago positivo hasta saldo se registra y audita; exceso devuelve 409 sin INSERT; reintento usa clave idempotente.

#### B29 - Finanzas

TIPO: INTEGRACION. CAMINO: FELIZ/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Resumen caja versus costo asignado y legacy pendiente.

ARCHIVOS OBJETIVO: `micodent-backend/src/controllers/dashboard.controller.js`.

RESULTADO / APROBACION: Con cobrado 100, recargo 3, lab pagado 20, gasto activo 10: caja ingresos 103/salidas 30/flujo 73; comision 15/costo aplicado 30: ganancia antes gastos 55 y neta 45; legacy pendiente deja margenes null, no cero.

#### B30 - Dashboard

TIPO: API. CAMINO: FELIZ/ERROR/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Deudas multiples/lecturas vacias y fallo de resumen.

ARCHIVOS OBJETIVO: `micodent-backend/src/controllers/dashboard.controller.js`.

RESULTADO / APROBACION: Lecturas vacias mantienen shape; deudas mantienen cada tratamiento pendiente por paciente; fallo financiero devuelve error fijo, rollback/release; no filtra SQL del error.

### Frontend: F01-F30

#### F01 - Personal

TIPO: COMPONENTE. CAMINO: FELIZ/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Formulario extraido: alta/edicion/autoperfil y rol.

ARCHIVOS OBJETIVO: `micodent-frontend/src/pages/AdministracionPersonal.jsx`.

RESULTADO / APROBACION: Labels controlan campos; roles/niveles y campos doctor respetan permisos; edicion propia no permite rol propio; submit preserva payload.

#### F02 - Personal

TIPO: COMPONENTE. CAMINO: FELIZ/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Tarjetas, listas vacias y estados de edicion.

ARCHIVOS OBJETIVO: `micodent-frontend/src/pages/AdministracionPersonal.jsx`.

RESULTADO / APROBACION: Doctor/administrador e inactivo muestran detalle correcto; botones solo segun nivel; listas loading/vacia/con datos y cancelar edicion conservan estado.

#### F03 - Credenciales

TIPO: COMPONENTE. CAMINO: FELIZ/ERROR. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Restablecer/reactivar/desactivar y errores.

ARCHIVOS OBJETIVO: `micodent-frontend/src/pages/AdministracionPersonal.jsx`; `micodent-frontend/src/components/ConfirmModal.jsx`.

RESULTADO / APROBACION: Solo objetivo elegido se envia; cancelacion no llama API; fallo mantiene aviso y no confirma exito; password no queda en logs/snapshot.

#### F04 - Pacientes

TIPO: COMPONENTE. CAMINO: FELIZ/ERROR/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: AMPLIAR.

OBJETIVO: Carga/lista/error y formatos de respuesta.

ARCHIVOS OBJETIVO: `micodent-frontend/src/pages/Pacientes.jsx`.

RESULTADO / APROBACION: Respuesta data.data o array se dibuja; loading termina; fallo muestra aviso y conserva ultima lista; resultado vacio explica ausencia.

TRAZABILIDAD EXISTENTE: micodent-frontend/tests/sonar-family4c.test.mjs: patient list (VM). No sustituir guardas anteriores; ejercer el modulo fuente real.

#### F05 - Pacientes

TIPO: COMPONENTE. CAMINO: FELIZ/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: AMPLIAR.

OBJETIVO: Acciones versus apertura de fila con mouse/teclado.

ARCHIVOS OBJETIVO: `micodent-frontend/src/pages/Pacientes.jsx`; `micodent-frontend/src/components/ConfirmModal.jsx`.

RESULTADO / APROBACION: Archivar/reactivar/imprimir no abre fila; fila navega una vez; boton ejecuta una vez con Enter/Space; cancelar no muta.

TRAZABILIDAD EXISTENTE: micodent-frontend/tests/sonar-post-delta.test.mjs: patient actions wrapper; browser sintetico separado. No sustituir guardas anteriores; ejercer el modulo fuente real.

#### F06 - Pacientes

TIPO: COMPONENTE. CAMINO: FELIZ/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Busqueda con debounce, orden y archivados.

ARCHIVOS OBJETIVO: `micodent-frontend/src/pages/Pacientes.jsx`.

RESULTADO / APROBACION: Busqueda final tras 300 ms; filtros enviados; orden por nombre/edad/estado no modifica array fuente; orden-menu cierra al pulsar fuera.

#### F07 - Paciente

TIPO: COMPONENTE. CAMINO: FELIZ/ERROR. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Datos personales y apoderado.

ARCHIVOS OBJETIVO: `micodent-frontend/src/pages/PacienteDetalle.jsx`.

RESULTADO / APROBACION: Paciente cargado conserva campos; edicion valida envia payload; error muestra mensaje y libera busy; permisos controlan acciones.

#### F08 - Historia

TIPO: COMPONENTE. CAMINO: FELIZ/ERROR. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Guardar antecedentes/firmas y fallo parcial.

ARCHIVOS OBJETIVO: `micodent-frontend/src/pages/PacienteDetalle.jsx`.

RESULTADO / APROBACION: Se realizan solo llamadas aplicables; no informa exito si falla guardado; busy termina y contenido editado permanece para recuperacion.

#### F09 - Anexos

TIPO: COMPONENTE. CAMINO: FELIZ/ERROR. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: AMPLIAR.

OBJETIVO: Subida y recarga fallida.

ARCHIVOS OBJETIVO: `micodent-frontend/src/pages/PacienteDetalle.jsx`; `micodent-frontend/src/components/ClinicalImage.jsx`.

RESULTADO / APROBACION: Archivo permitido llama carga; tipo invalido no; si upload o refresh falla termina busy sin sustituir lista por exito inventado; imagen privada muestra error seguro.

TRAZABILIDAD EXISTENTE: micodent-frontend/tests/sonar-family4c.test.mjs: image upload (VM). No sustituir guardas anteriores; ejercer el modulo fuente real.

#### F10 - Tratamiento

TIPO: COMPONENTE. CAMINO: FELIZ/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Modal extraido nuevo/editar y tipos de tratamiento.

ARCHIVOS OBJETIVO: `micodent-frontend/src/pages/PacienteDetalle.jsx`; `micodent-frontend/src/components/MetodoPago.jsx`.

RESULTADO / APROBACION: Titulo/texto y payload por modo; rehabilitacion solicita laboratorio, endodoncia costo RX; abono inicial cero permitido y tarjeta requiere config POS.

#### F11 - Abonos/POS

TIPO: COMPONENTE. CAMINO: FELIZ/ERROR. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Modal abono y bloqueo durante guardado.

ARCHIVOS OBJETIVO: `micodent-frontend/src/pages/PacienteDetalle.jsx`; `micodent-frontend/src/components/MetodoPago.jsx`; `micodent-frontend/src/components/ConfiguracionPos.jsx`.

RESULTADO / APROBACION: Tarjeta calcula total mostrado con recargo vigente; sin configuracion submit deshabilitado; error de revision informa recarga; Escape protegido mientras guarda.

#### F12 - Finanzas

TIPO: COMPONENTE. CAMINO: FELIZ/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Indicadores extraidos y valores nulos/negativos.

ARCHIVOS OBJETIVO: `micodent-frontend/src/pages/FinanzasDashboard.jsx`.

RESULTADO / APROBACION: Caja/ganancia no se confunden; cero, DECIMAL string, resultado negativo y legacy null se muestran sin NaN ni falso cero; tabla comisiones conserva columnas.

#### F13 - Finanzas

TIPO: COMPONENTE. CAMINO: FELIZ/ERROR/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Refresco y respuestas fuera de orden.

ARCHIVOS OBJETIVO: `micodent-frontend/src/pages/FinanzasDashboard.jsx`; `micodent-frontend/src/utils/financeEvents.js`.

RESULTADO / APROBACION: Mutacion/foco/storage relevante/visibilidad refrescan; respuesta vieja no pisa rango nuevo; fallo muestra desactualizado conservando importes; unmount limpia timer/listeners.

#### F14 - Gastos

TIPO: COMPONENTE. CAMINO: FELIZ/ERROR/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Formulario mensual y filtros.

ARCHIVOS OBJETIVO: `micodent-frontend/src/pages/FinanzasDashboard.jsx`.

RESULTADO / APROBACION: Categorias de servicios muestran mes consumo; otras no; filtro por categoria/usuario y crear/editar/anular refrescan datos; fallo no simula guardado.

#### F15 - Laboratorio

TIPO: COMPONENTE. CAMINO: FELIZ/ERROR. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Pago parcial/final y resumen sincronizado.

ARCHIVOS OBJETIVO: `micodent-frontend/src/pages/FinanzasDashboard.jsx`.

RESULTADO / APROBACION: Pago confirmado recarga trabajos y resumen; saldo/status/total pagado se actualizan; error conserva trabajo previo y avisa; no deduce costo asignado por pago de caja.

#### F16 - Agenda

TIPO: COMPONENTE. CAMINO: FELIZ/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: AMPLIAR.

OBJETIVO: Mes/semana/dia y slots accesibles.

ARCHIVOS OBJETIVO: `micodent-frontend/src/pages/Agenda.jsx`; `micodent-frontend/src/components/AgendaMes.jsx`; `micodent-frontend/src/components/AgendaSemana.jsx`; `micodent-frontend/src/components/AgendaDia.jsx`; `micodent-frontend/src/utils/agendaUtils.js`.

RESULTADO / APROBACION: Mes bisiesto y cambio de ano correctos; slot Enter/Space selecciona una vez; dia/semana conservan cita/doctor; filtros recalculan.

TRAZABILIDAD EXISTENTE: micodent-frontend/tests/agendaUtils.test.mjs: calendarios; accessibility.test.mjs: agenda slots (AST). No sustituir guardas anteriores; ejercer el modulo fuente real.

#### F17 - Citas

TIPO: COMPONENTE. CAMINO: FELIZ/ERROR. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Crear/editar modal y validaciones.

ARCHIVOS OBJETIVO: `micodent-frontend/src/components/CitaModal.jsx`; `micodent-frontend/src/pages/Agenda.jsx`.

RESULTADO / APROBACION: Labels instance-specific; campos/duracion preservados; submit correcto una vez y busy impide reenvio; conflicto 409 visible sin perder datos.

#### F18 - Odontograma

TIPO: COMPONENTE. CAMINO: FELIZ/ERROR/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Formulario de item nuevo/confirmado/edicion.

ARCHIVOS OBJETIVO: `micodent-frontend/src/components/OdontogramaEditor.jsx`.

RESULTADO / APROBACION: Ramas extraidas muestran campo/accion correctos; seleccion pieza llega al handler; validacion impide guardado incompleto y error conserva formulario.

#### F19 - Piezas

TIPO: COMPONENTE. CAMINO: FELIZ/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Diente/selector con teclado y estado.

ARCHIVOS OBJETIVO: `micodent-frontend/src/components/Diente.jsx`; `micodent-frontend/src/components/PiezaSelector.jsx`.

RESULTADO / APROBACION: Controles nativos activan una vez, comunican seleccion y respetan disabled si aplica; imagen/numero de pieza conservados.

#### F20 - Modal compartido

TIPO: COMPONENTE. CAMINO: FELIZ/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: AMPLIAR.

OBJETIVO: Portal real, foco, Tab, Escape y anidamiento.

ARCHIVOS OBJETIVO: `micodent-frontend/src/components/ModalDialog.jsx`; `micodent-frontend/src/utils/modalFocus.js`.

RESULTADO / APROBACION: Montaje real en body; foco inicial/Tab/Shift+Tab; Escape llama ultimo handler una vez; closeDisabled lo bloquea; cleanup devuelve foco y scroll, incluso anidado.

TRAZABILIDAD EXISTENTE: micodent-frontend/tests/modal-dialog.test.mjs: focus helper sin montar JSX. No sustituir guardas anteriores; ejercer el modulo fuente real.

#### F21 - Confirmacion

TIPO: COMPONENTE. CAMINO: FELIZ/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Cancelar/confirmar y busy.

ARCHIVOS OBJETIVO: `micodent-frontend/src/components/ConfirmModal.jsx`; `micodent-frontend/src/components/ModalDialog.jsx`.

RESULTADO / APROBACION: Cerrado no renderiza; Cancelar/Confirmar llaman handler una vez; busy deshabilita ambos y Escape; titulo accesible y mensaje conservados.

#### F22 - Orden RX

TIPO: COMPONENTE. CAMINO: FELIZ/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: AMPLIAR.

OBJETIVO: Piezas seleccionadas, mapas y vista de impresion.

ARCHIVOS OBJETIVO: `micodent-frontend/src/components/OrdenRadiografiaTab.jsx`; `micodent-frontend/src/components/RxTeethPrint.jsx`; `micodent-frontend/src/utils/rxTeeth.js`; `micodent-frontend/src/utils/printDocument.js`.

RESULTADO / APROBACION: Opciones/piezas visibles en preview y DOM imprimible, sin duplicar pieza superpuesta; conserva mapas Huancayo/San Carlos; seleccion vacia sin odontograma fantasma.

TRAZABILIDAD EXISTENTE: micodent-frontend/tests/rxTeeth.test.mjs: incluye/ignora piezas; sonar-family4d.test.mjs: ramas RX (VM). No sustituir guardas anteriores; ejercer el modulo fuente real.

#### F23 - Receta/firma

TIPO: COMPONENTE. CAMINO: FELIZ/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Vista receta y sello PNG o fallback.

ARCHIVOS OBJETIVO: `micodent-frontend/src/components/RecetarioTab.jsx`; `micodent-frontend/src/components/FirmaMiniBlock.jsx`.

RESULTADO / APROBACION: Texto, indicaciones y firma historica presentes; PNG reemplaza sello generado y firma encima; sin PNG aplica fallback; solo acto de imprimir habilitado genera DOM de impresion.

#### F24 - Perfil

TIPO: COMPONENTE. CAMINO: FELIZ/ERROR. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: AMPLIAR.

OBJETIVO: Firma/sello y cambio de password.

ARCHIVOS OBJETIVO: `micodent-frontend/src/pages/MiPerfil.jsx`.

RESULTADO / APROBACION: Payload conserva firma/sello elegido; aviso correcto y busy termina en error; password actual/nuevo siguen validacion y exito pide relogin, no expone valores.

TRAZABILIDAD EXISTENTE: micodent-frontend/tests/sonar-family4c.test.mjs: profile signing assets (VM); security.test.mjs: password policy. No sustituir guardas anteriores; ejercer el modulo fuente real.

#### F25 - Sesion

TIPO: COMPONENTE. CAMINO: FELIZ/ERROR/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: AMPLIAR.

OBJETIVO: Boundary checking/unavailable/expired y reintento.

ARCHIVOS OBJETIVO: `micodent-frontend/src/components/SessionBoundary.jsx`; `micodent-frontend/src/services/sessionState.js`.

RESULTADO / APROBACION: Mensajes actuales montados; pantallas privadas no se montan durante checking o bloqueo; unavailable ofrece retry sin autorizar; expired no limpia silenciosamente borrador.

TRAZABILIDAD EXISTENTE: micodent-frontend/tests/sessionState.test.mjs: verification failure permits retry; sonar-family4d.test.mjs: mensajes (VM). No sustituir guardas anteriores; ejercer el modulo fuente real.

#### F26 - Reporte HC

TIPO: COMPONENTE. CAMINO: FELIZ/ERROR. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: AMPLIAR.

OBJETIVO: Historias solo flujo vivo: carga y redirecciones.

ARCHIVOS OBJETIVO: `micodent-frontend/src/pages/Historias.jsx`; `micodent-frontend/src/components/PrintPortal.jsx`.

RESULTADO / APROBACION: Reporte carga paciente/historia/firma y resumen financiero; error conserva aviso fijo; ruta sin informe sigue redireccion actual; no reintroducir handlers legacy eliminados.

TRAZABILIDAD EXISTENTE: micodent-frontend/tests/sonar-family4a.test.mjs; sonar-post-delta.test.mjs: report loading (AST/VM). No sustituir guardas anteriores; ejercer el modulo fuente real.

#### F27 - Inicio

TIPO: COMPONENTE. CAMINO: FELIZ/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: NUEVO.

OBJETIVO: Deudores agrupados con varios tratamientos.

ARCHIVOS OBJETIVO: `micodent-frontend/src/pages/Dashboard.jsx`.

RESULTADO / APROBACION: Un paciente con varias deudas muestra todos sus tratamientos; total por paciente suma saldos; lista vacia y apertura de detalle sin doble navegacion.

#### F28 - Helpers

TIPO: UNITARIA. CAMINO: FELIZ/ERROR/BORDE. IMPACTO COVERAGE: BAJO. PRIORIDAD: P3. ORIGEN: REUTILIZAR.

OBJETIVO: JSON, moneda, sesion multiventana y piezas.

ARCHIVOS OBJETIVO: `micodent-frontend/src/utils/data.js`; `micodent-frontend/src/utils/rxTeeth.js`; `micodent-frontend/src/services/sessionState.js`; `micodent-frontend/src/utils/financeEvents.js`.

RESULTADO / APROBACION: DECIMAL/JSON legacy y piezas validas deterministas; respuesta antigua no pisa login nuevo; eventos financieros no contienen datos clinicos.

TRAZABILIDAD EXISTENTE: micodent-frontend/tests/data.test.mjs; rxTeeth.test.mjs; sessionState.test.mjs; financeEvents.test.mjs. No anadir duplicado; registrar evidencia del test ya existente.

#### F29 - Login

TIPO: COMPONENTE. CAMINO: FELIZ/ERROR. IMPACTO COVERAGE: MEDIO. PRIORIDAD: P2. ORIGEN: NUEVO.

OBJETIVO: Login correcto/incorrecto y carga.

ARCHIVOS OBJETIVO: `micodent-frontend/src/pages/Login.jsx`; `micodent-frontend/src/services/api.js`.

RESULTADO / APROBACION: Correcto verifica sesion y navega; incorrecto muestra error sin montar privado; boton busy no genera peticion adicional; sin token en storage.

#### F30 - API/interceptores

TIPO: INTEGRACION CLIENTE. CAMINO: FELIZ/ERROR/BORDE. IMPACTO COVERAGE: ALTO. PRIORIDAD: P1. ORIGEN: AMPLIAR.

OBJETIVO: Rechazos reales Axios y notificacion financiera.

ARCHIVOS OBJETIVO: `micodent-frontend/src/services/api.js`; `micodent-frontend/src/services/sessionState.js`; `micodent-frontend/src/utils/financeEvents.js`.

RESULTADO / APROBACION: Adapter sintetico: 403/503/network no borran sesion; 401 del contexto vigente bloquea y respuesta vieja no; mutacion exitosa avisa, fallida no; error conserva rechazo Promise.

TRAZABILIDAD EXISTENTE: micodent-frontend/tests/security.test.mjs: a 403/network/503; sonar-family4b.test.mjs: async throws (VM). No sustituir guardas anteriores; ejercer el modulo fuente real.

## 6. Cypress: 10 E2E separados

No instalados ni implementados. No se suman automaticamente a los 60 casos ni a la cobertura unitaria.

Preparacion futura obligatoria: app/DB/almacenamiento sinteticos desechables, puertos propios, usuario DB limitado y guardas fail-closed del runner por host/esquema/directorio allowlist. Nada de borrar o sembrar micodent, micodent_dev activa ni instalaciones de prueba con datos reales. La creacion de DB y seeds requiere autorizacion independiente; esta sesion no conecta a MySQL.

Cada flujo inicia con datos propios reproducibles (sin depender del anterior), backend real en los flujos de negocio y aislamiento de cookies/storage. Selectores accesibles estables; esperar requests/estado de UI en lugar de sleeps fijos. Fallos de red controlados pueden simularse por intercept, pero no sustituir todas las API en una supuesta E2E real. Limpieza solo de artefactos de esa instancia aislada.

[Documentacion oficial Cypress: aislamiento de tests](https://docs.cypress.io/app/core-concepts/test-isolation).

| ID | Flujo | Preparacion/accion | Resultado y criterio de aprobacion | Casos vinculados |
| --- | --- | --- | --- | --- |
| E01 | Login correcto e incorrecto | Cuenta sintetica activa; credencial valida y otra invalida. | Valida entra; invalida muestra aviso sin acceso privado. | B01/F29 |
| E02 | Alta y edicion de paciente | DNI ficticio unico y datos sinteticos; crear y luego editar telefono. | Paciente/HC conservan ID y cambios sobreviven recarga. | B08-B10/F04-F07 |
| E03 | Historia y adenda | Guardar antecedentes, registrar evolucion firmada e intentar editar; anadir correccion. | Original permanece y correccion visible con autor; ninguna edicion silenciosa. | B11-B13/F08/F10 |
| E04 | Agenda | Crear cita, intentar solaparla y mover una cita valida. | Conflicto visible; cita editada persistida en dia/semana/mes. | B18-B20/F16-F17 |
| E05 | Tratamiento con laboratorio y abono inicial | Rehabilitacion costo 200, lab 40, abono 60, doctor 30%; datos nuevos no legacy. | Evolucion firmada; costo aplicado 40, comision 6, margen 14; deuda 140. | B21-B22/F10 |
| E06 | Pago POS y doble confirmacion | Consultar revision POS sintetica 3%; pagar 100 con tecla/click repetidos y reintento controlado. | Recargo 3 registrado una vez; principal/comision correctos; revision obsoleta rechazada. | B23/F11/F30 |
| E07 | Gastos/laboratorio y caja | Registrar gasto 10 y pagar lab 20; observar resumen y otra pestana del mismo usuario. | Salidas suben 30; flujo baja 30; saldo lab cambia; no doble descuento de costo asignado. | B25-B29/F12-F15 |
| E08 | Anexos y orden RX | Subir imagen sintetica valida; anular y restaurar; emitir RX con piezas y mapas. | Archivo persiste; piezas y mapas presentes en DOM imprimible; sesion no autorizada no descarga. | B14-B17/F09/F22 |
| E09 | Permisos/credenciales | Dos cuentas sinteticas de distinta jerarquia; probar accion admin con cuenta sin permiso y reset autorizado. | Cliente y API rechazan accion no autorizada; reset revoca sesiones; historial previo permanece. | B02-B06/F01-F03/F25 |
| E10 | Sesion, modal y logout | Abrir modal con borrador, recorrer Tab/Escape, cambiar sesion en otra pestana y cerrar sesion. | Foco vuelve; cambio no confirma datos con actor equivocado; logout impide reabrir privados. | B01-B02/F20-F21/F25/F28 |

E08 verifica DOM imprimible/maps/piezas; no certifica impresora fisica ni PDF por abrir window.print. Teclado/foco real en navegador sigue siendo necesario aunque RTL pase. Concurrencia DB real y atomicidad ante caida requieren ensayo aislado adicional; los mocks node:test no lo demuestran.

## 7. Secuencia de lotes y camino a >=80% New Code

1. Congelar referencia de commit+diff actual, source hashes y LCOV de baseline; no resetear ni hacer push. Obtener del ultimo analisis ya existente, cuando se facilite, archivos/lineas nuevas y condiciones cubiertas/no cubiertas, periodo de New Code y revision analizada. Esto no requiere lanzar un analisis en esta fase.
2. Preparacion frontend minima descrita en seccion 4 (F21 como primera comprobacion de source map). No cambiar renderer ni framework por defecto; demostrar credito LCOV real antes de ampliar.
3. P1-A backend: B04/B07/B27 (comparadores, lecturas y errores); B03/B06 si el harness ya representa sesion/jerarquia. Priorizar codigo original con DA=0 pese a tests VM previos. Prueba especifica y cobertura tras cada pequeno grupo.
4. P1-A frontend: F20/F21 y F01-F03; montar paginas completas/portals para ejercitar componentes extraidos sin modificar exports funcionales.
5. P1-B frontend: F04-F06, F10-F13 y F25-F26 (extracciones POST y estado de sesion/reporte). Ejecutar escenarios vacio/loading/error/exito; nada de snapshots enormes como unica asercion.
6. P1-C: resto de P1 clinico/financiero (B08-B09/B11/B15/B25-B26/B29-B30 y F07-F09/F14-F19/F22-F24/F27/F30), reordenando por mapa exacto New Code si ya esta disponible.
7. P2: B05/B10/B12-B14/B17-B20/B22-B24/B28 y F29. Regresion de transacciones, cobros, laboratorios, agenda, archivos e historias. No eliminar casos valiosos si el Gate pasa antes.
8. P3: reutilizar B01/B02/B16/B21/F28; preparar fichas/evidencia academica sin duplicar pruebas ya buenas.
9. Repetir suites completas con coverage (minimo frontend97/backend103 sin perder tests anteriores), frontend build y verificacion SF/DA. Registrar delta local por archivo y condiciones; no editar LCOV ni exclusiones.
10. Solo con autorizacion futura ejecutar SonarQube y comprobar importacion de ambos LCOV, mismo source/revision/periodo y Coverage on New Code. Si quedan ramas/lineas sin hits, escoger casos dirigidos por evidencia y rerun; nunca bajar Gate.
11. Cypress despues de baseline P1/P2 como complemento de usuario real, sin contarlo automaticamente para Gate ni reemplazar la suite.

La cobertura Sonar combina lineas y condiciones; 239 lineas nuevas NO significan que cubrir 192 lineas garantice >=80%. Harian falta tambien los datos de condiciones nuevas y el mapeo correcto de fuente. [Definicion oficial de coverage/new_coverage](https://docs.sonarsource.com/sonarqube-server/user-guide/code-metrics/metrics-definition).

ESTIMACION: INCIERTO. P1+P2 es una estrategia tecnicamente razonable y dirigida a las extracciones/cambios actuales, pero no se puede garantizar que cubra >=80% de las 239 lineas/condiciones del periodo sin conocerlas y medir despues. No se propone alcanzar 80% global antes del Gate ni se pronostica un porcentaje inventado. La viabilidad frontend/sourcemaps es un prerequisito real.

## 8. TDD: demostracion futura honesta

No hay evidencia de que los 200 tests actuales ni estas pruebas retroactivas provengan de TDD. La clasificacion TDD solo aplica a una mejora/bugfix FUTURA y autorizada:

| Candidato condicionado | Requisito/defecto que debe confirmarse primero | RED | GREEN | REFACTOR |
| --- | --- | --- | --- | --- |
| F13: nueva regla de refresco ante respuestas viejas | Si se reproduce una combinacion no protegida por el sequence actual | Test componente reproduce estado erroneo y falla por asercion de contrato | Cambio minimo autorizado al consumidor | Solo si reduce complejidad sin cambiar contrato; repetir casos |
| B28: nuevo caso limite de confirmacion laboratorio | Si una concurrencia real aislada demuestra duplicidad no evitada | Test de integracion aislada falla por duplicacion efectiva | Arreglo transaccional minimo aprobado | Conservar idempotencia/costos/auditoria y probar regresion |
| F22: nuevo formato de piezas recibido | Solo si se confirma y acepta compatibilidad nueva no soportada | Test del componente/helper falla por pieza omitida | Soporte minimo del formato acordado | Reutilizacion razonable sin cambiar formatos existentes |

No se afirma que existan hoy esos defectos. Si el test ya pasa, NO es RED ni TDD: se registra como regresion retroactiva. Un error de importacion o infraestructura no sirve como RED de negocio. Guardar evidencia cronologica test fallido -> cambio minimo -> PASS -> refactor opcional, sin fabricar historial ni ejecutar cambios ahora.

## 9. Aprobacion, entrega academica y limites

Cada caso academico se completa en la implementacion con: ID, objetivo, precondiciones/datos sinteticos concretos, pasos, esperado, obtenido, test/subtest asociado, fecha/revision, resultado PASS/FAIL, evidencia y delta LCOV si aporta. No presentar 60 propuestas como 60 pruebas realizadas. Reutilizar evidencia existente en los 5 casos P3.

Cierre futuro: todos los casos ejecutados o pendiente justificado visible; suite anterior intacta; tests nuevos reales; build PASS; LCOV valido sin trucos; resultados de Cypress registrados separadamente; Gate >=80% confirmado por analisis autorizado. Gate aprobado no equivale a sistema clinico certificado ni garantiza ausencia de fallos.

La planificacion inicial de las secciones 1-9 fue solo documental. P1 autorizado se registra en la seccion 10; no cambia src/API/DB/.env, Gate/exclusiones ni SONAR_REMEDIATION_LOG.md.

SIGUIENTE ACCION ACTUAL: ejecutar SonarQube para verificar New Code Coverage >=80% despues de P2; no iniciar mas pruebas automaticamente.

## 10. Implementacion P1 completada (2026-10-03)

Estado: P1 COMPLETO. El catalogo de 60 propuestas y las tablas de las secciones 1-7 son la referencia PRE-P1; no se presentan como 60 pruebas ejecutadas. Se mantienen los 10 E2E independientes y pendientes.

Se implementaron 18 tests node:test originales de este lote (12 frontend + 6 backend), correspondientes a 12/60 casos academicos. Los 48 restantes no se declaran terminados: F05/F13 tienen comprobaciones parciales, no contabilizadas como casos completos. Tipo de todos los nuevos: AUTOMATIZADO RETROACTIVO; TDD REAL: NO.

### Seleccion y limites

GET anonimo a Sonar: system/status 200/UP; medidas y fuentes 401; sin token en entorno. No se recupero el mapa de las 239 lineas/condiciones. Fallback autorizado LCOV + git diff documentado en NEW_CODE_COVERAGE_MAP.md; no se deduce que sean 239 lineas locales ni que la seleccion garantice Gate >=80%.
Se priorizaron extracciones de personal, pacientes y caja, portales reales y seguridad/lecturas de usuarios/laboratorio. Se detiene P1 sin ampliar a todos los modulos ni iniciar P2.

### Evidencia academica realizada

Revision: HEAD bbc15f187b1191169aafc3e8c651da38f9348f17 + worktree local preservado; sin commit/push. Fecha: 2026-10-03. Todos usan datos sinteticos, no pacientes/cuentas reales.
Cada fila identifica precondiciones, acciones y contrato esperado; el obtenido se comprobo mediante aserciones del test indicado. PASS no equivale a validacion manual, DB real ni certificacion clinica.

| Caso del plan | Test(s) nuevos | Precondiciones/datos | Pasos ejercitados | Esperado y obtenido | Resultado |
| --- | --- | --- | --- | --- | --- |
| B03 | BE-P1-02 | Actor administrador y objetivo sinteticos con sesiones reales del servicio. | Reset/reactivar; probar activo, credencial incorrecta y jerarquia. | Hash bcrypt y revocacion real; auditoria/locks ordenados; 409/400/403 sin modificacion indebida. | PASS |
| B04 | BE-P1-01 | Usuarios con IDs invertidos/iguales y niveles distintos; error DB inyectado. | Editar/desactivar; repetir; denegar propia elevacion/objetivo; simular fallo de escritura. | Orden/deduplicacion de locks; rollback/release; revocacion; 409 al repetir; sin DELETE. | PASS |
| B06 | BE-P1-06 | Actor con firma/sello sinteticos y ID ajeno en payload. | Actualizar solo firma; omitir ambos; enviar vacio explicito. | Solo actor cambia; sello omitido conservado; vacio limpia; no-op sin UPDATE/auditoria. | PASS |
| B07 | BE-P1-03 | DB sintetica con filas de usuarios/doctores y errores SQL simulados. | Invocar lecturas reales; revisar consulta/proyeccion y errores. | Filtro activo/proyeccion sin hash; respuesta fija y log sanitizado. | PASS |
| B27 | BE-P1-04/05 | Trabajos/pagos con montos DECIMAL string, cero/parcial/completo/exceso. | Listar con filtro/default; simular lista vacia y fallos en trabajos/pagos. | Estados/parametros y sumas coherentes; vacio valido; errores controlados. | PASS |
| F01 | FE-P1-03/04/10 | Administrador y formulario reales con usuarios sinteticos. | Alta doctor; editar propio perfil; cancelar; password invalido y fallo API. | Payload normalizado; rol propio protegido; validacion no llama API; error conserva valores. | PASS |
| F02 | FE-P1-05/06 | Respuesta API diferida/vacia/error y usuarios peer/inactivo. | Montar pantalla; completar carga; filtrar; cambiar permisos. | Estados correctos; tarjetas/acciones segun jerarquia; no-admin sin acceso. | PASS |
| F03 | FE-P1-07/08/09 | Objetivo sintetico y respuestas API diferidas/fallidas. | Reset/reactivar/desactivar; cancelar; busy; fallo y reintento. | ID correcto; credencial validada; cancelacion sin llamada; una ejecucion; error conserva formulario. | PASS |
| F04 | FE-P1-11 | Paciente sintetico; respuesta data.data/array, fallo y vacio. | Montar lista; alternar archivados; buscar; cancelar archivo; abrir reporte. | Lista/avisos conservados; carga finaliza; vacio explicito; no navegar al cancelar; ruta del reporte correcta. | PASS |
| F12 | FE-P1-12 | Caja 103/20/10/73, comision 15, ganancia -5; legacy null y cero. | Montar resumen; revisar indicadores/columnas; resolver respuestas fuera de orden; fallo y reintento. | Montos/columnas correctos sin NaN; nulo por conciliar, cero no confundido; resumen previo no se sobrescribe. | PASS |
| F20 | FE-P1-02 | Portal real con dos controles y opener enfocado; modal anidado. | Abrir; Tab/Shift+Tab; cambiar handler; bloquear Escape; anidar/desmontar. | Foco/scroll restaurados; ultimo handler una vez; solo modal superior recibe Escape. | PASS |
| F21 | FE-P1-01 | Confirmacion cerrada/abierta/busy y contadores de acciones. | Abrir; Cancelar/Confirmar; Escape repetido; busy y tipo desconocido. | Nombre/contenido correctos; una ejecucion; busy bloquea; cerrado no renderiza. | PASS |

Archivos ejecutables de evidencia:
- micodent-backend/tests/unit/coverage-p1.test.cjs: BE-P1-01 a BE-P1-06; referencia academica en cada caso.
- micodent-frontend/tests/coverage-p1-personal.test.mjs: FE-P1-03 a FE-P1-10.
- micodent-frontend/tests/coverage-p1-modals.test.mjs: FE-P1-01/02.
- micodent-frontend/tests/coverage-p1-pages.test.mjs: FE-P1-11/12.
- Fronteras sinteticas: tests/helpers/coverage-p1-db.cjs (backend); tests/helpers/component-boundaries.mjs y component-runtime.mjs (frontend).

### Fuente original y credito de cobertura

Backend requiere controllers/session.service originales; DB es la frontera sustituida, no la logica de permisos/bcrypt/revocacion/auditoria. Se verifican solicitudes de locks/rollback, no garantias de concurrencia de un motor MySQL real.
Frontend importa src original, transforma JSX completo con Babel y monta React/Router reales en RTL/jsdom; mocks solo API/session y toast. No copias de funciones, AST/VM como estrategia P1. La geometria de getClientRects se modela porque jsdom no tiene layout; no se certifican estilos ni comportamiento nativo del navegador.
Framework node:test/c8 conservado. Ejecucion frontend secuencial para limitar memoria en Windows, sin retirar tests.
DevDependencies minimas para DOM/JSX: @testing-library/react 16.3.3, @testing-library/dom 10.4.2, jsdom 29.1.1, @babel/core 7.29.0, @babel/plugin-transform-react-jsx 7.28.6; no Supertest/Cypress ni dependencias de produccion nuevas.

Se descarto el reporte inicial del bridge rolldown: rangos finales JSX sin remapeo daban credito falso a componentes no renderizados. Solo se sustituyo el transformador del helper por Babel, sin cambiar src/exclusiones ni editar LCOV. Se regenero desde V8:
- Produccion importado, nunca montado: 0/3 funciones y 9/76 DA; NO 100%.
- AdministracionPersonal: 555/565 DA y 30/31 funciones; handler no ejecutado permanece sin hits.
- FinanzasDashboard: 303/661 DA y 7/42 funciones; flujos de gastos/laboratorio/modal no ejercitados permanecen pendientes.
No se acredita como prueba funcional dedicada a Produccion/ConfiguracionPos el credito incidental de sus imports.

### Validacion final

Grupos: modales 2/2; personal 8/8; paginas 2/2; backend 6/6 PASS.
Comandos: node --test para cada grupo; npm run test:coverage en ambos paquetes; npm run build frontend.
Backend conserva TEMP/TMP aislados mediante runner existente, con suite completa de launcher Windows.

| Resultado | Frontend | Backend |
| --- | ---: | ---: |
| Tests completos | 109/109 PASS | 109/109 PASS |
| Statements | 21.63% | 39.93% |
| Branches | 81.39% | 86.19% |
| Functions | 53.55% | 47.29% |
| Lines | 21.63% | 39.93% |
| DA cubiertas/totales | 1592/7358 | 1496/3746 |
| Delta DA cubiertas | +1231 | +192 |
| Delta Statements/Lines | +16.73 puntos | +5.12 puntos |

Build frontend PASS; advertencia preexistente bundle JS >500 kB no corregida.
Descensos pequenos de Branches/Functions no son prueba de regresion: nuevas funciones/ramas observadas amplian denominadores; los empty-reports originales no enumeraban toda la logica.
LCOV regenerados; 85/85 SF reales bajo src; DA validos dentro de archivos; sin duplicados ni edicion manual. Hashes/reportes completos en CURRENT_TASK.md.
93 archivos protegidos conservan SHA-256, incluidos ambos src/activos, sonar-project.properties y manifiestos backend. No se modificaron funcionalidades clinicas, API real, DB/.env, secretos, permisos, Quality Gate/exclusiones ni trabajo anterior.
Sin regresiones detectadas por suites/build. Sin pruebas manuales/navegador ni conexion DB real en este lote.

### Delta local por archivo

| Fuente | DA cubiertas baseline | DA cubiertas P1 | Incremento | Proxy añadidas antes sin hits ahora cubiertas/total |
| --- | ---: | ---: | ---: | ---: |
| micodent-frontend/src/pages/AdministracionPersonal.jsx | 0/565 | 555/565 | 555 | 216/222 |
| micodent-frontend/src/pages/Pacientes.jsx | 0/305 | 258/305 | 258 | 83/90 |
| micodent-frontend/src/pages/FinanzasDashboard.jsx | 0/661 | 303/661 | 303 | 27/88 |
| micodent-frontend/src/components/ModalDialog.jsx | 0/17 | 17/17 | 17 | 17/17 |
| micodent-backend/src/controllers/usuarios.controller.js | 59/196 | 160/196 | 101 | 8/9 |
| micodent-backend/src/controllers/laboratorio.controller.js | 24/104 | 73/104 | 49 | 6/6 |
| micodent-frontend/src/components/ConfirmModal.jsx | 0/70 | 70/70 | 70 | 6/6 |
| micodent-backend/src/services/session.service.js | 131/175 | 165/175 | 34 | 4/6 |
| micodent-frontend/src/components/ConfiguracionPos.jsx | 0/36 | 19/36 | 19 | 3/4 |
| micodent-frontend/src/pages/Produccion.jsx | 0/76 | 9/76 | 9 | 0/1 |
| micodent-backend/src/utils/securityError.js | 24/30 | 27/30 | 3 | 0/0 |
| micodent-backend/src/utils/auditoriaSeguridad.js | 7/12 | 12/12 | 5 | 0/0 |

El proxy local contabiliza 844 DA añadidas sin hits de baseline; 370 ahora tienen hits. NO corresponde al periodo Sonar ni permite dividir entre 239.

SIGUIENTE ACCION EXACTA: ejecutar SonarQube para medir New Code Coverage despues de P1; estimacion de cobertura de gran parte de las 239 lineas: INCIERTO.
DETENIDO: sin P2, scanner, push, PostgreSQL, Docker, Universidad ni E01-E17.

## 11. Cierre P2 pequeno y dirigido (2026-10-03)

FASE: COVERAGE_P2_COMPLETE. TESTS P2 NUEVOS: 6.
CASOS ACADEMICOS IMPLEMENTADOS: 18/60 (12 P1 + F10/F11/F14/F15/F17/F18).
Los 42 restantes no se presentan como completos; F05/F13 siguen parcialmente cubiertos. Se conservan todos los tests P1. Automatizado retroactivo; TDD REAL: NO.

Sonar POST P1 informado por el usuario: New Code 74.8%, 239 lineas, requisito >=80%; 0 issues nuevos, duplicacion New Code 0.0%, 0 hotspots; Gate falla solo por cobertura.
Se releen LCOV P1 actuales (109/109 ambos, Lines21.63%/39.93%) y diff de fuentes relevantes. No API/scan en P2; mapa exacto Sonar no accesible previamente (401). Proxy y baseline historicos no se confunden con las 239 lineas.
Se seleccionan cuatro archivos, en lugar de implementar todos los casos del plan. CitaModal/Odontograma/PacienteDetalle estaban sin ejecucion real (empty-report); Finanzas tenia handlers/EstadoPagoLaboratorio a cero.

### Evidencia nueva

Fecha: 2026-10-03; revision: HEAD bbc15f187b1191169aafc3e8c651da38f9348f17 + worktree local preservado; sin commit/push.
Todos los archivos de la tabla estan en micodent-frontend/tests/. Referencia academica en comentarios/test title. Esperado y obtenido comprobados por aserciones del codigo fuente original.

| Test | Caso academico | Archivo | Precondiciones sinteticas | Pasos | Esperado/obtenido | Resultado |
| --- | --- | --- | --- | --- | --- | --- |
| FE-P2-01 | F14 | coverage-p2-finance.test.mjs | Gasto sintetico: luz/mes 2026-09 y monto 10 -> 12; caja 100 -> 90 -> 88. | Crear, cambiar categorias/mes, filtrar, editar con fallo/reintento, cancelar anulacion, anular/reactivar. | Payload/mes preservados, listas y resumen segun respuesta; error mantiene formulario; anulacion cancelada sin mutacion. | PASS |
| FE-P2-02 | F15 | coverage-p2-finance.test.mjs | Laboratorio 80, pagos 0 -> 30 -> 80; saldos 80 -> 50 -> 0; caja 100 -> 70 -> 20. | Monto invalido/cancelar; pagar parcialmente; fallo y reintento final; abrir historial/resumen. | Saldo y pagos actualizados; fallo conserva datos; pagado muestra fecha y no permite nuevo pago; produccion no confundida con caja. | PASS |
| FE-P2-03 | F10 | coverage-p2-patient.test.mjs | Paciente 41/HC7; rehabilitacion 120/lab40/extras10 y endodoncia 200/3 RX/abono50. | Nuevo/editar, campos por tipo; abono excesivo/zero, POS, busy, error y reintento. | Payloads reales exactos por modo; cero permitido; error conserva datos; una llamada durante busy; no abono en editar. | PASS |
| FE-P2-04 | F11 | coverage-p2-patient.test.mjs | Consulta 100 con pago20, saldo80; abono50; POS3%, revision8 -> 9. | POS ausente, limites, recargo1.50/total51.50, error de revision, Escape busy, reabrir/reintentar. | Sin configuracion no confirma; monto invalido no llama API; fallo mantiene50; revision nueva enviada; saldo recargado30. | PASS |
| FE-P2-05 | F18 | coverage-p2-clinical.test.mjs | Pieza11; diagnostico propio firmado/ajeno con adenda; catalogo real ID8/1. | Seleccionar pieza/formulario; vacio, confirmar/cancelar arcada; fallo conserva seleccion; guardar correccion. | Payload arcada completo; no guarda antes de confirmar; busy; solo boton eliminar permitido; adenda exacta y refresco. | PASS |
| FE-P2-06 | F17 | coverage-p2-clinical.test.mjs | Contacto/paciente/doctora ficticios, fecha2026-10-03, 09:00, duracion60. | Crear/editar; vinculo quitado; validar campos/labels; doble submit; 409; reintentar; atendida/revertir/cerrar. | Payload correcto una vez; cierre protegido busy; 409 visible sin perder motivo; callbacks y estados exactos. | PASS |

Infraestructura de P1 reutilizada sin dependencias nuevas: node:test/c8 + imports de src originales con Babel y React/Router/RTL/jsdom.
Unico helper existente modificado: component-boundaries.mjs, añade historiasService/authService/citasService como fronteras externas; no contiene logica clinica.
Simulacion financiera: respuestas/caja predefinidas del servidor y notifyFinanceChange original tras mutacion exitosa. Se comprueba el consumidor/listas/formularios/refresco; NO certifica calculos financieros del backend ni MySQL.
Campos heredados sin label asociado se localizan dentro del contenedor de su label real; no se corrige accesibilidad fuera de alcance. Browser/teclado nativo/geometria CSS no certificados por jsdom.
Primer intento de Finanzas consultaba caja estando oculta en otra pestaña: se corrigio solo la prueba para alternar Resumen/Gastos/Laboratorio. No se cambio funcionalidad ni se presenta como TDD/defecto de produccion.

### Resultados de validacion

Tres grupos independientes: 2/2 + 2/2 + 2/2 PASS.
Frontend completo con coverage: 115/115 PASS (baseline109); backend completo con coverage: 109/109 PASS (sin nuevos tests/codigo), TEMP/TMP aislados.
Build frontend PASS, advertencia preexistente >500 kB no corregida.
Sintaxis 4/4 y git diff --check PASS.

| Medida | Frontend P1 -> P2 | Backend P1 -> P2 |
| --- | --- | --- |
| Statements | 21.63% -> 43.62% | 39.93% -> 39.93% |
| Branches | 81.39% -> 80.48% | 86.19% -> 86.19% |
| Functions | 53.55% -> 57.44% | 47.29% -> 47.29% |
| Lines | 21.63% -> 43.62% | 39.93% -> 39.93% |
| DA cubiertas | 1592 -> 3210 (+1618) | 1496 -> 1496 |
| Archivos | 43 -> 43 | 42 -> 42 |

Nuevas funciones/ramas realmente observadas amplian denominadores; descenso porcentual de Branches no prueba regresion. Fuente completa c8 all=true y mismas exclusiones. No se persigue 80% global.

### Impacto comprobado en regiones prioritarias

| Fuente | DA P1 | DA P2 | Incremento | Proxy DA antes sin hits ahora cubiertas/total |
| --- | ---: | ---: | ---: | ---: |
| micodent-frontend/src/components/CitaModal.jsx | 0/271 | 247/271 | +247 | 22/22 |
| micodent-frontend/src/components/Diente.jsx | 0/34 | 34/34 | +34 | 7/7 |
| micodent-frontend/src/components/MetodoPago.jsx | 0/19 | 19/19 | +19 | 1/1 |
| micodent-frontend/src/components/OdontogramaEditor.jsx | 0/325 | 301/325 | +301 | 43/43 |
| micodent-frontend/src/pages/FinanzasDashboard.jsx | 303/661 | 539/661 | +236 | 45/61 |
| micodent-frontend/src/pages/PacienteDetalle.jsx | 0/1275 | 623/1275 | +623 | 95/189 |

Cuatro objetivos principales: 205 DA locales añadidas antes sin hits ahora cubiertas; incluyendo otros imports/consumidores: 215. Proxy pendiente baja474 -> 259. NO son 215 nuevas lineas Sonar ni se dividen entre239.
Se preserva credito honesto: Produccion sin render sigue0/3 funciones y9/76 DA; AnexosPaciente/SignaturePad y handlers no ejecutados de PacienteDetalle siguen a cero. Rx/recetas reciben credito incidental por imports, NO nuevos casos academicos completos.

### Contencion y criterio de parada

LCOV ambos regenerados y validados: 85/85 SF reales bajo src, DA dentro de archivos, sin duplicados ni edicion manual. Tamaños/hashes en CURRENT_TASK.md.
151 archivos anteriores comparados por SHA-256: 150 intactos; solo frontera API de tests modificada. Fuentes/manifiestos, tests previos, bridge JSX, SONAR_REMEDIATION_LOG.md y sonar-project.properties intactos.
Documentos actualizados solo CURRENT_TASK.md, este plan y NEW_CODE_COVERAGE_MAP.md. Sin nuevas dependencias, codigo funcional, DB/.env, exclusiones/Gate, push, scanner, Cypress, P3, PostgreSQL, Docker, Universidad ni E01-E17.
Regresiones: no detectadas por suites/build. Sin pruebas clinicas/DB real ni validacion manual.
PARADA: seis tests, varias regiones modificadas prioritarias cubiertas; no mas pruebas por cantidad.

ESTIMACION >=80% NEW CODE: SI, expectativa razonable considerando74.8% comunicado y ejecucion nueva de varios bloques modificados; NO resultado medido ni garantia83-85%. La cobertura Sonar incluye condiciones y requiere reanalisis.
SIGUIENTE ACCION EXACTA: ejecutar SonarQube y verificar New Code Coverage >=80% / Quality Gate.
DETENIDO: sin ejecutar scanner ni iniciar otros lotes.

## 12. Lote academico A (2026-10-03)

FASE: ACADEMIC_TESTS_LOTE_A_COMPLETE
CASOS PREVIOS: 18/60. CASOS NUEVOS: 14 (7 frontend + 7 backend).
TOTAL IMPLEMENTADO: 32/60 (20 frontend + 12 backend); pendientes28.
TDD REAL: 0; nuevos14 TESTS AUTOMATIZADOS RETROACTIVOS. Los14 son IDs distintos del catalogo, no variantes contadas por separado. Casos previos18 conservados; F05/F13 siguen parciales y no se suman.

Sonar POST P2 informado por el usuario: Quality Gate PASSED; New Code Coverage96.1%, issues0, duplicaciones0.0%, hotspots0; Overall Coverage47.0%, duplicaciones5.6%, issues abiertos0 y aceptadoS5693 contextual1. No scanner/API Sonar en este lote ni objetivo de80% global.

| Caso | Modulo | Evidencia nueva | Resultado |
| --- | --- | --- | --- |
| B08 | Pacientes | micodent-backend/tests/unit/academic-a-patients.test.cjs: ACA-A-B08 | PASS |
| B09 | Pacientes | micodent-backend/tests/unit/academic-a-patients.test.cjs: ACA-A-B09 | PASS |
| B12 | Antecedentes y triaje | micodent-backend/tests/unit/academic-a-history.test.cjs: ACA-A-B12 | PASS |
| B13 | Evolucion clinica | micodent-backend/tests/unit/academic-a-history.test.cjs: ACA-A-B13 | PASS |
| B18 | Agenda | micodent-backend/tests/unit/academic-a-agenda.test.cjs: ACA-A-B18 | PASS |
| B19 | Agenda | micodent-backend/tests/unit/academic-a-agenda.test.cjs: ACA-A-B19 | PASS |
| B20 | Agenda y recuperacion | micodent-backend/tests/unit/academic-a-agenda.test.cjs: ACA-A-B20 | PASS |
| F06 | Pacientes | micodent-frontend/tests/academic-a-lists.test.mjs: ACA-A-F06 | PASS |
| F07 | Datos personales/apoderado | micodent-frontend/tests/academic-a-patient.test.mjs: ACA-A-F07 | PASS |
| F08 | Historia y firmas | micodent-frontend/tests/academic-a-patient.test.mjs: ACA-A-F08 | PASS |
| F22 | Orden Rx | micodent-frontend/tests/academic-a-documents.test.mjs: ACA-A-F22 | PASS |
| F23 | Receta y firma/sello | micodent-frontend/tests/academic-a-documents.test.mjs: ACA-A-F23 | PASS |
| F25 | Proteccion de sesion | micodent-frontend/tests/academic-a-session.test.mjs: ACA-A-F25 | PASS |
| F27 | Inicio y deudas | micodent-frontend/tests/academic-a-lists.test.mjs: ACA-A-F27 | PASS |

Detalle completo con ID/tipo/herramienta/modulo/objetivo/precondiciones/pasos/esperado/obtenido/estado/archivo: ACADEMIC_TEST_CASES.md. Rutas relativas a raiz verificada.

### Validacion y cobertura

Backend grupos4/4 (pacientes/historia) +3/3 (agenda); frontend2/2 (paciente) +2/2 (listas) +3/3 (documentos/sesion), todos PASS. Suites completas usando scripts de coverage existentes: frontend122/122 PASS y backend116/116 PASS,0 omitidos/fallos; TEMP/TMP backend aislados. Build PASS; advertencia >500kB preexistente.

| Medida | Frontend P2 -> A | Backend P2 -> A |
| --- | --- | --- |
| Tests | 115 -> 122 | 109 -> 116 |
| Statements/Lines | 43.62% -> 57.88% | 39.93% -> 49.19% |
| Branches | 80.48% -> 81.05% | 86.19% -> 86.32% |
| Functions | 57.44% -> 57.61% | 47.29% -> 60.81% |
| DA cubiertas/totales | 4259/7358 (+1049) | 1843/3746 (+347) |

LCOV generados por c8, validos85/85 SF bajo src; DA/terminadores validos, sin duplicados ni edicion manual. Hashes/tamaños en CURRENT_TASK.md. Config/exclusiones/Gate originales intactos; nuevas ramas/funciones observadas amplian denominadores. No confundir cobertura local con New Code Sonar.

### Fidelidad y contencion

Originales ejecutados con imports reales; no fragmentos VM/AST ni copia de algoritmo como evidencia principal. node:test actual conservado. Frontend usa RTL/React/Router/jsdom/bridge Babel existente; backend controla frontera SQL. Canvas/imagenes/RAF/print/store/temporizadores simulados expresamente. Nuevos casos backend son pruebas directas de controladores, no HTTP real ni MySQL; no se añade Supertest innecesariamente.

F08 cubre dos peticiones distintas, fallo parcial y reenvio; no atomicidad/idempotencia entre peticiones. F25 no monta privado sin identidad; conserva el ya montado oculto/inert en bloqueo para retener borrador. F22/F23 comprueban documento imprimible y orden DOM, no pixels/impresora. F27 recibe total API coherente con fixture, sin probar agregacion backend; B30 sigue pendiente.
Ajustes iniciales solo del arnes: fecha futura de enero UTC puede ser diciembre local, se prueba junio; tres tiles11/12/21, no cuatro. No modificar producto para pasar tests ni presentar RED-GREEN-REFACTOR ficticio.

155 archivos protegidos:154 intactos; unico helper existente cambiado component-boundaries.mjs añade status/browserSession. Ocho nuevos archivos tests/helper. Todo src/manifests/locks, tests previos, bridge JSX, propiedades Sonar, SONAR_REMEDIATION_LOG.md y NEW_CODE_COVERAGE_MAP.md intactos.
Documentos autorizados: CURRENT_TASK.md, este plan y ACADEMIC_TEST_CASES.md. Sin DB/.env/permisos reales/dependencias nuevas/scanner/push/Cypress/E01-E17/Universidad/PostgreSQL/Docker/project.yml/.gitlab-ci.yml ni duplicacion global.
Regresiones no detectadas por suites/build; sin certificacion clinica. Al cierre A quedaban28; lista actualizada tras B en ACADEMIC_TEST_CASES.md.

SIGUIENTE ACCION EXACTA: Implementar siguiente lote academico cuando lo solicite el usuario.
DETENIDO: no iniciar otro lote automaticamente.

## 13. Lote academico B (2026-10-03)

FASE: ACADEMIC_TESTS_LOTE_B_COMPLETE
CASOS ANTES: 32/60; NUEVOS: 14 (6 frontend + 8 backend); TOTAL: 46/60.
DISTRIBUCION ACUMULADA: 26 frontend + 20 backend; pendientes14.
TDD REAL: 0;14 nuevos TESTS AUTOMATIZADOS RETROACTIVOS;46 acumulados. Sin cambio funcional.

| Caso | Modulo | Evidencia nueva | Resultado |
| --- | --- | --- | --- |
| B05 | Usuarios y permisos | micodent-backend/tests/unit/academic-b-users.test.cjs: ACA-B-B05 | PASS |
| B10 | Pacientes / contrato HTTP | micodent-backend/tests/unit/academic-b-patients.test.cjs: ACA-B-B10 | PASS |
| B11 | Historia clinica / contrato HTTP | micodent-backend/tests/unit/academic-b-patients.test.cjs: ACA-B-B11 | PASS |
| B25 | Gastos | micodent-backend/tests/unit/academic-b-expenses.test.cjs: ACA-B-B25 | PASS |
| B26 | Gastos y trazabilidad | micodent-backend/tests/unit/academic-b-expenses.test.cjs: ACA-B-B26 | PASS |
| B28 | Laboratorio | micodent-backend/tests/unit/academic-b-laboratory.test.cjs: ACA-B-B28 | PASS |
| B29 | Resumen financiero | micodent-backend/tests/unit/academic-b-summary.test.cjs: ACA-B-B29 | PASS |
| B30 | Dashboard y deudas | micodent-backend/tests/unit/academic-b-summary.test.cjs: ACA-B-B30 | PASS |
| F13 | Refresco financiero | micodent-frontend/tests/academic-b-finance.test.mjs: ACA-B-F13 | PASS |
| F24 | Perfil | micodent-frontend/tests/academic-b-profile-login.test.mjs: ACA-B-F24 | PASS |
| F26 | Reporte de historia clinica | micodent-frontend/tests/academic-b-history.test.mjs: ACA-B-F26 | PASS |
| F28 | Helpers en composicion | micodent-frontend/tests/academic-b-data-api.test.mjs: ACA-B-F28 | PASS |
| F29 | Login | micodent-frontend/tests/academic-b-profile-login.test.mjs: ACA-B-F29 | PASS |
| F30 | Axios y sesiones | micodent-frontend/tests/academic-b-data-api.test.mjs: ACA-B-F30 | PASS |

IDs distintos y pendientes del catalogo; ninguna repeticion de los32 anteriores. El reparto6/8 prioriza contratos HTTP de pacientes/historias, usuario con limites de nivel, gastos/laboratorio y finanzas sobre simetria. F13 completa timer/listeners; las respuestas fuera de orden/error siguen cubiertas por F12. F28 integra helpers existentes con render RX y stores, sin contar de nuevo pruebas unitarias. Detalle docente completo en ACADEMIC_TEST_CASES.md.

### Validacion y cobertura B

Grupos: backend2/2+4/4+2/2; frontend3/3+3/3 y reporte1/1 tras ampliacion de firma. Suites completas con cobertura: frontend128/128 PASS; backend124/124 PASS;0 omitidos/fallos. TEMP/TMP aislados por script existente. Build PASS (573.11kB, advertencia >500kB preexistente).

| Medida | Frontend A -> B | Backend A -> B |
| --- | --- | --- |
| Tests | 122 -> 128 | 116 -> 124 |
| Statements/Lines | 57.88% -> 72.73% | 49.19% -> 65.18% |
| Branches | 81.05% -> 81.46% | 86.32% -> 84.69% |
| Functions | 57.61% -> 50.89% | 60.81% -> 72.18% |
| DA cubiertas/totales | 5352/7358 (+1093) | 2442/3746 (+599) |
| Branches cubiertas/totales | 1248/1532 | 603/712 |
| Functions cubiertas/totales | 257/505 | 109/151 |

c8 all=true y exclusiones originales intactos; ampliacion de denominadores al observar funciones/ramas nuevas. Functions frontend y Branches backend bajan en porcentaje pero aumentan numeradores (227->257 y467->603). No regresion de suites ni manipulacion de cobertura. Sonar usa medidas diferentes; no reanalisis ni promesa de variacion del Gate/New Code.

LCOV frontend:43 SF,114068 bytes, SHA-256 a2e03e1255403f07ada822ba6506bf7d7d83d2e14f9ea15ca6b040f9163ccd1a.
LCOV backend:42 SF,54100 bytes, SHA-256 92ced78f3369306fd7dc5d122067822a889f75d6d6cd169f12bdd23fb3c57dd3.
Validados85/85 SF reales bajo src; registros DA dentro de archivos, sin duplicados ni edicion manual.

### Fidelidad, limites y contencion B

B10/B11: fetch nativo contra servidor Express real efimero, auth/rutas/middleware originales; base de datos sintetica. Resto backend: controlador/servicios originales con SQL simulado. No Supertest innecesario, deps nuevas, MySQL real ni prueba de concurrencia fisica.
B28 no copia hashing/negocio: frontera guarda huella suministrada por requestOnce original. Replay no duplica pago ni auditoria pero repite INSERT IGNORE de confirmacion. B29 verifica calculos sobre agregados simulados; B30 suma grupos en centimos.
F24/F26 verifican conservacion/payload/relogin/reporte/anexos/print, no recorte, impresora real ni todas las subidas binarias. F29 simula API/store y no demuestra bootstrap servidor; F25/F30 cubren identidad y bloqueo. F30 ejecuta Axios y store originales; solo transport adapter sintetico. No claim de UI manual/navegador externo.
Helper academic-db extiende execute para sesion real y expone fixture;163 archivos protegidos:162 intactos y esa sola extension. Nueve nuevos archivos de tests; todas las fuentes, tests previos, manifests/locks, scanner config y documentos Sonar no autorizados intactos. Sintaxis10/10 PASS y git diff --check PASS.
Fallos iniciales por arnes/expectativa (execute, contadores con login/replay, timer RTL50ms, aviso fijo) corregidos solo en tests; no producto ni TDD ficticio.
Actualizacion documental solo este plan, ACADEMIC_TEST_CASES.md y CURRENT_TASK.md. Sin DB/.env/roles reales/scanner/push/E01-E17/Cypress/Universidad/PostgreSQL/Docker/project.yml/.gitlab-ci.yml.
Pendientes backend10: B01,B02,B14,B15,B16,B17,B21,B22,B23,B24. Frontend4: F05,F09,F16,F19. F05 parcial, no contado.

SIGUIENTE ACCION EXACTA: Implementar Lote Academico C para alcanzar60/60 cuando el usuario lo solicite.
DETENIDO: no iniciar C ni otras tareas automaticamente.

## 14. Lote academico C - cierre 60/60

FASE: ACADEMIC_TESTS_60_COMPLETE
CASOS ANTES:46/60. CASOS NUEVOS:14. TOTAL:60/60.
Distribucion C:4 frontend +10 backend. Acumulado:30 frontend +30 backend.
TDD REAL:0. Retroactivos:14 en C,60 acumulados.
Diez nuevos tests (4 FE +6 BE) en cinco archivos y cuatro casos reutilizados (B01,B02,B16,B21). No duplicacion de tests existentes ni IDs nuevos ajenos al catalogo. Los apartados12/13 anteriores describen checkpoints historicos A/B, no pendientes vigentes.

| ID | Modulo | Evidencia C | Resultado |
| --- | --- | --- | --- |
| B01 | Sesion | REUTILIZADO, sin duplicar | PASS; limites en ficha |
| B02 | CSRF y autorizacion | REUTILIZADO, sin duplicar | PASS; limites en ficha |
| B14 | Orden RX y receta | NUEVO | PASS; limites en ficha |
| B15 | Anexos clinicos | NUEVO | PASS; limites en ficha |
| B16 | Archivos privados | REUTILIZADO, sin duplicar | PASS; limites en ficha |
| B17 | Carga y staging clinico | NUEVO | PASS; limites en ficha |
| B21 | Comisiones | REUTILIZADO, sin duplicar | PASS; limites en ficha |
| B22 | Tratamientos y abono inicial | NUEVO | PASS; limites en ficha |
| B23 | Cobros, confirmaciones y POS | NUEVO | PASS; limites en ficha |
| B24 | Anulacion de abonos | NUEVO | PASS; limites en ficha |
| F05 | Lista de pacientes | NUEVO | PASS; limites en ficha |
| F09 | Anexos en historia clinica | NUEVO | PASS; limites en ficha |
| F16 | Agenda mes/semana/dia | NUEVO | PASS; limites en ficha |
| F19 | Diente y selector de piezas | NUEVO | PASS; limites en ficha |

### Validacion y cobertura C

Suites completas con cobertura:frontend132/132 PASS,backend130/130 PASS;0 fallos/omitidos. Build PASS. TEMP/TMP aislados por runner backend existente.
Dirigidos:BE documentos/anexos3/3,pagos3/3,reutilizados33/33;FE anexos/teclado4/4 y repeticion4/4 tras ampliacion de limites/eventos.
Sintaxis5/5 PASS; git diff --check PASS. Todos los60 IDs asociados a nombres de test encontrados en fuente y resultados PASS, indice completo en ACADEMIC_TEST_CASES.md.
60 IDs unicos (F01-F30/B01-B30), duplicados0, faltantes0, casos sin test0;14 fichas nuevas contienen11 campos docentes cada una.

| Medida | Frontend B -> C | Backend B -> C |
| --- | --- | --- |
| Tests | 128 -> 132 | 124 -> 130 |
| Statements/Lines | 72.73% -> 73.66% | 65.18% -> 76.00% |
| Branches | 81.46% -> 81.81% | 84.69% -> 82.15% |
| Functions | 50.89% -> 51.18% | 72.18% -> 79.47% |
| DA cubiertas/totales C | 5420/7358 | 2847/3746 |
| Branches cubiertas/totales C | 1273/1556 | 741/902 |
| Functions cubiertas/totales C | 260/508 | 120/151 |

c8 all=true y exclusiones originales intactos. Branches backend amplia denominador712->902 y numerador603->741; porcentaje menor no equivale a regresion. Las medidas locales no son New Code Sonar; no se ejecuto scanner ni se afirma Gate actualizado.
LCOV FE:43 SF,114609 bytes,SHA-256756e27a56a23e94d733aa4a9e915905712fc1190bd55eea6abbb93f619ad8b15.
LCOV BE:42 SF,57121 bytes,SHA-256e1e4f4e4c150ab59d0b25c241cbac9de6dba62ae1c14e8ec6cdacb698692f088.
85/85 SF resolubles bajo src,sin duplicados,DA dentro de archivo y reportes no vacios; regenerados por runner,no editados a mano.

### Fidelidad y limites C

Backend ejecuta controladores/servicios originales con frontera SQL sintetica; B01/B02/B16 reutilizan HTTP Express/fetch existentes. Archivos sinteticos en directorio temporal aislado, ninguna informacion clinica real. Transacciones/rollback verificados contra frontera, no motor MySQL fisico ni concurrencia real.
B22 prueba evolucion firmada,costos/laboratorio/abono; B23 calcula huella con servicio original y preserva principal/recargo/snapshot POS/replay; B24 anulacion logica del ultimo vigente con dual auditoria.
B14 conserva contenido y enlace de reemplazo pero no prueba firma/sello historicos inmutables: lectura usa perfil actual. Objetivo inicial de firma historica queda limitado, no se declara corregido.
B17 verifica staging y bytes reales sinteticos; fallo INSERT despues del enlace deja archivo huerfano preexistente; commit incierto conserva bytes. Multer real10MiB/MIME/extension se verifica mediante test existente,sin duplicarlo.
F09 ejecuta PacienteDetalle/ClinicalImage originales en RTL/jsdom:busy,doble evento,errores/lista/reintento. EXE llega a API porque frontend delega rechazo; no certifica la prevalidacion MIME inicialmente deseada. Toast de exito de subida precede recarga fallida; error/lista se conservan. Discrepancias registradas,no funcionalidad cambiada.
F05/F16/F19 usan Edge headless real,componentes/CSS originales y API sintetica; Enter/Space/Tab/touch,slots/fechas,cita/doctor,diente/selector y callbacks una vez. No claim de inspeccion manual humana. Browser no instrumentado en LCOV Node; no cobertura inventada/mezclada.
F19 Diente expone aria-pressed y disabled; PiezaSelector comunica seleccion por clase visual pero no aria-pressed. Limitacion semantica pendiente,no se silencia.
Playwright ya disponible en runtime de Codex (MICODENT_PLAYWRIGHT_MODULE permite ubicacion alternativa) y Edge instalado; sin dependencia instalada. Falta de runtime/browser falla,no omite pruebas.
Catalogo60/60 completo significa evidencia automatizada por ID; NO certifica todos los ideales del plan,produccion ni ausencia de defectos.

### Contencion y siguiente paso C

SHA-256172/172 archivos protegidos intactos:src/activos,tests/helpers previos,manifests/locks,sonar-project.properties,SONAR_REMEDIATION_LOG.md y NEW_CODE_COVERAGE_MAP.md.
Cinco archivos nuevos:
- `micodent-backend/tests/unit/academic-c-documents.test.cjs`
- `micodent-backend/tests/unit/academic-c-attachments.test.cjs`
- `micodent-backend/tests/unit/academic-c-payments.test.cjs`
- `micodent-frontend/tests/academic-c-keyboard.test.mjs`
- `micodent-frontend/tests/academic-c-attachments.test.mjs`

Solo tres documentos editados:este plan,ACADEMIC_TEST_CASES.md,CURRENT_TASK.md. Coverage/dist regenerados con scripts existentes.
SIN DB/.env,nuevas dependencias,cambios funcionales,roles reales,Sonar,push/commit,E01-E17,Cypress,Universidad,PostgreSQL,Docker,project.yml,.gitlab-ci.yml ni refactor general. Warning build573.11kB>500kB preexistente.
Pendientes del catalogo:0. Las limitaciones del producto anteriores siguen documentadas, no se confunden con casos sin test.

SIGUIENTE ACCION EXACTA: Implementar suite Cypress E2E con solicitud posterior; no instalado ni iniciado en C.
DETENIDO: no iniciar otra fase ni ejecutar scanner/push.

# MICODENT - Mapa de cobertura New Code / P1

FECHA: 2026-10-03
PROYECTO: micodent-post
ORIGEN: http://localhost:9000 (solo GET; no analisis iniciado)
ESTADO: MAPA LOCAL P2 ACTUALIZADO; METRICAS/LINEAS SONAR POR ARCHIVO NO DISPONIBLES

## Limite de evidencia

Sonar Community Build 26.9.0.129388 responde UP (api/system/status, HTTP 200).
Sin autenticacion: api/measures/component_tree, api/measures/component y api/sources/lines responden HTTP 401. SONAR_TOKEN no disponible en el entorno. No se pidieron, imprimieron ni almacenaron credenciales; no se intento login ni alterar permisos/configuracion.

Por ello no fue posible obtener por archivo new_lines_to_cover, new_uncovered_lines, new_coverage, coverage, lines_to_cover, uncovered_lines, condiciones nuevas ni lineHits/isNew. ND no significa cero. Las 239 lineas nuevas, cobertura 0.8% y Overall18.2% son el ultimo estado informado por el usuario, no medidas consultadas ahora.

NO se puede identificar con rigor que archivos explican la mayor parte de las 239 lineas. La tabla usa el fallback autorizado: LCOV baseline + git diff frente a HEAD bbc15f187b1191169aafc3e8c651da38f9348f17 + log de familias/POST. Los bloques añadidos por extraccion/movimiento no equivalen al periodo New Code de Sonar, y pueden sumar mas de 239. No sumar este proxy para afirmar una cobertura Sonar.

## Priorizacion operativa

Los mayores bloques locales añadidos sin hits son AdministracionPersonal (222 DA), PacienteDetalle (189), Pacientes (90) y FinanzasDashboard (88). Personal/Pacientes/Finanzas se seleccionan para P1 por extracciones POST y comportamiento comprobable. PacienteDetalle queda pendiente del siguiente lote: no se amplia esta sesion a todos los modulos.

Puente JSX probado primero con ModalDialog/ConfirmModal; luego consumidores reales de personal/listas/caja. Backend prioriza comparadores/seguridad de usuarios y lectura de laboratorio, invocando fuente original. No se fabrican nuevas llamadas a codigo muerto ni se fuerzan ramas imposibles (comparador igualdad tras deduplicacion de IDs).

## Tabla baseline por archivo

ND = no disponible por HTTP401. DA = linea reportada por LCOV/c8, no clasificacion AST de linea ejecutable Sonar. Orden por lineas locales añadidas con DA=0, luego mayor brecha LCOV. Fuera de src no se proponen tests. Referencias de tests anteriores y detalle de objetivos: COVERAGE_TEST_PLAN.md, catalogo B01-B30/F01-F30.

| Archivo | New lines to cover (Sonar) | New uncovered lines (Sonar) | New coverage (Sonar) | DA sin cubrir baseline | Añadidas locales DA=0 | Lineas/regiones prioritarias (proxy local) | Tests existentes relacionados (casos del plan) | P1 seleccionado |
| --- | --- | --- | --- | ---: | ---: | --- | --- | --- |
| micodent-frontend/src/pages/AdministracionPersonal.jsx | ND | ND | ND | 565 | 222 | 19-218,274,285-287,317-318,361,438-447,524,551,556-558 | Sin referencia directa; ver inventario del plan | F01: FE-P1-03/04/10; F02: FE-P1-05/06; F03: FE-P1-07/08/09 |
| micodent-frontend/src/pages/PacienteDetalle.jsx | ND | ND | ND | 1275 | 189 | 13,106-230,396-397,436-437,458-459,469-470,480-481,605-606,651-652,658,668,679,682,713-714,767-768,802,814-815,819-820,824-825,829-830,834-835,840-841,848-849,860-861,865-866,870-871,881,937-941,965,977,1080,1084,1094,1098,1111,1115,1146,1163,1192,1196,1224,1260 | F09 | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/pages/Pacientes.jsx | ND | ND | ND | 305 | 90 | 61-62,136-222,298 | F04, F05 | F04: FE-P1-11 |
| micodent-frontend/src/pages/FinanzasDashboard.jsx | ND | ND | ND | 661 | 88 | 4,18-56,133,252,306-307,310-311,319-320,341,344-346,372-375,405,453,508-509,513-515,525,533-534,539,541-542,547-548,553-554,558-559,568,572,581-582,590-591,595-596,601-602,608,612,647 | Sin referencia directa; ver inventario del plan | F12: FE-P1-12 |
| micodent-frontend/src/components/OdontogramaEditor.jsx | ND | ND | ND | 325 | 43 | 15-17,128-165,182,237 | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/components/CitaModal.jsx | ND | ND | ND | 271 | 22 | 1,19,21,180,189,208-209,213-214,220-221,226-227,236-237,241-242,250-251,254,260,263 | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/pages/Historias.jsx | ND | ND | ND | 528 | 21 | 9,34-42,133,140,156,159-160,236,240-241,272,428,513 | F26 | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/pages/Agenda.jsx | ND | ND | ND | 171 | 19 | 46,112-128,157 | F16 | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/components/ModalDialog.jsx | ND | ND | ND | 17 | 17 | 1-17 | F20 | F20: FE-P1-02; F21: FE-P1-01 |
| micodent-frontend/src/components/OrdenRadiografiaTab.jsx | ND | ND | ND | 586 | 12 | 9,76,102-103,106,112,380,393,397,418,422,457 | F22 | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/controllers/gastos.controller.js | ND | ND | ND | 217 | 12 | 42,46,55,65,88,103,113-114,150,185,227,239 | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/controllers/historias.controller.js | ND | ND | ND | 885 | 11 | 223,475,516,539,549,567,578,587,599,685,740 | B17 | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/controllers/usuarios.controller.js | ND | ND | ND | 137 | 9 | 8-12,24,79,118,188 | B04, B07 | B03: BE-P1-02; B04: BE-P1-01; B06: BE-P1-06; B07: BE-P1-03 |
| micodent-frontend/src/pages/MiPerfil.jsx | ND | ND | ND | 414 | 8 | 3-4,177-178,195,221,245,286 | F24 | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/components/SessionBoundary.jsx | ND | ND | ND | 76 | 8 | 47-53,65 | F25 | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/components/RecetarioTab.jsx | ND | ND | ND | 295 | 7 | 7,141,155,159,180,184,225 | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/controllers/dashboard.controller.js | ND | ND | ND | 194 | 7 | 39,142-143,146,149,168,197 | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/components/Diente.jsx | ND | ND | ND | 34 | 7 | 11-15,26,34 | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/components/AgendaDia.jsx | ND | ND | ND | 88 | 6 | 48-49,51-52,55-56 | F16 | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/controllers/laboratorio.controller.js | ND | ND | ND | 80 | 6 | 22,24-27,55 | B27 | B27: BE-P1-04/05 |
| micodent-frontend/src/components/ConfirmModal.jsx | ND | ND | ND | 70 | 6 | 2,38-41,66 | F05 | F03: FE-P1-07/08/09; F21: FE-P1-01 |
| micodent-backend/src/services/session.service.js | ND | ND | ND | 44 | 6 | 22-26,149 | B01, B04 | B03: BE-P1-02; B04: BE-P1-01 |
| micodent-backend/src/controllers/pacientes.controller.js | ND | ND | ND | 297 | 5 | 88,112,209,250,324 | B08, B09 | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/components/ConfiguracionPos.jsx | ND | ND | ND | 36 | 4 | 5,25-26,34 | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/pages/Dashboard.jsx | ND | ND | ND | 290 | 3 | 106,199-200 | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/components/ClinicalImage.jsx | ND | ND | ND | 45 | 3 | 24,34,36 | F09 | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/components/RxTeethPrint.jsx | ND | ND | ND | 31 | 3 | 13-14,20 | F22 | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/services/api.js | ND | ND | ND | 180 | 2 | 49,61 | F30 | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/components/AgendaMes.jsx | ND | ND | ND | 61 | 2 | 26,35 | F16 | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/utils/modalFocus.js | ND | ND | ND | 2 | 2 | 69-70 | F20 | F20: FE-P1-02 |
| micodent-frontend/src/pages/Produccion.jsx | ND | ND | ND | 76 | 1 | 57 | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/components/AgendaSemana.jsx | ND | ND | ND | 70 | 1 | 39 | F16 | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/components/PiezaSelector.jsx | ND | ND | ND | 33 | 1 | 12 | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/components/MetodoPago.jsx | ND | ND | ND | 19 | 1 | 17 | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/controllers/citas.controller.js | ND | ND | ND | 188 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/pages/Login.jsx | ND | ND | ND | 115 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/layouts/MainLayout.jsx | ND | ND | ND | 106 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/index.js | ND | ND | ND | 84 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/controllers/cobros.controller.js | ND | ND | ND | 72 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/services/finanzas.js | ND | ND | ND | 64 | 0 | Sin linea añadida DA=0 detectada | B21 | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/App.jsx | ND | ND | ND | 57 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/utils/tratamientosDb.js | ND | ND | ND | 54 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/components/FirmaMiniBlock.jsx | ND | ND | ND | 51 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/controllers/produccion.controller.js | ND | ND | ND | 50 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/utils/agendaUtils.js | ND | ND | ND | 37 | 0 | Sin linea añadida DA=0 detectada | F16 | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/controllers/pos.controller.js | ND | ND | ND | 24 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/utils/printDocument.js | ND | ND | ND | 21 | 0 | Sin linea añadida DA=0 detectada | F22 | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/components/AppErrorBoundary.jsx | ND | ND | ND | 19 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/middleware/limitarAutenticacion.js | ND | ND | ND | 18 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/config/multer.js | ND | ND | ND | 15 | 0 | Sin linea añadida DA=0 detectada | B17 | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/services/operacionFinanciera.js | ND | ND | ND | 14 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/controllers/auditoria.controller.js | ND | ND | ND | 13 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/utils/fecha.js | ND | ND | ND | 11 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/services/browserSession.js | ND | ND | ND | 8 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/utils/securityError.js | ND | ND | ND | 6 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/components/PrintPortal.jsx | ND | ND | ND | 5 | 0 | Sin linea añadida DA=0 detectada | F26 | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/routes/pacientes.routes.js | ND | ND | ND | 5 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/utils/auditoriaFinanciera.js | ND | ND | ND | 5 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/utils/auditoriaSeguridad.js | ND | ND | ND | 5 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/controllers/auth.controller.js | ND | ND | ND | 4 | 0 | Sin linea añadida DA=0 detectada | B01 | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/routes/historias.routes.js | ND | ND | ND | 4 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/config/environment.js | ND | ND | ND | 2 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/middleware/auth.js | ND | ND | ND | 2 | 0 | Sin linea añadida DA=0 detectada | B02 | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/services/password.service.js | ND | ND | ND | 2 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/services/session.js | ND | ND | ND | 0 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/services/sessionState.js | ND | ND | ND | 0 | 0 | Sin linea añadida DA=0 detectada | F25, F28, F30 | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/utils/data.js | ND | ND | ND | 0 | 0 | Sin linea añadida DA=0 detectada | F28 | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/utils/financeEvents.js | ND | ND | ND | 0 | 0 | Sin linea añadida DA=0 detectada | F28, F30 | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/utils/passwordPolicy.js | ND | ND | ND | 0 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-frontend/src/utils/rxTeeth.js | ND | ND | ND | 0 | 0 | Sin linea añadida DA=0 detectada | F22, F28 | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/config/browserTransport.js | ND | ND | ND | 0 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/config/db.js | ND | ND | ND | 0 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/routes/auditoria.routes.js | ND | ND | ND | 0 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/routes/auth.routes.js | ND | ND | ND | 0 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/routes/citas.routes.js | ND | ND | ND | 0 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/routes/dashboard.routes.js | ND | ND | ND | 0 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/routes/gastos.routes.js | ND | ND | ND | 0 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/routes/laboratorio.routes.js | ND | ND | ND | 0 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/routes/usuarios.routes.js | ND | ND | ND | 0 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/services/accessPolicy.js | ND | ND | ND | 0 | 0 | Sin linea añadida DA=0 detectada | B02 | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/services/browserTransport.js | ND | ND | ND | 0 | 0 | Sin linea añadida DA=0 detectada | B02 | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/services/clinicalFiles.js | ND | ND | ND | 0 | 0 | Sin linea añadida DA=0 detectada | B16 | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/services/clinicalUpload.js | ND | ND | ND | 0 | 0 | Sin linea añadida DA=0 detectada | B16, B17 | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/services/security.js | ND | ND | ND | 0 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |
| micodent-backend/src/utils/jsonFields.js | ND | ND | ND | 0 | 0 | Sin linea añadida DA=0 detectada | Sin referencia directa; ver inventario del plan | Pendiente / sin test dedicado en este lote |

## Verificacion pendiente

Al disponer de export/API autorizada del ultimo analisis: añadir por archivo las seis metricas solicitadas y new_conditions_to_cover/new_uncovered_conditions; obtener lista isNew/lineHits/condiciones y revision/periodo. Reordenar por evidencia real, no por volumen total del fichero. Solo entonces se puede estimar la fraccion de las 239 lineas cubierta y comprobar >=80%.

En esta sesion se ejecutan tests y se regeneran LCOV. El resultado local posterior NO actualiza el analisis Sonar ya existente. Ver cierre P1 mas abajo cuando termine la validacion.

## Resultado P1 y regiones que permanecen pendientes

P1: 18 nuevos tests; 12/60 casos academicos. Frontend 109/109, backend 109/109, build frontend PASS. Mapeo test/caso y pasos/esperado/obtenido: COVERAGE_TEST_PLAN.md seccion 10.
Las tablas anteriores son baseline PRE-P1, no el estado final de hits. Las tres columnas Sonar permanecen ND por 401.

| Fuente con incremento | DA cubiertas baseline | DA cubiertas P1 | Incremento | Proxy añadidas antes sin hits ahora cubiertas/total |
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

Cobertura final local:
- Frontend Statements/Lines 21.63%, Branches 81.39%, Functions 53.55%; 1592/7358 DA; +1231 DA / +16.73 puntos.
- Backend Statements/Lines 39.93%, Branches 86.19%, Functions 47.29%; 1496/3746 DA; +192 DA / +5.12 puntos.
- 85/85 archivos src permanecen reportados; no exclusiones nuevas ni LCOV editados manualmente. Reportes validos/hashes en CURRENT_TASK.md.
- Proxy previo 844 DA añadidas con cero hits; despues de P1, 370 tienen hits y 474 siguen sin hits. No es New Code de Sonar ni se divide entre 239.
- El puente JSX definitivo usa Babel/sourcemaps: se descarto credito erroneo inicial de rolldown. Produccion sigue con 0/3 funciones y 9/76 DA por imports, no por montaje. El resto de flujos Finanzas no se declara cubierto.

### Mayores brechas restantes del proxy (NO mapa exacto Sonar)

| Fuente | DA añadidas locales todavia sin hits | Lineas (proxy local) |
| --- | ---: | --- |
| micodent-frontend/src/pages/PacienteDetalle.jsx | 189 | 13,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,396,397,436,437,458,459,469,470,480,481,605,606,651,652,658,668,679,682,713,714,767,768,802,814,815,819,820,824,825,829,830,834,835,840,841,848,849,860,861,865,866,870,871,881,937,938,939,940,941,965,977,1080,1084,1094,1098,1111,1115,1146,1163,1192,1196,1224,1260 |
| micodent-frontend/src/pages/FinanzasDashboard.jsx | 61 | 19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,252,372,373,374,375,405,453,508,509,513,514,515,525,533,534,539,541,542,547,548,553,554,558,559,568,572,581,582,590,591,595,596,601,602,608,612,647 |
| micodent-frontend/src/components/OdontogramaEditor.jsx | 43 | 15,16,17,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,182,237 |
| micodent-frontend/src/components/CitaModal.jsx | 22 | 1,19,21,180,189,208,209,213,214,220,221,226,227,236,237,241,242,250,251,254,260,263 |
| micodent-frontend/src/pages/Historias.jsx | 21 | 9,34,35,36,37,38,39,40,41,42,133,140,156,159,160,236,240,241,272,428,513 |
| micodent-frontend/src/pages/Agenda.jsx | 19 | 46,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,157 |
| micodent-frontend/src/components/OrdenRadiografiaTab.jsx | 12 | 9,76,102,103,106,112,380,393,397,418,422,457 |
| micodent-backend/src/controllers/gastos.controller.js | 12 | 42,46,55,65,88,103,113,114,150,185,227,239 |
| micodent-backend/src/controllers/historias.controller.js | 11 | 223,475,516,539,549,567,578,587,599,685,740 |
| micodent-frontend/src/pages/MiPerfil.jsx | 8 | 3,4,177,178,195,221,245,286 |
| micodent-frontend/src/components/SessionBoundary.jsx | 8 | 47,48,49,50,51,52,53,65 |
| micodent-frontend/src/pages/Pacientes.jsx | 7 | 176,188,189,207,208,209,210 |

Sonar puede seleccionar un conjunto distinto de estos bloques por su periodo New Code. No se conoce que archivos explican la mayoria de las 239 lineas reales; se necesita reanalisis y acceso a medidas/fuentes para afirmarlo.
ESTIMACION P1 CUBRE GRAN PARTE DE LAS 239 LINEAS: INCIERTO.
SIGUIENTE PASO: ejecutar SonarQube para medir New Code Coverage real despues de P1.
DETENIDO: sin iniciar P2 ni ejecutar analisis.

## Actualizacion P2 (2026-10-03)

ESTADO: P2 COMPLETO, REANALISIS SONAR PENDIENTE.
Sonar despues de P1 comunicado por usuario: New Code Coverage74.8%, 239 lineas; requisito>=80%; Gate falla solo por cobertura. 0 issues nuevos, 0.0% duplicacion New Code, 0 hotspots.
No consultas/scan durante P2. Las metricas por archivo y condiciones Sonar siguen ND; tablas anteriores son referencia PRE-P1/P1, no resultado P2 ni periodo exacto.
Autoridad local P2: LCOV fisico P1 + diff de extracciones/cambios. Se detectaron empty-reports en PacienteDetalle/Odontograma/Cita y handlers reales sin hits en Finanzas. Se seleccionaron seis pruebas sobre cuatro fuentes.

| Fuente dirigida | DA P1 | DA P2 | Incremento | Proxy añadido antes sin hits ahora cubierto/total |
| --- | ---: | ---: | ---: | ---: |
| micodent-frontend/src/components/CitaModal.jsx | 0/271 | 247/271 | +247 | 22/22 |
| micodent-frontend/src/components/Diente.jsx | 0/34 | 34/34 | +34 | 7/7 |
| micodent-frontend/src/components/MetodoPago.jsx | 0/19 | 19/19 | +19 | 1/1 |
| micodent-frontend/src/components/OdontogramaEditor.jsx | 0/325 | 301/325 | +301 | 43/43 |
| micodent-frontend/src/pages/FinanzasDashboard.jsx | 303/661 | 539/661 | +236 | 45/61 |
| micodent-frontend/src/pages/PacienteDetalle.jsx | 0/1275 | 623/1275 | +623 | 95/189 |

Regiones recorridas realmente:
- PacienteDetalle.jsx: ModalTratamiento175-230; tipos/inputs/cancelacion/nuevo/editar/POS; validacion y submit654-699; modal abono1083-1095 y handler710-729; recarga de evoluciones. F10/F11.
- FinanzasDashboard.jsx: EstadoPagoLaboratorio18-42; formularios/selectores gastos525-568; listas/filtros/anular/reactivar; registrar pago249-265 y consumidor del refresco. F14/F15.
- OdontogramaEditor.jsx: renderEntryForm128-165 y permisos de boton15-17; validar, cancelar/confirmar arcada, guardado fallido y correcciones firmadas. F18.
- CitaModal.jsx: formulario JSX/controladores crear/editar, campos/labels/duracion, conflicto409/busy, estados. F17.

205 DA del proxy cubiertas en esos cuatro archivos; 215 incluyendo Diente/MetodoPago e imports. Proxy P1 sin hits474 -> 259. NO equivalen a las239 lineas Sonar.
Credito incidental de Rx/recetas/catalogo no se usa para afirmar casos completos de esos modulos. Produccion continua0/3 funciones; AnexosPaciente/SignaturePad no invocados conservan cero hits.

Frontend115/115 PASS; Statements/Lines43.62%, Branches80.48%, Functions57.44%; +1618 DA/+21.99 puntos vs P1.
Backend109/109 PASS; Statements/Lines39.93%, Branches86.19%, Functions47.29%, sin cambio.
Build PASS; ambos LCOV regenerados,85/85 SF validos. Fuentes/exclusiones/configuracion intactas; sin LCOV manual. Evidencia/hash en CURRENT_TASK.md y pasos/esperado/obtenido en plan seccion11.

ESTIMACION >=80% NEW CODE: SI, razonable como expectativa; no confirmada ni se promete83-85% antes de scan.
PARADA: seis tests significativos recorren varias regiones nuevas prioritarias. No perseguir cobertura global ni iniciar mas lotes.
SIGUIENTE PASO: ejecutar SonarQube y verificar Quality Gate/New Code Coverage >=80%.

# MICODENT - Casos academicos automatizados

FASE: ACADEMIC_TESTS_60_COMPLETE
FECHA: 2026-10-03
IMPLEMENTADOS: 60/60
CASOS PREVIOS: 46/60
CASOS NUEVOS: 14 (4 frontend + 10 backend)
DISTRIBUCION ACUMULADA: 30 frontend + 30 backend.
TDD REAL: 0. TESTS AUTOMATIZADOS RETROACTIVOS: 60 acumulados, 14 nuevos.
REVISION: HEAD bbc15f187b1191169aafc3e8c651da38f9348f17 + worktree actual; sin commit/push.
RAIZ: F:\ChatGPT\MICODENT — Sistema de Gestión Odontológica\MICODENT_DEV\.runtime\e09-agenda-api

## Alcance y evidencia historicos del lote A

Un ID B/F representa un caso academico, no necesariamente una unica asercion. En este lote hay exactamente14 tests nuevos, cada uno identificado ACA-A-<ID>; variantes dentro del mismo test no aumentan el contador.
Se ejecutan controladores, componentes y utilidades originales. No se copia logica ni se usa VM/AST como prueba principal.
Frontend: node:test + React Testing Library + React/Router + jsdom; bridge JSX Babel existente.
Backend: node:test + controladores originales; academic-db.cjs sustituye exclusivamente la frontera SQL, registra consultas y controla respuestas/fallos. No prueba HTTP ni MySQL real. El nombre API del catalogo describe el contrato del controlador, no una peticion HTTP nueva en este lote; no se instala Supertest por no necesitar otra dependencia.
Canvas/imagenes/decode/print/RAF, API, store y timers son fronteras simuladas. El algoritmo de agenda, payloads, normalizacion, guardados, seleccion Rx y printDocument son los originales.
No se afirma TDD: no se corrigio funcionalidad, y los fallos iniciales del arnes no son un ciclo RED-GREEN-REFACTOR de producto.

Suites con coverage: Frontend122/122 PASS; Backend116/116 PASS; 0 fallos,0 omitidos; TEMP/TMP backend aislados con runner existente. Build PASS.
Cypress/E2E siguen separados y pendientes. No se ejecuta SonarQube.

## Casos previos conservados: 18

| IDs | Archivo de evidencia existente |
| --- | --- |
| B03,B04,B06,B07,B27 | micodent-backend/tests/unit/coverage-p1.test.cjs |
| F01,F02,F03 | micodent-frontend/tests/coverage-p1-personal.test.mjs |
| F04,F12 | micodent-frontend/tests/coverage-p1-pages.test.mjs |
| F20,F21 | micodent-frontend/tests/coverage-p1-modals.test.mjs |
| F10,F11 | micodent-frontend/tests/coverage-p2-patient.test.mjs |
| F14,F15 | micodent-frontend/tests/coverage-p2-finance.test.mjs |
| F17,F18 | micodent-frontend/tests/coverage-p2-clinical.test.mjs |

Detalle historico P1/P2: COVERAGE_TEST_PLAN.md secciones10/11. Se conservan los tests anteriores sin cambios; su evidencia no se reinventa ni se recuenta como nueva.

## Lote A: 14 casos nuevos

### B08

ID: B08 (test ACA-A-B08)
TIPO: TEST AUTOMATIZADO RETROACTIVO
HERRAMIENTA: node:test + assert; controlador original/frontera SQL sintetica
MODULO: Pacientes
OBJETIVO: Alta coordinada y rollback sin escrituras parciales.
PRECONDICIONES: DNI ficticio libre; INSERT devuelve paciente41/HC7; segunda ejecucion falla en antecedentes.
PASOS: Ejecutar crearPaciente; verificar paciente/HC/numeracion, apoderado y auditorias; repetir con fallo intermedio.
RESULTADO ESPERADO: 201, HC-0007, seis INSERT coherentes, commit/release; fallo500 con rollback y ninguna escritura confirmada.
RESULTADO OBTENIDO: Coincide con lo esperado; aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-backend/tests/unit/academic-a-patients.test.cjs

### B09

ID: B09 (test ACA-A-B09)
TIPO: TEST AUTOMATIZADO RETROACTIVO
HERRAMIENTA: node:test + assert; controlador original/frontera SQL sintetica
MODULO: Pacientes
OBJETIVO: Rechazar DNI existente y nacimiento invalido antes del INSERT.
PRECONDICIONES: Respuestas SQL sinteticas; DNI existente o nacimiento vacio/invalido/1899/año siguiente en junio.
PASOS: Ejecutar crearPaciente para cinco variantes; inspeccionar respuesta y llamadas SQL.
RESULTADO ESPERADO: 400; solo SELECT de DNI; rollback/release una vez; sin commit ni INSERT.
RESULTADO OBTENIDO: Coincide con lo esperado; aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-backend/tests/unit/academic-a-patients.test.cjs

### B12

ID: B12 (test ACA-A-B12)
TIPO: TEST AUTOMATIZADO RETROACTIVO
HERRAMIENTA: node:test + assert; controlador original/frontera SQL sintetica
MODULO: Antecedentes y triaje
OBJETIVO: Conservar campos, auditar y cerrar transaccion ante error.
PRECONDICIONES: HC7; campos ficticios y signos vitales; variantes sin signos, fallo auditoria e ID invalido.
PASOS: Guardar con/sin triaje; comparar parametros; provocar fallo de auditoria; probar ID invalido.
RESULTADO ESPERADO: 200 y campos exactos; triaje solo si corresponde; auditoria del actor;500 fijo/rollback;400 sin consultas para ID invalido.
RESULTADO OBTENIDO: Coincide con lo esperado; aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-backend/tests/unit/academic-a-history.test.cjs

### B13

ID: B13 (test ACA-A-B13)
TIPO: TEST AUTOMATIZADO RETROACTIVO
HERRAMIENTA: node:test + assert; controlador original/frontera SQL sintetica
MODULO: Evolucion clinica
OBJETIVO: No sobrescribir evolucion firmada; agregar correccion trazable.
PRECONDICIONES: Consulta71 firmada en HC7; variantes ausente, no firmada y motivo vacio.
PASOS: Intentar editar; agregar adenda; comprobar INSERT y auditoria; probar rechazos.
RESULTADO ESPERADO: 409 sin UPDATE;201 con motivo/contenido/actor;404/400 sin escrituras para variantes invalidas.
RESULTADO OBTENIDO: Coincide con lo esperado; aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-backend/tests/unit/academic-a-history.test.cjs

### B18

ID: B18 (test ACA-A-B18)
TIPO: TEST AUTOMATIZADO RETROACTIVO
HERRAMIENTA: node:test + assert; controlador original/frontera SQL sintetica
MODULO: Agenda
OBJETIVO: Crear/editar sin solapamiento y comprobar referencias activas.
PRECONDICIONES: Agenda sintetica de one; paciente41; cita08:00-09:00; variantes09:30, doctor/paciente ausentes.
PASOS: Crear09:00, editar excluyendo el propio ID; repetir con solapamiento y referencias no activas.
RESULTADO ESPERADO: 201/200 y payload normalizado; limites contiguos admitidos;409/400 sin INSERT ni commit; rollback y release.
RESULTADO OBTENIDO: Coincide con lo esperado; aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-backend/tests/unit/academic-a-agenda.test.cjs

### B19

ID: B19 (test ACA-A-B19)
TIPO: TEST AUTOMATIZADO RETROACTIVO
HERRAMIENTA: node:test + assert; controlador original/frontera SQL sintetica
MODULO: Agenda
OBJETIVO: Validar calendario, hora, duracion y formas de entrada.
PRECONDICIONES: Solicitud ficticia valida; diez variantes invalidas; control bisiesto2028-02-29.
PASOS: Enviar fecha imposible/formato incorrecto,24:00/09:60, cruce medianoche, duracion45/6e1, paciente negativo, celular/texto invalidos; enviar control valido.
RESULTADO ESPERADO: 400 antes de adquirir conexion; control201 con23:30:00 normalizado a23:30, duracion30 y paciente vacio convertido a null.
RESULTADO OBTENIDO: Coincide con lo esperado; aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-backend/tests/unit/academic-a-agenda.test.cjs

### B20

ID: B20 (test ACA-A-B20)
TIPO: TEST AUTOMATIZADO RETROACTIVO
HERRAMIENTA: node:test + assert; controlador original/frontera SQL sintetica
MODULO: Agenda y recuperacion
OBJETIVO: Liberar lock/conexion o destruir conexion incierta.
PRECONDICIONES: GET_LOCK simulado ocupado o libre; fallo INSERT; variantes RELEASE_LOCK0 y rollback fallido.
PASOS: Crear con lock ocupado; repetir fallo de operacion con liberacion fiable/no fiable y rollback fallido.
RESULTADO ESPERADO: 503 sin transaccion;500 generico y sin commit; rollback y RELEASE_LOCK; release solo si fiable, destroy si incierto.
RESULTADO OBTENIDO: Coincide con lo esperado; aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-backend/tests/unit/academic-a-agenda.test.cjs

### F06

ID: F06 (test ACA-A-F06)
TIPO: TEST AUTOMATIZADO RETROACTIVO
HERRAMIENTA: node:test + assert + React Testing Library/jsdom; componentes originales
MODULO: Pacientes
OBJETIVO: Debounce, filtros, orden sin mutar lista y cierre de menu.
PRECONDICIONES: Lista y filas congeladas con tres edades/estados; frontera API registra filtros; timers300ms controlados.
PASOS: Cambiar Al a Alfa antes del timer; ejecutar callback vigente; limpiar; ordenar nombre/edad/estado; pulsar fuera; activar archivados; desmontar.
RESULTADO ESPERADO: Un request con busqueda final; temporizador previo cancelado; orden correcto y fuente intacta; menu cierra; archived=true; timer limpiado.
RESULTADO OBTENIDO: Coincide con lo esperado; aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-frontend/tests/academic-a-lists.test.mjs

### F07

ID: F07 (test ACA-A-F07)
TIPO: TEST AUTOMATIZADO RETROACTIVO
HERRAMIENTA: node:test + assert + React Testing Library/jsdom; componentes originales
MODULO: Datos personales/apoderado
OBJETIVO: Payload validado, auditoria de cambios y retencion ante error.
PRECONDICIONES: Paciente menor ficticio cargado con apoderado; primer editar devuelve rechazo; segundo exito.
PASOS: Comprobar valores iniciales; introducir digitos/separadores en nombres/celulares; enviar; observar busy/error; reintentar; montar como Asistente.
RESULTADO ESPERADO: Campos sanitizados y payload snake_case exacto; cambios_detectados; error conserva edicion/libera busy; exito navega; pestañas clinicas Doctor ocultas al Asistente.
RESULTADO OBTENIDO: Coincide con lo esperado; aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-frontend/tests/academic-a-patient.test.mjs

### F08

ID: F08 (test ACA-A-F08)
TIPO: TEST AUTOMATIZADO RETROACTIVO
HERRAMIENTA: node:test + assert + React Testing Library/jsdom; componentes originales
MODULO: Historia y firmas
OBJETIVO: Guardados aplicables y recuperacion del fallo parcial.
PRECONDICIONES: HC con antecedentes previos; canvas externo simulado; firma nueva; guardarAntecedentes exito, guardarFirmas rechazo.
PASOS: Dibujar con handlers reales; editar motivo; guardar y rechazar firma; comprobar borrador; reintentar; repetir solo firma y sin cambios.
RESULTADO ESPERADO: Orden antecedentes->firma; no toast de exito en fallo; datos/busy recuperables; reintento conserva payload; solo firma cuando corresponde y cero llamadas sin cambios.
RESULTADO OBTENIDO: Coincide con lo esperado; aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-frontend/tests/academic-a-patient.test.mjs

### F22

ID: F22 (test ACA-A-F22)
TIPO: TEST AUTOMATIZADO RETROACTIVO
HERRAMIENTA: node:test + assert + React Testing Library/jsdom; componentes originales
MODULO: Orden Rx
OBJETIVO: Piezas y mapas presentes en preview y documento imprimible.
PRECONDICIONES: Orden ficticia con tomografia11/21 y periapical11/12; duplicados; dos mapas sinteticos; APIs de impresion simuladas.
PASOS: Abrir preview; comprobar opciones y tiles T/P,T,P; imprimir; repetir sin piezas y con un mapa ausente.
RESULTADO ESPERADO: Tres piezas unicas seleccionadas; dos mapas Huancayo/SanCarlos; print solo tras accion; decode previo; sin piezas no hay chart; mapa incompleto bloquea print.
RESULTADO OBTENIDO: Coincide con lo esperado; aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-frontend/tests/academic-a-documents.test.mjs

### F23

ID: F23 (test ACA-A-F23)
TIPO: TEST AUTOMATIZADO RETROACTIVO
HERRAMIENTA: node:test + assert + React Testing Library/jsdom; componentes originales
MODULO: Receta y firma/sello
OBJETIVO: Documento historico y PNG/fallback sin impresion automatica.
PRECONDICIONES: Receta vigente y otra anulada ficticias; firma/sello PNG; variantes sin sello y decode rechazado.
PASOS: Abrir preview; verificar Rp/indicaciones/firma/orden DOM; imprimir; simular fallo de imagen; montar sin sello.
RESULTADO ESPERADO: Anulada fuera de lista; PNG reemplaza fallback, firma precede sello; print solo al pulsar; fallo no imprime y libera busy; sin PNG nombre/COP fallback.
RESULTADO OBTENIDO: Coincide con lo esperado; aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-frontend/tests/academic-a-documents.test.mjs

### F25

ID: F25 (test ACA-A-F25)
TIPO: TEST AUTOMATIZADO RETROACTIVO
HERRAMIENTA: node:test + assert + React Testing Library/jsdom; componentes originales
MODULO: Proteccion de sesion
OBJETIVO: Checking, reintento, bloqueo y conservacion del borrador.
PRECONDICIONES: Store/API externos sinteticos; bootstrap rechazado y luego verificado; componente privado con contador de montajes.
PASOS: Montar checking sin identidad; rechazar/reintentar/verificar; escribir borrador; bloquear unavailable/expired/changed; desbloquear y desmontar.
RESULTADO ESPERADO: Sin identidad no monta privado; retry no autoriza; verificacion conserva epoch42; borrador previo permanece hidden/inert, no accesible; recuperacion intacta; abort/listeners limpiados.
RESULTADO OBTENIDO: Coincide con lo esperado; aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-frontend/tests/academic-a-session.test.mjs

### F27

ID: F27 (test ACA-A-F27)
TIPO: TEST AUTOMATIZADO RETROACTIVO
HERRAMIENTA: node:test + assert + React Testing Library/jsdom; componentes originales
MODULO: Inicio y deudas
OBJETIVO: Todos los tratamientos por paciente, total recibido y navegacion unica.
PRECONDICIONES: Paciente41, deudas80+30, total API110; router real observable; variantes error y vacio.
PASOS: Montar inicio; verificar agrupacion/importes; abrir pagos; simular fallo refresh; montar lista vacia.
RESULTADO ESPERADO: Un grupo con dos tratamientos y110; un evento de navegacion a pagos; error conserva lista; vacio sin tratamientos/boton.
RESULTADO OBTENIDO: Coincide con lo esperado; aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-frontend/tests/academic-a-lists.test.mjs

## Limites y observaciones

- B08/B12/B20 verifican llamadas y coordinacion transaccional con DB simulada; no certifican InnoDB, recuperacion fisica ni concurrencia entre procesos. B19 valida tambien bisiesto y fin exacto del dia.
- B09 reproduce validacion actual por año local; no demuestra validacion estricta de todos los dias ni de toda fecha futura. El fixture de año siguiente se mueve a junio: 1 de enero UTC puede caer en31 de diciembre local. El primer intento del test no fue un defecto nuevo de producto ni se cambio el controlador.
- F08 demuestra fallo parcial real del consumidor: antecedentes exitosos + firma fallida son dos peticiones distintas, no una transaccion atomica conjunta. Reintento vuelve a enviar ambos campos; no se afirma idempotencia ni rollback del servidor entre peticiones.
- F22 comprueba tres piezas unicas11/12/21 y mapa presente en DOM. La expectativa inicial de cuatro era un error del test corregido a tres; no se cambio el producto.
- F23 comprueba orden DOM firma->sello; no certifica geometria CSS, recorte de pixels ni impresora real. El DOM imprimible aparece al abrir preview y window.print solo al pulsar Imprimir, no automaticamente.
- F25 sustituye store/API para aislar el componente: sin identidad verificada no monta privado; con identidad previa conserva el borrador montado, oculto e inert. No confundir conservacion de estado con acceso autorizado. No prueba navegacion real a login ni flujo entre pestañas en navegador.
- F27 compara total110 recibido con saldos ficticios80/30 y todos los tratamientos; el componente no suma saldos del servidor. B30, pendiente al cierre A, se completa en lote B sobre filas sinteticas.
- Pruebas clinicas, MySQL real, teclado nativo, CSS, rendimiento y dispositivo de impresion no quedan certificados por este lote.
- Advertencia preexistente build: bundle JS573.11kB >500kB; fuera de alcance.

## Lote B: 14 casos nuevos (2026-10-03)

CASOS ANTES: 32/60; CASOS NUEVOS: 14; TOTAL: 46/60.
FRONTEND NUEVOS: 6; BACKEND NUEVOS: 8. Distribucion elegida por valor funcional: refuerzo de lectura HC, gastos/laboratorio y resumen, sin forzar teclas nativas que jsdom no demuestra.
TDD REAL: 0; TESTS AUTOMATIZADOS RETROACTIVOS: 14 nuevos,46 acumulados.

### B05

ID: B05 (test ACA-B-B05)
MODULO: Usuarios y permisos
HERRAMIENTA: node:test/assert + bcryptjs existente; controlador y servicios de seguridad originales
TIPO: TEST AUTOMATIZADO RETROACTIVO
OBJETIVO: Alta con hash real bcrypt y techo de acceso del actor.
PRECONDICION: Usuarios y sesiones ficticios, niveles 3/2/1; SQL externo simulado.
ACCION: Crear usuarios; comparar hash con password sintetico; probar niveles, rol, tasas 0/100/vacia/invalida, password corto y duplicado.
RESULTADO ESPERADO: 201 con hash no plano; nivel3 permite2 y nivel2 fuerza1; 403 no administrador; 400 entrada invalida antes de transaccion; 409 duplicado con rollback.
RESULTADO OBTENIDO: Aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-backend/tests/unit/academic-b-users.test.cjs

### B10

ID: B10 (test ACA-B-B10)
MODULO: Pacientes / contrato HTTP
HERRAMIENTA: node:test/assert + fetch nativo contra Express real; frontera SQL simulada
TIPO: TEST AUTOMATIZADO RETROACTIVO
OBJETIVO: Archivo y reactivacion coordinados con HC y validacion de ID en rutas reales.
PRECONDICION: Express real en puerto efimero loopback; login/cookie/CSRF sinteticos; paciente41/HC7 simulados.
ACCION: DELETE paciente41, GET lista, PUT reactivar y GET lista; probar inexistente99 e IDs0/-1/fraccion/unsafe/abc en tres rutas.
RESULTADO ESPERADO: 200 archivo/recuperacion de paciente y HC; lista vacia/completa segun estado; dos auditorias sin DELETE SQL; 404 sin nuevas escrituras; 400 IDs antes de consultas de datos.
RESULTADO OBTENIDO: Aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-backend/tests/unit/academic-b-patients.test.cjs

### B11

ID: B11 (test ACA-B-B11)
MODULO: Historia clinica / contrato HTTP
HERRAMIENTA: node:test/assert + fetch nativo contra Express real; frontera SQL simulada
TIPO: TEST AUTOMATIZADO RETROACTIVO
OBJETIVO: Lectura completa preserva IDs, DECIMAL y formatos JSON legacy.
PRECONDICION: HC7 con antecedente, triaje, diente/adenda, evolucion/pago/adenda, firma, anexo, receta, orden y auditoria ficticios.
ACCION: GET historia con JSON objeto, texto doble y malformado; repetir con historia ausente y fallo SQL.
RESULTADO ESPERADO: 200 y relaciones/importes exactos; arrays/opciones normalizados o fallback; 404 ausente,500 fijo ante fallo, sin escrituras.
RESULTADO OBTENIDO: Aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-backend/tests/unit/academic-b-patients.test.cjs

### B25

ID: B25 (test ACA-B-B25)
MODULO: Gastos
HERRAMIENTA: node:test/assert; controlador original y frontera SQL simulada
TIPO: TEST AUTOMATIZADO RETROACTIVO
OBJETIVO: Categorias, mes de consumo condicional y rechazo de importe/fecha.
PRECONDICION: Gasto ficticio10.50; siete categorias; transaccion simulada con registro de escrituras.
ACCION: Crear por categoria y sin mes; probar categoria desconocida, cero, negativo, exponente, precision excesiva y fecha vacia/imposible.
RESULTADO ESPERADO: 201 parametros y auditoria exactos; mes solo luz/agua/internet/alquiler; 400 sin consultas de datos ni commit, con rollback/release.
RESULTADO OBTENIDO: Aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-backend/tests/unit/academic-b-expenses.test.cjs

### B26

ID: B26 (test ACA-B-B26)
MODULO: Gastos y trazabilidad
HERRAMIENTA: node:test/assert; controlador original y frontera SQL simulada
TIPO: TEST AUTOMATIZADO RETROACTIVO
OBJETIVO: Editar/anular/reactivar sin borrado fisico y deshacer escritura si falla auditoria.
PRECONDICION: Gasto61 activo; variantes anulado/ausente y fallo de auditoria simulados.
ACCION: Editar importe/categoria, anular y reactivar; comparar antes/despues; probar estados incompatibles, ausencia y fallo posterior al UPDATE.
RESULTADO ESPERADO: 200 con tres auditorias; UPDATE de estado sin DELETE; 409 estados,404 ausencia; 500 fijo y ninguna escritura confirmada nueva al fallar auditoria.
RESULTADO OBTENIDO: Aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-backend/tests/unit/academic-b-expenses.test.cjs

### B28

ID: B28 (test ACA-B-B28)
MODULO: Laboratorio
HERRAMIENTA: node:test/assert; controlador, wrapper transaccional y finanzas originales
TIPO: TEST AUTOMATIZADO RETROACTIVO
OBJETIVO: Trabajo y pagos parcial/final con saldo e idempotencia.
PRECONDICION: Tratamiento71, trabajo81 total80; mapa de recibos almacena huella producida por servicio real; SQL simulado.
ACCION: Pagar30, repetir misma confirmacion, cambiar payload con esa clave; pagar50; probar exceso/cero/negativo/exponente/fecha/ausencia/clave; crear trabajo valido e invalido.
RESULTADO ESPERADO: 201 pagos30/50,200 repeticion sin nuevo pago/auditoria,409 conflicto/exceso; 400 invalidos y404 ausente; un trabajo creado con nombre recortado y80.00; tres auditorias.
RESULTADO OBTENIDO: Aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-backend/tests/unit/academic-b-laboratory.test.cjs

### B29

ID: B29 (test ACA-B-B29)
MODULO: Resumen financiero
HERRAMIENTA: node:test/assert; controlador original y agregados SQL sinteticos
TIPO: TEST AUTOMATIZADO RETROACTIVO
OBJETIVO: Separar caja efectiva, costos asignados y margen; representar legacy pendiente y saldo negativo.
PRECONDICION: Cobro100, POS3, laboratorio pagado20, gasto10, comision15, costo asignado30 y penalidad2 ficticios.
ACCION: Consultar resumen; activar legacy pendiente; aumentar gasto a100; provocar fallo de lectura.
RESULTADO ESPERADO: Ingresos103, salidas30, caja73; margen55/neto45; comision neta13; legacy con margenes null manteniendo caja; neto-45/caja-17;500 fijo/rollback/release.
RESULTADO OBTENIDO: Aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-backend/tests/unit/academic-b-summary.test.cjs

### B30

ID: B30 (test ACA-B-B30)
MODULO: Dashboard y deudas
HERRAMIENTA: node:test/assert; controlador original y filas SQL sinteticas
TIPO: TEST AUTOMATIZADO RETROACTIVO
OBJETIVO: Agrupar todos los tratamientos pendientes con suma exacta de centimos.
PRECONDICION: Paciente41 con saldos0.10/0.20 y paciente42 con15; variantes vacia/fallo.
ACCION: Consultar deudores, comparar grupos e IDs; repetir sin filas y con error.
RESULTADO ESPERADO: Dos grupos; paciente41 conserva tratamientos71/72 y total0.30; paciente42 total15; sin contador interno expuesto; lista vacia estable y500 fijo sin escrituras.
RESULTADO OBTENIDO: Aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-backend/tests/unit/academic-b-summary.test.cjs

### F13

ID: F13 (test ACA-B-F13)
MODULO: Refresco financiero
HERRAMIENTA: node:test/assert + RTL/React/jsdom + bridge Babel existente
TIPO: TEST AUTOMATIZADO RETROACTIVO
OBJETIVO: Completar eventos, visibilidad, timer y limpieza sin peticiones despues de unmount.
PRECONDICION: Resumen/gastos/laboratorio simulados; timer de30s controlado; timers de RTL permanecen reales.
ACCION: Emitir focus/storage relevante e irrelevante/evento financiero; cambiar visibilidad, ejecutar callback del timer; desmontar y emitir nuevamente.
RESULTADO ESPERADO: Cada evento valido refresca los tres consumidores; storage ajeno/oculto no; al desmontar elimina timer/listeners. Respuestas viejas y error con importes retenidos siguen cubiertos por FE-P1-12/F12 sin duplicarlos.
RESULTADO OBTENIDO: Aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-frontend/tests/academic-b-finance.test.mjs

### F24

ID: F24 (test ACA-B-F24)
MODULO: Perfil
HERRAMIENTA: node:test/assert + RTL/React/Router/jsdom + bridge Babel existente
TIPO: TEST AUTOMATIZADO RETROACTIVO
OBJETIVO: Guardar firma/sello propios y conservar edicion ante errores; password validado obliga relogin.
PRECONDICION: Doctor sintetico con firma/sello; API, canvas/Image y session boundary simulados; password ficticio.
ACCION: Eliminar sello y guardar con fallo/reintento; password no coincidente/corto; mostrar password; fallo de guardado y exito; carga de perfil rechazada.
RESULTADO ESPERADO: Payload firma conservada/sello null; error fijo sin falso exito y busy recuperado; invalidos no llaman API; error conserva valores; exito termina epoch y navega login; fallo carga no revela diagnostico.
RESULTADO OBTENIDO: Aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-frontend/tests/academic-b-profile-login.test.mjs

### F26

ID: F26 (test ACA-B-F26)
MODULO: Reporte de historia clinica
HERRAMIENTA: node:test/assert + RTL/React/Router/jsdom; window.print e Image simulados
TIPO: TEST AUTOMATIZADO RETROACTIVO
OBJETIVO: Carga real del reporte, firma/anexo, resumen y navegacion legacy.
PRECONDICION: Paciente41/HC-QA-41, antecedente/triaje/odontograma, tratamiento380 con pagos80+60, firma y anexo inline ficticios.
ACCION: Abrir ?view=41; comprobar contenido/tabla/firma; imprimir durante decode/error y tras reintento/load; provocar fallo y abrir edit/create/ruta sin view.
RESULTADO ESPERADO: Costo380/pagado140/resta240 y contenido intactos; decode/error bloquean print; listo imprime con titulo correcto y restaura Micodent; aviso fijo; rutas redirigen a pacientes sin UI legacy.
RESULTADO OBTENIDO: Aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-frontend/tests/academic-b-history.test.mjs

### F28

ID: F28 (test ACA-B-F28)
MODULO: Helpers en composicion
HERRAMIENTA: node:test/assert + helpers/componentes originales + RTL/jsdom
TIPO: TEST AUTOMATIZADO RETROACTIVO
OBJETIVO: Ampliar evidencia reutilizable con cadena legacy->normalizacion->piezas->DOM y eventos/sesion aislados.
PRECONDICION: JSON doble RX/DECIMAL/auditoria ficticios y dos stores reales compartiendo localStorage jsdom.
ACCION: Normalizar sin mutar entrada; renderizar RxTeethPrint y formatear auditoria; cambiar identidad y verificar epoch anterior/otra pestaña; emitir evento financiero.
RESULTADO ESPERADO: Tres piezas unicas12/11/21 con T/P en11, importes80/12 y antes/despues; login queda checking sin identidad; epoch viejo rechazado/otra store bloqueada; evento sin datos y sin token.
RESULTADO OBTENIDO: Aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-frontend/tests/academic-b-data-api.test.mjs

### F29

ID: F29 (test ACA-B-F29)
MODULO: Login
HERRAMIENTA: node:test/assert + RTL/React/Router/jsdom; API/store externos simulados
TIPO: TEST AUTOMATIZADO RETROACTIVO
OBJETIVO: Normalizar solo ID, controlar busy/errores y aceptar contexto para navegar.
PRECONDICION: Sesion anonima; API y frontera de store simuladas; router real, respuestas diferidas.
ACCION: Ingresar ID con espacios/mayusculas y password con espacios; toggle; doble click normal al boton busy; rechazar credenciales/red y luego aceptar login.
RESULTADO ESPERADO: ID minusculo recortado/password intacto; una llamada mientras disabled; error mantiene formulario sin aceptar sesion; exito acceptLogin con epoch previo y navegacion; sin token. Verificacion privada cubierta por F25/F30, no un bootstrap real en este test.
RESULTADO OBTENIDO: Aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-frontend/tests/academic-b-profile-login.test.mjs

### F30

ID: F30 (test ACA-B-F30)
MODULO: Axios y sesiones
HERRAMIENTA: node:test/assert + Axios real/adapter sintetico + browserSession/sessionState reales
TIPO: TEST AUTOMATIZADO RETROACTIVO
OBJETIVO: Ejecutar interceptores reales con store real para errores, eventos y respuesta tardia.
PRECONDICION: Axios/browserSession/sessionState originales; solo adapter de transporte simulado; identidadA y luegoB ficticias.
ACCION: Mutacion valida/ok=false; fallos403/503/red; iniciar GET con identidadA, cambiar aB y devolver401 antiguo; devolver401 vigente.
RESULTADO ESPERADO: Cookies y headers contexto correctos; normalizacion real; evento solo exito; 403/503/red conservan perfil;401 antiguo SESSION_CHANGED no borraB;401 vigente expired limpia cache; sin token.
RESULTADO OBTENIDO: Aserciones PASS en grupo especifico y suite completa con coverage.
ESTADO: IMPLEMENTADO_VALIDADO
ARCHIVO DE TEST: micodent-frontend/tests/academic-b-data-api.test.mjs

### Validacion y limites del lote B

- Grupos backend: pacientes2/2, gastos/resumen4/4 y usuarios/laboratorio2/2; frontend refresco/perfil/login3/3 y helpers/API/reporte3/3; reporte repetido1/1 tras añadir firma.
- Suites completas: frontend128/128 PASS (antes122); backend124/124 PASS (antes116);0 omitidos/fallos. TEMP/TMP aislados por runner existente. Build PASS; advertencia bundle573.11kB >500kB preexistente.
- c8 Lines/Statements: frontend72.73% (5352/7358), backend65.18% (2442/3746); Branches81.46%/84.69%; Functions50.89%/72.18%. Nuevas regiones observadas amplian denominadores; porcentaje Functions frontend menor no implica perdida de tests ni exclusiones (257 funciones cubiertas frente a227).
- LCOV generados,43+42 SF validos bajo src; DA validos, no duplicados ni edicion manual. Hashes en CURRENT_TASK.md; no scanner ejecutado.
- B10/B11 usan fetch contra Express real, middleware de sesion/CSRF y rutas reales, con SQL y datos sinteticos. No MySQL real ni Supertest instalado. Los demas casos backend ejecutan controladores/servicios reales directamente.
- B28 comprueba recibos, huella producida por el servicio original y ausencia de duplicacion del pago/auditoria. El INSERT IGNORE de confirmacion puede repetirse: no se afirma ausencia absoluta de consultas de escritura ni concurrencia/rollback fisico de MySQL. El mapa de recibos es una frontera, no una implementacion de hashing ni negocio.
- B29 verifica proyeccion/calculos del controlador sobre agregados simulados; no demuestra que MySQL agregue filas reales. B30 comprueba suma de centimos y todas las evoluciones; completa el lado backend referido por F27 del lote A.
- F13 completa listeners/timer/visibilidad; FE-P1-12 conserva evidencia de rangos, respuestas fuera de orden y error desactualizado. No se cuenta F12 otra vez.
- F24 comprueba firma existente y eliminacion del sello, error/reintento/password/relogin. No certifica subida binaria, recorte PNG, teclado nativo ni identidad servidor. Passwords de tests son sinteticos; no hay credenciales de instalaciones.
- F26 prueba datos y firma en DOM, carga/anexo con onLoad/onError y llamada a window.print con titulo. No impresora fisica ni geometria CSS; Image y print simulados.
- F28 amplia helpers ya existentes mediante composicion real hasta RxTeethPrint y dos stores; no recuenta sus tests unitarios como nuevos casos. F29 simula API/store del login; verifica payload, errores/busy y navegacion, no bootstrap servidor. F25 previo y F30 real documentan verificacion/bloqueo.
- F30 ejecuta Axios/api/browserSession/sessionState originales; solo sustituye transporte. El hook adicional evita sustituir store dentro de Axios. 401 tardio no borra nueva identidad; 401 vigente bloquea. No una prueba HTTP externa frontend.
- Ajustes de arnes: academic-db añade conexion.execute y expone fixture para auth real; contador de transacciones de login no se atribuye al crearUsuario; replay incluye INSERT IGNORE; timers50ms de RTL no se interceptan como timer30s; error de firma es aviso fijo del producto. Fallos iniciales del arnes corregidos sin alterar producto; no se presentan como TDD.
- Contencion SHA-256:163 archivos preexistentes inventariados,162 intactos; unica extension en micodent-backend/tests/helpers/academic-db.cjs. Nueve archivos nuevos de tests. src/manifests/locks/tests previos/propiedades Sonar/remediation log/map intactos.
- Documentacion actualizada solo ACADEMIC_TEST_CASES.md, COVERAGE_TEST_PLAN.md y CURRENT_TASK.md. Sin DB/.env/dependencias nuevas/push/Sonar/Cypress/E01-E17/Universidad/PostgreSQL/Docker/project.yml/.gitlab-ci.yml. Sintaxis10/10 y git diff --check PASS.

## Lote C - cierre de los 14 pendientes

FASE: ACADEMIC_TESTS_60_COMPLETE
CASOS ANTES: 46/60. CASOS NUEVOS: 14. TOTAL: 60/60.
DISTRIBUCION LOTE C: 4 frontend + 10 backend. TOTAL: 30 frontend + 30 backend.
TDD REAL: 0. RETROACTIVOS: 14 en C, 60 acumulados.
Diez nuevos tests (4 frontend + 6 backend) en cinco archivos; cuatro casos B01/B02/B16/B21 reutilizan tests existentes, sin duplicarlos. Un ID academico puede asociar varias pruebas/variantes; el numero de tests de suite no equivale al numero de casos.
Completar el catalogo significa que hay evidencia ejecutable para cada ID, no que toda expectativa ideal del plan ni todos los riesgos del producto esten resueltos. F09/B14/F19 registran discrepancias concretas; no se hicieron cambios funcionales para ocultarlas.

### B01 - Sesion

- ID: B01
- TIPO: TEST AUTOMATIZADO RETROACTIVO
- HERRAMIENTA: node:test + controlador/servicios originales; Express/fetch en B01/B02/B16 existentes, frontera SQL/fs segun caso.
- MODULO: Sesion
- OBJETIVO: Validar login seguro y bootstrap de pestaña.
- PRECONDICIONES: Express/rutas/sesion originales; usuarios y DB sinteticos; tests existentes, sin duplicarlos.
- PASOS: Ejecutar login; inspeccionar cookie/respuesta; probar bootstrap y lecturas/mutaciones sin binding.
- RESULTADO ESPERADO: Cookie HttpOnly host-only Strict; ningun JWT en JSON; otras operaciones requieren identidad de pestaña.
- RESULTADO OBTENIDO: PASS en dos tests existentes y suite completa. Reutilizacion explicita, no nuevo test.
- ESTADO: PASS automatizado; alcance y limitaciones indicados, no certificacion de produccion.
- ARCHIVO DE TEST: `micodent-backend/tests/unit/cookie-transport.test.js` (`login only returns a host-only HttpOnly Strict cookie, never a JWT in JSON`; `a fresh tab can bootstrap, but cannot omit binding on other reads or writes`)

### B02 - CSRF y autorizacion

- ID: B02
- TIPO: TEST AUTOMATIZADO RETROACTIVO
- HERRAMIENTA: node:test + controlador/servicios originales; Express/fetch en B01/B02/B16 existentes, frontera SQL/fs segun caso.
- MODULO: CSRF y autorizacion
- OBJETIVO: Rechazar mutaciones sin CSRF y permisos administrativos no concedidos.
- PRECONDICIONES: Middleware original y usuarios/roles sinteticos en pruebas HTTP existentes.
- PASOS: Omitir CSRF en operaciones clinicas/financieras/archivos/usuarios; intentar administracion sin rol.
- RESULTADO ESPERADO: Rechazo antes de controladores; permisos obtenidos de DB, no de identidad cookie.
- RESULTADO OBTENIDO: PASS en tres tests existentes y suite completa; ningun rol real modificado.
- ESTADO: PASS automatizado; alcance y limitaciones indicados, no certificacion de produccion.
- ARCHIVO DE TEST: `micodent-backend/tests/unit/cookie-transport.test.js` (`CSRF is bound to the cookie and required on every unsafe authenticated operation`; `clinical, financial, file and user mutations reject missing CSRF before controllers`; `cookie identity does not grant administrative permissions and DB roles remain authoritative`)

### B14 - Orden RX y receta

- ID: B14
- TIPO: TEST AUTOMATIZADO RETROACTIVO
- HERRAMIENTA: node:test + controlador/servicios originales; Express/fetch en B01/B02/B16 existentes, frontera SQL/fs segun caso.
- MODULO: Orden RX y receta
- OBJETIVO: Comprobar emision/reemision, piezas/opciones y enlace al documento reemplazado.
- PRECONDICIONES: historias.controller original; frontera SQL academic-db; documentos/doctor sinteticos.
- PASOS: Emitir y reemitir RX/receta; verificar datos serializados y reemplaza_a; simular ausencia, anulacion, validacion y fallo de auditoria.
- RESULTADO ESPERADO: Documento nuevo conserva contenido/seleccion y referencia al anterior; anterior no sobrescrito; validaciones y rollback controlados.
- RESULTADO OBTENIDO: PASS: cuatro auditorias, 400/404/409/500, rollback/release y ninguna eliminacion fisica. Firma historica inmutable NO demostrada: persiste doctor_id/flags y GET usa firma/sello actuales del perfil. Discrepancia del objetivo inicial registrada.
- ESTADO: PASS automatizado; alcance y limitaciones indicados, no certificacion de produccion.
- ARCHIVO DE TEST: `micodent-backend/tests/unit/academic-c-documents.test.cjs` (`ACA-C-B14 Rx and prescription issue/reissue retain content and replacement linkage`)

### B15 - Anexos clinicos

- ID: B15
- TIPO: TEST AUTOMATIZADO RETROACTIVO
- HERRAMIENTA: node:test + controlador/servicios originales; Express/fetch en B01/B02/B16 existentes, frontera SQL/fs segun caso.
- MODULO: Anexos clinicos
- OBJETIVO: Archivar sin borrar bytes y restaurar solo con archivo recuperable.
- PRECONDICIONES: Controlador/servicios originales; PNG sintetico en directorio temporal aislado; SQL simulado.
- PASOS: Listar activos; archivar; comprobar bytes; listar archivados con/sin isAdmin; simular ausencia del archivo; restaurar al devolverlo; repetir operaciones/fallar DB.
- RESULTADO ESPERADO: Archivo archivado oculto en activos pero bytes intactos; sin bytes no restaura; permisos, conflictos y errores seguros.
- RESULTADO OBTENIDO: PASS: 403/404/409/500, dos auditorias, bytes identicos; ausencia no desarchiva; sin DELETE SQL ni archivos reales.
- ESTADO: PASS automatizado; alcance y limitaciones indicados, no certificacion de produccion.
- ARCHIVO DE TEST: `micodent-backend/tests/unit/academic-c-attachments.test.cjs` (`ACA-C-B15 attachment archive preserves bytes; restoration requires available regular files`)

### B16 - Archivos privados

- ID: B16
- TIPO: TEST AUTOMATIZADO RETROACTIVO
- HERRAMIENTA: node:test + controlador/servicios originales; Express/fetch en B01/B02/B16 existentes, frontera SQL/fs segun caso.
- MODULO: Archivos privados
- OBJETIVO: Verificar sesion/binding, rutas seguras, streaming y firma de contenido.
- PRECONDICIONES: Tests existentes con sesion original y archivos sinteticos; no duplicacion.
- PASOS: Solicitar bytes con identidad valida/invalida/revocada; traversal, streams alternativos, URL remota, HTML/SVG; errores y JPEG/PDF truncados.
- RESULTADO ESPERADO: Solo identidad vigente recibe bytes exactos con no-store/nosniff; accesos/formatos peligrosos rechazados sin alterar archivos.
- RESULTADO OBTENIDO: PASS en ocho tests existentes; limite de carga cubierto adicionalmente por test Multer real existente ejecutado en grupo y suite.
- ESTADO: PASS automatizado; alcance y limitaciones indicados, no certificacion de produccion.
- ARCHIVO DE TEST: `micodent-backend/tests/unit/clinical-files.test.js` (`private file requires both live cookie and matching tab identity`; `streams existing bytes with private no-store, no sniffing, and safe disposition`; `paths cannot escape, use alternate streams, fetch remote URLs or serve active HTML/SVG`; `unknown records, missing bytes and invalid ids return generic errors without modifying files`; `database failure is sanitized and never produces file bytes`; `revoked sessions cannot read previously accessible files`); `micodent-backend/tests/unit/clinical-upload.test.js` (`file contents must agree with the extension, including an intact JPEG tail`; `PDF has a header and ending marker; active formats are never accepted`)

### B17 - Carga y staging clinico

- ID: B17
- TIPO: TEST AUTOMATIZADO RETROACTIVO
- HERRAMIENTA: node:test + controlador/servicios originales; Express/fetch en B01/B02/B16 existentes, frontera SQL/fs segun caso.
- MODULO: Carga y staging clinico
- OBJETIVO: Validar contenido y limpieza de staging, preservando bytes ante commit incierto.
- PRECONDICIONES: Controlador y validacion de contenido originales; directorio temporal aislado; DB/commit simulados. Multer real cubierto por test existente.
- PASOS: Contenido PNG falso/HC invalida; upload valido; INSERT falla despues de enlazar; commit incierto; ejecutar rechazo Multer existente.
- RESULTADO ESPERADO: Rechazos previos limpian staging; exito conserva bytes publicados; commit incierto no borra datos potencialmente confirmados.
- RESULTADO OBTENIDO: PASS: 400/201/500; staging eliminado en fallo INSERT pero archivo enlazado huerfano permanece (limitacion preexistente). Commit incierto conserva staging/publicado. Limite 10 MiB/MIME/extension validado por test Multer real existente.
- ESTADO: PASS automatizado; alcance y limitaciones indicados, no certificacion de produccion.
- ARCHIVO DE TEST: `micodent-backend/tests/unit/academic-c-attachments.test.cjs` (`ACA-C-B17 real staging cleanup rejects invalid content and retains bytes on uncertain commit`)

### B21 - Comisiones

- ID: B21
- TIPO: TEST AUTOMATIZADO RETROACTIVO
- HERRAMIENTA: node:test + controlador/servicios originales; Express/fetch en B01/B02/B16 existentes, frontera SQL/fs segun caso.
- MODULO: Comisiones
- OBJETIVO: Comprobar costo-primero, conservacion del abono y exactitud en centimos.
- PRECONDICIONES: Servicio finanzas original; tests existentes de calculo y validacion.
- PASOS: Ejecutar casos de costo, porcentajes 0/100, centimos y tres filas reportadas; rechazar negativos/exponentes/coerciones.
- RESULTADO ESPERADO: Abono = costo aplicado + comision + margen; redondeo determinista y montos invalidos rechazados.
- RESULTADO OBTENIDO: PASS en cuatro tests existentes, reutilizados sin copiar formulas ni sumar nuevos casos.
- ESTADO: PASS automatizado; alcance y limitaciones indicados, no certificacion de produccion.
- ARCHIVO DE TEST: `micodent-backend/tests/unit/finanzas.test.cjs` (`cash commission and first-cost allocation`; `zero rate, 100%, and cents are deterministic`; `reported rows: external recovery precedes commission and preserves each cent`; `amount validation rejects coercion, negative, exponent and overprecision`)

### B22 - Tratamientos y abono inicial

- ID: B22
- TIPO: TEST AUTOMATIZADO RETROACTIVO
- HERRAMIENTA: node:test + controlador/servicios originales; Express/fetch en B01/B02/B16 existentes, frontera SQL/fs segun caso.
- MODULO: Tratamientos y abono inicial
- OBJETIVO: Verificar evolucion firmada, costos/laboratorio y abono en una transaccion.
- PRECONDICIONES: cobros.controller y servicios originales; academic-db con consultas y transacciones registradas; datos sinteticos.
- PASOS: Costo 380, abono 120, laboratorio 80, extra 20, comision 30%; revisar filas/auditorias; probar pago excesivo, campos/fechas invalidos y fallo de auditoria.
- RESULTADO ESPERADO: Costo aplicado 100, base 20, comision 6, margen 14; evolucion firmada/bloqueada; datos invalidos rechazados y fallo revierte operaciones staged.
- RESULTADO OBTENIDO: PASS: campos clinicos originales, costos, laboratorio, pago y auditorias; 400/404/500 y rollback sin escrituras confirmadas. No certifica atomicidad fisica MySQL.
- ESTADO: PASS automatizado; alcance y limitaciones indicados, no certificacion de produccion.
- ARCHIVO DE TEST: `micodent-backend/tests/unit/academic-c-payments.test.cjs` (`ACA-C-B22 signed treatment, costs, laboratory and initial payment share transaction and rollback`)

### B23 - Cobros, confirmaciones y POS

- ID: B23
- TIPO: TEST AUTOMATIZADO RETROACTIVO
- HERRAMIENTA: node:test + controlador/servicios originales; Express/fetch en B01/B02/B16 existentes, frontera SQL/fs segun caso.
- MODULO: Cobros, confirmaciones y POS
- OBJETIVO: Verificar idempotencia, revision POS e independencia de principal/recargo.
- PRECONDICIONES: Servicios originales calculan huella/negocio; mapa externo almacena recibo proporcionado; SQL simulado.
- PASOS: Con abonos previos80 y costo externo100 registrar POS60 a30% y recargo3%; repetir clave/payload, cambiar payload/revision y exceder saldo.
- RESULTADO ESPERADO: Costo aplicado20, comision12, margen28; recargo1.80 independiente de principal60; replay sin nuevo pago/auditoria; conflicto409.
- RESULTADO OBTENIDO: PASS: snapshot POS y principal exactos, replay200 sin duplicado, conflicto/revision ausente u obsoleta/saldo409; monto invalido400 y consulta ausente404. No certifica concurrencia MySQL real.
- ESTADO: PASS automatizado; alcance y limitaciones indicados, no certificacion de produccion.
- ARCHIVO DE TEST: `micodent-backend/tests/unit/academic-c-payments.test.cjs` (`ACA-C-B23 payment confirmation replays once; POS revision and principal/recargo history stay distinct`)

### B24 - Anulacion de abonos

- ID: B24
- TIPO: TEST AUTOMATIZADO RETROACTIVO
- HERRAMIENTA: node:test + controlador/servicios originales; Express/fetch en B01/B02/B16 existentes, frontera SQL/fs segun caso.
- MODULO: Anulacion de abonos
- OBJETIVO: Permitir solo ultimo abono vigente con motivo y trazabilidad.
- PRECONDICIONES: Controlador/servicios originales; pagos/consultas/auditorias sinteticos.
- PASOS: Anular ultimo; intentar anterior/legacy pendiente; repetir anulado; probar inexistente/motivo invalido/fallo de auditoria.
- RESULTADO ESPERADO: Anulacion logica y dual auditoria; anteriores/legacy409; repetir no vuelve a escribir; no elimina pago/consulta original.
- RESULTADO OBTENIDO: PASS: 201/400/404/409/500, rollback en fallo de auditoria, sin DELETE ni UPDATE sobre pagos/consultas originales.
- ESTADO: PASS automatizado; alcance y limitaciones indicados, no certificacion de produccion.
- ARCHIVO DE TEST: `micodent-backend/tests/unit/academic-c-payments.test.cjs` (`ACA-C-B24 only latest current payment can be voided with reason and dual audit, never physical deletion`)

### F05 - Lista de pacientes

- ID: F05
- TIPO: TEST AUTOMATIZADO RETROACTIVO
- HERRAMIENTA: node:test + Playwright disponible + Edge headless + Vite/React/CSS originales.
- MODULO: Lista de pacientes
- OBJETIVO: Completar evidencia nativa de fila y acciones sin propagacion/doble ejecucion.
- PRECONDICIONES: Edge headless + Playwright ya disponible; wrapper node:test ejecuta browser test existente con componentes originales y servicios sinteticos.
- PASOS: Desktop1280x720/mobile390x844; fila, Enter/Space/Tab/touch, acciones imprimir/archivar/reactivar y cancelar.
- RESULTADO ESPERADO: Fila navega una vez; acciones no abren fila; cada activacion ejecuta una vez; cancelar no muta.
- RESULTADO OBTENIDO: PASS en navegador real para ambos tamaños. Se reutiliza script browser existente mediante nuevo wrapper; no se recuenta evidencia parcial como otro ID.
- ESTADO: PASS automatizado; alcance y limitaciones indicados, no certificacion de produccion.
- ARCHIVO DE TEST: `micodent-frontend/tests/academic-c-keyboard.test.mjs` (`ACA-C-F05 native patient actions isolate row navigation, Enter/Space and cancelled archive on desktop/mobile`)

### F09 - Anexos en historia clinica

- ID: F09
- TIPO: TEST AUTOMATIZADO RETROACTIVO
- HERRAMIENTA: node:test + RTL + jsdom + React/Router + Babel existentes.
- MODULO: Anexos en historia clinica
- OBJETIVO: Caracterizar upload/recarga fallidos, busy, lista conservada y error de imagen privada.
- PRECONDICIONES: PacienteDetalle/ClinicalImage originales en RTL/jsdom; API simulada, PNG/EXE ficticios; FormData original del entorno restaurado.
- PASOS: Sin archivo; carga PNG; evento duplicado ocupado; fallo upload; EXE rechazado por API; exito upload con refresh fallido; reintento y fallo imagen privada.
- RESULTADO ESPERADO: Una carga activa; errores terminan busy y conservan lista sin inventar reemplazo exitoso; mensajes seguros. Registrar divergencias respecto a prevalidacion y toast del plan.
- RESULTADO OBTENIDO: PASS de caracterizacion: sin archivo no API, duplicado ocupado ignorado; lista preservada en errores y reintento actualiza. EXE SI llega a API (rechazo delegado al backend), no hay prevalidacion MIME frontend. Toast Imagen subida ocurre antes de recarga fallida. Estas expectativas ideales del plan NO se certifican como resueltas.
- ESTADO: PASS automatizado; alcance y limitaciones indicados, no certificacion de produccion.
- ARCHIVO DE TEST: `micodent-frontend/tests/academic-c-attachments.test.mjs` (`ACA-C-F09 attachment upload and refresh failures retain list, release busy and show safe image errors`)

### F16 - Agenda mes/semana/dia

- ID: F16
- TIPO: TEST AUTOMATIZADO RETROACTIVO
- HERRAMIENTA: node:test + Playwright disponible + Edge headless + Vite/React/CSS originales.
- MODULO: Agenda mes/semana/dia
- OBJETIVO: Validar calendarios y slots con teclado nativo, cita/doctor y limites de fechas.
- PRECONDICIONES: Agenda y tres vistas originales; Edge headless, reloj fijo, API sintetica; sin DB ni .env.
- PASOS: Febrero bisiesto2024; alternar mes/semana/dia; Enter/Space en slots; slot ocupado; cita id71/doctor; siguiente dia y 31dic2026->1ene2027.
- RESULTADO ESPERADO: 35 celdas de febrero; rangos mes29ene-3mar/semana26feb-3mar/dia29feb; slot ejecuta una vez; ocupado deshabilitado; identidad/fechas preservadas.
- RESULTADO OBTENIDO: PASS: interaccion real de teclado, rangos/callbacks una vez y cambio de año. No solo eventos jsdom o inspeccion AST.
- ESTADO: PASS automatizado; alcance y limitaciones indicados, no certificacion de produccion.
- ARCHIVO DE TEST: `micodent-frontend/tests/academic-c-keyboard.test.mjs` (`ACA-C-F16 real calendars preserve leap dates, appointment identity, disabled slots and single native activation`)

### F19 - Diente y selector de piezas

- ID: F19
- TIPO: TEST AUTOMATIZADO RETROACTIVO
- HERRAMIENTA: node:test + Playwright disponible + Edge headless + Vite/React/CSS originales.
- MODULO: Diente y selector de piezas
- OBJETIVO: Verificar activacion nativa unica, estado visual y control disabled.
- PRECONDICIONES: Diente/PiezaSelector originales y CSS real; fixture controlado en Edge headless; datos odontologicos sinteticos.
- PASOS: Enter/Space en Diente/selector; comprobar numero/SVG/marcadores/seleccion; intentar diente read-only; Tab entre11/21.
- RESULTADO ESPERADO: Un callback por accion; seleccion conservada, Diente expone aria-pressed, read-only deshabilitado; registrar limite semantico de selector.
- RESULTADO OBTENIDO: PASS: Diente aria-pressed false/true, disabled y cuatro paths; selector52 dientes alterna[11]/[] y conserva clase visual. PiezaSelector NO expone aria-pressed; comunicacion semantica de seleccion sigue pendiente, no se presenta como accesibilidad plenamente resuelta.
- ESTADO: PASS automatizado; alcance y limitaciones indicados, no certificacion de produccion.
- ARCHIVO DE TEST: `micodent-frontend/tests/academic-c-keyboard.test.mjs` (`ACA-C-F19 native tooth and selector toggle once, preserve visual state and disable report-only tooth`)

## Validacion final del lote C

Frontend132/132 PASS; backend130/130 PASS;0 fallos/omitidos; build PASS. TEMP/TMP backend aislados por runner existente. Sintaxis5/5 PASS y git diff --check PASS verificados al cierre.
Grupos dirigidos: backend documentos/anexos3/3, pagos3/3 y reutilizados33/33; frontend anexos/teclado4/4, repetidos despues de ampliar limites/eventos4/4.
Frontend Statements/Lines73.66% (5420/7358), Branches81.81% (1273/1556), Functions51.18% (260/508).
Backend Statements/Lines76.00% (2847/3746), Branches82.15% (741/902), Functions79.47% (120/151).
Ambos LCOV regenerados por c8;85/85 SF resolubles bajo src; no vacios, sin duplicados y DA dentro de fuentes. Hashes en CURRENT_TASK.md; mismas fuentes/exclusiones all=true.
Branches backend baja84.69%->82.15% al ampliar denominador712->902; ramas cubiertas603->741. No exclusiones nuevas ni regresion de suites. El navegador nativo no se instrumenta en LCOV de Node; no se fabrican hits ni se fusionan reportes manualmente.
Edge headless/Playwright del runtime ya disponible; no npm install. Si cambia el equipo, requiere runtime Playwright disponible (MICODENT_PLAYWRIGHT_MODULE permite indicar su modulo) y Edge instalado; ausencia produce fallo, no skip.

### Limites y acciones pendientes del producto

- B14 conserva contenido/enlace de reemplazo pero NO garantiza snapshot inmutable de firma/sello; GET usa perfil actual.
- F09 no prevalida MIME en frontend: archivo invalido llega a API y es rechazado alli. Toast de subida exitosa precede recarga fallida; lista se conserva y se comunica error. Son discrepancias respecto al objetivo ideal, no mejoras implementadas.
- F19 Diente comunica seleccion con aria-pressed; PiezaSelector conserva clase visual pero no aria-pressed. Falta comunicar seleccion semanticamente en ese selector.
- B17 fallo SQL posterior al enlace conserva archivo huerfano; commit incierto conserva bytes para no perderlos. No se implemento recolector/limpieza nueva.
- Backend usa frontera SQL sintetica y archivos temporales ficticios; no confirma atomicidad/concurrencia fisica MySQL. Browser usa API sintetica y bloquea trafico externo; no imprime fisicamente ni valida instalaciones reales.
- Advertencia build573.11kB >500kB preexistente; fuentes funcionales intactas. Ninguna regresion detectada por estas suites; no una promesa de ausencia absoluta de fallos.

### Contencion C

SHA-256172/172 archivos preexistentes intactos, incluidos src/activos, tests/helpers previos, manifests/locks y propiedades Sonar. Ningun helper existente editado en C.
Cinco archivos nuevos:
- `micodent-backend/tests/unit/academic-c-documents.test.cjs`
- `micodent-backend/tests/unit/academic-c-attachments.test.cjs`
- `micodent-backend/tests/unit/academic-c-payments.test.cjs`
- `micodent-frontend/tests/academic-c-keyboard.test.mjs`
- `micodent-frontend/tests/academic-c-attachments.test.mjs`

Solo tres documentos editados: este catalogo, COVERAGE_TEST_PLAN.md y CURRENT_TASK.md. Coverage/dist regenerados con scripts existentes. Sin DB/.env, cambios de roles, dependencias nuevas, Sonar, push/commit, E01-E17, Cypress, Universidad, PostgreSQL, Docker, project.yml ni .gitlab-ci.yml.

## Indice verificable de los 60 casos

Cada fila referencia archivo y nombre exacto encontrados en fuente y salida PASS de las suites completas de esta sesion. Las referencias de casos previos permanecen vigentes; no se recuentan IDs.

| ID | Area | Archivo y tests asociados | Resultado |
| --- | --- | --- | --- |
| B01 | Backend | `micodent-backend/tests/unit/cookie-transport.test.js`: `login only returns a host-only HttpOnly Strict cookie, never a JWT in JSON`; `a fresh tab can bootstrap, but cannot omit binding on other reads or writes` | PASS |
| B02 | Backend | `micodent-backend/tests/unit/cookie-transport.test.js`: `CSRF is bound to the cookie and required on every unsafe authenticated operation`; `clinical, financial, file and user mutations reject missing CSRF before controllers`; `cookie identity does not grant administrative permissions and DB roles remain authoritative` | PASS |
| B03 | Backend | `micodent-backend/tests/unit/coverage-p1.test.cjs`: `BE-P1-02 B03 real credential reset/reactivation: revocation and denied hierarchy` | PASS |
| B04 | Backend | `micodent-backend/tests/unit/coverage-p1.test.cjs`: `BE-P1-01 B04 real user editing/deactivation: stable locks, permissions and rollback` | PASS |
| B05 | Backend | `micodent-backend/tests/unit/academic-b-users.test.cjs`: `ACA-B-B05 user creation hashes passwords and enforces actor access ceilings` | PASS |
| B06 | Backend | `micodent-backend/tests/unit/coverage-p1.test.cjs`: `BE-P1-06 B06 actual signing assets: actor-only partial update, clear and no-op` | PASS |
| B07 | Backend | `micodent-backend/tests/unit/coverage-p1.test.cjs`: `BE-P1-03 B07 real user reads: selected columns, successful response and sanitized errors` | PASS |
| B08 | Backend | `micodent-backend/tests/unit/academic-a-patients.test.cjs`: `ACA-A-B08 retroactive: coordinated patient/history/guardian/audits commit and intermediate failure rollback` | PASS |
| B09 | Backend | `micodent-backend/tests/unit/academic-a-patients.test.cjs`: `ACA-A-B09 retroactive: duplicate DNI and invalid birth years return 400 before inserts` | PASS |
| B10 | Backend | `micodent-backend/tests/unit/academic-b-patients.test.cjs`: `ACA-B-B10 retroactive HTTP: archive/reactivate patient and HC, list projection and invalid IDs before SQL` | PASS |
| B11 | Backend | `micodent-backend/tests/unit/academic-b-patients.test.cjs`: `ACA-B-B11 retroactive HTTP: full history preserves DECIMAL/IDs, JSON object/text/malformed document shapes and 404/500` | PASS |
| B12 | Backend | `micodent-backend/tests/unit/academic-a-history.test.cjs`: `ACA-A-B12 retroactive: antecedents and conditional triage audited in transaction; error/invalid ID rollback` | PASS |
| B13 | Backend | `micodent-backend/tests/unit/academic-a-history.test.cjs`: `ACA-A-B13 retroactive: signed evolution immutable; correction appends and audits, rejects missing/unlocked/incomplete` | PASS |
| B14 | Backend | `micodent-backend/tests/unit/academic-c-documents.test.cjs`: `ACA-C-B14 Rx and prescription issue/reissue retain content and replacement linkage` | PASS |
| B15 | Backend | `micodent-backend/tests/unit/academic-c-attachments.test.cjs`: `ACA-C-B15 attachment archive preserves bytes; restoration requires available regular files` | PASS |
| B16 | Backend | `micodent-backend/tests/unit/clinical-files.test.js`: `private file requires both live cookie and matching tab identity`; `streams existing bytes with private no-store, no sniffing, and safe disposition`; `paths cannot escape, use alternate streams, fetch remote URLs or serve active HTML/SVG`; `unknown records, missing bytes and invalid ids return generic errors without modifying files`; `database failure is sanitized and never produces file bytes`; `revoked sessions cannot read previously accessible files`; `micodent-backend/tests/unit/clinical-upload.test.js`: `file contents must agree with the extension, including an intact JPEG tail`; `PDF has a header and ending marker; active formats are never accepted` | PASS |
| B17 | Backend | `micodent-backend/tests/unit/academic-c-attachments.test.cjs`: `ACA-C-B17 real staging cleanup rejects invalid content and retains bytes on uncertain commit` | PASS |
| B18 | Backend | `micodent-backend/tests/unit/academic-a-agenda.test.cjs`: `ACA-A-B18 retroactive: create/edit and contiguous appointments allowed; overlap/inactive references rejected` | PASS |
| B19 | Backend | `micodent-backend/tests/unit/academic-a-agenda.test.cjs`: `ACA-A-B19 retroactive: impossible dates, time/duration/cell/patient shapes rejected before DB acquisition` | PASS |
| B20 | Backend | `micodent-backend/tests/unit/academic-a-agenda.test.cjs`: `ACA-A-B20 retroactive: lock busy 503; storage failure rollback; uncertain lock/rollback destroys connection` | PASS |
| B21 | Backend | `micodent-backend/tests/unit/finanzas.test.cjs`: `cash commission and first-cost allocation`; `zero rate, 100%, and cents are deterministic`; `reported rows: external recovery precedes commission and preserves each cent`; `amount validation rejects coercion, negative, exponent and overprecision` | PASS |
| B22 | Backend | `micodent-backend/tests/unit/academic-c-payments.test.cjs`: `ACA-C-B22 signed treatment, costs, laboratory and initial payment share transaction and rollback` | PASS |
| B23 | Backend | `micodent-backend/tests/unit/academic-c-payments.test.cjs`: `ACA-C-B23 payment confirmation replays once; POS revision and principal/recargo history stay distinct` | PASS |
| B24 | Backend | `micodent-backend/tests/unit/academic-c-payments.test.cjs`: `ACA-C-B24 only latest current payment can be voided with reason and dual audit, never physical deletion` | PASS |
| B25 | Backend | `micodent-backend/tests/unit/academic-b-expenses.test.cjs`: `ACA-B-B25 retroactive: allowed expense categories preserve conditional month; invalid money/date/category rollback` | PASS |
| B26 | Backend | `micodent-backend/tests/unit/academic-b-expenses.test.cjs`: `ACA-B-B26 retroactive: edit/void/reactivate audited without physical DELETE; guards and audit failure rollback` | PASS |
| B27 | Backend | `micodent-backend/tests/unit/coverage-p1.test.cjs`: `BE-P1-04 B27 real laboratory reads: DECIMAL status and pending/paid filters`; `BE-P1-05 B27 real laboratory read errors and empty lists` | PASS |
| B28 | Backend | `micodent-backend/tests/unit/academic-b-laboratory.test.cjs`: `ACA-B-B28 laboratory payments enforce balance, audit and idempotent confirmations` | PASS |
| B29 | Backend | `micodent-backend/tests/unit/academic-b-summary.test.cjs`: `ACA-B-B29 retroactive: cash includes POS/lab payouts, allocated margin differs; legacy/null, negative and failure cleanup` | PASS |
| B30 | Backend | `micodent-backend/tests/unit/academic-b-summary.test.cjs`: `ACA-B-B30 retroactive: multiple debts grouped by patient with cents, all treatment IDs, empty and fixed error` | PASS |
| F01 | Frontend | `micodent-frontend/tests/coverage-p1-personal.test.mjs`: `FE-P1-03 F01 actual personnel form creates doctor with normalized payload`; `FE-P1-04 F01 edit self preserves own role and omits password; cancel resets`; `FE-P1-10 F01 invalid password prevents API; failed save retains editable values` | PASS |
| F02 | Frontend | `micodent-frontend/tests/coverage-p1-personal.test.mjs`: `FE-P1-05 F02 real loading, empty, API error and filtered list states`; `FE-P1-06 F02 permissions hide peer actions and deny non-admin screen` | PASS |
| F03 | Frontend | `micodent-frontend/tests/coverage-p1-personal.test.mjs`: `FE-P1-07 F03 reset validation and successful request preserve selected target`; `FE-P1-08 F03 reactivation failure preserves credentials; retry clears modal`; `FE-P1-09 F03 deactivate: cancel, busy, single request and recovery from error` | PASS |
| F04 | Frontend | `micodent-frontend/tests/coverage-p1-pages.test.mjs`: `FE-P1-11 F04 real patient list: response shapes, retained data on failure and independent actions` | PASS |
| F05 | Frontend | `micodent-frontend/tests/academic-c-keyboard.test.mjs`: `ACA-C-F05 native patient actions isolate row navigation, Enter/Space and cancelled archive on desktop/mobile` | PASS |
| F06 | Frontend | `micodent-frontend/tests/academic-a-lists.test.mjs`: `ACA-A-F06 retroactive: real 300ms debounce cleanup, archived filter, stable sort and outside menu close` | PASS |
| F07 | Frontend | `micodent-frontend/tests/academic-a-patient.test.mjs`: `ACA-A-F07 retroactive: loaded personal/guardian fields, sanitized audit payload, busy/error retention and role tabs` | PASS |
| F08 | Frontend | `micodent-frontend/tests/academic-a-patient.test.mjs`: `ACA-A-F08 retroactive: conditional clinical/signature saves, partial failure keeps draft and retry, signature-only save` | PASS |
| F09 | Frontend | `micodent-frontend/tests/academic-c-attachments.test.mjs`: `ACA-C-F09 attachment upload and refresh failures retain list, release busy and show safe image errors` | PASS |
| F10 | Frontend | `micodent-frontend/tests/coverage-p2-patient.test.mjs`: `FE-P2-03 F10 real treatment modal: rehabilitation/endodontics, payload, validation, edit and recovery` | PASS |
| F11 | Frontend | `micodent-frontend/tests/coverage-p2-patient.test.mjs`: `FE-P2-04 F11 actual payment: POS unavailable, limits, revision error, busy and retry` | PASS |
| F12 | Frontend | `micodent-frontend/tests/coverage-p1-pages.test.mjs`: `FE-P1-12 F12 real financial summary: cash, negative/legacy values, stale/error responses and retry` | PASS |
| F13 | Frontend | `micodent-frontend/tests/academic-b-finance.test.mjs`: `ACA-B-F13 finance refresh handles focus, storage, visibility, timer and listener cleanup` | PASS |
| F14 | Frontend | `micodent-frontend/tests/coverage-p2-finance.test.mjs`: `FE-P2-01 F14 expense form, filters, failed edit and void/reactivation refresh` | PASS |
| F15 | Frontend | `micodent-frontend/tests/coverage-p2-finance.test.mjs`: `FE-P2-02 F15 laboratory partial/final payments update cash, preserve failures and paid history` | PASS |
| F16 | Frontend | `micodent-frontend/tests/academic-c-keyboard.test.mjs`: `ACA-C-F16 real calendars preserve leap dates, appointment identity, disabled slots and single native activation` | PASS |
| F17 | Frontend | `micodent-frontend/tests/coverage-p2-clinical.test.mjs`: `FE-P2-06 F17 real appointment create/edit, labels, conflict, busy and state changes` | PASS |
| F18 | Frontend | `micodent-frontend/tests/coverage-p2-clinical.test.mjs`: `FE-P2-05 F18 real odontogram entry, arcada confirmation, errors and signed corrections` | PASS |
| F19 | Frontend | `micodent-frontend/tests/academic-c-keyboard.test.mjs`: `ACA-C-F19 native tooth and selector toggle once, preserve visual state and disable report-only tooth` | PASS |
| F20 | Frontend | `micodent-frontend/tests/coverage-p1-modals.test.mjs`: `FE-P1-02 F20 real portal: focus, Tab loop, latest close handler and cleanup` | PASS |
| F21 | Frontend | `micodent-frontend/tests/coverage-p1-modals.test.mjs`: `FE-P1-01 F21 real confirmation: closed, cancel, confirm, Escape and busy` | PASS |
| F22 | Frontend | `micodent-frontend/tests/academic-a-documents.test.mjs`: `ACA-A-F22 retroactive: Rx preview/print contain deduplicated selected teeth and two maps; empty/missing maps guards` | PASS |
| F23 | Frontend | `micodent-frontend/tests/academic-a-documents.test.mjs`: `ACA-A-F23 retroactive: historical prescription/signature, PNG replaces fallback, order and print/image failure` | PASS |
| F24 | Frontend | `micodent-frontend/tests/academic-b-profile-login.test.mjs`: `ACA-B-F24 profile preserves failed edits, saves own assets and requires login after password change` | PASS |
| F25 | Frontend | `micodent-frontend/tests/academic-a-session.test.mjs`: `ACA-A-F25 retroactive: checking/retry identity verification; blocked private UI, expired/changed drafts retained and listeners removed` | PASS |
| F26 | Frontend | `micodent-frontend/tests/academic-b-history.test.mjs`: `ACA-B-F26 clinical report renders existing history, protects printing and redirects legacy entry points` | PASS |
| F27 | Frontend | `micodent-frontend/tests/academic-a-lists.test.mjs`: `ACA-A-F27 retroactive: grouped debt keeps every treatment, server total, empty list and single navigation` | PASS |
| F28 | Frontend | `micodent-frontend/tests/academic-b-data-api.test.mjs`: `ACA-B-F28 legacy clinical data composes normalization, teeth rendering, audit fields and session isolation` | PASS |
| F29 | Frontend | `micodent-frontend/tests/academic-b-profile-login.test.mjs`: `ACA-B-F29 login normalizes identifier only, handles errors and disables busy submission` | PASS |
| F30 | Frontend | `micodent-frontend/tests/academic-b-data-api.test.mjs`: `ACA-B-F30 real Axios interceptors preserve transient sessions and reject late replies after identity changes` | PASS |

VALIDACION PROGRAMATICA:60 IDs unicos;30 F01-F30 +30 B01-B30; duplicados0; IDs faltantes0; casos sin test asociado0; todas las referencias existen y todos los nombres asociados figuran PASS.

## Pendientes: 0 casos academicos del catalogo

Las limitaciones funcionales/semanticas descritas no se reclasifican como corregidas por completar los60 IDs.
SIGUIENTE PASO: Implementar suite Cypress E2E con autorizacion posterior. DETENIDO: no instalar Cypress ni ejecutar SonarQube/push/adaptacion universitaria.

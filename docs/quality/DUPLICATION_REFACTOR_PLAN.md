# MICODENT - D1: reduccion segura de duplicacion

FASE: DUPLICATION_REFACTOR_COMPLETE
FECHA: 2026-10-04
BASELINE SONAR COMUNICADO: 5.6%; objetivo orientativo <=3.0%, no garantizado.
RAIZ: F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/.runtime/e09-agenda-api
REFERENCIA: HEAD bbc15f187b1191169aafc3e8c651da38f9348f17 + cambios anteriores conservados.
LOTE UNICO: D01, D02 y D03. No extender a reglas de negocio.

## Evidencia y limites del mapa

API local Sonar /api/measures/component responde HTTP401. No hay SONAR_TOKEN
disponible en el entorno ni una sesion de navegador conectada; la busqueda
acotada de credenciales Sonar existentes no produjo acceso valido. No se
solicitaron secretos ni se ejecuto scanner. El 5.6% es la medicion informada
por el propietario, no una medicion reproducida aqui.

Mapa LOCAL orientativo: parser Babel instalado, fuentes JS/JSX de ambos src,
ventanas de100 tokens, extension de coincidencias, minimo10 lineas en cada
lado. Se normalizaron literales string/numero/JSXText para encontrar estructuras
similares; se ignoraron comentarios. 27 pares maximales, consolidados en17
grupos de conceptos. NO es el algoritmo Sonar ni prueba de sus bloques exactos.
CSS y otros lenguajes no se contabilizan en esta estimacion local.
Las similitudes de textos/SQL NO equivalen a reglas de negocio identicas.

Rutas de tabla relativas a la raiz anterior; regiones corresponden al estado
ANTES de D1 y cambiaran al extraer componentes.

## Grupos

| ID | Archivos y region inicial | Tipo/tamano/repeticion y causa | Propuesta | Riesgo | Decision |
| --- | --- | --- | --- | --- | --- |
| D01 | frontend/src/pages/Historias.jsx:47-114; MiPerfil.jsx:16-82; PacienteDetalle.jsx:40-106 | SignaturePad:3 copias, ~67 lineas cada una, ~489 tokens por par; canvas copiado | Un componente visual SignaturePad, cuerpo/JSX exactos; onEnd y guardados siguen en cada pagina. Historias ya no lo renderizaba; conservar implementacion en componente compartido | BAJO | REFACTORIZAR |
| D02 | frontend/src/pages/Historias.jsx:504-524; PacienteDetalle.jsx:1255-1275 | InputV:2 copias identicas de21 lineas; formato y render copiados | Compartir InputV con defaults, clases, required, sanitizado y onChange exactos | BAJO | REFACTORIZAR |
| D03 | frontend/src/components/OrdenRadiografiaTab.jsx:368-382; RecetarioTab.jsx:129-143 | Acciones de documento:2 bloques ~15 lineas,163 tokens estructurales; mismos iconos/titulos/condiciones | DocumentActions visual; pasar callbacks existentes y flags sin interpretar permisos ni documento | BAJO | REFACTORIZAR |
| D04 | frontend/src/pages/Historias.jsx:498-508; PacienteDetalle.jsx:1244-1254 | Field:2 variantes,parte del par242 tokens con InputV; estilos/color distintos | Conservar variantes: no imponer nuevo tema ni API de estilos para eliminar similitud | MEDIO | CONSERVAR |
| D05 | frontend/src/utils/tratamientosDb.js:13-52 | Catalogo clinico;2 pares166/306 tokens solapados (~10-19 lineas); filas distintas normalizadas | Conservar filas explicitas y sus IDs/categorias/nombres/tipos/visuales | ALTO | CONSERVAR |
| D06 | backend/src/controllers/historias.controller.js:320-347,697-724 | Adendas odontograma/evolucion;203 tokens,2 bloques28 lineas | Conservar validaciones, tablas y auditorias distintas; no generificar SQL | ALTO | CONSERVAR |
| D07 | backend/src/controllers/pacientes.controller.js:258-312 | Archivar/reactivar paciente;184 tokens,2 bloques28 lineas | Conservar operaciones inversas y textos de trazabilidad | ALTO | CONSERVAR |
| D08 | backend/src/controllers/historias.controller.js:806-831,911-936 | Reemision Rx/receta;180 tokens,2 bloques26 lineas | Conservar transacciones, payloads y entidades independientes | ALTO | CONSERVAR |
| D09 | backend/src/controllers/historias.controller.js:407-467 | Archivar/reactivar HC;177 tokens,2 bloques31 lineas | Conservar operaciones clinicas inversas | ALTO | CONSERVAR |
| D10 | frontend/src/pages/Historias.jsx:193-208; PacienteDetalle.jsx:358-376,418-435 | Proyeccion odontograma;3 pares153/152/166 tokens,14-19 lineas | Conservar carga/recarga: valores por defecto y datos clinicos requieren lote independiente | MEDIO | CONSERVAR |
| D11 | frontend/src/components/OrdenRadiografiaTab.jsx:430-443; RecetarioTab.jsx:192-205 | Timeline documentario;152 tokens,2 bloques14 lineas; comienza fragmento similar,contenido distinto | Conservar por ahora: no abstraer cadena/version vigente junto con acciones | MEDIO | CONSERVAR |
| D12 | backend/src/controllers/gastos.controller.js:130-200 | Anular/reactivar gasto;2 pares135/109 tokens (~17 lineas);estados/auditorias distintos | Conservar locks,rollback,SQL y estados financieros | ALTO | CONSERVAR |
| D13 | backend/src/controllers/historias.controller.js:545-607 | Anular/restaurar anexo;2 pares134/103 tokens (~10-13 lineas);restaurar exige bytes existentes | Conservar validacion de almacenamiento y transacciones propias | ALTO | CONSERVAR |
| D14 | frontend/src/pages/FinanzasDashboard.jsx:167-182; Produccion.jsx:20-30 | Listeners refresco;122 tokens,2 bloques11-16 lineas | Conservar cierres/dependencias distintas; posible hook futuro con contrato probado | MEDIO | CONSERVAR |
| D15 | frontend/src/pages/PacienteDetalle.jsx:376-388,446-457 | Proyeccion evolucion;119 tokens,2 bloques12-13 lineas | Conservar carga y recarga financiera: revisar equivalencia integral en lote independiente | MEDIO | CONSERVAR |
| D16 | frontend/src/pages/FinanzasDashboard.jsx:350-363,431-444 | Tablas de doctores/gastos;107 tokens,2 bloques14 lineas;cabeceras/estados vacios similares | Conservar columnas y filas especificas; tabla generica no necesaria en D1 | MEDIO | CONSERVAR |
| D17 | frontend/src/components/OrdenRadiografiaTab.jsx:12-42 | Listas de modalidades Rx;6 pares100-103 tokens solapados,10-13 lineas;strings normalizados | Conservar opciones/campos explicitos, no fabricar configurador clinico | MEDIO | CONSERVAR |

En tabla frontend=micodent-frontend y backend=micodent-backend.

## Alcance, preservacion y reversion

Antes de editar:158 hashes de fuentes/tests/manifiestos/documentos protegidos.
Los AST de las3 SignaturePad son IDENTICOS; las2 InputV IDENTICAS.
Se registraron hashes AST de los cuerpos de Historias/MiPerfil/PacienteDetalle.
No cambiar esos cuerpos al extraer sus definiciones locales.
DocumentActions no recibe servicios ni identidad, solo flags y callbacks de
cada modulo; no debe alterar JSX DOM, clases, orden, titulos ni roles.
No cambios backend,SQL,BD,env,endpoints,payloads,autenticacion,sesiones,calculos,
permisos,libretas academicas,Sonar properties ni dependencias.

Reversion: reinsertar SOLO las definiciones y JSX previos de D1 y retirar SOLO
imports/componentes D1; conservar todos los cambios preexistentes del workspace.
No git reset/checkout global, no restauracion de BD porque no se la consulta.
Pruebas structurales Sonar se adaptaran solo tras comprobar equivalencia AST
y pruebas de comportamiento; no quitar assertions para ocultar diferencias.

## Validacion por grupo

- D01: COMPLETO. Grupo funcional9/9 PASS; equivalencia AST firma/cuerpos de paginas
  y guardas4A/4B/4C33/33 PASS. Se trasladan useRef/useState/useEffect a SignaturePad;
  guardas antiguas actualizadas tras equivalencia, no se eliminan assertions.
- D02: COMPLETO. Grupo ficha/HC/formatos11/11 PASS; AST InputV anterior exacto,
  cuerpos de3 paginas intactos. Guardas4A/4B/4C adaptadas solo a imports/extraccion.
- D03: COMPLETO. Grupo Rx/receta/modales/D1:23/23 PASS.
 8 combinaciones flags; callbacks unicos; mismos iconos/titulos/clases/DOM.
 AST de los2 modulos completos equivalente al expandir JSX compartido,
 ignorando exclusivamente indentacion JSX vacia; no se cambian handlers ni guards.
- Final lote: suite frontend completa>=132; backend>=130 con TEMP/TMP aislados;
  Cypress10/10 API sintetica; buildPASS. Sin datos reales.

## Resultado

GRUPOS DETECTADOS:17 (locales,no exportados de Sonar).
GRUPOS REFACTORIZADOS:3 (D01,D02,D03).
GRUPOS CONSERVADOS:14 (D04-D17).
REDUCCION SONAR: NO MEDIDA; requiere nuevo analisis manual por propietario.
No afirmar <=3.0% ni <=2.0% sin ese analisis.

## Cierre del lote D1

ESTADO: COMPLETO Y VALIDADO LOCALMENTE; objetivo porcentual pendiente de medicion.
RIESGO: BAJO en3 extracciones;14 grupos MEDIO/ALTO conservados.
ESTIMACION DE REDUCCION IMPORTANTE: SI, plausible, no promesa de <=3.0%.
La comparacion local con el mismo parser/politica pasa de27 a23 pares maximales
y de872 a595 lineas candidatas unicas (-277,~31.8%). Son candidatos normalizados,
NO duplicated_lines Sonar ni una conversion del5.6% a otro porcentaje.
D03 conserva una similitud residual de125 tokens alrededor de callbacks/estructura
de nueva receta/Rx: no extraer los modales/formularios clinicos para perseguir cero.
D04 queda sin su anterior par de100 tokens al separar InputV; Field sigue intacto.

VALIDACION FINAL:
- Frontend: npm test140/140 PASS,0 fallos/omitidos (132 anteriores+8 D1).
- Backend: npm test130/130 PASS,0 fallos/omitidos; TEMP/TMP aislados solo en proceso
  bajo coverage/d1-validation-<uuid>, restaurados al terminar. Sin cambios backend.
- Cypress: npm run test:e2e10/10 PASS, Edge154.0.4258.53, Cypress16.1.1.
  UTC2026-10-04T14:47:01.153Z,24590ms,0 requests API sin mock,0 retries/fallos/omitidos.
  Datos simulados; ninguna conexion a MySQL/MariaDB clinica.
- Build: PASS,1837 modulos; CSS47.34kB,JS571.34kB. Aviso previo bundle>500kB permanece.
- git diff --check PASS; imports/JSX ejercitados por tests y build.
- Contencion:150/158 archivos previos protegidos intactos;8 cambios autorizados
  (5 fuentes frontend y3 guardas). Backend/src y tests, API,sesiones,manifestos,
  lockfiles,Sonar properties,catalogo60,registro Sonar y reporte Cypress intactos.
- Regresiones detectadas: ninguna. No validacion de impresion fisica ni BD real;
  Cypress es UI original/API simulada, no certificacion de produccion.
- Cypress mantiene aviso no fatal windows-trash.exe sobre capturas previas;
  exit0 y3 capturas accesibles. No limpieza manual ni cambio de permisos.
  Runner termino; sin procesos test-e2e/Cypress pendientes.

EVIDENCIA E2E ACTUAL: micodent-frontend/test-results/cypress/run.json.
SHA-256:576b306cd8c277fa0f5e22ad5c4bf851397f58708d2b0be407a5da1626a41355.
10 IDs unicos PASS,3 capturas existentes. Runner reemplazo su JSON; informe
CYPRESS_E2E_REPORT.md conserva el cierre historico previo y NO fue modificado.
60 casos academicos intactos;8 pruebas D1 son adicionales, no casos nuevos del catalogo.

ARCHIVOS D1 (relativos a la raiz; no atribuir cambios anteriores a esta sesion):
- micodent-frontend/src/components/SignaturePad.jsx (nuevo)
- micodent-frontend/src/components/InputV.jsx (nuevo)
- micodent-frontend/src/components/DocumentActions.jsx (nuevo)
- micodent-frontend/src/pages/Historias.jsx
- micodent-frontend/src/pages/MiPerfil.jsx
- micodent-frontend/src/pages/PacienteDetalle.jsx
- micodent-frontend/src/components/OrdenRadiografiaTab.jsx
- micodent-frontend/src/components/RecetarioTab.jsx
- micodent-frontend/tests/duplication-d1.test.mjs (nuevo,8 tests)
- micodent-frontend/tests/sonar-family4a.test.mjs
- micodent-frontend/tests/sonar-family4b.test.mjs
- micodent-frontend/tests/sonar-family4c.test.mjs
- docs/quality/DUPLICATION_REFACTOR_PLAN.md (nuevo)
- docs/quality/CURRENT_TASK.md

Las guardas se refrescaron tras probar AST exactos de SignaturePad/InputV,
cuerpos de3 paginas intactos y AST completos Rx/receta reconstruidos con JSX
compartido. Las assertions de efectos, hooks, flujo, payloads, ramas y resultados
no se quitaron. La assertion de useRef ahora comprueba su traslado al componente.

LCOV: no editados ni regenerados en D1. Al mover codigo cambian sus rutas/lineas:
antes de reutilizarlos en un analisis final, regenerar coverage con los runners
existentes; no introducir exclusiones ni modificar reportes manualmente.
Sin scanner, cambio Quality Gate/S5693, SQL, dependencias, push, Universidad,
Docker,PostgreSQL,project.yml,.gitlab-ci.yml ni E01-E17.
SIGUIENTE PASO: propietario ejecuta SonarQube con reportes vigentes para medir
duplicacion global final. Detenido; no iniciar automaticamente otro lote.

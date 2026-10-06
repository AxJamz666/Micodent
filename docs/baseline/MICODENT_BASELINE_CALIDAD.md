# MICODENT — BASELINE OFICIAL DE CALIDAD

**Identificador documental:** MICODENT-QUALITY-20261004  
**Fecha:** 4 de octubre de 2026, America/Bogota (UTC-05:00)  
**Estado:** QUALITY_BASELINE_FROZEN  
**Autor del proyecto/informe:** Alex Eduardo Rodriguez Aquino  
**Workspace:** `F:\ChatGPT\MICODENT — Sistema de Gestión Odontológica\MICODENT_DEV\.runtime\e09-agenda-api`  
**Referencia Git registrada por el checkpoint:** `bbc15f187b1191169aafc3e8c651da38f9348f17` más cambios locales conservados.

Este es un congelamiento **documental y de identificación de contenido**, no un commit, tag, release publicado ni bloqueo del filesystem. El estado validado incluye archivos modificados y no trackeados: el commit de referencia por sí solo NO reconstruye esta versión. El manifiesto de la sección 12 identifica 219 archivos disponibles por SHA-256; no sustituye un respaldo ni contiene secretos, credenciales o datos clínicos.

## 1. Propósito

Fijar el estado técnico validado de MICODENT antes de autorizar adaptación universitaria, PostgreSQL, Docker, pipeline o nuevas fases clínicas. Las futuras sesiones deben partir de este checkpoint y conservar el núcleo y pruebas existentes, sin volver a ejecutar auditorías cerradas por falta de contexto.

Cierre oficial de esta fase de calidad: Sonar final verificado por artefactos, pruebas locales previamente aprobadas, cobertura LCOV real, catálogo académico y Cypress adicional. **No es certificación de producción clínica**, instalación real o cumplimiento normativo. Esta sesión solo crea este baseline y actualiza CURRENT_TASK.md; no modifica producto, pruebas, base de datos, configuración ni evidencias.

## 2. Estado SonarQube

| Indicador | Resultado congelado | Evidencia |
| --- | --- | --- |
| Proyecto | micodent-post / Micodent POST Remediacion | TEST10 PDF, URL y encabezados |
| Versión declarada en Sonar | POST-REMEDIATION-2026-10-03 | TEST10 PDF |
| Quality Gate | PASSED | TEST10 Overall y New Code |
| Open Issues | 0 | Security, Reliability y Maintainability: 0 en Overall |
| Accepted Issues | 1 Overall; 0 New Code | TEST10, scopes separados |
| Overall Coverage | 81.4% | TEST10 Overall |
| New Code Coverage | 97.4% | TEST10 New Code |
| Overall Duplications | 3.4% | TEST10 Overall |
| New Code Duplications | 0.0% | TEST10 New Code |
| Security | 0 open issues | TEST10 Overall |
| Reliability | 0 open issues | TEST10 Overall |
| Maintainability | 0 open issues | TEST10 Overall |
| Security Hotspots | 0 | TEST10 Overall/New Code |

New Code desde 3 de octubre de 2026; 369 líneas nuevas a cubrir y 375 líneas nuevas para duplicación. Las capturas finales corresponden a 4 de octubre a las 11:23; los PDF tienen fecha interna 11:35/11:36. No se inventa la hora exacta ni ID del análisis. No se ejecutó ni consultó Sonar en vivo para congelar este documento.

Se documentaron **10 conjuntos de evidencias correspondientes a las ejecuciones realizadas durante la fase de calidad; la trazabilidad cronológica fue reconstruida mediante los artefactos disponibles**. Son 28 originales: 3 CSV, 10 PDF y 15 PNG. No se afirma que existan diez analysis IDs distintos; TEST6/TEST7 repiten métricas y carecen de IDs que demuestren jobs independientes.

## 3. Estado de Pruebas

| Capa | Resultado validado | Alcance |
| --- | --- | --- |
| Casos académicos | 60/60: frontend 30 + backend 30 | IDs F01-F30/B01-B30; pruebas automatizadas retroactivas |
| Frontend | 151/151 PASS | Última suite completa con coverage |
| Backend | 130/130 PASS | Última suite completa; TEMP/TMP aislados |
| Cypress E2E | 10/10 PASS | Cypress 16.1.1, Microsoft Edge 154.0.4258.53 headless |
| Build frontend | PASS | 1837 módulos; JS 571.34 kB, CSS 47.34 kB |
| Regresiones detectadas | 0 en las suites ejecutadas | No equivale a ausencia de defectos fuera de los escenarios |

**TDD real: 0.** Los 60 son casos retroactivos, no Red-Green-Refactor. No sumar las 60 fichas a los tests del runner como si fueran una suite adicional. Cypress es adicional a las 60 fichas y no reemplaza node:test/Playwright.

Frontend usa componentes/rutas reales con node:test, RTL, jsdom y Babel, simulando fronteras API. Backend usa código real con frontera SQL simulada; determinados casos HTTP usan Express/fetch. Cypress usa frontend real y API sintética: **no conecta MySQL/MariaDB clínica**.

La última corrida Cypress guardada es `2026-10-04T16:15:31.261Z`, 30468 ms, diez PASS y cero requests API sin mock. Su JSON se reemplaza al repetir el runner; hashes previos de los documentos históricos pertenecen a otras corridas, no al JSON actual.

Los resultados no se repitieron en esta sesión documental. Permanecen avisos no fatales de bundle >500 kB y windows-trash.exe; no se ocultaron ni alteraron permisos.

## 4. Coverage

Overall Sonar **81.4%** y New Code **97.4%**, verificados por TEST10. Objetivo global mínimo >=80% cumplido; margen orientativo 82-85% no alcanzado. El Gate mostrado exige >=80% sobre New Code: su aprobación por sí sola no prueba el porcentaje global.

| Cobertura local c8 | Frontend | Backend |
| --- | --- | --- |
| Statements | 83.29% | 76.00% |
| Branches | 84.83% | 82.15% |
| Functions | 57.43% | 79.47% |
| Lines | 83.29% | 76.00% |
| Líneas cubiertas/reportadas | 6015/7221 | 2847/3746 |
| Registros SF LCOV | 46 | 42 |

LCOV final: `micodent-frontend/coverage/lcov.info` (B36B08031FA02C243B390E89105EF1BB630C01885B9BEB270F04729A7C691A42) y `micodent-backend/coverage/lcov.info` (E1E4F4E4C150AB59D0B25C241CBAC9DE6DBA62AE1C14E8EC6CDACB698692F088).
Ambos reportes estaban generados y verificados; Sonar los consume mediante `sonar.javascript.lcov.reportPaths`. No son producidos por el scanner, no se modificaron manualmente y no se excluyó lógica para inflar métricas.

El 81.4054% local ponderado de líneas/ramas se conserva como estimación independiente, no como sustituto del 81.4% medido por Sonar. Cypress/Playwright sin instrumentación c8 no aportan cobertura LCOV artificialmente.

## 5. Duplicación

Overall **3.4%** y New Code **0.0%**, verificados en TEST10. Se extrajeron SignaturePad.jsx, InputV.jsx y DocumentActions.jsx con preservación de comportamiento/estilos. De los 17 grupos locales, se refactorizaron tres de bajo riesgo y se conservaron 14 de riesgo medio/alto por contratos clínicos/financieros diferentes.

No se persiguió 0% artificialmente ni se generificó lógica clínica para reducir similitud. La meta global orientativa <=3.0% no se declara cumplida; el umbral de duplicación nueva <=3.0% sí se cumple. Los candidatos locales no equivalen al algoritmo oficial de Sonar.

## 6. Issue Contextual Aceptado

**javascript:S5693**, límite Multer **10 MiB**, en `micodent-backend/src/config/multer.js`.
Estado: **REVISADO Y ACEPTADO COMO CONTEXTUAL; NO CORREGIDO**.

CSV intermedio TEST3 conserva OPEN. La captura `TEST3/Aceptacion Issue.png` muestra S5693 Accepted y el código `10 * 1024 * 1024`. La evidencia final TEST10 registra cero abiertos y uno aceptado Overall. Se conserva el historial sin editar CSV/PDF/PNG.

El límite se mantuvo por requerimientos funcionales, con rechazo de exceso/tipos incompatibles y validación de contenido. Las pruebas registradas aceptaron JPEG sintético 9 MiB y rechazaron 10 MiB+1. Esto no certifica concurrencia, almacenamiento ilimitado ni seguridad integral de las cargas.

## 7. Evidencias

Rutas relativas al worktree; los documentos siguientes son fuentes, no instrucciones para iniciar automáticamente sus siguientes pasos históricos:

| Documento/artefacto | Propósito |
| --- | --- |
| [SONAR_EVIDENCE_INDEX.md](../quality/SONAR_EVIDENCE_INDEX.md) | Diez conjuntos, enlaces originales, cronología, métricas y hashes |
| [INFORME_TECNICO_CALIDAD_MICODENT.md](../quality/INFORME_TECNICO_CALIDAD_MICODENT.md) | Informe técnico autosuficiente, antes/después y limitaciones |
| [ACADEMIC_TEST_CASES.md](../quality/ACADEMIC_TEST_CASES.md) | 60 casos, distribución y carácter retroactivo |
| [CYPRESS_E2E_REPORT.md](../quality/CYPRESS_E2E_REPORT.md) | Diez flujos E2E y cierre histórico |
| [DUPLICATION_REFACTOR_PLAN.md](../quality/DUPLICATION_REFACTOR_PLAN.md) | Tres extracciones y catorce grupos conservados |
| [SONAR_REMEDIATION_LOG.md](../quality/SONAR_REMEDIATION_LOG.md) | Familias 1-4 y delta POST |
| [GLOBAL_COVERAGE_80_PLAN.md](../quality/GLOBAL_COVERAGE_80_PLAN.md) | COV-G1, once tests y bloqueo Windows resuelto |
| [NEW_CODE_COVERAGE_MAP.md](../quality/NEW_CODE_COVERAGE_MAP.md) | Mapeo local P1/P2; límites frente a líneas oficiales Sonar |
| [COVERAGE_TEST_PLAN.md](../quality/COVERAGE_TEST_PLAN.md) | Baselines, P1/P2 y lotes académicos A/B/C |
| [CURRENT_TASK.md](../quality/CURRENT_TASK.md) | Continuidad: QUALITY_BASELINE_FROZEN |

Evidencia externa original: `F:\ChatGPT\MICODENT — Sistema de Gestión Odontológica\MICODENT_DEV\SONAR_EVIDENCE_POST\Sonarqube TEST EVIDENCIAS`. Todos los archivos conservan nombres y contenido. Evidencia final: TEST10/Overview.pdf, Overview2.pdf y sus dos PNG; aceptación individual: TEST3/Aceptacion Issue.png.

**Reservas históricas:** cobertura E13 inicial 0.0%, duplicación E13 6.2% y primeros hitos LCOV Overall 18.2% / New Code 0.8% no tienen captura propia en los diez conjuntos; no se promueven a verificados visualmente. Sí se verifica el estado final y la distribución inicial CSV 371 = 204 MINOR + 154 MAJOR + 11 CRITICAL + 2 BLOCKER.

## 8. Decisiones Cerradas

No repetir sin regresión/requisito/evidencia nueva:

- Inventario/auditoría inicial Sonar E13 y contabilización de 371 claves.
- Remediación Familias 1, 2, 3 y 4A/4B/4C/4D.
- Delta POST de 84 issues: 83 corregidos y S5693 contextual.
- Coverage P1/P2 y configuración LCOV real, sin manipulación.
- Catálogo 60/60 y lotes A/B/C.
- Cypress 10/10, adicional al catálogo.
- Refactor D1 de tres componentes, catorce grupos conservados.
- COV-G1 y cierre del runner Windows, once pruebas nuevas frontend.
- Revisión/aceptación S5693 manteniendo 10 MiB.
- Consolidación de diez conjuntos de evidencia e informe final.

Cerrado para el alcance de calidad no significa riesgo clínico inexistente ni fases E01-E17 completadas. Las frases “reanálisis pendiente” de planes antiguos son checkpoints históricos superados por TEST10; no deben reiniciar el scanner automáticamente.

## 9. Reglas para Futuras Fases

- NO repetir auditorías cerradas sin una razón nueva documentada.
- NO reescribir tests existentes innecesariamente, debilitar assertions ni eliminar escenarios para aprobar.
- NO cambiar S5693 sin requisito funcional/riesgo nuevo que motive revisión controlada.
- NO bajar Quality Gate o excluir código funcional para facilitar despliegues.
- NO manipular LCOV ni equiparar mocks con pruebas de persistencia real.
- NO sacrificar lógica clínica, integridad financiera o trazabilidad para mejorar métricas.
- Preservar cambios locales y datos existentes; no reset/restore global.
- Analizar alcance, dependencias, backup y reversión antes de un cambio; probar proporcionalmente.
- No ejecutar migraciones, rotar secretos, alterar Edy, iniciar servicios clínicos ni publicar sin autorización específica.
- Mantener separación de perfiles universidad/clínica y evitar datos reales en pruebas académicas.
- Para retomar E01-E17, aplicar confirmación de modelo establecida en AGENTS.md; este cierre documental no inicia una de esas etapas.
- No interpretar NEXT PHASE como autorización de implementar: solicitar alcance y confirmación humana.

**Limitaciones que siguen abiertas:** integración física/transacciones/concurrencia MySQL, durabilidad/corte eléctrico, backup/restauración operativa, carga sostenida de imágenes, instalaciones reales/red/impresoras/UAT, pentest y observaciones del informe (snapshot histórico de firma/sello, archivos huérfanos, feedback de subida, accesibilidad y fechas Rx). Son trabajo futuro, no defectos resueltos por Gate PASSED.

## 10. Perfiles Futuros

| Perfil | Alcance conceptual, NO implementado |
| --- | --- |
| UNIVERSIDAD | PostgreSQL, Docker, pipeline, estructura que la universidad confirme, Sonar/LCOV y despliegue académico aislado con datos sintéticos |
| CLÍNICA | Conservar núcleo validado, completar fases clínicas pendientes, instalación real, backup/restore, conectividad/sincronización definida y probada, UAT y datos reales solo después de GO |

PostgreSQL requiere adaptación y validación de SQL/transacciones, no sustitución ciega del driver. Pipeline requiere estructura y requisitos de universidad verificados antes de imponerlos. Conectividad centralizada no equivale a sincronización automática de múltiples bases. Este baseline no implementa ninguna de esas decisiones.

**GO clínico:** requiere aceptación operativa, restauración demostrada, integridad y permisos probados, privacidad y recuperación acordadas. El éxito académico o Gate PASSED no autoriza por sí mismo usar datos clínicos reales. Instalaciones de prueba con datos existentes permanecen intactas.

## 11. Git y Estado de Trabajo

Comprobaciones de lectura realizadas: `git status` y `git diff --stat`. No commit, tag, push, reset ni cambios de identidad Git.

**WORKSPACE: CON CAMBIOS.** Antes del cierre documental: 48 archivos trackeados modificados, 477 archivos no trackeados. El diff de trackeados registra **48 files changed, 4614 insertions(+), 1699 deletions(-)**. Estos cambios son trabajo preexistente, no modificaciones de código realizadas al congelar el baseline.

Se registran abajo 127 rutas relevantes (48 modificadas y 79 no trackeadas). Otros 398 archivos son cachés temporales de validación, .scannerwork y assets generados: no se borraron, no se trataron como fuentes del release ni se publicaron.

La creación de este archivo añade una ruta no trackeada: al cierre se esperan 48 trackeados modificados y 478 no trackeados si no existen cambios concurrentes. CURRENT_TASK.md ya era no trackeado; su actualización no añade otra ruta. Estado sucio conservado, no ocultado.

### 11.1 Archivos Trackeados Modificados

- `micodent-backend/package-lock.json`.
- `micodent-backend/package.json`.
- `micodent-backend/src/config/browserTransport.js`.
- `micodent-backend/src/config/multer.js`.
- `micodent-backend/src/controllers/dashboard.controller.js`.
- `micodent-backend/src/controllers/gastos.controller.js`.
- `micodent-backend/src/controllers/historias.controller.js`.
- `micodent-backend/src/controllers/laboratorio.controller.js`.
- `micodent-backend/src/controllers/pacientes.controller.js`.
- `micodent-backend/src/controllers/usuarios.controller.js`.
- `micodent-backend/src/index.js`.
- `micodent-backend/src/services/browserTransport.js`.
- `micodent-backend/src/services/clinicalFiles.js`.
- `micodent-backend/src/services/clinicalUpload.js`.
- `micodent-backend/src/services/session.service.js`.
- `micodent-backend/src/utils/jsonFields.js`.
- `micodent-frontend/package-lock.json`.
- `micodent-frontend/package.json`.
- `micodent-frontend/src/components/AgendaDia.jsx`.
- `micodent-frontend/src/components/AgendaMes.jsx`.
- `micodent-frontend/src/components/AgendaSemana.jsx`.
- `micodent-frontend/src/components/CitaModal.jsx`.
- `micodent-frontend/src/components/ClinicalImage.jsx`.
- `micodent-frontend/src/components/ConfiguracionPos.jsx`.
- `micodent-frontend/src/components/ConfirmModal.jsx`.
- `micodent-frontend/src/components/Diente.jsx`.
- `micodent-frontend/src/components/MetodoPago.jsx`.
- `micodent-frontend/src/components/OdontogramaEditor.jsx`.
- `micodent-frontend/src/components/OrdenRadiografiaTab.jsx`.
- `micodent-frontend/src/components/PiezaSelector.jsx`.
- `micodent-frontend/src/components/RecetarioTab.jsx`.
- `micodent-frontend/src/components/RxTeethPrint.jsx`.
- `micodent-frontend/src/components/SessionBoundary.jsx`.
- `micodent-frontend/src/index.css`.
- `micodent-frontend/src/pages/AdministracionPersonal.jsx`.
- `micodent-frontend/src/pages/Agenda.jsx`.
- `micodent-frontend/src/pages/Dashboard.jsx`.
- `micodent-frontend/src/pages/FinanzasDashboard.jsx`.
- `micodent-frontend/src/pages/Historias.jsx`.
- `micodent-frontend/src/pages/MiPerfil.jsx`.
- `micodent-frontend/src/pages/PacienteDetalle.jsx`.
- `micodent-frontend/src/pages/Pacientes.jsx`.
- `micodent-frontend/src/pages/Produccion.jsx`.
- `micodent-frontend/src/services/api.js`.
- `micodent-frontend/src/services/sessionState.js`.
- `micodent-frontend/src/utils/agendaUtils.js`.
- `micodent-frontend/src/utils/data.js`.
- `micodent-frontend/src/utils/rxTeeth.js`.

### 11.2 Archivos No Trackeados Relevantes

- `docs/quality/ACADEMIC_TEST_CASES.md`.
- `docs/quality/COVERAGE_TEST_PLAN.md`.
- `docs/quality/CURRENT_TASK.md`.
- `docs/quality/CYPRESS_E2E_REPORT.md`.
- `docs/quality/DUPLICATION_REFACTOR_PLAN.md`.
- `docs/quality/GLOBAL_COVERAGE_80_PLAN.md`.
- `docs/quality/INFORME_TECNICO_CALIDAD_MICODENT.md`.
- `docs/quality/NEW_CODE_COVERAGE_MAP.md`.
- `docs/quality/POST_SONAR_DELTA.md`.
- `docs/quality/SONAR_EVIDENCE_INDEX.md`.
- `docs/quality/SONAR_REMEDIATION_LOG.md`.
- `docs/quality/sonar-family1.csv`.
- `docs/quality/sonar-family2.csv`.
- `docs/quality/sonar-family3.csv`.
- `docs/quality/sonar-family4a.csv`.
- `docs/quality/sonar-family4b.csv`.
- `docs/quality/sonar-family4c.csv`.
- `docs/quality/sonar-family4d.csv`.
- `docs/quality/sonar-post-delta.csv`.
- `micodent-backend/scripts/test-coverage.cjs`.
- `micodent-backend/tests/helpers/academic-db.cjs`.
- `micodent-backend/tests/helpers/coverage-p1-db.cjs`.
- `micodent-backend/tests/unit/academic-a-agenda.test.cjs`.
- `micodent-backend/tests/unit/academic-a-history.test.cjs`.
- `micodent-backend/tests/unit/academic-a-patients.test.cjs`.
- `micodent-backend/tests/unit/academic-b-expenses.test.cjs`.
- `micodent-backend/tests/unit/academic-b-laboratory.test.cjs`.
- `micodent-backend/tests/unit/academic-b-patients.test.cjs`.
- `micodent-backend/tests/unit/academic-b-summary.test.cjs`.
- `micodent-backend/tests/unit/academic-b-users.test.cjs`.
- `micodent-backend/tests/unit/academic-c-attachments.test.cjs`.
- `micodent-backend/tests/unit/academic-c-documents.test.cjs`.
- `micodent-backend/tests/unit/academic-c-payments.test.cjs`.
- `micodent-backend/tests/unit/coverage-p1.test.cjs`.
- `micodent-backend/tests/unit/sonar-family4c.test.cjs`.
- `micodent-backend/tests/unit/sonar-family4d.test.cjs`.
- `micodent-backend/tests/unit/sonar-post-delta.test.cjs`.
- `micodent-frontend/cypress.config.cjs`.
- `micodent-frontend/cypress/e2e/micodent.cy.cjs`.
- `micodent-frontend/cypress/fixtures/synthetic-api.cjs`.
- `micodent-frontend/cypress/support/e2e.cjs`.
- `micodent-frontend/scripts/test-e2e.mjs`.
- `micodent-frontend/src/components/DocumentActions.jsx`.
- `micodent-frontend/src/components/InputV.jsx`.
- `micodent-frontend/src/components/ModalDialog.jsx`.
- `micodent-frontend/src/components/SignaturePad.jsx`.
- `micodent-frontend/src/utils/modalFocus.js`.
- `micodent-frontend/tests/academic-a-documents.test.mjs`.
- `micodent-frontend/tests/academic-a-lists.test.mjs`.
- `micodent-frontend/tests/academic-a-patient.test.mjs`.
- `micodent-frontend/tests/academic-a-session.test.mjs`.
- `micodent-frontend/tests/academic-b-data-api.test.mjs`.
- `micodent-frontend/tests/academic-b-finance.test.mjs`.
- `micodent-frontend/tests/academic-b-history.test.mjs`.
- `micodent-frontend/tests/academic-b-profile-login.test.mjs`.
- `micodent-frontend/tests/academic-c-attachments.test.mjs`.
- `micodent-frontend/tests/academic-c-keyboard.test.mjs`.
- `micodent-frontend/tests/accessibility.test.mjs`.
- `micodent-frontend/tests/agendaUtils.test.mjs`.
- `micodent-frontend/tests/coverage-g1-navigation.test.mjs`.
- `micodent-frontend/tests/coverage-p1-modals.test.mjs`.
- `micodent-frontend/tests/coverage-p1-pages.test.mjs`.
- `micodent-frontend/tests/coverage-p1-personal.test.mjs`.
- `micodent-frontend/tests/coverage-p2-clinical.test.mjs`.
- `micodent-frontend/tests/coverage-p2-finance.test.mjs`.
- `micodent-frontend/tests/coverage-p2-patient.test.mjs`.
- `micodent-frontend/tests/duplication-d1.test.mjs`.
- `micodent-frontend/tests/helpers/component-boundaries.mjs`.
- `micodent-frontend/tests/helpers/component-runtime.mjs`.
- `micodent-frontend/tests/modal-dialog.browser.mjs`.
- `micodent-frontend/tests/modal-dialog.test.mjs`.
- `micodent-frontend/tests/sonar-family4a.test.mjs`.
- `micodent-frontend/tests/sonar-family4b.test.mjs`.
- `micodent-frontend/tests/sonar-family4c.test.mjs`.
- `micodent-frontend/tests/sonar-family4d.browser.mjs`.
- `micodent-frontend/tests/sonar-family4d.test.mjs`.
- `micodent-frontend/tests/sonar-post-delta.browser.mjs`.
- `micodent-frontend/tests/sonar-post-delta.test.mjs`.
- `sonar-project.properties`.

### 11.3 Contención del Cierre

Archivos creados/modificados exclusivamente en este cierre:
- `docs/baseline/MICODENT_BASELINE_CALIDAD.md` (nuevo).
- `docs/quality/CURRENT_TASK.md` (actualización documental, historial técnico preservado).

No se incluyen contraseñas, tokens, .env, dumps de datos, uploads ni secretos en este baseline. No copiar cachés/evidencia privada a un commit automáticamente. Toda futura publicación exige revisión de material sensible y autorización.

## 12. Identificación de Contenido Congelado

Manifiesto SHA-256 de **219 archivos**, leído antes de la actualización documental. Incluye fuentes src, tests, scripts, Cypress, manifiestos/locks, configuración técnica e informes/LCOV/JSON referenciados. CURRENT_TASK.md se excluye del manifiesto de contenido congelado por ser un checkpoint mutable actualizado en esta sesión; este archivo no se auto-hashea. Los 28 originales Sonar tienen su propio manifiesto en SONAR_EVIDENCE_INDEX.md.

Para identificar la versión, comprobar los hashes contra estos mismos bytes. Una diferencia indica cambio posterior que debe identificarse, no descartarse automáticamente. Los hashes permiten comparar contenido, no recuperar archivos, probar una ejecución de scanner ni afirmar que Sonar analizó exactamente esta revisión. Evidencia final sin ID/revisión: limitación explícita.

| Ruta desde el worktree | SHA-256 |
| --- | --- |
| `AGENTS.md` | `5C6AEC0D29C405BA7BFAF48E53E2301F51531C139D54D45C1C242DD9565578F7` |
| `docs/quality/ACADEMIC_TEST_CASES.md` | `741DDE18590EB2F78F2081B5F8109FDAEAA111389BD382C555B7E4AAE4FCEAF6` |
| `docs/quality/COVERAGE_TEST_PLAN.md` | `0F3169022303EFDEF65D9930574337D98DA6737F88A26E61D814EC603089071A` |
| `docs/quality/CYPRESS_E2E_REPORT.md` | `F16DBEECCDC74FD8F0D147C58B13C15739DBBD9640E4B70B27FBECC062DCCA05` |
| `docs/quality/DUPLICATION_REFACTOR_PLAN.md` | `6B648735747EA23244FD28114C6974A2BA778F22E6D8066BF63E7CA81BA1A860` |
| `docs/quality/GLOBAL_COVERAGE_80_PLAN.md` | `D879490A7D6126F68AC6D22CDCCF5D9296CB3EAF433D6DD9A93751F6BA22B4EF` |
| `docs/quality/INFORME_TECNICO_CALIDAD_MICODENT.md` | `27D6E72B93895D4697DF9B277A39D4A0E662F465E17FBB35DD700BBEC3B1F479` |
| `docs/quality/NEW_CODE_COVERAGE_MAP.md` | `135F0F56A949727DF8EED0A8F6B03F1C83121A8C9404A7CCDC8543B581970C81` |
| `docs/quality/POST_SONAR_DELTA.md` | `1E8830C3DCECD7A900AB58F6F796B921E0440E35DB592082CF084F7FB1995F6A` |
| `docs/quality/SONAR_EVIDENCE_INDEX.md` | `4FD6C59E0B38C1790D6232A5A2223691F0214BB2EFB8A7E550F76B930891C41F` |
| `docs/quality/SONAR_REMEDIATION_LOG.md` | `1CEFE959A1900D6F6A3F865F21A2684589BF1346BA8320683B3D7B6A42B323A9` |
| `docs/quality/sonar-family1.csv` | `10C793D7FB4A8AF5EE881B094D587FD552610E21544190884AA405E1C3E8429F` |
| `docs/quality/sonar-family2.csv` | `8135C9270388C05E0A462487E66439ED9BD06B0BD1BDFEA38D4F1D6F69AF8EE5` |
| `docs/quality/sonar-family3.csv` | `D38E6068644861728C20FEF9C81E8646959E8AD3298DA52483BFFE9B1B02B8DA` |
| `docs/quality/sonar-family4a.csv` | `9A8AF9DE208FE99FEF11AF6EB75A778DAA69B8C326077D0C6B5DF328BD51FAB1` |
| `docs/quality/sonar-family4b.csv` | `BC860D95B416AB1F67AA005109B581B679C753B091DC756505214EB64C273C65` |
| `docs/quality/sonar-family4c.csv` | `F2EA6060106F72713D0C5192C599C177F82A8008E570A5E46A9576EDC9BE9278` |
| `docs/quality/sonar-family4d.csv` | `17FE420D9905DE8EE703C42AA7F55F895E32920E37F25225E9806B0EBE741FD7` |
| `docs/quality/sonar-post-delta.csv` | `F690D1CEB02C09C3D2DA35A49EABB47EB7512549421DA3660A85DA00EB91A6A2` |
| `micodent-backend/coverage/lcov.info` | `E1E4F4E4C150AB59D0B25C241CBAC9DE6DBA62AE1C14E8EC6CDACB698692F088` |
| `micodent-backend/package-lock.json` | `1CB0F998A4C7427F742B03D4556E289FE2C6F6EF6D0A91E847F7C234F2D42761` |
| `micodent-backend/package.json` | `18509AFCBD5524F503F95DDEF93F9612399E32C82D6EEB3036093E8A1CB1E342` |
| `micodent-backend/scripts/audit-clinical-files.js` | `2F8061F9C6CF13BF5221929B7B26A04CCFD14EEAC2B3D38D38A2F97DBB2E1267` |
| `micodent-backend/scripts/check-secrets.js` | `54CF0AB14AE0BD0B0DE3BDB51110065F727935170FD86A38B10B3D9F5F47DBEA` |
| `micodent-backend/scripts/migrate-clinical-files.js` | `E796CB5F16DB74AC1AA4042F92871788E2FC835D14D9AB53F7C56EEF2261EBF5` |
| `micodent-backend/scripts/migrate-hotfix.js` | `ED539C9B72DEDE13E32D579792F6FB262EC65E1B1B97874CAEB2EEE274B26D59` |
| `micodent-backend/scripts/migrate-s1a.js` | `9A1B1A07877EF16C8070B0B5B3E06BE4486F963EF6120900C4225A4A593BEDA8` |
| `micodent-backend/scripts/package-e13-pilot.ps1` | `BF67F64BCBE169705923E7212CE79E32133E5A15B53BD05048FD0E36C6DA7194` |
| `micodent-backend/scripts/package-frontend.js` | `C1F90C722341D91AB83349650D3200958ADAA66D200C398A9BBAB5CDE693970C` |
| `micodent-backend/scripts/package-hotfix.cjs` | `34662F8FC62D5103DD1D05EB517D310B9C983DFA59B0A24371257DB7BDAF36BA` |
| `micodent-backend/scripts/setup-fresh-pilot.js` | `D9FC141630550E7D3384C038770F0F4BD42C45C9761AF11E583BE0D1AFE1B140` |
| `micodent-backend/scripts/test-coverage.cjs` | `E1DCED6BBCF0A26605898EB9496A15E0B4751CD9166C9B7759DFA8F5C6EF7AB2` |
| `micodent-backend/scripts/verify-s1a-preservation.js` | `B5EF33500C84BC515AE35436757CAC479FCD5351F7F483B67ACF5AC012C01384` |
| `micodent-backend/src/config/browserTransport.js` | `D0D7B5D761C9CDDE9551C25BB7C68D100AE50B97AA869BC8ED66ACCB4C04DB91` |
| `micodent-backend/src/config/db.js` | `B967627AA01E7AB4E1717B5D4C5EE764096F03FE03B460B98ECF1DA32A6BD5B6` |
| `micodent-backend/src/config/environment.js` | `582958E1A9B78E282667F953055F74F8D24672D602AB9541621BE8FBFE2166FE` |
| `micodent-backend/src/config/multer.js` | `82F99A1CBDB5E12414DD20A692EFFA98D4E883585B42B5F14495FF0F45C0363D` |
| `micodent-backend/src/controllers/auditoria.controller.js` | `58FA2C426CEFA5131D384C9B1EF1CFC2E888A621CCC5675384925CF70743190C` |
| `micodent-backend/src/controllers/auth.controller.js` | `429D6D29F70A5E84E5F08D755649D268D8FF075BE903A4013AE4519DF9F47BF4` |
| `micodent-backend/src/controllers/citas.controller.js` | `4EE5994C3326F80BCC63EE0C8F3898698903063DF96979373478A36C29C19BD9` |
| `micodent-backend/src/controllers/cobros.controller.js` | `400FA7E482F5AF8D45EE83745F7B9F0D22BF58944B811454EA9EBA0EAA8AAE32` |
| `micodent-backend/src/controllers/dashboard.controller.js` | `C29E41EDBE9CD9EC2DDFF3C6C31D9A1E9FDF3018B721C9EDAEBAB095506E352C` |
| `micodent-backend/src/controllers/gastos.controller.js` | `820F39BC15B873C11EF21F36CA53CE01D57C51A6475970B3A366B68703E7F9D3` |
| `micodent-backend/src/controllers/historias.controller.js` | `DB84F1580D60DA9B4DED635202E4918D91F10A2536057A0115F0708A862C8662` |
| `micodent-backend/src/controllers/laboratorio.controller.js` | `6C69D95FD23C2F4E05C65401D42FDDF456C4564155CD2C85E85D95045E91950A` |
| `micodent-backend/src/controllers/pacientes.controller.js` | `8B3CB8E5EF23DBDBDAF2C572A4C1F3631D5D0A13B79750E290217B7A6507E688` |
| `micodent-backend/src/controllers/pos.controller.js` | `8495BAAE6C22C0E121919FABD4D1A8E37C995CAC41E0F14C1BBE125424E64745` |
| `micodent-backend/src/controllers/produccion.controller.js` | `E338E4901D10BAF24E69859EA0F66F78CA335C7614EC8E79F68BC838A3029C75` |
| `micodent-backend/src/controllers/usuarios.controller.js` | `719F7F734757B7D52DCC89CFC81D9C57D840F4DE0327625E70DE2A6CD8556AB0` |
| `micodent-backend/src/index.js` | `2B9A2EA8001F600983998BDC71ECAF6783411171752F2FCB7F520CE1D8A2E4C7` |
| `micodent-backend/src/middleware/auth.js` | `FB4BAF857D2BA1E753254D6FD04AA2A5E2C0545D8C3E768642BEFC872C3EA6AA` |
| `micodent-backend/src/middleware/limitarAutenticacion.js` | `8A5D221B7F29C013904E854AC49633642EE28949FD383EA55510C0B9041EAC1F` |
| `micodent-backend/src/routes/auditoria.routes.js` | `66ACA7A7285416DF7900DBE578E35485BC81BE87B892A118C43CF5D9886BB52B` |
| `micodent-backend/src/routes/auth.routes.js` | `EEFF481B5C67532D3717B1D0589256BF64F3242CC68B04EE03A4928FD2D2018F` |
| `micodent-backend/src/routes/citas.routes.js` | `D283D3FED71589942CA22B840F74D67205877D1393C9C4DD1F9A6D8B726E8C25` |
| `micodent-backend/src/routes/dashboard.routes.js` | `0FC99BC5817C912C06D22609E2B547D2DA96DCEBE9655C46C47A8C140A9347B1` |
| `micodent-backend/src/routes/gastos.routes.js` | `DF51A004FF0EB8C829A34ACE6B54104AA343E2DCE15BD778DB9183A23D7AF256` |
| `micodent-backend/src/routes/historias.routes.js` | `3033205EC43D938581A7A0B5447C374DBCB809CBA164004D6F04C2AE3C975AEA` |
| `micodent-backend/src/routes/laboratorio.routes.js` | `E0AB96052D376CBE0118E141BC1B95CA9C76428992A265BF29FA1403039B1B79` |
| `micodent-backend/src/routes/pacientes.routes.js` | `2AB3834D62F629A63D4078BF1E39D67DD93237823281BC3B7FD78DA7D38532CB` |
| `micodent-backend/src/routes/usuarios.routes.js` | `FB8B938683543D2CD4E83E765C82D7F98720B2D210891B3893C9616D21FAD3B7` |
| `micodent-backend/src/services/accessPolicy.js` | `F581B34EC387C1697514D72F1545C6DC24AA3C58431F5413714729BEAB839687` |
| `micodent-backend/src/services/browserTransport.js` | `6F48364B3BD39E36684B3AED3D4656AD2BBC5B28DBC2B5B5E31FDEEFE4D14D11` |
| `micodent-backend/src/services/clinicalFiles.js` | `8DEB6D4CB6906443A9BC871398EE1986CFBA8DBD7B423DA1CDD66BB8010C3673` |
| `micodent-backend/src/services/clinicalUpload.js` | `1C19E52E98BA12250B72607D7F05C8B61AA9BF14057A9FEBD140B462E427245E` |
| `micodent-backend/src/services/finanzas.js` | `E227A09710C8096BF3895E15D12285881A038D2FAE6522A1A0750544A01F66D5` |
| `micodent-backend/src/services/operacionFinanciera.js` | `6255594BD917936EB27EE4F5F299C01A68A446338EE77BB0606FC62EB7D53085` |
| `micodent-backend/src/services/password.service.js` | `6A5D4E18112D80D19CEC503A3EB6AFBCC8B4A6407BB4545C999E2182B87E3979` |
| `micodent-backend/src/services/security.js` | `59D2C983B264CBC3EED51D71C8B47AFE3D1652040433E96F5F381E6D9F7094AC` |
| `micodent-backend/src/services/session.service.js` | `8D8DDD4893C3B563AA70CDC766801196128B4EB29E62A347BAD58B3BE0E29C86` |
| `micodent-backend/src/utils/auditoriaFinanciera.js` | `F30A89E1825833F2D3B2A2C4C9A704AB3894B39107C73FD43C403A4D80B52122` |
| `micodent-backend/src/utils/auditoriaSeguridad.js` | `1B08AFEBA90299BBFA69C2E1F6080BD50B368851D15FCC0A1B36AB1F00294B4D` |
| `micodent-backend/src/utils/fecha.js` | `03DB5205E230A269729838200B3630E83296E5C3C7E06879A6806F220505B956` |
| `micodent-backend/src/utils/jsonFields.js` | `7D18A18985BE010ED27CB55784BB2E1EEECCC5BC3A108928C5923616AED5C7D8` |
| `micodent-backend/src/utils/securityError.js` | `278115B5AB391A7B043C49515CB91363F7D9F461551AD3E22BDD36C903454535` |
| `micodent-backend/tests/agenda-browser.cjs` | `E3B9838656791E7E759705B0F6E225192D84F5BBDA95F357CEB77FB030C4B364` |
| `micodent-backend/tests/agenda-integration.cjs` | `363F412E5537698D225FEED9F0F3107F1B363CD886261FF42160FD14FCEAEC0D` |
| `micodent-backend/tests/api-contract-integration.cjs` | `DF0BFB1F1645CDE54AE7B4ADEF456F5393C45BB380203D6D383DBE1701463CB5` |
| `micodent-backend/tests/baseline-browser.cjs` | `2A2A9D97B2B16E0487625362E21EB87CA7812E7F9450EAE553554CE01E35C10D` |
| `micodent-backend/tests/browser-isolated.cjs` | `76CBBC3B7577E417FD6CF9070C41983FC2B6959C3140E95D93764BCEB706B6D8` |
| `micodent-backend/tests/clinical-files-integration.cjs` | `6C246061FD36CF518AEF868720592C42E81E8CCB57F069D8055976B6EB9D9DCE` |
| `micodent-backend/tests/finance-browser.cjs` | `C84B5E351275B794B119E39BCF7225A257DD51951B960AC059AAD13D1D02B66D` |
| `micodent-backend/tests/fresh-pilot-integration.cjs` | `5A7CCB719620AD342F349A42BDBE20DAA19FF806C36D0ED66ADAD50578A7DA69` |
| `micodent-backend/tests/helpers/academic-db.cjs` | `2DB845E4B706F3F26E81525C2242A3D7602D4168F4B2EABEC7AB12976F0120BF` |
| `micodent-backend/tests/helpers/cookie-app.cjs` | `462C746584B13345302C44260B1ECB80AA9070B3FD4DD6163E4F25EB570C021D` |
| `micodent-backend/tests/helpers/cookie-client.cjs` | `3DA74760AFFBF08D10CDE2925F7FC796DE8626DCB3CA75B6AB07E49E01A84931` |
| `micodent-backend/tests/helpers/coverage-p1-db.cjs` | `085A5765ED236BF408E7C21F61CC29FB2617766D8E54CCA139112EC201F64FC1` |
| `micodent-backend/tests/hotfix-browser.cjs` | `BF13876A86463AC22E953923215986E1425113D44913C36B1D6D65D639FDF765` |
| `micodent-backend/tests/hotfix-integration.cjs` | `13B6178F96F445B764E5147BA585278086366FFFF07310333D86B94E285F1FEB` |
| `micodent-backend/tests/integration/security.test.js` | `B44821AC65CD34394D33479986A2833B4C158EC492D826A69945435028547009` |
| `micodent-backend/tests/pos-debt-browser.cjs` | `D46B4DB9594EF1D495C7F0F9E476FFE43657FE2E9C5B808395352F7DB43C21DA` |
| `micodent-backend/tests/pos-debt-integration.cjs` | `7C3C995F0A51D23AB1797B54205538C004B3B60E1FDCB1A717F7059BA9AD1E6D` |
| `micodent-backend/tests/s1a-browser.cjs` | `811EB34CA76FDC950E7471A28DA763EEB9C763103CC49441F04957350C0F9868` |
| `micodent-backend/tests/s1a-hotfix-integration.cjs` | `4200307F9A2DD7BF2DF58079E0178DA7D02D506753959D4F0A1C738B79611EAB` |
| `micodent-backend/tests/s1a-startup.cjs` | `3FBF231BC3763B03F420587427CE918BCB075850F801EEEEA31A2D653AB59E99` |
| `micodent-backend/tests/unit/academic-a-agenda.test.cjs` | `25B0B66627E70566B281D6CF8F3814EC7EA9C0763E0D6A53058848FC07D6A4E7` |
| `micodent-backend/tests/unit/academic-a-history.test.cjs` | `32A4E937FFA2252D981B44FA3269A41B3FDBECC06BEF820E4C9D4728CAB09A3F` |
| `micodent-backend/tests/unit/academic-a-patients.test.cjs` | `E0EC18F6472FF659482E31CCB9F6EDA5CDADFD47BCB6115FE48CA2B79ACE8138` |
| `micodent-backend/tests/unit/academic-b-expenses.test.cjs` | `6FECF007A355763E7B7DC1571C814A87DB38430506E5C14A93241BFF09E6C8ED` |
| `micodent-backend/tests/unit/academic-b-laboratory.test.cjs` | `AAEB956A0FD0021837FD943C688CA071EFD6458ED147D3CF4C9017B5F9976E1D` |
| `micodent-backend/tests/unit/academic-b-patients.test.cjs` | `C44CDB0678E6500DB8F4A00984F84275B1CF49B8B7FAE23D7DF394E9A99E5664` |
| `micodent-backend/tests/unit/academic-b-summary.test.cjs` | `D99C7F217833C8A2F847FF373A033718924EF0CAE76E8D3F9164EE579FA104F3` |
| `micodent-backend/tests/unit/academic-b-users.test.cjs` | `016B1C0E6437EFDC725B441711A187464F087959D51C1CB518A71EA5D833BF46` |
| `micodent-backend/tests/unit/academic-c-attachments.test.cjs` | `68590A5CA7DE9AEDF706BFAA8C083D16CB9BB99A1F085D5482948A6648DFC022` |
| `micodent-backend/tests/unit/academic-c-documents.test.cjs` | `6F0F2C9ACF7FB39CE4EF9557F6D07472B2F21EAEFA96C72AB3C2B90F1E1ACA9F` |
| `micodent-backend/tests/unit/academic-c-payments.test.cjs` | `061CDADD1D61544054EC1BE17336D9248E064CC7BA13886829B9ABDD30DFF4C9` |
| `micodent-backend/tests/unit/access-policy.test.js` | `C2CBF71D18D6F059EEB6E17A4563B93B98D2078A55AD603C618B804FA4739958` |
| `micodent-backend/tests/unit/arranque.test.cjs` | `40FD44C113191C709EE25628FC99E9D6A2BE52BBE15E9D75E3D70E7E1C02828D` |
| `micodent-backend/tests/unit/clinical-files.test.js` | `AB83DB07022E9BD45FC6957148F192E96192C0FB1E31E7D2AF67F072DE4A8230` |
| `micodent-backend/tests/unit/clinical-upload.test.js` | `41474BB11F8568A05C403305017BDCB35D863D16DB2EF5ADAAF6D9C1F4175C7D` |
| `micodent-backend/tests/unit/cookie-transport.test.js` | `9A036AD4A62D4A4C663602625D89BF495A87FFD606D4999E8AE86E0A4AC04308` |
| `micodent-backend/tests/unit/coverage-p1.test.cjs` | `39C99973183B6C72ACA644A5F3D261F3444CE6CB28E2F98B92BB73FCE3EFB419` |
| `micodent-backend/tests/unit/errors.test.js` | `B431527E8A7BE91BA7A5111403B8B598EF07FB56677BF58B45EF054204CD6B52` |
| `micodent-backend/tests/unit/finanzas.test.cjs` | `F812248FB66490042258E63F36B7CAF709F28A3EDA2AF32A1A8797AF5A36D305` |
| `micodent-backend/tests/unit/migration-baseline.test.js` | `935B1709D5EF0DE814C5884A802C5AD84E5AFEE4EC3913BA8ACC30BCC0715508` |
| `micodent-backend/tests/unit/password.test.js` | `6583E75153C7F75F862229E7E9C591392AA73192B75D11F84941DE3C21359933` |
| `micodent-backend/tests/unit/route-guards.test.js` | `068A45E1ACC28209209DD5D508FFADD12AC3046856912D2B2F5D6475649E3A93` |
| `micodent-backend/tests/unit/secrets.test.js` | `EA92639AA540A4383C92FDB37A387493B87AE19F6AC9E3176772CA83E7AA786B` |
| `micodent-backend/tests/unit/sonar-family4c.test.cjs` | `6880EBC133A576E3CAA9E53566C71DB579B55B6F3BF622B440621B5A59626FEF` |
| `micodent-backend/tests/unit/sonar-family4d.test.cjs` | `A7AF077BAB8162D01CCEF95AE2F8372DE2639B279B83AB610FBDA739245A1C2E` |
| `micodent-backend/tests/unit/sonar-post-delta.test.cjs` | `035B5CFAA3FE2F9A21D192DF460C91E1AD42B137E5FA03FB1A7DAC0E44981990` |
| `micodent-frontend/coverage/lcov.info` | `B36B08031FA02C243B390E89105EF1BB630C01885B9BEB270F04729A7C691A42` |
| `micodent-frontend/cypress.config.cjs` | `35E92C4B21A4A55D4D1A4A6F10B0475F2B968D2E67DC751DA8BDF14B30241EFE` |
| `micodent-frontend/cypress/e2e/micodent.cy.cjs` | `296C03B75D99420700F7D931C6149B18D74BC00A7AE9CBF80E78C362C05A157E` |
| `micodent-frontend/cypress/fixtures/synthetic-api.cjs` | `445B8AFAC7C41AE6EC98B470A4E946EEFE8437F92874D2459894EC02374D667B` |
| `micodent-frontend/cypress/support/e2e.cjs` | `58602322EEA64B799AB1482AE45C22A06004FB03D3A2F304F5B757D2F632F3B2` |
| `micodent-frontend/package-lock.json` | `1B59A8D590DCCCD1C5D408DB0867A0EB6CCFD7BE5E61E21765D49ECEC6EE2B00` |
| `micodent-frontend/package.json` | `2383F85FC19C93C5657244C6A670AAFF5D50E7E73DDD6441F71295A7EC76B6C3` |
| `micodent-frontend/scripts/test-e2e.mjs` | `E8DE77D59B13B49EE4802D7BD5B55A67B8FCDB652178529A6A698A2FF7792435` |
| `micodent-frontend/src/App.jsx` | `2C38A7A39BA02098A10D63DC4E9A839C382F1B2EFEAFEFA258EE695491460873` |
| `micodent-frontend/src/assets/hero.png` | `881FFBCAAFC212E49ADDAD08846A5B82761355FA20624253AF3477BA33262C5C` |
| `micodent-frontend/src/assets/react.svg` | `35EF61ED53B323AE94A16A8EC659B3D0AF3880698791133F23B084085AB1C2E5` |
| `micodent-frontend/src/assets/vite.svg` | `2F1F6C6F90A0EF7422CBB4CFAFCD8AD329C507A18AFDC34CC21FA72179B9C54A` |
| `micodent-frontend/src/components/AgendaDia.jsx` | `1FF58C868C1C902CFA088F122FD5C8AFFBB3A9F0ED746AFD23746D1FAD01FC4D` |
| `micodent-frontend/src/components/AgendaMes.jsx` | `391C11FC3A57F472FF41CACFF8195BC08ECF01EC38230893FFF6D5704CE2DC74` |
| `micodent-frontend/src/components/AgendaSemana.jsx` | `8EA499117D2FEDBA380803AE0A63A7A6CDD394E0D62F17B7B75C3B2C35F1E1F6` |
| `micodent-frontend/src/components/AppErrorBoundary.jsx` | `7F2C6FE7E78D21D8A5AF8F8C9AB799D3F6D5DECF6D7A98F47D77D8FB06E654ED` |
| `micodent-frontend/src/components/CitaModal.jsx` | `92E5EB90A915FD59DE20F618DB09A32FB649B6A338B6901FF161F647BBAFD03D` |
| `micodent-frontend/src/components/ClinicalImage.jsx` | `CC8C3B0AB3339832CDEAD5664F31D791A4CDC34728FE614124524673A391E7E5` |
| `micodent-frontend/src/components/ConfiguracionPos.jsx` | `6498F798BB968817AA0881E983C1360D17D00F94A63021B36719BF99931B2991` |
| `micodent-frontend/src/components/ConfirmModal.jsx` | `BA2C4AB47DBA5AFDEB40A6E0198F2D36972E0A638FF7D3EF8687C72153322F72` |
| `micodent-frontend/src/components/Diente.jsx` | `2F42902BC87FD10AB38537017218441904E3FCBC8877E0A745C1978AE1236A5B` |
| `micodent-frontend/src/components/DocumentActions.jsx` | `F03C2FD379B0A0ED33BC6E7F10CA0FB865572D6C57314B966251E314C766385B` |
| `micodent-frontend/src/components/FirmaMiniBlock.jsx` | `F79F98EE7E8ACB4CF159AFA01D7812443E6DD1730540FC7842EBCFF47FFEE463` |
| `micodent-frontend/src/components/InputV.jsx` | `B4C27B5B93F661E44178F1E6C9E0B3878B642795AEAFD04001EE5B6EDB974C1B` |
| `micodent-frontend/src/components/MetodoPago.jsx` | `3FDC4DDF2E07841D151443004650AFE634C1EDD26AD8ECD307DE7F7B6D0E4AF0` |
| `micodent-frontend/src/components/ModalDialog.jsx` | `09E89C4358850E7DFA5CA33A69901CF96D92B753A57082CB8642F3EEC4FC7E43` |
| `micodent-frontend/src/components/OdontogramaEditor.jsx` | `57A29F10DA475C3CFB607F333909B379EDA0639D9DF6CDF25804C23C7E6A2306` |
| `micodent-frontend/src/components/OrdenRadiografiaTab.jsx` | `0997FEA0005F54CDA514BB6FA2C2B1D08F37B0C9D986D4395C5B0A6AD17506F0` |
| `micodent-frontend/src/components/PiezaSelector.jsx` | `B3AAEF47A028545D5DF4F526FF14DB6BA684E2F0FAE34A3BBD7108B6779FD1A6` |
| `micodent-frontend/src/components/PrintPortal.jsx` | `0FF1BB71345D3ADAE28296F2C6147A1734618EEA66DD606A4B3BA92E6FB91BE1` |
| `micodent-frontend/src/components/RecetarioTab.jsx` | `F5E56758746071E2B3A2BEB7A06A3F595B04EC634B7131F55D940B966DF4290C` |
| `micodent-frontend/src/components/RxTeethPrint.jsx` | `1623E3D34E1E9306A6C0721B9856EDFE8EDE6C76BD6BA31BE75EEEA2112799E4` |
| `micodent-frontend/src/components/SessionBoundary.jsx` | `C32CB5244D9934C4311786E1647A59695FD62E6367E8D8FE5FEBEE27AB03EEDA` |
| `micodent-frontend/src/components/SignaturePad.jsx` | `7B8ADE91D150256FB79C5F5AF48B9C74D47B8911A53F369D6F86FC3C6DF6809F` |
| `micodent-frontend/src/index.css` | `8A7BD066F862F94E0E5E9B43C3D2BFAECE962003C0C02602A6D917167648F081` |
| `micodent-frontend/src/layouts/MainLayout.jsx` | `199AC06C91454BA49A073818343E966A8A682D0265B25611088E1ADEA1F9FE54` |
| `micodent-frontend/src/main.jsx` | `16304947D66263A518B378A10EBBF9C7D044965FDFC1F0CCBC1A4A1A203E270A` |
| `micodent-frontend/src/pages/AdministracionPersonal.jsx` | `AD5C1B34D9D16D0F215DA0A5BAD95C5BDFAB0E69FEAD947B5B778566006FF079` |
| `micodent-frontend/src/pages/Agenda.jsx` | `748C545F9FE216D6CC7561F4531256AC6FCD7D23A6F764B24F29EB207DAD805D` |
| `micodent-frontend/src/pages/Dashboard.jsx` | `82CBC8FB0A8C3DAF158D4C81051D7E02E4E0A1DC4F417EF36E0536EBBC6A0B5C` |
| `micodent-frontend/src/pages/FinanzasDashboard.jsx` | `017866D6B42C9E2121172D7418134904A6E11258173942101616DE43359A9996` |
| `micodent-frontend/src/pages/Historias.jsx` | `DD172D3DF0AA61178043388A4936C0A9821947DD7294A0CCF9E9E4665FAA3DE7` |
| `micodent-frontend/src/pages/Login.jsx` | `4B5E14F2C3DEDA9A76F4CBA777582BCDF7EA5BDF1B350C3D555181F36A2BAEF5` |
| `micodent-frontend/src/pages/MiPerfil.jsx` | `4F693BBE25D69CE2DF0EE5F29EE44742BFCB4393C365D3A7E47D60AACAC22F4B` |
| `micodent-frontend/src/pages/PacienteDetalle.jsx` | `4508EAFBE0EC3D4394F902D65215784DC8EE622A49E82EB76FE0BF095C97C8EA` |
| `micodent-frontend/src/pages/Pacientes.jsx` | `8A35288836D04FFD61BE735EE0DEFB5DA9C0D05C8DD410507FB98DCC1AFD89B0` |
| `micodent-frontend/src/pages/Produccion.jsx` | `266C3D8FEDD9F41F8B806F640703BEBBAA413DD8E3F2BA032B6700529FE3AC60` |
| `micodent-frontend/src/services/api.js` | `A4FDD1CBB14DAEE60C6BCEBE475B6BBDAA628CEB75274AB5FC0700235B39F6C7` |
| `micodent-frontend/src/services/browserSession.js` | `812E8D723C08B04587B6F146F0D9DB38B8780DE6B53FB4215E651E5E55A10658` |
| `micodent-frontend/src/services/session.js` | `8529F93B58E31DA3A3BC959845CEC2ABCEA8781186F2A6B87DC591A2D8B93C7A` |
| `micodent-frontend/src/services/sessionState.js` | `6BEA188E6A03FEC10B8AAA4F582967EFD35E91F48048B48B3C83C229A243C65B` |
| `micodent-frontend/src/utils/agendaUtils.js` | `8288E790152F78BBED2452B24688EB49D5397113D60F97F0BBC815FC3C105B07` |
| `micodent-frontend/src/utils/data.js` | `3FDAEFC94DE0B30A74CB6E263708AEADB602D5D715496E232155F44F2A7EE905` |
| `micodent-frontend/src/utils/financeEvents.js` | `28616E814F3C87DCA2A93A4C5B993517219A6634761EDE52C976E1B5709E4DD9` |
| `micodent-frontend/src/utils/modalFocus.js` | `F1ABA3155726EA2F033D8F9EBE2E4579A60C8601A6056B133D13655A7542D2B3` |
| `micodent-frontend/src/utils/passwordPolicy.js` | `0385781B10F1771B559904913F9F7C46FBB17548D4D4BCB7E0661CF138DBFE1D` |
| `micodent-frontend/src/utils/printDocument.js` | `21C8247CFA1175BF20022391B07B98B596CA2259898EA7FF8500D11BB9A0F328` |
| `micodent-frontend/src/utils/rxTeeth.js` | `10974756BEA57DC4E7AF95A7745C675B2CA521AB35E6E2E8F8F940EDEFD744EC` |
| `micodent-frontend/src/utils/tratamientosDb.js` | `C344538E5FD4B486FDBDAD41DD81A4568FCBE8B47EF35E5CAA232B7AB0EDD348` |
| `micodent-frontend/test-results/cypress/run.json` | `E3576DC40DEE90061234C453ED8F00B5D3A5272A62B72B52CC57D55BA48BA55A` |
| `micodent-frontend/tests/academic-a-documents.test.mjs` | `619DA0900F5D1C17834661C5663931BF35431217F7A1BB10A02199853B2AEB24` |
| `micodent-frontend/tests/academic-a-lists.test.mjs` | `0403ACC9CA97ABA3C29F4115CECFCF0DEB15EBC3775F4D26A75893F821789016` |
| `micodent-frontend/tests/academic-a-patient.test.mjs` | `F71921789AA7347828155238E896A2821C9FD3577B63FA4FF478435A34F32CC9` |
| `micodent-frontend/tests/academic-a-session.test.mjs` | `4034FFFBAB92EDB21E43CAEEEC6535BEE66F964BC4BAB22E202AEEDC9A95EE8E` |
| `micodent-frontend/tests/academic-b-data-api.test.mjs` | `6E41FCFE5FAE91A577EB2258C9E9EB321A1A7E5BC163B79C3F97CA6D08B4FEE8` |
| `micodent-frontend/tests/academic-b-finance.test.mjs` | `5A82A9C98012E47D53893C52C956424164BD297FD23C2F235CE4DA1B5FCBAED4` |
| `micodent-frontend/tests/academic-b-history.test.mjs` | `BC85820B068C1689922854227CB08FB097719FF4C06F99FBA28F879E72C4C840` |
| `micodent-frontend/tests/academic-b-profile-login.test.mjs` | `31E51CBA46D5C15C424B2485C744C6AD1A64F946C1E5376F477DC38CE7AD3DEA` |
| `micodent-frontend/tests/academic-c-attachments.test.mjs` | `79720EE7575DD9ACA22210323155F58D33BD31401173BEE3106E49EA793537E8` |
| `micodent-frontend/tests/academic-c-keyboard.test.mjs` | `A9526A49C1C864DB2C39D7D5CF1987123AC22F3C0EBD111B125ED10D1FE5630E` |
| `micodent-frontend/tests/accessibility.test.mjs` | `B63150D64A9AB7F294E097C23C98F5FC30024D351C23695BB54F5319894A1858` |
| `micodent-frontend/tests/agendaUtils.test.mjs` | `A26FA12D1044CF3E042942134836485AB0BF25164B3D8C6CB8FD4F7B3383F759` |
| `micodent-frontend/tests/coverage-g1-navigation.test.mjs` | `5460B7398D634341F4E523483189A5D31AA10E9B55DDA4364FC463F01DC3ED9D` |
| `micodent-frontend/tests/coverage-p1-modals.test.mjs` | `F5ED3D9FBD273037D7C7AC2FD3674C65C0D2ACF973A46E4739CC56196B83100C` |
| `micodent-frontend/tests/coverage-p1-pages.test.mjs` | `31DE9E59BF839D70735BC4F1EAF1D53E6BE1BF6EC88B334B04825CF2C0FE0E2E` |
| `micodent-frontend/tests/coverage-p1-personal.test.mjs` | `E09569FF5D7DC28325EF685AC49472A93E72CD6F6343E470620EEC7F4EF64639` |
| `micodent-frontend/tests/coverage-p2-clinical.test.mjs` | `3613EAB215941D3E41CBFCADAA4B31C2FDE7D9FC62C6E22308F5E2639EC97244` |
| `micodent-frontend/tests/coverage-p2-finance.test.mjs` | `88DCB470E3686C343132B5651273211B947B45B2514A9F3DE83446DC19885455` |
| `micodent-frontend/tests/coverage-p2-patient.test.mjs` | `7ADDCE26704C6DF7500185CA536D894F5DBC3059360B37031584BB64E6AFE895` |
| `micodent-frontend/tests/data.test.mjs` | `7CCC2CD3BF8EC749F2D9B58A62C4AF3F573B7F49B3B1A04DB06D33ED4F636C36` |
| `micodent-frontend/tests/duplication-d1.test.mjs` | `BC603F72FC32693BECF18E762F86DE9E6110D6689D5DD73DD66221811C533A8A` |
| `micodent-frontend/tests/financeEvents.test.mjs` | `EB9219810139D0BFD22D0B546D10A7DD442F6BFEABB388D56F8699634C50CF3B` |
| `micodent-frontend/tests/helpers/component-boundaries.mjs` | `2E796C5FC812E4B705EFB9365644A066DD6A50EBD3A5425B3E80BB46BF1B57B4` |
| `micodent-frontend/tests/helpers/component-runtime.mjs` | `BC91339B988B0BC26B913BD2371525815FD68981CC55B8CF1DF3B64F691EAD4B` |
| `micodent-frontend/tests/modal-dialog.browser.mjs` | `D8D826BBE7FC642CEB7E725A161945E13D332B38923FFA635113A9CF946A59B3` |
| `micodent-frontend/tests/modal-dialog.test.mjs` | `34B14F19A16715E789234F50DB69C8A2BFDD25DE57A5E8D7464D406A7F4A2F60` |
| `micodent-frontend/tests/rxTeeth.test.mjs` | `2CE35D6390BF9F35F4D23D24132AA2C422F0BFCC379B41DAF78BDB3120346C80` |
| `micodent-frontend/tests/security.test.mjs` | `80FBA327007E316FDD6F6DA444BD7CD0E351B4065EB538C7FB10C92FF2B0F477` |
| `micodent-frontend/tests/sessionState.test.mjs` | `575AC5D2DD1990D416708ABF80B9FFA41AEF5BFF8116C7D4F29EC543D3568B79` |
| `micodent-frontend/tests/sonar-family4a.test.mjs` | `B4E8D0F607B9E244756A70AB875FD222D4F9EA0EFD223999CC45DE3E53BCB2DC` |
| `micodent-frontend/tests/sonar-family4b.test.mjs` | `2D35A78FBAE7C7162067DD546780BA132003228E2DC6D44798C05D7AE6492485` |
| `micodent-frontend/tests/sonar-family4c.test.mjs` | `81CDF0613D17036CB12D2E3E0274BC7718491112850A0347EBFEDDB04795D28B` |
| `micodent-frontend/tests/sonar-family4d.browser.mjs` | `6B39279DC652CDCE3F0BBBDE22A4B40A5064860A563AA6F2A489E5A99D3790A2` |
| `micodent-frontend/tests/sonar-family4d.test.mjs` | `7C818A04470BD9F5850D20456AB93B3E82B2F4ECD7C2BAD32A48F91BAEC69840` |
| `micodent-frontend/tests/sonar-post-delta.browser.mjs` | `D95DBB52CF586F1D14AEB844D6210DA37676AFE747137424BF095CB223917FC8` |
| `micodent-frontend/tests/sonar-post-delta.test.mjs` | `5B996FE42838EE3DDF57E6759B6F9B88CBF536000B105AE6410A55C17860A839` |
| `micodent-frontend/vite.config.js` | `00F5D7C5ACFA874223E622E95D6FD4B3CFD3E7EA8E25424BE5DD031C1F3B5459` |
| `sonar-project.properties` | `095FF220C2CD2F005DA787C9249DA60CAB82B2E93CBEC8F72560236F829DD1BB` |

## INSTRUCCIÓN PARA CODEX / FUTURAS SESIONES

Este baseline representa trabajo ya cerrado. Antes de iniciar cualquier nueva fase, leer este archivo y CURRENT_TASK.md. No repetir análisis o remediaciones ya documentadas salvo que exista una regresión nueva o un cambio funcional que lo justifique.

Usar esta versión local identificada por los archivos/hashes, no una copia antigua ni solo bbc15f1. Conservar el núcleo clínico, las 60 fichas y los diez Cypress. Consultar SONAR_EVIDENCE_INDEX.md para las métricas finales y mantener N/D en los antecedentes sin evidencia propia.

**SIGUIENTE FASE: UNIVERSITY_ADAPTATION_PLANNING.** Solo planificación cuando el propietario la solicite; esta sesión se detiene al congelar el baseline. No iniciar PostgreSQL, Docker, pipeline, despliegue universitario o fases clínicas automáticamente.


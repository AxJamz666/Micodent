# INFORME TÉCNICO DE MEJORA DE CALIDAD Y PRUEBAS
# SISTEMA MICODENT

**Subtítulo:** Análisis SonarQube, cobertura, pruebas automatizadas y Cypress E2E  
**Autor:** Alex Eduardo Rodriguez Aquino  
**Proyecto:** MICODENT - Sistema de Gestión Odontológica  
**Fecha de elaboración:** 4 de octubre de 2026, zona horaria America/Bogota (UTC-05:00)  
**Base de código:** `bbc15f187b1191169aafc3e8c651da38f9348f17`, referencia abreviada `bbc15f1`, más cambios locales de calidad.  
**Estado de esta entrega:** informe documental terminado; resultados locales validados anteriormente y contrastados con los artefactos disponibles. No se ejecutaron nuevas suites ni SonarQube para redactarlo.

## 1. Resumen Ejecutivo

MICODENT fue sometido a una remediación progresiva del código, seguida por pruebas automatizadas, integración de cobertura LCOV, una capa Cypress E2E y extracciones de componentes duplicados de bajo riesgo. El inventario inicial contiene **371 issues únicos**: 204 MINOR, 154 MAJOR, 11 CRITICAL y 2 BLOCKER. Los siete lotes de remediación contienen exactamente las mismas 371 claves, sin ausencias ni duplicados.

El reanálisis POST produjo 84 issues únicos. Su registro de trabajo documenta 83 correcciones y una revisión contextual, S5693. Las evidencias finales TEST10 verifican **Quality Gate PASSED, cero issues abiertos, un issue contextual aceptado, 81.4% de cobertura global, 97.4% de cobertura de código nuevo, 3.4% de duplicación global y 0.0% de duplicación nueva**.

Las últimas validaciones locales registran **151/151 pruebas frontend, 130/130 backend, 10/10 Cypress y build PASS**. Se verificaron físicamente ambos LCOV, sus métricas, las 60 fichas académicas únicas y el resultado estructurado de Cypress. No se detectaron regresiones en las pruebas ejecutadas.

**Consolidación posterior de evidencia:** se revisaron 28 archivos de diez conjuntos TEST1-TEST10 y se creó el índice maestro E19. El CSV denominado FINAL refleja un estado intermedio con S5693 OPEN; la captura individual TEST3 muestra su aceptación contextual y las vistas finales TEST10 muestran cero abiertos y un aceptado Overall. La discrepancia queda resuelta sin alterar los originales. La estimación LCOV de 81.4054% se mantiene separada de la medición Sonar de 81.4%, ahora verificada por PDF y capturas. Algunos hitos iniciales siguen sin respaldo visual propio y se identifican como C/NV.

## 2. Introducción

MICODENT es una aplicación de gestión odontológica con frontend React, backend Node.js/Express y persistencia MySQL. La fase aquí descrita aborda calidad estática, mantenibilidad, accesibilidad, pruebas y medición de cobertura. No documenta una nueva implantación en la clínica ni una adaptación universitaria.

Un análisis estático, una suite de regresión y un Quality Gate ofrecen evidencias diferentes. El primero identifica patrones del código; las pruebas verifican comportamientos bajo condiciones definidas; el Gate evalúa umbrales configurados en un análisis concreto. Ninguno demuestra por sí solo ausencia de defectos o aptitud integral para producción.

Las fuentes y artefactos se identifican en la sección 17. Para evitar confundir hechos con declaraciones, se utilizan estos niveles:

| Código | Significado |
| --- | --- |
| V | Verificado en un artefacto disponible durante elaboración/consolidación: CSV, JSON, LCOV, PDF, captura o archivo. |
| D | Documentado en un registro de ejecución previo; no repetido durante esta entrega. |
| C | Comunicado por el propietario en la solicitud o conservado como confirmación en los documentos. |
| E | Estimación local, no medición oficial de SonarQube. |
| NV | No verificado de forma independiente con la evidencia disponible. |

## 3. Objetivos

### 3.1 Objetivo General

Consolidar un informe trazable del estado antes y después de la mejora de calidad de MICODENT, conservando la diferencia entre resultados automatizados, mediciones Sonar, decisiones contextuales y limitaciones pendientes.

### 3.2 Objetivos Específicos

- Contrastar los 371 issues iniciales con los lotes de remediación y el delta POST.
- Documentar los 60 casos académicos, sin atribuirles un proceso TDD que no ocurrió.
- Presentar las 10 pruebas Cypress como una capa adicional con datos simulados.
- Describir la evolución de cobertura y verificar los LCOV finales.
- Justificar las extracciones de duplicación y los grupos conservados por riesgo.
- Registrar resultados de regresión, discrepancias y recomendaciones para completar la evidencia de entrega.

## 4. Estado Inicial del Sistema

El CSV E13 original contiene 371 filas y 371 claves únicas del proyecto Sonar `micodent-e13`. Su distribución, verificada mediante lectura estructurada, es:

| Severidad | Issues | Porcentaje del total |
| --- | ---: | ---: |
| MINOR | 204 | 55.0% |
| MAJOR | 154 | 41.5% |
| CRITICAL | 11 | 3.0% |
| BLOCKER | 2 | 0.5% |
| **Total** | **371** | **100.0%** |

La referencia inicial conocida es `bbc15f1`. La cobertura Sonar inicial E13 de 0.0% y la duplicación de 6.2% fueron aportadas por el propietario; ni el CSV ni el PDF TEST1 muestran esas medidas. Se conservan como C/NV. El PDF TEST1 sí verifica Security 2, Reliability 138 y Maintainability 313, con fecha interna 29 de septiembre de 2026, 21:50. Su fecha de archivo del 3 de octubre corresponde a copia/guardado, no al análisis inicial. El filtro Passed 1 / Failed 0 muestra Gate aprobado para el único proyecto listado.

El 0.0% inicial de cobertura reportada no demuestra inexistencia de pruebas: las suites ya estaban presentes y posteriormente se configuró la generación e importación de LCOV. No existe en las fuentes consultadas una ejecución inequívoca de ambas suites anterior a toda Familia 1. El primer control de esa familia registra frontend 28/28 PASS, backend 85/86 y build PASS; luego el backend se valida 86/86 al aislar TEMP/TMP.

El fallo Windows 85/86 estaba relacionado con una fixture CommonJS interpretada como ESM por un `package.json` externo en TEMP. El registro demuestra que no era una regresión de Familia 1; la validación se realizó con una carpeta temporal aislada, sin alterar el archivo externo ni el lanzador.

El proyecto POST utiliza la clave `micodent-post`. La comparación E13/POST representa una secuencia de intervención sobre la referencia de código, no una misma serie histórica del servidor garantizada por conservar idéntica clave de proyecto.

## 5. Metodología de Trabajo

La intervención siguió lotes acotados: selección de reglas o módulos, análisis de impacto, cambio mínimo, pruebas relacionadas, regresión proporcional, build cuando correspondía y checkpoint documental. Se conservaron cambios previos del workspace y no se utilizaron restauraciones globales de Git para descartar trabajo.

La preservación se comprobó mediante pruebas de comportamiento y, en las extracciones relevantes, equivalencia AST y huellas de fuentes. Estas guardas estructurales son complementarias: no se acreditan como ejecución clínica del componente ni sustituyen assertions de comportamiento.

Los tests frontend ejecutan componentes reales con React Testing Library, jsdom y transformación JSX mediante Babel. Los tests backend ejecutan servicios/controladores reales y, según el caso, Express con fetch; las dependencias SQL y datos externos se simulan. Las pruebas de navegador utilizan Edge mediante Playwright o Cypress, según la capa. Axios se ejercita en los contratos e interceptores correspondientes.

La evidencia clínica empleada es sintética. Las mutaciones de Cypress ocurren en fixtures en memoria; el servidor E2E no reenvía peticiones al backend clínico. En pruebas de archivos se utilizan bytes ficticios y directorios temporales. No se realizaron conexiones a MySQL/MariaDB clínica para las validaciones de esta fase documentadas como aisladas.

## 6. Remediación de SonarQube

### 6.1 Procesamiento del Inventario E13

| Lote | Issues | Intervención principal | Evidencia |
| --- | ---: | --- | --- |
| Familia 1 | 13 | 2 BLOCKER y 11 CRITICAL; extracciones y correcciones acotadas, sin sustituir reglas clínicas. | E01, CSV Familia 1 |
| Familia 2 | 42 | Correcciones mecánicas backend con equivalencia y validación de sintaxis. | E01, CSV Familia 2 |
| Familia 3 | 76 | Labels, controles semánticos y ciclo accesible de modales. | E01, CSV Familia 3 |
| Familia 4A | 126 | Imports, bindings y handlers demostrados sin uso; preservación del flujo activo. | E01, CSV Familia 4A |
| Familia 4B | 53 | Modernización sintáctica frontend comprobada como equivalente. | E01, CSV Familia 4B |
| Familia 4C | 25 | Manejo de excepciones y diagnósticos controlados, sin exponer datos sensibles. | E01, CSV Familia 4C |
| Familia 4D | 36 | Resto del CSV: condiciones, claves de listas, tipos de retorno y revisión contextual. | E01, CSV Familia 4D |
| **Total** | **371** | **371 claves únicas; diferencias contra el CSV original: 0.** | V |

Procesar un issue no implica que todos exigieran cambios: los registros distinguen CORREGIDO, YA_RESUELTO_POR_CAMBIO_PREVIO y FALSO_POSITIVO. Esta clasificación local tampoco equivale automáticamente a cambiar su estado en Sonar.

La Familia 3 incorporó modales con `dialog` gestionado, foco inicial, navegación Tab/Shift+Tab, retorno de foco, Escape cuando correspondía, conservación de overlays y scroll. Se evitó una sustitución automática de etiquetas que pudiera alterar formularios o capas de avisos.

### 6.2 Reanálisis POST y Delta Final

La exportación POST contiene **84 filas y 84 claves únicas**. El registro del delta documenta **83 CORREGIDO, 1 CONTEXTUAL_REVIEWED y 0 pendientes locales**, con frontend 97/97, backend 103/103 y build PASS en ese checkpoint.

Representación de la evolución:

```text
E13: 371 issues
  -> POST tras Familias 1-4: 84 issues únicos
  -> Delta: 83 corregidos + 1 contextual revisado
  -> Estado final verificado TEST10: 0 abiertos + 1 aceptado
```

Los 84 del POST son una nueva fotografía del analizador, no un subconjunto que permita atribuir cada diferencia numérica a una corrección individual E13. No se suman como 455 defectos independientes.

### 6.3 S5693: Decisión Contextual

S5693 solicita revisar la seguridad del límite de contenido en `micodent-backend/src/config/multer.js`. El límite clínico **10 MiB** fue revisado y conservado deliberadamente; no fue corregido eliminándolo ni incrementándolo para silenciar el analizador.

El registro describe límites de multipart, tipos permitidos, validación de contenido y pruebas que aceptan un JPEG sintético de 9 MiB y rechazan exceso de 10 MiB y MIME incompatible. Esta evidencia no certifica cargas concurrentes o almacenamiento ilimitado.

Una exportación intermedia conservaba S5693 como OPEN; posteriormente el hallazgo fue revisado y aceptado como contextual, manteniéndose el límite de 10 MiB por requerimientos funcionales. TEST3/Aceptacion Issue.png muestra javascript:S5693 Accepted y el límite en multer.js. La pantalla de Issues posterior filtrada OPEN/CONFIRMED está vacía. TEST5-TEST10 muestran un aceptado en sus vistas Overall disponibles; TEST10 confirma cero abiertos y un aceptado. La identidad se establece por la captura individual y continuidad documental, no por un nuevo detalle individual en TEST10. S5693 no fue corregido y la etiqueta histórica FALSO_POSITIVO no sustituye esta evidencia de aceptación.

### 6.4 Estado Final Verificado de Sonar

| Indicador | Resultado | Verificación documental |
| --- | --- | --- |
| Quality Gate | PASSED | V; TEST10 PDF y PNG. |
| Security | 0 open issues | V; TEST10 Overall. |
| Reliability | 0 open issues | V; TEST10 Overall. |
| Maintainability | 0 open issues | V; TEST10 Overall. |
| Security Hotspots | 0 | V; TEST10 Overall y New Code. |
| Accepted issues | 1 Overall; 0 New Code | V; TEST10 para totales, TEST3 para S5693 individual. |

### 6.5 Historial de Ejecuciones SonarQube

Se documentan diez conjuntos de análisis/checkpoints en [SONAR_EVIDENCE_INDEX.md](SONAR_EVIDENCE_INDEX.md). Sus métricas y fechas se reconstruyeron por contenido, metadatos PDF y capturas, sin ordenar solamente por nombres de carpetas. El índice detalla objetivo, correspondencia documental, archivos, hashes y dimensiones de calidad de cada conjunto.

| Test / carpeta | Fecha de evidencia local (UTC-05:00) | Etapa | Gate | Abiertos | Accepted Overall | Coverage Overall / New | Duplicación Overall / New |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 01 / TEST1 | 2026-09-29 21:50, interna PDF | Baseline E13 | PASSED, filtro único proyecto | 371 | N/D | N/D / N/D | N/D / N/D |
| 02 / TEST2 | 2026-10-03 15:35, interna PDF | POST Familias 1-4 | PASSED | 84 | 0 | 0.0% / N/D | 5.5% / N/D |
| 03 / TEST3 | 2026-10-03 16:17-16:30 | Delta y aceptación S5693 | FAILED | 1 -> 0 | 1, captura individual | N/D / 0.0% | N/D / 0.0% |
| 04 / TEST4 | 2026-10-03 17:44:52, archivo PNG | Coverage P1 | FAILED | N/D | N/D | N/D / 74.8% | N/D / 0.0% |
| 05 / TEST5 | 2026-10-03 18:08-18:10 | Coverage P2 | PASSED | 0 | 1 | 47.0% / 96.1% | 5.6% / 0.0% |
| 06 / TEST6 | 2026-10-03 19:47, interna PDF | Ampliación académica, antes de cierre Cypress | PASSED | 0 | 1 | 75.8% / 96.1% | 5.6% / 0.0% |
| 07 / TEST7 | 2026-10-04 09:22-09:23, nombres PNG | Checkpoint posterior a cierre Cypress | PASSED | 0 | 1 | 75.8% / 96.1% | 5.6% / 0.0% |
| 08 / TEST8 | 2026-10-04 10:02-10:05, nombres PNG | D1, import InputV pendiente | FAILED | 1, S1128 | 1 | 76.6% / 97.4% | 3.4% / 0.0% |
| 09 / TEST9 | 2026-10-04 10:07, nombres PNG | Corrección mínima S1128 | PASSED | 0 | 1 | 76.6% / 97.4% | 3.4% / 0.0% |
| 10 / TEST10 | 2026-10-04 11:23-11:36 | Final COV-G1 | PASSED | 0 | 1 | 81.4% / 97.4% | 3.4% / 0.0% |

Son fechas de evidencia, no horas exactas del scanner. Diez carpetas no certifican diez jobs distintos: no se aportan sus IDs y TEST6/TEST7 repiten métricas. La asociación con etapas se apoya en los registros, no se atribuye causalidad únicamente por horario. TEST4 no incluye Overall: cero issues nuevos no demuestra cero abiertos globales. En TEST3 se conserva el cambio de estado dentro del conjunto, sin fijar la hora exacta de aceptación.

El Gate no evolucionó monotónicamente: TEST3/TEST4 fallaron por cobertura nueva; TEST8 falló por un nuevo import sin uso aunque su cobertura ya superaba el umbral. TEST9 y TEST10 vuelven a PASSED. Accepted New Code 0 y Accepted Overall 1 corresponden a scopes distintos, no a una contradicción.

## 7. Implementación de Pruebas Automatizadas

### 7.1 Catálogo Académico

Se verificó el índice con **60 IDs únicos: F01-F30 y B01-B30**, sin duplicados. Cada ID referencia pruebas concretas. Un caso académico puede contener varias assertions o apoyarse en tests existentes; no debe confundirse con el número de tests que informa node:test.

| Clasificación | Frontend | Backend | Total |
| --- | ---: | ---: | ---: |
| Casos académicos implementados | 30 | 30 | 60 |
| TDD real Red-Green-Refactor | 0 | 0 | 0 |
| Casos automatizados retroactivos | 30 | 30 | 60 |

Son pruebas de comportamiento y regresión añadidas o formalizadas después de existir la funcionalidad. Los fallos de selectores o fixtures no constituyen una fase RED de desarrollo de producto; por ello **no se presentan como TDD**.

### 7.2 Secuencia y Alcance

P1 dejó 12/60 casos implementados; P2 avanzó a 18/60; el lote académico A a 32/60, B a 46/60 y C a 60/60. Estos hitos están documentados en E03/E04 y no representan ejecuciones de todas las variantes ideales del plan.

Los módulos incluyen usuarios/sesiones, pacientes, historias, evoluciones, archivos clínicos, agenda, tratamientos, cobros, gastos, laboratorio, finanzas, perfiles, documentos y modales. Se probaron éxitos, errores, permisos aplicables, retención de borradores, operaciones únicas, payloads y respuestas tardías.

Backend utiliza node:test, controladores/servicios originales, Express/fetch en los casos HTTP y una frontera SQL simulada. Frontend utiliza node:test, RTL, React/Router, jsdom/Babel y API simulada; determinados casos de teclado/calendario se ejecutan en Edge mediante Playwright.

Los 8 tests D1 y los 11 COV-G1 son adicionales al catálogo de 60, al igual que Cypress. Las suites finales contienen también pruebas preexistentes y guardas estructurales. No se suman indiscriminadamente casos académicos y tests de distintas capas como si fueran casos nuevos.

## 8. Pruebas Cypress E2E

**Cypress:** 16.1.1. **Navegador:** Microsoft Edge 154.0.4258.53, headless. **Entorno:** Windows/Node 24.14.0. **Datos:** simulados.

La primera ejecución documentada obtuvo 6/10 PASS. Los cuatro fallos se relacionaron con selectores, expectativas y fixtures; el registro documenta su corrección sin cambios funcionales. La última ejecución estructurada disponible obtuvo **10/10 PASS**, sin fallos, pendientes ni omitidos, a las **2026-10-04T16:15:31.261Z**, con duración de pruebas 30468 ms.

| ID | Flujo | Comprobación principal | Resultado |
| --- | --- | --- | --- |
| CYP-E2E-01 | Login válido | Sesión sintética verificada, navegación e identidad visible. | PASS |
| CYP-E2E-02 | Login inválido | Error visible, formulario conservado y reintento. | PASS |
| CYP-E2E-03 | Búsqueda de pacientes | Listado, búsqueda, vacío y limpieza del filtro. | PASS |
| CYP-E2E-04 | Apertura de ficha | Datos y retorno al directorio sin mutaciones persistentes. | PASS |
| CYP-E2E-05 | Cita simulada | Formulario, guardado en fixture, recarga y detalle. | PASS |
| CYP-E2E-06 | Historia clínica | Antecedentes, diagnóstico y evolución visibles. | PASS |
| CYP-E2E-07 | Borrador de tratamiento | Selección y cierre seguro, sin escritura clínica. | PASS |
| CYP-E2E-08 | Finanzas | Importes recibidos, filtros y vistas. | PASS |
| CYP-E2E-09 | Permisos por rol | Menú y rutas cliente para doctor no administrador. | PASS |
| CYP-E2E-10 | Logout | Cierre confirmado y restricción de ruta privada. | PASS |

El frontend real se sirve en un Vite E2E aislado con proxy clínico deshabilitado. Cypress intercepta la API; solicitudes no simuladas son bloqueadas. El JSON registra **0 peticiones API sin mock** y se verificaron las tres capturas referenciadas.

Esta capa no reemplaza los 60 casos ni acredita persistencia MySQL real, autenticación de servidor, conciliación financiera o impresión física. Cypress no está instrumentado para aportar LCOV en esta infraestructura; sus 10 PASS no se añaden artificialmente a cobertura c8.

## 9. Mejora de Cobertura

### 9.1 Generación e Importación

SonarQube no ejecuta estas suites de pruebas: consume los LCOV generados por los runners. Se conservó node:test y se añadió/configuró c8 sin reemplazar las pruebas.

`sonar-project.properties` mantiene:

```properties
sonar.projectKey=micodent-post
sonar.projectName=Micodent POST Remediacion
sonar.sources=micodent-frontend/src,micodent-backend/src
sonar.javascript.lcov.reportPaths=micodent-frontend/coverage/lcov.info,micodent-backend/coverage/lcov.info
```

Los reportes incluyen fuente relevante bajo src. No se introdujeron exclusiones funcionales para aumentar porcentajes ni se editaron hits manualmente. El runner backend conserva TEMP/TMP aislados para evitar la interferencia CommonJS/ESM de Windows.

### 9.2 Evolución Sonar

| Serie | Secuencia | Procedencia |
| --- | --- | --- |
| New Code Coverage | 0.8% -> 74.8% -> 96.1% -> 97.4% | 0.8% D/C en E03/E08, sin captura propia; restantes V en TEST4, TEST5 y TEST8-TEST10. |
| Overall Coverage | 0.0% -> 47.0% -> 75.8% -> 76.6% -> 81.4% | V en POST TEST2, TEST5, TEST6/TEST7, TEST8/TEST9 y TEST10. El 0.0% E13 previo sigue C/NV. |
| Hito adicional registrado | Overall 18.2% | E03/E08, baseline previo a P1; sin evidencia visual propia en los diez conjuntos. |
| Hito inicial de importación | New Code 0.0% antes de 0.8% | V en TEST3, 20 líneas nuevas; no confundir con Overall. |

**Resultado final verificado por evidencia:** Overall 81.4%, objetivo mínimo 80% **CUMPLIDO**; New Code 97.4%. TEST10 incluye PDF y PNG concordantes para ambos scopes. El periodo New Code comienza el 3 de octubre de 2026; se muestran 369 líneas nuevas a cubrir. No se confunde el objetivo global con el requisito del Gate sobre código nuevo.

### 9.3 Cobertura Local Final Verificada

| Indicador c8 | Frontend | Backend |
| --- | ---: | ---: |
| Tests de la última ejecución documentada | 151/151 PASS | 130/130 PASS |
| Statements | 83.29% | 76.00% |
| Branches | 84.83% | 82.15% |
| Functions | 57.43% | 79.47% |
| Lines | 83.29% | 76.00% |
| Líneas cubiertas / reportadas | 6015/7221 | 2847/3746 |
| Ramas cubiertas / reportadas | 1460/1721 | 741/902 |
| Funciones cubiertas / reportadas | 309/538 | 120/151 |
| Registros SF LCOV | 46 | 42 |

La generación final frontend registró 60791 ms y backend 9095 ms. Ambos LCOV son no vacíos, contienen rutas existentes bajo src, sin duplicados y con líneas dentro de las fuentes. Sus conteos concuerdan con coverage-summary.json.

No se promedian 83.29% y 76.00% para afirmar un Overall. La estimación combinada de líneas/ramas es:

```text
(6015 + 2847 + 1460 + 741) / (7221 + 3746 + 1721 + 902)
= 81.4054%  [estimación local E]
```

Es compatible con el 81.4% verificado en Sonar, pero Sonar define sus propias líneas y condiciones. El margen recomendado 82-85% no quedó alcanzado; el mínimo 80% sí se supera localmente y en la evidencia final Sonar.

### 9.4 Lote COV-G1 y Problema del Runner

Se añadieron 11 pruebas sobre agenda diaria/semanal/mensual, navegación, layout, rutas protegidas y error boundary. Los archivos inicialmente sin hits pasaron a aportar cobertura real: Agenda 171/171, AgendaDia 88/88, AgendaMes 61/61, AgendaSemana 70/70, MainLayout 106/106, App 57/57 y AppErrorBoundary 19/19 líneas c8. Estos conteos no significan 100% de funciones o ramas ni invocación real de reload.

El bloqueo Windows de cobertura provenía de una aserción transitoria que comparaba un nodo DOM/React contra null durante el cierre del modal. La representación del error inspeccionaba un grafo grande y agotaba memoria. Se conservó la condición mediante una aserción booleana equivalente y se verificaron cleanup, reloj y fixtures.

Antes del cambio se observaron 30974 ms y RSS de 8772 MB en ese caso; después 309 ms y 375 MB. Tras cada cleanup había cero nodos montados y solo las tuberías normales de salida, no timers/servidores pendientes. El runner existente cerró con exit 0, sin salida forzada ni cambios funcionales.

## 10. Reducción de Duplicación

La evolución es **6.2% inicial comunicado (C/NV) -> 5.6% antes del refactor final (V, TEST5-TEST7) -> 3.4% después (V, TEST8-TEST10)**. TEST2 muestra además un hito POST de 5.5%, conservado sin reemplazarlo por 5.6%. La duplicación nueva final es **0.0%**, verificada en TEST10, sobre 375 líneas nuevas. La variación 6.2% a 3.4% equivale a 2.8 puntos porcentuales, condicionada a la cifra inicial comunicada; no se atribuye íntegramente a las tres extracciones D1.

El mapa local D1 consolidó 17 grupos de similitud, a partir de 27 pares de candidatos. No replica el algoritmo de Sonar ni identifica por sí solo sus bloques exactos. Se refactorizaron tres grupos de riesgo bajo:

| Componente compartido | Extracción | Preservación comprobada |
| --- | --- | --- |
| SignaturePad.jsx | Implementación de firma repetida en páginas. | AST original, callbacks, entrada mouse/touch, imagen inicial y borrado. |
| InputV.jsx | Control de entrada/formato repetido. | Defaults, atributos, formato, clases y callbacks. |
| DocumentActions.jsx | Acciones visuales de orden Rx y receta. | Flags, iconos, títulos, orden, estilos y callbacks únicos; sin decidir permisos. |

Se conservaron 14 grupos de riesgo medio/alto, incluyendo operaciones clínicas/financieras, tablas y formularios con contratos diferentes. Generificar SQL, adendas o estados inversos para disminuir similitud podría aumentar acoplamiento o alterar trazabilidad.

La comparación local de candidatos pasó de 27 a 23 pares y de 872 a 595 líneas candidatas únicas. No se convierte ese resultado en porcentaje oficial. El 3.4% verificado reduce duplicación, pero no cumple el objetivo orientativo global anterior de <=3.0%; esa meta no se declara alcanzada. Sí cumple el umbral de duplicación nueva del Gate, 0.0% <=3.0%. No se persiguió 0% global artificialmente.

## 11. Resultados Finales

| Validación | Resultado | Fuente y alcance |
| --- | --- | --- |
| Suite frontend con coverage | 151/151 PASS | E02/E07, última ejecución registrada; no repetida para el informe. |
| Suite backend con coverage | 130/130 PASS | E02/E07, TEMP/TMP aislados; frontera clínica simulada. |
| Cypress E2E | 10/10 PASS | JSON E13, verificado físicamente; API sintética. |
| Build frontend | PASS | E02: 1837 módulos, CSS 47.34 kB y JS 571.34 kB. |
| Catálogo académico | 60/60 | E04: 60 IDs únicos, 30 por capa, verificados. |
| LCOV frontend/backend | Válidos | E11/E12, rutas y conteos contrastados. |
| Regresiones detectadas | 0 en las validaciones registradas | No equivale a ausencia de defectos. |
| Quality Gate final | PASSED | V; PDF y capturas TEST10, E19. |

Después de los cambios importantes se registraron regresiones y build proporcionalmente al alcance. Los lotes exclusivos de backend no repitieron frontend sin motivo; esto se indica en sus cierres. Las últimas validaciones completas abarcan ambas suites, Cypress y build.

## 12. Comparación Antes / Después

| Indicador | Antes | Después | Resultado / evidencia |
| --- | --- | --- | --- |
| Issues Sonar | 371 E13 | 0 abiertos; 1 contextual aceptado | V, TEST1 y TEST10. |
| Accepted contextual | N/D E13; POST TEST2: 0 | 1, S5693 | V; aceptación individual TEST3, total final TEST10. |
| Quality Gate | PASSED, filtro único proyecto TEST1; fallos intermedios TEST3/4/8 | PASSED | V; no mejora monotónica ni prueba aislada de seguridad. |
| Overall Coverage | 0.0% E13 C/NV; POST TEST2 0.0% V | 81.4% | V final; objetivo global >=80% cumplido. |
| New Code Coverage | 0.8% D/C sin captura; TEST3 0.0% V | 97.4% | V final; series y scopes diferenciados. |
| Overall Duplications | 6.2% E13 C/NV; POST TEST2 5.5% V | 3.4% | V final; meta global orientativa <=3.0% no cumplida. |
| New Code Duplications | N/D E13 | 0.0% | V final; umbral Gate <=3.0% cumplido. |
| Security issues | 2 | 0 abiertos | V, PDF TEST1 y TEST10 Overall. |
| Reliability issues | 138 | 0 abiertos | V; no equiparar a severidades ni sumar impactos. |
| Maintainability issues | 313 | 0 abiertos | V; PDF baseline y evidencia final. |
| Casos académicos | 0 formalizados para esta entrega, no ausencia de tests | 60/60, 30 frontend + 30 backend | Índice actual V; retroactivos, no TDD. |
| Cypress E2E | Sin esta capa implementada | 10/10 PASS | JSON y especificación existentes V. |
| Frontend tests | E13 previo: no verificado; primer control F1: 28/28 | 151/151 PASS | D; creció el conjunto, no una suite idéntica. |
| Backend tests | Primer control F1: 85/86; cierre ambiental: 86/86 | 130/130 PASS | D; fallo ambiental diferenciado de regresión. |
| Build | PASS en el primer control F1 documentado | PASS | D; advertencia >500 kB conservada. |

Los conteos 2/138/313 quedan verificados por el PDF TEST1, no por campos del CSV. No se suman para reemplazar los 371 issues únicos: las dimensiones pueden solaparse. La comparación por severidad se apoya en el CSV; la comparación por calidad, en las vistas del dashboard.

## 13. Análisis de Resultados

La intervención reduce el inventario pendiente verificado y amplía la capacidad de detectar regresiones mediante código real y contratos simulados. La mejora de cobertura permite observar ejecución antes ausente del LCOV, particularmente en calendario y rutas.

La cobertura frontend de funciones (57.43%) sigue siendo inferior a su cobertura de líneas. Esto advierte contra interpretar 83.29% de líneas como prueba exhaustiva de todas las acciones. También explica por qué el cierre de un porcentaje no elimina la necesidad de pruebas dirigidas por riesgo.

Los tests estructurales, las pruebas de API/controladores y las pruebas de navegador aportan evidencias complementarias. Las pruebas con SQL simulado ejercitan decisiones, payloads y rollback solicitado, pero no el comportamiento físico del motor, bloqueos reales o durabilidad ante corte eléctrico.

El propósito de esta entrega se cumple como consolidación del trabajo de calidad. La cobertura global mínima está verificada por TEST10; el 81.4054% local se conserva como estimación separada. Gate PASSED no acredita el mínimo global por sí solo: el Gate mostrado exige >=80% en código nuevo. La tarjeta Overall verifica independientemente el 81.4% global.

## 14. Limitaciones

- La revisión es de artefactos exportados, no una consulta en vivo al servidor. TEST10 verifica todas las métricas finales solicitadas; no aporta ID del análisis ni revisión Git exacta.
- Las diez carpetas documentan diez conjuntos/checkpoints. Sin IDs de análisis no se certifica que sean diez jobs independientes; TEST6/TEST7 repiten métricas. Sus horarios son de evidencia, no siempre de ejecución del scanner.
- El CSV FINAL mantiene S5693 OPEN como fotografía intermedia; TEST3 Accepted y TEST10 cero abiertos/un aceptado resuelven la discrepancia. Se conservan todos los originales.
- E13 coverage 0.0%, duplicación 6.2% y los hitos LCOV inicial Overall 18.2% / New Code 0.8% siguen sin respaldo visual propio en estos conjuntos. No se trasladan métricas de otro análisis para completar N/D.
- El PDF expresa limitaciones de análisis de seguridad de Community Build; cero alertas no certifica ausencia de SQL Injection, XSS u otras vulnerabilidades. No se realizó pentest.
- Las pruebas no verifican persistencia, atomicidad o concurrencia física de MySQL/MariaDB clínica, ni restauraciones completas de información clínica real.
- No se probaron cargas sostenidas, crecimiento de imágenes/radiografías, múltiples equipos, cortes eléctricos, impresoras físicas o instalaciones finales de la clínica.
- B14 conserva contenido/enlaces de reemplazo, pero la documentación advierte que la firma/sello puede leerse del perfil actual: no se certifica snapshot histórico inmutable.
- B17 puede conservar un archivo huérfano tras fallo de inserción; ante commit incierto conserva bytes. No se implementó recolector nuevo.
- F09 delega rechazo de tipo al backend; el éxito de subida puede mostrarse antes de una recarga fallida. No se declaró implementada la prevalidadación MIME ideal del plan.
- F19 registra selección visual de PiezaSelector, pero no aria-pressed en ese componente. Las mejoras de accesibilidad no equivalen a una certificación WCAG.
- El registro conserva una observación sobre edad Rx alrededor del cumpleaños por interpretación UTC/local de fechas; no se corrigió en esta entrega documental.
- Persisten avisos no fatales de bundle >500 kB y windows-trash.exe en Cypress. No se ocultaron ni se modificaron permisos.
- La versión incluye cambios locales todavía no publicados; `bbc15f1` no identifica por sí solo el estado final de los archivos.

### 14.1 Discrepancias Documentales

| ID | Discrepancia | Tratamiento en este informe |
| --- | --- | --- |
| D-01 | Registros históricos describen 81.41% local como estimación; TEST10 muestra Sonar 81.4%. | Resuelta: métrica Sonar V, estimación E separada; registros históricos intactos. |
| D-02 | CSV FINAL: S5693 OPEN; captura TEST3: Accepted; TEST10: cero abiertos y uno aceptado. | Resuelta por orden temporal. No se corrige ni reemplaza el CSV. |
| D-03 | TEST2 muestra 84 issues, coverage 0.0%, duplicación 5.5%; TEST10 muestra estado final distinto. | Resuelta como evolución histórica, no discrepancia de un mismo estado. |
| D-04 | Serie solicitada omite Overall 18.2% presente en E03/E08. | Hito documental conservado, sin captura propia ni fecha de análisis inventada. |
| D-05 | 2/138/313 no son columnas del CSV, pero aparecen en PDF TEST1. | Resuelta: valores verificados por PDF; dimensiones no sumables como issues únicos. |
| D-06 | CYPRESS_E2E_REPORT y plan D1 conservan hashes de run.json anteriores; el runner reemplaza ese archivo. | Utilizar el JSON actual para la última ejecución y tratar los otros hashes como históricos. |
| D-07 | D1 proponía <=3.0% global orientativo; final verificado 3.4%. | Reducción sin cumplimiento de meta global; New Code 0.0% sí cumple Gate. |
| D-08 | TEST1 LastWriteTime del 3 de octubre; PDF con fecha interna 29 de septiembre. | Ordenar por contenido/fecha interna, no por copia del archivo. |
| D-09 | Diez conjuntos, sin IDs de job y TEST6/TEST7 con mismas métricas. | Orden de evidencia determinado; identidad de ejecuciones distintas no certificada. |

## 15. Conclusiones

1. El inventario E13 de 371 issues y su distribución por severidad quedaron verificados; los siete lotes conservan exactamente sus claves.
2. El delta POST de 84 issues está respaldado por CSV y registro: 83 correcciones y una revisión contextual. S5693 se mantuvo deliberadamente y no se presenta como corregido.
3. Se formalizaron 60 casos académicos retroactivos, 30 por capa, sin atribuir un proceso TDD Red-Green-Refactor inexistente.
4. Cypress añade 10 flujos de usuario sobre el frontend real con API simulada; su última ejecución está respaldada por un JSON de 10 PASS y tres capturas.
5. Los LCOV finales son válidos y contienen cobertura real; las últimas suites registran 151/151 frontend, 130/130 backend y build PASS.
6. TEST10 verifica Sonar Overall 81.4%, New Code 97.4% y Gate PASSED; el mínimo global 80% está cumplido por evidencia. S5693 permanece aceptado, no corregido.
7. La duplicación se redujo mediante tres componentes compartidos, preservando comportamiento y estilos. Conservar grupos clínicos/financieros de mayor riesgo fue una decisión de mantenimiento, no una omisión oculta.
8. No se detectaron regresiones en las pruebas ejecutadas. Los resultados no certifican producción, rendimiento a escala ni ausencia de fallos; las limitaciones y discrepancias permanecen explícitas.

## 16. Recomendaciones

1. Conservar los diez conjuntos originales y el índice E19 como expediente de calidad. Antes de congelar baseline, identificar revisión Git/ID del análisis final cuando estén disponibles; no cambiar umbrales ni ejecutar un nuevo análisis en esta consolidación.
2. Conservar los LCOV, coverage-summary.json y el JSON Cypress actual junto a la entrega; una nueva ejecución puede reemplazar evidencia. Identificar el código final con commit/revisión cuando se autorice publicar.
3. Revisar las cifras históricas aún no verificadas visualmente y las observaciones D-01 a D-09 antes de convertir a DOCX/PDF; las discrepancias resueltas se conservan como historial.
4. Mantener el catálogo académico separado de Cypress y de los totales node:test; describir las pruebas como automatizadas retroactivas.
5. Planificar, con autorización independiente, integración de persistencia aislada, recuperación de backups, concurrencia, carga de imágenes y recorridos manuales clínicos.
6. Priorizar las limitaciones de historia documental, almacenamiento y fechas según impacto; no resolverlas incidentalmente durante una entrega de evidencia.
7. Considerar optimización del bundle y cobertura de funciones de bajo porcentaje en lotes futuros. No perseguir 100% ni eliminar duplicación clínica a costa de acoplamiento.
8. Revisar el informe consolidado y congelar baseline de calidad con autorización; preparar DOCX/PDF posteriormente. No iniciar PostgreSQL, Docker ni adaptación universitaria en esta fase.

## 17. Evidencias y Anexos

### 17.1 Ubicaciones y Fuentes

**Raíz del worktree (R):** `F:\ChatGPT\MICODENT — Sistema de Gestión Odontológica\MICODENT_DEV\.runtime\e09-agenda-api`.  
**Raíz de evidencia externa (P):** `F:\ChatGPT\MICODENT — Sistema de Gestión Odontológica\MICODENT_DEV`.  
Las rutas siguientes son relativas a R o P según se indica, excepto E10.

| ID | Archivo existente | Uso y límite |
| --- | --- | --- |
| E01 | R/docs/quality/SONAR_REMEDIATION_LOG.md | Familias y cierres; no medición externa final por sí solo. |
| E02 | R/docs/quality/CURRENT_TASK.md | Último checkpoint COV-G1, suites/build/hashes y estimación local. |
| E03 | R/docs/quality/COVERAGE_TEST_PLAN.md | Baseline, P1/P2, lotes A/B/C y limitaciones. |
| E04 | R/docs/quality/ACADEMIC_TEST_CASES.md | Índice verificable 60 IDs y clasificación retroactiva. |
| E05 | R/docs/quality/CYPRESS_E2E_REPORT.md | Diez flujos y primera corrida; hash histórico, JSON posterior reemplazado. |
| E06 | R/docs/quality/DUPLICATION_REFACTOR_PLAN.md | 17 grupos, 3 extracciones y 14 conservados. |
| E07 | R/docs/quality/GLOBAL_COVERAGE_80_PLAN.md | 11 tests COV-G1, cobertura y diagnóstico Windows. |
| E08 | R/docs/quality/NEW_CODE_COVERAGE_MAP.md | Priorización por LCOV/diff; limitación histórica de acceso a métricas Sonar. |
| E09 | R/docs/quality/POST_SONAR_DELTA.md | 84 claves: 83 corregidas y una contextual. |
| E10 | C:/Users/Jamz/Desktop/Micodent_E13_Issues_SonarQube.csv | 371 filas/claves; no contiene métricas de coverage o impactos de calidad. |
| E11 | R/micodent-frontend/coverage/lcov.info y coverage-summary.json | Cobertura frontend física verificada. |
| E12 | R/micodent-backend/coverage/lcov.info y coverage-summary.json | Cobertura backend física verificada. |
| E13 | R/micodent-frontend/test-results/cypress/run.json | Última corrida 10/10, fecha/versiones/capturas. |
| E14 | P/SONAR_EVIDENCE_POST/Micodent_POST_SONAR_Issues.csv | 84 filas/claves POST. |
| E15 | P/SONAR_EVIDENCE_POST/Micodent_FINAL_SONAR_Issues.csv | Una fila S5693 OPEN; no acredita aceptación posterior. |
| E16 | P/SONAR_EVIDENCE_POST/sonarqube test 2.pdf | PDF histórico, 1 página, dashboard POST del 3 de octubre de 2026. |
| E17 | R/sonar-project.properties | Sources y ambos reportPaths LCOV; no contiene el resultado del Gate. |
| E18 | R/docs/quality/sonar-family1.csv, sonar-family2.csv, sonar-family3.csv, sonar-family4a.csv, sonar-family4b.csv, sonar-family4c.csv y sonar-family4d.csv | Partición completa y exacta de las 371 claves E13. |
| E19 | R/docs/quality/SONAR_EVIDENCE_INDEX.md | Índice cronológico de diez conjuntos y 28 archivos originales, métricas, SHA-256 y límites de precisión. |
| E20 | P/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST10/Overview.pdf y Overview2.pdf | Evidencia final New Code y Overall: Gate, coverage, duplicación, abiertos, aceptados y hotspots. |
| E21 | P/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST3/Aceptacion Issue.png | S5693 Accepted individual y límite 10 MiB conservado. |
| E22 | P/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST1/Micodent_E13_Issues_SonarQube 1.pdf | Fecha interna baseline y métricas Security 2 / Reliability 138 / Maintainability 313. |

También existen tres capturas Cypress referenciadas por E13, verificadas físicamente:

- `R/micodent-frontend/test-results/cypress/screenshots/micodent.cy.cjs/CYP-E2E-01-login-verificado (4).png`.
- `R/micodent-frontend/test-results/cypress/screenshots/micodent.cy.cjs/CYP-E2E-05-cita-sintetica (3).png`.
- `R/micodent-frontend/test-results/cypress/screenshots/micodent.cy.cjs/CYP-E2E-08-finanzas-sinteticas (3).png`.

En la primera elaboración solo se disponía de evidencia intermedia en la raíz SONAR_EVIDENCE_POST. La consolidación amplió la inspección a Sonarqube TEST EVIDENCIAS y encontró los PDF y capturas finales TEST10. Esos archivos verifican 81.4%/97.4%/3.4%, Gate PASSED, cero abiertos y un aceptado. E19 contiene enlaces absolutos a todos los originales, sin renombrarlos.

### 17.2 Integridad de Artefactos

| Artefacto | SHA-256 registrado y contrastado con el checkpoint |
| --- | --- |
| LCOV frontend | B36B08031FA02C243B390E89105EF1BB630C01885B9BEB270F04729A7C691A42 |
| LCOV backend | E1E4F4E4C150AB59D0B25C241CBAC9DE6DBA62AE1C14E8EC6CDACB698692F088 |
| run.json Cypress actual | E3576DC40DEE90061234C453ED8F00B5D3A5272A62B72B52CC57D55BA48BA55A |

Los hashes identifican contenido concreto; no prueban por sí solos fecha de ejecución, seguridad clínica ni cobertura Sonar. Los hashes Cypress anteriores conservados en E05/E06 pertenecen a corridas anteriores y no deben cotejarse como si fueran el mismo archivo actual.

### 17.3 Datos Preparados para Gráficos Posteriores

Las posiciones son hitos ordinales, no una escala temporal. No se asignan fechas de análisis no verificadas.

| Serie | Hito | Valor | Unidad | Estado de evidencia |
| --- | --- | ---: | --- | --- |
| Issues | E13 inicial | 371 | issues únicos | V |
| Issues | POST Familias 1-4 | 84 | issues únicos | V |
| Issues | Cierre TEST10 | 0 | issues abiertos | V |
| Overall Coverage | Inicial | 0.0 | % | C/NV |
| Overall Coverage | POST inicial TEST2 | 0.0 | % | V; distinto del baseline E13 |
| Overall Coverage | POST P2 TEST5 | 47.0 | % | V |
| Overall Coverage | TEST6/TEST7 antes D1 | 75.8 | % | V |
| Overall Coverage | TEST8/TEST9 antes COV-G1 | 76.6 | % | V |
| Overall Coverage | Final TEST10 | 81.4 | % | V; no sustituir por E |
| New Code Coverage | Pre-P1 | 0.8 | % | C, E03/E08 |
| New Code Coverage | TEST3 antes importación | 0.0 | % | V |
| New Code Coverage | POST P1 TEST4 | 74.8 | % | V |
| New Code Coverage | POST P2 TEST5 | 96.1 | % | V |
| New Code Coverage | Final TEST10 | 97.4 | % | V |
| Overall Duplications | E13 inicial | 6.2 | % | C/NV |
| Overall Duplications | POST inicial TEST2 | 5.5 | % | V |
| Overall Duplications | Antes D1 TEST5-TEST7 | 5.6 | % | V |
| Overall Duplications | Final TEST10 | 3.4 | % | V |

Hitos complementarios no incluidos en la serie abreviada: Overall 18.2% (E03/E08) y el PDF POST con Overall 0.0% y duplicación 5.5%. Deben rotularse como análisis/antecedentes específicos, no incorporarse con fechas supuestas.

### 17.4 Verificación de la Elaboración

Se leyeron las ocho fuentes obligatorias y el delta POST; se inspeccionaron git status/diff, configuración Sonar, LCOV/JSON, CSV y PDF histórico. Se comprobó por lectura estructurada: 371 claves iniciales, su partición exacta, 84 POST, 60 IDs académicos y 10 PASS Cypress. La consolidación posterior revisó íntegramente 28 archivos de diez conjuntos: 3 CSV, 10 PDF y 15 PNG. Se verificaron contenido/metadatos de PDF y todas las capturas; baseline y PDF finales también se contrastaron visualmente.

Las suites y el build no se repitieron: se utilizaron los resultados validados del checkpoint inmediato anterior. No se cambiaron pruebas, código funcional, configuración, base de datos, umbrales, dependencias ni evidencia preexistente. En la elaboración se creó este informe; en la consolidación solo se actualizó el informe y se creó SONAR_EVIDENCE_INDEX.md. No se ejecutó Sonar ni se realizó push.

**Cierre:** informe completo y consolidado. Métricas finales Sonar verificadas por evidencia TEST10; S5693 Accepted verificado por TEST3 y continuidad posterior. Se conservan N/D y reservas históricas donde falta evidencia, así como limitaciones de producción. Siguiente paso: revisar informe final y congelar baseline de calidad MICODENT.

# Índice de Evidencias SonarQube

## Resumen

Fecha de revisión: 4 de octubre de 2026. Total de conjuntos de ejecuciones/checkpoints documentados: **10**, en diez carpetas originales; **28 archivos** (3 CSV, 10 PDF y 15 PNG).

Raíz de evidencia (E): `F:\ChatGPT\MICODENT — Sistema de Gestión Odontológica\MICODENT_DEV\SONAR_EVIDENCE_POST\Sonarqube TEST EVIDENCIAS`.
Worktree: `F:\ChatGPT\MICODENT — Sistema de Gestión Odontológica\MICODENT_DEV\.runtime\e09-agenda-api`.

Se revisaron todos los archivos: CSV mediante parser, PDF mediante extracción de texto/metadatos y contraste visual de baseline/final, y las 15 capturas visualmente. No se renombró, convirtió, editó, borró ni sobrescribió ningún original. Las referencias previas permanecen válidas.

**Convención:** V = verificado en evidencia; D = asociación documentada en registros; N/D = no disponible en ese conjunto. El orden se reconstruye con contenido, fechas internas de PDF, fechas/nombres de captura y secuencia de cambios, no solamente con nombres TEST1-TEST10. Todas las horas locales se expresan UTC-05:00.

**Límite de precisión:** existen diez conjuntos, pero no se incluyen IDs de tareas de análisis ni revisiones Git para demostrar diez ejecuciones distintas del scanner. TEST6/TEST7 repiten métricas; se conservan como checkpoints separados sin inventar una nueva ejecución. El orden de las evidencias queda determinado; la identidad exacta de cada job y su hora de ejecución no. Ninguna asociación temporal por sí sola demuestra causalidad.

## Tabla cronológica

| Test | Etapa | Quality Gate | Issues abiertos | Accepted Overall | Overall Coverage | New Code Coverage | Overall Duplication | New Code Duplication | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEST SONAR 01 | Baseline E13 | PASSED¹ | 371 | N/D | N/D | N/D | N/D | N/D | TEST1; detalle abajo |
| TEST SONAR 02 | POST Familias 1-4 | PASSED | 84 | 0 | 0.0% | N/D | 5.5% | N/D | TEST2; detalle abajo |
| TEST SONAR 03 | Delta y aceptación S5693 | FAILED | 1 -> 0 | 1² | N/D | 0.0% | N/D | 0.0% | TEST3; detalle abajo |
| TEST SONAR 04 | Coverage P1 | FAILED | N/D | N/D | N/D | 74.8% | N/D | 0.0% | TEST4; detalle abajo |
| TEST SONAR 05 | Coverage P2 | PASSED | 0 | 1 | 47.0% | 96.1% | 5.6% | 0.0% | TEST5; detalle abajo |
| TEST SONAR 06 | Ampliación académica, anterior a cierre Cypress | PASSED | 0 | 1 | 75.8% | 96.1% | 5.6% | 0.0% | TEST6; detalle abajo |
| TEST SONAR 07 | Checkpoint posterior a validación Cypress | PASSED | 0 | 1 | 75.8% | 96.1% | 5.6% | 0.0% | TEST7; detalle abajo |
| TEST SONAR 08 | POST duplicación, import InputV pendiente | FAILED | 1 | 1 | 76.6% | 97.4% | 3.4% | 0.0% | TEST8; detalle abajo |
| TEST SONAR 09 | POST corrección mínima S1128 | PASSED | 0 | 1 | 76.6% | 97.4% | 3.4% | 0.0% | TEST9; detalle abajo |
| TEST SONAR 10 | Final Coverage Global 80+ | PASSED | 0 | 1 | 81.4% | 97.4% | 3.4% | 0.0% | TEST10; detalle abajo |

¹ El baseline PDF muestra un solo proyecto y filtro Passed 1 / Failed 0; no es la tarjeta individual Overview. El CSV verifica 371 OPEN.
² La captura individual verifica un S5693 Accepted. El total Overall 1 aparece explícitamente desde TEST5; TEST3 no incluye tarjeta Overall Accepted.
³ Hora de archivo, no timestamp visible dentro de la imagen; cronología apoyada por registro P1 y contenido.
⁴ Horas del nombre de captura, concordantes con LastWriteTime; no fechas exactas del scanner.

Issues nuevos 0 no equivale a issues abiertos globales 0. Accepted New Code 0 no contradice Accepted Overall 1. Security, Reliability y Maintainability son dimensiones de impacto: no sumar sus conteos para inferir issues únicos.

## Estado final verificado

TEST10 confirma por evidencia: Quality Gate PASSED; 0 issues abiertos en las tres dimensiones; Accepted Overall 1; Overall Coverage 81.4%; New Code Coverage 97.4%; duplicación Overall 3.4%; duplicación New Code 0.0%; Security 0, Reliability 0, Maintainability 0 y Security Hotspots 0.

Los PDF identifican proyecto `micodent-post`, versión `POST-REMEDIATION-2026-10-03`, periodo New Code desde 3 de octubre de 2026, 369 líneas nuevas a cubrir y 375 líneas nuevas para duplicación. Los PDF se generaron a las 11:35:53 y 11:36:03 locales; las capturas finales corresponden a 11:23. No se inventa la hora exacta del análisis a partir de “13 minutes ago”.

## Historia de S5693

- TEST1: S5693 OPEN, clave E13 `1c45557d-29b8-4fbf-b40a-057890955f54`.
- TEST2: S5693 OPEN, clave POST `3e1ba3c1-da0c-4ee4-b195-554522f597d9`.
- TEST3: exportación intermedia conserva OPEN; `Aceptacion Issue.png` muestra javascript:S5693 **Accepted** en `micodent-backend/src/config/multer.js` y código `fileSize: 10 * 1024 * 1024`. La vista posterior Issues filtrada OPEN/CONFIRMED no tiene resultados.
- TEST5-TEST10 (vistas Overall disponibles): Accepted 1 persiste. TEST8 tiene un OPEN nuevo distinto: S1128.
- Final: S5693 fue revisado y aceptado como contextual, manteniéndose el límite de 10 MiB. No se presenta como corregido. La identidad del aceptado se establece por captura individual TEST3 y continuidad documental; TEST10 muestra el total, no un detalle individual nuevo.

El CSV FINAL no se altera: documenta un estado anterior a la aceptación. Discrepancia histórica **resuelta**, no evidencia sustituida.

## Métricas históricas todavía no verificadas visualmente

El baseline E13 de cobertura 0.0% y duplicación 6.2% no aparece en su PDF. La cobertura 0.0% sí se observa en POST TEST2 y New Code TEST3, pero no debe trasladarse retrospectivamente a E13. Los hitos Overall 18.2% / New Code 0.8% están documentados en COVERAGE_TEST_PLAN.md/NEW_CODE_COVERAGE_MAP.md; no tienen imagen propia en estos diez conjuntos. Se conservan como D/C, no se inventa una ejecución adicional.

TEST2 muestra 5.5% de duplicación, antes de los 5.6% de TEST5-TEST7. No reemplazar 5.5 por 5.6 ni ordenar los resultados suponiendo mejora monotónica.

## TEST SONAR 01

Objetivo/etapa: Baseline E13.
Fecha de evidencia: 2026-09-29 21:50 (UTC-05:00).
Carpeta original: `F:\ChatGPT\MICODENT — Sistema de Gestión Odontológica\MICODENT_DEV\SONAR_EVIDENCE_POST\Sonarqube TEST EVIDENCIAS\TEST1`.
Correspondencia: Baseline anterior a remediación (V).

Métricas: Gate PASSED¹; abiertos 371; Accepted Overall N/D; coverage Overall N/D, New Code N/D; duplicación Overall N/D, New Code N/D.

Observaciones: CSV: 371 OPEN; PDF: Security 2 / Reliability 138 / Maintainability 313. El PDF no muestra cobertura ni duplicación.

Evidencias:
- [Micodent_E13_Issues_SonarQube 1.csv](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST1/Micodent_E13_Issues_SonarQube 1.csv>). SHA-256: `51643A5F2A05899BE4C753D70D1F3C4DE8B65B88C043CB2E4DBCA96400CA5040`.
- [Micodent_E13_Issues_SonarQube 1.pdf](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST1/Micodent_E13_Issues_SonarQube 1.pdf>). SHA-256: `709882D11D9ED42561E7A81D650EDD306B9872814F0E34C5A5BAAB37F8B49646`.

Fecha interna PDF: 2026-09-29 21:50; CreationDate UTC 2026-09-30T02:50:45Z. LastWriteTime local 2026-10-03 corresponde a copia/guardado y no reemplaza la fecha interna. Los conteos 2/138/313 sí quedan verificados por el PDF, aunque no estén en las columnas del CSV.
## TEST SONAR 02

Objetivo/etapa: POST Familias 1-4.
Fecha de evidencia: 2026-10-03 15:35 (UTC-05:00).
Carpeta original: `F:\ChatGPT\MICODENT — Sistema de Gestión Odontológica\MICODENT_DEV\SONAR_EVIDENCE_POST\Sonarqube TEST EVIDENCIAS\TEST2`.
Correspondencia: Primer reanálisis POST (V, CSV y PDF).

Métricas: Gate PASSED; abiertos 84; Accepted Overall 0; coverage Overall 0.0%, New Code N/D; duplicación Overall 5.5%, New Code N/D.

Observaciones: Security 1 / Reliability 2 / Maintainability 82 / Hotspots 0. El historial muestra First analysis: 2026-10-03 15:31.

Evidencias:
- [Micodent_POST_SONAR_Issues .pdf](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST2/Micodent_POST_SONAR_Issues .pdf>). SHA-256: `5AD9DC631314C4F27747412E9A23263280BF9930B1EC288328CAD1C72082D9BF`.
- [Micodent_POST_SONAR_Issues.csv](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST2/Micodent_POST_SONAR_Issues.csv>). SHA-256: `0671CE9341D7AAC7685A1AB186D1A8FEC6736A72044C254663E079759BA7F560`.
## TEST SONAR 03

Objetivo/etapa: Delta y aceptación S5693.
Fecha de evidencia: 2026-10-03 16:17-16:30 (UTC-05:00).
Carpeta original: `F:\ChatGPT\MICODENT — Sistema de Gestión Odontológica\MICODENT_DEV\SONAR_EVIDENCE_POST\Sonarqube TEST EVIDENCIAS\TEST3`.
Correspondencia: Delta POST y aceptación contextual (V); no confundir aceptación con corrección.

Métricas: Gate FAILED; abiertos 1 -> 0; Accepted Overall 1²; coverage Overall N/D, New Code 0.0%; duplicación Overall N/D, New Code 0.0%.

Observaciones: CSV registra S5693 OPEN; pantalla de Issues posterior sin OPEN/CONFIRMED; captura identifica S5693 Accepted. Gate falla por cobertura nueva, 20 líneas. Accepted New Code 0 no contradice Accepted Overall 1.

Evidencias:
- [Aceptacion Issue.png](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST3/Aceptacion Issue.png>). SHA-256: `B7CD0853B9AAEA52F3DEEF92AB1DCC9BD4F3A86D6DCA287D8229ECB51012F951`.
- [Issues.pdf](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST3/Issues.pdf>). SHA-256: `482462F8A64A2BA18A037E0B7A37A498C3470EB4C96EB0BF7CC92098044F99C0`.
- [Micodent_FINAL_SONAR_Issues.csv](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST3/Micodent_FINAL_SONAR_Issues.csv>). SHA-256: `C47420A72EC22E0FCA28D5E4E5615AC9B2E30E21E5773B70A609F7E8B18C0362`.
- [Overview.pdf](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST3/Overview.pdf>). SHA-256: `4E434900E3D8C4E3E5942186DD76EC45EFB6373C399D69B4966E329E50CF2B6C`.
- [Sonarqube 3.pdf](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST3/Sonarqube 3.pdf>). SHA-256: `066028893CBB99CD9AB71FF1BFD1F106469307453B7DD1D51119A9450151F567`.

Dentro del conjunto hay distintos estados: PDF Projects 16:17 y CSV 16:18 aún con OPEN; PDF Issues 16:23 sin OPEN/CONFIRMED; PDF Overview 16:24 con cobertura 0.0% y Gate Failed; PNG guardado 16:30 con Accepted e Introduced 58 minutes ago. No inferir que todo fue capturado simultáneamente ni fijar la hora exacta de aceptación.
## TEST SONAR 04

Objetivo/etapa: Coverage P1.
Fecha de evidencia: 2026-10-03 17:44:52³ (UTC-05:00).
Carpeta original: `F:\ChatGPT\MICODENT — Sistema de Gestión Odontológica\MICODENT_DEV\SONAR_EVIDENCE_POST\Sonarqube TEST EVIDENCIAS\TEST4`.
Correspondencia: Correspondencia P1 respaldada por COVERAGE_TEST_PLAN.md (D) y métrica de captura (V). No existe aquí captura independiente de LCOV inicial 0.8%.

Métricas: Gate FAILED; abiertos N/D; Accepted Overall N/D; coverage Overall N/D, New Code 74.8%; duplicación Overall N/D, New Code 0.0%.

Observaciones: 0 nuevos issues, Accepted New Code 0, Hotspots 0; 239 líneas nuevas a cubrir. No hay pantalla Overall.

Evidencias:
- [Test 4 coverage.png](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST4/Test 4 coverage.png>). SHA-256: `954B9A14CF8FE4CBA52F99E362B35566D9963628CA9EB7136A67DC9EDC0D58BA`.
## TEST SONAR 05

Objetivo/etapa: Coverage P2.
Fecha de evidencia: 2026-10-03 18:08-18:10 (UTC-05:00).
Carpeta original: `F:\ChatGPT\MICODENT — Sistema de Gestión Odontológica\MICODENT_DEV\SONAR_EVIDENCE_POST\Sonarqube TEST EVIDENCIAS\TEST5`.
Correspondencia: Correspondencia P2 respaldada por registro documental (D) y métricas visuales (V).

Métricas: Gate PASSED; abiertos 0; Accepted Overall 1; coverage Overall 47.0%, New Code 96.1%; duplicación Overall 5.6%, New Code 0.0%.

Observaciones: Security 0 / Reliability 0 / Maintainability 0 / Hotspots 0; 239 líneas nuevas. Accepted New Code 0.

Evidencias:
- [Coverage TEST .png](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST5/Coverage TEST .png>). SHA-256: `DE3E450228344822DB378DDEBEAE42A1F44D36B4B82093AFCFCBAD8FB67BAC78`.
- [TEST 5  Coverage.png](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST5/TEST 5  Coverage.png>). SHA-256: `C6DCDBE0FFF208CCA75BE3D02C7D601F1A369101D8F0EB22BD26A543846C6B61`.
- [TEST PASS.pdf](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST5/TEST PASS.pdf>). SHA-256: `1B1BEFBA641309372C86EA61EE917D9418D4E102A87C0B9E5B2E5A6B7700F952`.
## TEST SONAR 06

Objetivo/etapa: Ampliación académica, anterior a cierre Cypress.
Fecha de evidencia: 2026-10-03 19:47 (UTC-05:00).
Carpeta original: `F:\ChatGPT\MICODENT — Sistema de Gestión Odontológica\MICODENT_DEV\SONAR_EVIDENCE_POST\Sonarqube TEST EVIDENCIAS\TEST6`.
Correspondencia: Asociación con ampliación hasta 60 casos: inferencia apoyada por secuencia documental, no título del dashboard. No atribuir a Cypress: segunda corrida conocida es posterior (2026-10-04T00:43:50.936Z).

Métricas: Gate PASSED; abiertos 0; Accepted Overall 1; coverage Overall 75.8%, New Code 96.1%; duplicación Overall 5.6%, New Code 0.0%.

Observaciones: Overall coincide en PNG y PDF. New Code: 239 líneas, 0 nuevos issues, Accepted 0. Security/Reliability/Maintainability/Hotspots: 0.

Evidencias:
- [Captura de pantalla 2026-10-03 194740.png](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST6/Captura de pantalla 2026-10-03 194740.png>). SHA-256: `20A6DE60F1D8E6DE4ADCC12E97382F19FB2B33C6437B6D4BC556504719AB8C05`.
- [Overview.pdf](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST6/Overview.pdf>). SHA-256: `6D9C07D63BAA8BF45205D72B730B3C6CB53134FC115E8C042E5D613345215EBD`.
- [Overview2.pdf](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST6/Overview2.pdf>). SHA-256: `E98E505208F2B999ECA685785E20D0DEFD5E610BCEE35445F73DFF876B254DFA`.

PDF New Code y Overall tienen fechas internas 19:47, pero muestran Last analysis 3 minutes ago y 12 minutes ago respectivamente. Esa diferencia impide certificar mismo job exacto; no afecta la lectura explícita de las métricas de cada vista.
## TEST SONAR 07

Objetivo/etapa: Checkpoint posterior a validación Cypress.
Fecha de evidencia: 2026-10-04 09:22:44-09:23:08⁴ (UTC-05:00).
Carpeta original: `F:\ChatGPT\MICODENT — Sistema de Gestión Odontológica\MICODENT_DEV\SONAR_EVIDENCE_POST\Sonarqube TEST EVIDENCIAS\TEST7`.
Correspondencia: Capturas posteriores al cierre Cypress 2026-10-04T14:07:00.635Z (09:07 local), según CYPRESS_E2E_REPORT.md. No contienen ID de análisis: pueden documentar una nueva consulta al mismo estado.

Métricas: Gate PASSED; abiertos 0; Accepted Overall 1; coverage Overall 75.8%, New Code 96.1%; duplicación Overall 5.6%, New Code 0.0%.

Observaciones: Métricas iguales a TEST6; Security/Reliability/Maintainability/Hotspots: 0. No atribuir aumento de coverage a Cypress.

Evidencias:
- [Captura de pantalla 2026-10-04 092244.png](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST7/Captura de pantalla 2026-10-04 092244.png>). SHA-256: `B7F6102D86A6D96877DD8984D0B9B464E477D66238FA03FC9CF3797321F36454`.
- [Captura de pantalla 2026-10-04 092308.png](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST7/Captura de pantalla 2026-10-04 092308.png>). SHA-256: `E5C2C31AF912D98EEB87197769554F2734412ABDAB6A11A838B52F58CE52203F`.
## TEST SONAR 08

Objetivo/etapa: POST duplicación, import InputV pendiente.
Fecha de evidencia: 2026-10-04 10:02:27-10:05:20⁴ (UTC-05:00).
Carpeta original: `F:\ChatGPT\MICODENT — Sistema de Gestión Odontológica\MICODENT_DEV\SONAR_EVIDENCE_POST\Sonarqube TEST EVIDENCIAS\TEST8`.
Correspondencia: POST refactor D1 con incidencia S1128 verificada en captura; no confundir el nuevo import sin uso con S5693 Accepted.

Métricas: Gate FAILED; abiertos 1; Accepted Overall 1; coverage Overall 76.6%, New Code 97.4%; duplicación Overall 3.4%, New Code 0.0%.

Observaciones: S1128 OPEN en Historias.jsx línea 6. Security 0 / Reliability 0 / Maintainability 1 / Hotspots 0. New Code: 1 issue, 370 líneas a cubrir, 376 líneas para duplicación.

Evidencias:
- [Captura de pantalla 2026-10-04 100227.png](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST8/Captura de pantalla 2026-10-04 100227.png>). SHA-256: `ED4A1A3DAE7269528A910B6B667D9EB5135C299B9FD33A39FE614EE35BE7887B`.
- [Captura de pantalla 2026-10-04 100248.png](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST8/Captura de pantalla 2026-10-04 100248.png>). SHA-256: `44861EA4294FE09F382AF6CB229CA8D427E5A78CB1AB0E675AF7E7C4BA83E349`.
- [Captura de pantalla 2026-10-04 100503.png](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST8/Captura de pantalla 2026-10-04 100503.png>). SHA-256: `215B9A2FD81D411FAA6C91C70FEC917AEB163E94B97F3AC3F72B2CDE52E83B7B`.
- [Captura de pantalla 2026-10-04 100520.png](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST8/Captura de pantalla 2026-10-04 100520.png>). SHA-256: `BB158E9365716A913436F21E9D953F66DBFE7E4F886D56E132FDE2C1B126EA3E`.
## TEST SONAR 09

Objetivo/etapa: POST corrección mínima S1128.
Fecha de evidencia: 2026-10-04 10:07:14-10:07:42⁴ (UTC-05:00).
Carpeta original: `F:\ChatGPT\MICODENT — Sistema de Gestión Odontológica\MICODENT_DEV\SONAR_EVIDENCE_POST\Sonarqube TEST EVIDENCIAS\TEST9`.
Correspondencia: Estado posterior a eliminación de import InputV; métricas y Gate verificables. Su asociación con corrección está respaldada por solicitud/registro previo.

Métricas: Gate PASSED; abiertos 0; Accepted Overall 1; coverage Overall 76.6%, New Code 97.4%; duplicación Overall 3.4%, New Code 0.0%.

Observaciones: Security/Reliability/Maintainability/Hotspots: 0. New Code: 0 issues, 369 líneas a cubrir, 375 para duplicación.

Evidencias:
- [Captura de pantalla 2026-10-04 100714.png](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST9/Captura de pantalla 2026-10-04 100714.png>). SHA-256: `244BA2CC51B0C8AF26AB5310A800A1E6837086D0243C9ACB127217E74E714D23`.
- [Captura de pantalla 2026-10-04 100742.png](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST9/Captura de pantalla 2026-10-04 100742.png>). SHA-256: `867257BCAECB4CBDF92B20708C4C1874434433EF55503CAD96AABD4D2C113C88`.
## TEST SONAR 10

Objetivo/etapa: Final Coverage Global 80+.
Fecha de evidencia: 2026-10-04 11:23-11:36 (UTC-05:00).
Carpeta original: `F:\ChatGPT\MICODENT — Sistema de Gestión Odontológica\MICODENT_DEV\SONAR_EVIDENCE_POST\Sonarqube TEST EVIDENCIAS\TEST10`.
Correspondencia: Estado final tras COV-G1. Verificado en PDF con project id micodent-post y dos capturas; análisis indicado como 13/14 minutos anterior a los PDF de 11:35/11:36, no hora exacta.

Métricas: Gate PASSED; abiertos 0; Accepted Overall 1; coverage Overall 81.4%, New Code 97.4%; duplicación Overall 3.4%, New Code 0.0%.

Observaciones: PNG y PDF Overall/New Code concordantes. Security/Reliability/Maintainability/Hotspots: 0. Accepted New Code 0; Overall 1.

Evidencias:
- [Captura de pantalla 2026-10-04 112310.png](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST10/Captura de pantalla 2026-10-04 112310.png>). SHA-256: `8D186C8586A01C190EB31209F5ACBC4B05DA32E0F5B71F94964C878838B5C8FF`.
- [Captura de pantalla 2026-10-04 112345.png](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST10/Captura de pantalla 2026-10-04 112345.png>). SHA-256: `D7A075695612AF4CCCB1D0B9A8C1C496C532D4DE8CAC59A30EBBCA8FF2E78CB6`.
- [Overview.pdf](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST10/Overview.pdf>). SHA-256: `4D7CE037B563CF352488039107D1BE863A1ECCE46C0C6409D209FC31A6851DAA`.
- [Overview2.pdf](<F:/ChatGPT/MICODENT — Sistema de Gestión Odontológica/MICODENT_DEV/SONAR_EVIDENCE_POST/Sonarqube TEST EVIDENCIAS/TEST10/Overview2.pdf>). SHA-256: `E45C1C07D943B867896B6D47A365DA80F91624A6416661F5539E0E9C3F094FB1`.

## Integridad y alcance

Los SHA-256 anteriores se calcularon por lectura antes de editar la documentación y se vuelven a comprobar al cierre. Identifican contenido, no certifican por sí solos ejecución o autoría.

No se renombraron archivos: **RENAMING_MAP.md no necesario**. Se conservan 28 originales y sus rutas. Solo se crea este índice y se actualiza INFORME_TECNICO_CALIDAD_MICODENT.md; no se modifica CURRENT_TASK ni registros históricos, código, pruebas, configuración, LCOV o datos.

No se ejecutan scanner, suites, build ni push durante esta consolidación. Gate PASSED acredita condiciones del análisis guardado, no certifica producción ni ausencia de vulnerabilidades; los dashboard incluyen advertencia de análisis de seguridad limitado de Community Build.

# Evidencia congelada del baseline clinico

Los tres archivos son copias exactas de resultados validados previamente.
Se archivaron fuera de coverage/test-results para no versionar directorios
generados continuamente ni confundir evidencia historica con nuevas corridas.

| Original | Archivo archivado |
| --- | --- |
| micodent-backend/coverage/lcov.info | backend-lcov.info |
| micodent-frontend/coverage/lcov.info | frontend-lcov.info |
| micodent-frontend/test-results/cypress/run.json | cypress-run.json |

La tabla SHA-256 original del baseline permanece intacta. El mapa
`../GIT_BASELINE_SOURCE_MAP.json` permite verificar los219 archivos publicados,
incluidos estos3 reubicados. Para reconstruir las rutas originales, copiar
estos3 a sus destinos originales en una COPIA de trabajo, no en el congelado.
Sonar debe consumir reportes generados por una nueva corrida, no este archivo
historico. No se afirma haber repetido suites para publicar el baseline.

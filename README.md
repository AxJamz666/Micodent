# MICODENT

Sistema de gestion odontologica. Este repositorio conserva dos lineas de
trabajo separadas: clinica local y adaptacion universitaria.

## Version clinica publicada

`codex/clinic-baseline-20261004` contiene el baseline de calidad
MICODENT-QUALITY-20261004, sin adaptacion PostgreSQL/universitaria.
Etiqueta: `clinic-quality-20261004`.
`main` conserva el estado anterior hasta aprobar un pull request y los tres
checks obligatorios. No se quitaron protecciones ni se creo PR automaticamente.

- React: `micodent-frontend/`.
- Node/Express y MySQL/MariaDB: `micodent-backend/`.
- Lanzadores Windows: `iniciar_micodent.bat`, `comprobar_micodent.bat`,
  `micodent-arranque.cjs` y `configurar_piloto_gabriela.ps1`.
- Informes originales Word: `SONAR_EVIDENCE_POST/`.
- Evidencia de calidad: `docs/quality/` y `docs/baseline/`.

Es una entrega de fuentes y evidencia, NO una instalacion con datos o
credenciales. No se incluyen node_modules, .env reales, uploads clinicos,
BD ni builds antiguos. Instalar las dependencias desde cada package-lock,
configurar los .env localmente y generar/empaquetar el frontend antes de
usar el launcher. Ver `docs/E13_GABRIELA_PILOTO.md` y las instrucciones de
instalacion; no ejecutar setup:fresh-pilot ni migraciones a ciegas contra
una base existente. No mezclar los datos ficticios con una instalacion clinica.

## Universidad

La entrega universitaria esta validada localmente y pendiente de publicacion
en el lote de Jose. Rama prevista: `codex/university-predeploy-20261005`.
Su estructura sera `frontend/web`, `backend/api` y `database`, separada de esta
linea clinica. PostgreSQL17.11,35 tablas,211 consultas. Tiene packaging y
guias, pero NO certificacion de funcionamiento en el servidor institucional.
Template, proxy/API, guardas de autenticacion/bootstrap y persistencia remota
deben contrastarse antes del despliegue. No ejecutar Docker de esa linea aqui.

## Calidad y trazabilidad

| Estado validado previamente | Clinica | Universidad |
| --- | --- | --- |
| Frontend / backend |151/151 y130/130 |154/154 y172/172 |
| Cypress |10/10 sinteticos |10/10 sinteticos |
| Build |PASS |PASS |
| Overall Sonar |81.4% |83.5% referencia PT-3 |
| New Code Coverage |97.4% |100% referencia PT-3 |

No se repitieron esas suites para esta publicacion: se verifico identidad de
contenido. Los resultados universitarios no se atribuyen al baseline clinico.
El catalogo academico contiene60 casos retroactivos, NO60 ciclos TDD reales.
Sonar/tests aprobados no certifican produccion clinica ni ausencia de defectos.

Verificar el contenido publicado con Node, sin instalar dependencias:

```powershell
node scripts/verify-published-baseline.cjs
```

El mapa conserva219 hashes originales y las rutas de3 evidencias archivadas.
Los Word originales se comprueban tambien por SHA-256.

Mapa completo: [Versiones](docs/versioning/VERSIONS.md).
Reparto de publicacion: [Plan GitHub](docs/versioning/GITHUB_PUBLICATION_PLAN.md).
Cambios de esta entrega: [Changelog](CHANGELOG.md).

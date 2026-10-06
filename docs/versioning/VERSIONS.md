# Mapa de versiones

| Linea | Rama | Etiqueta | Alcance |
| --- | --- | --- | --- |
| Clinica | codex/clinic-baseline-20261004 | clinic-quality-20261004 | Baseline MySQL/MariaDB, UI premium, launchers, calidad y pruebas |
| Universidad | codex/university-predeploy-20261005, pendiente | university-predeploy-20261005, prevista | PostgreSQL, packaging institucional provisional y guias |

No mezclar carpetas de ambas lineas en una instalacion. `main` conserva
la linea clinica, pero la integracion de este baseline esta PENDIENTE:
su proteccion exige PR y tres checks obligatorios. Universidad no reemplaza
sus migraciones ni lanzadores.
Las ramas previas codex/e09, e12, rc4 y seguridad conservan su historia;
no fueron eliminadas ni se reescribieron autores antiguos.

## Fuentes y evidencia

Clinica:MICODENT-QUALITY-20261004, Git base bbc15f1 MAS mejoras locales.
Manifest original en docs/baseline/MICODENT_BASELINE_CALIDAD.md.
GIT_BASELINE_SOURCE_MAP.json verifica219 entradas:216 en sus rutas originales
y3 reportes historicos reubicados en docs/baseline/evidence.
Los dos Word de SONAR_EVIDENCE_POST son copias exactas y corresponden a clinica.

Universidad:U3 PostgreSQL cerrado y U4 READY_TO_PUSH_PROVISIONAL.
DEV congelado337/337, export337 candidatos al repositorio: son conjuntos
DISTINTOS. La igualdad del conteo NO significa hashes/contenido iguales.
Su manifest propio y DEPLOY_VALIDATION.json se incorporaran en su rama.

## Limites

Clinica no es una certificacion de produccion, carga sostenida o recuperacion.
Universidad no esta certificada para el servidor del laboratorio: requiere
contraste de template/pipeline, proxy/TLS, bootstrap/auth y persistencia.
No se versionan secretos ni datos clinicos. Solo fixtures sinteticas.

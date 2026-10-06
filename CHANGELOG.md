# Historial de entregas

## clinic-quality-20261004

Publicacion:5 de octubre de2026. Baseline preservado:4 de octubre de2026.

- Se incorporaron las correcciones de calidad/pruebas ya validadas localmente,
  sin volver a implementarlas ni cambiar logica durante la publicacion.
- Se conservaron MySQL/MariaDB, interfaz premium y lanzadores Windows originales.
- Se incorporaron las60 fichas academicas, suites existentes y10 E2E sinteticos.
- Se archivaron3 evidencias fijas con mapeo de rutas para verificar219 hashes.
- Se incorporaron los2 Word originales facilitados por el propietario.
- Se retiraron de ESTA rama los bundles antiguos heredados, no fuentes ni
  artefactos del baseline congelado. El build se genera desde los locks.
- Se documentaron versiones/ramas, limite de produccion y lote pendiente de Jose.

El commit base bbc15f1 por si solo no contenia las mejoras locales de calidad.
La nueva entrega publica ese contenido conservando sus hashes exactos.
Las diferencias de finales de linea respecto a commits antiguos son parte de
esa preservacion de bytes; no se normalizan migraciones para ocultarlas.

## Universidad pendiente de publicacion

U3 PostgreSQL y U4 PREDEPLOY estan validados localmente; no son cambios
integrados a la linea clinica. Se publicaran en rama independiente despues
de cambiar la autenticacion/autor de las nuevas entregas a Jose.
No se declara release de despliegue institucional certificado.

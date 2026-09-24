# M02-A - Contencion de secretos en DEV

Fecha: 2026-09-20. Rama: codex/m02a-secretos. Base: 7c22ee2 (S1-A).
Aceptacion de S1-A confirmada por el propietario antes de esta intervencion.
El propietario identifico las exportaciones *_completo.txt como auxiliares y
autorizo su eliminacion y la continuacion del paquete, sin rotar secretos.

## Resultado

- Eliminados exclusivamente de DEV: micodent-backend/backend_completo.txt y
  micodent-frontend/frontend_completo.txt. No formaban parte del runtime.
- Conservados sus originales en el respaldo previo, sin modificar respaldos
  anteriores, carpetas del piloto ni el simulacro V3.
- actualizar-credenciales.js reemplazado por un aviso deshabilitado sin DB.
  Su version antigua nunca fue ejecutada durante este paquete.
- Agregados .env.example vacios de secretos en backend y frontend. Los .env
  reales permanecen intactos y no fueron versionados.
- Reforzadas exclusiones Git y marcado el backend como paquete privado.
- Agregado verificador de archivos, indice Git, historial local y artefactos
  de codigo; prepack lo ejecuta. Sin nuevas dependencias ni actualizaciones.
- Agregadas 16 pruebas especificas del verificador y la herramienta deshabilitada.
- Documentada la exportacion segura y la futura rotacion en SECRETOS.md.

## Evidencia y pruebas

Respaldo previo de archivos:
F:\Respaldos\MICODENT_M02A_20260920_115352\antes

Evidencia posterior:
F:\Respaldos\MICODENT_M02A_20260920_115352\verificacion

El manifiesto previo identifica la version y hashes de diez archivos copiados,
incluidas las exportaciones originales y .env, mas el codigo de la version
anterior en ZIP. Es material sensible sin contrasena por instruccion del
propietario, NO una entrega para GitHub o una IA.

| Verificacion | Resultado |
| --- | --- |
| Unitarias backend | 21/21, incluidas 16 nuevas de M02-A |
| Unitarias frontend | 5/5 |
| Build frontend | Correcto; permanece advertencia de chunk de 544.51 kB |
| Escaneo local e historial disponible | Sin hallazgos con las reglas aplicadas |
| Configuracion y migracion S1-A | Hashes sin cambios |
| Uploads | 14 archivos, inventario y hashes sin cambios |
| Respaldo de archivos | Diez copias verificadas, sin sobrescribir anteriores |

La version final y los hashes de su artefacto se registran en la evidencia
posterior al commit. No se consulto la BD ni se ejecutaron migraciones, grants,
rotaciones, cambios de usuarios, cambios de Edy o reinicios de servicios.
No se repitieron las pruebas de escritura SQL de S1-A: este paquete no cambia
su codigo de runtime ni requiere tocar datos para verificar sus cambios.

## Limites y pendiente M02-B

El verificador no garantiza ausencia de cualquier secreto desconocido,
codificado o historicamente compartido. No certifica anonimato de datos
clinicos y no inspecciona uploads ni dependencias.

Las copias sensibles en respaldos se conservaron deliberadamente. El secreto
JWT anteriormente encontrado en la exportacion sigue vigente: quitar la
exportacion de DEV NO equivale a revocarlo. Hace falta M02-B, con identificacion
de instalaciones y autorizacion expresa de rotacion. Ninguna laptop fue tocada.

En el cierre inicial de M02-A no se habia conectado GitHub. Posteriormente el
propietario autorizo administrarlo y proporciono su repositorio. La conexion,
el saneamiento excepcional del historial y los controles se documentan por
separado en TRABAJO_EN_GITHUB.md; no implican autorizacion de rotacion.

## Reversion

Respaldar primero cualquier trabajo posterior y comparar archivos antes de
revertir solo los cambios de M02-A. No restaurar BD ni uploads para revertir
este paquete. La configuracion activa no necesita restauracion.

Si falla el detector o la nueva regla prepack, corregir el control o revertir
esos archivos puntuales a la referencia 7c22ee2, sin borrar cambios nuevos.
NO reactivar el script antiguo ni devolver exportaciones con secretos al
workspace. Su preservacion en F: es para trazabilidad, no para uso cotidiano.

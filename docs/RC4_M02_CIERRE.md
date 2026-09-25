# RC4 - Conciliacion de M02-A

Fecha: 2026-09-24. Rama: `codex/rc4-m02-secretos`.
Base preservada: `3c981c141da907c03f102088158e3f0a3d749467` (RC4 + S1-A).
Referencia historica: M02-A `42f2da8`, adaptado al empaquetado RC4.

## Alcance y resultado

Se recuperan los controles de secretos sobre la base funcional RC4. No es una
nueva rotacion y no cierra la remediacion global de las instalaciones.
Se mantiene la version de runtime `rc4-s1a-dev`: esta entrega cambia herramientas
y documentacion, no autenticacion, API, frontend, launcher ni migraciones.
La version precisa de este paquete se identifica por su commit Git.

| Archivo | Cambio |
| --- | --- |
| `micodent-backend/scripts/check-secrets.js` | Detector local, indice Git, antecesores de HEAD y artefactos; referencias privadas externas de solo lectura para worktrees sin .env. |
| `micodent-backend/scripts/package-hotfix.cjs` | Bloqueo previo por secretos/historial y examen del contenido de entrega; incluye plantillas e instrucciones sin credenciales. |
| `micodent-backend/package.json` | security:check, security:history y prepack. Sin dependencias nuevas. |
| `micodent-backend/actualizar-credenciales.js` | Solo aviso inerte que conserva el nombre del antiguo script; no conecta ni cambia usuarios. Revisado estaticamente, no ejecutado. |
| `.env.example` de backend/frontend | Credenciales vacias en backend; frontend documenta same-origin real de RC4 sin variables obsoletas. |
| `micodent-backend/tests/unit/secrets.test.js` | 22 casos de contencion, artefactos, SQL, referencias privadas y bloqueo del empaquetado. |
| Documentacion de secretos, roadmap y estado | Distingue controles integrados, rotacion historica DEV y pendientes externos. |

Solo las dos migraciones SQL financieras revisadas pasan por nombre Y hash de
contenido. El resto de SQL queda bloqueado; cambiar el contenido permitido
tambien bloquea. No se ignoran secretos en tests ni en las migraciones.
Los worktrees pueden leer varias referencias privadas sin copiarlas, imprimirlas
ni usarlas para conectar a una BD. Una referencia ausente/incompleta impide el
control, incluso si las demas son validas. El empaquetador no admite sustituir
esa comprobacion por un escaneo solo de patrones.

## Verificacion

- 58/58 unitarias backend, incluidas 22 de M02 y regresion del launcher.
- Revision con secretos conocidos del DEV habitual, indice y antecesores Git.
- Ensayo del empaquetador real y posterior lectura/hashes de su entrega, sin
  configuracion privada, dumps, uploads, dependencias ni datos de pruebas.
- Pruebas negativas: dump renombrado, SQL alterado, secreto en indice, material
  privado, enlaces, referencia incompleta y empaquetado sin referencia.

Ensayo local del empaquetador, conservado fuera de Git:
`.runtime/releases/MICODENT-RC4-S1A-DEV-1790304784307`.
138 archivos, 7.313.583 bytes de componentes (sin contar el manifiesto).
SHA-256 del manifiesto:
`8ad12c6be0d916941939d040b3e053b14dbacd7f750a58b6540762a9be05b996`.
Se releyeron los 138 archivos y sus hashes, y los seis recursos del manifiesto
del build. Es una copia de ensayo, no una entrega autorizada para las laptops.
La revision previa al commit examino 154 archivos de texto y cuatro commits
antecesores (216 entradas historicas de texto distintas), sin hallazgos segun
las reglas aplicadas. El commit final tambien se verifica antes del push.

No se repitieron migraciones ni pruebas de escritura financiera: no se altero
codigo de runtime. La evidencia de S1-A/RC4 permanece en su informe anterior.
No hay CI en esta rama; los resultados son locales y no equivalen a aprobacion
clinica o autorizacion de despliegue.

## Incidencias y limites

La primera comprobacion intento incluir una referencia .env en el worktree
hotfix que no existe. El control se detuvo sin mostrar contenido. Se verifico
la referencia real del DEV habitual y se repitio con ella, sin crear/copiar .env.

El detector no certifica ausencia de secretos desconocidos, codificados o
incrustados en binarios, ni anonimato de pacientes. .runtime, uploads y
dependencias no se inspeccionan localmente y no se permiten en entregas de
codigo. HEAD limita el historial a lo que esta rama publicara; no certifica
todas las ramas del repositorio ni contenido compartido previamente.

No se modificaron configuraciones privadas, secretos, credenciales, permisos de
Edy, servicios, esquema, datos habituales ni las laptops. No se conecto a MySQL.
Los avances historicos de rotacion JWT DEV del 2026-09-21 se conservan como
evidencia previa, no se vuelven a ejecutar ni se atribuyen a este paquete.
M02-B global sigue abierto: el piloto/simulacro/laptops requieren inventario,
respaldo y rotacion coordinada independiente antes del despliegue real.

## Recuperacion y siguiente paso

No hace falta restaurar BD, uploads ni configuraciones para revertir estas
herramientas. La referencia Git previa conserva el codigo original del paquete;
comparar y revertir solo los cambios de herramientas si fuera necesario, sin
descartar avances posteriores. No reactivar el script antiguo, volver a secretos
expuestos ni reintroducir exportaciones auxiliares con datos.

Si falla un control de entrega, detener la publicacion y diagnosticar el hallazgo;
no excluir carpetas arbitrarias ni usar patrones solos para conseguir un verde.
No se creo un backup integral nuevo: este paquete no modifica datos. Los backups
privados existentes siguen separados del repositorio.

Siguiente trabajo autorizado en DEV: conciliar S1-B sobre esta base, con pruebas
de cookies, CSRF, expiracion y pestanas, conservando las funciones RC4. Sin
despliegue, cambios a Edy, fusiones a main ni PR automaticos.

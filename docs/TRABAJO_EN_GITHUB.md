# Control de versiones de MICODENT

Repositorio: https://github.com/AxJamz666/Micodent

## Modelo de ramas

| Rama | Proposito |
| --- | --- |
| main | Codigo aceptado por el propietario; no significa desplegado en clinica. |
| codex/mejoras-integracion | Base compartida de los paquetes de mejora. |
| codex/s1a-seguridad | Referencia del paquete S1-A aceptado. |
| codex/m02a-secretos | M02-A y preparacion del control profesional en GitHub. |
| codex/<paquete>-<descripcion> | Un paquete autorizado por rama, no una rama por archivo. |
| codex/hotfix-clinico-financiero | Candidato funcional RC4; no integrado aun con S1-A/S1-B. |
| codex/rc4-s1-integracion | RC4 con S1-A conciliado y probado en aislamiento; solo DEV. M02/S1-B pendientes. |
| codex/rc4-m02-secretos | Controles M02-A y empaquetado protegido sobre RC4 + S1-A, sin nueva rotacion. |
| codex/rc4-s1b-sesiones | Cookies/CSRF y sesiones por pestana sobre RC4 + S1-A + M02-A; verificado en aislamiento, no activado. |

No se crean ramas vacias de trabajo para todas las etapas: las etapas se mapean
en milestones e issues; las ramas nacen al autorizar su implementacion.
El roadmap tiene etapa 0 de preparacion y 17 etapas posteriores.

## Ciclo de trabajo

1. Issue con evidencia, alcance, dependencias y criterios de aceptacion.
2. Autorizacion del propietario; respaldo cuando corresponda.
3. Rama desde integracion y commits coherentes, sin mezclar otros paquetes.
4. Pruebas locales, revision del diff y comprobaciones de secretos.
5. Al cerrar la etapa: informe y push de la rama. PR solo con autorizacion
   expresa; vincular issue, riesgos y reversion cuando corresponda.
6. Si hay PR, CI correcto y aceptacion del propietario. Preferir merge commit para
   conservar los commits del paquete; no forzar historiales compartidos.
7. PR de integracion hacia main cuando el conjunto este aceptado.
8. Etiqueta de version aceptada y notas con pruebas, migracion y recuperacion.
9. Despliegue posterior solo con autorizacion, respaldo y plan por instalacion.

La solicitud actual del propietario es hacer informe y push al finalizar cada
etapa, sin pushes intermedios. RC4 tiene autorizacion expresa para publicarse
ahora. No autoriza nuevas fusiones automaticas a main ni despliegue clinico.
Los commits futuros usan la identidad local AxJamz666 con correo noreply de
GitHub; los commits historicos de Codex no se reatribuyen artificialmente.

## Comprobaciones automaticas

La configuracion CI descrita abajo pertenece a la linea historica de mejoras.
RC4 y su integracion S1-A todavia no incluyen esos workflows: sus resultados
son pruebas locales documentadas, NO una ejecucion CI aprobada en GitHub.

MICODENT CI comprueba Secrets, Backend y Frontend, con Node 24.14.0 y acciones
oficiales fijadas por SHA completo. El token del workflow solo tiene lectura de
contenido y checkout no conserva credenciales. No usa pull_request_target.

CI usa --patterns-only porque no debe recibir DB_PASSWORD ni JWT_SECRET reales.
Ese resultado se identifica expresamente como comparacion sin secretos locales.
Antes de push se requiere ademas el escaneo local normal y el historial, con
comparacion contra valores conocidos. No se exige una BD en los runners.

No confundir tres checks verdes con aceptacion clinica, restauracion verificada,
pruebas completas de permisos o compatibilidad MariaDB. Esas pruebas se adjuntan
por paquete, sin datos reales ni credenciales.

La configuracion deseada de main e integracion exige PR, conversaciones resueltas
y los tres checks, prohibiendo force-push y borrado. Su disponibilidad depende
del plan GitHub para repositorios privados; verificar el resultado de la API.
Si el plan no la permite, el procedimiento es obligatorio para el agente pero
NO debe afirmarse que GitHub lo impide tecnicamente.

Verificacion del 2026-09-20: GitHub acepto las protecciones de main e integracion
(HTTP 200), incluyendo administradores, PR, tres checks, conversaciones resueltas,
prohibicion de force-push y prohibicion de borrado. Se configuro el token de
Actions como solo lectura y sin capacidad de aprobar pull requests.
Hay un unico colaborador identificado; no se exige una segunda aprobacion que
el propietario no puede emitir sobre su propio PR. La aceptacion funcional se
registra explicitamente antes de fusionar, y no se presenta como revision
independiente de dos personas.

## Saneamiento inicial del repositorio

El 2026-09-20 se encontro el repositorio publico, con un unico commit remoto
7cc3f5f que incluia una exportacion con un secreto coincidente con DEV.
Se cambio su visibilidad a privado con la autorizacion de administracion del
propietario. No se detectaron forks en la comprobacion de ese momento.

El historial antiguo se preservo y verifico como bundle confidencial en
F:\Respaldos\MICODENT_M02A_20260920_115352\verificacion\historico-remoto-confidencial.bundle.
La base limpia 4af578e conserva el mismo codigo original, excluyendo material
privado y la herramienta antigua; S1-A aceptado es 7c22ee2. Se actualizo main
a esta linea limpia mediante una unica operacion con force-with-lease contra
el SHA remoto observado. No se borro ni se sustituyo el codigo de la instalacion.

No se conserva una rama remota legacy que vuelva a exponer las credenciales.
La reescritura no revoca secretos ni garantiza la eliminacion de caches,
objetos historicos o copias ya descargadas. M02-B sigue siendo prioritario;
no reutilizar las claves expuestas en produccion. Quien tenga clones antiguos
debe revisarlos antes de subir refs para no reintroducir ese historial.

## Material que nunca se sube

.env reales, respaldos, SQL con datos, uploads, imagenes clinicas, logs privados,
tokens, contrasenas, claves y exportaciones completas sin revisar. Los issues y
PR tambien son superficies de publicacion: no adjuntar datos clinicos alli.

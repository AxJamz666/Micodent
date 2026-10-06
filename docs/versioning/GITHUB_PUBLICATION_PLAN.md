# Publicacion GitHub en dos lotes

Acuerdo del propietario:60% ahora con AxJamz666 y40% despues con Jose.
La medida es5 entregas coherentes, NO porcentaje de lineas o atribucion
retroactiva del desarrollo. No se reescriben commits/autores anteriores.

| ID | Entrega | Cuenta/autor de nuevos commits | Lote |
| --- | --- | --- | --- |
| PUB01 | Baseline clinico, fuentes, tests, launchers y retiro de builds obsoletos | AxJamz666 / Jamz |60% |
| PUB02 | Informes de calidad,219 hashes y2 Word originales | AxJamz666 / Jamz |60% |
| PUB03 | README, versiones, changelog y verificador/publication manifest | AxJamz666 / Jamz |60% |
| PUB04 | Core PostgreSQL universitario, schema/seeds sinteticos y tests | joseHuaranga4198 / JoseHuaranga |40% pendiente |
| PUB05 | Packaging PREDEPLOY, backups, guias, evidencia y manifest | joseHuaranga4198 / JoseHuaranga |40% pendiente |

## Cierre del lote actual

Tres commits nuevos en codex/clinic-baseline-20261004. Publicar esa rama y
crear etiqueta anotada clinic-quality-20261004. Nunca force-push. El lote se
considera publicado cuando rama/tag remotos coincidan con sus referencias
locales. La integracion posterior a main es un paso separado.

El5 de octubre GitHub rechazo el intento atomico de fast-forward por GH006:
main exige pull request y3 checks obligatorios. NO se publico ninguna ref
en ese intento. Se preservaron las protecciones y se opto por rama/tag.
No crear PR automaticamente sin solicitud; no presentar main como actualizado.

La cuenta GitHub autenticada y el author/committer son verificaciones
separadas. Se usan overrides de identidad por commit; no se cambia la
configuracion global ni la identidad Jose del worktree de desarrollo.

## Punto de cambio a Jose

DETENER despues dePUB03 y avisar al propietario. No iniciarPUB04/PUB05
antes de confirmar autenticacion local de Jose y autorizacion del lote.
Jose debe consentir el uso de su identidad. No enviar passwords/tokens al chat
ni guardarlos en archivos. No es necesario cerrar sesion de Codex.
Contributor/cuenta autenticada/autor son conceptos distintos; GitHub puede
tardar en actualizar contribuciones y requiere email asociado a la cuenta.

No modificar los checkpoints congelados. No copiar .env, uploads, dumps,
node_modules, caches o .runtime al repositorio. No ejecutar migraciones,
Docker, Sonar ni desplegar para esta publicacion.

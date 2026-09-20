# MICODENT DEV - Instrucciones de trabajo

## Contencion

- Este workspace es MICODENT_DEV. No editar las carpetas originales del
  Escritorio, C:\Micodent_Simulacro ni instalaciones de Edy/Miguel.
- La unica BD autorizada para desarrollo es micodent_dev. No consultar ni
  modificar micodent. Las pruebas de escritura requieren instancia aislada.
- Leer docs/RUTA_MAESTRA.md, docs/TRABAJO_EN_GITHUB.md y el cierre del ultimo
  paquete antes de proponer otro. Conservar funciones y cambios del usuario.
- Analizar impacto, alcance, respaldo y reversion antes de modificar.
- No ejecutar versiones antiguas de actualizar-credenciales.js ni importar
  dumps sobre instalaciones existentes. No rotar secretos sin autorizacion.
- No mostrar secretos, tokens, hashes de contrasenas ni datos clinicos en
  herramientas, commits, issues, PR, logs, capturas o mensajes.

## Autorizacion permanente de control de versiones

El propietario solicita registrar y subir a GitHub cada trabajo que autorice.
Esta instruccion autoriza versionar ese trabajo, NO iniciar automaticamente
otro paquete, cambiar permisos de Edy ni desplegar en las laptops.

1. Verificar estado y rama; no mezclar cambios ajenos. Usar una rama
   codex/<paquete>-<descripcion> desde la base acordada.
2. Ejecutar pruebas proporcionales al cambio y documentar limites.
3. Ejecutar security:check y security:history antes de subir; ambos deben
   finalizar correctamente. No usar --patterns-only para sustituir la
   comprobacion local de secretos conocidos.
4. Hacer commits pequenos y descriptivos, con alcance y evidencia. Usar la
   identidad local configurada por el propietario, no cambiar Git global.
5. Subir solo codigo y documentacion revisados a origin (AxJamz666/Micodent),
   abrir/actualizar PR hacia codex/mejoras-integracion y vincular el issue.
6. Conservar main como version aceptada. No fusionar ni publicar releases
   como aprobadas sin aceptacion explicita del propietario.
7. No hacer force-push, borrar ramas compartidas ni reescribir historial como
   rutina. La limpieza excepcional del 2026-09-20 queda documentada.
8. Esperar y comprobar CI antes de declarar un paquete verificado en GitHub.
   Si acceso, protecciones o CI fallan, informar la limitacion y no ocultarla.

## Documentacion y recuperacion

- Actualizar el issue, PR, roadmap y cierre de cada paquete sin incluir valores
  sensibles. Distinguir implementado, probado, aceptado y desplegado.
- Los respaldos privados permanecen en F:\Respaldos, sin cifrado por instruccion
  vigente del propietario. Nunca versionarlos ni subirlos a GitHub o una IA.
- Una reversion de codigo no debe descartar datos creados posteriormente.
- El detector no certifica ausencia de cualquier secreto o dato personal.
  Mantener revision humana de los artefactos antes de compartir.

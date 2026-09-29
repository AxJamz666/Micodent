# E13 - Piloto local nuevo para Gabriela (sede Lima)

Estado: preparado y probado en DEV, pendiente de instalacion y aceptacion en la laptop. No es un release clinico.

## Alcance y limites

- Una sola laptop, sin acceso desde la red. No conectarla a las bases de Alex, Edy o Miguel.
- Base nueva `micodent_dev`, usuario local exclusivo `dev_micodent`, cuenta inicial `gabriela` (Doctor, administradora, nivel 3).
- El paquete no contiene `.env`, passwords, pacientes, historias, usuarios historicos ni uploads. Conserva solo los dos mapas de centros Rx aprobados.
- El frontend compilado esta en `micodent-backend/public`. La carpeta `micodent-frontend` es codigo fuente, no se inicia Vite en la laptop.
- Todavia no introducir datos clinicos reales. E14 (backup y restauracion por instalacion), E08 (finanzas integral) y E16 (aceptacion integral) no estan cerradas. XAMPP Windows incluye MariaDB 10.4.32, cuya rama ya no recibe mantenimiento. Esta prueba sirve para feedback con datos ficticios.
- Nunca importar `database/micodent.sql`, ni una base de otras laptops, ni ejecutar `actualizar-credenciales.js`.

## Version y origen

- Base de codigo: rama `codex/e09-agenda-api`, commit `4062ebf`, frontend compilado `rc4-e09-dev`, lanzador V4.0.3.
- Preparacion E13: rama `codex/e13-gabriela-piloto`; registrar el commit final en el manifiesto del paquete.
- Prueba aislada con Node 24.14.0 y MariaDB 10.4.32: esquema vacio, 35 tablas, dos mapas, login y health. La prueba integrada de E09 en MariaDB tambien paso.
- M07-D sigue pausado y no forma parte de este piloto.

## Instalacion en la laptop nueva

1. Instalar Node.js 24.14.0 x64 desde el [archivo oficial de Node](https://nodejs.org/en/download/archive/v24.14.0). Reiniciar la terminal y verificar `node --version` y `npm --version`.
2. Instalar [XAMPP para Windows 8.2.12](https://www.apachefriends.org/download.html) desde Apache Friends. El componente usado por MICODENT es MariaDB/MySQL; Apache solo se necesita mientras se usa phpMyAdmin para configurar la base. Verificar que MySQL inicie en el puerto 3306. Si no inicia, o usa otro puerto, detener la instalacion y registrar el error; no modificar a ciegas la configuracion.
3. Extraer el ZIP E13 en `%USERPROFILE%\Documents\MICODENT_GABRIELA_PILOTO`. No extraerlo encima de otra instalacion. Verificar el hash SHA-256 del ZIP contra el manifiesto entregado.
4. En PowerShell, dentro de la carpeta extraida, ejecutar `powershell -NoProfile -ExecutionPolicy Bypass -File .\configurar_piloto_gabriela.ps1`. El script crea `micodent-backend\.env` solo si no existe y muestra una vez la clave de la BD. No compartirla, fotografiarla ni pegarla en chats.
5. En phpMyAdmin de esta laptop, crear la base `micodent_dev` con `utf8mb4_unicode_ci` y sin tablas. Crear `dev_micodent` con host `127.0.0.1` y la clave generada en el paso 4. Darle privilegios solo sobre `micodent_dev.*`, no globales. Verificar que la base este vacia y no exista otra instalacion MICODENT en esta laptop.
6. Abrir `cmd` en `micodent-backend` y ejecutar `npm ci --omit=dev`. Requiere internet. No editar `package-lock.json`. Si falla, detenerse y registrar el error.
7. Con MySQL activo, en esa misma carpeta ejecutar primero `npm run setup:fresh-pilot:check`. Debe confirmar `micodent_dev`, MariaDB 10.4.32 y cero tablas; no modifica la base. Si pasa, ejecutar `npm run setup:fresh-pilot`. La aplicacion repite la verificacion antes de crear el esquema y muestra una vez la clave inicial de `gabriela`. Anotarla en privado. Si falla, no repetirlo ni borrar tablas; solicitar revision.
8. Ejecutar `comprobar_micodent.bat`. Luego `iniciar_micodent.bat`. El lanzador comprueba MySQL, backend, frontend y navegador. Abrir `http://localhost:4000` solo en esta laptop. Iniciar sesion como `gabriela` y cambiar de inmediato la clave inicial desde el perfil.
9. Probar con datos ficticios: paciente, historia, cita, consulta, abono, laboratorio, gasto, orden Rx con ambos mapas, receta, impresion y dashboard financiero. Cerrar sesion, reiniciar Windows, arrancar MySQL y abrir el BAT de nuevo. Registrar cualquier diferencia antes de usar datos reales.

## Criterios de parada y datos reales

- No avanzar si aparece una base con tablas, puerto ocupado por otra instancia, version inesperada, `health` 503, mapa ausente, error de login o error de impresion.
- No permitir datos reales hasta comprobar un respaldo integral y una restauracion aislada de esta instalacion (BD + `micodent-backend/uploads` + `.env` privado + version), permisos de Windows, cuenta local segura y aceptacion clinica. Un ZIP del codigo no es un backup clinico.
- Si se decide usar una MariaDB soportada en vez de XAMPP 10.4, debe repetirse la prueba de compatibilidad y restauracion antes de introducir datos reales.
- [MariaDB confirma que la serie 10.4 ya no recibe mantenimiento](https://mariadb.com/docs/release-notes/community-server/old-releases/10.4/what-is-mariadb-104).
- El arranque V4.0.3 no instala ni inicia MySQL. Aun se requiere levantarlo en XAMPP; la automatizacion segura pertenece al cierre de E13/E15.

## Reversion

Antes de datos reales, detener el backend y conservar intactas la carpeta extraida y la base para diagnostico. No importar un dump antiguo ni ejecutar scripts de limpieza. Despues de cualquier dato real, solo recuperar desde un respaldo verificado y reconciliar lo ingresado despues; una copia vieja no debe sobrescribir nuevos registros.

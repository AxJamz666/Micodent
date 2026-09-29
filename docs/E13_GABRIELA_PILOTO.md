# E13 - Piloto local nuevo para Gabriela (sede Lima)

Estado: candidato actualizado con diseno E12 aprobado en DEV; pendiente de
prueba y aceptacion en la laptop. No es un release clinico.

## Alcance y limites

- Una sola laptop, sin acceso desde la red. No conectarla a las bases de Alex, Edy o Miguel.
- Base nueva `micodent_dev`, usuario local exclusivo `dev_micodent`, cuenta inicial `gabriela` (Doctor, administradora, nivel 3).
- El paquete no contiene `.env`, passwords, pacientes, historias, usuarios historicos ni uploads. Conserva solo los dos mapas de centros Rx aprobados.
- El frontend compilado esta en `micodent-backend/public`. La carpeta `micodent-frontend` es codigo fuente, no se inicia Vite ni se ejecuta `npm run build` en la laptop.
- Todavia no introducir datos clinicos reales. E14 (backup y restauracion por instalacion), E08 (finanzas integral) y E16 (aceptacion integral) no estan cerradas. XAMPP Windows incluye MariaDB 10.4.32, cuya rama ya no recibe mantenimiento. Esta prueba sirve para feedback con datos ficticios.
- Nunca importar `database/micodent.sql`, ni una base de otras laptops, ni ejecutar `actualizar-credenciales.js`.

## Version y origen

- Base de codigo: RC4 + S1 + E09 + E12; rama `codex/e13-gabriela-e12-pilot`, frontend compilado `rc4-e12-e13-pilot`, lanzador V4.0.3. El commit exacto figura en `MANIFEST.json`.
- Usar solo el ZIP `MICODENT_E13_GABRIELA_E12_*.zip` mas reciente cuyo SHA-256 coincida con el archivo `.sha256.txt` adjunto. Los ZIP `E13_GABRIELA_PILOTO_*.zip` anteriores no incluyen el diseno E12.
- Prueba aislada con Node 24.14.0 y MariaDB 10.4.32: esquema vacio, 35 tablas, dos mapas, login y health. La prueba integrada de E09 en MariaDB tambien paso.
- M07-D sigue pausado y no forma parte de este piloto.

## Construccion de la entrega en DEV

Desde `micodent-frontend`, ejecutar `npm run build`; desde
`micodent-backend`, ejecutar `npm run package:frontend`. Luego, con
`MICODENT_SECRET_REFERENCES` apuntando al `.env` privado de DEV, ejecutar
`package-e13-pilot.ps1 -Destination <directorio de entregas>` desde PowerShell.
El script no instala dependencias ni modifica bases de datos: crea una carpeta
y un ZIP con el mismo contenido, `MANIFEST.json`, y el SHA-256 del ZIP.
Incluye solo el build actualmente referenciado por `public/index.html`, no
assets viejos de compilaciones previas. Nunca copiar manualmente el `.env` ni
`uploads` a otra laptop o a la universidad.

## Instalacion en la laptop nueva

1. Instalar Node.js 24.14.0 x64 desde el [archivo oficial de Node](https://nodejs.org/en/download/archive/v24.14.0). Reiniciar la terminal y verificar `node --version` y `npm --version`.
2. Instalar [XAMPP para Windows 8.2.12](https://www.apachefriends.org/download.html) desde Apache Friends. El componente usado por MICODENT es MariaDB/MySQL; Apache solo se necesita mientras se usa phpMyAdmin para configurar la base. Verificar que MySQL inicie en el puerto 3306. Si no inicia, o usa otro puerto, detener la instalacion y registrar el error; no modificar a ciegas la configuracion.
3. Extraer el ZIP E13 actualizado en `%USERPROFILE%\Documents\MICODENT_GABRIELA_PILOTO`. No extraerlo encima de otra instalacion. Verificar el hash SHA-256 del ZIP contra el archivo `.sha256.txt` y conservar `MANIFEST.json`.
4. En PowerShell, dentro de la carpeta extraida, ejecutar `powershell -NoProfile -ExecutionPolicy Bypass -File .\configurar_piloto_gabriela.ps1`. El script crea `micodent-backend\.env` solo si no existe y muestra una vez la clave de la BD. No compartirla, fotografiarla ni pegarla en chats.
5. En phpMyAdmin de esta laptop, crear la base `micodent_dev` con `utf8mb4_unicode_ci` y sin tablas. Crear `dev_micodent` con host `127.0.0.1` y la clave generada en el paso 4. Darle privilegios solo sobre `micodent_dev.*`, no globales. Verificar que la base este vacia y no exista otra instalacion MICODENT en esta laptop.
6. Abrir `cmd` en `micodent-backend` y ejecutar `npm ci --omit=dev`. Requiere internet. No editar `package-lock.json`. Si falla, detenerse y registrar el error. El frontend ya esta compilado: no se instala ni inicia `micodent-frontend` en esta laptop.
7. Con MySQL activo, en esa misma carpeta ejecutar primero `npm run setup:fresh-pilot:check`. Debe confirmar `micodent_dev`, MariaDB 10.4.32 y cero tablas; no modifica la base. Si pasa, ejecutar `npm run setup:fresh-pilot`. La aplicacion repite la verificacion antes de crear el esquema y muestra una vez la clave inicial de `gabriela`. Anotarla en privado. Si falla, no repetirlo ni borrar tablas; solicitar revision.
8. Ejecutar `comprobar_micodent.bat`. Luego `iniciar_micodent.bat`. El lanzador comprueba MySQL, backend, frontend y navegador. Abrir `http://localhost:4000` solo en esta laptop. Iniciar sesion como `gabriela` y cambiar de inmediato la clave inicial desde el perfil.
9. Probar con datos ficticios: paciente, historia, cita, consulta, abono, laboratorio, gasto, receta, impresion y dashboard financiero. En una orden Rx marcar piezas de tomografia y periapicales, incluida una pieza comun; comprobar en vista previa e impresion el odontograma con marcas T, P y T/P, la lista de numeros y ambos mapas. Cerrar sesion, reiniciar Windows, arrancar MySQL y abrir el BAT de nuevo. Registrar cualquier diferencia antes de usar datos reales.

## Criterios de parada y datos reales

- No avanzar si aparece una base con tablas, puerto ocupado por otra instancia, version inesperada, `health` 503, mapa ausente, error de login o error de impresion.
- No permitir datos reales hasta comprobar un respaldo integral y una restauracion aislada de esta instalacion (BD + `micodent-backend/uploads` + `.env` privado + version), permisos de Windows, cuenta local segura y aceptacion clinica. Un ZIP del codigo no es un backup clinico.
- Si se decide usar una MariaDB soportada en vez de XAMPP 10.4, debe repetirse la prueba de compatibilidad y restauracion antes de introducir datos reales.
- [MariaDB confirma que la serie 10.4 ya no recibe mantenimiento](https://mariadb.com/docs/release-notes/community-server/old-releases/10.4/what-is-mariadb-104).
- El arranque V4.0.3 no instala ni inicia MySQL. Aun se requiere levantarlo en XAMPP; la automatizacion segura pertenece al cierre de E13/E15.

## Presentacion en laboratorio universitario

El mismo ZIP puede servir para una demostracion **solo con datos ficticios**
en una PC Windows donde se permita instalar Node.js, XAMPP/MariaDB y ejecutar
`npm ci`. Debe tener su propia base vacia `micodent_dev` y usuario
`dev_micodent`, separados de cualquier instalacion familiar. El instalador
actual comprueba especificamente MariaDB 10.4.32; si el laboratorio dispone de
otra version, no saltar la comprobacion ni ejecutar el instalador. La cuenta
inicial se llama `gabriela` tambien en la demo: no contiene informacion de la
persona ni pacientes al crearla. Confirmar en esa PC los puertos, permisos de
instalacion, health, login e impresion antes de presentarla al docente.

Copiar solo frontend y backend sin Node, dependencias, MariaDB y configuracion
privada no constituye un despliegue funcional. No copiar la base ni los
archivos clinicos de Gabriela a la universidad.

## Reversion

Antes de datos reales, detener el backend y conservar intactas la carpeta extraida y la base para diagnostico. No importar un dump antiguo ni ejecutar scripts de limpieza. Despues de cualquier dato real, solo recuperar desde un respaldo verificado y reconciliar lo ingresado despues; una copia vieja no debe sobrescribir nuevos registros.

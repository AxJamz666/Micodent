# MICODENT - Arranque V4.0.0

Paquete exclusivo del lanzador para instalaciones V3 existentes. No contiene
backend, frontend, SQL, configuracion, contrasenas ni datos clinicos.
No instalar el workspace MICODENT_DEV en las laptops como parte de este cambio.

## Antes de actualizar cada laptop

1. Coordinar una ventana sin pacientes ni formularios pendientes. Guardar el
   trabajo y cerrar las sesiones. Actualizar primero UNA laptop.
2. Registrar equipo, usuario Windows habitual, carpeta real del backend,
   version instalada, version de Node y motor/version de MySQL o MariaDB.
   No asumir que las dos laptops tienen la misma instalacion.
3. Respaldar cada instalacion por separado: BD propia + uploads + .env y
   configuracion + codigo/build/manifiestos + BAT anterior. Identificar fecha,
   version, tamanos y SHA-256; verificar lectura y restauracion en copia aislada.
   Este ZIP NO es ese respaldo. No reemplazar la BD de una laptop con otra.
4. Confirmar Windows con PowerShell 5.1, Get-NetTCPConnection/Get-CimInstance y
   Node en PATH. Minimo tecnico Node 20; las pruebas de este paquete usan 24.14.0.
   Una version distinta requiere ensayo; NO actualizar Node o dependencias
   aprovechando esta intervencion.
5. El backend debe ser el V3 con `start: node src/index.js`, dependencias ya
   instaladas, .env propio, public/index.html, assets y /api/health V3. BD local
   con DB_HOST localhost/127.0.0.1/::1. No admite BD compartida/remota ni Vite.
6. Verificar que MySQL realmente inicia al encender Windows, NO solamente que
   aparece el panel XAMPP. Este paquete no crea servicios ni cambia XAMPP.
   Si no ocurre, detener la entrega y revisar esa laptop antes de aprobarla.

## Instalacion manual controlada

1. Extraer el ZIP a una carpeta temporal, nunca ejecutarlo dentro del ZIP.
2. Conservar el BAT anterior en el respaldo privado fuera de la carpeta activa.
3. Colocar SOLO estos tres archivos en la misma carpeta del BAT anterior:
   iniciar_micodent.bat, comprobar_micodent.bat, micodent-arranque.cjs.
   Deben quedar juntos, al lado de micodent-backend o dentro de ese backend.
   Si alguno ya existe, verificar su version y respaldarlo antes de sustituirlo.
4. No copiar ni sobrescribir .env, src, public, uploads, node_modules o SQL.
5. Abrir comprobar_micodent.bat: comprueba archivos/configuracion SIN arrancar
   backend, consultar MySQL, escribir logs o abrir navegador. Debe aprobar.
6. Reiniciar Windows de forma normal, despues de guardar todo el trabajo.
   Esto evita mezclar el proceso del BAT anterior con el nuevo lanzador.
   No finalizar todos los node.exe ni detener MySQL para liberar un puerto.
7. Abrir iniciar_micodent.bat con el usuario habitual, sin exigir administrador.
   Esperar. Abre localhost solo tras health y recursos verificados. Se puede
   cerrar la ventana de inicio una vez terminado; backend queda sin consola.
8. Confirmar acceso, datos existentes, navegacion y pruebas de la tabla. Crear
   o corregir el acceso directo para apuntar a este BAT, no al antiguo ni a Vite.
9. Registrar version V4.0.0, hash del ZIP, resultados y responsable. Solo despues
   repetir el procedimiento independiente en la otra laptop.

## Pruebas obligatorias por laptop

| Prueba | Resultado exigido |
| --- | --- |
| Tres reinicios normales de Windows | MySQL inicia y MICODENT abre sin terminales manuales |
| Abrir apenas termina de entrar a Windows | Espera la BD; no muestra una falsa pantalla lista |
| Doble clic repetido mientras inicia | Una secuencia de inicio y un backend; sin conflicto |
| Abrir otra vez cuando ya funciona | Reutiliza el mismo backend, no crea otro |
| Cerrar navegador y volver a abrir BAT | Puede iniciar sesion nuevamente; datos conservados |
| Login con usuario habitual | Perfil correcto y acceso esperado, sin cambiar permisos |
| Pacientes/historias/agenda/finanzas/documentos | Lectura de datos previos y archivos asociados correctos |
| Impresion habitual | Vista/impresion correctas segun flujo anterior |
| Guardado habitual autorizado y recarga | Persiste una operacion legitima; no crear pacientes ficticios en datos reales |
| Suspension y reanudacion, si se usa | Backend/BD recuperan acceso; si falla, no aprobar esa modalidad |

Los fallos de BD, puerto ajeno, build incompleto, proceso caido y inicio tardio
se prueban sobre copia aislada, no desconectando servicios durante trabajo
clinico. La suite incluida en el repositorio ya usa datos/procesos ficticios;
eso NO sustituye estas pruebas en las laptops ni la restauracion de su respaldo.

## Si aparece un error

- MYSQL_TIMEOUT: MySQL no respondio en cinco minutos. El administrador revisa
  su arranque. No reinstalar MySQL, no borrar data ni importar micodent.sql.
- PORT_BUSY: otro proceso ocupa el puerto, o sigue activo el backend antiguo o
  uno de otra revision. No se mata automaticamente. Guardar trabajo y coordinar
  revision; un reinicio normal resuelve procesos anteriores solo si no hay otro
  mecanismo que vuelva a iniciarlos. No cambiar PORT al azar.
- BACKEND_TIMEOUT/BACKEND_EXIT: fallo de aplicacion, credenciales, BD o runtime.
  No se interpreta como perdida de datos; requiere diagnostico del administrador.
- BUILD/BUILD_PORT/HTTP: build incompleto, otro puerto compilado o respuesta que
  no coincide. Volver al lanzador anterior y revisar; no copiar el build de DEV.
- OWNER: Windows no permitio verificar el proceso o excedio el tiempo de la
  consulta. No desactivar seguridad ni elevar permanentemente para ocultarlo.
- ENV_CONFLICT/CONFIG: valores de Windows/.env incompatibles. No publicar .env.

El registro indicado en pantalla queda en:
%LOCALAPPDATA%\MICODENT\arranque-v4\<identificador-de-carpeta>\arranque.log
Conserva un archivo anterior al superar 256 KiB. Solo fecha, version y eventos
fijos; no captura SQL, stdout/stderr del backend, passwords ni datos clinicos.
Los errores previos a crear el registro solo aparecen en la ventana.

## Reversion sin perder informacion nueva

Guardar primero trabajo y evidencia. Restituir SOLO los archivos del lanzador
anterior y su acceso directo desde el respaldo de ESA laptop. Los dos archivos
nuevos se pueden dejar sin usar; no es necesario borrarlos. Reiniciar Windows
normalmente en ventana acordada y probar el BAT anterior.
NO restaurar una BD anterior, .env, uploads ni carpetas completas: los datos
creados despues de instalar deben permanecer. Si hay un problema de datos,
detener nuevas escrituras y diagnosticar por separado antes de restaurar nada.

## Limites y decision de entrega

APROBADO EN ESA LAPTOP solo con respaldo verificado, compatibilidad comprobada,
MySQL automatico confirmado, todas las pruebas aplicables correctas y aceptacion
del usuario. Si falla un requisito: NO APROBADO; conservar version previa.

El lanzador reduce fallos de inicio, no garantiza disponibilidad continua.
No reinicia MySQL ni Node tras una caida posterior, no es un servicio Windows y
no evita cortes electricos, danos de disco, fallos clinicos ni perdida de datos.
Tras una caida de Node se puede volver a abrir el BAT; si el proceso sigue vivo
pero no responde, requiere diagnostico. No reinicia procesos que podrian tener
trabajo en curso. Cerrar sesion de Windows o apagar la laptop termina el backend.
La supervision automatica y recuperacion son un paquete posterior por equipo.

El health V3 ejecuta SELECT 1: verifica conectividad, no tablas/migraciones ni
integridad completa. Los recursos se comparan por SHA-256 con public local,
incluyendo chunks de assets; no equivale a probar cada pantalla en navegador.
La identidad del proceso comprueba ejecutable, ruta absoluta y revision de
lanzador/index/db/package/build mas fecha/tamano de .env. No es un inventario
criptografico de todo el backend ni una frontera contra malware local.

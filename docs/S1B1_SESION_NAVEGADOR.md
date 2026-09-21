# S1-B1 - Verificacion de sesion e identidad por pestana

Fecha: 2026-09-21. Base: df61c26. Rama: codex/s1b1-sesion-navegador.
Continuacion autorizada por el propietario tras confirmar acceso habitual de
Miguel en DEV despues de M02-B. Solo MICODENT_DEV; no es despliegue clinico.

## Problema y alcance

Antes, ProtectedRoute confiaba en userNombre e isAdmin de localStorage. Cada
peticion tomaba el token mas reciente del almacenamiento compartido: una
pestana con un formulario de una cuenta podia enviarlo con el login de otra.
La proteccion S1-A frente a respuestas 401 antiguas no prevenia ese envio.

Ahora se valida /auth/me antes de montar pantallas protegidas. El usuario y
el acceso visual administrativo proceden de esa respuesta, no de banderas
persistidas. Solo se almacenan los metadatos de identidad ya utilizados por
las pantallas; no se agrega persistencia de firmas, sellos o contactos.
La autorizacion efectiva continua en el backend, sin cambios de permisos.

Cada pestana queda ligada a su credencial inicial o a su propio login nuevo.
Los eventos de almacenamiento/foco y los interceptores comprueban esa identidad
antes de enviar y de aceptar respuestas. Un cambio en otra pestana bloquea
la anterior; no adopta automaticamente el usuario nuevo ni borra su token.

Un 401 de la credencial vigente oculta y bloquea el contenido. No se redirige
automaticamente destruyendo el formulario. El usuario elige volver al acceso,
con aviso de descarte. 403, 503 o red no cierran sesion. Si /auth/me no puede
validarse inicialmente, se muestra reintento sin montar vistas ni borrar token.
La verificacion inicial tiene timeout de diez segundos.

## Archivos

Todas las rutas de codigo siguientes son relativas a micodent-frontend/.

| Archivo | Cambio | Riesgo y dependencia |
| --- | --- | --- |
| src/services/sessionState.js | Coordinador comprobable de identidad, perfil y transiciones | Comparacion exacta de credencial; base de todo el paquete |
| src/services/browserSession.js | Instancia por pestana y hook React | Se reinicia al recargar la pagina |
| src/components/SessionBoundary.jsx | Verificacion, reintento y bloqueo opaco/accesible | Conserva el arbol montado al bloquear; no autoriza recuperar borradores |
| src/services/api.js | Comprobar identidad en solicitudes/respuestas; 401 sin redireccion automatica | Afecta todas las llamadas Axios; sin reintentos de escrituras |
| src/App.jsx | Rutas protegidas y administrativas con perfil verificado | No sustituye permisos backend |
| src/pages/Login.jsx | Login seguido de verificacion; impedir sobreescribir login ajeno tardio | No autentica solo con datos cacheados |
| src/layouts/MainLayout.jsx | Logout ligado a identidad y fin de sesion intencional | 503 conserva estado |
| src/pages/MiPerfil.jsx | Cambio de clave ligado a identidad y retorno a login | No cambia politica ni endpoint |
| tests/sessionState.test.mjs | Once pruebas del coordinador | Datos sinteticos, sin navegador/BD |
| tests/browser-session.cjs | Trece escenarios con Edge/API simulada | No usa credenciales ni servicios de datos reales |

README.md, docs/RUTA_MAESTRA.md y docs/ESTADO_FASES.md registran el avance.
No cambios en backend, SQL, .env, secretos, uploads, dependencias, roles,
perfil de Edy, piloto, simulacro, laptops, XAMPP o servicios Windows.

## Respaldo y contencion

F:\Respaldos\MICODENT_S1B1_20260921_114408:

- codigo.zip: Git archive de df61c26, 3.071.412 bytes.
- MANIFIESTO.json: version, equipo, fecha, SHA-256 del archivo y referencia de
  47 archivos protegidos: configuraciones y arbol src del backend con uploads.
- herramientas, capturas y logs: evidencia local; no se publica con datos reales.

Respaldo de codigo, NO nuevo backup SQL ni restauracion integral. Las pruebas
no acceden a SQL; el arranque final verifica instancia y migracion solo en
lectura. No hay modificaciones de BD en este paquete. Los respaldos integrales
anteriores siguen siendo necesarios para recuperacion de datos.
El helper inicial busco uploads en la raiz del backend; fallo antes de crear
el archivo. Se verifico la ruta real en index.js/multer.js: src/uploads; se
corrigio el inventario y se repitio con exito. No se movieron archivos.

Se pauso exclusivamente Vite DEV previamente identificado para no introducir
cambios parciales por HMR. Backend/MySQL continuaron activos. Las pruebas usan
un Vite separado en 127.0.0.1:5174 y contextos nuevos de Edge. Se intercepta todo
acceso API; cualquier recurso externo inesperado se bloquea. No usan la pestana
autenticada del propietario. Al concluir se vuelve a ofrecer DEV en 5173.
Al retomar despues de la interrupcion, ambos procesos DEV ya no estaban
ejecutandose, pero MySQL permanecia activo. Se comprobaron configuracion,
micodent_dev, dev_micodent, UUID de instancia y migracion aplicada en lectura
antes de iniciar backend y frontend. No se ejecutaron migraciones ni se
reinicio MySQL. Un arranque normal comprueba el esquema, no lo modifica.

## Pruebas y resultados

| Prueba | Resultado exigido y observado |
| --- | --- |
| Unitarias backend | 28/28; servicio y controles existentes sin regresiones detectadas |
| Unitarias frontend | 16/16, incluyendo 11 nuevas |
| Cache admin y verificacion demorada | No montar vistas privadas; bandera local no concede acceso |
| Admin confirmado por servidor | Administracion sigue disponible |
| Perfil invalido | Fallar cerrado, conservar token y permitir reintento |
| /auth/me 503 | No montar formularios; reintento vuelve a ruta solicitada |
| Logout en otra pestana | Bloquear pestaña anterior y sus solicitudes |
| Login en otra pestana | No adoptar credencial nueva; conservar formulario oculto en memoria |
| 401 vigente | Quitar credencial coincidente, bloquear sin destruir inmediatamente formulario |
| 403, 503 y red | Mantener sesion y valores del formulario |
| Respuesta 200 tardia | No aceptar resultado bajo otra identidad |
| Respuesta 401 tardia | No borrar sesion nueva |
| Login rechazado y exitoso | Rechazo no expulsa; exito valida perfil antes de abrir vistas |
| Logout con 503 y exito | Fallo mantiene trabajo; exito lleva al acceso |
| Cambio de clave con 503 y exito | Fallo conserva campos; exito exige login nuevamente |
| UI escritorio/movil | 1280x800 y 390x844; sin desbordamiento, accion enfocada y capturas revisadas |
| Build | Correcto; aviso existente de bundle mayor a 500 kB, no corregido en este paquete |
| Lint focalizado | Coordinador, hook, boundary, App y API correctos |
| Integridad | SHA-256 del codigo respaldado y 47 archivos protegidos sin cambios |

Los trece escenarios de navegador incluyen el de 403/503/red como un escenario
con tres variantes. Son pruebas con API simulada, NO pruebas clinicas completas.
Lint focalizado no certifica que todo el frontend historico carezca de avisos.
Escaneos locales de secretos e historial se exigen antes del push. CI remoto
se verifica para el commit final y se registra en el PR; no ejecuta Edge.

Repeticion: npm test en ambos proyectos y npm run build en frontend. Para el
navegador, usar Vite dedicado en 127.0.0.1:5174, Edge y una instalacion existente
de Playwright via PLAYWRIGHT_PATH; ejecutar node tests/browser-session.cjs.
SESSION_SCREENSHOT_DIR es opcional. No instalar dependencias en la clinica para
estas pruebas ni ejecutar el script contra el puerto de trabajo de un usuario.

## Limites, reversion y aceptacion

- JWT sigue en localStorage: XSS/transporte de credenciales NO quedan resueltos.
  Cookies HttpOnly, CSRF y transporte por entorno quedan para S1-B2.
- El contenido bloqueado permanece en memoria, oculto e inerte, no cifrado.
  No hay borradores persistentes ni recuperacion tras cerrar/recargar. Al volver
  al acceso se descarta ese estado; M10 requiere un paquete propio.
- La expiracion se detecta al recibir 401; no se agrega temporizador ni renovacion
  silenciosa. Los cambios de permisos siguen siendo comprobados por el backend.
- Una escritura enviada ANTES de cambiar sesion podria completarse con la
  identidad original. No se cancela, revierte ni reintenta automaticamente;
  comprobar el resultado antes de repetirla. Esta interfaz no es idempotencia.
- No prueba volumen de historias, concurrencia SQL, backups, MariaDB o laptops.

Revertir si una cuenta valida no puede acceder, se permite enviar con una
cuenta distinta, se destruye sesion nueva por respuesta antigua o aparecen
regresiones en login/logout/cambio de clave. Guardar evidencia sin secretos.
Conservar cambios posteriores y devolver SOLO los archivos frontend de la tabla
a su version df61c26; retirar los nuevos del paquete cuando ya no se importen.
Recompilar/probar y recargar deliberadamente. No revertir configuracion JWT,
restaurar BD/uploads ni descartar datos introducidos despues del cambio.

Aprobacion tecnica requiere unitarias, navegador, build, integridad y CI correctos.
Aceptacion funcional S1-B1 del propietario sigue pendiente: acceso normal,
navegacion habitual y cierre de sesion en DEV. No equivale a aceptacion clinica.
No fusionar ni desplegar automaticamente. PR apilado sobre M02-B mientras sus
bases no se integran; retarget a codex/mejoras-integracion y repetir CI antes
de fusionar. La etapa E03 completa permanece abierta.

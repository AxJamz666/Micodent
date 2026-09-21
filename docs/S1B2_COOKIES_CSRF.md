# S1-B2 - Cookies HttpOnly y proteccion CSRF en DEV

Fecha: 2026-09-21. Base aceptada: c3ab4da (S1-B1). Rama:
codex/s1b2-cookies-csrf. El propietario confirma S1-B1 y autoriza continuar.

Estado: implementacion de codigo y pruebas unitarias/HTTP en memoria realizadas.
Validacion de navegador pendiente por bloqueo de arranque automatico del Vite
aislado. NO aprobado, NO activado en DEV, NO desplegado ni listo para produccion.

## Alcance y decisiones

1. La API entrega el JWT exclusivamente en la cookie micodent_dev_session_v2:
   HttpOnly, SameSite=Strict, host-only, Path=/api y expiracion alineada al JWT.
   Ni login ni /auth/me devuelven el JWT en JSON. Se elimina Authorization Bearer
   como transporte aceptado; no hay fallback que mantenga el contrato antiguo.
2. Los JWT nuevos incluyen bt=2. Se rechazan los anteriores sin borrar su
   historial de sesiones, cambiar claves o modificar usuarios. Se requiere
   volver a iniciar sesion tras actualizar frontend y backend conjuntamente.
3. El servidor deriva dos valores HMAC distintos por sesion: un identificador
   no autenticante y un token CSRF. Ninguno sustituye la cookie ni autentica por
   si solo. El frontend conserva CSRF solo en memoria y envia ambos en headers.
4. Las operaciones autenticadas comparan la identidad esperada con la cookie.
   Si otra pestana cambio de cuenta, el servidor devuelve 409 antes de ejecutar
   el controlador, incluso cuando el evento de localStorage aun no llego.
5. Las escrituras requieren origen exacto permitido y X-Micodent-Client, mas
   token CSRF ligado a la sesion cuando estan autenticadas. Login utiliza
   comprobacion estricta de origen y header personalizado antes del limitador.
   Se rechaza Origin null, origen ausente en escrituras, Fetch Metadata cross-site
   y hosts fuera de localhost/127.0.0.1. CORS usa la misma lista de origenes.
6. Solo el bootstrap GET /api/auth/me sin identificador permite descubrir una
   sesion al abrir la pagina. No permite escrituras. Un bootstrap ya ligado a
   una identidad tampoco puede adoptar la cookie de otra cuenta.
7. Logout y cambio de clave revocan en servidor, sin Set-Cookie de borrado en la
   respuesta: una respuesta tardia no debe eliminar una cookie de login nuevo.
   La cookie revocada puede permanecer fisicamente hasta caducar o ser sustituida,
   pero ya no autoriza acceso. La misma regla se aplica a errores 401/503.
8. localStorage conserva solo metadatos existentes y un marcador de cambio no
   autenticante. Se retira la antigua clave token al iniciar la aplicacion.
   Formularios bloqueados siguen ocultos/en memoria; no se agrega autoguardado.

## Limites de entorno

Este runtime ya estaba limitado a micodent_dev, cuenta exclusiva y loopback.
La cookie usa Secure=false SOLO para el HTTP local actual. NODE_ENV=production
falla cerrado: el despliegue HTTPS, Secure, hostname propio, proxies y origenes
de la clinica requiere un paquete de despliegue aprobado, no una relajacion
automatica. No mezclar frontend localhost con API 127.0.0.1 en el navegador.
Solo se permite el origen DEV verificado http://localhost:5173. Se retira la
excepcion historica localhost:3000, sin una instalacion DEV activa verificada.
No se cambia configuracion .env, XAMPP, Windows, piloto ni laptops.

HttpOnly no elimina XSS: un script malicioso en el origen aun podria actuar
desde la sesion abierta. Tampoco protege contra malware ni servicios locales
no confiables: las cookies no se aislan por puerto. CSRF y SameSite no sustituyen
autorizacion, validacion de archivos ni los paquetes de privacidad pendientes.

## Archivos previstos y modificados

| Ruta | Motivo y riesgo |
| --- | --- |
| micodent-backend/src/services/browserTransport.js | Politica de cookie, origen, HMAC CSRF e identidad; afecta todas las solicitudes API |
| micodent-backend/src/config/browserTransport.js | Instancia de politica DEV; rechazo de modo produccion |
| micodent-backend/src/index.js | CORS coherente, control antes de parsear/API; quitar carga dotenv redundante (environment.js sigue siendo la fuente) |
| micodent-backend/src/middleware/auth.js | Cookie y vinculacion de identidad; permisos existentes sin cambios |
| micodent-backend/src/controllers/auth.controller.js | Cookie en login y contexto no autenticante en respuesta; nunca JWT JSON |
| micodent-backend/src/services/session.service.js | Version de transporte bt=2 y rechazo de JWT anterior; sin DDL ni cambio de roles |
| micodent-backend/package.json y package-lock.json | Declarar cookie 0.7.2 como dependencia directa, ya presente por Express; sin instalar ni actualizar paquetes |
| micodent-frontend/src/services/sessionState.js | Estado inicial desconocido hasta bootstrap; marcador no autenticante y CSRF en memoria |
| micodent-frontend/src/services/api.js | withCredentials y headers de identidad/CSRF, sin Bearer; rechazo de respuestas tardias |
| micodent-frontend/src/components/SessionBoundary.jsx | Bootstrap cancelable, compatible con StrictMode y validacion de cookies |
| micodent-frontend/src/pages/Login.jsx | Login con contexto de sesion, no JWT |
| micodent-frontend/src/pages/Historias.jsx | Error fijo en consola en vez de imprimir Axios con headers de sesion/CSRF; toast sin cambios |
| micodent-frontend/src/layouts/MainLayout.jsx y src/pages/MiPerfil.jsx | Cierre/cambio de clave ligados al marcador de sesion |
| micodent-backend/tests/helpers/cookie-app.cjs | App/controladores/servicio reales con DB ficticia en memoria, sin leer .env ni cargar MySQL |
| micodent-backend/tests/unit/cookie-transport.test.js | Trece pruebas nuevas de HTTP/cookies/CSRF/roles y rechazo de escrituras |
| micodent-backend/tests/unit/rotation.test.js | Token sintetico no registrado incluye version actual para mantener su cobertura |
| micodent-backend/tests/integration/security.test.js | Adaptar contrato a cookie; guardas de instancia aislada conservadas |
| micodent-backend/tests/browser-isolated.cjs | Adaptar prueba SQL/navegador a cookies y hostname coherente |
| micodent-backend/tests/browser-cookie.cjs | Siete escenarios de navegador con HTTP real y DB en memoria |
| micodent-frontend/tests/sessionState.test.mjs y browser-session.cjs | Actualizar regresiones S1-B1 al contrato de cookies |

No se alteran .env, claves, passwords reales, permisos, usuarios, migraciones,
archivos clinicos ni tablas. Las pruebas SQL existentes se adaptaron pero NO se
ejecutaron en esta intervencion. El limitador se sustituye solo en el fixture
en memoria; ese fixture no prueba persistencia ni concurrencia MySQL.

## Respaldo

F:\Respaldos\MICODENT_S1B2_20260921_164725:
codigo.zip exacto de c3ab4da, configuraciones backend/frontend, migracion S1-A
y 14 uploads, con MANIFIESTO.json y SHA-256. Total de componentes: 3.684.159 bytes
antes de manifiesto/evidencia. Diecisiete archivos protegidos sin cambios.
Respaldo privado sin contrasena conforme a instruccion vigente; no subir a GitHub.
No es un nuevo volcado SQL ni una prueba de restauracion integral. No hay
migracion ni transformacion de datos prevista en este paquete.

Se pausaron solo los procesos DEV identificados (backend 2444 y Vite 11324)
para impedir contratos incompatibles durante edicion. MySQL sigue activo.
Dos intentos de arrancar Vite aislado con variables temporales fueron bloqueados
por el entorno de ejecucion. No se eludio el bloqueo: se solicito al propietario
arrancarlo manualmente en 5174. No declarar pruebas de navegador realizadas.

## Evidencia actual y pendientes

- Backend: 41/41 pruebas correctas, incluyendo 13 nuevas con servidor HTTP real
  y almacenamiento ficticio. Se verifican atributos de cookie, ausencia de JWT
  en JSON, bootstrap, identidad, CSRF, origen, host, revocacion y errores 503.
- En una prueba se verifican 17 rutas de escritura clinica/financiera/usuarios:
  todas rechazan falta de CSRF antes de ejecutar sus controladores.
- Frontend: 18/18 unitarias correctas. Cinco pruebas de helpers S1-A se conservan;
  el transporte nuevo no utiliza Authorization ni shouldClearSession.
- Build correcto. Permanece aviso de bundle >500 kB, fuera del alcance.
- Lint focalizado de modulos centrales correcto; no certifica lint global.
- Integridad de 17 archivos y backup verificada. Sin consultas a BD activa.
- Detector local sin hallazgos segun sus reglas; repetir indice/historial antes
  de push. CI remoto pendiente de comprobar para el commit publicado.
- Navegador: pendientes 13 escenarios simulados actualizados y siete escenarios
  con cookie real. No reusar la validacion de S1-B1 como evidencia de S1-B2.
- Aceptacion funcional del propietario y activacion DEV: pendientes.

Para el navegador: Vite dedicado en 127.0.0.1:5174 con VITE_API_BASE_URL temporal
http://localhost:4402/api y VITE_API_URL http://localhost:4402. No editar .env.
Con Playwright existente en PLAYWRIGHT_PATH y Edge instalado, ejecutar desde
backend node tests/browser-cookie.cjs. El script ocupa 4402 solo durante las
pruebas y lo libera al terminar; no conecta a MySQL. Desde frontend ejecutar
node tests/browser-session.cjs para regresiones con API completamente simulada.
SESSION_SCREENSHOT_DIR permite evidencia privada sin datos reales.

## Reversion y aprobacion

Aplicar frontend y backend juntos tras completar pruebas; una copia vieja del
frontend falla cerrada, por lo que hay que recargar e iniciar sesion nuevamente.
No migrar JWT de localStorage a cookie mediante un endpoint de intercambio.
No restaurar bases, configuraciones secretas ni uploads para revertir codigo.
Conservar datos posteriores y evidencia. Volver exclusivamente a los archivos
del paquete en c3ab4da, reconstruir frontend y reiniciar ambos procesos DEV.
Eso restaura el transporte anterior, con sus limitaciones; no autoriza desplegar.

Rechazar si falta CSRF/identidad, aparece JWT en JSON/storage, se acepta una
cuenta diferente, logout tardio borra cookie nueva, hay perdida de formulario
por 503 o cambios fuera del alcance. Exigir navegador, CI, integridad y validacion
funcional correctos antes de aprobar. No fusionar ni avanzar a otro paquete.

## Referencias tecnicas

La combinacion de origen estricto, header personalizado y token ligado a sesion
sigue las recomendaciones de [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
SameSite es defensa adicional y no reemplaza CSRF; ver [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

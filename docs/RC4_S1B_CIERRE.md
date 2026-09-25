# RC4 - S1-B: cookies y sesiones por pestana

Fecha de cierre tecnico: 2026-09-25.
Base: `a14a8c5dedcecfd96a79c0ea30c5bc096c3ec477` (RC4 + S1-A + M02-A).
Rama: `codex/rc4-s1b-sesiones`. Runtime/build: `rc4-s1b-dev`.

## Estado y alcance

S1-B1/S1-B2 conciliados sobre RC4 y verificados tecnicamente en aislamiento.
No activado en el DEV habitual ni desplegado. La aceptacion funcional de esta
combinacion sigue pendiente; la aceptacion historica de S1-B1 no la sustituye.
No se modificaron .env, secretos, usuarios reales, permisos de Edy, esquema
habitual, uploads, XAMPP ni laptops. No se abrio PR ni se fusiono main.

Se incorporan las implementaciones anteriores de identidad por pestana,
cookies y CSRF, preservando las correcciones RC4 y la carrera de cambio de
contrasena resuelta en S1-A. No se repitieron auditorias completas.

## Resultado

- JWT solo en cookie HttpOnly, SameSite=Strict, host-only y Path=/api. No se
  devuelve en JSON ni se guarda en localStorage. El token legacy se retira del
  almacenamiento del navegador al cargar el nuevo coordinador.
- Las sesiones nuevas usan version de transporte bt=2. Se rechaza Bearer como
  alternativa, asi como JWT previos; requiere iniciar sesion nuevamente.
- Bootstrap /auth/me verifica la identidad antes de mostrar pantallas privadas.
  Las banderas administrativas guardadas localmente no conceden acceso visual.
  Los permisos efectivos siguen siendo comprobados por el servidor.
- El contexto de cada pestana incluye identificador no autenticante y CSRF en
  memoria. Cada operacion compara la cookie con la identidad esperada; si cambia
  de cuenta, el servidor rechaza 409 antes del controlador, incluso sin aviso
  localStorage. Las escrituras requieren origen, header de cliente y CSRF.
- Una respuesta tardia no debe borrar otra sesion. Logout revoca en servidor
  sin emitir una eliminacion de cookie que pueda afectar a un login posterior.
- Un 401 vigente o un cambio de sesion bloquea la vista sin desmontar de inmediato
  el formulario. Errores 403/503/red no fuerzan un cierre indiscriminado. No hay
  autoguardado: recargar o continuar al acceso descarta trabajo no guardado.
- Se conservan normalizacion de datos, notificaciones financieras entre pestanas
  e idempotencia RC4. postOnce comprueba la identidad tambien despues del calculo
  asincrono de su clave, para no enviar datos preparados bajo otra sesion.

## Archivos

| Area y rutas | Cambio |
| --- | --- |
| Backend `src/services/browserTransport.js`, `src/config/browserTransport.js` | Cookies, origen, identidad y CSRF; politica exclusivamente DEV local. |
| Backend `src/controllers/auth.controller.js`, `src/middleware/auth.js`, `src/services/session.service.js` | Cookie en login, contexto en /me, version bt=2 y vinculacion antes del controlador. |
| Backend `src/index.js` | Limite de origen antes del parseo/API, CORS coherente y version nueva; conserva health/SPA y arranque S1-A. |
| Backend `package.json`, `package-lock.json` | cookie 0.7.2 declarada directamente; ya instalada como dependencia de Express. Sin descarga ni actualizacion. |
| Frontend `src/services/sessionState.js`, `browserSession.js`, `src/components/SessionBoundary.jsx` | Coordinador, bootstrap/reintento y bloqueo opaco e inerte de formularios. |
| Frontend `src/services/api.js`, `src/App.jsx` | Cookies/CSRF y contexto por peticion, rutas con perfil verificado; conserva rutas clinicas y produccion RC4. |
| Frontend Login, MainLayout y MiPerfil | Login/logout/cambio de clave adaptados al contexto; menus RC4 conservados. |
| Frontend `src/pages/Historias.jsx` | No imprimir el objeto Axios que podria contener headers de sesion/CSRF. |
| Frontend `vite.config.js` | Proxy conserva Host mediante changeOrigin=false para la validacion de mismo origen. |
| Backend pruebas cookie, helpers y harness hotfix/S1-A | Contrato actualizado y regresion real; browser-isolated delega al harness desechable, no reutiliza la antigua instancia fija. |
| Frontend `tests/sessionState.test.mjs` | Transiciones, respuestas tardias, bootstrap y almacenamiento no autenticante. |
| Backend scripts de empaquetado y public | Identificacion rc4-s1b-dev y build coherente; controles M02 permanecen. |

Las rutas Backend/Frontend son relativas a micodent-backend/micodent-frontend.
No cambios en sentencias de migracion ni consultas financieras/clinicas.

## Origen y limites

Se acepta el mismo origen HTTP sobre localhost/127.0.0.1, con Host local valido.
No se confia en X-Forwarded-Host. Vite conserva Host para no convertir una
solicitud legitima del proxy en una aparente solicitud de otro origen.
No se permiten todos los origenes loopback de forma indiscriminada: el origen
debe coincidir con Host; la configuracion operativa no agrega excepciones CORS.

Secure=false solo para este DEV loopback; NODE_ENV=production falla cerrado.
No es una politica de HTTPS/LAN lista para las laptops. Las cookies no se aislan
por puerto; evitar servicios locales no confiables y sesiones simultaneas de
distintas instalaciones bajo el mismo hostname. HttpOnly/CSRF no eliminan XSS.
El acceso directo a uploads sigue siendo una deuda de M03, no se cierra aqui.

## Pruebas y evidencia

| Prueba | Resultado |
| --- | --- |
| Backend/launcher completo antes del ultimo caso adicional | 71/71 |
| Transporte de cookies, incluida regresion de mismo origen | 14/14; los primeros 13 forman parte de las 71 anteriores |
| Frontend unitario | 23/23 |
| Build frontend | Correcto, 571.05 kB JS; aviso >500 kB pendiente de rendimiento |
| Lint focalizado | App, API, coordinador, hook y boundary correctos |
| MySQL 8.0.46 aislado | 22/22 escenarios integrados; 18/18 pruebas adicionales de seguridad |
| Navegador compilado | RC4 y nueve comprobaciones de sesiones correctas, sin excepciones JS |
| Navegador Vite tras correccion del proxy | RC4 y nueve comprobaciones de sesiones correctas, sin excepciones JS |
| Bloqueo responsive | Capturas 1280x720 y 390x844; formulario oculto, accion visible, sin desbordamiento |

Evidencia privada relativa al worktree:

- `.runtime/qa-1790306203456`: primera ejecucion. API/finanzas y navegador
  compilado terminaron correctamente; despues fallo el login por Vite. No se
  presenta la ejecucion entera como aprobada. Conserva capturas/PDF del build.
- La sonda sin SQL reprodujo 403 AUTH_ORIGIN_REJECTED con el proxy abreviado,
  frente al 401 de credenciales incorrectas esperado con Host conservado.
- `.runtime/qa-1790372051973`: repeticion con navegador solo DEV, sin repetir
  el navegador compilado ya aprobado. results.json, browser-results.json y
  s1a-security-tests.log acreditan los resultados finales. Incluye arranque
  real y rechazo de un checksum de migracion incorrecto en la instancia sintetica.

En navegador se probaron cookies HttpOnly, ausencia de JWT en almacenamiento,
contrasena incorrecta sin cierre, cambio de clave/revocacion, login nuevo,
logout/revocacion, 503 conservando formulario, logout entre pestanas y cambio
de cookie a otra cuenta antes del evento de almacenamiento (409 sin escritura).
La suite HTTP comprueba ademas falta/CSRF ajeno, origen/host no autorizado,
Bearer, cookies duplicadas, respuestas sin borrado tardio y 17 rutas de escritura.
Los casos de respuestas tardias/estado se verifican tambien en unitarias.

Instancias nuevas, puertos efimeros y datos sinteticos, no las BD habituales.
Se verifico el datadir antes de escribir y se cerraron procesos propios al final.
No se repitio MariaDB en este paquete: no cambia SQL; su evidencia estructural
previa no se presenta como prueba del transporte actual. El migrador operativo
MariaDB y la validacion por laptop siguen pendientes. No hay CI en esta rama.

## Activacion y reversion

No hubo activacion habitual: la referencia Git previa conserva el codigo y los
respaldos privados existentes siguen intactos. No es un nuevo backup integral.
Una activacion futura debe aplicar frontend/backend juntos, con respaldo
coordinado, esquema S1-A/finanzas previamente verificado y origen correcto.
No requiere nueva migracion por S1-B ni cambios de credenciales o permisos.
Las pestanas con frontend anterior deben recargarse deliberadamente y hacer login.

Ante regresion, detener nuevas operaciones, preservar datos y evidencia y
revertir solo este paquete de codigo de manera coordinada, sin restaurar BD
anteriores ni uploads. No descartar movimientos posteriores. Volver al transporte
Bearer implica perder proteccion; no es una solucion automatica ni permanente.
No rotar claves ni borrar sesiones/usuarios como atajo para que pase una prueba.

Cierre tecnico: implementado y probado en aislamiento. Pendientes: aceptacion
del propietario, activacion controlada, HTTPS/LAN, M03 y validacion integral.
Siguiente paquete del roadmap: archivos clinicos (M03), sin adelantar permisos
de Edy ni desplegar en las laptops.

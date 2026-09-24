# S1-A - Cierre tecnico en DEV

Fecha: 2026-09-20. Implementacion y verificacion tecnica completadas en DEV.
Aceptacion del propietario: confirmada en la conversacion el 2026-09-20.
No es una aprobacion de produccion ni del resto de los paquetes del roadmap.

## Entorno y version

- Workspace: C:\Users\Jamz\Desktop\MICODENT_DEV.
- Backend y frontend: micodent-backend y micodent-frontend dentro del workspace.
- Rama: codex/s1a-seguridad. Referencia anterior: 4af578e.
- Version posterior: commit de cierre de esta rama, registrado en la evidencia
  final del respaldo. Consultar git log -1 y git status antes de nuevos cambios.
- Node 24.14.0; MySQL 8.0.46; localhost:3306; BD micodent_dev.
- UUID autorizado: d30b3b32-6881-11f1-9cad-0250447c4405.
- Cuenta DB exclusiva: dev_micodent. No se cambiaron sus credenciales ni grants.
- Pruebas de escritura: instancia desechable 127.0.0.1:3308, con otra carpeta
  de datos y UUID 2e686779-b08b-11f1-a09d-9c6b002457fe. Nunca micodent.

## Cambios implementados

- JWT con issuer/audience/HS256 y registro de sesion servidor; se guarda el
  SHA-256 del token, no el token en claro. Permisos se leen de la BD actual.
- Cierre de una sesion y endpoint de cierre de todas las sesiones.
- Cambio personal con contrasena actual; restablecimiento administrativo con
  reautenticacion y jerarquia. Ambos revocan sesiones anteriores.
- Retirada de comparaciones de contrasenas en texto plano. Login conserva
  compatibilidad con hashes bcrypt existentes; ninguna contrasena fue rotada.
- Contrasenas nuevas: minimo 15 caracteres Unicode, maximo 72 bytes UTF-8,
  sin recortar espacios y sin aceptar valores compuestos solo por espacios.
- Se bloquea el cambio de password mediante el formulario general de usuario.
- Edicion propia conserva nivel 3; cambios de campos de seguridad revocan
  sesiones. Esto NO constituye aun la matriz integral de autorizacion M06.
- Transacciones y bloqueo coordinado de usuarios para evitar carreras entre
  login/cambio/reset. Eventos de seguridad atomicos sin secretos en el evento.
- Limites persistidos: IP 100, cuenta/login 20, reautenticacion 10 por 15 min;
  429 con Retry-After. Cuentan solicitudes, no solamente intentos fallidos.
- Frontend diferencia 401/403/503; no borra almacenamiento ajeno a MICODENT
  ni una sesion nueva ante una respuesta tardia de una anterior.
- Dependencia anadida: rate-limiter-flexible 11.2.0. Versiones existentes
  alineadas con las ya instaladas, sin actualizar sus versiones resueltas.

## Archivos principales

- Backend src/config/environment.js y db.js; src/services/password.service.js,
  session.service.js y security.js; middleware/auth.js y limitarAutenticacion.js;
  controllers/auth.controller.js y usuarios.controller.js; routes/auth.routes.js
  y usuarios.routes.js; utils/securityError.js y auditoriaSeguridad.js; src/index.js.
- Backend migrations/001_s1a.js; scripts/migrate-s1a.js y
  verify-s1a-preservation.js; tests/unit, tests/integration y browser-isolated.cjs.
- Frontend services/api.js y session.js; utils/passwordPolicy.js; Login.jsx,
  MiPerfil.jsx, AdministracionPersonal.jsx y layouts/MainLayout.jsx; tests.
- Manifiestos de dependencias, .gitignore, .gitattributes y docs.
- No se modificaron .env, uploads, modulos clinicos/financieros, secretos,
  perfil de Edy, XAMPP, servicios Windows ni instalaciones familiares.

## Respaldo y migracion

Respaldo previo completo:
F:\Respaldos\MICODENT_S1A_20260914_170755\antes

Incluye workspace con configuracion, uploads y dependencias, runtime Node,
dump DEV y manifiestos. Total: 87,160,306 bytes. Sin cifrado ni contrasena por
instruccion del propietario; contiene informacion sensible y no debe compartirse.

| Archivo | SHA-256 |
| --- | --- |
| workspace.zip | 17986f1e80335dd0d608af41a0a5a5873d86b1f5c2358a1f16e2d00242173f23 |
| node_runtime.zip | d6699752c05698e330000e1faf288ad5a153fe30eaecf3103fdc8cee804f497a |
| micodent_dev.sql | cbe48d1954f8771293f6050d547d8c3d9aed8b6756436d3bd3a7be2f7befb486 |

Migracion 001_s1a aplicada expresamente el 2026-09-20; no se ejecuta al arrancar.
Agrega usuarios.auth_version y cuatro tablas InnoDB: micodent_migrations,
seguridad_sesiones, seguridad_eventos y seguridad_intentos. Resultado: 28 tablas.
SHA-256 de la migracion:
ef030df9074b8337333569f8c03411087d6ab6effbe9471ce1ca286459b72c26.
.gitattributes conserva sus bytes para evitar alterar el checksum por CRLF/LF.

Se verificaron hashes del respaldo y contenido logico de las 24 tablas antes y
despues. Se conservaron los 104 registros originales, incluidos usuarios,
contrasenas y roles. Se verificaron 16 archivos protegidos de DEV (.env/uploads).
La repeticion del verificador devolvio already_applied, sin volver a ejecutar DDL.
No se importo database/micodent.sql ni se consulto la BD original micodent.

## Pruebas y resultados

| Bateria | Resultado |
| --- | --- |
| Backend unitario | 5/5 |
| Frontend unitario | 5/5 |
| Integracion contra MySQL aislado | 17/17 |
| Navegador Edge automatizado | 5 grupos aprobados |
| Vite build | Correcto; advertencia de chunk JS de 544.51 kB |
| ESLint de nuevos helpers frontend | Correcto |
| npm ci backend en carpeta limpia, offline, sin scripts | Correcto; 135 paquetes |
| Migracion real DEV y repeticion de comprobacion | Correctas; datos previos conservados |

Integracion cubre tokens invalidos/antiguos/expirados/no registrados, permisos
actuales, usuario inactivo, logout individual/global, password/reset, bypass de
edicion, nivel 3, creacion, carreras, rollback por fallo de auditoria, BD caida,
limites persistentes en otro proceso y contratos GET de pacientes, historias,
usuarios, doctores, dashboard, agenda, gastos, laboratorio y auditoria financiera.

Navegador: login desktop/movil y logo; cambio de password y revocacion; error
503 al salir sin falso cierre; logout real y limpieza selectiva; sin excepciones
JavaScript. Las capturas de perfil usan cuenta sintetica. No se probaron aqui
todas las escrituras clinicas, impresion ni toda la accesibilidad: pertenecen
a la regresion integral M28 y no se dan por aprobadas.

Evidencia: carpeta verificacion junto a antes, incluyendo integration.log,
browser-results.json, capturas y preservacion-dev-20260920.json.

## Diferencias y limitaciones registradas

- Las carpetas originales del Escritorio YA NO coinciden con la referencia del
  14 de septiembre: 283 diferencias backend y 5 frontend. Entre ellas figuran
  index.js/db.js y build con fechas del 16 de septiembre. No se restauraron ni
  se modificaron para ocultar diferencias. Esta comparacion no atribuye autoria.
- El verificador genero su informe y devolvio codigo de salida no cero por esa
  diferencia del piloto; sus verificaciones de BD/configuracion/uploads DEV
  fueron satisfactorias. No confundir esto con perdida de datos en DEV.
- Tokens aun en localStorage: cookies/CSRF quedan para S1-B. No afirmar que
  M05 completo o la seguridad de produccion estan resueltos.
- Uploads publicos, permisos completos, eliminacion de usuarios y auditoria
  general siguen pendientes de sus paquetes; no fueron corregidos aqui.
- Hay expiracion logica de limites/sesiones, pero no purga periodica automatica
  de filas. Definir retencion y mantenimiento antes de produccion.
- No hay comprobacion de contrasenas filtradas ni cambio de algoritmo bcrypt.
- Protecciones deliberadas limitan este codigo a DEV. MariaDB y V3 requieren
  su integracion y pruebas independientes; consultar V3_INTEGRACION.md.
- Primer intento de navegador requirio usar Edge instalado por ausencia de
  Chromium de Playwright. No se descargo otro navegador.

## Uso y aceptacion

Iniciar desde MICODENT_DEV, no desde las carpetas originales. Backend con
npm start; frontend de desarrollo con npm run dev. URL habitual de DEV:
http://localhost:5173. Vite no formara parte del futuro runtime clinico V3.
No se crearon servicios ni tareas de arranque.

Las sesiones anteriores a S1-A requieren iniciar sesion otra vez. Las
contrasenas existentes siguen siendo las mismas; la politica nueva se aplica
al crear o cambiar una contrasena. El propietario debe comprobar acceso,
lectura de pacientes/historias y su flujo habitual antes de aceptar el paquete.

## Reversion controlada

1. Rechazar si falla login de cuentas validas, se pierden datos/permisos, aparece
   exposicion de secretos o regresion funcional atribuible a S1-A.
2. Cerrar solamente procesos DEV, coordinar usuarios y registrar la version.
3. Crear OTRO respaldo completo del estado posterior, incluidos nuevos datos,
   uploads y eventos. Nunca restaurar ciegamente el dump anterior.
4. Preferir corregir hacia delante o dejar DEV temporalmente cerrado. Volver al
   backend anterior restaura debilidades de sesion y no es una recuperacion
   segura para uso normal; solo considerarlo en entorno aislado, sin acceso de
   usuarios, con autorizacion expresa y nueva evaluacion.
5. Para diagnostico aislado, reconstruir codigo desde el commit 4af578e o el
   workspace.zip; conservar .env/uploads actuales separadamente, sin sobrescribir.
   Las adiciones de esquema pueden permanecer: no se requiere DROP ni reducir
   auth_version para una reversion de archivos. Conservar la auditoria.
6. Si el DDL queda parcial, detenerse y analizar; MySQL hace commits implicitos.
   El script no borra automaticamente estructuras para intentar corregirlo.
7. Si realmente se necesita recuperacion de datos, restaurar primero en otra
   instancia, comparar y reconciliar cambios posteriores. Nunca perder datos
   nuevos por recuperar una version de codigo.
8. Repetir las pruebas antes de reabrir. No promover una version insegura a las
   laptops ni modificar Edy como parte de una reversion.

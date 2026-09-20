# MICODENT - Manejo de secretos y exportaciones de codigo

## Alcance M02-A

Contencion en MICODENT_DEV, sin rotaciones ni cambios de BD, usuarios, roles,
servicios o instalaciones familiares. S1-A fue aceptado por el propietario.
Los secretos activos permanecen en el .env privado existente. Las plantillas
.env.example contienen campos vacios para credenciales y nunca deben sustituir
la configuracion de una instalacion que ya funciona.

backend_completo.txt y frontend_completo.txt eran exportaciones auxiliares
creadas para consultar con una IA; no dependencias del runtime. El propietario
autorizo eliminarlas de DEV. Sus originales quedaron en el respaldo privado
M02-A. No se alteraron copias del piloto, simulacro ni respaldos anteriores.

actualizar-credenciales.js quedo como aviso deshabilitado, sin importar mysql,
bcrypt ni dotenv y sin ejecutar SQL. No ejecutar su version antigua desde un
respaldo. Los cambios de contrasena deben usar los flujos autenticados de S1-A.

## Variables

| Ubicacion | Variable | Tratamiento |
| --- | --- | --- |
| Backend .env | DB_PASSWORD | Secreto privado de la cuenta DB de esta instalacion. |
| Backend .env | JWT_SECRET | Secreto privado de firma; independiente por entorno en la futura rotacion. |
| Backend .env | DB_HOST, DB_PORT, DB_NAME, DB_USER, PORT, JWT_EXPIRES_IN | Configuracion; no copiar ciegamente entre instalaciones. |
| Frontend .env | VITE_API_BASE_URL | URL publica REST con /api. |
| Frontend .env | VITE_API_URL | URL publica de origen para archivos clinicos; sin /api. |

La coexistencia de ambas URL refleja el codigo actual y no se modifica en
M02-A. V3 resolvera configuracion por instalacion y mismo origen. VITE_* no es
un lugar para secretos: sus valores usados por el frontend pueden incluirse
en el JavaScript servido al navegador.

## Verificacion local

Desde micodent-backend:

```powershell
npm run security:check
npm run security:history
```

El primer comando revisa archivos de trabajo, build, logs de DEV y contenido
del indice Git. El segundo anade el historial Git local disponible. Ambos
comparan en memoria los secretos del .env backend; nunca los imprimen ni los
envian a un servicio externo. No consultan MySQL ni acceden a las laptops.
Requieren que el .env privado de este DEV este disponible como referencia.

GitHub CI utiliza --patterns-only de forma explicita, sin recibir secretos de
instalaciones. Su reporte indica knownSecretComparison=false. Ese modo no
sustituye la comparacion local de secretos conocidos antes de compartir.

Salida 0: sin coincidencias para las comprobaciones efectuadas.
Salida 1: hallazgos que necesitan revision; no compartir ese artefacto.
Salida 2: comprobacion incompleta; no interpretarla como una aprobacion.
La salida solo incluye rutas, lineas, reglas y conteos, sin fragmentos de codigo.

El backend tiene private=true para impedir publicacion accidental con npm.
prepack ejecuta la comprobacion con historial, pero NO instala un hook de Git
ni configura CI. Copiar una carpeta manualmente no ejecuta este control.

## Compartir codigo con una IA o colaborador

1. Revisar git status. No exportar una version anterior o distinta a la revisada.
2. Ejecutar los dos comandos de seguridad y comprobar la salida.
3. Preparar un commit revisado sin configuracion privada ni datos clinicos.
4. Con el arbol limpio, generar un archivo de codigo con git archive, no un ZIP
   de toda la carpeta del Escritorio. Guardarlo fuera del workspace en una ruta
   nueva para evitar sobrescrituras.
5. Extraerlo en un destino temporal nuevo y comprobarlo desde el backend DEV:

```powershell
node scripts/check-secrets.js --artifact "RUTA_ABSOLUTA_DE_LA_COPIA_EXTRAIDA"
```

6. Revisar tambien datos personales y clinicos antes de compartir: este detector
   NO es un anonimizador ni certifica ausencia de informacion de pacientes.

No incluir .env, volcados SQL, uploads, logs, copias completas, credenciales
de prueba privadas o claves. Los .env.example vacios si son compartibles.
Los artefactos de codigo son distintos del paquete de despliegue V3: este ultimo
necesitara dependencias, build y configuracion propia preparada por instalacion,
sin reutilizar datos ni secretos de DEV.

## Limites de la comprobacion

- Detecta copias exactas de los secretos conocidos y patrones seleccionados de
  credenciales, JWT, claves privadas y URL con credenciales.
- No demuestra ausencia de toda credencial desconocida, partida, codificada,
  cifrada, comprimida, renombrada o incrustada en contenido binario.
- No inspecciona datos de uploads ni contenido de node_modules; en un artefacto
  de codigo marca esas carpetas como no permitidas.
- No consulta repositorios remotos, archivos compartidos anteriormente ni otras
  instalaciones. No reescribe Git y no borra hallazgos automaticamente.
- Las credenciales sinteticas de las pruebas S1-A no son credenciales reales.
  No se excluye de la comparacion de valores conocidos toda la carpeta tests.

## Respaldo privado

F:\Respaldos\MICODENT_M02A_20260920_115352\antes conserva los archivos previos,
incluidas las exportaciones auxiliares y configuraciones privadas, con hashes
verificados. No es un paquete para compartir con una IA. No esta cifrado ni
protegido por contrasena por instruccion del propietario; necesita custodia
privada. No se cambiaron permisos Windows ni se borraron respaldos existentes.

Este respaldo es de archivos para M02-A, no sustituye el respaldo completo de
BD + uploads + configuracion + codigo realizado en S1-A.

## M02-B: rotacion pendiente y autorizada por separado

Quitar una copia del workspace NO revoca una clave que ya pudo ser compartida.
Antes de produccion, identificar en privado las instalaciones que comparten
credenciales y las exportaciones que salieron del equipo. No publicar valores.

1. Inventariar entorno, cuenta DB, clave JWT, servicios y version por instalacion.
2. Ensayar el cambio en una copia; respaldar y coordinar una ventana controlada.
3. Generar secretos aleatorios localmente y guardarlos sin mostrarlos en chat,
   comandos, capturas o logs. No emplear una contrasena de ejemplo compartida.
4. Cambiar una instalacion por vez y verificar acceso a BD y login. Cambiar la
   clave JWT invalida sus tokens anteriores: informar que deben iniciar sesion.
5. La cuenta DB requiere coordinacion entre MySQL y .env; nunca cambiar solo
   uno y declarar la instalacion lista. No reusar credenciales DEV en laptops.
6. Definir recuperacion sin volver automaticamente a un secreto comprometido.
   Preferir otra credencial nueva y un procedimiento probado de recuperacion.
7. Registrar version y resultado sin los valores. La rotacion no elimina la
   informacion sensible conservada en respaldos historicos.

M02-A reduce exposicion accidental, pero M02 no queda completamente cerrado
hasta resolver la rotacion y la custodia por instalacion.

## Referencias

- https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- https://vite.dev/guide/env-and-mode

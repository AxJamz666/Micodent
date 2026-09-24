# V3 - Integracion controlada del despliegue local

Estado: implementacion del usuario revisada en lectura el 2026-09-20;
integracion en DEV pendiente de su paquete separado. No ejecutar el simulacro
como si fuese DEV: utiliza una configuracion y una BD distintas.

## Fuentes reales revisadas

- C:\Micodent_Simulacro\iniciar_micodent.bat
- C:\Micodent_Simulacro\micodent-backend\src\index.js
- Informe V3 entregado por el propietario el 2026-09-20.

La prueba Apache apagado / MySQL encendido fue comunicada por el propietario.
No se repitio sobre su instalacion durante S1-A.

## Funcionalidades que se deben conservar

1. Build React en micodent-backend/public, servido por Express.
2. /api/ping como prueba de proceso y /api/health con SELECT 1 real.
3. Respuesta health 200/503 sin credenciales, SQL ni mensajes internos.
4. Fallback SPA despues de API y archivos estaticos.
5. Conservar src/uploads; su proteccion se resuelve con el paquete de archivos.
6. BAT relativo a su propia carpeta, con validacion de instalacion.
7. Esperas condicionales y MAX_WAIT=300 por componente, sin esperas fijas de arranque.
8. PORT y DB_PORT propios de cada instalacion; ninguna credencial en el BAT.
9. Un proceso Node para API y frontend; sin Vite ni Apache en operacion clinica.
10. Tolerancia a inicio tardio de MySQL sin eliminar los controles de S1-A.

## Diferencias y riesgos comprobados en el codigo

- DEV todavia no sirve public ni implementa /api/health. index.js de S1-A
  verifica la migracion antes de escuchar y exporta app para pruebas. NO
  reemplazarlo entero con el del simulacro: se perderian esos controles.
- La futura readiness debe diferenciar conectividad, esquema/version y build.
  SELECT 1 no demuestra que exista la migracion ni que esten sanos todos los
  modulos. No abrir trabajo clinico mientras falle cualquiera de los requisitos.
- El BAT del simulacro comprueba un puerto TCP para MySQL: eso no autentica ni
  verifica el esquema. El health posterior es necesario.
- MYSQL_HOST esta fijado a 127.0.0.1 en el BAT, aunque .env admite DB_HOST.
  Leer/validar la configuracion con dotenv; no interpretar secretos como shell.
- Los contadores del BAT suman 2 segundos por vuelta pero omiten el tiempo de
  las comprobaciones. Usar un reloj monotono para un limite real de 300 segundos.
- El BAT reutiliza cualquier servidor cuyo health tenga la forma esperada.
  Verificar identidad/version de la instalacion antes de reutilizar un puerto.
- El fallback del simulacro excluye /api/ y /uploads/, pero no sus rutas exactas
  /api y /uploads ni assets inexistentes. Probar 404 JSON/archivo; nunca devolver
  HTML con 200 para una API o un JavaScript inexistentes.
- La comprobacion de interfaz actual acepta cualquier HTTP 2xx/3xx. Verificar
  index y sus recursos, ademas de una marca de version del build.
- El simulacro registra error.message de MySQL. Usar errores saneados como S1-A.
- La API frontend de DEV todavia usa localhost:4000 por defecto. Para el build
  clinico usar /api de mismo origen, evitando fallos con PORT variable.
- El BAT no configura por si solo servicios Windows ni garantiza reinicio
  automatico tras caida. Tratar supervision e inicio de MySQL como despliegue
  por instalacion, no como una propiedad ya demostrada por el BAT.

## Compatibilidad MySQL / MariaDB

Segun el informe, la copia MariaDB cambia utf8mb4_0900_ai_ci por
utf8mb4_general_ci y elimina chk_mes_consumo_formato. No son esquemas identicos.
Evaluar comparacion/unicidad y duplicados antes de convertir collations.

En DEV, src/controllers/gastos.controller.js, crearGasto y editarGasto,
transmiten mes_consumo sin comprobar YYYY-MM. FinanzasDashboard.jsx usa
input type=month, lo cual no protege una llamada directa a la API. No se
encontraron pruebas dedicadas de este formato. Corregir y probar antes de
aceptar una entrega MariaDB: meses 01/12, rechazo de 00/13, cadenas arbitrarias,
tipos incorrectos y tratamiento explicitamente definido de null/vacio.

La migracion S1-A se verifico solamente en MySQL 8.0.46. Su guardia deliberada
exige micodent_dev/dev_micodent, UUID MySQL y la collation de usuarios observada.
No funciona como migrador general MariaDB ni debe relajarse para instalarlo
directamente en las laptops. Preparar y ensayar una migracion por motor/version.

## Criterios de aprobacion del paquete V3

- Instancia aislada con autenticacion S1-A conservada.
- Build reproducible y probado bajo PORT distinto de 4000, sin Vite.
- Navegacion directa y recarga de rutas React; API y assets ausentes dan 404.
- MySQL tardio, indisponible y recuperado; esquema incorrecto; build ausente.
- Doble clic repetido sin procesos duplicados; puerto ocupado por otra app.
- Rutas con espacios; errores sin secretos; timeout real y mensajes accionables.
- Pruebas en la version concreta de MariaDB y en equipo de recursos limitados.
- No sobrescribir .env/uploads ni importar datos DEV sobre datos de las laptops.

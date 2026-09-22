# Paquete urgente M26-A - Arranque V4

Autorizacion del propietario: 2026-09-21, para preparar sobre copia el arranque
antes de visitar las laptops. No autoriza cambiar instalaciones de Edy/Miguel.

## Alcance y aislamiento

Rama codex/arranque-v3-controlado desde bbfa059 (M02-A, PR #20). Se usa un
worktree separado dentro de MICODENT_DEV/.runtime/arranque-v3. No se incluyen
S1-B2 ni contratos nuevos de sesion en la entrega. El workspace S1-B2 conserva
su rama y estado; su validacion de navegador continua pendiente.

Archivos nuevos: operacion/arranque-v4/{iniciar_micodent.bat,
comprobar_micodent.bat,micodent-arranque.cjs,LEEME_INSTALACION.md},
operacion/tests/arranque.test.cjs y .github/workflows/arranque.yml.
Solo documentacion de seguimiento cambia adicionalmente. Ninguna modificacion
de codigo backend/frontend, permisos, Edy, .env, esquema, datos o XAMPP.

## Cambios respecto al BAT V3

- dotenv instalado en cada backend interpreta .env; puertos estrictos y host
  local. El valor por defecto MySQL es 3306, igual que db.js, no el 3307 fijo
  del BAT anterior. Un DB_PORT explicito conserva el puerto de cada laptop.
- Se rechazan variables heredadas contradictorias, NODE_OPTIONS y NODE_PATH.
- Exclusividad por carpeta mediante named pipe Windows; el SO libera el
  bloqueo al terminar/crashear el lanzador, sin borrar locks/PID de otros.
- Esperas monotonicas, conexiones acotadas y error con codigo de salida 1.
- Se comprueba propietario de puerto con Get-NetTCPConnection/Win32_Process.
  Un backend anterior iniciado con ruta relativa NO se adopta sin identificar.
- Proceso Node con ruta absoluta, argumento de revision, cwd verificado,
  detached/windowsHide/stdio ignore/unref. No npm/cmd intermediario para el
  backend y no consola accidentalmente cerrable. No se instala un supervisor.
- Reutilizacion de backend propio aunque todavia no este saludable, espera
  condicional y health final. No se matan procesos ni se reinician servicios.
- Hash exacto de index y recursos compilados locales/remotos, tipos MIME y
  rechazo de HTML en lugar de JS; incluye chunks de assets hasta 256 archivos,
  16 MiB por archivo y 64 MiB total. Builds mayores requieren otro ensayo.
- Registro acotado de eventos fijos; no persistir mensajes crudos del backend.
- Comprobacion previa sin arrancar procesos ni conectar a BD (--comprobar).

## Referencia y evidencia

Fuente V3 leida, nunca ejecutada: C:\Micodent_Simulacro.
Respaldo de seis archivos de referencia bajo
F:\Respaldos\MICODENT_ARRANQUE_V4_20260921_214657\referencia-original,
con MANIFIESTO-REFERENCIA.json y hashes. NO es un respaldo integral ni SQL.
No se copia configuracion ni datos del simulacro a la entrega.

Inspeccion local de solo lectura compatible: Node 24.14.0, puerto backend 4000,
MySQL configurado 3307 y cuatro recursos compilados; ninguna conexion MySQL.
Esto no demuestra que cada laptop use esa misma version/configuracion.

Pruebas locales: 24/24 correctas con Node 24.14.0 en Windows:
node --test operacion/tests/arranque.test.cjs. Incluyen HTTP/TCP reales
ficticios, rutas con espacios/exclamacion, fallos, bloqueo concurrente liberado
al morir el lanzador y proceso Node oculto real en Windows con identificacion,
reutilizacion y rechazo de revision/carpeta diferente. Los hijos sinteticos se
detienen al terminar; nunca los procesos del piloto o de las bases reales.
Tambien se prueba supervivencia del backend tras salir el lanzador y el BAT
real ante una instalacion incompleta. Se corrigieron durante los ensayos un
error de sintaxis, separadores URL Windows y detalles de aislamiento/limpieza
del propio harness; el resultado final corresponde a la revision corregida.
Los seis archivos originales respaldados conservan sus hashes. Comparacion
local con secretos conocidos e historial sin hallazgos segun el detector.
El worktree contiene una copia privada ignorada de .env DEV exclusivamente
como referencia del detector; no se inicia su backend y no se distribuye.

Estado: implementado para ensayo. Resultado final, hashes de entrega y CI se
registran en el PR. No aprobado/desplegado en ninguna laptop. No se proclama
que health verifique esquema ni que el paquete elimine fallos posteriores.

## Instalacion, regresion y rollback

El instructivo distribuible es
[LEEME_INSTALACION.md](../operacion/arranque-v4/LEEME_INSTALACION.md).
Exige respaldo propio por laptop, configuracion compatible, MySQL iniciando
realmente con Windows, tres reinicios y pruebas funcionales con datos previos.
Restaurar solo lanzador/acceso directo, nunca BD/uploads posteriores. Un fallo
de requisitos bloquea la entrega, no se corrige modificando datos para ocultarlo.

El alcance urgente adelanta solo una parte de E13/M26 y prepara E15/M27. No
cierra esas etapas ni cambia el orden de seguridad, integridad y permisos Edy.

## Referencias

- [Node.js child_process](https://nodejs.org/api/child_process.html): proceso
  desacoplado, windowsHide, stdio y argumentos sin shell.
- [Microsoft Get-NetTCPConnection](https://learn.microsoft.com/en-us/powershell/module/nettcpip/get-nettcpconnection): propietario de puertos.

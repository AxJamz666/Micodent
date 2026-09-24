# M02-B Resultado de rotacion JWT en DEV

Fecha: 2026-09-21. Autorizacion expresa del propietario para cambiar solo la
clave JWT de MICODENT_DEV. Base de codigo: 99d5105. Rama de seguimiento:
codex/m02b-rotacion-dev. PR #21; acceso DEV aceptado, fusion pendiente.

## Resultado y alcance

Se genero localmente una clave aleatoria de 64 bytes y se sustituyo unicamente
JWT_SECRET en micodent-backend/.env. No se imprime ni se versiona ese valor.
La configuracion nueva se verifico en lectura. Los tokens de la generacion
anterior no son aceptados por la firma nueva; es necesario iniciar sesion.

No hubo cambios en codigo de runtime, dependencias, DB_PASSWORD, usuarios,
roles, permisos de Edy, esquema, datos clinicos ni archivos de las laptops.
No se ejecutaron migraciones, escrituras SQL, scripts antiguos de credenciales,
reinicios MySQL/XAMPP, ni cambios del arranque automatico de Windows.

## Respaldo privado

Ubicacion: F:\Respaldos\MICODENT_M02B_JWT_DEV_20260921_112212.

- antes/backend.env y antes/frontend.env: configuracion previa privada.
- antes/codigo.zip: codigo exacto de 99d5105, generado desde Git.
- antes/uploads: 14 archivos clinicos originales de DEV copiados sin cambios.
- antes/MANIFIESTO.json: fecha, equipo, version, runtime, hashes, tamanos,
  inventario y estado de la instancia consultada exclusivamente en lectura.
- verificacion: ensayo, evidencia de aplicacion, comprobaciones y logs de
  arranque. backend-nuevo.env es una copia privada verificada de la nueva
  configuracion, util para recuperar una escritura interrumpida.

Diecisiete archivos respaldados, 3.665.481 bytes antes de manifiesto y evidencia.
Lectura y SHA-256 comprobados. Respaldo sin cifrado por instruccion vigente;
contiene secretos y archivos clinicos, NO es material publicable.
No contiene un nuevo volcado SQL ni sustituye el respaldo integral anterior.
Este paquete no modifica datos ni necesita restaurar una BD para recuperarse.

## Comprobaciones realizadas

| Comprobacion | Resultado |
| --- | --- |
| Entorno | Ruta DEV real, rama esperada y trabajo limpio antes de aplicar |
| Procesos previos | Sin backend/frontend MICODENT activos; puertos 4000/5173 libres |
| Configuracion heredada | No habia variables de proceso, usuario o equipo sustituyendo las claves examinadas |
| Instancia DB | localhost:3306, micodent_dev, dev_micodent; UUID esperado verificado |
| Migracion S1-A | Verificada como aplicada; no se ejecuto |
| Tablas | 28 InnoDB; conteos previos y posteriores iguales |
| Usuarios | Comparacion agregada en memoria: credenciales, auth_version, activo, rol, nivel e is_admin iguales |
| Archivos | 14 uploads y sus hashes iguales; configuracion frontend y migracion intactas |
| Otros entornos locales | .env del piloto y del simulacro con hashes iguales; solo lectura |
| Archivo .env DEV | Solo JWT_SECRET cambia; ACL Windows sin cambios |
| Ensayo de sustitucion | 36 comprobaciones con contenido sintetico; formato, duplicados y contencion |
| Unitarias | Backend 28/28 y frontend 5/5, repetidas antes de aplicar |
| Criptografia | Firma antigua rechazada y firma nueva verificada con configuracion efectiva |
| API | Ping 200; /api/auth/me sin token, con sonda antigua o sonda nueva no registrada: 401 |
| Frontend | HTTP 200 en localhost:5173 |
| Revision de secretos | Workspace, indice e historial local examinados contra valores actuales y anteriores; sin hallazgos segun reglas |
| Login con cuenta real | El propietario confirma acceso con la cuenta habitual de Miguel el 2026-09-21; no se solicitaron contrasenas |

Las consultas se ejecutaron dentro de transacciones de solo lectura sobre DEV.
Los conteos no prueban igualdad de todo el contenido clinico: no se realizo
un hash completo de cada fila clinica ni una restauracion en este paquete.
Las sondas JWT son sinteticas; no equivalen a validar una sesion real guardada.
La prueba unitaria correspondiente comprueba ese caso con almacenamiento en
memoria. No se introdujeron cuentas o sesiones de prueba en la BD de DEV.

## Incidencias de la comprobacion

El primer lanzamiento del ensayo no resolvio la extension .cjs del helper;
se corrigio antes de aplicar y las 36 comprobaciones pasaron.
La primera comprobacion HTTP no completo inmediatamente despues de iniciar
los procesos; al verificar su disponibilidad se repitieron las sondas.
El helper privado de escaneo historico eliminaba el salto final de los blobs,
lo que incumplia la comparacion exacta del aviso de la herramienta deshabilitada.
Se corrigio la lectura para conservar los bytes de texto y se repitio el
escaneo sin hallazgos. No se excluyeron archivos ni se debilitaron las reglas.
Estas incidencias no requirieron revertir la clave ni modificar la aplicacion.

## Inicio y recuperacion

Se iniciaron un backend DEV nuevo y Vite en segundo plano, sin ventanas de
terminal y sin alterar servicios ni configuracion persistente del equipo.
URL de prueba: http://localhost:5173. No representa el despliegue clinico final.
Los procesos leen la configuracion nueva; no habia valores heredados que
sustituyeran el .env. Un proceso antiguo conservaria su clave hasta reiniciarse.

Si aparece un fallo, conservar configuracion y evidencia actuales y diagnosticar
sin restaurar la BD ni los uploads. No recuperar automaticamente backend.env
anterior: reintroduciria una clave expuesta y podria reactivar sesiones.
Para un archivo incompleto, comparar y recuperar la copia nueva verificada;
si es necesario cambiar de nuevo la clave, generar otra y verificar el acceso.
No descartar datos ingresados despues de la intervencion.

## Pendientes y criterio de cierre

- Aceptacion recibida: el propietario confirma login habitual de Miguel en DEV
  y solicita continuar. Es evidencia reportada por el usuario, no una prueba
  automatizada de todos los flujos clinicos.
- Mantener #19 abierto: piloto y simulacro conservan la clave anterior, y las
  laptops no se inspeccionaron ni modificaron. La rotacion DEV no remedia esos
  entornos ni las copias historicas expuestas.
- La rotacion de credenciales MySQL, cuando corresponda, requiere analisis de
  consumidores y coordinacion independiente; no esta incluida aqui.
- Verificar CI del commit final; no confundir CI con login clinico, restauracion
  probada, aceptacion del propietario o autorizacion para desplegar.
- S1-B autorizado para continuar en DEV; sin autorizacion de fusion o despliegue.

Estado: rotacion JWT aplicada solo en DEV y verificada tecnicamente;
acceso funcional confirmado por el propietario. No se declara finalizada toda
la etapa M02 ni aprobados los flujos clinicos completos.

# M02-B - Rotacion JWT limitada a DEV

## Estado y alcance

Preparacion iniciada el 2026-09-20. El 2026-09-21 el propietario confirmo
expresamente el cambio JWT solo DEV y se aplico la rotacion. Comprobaciones
tecnicas correctas; login habitual de Miguel confirmado por el propietario
el 2026-09-21 con solicitud de continuar S1-B en DEV.
No se cambio la contrasena MySQL ni se intervinieron otras instalaciones.
Evidencia y limites: M02B_RESULTADO_DEV.md. La etapa global M02 sigue abierta.

Base: bbfa059 (M02-A). Rama: codex/m02b-rotacion-dev, dependiente del PR #20.
No fusionar ni desplegar automaticamente. Seguimiento: issues #3 y #19.
PR preparatorio en borrador contra codex/m02a-secretos para aislar su diff.
Tras aceptar/fusionar #20, retarget a codex/mejoras-integracion y repetir CI.

## Inventario previo verificado en lectura

- Workspace: C:\Users\Jamz\Desktop\MICODENT_DEV.
- Backend: micodent-backend; entrada src/index.js.
- Configuracion privada: micodent-backend/.env.
- Destino configurado: localhost:3306, micodent_dev, cuenta dev_micodent.
  Esta observacion del archivo no sustituye la comprobacion de instancia real.
- Puerto API configurado: 4000. No habia API ni frontend escuchando en 4000/5173
  al comprobar. Repetir inventario de procesos y puertos antes de intervenir.
- Clave JWT: coincide con los .env del piloto del Escritorio y del simulacro
  C:\Micodent_Simulacro. Comparacion en memoria, sin mostrar valores.
- La cuenta/configuracion DB de esas copias no coincide con DEV; no se ha
  comprobado su uso en vivo ni la configuracion de las laptops familiares.

Cambiar JWT solo en DEV no altera las otras copias ni resuelve su exposicion.
La contencion global sigue pendiente. No declarar cerrado M02 ni el issue #19.

## Archivos y efectos

| Archivo | Accion | Riesgo |
| --- | --- | --- |
| micodent-backend/tests/unit/rotation.test.js | Nuevas pruebas con servicio real y almacenamiento simulado en memoria | Sin acceso a datos reales; no prueba MySQL |
| docs/M02B_ROTACION_DEV.md | Procedimiento, dependencias y evidencia | Documentacion solamente |
| docs/RUTA_MAESTRA.md y docs/ESTADO_FASES.md | Actualizar avance sin declarar rotacion completada | Documentacion solamente |
| micodent-backend/.env | Solo despues de confirmar: sustituir unicamente JWT_SECRET | Todos los JWT previos de DEV dejan de ser aceptados por procesos nuevos |

No modificar DB_PASSWORD, cuenta MySQL, usuarios clinicos, permisos, migracion,
uploads, configuracion frontend, piloto, simulacro, XAMPP ni laptops.
No requiere migracion, DELETE, UPDATE, cambio de auth_version ni borrado de
sesiones: las firmas antiguas se rechazan antes de consultar los usuarios.

## Secuencia operativa autorizable

1. Confirmar cambio JWT solo DEV y necesidad de iniciar sesion nuevamente.
2. Comprobar rama/version, ausencia de cambios ajenos y F:\Respaldos disponible.
   Identificar procesos DEV, configuracion heredada y archivos .env alternos;
   no basta comprobar que el puerto este libre. Coordinar cierre del backend
   si aparece activo; no detener procesos desconocidos ni el servicio MySQL.
3. Crear carpeta unica M02B bajo F:\Respaldos. Guardar .env previo, referencia
   exacta de codigo, inventario de uploads y hashes, configuracion frontend y
   manifiesto. Copias sensibles sin contrasena por instruccion vigente; no subir.
   Verificar lecturas/hashes. Un backup de configuracion NO es un backup de BD.
   No hay cambios de datos previstos. Cualquier ampliacion a cambios de BD
   requiere nuevo alcance y respaldo integral antes de ejecutarla.
4. Probar sustitucion en una copia privada del .env; exigir una unica asignacion
   JWT_SECRET, preservar el resto byte a byte y comparar con dotenv.parse.
   Rechazar archivos enlazados, formatos ambiguos o cambios concurrentes.
5. Generar localmente una clave criptografica aleatoria de 64 bytes, sin pasarla
   como argumento, imprimirla o incluirla en Git. Verificar que sea diferente.
   Ensayar firma nueva, rechazo de firma anterior y recuperacion con tercera
   clave sin usar identidades reales. No admitir ambas claves en paralelo.
6. Tras confirmacion y respaldo, sustituir solo JWT_SECRET de DEV, comprobar
   que ninguna otra variable cambio y preservar el archivo privado fuera de Git.
7. Iniciar una instancia nueva del backend DEV con configuracion correcta.
   environment.js usa dotenv sin override: una variable heredada puede ganar
   sobre .env. No declarar rotacion efectiva sin comprobar el proceso nuevo.
   Validar instancia/schema en lectura y migracion aplicada, sin ejecutarla.
8. Verificar API: firma anterior rechazada, rutas protegidas sin token -> 401;
   comprobar login real con el propietario sin solicitar contrasena en chat.
   Un ping, una firma sintetica o las pruebas en memoria NO prueban login real.
   Si falta esa comprobacion, dejar aceptacion funcional pendiente.
9. Verificar hashes e inventario protegido; documentar exclusivamente estado,
   fecha, version y resultados. Escanear codigo/historial contra clave nueva Y
   anterior en memoria: cambiar el .env no debe ocultar filtraciones antiguas.
10. Commit/push de pruebas y documentacion, nunca del .env ni de respaldos.
    Comprobar CI, abrir/actualizar PR y esperar aceptacion. No iniciar S1-B.

## Pruebas y criterios

Se agregan seis pruebas unitarias del servicio actual:

| Prueba | Resultado exigido |
| --- | --- |
| JWT registrado con clave anterior | 401 antes de leer datos de usuario; no borrar sesiones |
| Login nuevo y recreacion del servicio | Sesion valida; password, rol, nivel y auth_version intactos |
| Proceso con configuracion antigua | Demuestra que sigue aceptando su clave; requiere reinicio controlado |
| Restauracion de clave antigua | Demuestra reactivacion posible; prohibir ese rollback |
| Recuperacion con tercera clave | Rechazar ambas generaciones anteriores y aceptar login nuevo |
| Firma nueva sin registro de sesion | 401; la rotacion no evita la comprobacion S1-A en BD |

Ejecutar npm test en backend y frontend y los escaneos locales antes de subir.
CI no usa claves locales. Pruebas unitarias no equivalen a prueba operativa,
compatibilidad MariaDB ni validacion de las laptops.

Resultado de preparacion del 2026-09-20: 28/28 unitarias backend (seis nuevas) y 5/5 frontend.
No se accedio a MySQL, no se inicio/reinicio ningun servicio y no se cambiaron
claves ni configuracion activa. Escaneo local sin hallazgos segun sus reglas;
el resultado remoto se registra en el PR. Esto describe la preparacion, no la
intervencion posterior del 2026-09-21 documentada en M02B_RESULTADO_DEV.md.

## Recuperacion y rechazo

Si falla antes de reemplazar: detener, conservar evidencia y configuracion
activa. Si falla despues: mantener DEV fuera de servicio hasta identificar
causa. Recuperar solo configuracion no secreta necesaria y usar otra clave
nueva si procede; nunca volver automaticamente a la clave expuesta.

No restaurar BD, uploads ni copias completas para revertir JWT. Conservar
datos nuevos, registros de sesiones y auditoria. No ejecutar scripts antiguos
de credenciales. Si la causa exige cambiar DB o permisos, detener y solicitar
un paquete separado. No ocultar fallos con un fallback de claves antiguas.

Rechazar cierre si se altero otro entorno, falta respaldo verificado, hay
diferencias no previstas, el proceso usa otra clave, una sesion anterior es
aceptada, el login nuevo falla o quedan pruebas operativas sin realizar.

La aprobacion eventual de JWT en DEV no aprueba rotacion MySQL, limpieza de
copias externas ni despliegue familiar. Planificarlos por instalacion.

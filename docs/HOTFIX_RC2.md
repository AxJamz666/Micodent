# MICODENT - Revision RC2 del hotfix

Fecha: 2026-09-23. Revision solicitada tras la prueba de RC1.
Conserva las restricciones y pendientes de seguridad/despliegue de HOTFIX_RC1.md.
No modifica BD habituales, permisos de Edy, archivos originales ni instalaciones familiares.
No se envia nada a GitHub. La entrega RC1 permanece disponible sin sobrescribir.

## Firma y sello

- Recetas, ordenes Rx y reporte de historia usan el mismo bloque.
- Con sello PNG: solo imagen de firma e imagen de sello, sin linea, nombre,
  especialidad ni COP generados debajo de esa imagen.
- Sin sello: linea y texto con nombre, especialidad y COP disponibles.
- La firma se coloca inmediatamente encima del sello (separacion de 2 px).
- Se recortan los margenes TRANSPARENTES solo en la representacion de pantalla
  e impresion; no se modifica el PNG ni la firma almacenada. No se borra fondo opaco.
- Una imagen rota no se sustituye silenciosamente por una firma inventada.

Archivos: `micodent-frontend/src/components/FirmaMiniBlock.jsx`,
`RecetarioTab.jsx`, `OrdenRadiografiaTab.jsx`, `src/pages/Historias.jsx`, `src/index.css`.

## Comisiones: comprobacion de los tres ejemplos

No se encontro un error aritmetico en esas filas. La regla acordada recupera
primero el costo externo y calcula la comision sobre el resto del abono.

| A cuenta | Costo externo descontado | Base | Porcentaje | Comision | Ganancia clinica |
| --- | --- | --- | --- | --- | --- |
| 80.00 | 40.00 | 40.00 | 30% | 12.00 | 28.00 |
| 80.00 | 70.00 | 10.00 | 30% | 3.00 | 7.00 |
| 60.00 | 60.00 | 0.00 | 25% | 0.00 | 0.00 |

La primera fila pertenece a un ensayo donde el porcentaje cambia de 25 a 30;
el segundo ejemplo historico simula costo total 100 y recuperacion previa
confirmada de 30, por eso quedaban 70. Son datos de ensayo, no datos de la clinica.
No se alteraron porcentajes ni importes para hacer coincidir una expectativa distinta.
Se agregaron pruebas de estas filas y de conservacion exacta de centimos:
costo externo + comision + ganancia clinica = abono.

"Costo aplicado" ahora es "Costo externo descontado": parte de ese abono destinada
a recuperar laboratorio/Rx. "Margen clinico" ahora es "Ganancia clinica": queda
despues de esos costos y de la comision, PERO antes de gastos generales. No representa
necesariamente el saldo de caja. Los gastos se descuentan en el resultado neto general.

## Dashboard

- Nueva pestana "Produccion y comisiones por personal" junto a Resumen, Gastos y Laboratorio.
- Mantiene permisos backend: administracion ve todos; doctor solo su produccion.
- "Presupuesto" pasa a "Costo total" y "Abono" a "A cuenta".
- Comision queda seguida de Ganancia clinica; el costo externo se muestra antes,
  y la base comisionable debajo del importe de comision para los movimientos nuevos.
- Encabezados adaptados para laptops y tabla con desplazamiento interno en movil.
- Por solicitud posterior del propietario, se elimina el acceso de produccion del
  menu de perfil administrativo: queda solo dentro de Dashboard Financiero.
  El doctor no administrador conserva "Mi produccion", limitado a sus movimientos.
- El boton de perfil tiene nombre accesible y estado expandido, independientes del
  nombre editable del usuario. Se comprueban por separado los menus admin y doctor.

Archivos: `src/pages/Produccion.jsx`, `FinanzasDashboard.jsx`, `src/layouts/MainLayout.jsx`
del frontend. No se cambiaron las formulas backend por esta revision.

## Ordenes Rx y mapas

Se conservaron los dos mapas originales Base64 de `centros_referencia` del SQL
compartido: Centro Huancayo y San Carlos, confirmados por el propietario.
Base64 no implica por si solo una impresion en blanco; no se migro ni sobrescribio
el almacenamiento. En la demo RC1 faltaba sembrar el catalogo de referencia.
El ensayo RC2 incorpora SOLO ese catalogo en su instancia nueva, no pacientes reales.

- Cada mapa se mantiene unido al nombre/direccion de su local.
- La impresion espera a que terminen de decodificarse imagenes y fuentes.
- Se usa la vista actual, no una pagina/popup vacio.
- Si faltan registros/mapas o falla la API, aparece un aviso y no se habilita imprimir.
- Si una imagen no carga, se muestra error en lugar de imprimir un documento incompleto.
- Para una laptop cuya BD no contenga los dos registros, hace falta reparar el catalogo
  en un paquete controlado con respaldo. Este hotfix NO inventa mapas ni rellena su BD.
- La vista/impresion del navegador con Ctrl+P no sustituye las comprobaciones del boton
  Imprimir de la aplicacion.

Archivos: `src/components/OrdenRadiografiaTab.jsx`, `RecetarioTab.jsx`,
`src/utils/printDocument.js` y estilos de impresion existentes.

## Verificacion

- 29 pruebas backend/launcher y 3 de formatos frontend aprobadas.
- 13 escenarios de integracion aprobados en MariaDB y MySQL aislados.
- Build correcto; lint de los cinco archivos frontend centrales de esta revision correcto.
- Navegador Edge en DEV y build Express: sellos con/sin PNG, historia, receta, dos mapas
  Rx cargados, boton de imprimir sin navegacion en blanco, bloqueo sin mapas,
  dashboard integrado y etiquetas aprobados. No hubo excepciones JS observadas.
- Firma dibujada en la interfaz, margen transparente recortado y distancia de imagenes
  comprobados. Vista movil sin desbordamiento horizontal de pagina.
- PDF Rx A4 de una pagina inspeccionado visualmente: ambos mapas legibles y sin cortes.
- No se probo una impresora fisica ni la laptop de Edy; no se garantiza comportamiento
  de todos los navegadores/controladores de impresion.

Evidencia: `.runtime/qa-1790208142778` (MariaDB, DEV, BUILD, capturas, PDFs),
`.runtime/qa-1790208177616` (MySQL). Los intentos previos no sustituyen estos resultados.

Revalidacion del menu y del conjunto completo, posterior al bloqueo de disco:
`.runtime/qa-1790223160244`. DEV y BUILD aprobados, con pruebas explicitas de menu
administrativo sin acceso duplicado y menu de doctor con produccion propia.
Los ensayos anteriores interrumpidos por espacio o por un selector dependiente
del nombre editable del usuario no se cuentan como aprobados.

## Entrega y continuidad

Sin nuevas migraciones respecto a RC1. Requiere la migracion incremental 001 completa
si se activa sobre una copia que aun no la tiene. No aplicarla sobre una BD original
sin el procedimiento de respaldo/validacion descrito en HOTFIX_RC1.md.
El paquete excluye .env, BD, uploads, dependencias instaladas y runtime.
Los mapas del catalogo se conservan en cada BD; respaldarlos junto con ella.
Queda pendiente integrar S1-A/S1-B y validar los incidentes originales con registros
representativos antes de aprobar el despliegue real. RC2 no se declara ESTABLE de clinica.

## Prevencion de falta de espacio en pruebas

El runner comprueba espacio antes de crear otra instancia: al menos 1 GiB para
MariaDB y 2 GiB para MySQL. Redacta tambien contrasenas de los errores del
inicializador de pruebas. Estos cambios solo afectan las pruebas, no el launcher
ni las configuraciones clinicas. La limpieza automatica anterior no se ejecuto;
no se eliminaron bases de datos de usuarios ni carpetas completas de trabajo.

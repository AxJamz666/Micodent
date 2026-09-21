# Revision del alcance academico de MICODENT

Fecha de revision: 2026-09-20.
Entrega: Formato_09_MICODENT_Corregido.docx, en esta carpeta.
Documento academico; no cambia configuracion, permisos, datos ni servicios.

## Evidencia y correcciones

- Se conservaron las siete secciones, el encabezado institucional y los datos
  academicos aportados en el borrador. Los dos archivos fuente no se modificaron.
- Los roles reales son Doctor, Administradora y Asistente; los privilegios
  administrativos tambien dependen de nivel e is_admin. No se atribuyeron
  facultades clinicas nuevas al perfil de Edy.
- Se separo la operacion local de la conexion a internet. XAMPP no se declara
  obligatorio en DEV ni equivalente a cualquier version de MySQL.
- RecetarioTab.jsx y OrdenRadiografiaTab.jsx usan window.print: la salida PDF
  depende del navegador, no se presenta como generacion nativa garantizada.
- Se incluyeron abonos, laboratorio, comisiones, imagenes y auditoria; no se
  afirmo que la seguridad o la integridad global esten certificadas.
- RF01-RF05 se vincularon al informe tecnico V3: egresos, auditoria, comisiones,
  laboratorios y filtros, respectivamente. El borrador los asociaba a procesos
  clinicos diferentes. No se inventaron referencias a formatos no disponibles.
- Los codigos de los requerimientos clinicos deben cotejarse con la matriz
  academica correspondiente antes de su aprobacion formal.
- Los objetivos de despliegue, recuperacion y mejoras pendientes no se
  presentan como funcionalidades ya desplegadas o verificadas.

## Verificacion

- Siete paginas revisadas visualmente mediante exportacion local de Word.
- Se preservaron todos los componentes internos de la plantilla, salvo el
  contenido editable de word/document.xml. Geometria de pagina preservada.
- Las tablas tienen encabezados repetidos y no cortan filas entre paginas.
- Fuentes originales verificadas por SHA-256 sin cambios.
- El archivo no contiene claves, datos de pacientes ni respaldos.
- No se completo ni se cerro E17 por esta entrega academica.

Esta rama se apila sobre codex/m02b-rotacion-dev para mantener DEV en su estado
actual. El PR de documentacion no autoriza fusionar los paquetes de seguridad
pendientes ni aplicar la rotacion JWT. Tras integrar sus bases, retarget del PR
a codex/mejoras-integracion y repetir CI.

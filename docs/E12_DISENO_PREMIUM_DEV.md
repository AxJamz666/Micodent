# E12 - Diseno y experiencia premium en DEV

Estado: implementacion tecnica de interfaz terminada en la rama
`codex/e12-diseno-premium`; aceptacion de usuarios y despliegue pendientes.
Base: RC4 + S1 + E09 + candidato E13 `ed4f19a`. Modelo acordado: GPT-6 Sol.
Fecha: 2026-09-29.

## Alcance

- Sistema visual sobrio para gestion clinica: tipografia del sistema, escala
  cromatica restringida, campos, botones, tablas y dialogos compartidos.
- Navegacion y vistas de inicio, pacientes, historia clinica, agenda, finanzas,
  produccion, perfil, acceso y administracion de personal adaptadas a movil.
- Diagnostico y plan con bordes uniformes; tabla de evolucion legible en
  escritorio y tratamiento completo por fila en movil (incluidas deuda,
  estado y acciones).
- Botones Imprimir reporte e Historial de cambios consistentes; contrasena
  propia, restablecimiento y desactivacion con jerarquia visual clara.
- Calendario mensual resumido por cantidad de citas en movil; columna de
  horas fija en dia y semana al desplazar la agenda.
- Dialogos de tratamiento, abono, receta, orden RX, gastos y POS con
  encabezados neutros y acciones coherentes. Las advertencias conservan
  color semantico. Se anadieron etiquetas y nombres accesibles donde se
  tocaron controles.

No se cambiaron reglas financieras, API, esquema SQL, roles, sesiones,
almacenamiento clinico ni contenido imprimible de receta y orden RX. El
soft delete de imagenes sigue conservando bytes y sigue requiriendo una
politica de retencion propia, fuera de E12.

## Evidencia tecnica

- `npm run build`: correcto. Vite advierte que el bundle principal supera
  500 kB; este paquete no agrega dependencias ni animaciones pesadas.
- `npm test`: 25/25 pruebas frontend correctas.
- Integracion backend/frontend con MariaDB propia y datos sinteticos:
  correcta. No se conecto a `micodent` ni a instalaciones de la familia.
- Playwright en 320, 390, 768 y 1440 px: siete rutas principales por tamano
  (28 combinaciones), sin errores JavaScript ni desbordamiento horizontal
  de pagina. Se corrigio el boton Cancelar del dialogo de contrasena a 320 px.
- Playwright adicional en ambos tamanos: calendario mensual, POS, nuevo
  tratamiento, receta y orden RX abren sin errores ni desbordamiento.
- El contenido RX y su odontograma imprimible permanecen cubiertos por las
  pruebas de regresion existentes. No se ha realizado cotejo fisico de una
  impresion en cada sede.

Las capturas y resultados sinteticos finales estan en
`E:\MICODENT_QA\e12-visual-extended-final`. No incluyen datos clinicos reales.

## Pendiente para aceptacion

1. Edy y Miguel: comprobar que textos, jerarquia de cobros y acciones de
   historia/agenda resultan claros en su flujo diario.
2. Probar manualmente impresion de historia, receta y orden RX, incluido mapa,
   sello, firma y odontograma, en impresoras reales antes de desplegar.
3. La cabecera de historia imprimible conserva una sede fija historica.
   Definir la sede de cada instalacion con datos verificados antes del piloto
   de Lima; no se debe sustituir por un valor supuesto.
4. El lint global del frontend registra 121 errores en esta rama, frente a
   122 documentados antes de E12. No se declara lint aprobado. La limpieza
   general y el peso del bundle se revisaran en E11/E16; build, pruebas e
   integracion deben seguir siendo obligatorios.
5. Esta rama no es un release clinico ni sustituye E05/E06/E08/E10/E13-E16.

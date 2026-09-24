# Cierre del candidato clinico-financiero RC4

Fecha: 2026-09-24. Rama: `codex/hotfix-clinico-financiero`.
Base de codigo: `4af578e`, mas la incorporacion del estado clinico entregado
por el propietario. RC4 es la base **funcional** elegida para continuar las
17 etapas, no una version apta aun para produccion.

## Alcance incorporado

- Launcher V4.0.3, comprobacion de configuracion, espera acotada por servicios,
  health y entrega del frontend compilado por Express.
- Correcciones de receta, orden Rx con los mapas confirmados de Centro Huancayo
  y San Carlos, firma/sello condicional e impresion.
- Cobros y comisiones por movimiento, costos externos, anulaciones, idempotencia,
  conciliacion historica, produccion por profesional y vista financiera.
- Caja del periodo: entradas, salidas de laboratorio/gastos y flujo neto sin
  doble descuento del costo aplicado a produccion.
- Tratamientos pendientes agrupados por paciente y actualizacion de las vistas
  tras operaciones financieras.
- Recargo POS configurable para nuevos cobros, con revision concurrente y
  snapshot del porcentaje; no reescribe pagos anteriores.

Detalles y decisiones: [RC1](HOTFIX_RC1.md), [RC2](HOTFIX_RC2.md),
[RC3](HOTFIX_RC3.md) y [RC4](HOTFIX_RC4.md).

## Cambios conservados y entrega

El commit de esta rama contiene codigo, manifiestos, launcher, pruebas,
migraciones aditivas 001/002, documentacion y solo el build RC4 referenciado
por `micodent-backend/public/index.html`. Los chunks antiguos no referenciados
que permanecen en el workspace no se incluyen en Git. Las copias locales de
release ZIP y evidencias QA siguen fuera del repositorio.

El ZIP local preexistente es
`MICODENT-HOTFIX-CLINICO-FINANCIERO-RC4-1790267855292.zip`, SHA-256
`EF80EA8A71DFEA8B2D7028A7BD198D843224A957DB05BCB9BA538A635FB99C20`.
La rama Git identifica el codigo fuente y el build vigente; no sustituye el
respaldo privado ni afirma que ese ZIP haya sido instalado.

No se versionan `.env`, contrasenas, secretos, volcados con datos, uploads,
historias, respaldos, logs ni dependencias instaladas. Las migraciones SQL
incluidas contienen solo estructura y un valor inicial de recargo, sin datos
personales. El escaneo de patrones y secretos conocidos complementa la
revision de rutas; no certifica ausencia de cualquier dato codificado.

## Verificacion

| Comprobacion | Resultado |
| --- | --- |
| Unitarias backend/launcher en este cierre | 29/29 |
| Unitarias frontend en este cierre | 5/5 |
| Build frontend en este cierre | Correcto; aviso de bundle mayor de 500 kB |
| Integracion API en ensayo RC4 previo | 17 escenarios en MariaDB y 17 en MySQL aislados |
| Navegador RC4 previo | DEV y build, escritorio/movil, finanzas, pendientes, POS, Rx, receta y firma |
| Instalaciones Edy/Miguel | No probadas ni modificadas |
| Hardware POS, impresora fisica y carga clinica real | No probados |

Los ensayos de BD/navegador previos usaron datos sinteticos; sus resultados y
limites estan en [RC4](HOTFIX_RC4.md). Este cierre no repite la migracion sobre
una BD habitual. No se interpreta la compilacion como aceptacion clinica.

## Pendientes y puerta de despliegue

RC4 aun **no integra** S1-A, M02 y S1-B de la otra linea de trabajo. En
particular, la autenticacion heredada no queda aprobada por este hotfix. El
siguiente trabajo es reconciliar seguridad sobre RC4 en una rama aislada,
preservando las funciones clinicas/financieras y probando regresion. No se
debe fusionar a `main` ni desplegar en laptops por haber publicado esta rama.

Antes de migrar una instalacion real: identificar version y esquema, hacer
respaldo coordinado de BD, uploads, configuracion y codigo, demostrar
restauracion aislada, revisar costes historicos desconocidos, ejecutar 001/002
con el procedimiento verificado en copia y obtener aceptacion funcional.
Nunca importar `database/micodent.sql` sobre una BD existente.

Rollback: mantener datos nuevos y la evidencia de los cobros. No restaurar
una BD antigua descartando movimientos posteriores. Si cambia el recargo POS,
RC3 no permite reabrir cobros con una politica fija anterior de manera
transparente; suspenderlos hasta disponer de version compatible o decision
administrativa documentada.

Estado: **implementado y probado en DEV aislado; publicacion de rama autorizada;
sin PR, sin merge, sin despliegue ni aprobacion de produccion**.

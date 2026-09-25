# Mapa de etapas en GitHub

## Actualizacion 2026-09-24

RC4 consolida el hotfix clinico-financiero y el launcher V4.0.3. Ver
[cierre RC4](HOTFIX_CIERRE_RC4.md) y [detalle RC4](HOTFIX_RC4.md). El propietario
autorizo publicar este candidato en su rama y continuar desde el. La publicacion
no equivale a aceptacion de produccion: E08/E12/E13 siguen parciales. S1-A/S1-B
tenian una linea separada. S1-A ya esta reconciliado tecnicamente con RC4 en
`codex/rc4-s1-integracion`, con pruebas aisladas; ver
[cierre de integracion](RC4_S1A_INTEGRACION.md). M02 y S1-B siguen pendientes de
conciliacion en aquel cierre. M02-A ya esta conciliado en la rama
`codex/rc4-m02-secretos`; ver [resultado](RC4_M02_CIERRE.md). S1-B y la
contencion global M02-B siguen pendientes. No se actualizaron instalaciones
reales ni se abrio PR.

La tabla siguiente conserva el estado historico previo, no certifica el candidato clinico.

Repositorio privado AxJamz666/Micodent. Etapa 0 de preparacion + etapas 1-17.
Cada etapa tiene milestone e issue; no se autoriza implementarla por crear su
registro. Los estados operativos vivos se consultan en los issues y PR.

| Etapa | Seguimiento | Estado al preparar GitHub |
| --- | --- | --- |
| E00 Base y recuperacion | [#1](https://github.com/AxJamz666/Micodent/issues/1) | Cerrada |
| E01 S1-A | [#2](https://github.com/AxJamz666/Micodent/issues/2) | Aceptada y cerrada |
| E02 Secretos | [#3](https://github.com/AxJamz666/Micodent/issues/3) | JWT DEV rotado; login habitual confirmado por el propietario. M02 global abierto |
| E03 S1-B | [#4](https://github.com/AxJamz666/Micodent/issues/4) | S1-B1 aceptado. S1-B2 en codigo; navegador y activacion pendientes |
| E04 Archivos clinicos | [#5](https://github.com/AxJamz666/Micodent/issues/5) | Planificada |
| E05 Autorizacion | [#6](https://github.com/AxJamz666/Micodent/issues/6) | Planificada |
| E06 Integridad clinica | [#7](https://github.com/AxJamz666/Micodent/issues/7) | Planificada |
| E07 Edy | [#8](https://github.com/AxJamz666/Micodent/issues/8) | Sin autorizacion de implementacion |
| E08 Finanzas | [#9](https://github.com/AxJamz666/Micodent/issues/9) | Planificada |
| E09 Agenda/API | [#10](https://github.com/AxJamz666/Micodent/issues/10) | Planificada |
| E10 BD/rendimiento | [#11](https://github.com/AxJamz666/Micodent/issues/11) | Planificada |
| E11 Trabajo/mantenimiento | [#12](https://github.com/AxJamz666/Micodent/issues/12) | Planificada |
| E12 UX/UI | [#13](https://github.com/AxJamz666/Micodent/issues/13) | Planificada |
| E13 V3/despliegue local | [#14](https://github.com/AxJamz666/Micodent/issues/14) | Simulacro revisado; integracion pendiente |
| E14 Recuperacion operativa | [#15](https://github.com/AxJamz666/Micodent/issues/15) | Planificada |
| E15 Actualizaciones de laptops | [#16](https://github.com/AxJamz666/Micodent/issues/16) | Planificada |
| E16 Aceptacion integral | [#17](https://github.com/AxJamz666/Micodent/issues/17) | Planificada |
| E17 Documentacion/entrega real | [#18](https://github.com/AxJamz666/Micodent/issues/18) | Planificada |

Accion prioritaria separada: [M02-B, issue #19](https://github.com/AxJamz666/Micodent/issues/19).
El 2026-09-21 se roto JWT solo en DEV. Piloto, simulacro y laptops no fueron
modificados; la contencion global sigue pendiente y requiere coordinacion.
Resultado DEV: [M02B_RESULTADO_DEV.md](M02B_RESULTADO_DEV.md).

Reglas del flujo: [TRABAJO_EN_GITHUB.md](TRABAJO_EN_GITHUB.md).
Dependencias tecnicas: [Ruta maestra](RUTA_MAESTRA.md).

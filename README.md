# MICODENT

Sistema de gestion odontologica en mejora controlada. Este repositorio contiene
codigo y documentacion; no contiene una instalacion clinica completa ni sus datos.

## Estado

- S1-A: implementado en DEV, probado y aceptado por el propietario.
- M02-A: contencion de secretos implementada y verificada en DEV.
- M02-B: JWT rotado solo en DEV el 2026-09-21; comprobaciones tecnicas correctas,
  login del propietario pendiente. Otros entornos y credenciales MySQL sin cambios.
- V3: simulacro revisado; integracion final de despliegue pendiente.
- No se considera listo para produccion ni autorizado para actualizar laptops.

## Mapa del proyecto

| Recurso | Contenido |
| --- | --- |
| [Roadmap](docs/RUTA_MAESTRA.md) | Etapa 0 y etapas 1-17, dependencias y orden |
| [Estado por etapa](docs/ESTADO_FASES.md) | Enlaces directos a los registros de GitHub |
| [GitHub](docs/TRABAJO_EN_GITHUB.md) | Ramas, commits, PR, CI y aprobaciones |
| [Secretos](docs/SECRETOS.md) | Configuracion, exportacion y rotacion pendiente |
| [S1-A](docs/S1A_CIERRE.md) | Sesiones, contrasenas y migracion DEV |
| [M02-A](docs/M02A_CIERRE.md) | Contencion y verificacion de secretos |
| [M02-B DEV](docs/M02B_RESULTADO_DEV.md) | Rotacion JWT, respaldo, pruebas y limites |
| [V3](docs/V3_INTEGRACION.md) | Despliegue local futuro y diferencias pendientes |
| [Issues](https://github.com/AxJamz666/Micodent/issues) | Seguimiento de cada etapa y paquete |
| [Milestones](https://github.com/AxJamz666/Micodent/milestones?state=all) | Mapa de las etapas |
| [Pull requests](https://github.com/AxJamz666/Micodent/pulls) | Cambios propuestos y revisiones |
| [Actions](https://github.com/AxJamz666/Micodent/actions) | Comprobaciones automaticas |

## Desarrollo

Frontend React/Vite, backend Express, MySQL. El runtime verificado en DEV es
Node 24.14.0 con MySQL 8.0.46. Las plantillas .env.example no incluyen secretos;
no reemplazar un .env que ya funciona. El backend actual exige micodent_dev,
usuario exclusivo y migracion S1-A aplicada deliberadamente por un operador.
No ejecutar migraciones ni cargar datos como parte de npm install/start.

Con dependencias y configuracion local ya preparadas:

```powershell
# En micodent-backend
npm test
npm run security:check
npm run security:history
npm start

# En micodent-frontend, en otra terminal
npm test
npm run build
npm run dev
```

GitHub CI no recibe secretos ni datos de instalaciones. Ejecuta pruebas unitarias,
build y deteccion de patrones. Las pruebas clinicas, restauraciones y pruebas SQL
aisladas siguen siendo un requisito separado antes de aceptar cada paquete.

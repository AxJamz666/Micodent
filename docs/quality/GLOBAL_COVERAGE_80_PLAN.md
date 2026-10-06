# MICODENT - Cobertura global 80+: COV-G1

Fecha:2026-10-04. Estado:VALIDADO LOCALMENTE; pendiente medicion oficial Sonar.
Workspace:F:\ChatGPT\MICODENT — Sistema de Gestión Odontológica\MICODENT_DEV\.runtime\e09-agenda-api.
Base:HEAD bbc15f187b1191169aafc3e8c651da38f9348f17 + cambios existentes conservados.

## Objetivo y baseline

Sonar informado por propietario:Overall76.6%,New97.4%,Quality GatePASSED,duplicacion3.4%,nuevos issues0,hotspots0,issue contextual aceptado1.
Objetivo:minimo80%; margen recomendado82-85%,no perseguir100%.
No escaneo Sonar en COV-G1 ni en su continuacion.

| Metrica local | Frontend antes | Frontend despues | Backend antes | Backend despues |
| --- | --- | --- | --- | --- |
| Tests | 140/140 | 151/151 | 130/130 | 130/130 |
| Statements | 74.85% | 83.29% | 76.00% | 76.00% |
| Branches | 82.57% | 84.83% | 82.15% | 82.15% |
| Functions | 52.69% | 57.43% | 79.47% | 79.47% |
| Lines | 74.85% | 83.29% | 76.00% | 76.00% |

El LCOV previo tenia7222 lineas frontend; actual7221 tras la eliminacion anterior del import InputV no utilizado.
No se elimino ninguna linea funcional ni exclusion en COV-G1.

## Once pruebas existentes, sin ampliacion

Archivo:micodent-frontend/tests/coverage-g1-navigation.test.mjs.
Infraestructura conservada:node:test,RTL,jsdom,Babel,c8; React/componentes/rutas reales.
Mocks unicamente fronteras API/sesion,datos sinteticos,reloj de calendario y avisos externos toast.
No BD clinica,API clinica real ni servidores frontend/backend de instalaciones activas.

| ID | Comportamiento comprobado | Fuente real | Resultado |
| --- | --- | --- | --- |
| COV-G1-01 | Slots ocupados/libres,doctor,geometria de cita,callback unico y agenda vacia | components/AgendaDia.jsx | PASS |
| COV-G1-02 | Carriles de citas solapadas,fecha/semana y clic aislado de cita | components/AgendaSemana.jsx | PASS |
| COV-G1-03 | Orden horario,3 previews,overflow,cancelacion y seleccion de dia adyacente | components/AgendaMes.jsx | PASS |
| COV-G1-04 | Loading,rangos dia/semana/mes,navegacion y volver a hoy | pages/Agenda.jsx | PASS |
| COV-G1-05 | Modal nueva/slot/edicion,prefill,guardado sintetico y refresco | pages/Agenda.jsx,components/CitaModal.jsx | PASS |
| COV-G1-06 | Respuestas/errores obsoletos ignorados,fallo actual y doctores no disponibles | pages/Agenda.jsx | PASS |
| COV-G1-07 | Menu admin/doctor,Outlet,links,cierre exterior y perfil por defecto | layouts/MainLayout.jsx | PASS |
| COV-G1-08 | Logout fallido conserva contexto,busy evita doble llamada,exito navega | layouts/MainLayout.jsx | PASS |
| COV-G1-09 | Rutas privadas/admin anonimas redirigen sin pedir datos | App.jsx,components/SessionBoundary.jsx | PASS |
| COV-G1-10 | Agenda autenticada,doctor sin finanzas y admin autorizado | App.jsx,layouts/MainLayout.jsx | PASS |
| COV-G1-11 | Contenido sano,falla de render y opciones seguras de recuperacion | components/AppErrorBoundary.jsx | PASS |

No se recrearon pruebas ni se modificaron los60 casos academicos o10 Cypress.
No pruebas nuevas backend,porque el alcance de continuacion prohibe agregar mas tests.

## Diagnostico del cierre Windows

No era un servidor/intervalo pendiente:tras los11 cleanup se observo roots0 y resources[PipeWrap,PipeWrap],solo stdout/stderr.
Unmount RTL ejecuta limpieza de efectos; despues act vacia actualizaciones; al final disposeRuntime cierra jsdom y desregistra Babel.
La espera de COV-G1-05 usaba assert.equal(elementoDOM,null) mientras el modal aun estaba cerrandose.
El diagnostico de ese fallo transitorio inspeccionaba el gran grafo jsdom/React:
antes30974ms/RSS8772MB; Windows notifico tambien Out Of Memory y exit3221226505,algunas ejecuciones perdieron LCOV.
Cambio minimo:assert.ok(queryByLabelText(...) === null),manteniendo exactamente la condicion de ausencia.
Con mismo entorno/reloj:despues309ms/RSS375MB; cierre diagnostico completo4598ms,11/11PASS,exit0,maxRSS381MB.
La suite definitiva registro ese caso322ms y151/151PASS,exit0,60791ms.

Ajustes exclusivos del test:reloj congela new Date() de calendario,pero hereda Date.now real;
restauracion explicita del reloj yfixture tras cleanup/act; diagnostico opcional MICODENT_COV_G1_DIAGNOSTICS=1.
Sin force-exit/process.exit,dependencias nuevas,cambio de runner,servidores artificialmente terminados ni cambios de producto.

## LCOV real y archivos objetivo

Reportes regenerados con npm run test:coverage existentes de cada proyecto.
Backend runner usa TEMP/TMP aislados y los elimina de forma segura al finalizar.

| Fuente frontend | LH/LF antes | LH/LF despues | BRH/BRF despues |
| --- | --- | --- | --- |
| pages/Agenda.jsx | 0/171 | 171/171 | 45/46 |
| components/AgendaDia.jsx | 0/88 | 88/88 | 22/23 |
| components/AgendaMes.jsx | 0/61 | 61/61 | 21/21 |
| components/AgendaSemana.jsx | 0/70 | 70/70 | 20/21 |
| layouts/MainLayout.jsx | 0/106 | 106/106 | 30/31 |
| App.jsx | 0/57 | 57/57 | 5/6 |
| components/AppErrorBoundary.jsx | 0/19 | 19/19 | 5/5 |

Los conteos de lineas c8 no certifican100% de funciones/ramas ni recuperacion real del navegador por reload.
Frontend LCOV:117472bytes,46SF;SHA256 B36B08031FA02C243B390E89105EF1BB630C01885B9BEB270F04729A7C691A42.
Backend LCOV:57121bytes,42SF;SHA256 E1E4F4E4C150AB59D0B25C241CBAC9DE6DBA62AE1C14E8EC6CDACB698692F088.
Comprobacion programatica PASS:archivos no vacios,todos SF existentes bajo src/resolubles desde raiz,
sin duplicados,DA dentro de limites y LF/LH/BRF/BRH coherentes con coverage-summary.json.
No modificacion manual de LCOV/exclusiones/Quality Gate/sonar-project.properties.

Estimacion LOCAL ponderada linea+rama:81.4054%=(8862 lineas cubiertas+2201 ramas cubiertas)/(10967 lineas+2623 ramas).
Lineas combinadas locales:80.8061%. Es razonable esperar>=80%,pero Sonar usa su propio analisis de lineas/condiciones.
El margen recomendado82-85% no queda confirmado; no se declaro Overall oficial ni garantia de Gate.
Por instruccion expresa de la continuacion,no ampliar lote antes de la nueva medicion.

## Regresion y contencion

Frontend151/151PASS;Backend130/130PASS;Cypress10/10PASS;BuildPASS,1837modulos.
Sin fallidos,cancelados ni omitidos; ningun cambio funcional ni en fuentes/manifestos/locks.
199/199 archivos protegidos del inicio de validacion final permanecieron identicos por SHA256;
solo se ajusto el archivo COV-G1 y se documentaron CURRENT_TASK.md/este plan.
Cypress16.1.1/Edge154.0.4258.53 headless,30468ms,UTC2026-10-04T16:15:31.261Z.
Datos sinteticos,peticiones API sin mock0,3capturas;run.json SHA256 E3576DC40DEE90061234C453ED8F00B5D3A5272A62B72B52CC57D55BA48BA55A.
Advertencias preexistentes:bundle571.34kB>500kB y Cypress windows-trash.exe no fatal al reciclar capturas.
No se cambiaron permisos ni eliminaron capturas manualmente. No procesos c8/test-e2e/Vite pendientes al cierre.
No push,Sonar,duplicacion,S5693,Universidad,PostgreSQL,Docker ni avanceE01-E17.

## Siguiente paso

Ejecutar SonarQube con ambos LCOV actuales para medir Overall Coverage real.
Esperar instrucciones; no ejecutar el scanner ni agregar otro lote automaticamente.

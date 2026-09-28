# M06 - Matriz de acceso vigente y decisiones pendientes

Base: RC4 + S1-A/S1-B + M03. Esta matriz describe el comportamiento comprobado
del backend; no concede permisos nuevos. `verificarToken` resuelve usuario activo y
sesion en MySQL para cada peticion. Los controles de la interfaz no sustituyen
la autorizacion del servidor.

| Capacidad / rutas | Asistente | Doctor | Administrador | Limite adicional |
| --- | --- | --- | --- | --- |
| Agenda, pacientes, lista/detalle de historias, anexos activos y archivos clinicos | Si | Si | Si | Sesion valida; hoy no hay aislamiento por paciente. |
| Crear/editar/archivar/reactivar pacientes e historias; registrar abonos | Si | Si | Si | Permiso vigente; necesita definicion de responsabilidades clinicas. |
| Subir/anular anexos, laboratorio y pagos de laboratorio | Si | Si | Si | Permiso vigente; M03 conserva archivos al anular. |
| Antecedentes, evoluciones, odontograma, recetas, ordenes Rx y firmas clinicas | No | Si | No | `soloDoctor`; la autoria individual se comprueba donde aplica. |
| Produccion y comisiones | No | Propia | Toda | El backend fija el doctor de una cuenta no administrativa. |
| Dashboard financiero, gastos, penalidades, auditoria financiera, POS editar, anular abonos, conciliar costos | No | No | Si | `soloAdmin`. La configuracion POS en lectura es visible para usuarios autenticados. |
| Lista/alta/edicion/desactivacion y restablecimiento de personal | No | No | Si | Alta/edicion/desactivacion/reset tienen controles de nivel y revalidacion de sesion. |
| Anexos anulados y restauracion | No | No | Si | La lista de archivados se valida en el controlador; restauracion en la ruta. |
| Contrasena y firma/sello propios | Si | Si | Si | Solo cuenta propia; cambio de contrasena revoca sesiones. |

## Controles incorporados en M06

- Ningun administrador puede cambiar su propio `rol` desde `PUT /usuarios/:id`.
  Esto evita obtener permisos clinicos cambiando el perfil propio. Una cuenta
  administrativa puede seguir gestionando cuentas subordinadas segun nivel.
- `DELETE /usuarios/:id` desactiva, no elimina. Bloquea actor y objetivo en orden
  estable, vuelve a comprobar la sesion y jerarquia, revoca sesiones del objetivo
  y registra `USER_DEACTIVATED` en la misma transaccion. La fila y referencias
  historicas permanecen. Repetir la desactivacion responde 409.
- `POST /usuarios/:id/reactivar` exige un administrador de nivel superior, su
  contrasena actual y una contrasena nueva para la cuenta inactiva. Activacion,
  sustitucion de clave, revocacion y evento `USER_REACTIVATED` son atomicos.
  Una cuenta activa no puede pasar por este flujo. No hay migracion de esquema.
- La interfaz usa el perfil verificado de sesion para sus controles, distingue
  cuentas inactivas, no ofrece desactivarlas de nuevo y explica que los
  registros clinicos y financieros se conservan. La confirmacion de
  desactivacion bloquea solicitudes duplicadas mientras espera al servidor.
  Las recargas de personal descartan respuestas tardias de una vista cerrada.
- `src/services/accessPolicy.js` concentra las capacidades que ya existian:
  administracion, escritura clinica, produccion propia y produccion completa.
  El middleware y las lecturas condicionadas de historias/produccion usan la
  misma politica. No se ha agregado una concesion especial para Edy.
- `tests/unit/route-guards.test.js` detecta si una ruta de personal, gastos,
  finanzas o historias pierde los guardas de autenticacion, Doctor o
  Administrador previstos. La lista de rutas clinicas es explicita para exigir
  una revision al agregar endpoints nuevos.

## Decisiones pendientes antes de restringir mas

1. Determinar con Miguel y Edy si Asistente necesita leer historias completas,
   fotos, firmas y documentos de todos los pacientes. Hoy cualquier cuenta
   autenticada puede hacerlo. M15 debe definir minimo acceso y trazabilidad.
2. Definir quien puede archivar/reactivar pacientes e historias, registrar
   abonos, y subir/anular anexos. Restringir esos flujos sin validar su trabajo
   cotidiano podria detener la atencion o la caja.
3. Definir si laboratorio debe limitarse a administracion y que necesita ver
   el doctor. Los pagos de laboratorio hoy se auditan, pero admiten cualquier
   cuenta autenticada.
4. El permiso clinico excepcional de Edy sigue separado. No se logra cambiando
   su rol a Doctor ni se ha implementado aqui. Requiere capacidad explicita,
   alcance, pruebas de autoria y aprobacion posterior.

## Verificacion

`tests/integration/security.test.js` usa cuentas sinteticas en MySQL aislado:
rechazos por rol, produccion propia, prohibicion de autoasignacion clinica,
jerarquia de desactivacion, cierre de sesiones, evento de auditoria y
permanencia del tratamiento historico del doctor desactivado. Tambien comprueba
la reactivacion con clave nueva y el rollback si falla su auditoria. La ultima
ejecucion completa de integracion paso 26/26 casos y seguridad 23/23. Las pruebas
unitarias pasaron 85/85 en backend y 23/23 en frontend; el frontend compila.
La prueba visual automatizada de reactivacion paso en
`E:\MICODENT_QA\qa-1790559743328` y el recorrido general del navegador paso
en `E:\MICODENT_QA\qa-1790559817864`, incluidos personal, pacientes,
documentos, produccion, finanzas y Rx. El fallo anterior de navegacion no se
reprodujo en esta nueva ejecucion; no se conoce su causa. Ninguna de estas
pruebas usa `micodent_dev` habitual ni instalaciones de la clinica.
Tras trasladar el workspace a F:, la integracion aislada y la reactivacion
visual volvieron a pasar; evidencia sintetica en
`E:\MICODENT_QA\qa-1790606256487`. El escaneo local de secretos y del historial
no encontro hallazgos. Esta base tecnica no activa cambios en instalaciones
clinicas ni cierra las decisiones de acceso indicadas arriba.
Los dos componentes frontend modificados pasan ESLint enfocado. El lint global
del frontend aun falla con 125 hallazgos en otros archivos; se tratara en la
etapa de calidad de interfaz, no como cambio lateral de autorizacion.

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./config/db');

// ======================================================
// RUTAS
// ======================================================

const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const pacientesRoutes = require('./routes/pacientes.routes');
const historiasRoutes = require('./routes/historias.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const citasRoutes = require('./routes/citas.routes');
const gastosRoutes = require('./routes/gastos.routes');
const laboratorioRoutes = require('./routes/laboratorio.routes');
const auditoriaRoutes = require('./routes/auditoria.routes');

// ======================================================
// CONFIGURACION GENERAL
// ======================================================

const app = express();
const PORT = process.env.PORT || 4000;

// Carpeta donde se encuentra el frontend compilado.
// index.js esta dentro de /src, por eso usamos ../public
const FRONTEND_BUILD = path.join(__dirname, '../public');

// ======================================================
// CORS
// ======================================================

app.use(
  cors({
    origin: [
      'http://localhost:4000',
      'http://127.0.0.1:4000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  })
);

// ======================================================
// MIDDLEWARES
// ======================================================

app.use(express.json({ limit: '50mb' }));

app.use(
  express.urlencoded({
    extended: true,
    limit: '50mb',
  })
);

// ======================================================
// ARCHIVOS SUBIDOS
// ======================================================

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// ======================================================
// API MICODENT
// ======================================================

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/historias', historiasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/gastos', gastosRoutes);
app.use('/api/laboratorio', laboratorioRoutes);
app.use('/api/auditoria-financiera', auditoriaRoutes);

// ======================================================
// API PING
// Comprueba solamente que Express funciona.
// ======================================================

app.get('/api/ping', (req, res) => {
  res.status(200).json({
    ok: true,
    mensaje: 'Micodent API corriendo correctamente',
    hora: new Date().toLocaleString('es-PE'),
  });
});

// ======================================================
// API HEALTH
// Comprueba Backend + conexion real con MySQL.
// ======================================================

app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1 AS health_check');
    await db.query('SELECT pago_id, costo_aplicado, anulado FROM finanzas_pagos LIMIT 0');
    await db.query('SELECT id FROM pagos_vigentes LIMIT 0');
    await db.query('SELECT consulta_id, otros_costos FROM finanzas_costos LIMIT 0');
    await db.query('SELECT clave, huella FROM finanzas_peticiones LIMIT 0');
    const [migrations] = await db.query("SELECT version FROM finanzas_version WHERE version IN ('001','002')");
    const [[pos]] = await db.query('SELECT revision FROM finanzas_configuracion WHERE id=1');
    await db.query('SELECT pago_id,porcentaje,revision FROM finanzas_pago_pos LIMIT 0');
    if (migrations.length !== 2 || !pos) throw Object.assign(new Error('Pending migration'), { code: 'SCHEMA_PENDING' });
    await require('../scripts/migrate-s1a').verifyApplied(db);

    res.set('Cache-Control', 'no-store');

    return res.status(200).json({
      ok: true,
      status: 'healthy',
      backend: 'online',
      database: 'connected',
      version: 'rc4-s1a-dev',
      mensaje: 'Micodent esta listo para operar',
      hora: new Date().toLocaleString('es-PE'),
    });
  } catch (error) {
    console.error('Micodent health: la base de datos o una migracion no esta disponible.');

    res.set('Cache-Control', 'no-store');

    return res.status(503).json({
      ok: false,
      status: 'unhealthy',
      backend: 'online',
      database: 'disconnected',
      reason: ['ER_NO_SUCH_TABLE', 'ER_BAD_FIELD_ERROR', 'ER_VIEW_INVALID', 'SCHEMA_PENDING'].includes(error.code)
        || /^(MIGRATION_|ER_BAD_FIELD_ERROR)/.test(error.message) ? 'schema_pending' : 'database_unavailable',
      mensaje: 'Micodent aun no esta listo para operar',
      hora: new Date().toLocaleString('es-PE'),
    });
  }
});

// ======================================================
// FRONTEND REACT COMPILADO
// ======================================================

app.use(express.static(FRONTEND_BUILD, { setHeaders(res, file) {
  if (file.endsWith('index.html')) res.setHeader('Cache-Control', 'no-store');
} }));

// ======================================================
// REACT ROUTER - SPA FALLBACK
//
// Si el usuario entra directamente, por ejemplo:
//
// /pacientes
// /historias
// /citas
//
// Express entrega index.html y React Router
// se encarga del resto.
// ======================================================

app.use((req, res, next) => {
  // Las rutas API inexistentes NO deben devolver React.
  if (req.path === '/api' || req.path.startsWith('/api/')) {
    return next();
  }

  // Tampoco interferir con uploads.
  if (req.path === '/uploads' || req.path.startsWith('/uploads/') || req.path.startsWith('/assets/') || path.extname(req.path)) {
    return next();
  }

  // Solo atender GET como navegación del frontend.
  if (req.method !== 'GET') {
    return next();
  }

  res.set('Cache-Control', 'no-store');
  return res.sendFile('index.html', { root: FRONTEND_BUILD });
});

// ======================================================
// RUTA NO ENCONTRADA
// Principalmente APIs inexistentes.
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    mensaje: 'Ruta no encontrada.',
  });
});

// ======================================================
// SERVIDOR
// ======================================================

app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    return res.status(err.type === 'entity.too.large' ? 413 : 400).json({ ok: false, mensaje: 'Solicitud invalida.' });
  }
  return require('./utils/securityError').sendSecurityError(res, err);
});

if (require.main === module) {
  require('../scripts/migrate-s1a').verifyApplied(db).then(() => {
    app.listen(PORT, '127.0.0.1', () => console.log(`MICODENT DEV disponible en http://localhost:${PORT}`));
  }).catch(async () => {
    console.error('MICODENT DEV no inicio: verifica la BD y la migracion S1-A. No se aplicaron cambios automaticos.');
    await db.end();
    process.exitCode = 1;
  });
}
module.exports = app;

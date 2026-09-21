const express = require('express');
const cors    = require('cors');
const path    = require('path');
const browserTransport = require('./config/browserTransport');

const authRoutes      = require('./routes/auth.routes');
const usuariosRoutes  = require('./routes/usuarios.routes');
const pacientesRoutes = require('./routes/pacientes.routes');
const historiasRoutes = require('./routes/historias.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const citasRoutes     = require('./routes/citas.routes');
const gastosRoutes      = require('./routes/gastos.routes');
const laboratorioRoutes = require('./routes/laboratorio.routes');
const auditoriaRoutes   = require('./routes/auditoria.routes');

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: browserTransport.origins,
  credentials: true,
}));
app.use('/api', browserTransport.boundary);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',      authRoutes);
app.use('/api/usuarios',  usuariosRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/historias', historiasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/citas',     citasRoutes);
app.use('/api/gastos',      gastosRoutes);
app.use('/api/laboratorio', laboratorioRoutes);
app.use('/api/auditoria-financiera', auditoriaRoutes);

app.get('/api/ping', (req, res) => {
  res.json({
    ok:      true,
    mensaje: '🦷 Micodent API corriendo correctamente',
    hora:    new Date().toLocaleString('es-PE'),
  });
});

// ✅ Restaurado: Manejador de rutas no encontradas para modo desarrollo
app.use((req, res) => {
  res.status(404).json({ ok: false, mensaje: 'Ruta no encontrada.' });
}); 

app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    return res.status(err.type === 'entity.too.large' ? 413 : 400).json({ ok: false, mensaje: 'Solicitud invalida.' });
  }
  return require('./utils/securityError').sendSecurityError(res, err);
});

if (require.main === module) {
  const db = require('./config/db');
  require('../scripts/migrate-s1a').verifyApplied(db).then(() => {
    app.listen(PORT, '127.0.0.1', () => console.log(`MICODENT DEV disponible en http://localhost:${PORT}`));
  }).catch(async () => {
    console.error('MICODENT DEV no inicio: verifica la BD y la migracion S1-A. No se aplicaron cambios automaticos.');
    await db.end();
    process.exitCode = 1;
  });
}

module.exports = app;

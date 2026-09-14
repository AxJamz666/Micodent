const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

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
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
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

app.listen(PORT, () => {
  console.log(`🚀 Servidor Micodent corriendo en http://localhost:${PORT}`);
  console.log(`🛰️ API disponible en http://localhost:${PORT}/api`);
});
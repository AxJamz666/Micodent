import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import AdministracionPersonal from './pages/AdministracionPersonal';
import MiPerfil from './pages/MiPerfil';
import Pacientes from './pages/Pacientes';
import PacienteDetalle from './pages/PacienteDetalle';
import Historias from './pages/Historias';
import Agenda from './pages/Agenda';
import FinanzasDashboard from './pages/FinanzasDashboard';
import Produccion from './pages/Produccion';
import SessionBoundary from './components/SessionBoundary';
import { useSession } from './services/browserSession';

const ProtectedRoute = ({ children }) => {
  const { user } = useSession();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user } = useSession();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <SessionBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="pacientes" element={<Pacientes />} />
          <Route path="pacientes/nuevo" element={<PacienteDetalle />} />
          <Route path="pacientes/:id" element={<PacienteDetalle />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="produccion" element={<Produccion />} />
          <Route path="finanzas" element={
            <AdminRoute><FinanzasDashboard /></AdminRoute>
          } />
          <Route path="historias" element={<Historias />} />
          <Route path="perfil" element={<MiPerfil />} />
          <Route path="administracion-personal" element={
            <AdminRoute><AdministracionPersonal /></AdminRoute>
          } />
        </Route>
      </Routes>
      </SessionBoundary>
    </BrowserRouter>
  );
}

export default App;

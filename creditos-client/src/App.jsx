import React, { useEffect, useMemo, useRef } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { store } from "./store";
import { fetchCurrentUser } from "./store/authSlice";

// Layout principal con Sidebar y Topbar
import Dashboard from "./pages/Dashboard.jsx";

// Paginas comunes
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";

// Paginas de ADMIN
import HomeDashboard from "./pages/HomeDashboard.jsx";
import Clientes from "./pages/Clientes.jsx";
import AgregarCliente from "./pages/AgregarCliente.jsx";
import EditarCliente from "./pages/EditarCliente.jsx";
import DetalleCliente from "./pages/DetalleCliente.jsx";
import Usuarios from "./pages/Usuarios.jsx";
import UsuarioNuevo from "./pages/UsuarioNuevo.jsx";
import UsuarioDetalle from "./pages/UsuarioDetalle.jsx";
import UsuarioEditar from "./pages/UsuarioEditar.jsx";
import UsuarioReportes from "./pages/UsuarioReportes.jsx";
import ReporteDetalle from "./pages/ReporteDetalle.jsx";
import Mensajes from "./pages/Mensajes.jsx";
import Creditos from "./pages/Creditos.jsx";
import CreditoNuevo from "./pages/CreditoNuevo.jsx";
import CreditoDetalle from "./pages/CreditoDetalle.jsx";
import CancelarCredito from "./pages/CreditoCancelar.jsx";
import FinancialDetail from "./pages/FinancialDetail.jsx";

// Paginas de COBRADOR
import DashboardCobrador from "./pages/DashboardCobrador.jsx";
import PagosCobrador from "./pages/PagosCobrador.jsx";
import OrdenClientes from "./pages/OrdenarClientes.jsx";
import AsignarClientes from "./pages/AsignarClientes.jsx";
import SueldoCobrador from "./pages/CobradorSueldo.jsx";
import RegistrarPago from "./pages/RegistrarPago.jsx";
import CobradorReportes from "./pages/CobradorReportes.jsx";
import CobradorTrayectoGuard from "./components/CobradorTrayectoGuard.jsx";

function RoleIndexRedirect() {
  const role = (useSelector((state) => state.auth.user?.role) || localStorage.getItem("role") || "").toLowerCase();
  const isCollector = role === "cobrador" || role === "employee";
  if (isCollector) return <Navigate to="/cobrador/dashboard" replace />;
  return <HomeDashboard />;
}

function AppRouter() {
  const dispatch = useDispatch();
  const { token, user, checkingSession } = useSelector(state => state.auth);
  const lastVerifiedTokenRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const publicPaths = ["/login", "/forgot-password", "/reset-password"];
  const isPublicPath = publicPaths.includes(location.pathname);

  useEffect(() => {
    if (!token) {
      lastVerifiedTokenRef.current = null;
      return;
    }
    if (isPublicPath) return;
    if (lastVerifiedTokenRef.current === token) return;
    lastVerifiedTokenRef.current = token;
    dispatch(fetchCurrentUser()).unwrap().catch(() => { });
  }, [dispatch, token, isPublicPath]);

  const userId = useMemo(() => {
    if (user?.id) return user.id;
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      return parsed?.id ?? null;
    } catch {
      return null;
    }
  }, [user]);

  if (checkingSession && !isPublicPath) return null;

  return (
    <Routes>
      {/* === LOGIN Y RECUPERACION === */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* === LAYOUT PRINCIPAL (ADMIN + COBRADOR) === */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={["admin", "cobrador"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        {/* --- ADMIN --- */}
        <Route index element={<RoleIndexRedirect />} />
        <Route path="clientes" element={<ProtectedRoute allowedRoles={["admin"]}><Clientes /></ProtectedRoute>} />
        <Route path="clientes/nuevo" element={<ProtectedRoute allowedRoles={["admin"]}><AgregarCliente /></ProtectedRoute>} />
        <Route path="clientes/:id" element={<ProtectedRoute allowedRoles={["admin"]}><DetalleCliente /></ProtectedRoute>} />
        <Route path="clientes/:id/editar" element={<ProtectedRoute allowedRoles={["admin"]}><EditarCliente /></ProtectedRoute>} />
        <Route path="usuarios" element={<ProtectedRoute allowedRoles={["admin"]}><Usuarios /></ProtectedRoute>} />
        <Route path="usuarios/nuevo" element={<ProtectedRoute allowedRoles={["admin"]}><UsuarioNuevo /></ProtectedRoute>} />
        <Route path="usuarios/:id" element={<ProtectedRoute allowedRoles={["admin"]}><UsuarioDetalle /></ProtectedRoute>} />
        <Route path="usuarios/:id/editar" element={<ProtectedRoute allowedRoles={["admin"]}><UsuarioEditar /></ProtectedRoute>} />
        <Route path="usuarios/:id/reportes" element={<ProtectedRoute allowedRoles={["admin"]}><UsuarioReportes /></ProtectedRoute>} />
        <Route path="reportes/:reportId" element={<ProtectedRoute allowedRoles={["admin"]}><ReporteDetalle /></ProtectedRoute>} />
        <Route path="mensajes" element={<ProtectedRoute allowedRoles={["admin"]}><Mensajes /></ProtectedRoute>} />
        <Route path="creditos" element={<ProtectedRoute allowedRoles={["admin"]}><Creditos /></ProtectedRoute>} />
        <Route path="creditos/nuevo" element={<ProtectedRoute allowedRoles={["admin"]}><CreditoNuevo /></ProtectedRoute>} />
        <Route path="creditos/:id" element={<ProtectedRoute allowedRoles={["admin"]}><CreditoDetalle /></ProtectedRoute>} />
        <Route path="creditos/:id/cancelar" element={<ProtectedRoute allowedRoles={["admin"]}><CancelarCredito /></ProtectedRoute>} />
        <Route path="finanzas/detalle" element={<ProtectedRoute allowedRoles={["admin"]}><FinancialDetail /></ProtectedRoute>} />
        <Route path="ordenar-clientes" element={<ProtectedRoute allowedRoles={["admin"]}><OrdenClientes cobradorId={userId} /></ProtectedRoute>} />
        <Route path="asignar-clientes" element={<ProtectedRoute allowedRoles={["admin"]}><AsignarClientes cobradorId={userId} clientesIniciales={[]} /></ProtectedRoute>} />

        {/* --- COBRADOR --- */}
        <Route
          path="cobrador/dashboard"
          element={
            <ProtectedRoute allowedRoles={["cobrador"]}>
              <DashboardCobrador />
            </ProtectedRoute>
          }
        />
        <Route
          path="cobrador/pagos"
          element={
            <ProtectedRoute allowedRoles={["cobrador"]}>
              <CobradorTrayectoGuard>
                <PagosCobrador cobradorId={userId} />
              </CobradorTrayectoGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="cobrador/sueldo"
          element={
            <ProtectedRoute allowedRoles={["cobrador"]}>
              <SueldoCobrador />
            </ProtectedRoute>
          }
        />
        <Route
          path="cobrador/pagos/:creditoId"
          element={
            <ProtectedRoute allowedRoles={["cobrador"]}>
              <CobradorTrayectoGuard>
                <RegistrarPago />
              </CobradorTrayectoGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="cobrador/reportes"
          element={
            <ProtectedRoute allowedRoles={["cobrador"]}>
              <CobradorReportes cobradorId={userId} />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* === REDIRECCION POR DEFECTO === */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <HashRouter>
        <AppRouter />
      </HashRouter>
    </Provider>
  );
}

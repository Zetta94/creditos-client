import React from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// 🔹 Layout principal con Sidebar y Topbar
import Dashboard from "./pages/Dashboard.jsx";

// 🔹 Páginas comunes
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

// 🔹 Páginas de ADMIN
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
import Mensajes from "./pages/Mensajes.jsx";
import Creditos from "./pages/Creditos.jsx";
import CreditoNuevo from "./pages/CreditoNuevo.jsx";
import CreditoDetalle from "./pages/CreditoDetalle.jsx";
import CancelarCredito from "./pages/CreditoCancelar.jsx";

// 🔹 Páginas de COBRADOR
import DashboardCobrador from "./pages/DashboardCobrador.jsx";
import PagosCobrador from "./pages/PagosCobrador.jsx";
const userId = localStorage.getItem("userId");
import OrdenClientes from "./pages/OrdenarClientes.jsx";
import AsignarClientes from "./pages/AsignarClientes.jsx";
import SueldoCobrador from "./pages/CobradorSueldo.jsx";
import ComisionesCobrador from "./pages/CobradorComisiones.jsx";
import RegistrarPago from "./pages/RegistrarPago.jsx";
import CobradorReportes from "./pages/CobradorReportes.jsx";

export default function App() {
  React.useEffect(() => {
    // Forzar modo oscuro al cargar
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          {/* === LOGIN === */}
          <Route path="/login" element={<Login />} />

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
            <Route index element={<HomeDashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="clientes/nuevo" element={<AgregarCliente />} />
            <Route path="clientes/:id" element={<DetalleCliente />} />
            <Route path="clientes/:id/editar" element={<EditarCliente />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="usuarios/nuevo" element={<UsuarioNuevo />} />
            <Route path="usuarios/:id" element={<UsuarioDetalle />} />
            <Route path="usuarios/:id/editar" element={<UsuarioEditar />} />
            <Route path="usuarios/:id/reportes" element={<UsuarioReportes />} />
            <Route path="mensajes" element={<Mensajes />} />
            <Route path="creditos" element={<Creditos />} />
            <Route path="creditos/nuevo" element={<CreditoNuevo />} />
            <Route path="creditos/:id" element={<CreditoDetalle />} />
            <Route path="creditos/:id/cancelar" element={<CancelarCredito />} />
            <Route path="ordenar-clientes" element={<OrdenClientes cobradorId={userId} />} />
            <Route path="asignar-clientes" element={<AsignarClientes cobradorId={userId} clientesIniciales={[]} />} />

            {/* --- COBRADOR --- */}
            <Route path="cobrador/dashboard" element={<DashboardCobrador />} />
            <Route path="cobrador/pagos" element={<PagosCobrador cobradorId={userId} />} />
            <Route path="cobrador/sueldo" element={<SueldoCobrador />} />
            <Route path="cobrador/comisiones" element={<ComisionesCobrador />} />
            <Route path="cobrador/pagos/:clienteId" element={<RegistrarPago />} />
            <Route path="cobrador/reportes" element={<CobradorReportes cobradorId={userId} />} />

          </Route>

          {/* === REDIRECCIÓN POR DEFECTO === */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

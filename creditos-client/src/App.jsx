import React from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard.jsx";
import Clientes from "./pages/Clientes.jsx";
import AgregarCliente from "./pages/AgregarCliente.jsx";
import EditarCliente from "./pages/EditarCliente.jsx";
import DetalleCliente from "./pages/DetalleCliente.jsx";
import Usuarios from "./pages/Usuarios.jsx";
import UsuarioNuevo from "./pages/UsuarioNuevo.jsx";
import UsuarioDetalle from "./pages/UsuarioDetalle.jsx";
import HomeDashboard from "./pages/HomeDashboard.jsx";
import Mensajes from "./pages/Mensajes.jsx";
import Creditos from "./pages/Creditos.jsx";
import CreditoNuevo from "./pages/CreditoNuevo.jsx";
import CreditoDetalle from "./pages/CreditoDetalle.jsx";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  React.useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomeDashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="clientes/nuevo" element={<AgregarCliente />} />
            <Route path="clientes/:id" element={<DetalleCliente />} />
            <Route path="clientes/:id/editar" element={<EditarCliente />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="usuarios/nuevo" element={<UsuarioNuevo />} />
            <Route path="usuarios/:id" element={<UsuarioDetalle />} />
            <Route path="mensajes" element={<Mensajes />} />
            <Route path="creditos" element={<Creditos />} />
            <Route path="creditos/nuevo" element={<CreditoNuevo />} />
            <Route path="creditos/:id" element={<CreditoDetalle />} />

          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

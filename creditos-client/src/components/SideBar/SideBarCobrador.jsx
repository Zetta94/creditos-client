import { useSelector } from "react-redux";
import SidebarItem from "./SideBarItem.jsx";

export default function SidebarCobrador() {
    const trayectoActivo = useSelector(state => state.trayecto.active);

    return (
        <nav>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--ios-label-ter)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 12px", marginBottom: "8px" }}>
                Menú
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                <SidebarItem to="/cobrador/dashboard" label="Inicio"            icon="dashboard" />
                <SidebarItem to="/cobrador/sueldo"    label="Sueldo"            icon="grid"      />
                <SidebarItem to="/cobrador/reportes"  label="Reportes"          icon="stats"     />
                <SidebarItem
                    to="/cobrador/pagos"
                    label="Recorrido / Pagos"
                    icon="payments"
                    disabled={!trayectoActivo}
                />
            </ul>
            {!trayectoActivo && (
                <p style={{ fontSize: "12px", color: "var(--ios-label-ter)", padding: "8px 12px", marginTop: "4px" }}>
                    Iniciá el trayecto desde Inicio para habilitar el recorrido.
                </p>
            )}
        </nav>
    );
}

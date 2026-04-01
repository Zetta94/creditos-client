import SidebarItem from "./SideBarItem.jsx";

export default function SidebarAdmin() {
    return (
        <nav>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--ios-label-ter)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 12px", marginBottom: "8px" }}>
                Menú
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                <SidebarItem to="/"                label="Dashboard"         icon="dashboard" />
                <SidebarItem to="/finanzas/detalle" label="Detalle financiero" icon="stats"     />
                <SidebarItem to="/creditos"          label="Créditos"          icon="grid"      />
                <SidebarItem to="/clientes"          label="Clientes"          icon="clients"   />
                <SidebarItem to="/mensajes"          label="Mensajes"          icon="message"   />
                <SidebarItem to="/usuarios"          label="Usuarios"          icon="users"     />
            </ul>
        </nav>
    );
}

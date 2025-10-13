import SidebarItem from "./SideBarItem.jsx";

export default function SidebarAdmin() {
    return (
        <ul className="space-y-2 font-medium">
            <SidebarItem to="/" label="Dashboard" icon="dashboard" />
            <SidebarItem to="/creditos" label="Créditos" icon="grid" />
            <SidebarItem to="/clientes" label="Clientes" icon="clients" />
            <SidebarItem to="/mensajes" label="Mensajes" icon="message" />
            <SidebarItem to="/usuarios" label="Usuarios" icon="users" />
        </ul>
    );
}

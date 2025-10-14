import SidebarItem from "./SideBarItem.jsx";

export default function SidebarCobrador() {
    return (
        <ul className="space-y-2 font-medium">
            <SidebarItem to="/cobrador/dashboard" label="Inicio" icon="dashboard" />
            <SidebarItem to="/cobrador/pagos" label="Recorrido/Pagos" icon="payments" />
            <SidebarItem to="/cobrador/sueldo" label="Sueldo" icon="grid" />
            <SidebarItem to="/cobrador/comisiones" label="Comisiones" icon="comisiones" />
            <SidebarItem to="/cobrador/reportes" label="Reportes" icon="stats" />
        </ul>
    );
}

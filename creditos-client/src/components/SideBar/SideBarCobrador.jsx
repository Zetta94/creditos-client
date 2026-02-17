import { useSelector } from "react-redux";
import SidebarItem from "./SideBarItem.jsx";

export default function SidebarCobrador() {
    const trayectoActivo = useSelector(state => state.trayecto.active);

    return (
        <ul className="space-y-2 font-medium">
            <SidebarItem to="/cobrador/dashboard" label="Inicio" icon="dashboard" />
            <SidebarItem to="/cobrador/sueldo" label="Sueldo" icon="grid" />
            <SidebarItem to="/cobrador/reportes" label="Reportes" icon="stats" />
            <SidebarItem
                to="/cobrador/pagos"
                label="Recorrido / Pagos"
                icon="payments"
                disabled={!trayectoActivo}
            />
            {!trayectoActivo && (
                <li className="text-xs text-gray-500 dark:text-gray-400 pl-2">
                    Iniciá el trayecto desde Inicio para habilitar el recorrido.
                </li>
            )}
        </ul>
    );
}

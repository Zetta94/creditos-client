import { NavLink, useLocation } from "react-router-dom";

export default function SidebarItem({ to, label, icon, disabled = false }) {
    const icons = {
        // === GENERALES ===
        dashboard: "📊",        // Panel general
        home: "🏠",             // Inicio
        settings: "⚙️",         // Configuración
        help: "❓",              // Ayuda o soporte
        info: "ℹ️",             // Información

        // === GESTIÓN DE CLIENTES Y USUARIOS ===
        clients: "👥",          // Clientes
        user: "👤",             // Usuario individual
        users: "🧑‍💼",          // Usuarios
        addUser: "➕👤",         // Nuevo usuario
        editUser: "✏️👤",        // Editar usuario
        deleteUser: "🗑️👤",      // Eliminar usuario

        // === CRÉDITOS / PAGOS ===
        credit: "💳",           // Crédito
        grid: "💰",             // Dinero / listado de créditos
        payments: "💵",         // Pagos
        comisiones: "💸",
        cash: "🪙",             // Efectivo
        mercadopago: "📱💳",    // MercadoPago
        stats: "📈",            // Estadísticas financieras

        // === NOTIFICACIONES / MENSAJES ===
        message: "✉️",          // Mensajes
        notification: "🔔",     // Notificaciones
        alert: "⚠️",            // Alertas
        chat: "💬",             // Chat o mensajes directos

        // === TIEMPO / PLANIFICACIÓN ===
        calendar: "📅",         // Calendario
        clock: "⏰",             // Tiempo o recordatorios
        tasks: "🗒️",            // Tareas o pendientes
        route: "🗺️",            // Recorrido o ruta
        work: "🧭",             // Inicio de jornada

        // === INFORMES Y DOCUMENTACIÓN ===
        report: "📄",           // Reportes o informes
        file: "📁",             // Archivos
        upload: "⬆️",           // Subir datos
        download: "⬇️",         // Descargar reporte

        // === ESTADOS Y VALIDACIONES ===
        success: "✅",           // Correcto
        error: "❌",             // Error
        warning: "⚠️",           // Advertencia
        pending: "⏳",           // Pendiente
        approved: "🟢",          // Aprobado
        rejected: "🔴",          // Rechazado

        // === ADMINISTRACIÓN / SISTEMA ===
        admin: "👑",             // Rol administrador
        cobrador: "🚶‍♂️",        // Rol cobrador
        tools: "🧰",             // Herramientas
        security: "🔒",          // Seguridad o permisos
        logout: "🚪",            // Cerrar sesión
    };


    const location = useLocation();
    const isActive = !disabled && location.pathname === to;

    const baseClasses = "flex items-center gap-2 p-2 rounded-lg transition";
    const stateClasses = isActive
        ? "!bg-gray-200 dark:!bg-gray-700 font-semibold"
        : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700";
    const disabledClasses = disabled ? "text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60" : "";

    const content = (
        <>
            <span>{icons[icon]}</span>
            <span>{label}</span>
        </>
    );

    return (
        <li>
            {disabled ? (
                <div className={`${baseClasses} ${disabledClasses}`} aria-disabled="true">
                    {content}
                </div>
            ) : (
                <NavLink to={to} className={`${baseClasses} ${stateClasses}`}>
                    {content}
                </NavLink>
            )}
        </li>
    );
}

import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// Mock de usuarios
const usuarios = [
    { id: 1, nombre: "Admin General", email: "admin@imperio.test", rol: "ADMIN", creditosCargados: 120, pagosRecibidos: 430 },
    { id: 2, nombre: "María López", email: "maria@imperio.test", rol: "USER", creditosCargados: 35, pagosRecibidos: 110 },
    { id: 3, nombre: "Jorge Nuñez", email: "jorge@imperio.test", rol: "USER", creditosCargados: 58, pagosRecibidos: 190 },
];

// Mock de cobros del usuario (normalmente vendría de /usuarios/:id/cobros)
const cobrosMock = [
    // user 1
    { id: "c1", usuarioId: 1, fecha: "2025-10-08", monto: 12000, cliente: "Juan Pérez" },
    { id: "c2", usuarioId: 1, fecha: "2025-10-09", monto: 8500, cliente: "Laura Gómez" },
    { id: "c3", usuarioId: 1, fecha: "2025-10-10", monto: 15000, cliente: "Carlos Díaz" },
    // user 2
    { id: "c4", usuarioId: 2, fecha: "2025-10-01", monto: 7000, cliente: "Pedro Ruiz" },
    { id: "c5", usuarioId: 2, fecha: "2025-10-10", monto: 10500, cliente: "Ana Torres" },
    // user 3
    { id: "c6", usuarioId: 3, fecha: "2025-09-30", monto: 5000, cliente: "Sofía Lima" },
];

function formatCurrency(n) {
    return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

export default function UsuarioDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const usuario = usuarios.find((u) => String(u.id) === String(id));

    const [filtros, setFiltros] = useState({
        desde: "",
        hasta: "",
        montoMin: "",
        montoMax: "",
    });

    // En real life: fetch cobros del backend por usuarioId
    const cobrosUsuario = useMemo(
        () => cobrosMock.filter((c) => String(c.usuarioId) === String(id)),
        [id]
    );

    const cobrosFiltrados = useMemo(() => {
        return cobrosUsuario.filter((c) => {
            // filtro fecha
            if (filtros.desde && c.fecha < filtros.desde) return false;
            if (filtros.hasta && c.fecha > filtros.hasta) return false;
            // filtro monto
            if (filtros.montoMin && c.monto < Number(filtros.montoMin)) return false;
            if (filtros.montoMax && c.monto > Number(filtros.montoMax)) return false;
            return true;
        });
    }, [cobrosUsuario, filtros]);

    if (!usuario) {
        return (
            <div className="p-6">
                <p className="text-red-300 mb-4">Usuario no encontrado.</p>
                <button onClick={() => navigate("/usuarios")} className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600">
                    Volver
                </button>
            </div>
        );
    }

    const totalFiltrado = cobrosFiltrados.reduce((acc, c) => acc + c.monto, 0);

    return (
        <div className="p-6 space-y-6">
            {/* Encabezado */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{usuario.nombre}</h1>
                    <p className="text-gray-300">{usuario.email}</p>
                    <span
                        className={`inline-block mt-2 px-2 py-1 rounded-full text-xs border ${usuario.rol === "ADMIN"
                            ? "bg-purple-900/40 text-purple-300 border-purple-800"
                            : "bg-slate-900/40 text-slate-300 border-slate-800"
                            }`}
                    >
                        {usuario.rol}
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-gray-800 rounded-lg p-4">
                        <div className="text-xs text-gray-400">Créditos cargados</div>
                        <div className="text-xl font-semibold">{usuario.creditosCargados}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                        <div className="text-xs text-gray-400">Pagos recibidos</div>
                        <div className="text-xl font-semibold">{usuario.pagosRecibidos}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                        <div className="text-xs text-gray-400">Total filtrado</div>
                        <div className="text-xl font-semibold">{formatCurrency(totalFiltrado)}</div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-gray-800 rounded-xl p-4">
                <div className="grid md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm mb-1">Desde (fecha)</label>
                        <input
                            type="date"
                            value={filtros.desde}
                            onChange={(e) => setFiltros((s) => ({ ...s, desde: e.target.value }))}
                            className="w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Hasta (fecha)</label>
                        <input
                            type="date"
                            value={filtros.hasta}
                            onChange={(e) => setFiltros((s) => ({ ...s, hasta: e.target.value }))}
                            className="w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Monto mínimo</label>
                        <input
                            type="number"
                            min={0}
                            value={filtros.montoMin}
                            onChange={(e) => setFiltros((s) => ({ ...s, montoMin: e.target.value }))}
                            className="w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2 outline-none"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Monto máximo</label>
                        <input
                            type="number"
                            min={0}
                            value={filtros.montoMax}
                            onChange={(e) => setFiltros((s) => ({ ...s, montoMax: e.target.value }))}
                            className="w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2 outline-none"
                            placeholder="100000"
                        />
                    </div>
                    <div className="flex items-end gap-2">
                        <button
                            onClick={() => setFiltros({ desde: "", hasta: "", montoMin: "", montoMax: "" })}
                            className="w-full px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600"
                        >
                            Limpiar
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabla de cobros */}
            <div className="overflow-x-auto rounded-lg border border-gray-700">
                <table className="min-w-full text-sm text-left text-gray-300">
                    <thead className="text-xs uppercase bg-gray-700 text-gray-200">
                        <tr>
                            <th className="px-4 py-3">Fecha</th>
                            <th className="px-4 py-3">Cliente</th>
                            <th className="px-4 py-3">Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cobrosFiltrados.length === 0 ? (
                            <tr>
                                <td className="px-4 py-4 text-gray-400" colSpan={3}>
                                    No hay cobros con los filtros actuales.
                                </td>
                            </tr>
                        ) : (
                            cobrosFiltrados
                                .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
                                .map((c) => (
                                    <tr key={c.id} className="border-t border-gray-700 bg-gray-800">
                                        <td className="px-4 py-3">{c.fecha}</td>
                                        <td className="px-4 py-3">{c.cliente}</td>
                                        <td className="px-4 py-3">{formatCurrency(c.monto)}</td>
                                    </tr>
                                ))
                        )}
                    </tbody>
                </table>
            </div>

            <div>
                <button
                    onClick={() => navigate("/usuarios")}
                    className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600"
                >
                    Volver a la lista
                </button>
            </div>
        </div>
    );
}

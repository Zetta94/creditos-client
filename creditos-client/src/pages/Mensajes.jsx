import { useState, useMemo } from "react";
import { HiExclamation, HiCheckCircle, HiClock } from "react-icons/hi";

const mensajesMock = [
    // normales: pagos recibidos
    { id: 1, fecha: "2025-10-10", tipo: "PAGO", cliente: "Juan Pérez", monto: 12500, importante: false },
    { id: 2, fecha: "2025-10-09", tipo: "PAGO", cliente: "Laura Gómez", monto: 8700, importante: false },
    { id: 3, fecha: "2025-10-08", tipo: "PAGO", cliente: "Carlos Díaz", monto: 6200, importante: false },

    // importantes: aviso de vencimiento
    { id: 4, fecha: "2025-10-11", tipo: "VENCIMIENTO", cliente: "Pedro Ruiz", monto: null, importante: true },
    // importantes: cliente no pagó
    { id: 5, fecha: "2025-10-07", tipo: "IMPAGO", cliente: "Ana Torres", monto: null, importante: true },
];

export default function Mensajes() {
    const [filtros, setFiltros] = useState({
        desde: "",
        hasta: "",
        tipo: "TODOS", // PAGO | VENCIMIENTO | IMPAGO | TODOS
        soloImportantes: false,
    });

    // normalmente harías un fetch al backend con los filtros
    const mensajesFiltrados = useMemo(() => {
        return mensajesMock.filter((m) => {
            if (filtros.desde && m.fecha < filtros.desde) return false;
            if (filtros.hasta && m.fecha > filtros.hasta) return false;
            if (filtros.tipo !== "TODOS" && m.tipo !== filtros.tipo) return false;
            if (filtros.soloImportantes && !m.importante) return false;
            return true;
        });
    }, [filtros]);

    return (
        <div className="p-6 space-y-6">
            {/* encabezado */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-2xl font-bold">Mensajes del sistema</h1>
                <button
                    onClick={() => setFiltros({ desde: "", hasta: "", tipo: "TODOS", soloImportantes: false })}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
                >
                    Limpiar filtros
                </button>
            </div>

            {/* filtros */}
            <div className="bg-gray-800 rounded-lg p-4 grid md:grid-cols-5 gap-4">
                <div>
                    <label className="block text-sm mb-1">Desde</label>
                    <input
                        type="date"
                        value={filtros.desde}
                        onChange={(e) => setFiltros((f) => ({ ...f, desde: e.target.value }))}
                        className="w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block text-sm mb-1">Hasta</label>
                    <input
                        type="date"
                        value={filtros.hasta}
                        onChange={(e) => setFiltros((f) => ({ ...f, hasta: e.target.value }))}
                        className="w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block text-sm mb-1">Tipo</label>
                    <select
                        value={filtros.tipo}
                        onChange={(e) => setFiltros((f) => ({ ...f, tipo: e.target.value }))}
                        className="w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2"
                    >
                        <option value="TODOS">Todos</option>
                        <option value="PAGO">Pagos recibidos</option>
                        <option value="VENCIMIENTO">Próximo vencimiento</option>
                        <option value="IMPAGO">Cliente en mora</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        id="importantes"
                        type="checkbox"
                        checked={filtros.soloImportantes}
                        onChange={(e) => setFiltros((f) => ({ ...f, soloImportantes: e.target.checked }))}
                        className="w-4 h-4 accent-blue-600"
                    />
                    <label htmlFor="importantes" className="text-sm">
                        Solo importantes
                    </label>
                </div>
            </div>

            {/* lista de mensajes */}
            <div className="space-y-3">
                {mensajesFiltrados.length === 0 ? (
                    <p className="text-gray-400 text-center py-10">No hay mensajes con los filtros seleccionados.</p>
                ) : (
                    mensajesFiltrados
                        .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
                        .map((m) => (
                            <div
                                key={m.id}
                                className={`p-4 rounded-lg border flex justify-between items-center ${m.importante
                                    ? m.tipo === "IMPAGO"
                                        ? "bg-red-900/40 border-red-800 text-red-200"
                                        : "bg-yellow-900/40 border-yellow-700 text-yellow-200"
                                    : "bg-gray-800 border-gray-700 text-gray-200"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {m.tipo === "PAGO" && <HiCheckCircle className="h-6 w-6 text-green-400" />}
                                    {m.tipo === "VENCIMIENTO" && <HiClock className="h-6 w-6 text-yellow-400" />}
                                    {m.tipo === "IMPAGO" && <HiExclamation className="h-6 w-6 text-red-400" />}

                                    <div>
                                        {m.tipo === "PAGO" && (
                                            <p>
                                                Se recibió un pago de <span className="font-semibold">{m.cliente}</span> por{" "}
                                                <span className="text-green-400">${m.monto?.toLocaleString("es-AR")}</span>
                                            </p>
                                        )}
                                        {m.tipo === "VENCIMIENTO" && (
                                            <p>
                                                <span className="font-semibold">{m.cliente}</span> tiene un pago próximo a vencer.
                                            </p>
                                        )}
                                        {m.tipo === "IMPAGO" && (
                                            <p>
                                                <span className="font-semibold">{m.cliente}</span> no realizó su pago a tiempo.
                                            </p>
                                        )}
                                        <span className="text-xs text-gray-400">{m.fecha}</span>
                                    </div>
                                </div>

                                {m.importante && (
                                    <span className="text-xs uppercase bg-red-600/80 text-white px-2 py-1 rounded-md">
                                        Importante
                                    </span>
                                )}
                            </div>
                        ))
                )}
            </div>
        </div>
    );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockCobradorClientes, mockClients } from "../mocks/mockData";
import { HiArrowRight } from "react-icons/hi";

export default function ClientesAsignadosCobrador({ cobradorId }) {
    const [tipo, setTipo] = useState("diario");
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        cargarClientes(tipo);
    }, [tipo]);

    function cargarClientes(filtro) {
        setLoading(true);
        try {
            const asignaciones = mockCobradorClientes
                .filter((a) => a.cobradorId === cobradorId && a.tipoPago === filtro)
                .sort((a, b) => a.orden - b.orden);

            const clientesAsignados = asignaciones.map((a) => {
                const cliente = mockClients.find((c) => c.id === a.clienteId);
                return { ...cliente, orden: a.orden, tipoPago: a.tipoPago };
            });

            setClientes(clientesAsignados);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Clientes asignados
            </h1>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2">
                {["diario", "semanal", "mensual"].map((f) => (
                    <button
                        key={f}
                        onClick={() => setTipo(f)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tipo === f
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Lista */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Lista de clientes ({clientes.length})
                    </h2>
                </div>

                {loading ? (
                    <p className="p-4 text-gray-500 dark:text-gray-400">
                        Cargando clientes...
                    </p>
                ) : clientes.length === 0 ? (
                    <p className="p-4 text-gray-500 dark:text-gray-400">
                        No hay clientes asignados.
                    </p>
                ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {clientes.map((c) => (
                            <li
                                key={c.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition"
                            >
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                        {c.name}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {c.address || "Sin dirección"} — Orden:{" "}
                                        <span className="font-semibold">{c.orden}</span>
                                    </p>
                                </div>

                                <button
                                    onClick={() => navigate(`/cobrador/pagos/${c.id}`)}
                                    className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500 focus:outline-none"
                                >
                                    Cobrar
                                    <HiArrowRight className="h-4 w-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

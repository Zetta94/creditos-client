import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockClients, mockCredits } from "../mocks/mockData";
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
            const hoy = new Date();
            const mapTipo = { DAILY: "diario", WEEKLY: "semanal", MONTHLY: "mensual" };

            // 🔍 Filtramos créditos por cobrador
            const creditosCobrador = mockCredits.filter(
                (cr) => cr.userId === cobradorId && cr.status !== "PAID"
            );

            // 🔍 Mapeamos tipo de pago real
            const creditosFiltrados = creditosCobrador.filter(
                (cr) => mapTipo[cr.type] === filtro
            );

            // Lógica para determinar si hoy corresponde el pago
            const creditosHoy = creditosFiltrados.filter((cr) => {
                const inicio = new Date(cr.startDate);
                const diffDias = Math.floor((hoy - inicio) / (1000 * 60 * 60 * 24));
                if (filtro === "diario") return true;
                if (filtro === "semanal") return diffDias % 7 === 0;
                if (filtro === "mensual") return hoy.getDate() === inicio.getDate();
                return false;
            });

            // 🔹 Enriquecemos con info del cliente y cuotas
            const clientesHoy = creditosHoy.map((cr) => {
                const cliente = mockClients.find((c) => c.id === cr.clientId);
                const cuotaActual = cr.paidInstallments + 1;
                const cuotasRestantes = cr.totalInstallments - cr.paidInstallments;

                return {
                    ...cliente,
                    creditoId: cr.id,
                    monto: cr.installmentAmount,
                    estado: cr.status,
                    tipoPago: mapTipo[cr.type],
                    cuotaActual,
                    cuotasRestantes,
                    totalCuotas: cr.totalInstallments,
                };
            });

            setClientes(clientesHoy);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Pagos del día
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
                        Cobros a realizar hoy ({clientes.length})
                    </h2>
                </div>

                {loading ? (
                    <p className="p-4 text-gray-500 dark:text-gray-400">
                        Cargando clientes...
                    </p>
                ) : clientes.length === 0 ? (
                    <p className="p-4 text-gray-500 dark:text-gray-400">
                        No hay pagos programados para hoy.
                    </p>
                ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {clientes.map((c) => (
                            <li
                                key={c.creditoId}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition"
                            >
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                        {c.name}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {c.address || "Sin dirección"}
                                    </p>

                                    {/* 💰 Info de pago */}
                                    <p className="text-sm text-gray-400 dark:text-gray-500">
                                        Monto cuota:{" "}
                                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                                            ${c.monto.toLocaleString("es-AR")}
                                        </span>{" "}
                                        — Cuota{" "}
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                                            {c.cuotaActual}/{c.totalCuotas}
                                        </span>{" "}
                                        ({c.cuotasRestantes} restantes) — Estado:{" "}
                                        <span className="capitalize">{c.estado.toLowerCase()}</span>
                                    </p>
                                </div>

                                <button
                                    onClick={() => navigate(`/cobrador/pagos/${c.creditoId}`)}
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

import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    mockUsers,
    mockClients,
    mockCredits,
    mockPayments,
} from "../mocks/mockData.js";
import { HiOutlineArrowLeft } from "react-icons/hi2";

export default function UsuarioReportes() {
    const { id } = useParams();
    const navigate = useNavigate();
    const usuario = mockUsers.find((u) => String(u.id) === String(id));

    const [semana, setSemana] = useState(() => {
        const today = new Date();
        const monday = new Date(today.setDate(today.getDate() - today.getDay() + 1));
        return monday.toISOString().slice(0, 10);
    });
    const [diaFiltro, setDiaFiltro] = useState("");
    const [pagina, setPagina] = useState(1);
    const porPagina = 5;

    const pagosUsuario = useMemo(
        () => mockPayments.filter((p) => p.employeeId === id),
        [id]
    );

    const pagosSemana = useMemo(() => {
        const inicioSemana = new Date(semana);
        const finSemana = new Date(inicioSemana);
        finSemana.setDate(inicioSemana.getDate() + 6);

        return pagosUsuario.filter((p) => {
            const fecha = new Date(p.date);
            return fecha >= inicioSemana && fecha <= finSemana;
        });
    }, [semana, pagosUsuario]);

    const pagosFiltrados = diaFiltro
        ? pagosSemana.filter((p) => p.date === diaFiltro)
        : pagosSemana;

    const totalPaginas = Math.ceil(pagosFiltrados.length / porPagina);
    const pagosPaginados = pagosFiltrados.slice(
        (pagina - 1) * porPagina,
        pagina * porPagina
    );

    const resumen = pagosFiltrados.reduce(
        (acc, p) => {
            const credito = mockCredits.find((cr) => cr.id === p.creditId);
            if (credito?.type === "DAILY" || credito?.type === "WEEKLY") {
                acc.efectivo += p.amount;
            } else {
                acc.mercadopago += p.amount;
            }
            return acc;
        },
        { efectivo: 0, mercadopago: 0 }
    );

    if (!usuario)
        return (
            <div className="text-center text-red-400 mt-10">Usuario no encontrado.</div>
        );

    return (
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-8">
            {/* === HEADER === */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    Reportes de {usuario.name}
                </h1>
                <button
                    onClick={() => navigate(`/usuarios/${id}`)}
                    className="flex items-center gap-2 rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 w-full sm:w-auto justify-center"
                >
                    <HiOutlineArrowLeft className="h-4 w-4" />
                    Volver
                </button>
            </div>

            {/* === FILTROS === */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Filtros
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="text-sm text-gray-600 dark:text-gray-300">
                            Semana seleccionada
                        </label>
                        <input
                            type="date"
                            value={semana}
                            onChange={(e) => {
                                setSemana(e.target.value);
                                setPagina(1);
                            }}
                            className="w-full mt-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-600 dark:text-gray-300">
                            Filtrar por día
                        </label>
                        <select
                            value={diaFiltro}
                            onChange={(e) => {
                                setDiaFiltro(e.target.value);
                                setPagina(1);
                            }}
                            className="w-full mt-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            <option value="">Todos los días</option>
                            {[...new Set(pagosSemana.map((p) => p.date))].map((d) => (
                                <option key={d} value={d}>
                                    {new Date(d).toLocaleDateString("es-AR", {
                                        weekday: "long",
                                        day: "2-digit",
                                        month: "short",
                                    })}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* === RESUMEN === */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Kpi
                    label="Total MercadoPago"
                    color="blue"
                    value={`$${resumen.mercadopago.toLocaleString("es-AR")}`}
                />
                <Kpi
                    label="Total Efectivo"
                    color="emerald"
                    value={`$${resumen.efectivo.toLocaleString("es-AR")}`}
                />
                <Kpi label="Cobros" color="indigo" value={pagosFiltrados.length} />
                <Kpi
                    label="Semana"
                    color="gray"
                    value={`${new Date(semana).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                    })} - ${new Date(
                        new Date(semana).setDate(new Date(semana).getDate() + 6)
                    ).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                    })}`}
                />
            </div>

            {/* === TABLA SIMPLE === */}
            <div className="rounded-xl border border-gray-200 bg-white p-2 sm:p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        <tr>
                            <th className="px-3 py-2 sm:px-4 sm:py-3 font-medium">Fecha</th>
                            <th className="px-3 py-2 sm:px-4 sm:py-3 font-medium">Cliente</th>
                            <th className="px-3 py-2 sm:px-4 sm:py-3 font-medium text-center">
                                Acción
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {pagosPaginados.length > 0 ? (
                            pagosPaginados.map((p) => {
                                const credito = mockCredits.find((cr) => cr.id === p.creditId);
                                const cliente = mockClients.find(
                                    (c) => c.id === credito?.clientId
                                );

                                return (
                                    <tr
                                        key={p.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/70"
                                    >
                                        <td className="px-3 py-2 sm:px-4 sm:py-3">
                                            {new Date(p.date).toLocaleDateString("es-AR", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3">
                                            {cliente?.name || "-"}
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-center">
                                            <button
                                                onClick={() =>
                                                    navigate(`/creditos/${credito?.id}`)
                                                }
                                                className="px-3 py-1 rounded-md bg-blue-600 text-white text-xs sm:text-sm hover:bg-blue-700 transition"
                                            >
                                                Ver crédito
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td
                                    colSpan={3}
                                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                                >
                                    No hay pagos en esta semana.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* === Paginación === */}
                {totalPaginas > 1 && (
                    <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <button
                            onClick={() => setPagina((p) => Math.max(1, p - 1))}
                            disabled={pagina === 1}
                            className="px-3 py-1 border rounded-md dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <span>
                            Página {pagina} de {totalPaginas}
                        </span>
                        <button
                            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                            disabled={pagina === totalPaginas}
                            className="px-3 py-1 border rounded-md dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function Kpi({ label, value, color = "gray" }) {
    const colors = {
        blue: "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700",
        emerald:
            "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700",
        indigo:
            "text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-700",
        gray: "text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600",
    };

    return (
        <div
            className={`rounded-xl border bg-white p-3 sm:p-4 text-center dark:bg-gray-800 shadow-sm ${colors[color]}`}
        >
            <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
            <div className="text-base sm:text-lg font-semibold">{value}</div>
        </div>
    );
}

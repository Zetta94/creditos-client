import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchUser } from "../services/usersService";
import { fetchClients } from "../services/clientsService";
import { fetchCredits } from "../services/creditsService";
import { fetchPayments } from "../services/paymentsService";
import { fetchReportsByUser } from "../services/reportsService";
import { HiOutlineArrowLeft } from "react-icons/hi2";

export default function UsuarioReportes() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState(null);
    const [clientes, setClientes] = useState([]);
    const [creditos, setCreditos] = useState([]);
    const [pagos, setPagos] = useState([]);
    const [reportes, setReportes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rateLimit, setRateLimit] = useState(false);

    const [semana, setSemana] = useState(() => {
        const today = new Date();
        const monday = new Date(today.setDate(today.getDate() - today.getDay() + 1));
        return monday.toISOString().slice(0, 10);
    });
    const [diaFiltro, setDiaFiltro] = useState("");
    const [pagina, setPagina] = useState(1);
    const porPagina = 5;

    useEffect(() => {
        let mounted = true;
        const controller = new AbortController();
        const load = async () => {
            setLoading(true);
            setRateLimit(false);
            try {
                const [u, cl, cr, pa, rep] = await Promise.all([
                    fetchUser(id).then((r) => r.data),
                    fetchClients({ page: 1, pageSize: 500 }).then((r) => r.data?.data ?? []),
                    fetchCredits({ page: 1, pageSize: 2000 }).then((r) => r.data?.data ?? []),
                    fetchPayments({ page: 1, pageSize: 500 }).then((r) => r.data?.data ?? []),
                    fetchReportsByUser(id, { page: 1, pageSize: 200 }).then((r) => r.data?.data ?? []).catch(() => [])
                ]);
                if (!mounted) return;
                setUsuario(u);
                setClientes(cl);
                setCreditos(cr);
                setPagos(pa);
                setReportes(rep);
            } catch (err) {
                if (!mounted) return;
                if (err?.response?.status === 429) {
                    setRateLimit(true);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => {
            mounted = false;
            controller.abort();
        };
    }, [id]);

    const creditosAsignados = useMemo(
        () => creditos.filter((cr) => cr.userId === id),
        [creditos, id]
    );

    const pagosOrdenadosPorCredito = useMemo(() => {
        const map = new Map();
        pagos.forEach((p) => {
            const list = map.get(p.creditId) || [];
            list.push(p);
            map.set(p.creditId, list);
        });
        map.forEach((list) => {
            list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        });
        return map;
    }, [pagos]);

    const totalPagadoPorCredito = useMemo(() => {
        const map = new Map();
        pagos.forEach((p) => {
            const total = map.get(p.creditId) || 0;
            map.set(p.creditId, total + (Number(p.amount) || 0));
        });
        return map;
    }, [pagos]);

    const calcularMontoPlan = (credito) => {
        if (!credito) return 0;
        if (credito.totalInstallments && credito.installmentAmount) {
            return credito.totalInstallments * credito.installmentAmount;
        }
        return Number(credito.amount || 0);
    };

    const calcularRestante = (credito) => {
        if (!credito) return 0;
        const totalPlan = calcularMontoPlan(credito);
        const pagado = totalPagadoPorCredito.get(credito.id) || 0;
        return Math.max(0, totalPlan - pagado);
    };

    const pagosUsuario = useMemo(() => {
        return pagos.filter((p) => {
            if (p.employeeId !== id) return false;
            const fecha = new Date(p.date);
            return !Number.isNaN(fecha.getTime()) && fecha.getDay() !== 0;
        });
    }, [pagos, id]);

    const pagosPorFecha = useMemo(() => {
        const map = new Map();
        pagosUsuario.forEach((p) => {
            const fechaKey = new Date(p.date).toISOString().slice(0, 10);
            const list = map.get(fechaKey) || [];
            list.push(p);
            map.set(fechaKey, list);
        });
        return map;
    }, [pagosUsuario]);

    const pagosSemana = useMemo(() => {
        const inicioSemana = new Date(semana);
        const finSemana = new Date(inicioSemana);
        finSemana.setDate(inicioSemana.getDate() + 5);

        return pagosUsuario.filter((p) => {
            const fecha = new Date(p.date);
            return fecha >= inicioSemana && fecha <= finSemana;
        });
    }, [semana, pagosUsuario]);

    const pagosFiltrados = diaFiltro
        ? pagosSemana.filter((p) => new Date(p.date).toISOString().slice(0, 10) === diaFiltro)
        : pagosSemana;

    const totalPaginas = Math.ceil(pagosFiltrados.length / porPagina);
    const pagosPaginados = pagosFiltrados.slice(
        (pagina - 1) * porPagina,
        pagina * porPagina
    );

    const resumenSemana = useMemo(() => {
        const cobrado = pagosSemana.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        const creditosSinPago = creditosAsignados.filter((cr) => {
            const restante = calcularRestante(cr);
            if (restante <= 0) return false;
            return !pagosSemana.some((p) => p.creditId === cr.id);
        });
        return {
            cobrado,
            creditosSinPago: creditosSinPago.length,
            pendiente: creditosAsignados.reduce((acc, cr) => acc + calcularRestante(cr), 0)
        };
    }, [pagosSemana, creditosAsignados, totalPagadoPorCredito]);

    const mesReferencia = useMemo(() => {
        const base = new Date(semana);
        return {
            inicio: new Date(base.getFullYear(), base.getMonth(), 1),
            fin: new Date(base.getFullYear(), base.getMonth() + 1, 0)
        };
    }, [semana]);

    const pagosMes = useMemo(() => {
        return pagosUsuario.filter((p) => {
            const fecha = new Date(p.date);
            return fecha >= mesReferencia.inicio && fecha <= mesReferencia.fin;
        });
    }, [pagosUsuario, mesReferencia]);

    const resumenMes = useMemo(() => {
        const cobrado = pagosMes.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        const creditosSinPago = creditosAsignados.filter((cr) => {
            const restante = calcularRestante(cr);
            if (restante <= 0) return false;
            return !pagosMes.some((p) => p.creditId === cr.id);
        });
        return {
            cobrado,
            creditosSinPago: creditosSinPago.length,
            pendiente: creditosAsignados.reduce((acc, cr) => acc + calcularRestante(cr), 0)
        };
    }, [pagosMes, creditosAsignados, totalPagadoPorCredito]);

    const resumenDiario = useMemo(() => {
        const inicioSemana = new Date(semana);
        const items = [];
        for (let i = 0; i < 6; i += 1) {
            const fecha = new Date(inicioSemana);
            fecha.setDate(inicioSemana.getDate() + i);
            const key = fecha.toISOString().slice(0, 10);
            const pagosDia = pagosPorFecha.get(key) || [];
            const cobrado = pagosDia.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
            const creditosSinPago = creditosAsignados.filter((cr) => {
                const restante = calcularRestante(cr);
                if (restante <= 0) return false;
                return !pagosDia.some((p) => p.creditId === cr.id);
            }).length;
            items.push({
                fecha,
                key,
                cobrado,
                creditosSinPago,
                pagos: pagosDia.length
            });
        }
        return items;
    }, [semana, pagosPorFecha, creditosAsignados, totalPagadoPorCredito]);

    const diasConPagos = useMemo(() => {
        const set = new Set();
        pagosSemana.forEach((p) => {
            set.add(new Date(p.date).toISOString().slice(0, 10));
        });
        return Array.from(set).sort();
    }, [pagosSemana]);

    if (loading) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-6">
                <p className="text-center text-gray-500 dark:text-gray-400">Cargando reportes...</p>
            </div>
        );
    }
    if (rateLimit) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-6">
                <p className="text-center text-red-500 dark:text-red-400 font-semibold">Demasiadas solicitudes. Espera unos segundos y vuelve a intentar.</p>
            </div>
        );
    }

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
                            {diasConPagos.map((key) => (
                                <option key={key} value={key}>
                                    {new Date(key).toLocaleDateString("es-AR", {
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

            {/* === RESÚMENES === */}
            <div className="grid gap-4">
                <ResumenPanel
                    title="Resumen semanal (lun-sáb)"
                    cobrado={resumenSemana.cobrado}
                    creditosSinPago={resumenSemana.creditosSinPago}
                    pendiente={resumenSemana.pendiente}
                    periodo={`Semana del ${new Date(semana).toLocaleDateString("es-AR")}`}
                />
                <ResumenPanel
                    title={`Resumen mensual (${mesReferencia.inicio.toLocaleDateString("es-AR", { month: "long", year: "numeric" })})`}
                    cobrado={resumenMes.cobrado}
                    creditosSinPago={resumenMes.creditosSinPago}
                    pendiente={resumenMes.pendiente}
                />
                <ResumenDiarioPanel datos={resumenDiario} />
            </div>

            {/* === REPORTES DEL USUARIO (REGISTRADOS) === */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Reportes registrados</h2>

                <div className="overflow-x-auto mt-4">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            <tr>
                                <th className="px-3 py-2 sm:px-4 sm:py-3 font-medium">Fecha</th>
                                <th className="px-3 py-2 sm:px-4 sm:py-3 font-medium">Clientes visitados</th>
                                <th className="px-3 py-2 sm:px-4 sm:py-3 font-medium">Efectivo</th>
                                <th className="px-3 py-2 sm:px-4 sm:py-3 font-medium">MercadoPago</th>
                                <th className="px-3 py-2 sm:px-4 sm:py-3 font-medium">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {reportes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No hay reportes registrados.</td>
                                </tr>
                            ) : (
                                reportes.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/70">
                                        <td className="px-3 py-2 sm:px-4 sm:py-3">{new Date(r.fechaDeReporte).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}</td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3">{r.clientsVisited}</td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-green-600">${(r.efectivo || 0).toLocaleString("es-AR")}</td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-blue-600">${(r.mercadopago || 0).toLocaleString("es-AR")}</td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 font-semibold">${(r.total || 0).toLocaleString("es-AR")}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* === PAGOS DETALLADOS === */}
            <div className="rounded-xl border border-gray-200 bg-white p-2 sm:p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        <tr>
                            <th className="px-3 py-2 sm:px-4 sm:py-3 font-medium">Fecha</th>
                            <th className="px-3 py-2 sm:px-4 sm:py-3 font-medium">Cliente</th>
                            <th className="px-3 py-2 sm:px-4 sm:py-3 font-medium">Monto</th>
                            <th className="px-3 py-2 sm:px-4 sm:py-3 font-medium">Método</th>
                            <th className="px-3 py-2 sm:px-4 sm:py-3 font-medium">Cuota</th>
                            <th className="px-3 py-2 sm:px-4 sm:py-3 font-medium">Saldo restante</th>
                            <th className="px-3 py-2 sm:px-4 sm:py-3 font-medium text-center">
                                Acción
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {pagosPaginados.length > 0 ? (
                            pagosPaginados.map((p) => {
                                const credito = creditos.find((cr) => cr.id === p.creditId);
                                const cliente = clientes.find(
                                    (c) => c.id === credito?.clientId
                                );
                                const historial = pagosOrdenadosPorCredito.get(p.creditId) || [];
                                const posicion = historial.findIndex((item) => item.id === p.id);
                                const pagadoHasta = historial
                                    .slice(0, posicion + 1)
                                    .reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
                                const totalPlan = calcularMontoPlan(credito);
                                const restanteTrasPago = Math.max(0, totalPlan - pagadoHasta);
                                const cuotaActual = credito?.totalInstallments
                                    ? Math.min(posicion + 1, credito.totalInstallments)
                                    : posicion + 1;

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
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 font-semibold text-gray-900 dark:text-gray-100">
                                            ${Number(p.amount || 0).toLocaleString("es-AR")}
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-gray-600 dark:text-gray-300">
                                            {p.methodSummary || "-"}
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3">
                                            {cuotaActual}
                                            {credito?.totalInstallments ? ` / ${credito.totalInstallments}` : ""}
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-gray-600 dark:text-gray-300">
                                            ${restanteTrasPago.toLocaleString("es-AR")}
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
                                    colSpan={7}
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

function ResumenPanel({ title, cobrado, creditosSinPago, pendiente, periodo }) {
    const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 space-y-4">
            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
                {periodo && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{periodo}</p>
                )}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
                <Kpi label="Cobrado" value={currency.format(cobrado)} color="emerald" />
                <Kpi label="Créditos sin pagar" value={creditosSinPago} color="indigo" />
                <Kpi label="Pendiente total" value={currency.format(pendiente)} color="gray" />
            </div>
        </div>
    );
}

function ResumenDiarioPanel({ datos }) {
    const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Resumen diario</h3>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {datos.map((item) => (
                    <div key={item.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3">
                        <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                {item.fecha.toLocaleDateString("es-AR", {
                                    weekday: "long",
                                    day: "2-digit",
                                    month: "short",
                                })}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {item.pagos} pagos registrados
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm">
                            <span className="font-medium text-emerald-600 dark:text-emerald-300">
                                Cobrado: {currency.format(item.cobrado)}
                            </span>
                            <span className="text-indigo-600 dark:text-indigo-300">
                                Créditos sin pagar: {item.creditosSinPago}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

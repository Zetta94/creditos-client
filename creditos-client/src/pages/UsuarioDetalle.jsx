import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    mockUsers,
    mockCredits,
    mockClients,
    mockPayments,
} from "../mocks/mockData.js";
import OrdenarClientes from "../pages/OrdenarClientes.jsx";
import { HiOutlineArrowLeft, HiPencil } from "react-icons/hi2";

export default function UsuarioDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const usuarioBase = mockUsers.find((u) => String(u.id) === String(id));
    const [usuario] = useState(usuarioBase);
    const isAdmin = true;

    // === COBROS Y KPIs ===
    const cobrosUsuario = useMemo(() => {
        const pagos = mockPayments.filter((p) => p.employeeId === id);
        return pagos.map((p) => {
            const credito = mockCredits.find((cr) => cr.id === p.creditId);
            const cliente = mockClients.find((c) => c.id === credito?.clientId);
            return {
                id: p.id,
                fecha: p.date,
                monto: p.amount,
                cliente: cliente ? cliente.name : "Cliente desconocido",
            };
        });
    }, [id]);

    const totalCobrado = cobrosUsuario.reduce((acc, c) => acc + c.monto, 0);
    const creditosCargados = usuario?.creditosAsignados?.length || 0;
    const pagosRecibidos = cobrosUsuario.length;

    if (!usuario)
        return (
            <div className="text-center text-red-400 mt-10">
                Usuario no encontrado.
            </div>
        );

    return (
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-10">

            {/* === BOTÓN VOLVER === */}
            <div className="flex justify-end">
                <button
                    onClick={() => navigate("/usuarios")}
                    className="flex items-center gap-2 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                    <HiOutlineArrowLeft className="h-4 w-4" />
                    Volver
                </button>
            </div>
            {/* === DATOS PERSONALES === */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-8 p-6 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 transition">
                    {/* === Columna izquierda: Info del usuario === */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full lg:w-1/2">
                        {/* Avatar / Inicial */}
                        <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl font-bold shadow-md">
                            {usuario.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Datos personales */}
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {usuario.name}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{usuario.email}</p>

                            <span
                                className={`mt-2 w-fit rounded-full border px-3 py-1 text-xs font-medium tracking-wide ${usuario.role === "ADMIN"
                                    ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                                    : "border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                    }`}
                            >
                                {usuario.role === "cobrador" ? "Cobrador" : usuario.role}
                            </span>

                            <div className="mt-4 grid grid-cols-2 gap-y-1 text-sm text-gray-700 dark:text-gray-300">
                                <p className="font-medium">📞 Teléfono:</p>
                                <p>{usuario.phone}</p>
                                <p className="font-medium">📍 Dirección:</p>
                                <p>{usuario.address}</p>
                                <p className="font-medium">🪪 Documento:</p>
                                <p>{usuario.document}</p>
                                <p className="font-medium">💼 Responsabilidad:</p>
                                <p>{usuario.responsability}</p>
                                <p className="font-medium">💰 Sueldo:</p>
                                <p>${usuario.salary?.toLocaleString("es-AR")}</p>
                                <p className="font-medium">🏦 Tipo sueldo:</p>
                                <p>{usuario.salaryType}</p>
                                <p className="font-medium">🎯 Comisión:</p>
                                <p>{usuario.comisions}%</p>
                            </div>
                        </div>
                    </div>

                    {/* === Columna derecha: KPIs y botón === */}
                    <div className="w-full lg:w-1/2 flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Kpi label="Créditos cargados" value={creditosCargados} />
                            <Kpi label="Pagos recibidos" value={pagosRecibidos} />
                            <Kpi
                                label="Total cobrado"
                                value={totalCobrado.toLocaleString("es-AR", {
                                    style: "currency",
                                    currency: "ARS",
                                    maximumFractionDigits: 0,
                                })}
                            />
                        </div>

                        {isAdmin && (
                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                                <button
                                    onClick={() => navigate(`/usuarios/${usuario.id}/editar`)}
                                    className="flex items-center justify-center gap-2 rounded-xl border border-blue-500 bg-blue-600/90 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 hover:shadow-md active:scale-95 dark:bg-blue-700 dark:hover:bg-blue-600"
                                >
                                    <HiPencil className="h-5 w-5" />
                                    Editar información
                                </button>

                                <button
                                    onClick={() => navigate(`/usuarios/${usuario.id}/reportes`)}
                                    className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500 bg-emerald-600/90 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 hover:shadow-md active:scale-95 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                                >
                                    📊 Ver reportes
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* === ORDENAR CLIENTES === */}
            {usuario.role === "cobrador" && (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <OrdenarClientes cobradorId={usuario.id} />
                </div>
            )}


        </div>
    );
}

function Kpi({ label, value }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
            <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
            <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {value}
            </div>
        </div>
    );
}

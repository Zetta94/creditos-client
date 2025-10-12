// pages/ClienteDetalle.jsx
import { useNavigate, useParams } from "react-router-dom";

const clientesMock = [
    { id: "c1", nombre: "Juan Pérez", telefono: "+54 9 2664 000000", documento: "30123456", direccion: "Calle Falsa 123", ciudad: "San Luis", provincia: "San Luis", confianza: "Alta", notas: "" },
    { id: "c2", nombre: "Laura Gómez", telefono: "+54 9 2664 123456", documento: "28999888", direccion: "Av. Siempreviva 742", ciudad: "San Luis", provincia: "San Luis", confianza: "Baja", notas: "Llamar antes" },
];

const creditosMock = [
    { id: "cr1", clientId: "c1", monto: 100000, cuotas: 10, pagadas: 6, estado: "PENDING", inicio: "2025-06-10" },
    { id: "cr3", clientId: "c1", monto: 80000, cuotas: 8, pagadas: 4, estado: "OVERDUE", inicio: "2025-03-01" },
    { id: "cr2", clientId: "c2", monto: 150000, cuotas: 12, pagadas: 12, estado: "PAID", inicio: "2025-02-15" },
];

export default function ClienteDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();

    const cliente = clientesMock.find((c) => c.id === id);
    const creditos = creditosMock.filter((cr) => cr.clientId === id);

    if (!cliente) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
                <p className="mb-4 text-red-400">Cliente no encontrado.</p>
                <button
                    onClick={() => navigate("/clientes")}
                    className="rounded-lg bg-gray-700 px-4 py-2 hover:bg-gray-600"
                >
                    Volver
                </button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h1 className="truncate text-xl font-bold sm:text-2xl">{cliente.nombre}</h1>
                    <p className="text-sm text-gray-300">
                        {cliente.telefono} • DNI: {cliente.documento}
                    </p>
                    <p className="text-sm text-gray-400">
                        {cliente.direccion} — {cliente.ciudad}, {cliente.provincia}
                    </p>
                    <p className="text-sm text-gray-400">
                        Confianza: <span className="font-semibold">{cliente.confianza}</span>
                    </p>
                    {cliente.notas && (
                        <p className="mt-1 text-sm italic text-gray-400">Notas: {cliente.notas}</p>
                    )}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                    <button
                        onClick={() => navigate(`/clientes/${cliente.id}/editar`)}
                        className="w-full rounded-lg bg-gray-700 px-4 py-2 text-white hover:bg-gray-600 sm:w-auto"
                    >
                        Editar
                    </button>
                    <button
                        onClick={() => navigate("/clientes")}
                        className="w-full rounded-lg bg-gray-700 px-4 py-2 text-white hover:bg-gray-600 sm:w-auto"
                    >
                        Volver
                    </button>
                </div>
            </div>

            {/* Créditos */}
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold">Créditos del cliente</h2>
                    <button
                        onClick={() => navigate("/creditos/nuevo")}
                        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:w-auto"
                    >
                        + Nuevo crédito
                    </button>
                </div>

                {/* Lista MOBILE: cards */}
                <div className="grid gap-3 sm:hidden">
                    {creditos.length === 0 ? (
                        <CardEmpty />
                    ) : (
                        creditos.map((cr) => <CreditoCard key={cr.id} cr={cr} onView={() => navigate(`/creditos/${cr.id}`)} />)
                    )}
                </div>

                {/* Tabla DESKTOP */}
                <div className="hidden overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 sm:block">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 z-10 bg-gray-50/80 text-gray-600 backdrop-blur dark:bg-gray-800/80 dark:text-gray-300">
                            <tr>
                                <th className="min-w-[140px] px-4 py-3 font-medium">Crédito</th>
                                <th className="min-w-[140px] px-4 py-3 font-medium">Monto</th>
                                <th className="min-w-[100px] px-4 py-3 font-medium">Cuotas</th>
                                <th className="min-w-[120px] px-4 py-3 font-medium">Pagadas</th>
                                <th className="min-w-[120px] px-4 py-3 font-medium">Estado</th>
                                <th className="min-w-[140px] px-4 py-3 text-center font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {creditos.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                        Sin créditos para este cliente.
                                    </td>
                                </tr>
                            ) : (
                                creditos.map((cr) => (
                                    <tr key={cr.id} className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-800/70">
                                        <td className="px-4 py-3 align-middle">{cr.id}</td>
                                        <td className="px-4 py-3 align-middle">
                                            ${cr.monto.toLocaleString("es-AR")}
                                        </td>
                                        <td className="px-4 py-3 align-middle">{cr.cuotas}</td>
                                        <td className="px-4 py-3 align-middle">
                                            <div className="flex items-center gap-2">
                                                <span>
                                                    {cr.pagadas}/{cr.cuotas}
                                                </span>
                                                <Progress value={(cr.pagadas / cr.cuotas) * 100} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 align-middle">
                                            <EstadoPill estado={cr.estado} />
                                        </td>
                                        <td className="px-4 py-3 text-center align-middle">
                                            <button
                                                onClick={() => navigate(`/creditos/${cr.id}`)}
                                                className="rounded-md bg-sky-600 px-3 py-2 text-white hover:bg-sky-500"
                                            >
                                                Ver crédito
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

/* ===== Subcomponentes UI (JS puro) ===== */

function estadoClasses(estado) {
    return {
        PENDING:
            "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
        PAID:
            "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
        OVERDUE:
            "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    }[estado];
}

function EstadoPill({ estado }) {
    const label = estado === "PENDING" ? "Pendiente" : estado === "PAID" ? "Pagado" : "Vencido";
    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${estadoClasses(estado)}`}>
            {label}
        </span>
    );
}

function Progress({ value }) {
    return (
        <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
                className="h-full bg-blue-600 transition-[width] duration-300 ease-out"
                style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
            />
        </div>
    );
}

function CreditoCard({ cr, onView }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                    <div className="text-sm font-semibold">Crédito {cr.id}</div>
                    <div className="text-xs text-gray-500">Inicio: {cr.inicio}</div>
                </div>
                <EstadoPill estado={cr.estado} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Monto</div>
                <div>${cr.monto.toLocaleString("es-AR")}</div>
                <div className="text-gray-500">Cuotas</div>
                <div>{cr.cuotas}</div>
                <div className="text-gray-500">Pagadas</div>
                <div className="flex items-center gap-2">
                    {cr.pagadas}/{cr.cuotas}
                    <Progress value={(cr.pagadas / cr.cuotas) * 100} />
                </div>
            </div>

            <div className="mt-3">
                <button
                    onClick={onView}
                    className="w-full rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500"
                >
                    Ver crédito
                </button>
            </div>
        </div>
    );
}

function CardEmpty() {
    return (
        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Sin créditos para este cliente.
        </div>
    );
}

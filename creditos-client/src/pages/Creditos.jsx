import { useNavigate } from "react-router-dom";
import { HiPlus, HiEye } from "react-icons/hi";

const creditosMock = [
    {
        id: "cr1",
        cliente: "Juan Pérez",
        monto: 100000,
        cuotas: 10,
        pagadas: 6,
        estado: "PENDING",
        fechaInicio: "2025-06-10",
    },
    {
        id: "cr2",
        cliente: "Laura Gómez",
        monto: 150000,
        cuotas: 12,
        pagadas: 12,
        estado: "PAID",
        fechaInicio: "2025-02-15",
    },
    {
        id: "cr3",
        cliente: "Carlos Díaz",
        monto: 80000,
        cuotas: 8,
        pagadas: 4,
        estado: "OVERDUE",
        fechaInicio: "2025-03-01",
    },
];

export default function Creditos() {
    const navigate = useNavigate();

    const badgeColor = {
        PENDING: "bg-yellow-900/40 text-yellow-200 border-yellow-700",
        PAID: "bg-green-900/40 text-green-200 border-green-700",
        OVERDUE: "bg-red-900/40 text-red-200 border-red-700",
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Créditos</h1>
                <button
                    onClick={() => navigate("/creditos/nuevo")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <HiPlus className="h-5 w-5" />
                    Nuevo crédito
                </button>
            </div>

            <div className="overflow-x-auto border border-gray-700 rounded-lg">
                <table className="min-w-full text-sm text-gray-300 text-left">
                    <thead className="bg-gray-700 text-gray-200 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">Cliente</th>
                            <th className="px-4 py-3">Monto total</th>
                            <th className="px-4 py-3">Cuotas</th>
                            <th className="px-4 py-3">Pagadas</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {creditosMock.map((c) => (
                            <tr key={c.id} className="border-t border-gray-700 bg-gray-800">
                                <td className="px-4 py-3">{c.cliente}</td>
                                <td className="px-4 py-3">${c.monto.toLocaleString("es-AR")}</td>
                                <td className="px-4 py-3">{c.cuotas}</td>
                                <td className="px-4 py-3">{c.pagadas}</td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs border ${badgeColor[c.estado]}`}
                                    >
                                        {c.estado === "PENDING" && "Pendiente"}
                                        {c.estado === "PAID" && "Pagado"}
                                        {c.estado === "OVERDUE" && "Vencido"}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={() => navigate(`/creditos/${c.id}`)}
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-sky-700 hover:bg-sky-600 text-white"
                                    >
                                        <HiEye className="h-4 w-4" /> Ver
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

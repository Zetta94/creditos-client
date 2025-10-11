import { useParams, useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const creditosMock = [
    {
        id: "cr1",
        cliente: "Juan Pérez",
        monto: 100000,
        cuotas: 10,
        pagadas: 6,
        estado: "PENDING",
        fechaInicio: "2025-06-10",
        pagos: [
            { mes: "Jun", monto: 10000 },
            { mes: "Jul", monto: 10000 },
            { mes: "Ago", monto: 10000 },
            { mes: "Sep", monto: 10000 },
            { mes: "Oct", monto: 10000 },
            { mes: "Nov", monto: 10000 },
        ],
    },
];

export default function CreditoDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();

    const credito = creditosMock.find((c) => c.id === id);
    if (!credito) {
        return (
            <div className="p-6 text-red-400">
                Crédito no encontrado.
                <button
                    onClick={() => navigate("/creditos")}
                    className="ml-4 px-3 py-2 bg-gray-700 rounded-md"
                >
                    Volver
                </button>
            </div>
        );
    }

    const progreso = Math.round((credito.pagadas / credito.cuotas) * 100);

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold mb-2">Crédito de {credito.cliente}</h1>
            <p className="text-gray-400">Inicio: {credito.fechaInicio}</p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <p className="text-gray-400 text-sm">Monto total</p>
                    <p className="text-2xl font-semibold">${credito.monto.toLocaleString("es-AR")}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <p className="text-gray-400 text-sm">Cuotas</p>
                    <p className="text-2xl font-semibold">
                        {credito.pagadas}/{credito.cuotas}
                    </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <p className="text-gray-400 text-sm">Progreso</p>
                    <div className="w-full bg-gray-700 rounded-full h-3 mt-2">
                        <div
                            className="bg-blue-500 h-3 rounded-full"
                            style={{ width: `${progreso}%` }}
                        ></div>
                    </div>
                    <p className="text-sm text-gray-300 mt-1">{progreso}% pagado</p>
                </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <h2 className="text-lg font-semibold mb-3">Historial de pagos</h2>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={credito.pagos}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="mes" stroke="#aaa" />
                        <YAxis stroke="#aaa" />
                        <Tooltip />
                        <Line type="monotone" dataKey="monto" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <button
                onClick={() => navigate("/creditos")}
                className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600"
            >
                Volver
            </button>
        </div>
    );
}

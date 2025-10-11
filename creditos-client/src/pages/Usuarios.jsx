
import { useNavigate } from "react-router-dom";
import { HiPlus, HiEye } from "react-icons/hi";

const usuariosMock = [
    {
        id: 1,
        nombre: "Admin General",
        email: "admin@imperio.test",
        rol: "ADMIN",
        creditosCargados: 120,
        pagosRecibidos: 430,
    },
    {
        id: 2,
        nombre: "María López",
        email: "maria@imperio.test",
        rol: "USER",
        creditosCargados: 35,
        pagosRecibidos: 110,
    },
    {
        id: 3,
        nombre: "Jorge Nuñez",
        email: "jorge@imperio.test",
        rol: "USER",
        creditosCargados: 58,
        pagosRecibidos: 190,
    },
];

export default function Usuarios() {
    const navigate = useNavigate();

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Usuarios</h1>
                <button
                    onClick={() => navigate("/usuarios/nuevo")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <HiPlus className="h-5 w-5" />
                    Agregar Usuario
                </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-700">
                <table className="min-w-full text-sm text-left text-gray-300">
                    <thead className="text-xs uppercase bg-gray-700 text-gray-200">
                        <tr>
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Rol</th>
                            <th className="px-4 py-3">Créditos cargados</th>
                            <th className="px-4 py-3">Pagos recibidos</th>
                            <th className="px-4 py-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuariosMock.map((u) => (
                            <tr key={u.id} className="border-t border-gray-700 bg-gray-800">
                                <td className="px-4 py-3">{u.nombre}</td>
                                <td className="px-4 py-3">{u.email}</td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs border ${u.rol === "ADMIN"
                                            ? "bg-purple-900/40 text-purple-300 border-purple-800"
                                            : "bg-slate-900/40 text-slate-300 border-slate-800"
                                            }`}
                                    >
                                        {u.rol}
                                    </span>
                                </td>
                                <td className="px-4 py-3">{u.creditosCargados}</td>
                                <td className="px-4 py-3">{u.pagosRecibidos}</td>
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => navigate(`/usuarios/${u.id}`)}
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-sky-700 hover:bg-sky-600 text-white"
                                    >
                                        <HiEye className="h-4 w-4" />
                                        Ver detalle
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

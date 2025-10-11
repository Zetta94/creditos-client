import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function UsuarioNuevo() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        nombre: "",
        email: "",
        password: "",
        rol: "USER", // ADMIN | USER
    });

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((s) => ({ ...s, [name]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        // TODO: POST al backend, ej: await api.post('/usuarios', form)
        console.log("Crear usuario:", form);
        navigate("/usuarios");
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Agregar Usuario</h1>

            <form
                onSubmit={handleSubmit}
                className="max-w-2xl bg-gray-800 rounded-xl p-6 space-y-4"
            >
                <div>
                    <label htmlFor="nombre" className="block mb-1 text-sm">
                        Nombre completo
                    </label>
                    <input
                        id="nombre"
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        placeholder="Ej: Juan Pérez"
                        required
                        className="w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block mb-1 text-sm">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="usuario@imperio.test"
                        required
                        className="w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block mb-1 text-sm">
                        Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        className="w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
                    />
                </div>

                <div>
                    <label htmlFor="rol" className="block mb-1 text-sm">
                        Rol
                    </label>
                    <select
                        id="rol"
                        name="rol"
                        value={form.rol}
                        onChange={handleChange}
                        className="w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
                    >
                        <option value="ADMIN">ADMIN</option>
                        <option value="USER">USER</option>
                    </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => navigate("/usuarios")}
                        className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Guardar
                    </button>
                </div>
            </form>
        </div>
    );
}

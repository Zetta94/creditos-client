import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { HiEye, HiEyeOff } from "react-icons/hi";

export default function UsuarioNuevo() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ nombre: "", email: "", password: "", rol: "USER" });
    const [showPass, setShowPass] = useState(false);

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((s) => ({ ...s, [name]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        console.log("Crear usuario:", form); // TODO: POST backend
        navigate("/usuarios");
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="mb-6 text-xl font-bold sm:text-2xl">Agregar Usuario</h1>

            <form
                onSubmit={handleSubmit}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6"
            >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                        <label htmlFor="nombre" className="text-sm text-gray-600 dark:text-gray-300">Nombre completo</label>
                        <input
                            id="nombre"
                            name="nombre"
                            value={form.nombre}
                            onChange={handleChange}
                            placeholder="Ej: Juan Pérez"
                            required
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <label htmlFor="email" className="text-sm text-gray-600 dark:text-gray-300">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="usuario@imperio.test"
                            required
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        />
                    </div>

                    <div className="grid gap-1.5 sm:col-span-2">
                        <label htmlFor="password" className="text-sm text-gray-600 dark:text-gray-300">Password</label>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type={showPass ? "text" : "password"}
                                value={form.password}
                                onChange={handleChange}
                                required
                                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 pr-10 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass((s) => !s)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showPass ? <HiEyeOff className="h-5 w-5" /> : <HiEye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-1.5 sm:col-span-2">
                        <label htmlFor="rol" className="text-sm text-gray-600 dark:text-gray-300">Rol</label>
                        <div className="flex flex-wrap gap-2">
                            {["ADMIN", "USER"].map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setForm((s) => ({ ...s, rol: r }))}
                                    className={[
                                        "rounded-full border px-3 py-1 text-xs",
                                        form.rol === r
                                            ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300"
                                            : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900",
                                    ].join(" ")}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                        <select
                            id="rol"
                            name="rol"
                            value={form.rol}
                            onChange={handleChange}
                            className="mt-2 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        >
                            <option value="ADMIN">ADMIN</option>
                            <option value="USER">USER</option>
                        </select>
                    </div>
                </div>

                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={() => navigate("/usuarios")}
                        className="w-full rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 sm:w-auto"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:w-auto"
                    >
                        Guardar
                    </button>
                </div>
            </form>
        </div>
    );
}

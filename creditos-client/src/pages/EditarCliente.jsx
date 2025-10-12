// pages/ClienteEditar.jsx
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";

const clientesMock = [
    { id: "c1", nombre: "Juan Pérez", telefono: "+54 9 2664 000000", documento: "30123456", direccion: "Calle Falsa 123", ciudad: "San Luis", provincia: "San Luis", confianza: "Alta", notas: "" },
    { id: "c2", nombre: "Laura Gómez", telefono: "+54 9 2664 123456", documento: "28999888", direccion: "Av. Siempreviva 742", ciudad: "San Luis", provincia: "San Luis", confianza: "Baja", notas: "Llamar antes" },
];

export default function ClienteEditar() {
    const { id } = useParams();
    const navigate = useNavigate();
    const current = clientesMock.find((c) => c.id === id);

    const [form, setForm] = useState(
        current ?? {
            nombre: "",
            telefono: "",
            documento: "",
            direccion: "",
            ciudad: "",
            provincia: "",
            confianza: "Media",
            notas: "",
        }
    );

    const handle = (e) => {
        const { name, value } = e.target;
        setForm((s) => ({ ...s, [name]: value }));
    };

    const submit = (e) => {
        e.preventDefault();
        // TODO: PUT /api/clientes/:id con { ...form }
        console.log("Editar cliente", id, form);
        navigate(`/clientes/${id}`);
    };

    if (!current) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
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
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
            <h1 className="text-xl font-bold sm:text-2xl">Editar cliente</h1>

            <form
                onSubmit={submit}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6"
            >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                        <label className="text-sm text-gray-600 dark:text-gray-300">Nombre completo</label>
                        <input
                            name="nombre"
                            value={form.nombre}
                            onChange={handle}
                            required
                            placeholder="Ej: Juan Pérez"
                            autoComplete="name"
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <label className="text-sm text-gray-600 dark:text-gray-300">Teléfono</label>
                        <input
                            name="telefono"
                            value={form.telefono}
                            onChange={handle}
                            required
                            type="tel"
                            inputMode="tel"
                            placeholder="+54 9 ..."
                            autoComplete="tel"
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <label className="text-sm text-gray-600 dark:text-gray-300">Documento</label>
                        <input
                            name="documento"
                            value={form.documento}
                            onChange={handle}
                            required
                            placeholder="DNI / CUIT"
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <label className="text-sm text-gray-600 dark:text-gray-300">Confianza</label>
                        <select
                            name="confianza"
                            value={form.confianza}
                            onChange={handle}
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        >
                            <option>Alta</option>
                            <option>Media</option>
                            <option>Baja</option>
                            <option>Moroso</option>
                        </select>
                    </div>

                    <div className="grid gap-1.5 sm:col-span-2">
                        <label className="text-sm text-gray-600 dark:text-gray-300">Dirección</label>
                        <input
                            name="direccion"
                            value={form.direccion}
                            onChange={handle}
                            placeholder="Calle y número"
                            autoComplete="street-address"
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <label className="text-sm text-gray-600 dark:text-gray-300">Ciudad</label>
                        <input
                            name="ciudad"
                            value={form.ciudad}
                            onChange={handle}
                            placeholder="Ej: San Luis"
                            autoComplete="address-level2"
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <label className="text-sm text-gray-600 dark:text-gray-300">Provincia</label>
                        <input
                            name="provincia"
                            value={form.provincia}
                            onChange={handle}
                            placeholder="Ej: San Luis"
                            autoComplete="address-level1"
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        />
                    </div>
                </div>

                <div className="grid gap-1.5">
                    <label className="text-sm text-gray-600 dark:text-gray-300">Notas</label>
                    <textarea
                        name="notas"
                        value={form.notas}
                        onChange={handle}
                        rows={3}
                        placeholder="Observaciones del cliente…"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                </div>

                {/* Acciones */}
                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={() => navigate(`/clientes/${id}`)}
                        className="w-full rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 sm:w-auto"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:w-auto"
                    >
                        Guardar cambios
                    </button>
                </div>
            </form>
        </div>
    );
}

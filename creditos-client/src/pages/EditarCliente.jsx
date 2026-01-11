import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { loadClient, saveClient } from "../store/clientsSlice";

export default function ClienteEditar() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { current, loading } = useSelector(state => state.clients) || { current: null, loading: false };

    const [form, setForm] = useState({
        name: "",
        phone: "",
        document: "",
        address: "",
        city: "",
        province: "",
        email: "",
        reliability: "MEDIA",
        notes: "",
    });

    useEffect(() => {
        dispatch(loadClient(id));
    }, [dispatch, id]);

    useEffect(() => {
        if (current?.id === id) {
            setForm({
                name: current.name || "",
                phone: current.phone || "",
                document: current.document || "",
                address: current.address || "",
                city: current.city || "",
                province: current.province || "",
                email: current.email || "",
                reliability: (current.reliability || "MEDIA").toUpperCase(),
                notes: current.notes || "",
            });
        }
    }, [current, id]);

    const handle = (e) => {
        const { name, value } = e.target;
        setForm((s) => ({ ...s, [name]: value }));
    };

    const submit = async (e) => {
        e.preventDefault();

        if (!form.name.trim()) {
            toast.error("El nombre del cliente es requerido");
            return;
        }

        const payload = {
            name: form.name,
            phone: form.phone,
            document: form.document,
            address: form.address,
            city: form.city,
            province: form.province,
            email: form.email,
            reliability: form.reliability?.toUpperCase(),
            notes: form.notes,
        };
        try {
            await dispatch(saveClient({ id, payload })).unwrap();
            navigate("/clientes");
        } catch (err) {
            console.error("Error al guardar cliente", err);
        }
    };

    if (loading || (!current && loading !== false)) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
                <p className="text-center text-gray-500 dark:text-gray-400">Cargando cliente...</p>
            </div>
        );
    }

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
                            name="name"
                            value={form.name}
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
                            name="phone"
                            value={form.phone}
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
                            name="document"
                            value={form.document}
                            onChange={handle}
                            required
                            placeholder="DNI / CUIT"
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <label className="text-sm text-gray-600 dark:text-gray-300">Confianza</label>
                        <select
                            name="reliability"
                            value={form.reliability}
                            onChange={handle}
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        >
                            <option value="ALTA">Alta</option>
                            <option value="MEDIA">Media</option>
                            <option value="BAJA">Baja</option>
                            <option value="MOROSO">Moroso</option>
                        </select>
                    </div>

                    <div className="grid gap-1.5 sm:col-span-2">
                        <label className="text-sm text-gray-600 dark:text-gray-300">Dirección</label>
                        <input
                            name="address"
                            value={form.address}
                            onChange={handle}
                            placeholder="Calle y número"
                            autoComplete="street-address"
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <label className="text-sm text-gray-600 dark:text-gray-300">Ciudad</label>
                        <input
                            name="city"
                            value={form.city}
                            onChange={handle}
                            placeholder="Ej: San Luis"
                            autoComplete="address-level2"
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <label className="text-sm text-gray-600 dark:text-gray-300">Provincia</label>
                        <input
                            name="province"
                            value={form.province}
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
                        name="notes"
                        value={form.notes}
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
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                    >
                        {loading ? "Guardando..." : "Guardar cambios"}
                    </button>
                </div>
            </form>
        </div>
    );
}

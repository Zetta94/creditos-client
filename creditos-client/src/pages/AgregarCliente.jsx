import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { mockClients } from "../mocks/mockData.js";

export default function AgregarCliente() {
    const navigate = useNavigate();
    const [cliente, setCliente] = useState({
        name: "",
        phone: "",
        document: "",
        address: "",
        city: "",
        province: "",
        reliability: "MEDIA",
        activo: true,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCliente((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const nuevoCliente = {
            id: "c" + (mockClients.length + 1),
            ...cliente,
            reliability: cliente.reliability.toUpperCase(),
        };

        console.log("✅ Cliente agregado:", nuevoCliente);
        // TODO: POST /api/clientes
        navigate("/clientes");
    };

    return (
        <div className="mx-auto max-w-2xl px-4 py-8">
            <div className="mb-6 text-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                    Nuevo Cliente
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Completá la información para registrar un nuevo cliente.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800"
            >
                {/* Información personal */}
                <div>
                    <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-100">
                        Información personal
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            label="Nombre completo"
                            name="name"
                            value={cliente.name}
                            onChange={handleChange}
                            placeholder="Ej: Laura Gómez"
                            required
                        />
                        <Input
                            label="Documento (DNI)"
                            name="document"
                            value={cliente.document}
                            onChange={handleChange}
                            placeholder="35100221"
                            required
                        />
                    </div>
                    <Input
                        label="Teléfono"
                        name="phone"
                        value={cliente.phone}
                        onChange={handleChange}
                        placeholder="+54 9 381 555 1234"
                        required
                    />
                </div>

                {/* Dirección */}
                <div>
                    <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-100">
                        Dirección
                    </h2>
                    <Input
                        label="Calle y número"
                        name="address"
                        value={cliente.address}
                        onChange={handleChange}
                        placeholder="Ej: Av. Mitre 560"
                    />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            label="Ciudad"
                            name="city"
                            value={cliente.city}
                            onChange={handleChange}
                            placeholder="Tucumán"
                        />
                        <Input
                            label="Provincia"
                            name="province"
                            value={cliente.province}
                            onChange={handleChange}
                            placeholder="Tucumán"
                        />
                    </div>
                </div>

                {/* Estado */}
                <div>
                    <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-100">
                        Estado del cliente
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Select
                            label="Nivel de confiabilidad"
                            name="reliability"
                            value={cliente.reliability}
                            onChange={handleChange}
                            options={[
                                { value: "ALTA", label: "Alta" },
                                { value: "MEDIA", label: "Media" },
                                { value: "MOROSO", label: "Moroso" },
                            ]}
                        />
                        <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-3 dark:border-gray-700">
                            <input
                                id="activo"
                                name="activo"
                                type="checkbox"
                                checked={cliente.activo}
                                onChange={handleChange}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-400"
                            />
                            <label
                                htmlFor="activo"
                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Cliente activo
                            </label>
                        </div>
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={() => navigate("/clientes")}
                        className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 sm:w-auto"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-blue-500 hover:to-blue-400 sm:w-auto"
                    >
                        Guardar cliente
                    </button>
                </div>
            </form>
        </div>
    );
}

/* === Subcomponentes reutilizables === */
function Input({ label, ...props }) {
    return (
        <div className="space-y-1.5">
            <label
                htmlFor={props.name}
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
                {label}
            </label>
            <input
                {...props}
                id={props.name}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
        </div>
    );
}

function Select({ label, name, value, onChange, options }) {
    return (
        <div className="space-y-1.5">
            <label
                htmlFor={name}
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
                {label}
            </label>
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

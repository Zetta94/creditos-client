import { Label, TextInput, Select, Checkbox, Button, HelperText } from "flowbite-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function AgregarCliente() {
    const navigate = useNavigate();
    const [cliente, setCliente] = useState({
        nombre: "",
        telefono: "",
        direccion: "",
        ciudad: "",
        provincia: "",
        activo: true,
        confianza: "Media",
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCliente((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Cliente agregado:", cliente);
        // TODO: POST al backend
        navigate("/clientes");
    };

    return (
        <div className="mx-auto max-w-xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="mb-4 text-xl font-bold sm:text-2xl">Agregar Cliente</h1>

            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6"
            >
                {/* Nombre */}
                <div className="space-y-1.5">
                    <Label htmlFor="nombre" value="Nombre completo" />
                    <TextInput
                        id="nombre"
                        name="nombre"
                        placeholder="Ej: Juan Pérez"
                        required
                        value={cliente.nombre}
                        onChange={handleChange}
                        autoComplete="name"
                    />
                </div>

                {/* Teléfono */}
                <div className="space-y-1.5">
                    <Label htmlFor="telefono" value="Teléfono" />
                    <TextInput
                        id="telefono"
                        name="telefono"
                        type="tel"
                        inputMode="tel"
                        placeholder="+54 9 ..."
                        required
                        value={cliente.telefono}
                        onChange={handleChange}
                        autoComplete="tel"
                    />
                    <HelperText className="text-xs">
                        Ingresá solo números y símbolos. Ej: <span className="font-medium">+54 9 266 123 4567</span>
                    </HelperText>
                </div>

                {/* Ciudad / Provincia */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="ciudad" value="Ciudad" />
                        <TextInput
                            id="ciudad"
                            name="ciudad"
                            placeholder="San Luis"
                            value={cliente.ciudad}
                            onChange={handleChange}
                            autoComplete="address-level2"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="provincia" value="Provincia" />
                        <TextInput
                            id="provincia"
                            name="provincia"
                            placeholder="San Luis"
                            value={cliente.provincia}
                            onChange={handleChange}
                            autoComplete="address-level1"
                        />
                    </div>
                </div>

                {/* Dirección */}
                <div className="space-y-1.5">
                    <Label htmlFor="direccion" value="Dirección" />
                    <TextInput
                        id="direccion"
                        name="direccion"
                        placeholder="Calle Falsa 123"
                        value={cliente.direccion}
                        onChange={handleChange}
                        autoComplete="street-address"
                    />
                </div>

                {/* Confianza */}
                <div className="space-y-1.5">
                    <Label htmlFor="confianza" value="Nivel de confianza" />
                    <Select
                        id="confianza"
                        name="confianza"
                        value={cliente.confianza}
                        onChange={handleChange}
                    >
                        <option value="Alta">Alta</option>
                        <option value="Media">Media</option>
                        <option value="Baja">Baja</option>
                    </Select>
                </div>

                {/* Activo */}
                <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                        id="activo"
                        name="activo"
                        checked={cliente.activo}
                        onChange={handleChange}
                    />
                    <Label htmlFor="activo">Cliente activo</Label>
                </div>

                {/* Acciones */}
                <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                        color="gray"
                        type="button"
                        onClick={() => navigate("/clientes")}
                        className="w-full sm:w-auto"
                    >
                        Cancelar
                    </Button>
                    <Button color="blue" type="submit" className="w-full sm:w-auto">
                        Guardar
                    </Button>
                </div>
            </form>
        </div>
    );
}

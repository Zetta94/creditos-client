import { Label, TextInput, Select, Checkbox, Button } from "flowbite-react";
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
        setCliente({ ...cliente, [name]: type === "checkbox" ? checked : value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Cliente agregado:", cliente);
        // Aquí harías el POST al backend con axios o fetch
        navigate("/clientes");
    };

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Agregar Cliente</h1>

            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-4 bg-gray-800 p-6 rounded-xl shadow-lg"
            >
                <div>
                    <Label htmlFor="nombre" value="Nombre completo" />
                    <TextInput
                        id="nombre"
                        name="nombre"
                        placeholder="Ej: Juan Pérez"
                        required
                        value={cliente.nombre}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <Label htmlFor="telefono" value="Teléfono" />
                    <TextInput
                        id="telefono"
                        name="telefono"
                        placeholder="+54 9 ..."
                        required
                        value={cliente.telefono}
                        onChange={handleChange}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="ciudad" value="Ciudad" />
                        <TextInput
                            id="ciudad"
                            name="ciudad"
                            placeholder="San Luis"
                            value={cliente.ciudad}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <Label htmlFor="provincia" value="Provincia" />
                        <TextInput
                            id="provincia"
                            name="provincia"
                            placeholder="San Luis"
                            value={cliente.provincia}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div>
                    <Label htmlFor="direccion" value="Dirección" />
                    <TextInput
                        id="direccion"
                        name="direccion"
                        placeholder="Calle Falsa 123"
                        value={cliente.direccion}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <Label htmlFor="confianza" value="Nivel de confianza" />
                    <Select
                        id="confianza"
                        name="confianza"
                        value={cliente.confianza}
                        onChange={handleChange}
                    >
                        <option>Alta</option>
                        <option>Media</option>
                        <option>Baja</option>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox
                        id="activo"
                        name="activo"
                        checked={cliente.activo}
                        onChange={handleChange}
                    />
                    <Label htmlFor="activo">Cliente activo</Label>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                    <Button color="gray" onClick={() => navigate("/clientes")} type="button">
                        Cancelar
                    </Button>
                    <Button color="blue" type="submit">
                        Guardar
                    </Button>
                </div>
            </form>
        </div>
    );
}

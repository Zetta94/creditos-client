import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { HiCheck, HiXMark } from "react-icons/hi2";
import { fetchUser, updateUser } from "../services/usersService";

export default function UsuarioEditar() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState(null);
    const [totalConComision, setTotalConComision] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const { data } = await fetchUser(id);
                setUsuario({
                    ...data,
                    phone: data.phone || "",
                    address: data.address || "",
                    document: data.document || "",
                    responsability: data.responsability || "",
                    salary: data.salary ?? "",
                    salaryType: data.salaryType || "",
                    comisions: data.comisions ?? "",
                    role: data.role || "",
                });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    useEffect(() => {
        const sueldo = parseFloat(usuario?.salary) || 0;
        const comision = parseFloat(usuario?.comisions) || 0;
        const esPorcentaje = comision <= 100;
        const total = esPorcentaje
            ? sueldo + sueldo * (comision / 100)
            : sueldo + comision;
        setTotalConComision(total);
    }, [usuario?.salary, usuario?.comisions]);

    function handleChange(field, value) {
        setUsuario((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSave() {
        const basePayload = {
            name: usuario.name,
            email: usuario.email,
            phone: usuario.phone,
            address: usuario.address,
            document: usuario.document,
            responsability: usuario.responsability ? usuario.responsability.toUpperCase() : undefined,
            salary: usuario.salary === "" ? undefined : Number(usuario.salary),
            salaryType: usuario.salaryType ? usuario.salaryType.toUpperCase() : undefined,
            comisions: usuario.comisions === "" ? undefined : Number(usuario.comisions),
            role: usuario.role ? usuario.role.toUpperCase() : undefined,
            ...(usuario.password ? { password: usuario.password } : {}),
        };
        const payload = Object.fromEntries(
            Object.entries(basePayload).filter(([, v]) => {
                if (v === undefined || v === "" || v === null) return false;
                if (typeof v === "number" && Number.isNaN(v)) return false;
                return true;
            })
        );
        try {
            console.log("Payload update user", payload);
            await updateUser(id, payload);
            navigate(`/usuarios/${id}`);
        } catch (err) {
            console.error("Error al guardar usuario", err);
            const detail = err.response?.data?.details
                ? JSON.stringify(err.response.data.details, null, 2)
                : err.response?.data?.error;
            const msg = detail || "No se pudo guardar el usuario. Revisa los datos y permisos.";
            alert(msg);
        }
    }

    if (loading) {
        return (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
                Cargando usuario...
            </div>
        );
    }

    if (!usuario)
        return (
            <div className="text-center text-red-400 mt-10">
                Usuario no encontrado.
            </div>
        );

    return (
        <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Editar información de {usuario.name}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* === Nombre completo === */}
                <Field
                    label="Nombre completo"
                    value={usuario.name}
                    onChange={(v) => handleChange("name", v)}
                />

                {/* === Email === */}
                <Field
                    label="Email"
                    value={usuario.email}
                    onChange={(v) => handleChange("email", v)}
                />

                {/* === Teléfono === */}
                <Field
                    label="Teléfono"
                    value={usuario.phone}
                    onChange={(v) => handleChange("phone", v)}
                />

                {/* === Dirección === */}
                <Field
                    label="Dirección"
                    value={usuario.address}
                    onChange={(v) => handleChange("address", v)}
                />

                {/* === Documento === */}
                <Field
                    label="Documento"
                    value={usuario.document}
                    onChange={(v) => handleChange("document", v)}
                />

                {/* === Responsabilidad (select) === */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600 dark:text-gray-300">
                        Responsabilidad
                    </label>
                    <select
                        value={usuario.responsability || ""}
                        onChange={(e) =>
                            handleChange("responsability", e.target.value)
                        }
                        className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        <option value="">Seleccionar...</option>
                        <option value="EXCELENTE">Excelente</option>
                        <option value="ALTA">Alta</option>
                        <option value="BUENA">Buena</option>
                        <option value="MEDIA">Media</option>
                        <option value="MALA">Mala</option>
                    </select>
                </div>

                {/* === Sueldo === */}
                <Field
                    label="Sueldo base (ARS)"
                    type="number"
                    value={usuario.salary}
                    onChange={(v) => handleChange("salary", v)}
                />

                {/* === Tipo de sueldo === */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600 dark:text-gray-300">
                        Tipo de sueldo
                    </label>
                    <select
                        value={usuario.salaryType || ""}
                        onChange={(e) =>
                            handleChange("salaryType", e.target.value)
                        }
                        className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        <option value="">Seleccionar...</option>
                        <option value="N_A">N/A</option>
                        <option value="MENSUAL">Mensual</option>
                        <option value="SEMANAL">Semanal</option>
                        <option value="DIARIO">Diario</option>
                    </select>
                </div>

                {/* === Comisión === */}
                <Field
                    label="Comisión (% o monto)"
                    type="number"
                    value={usuario.comisions}
                    onChange={(v) => handleChange("comisions", v)}
                />

                {/* === Total con comisión === */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600 dark:text-gray-300">
                        Total con comisión
                    </label>
                    <input
                        type="text"
                        readOnly
                        value={`$ ${totalConComision.toLocaleString("es-AR")}`}
                        className="h-10 rounded-lg border border-green-400 bg-green-50 px-3 text-sm text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300"
                    />
                </div>
            </div>

            {/* === Botones === */}
            <div className="flex justify-end gap-2 mt-6">
                <button
                    onClick={() => navigate(`/usuarios/${id}`)}
                    className="flex items-center gap-1 rounded-md bg-gray-500 px-3 py-2 text-sm font-medium text-white hover:bg-gray-400"
                >
                    <HiXMark className="h-4 w-4" />
                    Cancelar
                </button>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-500"
                >
                    <HiCheck className="h-4 w-4" />
                    Guardar cambios
                </button>
            </div>
        </div>
    );
}

/* === Subcomponente reutilizable para campos === */
function Field({ label, value, onChange, type = "text" }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600 dark:text-gray-300">
                {label}
            </label>
            <input
                type={type}
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
        </div>
    );
}

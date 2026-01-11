import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { HiCheck, HiXMark, HiOutlineArrowLeft } from "react-icons/hi2";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { addUser } from "../store/employeeSlice";

export default function UsuarioNuevo() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { loading } = useSelector(state => state.employees ?? { loading: false });
    const [showPass, setShowPass] = useState(false);

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "COBRADOR",
        phone: "",
        address: "",
        document: "",
        responsability: "MEDIA",
        salary: "",
        salaryType: "MENSUAL",
        comisions: "",
    });

    const [totalConComision, setTotalConComision] = useState(0);

    useEffect(() => {
        const sueldo = parseFloat(form.salary) || 0;
        const comision = parseFloat(form.comisions) || 0;
        const total =
            comision <= 100 ? sueldo + sueldo * (comision / 100) : sueldo + comision;
        setTotalConComision(total);
    }, [form.salary, form.comisions]);

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((s) => ({ ...s, [name]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!form.name.trim() || !form.email.trim() || !form.password) {
            toast.error("Nombre, email y contraseña son requeridos");
            return;
        }

        const payload = {
            ...form,
            salary: form.salary === "" ? 0 : Number(form.salary),
            comisions: form.comisions === "" ? 0 : Number(form.comisions),
            status: "ACTIVE"
        };

        try {
            await dispatch(addUser(payload)).unwrap();
            navigate("/usuarios");
        } catch (error) {
            console.error("Error al crear usuario:", error);
            const msg = typeof error === 'string' ? error : error?.message || 'Error al crear usuario';
            toast.error(msg);
        }
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">

            {/* === BOTÓN VOLVER === */}
            <div className="flex justify-end">
                <button
                    onClick={() => navigate("/usuarios")}
                    className="flex items-center gap-2 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                    <HiOutlineArrowLeft className="h-4 w-4" />
                    Volver
                </button>
            </div>

            <h1 className="mb-6 text-xl font-bold sm:text-2xl text-gray-900 dark:text-white">
                Agregar nuevo usuario
            </h1>

            <form
                onSubmit={handleSubmit}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 space-y-6"
            >
                {/* === DATOS PERSONALES === */}
                <section>
                    <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                        Datos personales
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field
                            label="Nombre completo"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            placeholder="Ej: Juan Pérez"
                        />
                        <Field
                            label="Email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            type="email"
                            required
                            placeholder="usuario@imperio.test"
                        />
                        <Field
                            label="Teléfono"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="Ej: 3815551234"
                        />
                        <Field
                            label="Dirección"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            placeholder="Ej: Lamadrid 123"
                        />
                        <Field
                            label="Documento"
                            name="document"
                            value={form.document}
                            onChange={handleChange}
                            placeholder="Ej: 35123456"
                        />
                    </div>
                </section>

                {/* === SEGURIDAD === */}
                <section>
                    <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                        Seguridad
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-600 dark:text-gray-300">
                                Contraseña
                            </label>
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
                                >
                                    {showPass ? (
                                        <HiEyeOff className="h-5 w-5" />
                                    ) : (
                                        <HiEye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-gray-600 dark:text-gray-300">
                                Rol
                            </label>
                            <select
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                            >
                                <option value="COBRADOR">COBRADOR</option>
                                <option value="EMPLOYEE">EMPLOYEE</option>
                                <option value="ADMIN">ADMIN</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* === DETALLES LABORALES === */}
                <section>
                    <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                        Detalles laborales
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-600 dark:text-gray-300">
                                Responsabilidad
                            </label>
                            <select
                                name="responsability"
                                value={form.responsability}
                                onChange={handleChange}
                                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                            >
                                <option value="EXCELENTE">Excelente</option>
                                <option value="ALTA">Alta</option>
                                <option value="BUENA">Buena</option>
                                <option value="MEDIA">Media</option>
                                <option value="MALA">Mala</option>
                            </select>
                        </div>

                        <Field
                            label="Sueldo base (ARS)"
                            name="salary"
                            type="number"
                            value={form.salary}
                            onChange={handleChange}
                            placeholder="Ej: 500000"
                        />

                        <div>
                            <label className="text-sm text-gray-600 dark:text-gray-300">
                                Tipo de sueldo
                            </label>
                            <select
                                name="salaryType"
                                value={form.salaryType}
                                onChange={handleChange}
                                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                            >
                                <option value="N_A">N/A</option>
                                <option value="MENSUAL">Mensual</option>
                                <option value="SEMANAL">Semanal</option>
                                <option value="DIARIO">Diario</option>
                            </select>
                        </div>

                        <Field
                            label="Comisión (% o monto)"
                            name="comisions"
                            type="number"
                            value={form.comisions}
                            onChange={handleChange}
                            placeholder="Ej: 10 o 5000"
                        />

                        <div>
                            <label className="text-sm text-gray-600 dark:text-gray-300">
                                Total con comisión
                            </label>
                            <input
                                readOnly
                                value={`$ ${totalConComision.toLocaleString("es-AR")}`}
                                className="h-10 w-full rounded-lg border border-green-400 bg-green-50 px-3 text-sm text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300"
                            />
                        </div>
                    </div>
                </section>

                {/* === BOTONES === */}
                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate("/usuarios")}
                        className="flex items-center gap-2 rounded-md bg-gray-500 px-4 py-2 text-sm font-medium text-white hover:bg-gray-400"
                    >
                        <HiXMark className="h-4 w-4" />
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500"
                    >
                        <HiCheck className="h-4 w-4" />
                        Guardar
                    </button>
                </div>
            </form>
        </div>
    );
}

function Field({
    label,
    name,
    value,
    onChange,
    placeholder = "",
    type = "text",
    required = false,
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-600 dark:text-gray-300">{label}</label>
            <input
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                type={type}
                required={required}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
        </div>
    );
}

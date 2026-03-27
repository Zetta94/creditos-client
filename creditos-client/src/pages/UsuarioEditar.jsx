import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { HiCheck, HiOutlineArrowLeft, HiXMark } from "react-icons/hi2";
import toast from "react-hot-toast";
import { fetchUser, updateUser } from "../services/usersService";

export default function UsuarioEditar() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const { data } = await fetchUser(id);
                setUsuario({
                    ...data,
                    phone: data.phone || "",
                    alternatePhone: data.alternatePhone || "",
                    address: data.address || "",
                    document: data.document || "",
                    responsability: data.responsability || "",
                    salary: data.salary ?? "",
                    salaryType: data.salaryType || "",
                    comisions: data.comisions ?? "",
                    role: data.role || "",
                    birthDate: data.birthDate ? data.birthDate.slice(0, 10) : "",
                });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    function handleChange(field, value) {
        setUsuario((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSave() {
        const basePayload = {
            name: usuario.name,
            email: usuario.email,
            phone: usuario.phone,
            alternatePhone: usuario.alternatePhone,
            address: usuario.address,
            document: usuario.document,
            responsability: usuario.responsability ? usuario.responsability.toUpperCase() : undefined,
            salary: usuario.salary === "" ? undefined : Number(usuario.salary),
            salaryType: usuario.salaryType ? usuario.salaryType.toUpperCase() : undefined,
            comisions: usuario.comisions === "" ? undefined : Number(usuario.comisions),
            role: usuario.role ? usuario.role.toUpperCase() : undefined,
            birthDate: usuario.birthDate === "" ? null : usuario.birthDate,
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
            toast.success("Usuario actualizado con éxito");
            navigate(`/usuarios/${id}`);
        } catch (err) {
            console.error("Error al guardar usuario", err);
            const detail = err.response?.data?.details
                ? JSON.stringify(err.response.data.details, null, 2)
                : err.response?.data?.error;
            const msg = detail || "No se pudo guardar el usuario. Revisa los datos y permisos.";
            toast.error(msg);
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

    const handleBack = () => {
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate(`/usuarios/${id}`);
        }
    };

    const commissionDisplay = formatCommissionValue(usuario.comisions);

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 space-y-8 sm:px-6 xl:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                        Usuario
                    </p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        Edicion de perfil
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                        Actualiza la informacion del usuario con una vista mas clara y manteniendo el mismo estilo visual de su ficha.
                    </p>
                </div>
                <button
                    onClick={handleBack}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-white"
                >
                    <HiOutlineArrowLeft className="h-4 w-4" />
                    Volver
                </button>
            </div>

            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950">
                <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_42%),linear-gradient(135deg,_rgba(15,23,42,1),_rgba(30,41,59,0.96))] px-6 py-7 text-white sm:px-8 lg:px-10">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 space-y-4">
                            <div>
                                <h2 className="max-w-full break-words text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl lg:text-[2.1rem]">
                                    Editar informacion de {usuario.name}
                                </h2>
                                <p className="mt-1 text-sm text-slate-300">{usuario.email}</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <HeaderPill label={`ID ${usuario.id?.slice?.(0, 8) || usuario.id}`} tone="slate" />
                                <HeaderPill label={usuario.role || "USUARIO"} tone="amber" />
                                <HeaderPill label={usuario.status || "ACTIVE"} tone="emerald" />
                            </div>
                        </div>

                        <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-[34rem]">
                            <MiniSummaryCard label="Responsabilidad" value={usuario.responsability || "-"} tone="blue" />
                            <MiniSummaryCard label="Tipo sueldo" value={usuario.salaryType || "-"} tone="amber" />
                            <MiniSummaryCard label="Comision" value={commissionDisplay} tone="emerald" />
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 px-6 py-6 sm:px-8 xl:grid-cols-[minmax(0,1.45fr)_320px] lg:px-10 lg:py-8">
                    <div className="space-y-6">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                                Datos principales
                            </p>
                            <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                                Informacion editable
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Field
                                label="Nombre completo"
                                value={usuario.name}
                                onChange={(v) => handleChange("name", v)}
                            />
                            <Field
                                label="Email"
                                value={usuario.email}
                                onChange={(v) => handleChange("email", v)}
                            />
                            <Field
                                label="Telefono"
                                value={usuario.phone}
                                onChange={(v) => handleChange("phone", v)}
                            />
                            <Field
                                label="Telefono alternativo"
                                value={usuario.alternatePhone}
                                onChange={(v) => handleChange("alternatePhone", v)}
                            />
                            <Field
                                label="Direccion"
                                value={usuario.address}
                                onChange={(v) => handleChange("address", v)}
                            />
                            <Field
                                label="Documento"
                                value={usuario.document}
                                onChange={(v) => handleChange("document", v)}
                            />
                            <Field
                                label="Fecha de nacimiento"
                                value={usuario.birthDate}
                                onChange={(v) => handleChange("birthDate", v)}
                                type="date"
                            />
                            <SelectField
                                label="Responsabilidad"
                                value={usuario.responsability || ""}
                                onChange={(v) => handleChange("responsability", v)}
                                options={[
                                    { value: "", label: "Seleccionar..." },
                                    { value: "EXCELENTE", label: "Excelente" },
                                    { value: "ALTA", label: "Alta" },
                                    { value: "BUENA", label: "Buena" },
                                    { value: "MEDIA", label: "Media" },
                                    { value: "MALA", label: "Mala" },
                                ]}
                            />
                            <Field
                                label="Sueldo base (ARS)"
                                type="number"
                                value={usuario.salary}
                                onChange={(v) => handleChange("salary", v)}
                            />
                            <SelectField
                                label="Tipo de sueldo"
                                value={usuario.salaryType || ""}
                                onChange={(v) => handleChange("salaryType", v)}
                                options={[
                                    { value: "", label: "Seleccionar..." },
                                    { value: "N_A", label: "N/A" },
                                    { value: "MENSUAL", label: "Mensual" },
                                    { value: "SEMANAL", label: "Semanal" },
                                    { value: "DIARIO", label: "Diario" },
                                ]}
                            />
                            <Field
                                label="Comision por credito o cliente nuevo (% o monto)"
                                type="number"
                                value={usuario.comisions}
                                onChange={(v) => handleChange("comisions", v)}
                            />
                            <NoticeField
                                label="Aclaracion"
                                value="La comision se paga aparte del sueldo. No forma parte del sueldo base del usuario."
                            />
                        </div>
                    </div>

                    <aside className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/70">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                                Acciones
                            </p>
                            <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                                Confirmar cambios
                            </h3>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                Revisa la informacion antes de guardar. Los cambios se aplicaran directamente sobre la ficha del usuario.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                Vista rapida
                            </p>
                            <div className="mt-3 grid gap-3">
                                <QuickInfo label="Nombre" value={usuario.name || "-"} />
                                <QuickInfo label="Email" value={usuario.email || "-"} />
                                <QuickInfo label="Comision" value={commissionDisplay} />
                            </div>
                        </div>

                        <div className="grid gap-3 pt-1">
                            <ActionButton onClick={() => navigate(`/usuarios/${id}`)} tone="neutral" icon={<HiXMark className="h-4 w-4" />}>
                                Cancelar
                            </ActionButton>
                            <ActionButton onClick={handleSave} tone="emerald" icon={<HiCheck className="h-4 w-4" />}>
                                Guardar cambios
                            </ActionButton>
                        </div>
                    </aside>
                </div>
            </section>
        </div>
    );
}

function Field({ label, value, onChange, type = "text" }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {label}
            </label>
            <input
                type={type}
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
        </div>
    );
}

function SelectField({ label, value, onChange, options }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {label}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

function NoticeField({ label, value }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {label}
            </label>
            <div className="flex min-h-12 items-center rounded-2xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-900 dark:text-amber-100">
                {value}
            </div>
        </div>
    );
}

function HeaderPill({ label, tone = "slate" }) {
    const toneClasses = {
        slate: "border-white/15 bg-white/10 text-slate-100",
        amber: "border-amber-300/25 bg-amber-400/15 text-amber-100",
        emerald: "border-emerald-300/25 bg-emerald-400/15 text-emerald-100",
    };

    return (
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${toneClasses[tone] || toneClasses.slate}`}>
            {label}
        </span>
    );
}

function MiniSummaryCard({ label, value, tone = "blue" }) {
    const toneClasses = {
        blue: "border-blue-400/30 bg-blue-500/10",
        amber: "border-amber-400/30 bg-amber-500/10",
        emerald: "border-emerald-400/30 bg-emerald-500/10",
    };

    return (
        <div className={`rounded-[22px] border p-4 shadow-[0_16px_35px_-32px_rgba(15,23,42,0.75)] ${toneClasses[tone] || toneClasses.blue}`}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-300">{label}</div>
            <div className="mt-3 text-base font-black tracking-tight text-white sm:text-lg">{value}</div>
        </div>
    );
}

function QuickInfo({ label, value }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            <strong className="mr-2 text-slate-900 dark:text-white">{label}:</strong>
            {value}
        </div>
    );
}

function ActionButton({ children, onClick, tone = "neutral", icon = null }) {
    const toneClasses = {
        emerald: "border-emerald-400/35 bg-emerald-500/10 text-emerald-700 hover:border-emerald-300/50 hover:bg-emerald-500/16 dark:text-emerald-100",
        neutral: "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-900 dark:hover:text-white",
    };

    return (
        <button
            onClick={onClick}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${toneClasses[tone] || toneClasses.neutral}`}
        >
            {icon}
            {children}
        </button>
    );
}

function formatCommissionValue(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
        return "Sin comision";
    }

    if (numericValue <= 100) {
        return `${numericValue}%`;
    }

    return `$ ${numericValue.toLocaleString("es-AR")}`;
}

import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import jsPDF from "jspdf";
import toast from "react-hot-toast";
import { loadClients } from "../store/clientsSlice";
import { addCredit } from "../store/creditsSlice";
import { loadUsers } from "../store/employeeSlice";

const PLAN_OPTIONS = [
    { label: "Diario", value: "DAILY" },
    { label: "Semanal", value: "WEEKLY" },
    { label: "Quincenal", value: "QUINCENAL" },
    { label: "Mensual", value: "MONTHLY" }
];

const DEFAULT_PLAN = "MONTHLY";
const COMPANY_NAME = "El Imperio Créditos";
const currencyFormatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
});

export default function CreditoNuevo() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { list: clients } = useSelector(state => state.clients) || { list: [] };
    const { loading } = useSelector(state => state.credits) || { loading: false };
    const { list: users } = useSelector(state => state.employees) || { list: [] };

    const cobradores = (users || []).filter((u) => u.role === "COBRADOR" || u.role === "EMPLOYEE");

    useEffect(() => {
        if (!clients.length) dispatch(loadClients());
        if (!users.length) dispatch(loadUsers());
    }, [clients.length, users.length, dispatch]);

    const [form, setForm] = useState({
        clienteId: "",
        monto: "",
        interes: "",
        cuotas: "",
        plan: DEFAULT_PLAN,
        cobradorId: "",
        comisionLibre: "",
        cobradorComisionId: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.clienteId) {
            toast.error("Seleccioná un cliente antes de crear el crédito");
            return;
        }

        if (!montoBase || montoBase <= 0) {
            toast.error("Ingresá un monto base válido");
            return;
        }

        if (!cuotasNumber) {
            toast.error("Indicá la cantidad de cuotas");
            return;
        }

        const payload = {
            clientId: form.clienteId,
            type: form.plan,
            amount: montoBase,
            installmentAmount: cuotaEstim || undefined,
            totalInstallments: cuotasNumber || undefined,
            startDate: new Date().toISOString(),
            status: "PENDING",
        };

        if (form.cobradorId) {
            payload.userId = form.cobradorId;
        }

        try {
            await dispatch(addCredit(payload)).unwrap();
            toast.success("Crédito creado correctamente");
            navigate("/creditos", { replace: true });
        } catch (error) {
            console.error("No se pudo crear el crédito", error);
            toast.error("No se pudo crear el crédito");
        }
    };

    // === Cálculos ===
    const montoBase = Number(form.monto) || 0;
    const interesPorc = Number(form.interes) || 0;
    const cuotasNumber = Math.max(0, Number(form.cuotas) || 0);

    const montoTotal = useMemo(() => {
        if (!montoBase) return 0;
        return Math.floor(montoBase + (montoBase * interesPorc) / 100);
    }, [montoBase, interesPorc]);

    const cuotaEstim = useMemo(() => {
        if (!montoTotal || !cuotasNumber) return 0;
        return Math.floor(montoTotal / cuotasNumber);
    }, [montoTotal, cuotasNumber]);

    const preview = useMemo(() => {
        const n = Math.min(6, cuotasNumber);
        return Array.from({ length: n }, (_, i) => ({
            nro: i + 1,
            importe: cuotaEstim,
        }));
    }, [cuotasNumber, cuotaEstim]);

    const generarContrato = () => {
        if (!form.clienteId) {
            toast.error("Seleccioná un cliente antes de generar el contrato");
            return;
        }

        if (!montoBase || montoBase <= 0) {
            toast.error("Ingresá un monto base válido");
            return;
        }

        if (!cuotasNumber) {
            toast.error("Indicá la cantidad de cuotas");
            return;
        }

        const cliente = clients.find((c) => c.id === form.clienteId);
        const cobradorAsignado = users.find((u) => u.id === form.cobradorId);

        const doc = new jsPDF();
        const marginLeft = 16;
        const contentWidth = 178;
        let cursorY = 22;
        const today = new Date();
        const day = today.getDate();
        const monthName = today.toLocaleDateString("es-AR", { month: "long" });
        const year = today.getFullYear();
        const clientCity = cliente?.city || "San Luis";
        const clientProvince = cliente?.province || "San Luis";
        const clientAddress = cliente?.address || "—";
        const clientDocument = cliente?.document || "—";
        const firstDueDate = new Date(today);
        firstDueDate.setMonth(today.getMonth() + 1);
        const firstDueFormatted = firstDueDate.toLocaleDateString("es-AR");

        const formatCurrency = (value) => {
            const numericValue = Number(value);
            if (!Number.isFinite(numericValue) || numericValue <= 0) return "—";
            return currencyFormatter.format(numericValue);
        };

        const addParagraph = (text, options = {}) => {
            const lines = doc.splitTextToSize(text, contentWidth);
            doc.text(lines, marginLeft, cursorY, options);
            cursorY += lines.length * 6 + 2;
        };

        doc.setFontSize(18);
        doc.setFont(undefined, "bold");
        doc.text(COMPANY_NAME, doc.internal.pageSize.getWidth() / 2, cursorY, { align: "center" });
        cursorY += 10;

        doc.setFontSize(14);
        doc.text("CONTRATO DE MUTUO", doc.internal.pageSize.getWidth() / 2, cursorY, { align: "center" });
        cursorY += 10;

        doc.setFontSize(11);
        doc.setFont(undefined, "normal");

        addParagraph(
            `En la ciudad de ${clientCity}, a los ${day} días del mes de ${monthName} de ${year}, entre el Sr. Franco Martin Correas, D.N.I. N° 44.219.412, con domicilio real en calle Córdoba 53, Ciudad de San Luis, Provincia de San Luis, en adelante el "MUTUANTE"; y ${cliente?.name || "el/la Sr./Sra."}, D.N.I. N° ${clientDocument}, con domicilio real en ${clientAddress}, ${clientCity}, Provincia de ${clientProvince}, en adelante el "MUTUARIO"; convienen en celebrar el presente contrato de mutuo, sujeto a las siguientes cláusulas.`
        );

        doc.setFont(undefined, "bold");
        doc.text("PRIMERA:", marginLeft, cursorY);
        doc.setFont(undefined, "normal");
        cursorY += 2;
        addParagraph(
            `El mutuante da en préstamo al mutuario la suma de PESOS ${formatCurrency(montoBase)} (${formatCurrency(montoBase)}), quien lo recibe en efectivo en este acto, sirviéndose la presente cláusula como recibo suficiente para tener por acreditada la recepción del dinero y dando el mutuario conformidad al importe.`
        );

        doc.setFont(undefined, "bold");
        doc.text("SEGUNDA:", marginLeft, cursorY);
        doc.setFont(undefined, "normal");
        cursorY += 2;
        addParagraph(
            `Las partes acuerdan un interés punitorio del ${interesPorc || 0}% mensual sobre los saldos en mora, que el mutuario pagará al mutuante conjuntamente con el capital adeudado.`
        );

        doc.setFont(undefined, "bold");
        doc.text("TERCERA:", marginLeft, cursorY);
        doc.setFont(undefined, "normal");
        cursorY += 2;
        addParagraph(
            `El plazo de restitución del capital será de ${cuotasNumber || 1} ${cuotasNumber === 1 ? "cuota" : "cuotas"}, que el mutuario abonará según el siguiente esquema: la cuota N° 1 vencerá el ${firstDueFormatted} por la suma de PESOS ${formatCurrency(cuotaEstim)}, continuando en iguales períodos hasta la cancelación total.`
        );

        doc.setFont(undefined, "bold");
        doc.text("CUARTA:", marginLeft, cursorY);
        doc.setFont(undefined, "normal");
        cursorY += 2;
        addParagraph(
            `El lugar de pago es fijado por las partes en calle Córdoba 53, Ciudad de San Luis, Provincia de San Luis, debiendo el mutuario extender recibo firmado al mutuante.`
        );

        doc.setFont(undefined, "bold");
        doc.text("QUINTA:", marginLeft, cursorY);
        doc.setFont(undefined, "normal");
        cursorY += 2;
        addParagraph(
            `En caso de mora en el cumplimiento del pago por parte del mutuario, el mutuante podrá resolver el contrato exigiendo el inmediato pago del capital e intereses adeudados.`
        );

        doc.setFont(undefined, "bold");
        doc.text("SEXTA:", marginLeft, cursorY);
        doc.setFont(undefined, "normal");
        cursorY += 2;
        addParagraph(
            `La falta de cumplimiento por el mutuario de cualquiera de las obligaciones asumidas, en particular la falta de pago a su vencimiento de las cuotas, producirá la caducidad de los plazos, quedando exigible la totalidad del capital e intereses desde la mora hasta su efectivo pago.`
        );

        doc.setFont(undefined, "bold");
        doc.text("SÉPTIMA:", marginLeft, cursorY);
        doc.setFont(undefined, "normal");
        cursorY += 2;
        addParagraph(
            `Para todos los efectos contractuales y extracontractuales, las partes constituyen sus domicilios legales en los indicados, donde serán válidas las notificaciones. Las partes se someten voluntaria y exclusivamente a la competencia de la Justicia Ordinaria de la Provincia de San Luis, renunciando a cualquier otro fuero o jurisdicción.`
        );

        addParagraph("En prueba de conformidad, se firman dos ejemplares de un mismo tenor y a un solo efecto, en el lugar y fecha ut supra indicados.");

        cursorY += 8;

        doc.text("__________________________", marginLeft, cursorY);
        doc.text("__________________________", marginLeft + 100, cursorY);
        cursorY += 6;
        doc.text("Mutuante", marginLeft + 20, cursorY);
        doc.text("Mutuario", marginLeft + 120, cursorY);

        if (cobradorAsignado?.name) {
            cursorY += 12;
            doc.text("Cobrador asignado:", marginLeft, cursorY);
            doc.text(cobradorAsignado.name, marginLeft + 45, cursorY);
        }

        const sanitizedName = (cliente?.name || "cliente").replace(/\s+/g, "-").toLowerCase();
        doc.save(`contrato-${sanitizedName}.pdf`);
        toast.success("Contrato generado correctamente");
    };

    const selectedPlan = PLAN_OPTIONS.find((p) => p.value === form.plan) || PLAN_OPTIONS.find((p) => p.value === DEFAULT_PLAN) || PLAN_OPTIONS[0];

    return (
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
            <h1 className="text-xl font-bold sm:text-2xl">Nuevo crédito</h1>

            <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 gap-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6 lg:grid-cols-3"
            >
                {/* Columna izquierda: formulario */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Cliente */}
                    <div className="grid gap-1.5">
                        <label className="text-sm text-gray-600 dark:text-gray-300">
                            Cliente
                        </label>
                        <select
                            name="clienteId"
                            value={form.clienteId}
                            onChange={handleChange}
                            required
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        >
                            <option value="">Seleccionar cliente…</option>
                            {clients.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => navigate("/clientes/nuevo")}
                            className="self-start text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                            + Crear nuevo cliente
                        </button>
                    </div>

                    {/* Monto / interés / cuotas */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="grid gap-1.5">
                            <label className="text-sm text-gray-600 dark:text-gray-300">
                                Monto base
                            </label>
                            <input
                                name="monto"
                                type="number"
                                min={0}
                                step="100"
                                value={form.monto}
                                onChange={handleChange}
                                placeholder="Ej: 100000"
                                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <label className="text-sm text-gray-600 dark:text-gray-300">
                                Interés (%)
                            </label>
                            <input
                                name="interes"
                                type="number"
                                min={0}
                                max={100}
                                step="1"
                                value={form.interes}
                                onChange={handleChange}
                                placeholder="Ej: 15"
                                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <label className="text-sm text-gray-600 dark:text-gray-300">
                                Cantidad de cuotas
                            </label>
                            <input
                                name="cuotas"
                                type="number"
                                min={1}
                                step="1"
                                value={form.cuotas}
                                onChange={handleChange}
                                placeholder="Ej: 10"
                                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                            />
                        </div>
                    </div>

                    {/* Tipo de plan */}
                    <div className="grid gap-2">
                        <label className="text-sm text-gray-600 dark:text-gray-300">
                            Plan o tipo
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {PLAN_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setForm((f) => ({ ...f, plan: option.value }))}
                                    className={`rounded-full border px-3 py-1 text-xs ${form.plan === option.value
                                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300"
                                        : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cobrador asignado */}
                    <div className="grid gap-1.5">
                        <label className="text-sm text-gray-600 dark:text-gray-300">
                            Cobrador asignado
                        </label>
                        <select
                            name="cobradorId"
                            value={form.cobradorId}
                            onChange={handleChange}
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        >
                            <option value="">Seleccionar cobrador…</option>
                            {cobradores.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Comisión libre */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                            <label className="text-sm text-gray-600 dark:text-gray-300">
                                Comisión libre ($)
                            </label>
                            <input
                                name="comisionLibre"
                                type="number"
                                min={0}
                                step="100"
                                value={form.comisionLibre}
                                onChange={handleChange}
                                placeholder="Ej: 2000"
                                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <label className="text-sm text-gray-600 dark:text-gray-300">
                                Cobrador comisión
                            </label>
                            <select
                                name="cobradorComisionId"
                                value={form.cobradorComisionId}
                                onChange={handleChange}
                                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                            >
                                <option value="">Seleccionar cobrador…</option>
                                {cobradores.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Botón generar contrato si es mensual */}
                    {form.plan === "MONTHLY" && (
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={generarContrato}
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                            >
                                Generar contrato y enviar al mail
                            </button>
                        </div>
                    )}
                </div>

                {/* Columna derecha: resumen */}
                <aside className="lg:col-span-1 space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                        <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                            Resumen
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-gray-500">Plan</div>
                            <div className="text-right">{selectedPlan.label}</div>
                            <div className="text-gray-500">Monto base</div>
                            <div className="text-right">
                                {montoBase
                                    ? montoBase.toLocaleString("es-AR", {
                                        style: "currency",
                                        currency: "ARS",
                                        maximumFractionDigits: 0,
                                    })
                                    : "—"}
                            </div>
                            <div className="text-gray-500">Interés</div>
                            <div className="text-right">{interesPorc || "—"}%</div>
                            <div className="text-gray-500">Monto total</div>
                            <div className="text-right">
                                {montoTotal
                                    ? montoTotal.toLocaleString("es-AR", {
                                        style: "currency",
                                        currency: "ARS",
                                        maximumFractionDigits: 0,
                                    })
                                    : "—"}
                            </div>
                            <div className="text-gray-500">Cuotas</div>
                            <div className="text-right">{cuotasNumber || "—"}</div>
                            <div className="text-gray-500">Cuota estimada</div>
                            <div className="text-right">
                                {cuotaEstim
                                    ? cuotaEstim.toLocaleString("es-AR", {
                                        style: "currency",
                                        currency: "ARS",
                                        maximumFractionDigits: 0,
                                    })
                                    : "—"}
                            </div>
                        </div>
                    </div>

                    {/* Previsualización */}
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                        <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                            Previsualización de cuotas{" "}
                            <span className="text-xs text-gray-500">(primeras 6)</span>
                        </h3>
                        <div className="hidden sm:block">
                            <table className="w-full text-left text-sm">
                                <thead className="text-gray-500">
                                    <tr>
                                        <th className="py-2 pr-3 font-medium">#</th>
                                        <th className="py-2 font-medium">Importe</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {preview.length === 0 ? (
                                        <tr>
                                            <td colSpan={2} className="py-4 text-sm text-gray-500">
                                                Completá monto e interés para ver las cuotas.
                                            </td>
                                        </tr>
                                    ) : (
                                        preview.map((q) => (
                                            <tr key={q.nro}>
                                                <td className="py-2 pr-3">Cuota {q.nro}</td>
                                                <td className="py-2">
                                                    {q.importe.toLocaleString("es-AR", {
                                                        style: "currency",
                                                        currency: "ARS",
                                                        maximumFractionDigits: 0,
                                                    })}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </aside>

                {/* Acciones */}
                <div className="lg:col-span-3 mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={() => navigate("/creditos")}
                        className="w-full rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 sm:w-auto"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                    >
                        {loading ? "Guardando..." : "Guardar crédito"}
                    </button>
                </div>
            </form>
        </div>
    );
}

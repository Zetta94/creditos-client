// @ts-nocheck
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
const CLIENTS_FETCH_LIMIT = 1000;
const COMPANY_NAME = "El Imperio Créditos";
const currencyFormatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
});

const normalize = (value) => {
    if (!value && value !== 0) return "";
    return value.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
};

const tokenize = (value) => normalize(value).split(/\s+/).filter(Boolean);

const clientMatchesTokens = (client, tokens) => {
    if (!tokens.length) return true;

    const fields = [
        client?.name,
        client?.document,
        client?.phone,
        client?.alternatePhone,
        client?.email
    ].map(normalize).filter(Boolean);

    if (!fields.length) return false;

    return tokens.every((token) => fields.some((field) => field.includes(token)));
};

const calculateDueDate = (startDate, installments, plan) => {
    if (!startDate) return "";

    const base = new Date(`${startDate}T00:00:00`);
    if (Number.isNaN(base.getTime())) return "";

    const periods = Math.max(1, Number(installments) || 0);
    const due = new Date(base);

    switch (plan) {
        case "DAILY":
            due.setDate(due.getDate() + periods);
            break;
        case "WEEKLY":
            due.setDate(due.getDate() + periods * 7);
            break;
        case "QUINCENAL":
            due.setDate(due.getDate() + periods * 15);
            break;
        case "MONTHLY":
        default:
            due.setMonth(due.getMonth() + periods);
            break;
    }

    return due.toISOString().split("T")[0];
};

const toLocalDateIso = (date) => {
    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offsetMs).toISOString().split("T")[0];
};

const toUtcIsoFromLocalDate = (value) => {
    if (!value) return null;
    const localDate = new Date(`${value}T00:00:00`);
    if (Number.isNaN(localDate.getTime())) return null;
    return localDate.toISOString();
};

export default function CreditoNuevo() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { list: clients = [] } = useSelector((state) => state.clients) ?? { list: [] };
    const { loading: isSubmitting = false } = useSelector((state) => state.credits) ?? { loading: false };
    const { list: users = [] } = useSelector((state) => state.employees) ?? { list: [] };

    const cobradores = useMemo(
        () => users.filter((user) => user.role === "COBRADOR" || user.role === "EMPLOYEE"),
        [users]
    );

    useEffect(() => {
        if (!clients.length) dispatch(loadClients({ pageSize: CLIENTS_FETCH_LIMIT }));
        if (!users.length) dispatch(loadUsers());
    }, [clients.length, users.length, dispatch]);

    const todayIso = useMemo(() => toLocalDateIso(new Date()), []);
    const [form, setForm] = useState({
        clienteId: "",
        monto: "",
        interes: "",
        cuotas: "",
        plan: DEFAULT_PLAN,
        cobradorId: "",
        comisionLibre: "",
        cobradorComisionId: "",
        startDate: todayIso
    });

    const [clientSearch, setClientSearch] = useState("");

    const selectedClient = useMemo(
        () => clients.find((client) => client.id === form.clienteId) ?? null,
        [clients, form.clienteId]
    );

    const searchTokens = useMemo(() => tokenize(clientSearch), [clientSearch]);

    const filteredClients = useMemo(() => {
        if (!searchTokens.length) {
            return clients.slice(0, 10);
        }
        return clients.filter((client) => clientMatchesTokens(client, searchTokens)).slice(0, 10);
    }, [clients, searchTokens]);

    const shouldShowClientResults = clientSearch.trim().length > 0 && !form.clienteId;

    const montoBase = Number(form.monto) || 0;
    const interesPorc = Number(form.interes) || 0;
    const cuotasNumber = Math.max(0, Number(form.cuotas) || 0);
    const comisionLibre = Math.max(0, Number(form.comisionLibre) || 0);

    const totalCredito = useMemo(() => {
        if (!montoBase) return 0;
        return Math.round(montoBase + (montoBase * interesPorc) / 100);
    }, [montoBase, interesPorc]);

    const cuotaEstimada = useMemo(() => {
        if (!totalCredito || !cuotasNumber) return 0;
        return Math.round(totalCredito / cuotasNumber);
    }, [totalCredito, cuotasNumber]);

    const preview = useMemo(() => {
        if (!cuotaEstimada || !cuotasNumber) return [];
        const length = Math.min(6, cuotasNumber);
        return Array.from({ length }, (_, index) => ({
            nro: index + 1,
            importe: cuotaEstimada
        }));
    }, [cuotaEstimada, cuotasNumber]);

    const totalNetoCliente = useMemo(() => Math.max(montoBase - comisionLibre, 0), [montoBase, comisionLibre]);

    const estimatedDueDate = useMemo(
        () => calculateDueDate(form.startDate, cuotasNumber, form.plan),
        [form.startDate, cuotasNumber, form.plan]
    );

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const clearClientSelection = () => {
        setForm((prev) => ({ ...prev, clienteId: "" }));
        setClientSearch("");
    };

    const handleClientSelect = (client) => {
        setForm((prev) => ({ ...prev, clienteId: client.id }));
        setClientSearch(client.name || client.document || "");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!form.clienteId) {
            toast.error("Seleccioná un cliente antes de crear el crédito");
            return;
        }

        if (!montoBase) {
            toast.error("Ingresá un monto base válido");
            return;
        }

        if (!cuotasNumber) {
            toast.error("Indicá la cantidad de cuotas");
            return;
        }

        if (!form.startDate) {
            toast.error("Seleccioná la fecha de inicio");
            return;
        }

        const parsedStartDate = new Date(`${form.startDate}T00:00:00`);
        if (Number.isNaN(parsedStartDate.getTime())) {
            toast.error("La fecha de inicio no es válida");
            return;
        }

        const startDateIso = toUtcIsoFromLocalDate(form.startDate);
        const dueDateIso = estimatedDueDate ? toUtcIsoFromLocalDate(estimatedDueDate) : undefined;

        if (!startDateIso) {
            toast.error("La fecha de inicio no es válida");
            return;
        }

        const payload = {
            clientId: form.clienteId,
            type: form.plan,
            amount: montoBase,
            totalInstallments: cuotasNumber || undefined,
            installmentAmount: cuotaEstimada || undefined,
            startDate: startDateIso,
            dueDate: dueDateIso,
            status: "PENDING"
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

    const generarContrato = () => {
        if (!form.clienteId) {
            toast.error("Seleccioná un cliente antes de generar el contrato");
            return;
        }

        if (!montoBase) {
            toast.error("Ingresá un monto base válido");
            return;
        }

        if (!cuotasNumber) {
            toast.error("Indicá la cantidad de cuotas");
            return;
        }

        const cliente = selectedClient;
        const cobradorAsignado = users.find((user) => user.id === form.cobradorId);

        const startDate = form.startDate ? new Date(`${form.startDate}T00:00:00`) : new Date();
        const startDateValid = Number.isNaN(startDate.getTime()) ? new Date() : startDate;
        const firstDue = calculateDueDate(toLocalDateIso(startDateValid), 1, form.plan);
        const firstDueDate = firstDue ? new Date(firstDue) : new Date(startDateValid);

        const doc = new jsPDF();
        const marginLeft = 16;
        const contentWidth = 178;
        let cursorY = 22;

        const day = startDateValid.getDate();
        const monthName = startDateValid.toLocaleDateString("es-AR", { month: "long" });
        const year = startDateValid.getFullYear();

        const clientCity = cliente?.city || "San Luis";
        const clientProvince = cliente?.province || "San Luis";
        const clientAddress = cliente?.address || "—";
        const clientDocument = cliente?.document || "—";
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
            `El plazo de restitución del capital será de ${cuotasNumber || 1} ${cuotasNumber === 1 ? "cuota" : "cuotas"}, que el mutuario abonará según el siguiente esquema: la cuota N° 1 vencerá el ${firstDueFormatted} por la suma de PESOS ${formatCurrency(cuotaEstimada)}, continuando en iguales períodos hasta la cancelación total.`
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

    const selectedPlan = PLAN_OPTIONS.find((plan) => plan.value === form.plan) || PLAN_OPTIONS[0];

    return (
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-xl font-bold sm:text-2xl">Nuevo crédito</h1>

            <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 gap-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <section className="rounded-xl border border-gray-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Datos del cliente</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Buscá por nombre, documento o teléfono.</p>
                        </div>
                        <div className="mt-4 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Cliente</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={clientSearch}
                                        onChange={(event) => setClientSearch(event.target.value)}
                                        placeholder="Buscar por nombre, teléfono o DNI"
                                        className="h-11 w-full rounded-lg border border-gray-300/80 bg-white px-3 text-sm text-gray-900 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
                                    {form.clienteId && (
                                        <button
                                            type="button"
                                            onClick={clearClientSelection}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-transparent bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                                            Limpiar
                                        </button>
                                    )}
                                </div>
                            </div>

                            {shouldShowClientResults && (
                                <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">
                                    {filteredClients.length ? (
                                        filteredClients.map((client) => {
                                            const isSelected = client.id === form.clienteId;
                                            return (
                                                <button
                                                    key={client.id}
                                                    type="button"
                                                    onClick={() => handleClientSelect(client)}
                                                    className={`flex w-full flex-col gap-1 border-b px-4 py-3 text-left text-sm transition last:border-b-0 dark:border-gray-800 ${isSelected ? "bg-blue-50 text-blue-800 shadow-inner dark:bg-blue-900/40 dark:text-blue-200" : "hover:bg-blue-50/60 dark:text-gray-100 dark:hover:bg-blue-900/20"}`}>
                                                    <span className="font-medium">{client.name || "Sin nombre"}</span>
                                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                                        DNI: {client.document || "—"} • Tel: {client.phone || client.alternatePhone || "—"}
                                                    </span>
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">No se encontraron clientes con ese criterio</p>
                                    )}
                                </div>
                            )}

                            {selectedClient && (
                                <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-900/30 dark:text-blue-200">
                                    Seleccionado: <span className="font-semibold">{selectedClient.name}</span>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => navigate("/clientes/nuevo")}
                                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-300">
                                <span className="text-base">＋</span> Crear nuevo cliente
                            </button>
                        </div>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
                        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Configuración del crédito</h2>
                        <div className="mt-4 space-y-5">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-1.5">
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Fecha de inicio</label>
                                    <input
                                        name="startDate"
                                        type="date"
                                        value={form.startDate}
                                        onChange={handleChange}
                                        className="h-11 w-full rounded-lg border border-gray-300/80 bg-white px-3 text-sm text-gray-900 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
                                </div>
                                <div className="grid gap-1.5">
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Plan o tipo</label>
                                    <div className="flex flex-wrap gap-2">
                                        {PLAN_OPTIONS.map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setForm((prev) => ({ ...prev, plan: option.value }))}
                                                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${form.plan === option.value ? "border-blue-500 bg-blue-500/10 text-blue-700 shadow-sm dark:border-blue-400 dark:bg-blue-400/10 dark:text-blue-200" : "border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:text-blue-200"}`}>
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="grid gap-1.5">
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Monto base</label>
                                    <input
                                        name="monto"
                                        type="number"
                                        min={0}
                                        step="100"
                                        value={form.monto}
                                        onChange={handleChange}
                                        placeholder="Ej: 100000"
                                        className="h-11 w-full rounded-lg border border-gray-300/80 bg-white px-3 text-sm text-gray-900 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
                                </div>
                                <div className="grid gap-1.5">
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Interés (%)</label>
                                    <input
                                        name="interes"
                                        type="number"
                                        min={0}
                                        step="1"
                                        value={form.interes}
                                        onChange={handleChange}
                                        placeholder="Ej: 150"
                                        className="h-11 w-full rounded-lg border border-gray-300/80 bg-white px-3 text-sm text-gray-900 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
                                </div>
                                <div className="grid gap-1.5">
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Cantidad de cuotas</label>
                                    <input
                                        name="cuotas"
                                        type="number"
                                        min={1}
                                        step="1"
                                        value={form.cuotas}
                                        onChange={handleChange}
                                        placeholder="Ej: 10"
                                        className="h-11 w-full rounded-lg border border-gray-300/80 bg-white px-3 text-sm text-gray-900 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="grid gap-1.5">
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Cobrador asignado</label>
                                    <select
                                        name="cobradorId"
                                        value={form.cobradorId}
                                        onChange={handleChange}
                                        className="h-11 w-full rounded-lg border border-gray-300/80 bg-white px-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
                                        <option value="">Seleccionar cobrador</option>
                                        {cobradores.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid gap-1.5">
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Cobrador comisión</label>
                                    <select
                                        name="cobradorComisionId"
                                        value={form.cobradorComisionId}
                                        onChange={handleChange}
                                        className="h-11 w-full rounded-lg border border-gray-300/80 bg-white px-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
                                        <option value="">Seleccionar cobrador</option>
                                        {cobradores.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid gap-1.5">
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Comisión libre ($)</label>
                                    <input
                                        name="comisionLibre"
                                        type="number"
                                        min={0}
                                        step="100"
                                        value={form.comisionLibre}
                                        onChange={handleChange}
                                        placeholder="Ej: 2000"
                                        className="h-11 w-full rounded-lg border border-gray-300/80 bg-white px-3 text-sm text-gray-900 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 border-t border-gray-200 pt-4 text-right dark:border-gray-700">
                            <button
                                type="button"
                                onClick={generarContrato}
                                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300">
                                Generar contrato y enviar al mail
                            </button>
                        </div>
                    </section>
                </div>

                <aside className="lg:col-span-1 space-y-6">
                    <div className="rounded-xl border border-gray-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Resumen</h3>
                            <span className="rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:border-blue-500/50 dark:bg-blue-900/40 dark:text-blue-200">
                                {selectedPlan.label}
                            </span>
                        </div>
                        <dl className="mt-4 space-y-3 text-sm">
                            <div className="flex items-start justify-between">
                                <dt className="text-gray-500">Inicio</dt>
                                <dd className="font-medium text-gray-900 dark:text-gray-100">
                                    {form.startDate ? new Date(`${form.startDate}T00:00:00`).toLocaleDateString("es-AR") : "—"}
                                </dd>
                            </div>
                            <div className="flex items-start justify-between">
                                <dt className="text-gray-500">Vencimiento estimado</dt>
                                <dd className="font-medium text-gray-900 dark:text-gray-100">
                                    {estimatedDueDate ? new Date(`${estimatedDueDate}T00:00:00`).toLocaleDateString("es-AR") : "—"}
                                </dd>
                            </div>
                            <div className="flex items-start justify-between">
                                <dt className="text-gray-500">Cuotas</dt>
                                <dd className="font-medium text-gray-900 dark:text-gray-100">{cuotasNumber || "—"}</dd>
                            </div>
                            <div className="flex items-start justify-between">
                                <dt className="text-gray-500">Interés</dt>
                                <dd className="font-medium text-gray-900 dark:text-gray-100">
                                    {form.interes ? `${form.interes}%` : "—"}
                                </dd>
                            </div>
                            <div className="flex items-start justify-between">
                                <dt className="text-gray-500">Monto base</dt>
                                <dd className="font-medium text-gray-900 dark:text-gray-100">
                                    {montoBase ? currencyFormatter.format(montoBase) : "—"}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Detalle de montos</h3>
                        <div className="mt-4 space-y-3 text-sm">
                            <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                                <span>Total crédito</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {totalCredito ? currencyFormatter.format(totalCredito) : "—"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                                <span>Cuota estimada</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {cuotaEstimada ? currencyFormatter.format(cuotaEstimada) : "—"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                                <span>Comisión libre</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {comisionLibre ? currencyFormatter.format(comisionLibre) : "—"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                                <span>Total neto cliente</span>
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    {totalNetoCliente ? currencyFormatter.format(totalNetoCliente) : "—"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Previsualización de cuotas</h3>
                        <div className="mt-4 space-y-2 text-sm">
                            {preview.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400">Completá monto, interés y cuotas para ver la simulación.</p>
                            ) : (
                                preview.map((item) => (
                                    <div key={item.nro} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                                        <span>Cuota {item.nro}</span>
                                        <span className="font-medium">{currencyFormatter.format(item.importe)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60">
                        {isSubmitting ? "Creando crédito" : "Crear crédito"}
                    </button>
                </aside>
            </form>
        </div>
    );
}

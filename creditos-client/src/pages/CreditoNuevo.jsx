// @ts-nocheck
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import jsPDF from "jspdf";
import toast from "react-hot-toast";
import { addCredit } from "../store/creditsSlice";
import { loadUsers } from "../store/employeeSlice";
import { fetchClients as fetchClientsService } from "../services/clientsService";
import {
    fetchSpecialCredits as fetchSpecialCreditsService,
    createSpecialCredit as createSpecialCreditService
} from "../services/specialCreditsService";

const PLAN_OPTIONS = [
    { label: "Pago único", value: "ONE_TIME" },
    { label: "Diario", value: "DAILY" },
    { label: "Semanal", value: "WEEKLY" },
    { label: "Quincenal", value: "QUINCENAL" },
    { label: "Mensual", value: "MONTHLY" }
];

const CREDIT_STEPS = [
    {
        id: 1,
        eyebrow: "Paso 1",
        title: "Cliente",
        description: "Elegí a quién se le va a otorgar el crédito."
    },
    {
        id: 2,
        eyebrow: "Paso 2",
        title: "Configuración",
        description: "Definí plan, fechas, cuotas e importe."
    },
    {
        id: 3,
        eyebrow: "Paso 3",
        title: "Gastos",
        description: "Cargá gastos asociados si corresponde."
    },
    {
        id: 4,
        eyebrow: "Paso 4",
        title: "Confirmación",
        description: "Revisá el resumen final antes de crear el crédito."
    }
];

const DEFAULT_PLAN = "MONTHLY";
const CLIENTS_FETCH_LIMIT = 100;
const CLIENTS_SUGGESTION_LIMIT = 10;
const SPECIAL_CREDITS_FETCH_LIMIT = 10;
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

const isClientActive = (client) => ((client?.status ?? "ACTIVE").toUpperCase() === "ACTIVE");

const calculateInstallmentDate = (baseDate, installmentIndex, plan) => {
    if (!baseDate) return "";

    const due = new Date(`${baseDate}T00:00:00`);
    if (Number.isNaN(due.getTime())) return "";

    const periods = Math.max(0, Number(installmentIndex) || 0);

    switch (plan) {
        case "ONE_TIME":
            break;
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

const calculateLastDueDate = (firstPaymentDate, installments, plan) => {
    if (!firstPaymentDate) return "";

    const normalizedInstallments = Math.max(1, Number(installments) || 0);
    const lastInstallmentIndex = Math.max(normalizedInstallments - 1, 0);
    return calculateInstallmentDate(firstPaymentDate, lastInstallmentIndex, plan);
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

const createTempId = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

const FIELD_INPUT_CLASS = "h-11 w-full rounded-xl border border-[var(--ios-sep-opaque)] bg-[var(--ios-fill)] px-3 text-sm text-[var(--ios-label)] outline-none transition focus:border-[var(--ios-blue)] focus:ring-2 focus:ring-blue-100";
const FIELD_LABEL_CLASS = "text-xs font-semibold text-[var(--ios-label-sec)]";
const SOFT_SECTION_CLASS = "rounded-2xl border border-[var(--ios-sep-opaque)] bg-white/80 p-5";

const getChoiceButtonClass = (isActive) =>
    `inline-flex h-11 w-full items-center justify-center rounded-xl border px-4 py-2 text-xs font-semibold text-center transition ${isActive
        ? "border-blue-500 bg-blue-600 text-white shadow-sm"
        : "border-[var(--ios-sep-opaque)] bg-[var(--ios-fill)] text-[var(--ios-label-sec)] hover:border-blue-400 hover:text-blue-600"}`;

function HelpHint({ text }) {
    if (!text) return null;

    return (
        <span className="group relative inline-flex items-center">
            <span
                tabIndex={0}
                className="inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-[11px] font-bold text-blue-700 outline-none transition group-hover:border-blue-300 group-focus-within:border-blue-300 dark:border-blue-700/60 dark:bg-blue-900/30 dark:text-blue-200"
                aria-label={text}
            >
                ?
            </span>
            <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-56 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-lg group-hover:block group-focus-within:block dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200">
                {text}
            </span>
        </span>
    );
}

function FieldLabel({ label, help }) {
    return (
        <div className="flex min-h-10 items-start gap-2 leading-tight">
            <label className={FIELD_LABEL_CLASS}>{label}</label>
            <HelpHint text={help} />
        </div>
    );
}

export default function CreditoNuevo() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { loading: isSubmitting = false } = useSelector((state) => state.credits) ?? { loading: false };
    const { list: users = [] } = useSelector((state) => state.employees) ?? { list: [] };

    const [clientOptions, setClientOptions] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [clientsError, setClientsError] = useState(null);
    const [clientSearch, setClientSearch] = useState("");
    const [currentStep, setCurrentStep] = useState(1);

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
        startDate: todayIso,
        firstPaymentDate: todayIso
    });

    const selectedClientId = form.clienteId;

    const cobradores = useMemo(
        () => users.filter((user) => user.role === "COBRADOR" || user.role === "EMPLOYEE"),
        [users]
    );

    useEffect(() => {
        if (!users.length) dispatch(loadUsers());
    }, [users.length, dispatch]);

    useEffect(() => {
        if (selectedClientId) {
            setIsLoadingClients(false);
            return;
        }

        let disposed = false;
        const searchTerm = clientSearch.trim();

        const fetchOptions = async () => {
            setIsLoadingClients(true);
            setClientsError(null);
            try {
                const params = { pageSize: CLIENTS_FETCH_LIMIT };
                if (searchTerm) params.q = searchTerm;
                const response = await fetchClientsService(params);
                if (!disposed) {
                    setClientOptions(response.data?.data ?? []);
                }
            } catch (error) {
                if (disposed) return;
                console.error("No se pudieron cargar los clientes", error);
                setClientOptions([]);
                setClientsError("No se pudo cargar la lista de clientes");
            } finally {
                if (!disposed) setIsLoadingClients(false);
            }
        };

        const delay = setTimeout(fetchOptions, searchTerm ? 250 : 0);

        return () => {
            disposed = true;
            clearTimeout(delay);
        };
    }, [clientSearch, selectedClientId]);

    const isSinglePayment = form.plan === "ONE_TIME";

    const [creditMode, setCreditMode] = useState("NEW");
    const isExistingCredit = creditMode === "EXISTING";
    const isNewCredit = creditMode === "NEW";
    const [existingCreditData, setExistingCreditData] = useState({
        nextInstallmentToCharge: ""
    });

    const [expenses, setExpenses] = useState([]);
    const [expenseSearch, setExpenseSearch] = useState("");
    const [expenseAmount, setExpenseAmount] = useState("");
    const [selectedSpecialCredit, setSelectedSpecialCredit] = useState(null);
    const [specialCreditOptions, setSpecialCreditOptions] = useState([]);
    const [isLoadingSpecialCredits, setIsLoadingSpecialCredits] = useState(false);
    const [specialCreditsError, setSpecialCreditsError] = useState(null);
    const [isSavingExpense, setIsSavingExpense] = useState(false);

    const [isSpecialCredit, setIsSpecialCredit] = useState(false);
    const [creditSpecialSearch, setCreditSpecialSearch] = useState("");
    const [creditSpecialOptions, setCreditSpecialOptions] = useState([]);
    const [isLoadingCreditSpecials, setIsLoadingCreditSpecials] = useState(false);
    const [creditSpecialError, setCreditSpecialError] = useState(null);
    const [selectedCreditSpecial, setSelectedCreditSpecial] = useState(null);
    const [isCreatingCreditSpecial, setIsCreatingCreditSpecial] = useState(false);

    useEffect(() => {
        if (!isSinglePayment) return;
        setForm((prev) => (prev.cuotas === "1" ? prev : { ...prev, cuotas: "1" }));
    }, [isSinglePayment]);

    useEffect(() => {
        if (isSinglePayment) return;
        setForm((prev) => (prev.cuotas === "1" ? { ...prev, cuotas: "2" } : prev));
    }, [isSinglePayment]);

    useEffect(() => {
        if (!isNewCredit) return;

        setForm((prev) => {
            const nextStartDate = prev.startDate && prev.startDate < todayIso ? todayIso : prev.startDate;
            const nextFirstPaymentDate = prev.firstPaymentDate && prev.firstPaymentDate < todayIso ? todayIso : prev.firstPaymentDate;

            if (nextStartDate === prev.startDate && nextFirstPaymentDate === prev.firstPaymentDate) {
                return prev;
            }

            return {
                ...prev,
                startDate: nextStartDate,
                firstPaymentDate: nextFirstPaymentDate
            };
        });
    }, [isNewCredit, todayIso]);

    useEffect(() => {
        const search = expenseSearch.trim();

        if (!search) {
            setSpecialCreditOptions([]);
            setSpecialCreditsError(null);
            return;
        }

        let disposed = false;

        const run = async () => {
            setIsLoadingSpecialCredits(true);
            setSpecialCreditsError(null);
            try {
                const response = await fetchSpecialCreditsService({
                    q: search,
                    pageSize: SPECIAL_CREDITS_FETCH_LIMIT
                });
                if (!disposed) {
                    setSpecialCreditOptions(response.data?.data ?? []);
                }
            } catch (error) {
                if (disposed) return;
                console.error("No se pudieron cargar los créditos especiales", error);
                setSpecialCreditOptions([]);
                setSpecialCreditsError("No se pudo cargar la lista de gastos");
            } finally {
                if (!disposed) setIsLoadingSpecialCredits(false);
            }
        };

        const delay = setTimeout(run, 250);

        return () => {
            disposed = true;
            clearTimeout(delay);
        };
    }, [expenseSearch]);

    useEffect(() => {
        if (!isSpecialCredit) {
            setCreditSpecialSearch("");
            setCreditSpecialOptions([]);
            setCreditSpecialError(null);
            setSelectedCreditSpecial(null);
            setIsLoadingCreditSpecials(false);
            return;
        }

        let disposed = false;
        const search = creditSpecialSearch.trim();

        const run = async () => {
            setIsLoadingCreditSpecials(true);
            setCreditSpecialError(null);
            try {
                const params = { pageSize: SPECIAL_CREDITS_FETCH_LIMIT };
                if (search) params.q = search;
                const response = await fetchSpecialCreditsService(params);
                if (!disposed) {
                    setCreditSpecialOptions(response.data?.data ?? []);
                }
            } catch (error) {
                if (disposed) return;
                console.error("No se pudieron cargar los créditos especiales", error);
                setCreditSpecialOptions([]);
                setCreditSpecialError("No se pudieron cargar los créditos especiales");
            } finally {
                if (!disposed) setIsLoadingCreditSpecials(false);
            }
        };

        const delay = setTimeout(run, search ? 250 : 0);

        return () => {
            disposed = true;
            clearTimeout(delay);
        };
    }, [isSpecialCredit, creditSpecialSearch]);

    useEffect(() => {
        if (!isExistingCredit) {
            setExistingCreditData({ nextInstallmentToCharge: "" });
        }
    }, [isExistingCredit]);

    const searchTokens = useMemo(() => tokenize(clientSearch), [clientSearch]);

    const filteredClients = useMemo(() => {
        if (selectedClientId) return [];
        if (!clientOptions.length) return [];
        const prioritized = [...clientOptions].sort((a, b) => Number(isClientActive(b)) - Number(isClientActive(a)));
        if (!searchTokens.length) {
            return prioritized.slice(0, CLIENTS_SUGGESTION_LIMIT);
        }
        return prioritized
            .filter((client) => clientMatchesTokens(client, searchTokens))
            .slice(0, CLIENTS_SUGGESTION_LIMIT);
    }, [clientOptions, searchTokens, selectedClientId]);

    const shouldShowClientResults = clientSearch.trim().length > 0 && !form.clienteId;

    const normalizedExpenseSearch = expenseSearch.trim();
    const shouldShowSpecialCreditResults = normalizedExpenseSearch.length > 0 && !selectedSpecialCredit;

    const totalExpenses = useMemo(
        () => expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0),
        [expenses]
    );

    const nextInstallmentNumber = useMemo(
        () => Math.max(0, Number(existingCreditData.nextInstallmentToCharge) || 0),
        [existingCreditData.nextInstallmentToCharge]
    );

    const canAddExpense = Number(expenseAmount) > 0 && (normalizedExpenseSearch.length > 0 || selectedSpecialCredit);

    const montoBase = Number(form.monto) || 0;
    const interesPorc = Number(form.interes) || 0;
    const cuotasNumber = Math.max(0, Number(form.cuotas) || 0);
    const comisionLibre = Math.max(0, Number(form.comisionLibre) || 0);
    const minimumInstallments = isSinglePayment ? 1 : 2;
    const scheduleBaseDate = isSinglePayment ? form.startDate : form.firstPaymentDate;
    const primaryDateLabel = isSinglePayment ? "Fecha de pago" : "Fecha de otorgamiento";
    const primaryDateHelp = isSinglePayment
        ? "Indicá el día en que vence y se cobra este pago único."
        : "Indicá el día en que se entregó el dinero al cliente.";

    const totalCredito = useMemo(() => {
        if (!montoBase) return 0;
        return Math.round(montoBase + (montoBase * interesPorc) / 100);
    }, [montoBase, interesPorc]);

    const cuotaEstimada = useMemo(() => {
        if (!totalCredito || !cuotasNumber) return 0;
        return Math.round(totalCredito / cuotasNumber);
    }, [totalCredito, cuotasNumber]);

    const paidInstallmentsNumber = useMemo(
        () => Math.max(nextInstallmentNumber - 1, 0),
        [nextInstallmentNumber]
    );

    const computedReceivedAmount = useMemo(() => {
        const installmentValue = cuotaEstimada || 0;
        if (!installmentValue || !paidInstallmentsNumber) return 0;
        return paidInstallmentsNumber * installmentValue;
    }, [paidInstallmentsNumber, cuotaEstimada]);

    const hasNextInstallmentValue =
        typeof existingCreditData.nextInstallmentToCharge === "string" &&
        existingCreditData.nextInstallmentToCharge.trim() !== "";

    const showComputedReceivedAmount = isExistingCredit && cuotaEstimada > 0 && hasNextInstallmentValue;
    const computedReceivedAmountLabel = showComputedReceivedAmount
        ? currencyFormatter.format(computedReceivedAmount)
        : "—";

    const preview = useMemo(() => {
        if (!cuotaEstimada || !cuotasNumber || !scheduleBaseDate) return [];
        const length = Math.min(6, cuotasNumber);
        return Array.from({ length }, (_, index) => ({
            nro: index + 1,
            importe: cuotaEstimada,
            dueDate: calculateInstallmentDate(scheduleBaseDate, index, form.plan)
        }));
    }, [cuotaEstimada, cuotasNumber, scheduleBaseDate, form.plan]);

    const gananciaCredito = useMemo(() => Math.max(totalCredito - montoBase, 0), [totalCredito, montoBase]);
    const totalNetoDespuesComision = useMemo(
        () => Math.max(totalCredito - comisionLibre, 0),
        [totalCredito, comisionLibre]
    );

    const estimatedDueDate = useMemo(
        () => calculateLastDueDate(scheduleBaseDate, cuotasNumber, form.plan),
        [scheduleBaseDate, cuotasNumber, form.plan]
    );

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const resetExpenseInputs = () => {
        setExpenseSearch("");
        setExpenseAmount("");
        setSelectedSpecialCredit(null);
        setSpecialCreditsError(null);
    };

    const clearClientSelection = () => {
        setForm((prev) => ({ ...prev, clienteId: "" }));
        setSelectedClient(null);
        setClientSearch("");
        setExpenses([]);
        resetExpenseInputs();
    };

    const handleClientSelect = (client) => {
        if (!isClientActive(client)) {
            toast.error("Este cliente está inactivo. Activalo antes de asignar un crédito.");
            return;
        }
        setForm((prev) => ({ ...prev, clienteId: client.id }));
        setSelectedClient(client);
        setClientSearch(client.name || client.document || "");
    };

    const handleExpenseSearchChange = (event) => {
        const value = event.target.value;
        setExpenseSearch(value);
        if (!value.trim()) {
            setSelectedSpecialCredit(null);
        }
    };

    const handleSelectSpecialCredit = (item) => {
        setSelectedSpecialCredit(item);
        setExpenseSearch(item.name);
    };

    const handleClearSelectedSpecialCredit = () => {
        setSelectedSpecialCredit(null);
    };

    const handleToggleSpecialCredit = () => {
        setIsSpecialCredit((prev) => !prev);
    };

    const handleSelectCreditSpecial = (item) => {
        setSelectedCreditSpecial(item);
        setCreditSpecialSearch(item?.name ?? "");
    };

    const handleClearCreditSpecial = () => {
        setSelectedCreditSpecial(null);
        setCreditSpecialSearch("");
    };

    const handleCreateCreditSpecial = async () => {
        const name = creditSpecialSearch.trim();

        if (!name) {
            toast.error("Ingresá el nombre del grupo especial");
            return;
        }

        setIsCreatingCreditSpecial(true);
        try {
            const response = await createSpecialCreditService({ name });
            const created = response.data;
            setSelectedCreditSpecial(created);
            setCreditSpecialSearch(created?.name ?? name);
            setCreditSpecialOptions((prev) => {
                if (!created) return prev;
                const filtered = Array.isArray(prev) ? prev.filter((item) => item.id !== created.id) : [];
                return [created, ...filtered];
            });
            toast.success("Grupo especial creado");
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "No se pudo crear el grupo especial";
            toast.error(message);
        } finally {
            setIsCreatingCreditSpecial(false);
        }
    };

    const handleExistingCreditChange = (event) => {
        const { name, value } = event.target;
        setExistingCreditData((prev) => ({ ...prev, [name]: value }));
    };

    const handleRemoveExpense = (tempId) => {
        setExpenses((prev) => prev.filter((expense) => expense.tempId !== tempId));
    };

    const handleAddExpense = async () => {
        const description = (selectedSpecialCredit?.name || expenseSearch).trim();
        const amountNumber = Number(expenseAmount);

        if (!description) {
            toast.error("Indicá el nombre del gasto");
            return;
        }

        if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
            toast.error("Ingresá un monto válido para el gasto");
            return;
        }

        setIsSavingExpense(true);
        try {
            let specialCreditRecord = selectedSpecialCredit;

            if (!specialCreditRecord) {
                const response = await createSpecialCreditService({ name: description });
                specialCreditRecord = response.data;
            }

            setExpenses((prev) => [
                ...prev,
                {
                    tempId: createTempId(),
                    description,
                    amount: amountNumber,
                    specialCreditId: specialCreditRecord?.id ?? null,
                    specialCreditName: specialCreditRecord?.name ?? description
                }
            ]);

            resetExpenseInputs();
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "No se pudo guardar el gasto";
            toast.error(message);
        } finally {
            setIsSavingExpense(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!form.clienteId) {
            toast.error("Seleccioná un cliente antes de crear el crédito");
            return;
        }

        const clientRecord = selectedClient || clientOptions.find((client) => client.id === form.clienteId);
        if (clientRecord && !isClientActive(clientRecord)) {
            toast.error("Este cliente está inactivo. Activalo antes de asignar un crédito.");
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

        if (!isSinglePayment && cuotasNumber < 2) {
            toast.error("En planes recurrentes la cantidad mínima es 2 cuotas. Si es una sola, usá pago único.");
            return;
        }

        if (!form.startDate) {
            toast.error(isSinglePayment ? "Seleccioná la fecha de pago" : "Seleccioná la fecha de otorgamiento");
            return;
        }

        const parsedStartDate = new Date(`${form.startDate}T00:00:00`);
        if (Number.isNaN(parsedStartDate.getTime())) {
            toast.error(isSinglePayment ? "La fecha de pago no es válida" : "La fecha de otorgamiento no es válida");
            return;
        }

        if (isNewCredit && form.startDate < todayIso) {
            toast.error(isSinglePayment ? "En un crédito nuevo no podés elegir una fecha de pago pasada" : "En un crédito nuevo no podés elegir una fecha de otorgamiento pasada");
            return;
        }

        let parsedFirstPaymentDate = parsedStartDate;
        if (!isSinglePayment) {
            if (!form.firstPaymentDate) {
                toast.error("Seleccioná la fecha del primer pago");
                return;
            }

            parsedFirstPaymentDate = new Date(`${form.firstPaymentDate}T00:00:00`);
            if (Number.isNaN(parsedFirstPaymentDate.getTime())) {
                toast.error("La fecha del primer pago no es válida");
                return;
            }

            if (isNewCredit && form.firstPaymentDate < todayIso) {
                toast.error("En un crédito nuevo no podés elegir una fecha de primer pago pasada");
                return;
            }
        }

        const startDateIso = toUtcIsoFromLocalDate(form.startDate);
        const firstPaymentDateIso = !isSinglePayment ? toUtcIsoFromLocalDate(form.firstPaymentDate) : undefined;
        const dueDateIso = estimatedDueDate ? toUtcIsoFromLocalDate(estimatedDueDate) : undefined;

        if (!startDateIso) {
            toast.error(isSinglePayment ? "La fecha de pago no es válida" : "La fecha de otorgamiento no es válida");
            return;
        }

        if (!isSinglePayment && !firstPaymentDateIso) {
            toast.error("La fecha del primer pago no es válida");
            return;
        }

        if (isSpecialCredit && !selectedCreditSpecial) {
            toast.error("Seleccioná o creá un grupo especial");
            return;
        }

        let receivedAmountValue = 0;
        let nextInstallmentValue;

        if (isExistingCredit) {
            if (!existingCreditData.nextInstallmentToCharge.trim()) {
                toast.error("Indicá la próxima cuota a cobrar");
                return;
            }

            nextInstallmentValue = Number(existingCreditData.nextInstallmentToCharge);
            if (!Number.isInteger(nextInstallmentValue) || nextInstallmentValue < 1) {
                toast.error("La próxima cuota debe ser un número entero mayor o igual a 1");
                return;
            }

            if (!cuotaEstimada) {
                toast.error("Completá monto, interés y cuotas para calcular lo ya cobrado");
                return;
            }

            const paidInstallments = Math.max(nextInstallmentValue - 1, 0);
            const installmentValue = cuotaEstimada || 0;
            receivedAmountValue = paidInstallments > 0 && installmentValue > 0
                ? paidInstallments * installmentValue
                : 0;
        }

        const expensesPayload = expenses.map((expense) => ({
            description: expense.description,
            amount: Number(expense.amount) || 0,
            specialCreditId: expense.specialCreditId ?? undefined,
            category: expense.category ?? undefined,
            notes: expense.notes ?? undefined,
            incurredOn: expense.incurredOn ?? undefined
        }));

        if (comisionLibre > 0) {
            const commissionUser =
                cobradores.find((user) => user.id === form.cobradorComisionId) ||
                cobradores.find((user) => user.id === form.cobradorId);
            expensesPayload.push({
                description: `Comisión cobrador${commissionUser ? ` - ${commissionUser.name}` : ""}`,
                amount: comisionLibre,
                category: "COMISION",
                notes: commissionUser ? `Cobrador: ${commissionUser.name}` : undefined
            });
        }

        const payload = {
            clientId: form.clienteId,
            type: form.plan,
            amount: montoBase,
            totalInstallments: cuotasNumber || undefined,
            installmentAmount: cuotaEstimada || undefined,
            startDate: startDateIso,
            firstPaymentDate: firstPaymentDateIso,
            dueDate: dueDateIso,
            status: "PENDING",
            expenses: expensesPayload,
            receivedAmount: isExistingCredit ? receivedAmountValue : 0
        };

        if (isSpecialCredit && selectedCreditSpecial?.id) {
            payload.specialCreditId = selectedCreditSpecial.id;
        }

        if (isExistingCredit && typeof nextInstallmentValue === "number") {
            payload.paidInstallments = Math.max(nextInstallmentValue - 1, 0);
            payload.nextInstallmentToCharge = nextInstallmentValue;
        }

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

        const grantedDate = form.startDate ? new Date(`${form.startDate}T00:00:00`) : new Date();
        const grantedDateValid = Number.isNaN(grantedDate.getTime()) ? new Date() : grantedDate;
        const firstPaymentBase = isSinglePayment
            ? form.startDate
            : (form.firstPaymentDate || form.startDate);
        const firstDue = firstPaymentBase ? calculateInstallmentDate(firstPaymentBase, 0, form.plan) : "";
        const firstDueDate = firstDue ? new Date(`${firstDue}T00:00:00`) : new Date(grantedDateValid);

        const doc = new jsPDF();
        const marginLeft = 16;
        const contentWidth = 178;
        let cursorY = 22;

        const day = grantedDateValid.getDate();
        const monthName = grantedDateValid.toLocaleDateString("es-AR", { month: "long" });
        const year = grantedDateValid.getFullYear();

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

    const validateClientStep = () => {
        if (!form.clienteId) {
            toast.error("Seleccioná un cliente antes de continuar");
            return false;
        }

        const clientRecord = selectedClient || clientOptions.find((client) => client.id === form.clienteId);
        if (clientRecord && !isClientActive(clientRecord)) {
            toast.error("Este cliente está inactivo. Activalo antes de asignar un crédito.");
            return false;
        }

        return true;
    };

    const validateConfigurationStep = () => {
        if (!validateClientStep()) return false;

        if (!montoBase) {
            toast.error("Ingresá un monto base válido");
            return false;
        }

        if (!cuotasNumber) {
            toast.error("Indicá la cantidad de cuotas");
            return false;
        }

        if (!isSinglePayment && cuotasNumber < 2) {
            toast.error("En planes recurrentes la cantidad mínima es 2 cuotas. Si es una sola, usá pago único.");
            return false;
        }

        if (!form.startDate) {
            toast.error(isSinglePayment ? "Seleccioná la fecha de pago" : "Seleccioná la fecha de otorgamiento");
            return false;
        }

        const parsedStartDate = new Date(`${form.startDate}T00:00:00`);
        if (Number.isNaN(parsedStartDate.getTime())) {
            toast.error(isSinglePayment ? "La fecha de pago no es válida" : "La fecha de otorgamiento no es válida");
            return false;
        }

        if (isNewCredit && form.startDate < todayIso) {
            toast.error(isSinglePayment ? "En un crédito nuevo no podés elegir una fecha de pago pasada" : "En un crédito nuevo no podés elegir una fecha de otorgamiento pasada");
            return false;
        }

        if (!isSinglePayment) {
            if (!form.firstPaymentDate) {
                toast.error("Seleccioná la fecha del primer pago");
                return false;
            }

            const parsedFirstPaymentDate = new Date(`${form.firstPaymentDate}T00:00:00`);
            if (Number.isNaN(parsedFirstPaymentDate.getTime())) {
                toast.error("La fecha del primer pago no es válida");
                return false;
            }

            if (isNewCredit && form.firstPaymentDate < todayIso) {
                toast.error("En un crédito nuevo no podés elegir una fecha de primer pago pasada");
                return false;
            }
        }

        if (isSpecialCredit && !selectedCreditSpecial) {
            toast.error("Seleccioná o creá un grupo especial");
            return false;
        }

        if (isExistingCredit) {
            if (!existingCreditData.nextInstallmentToCharge.trim()) {
                toast.error("Indicá la próxima cuota a cobrar");
                return false;
            }

            const nextInstallmentValue = Number(existingCreditData.nextInstallmentToCharge);
            if (!Number.isInteger(nextInstallmentValue) || nextInstallmentValue < 1) {
                toast.error("La próxima cuota debe ser un número entero mayor o igual a 1");
                return false;
            }

            if (!cuotaEstimada) {
                toast.error("Completá monto, interés y cuotas para calcular lo ya cobrado");
                return false;
            }
        }

        return true;
    };

    const goToStep = (targetStep) => {
        if (targetStep === currentStep) return;

        if (targetStep > currentStep) {
            if (currentStep === 1 && !validateClientStep()) return;
            if (currentStep >= 2 && !validateConfigurationStep()) return;
        }

        setCurrentStep(targetStep);
    };

    const handleNextStep = () => {
        if (currentStep === 1 && !validateClientStep()) return;
        if (currentStep === 2 && !validateConfigurationStep()) return;
        if (currentStep === 3 && !validateConfigurationStep()) return;
        setCurrentStep((prev) => Math.min(prev + 1, CREDIT_STEPS.length));
    };

    const handlePreviousStep = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    return (
        <div className="max-w-4xl mx-auto p-4 flex flex-col gap-5 animate-fade-in">
            {/* ── HEADER ── */}
            <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--ios-label)] tracking-tight m-0">Nuevo crédito</h1>
                <p className="text-sm text-[var(--ios-label-ter)] mt-1 mb-0">Completá el crédito paso a paso. El resumen aparece al finalizar.</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px] gap-5 items-start">

                {/* ════════ MAIN COLUMN ════════ */}
                <div className="flex flex-col gap-4">

                    {/* ──────── STEP 1: CLIENTE ──────── */}
                    {currentStep === 1 && (
                        <div style={{ background: "#fff", borderRadius: "20px", border: "1.5px solid var(--ios-sep-opaque)", padding: "22px" }}>
                            <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ios-label-ter)", margin: "0 0 4px" }}>Paso 1</p>
                            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ios-label)", margin: "0 0 4px" }}>Seleccionar cliente</h2>
                            <p style={{ fontSize: "13px", color: "var(--ios-label-ter)", margin: 0 }}>Buscá por nombre, documento o teléfono.</p>

                            <div style={{ marginTop: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ios-label-sec)", textTransform: "uppercase", letterSpacing: "0.055em", display: "block", marginBottom: "6px" }}>Cliente</label>
                                    <div style={{ position: "relative" }}>
                                        <input type="text" value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Buscar por nombre, teléfono o DNI"
                                            style={{ height: "44px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)", fontSize: "15px", color: "var(--ios-label)", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box", transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s" }}
                                            onFocus={e => { e.target.style.borderColor = "var(--ios-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; e.target.style.background = "#fff"; }}
                                            onBlur={e => { e.target.style.borderColor = "var(--ios-sep-opaque)"; e.target.style.boxShadow = "none"; e.target.style.background = "var(--ios-fill)"; }} />
                                        {form.clienteId && (
                                            <button type="button" onClick={clearClientSelection}
                                                style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", padding: "4px 10px", borderRadius: "8px", border: "none", background: "var(--ios-sep-opaque)", color: "var(--ios-label-sec)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                                                Limpiar
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {shouldShowClientResults && (
                                    <div style={{ borderRadius: "14px", border: "1.5px solid var(--ios-sep-opaque)", background: "#fff", overflow: "hidden", maxHeight: "220px", overflowY: "auto" }}>
                                        {isLoadingClients ? (
                                            <p style={{ padding: "14px 16px", fontSize: "14px", color: "var(--ios-label-ter)" }}>Buscando clientes...</p>
                                        ) : clientsError ? (
                                            <p style={{ padding: "14px 16px", fontSize: "14px", color: "#FF3B30" }}>{clientsError}</p>
                                        ) : filteredClients.length ? (
                                            filteredClients.map(client => {
                                                const isActive = isClientActive(client);
                                                return (
                                                    <button key={client.id} type="button" onClick={() => handleClientSelect(client)}
                                                        style={{ width: "100%", display: "flex", flexDirection: "column", gap: "2px", textAlign: "left", padding: "12px 16px", borderBottom: "1px solid var(--ios-sep-opaque)", background: client.id === form.clienteId ? "#EBF3FF" : "transparent", cursor: isActive ? "pointer" : "not-allowed", opacity: isActive ? 1 : 0.55, border: "none" }}>
                                                        <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--ios-label)" }}>{client.name || "Sin nombre"}</span>
                                                        <span style={{ fontSize: "12px", color: "var(--ios-label-ter)" }}>DNI: {client.document || "—"} · Tel: {client.phone || client.alternatePhone || "—"}</span>
                                                        <span style={{ fontSize: "11px", fontWeight: 700, color: isActive ? "#1A6B36" : "#FF3B30" }}>{isActive ? "Activo" : "Inactivo"}</span>
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <p style={{ padding: "14px 16px", fontSize: "14px", color: "var(--ios-label-ter)" }}>
                                                {clientSearch.trim() ? "No se encontraron clientes" : "Escribí para buscar"}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {selectedClient && (
                                    <div style={{ borderRadius: "12px", background: "#EBF3FF", border: "1.5px solid #A8C8FF", padding: "12px 14px" }}>
                                        <p style={{ fontSize: "13px", color: "var(--ios-blue)", margin: 0 }}>Seleccionado: <strong>{selectedClient.name}</strong></p>
                                    </div>
                                )}

                                <button type="button" onClick={() => navigate("/clientes/nuevo")}
                                    style={{ alignSelf: "flex-start", background: "none", border: "none", color: "var(--ios-blue)", fontSize: "14px", fontWeight: 600, cursor: "pointer", padding: 0 }}>
                                    ＋ Crear nuevo cliente
                                </button>

                                <div style={{ borderTop: "1px solid var(--ios-sep-opaque)", paddingTop: "16px", display: "flex", justifyContent: "flex-end" }}>
                                    <button type="button" onClick={handleNextStep}
                                        style={{ padding: "12px 22px", borderRadius: "12px", border: "none", background: "var(--ios-blue)", color: "#fff", fontSize: "15px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,122,255,0.25)" }}>
                                        Continuar →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ──────── STEP 2: CONFIGURACIÓN ──────── */}
                    {currentStep === 2 && (
                        <div style={{ background: "#fff", borderRadius: "20px", border: "1.5px solid var(--ios-sep-opaque)", padding: "22px" }}>
                            <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ios-label-ter)", margin: "0 0 4px" }}>Paso 2</p>
                            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ios-label)", margin: "0 0 4px" }}>Configuración del crédito</h2>
                            <p style={{ fontSize: "13px", color: "var(--ios-label-ter)", margin: 0 }}>Definí plan, fechas, cuotas e importes.</p>

                            <div style={{ marginTop: "18px", display: "flex", flexDirection: "column", gap: "14px" }}>

                                {/* Modo */}
                                <div style={{ borderRadius: "14px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)", padding: "16px" }}>
                                    <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ios-label-ter)", margin: "0 0 10px" }}>¿El crédito es nuevo o ya estaba en curso?</p>
                                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                        {[["NEW", "Crédito nuevo"], ["EXISTING", "Crédito existente"]].map(([val, lbl]) => (
                                            <button key={val} type="button" onClick={() => setCreditMode(val)}
                                                style={{ flex: "1 1 140px", height: "44px", borderRadius: "12px", border: `1.5px solid ${creditMode === val ? "var(--ios-blue)" : "var(--ios-sep-opaque)"}`, background: creditMode === val ? "#EBF3FF" : "#fff", color: creditMode === val ? "var(--ios-blue)" : "var(--ios-label-sec)", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                                                {lbl}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Plan */}
                                <div style={{ borderRadius: "14px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)", padding: "16px" }}>
                                    <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ios-label-ter)", margin: "0 0 10px" }}>Tipo de cobro</p>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "8px" }}>
                                        {PLAN_OPTIONS.map(opt => (
                                            <button key={opt.value} type="button" onClick={() => setForm(prev => ({ ...prev, plan: opt.value }))}
                                                style={{ height: "44px", borderRadius: "12px", border: `1.5px solid ${form.plan === opt.value ? "var(--ios-blue)" : "var(--ios-sep-opaque)"}`, background: form.plan === opt.value ? "#EBF3FF" : "#fff", color: form.plan === opt.value ? "var(--ios-blue)" : "var(--ios-label-sec)", fontSize: "13px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", padding: "0 8px" }}>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Fechas */}
                                <div style={{ borderRadius: "14px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)", padding: "16px" }}>
                                    <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ios-label-ter)", margin: "0 0 12px" }}>Fechas del crédito</p>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                                        <div>
                                            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ios-label-sec)", textTransform: "uppercase", letterSpacing: "0.055em", display: "block", marginBottom: "6px" }}>{primaryDateLabel}</label>
                                            <input name="startDate" type="date" value={form.startDate} onChange={handleChange} min={isNewCredit ? todayIso : undefined}
                                                style={{ height: "44px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "#fff", fontSize: "15px", color: "var(--ios-label)", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }}
                                                onFocus={e => { e.target.style.borderColor = "var(--ios-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; }}
                                                onBlur={e => { e.target.style.borderColor = "var(--ios-sep-opaque)"; e.target.style.boxShadow = "none"; }} />
                                        </div>
                                        {!isSinglePayment && (
                                            <div>
                                                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ios-label-sec)", textTransform: "uppercase", letterSpacing: "0.055em", display: "block", marginBottom: "6px" }}>Fecha de primer pago</label>
                                                <input name="firstPaymentDate" type="date" value={form.firstPaymentDate} onChange={handleChange} min={isNewCredit ? todayIso : undefined}
                                                    style={{ height: "44px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "#fff", fontSize: "15px", color: "var(--ios-label)", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }}
                                                    onFocus={e => { e.target.style.borderColor = "var(--ios-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; }}
                                                    onBlur={e => { e.target.style.borderColor = "var(--ios-sep-opaque)"; e.target.style.boxShadow = "none"; }} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Grupo especial */}
                                <div style={{ borderRadius: "14px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)", padding: "16px" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div>
                                            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--ios-label)", margin: "0 0 2px" }}>Grupo especial</p>
                                            <p style={{ fontSize: "12px", color: "var(--ios-label-ter)", margin: 0 }}>Agrupá este crédito en una categoría especial.</p>
                                        </div>
                                        <button type="button" onClick={handleToggleSpecialCredit}
                                            style={{ padding: "8px 16px", borderRadius: "99px", border: "none", background: isSpecialCredit ? "var(--ios-blue)" : "var(--ios-sep-opaque)", color: isSpecialCredit ? "#fff" : "var(--ios-label-sec)", fontSize: "13px", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                                            {isSpecialCredit ? "Activado" : "Activar"}
                                        </button>
                                    </div>
                                    {isSpecialCredit && (
                                        <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                                            <div style={{ position: "relative" }}>
                                                <input type="text" value={creditSpecialSearch} onChange={e => setCreditSpecialSearch(e.target.value)} placeholder="Buscar por nombre"
                                                    style={{ height: "44px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "#fff", fontSize: "15px", color: "var(--ios-label)", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }}
                                                    onFocus={e => { e.target.style.borderColor = "var(--ios-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; }}
                                                    onBlur={e => { e.target.style.borderColor = "var(--ios-sep-opaque)"; e.target.style.boxShadow = "none"; }} />
                                                {selectedCreditSpecial && (
                                                    <button type="button" onClick={handleClearCreditSpecial}
                                                        style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", padding: "4px 10px", borderRadius: "8px", border: "none", background: "#EBF3FF", color: "var(--ios-blue)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                                                        Quitar
                                                    </button>
                                                )}
                                            </div>
                                            {selectedCreditSpecial && <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--ios-blue)", margin: 0 }}>Seleccionado: {selectedCreditSpecial.name}</p>}
                                            {!selectedCreditSpecial && (
                                                <div style={{ borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "#fff", maxHeight: "180px", overflowY: "auto" }}>
                                                    {isLoadingCreditSpecials ? <p style={{ padding: "12px 14px", fontSize: "13px", color: "var(--ios-label-ter)" }}>Buscando...</p>
                                                        : creditSpecialError ? <p style={{ padding: "12px 14px", fontSize: "13px", color: "#FF3B30" }}>{creditSpecialError}</p>
                                                            : creditSpecialOptions.length ? creditSpecialOptions.map(item => (
                                                                <button key={item.id} type="button" onClick={() => handleSelectCreditSpecial(item)}
                                                                    style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid var(--ios-sep-opaque)", fontSize: "14px", fontWeight: 600, color: "var(--ios-label)", cursor: "pointer", textAlign: "left" }}>
                                                                    <span>{item.name}</span>
                                                                    {typeof item?._count?.credits === "number" && <span style={{ fontSize: "12px", color: "var(--ios-label-ter)" }}>{item._count.credits} créditos</span>}
                                                                </button>
                                                            )) : <p style={{ padding: "12px 14px", fontSize: "13px", color: "var(--ios-label-ter)" }}>{creditSpecialSearch.trim() ? `No encontramos "${creditSpecialSearch.trim()}". Podés crearlo.` : "Escribí para buscar grupos."}</p>
                                                    }
                                                </div>
                                            )}
                                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                                <button type="button" onClick={handleCreateCreditSpecial} disabled={isCreatingCreditSpecial || !creditSpecialSearch.trim()}
                                                    style={{ padding: "10px 18px", borderRadius: "10px", border: "none", background: "var(--ios-blue)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", opacity: (isCreatingCreditSpecial || !creditSpecialSearch.trim()) ? 0.5 : 1 }}>
                                                    {isCreatingCreditSpecial ? "Creando..." : "Crear grupo especial"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Importes */}
                                <div style={{ borderRadius: "14px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)", padding: "16px" }}>
                                    <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ios-label-ter)", margin: "0 0 12px" }}>Importes y cuotas</p>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
                                        {[
                                            { lbl: "Monto base", name: "monto", step: "100", placeholder: "Ej: 100000" },
                                            { lbl: "Interés (%)", name: "interes", step: "1", placeholder: "Ej: 150" },
                                        ].map(f => (
                                            <div key={f.name}>
                                                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ios-label-sec)", textTransform: "uppercase", letterSpacing: "0.055em", display: "block", marginBottom: "6px" }}>{f.lbl}</label>
                                                <input name={f.name} type="number" min={0} step={f.step} value={form[f.name]} onChange={handleChange} placeholder={f.placeholder}
                                                    style={{ height: "44px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "#fff", fontSize: "15px", color: "var(--ios-label)", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }}
                                                    onFocus={e => { e.target.style.borderColor = "var(--ios-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; }}
                                                    onBlur={e => { e.target.style.borderColor = "var(--ios-sep-opaque)"; e.target.style.boxShadow = "none"; }} />
                                            </div>
                                        ))}
                                        <div>
                                            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ios-label-sec)", textTransform: "uppercase", letterSpacing: "0.055em", display: "block", marginBottom: "6px" }}>Cuotas</label>
                                            <input name="cuotas" type="number" min={minimumInstallments} step="1" value={form.cuotas} onChange={handleChange} placeholder={isSinglePayment ? "1" : "Ej: 10"} disabled={isSinglePayment}
                                                style={{ height: "44px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "#fff", fontSize: "15px", color: "var(--ios-label)", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box", opacity: isSinglePayment ? 0.5 : 1 }}
                                                onFocus={e => { e.target.style.borderColor = "var(--ios-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; }}
                                                onBlur={e => { e.target.style.borderColor = "var(--ios-sep-opaque)"; e.target.style.boxShadow = "none"; }} />
                                        </div>
                                    </div>

                                    <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ios-label-ter)", margin: "16px 0 12px" }}>Responsables</p>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
                                        {[
                                            { lbl: "Cobrador asignado", name: "cobradorId" },
                                            { lbl: "Cobrador comisión", name: "cobradorComisionId" },
                                        ].map(f => (
                                            <div key={f.name}>
                                                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ios-label-sec)", textTransform: "uppercase", letterSpacing: "0.055em", display: "block", marginBottom: "6px" }}>{f.lbl}</label>
                                                <select name={f.name} value={form[f.name]} onChange={handleChange}
                                                    style={{ height: "44px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "#fff", fontSize: "15px", color: "var(--ios-label)", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box", WebkitAppearance: "none", appearance: "none" }}
                                                    onFocus={e => { e.target.style.borderColor = "var(--ios-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; }}
                                                    onBlur={e => { e.target.style.borderColor = "var(--ios-sep-opaque)"; e.target.style.boxShadow = "none"; }}>
                                                    <option value="">Sin cobrador</option>
                                                    {cobradores.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                                </select>
                                            </div>
                                        ))}
                                        <div>
                                            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ios-label-sec)", textTransform: "uppercase", letterSpacing: "0.055em", display: "block", marginBottom: "6px" }}>Comisión libre ($)</label>
                                            <input name="comisionLibre" type="number" min={0} step="100" value={form.comisionLibre} onChange={handleChange} placeholder="Ej: 2000"
                                                style={{ height: "44px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "#fff", fontSize: "15px", color: "var(--ios-label)", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }}
                                                onFocus={e => { e.target.style.borderColor = "var(--ios-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; }}
                                                onBlur={e => { e.target.style.borderColor = "var(--ios-sep-opaque)"; e.target.style.boxShadow = "none"; }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Crédito existente */}
                                {isExistingCredit && (
                                    <div style={{ borderRadius: "14px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)", padding: "16px" }}>
                                        <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ios-label-ter)", margin: "0 0 12px" }}>Estado del crédito existente</p>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                            <div>
                                                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ios-label-sec)", textTransform: "uppercase", letterSpacing: "0.055em", display: "block", marginBottom: "6px" }}>Monto ya cobrado (calculado)</label>
                                                <div style={{ height: "44px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "#fff", display: "flex", alignItems: "center", padding: "0 14px", fontSize: "15px", fontWeight: 700, color: "var(--ios-label)" }}>
                                                    {computedReceivedAmountLabel}
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ios-label-sec)", textTransform: "uppercase", letterSpacing: "0.055em", display: "block", marginBottom: "6px" }}>Próxima cuota a cobrar</label>
                                                <input name="nextInstallmentToCharge" type="number" min={1} step="1" value={existingCreditData.nextInstallmentToCharge} onChange={handleExistingCreditChange} placeholder="Ej: 3"
                                                    style={{ height: "44px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "#fff", fontSize: "15px", color: "var(--ios-label)", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }}
                                                    onFocus={e => { e.target.style.borderColor = "var(--ios-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; }}
                                                    onBlur={e => { e.target.style.borderColor = "var(--ios-sep-opaque)"; e.target.style.boxShadow = "none"; }} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", paddingTop: "4px" }}>
                                    <button type="button" onClick={handlePreviousStep} style={{ padding: "11px 20px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)", color: "var(--ios-label)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>← Volver</button>
                                    <button type="button" onClick={handleNextStep} style={{ padding: "12px 22px", borderRadius: "12px", border: "none", background: "var(--ios-blue)", color: "#fff", fontSize: "15px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,122,255,0.25)" }}>Continuar con gastos →</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ──────── STEP 3: GASTOS ──────── */}
                    {currentStep === 3 && (
                        <div style={{ background: "#fff", borderRadius: "20px", border: "1.5px solid var(--ios-sep-opaque)", padding: "22px" }}>
                            <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ios-label-ter)", margin: "0 0 4px" }}>Paso 3</p>
                            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ios-label)", margin: "0 0 4px" }}>Gastos asociados</h2>
                            <p style={{ fontSize: "13px", color: "var(--ios-label-ter)", margin: 0 }}>Registrá fletes u otros gastos vinculados a este crédito.</p>

                            <div style={{ marginTop: "18px", display: "flex", flexDirection: "column", gap: "14px" }}>
                                <div style={{ borderRadius: "14px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: "12px", alignItems: "end" }}>
                                        <div>
                                            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ios-label-sec)", textTransform: "uppercase", letterSpacing: "0.055em", display: "block", marginBottom: "6px" }}>Gasto</label>
                                            <div style={{ position: "relative" }}>
                                                <input type="text" value={expenseSearch} onChange={handleExpenseSearchChange} placeholder="Ej: Heladera, Flete, Tecnología"
                                                    style={{ height: "44px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "#fff", fontSize: "15px", color: "var(--ios-label)", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }}
                                                    onFocus={e => { e.target.style.borderColor = "var(--ios-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; }}
                                                    onBlur={e => { e.target.style.borderColor = "var(--ios-sep-opaque)"; e.target.style.boxShadow = "none"; }} />
                                                {selectedSpecialCredit && (
                                                    <button type="button" onClick={handleClearSelectedSpecialCredit}
                                                        style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", padding: "4px 10px", borderRadius: "8px", border: "none", background: "#EBF3FF", color: "var(--ios-blue)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                                                        Cambiar
                                                    </button>
                                                )}
                                            </div>
                                            {selectedSpecialCredit && <p style={{ fontSize: "12px", color: "var(--ios-blue)", margin: "4px 0 0", fontWeight: 600 }}>Usando: {selectedSpecialCredit.name}</p>}
                                        </div>
                                        <div>
                                            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ios-label-sec)", textTransform: "uppercase", letterSpacing: "0.055em", display: "block", marginBottom: "6px" }}>Monto (ARS)</label>
                                            <input type="number" min={0} step="100" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)}
                                                style={{ height: "44px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "#fff", fontSize: "15px", color: "var(--ios-label)", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }}
                                                onFocus={e => { e.target.style.borderColor = "var(--ios-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; }}
                                                onBlur={e => { e.target.style.borderColor = "var(--ios-sep-opaque)"; e.target.style.boxShadow = "none"; }} />
                                        </div>
                                    </div>

                                    {shouldShowSpecialCreditResults && (
                                        <div style={{ borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "#fff", maxHeight: "180px", overflowY: "auto" }}>
                                            {isLoadingSpecialCredits ? <p style={{ padding: "12px 14px", fontSize: "13px", color: "var(--ios-label-ter)" }}>Buscando gastos...</p>
                                                : specialCreditsError ? <p style={{ padding: "12px 14px", fontSize: "13px", color: "#FF3B30" }}>{specialCreditsError}</p>
                                                    : specialCreditOptions.length ? specialCreditOptions.map(item => (
                                                        <button key={item.id} type="button" onClick={() => handleSelectSpecialCredit(item)}
                                                            style={{ width: "100%", display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid var(--ios-sep-opaque)", fontSize: "14px", fontWeight: 600, color: "var(--ios-label)", cursor: "pointer", textAlign: "left" }}>
                                                            <span>{item.name}</span>
                                                            {typeof item?._count?.expenses === "number" && <span style={{ fontSize: "12px", color: "var(--ios-label-ter)" }}>{item._count.expenses} usos</span>}
                                                        </button>
                                                    )) : <p style={{ padding: "12px 14px", fontSize: "13px", color: "var(--ios-label-ter)" }}>No encontramos "{normalizedExpenseSearch}". Se creará al agregarlo.</p>
                                            }
                                        </div>
                                    )}

                                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                        <button type="button" onClick={handleAddExpense} disabled={!canAddExpense || isSavingExpense}
                                            style={{ padding: "11px 20px", borderRadius: "12px", border: "none", background: "#34C759", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(52,199,89,0.25)", opacity: (!canAddExpense || isSavingExpense) ? 0.5 : 1 }}>
                                            {isSavingExpense ? "Agregando..." : selectedSpecialCredit ? "Agregar gasto" : "Crear y agregar gasto"}
                                        </button>
                                    </div>
                                </div>

                                {expenses.length ? (
                                    <div style={{ borderRadius: "14px", border: "1.5px solid var(--ios-sep-opaque)", overflow: "hidden" }}>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", padding: "10px 14px", background: "var(--ios-fill)", borderBottom: "1px solid var(--ios-sep-opaque)" }}>
                                            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-ter)" }}>Gasto</span>
                                            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-ter)", marginRight: "60px" }}>Monto</span>
                                        </div>
                                        {expenses.map(expense => (
                                            <div key={expense.tempId} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", padding: "12px 14px", borderBottom: "1px solid var(--ios-sep-opaque)", background: "#fff" }}>
                                                <div>
                                                    <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--ios-label)", margin: 0 }}>{expense.description}</p>
                                                    {expense.specialCreditName && <p style={{ fontSize: "12px", color: "var(--ios-label-ter)", margin: "2px 0 0" }}>Tipo: {expense.specialCreditName}</p>}
                                                </div>
                                                <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--ios-label)", marginRight: "14px" }}>{currencyFormatter.format(expense.amount)}</span>
                                                <button type="button" onClick={() => handleRemoveExpense(expense.tempId)}
                                                    style={{ padding: "6px 12px", borderRadius: "8px", border: "none", background: "#FFF0EE", color: "#FF3B30", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                                                    Quitar
                                                </button>
                                            </div>
                                        ))}
                                        <div style={{ padding: "10px 14px", background: "var(--ios-fill)", display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--ios-label-sec)" }}>Total gastos</span>
                                            <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--ios-label)" }}>{currencyFormatter.format(totalExpenses)}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ borderRadius: "14px", border: "1.5px dashed var(--ios-sep-opaque)", padding: "24px", textAlign: "center", color: "var(--ios-label-ter)", fontSize: "14px" }}>
                                        No hay gastos cargados. Podés continuar sin gastos.
                                    </div>
                                )}

                                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                                    <button type="button" onClick={handlePreviousStep} style={{ padding: "11px 20px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)", color: "var(--ios-label)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>← Volver</button>
                                    <button type="button" onClick={handleNextStep} style={{ padding: "12px 22px", borderRadius: "12px", border: "none", background: "var(--ios-blue)", color: "#fff", fontSize: "15px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,122,255,0.25)" }}>Revisar y confirmar →</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ──────── STEP 4: CONFIRMACIÓN ──────── */}
                    {currentStep === 4 && (
                        <div style={{ background: "#fff", borderRadius: "20px", border: "1.5px solid var(--ios-sep-opaque)", padding: "22px" }}>
                            <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ios-label-ter)", margin: "0 0 4px" }}>Paso 4</p>
                            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ios-label)", margin: "0 0 4px" }}>Confirmación final</h2>
                            <p style={{ fontSize: "13px", color: "var(--ios-label-ter)", margin: 0 }}>Revisá todo antes de crear el crédito.</p>

                            <div style={{ marginTop: "18px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
                                <div style={{ borderRadius: "14px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)", padding: "16px" }}>
                                    <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-ter)", margin: "0 0 10px" }}>Datos principales</p>
                                    {[
                                        { l: "Cliente", v: selectedClient?.name || "—" },
                                        { l: "Plan", v: selectedPlan.label },
                                        { l: "Modalidad", v: creditMode === "NEW" ? "Crédito nuevo" : "Crédito existente" },
                                        { l: primaryDateLabel, v: form.startDate ? new Date(`${form.startDate}T00:00:00`).toLocaleDateString("es-AR") : "—" },
                                        ...(!isSinglePayment ? [{ l: "Primer pago", v: form.firstPaymentDate ? new Date(`${form.firstPaymentDate}T00:00:00`).toLocaleDateString("es-AR") : "—" }] : []),
                                        { l: "Vencimiento estimado", v: estimatedDueDate ? new Date(`${estimatedDueDate}T00:00:00`).toLocaleDateString("es-AR") : "—" },
                                    ].map(row => (
                                        <div key={row.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--ios-sep-opaque)" }}>
                                            <span style={{ fontSize: "13px", color: "var(--ios-label-sec)" }}>{row.l}</span>
                                            <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--ios-label)" }}>{row.v}</span>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ borderRadius: "14px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)", padding: "16px" }}>
                                    <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ios-label-ter)", margin: "0 0 10px" }}>Montos</p>
                                    {[
                                        { l: "Monto base", v: montoBase ? currencyFormatter.format(montoBase) : "—" },
                                        { l: "Total del crédito", v: totalCredito ? currencyFormatter.format(totalCredito) : "—" },
                                        { l: "Cuotas", v: cuotasNumber || "—" },
                                        { l: "Cuota estimada", v: cuotaEstimada > 0 ? currencyFormatter.format(cuotaEstimada) : "—" },
                                        { l: "Gastos asociados", v: expenses.length ? `${expenses.length} · ${currencyFormatter.format(totalExpenses)}` : "Sin gastos" },
                                        ...(isExistingCredit ? [
                                            { l: "Ya cobrado", v: computedReceivedAmountLabel },
                                            { l: "Próxima cuota", v: existingCreditData.nextInstallmentToCharge !== "" ? `Cuota ${nextInstallmentNumber}` : "—" },
                                        ] : []),
                                    ].map(row => (
                                        <div key={row.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--ios-sep-opaque)" }}>
                                            <span style={{ fontSize: "13px", color: "var(--ios-label-sec)" }}>{row.l}</span>
                                            <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--ios-label)" }}>{row.v}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--ios-sep-opaque)", flexWrap: "wrap" }}>
                                <button type="button" onClick={handlePreviousStep} style={{ padding: "11px 20px", borderRadius: "12px", border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)", color: "var(--ios-label)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>← Volver</button>
                                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                    <button type="button" onClick={generarContrato} style={{ padding: "12px 20px", borderRadius: "12px", border: "none", background: "#34C759", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(52,199,89,0.25)" }}>
                                        Generar contrato PDF
                                    </button>
                                    <button type="submit" disabled={isSubmitting} style={{ padding: "12px 22px", borderRadius: "12px", border: "none", background: "var(--ios-blue)", color: "#fff", fontSize: "15px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,122,255,0.25)", opacity: isSubmitting ? 0.6 : 1 }}>
                                        {isSubmitting ? "Creando..." : "Confirmar y crear"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ════════ SIDEBAR ════════ */}
                <aside className="flex flex-col gap-3 sticky top-5 mt-6 md:mt-0">
                    {/* Progreso */}
                    <div className="bg-white rounded-2xl border border-[var(--ios-sep-opaque)] p-4">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-sm font-bold text-[var(--ios-label)] m-0">Progreso</p>
                            <span className="px-3 py-1 rounded-full bg-[#EBF3FF] border border-[#A8C8FF] text-xs font-bold text-[var(--ios-blue)]">{selectedPlan.label}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            {CREDIT_STEPS.map(step => {
                                const isCompleted = step.id < currentStep;
                                const isActive = step.id === currentStep;
                                return (
                                    <div key={step.id} className={`rounded-xl p-3 flex justify-between items-center border ${isActive ? "border-[var(--ios-blue)] bg-[#EBF3FF]" : isCompleted ? "border-[#34C75950] bg-[#E8F8ED]" : "border-[var(--ios-sep-opaque)] bg-[var(--ios-fill)]"}`}>
                                        <div>
                                            <p className={`text-[10px] font-bold uppercase tracking-wide m-0 ${isActive ? "text-[var(--ios-blue)]" : isCompleted ? "text-[#1A6B36]" : "text-[var(--ios-label-ter)]"}`}>{step.eyebrow}</p>
                                            <p className={`text-[13px] font-bold m-0 ${isActive ? "text-[var(--ios-blue)]" : isCompleted ? "text-[#1A6B36]" : "text-[var(--ios-label-sec)]"}`}>{step.title}</p>
                                        </div>
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${isActive ? "bg-[var(--ios-blue)] text-white" : isCompleted ? "bg-[#34C759] text-white" : "bg-[var(--ios-sep-opaque)] text-[var(--ios-label-ter)]"}`}>{isCompleted ? "✓" : step.id}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {/* Detalle montos */}
                    <div className="bg-white rounded-2xl border border-[var(--ios-sep-opaque)] p-4">
                        <p className="text-sm font-bold text-[var(--ios-label)] mb-2">Detalle de montos</p>
                        {[
                            { l: "Total crédito", v: totalCredito ? currencyFormatter.format(totalCredito) : "—", bold: true },
                            { l: "Ganancia", v: montoBase > 0 ? currencyFormatter.format(gananciaCredito) : "—" },
                            { l: "Cuota estimada", v: cuotaEstimada > 0 ? currencyFormatter.format(cuotaEstimada) : "—" },
                            { l: "Total neto", v: totalCredito > 0 ? currencyFormatter.format(totalNetoDespuesComision) : "—", green: true },
                            { l: "Comisión vendedor", v: currencyFormatter.format(comisionLibre || 0), small: true },
                        ].map(row => (
                            <div key={row.l} className="flex justify-between items-center py-2 border-b border-[var(--ios-sep-opaque)] last:border-b-0">
                                <span className={`${row.small ? "text-xs" : "text-[13px]"} ${row.small ? "text-[var(--ios-label-ter)]" : "text-[var(--ios-label-sec)]"}`}>{row.l}</span>
                                <span className={`${row.bold ? "text-lg font-extrabold" : "text-[13px] font-bold"} ${row.green ? "text-[#1A6B36]" : "text-[var(--ios-label)]"}`}>{row.v}</span>
                            </div>
                        ))}
                    </div>
                    {currentStep < 4 && (
                        <div className="rounded-xl border border-dashed border-[var(--ios-sep-opaque)] p-3 text-[13px] text-[var(--ios-label-ter)] text-center">
                            Terminá los pasos para ver el resumen y confirmar.
                        </div>
                    )}
                </aside>
            </form>
        </div>
    );
}

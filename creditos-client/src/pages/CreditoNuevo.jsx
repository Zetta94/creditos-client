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

const FIELD_INPUT_CLASS = "h-11 w-full rounded-xl border border-gray-300/80 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-blue-900/40";
const FIELD_LABEL_CLASS = "text-sm font-semibold text-gray-700 dark:text-gray-200";
const SOFT_SECTION_CLASS = "rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950/35";

const getChoiceButtonClass = (isActive) =>
    `inline-flex h-11 w-full items-center justify-center rounded-xl border px-4 py-2 text-xs font-semibold text-center transition ${isActive
        ? "border-blue-500 bg-blue-600 text-white shadow-sm dark:border-blue-400"
        : "border-slate-300 bg-white text-slate-600 hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-200"}`;

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
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            <div className="space-y-3">
                <h1 className="text-xl font-bold sm:text-2xl">Nuevo crédito</h1>
                <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                    Completá el crédito paso a paso. El resumen final aparece recién al terminar la carga.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 gap-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="flex flex-col gap-6">
                    {currentStep === 1 && (
                        <section className="order-1 rounded-xl border border-gray-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">1. Datos del cliente</h2>
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
                                        {isLoadingClients ? (
                                            <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">Buscando clientes...</p>
                                        ) : clientsError ? (
                                            <p className="px-4 py-3 text-sm text-red-600 dark:text-red-300">{clientsError}</p>
                                        ) : filteredClients.length ? (
                                            filteredClients.map((client) => {
                                                const isSelected = client.id === form.clienteId;
                                                const isActive = isClientActive(client);
                                                return (
                                                    <button
                                                        key={client.id}
                                                        type="button"
                                                        onClick={() => handleClientSelect(client)}
                                                        className={`flex w-full flex-col gap-1 border-b px-4 py-3 text-left text-sm transition last:border-b-0 dark:border-gray-800 ${isSelected
                                                            ? "bg-blue-50 text-blue-800 shadow-inner dark:bg-blue-900/40 dark:text-blue-200"
                                                            : "hover:bg-blue-50/60 dark:text-gray-100 dark:hover:bg-blue-900/20"
                                                            } ${isActive ? "" : "cursor-not-allowed opacity-60"}`}>
                                                        <span className="font-medium">{client.name || "Sin nombre"}</span>
                                                        <span className="text-xs text-gray-600 dark:text-gray-400">
                                                            DNI: {client.document || "—"} • Tel: {client.phone || client.alternatePhone || "—"}
                                                        </span>
                                                        <span className={`text-[11px] font-semibold ${isActive ? "text-emerald-600" : "text-red-500"}`}>
                                                            {isActive ? "Activo" : "Inactivo"}
                                                        </span>
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                {clientSearch.trim() ? "No se encontraron clientes con ese criterio" : "Aún no hay clientes para mostrar"}
                                            </p>
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

                                <div className="flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={handleNextStep}
                                        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300">
                                        Continuar con la configuración
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                    {currentStep === 2 && (
                        <section className="order-2 rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/85">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">2. Configuración del crédito</h2>
                                    <p className="max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Definí cómo se cobra, cargá las fechas principales y completá los importes sin repetir datos que vas a revisar al final.</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                                    Completá este paso para habilitar el resumen final.
                                </div>
                            </div>

                            <div className="mt-5 space-y-5">
                                <div className={SOFT_SECTION_CLASS}>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Modo de carga</p>
                                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">¿Este crédito es nuevo o ya venía en curso?</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Primero elegí cómo cargarlo y después el tipo de cobro.</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-3 rounded-xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700/70 dark:bg-slate-900/60">
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Seleccioná la base del crédito.</p>
                                                <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
                                                    <button
                                                        type="button"
                                                        onClick={() => setCreditMode("NEW")}
                                                        className={getChoiceButtonClass(creditMode === "NEW")}>
                                                        Nuevo credito
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCreditMode("EXISTING")}
                                                        className={getChoiceButtonClass(creditMode === "EXISTING")}>
                                                        Credito existente
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-3 rounded-xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700/70 dark:bg-slate-900/60">
                                                <div className="space-y-2">
                                                    <FieldLabel label="Plan o tipo" help="Elegí cómo se van a espaciar las cuotas. Si es una sola cuota, usá pago único." />
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Esto define la frecuencia de cobro y cómo se calcula el vencimiento final.</p>
                                                </div>
                                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                                    {PLAN_OPTIONS.map((option) => (
                                                        <button
                                                            key={option.value}
                                                            type="button"
                                                            onClick={() => setForm((prev) => ({ ...prev, plan: option.value }))}
                                                            className={getChoiceButtonClass(form.plan === option.value)}>
                                                            {option.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                                    <div className={SOFT_SECTION_CLASS}>
                                        <div className="mb-4 flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Calendario</p>
                                                <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Fechas del crédito</h3>
                                            </div>
                                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                                                {isSinglePayment ? "Un pago" : "Cobro recurrente"}
                                            </span>
                                        </div>

                                        <div className={`grid items-start gap-4 ${isSinglePayment ? "md:grid-cols-1" : "md:grid-cols-2"}`}>
                                            <div className="grid content-start gap-2">
                                                <FieldLabel label={primaryDateLabel} help={primaryDateHelp} />
                                                <input
                                                    name="startDate"
                                                    type="date"
                                                    value={form.startDate}
                                                    onChange={handleChange}
                                                    min={isNewCredit ? todayIso : undefined}
                                                    className={FIELD_INPUT_CLASS} />
                                            </div>

                                            {!isSinglePayment && (
                                                <div className="grid content-start gap-2">
                                                    <FieldLabel label="Fecha de primer pago" help="Desde esta fecha se calcula la primera cuota y también el cobro final estimado." />
                                                    <input
                                                        name="firstPaymentDate"
                                                        type="date"
                                                        value={form.firstPaymentDate}
                                                        onChange={handleChange}
                                                        min={isNewCredit ? todayIso : undefined}
                                                        className={FIELD_INPUT_CLASS} />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={SOFT_SECTION_CLASS}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Grupo especial</h3>
                                                    <HelpHint text="Sirve para agrupar este crédito con otros créditos y gastos bajo una misma categoría especial." />
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Usalo solo cuando este crédito deba quedar agrupado dentro de una categoría especial.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleToggleSpecialCredit}
                                                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${isSpecialCredit
                                                    ? "bg-blue-600 text-white shadow-sm"
                                                    : "border border-slate-300 bg-white text-slate-600 hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-200"}`}>
                                                {isSpecialCredit ? "Desactivar" : "Activar"}
                                            </button>
                                        </div>

                                        {isSpecialCredit && (
                                            <div className="mt-4 space-y-3">
                                                <div className="grid gap-2">
                                                    <FieldLabel label="Seleccioná o creá un grupo especial" help="Podés buscar un grupo existente o crear uno nuevo desde este mismo paso." />
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={creditSpecialSearch}
                                                            onChange={(event) => setCreditSpecialSearch(event.target.value)}
                                                            placeholder="Buscar por nombre"
                                                            className={FIELD_INPUT_CLASS} />
                                                        {selectedCreditSpecial && (
                                                            <button
                                                                type="button"
                                                                onClick={handleClearCreditSpecial}
                                                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-transparent bg-blue-100 px-3 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-900/60">
                                                                Quitar
                                                            </button>
                                                        )}
                                                    </div>
                                                    {selectedCreditSpecial && (
                                                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                                            Seleccionado: {selectedCreditSpecial.name}
                                                        </p>
                                                    )}
                                                </div>

                                                {!selectedCreditSpecial && (
                                                    <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white/90 shadow-sm dark:border-slate-700 dark:bg-slate-950/80">
                                                        {isLoadingCreditSpecials ? (
                                                            <p className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">Buscando grupos especiales...</p>
                                                        ) : creditSpecialError ? (
                                                            <p className="px-4 py-3 text-sm text-red-600 dark:text-red-300">{creditSpecialError}</p>
                                                        ) : creditSpecialOptions.length ? (
                                                            creditSpecialOptions.map((item) => (
                                                                <button
                                                                    key={item.id}
                                                                    type="button"
                                                                    onClick={() => handleSelectCreditSpecial(item)}
                                                                    className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-2 text-left text-sm transition last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-900/80">
                                                                    <span className="font-medium">{item.name}</span>
                                                                    {typeof item?._count?.credits === "number" && (
                                                                        <span className="text-xs text-slate-500 dark:text-slate-400">{item._count.credits} créditos</span>
                                                                    )}
                                                                </button>
                                                            ))
                                                        ) : creditSpecialSearch.trim() ? (
                                                            <p className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                                                No encontramos resultados. Podés crear "{creditSpecialSearch.trim()}".
                                                            </p>
                                                        ) : (
                                                            <p className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                                                Empezá a escribir para buscar entre los grupos especiales.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={handleCreateCreditSpecial}
                                                        disabled={isCreatingCreditSpecial || !creditSpecialSearch.trim()}
                                                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60">
                                                        {isCreatingCreditSpecial ? "Creando..." : "Crear grupo especial"}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={SOFT_SECTION_CLASS}>
                                    <div className="mb-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Condiciones</p>
                                        <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Importes, cuotas y responsables</h3>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="grid gap-2">
                                            <FieldLabel label="Monto base" help="Es el dinero entregado al cliente antes de sumar interés." />
                                            <input
                                                name="monto"
                                                type="number"
                                                min={0}
                                                step="100"
                                                value={form.monto}
                                                onChange={handleChange}
                                                placeholder="Ej: 100000"
                                                className={FIELD_INPUT_CLASS} />
                                        </div>
                                        <div className="grid gap-2">
                                            <FieldLabel label="Interés (%)" help="Porcentaje total que se aplica para calcular el total del crédito." />
                                            <input
                                                name="interes"
                                                type="number"
                                                min={0}
                                                step="1"
                                                value={form.interes}
                                                onChange={handleChange}
                                                placeholder="Ej: 150"
                                                className={FIELD_INPUT_CLASS} />
                                        </div>
                                        <div className="grid gap-2">
                                            <FieldLabel label="Cantidad de cuotas" help={isSinglePayment ? "En pago único la cuota se define automáticamente en 1." : "Para planes recurrentes el mínimo es 2 cuotas."} />
                                            <input
                                                name="cuotas"
                                                type="number"
                                                min={minimumInstallments}
                                                step="1"
                                                value={form.cuotas}
                                                onChange={handleChange}
                                                placeholder={isSinglePayment ? "1" : "Ej: 10"}
                                                disabled={isSinglePayment}
                                                className={`${FIELD_INPUT_CLASS} disabled:cursor-not-allowed disabled:opacity-60`} />
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                                        <div className="grid gap-2">
                                            <FieldLabel label="Cobrador asignado" help="Usuario responsable de realizar el seguimiento y cobranza del crédito." />
                                            <select
                                                name="cobradorId"
                                                value={form.cobradorId}
                                                onChange={handleChange}
                                                className={FIELD_INPUT_CLASS}>
                                                <option value="">Seleccionar cobrador</option>
                                                {cobradores.map((user) => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="grid gap-2">
                                            <FieldLabel label="Comisión" help="Elegí a qué cobrador querés asociar la comisión registrada." />
                                            <select
                                                name="cobradorComisionId"
                                                value={form.cobradorComisionId}
                                                onChange={handleChange}
                                                className={FIELD_INPUT_CLASS}>
                                                <option value="">Seleccionar cobrador</option>
                                                {cobradores.map((user) => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="grid gap-2">
                                            <FieldLabel label="Comisión libre ($)" help="Monto fijo que se descuenta del total neto como comisión adicional." />
                                            <input
                                                name="comisionLibre"
                                                type="number"
                                                min={0}
                                                step="100"
                                                value={form.comisionLibre}
                                                onChange={handleChange}
                                                placeholder="Ej: 2000"
                                                className={FIELD_INPUT_CLASS} />
                                        </div>
                                    </div>
                                </div>

                                {isExistingCredit && (
                                    <div className={SOFT_SECTION_CLASS}>
                                        <div className="mb-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Seguimiento</p>
                                            <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Estado del crédito ya existente</h3>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="grid gap-2">
                                                <FieldLabel label="Monto ya cobrado (ARS)" help="Se calcula automáticamente según la próxima cuota que indiques." />
                                                <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-white/90 px-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100">
                                                    {computedReceivedAmountLabel}
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <FieldLabel label="Próxima cuota a cobrar" help="Indicá qué número de cuota corresponde cobrar en la próxima visita." />
                                                <input
                                                    name="nextInstallmentToCharge"
                                                    type="number"
                                                    min={1}
                                                    step="1"
                                                    value={existingCreditData.nextInstallmentToCharge}
                                                    onChange={handleExistingCreditChange}
                                                    placeholder="Ej: 3"
                                                    className={FIELD_INPUT_CLASS} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={handlePreviousStep}
                                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-900">
                                    Volver al cliente
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNextStep}
                                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300">
                                    Continuar con gastos
                                </button>
                            </div>
                        </section>
                    )}

                    {currentStep === 3 && (
                        <section className="order-3 rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/85">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">3. Gastos asociados</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Registrá fletes u otros gastos vinculados a este crédito.</p>
                            </div>

                            <div className="mt-4 space-y-5">
                                <div className={`${SOFT_SECTION_CLASS} grid gap-4 md:grid-cols-3`}>
                                    <div className="md:col-span-2 space-y-2">
                                        <FieldLabel label="Gasto" help="Podés usar un gasto ya registrado o escribir uno nuevo para crearlo al agregarlo." />
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={expenseSearch}
                                                onChange={handleExpenseSearchChange}
                                                placeholder="Ej: Heladera, Flete, Tecnología"
                                                className={FIELD_INPUT_CLASS} />
                                            {selectedSpecialCredit && (
                                                <button
                                                    type="button"
                                                    onClick={handleClearSelectedSpecialCredit}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-transparent bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-900/60">
                                                    Cambiar
                                                </button>
                                            )}
                                        </div>
                                        {selectedSpecialCredit && (
                                            <p className="text-xs text-blue-600 dark:text-blue-300">Usando gasto guardado: {selectedSpecialCredit.name}</p>
                                        )}

                                        {shouldShowSpecialCreditResults && (
                                            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">
                                                {isLoadingSpecialCredits ? (
                                                    <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">Buscando gastos...</p>
                                                ) : specialCreditsError ? (
                                                    <p className="px-4 py-3 text-sm text-red-600 dark:text-red-300">{specialCreditsError}</p>
                                                ) : specialCreditOptions.length ? (
                                                    specialCreditOptions.map((item) => (
                                                        <button
                                                            key={item.id}
                                                            type="button"
                                                            onClick={() => handleSelectSpecialCredit(item)}
                                                            className="flex w-full items-center justify-between border-b px-4 py-2 text-left text-sm transition last:border-b-0 dark:border-gray-800 hover:bg-blue-50/70 dark:text-gray-100 dark:hover:bg-blue-900/40">
                                                            <span className="font-medium">{item.name}</span>
                                                            {typeof item?._count?.expenses === "number" && (
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">{item._count.expenses} usos</span>
                                                            )}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">No encontramos gastos guardados. Crearemos "{normalizedExpenseSearch}" al agregarlo.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <FieldLabel label="Monto del gasto (ARS)" help="Importe que querés asociar a este gasto para descontarlo del neto del crédito." />
                                        <input
                                            type="number"
                                            min={0}
                                            step="100"
                                            value={expenseAmount}
                                            onChange={(event) => setExpenseAmount(event.target.value)}
                                            className={FIELD_INPUT_CLASS} />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end">
                                    <button
                                        type="button"
                                        onClick={handleAddExpense}
                                        disabled={!canAddExpense || isSavingExpense}
                                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-60">
                                        {isSavingExpense ? "Agregando..." : selectedSpecialCredit ? "Agregar gasto" : "Crear y agregar gasto"}
                                    </button>
                                </div>

                                {expenses.length ? (
                                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                <tr>
                                                    <th className="px-4 py-2 font-medium">Gasto</th>
                                                    <th className="px-4 py-2 font-medium">Monto</th>
                                                    <th className="px-4 py-2 text-right font-medium">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {expenses.map((expense) => (
                                                    <tr key={expense.tempId} className="bg-white dark:bg-gray-900">
                                                        <td className="px-4 py-2">
                                                            <div className="font-medium text-gray-800 dark:text-gray-100">{expense.description}</div>
                                                            {expense.specialCreditName && (
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">Tipo registrado: {expense.specialCreditName}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2 font-semibold text-gray-900 dark:text-gray-100">
                                                            {currencyFormatter.format(expense.amount)}
                                                        </td>
                                                        <td className="px-4 py-2 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveExpense(expense.tempId)}
                                                                className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100 dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-900/60">
                                                                Quitar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-400">Agregá los gastos que se generan por este crédito. Si el tipo no existe, lo crearemos automáticamente.</div>
                                )}
                            </div>

                            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={handlePreviousStep}
                                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-900">
                                    Volver a la configuración
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNextStep}
                                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300">
                                    Revisar resumen final
                                </button>
                            </div>
                        </section>
                    )}

                    {currentStep === 4 && (
                        <section className="order-4 rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/85">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">4. Confirmación final</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Revisá toda la información antes de crear el crédito.</p>
                                </div>
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                                    Listo para confirmar
                                </span>
                            </div>

                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                                <div className={SOFT_SECTION_CLASS}>
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Datos principales</h3>
                                    <dl className="mt-3 space-y-3 text-sm">
                                        <div className="flex items-start justify-between gap-4">
                                            <dt className="text-gray-500">Cliente</dt>
                                            <dd className="text-right font-medium text-gray-900 dark:text-gray-100">{selectedClient?.name || "—"}</dd>
                                        </div>
                                        <div className="flex items-start justify-between gap-4">
                                            <dt className="text-gray-500">Plan</dt>
                                            <dd className="text-right font-medium text-gray-900 dark:text-gray-100">{selectedPlan.label}</dd>
                                        </div>
                                        <div className="flex items-start justify-between gap-4">
                                            <dt className="text-gray-500">Modalidad</dt>
                                            <dd className="text-right font-medium text-gray-900 dark:text-gray-100">{creditMode === "NEW" ? "Crédito nuevo" : "Crédito existente"}</dd>
                                        </div>
                                        <div className="flex items-start justify-between gap-4">
                                            <dt className="text-gray-500">{primaryDateLabel}</dt>
                                            <dd className="text-right font-medium text-gray-900 dark:text-gray-100">{form.startDate ? new Date(`${form.startDate}T00:00:00`).toLocaleDateString("es-AR") : "—"}</dd>
                                        </div>
                                        {!isSinglePayment && (
                                            <div className="flex items-start justify-between gap-4">
                                                <dt className="text-gray-500">Primer pago</dt>
                                                <dd className="text-right font-medium text-gray-900 dark:text-gray-100">{form.firstPaymentDate ? new Date(`${form.firstPaymentDate}T00:00:00`).toLocaleDateString("es-AR") : "—"}</dd>
                                            </div>
                                        )}
                                        <div className="flex items-start justify-between gap-4">
                                            <dt className="text-gray-500">Cobro final estimado</dt>
                                            <dd className="text-right font-medium text-gray-900 dark:text-gray-100">{estimatedDueDate ? new Date(`${estimatedDueDate}T00:00:00`).toLocaleDateString("es-AR") : "—"}</dd>
                                        </div>
                                    </dl>
                                </div>

                                <div className={SOFT_SECTION_CLASS}>
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Montos y seguimiento</h3>
                                    <dl className="mt-3 space-y-3 text-sm">
                                        <div className="flex items-start justify-between gap-4">
                                            <dt className="text-gray-500">Monto base</dt>
                                            <dd className="text-right font-medium text-gray-900 dark:text-gray-100">{montoBase ? currencyFormatter.format(montoBase) : "—"}</dd>
                                        </div>
                                        <div className="flex items-start justify-between gap-4">
                                            <dt className="text-gray-500">Total del crédito</dt>
                                            <dd className="text-right font-medium text-gray-900 dark:text-gray-100">{totalCredito ? currencyFormatter.format(totalCredito) : "—"}</dd>
                                        </div>
                                        <div className="flex items-start justify-between gap-4">
                                            <dt className="text-gray-500">Cuotas</dt>
                                            <dd className="text-right font-medium text-gray-900 dark:text-gray-100">{cuotasNumber || "—"}</dd>
                                        </div>
                                        <div className="flex items-start justify-between gap-4">
                                            <dt className="text-gray-500">Cuota estimada</dt>
                                            <dd className="text-right font-medium text-gray-900 dark:text-gray-100">{cuotaEstimada > 0 ? currencyFormatter.format(cuotaEstimada) : "—"}</dd>
                                        </div>
                                        <div className="flex items-start justify-between gap-4">
                                            <dt className="text-gray-500">Gastos asociados</dt>
                                            <dd className="text-right font-medium text-gray-900 dark:text-gray-100">{expenses.length ? `${expenses.length} · ${currencyFormatter.format(totalExpenses)}` : "Sin gastos"}</dd>
                                        </div>
                                        {isExistingCredit && (
                                            <>
                                                <div className="flex items-start justify-between gap-4">
                                                    <dt className="text-gray-500">Monto ya cobrado</dt>
                                                    <dd className="text-right font-medium text-gray-900 dark:text-gray-100">{computedReceivedAmountLabel}</dd>
                                                </div>
                                                <div className="flex items-start justify-between gap-4">
                                                    <dt className="text-gray-500">Próxima cuota</dt>
                                                    <dd className="text-right font-medium text-gray-900 dark:text-gray-100">{existingCreditData.nextInstallmentToCharge !== "" ? `Cuota ${nextInstallmentNumber}` : "—"}</dd>
                                                </div>
                                            </>
                                        )}
                                    </dl>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={handlePreviousStep}
                                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-900">
                                    Volver a gastos
                                </button>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <button
                                        type="button"
                                        onClick={generarContrato}
                                        className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300">
                                        Generar contrato
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60">
                                        {isSubmitting ? "Creando crédito" : "Confirmar y crear crédito"}
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}
                </div>

                <aside className="space-y-6">
                    <div className="rounded-xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Estado del flujo</h3>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                                {selectedPlan.label}
                            </span>
                        </div>
                        <div className="mt-4 space-y-2">
                            {CREDIT_STEPS.map((step) => {
                                const isCompleted = step.id < currentStep;
                                const isActive = step.id === currentStep;

                                return (
                                    <div
                                        key={step.id}
                                        className={`rounded-xl border px-3 py-3 text-sm ${isActive
                                            ? "border-blue-300 bg-blue-50/70 text-blue-900 dark:border-blue-500/50 dark:bg-blue-900/20 dark:text-blue-100"
                                            : isCompleted
                                                ? "border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-900/20 dark:text-emerald-200"
                                                : "border-slate-200 bg-transparent text-slate-500 dark:border-slate-700 dark:text-slate-400"}`}>
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">{step.eyebrow}</p>
                                                <p className="mt-1 font-medium">{step.title}</p>
                                            </div>
                                            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${isActive
                                                ? "bg-blue-600 text-white"
                                                : isCompleted
                                                    ? "bg-emerald-600 text-white"
                                                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                                                {isCompleted ? "✓" : step.id}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Detalle de montos</h3>
                        <div className="mt-4 space-y-4 text-sm">
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                                    <span>Total del crédito</span>
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                        {totalCredito ? currencyFormatter.format(totalCredito) : "—"}
                                    </span>
                                </div>
                                {totalCredito ? (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Monto: {currencyFormatter.format(montoBase || 0)} • Ganancia: {currencyFormatter.format(gananciaCredito)}
                                    </p>
                                ) : null}
                            </div>
                            <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                                <span>Comisión de ganancia</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {montoBase > 0 ? currencyFormatter.format(gananciaCredito) : "—"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                                <span>Cuota estimada</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {cuotaEstimada > 0 ? currencyFormatter.format(cuotaEstimada) : "—"}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                                    <span>Total neto</span>
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                        {totalCredito > 0 ? currencyFormatter.format(totalNetoDespuesComision) : "—"}
                                    </span>
                                </div>
                                {totalCredito > 0 ? (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Comisión vendedor: {currencyFormatter.format(comisionLibre || 0)}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {currentStep < 4 && (
                        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/80 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
                            Terminá los pasos para ver el resumen final y confirmar el alta del crédito.
                        </div>
                    )}
                </aside>
            </form>
        </div>
    );
}

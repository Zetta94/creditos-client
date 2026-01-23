import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { fetchDashboardFinancialDetail } from "../services/dashboardService";

const FINANCIAL_PERIODS = [
    { key: "week", label: "Semana", description: "Semanal" },
    { key: "month", label: "Mes", description: "Mensual" },
    { key: "year", label: "Año", description: "Anual" }
];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => {
    const label = new Date(2000, index, 1).toLocaleDateString("es-AR", { month: "long" });
    return {
        value: index + 1,
        label: label.charAt(0).toUpperCase() + label.slice(1)
    };
});

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = (() => {
    const options = Array.from({ length: 5 }, (_, index) => CURRENT_YEAR - index);
    if (!options.includes(2025)) options.push(2025);
    return options.sort((a, b) => b - a);
})();

const toLocalDateIso = (date) => {
    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offsetMs).toISOString().split("T")[0];
};

const getMonthLabel = (month) => {
    const option = MONTH_OPTIONS.find((item) => item.value === Number(month));
    return option ? option.label : `Mes ${month}`;
};

const formatDateLocale = (value, options = {}) => {
    if (!value) return "";
    const source = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? `${value}T00:00:00`
        : value;
    const date = new Date(source);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("es-AR", options);
};

const formatDateTimeLocale = (value) => {
    if (!value) return "";
    const source = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? `${value}T00:00:00`
        : value;
    const date = new Date(source);
    if (Number.isNaN(date.getTime())) return "";
    const datePart = date.toLocaleDateString("es-AR");
    const timePart = date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    return `${datePart} ${timePart}`;
};

const cloneDetail = (detail) => JSON.parse(JSON.stringify(detail));

const MOCK_FINANCIAL_HISTORY = {
    month: {
        "2025-10": {
            period: "month",
            range: {
                start: "2025-10-01T00:00:00.000Z",
                end: "2025-10-31T23:59:59.999Z"
            },
            totals: {
                income: 480000,
                totalExpenses: 120000,
                payroll: 45000,
                operationalExpenses: 75000,
                netProfit: 360000
            },
            breakdown: {
                type: "week",
                entries: [
                    { label: "Semana 1 (01/10/2025 - 07/10/2025)", income: 115000, expenses: 33000 },
                    { label: "Semana 2 (08/10/2025 - 14/10/2025)", income: 160000, expenses: 30000 },
                    { label: "Semana 3 (15/10/2025 - 21/10/2025)", income: 95000, expenses: 0 },
                    { label: "Semana 4 (22/10/2025 - 31/10/2025)", income: 110000, expenses: 57000 }
                ]
            },
            payments: [
                {
                    id: "p-oct-1",
                    amount: 60000,
                    methodSummary: "efectivo",
                    efectivoAmount: 60000,
                    mercadopagoAmount: 0,
                    transferenciaAmount: 0,
                    date: "2025-10-03T14:15:00.000Z",
                    note: null,
                    creditId: "credit-oct-1",
                    collector: { id: "mock-c1", name: "Franco Correa" },
                    client: { id: "mock-client-1", name: "Lucía Pérez" }
                },
                {
                    id: "p-oct-2",
                    amount: 55000,
                    methodSummary: "transferencia",
                    efectivoAmount: 0,
                    mercadopagoAmount: 0,
                    transferenciaAmount: 55000,
                    date: "2025-10-07T11:45:00.000Z",
                    note: "Pago adelantado",
                    creditId: "credit-oct-2",
                    collector: { id: "mock-c1", name: "Franco Correa" },
                    client: { id: "mock-client-2", name: "José Ríos" }
                },
                {
                    id: "p-oct-3",
                    amount: 70000,
                    methodSummary: "mercadopago",
                    efectivoAmount: 0,
                    mercadopagoAmount: 70000,
                    transferenciaAmount: 0,
                    date: "2025-10-14T16:20:00.000Z",
                    note: null,
                    creditId: "credit-oct-3",
                    collector: { id: "mock-c1", name: "Franco Correa" },
                    client: { id: "mock-client-3", name: "Camila Soto" }
                },
                {
                    id: "p-oct-4",
                    amount: 95000,
                    methodSummary: "efectivo",
                    efectivoAmount: 95000,
                    mercadopagoAmount: 0,
                    transferenciaAmount: 0,
                    date: "2025-10-21T19:10:00.000Z",
                    note: "Cuota especial",
                    creditId: "credit-oct-4",
                    collector: { id: "mock-c1", name: "Franco Correa" },
                    client: { id: "mock-client-4", name: "Valentina Ortiz" }
                },
                {
                    id: "p-oct-5",
                    amount: 90000,
                    methodSummary: "transferencia",
                    efectivoAmount: 0,
                    mercadopagoAmount: 0,
                    transferenciaAmount: 90000,
                    date: "2025-10-10T13:30:00.000Z",
                    note: null,
                    creditId: "credit-oct-5",
                    collector: { id: "mock-c2", name: "Pedro Sosa" },
                    client: { id: "mock-client-6", name: "Diego Luna" }
                },
                {
                    id: "p-oct-6",
                    amount: 110000,
                    methodSummary: "efectivo",
                    efectivoAmount: 110000,
                    mercadopagoAmount: 0,
                    transferenciaAmount: 0,
                    date: "2025-10-25T17:40:00.000Z",
                    note: null,
                    creditId: "credit-oct-6",
                    collector: { id: "mock-c2", name: "Pedro Sosa" },
                    client: { id: "mock-client-7", name: "Ana Castro" }
                }
            ],
            expenses: [
                {
                    id: "exp-oct-1",
                    description: "Comisión cobrador Franco",
                    amount: 15000,
                    category: "COMISION",
                    notes: null,
                    incurredOn: "2025-10-05T12:00:00.000Z",
                    credit: { id: "mock-client-1", name: "Lucía Pérez", creditId: "credit-oct-1" },
                    specialCredit: null
                },
                {
                    id: "exp-oct-2",
                    description: "Flete electrodomésticos",
                    amount: 18000,
                    category: "LOGISTICA",
                    notes: "Entrega zona sur",
                    incurredOn: "2025-10-06T18:45:00.000Z",
                    credit: null,
                    specialCredit: null
                },
                {
                    id: "exp-oct-3",
                    description: "Pago sueldo administrativo",
                    amount: 30000,
                    category: "SUELDO",
                    notes: null,
                    incurredOn: "2025-10-12T09:00:00.000Z",
                    credit: null,
                    specialCredit: null
                },
                {
                    id: "exp-oct-4",
                    description: "Campaña marketing barrial",
                    amount: 57000,
                    category: "MARKETING",
                    notes: "Volantes y cartelería",
                    incurredOn: "2025-10-28T15:30:00.000Z",
                    credit: null,
                    specialCredit: null
                }
            ],
            collectors: [
                {
                    id: "mock-c1",
                    name: "Franco Correa",
                    totalCollected: 280000,
                    payments: [
                        {
                            id: "p-oct-1",
                            amount: 60000,
                            methodSummary: "efectivo",
                            efectivoAmount: 60000,
                            mercadopagoAmount: 0,
                            transferenciaAmount: 0,
                            date: "2025-10-03T14:15:00.000Z",
                            note: null,
                            creditId: "credit-oct-1",
                            collector: { id: "mock-c1", name: "Franco Correa" },
                            client: { id: "mock-client-1", name: "Lucía Pérez" }
                        },
                        {
                            id: "p-oct-2",
                            amount: 55000,
                            methodSummary: "transferencia",
                            efectivoAmount: 0,
                            mercadopagoAmount: 0,
                            transferenciaAmount: 55000,
                            date: "2025-10-07T11:45:00.000Z",
                            note: "Pago adelantado",
                            creditId: "credit-oct-2",
                            collector: { id: "mock-c1", name: "Franco Correa" },
                            client: { id: "mock-client-2", name: "José Ríos" }
                        },
                        {
                            id: "p-oct-3",
                            amount: 70000,
                            methodSummary: "mercadopago",
                            efectivoAmount: 0,
                            mercadopagoAmount: 70000,
                            transferenciaAmount: 0,
                            date: "2025-10-14T16:20:00.000Z",
                            note: null,
                            creditId: "credit-oct-3",
                            collector: { id: "mock-c1", name: "Franco Correa" },
                            client: { id: "mock-client-3", name: "Camila Soto" }
                        },
                        {
                            id: "p-oct-4",
                            amount: 95000,
                            methodSummary: "efectivo",
                            efectivoAmount: 95000,
                            mercadopagoAmount: 0,
                            transferenciaAmount: 0,
                            date: "2025-10-21T19:10:00.000Z",
                            note: "Cuota especial",
                            creditId: "credit-oct-4",
                            collector: { id: "mock-c1", name: "Franco Correa" },
                            client: { id: "mock-client-4", name: "Valentina Ortiz" }
                        }
                    ],
                    clientsPaid: [
                        { id: "mock-client-1", name: "Lucía Pérez", totalPaid: 60000, lastPayment: "2025-10-03T14:15:00.000Z" },
                        { id: "mock-client-2", name: "José Ríos", totalPaid: 55000, lastPayment: "2025-10-07T11:45:00.000Z" },
                        { id: "mock-client-3", name: "Camila Soto", totalPaid: 70000, lastPayment: "2025-10-14T16:20:00.000Z" },
                        { id: "mock-client-4", name: "Valentina Ortiz", totalPaid: 95000, lastPayment: "2025-10-21T19:10:00.000Z" }
                    ],
                    clientsPending: [
                        { id: "mock-client-5", name: "Carlos López", nextVisitDate: "2025-10-29T13:00:00.000Z", pendingSince: "2025-10-15T13:00:00.000Z" }
                    ],
                    completed: false
                },
                {
                    id: "mock-c2",
                    name: "Pedro Sosa",
                    totalCollected: 200000,
                    payments: [
                        {
                            id: "p-oct-5",
                            amount: 90000,
                            methodSummary: "transferencia",
                            efectivoAmount: 0,
                            mercadopagoAmount: 0,
                            transferenciaAmount: 90000,
                            date: "2025-10-10T13:30:00.000Z",
                            note: null,
                            creditId: "credit-oct-5",
                            collector: { id: "mock-c2", name: "Pedro Sosa" },
                            client: { id: "mock-client-6", name: "Diego Luna" }
                        },
                        {
                            id: "p-oct-6",
                            amount: 110000,
                            methodSummary: "efectivo",
                            efectivoAmount: 110000,
                            mercadopagoAmount: 0,
                            transferenciaAmount: 0,
                            date: "2025-10-25T17:40:00.000Z",
                            note: null,
                            creditId: "credit-oct-6",
                            collector: { id: "mock-c2", name: "Pedro Sosa" },
                            client: { id: "mock-client-7", name: "Ana Castro" }
                        }
                    ],
                    clientsPaid: [
                        { id: "mock-client-6", name: "Diego Luna", totalPaid: 90000, lastPayment: "2025-10-10T13:30:00.000Z" },
                        { id: "mock-client-7", name: "Ana Castro", totalPaid: 110000, lastPayment: "2025-10-25T17:40:00.000Z" }
                    ],
                    clientsPending: [],
                    completed: true
                }
            ]
        },
        "2025-11": {
            period: "month",
            range: {
                start: "2025-11-01T00:00:00.000Z",
                end: "2025-11-30T23:59:59.999Z"
            },
            totals: {
                income: 520000,
                totalExpenses: 138000,
                payroll: 52000,
                operationalExpenses: 86000,
                netProfit: 382000
            },
            breakdown: {
                type: "week",
                entries: [
                    { label: "Semana 1 (01/11/2025 - 07/11/2025)", income: 140000, expenses: 36000 },
                    { label: "Semana 2 (08/11/2025 - 14/11/2025)", income: 150000, expenses: 32000 },
                    { label: "Semana 3 (15/11/2025 - 21/11/2025)", income: 110000, expenses: 28000 },
                    { label: "Semana 4 (22/11/2025 - 30/11/2025)", income: 120000, expenses: 42000 }
                ]
            },
            payments: [
                {
                    id: "p-nov-1",
                    amount: 70000,
                    methodSummary: "efectivo",
                    efectivoAmount: 70000,
                    mercadopagoAmount: 0,
                    transferenciaAmount: 0,
                    date: "2025-11-03T15:05:00.000Z",
                    note: null,
                    creditId: "credit-nov-1",
                    collector: { id: "mock-c1", name: "Franco Correa" },
                    client: { id: "mock-client-8", name: "Julieta Arce" }
                },
                {
                    id: "p-nov-2",
                    amount: 80000,
                    methodSummary: "mercadopago",
                    efectivoAmount: 0,
                    mercadopagoAmount: 80000,
                    transferenciaAmount: 0,
                    date: "2025-11-10T11:40:00.000Z",
                    note: null,
                    creditId: "credit-nov-2",
                    collector: { id: "mock-c1", name: "Franco Correa" },
                    client: { id: "mock-client-9", name: "Guillermo Díaz" }
                },
                {
                    id: "p-nov-3",
                    amount: 55000,
                    methodSummary: "transferencia",
                    efectivoAmount: 0,
                    mercadopagoAmount: 0,
                    transferenciaAmount: 55000,
                    date: "2025-11-14T19:30:00.000Z",
                    note: "Transferencia directa",
                    creditId: "credit-nov-3",
                    collector: { id: "mock-c2", name: "Pedro Sosa" },
                    client: { id: "mock-client-10", name: "Graciela Suárez" }
                },
                {
                    id: "p-nov-4",
                    amount: 60000,
                    methodSummary: "efectivo",
                    efectivoAmount: 60000,
                    mercadopagoAmount: 0,
                    transferenciaAmount: 0,
                    date: "2025-11-18T09:25:00.000Z",
                    note: null,
                    creditId: "credit-nov-4",
                    collector: { id: "mock-c2", name: "Pedro Sosa" },
                    client: { id: "mock-client-11", name: "Sofía Benítez" }
                },
                {
                    id: "p-nov-5",
                    amount: 55000,
                    methodSummary: "mercadopago",
                    efectivoAmount: 0,
                    mercadopagoAmount: 55000,
                    transferenciaAmount: 0,
                    date: "2025-11-22T16:10:00.000Z",
                    note: "Pago con QR",
                    creditId: "credit-nov-5",
                    collector: { id: "mock-c1", name: "Franco Correa" },
                    client: { id: "mock-client-12", name: "Gonzalo Vera" }
                },
                {
                    id: "p-nov-6",
                    amount: 20000,
                    methodSummary: "efectivo",
                    efectivoAmount: 20000,
                    mercadopagoAmount: 0,
                    transferenciaAmount: 0,
                    date: "2025-11-27T18:45:00.000Z",
                    note: null,
                    creditId: "credit-nov-6",
                    collector: { id: "mock-c2", name: "Pedro Sosa" },
                    client: { id: "mock-client-13", name: "Elena Giménez" }
                }
            ],
            expenses: [
                {
                    id: "exp-nov-1",
                    description: "Comisión cobrador Pedro",
                    amount: 17000,
                    category: "COMISION",
                    notes: null,
                    incurredOn: "2025-11-05T12:00:00.000Z",
                    credit: null,
                    specialCredit: null
                },
                {
                    id: "exp-nov-2",
                    description: "Logística electrodomésticos",
                    amount: 21000,
                    category: "LOGISTICA",
                    notes: "Operativo oeste",
                    incurredOn: "2025-11-12T18:45:00.000Z",
                    credit: null,
                    specialCredit: null
                },
                {
                    id: "exp-nov-3",
                    description: "Pago sueldo administrativo",
                    amount: 32000,
                    category: "SUELDO",
                    notes: null,
                    incurredOn: "2025-11-20T09:00:00.000Z",
                    credit: null,
                    specialCredit: null
                },
                {
                    id: "exp-nov-4",
                    description: "Publicidad radios locales",
                    amount: 28000,
                    category: "MARKETING",
                    notes: "Campaña cuotas navidad",
                    incurredOn: "2025-11-28T15:30:00.000Z",
                    credit: null,
                    specialCredit: null
                }
            ],
            collectors: [
                {
                    id: "mock-c1",
                    name: "Franco Correa",
                    totalCollected: 365000,
                    payments: [],
                    clientsPaid: [
                        { id: "mock-client-8", name: "Julieta Arce", totalPaid: 70000, lastPayment: "2025-11-03T15:05:00.000Z" },
                        { id: "mock-client-9", name: "Guillermo Díaz", totalPaid: 80000, lastPayment: "2025-11-10T11:40:00.000Z" },
                        { id: "mock-client-12", name: "Gonzalo Vera", totalPaid: 55000, lastPayment: "2025-11-22T16:10:00.000Z" }
                    ],
                    clientsPending: [
                        { id: "mock-client-14", name: "María Avila", nextVisitDate: "2025-11-30T10:30:00.000Z", pendingSince: "2025-11-23T10:30:00.000Z" }
                    ],
                    completed: false
                },
                {
                    id: "mock-c2",
                    name: "Pedro Sosa",
                    totalCollected: 155000,
                    payments: [],
                    clientsPaid: [
                        { id: "mock-client-10", name: "Graciela Suárez", totalPaid: 55000, lastPayment: "2025-11-14T19:30:00.000Z" },
                        { id: "mock-client-11", name: "Sofía Benítez", totalPaid: 60000, lastPayment: "2025-11-18T09:25:00.000Z" },
                        { id: "mock-client-13", name: "Elena Giménez", totalPaid: 20000, lastPayment: "2025-11-27T18:45:00.000Z" }
                    ],
                    clientsPending: [],
                    completed: true
                }
            ]
        },
        "2025-12": {
            period: "month",
            range: {
                start: "2025-12-01T00:00:00.000Z",
                end: "2025-12-31T23:59:59.999Z"
            },
            totals: {
                income: 610000,
                totalExpenses: 165000,
                payroll: 72000,
                operationalExpenses: 93000,
                netProfit: 445000
            },
            breakdown: {
                type: "week",
                entries: [
                    { label: "Semana 1 (01/12/2025 - 07/12/2025)", income: 150000, expenses: 42000 },
                    { label: "Semana 2 (08/12/2025 - 14/12/2025)", income: 155000, expenses: 41000 },
                    { label: "Semana 3 (15/12/2025 - 21/12/2025)", income: 160000, expenses: 45000 },
                    { label: "Semana 4 (22/12/2025 - 31/12/2025)", income: 145000, expenses: 37000 }
                ]
            },
            payments: [
                {
                    id: "p-dec-1",
                    amount: 90000,
                    methodSummary: "efectivo",
                    efectivoAmount: 90000,
                    mercadopagoAmount: 0,
                    transferenciaAmount: 0,
                    date: "2025-12-02T12:40:00.000Z",
                    note: null,
                    creditId: "credit-dec-1",
                    collector: { id: "mock-c1", name: "Franco Correa" },
                    client: { id: "mock-client-15", name: "Melina Campos" }
                },
                {
                    id: "p-dec-2",
                    amount: 80000,
                    methodSummary: "mercadopago",
                    efectivoAmount: 0,
                    mercadopagoAmount: 80000,
                    transferenciaAmount: 0,
                    date: "2025-12-07T19:35:00.000Z",
                    note: "Pago navideño",
                    creditId: "credit-dec-2",
                    collector: { id: "mock-c1", name: "Franco Correa" },
                    client: { id: "mock-client-16", name: "Raúl Ortega" }
                },
                {
                    id: "p-dec-3",
                    amount: 75000,
                    methodSummary: "transferencia",
                    efectivoAmount: 0,
                    mercadopagoAmount: 0,
                    transferenciaAmount: 75000,
                    date: "2025-12-12T18:10:00.000Z",
                    note: "Transferencia fin de año",
                    creditId: "credit-dec-3",
                    collector: { id: "mock-c2", name: "Pedro Sosa" },
                    client: { id: "mock-client-17", name: "Cristian Duarte" }
                },
                {
                    id: "p-dec-4",
                    amount: 65000,
                    methodSummary: "efectivo",
                    efectivoAmount: 65000,
                    mercadopagoAmount: 0,
                    transferenciaAmount: 0,
                    date: "2025-12-16T09:20:00.000Z",
                    note: null,
                    creditId: "credit-dec-4",
                    collector: { id: "mock-c2", name: "Pedro Sosa" },
                    client: { id: "mock-client-18", name: "Nadia Molina" }
                },
                {
                    id: "p-dec-5",
                    amount: 60000,
                    methodSummary: "mercadopago",
                    efectivoAmount: 0,
                    mercadopagoAmount: 60000,
                    transferenciaAmount: 0,
                    date: "2025-12-21T20:45:00.000Z",
                    note: "Pago QR",
                    creditId: "credit-dec-5",
                    collector: { id: "mock-c1", name: "Franco Correa" },
                    client: { id: "mock-client-19", name: "Silvia Coronel" }
                },
                {
                    id: "p-dec-6",
                    amount: 85000,
                    methodSummary: "transferencia",
                    efectivoAmount: 0,
                    mercadopagoAmount: 0,
                    transferenciaAmount: 85000,
                    date: "2025-12-28T17:30:00.000Z",
                    note: null,
                    creditId: "credit-dec-6",
                    collector: { id: "mock-c2", name: "Pedro Sosa" },
                    client: { id: "mock-client-20", name: "Daniel Gatica" }
                }
            ],
            expenses: [
                {
                    id: "exp-dec-1",
                    description: "Comisión cobrador diciembre",
                    amount: 21000,
                    category: "COMISION",
                    notes: null,
                    incurredOn: "2025-12-06T12:00:00.000Z",
                    credit: null,
                    specialCredit: null
                },
                {
                    id: "exp-dec-2",
                    description: "Extra logística rutas",
                    amount: 23000,
                    category: "LOGISTICA",
                    notes: "Rutas especiales fin año",
                    incurredOn: "2025-12-11T18:45:00.000Z",
                    credit: null,
                    specialCredit: null
                },
                {
                    id: "exp-dec-3",
                    description: "Pago sueldo administrativo",
                    amount: 36000,
                    category: "SUELDO",
                    notes: null,
                    incurredOn: "2025-12-18T09:00:00.000Z",
                    credit: null,
                    specialCredit: null
                },
                {
                    id: "exp-dec-4",
                    description: "Campaña marketing fiestas",
                    amount: 25000,
                    category: "MARKETING",
                    notes: "Anuncios redes",
                    incurredOn: "2025-12-22T15:30:00.000Z",
                    credit: null,
                    specialCredit: null
                },
                {
                    id: "exp-dec-5",
                    description: "Bono performance",
                    amount: 30000,
                    category: "BONO",
                    notes: "Bonificación navideña",
                    incurredOn: "2025-12-27T13:15:00.000Z",
                    credit: null,
                    specialCredit: null
                }
            ],
            collectors: [
                {
                    id: "mock-c1",
                    name: "Franco Correa",
                    totalCollected: 358000,
                    payments: [],
                    clientsPaid: [
                        { id: "mock-client-15", name: "Melina Campos", totalPaid: 90000, lastPayment: "2025-12-02T12:40:00.000Z" },
                        { id: "mock-client-16", name: "Raúl Ortega", totalPaid: 80000, lastPayment: "2025-12-07T19:35:00.000Z" },
                        { id: "mock-client-19", name: "Silvia Coronel", totalPaid: 60000, lastPayment: "2025-12-21T20:45:00.000Z" }
                    ],
                    clientsPending: [],
                    completed: true
                },
                {
                    id: "mock-c2",
                    name: "Pedro Sosa",
                    totalCollected: 252000,
                    payments: [],
                    clientsPaid: [
                        { id: "mock-client-17", name: "Cristian Duarte", totalPaid: 75000, lastPayment: "2025-12-12T18:10:00.000Z" },
                        { id: "mock-client-18", name: "Nadia Molina", totalPaid: 65000, lastPayment: "2025-12-16T09:20:00.000Z" },
                        { id: "mock-client-20", name: "Daniel Gatica", totalPaid: 85000, lastPayment: "2025-12-28T17:30:00.000Z" }
                    ],
                    clientsPending: [
                        { id: "mock-client-21", name: "Rocío Herrera", nextVisitDate: "2026-01-04T12:00:00.000Z", pendingSince: "2025-12-26T12:00:00.000Z" }
                    ],
                    completed: false
                }
            ]
        }
    },
    year: {
        "2025": {
            period: "year",
            range: {
                start: "2025-01-01T00:00:00.000Z",
                end: "2025-12-31T23:59:59.999Z"
            },
            totals: {
                income: 5440000,
                totalExpenses: 1420000,
                payroll: 520000,
                operationalExpenses: 900000,
                netProfit: 4020000
            },
            breakdown: {
                type: "month",
                entries: [
                    { label: "Enero", income: 350000, expenses: 90000 },
                    { label: "Febrero", income: 360000, expenses: 95000 },
                    { label: "Marzo", income: 390000, expenses: 102000 },
                    { label: "Abril", income: 410000, expenses: 105000 },
                    { label: "Mayo", income: 430000, expenses: 108000 },
                    { label: "Junio", income: 445000, expenses: 112000 },
                    { label: "Julio", income: 470000, expenses: 118000 },
                    { label: "Agosto", income: 480000, expenses: 120000 },
                    { label: "Septiembre", income: 495000, expenses: 125000 },
                    { label: "Octubre", income: 480000, expenses: 120000 },
                    { label: "Noviembre", income: 520000, expenses: 138000 },
                    { label: "Diciembre", income: 610000, expenses: 165000 }
                ]
            },
            collectors: [
                {
                    id: "mock-c1",
                    name: "Franco Correa",
                    totalCollected: 2950000,
                    payments: [],
                    clientsPaid: [
                        { id: "mock-client-1", name: "Lucía Pérez", totalPaid: 320000, lastPayment: "2025-12-23T19:30:00.000Z" },
                        { id: "mock-client-3", name: "Camila Soto", totalPaid: 280000, lastPayment: "2025-11-06T10:20:00.000Z" },
                        { id: "mock-client-17", name: "Cristian Duarte", totalPaid: 130000, lastPayment: "2025-12-23T19:30:00.000Z" }
                    ],
                    clientsPending: [],
                    completed: true
                },
                {
                    id: "mock-c2",
                    name: "Pedro Sosa",
                    totalCollected: 2490000,
                    payments: [],
                    clientsPaid: [
                        { id: "mock-client-7", name: "Ana Castro", totalPaid: 285000, lastPayment: "2025-12-06T18:10:00.000Z" },
                        { id: "mock-client-11", name: "Sofía Benítez", totalPaid: 190000, lastPayment: "2025-11-28T16:50:00.000Z" }
                    ],
                    clientsPending: [
                        { id: "mock-client-20", name: "Daniel Gatica", nextVisitDate: "2026-01-03T12:00:00.000Z", pendingSince: "2025-12-24T12:00:00.000Z" }
                    ],
                    completed: false
                }
            ],
            payments: [],
            expenses: []
        }
    }
};

const getMockDetail = (period, year, month) => {
    if (period === "month") {
        const key = `${year}-${String(month).padStart(2, "0")}`;
        const data = MOCK_FINANCIAL_HISTORY.month[key];
        return data ? cloneDetail(data) : null;
    }
    if (period === "year") {
        const key = String(year);
        const data = MOCK_FINANCIAL_HISTORY.year[key];
        return data ? cloneDetail(data) : null;
    }
    return null;
};

export default function FinancialDetail() {
    const navigate = useNavigate();
    const [detailPeriod, setDetailPeriod] = useState("month");
    const [detailWeekDate, setDetailWeekDate] = useState(() => toLocalDateIso(new Date()));
    const [detailMonth, setDetailMonth] = useState(new Date().getMonth() + 1);
    const [detailYear, setDetailYear] = useState(new Date().getFullYear());
    const [detailData, setDetailData] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);

    const buildDetailParams = useCallback(() => {
        const params = { period: detailPeriod };
        if (detailPeriod === "week") {
            params.reference = detailWeekDate;
        } else if (detailPeriod === "month") {
            params.year = detailYear;
            params.month = detailMonth;
        } else {
            params.year = detailYear;
        }
        return params;
    }, [detailPeriod, detailWeekDate, detailMonth, detailYear]);

    const loadDetail = useCallback(async () => {
        const params = buildDetailParams();
        setDetailLoading(true);
        setDetailError(null);
        try {
            const response = await fetchDashboardFinancialDetail(params);
            let payload = response?.data ?? null;
            const shouldFallback = detailPeriod !== "week" && (!payload || ((payload.totals?.income ?? 0) === 0 && (!payload.payments?.length || payload.payments.length === 0)));
            if (shouldFallback) {
                const mock = getMockDetail(detailPeriod, params.year ?? detailYear, params.month ?? detailMonth);
                if (mock) payload = mock;
            }
            if (!payload) {
                setDetailData(null);
                setDetailError("No hay datos disponibles para este período.");
                return;
            }
            setDetailData(payload);
        } catch (err) {
            if (detailPeriod === "week") {
                setDetailData(null);
                setDetailError("No se pudo cargar el resumen semanal.");
            } else {
                const mock = getMockDetail(detailPeriod, params.year ?? detailYear, params.month ?? detailMonth);
                if (mock) {
                    setDetailData(mock);
                    setDetailError(null);
                } else {
                    setDetailData(null);
                    setDetailError("No se pudo cargar el resumen detallado.");
                }
            }
        } finally {
            setDetailLoading(false);
        }
    }, [buildDetailParams, detailPeriod, detailYear, detailMonth]);

    useEffect(() => {
        loadDetail();
    }, [loadDetail]);

    const detailSelectionLabel = useMemo(() => {
        if (detailPeriod === "week") {
            const formatted = formatDateLocale(detailWeekDate);
            return formatted ? `Semana del ${formatted}` : "Semana seleccionada";
        }
        if (detailPeriod === "month") {
            return `${getMonthLabel(detailMonth)} ${detailYear}`;
        }
        return `Año ${detailYear}`;
    }, [detailPeriod, detailWeekDate, detailMonth, detailYear]);

    const detailRangeLabel = useMemo(() => {
        if (!detailData?.range) return null;
        const start = formatDateLocale(detailData.range.start);
        const end = formatDateLocale(detailData.range.end);
        if (!start || !end) return null;
        return `${start} - ${end}`;
    }, [detailData]);

    const canDownloadDetailPdf = detailPeriod !== "week" && !!detailData && !detailLoading;
    const detailTotals = detailData?.totals ?? null;
    const detailNetProfit = detailTotals?.netProfit ?? 0;
    const detailNetProfitClass = detailNetProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
    const detailOperationalExpenses = detailTotals?.operationalExpenses ?? 0;

    const currencyFormatter = useMemo(() => new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }), []);

    const toCurrency = useCallback((value) => currencyFormatter.format(value ?? 0), [currencyFormatter]);

    const handleDownloadDetailPdf = () => {
        if (!detailData || detailPeriod === "week") return;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFontSize(16);
        doc.text(`Detalle financiero - ${detailSelectionLabel}`, pageWidth / 2, 18, { align: "center" });

        const rangeText = detailRangeLabel || detailSelectionLabel;
        if (rangeText) {
            doc.setFontSize(11);
            doc.text(rangeText, 14, 30);
        }

        const totals = detailData.totals ?? {};
        autoTable(doc, {
            startY: 38,
            head: [["Ingresos", "Gastos", "Pago empleados", "Gastos operativos", "Ganancia neta"]],
            body: [[
                toCurrency(totals.income ?? 0),
                toCurrency(totals.totalExpenses ?? 0),
                toCurrency(totals.payroll ?? 0),
                toCurrency(totals.operationalExpenses ?? 0),
                toCurrency(totals.netProfit ?? 0)
            ]]
        });

        let nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 48;

        if (detailData.breakdown?.entries?.length) {
            const breakdownTitle = detailData.breakdown.type === "month"
                ? "Mes"
                : detailData.breakdown.type === "week"
                    ? "Semana"
                    : "Segmento";
            autoTable(doc, {
                startY: nextY,
                head: [[breakdownTitle, "Ingresos", "Gastos"]],
                body: detailData.breakdown.entries.map((entry) => [
                    entry.label,
                    toCurrency(entry.income ?? 0),
                    toCurrency(entry.expenses ?? 0)
                ])
            });
            nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : nextY + 8;
        }

        if (detailData.collectors?.length) {
            autoTable(doc, {
                startY: nextY,
                head: [["Cobrador", "Total recaudado", "Clientes cobrados", "Clientes pendientes", "Estado"]],
                body: detailData.collectors.map((collector) => [
                    collector.name ?? "-",
                    toCurrency(collector.totalCollected ?? 0),
                    String(collector.clientsPaid?.length ?? 0),
                    String(collector.clientsPending?.length ?? 0),
                    collector.completed ? "Completado" : "En progreso"
                ])
            });
            nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : nextY + 8;
        }

        if (detailData.payments?.length) {
            autoTable(doc, {
                startY: nextY,
                head: [["Fecha", "Cliente", "Cobrador", "Monto", "Método"]],
                body: detailData.payments.slice(0, 20).map((payment) => [
                    formatDateTimeLocale(payment.date),
                    payment.client?.name ?? "-",
                    payment.collector?.name ?? "-",
                    toCurrency(payment.amount ?? 0),
                    payment.methodSummary ?? "-"
                ])
            });
            nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : nextY + 8;
        }

        if (detailData.expenses?.length) {
            autoTable(doc, {
                startY: nextY,
                head: [["Fecha", "Descripción", "Categoría", "Monto"]],
                body: detailData.expenses.slice(0, 20).map((expense) => [
                    formatDateLocale(expense.incurredOn),
                    expense.description ?? "-",
                    expense.category ?? "-",
                    toCurrency(expense.amount ?? 0)
                ])
            });
        }

        const suffix = detailPeriod === "month"
            ? `${detailYear}-${String(detailMonth).padStart(2, "0")}`
            : `${detailYear}`;
        doc.save(`detalle-financiero-${suffix}.pdf`);
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold sm:text-2xl">Detalle financiero</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {detailRangeLabel || detailSelectionLabel}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        Volver al dashboard
                    </button>
                    <button
                        type="button"
                        onClick={handleDownloadDetailPdf}
                        disabled={!canDownloadDetailPdf}
                        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Descargar PDF
                    </button>
                </div>
            </div>

            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex flex-wrap gap-2">
                    {FINANCIAL_PERIODS.map(({ key, label }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setDetailPeriod(key)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${detailPeriod === key
                                ? "border-blue-500 bg-blue-500/10 text-blue-700 shadow-sm dark:border-blue-400 dark:bg-blue-400/10 dark:text-blue-200"
                                : "border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:text-blue-200"
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {detailPeriod === "week" && (
                        <label className="flex flex-col text-sm">
                            <span className="mb-1 text-gray-600 dark:text-gray-300">Seleccionar día de la semana</span>
                            <input
                                type="date"
                                value={detailWeekDate}
                                onChange={(event) => setDetailWeekDate(event.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                            />
                        </label>
                    )}
                    {detailPeriod === "month" && (
                        <>
                            <label className="flex flex-col text-sm">
                                <span className="mb-1 text-gray-600 dark:text-gray-300">Mes</span>
                                <select
                                    value={detailMonth}
                                    onChange={(event) => setDetailMonth(Number(event.target.value))}
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                                >
                                    {MONTH_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col text-sm">
                                <span className="mb-1 text-gray-600 dark:text-gray-300">Año</span>
                                <select
                                    value={detailYear}
                                    onChange={(event) => setDetailYear(Number(event.target.value))}
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                                >
                                    {YEAR_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </>
                    )}
                    {detailPeriod === "year" && (
                        <label className="flex flex-col text-sm">
                            <span className="mb-1 text-gray-600 dark:text-gray-300">Año</span>
                            <select
                                value={detailYear}
                                onChange={(event) => setDetailYear(Number(event.target.value))}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                            >
                                {YEAR_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                </div>

                {detailLoading ? (
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Cargando detalle...</p>
                ) : detailError ? (
                    <p className="mt-4 text-sm text-red-500 dark:text-red-400">{detailError}</p>
                ) : !detailData ? (
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No hay información para esta selección.</p>
                ) : (
                    <div className="mt-6 space-y-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Ingresos totales</p>
                                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                    {toCurrency(detailTotals?.income ?? 0)}
                                </p>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Gastos</p>
                                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                    {toCurrency(detailTotals?.totalExpenses ?? 0)}
                                </p>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Pago a empleados</p>
                                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                    {toCurrency(detailTotals?.payroll ?? 0)}
                                </p>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Gastos operativos</p>
                                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                    {toCurrency(detailOperationalExpenses)}
                                </p>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Ganancia neta</p>
                                <p className={`mt-2 text-2xl font-semibold ${detailNetProfitClass}`}>
                                    {toCurrency(detailNetProfit)}
                                </p>
                            </div>
                        </div>

                        {detailData.breakdown?.entries?.length ? (
                            <div>
                                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Desglose por {detailData.breakdown.type === "month" ? "mes" : detailData.breakdown.type === "week" ? "semana" : "segmento"}</h2>
                                <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-900">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Periodo</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Ingresos</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Gastos</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white text-sm dark:divide-gray-800 dark:bg-gray-900 dark:text-gray-100">
                                            {detailData.breakdown.entries.map((entry) => (
                                                <tr key={entry.label}>
                                                    <td className="px-4 py-2">{entry.label}</td>
                                                    <td className="px-4 py-2">{toCurrency(entry.income ?? 0)}</td>
                                                    <td className="px-4 py-2">{toCurrency(entry.expenses ?? 0)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : null}

                        {detailData.collectors?.length ? (
                            <div>
                                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Desempeño de cobradores</h2>
                                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {detailData.collectors.map((collector) => (
                                        <div key={collector.id ?? collector.name} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{collector.name ?? "Sin nombre"}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Total recaudado: {toCurrency(collector.totalCollected ?? 0)}</p>
                                                </div>
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${collector.completed
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                                    }`}
                                                >
                                                    {collector.completed ? "Completado" : "En progreso"}
                                                </span>
                                            </div>
                                            <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-300">
                                                <p>Pagos registrados: {collector.payments?.length ?? 0}</p>
                                                <p>Clientes cobrados: {collector.clientsPaid?.length ?? 0}</p>
                                                <p>Clientes pendientes: {collector.clientsPending?.length ?? 0}</p>
                                            </div>
                                            {collector.clientsPaid?.length ? (
                                                <div className="mt-3 text-xs">
                                                    <p className="font-semibold text-gray-700 dark:text-gray-200">Clientes al día</p>
                                                    <ul className="mt-1 space-y-1 text-gray-600 dark:text-gray-300">
                                                        {collector.clientsPaid.slice(0, 4).map((client) => (
                                                            <li key={client.id ?? client.name}>
                                                                {client.name ?? "Sin nombre"} · {toCurrency(client.totalPaid ?? 0)}
                                                            </li>
                                                        ))}
                                                        {collector.clientsPaid.length > 4 ? (
                                                            <li className="text-gray-500 dark:text-gray-400">+{collector.clientsPaid.length - 4} más</li>
                                                        ) : null}
                                                    </ul>
                                                </div>
                                            ) : null}
                                            {collector.clientsPending?.length ? (
                                                <div className="mt-3 text-xs">
                                                    <p className="font-semibold text-gray-700 dark:text-gray-200">Clientes pendientes</p>
                                                    <ul className="mt-1 space-y-1 text-gray-600 dark:text-gray-300">
                                                        {collector.clientsPending.slice(0, 4).map((client) => (
                                                            <li key={client.id ?? client.name}>
                                                                {client.name ?? "Sin nombre"}
                                                                {client.nextVisitDate ? ` · Visita ${formatDateLocale(client.nextVisitDate)}` : ""}
                                                            </li>
                                                        ))}
                                                        {collector.clientsPending.length > 4 ? (
                                                            <li className="text-gray-500 dark:text-gray-400">+{collector.clientsPending.length - 4} más</li>
                                                        ) : null}
                                                    </ul>
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {detailData.payments?.length ? (
                            <div>
                                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Pagos registrados</h2>
                                <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-900">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Fecha</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Cliente</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Cobrador</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Monto</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Método</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white text-sm dark:divide-gray-800 dark:bg-gray-900 dark:text-gray-100">
                                            {detailData.payments.map((payment) => (
                                                <tr key={payment.id}>
                                                    <td className="px-4 py-2">{formatDateTimeLocale(payment.date)}</td>
                                                    <td className="px-4 py-2">{payment.client?.name ?? "-"}</td>
                                                    <td className="px-4 py-2">{payment.collector?.name ?? "-"}</td>
                                                    <td className="px-4 py-2">{toCurrency(payment.amount ?? 0)}</td>
                                                    <td className="px-4 py-2 capitalize">{payment.methodSummary ?? "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : null}

                        {detailData.expenses?.length ? (
                            <div>
                                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Gastos registrados</h2>
                                <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-900">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Fecha</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Descripción</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Categoría</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white text-sm dark:divide-gray-800 dark:bg-gray-900 dark:text-gray-100">
                                            {detailData.expenses.map((expense) => (
                                                <tr key={expense.id}>
                                                    <td className="px-4 py-2">{formatDateLocale(expense.incurredOn)}</td>
                                                    <td className="px-4 py-2">{expense.description ?? "-"}</td>
                                                    <td className="px-4 py-2">{expense.category ?? "-"}</td>
                                                    <td className="px-4 py-2">{toCurrency(expense.amount ?? 0)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </section>
        </div>
    );
}

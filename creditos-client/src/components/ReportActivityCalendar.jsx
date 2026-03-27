import { useEffect, useMemo, useState } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { isArgentinaHoliday } from "../utils/argentinaCalendar";

const weekDayLabels = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

const argentinaDateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

const monthLabelFormatter = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    month: "long",
    year: "numeric",
});

const fullDateFormatter = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
});

const getArgentinaDateKey = (value) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    const parts = argentinaDateFormatter.formatToParts(date);
    const mapped = Object.fromEntries(
        parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
    );

    return `${mapped.year}-${mapped.month}-${mapped.day}`;
};

const getMonthKey = (value) => {
    const dayKey = getArgentinaDateKey(value);
    return dayKey ? dayKey.slice(0, 7) : null;
};

const parseMonthKey = (monthKey) => {
    const [year, month] = monthKey.split("-").map(Number);
    return new Date(year, month - 1, 1, 12);
};

const buildMonthRange = (reports) => {
    const monthKeys = reports
        .map((report) => getMonthKey(report.fechaDeReporte))
        .filter(Boolean)
        .sort();

    const currentMonth = getMonthKey(new Date());
    if (!monthKeys.length) {
        return currentMonth ? [currentMonth] : [];
    }

    const earliest = parseMonthKey(monthKeys[0]);
    const latestBase = parseMonthKey(monthKeys[monthKeys.length - 1]);
    const currentBase = currentMonth ? parseMonthKey(currentMonth) : latestBase;
    const latest = currentBase > latestBase ? currentBase : latestBase;
    const result = [];

    const cursor = new Date(latest.getFullYear(), latest.getMonth(), 1, 12);
    while (cursor >= earliest) {
        result.push(getMonthKey(cursor));
        cursor.setMonth(cursor.getMonth() - 1);
    }

    return result.filter(Boolean);
};

const buildCalendarDays = (selectedMonth) => {
    const firstDay = parseMonthKey(selectedMonth);
    const monthIndex = firstDay.getMonth();
    const year = firstDay.getFullYear();
    const firstWeekDayIndex = (firstDay.getDay() + 6) % 7;
    const start = new Date(year, monthIndex, 1 - firstWeekDayIndex, 12);
    const lastDay = new Date(year, monthIndex + 1, 0, 12);
    const lastWeekDayIndex = (lastDay.getDay() + 6) % 7;
    const end = new Date(year, monthIndex, lastDay.getDate() + (6 - lastWeekDayIndex), 12);
    const days = [];

    const cursor = new Date(start);
    while (cursor <= end) {
        days.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    return days;
};

export default function ReportActivityCalendar({
    reports = [],
    title = "Calendario de actividad",
    darkSurface = false,
    onReportClick,
}) {
    const months = useMemo(() => buildMonthRange(reports), [reports]);
    const [selectedMonth, setSelectedMonth] = useState(months[0] || getMonthKey(new Date()));

    useEffect(() => {
        if (!months.length) return;
        if (!selectedMonth || !months.includes(selectedMonth)) {
            setSelectedMonth(months[0]);
        }
    }, [months, selectedMonth]);

    const selectedMonthIndex = months.indexOf(selectedMonth);
    const selectedMonthDate = selectedMonth ? parseMonthKey(selectedMonth) : new Date();
    const todayKey = getArgentinaDateKey(new Date());

    const reportedDays = useMemo(() => {
        const map = new Map();

        reports.forEach((report) => {
            const key = getArgentinaDateKey(report.fechaDeReporte);
            if (!key) return;
            map.set(key, report);
        });

        return map;
    }, [reports]);

    const days = useMemo(() => {
        if (!selectedMonth) return [];

        return buildCalendarDays(selectedMonth).map((date) => {
            const key = getArgentinaDateKey(date);
            const isCurrentMonth = getMonthKey(date) === selectedMonth;
            const isHoliday = isCurrentMonth ? isArgentinaHoliday(date) : false;
            let status = "outside";

            if (isCurrentMonth) {
                if (todayKey && key > todayKey) {
                    status = "future";
                } else if (isHoliday) {
                    status = "holiday";
                } else if (reportedDays.has(key)) {
                    status = "reported";
                } else {
                    status = "missing";
                }
            }

            return {
                date,
                key,
                isCurrentMonth,
                isHoliday,
                isToday: key === todayKey,
                status,
                report: reportedDays.get(key),
            };
        });
    }, [reportedDays, selectedMonth, todayKey]);

    const stats = useMemo(() => {
        return days.reduce(
            (acc, day) => {
                if (!day.isCurrentMonth) return acc;
                if (day.status === "reported") acc.reported += 1;
                if (day.status === "missing") acc.missing += 1;
                if (day.status === "holiday") acc.holidays += 1;
                if (day.status === "future") acc.future += 1;
                return acc;
            },
            { reported: 0, missing: 0, holidays: 0, future: 0 }
        );
    }, [days]);

    const surfaceClass = darkSurface
        ? "rounded-2xl border border-slate-700 bg-slate-900/80 p-4 shadow-sm sm:p-5"
        : "rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800";
    const titleClass = darkSurface
        ? "text-lg font-semibold text-slate-100"
        : "text-lg font-semibold text-gray-800 dark:text-gray-200";
    const bodyTextClass = darkSurface ? "text-sm text-slate-300" : "text-sm text-gray-500 dark:text-gray-400";
    const mutedTextClass = darkSurface ? "text-slate-400" : "text-gray-500 dark:text-gray-400";
    const buttonClass = darkSurface
        ? "rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        : "rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-700";
    const statsCardClass = darkSurface
        ? "rounded-xl border border-slate-700 bg-slate-800/70 p-3"
        : "rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/60";

    const getDayClass = (day) => {
        if (day.status === "outside") {
            return darkSurface
                ? "border-transparent bg-transparent text-slate-600"
                : "border-transparent bg-transparent text-gray-300 dark:text-gray-600";
        }

        if (day.status === "reported") {
            return darkSurface
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-700/40 dark:bg-emerald-500/10 dark:text-emerald-200";
        }

        if (day.status === "holiday") {
            return darkSurface
                ? "border-red-500/30 bg-red-500/10 text-red-100"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-700/40 dark:bg-red-500/10 dark:text-red-200";
        }

        if (day.status === "missing") {
            return darkSurface
                ? "border-slate-500/30 bg-slate-500/10 text-slate-100"
                : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700/40 dark:bg-slate-500/10 dark:text-slate-200";
        }

        return darkSurface
            ? "border-sky-500/25 bg-sky-500/10 text-sky-100"
            : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-700/40 dark:bg-sky-500/10 dark:text-sky-200";
    };

    const getStatusLabel = (day) => {
        if (day.status === "reported") return "Trabajo";
        if (day.status === "holiday") return day.report ? "Feriado trabajado" : "Feriado";
        if (day.status === "missing") return "Sin sesion";
        if (day.status === "future") return "Pendiente";
        return "";
    };

    const handleDayClick = (day) => {
        if (!day.report || typeof onReportClick !== "function") return;
        onReportClick(day.report);
    };

    return (
        <div className={surfaceClass}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className={titleClass}>{title}</h2>
                    <p className={`${bodyTextClass} mt-1`}>
                        Verde si trabajo, gris si no inicio sesion y rojo si la fecha fue feriado.
                    </p>
                    <p className={`${mutedTextClass} mt-1 text-xs`}>
                        Toca un dia verde para abrir el reporte de esa fecha.
                    </p>
                </div>

                <div className="flex items-center justify-between gap-2 sm:justify-start">
                    <button
                        type="button"
                        onClick={() => setSelectedMonth(months[selectedMonthIndex + 1])}
                        disabled={selectedMonthIndex === -1 || selectedMonthIndex >= months.length - 1}
                        className={buttonClass}
                    >
                        <HiChevronLeft className="h-5 w-5" />
                    </button>
                    <div className={`min-w-0 flex-1 text-center text-sm font-medium capitalize sm:min-w-[190px] ${darkSurface ? "text-slate-100" : "text-gray-800 dark:text-gray-100"}`}>
                        {monthLabelFormatter.format(selectedMonthDate)}
                    </div>
                    <button
                        type="button"
                        onClick={() => setSelectedMonth(months[selectedMonthIndex - 1])}
                        disabled={selectedMonthIndex <= 0}
                        className={buttonClass}
                    >
                        <HiChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className={statsCardClass}>
                    <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Dias trabajados</p>
                    <p className={`mt-1 text-2xl font-semibold ${darkSurface ? "text-emerald-200" : "text-emerald-700 dark:text-emerald-300"}`}>{stats.reported}</p>
                </div>
                <div className={statsCardClass}>
                    <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Dias sin sesion</p>
                    <p className={`mt-1 text-2xl font-semibold ${darkSurface ? "text-slate-200" : "text-slate-700 dark:text-slate-200"}`}>{stats.missing}</p>
                </div>
                <div className={statsCardClass}>
                    <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Feriados</p>
                    <p className={`mt-1 text-2xl font-semibold ${darkSurface ? "text-red-200" : "text-red-700 dark:text-red-300"}`}>{stats.holidays}</p>
                </div>
                <div className={statsCardClass}>
                    <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Dias pendientes</p>
                    <p className={`mt-1 text-2xl font-semibold ${darkSurface ? "text-slate-200" : "text-slate-700 dark:text-slate-200"}`}>{stats.future}</p>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-xs">
                <span className={`inline-flex items-center gap-2 ${mutedTextClass}`}>
                    <span className="h-3 w-3 rounded-full bg-emerald-500/80" /> Trabajo
                </span>
                <span className={`inline-flex items-center gap-2 ${mutedTextClass}`}>
                    <span className="h-3 w-3 rounded-full bg-slate-400/80" /> Sin sesion
                </span>
                <span className={`inline-flex items-center gap-2 ${mutedTextClass}`}>
                    <span className="h-3 w-3 rounded-full bg-red-500/80" /> Feriado
                </span>
                <span className={`inline-flex items-center gap-2 ${mutedTextClass}`}>
                    <span className="h-3 w-3 rounded-full bg-sky-400/80" /> Pendiente
                </span>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-700/70 bg-slate-950/30 px-3 py-2 text-[11px] text-slate-400 sm:hidden">
                <span>Desliza el calendario hacia los costados</span>
                <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-300">Scroll</span>
            </div>

            <div className="-mx-1 mt-5 overflow-x-auto px-1 pb-2 [-webkit-overflow-scrolling:touch] sm:mx-0 sm:px-0">
                <div className="min-w-[540px] snap-x snap-mandatory sm:min-w-[560px]">
                    <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium uppercase tracking-wide">
                        {weekDayLabels.map((label) => (
                            <div key={label} className={mutedTextClass}>{label}</div>
                        ))}
                    </div>

                    <div className="mt-2 grid grid-cols-7 gap-2">
                        {days.map((day) => (
                            <div
                                key={day.key}
                                title={day.isCurrentMonth ? `${fullDateFormatter.format(day.date)} - ${getStatusLabel(day)}` : undefined}
                                onClick={() => handleDayClick(day)}
                                className={`flex min-h-[86px] snap-start items-start justify-start rounded-xl border p-2 text-left ${getDayClass(day)} ${day.isToday ? "ring-2 ring-sky-400/80" : ""} ${day.report && onReportClick ? "cursor-pointer transition hover:scale-[1.02]" : ""}`}
                            >
                                <span className="text-sm font-semibold">{day.date.getDate()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
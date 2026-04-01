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
        ? "rounded-3xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-xl shadow-2xl"
        : "rounded-3xl border border-gray-200 bg-white p-6 shadow-sm";
    
    const titleStyle = { fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em", color: darkSurface ? "#fff" : "#1C1C1E" };
    const labelStyle = { fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: darkSurface ? "rgba(255,255,255,0.4)" : "#8E8E93" };

    const getDayStyle = (day) => {
        const base = {
            width: "100%", aspectRatio: "1/1", borderRadius: "12px",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            position: "relative", cursor: day.report ? "pointer" : "default",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            fontSize: "15px", fontWeight: 600,
            userSelect: "none",
        };

        if (!day.isCurrentMonth) {
            return { ...base, color: darkSurface ? "rgba(255,255,255,0.15)" : "#D1D1D6" };
        }

        let style = { ...base, color: darkSurface ? "#fff" : "#1C1C1E" };

        if (day.isToday) {
            style = { ...style, background: "var(--ios-blue)", color: "#fff", borderRadius: "50%" };
        } else if (day.status === "reported") {
            style = { 
                ...style, 
                color: "#34C759", 
                background: darkSurface ? "rgba(52,199,89,0.15)" : "rgba(52,199,89,0.08)",
                border: darkSurface ? "1px solid rgba(52,199,89,0.2)" : "1px solid rgba(52,199,89,0.1)"
            };
        } else if (day.isHoliday) {
            style = { ...style, color: "#FF3B30" };
        }

        return style;
    };

    const handleDayClick = (day) => {
        if (!day.report || typeof onReportClick !== "function") return;
        onReportClick(day.report);
    };

    return (
        <div className={surfaceClass}>
            {/* Header Estilo Apple */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                <h3 style={titleStyle}>{title}</h3>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: darkSurface ? "rgba(255,255,255,0.08)" : "#f2f2f7",
                    padding: "4px",
                    borderRadius: "12px",
                    maxWidth: "240px"
                }}>
                    <button
                        onClick={() => setSelectedMonth(months[selectedMonthIndex + 1])}
                        disabled={selectedMonthIndex === -1 || selectedMonthIndex >= months.length - 1}
                        style={{ padding: "8px", border: "none", background: "none", cursor: "pointer", color: "var(--ios-blue)" }}
                    >
                        <HiChevronLeft size={22} />
                    </button>
                    <span style={{ fontSize: "14px", fontWeight: 700, minWidth: "120px", textAlign: "center", color: darkSurface ? "#fff" : "#1C1C1E" }}>
                        {monthLabelFormatter.format(selectedMonthDate)}
                    </span>
                    <button
                        onClick={() => setSelectedMonth(months[selectedMonthIndex - 1])}
                        disabled={selectedMonthIndex <= 0}
                        style={{ padding: "8px", border: "none", background: "none", cursor: "pointer", color: "var(--ios-blue)" }}
                    >
                        <HiChevronRight size={22} />
                    </button>
                </div>
            </div>

            {/* KPIs Compactos */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px", marginBottom: "24px" }}>
                {[
                    { l: "Días trabajados", v: stats.reported, c: "#34C759", bg: "rgba(52,199,89,0.1)" },
                    { l: "Sin sesión", v: stats.missing, c: "#8E8E93", bg: "rgba(142,142,147,0.1)" },
                    { l: "Feriados", v: stats.holidays, c: "#FF3B30", bg: "rgba(255,59,48,0.1)" },
                ].map(s => (
                    <div key={s.l} style={{ padding: "12px", borderRadius: "16px", background: darkSurface ? "rgba(255,255,255,0.05)" : "#F2F2F7", textAlign: "center" }}>
                        <p style={{ ...labelStyle, fontSize: "9px", marginBottom: "4px" }}>{s.l}</p>
                        <p style={{ fontSize: "20px", fontWeight: 800, color: s.c }}>{s.v}</p>
                    </div>
                ))}
            </div>

            {/* Grid de Calendario */}
            <div style={{ padding: "0 4px", maxWidth: "600px", margin: "0 auto" }}>
                {/* Días semana */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "12px", opacity: 0.6 }}>
                    {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                        <div key={`${d}-${i}`} style={{ textAlign: "center", fontSize: "11px", fontWeight: 700, color: darkSurface ? "#fff" : "#1C1C1E" }}>{d}</div>
                    ))}
                </div>

                {/* Días del mes */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                    {days.map(day => (
                        <div
                            key={day.key}
                            onClick={() => handleDayClick(day)}
                            style={{
                                ...getDayStyle(day),
                                maxWidth: window.innerWidth > 640 ? "70px" : "none",
                                maxHeight: window.innerWidth > 640 ? "70px" : "none",
                            }}
                            onMouseEnter={e => { if (day.report) e.currentTarget.style.transform = "scale(1.1)"; }}
                            onMouseLeave={e => { if (day.report) e.currentTarget.style.transform = "scale(1)"; }}
                        >
                            {day.date.getDate()}
                            
                            {/* Indicador de Feriado Trabajado */}
                            {day.isCurrentMonth && day.isHoliday && day.report && (
                                <div style={{ 
                                    width: "4px", height: "4px", borderRadius: "50%", 
                                    background: "#FF3B30", position: "absolute", bottom: "6px" 
                                }} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <p style={{ marginTop: "20px", fontSize: "11px", color: darkSurface ? "rgba(255,255,255,0.4)" : "#8E8E93", textAlign: "center" }}>
                {darkSurface ? "Punto verde: Día con reporte. Toca un número para ver detalle." : "Toca un día con reporte para ver el detalle."}
            </p>
        </div>
    );
}
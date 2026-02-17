import {
    HiExclamation,
    HiCheckCircle,
    HiClock,
    HiFlag,
    HiLocationMarker,
} from "react-icons/hi";
import { formatMessageContent } from "../../utils/messageFormatter";

const PALETTE = {
    neutral: {
        shell: "bg-white dark:bg-slate-900/70",
        border: "border-slate-200 dark:border-slate-700",
        text: "text-slate-800 dark:text-slate-100",
        chip: "bg-slate-700",
        icon: "text-slate-500 dark:text-slate-300",
        accent: "before:bg-slate-400 dark:before:bg-slate-500",
    },
    warning: {
        shell: "bg-amber-50/40 dark:bg-amber-950/25",
        border: "border-amber-300/60 dark:border-amber-700",
        text: "text-amber-900 dark:text-amber-200",
        chip: "bg-amber-700",
        icon: "text-amber-600 dark:text-amber-300",
        accent: "before:bg-amber-500 dark:before:bg-amber-400",
    },
    danger: {
        shell: "bg-rose-50/45 dark:bg-rose-950/25",
        border: "border-rose-300/60 dark:border-rose-700",
        text: "text-rose-900 dark:text-rose-200",
        chip: "bg-rose-700",
        icon: "text-rose-600 dark:text-rose-300",
        accent: "before:bg-rose-500 dark:before:bg-rose-400",
    },
    info: {
        shell: "bg-indigo-50/45 dark:bg-indigo-950/25",
        border: "border-indigo-300/60 dark:border-indigo-700",
        text: "text-indigo-900 dark:text-indigo-200",
        chip: "bg-indigo-700",
        icon: "text-indigo-600 dark:text-indigo-300",
        accent: "before:bg-indigo-500 dark:before:bg-indigo-400",
    },
    success: {
        shell: "bg-emerald-50/45 dark:bg-emerald-950/25",
        border: "border-emerald-300/60 dark:border-emerald-700",
        text: "text-emerald-900 dark:text-emerald-200",
        chip: "bg-emerald-700",
        icon: "text-emerald-600 dark:text-emerald-300",
        accent: "before:bg-emerald-500 dark:before:bg-emerald-400",
    },
};

const MESSAGE_META = {
    PAGO: { palette: "success", icon: HiCheckCircle },
    VENCIMIENTO: { palette: "warning", icon: HiClock },
    IMPAGO: { palette: "danger", icon: HiExclamation },
    TRAYECTO_INICIADO: { palette: "info", icon: HiLocationMarker },
    TRAYECTO_FINALIZADO: { palette: "neutral", icon: HiFlag },
    DEFAULT: { palette: "neutral", icon: HiExclamation },
};

function formatDateTime(value) {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.toLocaleDateString("es-AR")} ${date.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
    })}`;
}

export default function MessageCard({ message }) {
    const type = (message?.tipo || "").toUpperCase();
    const meta = MESSAGE_META[type] || MESSAGE_META.DEFAULT;
    const palette = PALETTE[meta.palette] || PALETTE.neutral;
    const Icon = meta.icon;
    const showImportantBadge = Boolean(message?.importante) && type !== "PAGO";

    return (
        <div
            className={`relative flex items-start justify-between gap-2 overflow-hidden rounded-xl border p-3 pl-4 shadow-sm before:absolute before:inset-y-0 before:left-0 before:w-1 ${palette.shell} ${palette.border} ${palette.text} ${palette.accent}`}
        >
            <div className="flex min-w-0 items-start gap-3">
                <div className={`mt-0.5 ${palette.icon}`}>
                    <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                    <p className="text-[13px] font-medium leading-5 sm:text-sm whitespace-pre-line">
                        {formatMessageContent(message?.contenido)}
                    </p>
                    {message?.client?.name && (
                        <p className="mt-1 text-[11px] sm:text-xs opacity-80">Cliente: {message.client.name}</p>
                    )}
                    <p className="mt-1 text-[11px] sm:text-xs opacity-70">{formatDateTime(message?.fechaDate || message?.fecha)}</p>
                </div>
            </div>

            {showImportantBadge && (
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white ${palette.chip}`}>
                    Importante
                </span>
            )}
        </div>
    );
}

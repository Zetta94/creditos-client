import { useEffect } from "react";

export default function Toast({ message, type = "info", confirm, onConfirm, onCancel, onClose }) {
    useEffect(() => {
        if (confirm) return;
        const t = setTimeout(onClose, 3000);
        return () => clearTimeout(t);
    }, [onClose, confirm]);

    const base =
        "fixed z-[9999] left-1/2 top-5 -translate-x-1/2 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm sm:text-base font-medium transition-all duration-300";

    const styles = {
        success: "bg-green-600 text-white dark:bg-green-500",
        error: "bg-red-600 text-white dark:bg-red-500",
        info: "bg-blue-600 text-white dark:bg-blue-500",
    };

    if (confirm) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-4" role="alertdialog" aria-modal="true">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-center text-base font-semibold text-slate-900 dark:text-slate-100">{message}</p>
                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                        <button
                            onClick={() => {
                                onConfirm?.();
                                onClose();
                            }}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                        >
                            Confirmar
                        </button>
                        <button
                            onClick={onCancel || onClose}
                            className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${base} ${styles[type]} max-w-[90%] sm:max-w-sm animate-slide-up`} role="alert">
            <span className="truncate text-center sm:text-left">{message}</span>
        </div>
    );
}

import { useEffect } from "react";

export default function Toast({ message, type = "info", confirm, onConfirm, onCancel, onClose }) {
    useEffect(() => {
        if (confirm) return;
        const t = setTimeout(onClose, 3000);
        return () => clearTimeout(t);
    }, [onClose, confirm]);

    const base =
        "fixed z-[9999] left-1/2 -translate-x-1/2 bottom-6 sm:bottom-8 flex flex-col sm:flex-row items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm sm:text-base font-medium transition-all duration-300";

    const styles = {
        success: "bg-green-600 text-white dark:bg-green-500",
        error: "bg-red-600 text-white dark:bg-red-500",
        info: "bg-blue-600 text-white dark:bg-blue-500",
    };

    return (
        <div
            className={`${base} ${styles[type]} max-w-[90%] sm:max-w-sm animate-slide-up`}
            role="alert"
        >
            <span className="truncate text-center sm:text-left">{message}</span>

            {confirm && (
                <div className="flex gap-2 mt-3 sm:mt-0">
                    <button
                        onClick={() => {
                            onConfirm?.();
                            onClose();
                        }}
                        className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-md text-xs sm:text-sm"
                    >
                        Confirmar
                    </button>
                    <button
                        onClick={onCancel || onClose}
                        className="bg-black/20 hover:bg-black/30 text-white px-3 py-1 rounded-md text-xs sm:text-sm"
                    >
                        Cancelar
                    </button>
                </div>
            )}
        </div>
    );
}

import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function Pagination({
    page = 1,
    pageSize = 10,
    totalItems = 0,
    totalPages = 1,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS
}) {
    const safePage = Math.max(1, Math.min(page || 1, totalPages || 1));
    const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const endItem = totalItems === 0 ? 0 : Math.min(totalItems, safePage * pageSize);

    const handlePrev = () => {
        if (safePage > 1 && onPageChange) {
            onPageChange(safePage - 1);
        }
    };

    const handleNext = () => {
        if (safePage < totalPages && onPageChange) {
            onPageChange(safePage + 1);
        }
    };

    const handlePageSizeChange = (evt) => {
        if (onPageSizeChange) {
            const nextSize = Number(evt.target.value) || pageSize;
            onPageSizeChange(nextSize);
        }
    };

    return (
        <div className="flex w-full flex-col gap-3 rounded-2xl border border-slate-700/70 bg-slate-950/20 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-300">
                Mostrando {startItem}-{endItem} de {totalItems} registros
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                {onPageSizeChange && (
                    <label className="flex items-center justify-between gap-2 text-sm text-slate-300 sm:justify-start">
                        Filas por página
                        <select
                            value={pageSize}
                            onChange={handlePageSizeChange}
                            className="h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/20"
                        >
                            {pageSizeOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex sm:items-center">
                    <button
                        type="button"
                        onClick={handlePrev}
                        disabled={safePage <= 1}
                        className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <HiChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Anterior</span>
                    </button>

                    <span className="min-w-[110px] text-center text-sm text-slate-300">
                        Página {safePage} de {totalPages || 1}
                    </span>

                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={safePage >= totalPages}
                        className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <span className="hidden sm:inline">Siguiente</span>
                        <HiChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

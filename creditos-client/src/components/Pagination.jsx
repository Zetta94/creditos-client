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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
            <div className="text-sm text-gray-600 dark:text-gray-300">
                Mostrando {startItem}-{endItem} de {totalItems} registros
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                {onPageSizeChange && (
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        Filas por página
                        <select
                            value={pageSize}
                            onChange={handlePageSizeChange}
                            className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        >
                            {pageSizeOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handlePrev}
                        disabled={safePage <= 1}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    >
                        <HiChevronLeft className="h-4 w-4" />
                        Anterior
                    </button>

                    <span className="min-w-[110px] text-center text-sm text-gray-600 dark:text-gray-300">
                        Página {safePage} de {totalPages || 1}
                    </span>

                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={safePage >= totalPages}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    >
                        Siguiente
                        <HiChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

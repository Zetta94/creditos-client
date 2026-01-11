import { useEffect, useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { HiChevronLeft, HiChevronRight, HiArrowsUpDown } from "react-icons/hi2";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { loadAssignments } from "../store/assignmentsSlice";
import { reorderAssignments as reorderAssignmentsService } from "../services/assignmentsService";

export default function OrdenClientes({ cobradorId }) {
    const dispatch = useDispatch();
    const { list: allAssignments, loading } = useSelector(state => state.assignments || { list: [], loading: false });
    const [clientes, setClientes] = useState([]);
    const [pagina, setPagina] = useState(1);
    const [guardando, setGuardando] = useState(false);
    const [editando, setEditando] = useState(false);
    const porPagina = 10;

    // 🔹 Cargar asignaciones del backend
    useEffect(() => {
        dispatch(loadAssignments());
    }, [dispatch]);

    // 🔹 Obtener todos los clientes asociados al cobrador
    const todosAsignados = useMemo(() => {
        return allAssignments
            .filter((a) => a.user?.id === cobradorId)
            .sort((a, b) => a.orden - b.orden)
            .map((a) => ({
                assignmentId: a.id,
                id: a.client?.id,
                nombre: a.client?.name,
                tipoPago: a.tipoPago,
                orden: a.orden,
            }))
            .filter(a => a.id);
    }, [allAssignments, cobradorId]);

    const totalPaginas = Math.max(1, Math.ceil(todosAsignados.length / porPagina));

    // 🔹 Cada vez que cambia la página o los datos, recortamos la vista
    useEffect(() => {
        const start = (pagina - 1) * porPagina;
        const end = start + porPagina;
        setClientes(todosAsignados.slice(start, end));
    }, [pagina, todosAsignados]);

    // 🔹 Cambiar orden local (Drag & Drop)
    function handleDragEnd(result) {
        if (!result.destination) return;
        const reordered = Array.from(clientes);
        const [moved] = reordered.splice(result.source.index, 1);
        reordered.splice(result.destination.index, 0, moved);

        // Reasignamos orden global correcto (según página)
        const actualizados = reordered.map((c, i) => ({
            ...c,
            orden: (pagina - 1) * porPagina + (i + 1),
        }));
        setClientes(actualizados);
    }

    // 🔹 Guardar cambios en el backend
    async function guardarOrden() {
        try {
            setGuardando(true);

            // Preparar datos para enviar al backend
            const assignmentsToUpdate = clientes.map((c) => ({
                id: c.assignmentId,
                orden: c.orden
            }));

            await reorderAssignmentsService(assignmentsToUpdate);

            // Recargar asignaciones
            dispatch(loadAssignments());

            toast.success("Orden guardada correctamente!");
            setEditando(false);
        } catch (error) {
            console.error("Error guardando orden:", error);
            toast.error(error.response?.data?.message || "Error al guardar el orden");
        } finally {
            setGuardando(false);
        }
    }

    return (
        <div className="p-4 sm:p-6">
            {/* === Encabezado === */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 text-center sm:text-left">
                    Ordenar clientes asignados
                </h2>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {/* 🔹 Modo edición */}
                    <button
                        onClick={() => setEditando((e) => !e)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${editando
                            ? "bg-yellow-500 hover:bg-yellow-400 text-white"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                            }`}
                    >
                        <HiArrowsUpDown className="inline-block mr-1" />
                        {editando ? "Cancelar edición" : "Editar orden"}
                    </button>

                    {editando && (
                        <button
                            onClick={guardarOrden}
                            disabled={guardando}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
                        >
                            {guardando ? "Guardando..." : "Guardar"}
                        </button>
                    )}
                </div>
            </div>

            {/* === Lista Drag & Drop === */}
            {clientes.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400">
                    No hay clientes asignados a este cobrador.
                </p>
            ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="clientes">
                        {(provided) => (
                            <ul
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="space-y-3"
                            >
                                {clientes.map((c, index) => (
                                    <Draggable
                                        key={c.id}
                                        draggableId={String(c.id)}
                                        index={index}
                                        isDragDisabled={!editando}
                                    >
                                        {(provided, snapshot) => (
                                            <li
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...(editando ? provided.dragHandleProps : {})}
                                                className={`rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm p-3 sm:p-4 transition ${snapshot.isDragging
                                                    ? "bg-blue-50 dark:bg-gray-700"
                                                    : ""
                                                    }`}
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="space-y-1 sm:space-y-0">
                                                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base break-words">
                                                            {index + 1 + (pagina - 1) * porPagina}.{" "}
                                                            {c.nombre}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {c.tipoPago?.toUpperCase()} — ID: {c.id}
                                                        </p>
                                                    </div>

                                                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 sm:mt-0">
                                                        Orden: {c.orden}
                                                    </span>
                                                </div>
                                            </li>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </ul>
                        )}
                    </Droppable>
                </DragDropContext>
            )}

            {/* === Paginación === */}
            {totalPaginas > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPagina((p) => Math.max(1, p - 1))}
                            disabled={pagina === 1}
                            className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        >
                            <HiChevronLeft /> Anterior
                        </button>

                        <button
                            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                            disabled={pagina === totalPaginas}
                            className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        >
                            Siguiente <HiChevronRight />
                        </button>
                    </div>

                    <span className="text-sm text-gray-600 dark:text-gray-300">
                        Página {pagina} de {totalPaginas}
                    </span>
                </div>
            )}
        </div>
    );
}

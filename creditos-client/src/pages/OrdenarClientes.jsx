import { useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { HiArrowsUpDown } from "react-icons/hi2";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { loadAssignments } from "../store/assignmentsSlice";
import { reorderAssignments as reorderAssignmentsService } from "../services/assignmentsService";

const TODAY_BASE_ORDER = 1000;
const TOMORROW_BASE_ORDER = 2000;

const toDateKey = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const moveItem = (list, fromIndex, toIndex) => {
    const cloned = Array.from(list);
    const [moved] = cloned.splice(fromIndex, 1);
    cloned.splice(toIndex, 0, moved);
    return cloned;
};

function AssignmentOrderList({
    title,
    subtitle,
    droppableId,
    items,
    editable,
    saving,
    onDragEnd,
    onSave,
}) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
                </div>
                {editable && (
                    <button
                        onClick={onSave}
                        disabled={saving || items.length === 0}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-60"
                    >
                        {saving ? "Guardando..." : "Guardar orden"}
                    </button>
                )}
            </div>

            {items.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Sin asignaciones para este dia.</p>
            ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId={droppableId}>
                        {(provided) => (
                            <ul ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                                {items.map((item, index) => (
                                    <Draggable
                                        key={`${droppableId}-${item.assignmentId}`}
                                        draggableId={`${droppableId}-${item.assignmentId}`}
                                        index={index}
                                        isDragDisabled={!editable}
                                    >
                                        {(dragProvided, snapshot) => (
                                            <li
                                                ref={dragProvided.innerRef}
                                                {...dragProvided.draggableProps}
                                                {...(editable ? dragProvided.dragHandleProps : {})}
                                                className={`rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40 ${snapshot.isDragging ? "ring-2 ring-blue-400" : ""}`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {index + 1}. {item.nombre}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {item.tipoPago?.toUpperCase()} - Proxima visita: {item.nextVisitDate ? new Date(item.nextVisitDate).toLocaleDateString("es-AR") : "-"}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">Orden actual: {item.orden}</span>
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
        </div>
    );
}

export default function OrdenClientes({ cobradorId }) {
    const dispatch = useDispatch();
    const { list: allAssignments } = useSelector((state) => state.assignments || { list: [] });

    const [editando, setEditando] = useState(false);
    const [guardandoHoy, setGuardandoHoy] = useState(false);
    const [guardandoManana, setGuardandoManana] = useState(false);
    const [clientesHoy, setClientesHoy] = useState([]);
    const [clientesManana, setClientesManana] = useState([]);

    useEffect(() => {
        dispatch(loadAssignments({ cobradorId }));
    }, [dispatch, cobradorId]);

    const { listaHoy, listaManana } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayKey = toDateKey(today);
        const tomorrowKey = toDateKey(tomorrow);

        const source = allAssignments
            .filter((a) => a.user?.id === cobradorId)
            .map((a) => ({
                assignmentId: a.id,
                id: a.client?.id,
                nombre: a.client?.name,
                tipoPago: a.tipoPago,
                orden: a.orden,
                nextVisitDate: a.nextVisitDate,
            }))
            .filter((a) => a.id);

        const hoy = source
            .filter((a) => toDateKey(a.nextVisitDate) === todayKey)
            .sort((a, b) => a.orden - b.orden);

        const manana = source
            .filter((a) => toDateKey(a.nextVisitDate) === tomorrowKey)
            .sort((a, b) => a.orden - b.orden);

        return { listaHoy: hoy, listaManana: manana };
    }, [allAssignments, cobradorId]);

    useEffect(() => {
        setClientesHoy(listaHoy);
    }, [listaHoy]);

    useEffect(() => {
        setClientesManana(listaManana);
    }, [listaManana]);

    const onDragEndHoy = (result) => {
        if (!result.destination) return;
        setClientesHoy((prev) => moveItem(prev, result.source.index, result.destination.index));
    };

    const onDragEndManana = (result) => {
        if (!result.destination) return;
        setClientesManana((prev) => moveItem(prev, result.source.index, result.destination.index));
    };

    const guardarHoy = async () => {
        try {
            setGuardandoHoy(true);
            const payload = clientesHoy.map((c, idx) => ({
                id: c.assignmentId,
                orden: TODAY_BASE_ORDER + idx + 1,
            }));
            if (payload.length) {
                await reorderAssignmentsService(payload);
                await dispatch(loadAssignments({ cobradorId }));
                toast.success("Orden de hoy guardado");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Error al guardar orden de hoy");
        } finally {
            setGuardandoHoy(false);
        }
    };

    const guardarManana = async () => {
        try {
            setGuardandoManana(true);
            const payload = clientesManana.map((c, idx) => ({
                id: c.assignmentId,
                orden: TOMORROW_BASE_ORDER + idx + 1,
            }));
            if (payload.length) {
                await reorderAssignmentsService(payload);
                await dispatch(loadAssignments({ cobradorId }));
                toast.success("Orden de manana guardado");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Error al guardar orden de manana");
        } finally {
            setGuardandoManana(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                        Ordenar clientes asignados
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        El orden se administra por separado para hoy y manana.
                    </p>
                </div>

                <button
                    onClick={() => setEditando((e) => !e)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${editando
                        ? "bg-yellow-500 hover:bg-yellow-400 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                        }`}
                >
                    <HiArrowsUpDown className="inline-block mr-1" />
                    {editando ? "Salir de edicion" : "Editar orden"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <AssignmentOrderList
                    title="Ruta de hoy"
                    subtitle="Solo clientes con visita programada para hoy"
                    droppableId="hoy"
                    items={clientesHoy}
                    editable={editando}
                    saving={guardandoHoy}
                    onDragEnd={onDragEndHoy}
                    onSave={guardarHoy}
                />

                <AssignmentOrderList
                    title="Ruta de manana"
                    subtitle="Clientes que se visitan manana"
                    droppableId="manana"
                    items={clientesManana}
                    editable={editando}
                    saving={guardandoManana}
                    onDragEnd={onDragEndManana}
                    onSave={guardarManana}
                />
            </div>
        </div>
    );
}

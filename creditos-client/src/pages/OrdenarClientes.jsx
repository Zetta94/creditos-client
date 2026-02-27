import { useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { HiArrowsUpDown } from "react-icons/hi2";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { loadAssignments } from "../store/assignmentsSlice";
import { reorderAssignments as reorderAssignmentsService } from "../services/assignmentsService";
import { fetchUsers } from "../services/usersService";

const TODAY_BASE_ORDER = 1000;

const toDateKey = (value) => {
    if (!value) return null;
    if (typeof value === "string") {
        const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
        if (match) return match[1];
    }
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

const moveItemToPosition = (list, assignmentId, targetPosition) => {
    const fromIndex = list.findIndex((item) => item.assignmentId === assignmentId);
    if (fromIndex < 0) return list;
    const safeTargetIndex = Math.max(0, Math.min(list.length - 1, targetPosition - 1));
    if (fromIndex === safeTargetIndex) return list;
    return moveItem(list, fromIndex, safeTargetIndex);
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
    onMoveToPosition,
}) {
    const [positionByItemId, setPositionByItemId] = useState({});
    const [search, setSearch] = useState("");

    const searchValue = search.trim().toLowerCase();
    const displayedItems = searchValue
        ? items.filter((item) => String(item.nombre || "").toLowerCase().includes(searchValue))
        : items;
    const dragEnabled = editable && !searchValue;

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

            <div className="mb-3">
                <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar cliente..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Mostrando {displayedItems.length} de {items.length} clientes.
                    {searchValue ? " Para arrastrar, limpia la búsqueda." : ""}
                </p>
            </div>

            {displayedItems.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Sin asignaciones para este dia.</p>
            ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId={droppableId}>
                        {(provided) => (
                            <ul ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                                {displayedItems.map((item, index) => (
                                    <Draggable
                                        key={`${droppableId}-${item.assignmentId}`}
                                        draggableId={`${droppableId}-${item.assignmentId}`}
                                        index={index}
                                        isDragDisabled={!dragEnabled}
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
                                                {editable && (
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={items.length}
                                                            value={positionByItemId[item.assignmentId] ?? ""}
                                                            onChange={(event) =>
                                                                setPositionByItemId((prev) => ({
                                                                    ...prev,
                                                                    [item.assignmentId]: event.target.value
                                                                }))
                                                            }
                                                            onKeyDown={(event) => {
                                                                if (event.key !== "Enter") return;
                                                                const rawValue = Number(positionByItemId[item.assignmentId]);
                                                                if (!Number.isFinite(rawValue)) return;
                                                                onMoveToPosition(item.assignmentId, rawValue);
                                                                setPositionByItemId((prev) => ({
                                                                    ...prev,
                                                                    [item.assignmentId]: ""
                                                                }));
                                                            }}
                                                            placeholder="Mover a..."
                                                            className="w-28 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const rawValue = Number(positionByItemId[item.assignmentId]);
                                                                if (!Number.isFinite(rawValue)) return;
                                                                onMoveToPosition(item.assignmentId, rawValue);
                                                                setPositionByItemId((prev) => ({
                                                                    ...prev,
                                                                    [item.assignmentId]: ""
                                                                }));
                                                            }}
                                                            className="rounded-md bg-slate-700 px-2 py-1 text-xs text-white hover:bg-slate-600"
                                                        >
                                                            Ir
                                                        </button>
                                                    </div>
                                                )}
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

    const [collectors, setCollectors] = useState([]);
    const [loadingCollectors, setLoadingCollectors] = useState(false);
    const [selectedCobradorId, setSelectedCobradorId] = useState(cobradorId || "");

    const [editando, setEditando] = useState(false);
    const [guardandoHoy, setGuardandoHoy] = useState(false);

    const [clientesHoy, setClientesHoy] = useState([]);

    useEffect(() => {
        let active = true;
        const run = async () => {
            try {
                setLoadingCollectors(true);
                const response = await fetchUsers({ page: 1, pageSize: 500 });
                const users = Array.isArray(response?.data?.data) ? response.data.data : [];
                const available = users.filter((user) => {
                    const role = String(user?.role || "").toUpperCase();
                    return role === "COBRADOR" || role === "EMPLOYEE";
                });
                if (!active) return;
                setCollectors(available);
                setSelectedCobradorId((prev) => {
                    if (prev && available.some((item) => item.id === prev)) return prev;
                    return available[0]?.id || "";
                });
            } catch {
                if (!active) return;
                setCollectors([]);
                setSelectedCobradorId("");
                toast.error("No se pudo cargar la lista de cobradores");
            } finally {
                if (active) setLoadingCollectors(false);
            }
        };

        run();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!selectedCobradorId) return;
        dispatch(loadAssignments({ cobradorId: selectedCobradorId, pageSize: 1000 }));
    }, [dispatch, selectedCobradorId]);

    const { listaHoy } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayKey = toDateKey(today);

        const source = allAssignments
            .filter((a) => a.user?.id === selectedCobradorId)
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

        return { listaHoy: hoy };
    }, [allAssignments, selectedCobradorId]);

    useEffect(() => {
        setClientesHoy(listaHoy);
    }, [listaHoy]);

    const onDragEndHoy = (result) => {
        if (!result.destination) return;
        setClientesHoy((prev) => moveItem(prev, result.source.index, result.destination.index));
    };

    const moverHoyAPosicion = (assignmentId, position) => {
        setClientesHoy((prev) => moveItemToPosition(prev, assignmentId, position));
    };

    const refreshAssignments = async () => {
        await dispatch(loadAssignments({ cobradorId: selectedCobradorId, pageSize: 1000 }));
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
                await refreshAssignments();
                toast.success("Orden de hoy guardado");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Error al guardar orden de hoy");
        } finally {
            setGuardandoHoy(false);
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
                        Ordena la ruta completa de hoy.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Total asignados del cobrador para hoy: {clientesHoy.length}
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

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 p-4">
                <label className="text-xs text-gray-500 dark:text-gray-400">Cobrador</label>
                <select
                    value={selectedCobradorId}
                    onChange={(event) => setSelectedCobradorId(event.target.value)}
                    disabled={loadingCollectors || collectors.length === 0}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                    {collectors.length === 0 ? (
                        <option value="">{loadingCollectors ? "Cargando cobradores..." : "Sin cobradores disponibles"}</option>
                    ) : (
                        collectors.map((collector) => (
                            <option key={collector.id} value={collector.id}>
                                {collector.name}
                            </option>
                        ))
                    )}
                </select>
            </div>

            <AssignmentOrderList
                title="Ruta de hoy"
                subtitle="Todos los clientes con visita programada para hoy"
                droppableId="hoy"
                items={clientesHoy}
                editable={editando}
                saving={guardandoHoy}
                onDragEnd={onDragEndHoy}
                onSave={guardarHoy}
                onMoveToPosition={moverHoyAPosicion}
            />
        </div>
    );
}

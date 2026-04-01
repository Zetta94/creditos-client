import { useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { HiArrowsUpDown } from "react-icons/hi2";
import { HiSearch } from "react-icons/hi";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { loadAssignments } from "../store/assignmentsSlice";
import { fetchAssignmentsEnriched, reorderAssignments as reorderAssignmentsService } from "../services/assignmentsService";
import { fetchUsers } from "../services/usersService";

const TODAY_BASE_ORDER = 1000;
const CREDIT_TYPE_LABELS = {
  DAILY: "DIARIO", WEEKLY: "SEMANAL", QUINCENAL: "QUINCENAL",
  MONTHLY: "MENSUAL", ONE_TIME: "ÚNICO",
};

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

const inputStyle = {
  height: "40px", padding: "0 12px", borderRadius: "10px",
  border: "1.5px solid var(--ios-sep-opaque)", background: "var(--ios-fill)",
  fontSize: "14px", color: "var(--ios-label)", outline: "none",
  fontFamily: "inherit", transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
  WebkitAppearance: "none", appearance: "none", width: "100%",
};
const onFocus = e => { e.target.style.borderColor = "var(--ios-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; e.target.style.background = "#fff"; };
const onBlur = e => { e.target.style.borderColor = "var(--ios-sep-opaque)"; e.target.style.boxShadow = "none"; e.target.style.background = "var(--ios-fill)"; };

function AssignmentOrderList({ title, subtitle, droppableId, items, editable, saving, onDragEnd, onSave, onMoveToPosition }) {
  const [positionByItemId, setPositionByItemId] = useState({});
  const [search, setSearch] = useState("");

  const searchValue = search.trim().toLowerCase();
  const displayedItems = searchValue
    ? items.filter((item) => String(item.nombre || "").toLowerCase().includes(searchValue))
    : items;
  const dragEnabled = editable && !searchValue;

  return (
    <div className="ios-card" style={{ padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px", gap: "12px" }}>
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ios-label)", margin: "0 0 2px" }}>{title}</h3>
          <p style={{ fontSize: "12px", color: "var(--ios-label-ter)", margin: 0 }}>{subtitle}</p>
        </div>
        {editable && (
          <button
            onClick={onSave}
            disabled={saving || items.length === 0}
            style={{
              padding: "8px 16px", borderRadius: "10px", border: "none",
              background: saving || items.length === 0 ? "var(--ios-fill)" : "var(--ios-blue)",
              color: saving || items.length === 0 ? "var(--ios-label-ter)" : "#fff",
              fontSize: "13px", fontWeight: 700, cursor: saving || items.length === 0 ? "not-allowed" : "pointer",
              transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            {saving ? "Guardando..." : "Guardar orden"}
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "12px" }}>
        <HiSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "15px", height: "15px", color: "var(--ios-label-ter)", pointerEvents: "none" }} />
        <input
          type="text" value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente..."
          style={{ ...inputStyle, paddingLeft: "36px" }}
          onFocus={onFocus} onBlur={onBlur}
        />
      </div>
      <p style={{ fontSize: "12px", color: "var(--ios-label-ter)", margin: "0 0 12px" }}>
        Mostrando {displayedItems.length} de {items.length} clientes
        {searchValue ? " · Para arrastrar, limpiá la búsqueda." : ""}
      </p>

      {displayedItems.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px", color: "var(--ios-label-ter)", fontSize: "14px" }}>
          Sin asignaciones para este día.
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId={droppableId}>
            {(provided) => (
              <ul ref={provided.innerRef} {...provided.droppableProps} style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
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
                        style={{
                          borderRadius: "20px",
                          border: snapshot.isDragging ? "2px solid var(--ios-blue)" : "1.5px solid var(--ios-sep-opaque)",
                          background: snapshot.isDragging ? "#fff" : "var(--ios-bg-card)",
                          padding: "16px",
                          transition: snapshot.isDragging ? "none" : "border-color 0.15s, background 0.15s, box-shadow 0.15s",
                          boxShadow: snapshot.isDragging 
                            ? "0 15px 30px -5px rgba(0,122,255,0.3)" 
                            : "var(--ios-shadow-sm)",
                          userSelect: "none",
                          marginBottom: "8px",
                          ...dragProvided.draggableProps.style,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
                            <div style={{ 
                              width: "32px", height: "32px", borderRadius: "10px", 
                              background: "rgba(0,122,255,0.1)", color: "var(--ios-blue)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "13px", fontWeight: 800, flexShrink: 0
                            }}>
                              {index + 1}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--ios-label)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {item.nombre}
                              </p>
                              <p style={{ fontSize: "12px", color: "var(--ios-label-ter)", margin: 0 }}>
                                <span style={{ color: "var(--ios-blue)", fontWeight: 600 }}>{String(item.tipoPagoReal || item.tipoPago || "-").toUpperCase()}</span> · Próxima visita: {item.nextVisitDate ? new Date(item.nextVisitDate).toLocaleDateString("es-AR") : "-"}
                              </p>
                            </div>
                          </div>
                          {editable && (
                            <div style={{ 
                              width: "24px", height: "24px", borderRadius: "6px", 
                              background: "var(--ios-fill)", display: "flex", flexDirection: "column", 
                              gap: "2px", alignItems: "center", justifyContent: "center", opacity: 0.5 
                            }}>
                              <div style={{ width: "12px", height: "2px", background: "var(--ios-label-ter)", borderRadius: "1px" }}></div>
                              <div style={{ width: "12px", height: "2px", background: "var(--ios-label-ter)", borderRadius: "1px" }}></div>
                              <div style={{ width: "12px", height: "2px", background: "var(--ios-label-ter)", borderRadius: "1px" }}></div>
                            </div>
                          )}
                        </div>
                        {editable && (
                          <div style={{ 
                            display: "flex", alignItems: "center", gap: "8px", marginTop: "14px", 
                            paddingTop: "14px", borderTop: "1px solid var(--ios-sep-light)" 
                          }}>
                            <div style={{ position: "relative", flex: 1 }}>
                              <input
                                type="number" min={1} max={items.length}
                                value={positionByItemId[item.assignmentId] ?? ""}
                                onChange={(e) => setPositionByItemId(prev => ({ ...prev, [item.assignmentId]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key !== "Enter") return;
                                  e.preventDefault();
                                  const v = Number(positionByItemId[item.assignmentId]);
                                  if (!Number.isFinite(v) || v < 1) return;
                                  onMoveToPosition(item.assignmentId, v);
                                  setPositionByItemId(prev => ({ ...prev, [item.assignmentId]: "" }));
                                }}
                                placeholder="Mover a..."
                                style={{ ...inputStyle, height: "36px", fontSize: "14px" }}
                                onFocus={onFocus} onBlur={onBlur}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const v = Number(positionByItemId[item.assignmentId]);
                                if (!Number.isFinite(v)) return;
                                onMoveToPosition(item.assignmentId, v);
                                setPositionByItemId(prev => ({ ...prev, [item.assignmentId]: "" }));
                              }}
                              style={{
                                height: "36px", padding: "0 18px", borderRadius: "10px", border: "none",
                                background: "rgba(0,122,255,1)", color: "#fff",
                                fontSize: "13px", fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                                boxShadow: "0 4px 10px rgba(0,122,255,0.25)"
                              }}
                              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
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
  const [creditTypesByAssignment, setCreditTypesByAssignment] = useState({});

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
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedCobradorId) return;
    dispatch(loadAssignments({ cobradorId: selectedCobradorId, dueOnly: true, pageSize: 1000 }));
  }, [dispatch, selectedCobradorId]);

  useEffect(() => {
    let active = true;
    const loadAssignmentCredits = async () => {
      if (!selectedCobradorId) { if (active) setCreditTypesByAssignment({}); return; }
      try {
        const response = await fetchAssignmentsEnriched({ cobradorId: selectedCobradorId, dueOnly: true, page: 1, pageSize: 1000 });
        if (!active) return;
        const items = Array.isArray(response?.data?.data) ? response.data.data : [];
        const nextMap = {};
        for (const item of items) {
          const assignmentId = item?.id;
          const creditType = String(item?.credit?.type || "").toUpperCase();
          if (!assignmentId || !creditType) continue;
          if (!nextMap[assignmentId]) nextMap[assignmentId] = new Set();
          nextMap[assignmentId].add(CREDIT_TYPE_LABELS[creditType] || creditType);
        }
        setCreditTypesByAssignment(Object.fromEntries(Object.entries(nextMap).map(([k, v]) => [k, Array.from(v).sort()])));
      } catch {
        if (active) setCreditTypesByAssignment({});
      }
    };
    loadAssignmentCredits();
    return () => { active = false; };
  }, [selectedCobradorId]);

  const { listaHoy } = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayKey = toDateKey(today);
    const source = allAssignments
      .filter((a) => a.user?.id === selectedCobradorId)
      .map((a) => ({
        assignmentId: a.id, id: a.client?.id, nombre: a.client?.name,
        tipoPago: a.tipoPago, tipoPagoReal: creditTypesByAssignment[a.id]?.join(" + ") || a.tipoPago,
        orden: a.orden, nextVisitDate: a.nextVisitDate, pendingSince: a.pendingSince,
      })).filter((a) => a.id);
    const hoy = source.filter((a) => {
      const nextVisitKey = toDateKey(a.nextVisitDate);
      const pendingSinceKey = toDateKey(a.pendingSince);
      return nextVisitKey === todayKey || pendingSinceKey === todayKey || Boolean(pendingSinceKey && pendingSinceKey < todayKey);
    }).sort((a, b) => a.orden - b.orden);
    return { listaHoy: hoy };
  }, [allAssignments, selectedCobradorId, creditTypesByAssignment]);

  useEffect(() => { setClientesHoy(listaHoy); }, [listaHoy]);

  const onDragEndHoy = (result) => {
    if (!result.destination) return;
    setClientesHoy((prev) => moveItem(prev, result.source.index, result.destination.index));
  };

  const moverHoyAPosicion = (assignmentId, position) => {
    setClientesHoy((prev) => moveItemToPosition(prev, assignmentId, position));
  };

  const refreshAssignments = async () => {
    await dispatch(loadAssignments({ cobradorId: selectedCobradorId, dueOnly: true, pageSize: 1000 }));
  };

  const guardarHoy = async () => {
    try {
      setGuardandoHoy(true);
      const payload = clientesHoy.map((c, idx) => ({ id: c.assignmentId, orden: TODAY_BASE_ORDER + idx + 1 }));
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
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "4px 0" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--ios-label)", margin: 0, letterSpacing: "-0.02em" }}>
            Ordenar clientes
          </h2>
          <p style={{ fontSize: "13px", color: "var(--ios-label-ter)", margin: "4px 0 0" }}>
            {clientesHoy.length} clientes asignados para hoy
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {editando && (
            <button
              onClick={guardarHoy}
              disabled={guardandoHoy || clientesHoy.length === 0}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "9px 16px", borderRadius: "10px", border: "none",
                background: guardandoHoy ? "var(--ios-fill)" : "#34C759",
                color: "#fff",
                fontSize: "13px", fontWeight: 700, cursor: guardandoHoy ? "not-allowed" : "pointer",
                transition: "all 0.15s", boxShadow: "0 4px 12px rgba(52,199,89,0.2)",
              }}
            >
              {guardandoHoy ? "Guardando..." : "Guardar orden"}
            </button>
          )}
          <button
            onClick={() => setEditando((e) => !e)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "9px 16px", borderRadius: "10px", border: "none",
              background: editando ? "var(--ios-fill)" : "var(--ios-blue)",
              color: editando ? "var(--ios-label-sec)" : "#fff",
              fontSize: "13px", fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
            }}
          >
            <HiArrowsUpDown style={{ width: "15px", height: "15px" }} />
            {editando ? "Cerrar edición" : "Editar orden"}
          </button>
        </div>
      </div>

      {/* Selector cobrador */}
      <div className="ios-card" style={{ padding: "16px" }}>
        <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ios-label-ter)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>
          Cobrador
        </label>
        <select
          value={selectedCobradorId}
          onChange={(e) => setSelectedCobradorId(e.target.value)}
          disabled={loadingCollectors || collectors.length === 0}
          style={inputStyle}
          onFocus={onFocus} onBlur={onBlur}
        >
          {collectors.length === 0 ? (
            <option value="">{loadingCollectors ? "Cargando cobradores..." : "Sin cobradores disponibles"}</option>
          ) : (
            collectors.map((collector) => (
              <option key={collector.id} value={collector.id}>{collector.name}</option>
            ))
          )}
        </select>
      </div>

      <AssignmentOrderList
        title="Ruta de hoy"
        subtitle="Clientes con visita programada para hoy"
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

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useState } from "react";
import axios from "axios";

export default function OrdenClientes({ cobradorId, clientesIniciales }) {
    const [clientes, setClientes] = useState(clientesIniciales);

    function handleDragEnd(result) {
        if (!result.destination) return;

        const reordered = Array.from(clientes);
        const [moved] = reordered.splice(result.source.index, 1);
        reordered.splice(result.destination.index, 0, moved);

        // actualizar orden local
        const actualizados = reordered.map((c, i) => ({ ...c, orden: i + 1 }));
        setClientes(actualizados);
    }

    async function guardarOrden() {
        await axios.patch(`/api/cobradores/${cobradorId}/orden`, clientes.map(c => ({
            clienteId: c.id,
            orden: c.orden
        })));
        alert("Orden guardado correctamente");
    }

    return (
        <div>
            <h2 className="text-lg font-semibold mb-4">Orden de clientes asignados</h2>
            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="clientes">
                    {(provided) => (
                        <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                            {clientes.map((c, index) => (
                                <Draggable key={c.id} draggableId={String(c.id)} index={index}>
                                    {(provided) => (
                                        <li
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm flex items-center justify-between"
                                        >
                                            <span>{index + 1}. {c.nombre}</span>
                                            <span className="text-sm text-gray-500">{c.tipoPago}</span>
                                        </li>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </ul>
                    )}
                </Droppable>
            </DragDropContext>

            <button
                onClick={guardarOrden}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500"
            >
                Guardar orden
            </button>
        </div>
    );
}

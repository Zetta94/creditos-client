# 🔄 SISTEMA DE ORDENAMIENTO DE CLIENTES

## ✅ Implementación Completa

He configurado un sistema **profesional y seguro** para que el administrador ordene los clientes que verá cada cobrador.

---

## 📋 Cambios Realizados

### Backend - Nuevo Endpoint Batch

**Ruta:** `POST /assignments/reorder/batch`  
**Protección:** Solo para `ADMIN` (vía middleware)

```typescript
// Estructura de request:
{
  "assignments": [
    { "id": 1, "orden": 1 },
    { "id": 3, "orden": 2 },
    { "id": 2, "orden": 3 }
  ]
}

// Response:
{
  "message": "Orden actualizado correctamente",
  "data": [
    { "id": 1, "orden": 1, ... },
    { "id": 3, "orden": 2, ... },
    { "id": 2, "orden": 3, ... }
  ]
}
```

**Archivos modificados en Backend:**
- ✅ `assignment.validator.ts` - Agregado validador `reorderAssignmentSchema`
- ✅ `assignment.service.ts` - Nueva función `reorderAssignments()` con transacción
- ✅ `assignment.controller.ts` - Nuevo controller `reorderAssignments`
- ✅ `assignment.routes.ts` - Nueva ruta `POST /reorder/batch`

---

### Frontend - Nuevos Componentes

**Redux Store:**
- ✅ `assignmentsSlice.js` - CREADO
  - `loadAssignments()` - Carga todas las asignaciones
  - `addAssignment()` - Crea asignación
  - `saveAssignment()` - Actualiza asignación
  - `removeAssignment()` - Elimina asignación

**Services:**
- ✅ `assignmentsService.js` 
  - Función nueva: `reorderAssignments(assignments)` llama a `/assignments/reorder/batch`

**Componentes:**
- ✅ `OrdenarClientes.jsx` - COMPLETAMENTE REFACTORIZADO
  - Ahora usa Redux store en lugar de mockData
  - Carga asignaciones reales del backend en `useEffect`
  - Drag-and-drop actualiza el backend
  - Muestra toast de éxito/error

**Redux Store:**
- ✅ `store/index.js` - Agregado `assignmentsReducer`

---

## 🔐 Seguridad

El endpoint está **protegido**:

```typescript
// En routes/index.ts
router.use("/assignments", authMiddleware, requireRole("ADMIN"), assignament);
```

**Solo el ADMIN puede:**
- Ver todas las asignaciones
- Reordenarlas

**Los cobradores:**
- Ven sus clientes en el orden que el admin les asignó
- No pueden modificar el orden

---

## 📊 Flujo Completo

```
ADMIN accede a "Ordenar Clientes"
        ↓
Frontend hace dispatch(loadAssignments())
        ↓
Backend: GET /assignments (protegido)
        ↓
Redux store se llena con asignaciones reales
        ↓
ADMIN arrastra (drag-drop) los clientes
        ↓
Frontend actualiza orden local
        ↓
ADMIN hace click "Guardar"
        ↓
Frontend: POST /assignments/reorder/batch
        ↓
Backend valida y actualiza en transacción
        ↓
Todos los clientes del cobrador tienen nuevo orden
        ↓
COBRADOR ve los clientes en el orden correcto
```

---

## 🧪 Cómo Probar

### 1. Iniciar Backend
```bash
cd creditos-api
npm run dev
```

### 2. Iniciar Frontend
```bash
cd creditos-client
npm run dev
```

### 3. Login como Admin
- Email: `admin@dashboard.com`
- Password: `password123`

### 4. Ir a una de estas secciones (según tu UI):
- Asignaciones de Clientes
- Gestión de Cobradores
- Ordenar Clientes

### 5. Pruebas:

**Prueba A - Cargar datos**
```
✓ Deberían cargar los clientes asignados
✓ Deberían estar ordenados por `orden` ASC
✓ Cada fila muestra: Cliente, Tipo de Pago, ID
```

**Prueba B - Cambiar orden**
```
✓ Click en "Editar orden"
✓ Drag-drop un cliente de arriba a abajo
✓ El número de orden debe actualizar
```

**Prueba C - Guardar**
```
✓ Click en "Guardar"
✓ Debe mostrarse "Orden guardada correctamente!"
✓ Recarga la página
✓ El nuevo orden debe persistir
```

**Prueba D - Seguridad (en DevTools Network)**
```
POST /assignments/reorder/batch
  Headers:
    Authorization: Bearer <tu_token>
    Content-Type: application/json
  
  Body:
    {
      "assignments": [
        { "id": 1, "orden": 1 },
        { "id": 2, "orden": 2 }
      ]
    }
```

---

## 🎯 Especificaciones

| Característica | Detalles |
|---|---|
| **Endpoint** | `POST /assignments/reorder/batch` |
| **Autenticación** | Bearer Token (JWT) |
| **Autorización** | Solo ADMIN |
| **Payload** | `{ assignments: [{ id, orden }] }` |
| **Transacción** | Sí - Todas o nada |
| **Validación** | Zod schema |
| **Respuesta** | Array actualizado con nueva data |
| **Errores** | Toast notifications |

---

## 🔧 Estructura de Datos

### Modelo Prisma (sin cambios)
```prisma
model CobradorCliente {
  id         Int     @id @default(autoincrement())
  cobradorId String
  user       User    @relation(fields: [cobradorId], references: [id], onDelete: Cascade)
  
  clienteId  String
  client     Client  @relation(fields: [clienteId], references: [id], onDelete: Cascade)
  
  tipoPago   String
  orden      Int     @default(0)  ← ESTE CAMPO CONTROLA EL ORDEN
}
```

### Redux State
```javascript
state.assignments = {
  list: [
    {
      id: 1,
      cobradorId: "abc123",
      clienteId: "def456",
      orden: 1,
      user: { /* ... */ },
      client: { /* ... */ }
    },
    // ...
  ],
  current: null,
  loading: false,
  error: null
}
```

---

## 📝 API Contract

### Request
```json
POST /assignments/reorder/batch

{
  "assignments": [
    { "id": 1, "orden": 1 },
    { "id": 3, "orden": 2 },
    { "id": 2, "orden": 3 }
  ]
}
```

### Response (200 OK)
```json
{
  "message": "Orden actualizado correctamente",
  "data": [
    {
      "id": 1,
      "cobradorId": "usr_001",
      "clienteId": "cli_001",
      "orden": 1,
      "tipoPago": "DIARIO",
      "user": { "id": "usr_001", "name": "Juan Pérez" },
      "client": { "id": "cli_001", "name": "Cliente A" }
    },
    // ...
  ]
}
```

### Error Response (400 Bad Request)
```json
{
  "message": "Datos inválidos",
  "error": {
    "assignments": ["Array is required"]
  }
}
```

---

## 🚀 Próximos Pasos

Opcional (si quieres mejorar):

1. **Auditoría**: Registrar quién cambió el orden y cuándo
2. **Historial**: Guardar versión anterior del orden
3. **Notificaciones**: Notificar al cobrador cuando su orden cambió
4. **Confirmación**: Pedir confirmación antes de guardar cambios grandes
5. **Búsqueda**: Filtrar clientes por nombre mientras ordenas

---

## ✅ Verificación

```bash
# Verificar que los archivos fueron modificados
ls -la creditos-api/src/modules/assignments/
ls -la creditos-client/src/store/assignmentsSlice.js
ls -la creditos-client/src/services/assignmentsService.js
```

---

## 📞 Soporte

Si tienes dudas sobre:
- El flujo: Ver diagrama arriba
- La seguridad: Solo admin puede acceder via middleware
- La persistencia: Usa transacción de Prisma
- Redux: `useSelector(state => state.assignments)`

¡Listo para usar! 🎉

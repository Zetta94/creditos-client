╔════════════════════════════════════════════════════════════════════════════════╗
║                                                                                ║
║                    🧪 PLAN DE TESTING COMPLETO                               ║
║                                                                                ║
║                   Cómo probar TODO lo que implementamos                       ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝


🚀 PREREQUISITOS
═══════════════════════════════════════════════════════════════════════════════

✅ Instalar nodemailer:
   cd creditos-api
   npm install nodemailer

✅ Configurar .env en creditos-api/:
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=tu-email@gmail.com
   EMAIL_PASSWORD=app-password
   FRONTEND_URL=http://localhost:5173

✅ Iniciar ambos servidores:
   Terminal 1: cd creditos-api && npm run dev
   Terminal 2: cd creditos-client && npm run dev

✅ Abrir navegador:
   http://localhost:5173/#/login


🧪 FEATURE 1: PANTALLAS CONECTADAS AL BACKEND
═══════════════════════════════════════════════════════════════════════════════

Objetivo: Verificar que las pantallas usan datos reales de la API, no mock.

TEST 1.1: Crear Cliente
──────────────────────

Pasos:
  1. Login con: admin@dashboard.com / password123
  2. Ir a: Clientes
  3. Click: "+ Nuevo Cliente"
  4. Rellena:
     • Nombre: "Juan Pérez"
     • Teléfono: "1234567890"
     • Documento: "12345678"
     • Dirección: "Calle Principal 123"
     • Ciudad: "Buenos Aires"
     • Provincia: "Buenos Aires"
  5. Click: "Guardar"

Verificar:
  ✅ Toast: "Cliente creado exitosamente"
  ✅ Redirige a lista de clientes
  ✅ El cliente aparece en la lista
  ✅ En DevTools (F12) → Network → POST /api/clients ✓

Esperado:
  • Status: 201 Created
  • Response: { id, name, phone, ... }


TEST 1.2: Crear Crédito
──────────────────────

Pasos:
  1. Ir a: Créditos
  2. Click: "+ Nuevo Crédito"
  3. Selecciona:
     • Cliente: "Juan Pérez" (el que acabas de crear)
     • Tipo: "DAILY"
     • Monto: "1000"
     • Interés: "5"
     • Cuotas: "10"
  4. Click: "Guardar"

Verificar:
  ✅ Toast: "Crédito creado"
  ✅ Aparece en lista de créditos
  ✅ En Network → POST /api/credits ✓
  ✅ Response tiene ID

Esperado:
  • Status: 201 Created
  • El crédito sale en la lista ordenado


TEST 1.3: Registrar Pago
───────────────────────

Pasos:
  1. En Créditos, click en el crédito que creaste
  2. Click: "Registrar Pago"
  3. Rellena:
     • Monto: "100"
     • Fecha: "Hoy"
     • Método: "EFECTIVO"
     • Nota: "Pago inicial"
  4. Click: "Registrar"

Verificar:
  ✅ Toast: "Pago registrado"
  ✅ En Network → POST /api/payments ✓
  ✅ Status 201

Esperado:
  • El pago se registra en BD
  • El crédito se actualiza


TEST 1.4: Crear Usuario
───────────────────────

Pasos:
  1. Ir a: Usuarios
  2. Click: "+ Nuevo Usuario"
  3. Rellena:
     • Nombre: "Carlos López"
     • Email: "carlos@empresa.com"
     • Contraseña: "password123"
     • Rol: "COBRADOR"
  4. Click: "Guardar"

Verificar:
  ✅ Toast: "Usuario creado"
  ✅ Aparece en lista
  ✅ En Network → POST /api/users ✓

Esperado:
  • El usuario se guarda con los datos correctos
  • El rol es COBRADOR


TEST 1.5: Editar Cliente
──────────────────────

Pasos:
  1. Ir a: Clientes
  2. Click en "Juan Pérez"
  3. Click: "Editar"
  4. Cambia:
     • Teléfono: "9876543210"
  5. Click: "Guardar"

Verificar:
  ✅ Toast: "Cliente actualizado"
  ✅ En Network → PUT /api/clients/:id ✓
  ✅ El teléfono se actualiza

Esperado:
  • Status 200
  • Los cambios persisten


✅ CHECKLIST FEATURE 1:
  [_] TEST 1.1 Crear Cliente
  [_] TEST 1.2 Crear Crédito
  [_] TEST 1.3 Registrar Pago
  [_] TEST 1.4 Crear Usuario
  [_] TEST 1.5 Editar Cliente


🧪 FEATURE 2: ORDENAMIENTO DE CLIENTES
═══════════════════════════════════════════════════════════════════════════════

Objetivo: Verificar que el admin puede reordenar clientes y estos persisten.

TEST 2.1: Cargar Clientes Asignados
───────────────────────────────────

Nota: Primero necesitas crear asignaciones. En Usuarios, ve a "Carlos López"
e intenta asignarle clientes (si ese endpoint existe), o crea directamente
en la BD mediante:

```sql
INSERT INTO "CobradorCliente" (cobradorId, clienteId, tipoPago, orden)
VALUES 
  ('<USER_ID>', '<CLIENT_ID_1>', 'DIARIO', 1),
  ('<USER_ID>', '<CLIENT_ID_2>', 'DIARIO', 2),
  ('<USER_ID>', '<CLIENT_ID_3>', 'DIARIO', 3);
```

Pasos:
  1. Ir a: Ordenar Clientes (o donde esté ese módulo)
  2. Selecciona cobrador: "Carlos López"
  3. Deberías ver la lista de clientes asignados

Verificar:
  ✅ Carga los clientes
  ✅ Están ordenados por "orden" ASC
  ✅ Muestra: Número, Nombre, Tipo de Pago


TEST 2.2: Cambiar Orden (Drag & Drop)
──────────────────────────────────────

Pasos:
  1. Click: "Editar orden"
  2. El botón cambia a amarillo (modo edición)
  3. Arrastra un cliente de la posición 1 a la 3
  4. Verifica que los números se actualicen localmente
  5. Click: "Guardar"

Verificar:
  ✅ Está habilitado el drag-drop
  ✅ Los números cambian localmente
  ✅ Toast: "Orden guardada correctamente"
  ✅ En Network → POST /assignments/reorder/batch ✓
  ✅ Status 200

Esperado:
  • Request body:
    ```json
    {
      "assignments": [
        { "id": 1, "orden": 3 },
        { "id": 2, "orden": 1 },
        { "id": 3, "orden": 2 }
      ]
    }
  • Response: Array con nuevos órdenes


TEST 2.3: Persistencia después de Refresh
──────────────────────────────────────────

Pasos:
  1. Después de guardar el orden (TEST 2.2)
  2. Refresca la página: F5
  3. Vuelve a "Ordenar Clientes"
  4. Selecciona el mismo cobrador

Verificar:
  ✅ El orden que guardaste persiste
  ✅ Los números son los mismos que antes de refrescar
  ✅ En BD, la tabla CobradorCliente tiene los nuevos órdenes

Esperado:
  • El nuevo orden se mantiene
  • No es un cambio temporal


TEST 2.4: Validación de Seguridad
──────────────────────────────────

Pasos:
  1. Login como un COBRADOR (no admin)
  2. Intenta entrar a: /ordenar-clientes
  3. O intenta hacer un POST directo a /assignments/reorder/batch

Verificar:
  ✅ Si es COBRADOR: No puede acceder a la pantalla
  ✅ Si intenta POST directo: Error 403 Forbidden
  ✅ En Network → Status 403

Esperado:
  • Solo ADMIN puede reordenar
  • Cobradores ven lista pero no pueden editar


✅ CHECKLIST FEATURE 2:
  [_] TEST 2.1 Cargar Clientes Asignados
  [_] TEST 2.2 Cambiar Orden (Drag & Drop)
  [_] TEST 2.3 Persistencia después de Refresh
  [_] TEST 2.4 Validación de Seguridad


🧪 FEATURE 3: RECUPERACIÓN DE CONTRASEÑA
═══════════════════════════════════════════════════════════════════════════════

Objetivo: Verificar que el reset de contraseña funciona end-to-end.

TEST 3.1: Solicitar Reset
─────────────────────────

Pasos:
  1. En Login, click: "¿Olvidaste la contraseña?"
  2. Ingresa email: "admin@dashboard.com"
  3. Click: "Enviar Enlace de Recuperación"

Verificar:
  ✅ Toast: "Revisa tu email..."
  ✅ En Network → POST /auth/request-reset ✓
  ✅ Status 200
  ✅ ¡¡IMPORTANTE!! Abre tu email y recibe el link

Esperado:
  • Email con asunto: "Recuperar contraseña - Dashboard Créditos"
  • Link con formato: /reset-password?token=xxx&email=admin@dashboard.com
  • En desarrollo: Ver en Mailtrap, Gmail, etc.


TEST 3.2: Aceptar Reset en Email
────────────────────────────────

Pasos:
  1. En el email, haz click: "Cambiar Contraseña"
     O copia el link y pégalo en navegador

Verificar:
  ✅ Te lleva a: /reset-password?token=xxx&email=admin@dashboard.com
  ✅ La página muestra el email
  ✅ Hay 2 campos: Nueva Contraseña y Confirma

Esperado:
  • Los parámetros en URL son correctos
  • No hay errores de "Token inválido"


TEST 3.3: Cambiar Contraseña
────────────────────────────

Pasos:
  1. En la página de reset, ingresa:
     • Nueva Contraseña: "NuevaContra123"
     • Confirma: "NuevaContra123"
  2. Click: "Cambiar Contraseña"

Verificar:
  ✅ En Network → POST /auth/reset-password ✓
  ✅ Status 200
  ✅ Toast: "Contraseña actualizada correctamente"
  ✅ Ves mensaje: "¡Éxito!"
  ✅ Se redirige a /login en 2 segundos

Esperado:
  • La contraseña se actualiza en BD
  • El token se elimina (1 uso)


TEST 3.4: Login con Nueva Contraseña
────────────────────────────────────

Pasos:
  1. En la página de login (ya redirigido)
  2. Ingresa:
     • Email: "admin@dashboard.com"
     • Contraseña: "NuevaContra123"
  3. Click: "Ingresar"

Verificar:
  ✅ Login funciona ✓
  ✅ Toast: "Bienvenido"
  ✅ Entras al dashboard
  ✅ En Network → POST /auth/login ✓

Esperado:
  • El login es exitoso
  • La nueva contraseña funciona


TEST 3.5: Intentar Reusar Token
───────────────────────────────

Pasos:
  1. Copia el link que recibiste en el email
  2. Abre en una pestaña nueva
  3. Ingresa otra contraseña: "OtraContra456"
  4. Click: "Cambiar Contraseña"

Verificar:
  ✅ Toast: "Token inválido o expirado" (o similar)
  ✅ Status 400 en Network
  ✅ NO cambia la contraseña

Esperado:
  • El token ya no funciona
  • Se eliminó después del primer uso
  • Seguridad: No se puede reusar


TEST 3.6: Token Expirado
────────────────────────

Pasos:
  1. Solicita otro reset de contraseña
  2. Espera 1 hora (o modifica manualmente en BD)
  3. Intenta usar el link

Verificar:
  ✅ Toast: "El enlace de recuperación ha expirado"
  ✅ Botón: "Solicitar nuevo reset"
  ✅ Redirige a /forgot-password

Esperado:
  • Los tokens expiran en 1 hora
  • No se puede usar después


TEST 3.7: Validaciones de Formulario
─────────────────────────────────────

Pasos:
  A) Solicitar reset sin email:
     • Deja vacío el campo email
     • Click: "Enviar"
  
  B) Contraseña muy corta:
     • Solicita nuevo reset
     • Abre link
     • Ingresa: "abc"
     • Click: "Cambiar"
  
  C) Contraseñas no coinciden:
     • Solicita nuevo reset
     • Abre link
     • Nueva: "Contra123"
     • Confirma: "Contra456"
     • Click: "Cambiar"

Verificar A:
  ✅ Toast: "Por favor ingresa tu email"
  ✅ Botón deshabilitado

Verificar B:
  ✅ Toast: "Mínimo 6 caracteres"
  ✅ Botón deshabilitado

Verificar C:
  ✅ Toast: "Las contraseñas no coinciden"
  ✅ Botón deshabilitado

Esperado:
  • Validaciones previas evitan envíos innecesarios


TEST 3.8: Seguridad - Email No Existe
──────────────────────────────────────

Pasos:
  1. Solicita reset con email que NO existe:
     "emailquenoexiste@domain.com"

Verificar:
  ✅ Toast: "Si el email existe, recibirás un enlace..."
  ✅ Misma respuesta genérica (seguridad)
  ✅ NO revela si existe o no

Esperado:
  • Respuesta genérica (no revela si existe)
  • Seguridad contra enumeración de usuarios


✅ CHECKLIST FEATURE 3:
  [_] TEST 3.1 Solicitar Reset
  [_] TEST 3.2 Aceptar Reset en Email
  [_] TEST 3.3 Cambiar Contraseña
  [_] TEST 3.4 Login con Nueva Contraseña
  [_] TEST 3.5 Intentar Reusar Token
  [_] TEST 3.6 Token Expirado
  [_] TEST 3.7 Validaciones de Formulario
  [_] TEST 3.8 Seguridad - Email No Existe


🎯 TESTING EN DEVTOOLS (F12)
═══════════════════════════════════════════════════════════════════════════════

Para cada test, abre DevTools:

1. Click: F12
2. Ir a: Network tab
3. Filtrar por: XHR (XMLHttpRequest)
4. Ejecutar la acción
5. Buscar el endpoint en la lista
6. Click para ver:
   • Request headers (Authorization, Content-Type)
   • Request body (datos que enviaste)
   • Response (datos que retornó)
   • Status (200, 201, 400, 403, etc.)

Endpoints a buscar:
  • POST /api/clients
  • POST /api/credits
  • POST /api/payments
  • POST /api/users
  • PUT /api/clients/:id
  • POST /assignments/reorder/batch
  • POST /auth/request-reset
  • POST /auth/reset-password


📊 CHECKLIST DE TESTING COMPLETO
═══════════════════════════════════════════════════════════════════════════════

FEATURE 1 - Pantallas Conectadas:
  [_] TEST 1.1 Crear Cliente
  [_] TEST 1.2 Crear Crédito
  [_] TEST 1.3 Registrar Pago
  [_] TEST 1.4 Crear Usuario
  [_] TEST 1.5 Editar Cliente

FEATURE 2 - Ordenamiento:
  [_] TEST 2.1 Cargar Clientes
  [_] TEST 2.2 Cambiar Orden
  [_] TEST 2.3 Persistencia
  [_] TEST 2.4 Seguridad

FEATURE 3 - Reset Contraseña:
  [_] TEST 3.1 Solicitar Reset
  [_] TEST 3.2 Aceptar Email
  [_] TEST 3.3 Cambiar Contraseña
  [_] TEST 3.4 Login Nueva Contraseña
  [_] TEST 3.5 Reusar Token
  [_] TEST 3.6 Token Expirado
  [_] TEST 3.7 Validaciones
  [_] TEST 3.8 Email No Existe


🐛 TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════════

Problema: "Error de CORS"
Solución: Verifica que backend esté en localhost:3000 y frontend en localhost:5173

Problema: "401 Unauthorized"
Solución: Tu token expiró. Haz logout y login nuevamente

Problema: "Email no llega"
Solución: 
  • Revisa spam
  • Configura SMTP correctamente en .env
  • O usa Mailtrap para ver emails en test

Problema: "Token inválido"
Solución:
  • Verifica URL tiene parámetros correctos
  • El token expira en 1 hora
  • Ya se usó una vez

Problema: "La pantalla queda en blanco"
Solución:
  • Abre DevTools (F12)
  • Revisa Console para errores
  • Verifica que los servidores estén corriendo


✅ CUANDO TERMINES
═══════════════════════════════════════════════════════════════════════════════

Si TODOS los tests pasaron:

  ✅ Felicidades, todo funciona perfectamente
  ✅ El backend está correcto
  ✅ El frontend está correcto
  ✅ La BD está actualizada
  ✅ La seguridad funciona

Ahora puedes:
  • Deployar a producción
  • Usar la app en producción
  • Hacer backup de la BD
  • Compartir con usuarios


═════════════════════════════════════════════════════════════════════════════════

                    ¡Comienza a probar! 🚀

         Sigue este plan y todo debe funcionar perfectamente.

═════════════════════════════════════════════════════════════════════════════════

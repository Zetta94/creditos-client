# Informe de funcionalidades actuales

## 1. Acceso e instalación
- **Frontend**: https://elimperios.com
- **Backend API**: proxy en el mismo dominio (`https://elimperios.com/api`).
- **Usuarios habilitados**:
  - franco_correas@outlook.com / Franco1234 (EMPLOYEE)
  - jonathanslucero@gmail.com / pakkun26 (COBRADOR)

## 2. Panel de administrador
- **Inicio**: tablero con resúmenes de créditos, pagos y clientes.
- **Clientes**: alta, edición, detalle y búsqueda; filtros por nombre, documento y estado.
- **Créditos**: crear créditos (diario/semanal/mensual), ver calendario de cuotas, registrar cancelaciones y consultar historial de pagos.
- **Usuarios**: ABM de usuarios con asignación de roles (ADMIN, EMPLOYEE, COBRADOR) y control de acceso.
- **Reportes**: métricas diarias/semanales/mensuales sin domingos, exportación disponible.
- **Mensajes**: listado de comunicaciones enviadas a clientes (vencimientos, pagos, avisos operativos).

## 3. Panel de cobrador
- **Dashboard**: resumen de cobranzas del día y montos pendientes.
- **Trayecto**: iniciar y finalizar recorridos; registro de pagos en efectivo, transferencia o Mercado Pago; importes separados.
- **Agenda**: próximos clientes a visitar, reprogramación automática que evita domingos.
- **Reportes**: totales diarios/semanales/mensuales con detalle por método de pago.

## 4. Backend y estabilidad
- API en Node/Express con control de roles; seguridad por JWT.
- Base PostgreSQL administrada vía Prisma (sin seeds destructivos en producción).
- PM2 mantiene el servicio activo; logs rotativos configurados.
- Despliegue: frontend compilado (Vite) servido por Nginx, backend tras proxy `/api`.

## 5. Escenarios sugeridos para pruebas
1. Login como ADMIN → crear cliente → crear crédito → registrar pago → verificar actualización del tablero y reportes.
2. Login como COBRADOR → iniciar trayecto → registrar varios pagos con métodos distintos → finalizar trayecto → revisar reportes.
3. Cambiar contraseña de un usuario desde Postman (PUT /api/users/:id) y validar acceso.
4. Confirmar que ninguna visita se programe en domingo tras registrar pagos o posponer clientes.

## 6. Tareas próximas (semana de prueba)
- Recopilar feedback de funcionamiento (UI, tiempos de respuesta, necesidades extra).
- Ajustes de rendimiento en tablas con muchos registros si surge necesidad.
- Configurar respaldos automáticos de la base (scripts documentados).
- Evaluar métricas adicionales solicitadas por cobradores/administradores.

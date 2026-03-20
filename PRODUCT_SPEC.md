# FIXELI — Especificación del Producto

## Visión general

Sistema de gestión para FIXELI, clínica de odontología general con 4+ doctores.
La clínica opera actualmente 100% en papel. Este sistema digitaliza el flujo completo
de trabajo comenzando por lo más urgente: expediente digital, odontograma y agenda.

No es un SaaS. Es una herramienta interna para uso exclusivo de FIXELI.

**Usuarios del sistema:**
- La dueña (admin)
- Los doctores (4+) — cada uno ve su propia operación
- Sin recepcionista en Fase 1

---

## Contexto de negocio importante

### Modelo de cobro
Cada doctor cobra de forma independiente. Los ingresos por cita/tratamiento se dividen
entre el doctor y el consultorio según un **porcentaje configurable por doctor**
(puede variar entre doctores). El sistema calcula y muestra esta división automáticamente.

- Sin manejo de seguros. Todo es pago directo.
- Los pagos se distribuyen según las citas que conlleve el tratamiento (no pago único necesariamente).

### WhatsApp y automatización — arquitectura futura
La clínica ya usa WhatsApp activamente: citas, confirmaciones, anuncios, publicidad.
A futuro se implementará un **chatbot con n8n** en un VPS propio con PostgreSQL.

**Decisión de arquitectura:** el sistema se desarrolla primero en Supabase (plan gratuito)
y luego migra a PostgreSQL en VPS + n8n para automatización. El schema debe ser
100% PostgreSQL estándar para que la migración sea sin fricción.

---

## Dispositivos y entorno

| Dispositivo | Uso principal |
|-------------|---------------|
| Desktop / laptop | Admin y doctores en escritorio |
| iPad / tablet | Odontograma y expediente durante la consulta |
| Móvil | Consulta rápida de agenda y pacientes |

- UI completamente **responsive**
- Idioma: **100% español**
- En tablet/móvil: navegación inferior en lugar de sidebar lateral

---

## Roles de usuario

| Rol | Acceso |
|-----|--------|
| `admin` | Todo: doctores, pacientes, agenda de todos, caja total, comisiones, configuración |
| `doctor` | Sus pacientes, su agenda, expedientes clínicos, sus propios ingresos |

---

## Módulos — Fase 1 (MVP)

### 1. Autenticación
- Login con email y contraseña
- Sesión persistente
- Rol asignado por el admin desde configuración
- Aislamiento de datos por rol: doctores ven solo lo suyo, admin ve todo

### 2. Pacientes
- Crear, editar, buscar y archivar pacientes
- Campos: nombre completo, fecha de nacimiento, teléfono, email, dirección, alergias, enfermedades/medicamentos
- Foto de perfil (opcional)
- Doctor principal asignado (puede ser atendido por cualquier doctor)
- Ficha unificada: historial de visitas, notas clínicas, odontograma y pagos en un solo lugar

### 3. Agenda
- Vista semana y día, filtrable por doctor
- **Admin:** ve agenda de todos los doctores con código de color por doctor
- **Doctor:** ve solo su propia agenda
- Crear cita: paciente, doctor, fecha/hora, duración, motivo, estado
- Estados: `pendiente` | `confirmada` | `completada` | `cancelada` | `no_asistió`
- Editar, cancelar, reagendar
- Bloquear horarios (comidas, vacaciones)
- Validación de conflictos: sin solapamientos por doctor
- Vista optimizada para iPad: botones grandes, interacción táctil

### 4. Expediente clínico
- Nota por visita: motivo de consulta, diagnóstico, tratamiento realizado, próximos pasos
- Adjuntar imágenes: radiografías, fotos intraorales (hasta 10 por nota, Supabase Storage)
- Confirmación del doctor (checkbox + timestamp) — inmutable una vez confirmado
- Historial cronológico por paciente

### 5. Odontograma
- Diagrama interactivo SVG de 32 dientes (dentición adulta)
- 5 caras por diente: mesial, distal, oclusal, vestibular, lingual/palatino
- Condiciones registrables:
  `sano` | `caries` | `obturación` | `corona` | `implante` | `endodoncia` | `fractura` | `ausente` | `extracción indicada`
- Código de color por condición (visual inmediato)
- Historial completo: cada cambio registrado con fecha, doctor y nota
- Vista histórica: ver el estado del odontograma en cualquier fecha pasada
- Optimizado para iPad: táctil, botones generosos (mínimo 44px)

### 6. Planes de tratamiento
- Lista de procedimientos para un paciente con costo estimado por procedimiento
- Estado por procedimiento: `pendiente` | `en proceso` | `completado`
- Vinculado a citas específicas
- Vista de avance: % completado, monto cobrado vs pendiente
- Base para el cálculo de división de pagos

### 7. Control de caja y comisiones
- Registrar pago: monto, método (efectivo, tarjeta, transferencia), concepto, cita asociada
- **División automática:** el sistema calcula parte del doctor y parte del consultorio
  según el porcentaje configurado para ese doctor (admin configura desde Settings)
- El porcentaje es por doctor y editable en cualquier momento
- **Vista admin:** ingresos totales, desglose por doctor, resumen diario/semanal/mensual
- **Vista doctor:** solo sus ingresos y su parte correspondiente
- Pagos pendientes por paciente

---

## Módulos — Fase 2

### 8. WhatsApp / Chatbot (n8n en VPS)
- Recordatorio automático 24h antes de cita
- Confirmación de cita por WhatsApp (paciente responde Sí/No y el sistema actualiza el estado)
- Chatbot que agenda citas directamente por WhatsApp
- Anuncios y mensajes masivos a lista de pacientes
- Integración via n8n + webhook hacia PostgreSQL
- *El schema de DB ya contempla esto desde Fase 1 (tabla `whatsapp_conversations`, campo `phone` en pacientes)*

### 9. Reportes
- Citas por doctor y período
- Ingresos totales vs desglose por doctor
- Pacientes nuevos vs recurrentes
- Tratamientos más frecuentes
- Exportar a PDF

---

## Módulos — Fase 3

- Chatbot con IA (presupuestos automáticos, FAQ)
- Inventario de insumos
- CFDI / Facturación electrónica (México)
- Portal del paciente

---

## UX / Diseño

- Interfaz limpia, sin distracciones. Los doctores no son power users de software.
- Logo de FIXELI: se integrará cuando se proporcione (pendiente)
- Paleta: blanca/gris neutro + color de acento (se define al recibir el logo)
- Completamente en español
- Sidebar fija en desktop: Agenda, Pacientes, Caja, Configuración
- Navegación inferior en tablet y móvil
- Elementos táctiles mínimo 44px en iPad

---

## Lo que NO se construye en Fase 1

- CFDI / facturación electrónica
- Seguros médicos
- App nativa (se usa como web responsive / PWA)
- Chatbot / WhatsApp automático
- Inventario
- Portal del paciente
- Múltiples sucursales

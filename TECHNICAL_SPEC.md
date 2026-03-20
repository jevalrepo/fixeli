# FIXELI — Especificación Técnica

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Estilos | Tailwind CSS v3 |
| Backend actual | Supabase (DB + Auth + Storage + Realtime) |
| Backend futuro | PostgreSQL en VPS + n8n para automatización |
| Cliente DB | supabase-js v2 |
| Routing | React Router v6 |
| Formularios | React Hook Form + Zod |
| Estado global | Zustand (sesión, usuario activo, doctor seleccionado en agenda) |
| Fechas | date-fns |
| Odontograma | SVG interactivo custom (sin librería externa) |
| PDF (Fase 2) | Supabase Edge Function + @react-pdf/renderer |
| WhatsApp (Fase 2) | n8n en VPS + Twilio o Meta Cloud API |

**Principio clave:** todo el SQL debe ser PostgreSQL estándar.
Cero dependencias de APIs propietarias de Supabase en la lógica de negocio.
La migración a VPS debe ser posible cambiando solo la cadena de conexión.

---

## Estructura de carpetas

```
src/
├── components/
│   ├── ui/                  # Button, Input, Modal, Badge, Toast, Avatar — componentes base
│   ├── layout/              # Sidebar (desktop), BottomNav (mobile/tablet), PageWrapper, TopBar
│   ├── agenda/              # WeekView, DayView, AppointmentCard, AppointmentForm, BlockSlotForm
│   ├── patients/            # PatientList, PatientCard, PatientForm, PatientSearch
│   ├── odontogram/          # ToothChart, ToothSVG, ToothDetailPanel, OdontogramHistory
│   ├── clinical/            # ClinicalNoteForm, NoteCard, AttachmentUpload, TreatmentPlanForm
│   └── cashier/             # PaymentForm, CommissionSummary, DailySummary, PendingPayments
├── pages/
│   ├── Login.tsx
│   ├── Agenda.tsx
│   ├── Patients.tsx
│   ├── PatientDetail.tsx    # Ficha unificada: expediente + odontograma + pagos
│   ├── Cashier.tsx
│   └── Settings.tsx         # Gestión de doctores, porcentajes, configuración general
├── hooks/
│   ├── useAuth.ts
│   ├── usePatients.ts
│   ├── useAppointments.ts
│   ├── useOdontogram.ts
│   ├── useClinicalNotes.ts
│   ├── useTreatmentPlans.ts
│   └── useCashier.ts
├── lib/
│   ├── supabase.ts          # Cliente Supabase inicializado con env vars
│   ├── odontogram.ts        # Constantes: dientes, caras, colores por condición
│   └── utils.ts
├── stores/
│   └── authStore.ts         # Zustand: user, profile, role, selectedDoctorId (agenda admin)
├── types/
│   └── database.ts          # Tipos TypeScript de todas las tablas
└── main.tsx
```

---

## Schema de base de datos

### `profiles`
Extiende `auth.users`. Un perfil por usuario del sistema.

```sql
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  role          text not null check (role in ('admin', 'doctor')),
  specialty     text,                        -- especialidad del doctor
  phone         text,
  color         text default '#3B82F6',      -- color en la agenda (hex)
  commission_pct numeric(5,2) default 50.00, -- % que le corresponde al doctor (ej. 60.00)
  is_active     boolean default true,
  avatar_url    text,
  created_at    timestamptz default now()
);

comment on column profiles.commission_pct is
  'Porcentaje del pago que corresponde al doctor. El consultorio recibe (100 - commission_pct)%.';
```

### `patients`

```sql
create table patients (
  id              uuid primary key default gen_random_uuid(),
  first_name      text not null,
  last_name       text not null,
  date_of_birth   date,
  phone           text,                      -- también usado para WhatsApp en Fase 2
  email           text,
  address         text,
  allergies       text,
  medical_notes   text,                      -- enfermedades, medicamentos actuales
  photo_url       text,
  primary_doctor_id uuid references profiles(id),
  is_active       boolean default true,
  created_by      uuid references profiles(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
```

### `appointments`

```sql
create table appointments (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null references patients(id) on delete cascade,
  doctor_id    uuid not null references profiles(id),
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  reason       text,
  status       text not null default 'pendiente'
               check (status in ('pendiente','confirmada','completada','cancelada','no_asistio')),
  notes        text,
  created_by   uuid references profiles(id),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Índice para consultas de agenda por doctor y rango de fechas
create index appointments_doctor_date_idx on appointments (doctor_id, starts_at);

-- Función para validar que no haya solapamientos por doctor
create or replace function check_appointment_overlap()
returns trigger as $$
begin
  if exists (
    select 1 from appointments
    where doctor_id = new.doctor_id
      and id != coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
      and status not in ('cancelada')
      and (starts_at, ends_at) overlaps (new.starts_at, new.ends_at)
  ) then
    raise exception 'El doctor ya tiene una cita en ese horario';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger appointments_no_overlap
  before insert or update on appointments
  for each row execute procedure check_appointment_overlap();
```

### `blocked_slots`

```sql
create table blocked_slots (
  id         uuid primary key default gen_random_uuid(),
  doctor_id  uuid not null references profiles(id),
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  reason     text,                            -- "Comida", "Vacaciones", etc.
  created_at timestamptz default now()
);
```

### `odontogram_entries`
Una fila por cada cambio registrado. El estado actual de un diente es su entrada más reciente.

```sql
create table odontogram_entries (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references patients(id) on delete cascade,
  tooth_number int not null check (tooth_number between 1 and 32),
  surface     text not null check (surface in (
                'mesial','distal','oclusal','vestibular','lingual','general'
               )),
  condition   text not null check (condition in (
                'sano','caries','obturacion','corona','implante',
                'endodoncia','fractura','ausente','extraccion_indicada'
               )),
  notes       text,
  recorded_by uuid references profiles(id),
  recorded_at timestamptz default now()
);

create index odontogram_patient_idx on odontogram_entries (patient_id, recorded_at desc);
```

### `clinical_notes`

```sql
create table clinical_notes (
  id               uuid primary key default gen_random_uuid(),
  patient_id       uuid not null references patients(id) on delete cascade,
  appointment_id   uuid references appointments(id),
  doctor_id        uuid not null references profiles(id),
  chief_complaint  text,                      -- motivo de consulta
  diagnosis        text,
  treatment_done   text,
  next_steps       text,
  confirmed        boolean default false,     -- firma del doctor
  confirmed_at     timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Una vez confirmada, la nota no se puede editar
create or replace function prevent_confirmed_note_edit()
returns trigger as $$
begin
  if old.confirmed = true and new.confirmed = true then
    raise exception 'Una nota confirmada no puede editarse';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger clinical_notes_immutable
  before update on clinical_notes
  for each row execute procedure prevent_confirmed_note_edit();
```

### `attachments`

```sql
create table attachments (
  id               uuid primary key default gen_random_uuid(),
  clinical_note_id uuid not null references clinical_notes(id) on delete cascade,
  patient_id       uuid not null references patients(id),
  file_name        text not null,
  file_url         text not null,             -- URL firmada de Supabase Storage
  file_type        text check (file_type in ('image','pdf','xray','other')),
  uploaded_by      uuid references profiles(id),
  uploaded_at      timestamptz default now()
);
```

### `treatment_plans`

```sql
create table treatment_plans (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references patients(id) on delete cascade,
  doctor_id   uuid not null references profiles(id),
  title       text not null,
  status      text not null default 'activo'
              check (status in ('activo','completado','cancelado')),
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
```

### `treatment_procedures`
Procedimientos individuales dentro de un plan.

```sql
create table treatment_procedures (
  id              uuid primary key default gen_random_uuid(),
  plan_id         uuid not null references treatment_plans(id) on delete cascade,
  appointment_id  uuid references appointments(id),
  description     text not null,
  tooth_number    int check (tooth_number between 1 and 32),
  estimated_cost  numeric(10,2) not null default 0,
  status          text not null default 'pendiente'
                  check (status in ('pendiente','en_proceso','completado')),
  completed_at    timestamptz,
  created_at      timestamptz default now()
);
```

### `payments`

```sql
create table payments (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references patients(id),
  appointment_id  uuid references appointments(id),
  procedure_id    uuid references treatment_procedures(id),
  doctor_id       uuid not null references profiles(id),
  amount          numeric(10,2) not null check (amount > 0),
  method          text not null check (method in ('efectivo','tarjeta','transferencia','otro')),
  concept         text,
  status          text not null default 'pagado'
                  check (status in ('pagado','pendiente','cancelado')),
  -- División calculada al momento del pago y guardada para auditoría
  doctor_pct      numeric(5,2) not null,       -- % del doctor al momento del pago
  doctor_amount   numeric(10,2) not null,       -- monto que le corresponde al doctor
  clinic_amount   numeric(10,2) not null,       -- monto que le corresponde al consultorio
  registered_by   uuid references profiles(id),
  paid_at         timestamptz default now(),
  created_at      timestamptz default now()
);

comment on column payments.doctor_pct is
  'Snapshot del porcentaje del doctor al momento del pago. Se guarda para auditoría histórica.';
```

### `whatsapp_conversations` *(preparado para Fase 2 / n8n)*

```sql
create table whatsapp_conversations (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid references patients(id),
  phone         text not null,
  status        text not null default 'open'
                check (status in ('open','resolved','bot')),
  last_message  text,
  last_msg_at   timestamptz,
  metadata      jsonb default '{}',           -- datos extra del chatbot n8n
  created_at    timestamptz default now()
);

-- Índice para lookups por teléfono desde n8n
create index whatsapp_phone_idx on whatsapp_conversations (phone);
```

---

## Row Level Security (RLS)

```sql
-- Habilitar RLS en todas las tablas
alter table profiles                enable row level security;
alter table patients                enable row level security;
alter table appointments            enable row level security;
alter table blocked_slots           enable row level security;
alter table odontogram_entries      enable row level security;
alter table clinical_notes          enable row level security;
alter table attachments             enable row level security;
alter table treatment_plans         enable row level security;
alter table treatment_procedures    enable row level security;
alter table payments                enable row level security;
alter table whatsapp_conversations  enable row level security;

-- Helper: obtener el rol del usuario actual
create or replace function current_user_role()
returns text as $$
  select role from profiles where id = auth.uid()
$$ language sql security definer stable;

-- PATIENTS: admin ve todos, doctor ve los suyos y los de sus citas
create policy "patients_select" on patients for select using (
  current_user_role() = 'admin'
  or primary_doctor_id = auth.uid()
  or exists (
    select 1 from appointments
    where appointments.patient_id = patients.id
      and appointments.doctor_id = auth.uid()
  )
);
create policy "patients_insert" on patients for insert with check (
  current_user_role() in ('admin', 'doctor')
);
create policy "patients_update" on patients for update using (
  current_user_role() = 'admin'
  or primary_doctor_id = auth.uid()
);

-- APPOINTMENTS: admin ve todas, doctor ve las suyas
create policy "appointments_select" on appointments for select using (
  current_user_role() = 'admin' or doctor_id = auth.uid()
);
create policy "appointments_insert" on appointments for insert with check (
  current_user_role() = 'admin' or doctor_id = auth.uid()
);
create policy "appointments_update" on appointments for update using (
  current_user_role() = 'admin' or doctor_id = auth.uid()
);

-- PAYMENTS: admin ve todos, doctor ve solo los suyos
create policy "payments_select" on payments for select using (
  current_user_role() = 'admin' or doctor_id = auth.uid()
);
create policy "payments_insert" on payments for insert with check (
  current_user_role() in ('admin', 'doctor')
);

-- CLINICAL NOTES y ODONTOGRAM: mismo patrón que appointments
create policy "clinical_notes_select" on clinical_notes for select using (
  current_user_role() = 'admin' or doctor_id = auth.uid()
);
create policy "odontogram_select" on odontogram_entries for select using (
  current_user_role() = 'admin'
  or recorded_by = auth.uid()
  or exists (
    select 1 from appointments
    where appointments.patient_id = odontogram_entries.patient_id
      and appointments.doctor_id = auth.uid()
  )
);
```

---

## Supabase Storage

| Bucket | Uso | Acceso |
|--------|-----|--------|
| `patient-photos` | Fotos de perfil | Privado — signed URLs |
| `clinical-attachments` | Radiografías, fotos intraorales | Privado — signed URLs |

Nunca servir archivos como públicos. Siempre usar `createSignedUrl` con expiración.

---

## Autenticación

```sql
-- Trigger: crear perfil automáticamente al registrar usuario
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Sin nombre'),
    'doctor'   -- rol por defecto; admin lo cambia desde Settings si necesita
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

---

## Variables de entorno

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxx
```

---

## Odontograma — constantes de referencia

```typescript
// src/lib/odontogram.ts

export const TEETH = Array.from({ length: 32 }, (_, i) => i + 1);

export const SURFACES = ['mesial','distal','oclusal','vestibular','lingual','general'] as const;

export const CONDITIONS = {
  sano:                { label: 'Sano',                color: '#22c55e' },
  caries:              { label: 'Caries',              color: '#ef4444' },
  obturacion:          { label: 'Obturación',          color: '#3b82f6' },
  corona:              { label: 'Corona',              color: '#f59e0b' },
  implante:            { label: 'Implante',            color: '#8b5cf6' },
  endodoncia:          { label: 'Endodoncia',          color: '#ec4899' },
  fractura:            { label: 'Fractura',            color: '#f97316' },
  ausente:             { label: 'Ausente',             color: '#6b7280' },
  extraccion_indicada: { label: 'Extracción indicada', color: '#dc2626' },
} as const;

export type Condition = keyof typeof CONDITIONS;
export type Surface = typeof SURFACES[number];
```

---

## Convenciones de código

- Componentes: `PascalCase` → `AppointmentForm.tsx`
- Hooks: `camelCase` con prefijo `use` → `useAppointments.ts`
- Tipos de DB: una interfaz por tabla en `src/types/database.ts`
- Queries a Supabase: **siempre en hooks**, nunca directo en componentes
- Errores: toast notifications con `sonner`
- Fechas: siempre UTC en DB, convertir a local en UI con `date-fns`
- Números de dinero: `numeric(10,2)` en DB, `toFixed(2)` en UI, nunca `float`

---

## Orden de construcción recomendado

1. Setup del proyecto (Vite + Tailwind + React Router + Zustand)
2. Supabase: crear todas las tablas, RLS, triggers, Storage buckets
3. `src/lib/supabase.ts` y `src/types/database.ts`
4. Auth: Login page, rutas protegidas, `useAuth` + `authStore`
5. Layout: Sidebar (desktop) + BottomNav (mobile/tablet) + PageWrapper
6. **Módulo Pacientes** — CRUD completo, búsqueda, ficha básica
7. **Módulo Agenda** — vista semanal, crear/editar citas, vista multi-doctor para admin
8. **Módulo Odontograma** — SVG interactivo, registro de condiciones, historial
9. **Módulo Expediente clínico** — notas por visita, adjuntos de imágenes
10. **Módulo Planes de tratamiento** — procedimientos, estado de avance
11. **Módulo Caja** — registro de pagos, cálculo automático de comisiones
12. Settings: gestión de doctores, edición de porcentajes de comisión
13. Pulir: validaciones, estados de carga/error, responsive en iPad y móvil
14. PWA básica (manifest + service worker para uso offline en agenda)

---

## Migración futura a VPS (Fase 2)

Cuando se migre de Supabase a PostgreSQL en VPS:

1. Exportar datos con `pg_dump` desde Supabase
2. Importar en PostgreSQL del VPS
3. Reemplazar `supabase-js` por `pg` o `Prisma` en el cliente
4. Auth: migrar a solución propia (ej. `better-auth` o `lucia`) o mantener Supabase Auth como servicio externo
5. Storage: migrar a MinIO o S3 compatible en el VPS
6. Conectar n8n al mismo PostgreSQL para automatizaciones de WhatsApp

Todo el SQL de este documento es PostgreSQL estándar. Sin funciones propietarias de Supabase en la lógica de negocio.

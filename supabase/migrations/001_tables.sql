-- ============================================================
-- FIXELI — Schema inicial
-- Migración 001: Tablas
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- ─── perfiles ───────────────────────────────────────────────
-- Extiende auth.users. Un perfil por usuario del sistema.

create table if not exists perfiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  nombre_completo     text not null,
  rol                 text not null check (rol in ('admin', 'doctor')),
  especialidad        text,
  telefono            text,
  color               text default '#3B82F6',
  porcentaje_comision numeric(5,2) default 50.00,
  activo              boolean default true,
  url_avatar          text,
  creado_en           timestamptz default now()
);

comment on column perfiles.porcentaje_comision is
  'Porcentaje del pago que corresponde al doctor. El consultorio recibe (100 - porcentaje_comision)%.';

-- ─── pacientes ──────────────────────────────────────────────

create table if not exists pacientes (
  id                  uuid primary key default gen_random_uuid(),
  nombre              text not null,
  apellido            text not null,
  fecha_nacimiento    date,
  telefono            text,
  email               text,
  direccion           text,
  alergias            text,
  notas_medicas       text,
  url_foto            text,
  doctor_principal_id uuid references perfiles(id),
  activo              boolean default true,
  creado_por          uuid references perfiles(id),
  creado_en           timestamptz default now(),
  actualizado_en      timestamptz default now()
);

-- ─── citas ──────────────────────────────────────────────────

create table if not exists citas (
  id          uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references pacientes(id) on delete cascade,
  doctor_id   uuid not null references perfiles(id),
  inicia_en   timestamptz not null,
  termina_en  timestamptz not null,
  motivo      text,
  estado      text not null default 'pendiente'
              check (estado in ('pendiente','confirmada','completada','cancelada','no_asistio')),
  notas       text,
  creado_por  uuid references perfiles(id),
  creado_en   timestamptz default now(),
  actualizado_en timestamptz default now()
);

create index if not exists citas_doctor_fecha_idx
  on citas (doctor_id, inicia_en);

-- ─── horarios_bloqueados ─────────────────────────────────────

create table if not exists horarios_bloqueados (
  id         uuid primary key default gen_random_uuid(),
  doctor_id  uuid not null references perfiles(id),
  inicia_en  timestamptz not null,
  termina_en timestamptz not null,
  motivo     text,
  creado_en  timestamptz default now()
);

-- ─── entradas_odontograma ────────────────────────────────────
-- Una fila por cada cambio. El estado actual es la entrada más reciente.

create table if not exists entradas_odontograma (
  id             uuid primary key default gen_random_uuid(),
  paciente_id    uuid not null references pacientes(id) on delete cascade,
  numero_diente  int not null check (numero_diente between 1 and 32),
  superficie     text not null check (superficie in (
                   'mesial','distal','oclusal','vestibular','lingual','general'
                 )),
  condicion      text not null check (condicion in (
                   'sano','caries','obturacion','corona','implante',
                   'endodoncia','fractura','ausente','extraccion_indicada'
                 )),
  notas          text,
  registrado_por uuid references perfiles(id),
  registrado_en  timestamptz default now()
);

create index if not exists odontograma_paciente_idx
  on entradas_odontograma (paciente_id, registrado_en desc);

-- ─── notas_clinicas ──────────────────────────────────────────

create table if not exists notas_clinicas (
  id                    uuid primary key default gen_random_uuid(),
  paciente_id           uuid not null references pacientes(id) on delete cascade,
  cita_id               uuid references citas(id),
  doctor_id             uuid not null references perfiles(id),
  motivo_consulta       text,
  diagnostico           text,
  tratamiento_realizado text,
  proximos_pasos        text,
  confirmado            boolean default false,
  confirmado_en         timestamptz,
  creado_en             timestamptz default now(),
  actualizado_en        timestamptz default now()
);

-- ─── adjuntos ────────────────────────────────────────────────

create table if not exists adjuntos (
  id               uuid primary key default gen_random_uuid(),
  nota_clinica_id  uuid not null references notas_clinicas(id) on delete cascade,
  paciente_id      uuid not null references pacientes(id),
  nombre_archivo   text not null,
  url_archivo      text not null,
  tipo_archivo     text check (tipo_archivo in ('imagen','pdf','radiografia','otro')),
  subido_por       uuid references perfiles(id),
  subido_en        timestamptz default now()
);

-- ─── planes_tratamiento ──────────────────────────────────────

create table if not exists planes_tratamiento (
  id             uuid primary key default gen_random_uuid(),
  paciente_id    uuid not null references pacientes(id) on delete cascade,
  doctor_id      uuid not null references perfiles(id),
  titulo         text not null,
  estado         text not null default 'activo'
                 check (estado in ('activo','completado','cancelado')),
  notas          text,
  creado_en      timestamptz default now(),
  actualizado_en timestamptz default now()
);

-- ─── procedimientos ──────────────────────────────────────────

create table if not exists procedimientos (
  id             uuid primary key default gen_random_uuid(),
  plan_id        uuid not null references planes_tratamiento(id) on delete cascade,
  cita_id        uuid references citas(id),
  descripcion    text not null,
  numero_diente  int check (numero_diente between 1 and 32),
  costo_estimado numeric(10,2) not null default 0,
  estado         text not null default 'pendiente'
                 check (estado in ('pendiente','en_proceso','completado')),
  completado_en  timestamptz,
  creado_en      timestamptz default now()
);

-- ─── pagos ───────────────────────────────────────────────────

create table if not exists pagos (
  id                uuid primary key default gen_random_uuid(),
  paciente_id       uuid not null references pacientes(id),
  cita_id           uuid references citas(id),
  procedimiento_id  uuid references procedimientos(id),
  doctor_id         uuid not null references perfiles(id),
  monto             numeric(10,2) not null check (monto > 0),
  metodo            text not null check (metodo in ('efectivo','tarjeta','transferencia','otro')),
  concepto          text,
  estado            text not null default 'pagado'
                    check (estado in ('pagado','pendiente','cancelado')),
  porcentaje_doctor numeric(5,2) not null,
  monto_doctor      numeric(10,2) not null,
  monto_clinica     numeric(10,2) not null,
  registrado_por    uuid references perfiles(id),
  pagado_en         timestamptz default now(),
  creado_en         timestamptz default now()
);

comment on column pagos.porcentaje_doctor is
  'Snapshot del porcentaje del doctor al momento del pago. Se guarda para auditoría histórica.';

-- ─── conversaciones_whatsapp ─────────────────────────────────
-- Preparado para Fase 2 / integración con n8n

create table if not exists conversaciones_whatsapp (
  id               uuid primary key default gen_random_uuid(),
  paciente_id      uuid references pacientes(id),
  telefono         text not null,
  estado           text not null default 'abierta'
                   check (estado in ('abierta','resuelta','bot')),
  ultimo_mensaje   text,
  ultimo_mensaje_en timestamptz,
  metadatos        jsonb default '{}',
  creado_en        timestamptz default now()
);

create index if not exists whatsapp_telefono_idx
  on conversaciones_whatsapp (telefono);

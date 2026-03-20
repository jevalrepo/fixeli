-- ============================================================
-- FIXELI — Schema inicial
-- Migración 002: Row Level Security
-- Ejecutar después de 001_tables.sql
-- ============================================================

-- ─── Habilitar RLS en todas las tablas ──────────────────────

alter table perfiles                 enable row level security;
alter table pacientes                enable row level security;
alter table citas                    enable row level security;
alter table horarios_bloqueados      enable row level security;
alter table entradas_odontograma     enable row level security;
alter table notas_clinicas           enable row level security;
alter table adjuntos                 enable row level security;
alter table planes_tratamiento       enable row level security;
alter table procedimientos           enable row level security;
alter table pagos                    enable row level security;
alter table conversaciones_whatsapp  enable row level security;

-- ─── Helper: rol del usuario actual ─────────────────────────

create or replace function rol_usuario_actual()
returns text as $$
  select rol from perfiles where id = auth.uid()
$$ language sql security definer stable;

-- ─── PERFILES ───────────────────────────────────────────────

-- Todos los usuarios autenticados pueden leer perfiles (necesario para mostrar doctores)
create policy "perfiles_leer" on perfiles
  for select using (auth.uid() is not null);

-- Solo admin puede insertar perfiles de otros
create policy "perfiles_crear" on perfiles
  for insert with check (rol_usuario_actual() = 'admin');

-- Admin edita cualquier perfil; un doctor puede editar solo el suyo
create policy "perfiles_editar" on perfiles
  for update using (
    rol_usuario_actual() = 'admin'
    or id = auth.uid()
  );

-- ─── PACIENTES ──────────────────────────────────────────────

-- Admin ve todos; doctor ve sus pacientes y los de sus citas
create policy "pacientes_leer" on pacientes
  for select using (
    rol_usuario_actual() = 'admin'
    or doctor_principal_id = auth.uid()
    or exists (
      select 1 from citas
      where citas.paciente_id = pacientes.id
        and citas.doctor_id = auth.uid()
    )
  );

create policy "pacientes_crear" on pacientes
  for insert with check (
    rol_usuario_actual() in ('admin', 'doctor')
  );

create policy "pacientes_editar" on pacientes
  for update using (
    rol_usuario_actual() = 'admin'
    or doctor_principal_id = auth.uid()
  );

-- Soft-delete (is_active): solo admin puede archivar
create policy "pacientes_eliminar" on pacientes
  for delete using (rol_usuario_actual() = 'admin');

-- ─── CITAS ──────────────────────────────────────────────────

create policy "citas_leer" on citas
  for select using (
    rol_usuario_actual() = 'admin'
    or doctor_id = auth.uid()
  );

create policy "citas_crear" on citas
  for insert with check (
    rol_usuario_actual() = 'admin'
    or doctor_id = auth.uid()
  );

create policy "citas_editar" on citas
  for update using (
    rol_usuario_actual() = 'admin'
    or doctor_id = auth.uid()
  );

create policy "citas_eliminar" on citas
  for delete using (rol_usuario_actual() = 'admin');

-- ─── HORARIOS_BLOQUEADOS ─────────────────────────────────────

create policy "horarios_leer" on horarios_bloqueados
  for select using (
    rol_usuario_actual() = 'admin'
    or doctor_id = auth.uid()
  );

create policy "horarios_crear" on horarios_bloqueados
  for insert with check (
    rol_usuario_actual() = 'admin'
    or doctor_id = auth.uid()
  );

create policy "horarios_eliminar" on horarios_bloqueados
  for delete using (
    rol_usuario_actual() = 'admin'
    or doctor_id = auth.uid()
  );

-- ─── ENTRADAS_ODONTOGRAMA ────────────────────────────────────

-- Admin ve todo; doctor ve entradas de sus pacientes o de sus citas
create policy "odontograma_leer" on entradas_odontograma
  for select using (
    rol_usuario_actual() = 'admin'
    or registrado_por = auth.uid()
    or exists (
      select 1 from citas
      where citas.paciente_id = entradas_odontograma.paciente_id
        and citas.doctor_id = auth.uid()
    )
  );

-- Las entradas son append-only (no hay UPDATE ni DELETE por diseño)
create policy "odontograma_crear" on entradas_odontograma
  for insert with check (
    rol_usuario_actual() in ('admin', 'doctor')
  );

-- ─── NOTAS_CLINICAS ──────────────────────────────────────────

create policy "notas_leer" on notas_clinicas
  for select using (
    rol_usuario_actual() = 'admin'
    or doctor_id = auth.uid()
  );

create policy "notas_crear" on notas_clinicas
  for insert with check (
    rol_usuario_actual() in ('admin', 'doctor')
  );

-- Solo se puede editar si la nota no está confirmada (el trigger lo refuerza a nivel DB)
create policy "notas_editar" on notas_clinicas
  for update using (
    (rol_usuario_actual() = 'admin' or doctor_id = auth.uid())
    and confirmado = false
  );

-- ─── ADJUNTOS ────────────────────────────────────────────────

create policy "adjuntos_leer" on adjuntos
  for select using (
    rol_usuario_actual() = 'admin'
    or subido_por = auth.uid()
    or exists (
      select 1 from notas_clinicas nc
      where nc.id = adjuntos.nota_clinica_id
        and nc.doctor_id = auth.uid()
    )
  );

create policy "adjuntos_crear" on adjuntos
  for insert with check (
    rol_usuario_actual() in ('admin', 'doctor')
  );

create policy "adjuntos_eliminar" on adjuntos
  for delete using (
    rol_usuario_actual() = 'admin'
    or subido_por = auth.uid()
  );

-- ─── PLANES_TRATAMIENTO ──────────────────────────────────────

create policy "planes_leer" on planes_tratamiento
  for select using (
    rol_usuario_actual() = 'admin'
    or doctor_id = auth.uid()
  );

create policy "planes_crear" on planes_tratamiento
  for insert with check (
    rol_usuario_actual() in ('admin', 'doctor')
  );

create policy "planes_editar" on planes_tratamiento
  for update using (
    rol_usuario_actual() = 'admin'
    or doctor_id = auth.uid()
  );

-- ─── PROCEDIMIENTOS ──────────────────────────────────────────

create policy "procedimientos_leer" on procedimientos
  for select using (
    exists (
      select 1 from planes_tratamiento pt
      where pt.id = procedimientos.plan_id
        and (rol_usuario_actual() = 'admin' or pt.doctor_id = auth.uid())
    )
  );

create policy "procedimientos_crear" on procedimientos
  for insert with check (
    rol_usuario_actual() in ('admin', 'doctor')
  );

create policy "procedimientos_editar" on procedimientos
  for update using (
    exists (
      select 1 from planes_tratamiento pt
      where pt.id = procedimientos.plan_id
        and (rol_usuario_actual() = 'admin' or pt.doctor_id = auth.uid())
    )
  );

-- ─── PAGOS ───────────────────────────────────────────────────

create policy "pagos_leer" on pagos
  for select using (
    rol_usuario_actual() = 'admin'
    or doctor_id = auth.uid()
  );

create policy "pagos_crear" on pagos
  for insert with check (
    rol_usuario_actual() in ('admin', 'doctor')
  );

-- Los pagos no se editan ni eliminan (auditoría); solo admin puede cambiar el estado
create policy "pagos_editar" on pagos
  for update using (rol_usuario_actual() = 'admin');

-- ─── CONVERSACIONES_WHATSAPP ─────────────────────────────────

-- Solo admin por ahora (Fase 2 lo abre al service role de n8n)
create policy "whatsapp_leer" on conversaciones_whatsapp
  for select using (rol_usuario_actual() = 'admin');

create policy "whatsapp_crear" on conversaciones_whatsapp
  for insert with check (rol_usuario_actual() = 'admin');

create policy "whatsapp_editar" on conversaciones_whatsapp
  for update using (rol_usuario_actual() = 'admin');

-- ============================================================
-- FIXELI — Schema inicial
-- Migración 003: Triggers y funciones
-- Ejecutar después de 002_rls.sql
-- ============================================================

-- ─── 1. Auto-crear perfil al registrar usuario ───────────────
-- Cuando Supabase Auth crea un usuario, se inserta su perfil
-- con rol 'doctor' por defecto. El admin lo cambia desde Configuración.

create or replace function crear_perfil_nuevo_usuario()
returns trigger as $$
begin
  insert into perfiles (id, nombre_completo, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Sin nombre'),
    'doctor'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists al_crear_usuario on auth.users;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute procedure crear_perfil_nuevo_usuario();

-- ─── 2. Validar solapamiento de citas por doctor ─────────────
-- Impide crear/editar citas que se solapen con otra cita del mismo doctor.
-- Las citas canceladas no cuentan para el solapamiento.

create or replace function verificar_solapamiento_cita()
returns trigger as $$
begin
  if exists (
    select 1 from citas
    where doctor_id = new.doctor_id
      and id != coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
      and estado not in ('cancelada')
      and (inicia_en, termina_en) overlaps (new.inicia_en, new.termina_en)
  ) then
    raise exception 'El doctor ya tiene una cita en ese horario';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists citas_sin_solapamiento on citas;

create trigger citas_sin_solapamiento
  before insert or update on citas
  for each row execute procedure verificar_solapamiento_cita();

-- ─── 3. Notas clínicas confirmadas son inmutables ────────────
-- Una vez que confirmado = true, la nota no puede editarse.
-- El cambio de confirmado=false → confirmado=true sí está permitido.

create or replace function prevenir_edicion_nota_confirmada()
returns trigger as $$
begin
  if old.confirmado = true and new.confirmado = true then
    raise exception 'Una nota confirmada no puede editarse';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists notas_clinicas_inmutable on notas_clinicas;

create trigger notas_clinicas_inmutable
  before update on notas_clinicas
  for each row execute procedure prevenir_edicion_nota_confirmada();

-- ─── 4. Auto-actualizar actualizado_en ───────────────────────
-- Función genérica para mantener actualizado_en al día.

create or replace function actualizar_timestamp()
returns trigger as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists pacientes_actualizar_fecha on pacientes;
create trigger pacientes_actualizar_fecha
  before update on pacientes
  for each row execute procedure actualizar_timestamp();

drop trigger if exists citas_actualizar_fecha on citas;
create trigger citas_actualizar_fecha
  before update on citas
  for each row execute procedure actualizar_timestamp();

drop trigger if exists notas_clinicas_actualizar_fecha on notas_clinicas;
create trigger notas_clinicas_actualizar_fecha
  before update on notas_clinicas
  for each row execute procedure actualizar_timestamp();

drop trigger if exists planes_tratamiento_actualizar_fecha on planes_tratamiento;
create trigger planes_tratamiento_actualizar_fecha
  before update on planes_tratamiento
  for each row execute procedure actualizar_timestamp();

-- ─── 5. Auto-registrar confirmado_en al confirmar nota ───────

create or replace function registrar_confirmacion_nota()
returns trigger as $$
begin
  if old.confirmado = false and new.confirmado = true then
    new.confirmado_en = now();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists notas_clinicas_registrar_confirmacion on notas_clinicas;

create trigger notas_clinicas_registrar_confirmacion
  before update on notas_clinicas
  for each row execute procedure registrar_confirmacion_nota();

-- ============================================================
-- FIXELI — Schema inicial
-- Migración 004: Storage buckets y políticas
-- Ejecutar después de 003_triggers.sql
-- ============================================================
-- Nota: los buckets también pueden crearse desde el dashboard de Supabase
-- en Storage → New bucket. Este SQL es equivalente.
-- ============================================================

-- ─── Crear buckets privados ──────────────────────────────────

insert into storage.buckets (id, name, public)
values ('fotos-pacientes', 'fotos-pacientes', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('adjuntos-clinicos', 'adjuntos-clinicos', false)
on conflict (id) do nothing;

-- ─── Políticas de Storage ────────────────────────────────────
-- Ambos buckets son privados. Los archivos se sirven siempre
-- con signed URLs (createSignedUrl), nunca como URLs públicas.

-- fotos-pacientes: lectura para usuarios autenticados
create policy "fotos_pacientes_leer"
  on storage.objects for select
  using (
    bucket_id = 'fotos-pacientes'
    and auth.uid() is not null
  );

-- fotos-pacientes: subir para usuarios autenticados
create policy "fotos_pacientes_subir"
  on storage.objects for insert
  with check (
    bucket_id = 'fotos-pacientes'
    and auth.uid() is not null
  );

create policy "fotos_pacientes_eliminar"
  on storage.objects for delete
  using (
    bucket_id = 'fotos-pacientes'
    and auth.uid() is not null
  );

-- adjuntos-clinicos: lectura para usuarios autenticados
create policy "adjuntos_clinicos_leer"
  on storage.objects for select
  using (
    bucket_id = 'adjuntos-clinicos'
    and auth.uid() is not null
  );

-- adjuntos-clinicos: subir para usuarios autenticados
create policy "adjuntos_clinicos_subir"
  on storage.objects for insert
  with check (
    bucket_id = 'adjuntos-clinicos'
    and auth.uid() is not null
  );

create policy "adjuntos_clinicos_eliminar"
  on storage.objects for delete
  using (
    bucket_id = 'adjuntos-clinicos'
    and auth.uid() is not null
  );

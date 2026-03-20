-- Migración 005: Campos de historia clínica en tabla pacientes
-- Ejecutar en Supabase SQL Editor

ALTER TABLE pacientes
  ADD COLUMN IF NOT EXISTS recomendado_por      TEXT,
  ADD COLUMN IF NOT EXISTS ultima_visita_dental TEXT,
  ADD COLUMN IF NOT EXISTS anestesia_previa     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reaccion_anestesia   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tipo_reaccion        TEXT,
  ADD COLUMN IF NOT EXISTS condiciones_medicas  JSONB NOT NULL DEFAULT '{}';

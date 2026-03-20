import { useEffect } from 'react'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import type { Paciente, CondicionesMedicas } from '../../types/database'

// ─── Schema ──────────────────────────────────────────────────────────────────

const esquema = z.object({
  // Datos personales
  nombre:               z.string().min(1, 'Requerido'),
  apellido:             z.string().min(1, 'Requerido'),
  fecha_nacimiento:     z.string().optional().transform(v => v || null),
  telefono:             z.string().optional().transform(v => v || null),
  email:                z.union([z.string().email('Email inválido'), z.literal('')])
                          .optional().transform(v => v || null),
  direccion:            z.string().optional().transform(v => v || null),
  recomendado_por:      z.string().optional().transform(v => v || null),
  ultima_visita_dental: z.string().optional().transform(v => v || null),
  // Anestesia
  anestesia_previa:     z.boolean().default(false),
  reaccion_anestesia:   z.boolean().default(false),
  tipo_reaccion:        z.string().optional().transform(v => v || null),
  // Condiciones médicas
  condiciones_medicas: z.object({
    cardiaca:            z.boolean().default(false),
    presion:             z.boolean().default(false),
    diabetes:            z.boolean().default(false),
    hepatitis:           z.boolean().default(false),
    tuberculosis:        z.boolean().default(false),
    nerviosos:           z.boolean().default(false),
    respiratorio:        z.boolean().default(false),
    hemofilia:           z.boolean().default(false),
    hemorragias:         z.boolean().default(false),
    otras:               z.string().optional().transform(v => v || ''),
    alergia_medicamento: z.boolean().default(false),
    embarazada:          z.boolean().default(false),
  }).default({}),
})

type FormData = z.infer<typeof esquema>

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  abierto:   boolean
  paciente:  Paciente | null
  onGuardar: (datos: FormData) => Promise<void>
  onCerrar:  () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputCls = `w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-slate-800
  outline-none focus:border-indigo-400 transition-colors placeholder-gray-300 bg-white`

function Campo({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function Toggle({
  label, checked, onChange,
}: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-slate-700">{label}</span>
      <div className="flex gap-2">
        {(['Sí', 'No'] as const).map(opt => {
          const val = opt === 'Sí'
          const active = checked === val
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(val)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors
                ${active
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group py-0.5">
      <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors
        ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 group-hover:border-indigo-400'}`}
        onClick={() => onChange(!checked)}
      >
        {checked && (
          <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M1 4l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  )
}

// ─── Condiciones médicas ──────────────────────────────────────────────────────

const CONDICIONES: { key: keyof CondicionesMedicas; label: string }[] = [
  { key: 'cardiaca',            label: 'Problemas cardiacos' },
  { key: 'presion',             label: 'Alta o baja presión' },
  { key: 'diabetes',            label: 'Diabetes' },
  { key: 'hepatitis',           label: 'Hepatitis' },
  { key: 'tuberculosis',        label: 'Tuberculosis' },
  { key: 'nerviosos',           label: 'Problemas nerviosos' },
  { key: 'respiratorio',        label: 'Enfermedades respiratorias' },
  { key: 'hemofilia',           label: 'Hemofilia' },
  { key: 'hemorragias',         label: 'Tendencias a hemorragias' },
  { key: 'alergia_medicamento', label: '¿Alérgico a algún medicamento?' },
  { key: 'embarazada',          label: '¿Está embarazada? (solo mujeres)' },
]

// ─── Componente ───────────────────────────────────────────────────────────────

export function ModalPaciente({ abierto, paciente, onGuardar, onCerrar }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(esquema) as Resolver<FormData> })

  const anestesiaPrevia   = watch('anestesia_previa')
  const reaccionAnestesia = watch('reaccion_anestesia')

  useEffect(() => {
    if (!abierto) return
    const cm = paciente?.condiciones_medicas ?? {}
    reset({
      nombre:               paciente?.nombre               ?? '',
      apellido:             paciente?.apellido             ?? '',
      fecha_nacimiento:     paciente?.fecha_nacimiento     ?? '',
      telefono:             paciente?.telefono             ?? '',
      email:                paciente?.email                ?? '',
      direccion:            paciente?.direccion            ?? '',
      recomendado_por:      paciente?.recomendado_por      ?? '',
      ultima_visita_dental: paciente?.ultima_visita_dental ?? '',
      anestesia_previa:     paciente?.anestesia_previa     ?? false,
      reaccion_anestesia:   paciente?.reaccion_anestesia   ?? false,
      tipo_reaccion:        paciente?.tipo_reaccion        ?? '',
      condiciones_medicas: {
        cardiaca:            cm.cardiaca            ?? false,
        presion:             cm.presion             ?? false,
        diabetes:            cm.diabetes            ?? false,
        hepatitis:           cm.hepatitis           ?? false,
        tuberculosis:        cm.tuberculosis        ?? false,
        nerviosos:           cm.nerviosos           ?? false,
        respiratorio:        cm.respiratorio        ?? false,
        hemofilia:           cm.hemofilia           ?? false,
        hemorragias:         cm.hemorragias         ?? false,
        otras:               cm.otras               ?? '',
        alergia_medicamento: cm.alergia_medicamento ?? false,
        embarazada:          cm.embarazada          ?? false,
      },
    })
  }, [abierto, paciente, reset])

  async function onSubmit(datos: FormData) {
    try {
      await onGuardar(datos)
      toast.success(paciente ? 'Paciente actualizado' : 'Paciente registrado')
    } catch {
      toast.error('Error al guardar el paciente')
    }
  }

  if (!abierto) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50 backdrop-blur-[2px]" onClick={onCerrar} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <aside className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] pointer-events-auto">

          {/* Cabecera */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <h2 className="text-base font-semibold text-slate-800">
              {paciente ? 'Editar paciente' : 'Nuevo paciente'}
            </h2>
            <button onClick={onCerrar} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} autoComplete="off" className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* ── Sección 1: Datos personales ── */}
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Datos personales
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Campo label="Nombre *" error={errors.nombre?.message}>
                      <input {...register('nombre')} className={inputCls} placeholder="Juan" />
                    </Campo>
                    <Campo label="Apellido *" error={errors.apellido?.message}>
                      <input {...register('apellido')} className={inputCls} placeholder="García" />
                    </Campo>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Campo label="Fecha de nacimiento">
                      <input type="date" {...register('fecha_nacimiento')} className={inputCls} />
                    </Campo>
                    <Campo label="Recomendado por">
                      <input {...register('recomendado_por')} className={inputCls} placeholder="Nombre del referido" />
                    </Campo>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Campo label="Teléfono">
                      <input {...register('telefono')} className={inputCls} placeholder="+52 55 0000 0000" />
                    </Campo>
                    <Campo label="Email" error={errors.email?.message}>
                      <input {...register('email')} className={inputCls} placeholder="correo@ejemplo.com" />
                    </Campo>
                  </div>
                  <Campo label="Dirección">
                    <input {...register('direccion')} className={inputCls} placeholder="Calle, número, colonia…" />
                  </Campo>
                  <Campo label="Última visita dental">
                    <input {...register('ultima_visita_dental')} className={inputCls} placeholder="Ej: hace 6 meses, enero 2024…" />
                  </Campo>
                </div>
              </section>

              {/* ── Sección 2: Historial médico ── */}
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Historial médico
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">

                  {/* Anestesia */}
                  <Controller
                    control={control}
                    name="anestesia_previa"
                    render={({ field }) => (
                      <Toggle
                        label="¿Ha recibido anestesia local con anterioridad?"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  {anestesiaPrevia && (
                    <Controller
                      control={control}
                      name="reaccion_anestesia"
                      render={({ field }) => (
                        <Toggle
                          label="¿Tuvo alguna reacción anormal a la anestesia?"
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  )}
                  {anestesiaPrevia && reaccionAnestesia && (
                    <Campo label="¿De qué tipo?">
                      <input {...register('tipo_reaccion')} className={inputCls} placeholder="Describe la reacción…" />
                    </Campo>
                  )}

                  <div className="border-t border-gray-200 pt-3 mt-1">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      Indica si presenta o ha presentado alguna de las siguientes condiciones:
                    </p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                      {CONDICIONES.map(({ key, label }) => (
                        <Controller
                          key={key}
                          control={control}
                          name={`condiciones_medicas.${key}` as any}
                          render={({ field }) => (
                            <Checkbox
                              label={label}
                              checked={!!field.value}
                              onChange={field.onChange}
                            />
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Otras enfermedades */}
                  <Campo label="Otras enfermedades (especifique)">
                    <input
                      {...register('condiciones_medicas.otras')}
                      className={inputCls}
                      placeholder="Ej: lupus, artritis…"
                    />
                  </Campo>

                </div>
              </section>

            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
              <button
                type="button"
                onClick={onCerrar}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium
                  text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white
                  text-sm font-medium transition-colors disabled:opacity-60"
              >
                {isSubmitting ? 'Guardando…' : paciente ? 'Actualizar' : 'Registrar'}
              </button>
            </div>
          </form>

        </aside>
      </div>
    </>
  )
}

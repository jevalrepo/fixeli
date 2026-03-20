import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import type { CondicionesMedicas } from '../../types/database'

// ─── Schema ──────────────────────────────────────────────────────────────────

const esquema = z.object({
  nombre:               z.string().min(1, 'Requerido'),
  apellido:             z.string().min(1, 'Requerido'),
  fecha_nacimiento:     z.string().optional(),
  recomendado_por:      z.string().optional(),
  lada:                 z.string().default('+52'),
  telefono:             z.string().optional(),
  email:                z.string().optional(),
  direccion:            z.string().optional(),
  ultima_visita_dental: z.string().optional(),
  anestesia_previa:     z.boolean(),
  reaccion_anestesia:   z.boolean(),
  tipo_reaccion:        z.string().optional(),
  condiciones_medicas:  z.object({
    cardiaca:            z.boolean(),
    presion:             z.boolean(),
    diabetes:            z.boolean(),
    hepatitis:           z.boolean(),
    tuberculosis:        z.boolean(),
    nerviosos:           z.boolean(),
    respiratorio:        z.boolean(),
    hemofilia:           z.boolean(),
    hemorragias:         z.boolean(),
    otras:               z.string().optional(),
    alergia_medicamento: z.boolean(),
    embarazada:          z.boolean(),
  }),
})

type FormData = z.infer<typeof esquema>

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  abierto:   boolean
  onGuardar: (datos: FormData) => Promise<void>
  onCerrar:  () => void
}

// ─── Pasos ────────────────────────────────────────────────────────────────────

const PASOS = [
  { titulo: 'Datos personales',        subtitulo: 'Empecemos con tu información básica' },
  { titulo: 'Información de contacto', subtitulo: '¿Cómo podemos comunicarnos contigo?' },
  { titulo: 'Historial de anestesia',  subtitulo: 'Información importante para tu tratamiento' },
  { titulo: 'Condiciones médicas',     subtitulo: 'Marca las que presentas o has presentado' },
]

const PASO_CAMPOS = [
  ['nombre', 'apellido'] as const,
  [] as const,
  [] as const,
  [] as const,
]

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
  { key: 'alergia_medicamento', label: 'Alérgico a algún medicamento' },
  { key: 'embarazada',          label: 'Embarazada (solo mujeres)' },
]

// ─── Estilos compartidos ───────────────────────────────────────────────────────

const inputCls = `w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base text-slate-800
  outline-none focus:border-indigo-400 transition-colors placeholder-gray-300 bg-white`

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Campo({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-sm text-red-500 mt-1.5">{error}</p>}
    </div>
  )
}

function OpcionSiNo({
  label, value, onChange,
}: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div>
      <p className="text-base font-medium text-slate-700 mb-3">{label}</p>
      <div className="grid grid-cols-2 gap-3">
        {([true, false] as const).map(v => (
          <button
            key={String(v)}
            type="button"
            onClick={() => onChange(v)}
            className={`py-4 rounded-xl text-base font-semibold transition-all ${
              value === v
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600 ring-offset-2'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {v ? 'Sí' : 'No'}
          </button>
        ))}
      </div>
    </div>
  )
}

function FilaCondicion({
  label, checked, onChange,
}: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center justify-between px-4 py-4 rounded-xl border transition-all text-left
        ${checked
          ? 'border-indigo-300 bg-indigo-50'
          : 'border-gray-200 bg-white hover:border-gray-300'}`}
    >
      <span className={`text-base ${checked ? 'text-indigo-700 font-medium' : 'text-slate-700'}`}>
        {label}
      </span>
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
        ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
        {checked && <Check size={13} className="text-white" strokeWidth={3} />}
      </div>
    </button>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function RegistroPaciente({ abierto, onGuardar, onCerrar }: Props) {
  const [paso, setPaso] = useState(0)
  const [enviando, setEnviando] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(esquema),
    defaultValues: {
      nombre: '', apellido: '', fecha_nacimiento: '', recomendado_por: '',
      lada: '+52', telefono: '', email: '', direccion: '', ultima_visita_dental: '',
      anestesia_previa: false, reaccion_anestesia: false, tipo_reaccion: '',
      condiciones_medicas: {
        cardiaca: false, presion: false, diabetes: false,
        hepatitis: false, tuberculosis: false, nerviosos: false,
        respiratorio: false, hemofilia: false, hemorragias: false,
        otras: '', alergia_medicamento: false, embarazada: false,
      },
    },
  })

  const anestesiaPrevia   = watch('anestesia_previa')
  const reaccionAnestesia = watch('reaccion_anestesia')

  async function irSiguiente() {
    const campos = PASO_CAMPOS[paso]
    if (campos.length > 0) {
      const valido = await trigger(campos as any)
      if (!valido) return
    }
    setPaso(p => p + 1)
  }

  async function onSubmit(datos: FormData) {
    setEnviando(true)
    try {
      const lada   = datos.lada?.trim() || '+52'
      const numTel = datos.telefono?.trim()
      await onGuardar({
        ...datos,
        telefono: numTel ? `${lada} ${numTel}` : undefined,
      })
      reset()
      setPaso(0)
    } finally {
      setEnviando(false)
    }
  }

  function cerrar() {
    reset()
    setPaso(0)
    onCerrar()
  }

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-60 bg-gray-50 flex flex-col">

      {/* Cabecera */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <span className="text-sm font-semibold text-slate-800">Nuevo paciente</span>
        <button
          type="button"
          onClick={cerrar}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Barra de progreso */}
      <div className="bg-white px-4 pb-4 shrink-0">
        <div className="flex gap-1.5 mt-3">
          {PASOS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= paso ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">Paso {paso + 1} de {PASOS.length}</p>
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-6">

          {/* Título del paso */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800">{PASOS[paso].titulo}</h2>
            <p className="text-sm text-gray-400 mt-1">{PASOS[paso].subtitulo}</p>
          </div>

          <form id="wizard-form" onSubmit={handleSubmit(onSubmit)} autoComplete="off">

            {/* ── Paso 1: Datos personales ── */}
            {paso === 0 && (
              <div className="space-y-4">
                <Campo label="Nombre *" error={errors.nombre?.message}>
                  <input
                    {...register('nombre')}
                    className={inputCls}
                    placeholder="Juan"
                    autoFocus
                  />
                </Campo>
                <Campo label="Apellido *" error={errors.apellido?.message}>
                  <input
                    {...register('apellido')}
                    className={inputCls}
                    placeholder="García"
                  />
                </Campo>
                <Campo label="Fecha de nacimiento">
                  <input
                    type="date"
                    {...register('fecha_nacimiento')}
                    className={inputCls}
                  />
                </Campo>
                <Campo label="¿Quién te recomendó con nosotros?">
                  <input
                    {...register('recomendado_por')}
                    className={inputCls}
                    placeholder="Nombre del familiar o amigo"
                  />
                </Campo>
              </div>
            )}

            {/* ── Paso 2: Contacto ── */}
            {paso === 1 && (
              <div className="space-y-4">
                <Campo label="Teléfono">
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-indigo-400 transition-colors bg-white">
                    <input
                      {...register('lada')}
                      type="text"
                      className="w-16 px-3 py-3.5 text-base font-medium text-slate-600 text-center outline-none bg-gray-50 border-r border-gray-200"
                    />
                    <input
                      {...register('telefono')}
                      type="tel"
                      placeholder="000 000 0000"
                      className="flex-1 px-4 py-3.5 text-base text-slate-800 outline-none bg-transparent"
                    />
                  </div>
                </Campo>
                <Campo label="Correo electrónico">
                  <input
                    {...register('email')}
                    className={inputCls}
                    placeholder="correo@ejemplo.com"
                    type="email"
                  />
                </Campo>
                <Campo label="Dirección">
                  <input
                    {...register('direccion')}
                    className={inputCls}
                    placeholder="Calle, número, colonia…"
                  />
                </Campo>
                <Campo label="¿Cuándo fue tu última visita al dentista?">
                  <input
                    {...register('ultima_visita_dental')}
                    className={inputCls}
                    placeholder="Ej: hace 6 meses, enero 2024…"
                  />
                </Campo>
              </div>
            )}

            {/* ── Paso 3: Anestesia ── */}
            {paso === 2 && (
              <div className="space-y-8">
                <Controller
                  control={control}
                  name="anestesia_previa"
                  render={({ field }) => (
                    <OpcionSiNo
                      label="¿Has recibido anestesia local alguna vez?"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {anestesiaPrevia && (
                  <Controller
                    control={control}
                    name="reaccion_anestesia"
                    render={({ field }) => (
                      <OpcionSiNo
                        label="¿Tuviste alguna reacción anormal a la anestesia?"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                )}
                {anestesiaPrevia && reaccionAnestesia && (
                  <Campo label="¿De qué tipo fue la reacción?">
                    <input
                      {...register('tipo_reaccion')}
                      className={inputCls}
                      placeholder="Describe la reacción…"
                    />
                  </Campo>
                )}
              </div>
            )}

            {/* ── Paso 4: Condiciones médicas ── */}
            {paso === 3 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-400 mb-4">Selecciona todas las que apliquen</p>
                {CONDICIONES.map(({ key, label }) => (
                  <Controller
                    key={key}
                    control={control}
                    name={`condiciones_medicas.${key}` as any}
                    render={({ field }) => (
                      <FilaCondicion
                        label={label}
                        checked={!!field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                ))}
                <div className="pt-2">
                  <Campo label="Otras enfermedades (especifique)">
                    <input
                      {...register('condiciones_medicas.otras')}
                      className={inputCls}
                      placeholder="Ej: lupus, artritis…"
                    />
                  </Campo>
                </div>
              </div>
            )}

          </form>
        </div>
      </div>

      {/* Navegación inferior */}
      <div className="bg-white border-t border-gray-100 px-4 py-4 flex gap-3 shrink-0">
        {paso > 0 && (
          <button
            type="button"
            onClick={() => setPaso(p => p - 1)}
            className="flex items-center gap-1.5 px-5 py-3.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={16} /> Anterior
          </button>
        )}

        {paso < PASOS.length - 1 ? (
          <button
            type="button"
            onClick={irSiguiente}
            className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Siguiente <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="submit"
            form="wizard-form"
            disabled={enviando}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {enviando ? 'Guardando…' : <><Check size={16} strokeWidth={2.5} /> Finalizar registro</>}
          </button>
        )}
      </div>

    </div>
  )
}

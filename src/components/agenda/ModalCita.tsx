import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import type { CitaConRelaciones } from '../../hooks/useCitas'
import type { EstadoCita, Perfil, Paciente } from '../../types/database'

// ─── Schema ───────────────────────────────────────────────────────────────────

const esquema = z.object({
  paciente_id: z.string().min(1, 'Selecciona un paciente'),
  doctor_id:   z.string().min(1, 'Selecciona un doctor'),
  fecha:       z.string().min(1, 'Requerido'),
  hora_inicio: z.string().min(1, 'Requerido'),
  hora_fin:    z.string().min(1, 'Requerido'),
  motivo:      z.string().optional().transform(v => v || null),
  notas:       z.string().optional().transform(v => v || null),
  estado:      z.enum(['pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio']),
})

type FormData = z.infer<typeof esquema>

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  abierto:    boolean
  cita:       CitaConRelaciones | null
  fechaInicial?: Date
  horaInicial?:  number
  pacientes:  Paciente[]
  doctores:   Perfil[]
  onGuardar:  (datos: { paciente_id: string; doctor_id: string; inicia_en: string; termina_en: string; motivo: string | null; notas: string | null; estado: EstadoCita }) => Promise<void>
  onEliminar?: (id: string) => Promise<void>
  onCerrar:   () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputCls = `w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-slate-800
  outline-none focus:border-indigo-400 transition-colors bg-white`

const ESTADOS: { value: EstadoCita; label: string }[] = [
  { value: 'pendiente',   label: 'Pendiente'   },
  { value: 'confirmada',  label: 'Confirmada'  },
  { value: 'completada',  label: 'Completada'  },
  { value: 'cancelada',   label: 'Cancelada'   },
  { value: 'no_asistio',  label: 'No asistió'  },
]

// ─── Componente ───────────────────────────────────────────────────────────────

export function ModalCita({ abierto, cita, fechaInicial, horaInicial, pacientes, doctores, onGuardar, onEliminar, onCerrar }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(esquema) as Resolver<FormData> })

  useEffect(() => {
    if (!abierto) return

    if (cita) {
      const ini = parseISO(cita.inicia_en)
      const fin = parseISO(cita.termina_en)
      reset({
        paciente_id: cita.paciente_id,
        doctor_id:   cita.doctor_id,
        fecha:       format(ini, 'yyyy-MM-dd'),
        hora_inicio: format(ini, 'HH:mm'),
        hora_fin:    format(fin, 'HH:mm'),
        motivo:      cita.motivo ?? '',
        notas:       cita.notas  ?? '',
        estado:      cita.estado,
      })
    } else {
      const fecha = fechaInicial ? format(fechaInicial, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
      const h = horaInicial ?? 9
      reset({
        paciente_id: '',
        doctor_id:   doctores[0]?.id ?? '',
        fecha,
        hora_inicio: `${String(h).padStart(2, '0')}:00`,
        hora_fin:    `${String(h + 1).padStart(2, '0')}:00`,
        motivo:      '',
        notas:       '',
        estado:      'pendiente',
      })
    }
  }, [abierto, cita, fechaInicial, horaInicial, doctores, reset])

  async function onSubmit(datos: FormData) {
    try {
      const inicia_en  = `${datos.fecha}T${datos.hora_inicio}:00`
      const termina_en = `${datos.fecha}T${datos.hora_fin}:00`
      await onGuardar({
        paciente_id: datos.paciente_id,
        doctor_id:   datos.doctor_id,
        inicia_en,
        termina_en,
        motivo:      datos.motivo ?? null,
        notas:       datos.notas  ?? null,
        estado:      datos.estado,
      })
      toast.success(cita ? 'Cita actualizada' : 'Cita creada')
    } catch {
      toast.error('Error al guardar la cita')
    }
  }

  async function handleEliminar() {
    if (!cita || !onEliminar) return
    if (!confirm('¿Eliminar esta cita?')) return
    try {
      await onEliminar(cita.id)
      toast.success('Cita eliminada')
      onCerrar()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  if (!abierto) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50 backdrop-blur-[2px]" onClick={onCerrar} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] pointer-events-auto">

          {/* Cabecera */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <h2 className="text-base font-semibold text-slate-800">
              {cita ? 'Editar cita' : 'Nueva cita'}
            </h2>
            <div className="flex items-center gap-1">
              {cita && onEliminar && (
                <button
                  onClick={handleEliminar}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button onClick={onCerrar} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} autoComplete="off" className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

              {/* Paciente */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Paciente *</label>
                <select {...register('paciente_id')} className={inputCls}>
                  <option value="">Seleccionar paciente…</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                  ))}
                </select>
                {errors.paciente_id && <p className="text-xs text-red-500 mt-1">{errors.paciente_id.message}</p>}
              </div>

              {/* Doctor */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Doctor *</label>
                <select {...register('doctor_id')} className={inputCls}>
                  {doctores.map(d => (
                    <option key={d.id} value={d.id}>{d.nombre_completo}</option>
                  ))}
                </select>
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Fecha *</label>
                <input type="date" {...register('fecha')} className={inputCls} />
              </div>

              {/* Hora inicio + fin */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Hora inicio *</label>
                  <input type="time" {...register('hora_inicio')} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Hora fin *</label>
                  <input type="time" {...register('hora_fin')} className={inputCls} />
                </div>
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Motivo de consulta</label>
                <input {...register('motivo')} className={inputCls} placeholder="Limpieza, revisión, dolor…" />
              </div>

              {/* Estado */}
              {cita && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
                  <select {...register('estado')} className={inputCls}>
                    {ESTADOS.map(e => (
                      <option key={e.value} value={e.value}>{e.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notas internas</label>
                <textarea
                  {...register('notas')}
                  rows={2}
                  className={`${inputCls} resize-none`}
                  placeholder="Observaciones para el doctor…"
                />
              </div>

            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
              <button
                type="button"
                onClick={onCerrar}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
              >
                {isSubmitting ? 'Guardando…' : cita ? 'Actualizar' : 'Crear cita'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </>
  )
}

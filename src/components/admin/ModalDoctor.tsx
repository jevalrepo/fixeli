import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import type { Perfil } from '../../types/database'

// ─── Colores disponibles ──────────────────────────────────────────────────────

const COLORES = [
  '#6366f1', '#8B5CF6', '#EC4899', '#EF4444', '#F97316',
  '#F59E0B', '#10B981', '#14B8A6', '#3B82F6', '#6B7280',
]

// ─── Schema ───────────────────────────────────────────────────────────────────

const esquemaBase = z.object({
  nombre_completo:     z.string().min(2, 'Mínimo 2 caracteres'),
  rol:                 z.enum(['admin', 'doctor']),
  especialidad:        z.string().optional().transform(v => v || null),
  lada:                z.string().default('+52'),
  telefono:            z.string().optional().transform(v => v || null),
  color:               z.string(),
  porcentaje_comision: z.coerce.number().min(0).max(100),
  activo:              z.boolean(),
})

const esquemaCrear = esquemaBase.extend({
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

const esquemaEditar = esquemaBase

type FormData = z.infer<typeof esquemaCrear>

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  abierto:   boolean
  doctor:    Perfil | null   // null = crear
  onGuardar: (datos: FormData) => Promise<void>
  onCerrar:  () => void
}

const inputCls = `w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-slate-800
  outline-none focus:border-indigo-400 transition-colors bg-white`

// ─── Componente ───────────────────────────────────────────────────────────────

export function ModalDoctor({ abierto, doctor, onGuardar, onCerrar }: Props) {
  const esEdicion = !!doctor
  const esquema   = esEdicion ? esquemaEditar : esquemaCrear

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(esquema) as never })

  function parseTelefono(tel: string | null | undefined) {
    if (!tel) return { lada: '+52', numero: '' }
    const match = tel.trim().match(/^(\+\d{1,4})\s*(.*)$/)
    if (match) return { lada: match[1], numero: match[2].trim() }
    return { lada: '+52', numero: tel.trim() }
  }

  useEffect(() => {
    if (!abierto) return
    if (doctor) {
      const { lada, numero } = parseTelefono(doctor.telefono)
      reset({
        nombre_completo:     doctor.nombre_completo,
        rol:                 doctor.rol,
        especialidad:        doctor.especialidad ?? '',
        lada,
        telefono:            numero,
        color:               doctor.color,
        porcentaje_comision: doctor.porcentaje_comision,
        activo:              doctor.activo,
        email:               '',
        password:            '',
      })
    } else {
      reset({
        nombre_completo:     '',
        rol:                 'doctor',
        especialidad:        '',
        lada:                '+52',
        telefono:            '',
        color:               COLORES[0],
        porcentaje_comision: 0,
        activo:              true,
        email:               '',
        password:            '',
      })
    }
  }, [abierto, doctor, reset])

  async function onSubmit(datos: FormData) {
    const lada     = datos.lada?.trim() || '+52'
    const numTel   = datos.telefono?.trim()
    const payload  = {
      ...datos,
      telefono: numTel ? `${lada} ${numTel}` : null,
    }
    await onGuardar(payload)
  }

  if (!abierto) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50 backdrop-blur-[2px]" onClick={onCerrar} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] pointer-events-auto">

          {/* Cabecera */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <h2 className="text-sm font-semibold text-slate-800">
              {esEdicion ? 'Editar doctor' : 'Nuevo doctor'}
            </h2>
            <button onClick={onCerrar} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} autoComplete="off" className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

              {/* Email + password — solo en creación */}
              {!esEdicion && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Correo electrónico *</label>
                    <input {...register('email')} type="email" className={inputCls} placeholder="doctor@clinica.com" />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Contraseña temporal *</label>
                    <input {...register('password')} type="password" className={inputCls} placeholder="Mínimo 6 caracteres" />
                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                  </div>
                </>
              )}

              {/* Nombre */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre completo *</label>
                <input {...register('nombre_completo')} className={inputCls} />
                {errors.nombre_completo && <p className="text-xs text-red-500 mt-1">{errors.nombre_completo.message}</p>}
              </div>

              {/* Especialidad */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Especialidad</label>
                <input {...register('especialidad')} className={inputCls} placeholder="Ortodoncia, Endodoncia…" />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono</label>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-indigo-400 transition-colors bg-white">
                  <input
                    {...register('lada')}
                    type="text"
                    className="w-14 px-2 py-2 text-sm font-medium text-slate-600 text-center outline-none bg-gray-50 border-r border-gray-200"
                  />
                  <input
                    {...register('telefono')}
                    type="tel"
                    placeholder="000 000 0000"
                    className="flex-1 px-3 py-2 text-sm text-slate-800 outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Rol + Comisión */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Rol *</label>
                  <select {...register('rol')} className={inputCls}>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Comisión %</label>
                  <input
                    {...register('porcentaje_comision')}
                    type="number"
                    min={0}
                    max={100}
                    className={inputCls}
                  />
                  {errors.porcentaje_comision && <p className="text-xs text-red-500 mt-1">{errors.porcentaje_comision.message}</p>}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Color identificador</label>
                <Controller
                  name="color"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-2 flex-wrap">
                      {COLORES.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => field.onChange(c)}
                          className={`w-7 h-7 rounded-full transition-transform hover:scale-110
                            ${field.value === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  )}
                />
              </div>

              {/* Activo — solo en edición */}
              {esEdicion && (
                <div className="flex items-center justify-between py-1">
                  <label className="text-sm font-medium text-slate-700">Cuenta activa</label>
                  <Controller
                    name="activo"
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(!field.value)}
                        className={`relative w-10 h-6 rounded-full transition-colors
                          ${field.value ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform
                          ${field.value ? 'translate-x-5' : 'translate-x-1'}`}
                        />
                      </button>
                    )}
                  />
                </div>
              )}

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
                {isSubmitting ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear doctor'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </>
  )
}

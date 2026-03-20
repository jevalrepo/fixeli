import { useEffect, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, KeyRound, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../hooks/useAuth'

const esquema = z.object({
  nombre_completo: z.string().min(2, 'Mínimo 2 caracteres'),
  lada:            z.string().default('+52'),
  telefono:        z.string().optional().transform(v => v || null),
  nueva_clave:     z.string().optional(),
  confirmar_clave: z.string().optional(),
}).refine(d => {
  if (d.nueva_clave && d.nueva_clave.length < 6) return false
  return true
}, { message: 'La contraseña debe tener al menos 6 caracteres', path: ['nueva_clave'] })
.refine(d => d.nueva_clave === d.confirmar_clave, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmar_clave'],
})

type FormData = z.infer<typeof esquema>

const inputCls = `w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-slate-800
  outline-none focus:border-indigo-400 transition-colors bg-white`

interface Props {
  abierto: boolean
  onCerrar: () => void
}

export function ModalPerfil({ abierto, onCerrar }: Props) {
  const { perfil, actualizarPerfil } = useAuth()
  const [mostrarClave, setMostrarClave] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(esquema) as Resolver<FormData> })

  function parseTelefono(tel: string | null | undefined): { lada: string; numero: string } {
    if (!tel) return { lada: '+52', numero: '' }
    const limpio = tel.trim()
    const match  = limpio.match(/^(\+\d{1,4})\s*(.*)$/)
    if (match) return { lada: match[1], numero: match[2].trim() }
    return { lada: '+52', numero: limpio }
  }

  useEffect(() => {
    if (!abierto || !perfil) return
    setMostrarClave(false)
    const { lada, numero } = parseTelefono(perfil.telefono)
    reset({
      nombre_completo: perfil.nombre_completo ?? '',
      lada,
      telefono:        numero,
      nueva_clave:     '',
      confirmar_clave: '',
    })
  }, [abierto, perfil, reset])

  async function onSubmit(datos: FormData) {
    const numTel = datos.telefono?.trim()
    const lada   = datos.lada?.trim() || '+52'
    const telefonoFinal = numTel ? `${lada} ${numTel}` : null
    try {
      await actualizarPerfil({
        nombre_completo: datos.nombre_completo,
        telefono:        telefonoFinal,
        nueva_clave:     datos.nueva_clave || undefined,
      })
      toast.success('Perfil actualizado')
      onCerrar()
    } catch {
      toast.error('Error al guardar los cambios')
    }
  }

  if (!abierto) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50 backdrop-blur-[2px]" onClick={onCerrar} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl flex flex-col pointer-events-auto">

          {/* Cabecera */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ backgroundColor: perfil?.color ?? '#6366f1' }}
              >
                {perfil?.nombre_completo?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Mi perfil</p>
                <p className="text-xs text-gray-400">{perfil?.rol === 'admin' ? 'Administrador' : 'Doctor'}</p>
              </div>
            </div>
            <button onClick={onCerrar} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} autoComplete="off" className="px-6 py-5 space-y-4">

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nombre completo</label>
              <input {...register('nombre_completo')} className={inputCls} />
              {errors.nombre_completo && (
                <p className="text-xs text-red-500 mt-1">{errors.nombre_completo.message}</p>
              )}
            </div>

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

            {/* Sección cambio de contraseña */}
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setMostrarClave(v => !v)}
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <KeyRound size={14} className="text-gray-400" />
                  Cambiar contraseña
                </span>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 transition-transform ${mostrarClave ? 'rotate-180' : ''}`}
                />
              </button>

              {mostrarClave && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nueva contraseña</label>
                    <input
                      type="password"
                      {...register('nueva_clave')}
                      className={inputCls}
                      placeholder="Mínimo 6 caracteres"
                    />
                    {errors.nueva_clave && (
                      <p className="text-xs text-red-500 mt-1">{errors.nueva_clave.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Confirmar contraseña</label>
                    <input
                      type="password"
                      {...register('confirmar_clave')}
                      className={inputCls}
                    />
                    {errors.confirmar_clave && (
                      <p className="text-xs text-red-500 mt-1">{errors.confirmar_clave.message}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-1">
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
                {isSubmitting ? 'Guardando…' : 'Guardar'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  )
}

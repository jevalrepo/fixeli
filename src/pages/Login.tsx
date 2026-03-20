import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'
import logoFixeli from '../assets/logo-claro-2.png'

const esquemaLogin = z.object({
  email: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Ingresa un correo válido'),
  clave: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

type DatosLogin = z.infer<typeof esquemaLogin>

export default function Login() {
  const navigate = useNavigate()
  const { iniciarSesion } = useAuth()
  const [enviando, setEnviando] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosLogin>({
    resolver: zodResolver(esquemaLogin),
  })

  const onSubmit = async (datos: DatosLogin) => {
    setEnviando(true)
    try {
      await iniciarSesion(datos.email, datos.clave)
      navigate('/agenda', { replace: true })
    } catch (error: unknown) {
      const mensaje =
        error instanceof Error ? error.message : 'Credenciales incorrectas'
      const esCredenciales =
        mensaje.toLowerCase().includes('invalid') ||
        mensaje.toLowerCase().includes('credentials')
      toast.error(esCredenciales ? 'Correo o contraseña incorrectos' : mensaje)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo / encabezado */}
        <div className="flex flex-col items-center mb-8">
          <img src={logoFixeli} alt="Fixeli" className="h-20 w-auto" />
        </div>

        {/* Tarjeta de login */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">
            Iniciar sesión
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} noValidate autoComplete="off" className="space-y-5">

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                {...register('email')}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-gray-900
                  placeholder:text-gray-400 outline-none transition-colors
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${errors.email
                    ? 'border-red-400 bg-red-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                placeholder="doctor@fixeli.mx"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label
                htmlFor="clave"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Contraseña
              </label>
              <input
                id="clave"
                type="password"
                autoComplete="current-password"
                {...register('clave')}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-gray-900
                  placeholder:text-gray-400 outline-none transition-colors
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${errors.clave
                    ? 'border-red-400 bg-red-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                placeholder="••••••••"
              />
              {errors.clave && (
                <p className="mt-1.5 text-xs text-red-500">{errors.clave.message}</p>
              )}
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={enviando}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700
                disabled:bg-blue-400 disabled:cursor-not-allowed
                text-white text-sm font-semibold rounded-lg
                transition-colors focus:outline-none focus:ring-2
                focus:ring-blue-500 focus:ring-offset-2 mt-2"
            >
              {enviando ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Iniciando sesión…
                </span>
              ) : (
                'Iniciar sesión'
              )}
            </button>

          </form>
        </div>

      </div>
    </div>
  )
}

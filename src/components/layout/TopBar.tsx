import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { LogoFixeli } from '../ui/LogoFixeli'

const titulos: Record<string, string> = {
  '/agenda':        'Agenda',
  '/pacientes':     'Pacientes',
  '/caja':          'Caja',
  '/configuracion': 'Configuración',
}

export function TopBar() {
  const { pathname } = useLocation()
  const { perfil } = useAuth()

  // Título: ruta exacta o ruta base (ej. /pacientes/123 → Pacientes)
  const base = '/' + pathname.split('/')[1]
  const titulo = titulos[base] ?? 'FIXELI'

  return (
    <header
      className="lg:hidden sticky top-0 z-40 flex items-center justify-between
        h-14 px-4 bg-white border-b border-gray-200"
    >
      {/* Logo */}
      <LogoFixeli variant="oscuro" className="h-6 w-auto" />

      {/* Título de la sección actual */}
      <span className="text-sm font-semibold text-gray-700 absolute left-1/2 -translate-x-1/2">
        {titulo}
      </span>

      {/* Avatar del usuario */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center
          text-white text-sm font-semibold shrink-0"
        style={{ backgroundColor: perfil?.color ?? '#3B82F6' }}
        title={perfil?.nombre_completo ?? ''}
      >
        {perfil?.nombre_completo?.charAt(0).toUpperCase() ?? '?'}
      </div>
    </header>
  )
}

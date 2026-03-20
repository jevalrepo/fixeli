import { NavLink } from 'react-router-dom'
import { CalendarDays, Users, Banknote, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { LogoFixeli } from '../ui/LogoFixeli'

const navItems = [
  { ruta: '/agenda',        etiqueta: 'Agenda',        Icono: CalendarDays },
  { ruta: '/pacientes',     etiqueta: 'Pacientes',      Icono: Users        },
  { ruta: '/caja',          etiqueta: 'Caja',           Icono: Banknote     },
  { ruta: '/configuracion', etiqueta: 'Configuración',  Icono: Settings, soloAdmin: true },
]

export function BarraSuperior() {
  const { perfil, esAdmin, cerrarSesion } = useAuth()

  const visibles = navItems.filter((item) => !item.soloAdmin || esAdmin)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="flex items-center h-14 px-4 lg:px-8 gap-8">

        {/* Logo */}
        <LogoFixeli variant="oscuro" className="h-6 w-auto shrink-0" />

        {/* Navegación — solo desktop */}
        <nav className="hidden lg:flex items-center gap-1 flex-1">
          {visibles.map(({ ruta, etiqueta, Icono }) => (
            <NavLink
              key={ruta}
              to={ruta}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium
                 transition-colors
                 ${isActive
                   ? 'bg-gray-100 text-gray-900'
                   : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icono
                    size={16}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={isActive ? 'text-gray-900' : 'text-gray-400'}
                  />
                  {etiqueta}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Separador flexible en móvil */}
        <div className="flex-1 lg:hidden" />

        {/* Usuario + salir — desktop */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="flex items-center gap-2.5 pr-3 border-r border-gray-200">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center
                text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: perfil?.color ?? '#3B82F6' }}
            >
              {perfil?.nombre_completo?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold text-gray-800 leading-none">
                {perfil?.nombre_completo?.split(' ')[0] ?? '—'}
              </p>
              <p className="text-[10px] text-gray-400 capitalize mt-0.5">
                {perfil?.rol === 'admin' ? 'Administrador' : 'Doctor'}
              </p>
            </div>
          </div>
          <button
            onClick={cerrarSesion}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs
              font-medium text-gray-500 hover:text-red-600 hover:bg-red-50
              transition-colors"
          >
            <LogOut size={14} />
            Salir
          </button>
        </div>

        {/* Avatar — móvil/tablet */}
        <div
          className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center
            text-white text-sm font-bold shrink-0"
          style={{ backgroundColor: perfil?.color ?? '#3B82F6' }}
        >
          {perfil?.nombre_completo?.charAt(0).toUpperCase() ?? '?'}
        </div>

      </div>
    </header>
  )
}

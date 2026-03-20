import { NavLink } from 'react-router-dom'
import {
  CalendarDays,
  Users,
  Banknote,
  Settings,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { LogoFixeli } from '../ui/LogoFixeli'

const navItems = [
  { ruta: '/agenda',        etiqueta: 'Agenda',         Icono: CalendarDays },
  { ruta: '/pacientes',     etiqueta: 'Pacientes',       Icono: Users        },
  { ruta: '/caja',          etiqueta: 'Caja',            Icono: Banknote     },
  { ruta: '/configuracion', etiqueta: 'Configuración',   Icono: Settings, soloAdmin: true },
]

export function Sidebar() {
  const { perfil, esAdmin, cerrarSesion } = useAuth()

  const itemsVisibles = navItems.filter(
    (item) => !item.soloAdmin || esAdmin
  )

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 shrink-0">

      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100">
        <LogoFixeli variant="oscuro" className="h-8 w-auto" />
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {itemsVisibles.map(({ ruta, etiqueta, Icono }) => (
          <NavLink
            key={ruta}
            to={ruta}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
               transition-colors
               ${isActive
                 ? 'bg-blue-50 text-blue-600'
                 : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
               }`
            }
          >
            {({ isActive }) => (
              <>
                <Icono
                  size={18}
                  className={isActive ? 'text-blue-600' : 'text-gray-400'}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {etiqueta}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Usuario y cerrar sesión */}
      <div className="px-3 py-4 border-t border-gray-100">
        {/* Info del usuario */}
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
            style={{ backgroundColor: perfil?.color ?? '#3B82F6' }}
          >
            {perfil?.nombre_completo?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {perfil?.nombre_completo ?? '—'}
            </p>
            <p className="text-xs text-gray-400 capitalize">
              {perfil?.rol === 'admin' ? 'Administrador' : 'Doctor'}
            </p>
          </div>
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={cerrarSesion}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm
            font-medium text-gray-500 hover:bg-red-50 hover:text-red-600
            transition-colors"
        >
          <LogOut size={18} className="text-gray-400" strokeWidth={2} />
          Cerrar sesión
        </button>
      </div>

    </aside>
  )
}

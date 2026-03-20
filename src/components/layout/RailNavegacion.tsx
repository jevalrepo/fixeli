import { NavLink } from 'react-router-dom'
import { CalendarDays, Users, LayoutDashboard, UserCog } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const navItems = [
  { ruta: '/agenda',    etiqueta: 'Agenda',    Icono: CalendarDays },
  { ruta: '/pacientes', etiqueta: 'Pacientes', Icono: Users        },
]

const adminItems = [
  { ruta: '/configuracion', etiqueta: 'Panel',    Icono: LayoutDashboard },
  { ruta: '/usuarios',      etiqueta: 'Usuarios', Icono: UserCog         },
]

function NavItem({ ruta, etiqueta, Icono }: { ruta: string; etiqueta: string; Icono: React.ElementType }) {
  return (
    <NavLink
      to={ruta}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
         ${isActive
           ? 'bg-indigo-50 text-indigo-600'
           : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900'
         }`
      }
    >
      {({ isActive }) => (
        <>
          <Icono
            size={20}
            strokeWidth={isActive ? 2 : 1.75}
            className={isActive ? 'text-indigo-500' : 'text-gray-400'}
          />
          {etiqueta}
        </>
      )}
    </NavLink>
  )
}

export function RailNavegacion() {
  const { esAdmin } = useAuth()

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-white border-r border-gray-100 overflow-y-auto">

      {/* Navegación principal */}
      <nav className="flex flex-col px-3 py-4 gap-0.5 flex-1">
        {navItems.map(item => <NavItem key={item.ruta} {...item} />)}
      </nav>

      {/* Sección administrador */}
      {esAdmin && (
        <div className="px-3 pb-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1.5">
            Administrador
          </p>
          <div className="flex flex-col gap-0.5">
            {adminItems.map(item => <NavItem key={item.ruta} {...item} />)}
          </div>
        </div>
      )}

    </aside>
  )
}

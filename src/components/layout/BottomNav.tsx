import { NavLink } from 'react-router-dom'
import {
  CalendarDays,
  Users,
  Banknote,
  Settings,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const navItems = [
  { ruta: '/agenda',        etiqueta: 'Agenda',      Icono: CalendarDays },
  { ruta: '/pacientes',     etiqueta: 'Pacientes',    Icono: Users        },
  { ruta: '/caja',          etiqueta: 'Caja',         Icono: Banknote     },
  { ruta: '/configuracion', etiqueta: 'Config.',      Icono: Settings, soloAdmin: true },
]

export function BottomNav() {
  const { esAdmin } = useAuth()

  const itemsVisibles = navItems.filter(
    (item) => !item.soloAdmin || esAdmin
  )

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50
        bg-white border-t border-gray-200 safe-area-inset-bottom"
      aria-label="Navegación principal"
    >
      <div className="flex items-stretch">
        {itemsVisibles.map(({ ruta, etiqueta, Icono }) => (
          <NavLink
            key={ruta}
            to={ruta}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-2 gap-1 min-h-[56px]
               transition-colors
               ${isActive
                 ? 'text-blue-600'
                 : 'text-gray-400 hover:text-gray-600'
               }`
            }
          >
            {({ isActive }) => (
              <>
                <Icono
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-[10px] font-medium leading-none">
                  {etiqueta}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

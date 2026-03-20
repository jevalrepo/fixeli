import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { PantallaCarga } from '../ui/Spinner'
import { NavSuperior } from './NavSuperior'
import { RailNavegacion } from './RailNavegacion'
import { BottomNav } from './BottomNav'

export function LayoutAutenticado() {
  const { usuario, cargando } = useAuth()

  if (cargando) return <PantallaCarga />
  if (!usuario) return <Navigate to="/login" replace />

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">

      {/* Barra superior — logo + usuario */}
      <div className="lg:block hidden">
        <NavSuperior />
      </div>

      {/* Cuerpo: sidebar + contenido */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar con menú */}
        <RailNavegacion />

        {/* Contenido principal */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <Outlet />
        </main>

      </div>

      {/* Navegación inferior — solo móvil/tablet */}
      <BottomNav />

    </div>
  )
}

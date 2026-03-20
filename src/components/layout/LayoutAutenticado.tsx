import { useEffect } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { PantallaCarga } from '../ui/Spinner'
import { NavSuperior } from './NavSuperior'
import { RailNavegacion } from './RailNavegacion'
import { BottomNav } from './BottomNav'

export function LayoutAutenticado() {
  const { usuario, cargando } = useAuth()

  // Refresca el token de sesión cada vez que el usuario vuelve a la pestaña,
  // evitando que las consultas fallen por sesión expirada tras inactividad.
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  if (cargando) return <PantallaCarga />
  if (!usuario) return <Navigate to="/login" replace />

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">

      {/* Barra superior — logo + usuario */}
      <NavSuperior />

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

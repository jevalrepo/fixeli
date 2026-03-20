import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { PantallaCarga } from '../ui/Spinner'

interface Props {
  children: React.ReactNode
  soloAdmin?: boolean
}

export function RutaProtegida({ children, soloAdmin = false }: Props) {
  const { usuario, perfil, cargando } = useAuth()

  if (cargando) return <PantallaCarga />
  if (!usuario) return <Navigate to="/login" replace />
  if (soloAdmin && perfil?.rol !== 'admin') return <Navigate to="/agenda" replace />

  return <>{children}</>
}

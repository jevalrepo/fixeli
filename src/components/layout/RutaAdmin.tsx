import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface Props {
  children: React.ReactNode
}

export function RutaAdmin({ children }: Props) {
  const { esAdmin } = useAuth()

  if (!esAdmin) return <Navigate to="/agenda" replace />

  return <>{children}</>
}

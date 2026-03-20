import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'

import { useAuth } from './hooks/useAuth'
import { LayoutAutenticado } from './components/layout/LayoutAutenticado'
import { RutaAdmin } from './components/layout/RutaAdmin'

import Login from './pages/Login'
import Agenda from './pages/Agenda'
import Pacientes from './pages/Pacientes'
import DetallePaciente from './pages/DetallePaciente'
import Caja from './pages/Caja'
import Configuracion from './pages/Configuracion'
import Usuarios from './pages/Usuarios'

function Rutas() {
  const { inicializarAuth } = useAuth()

  useEffect(() => {
    let cancelar: (() => void) | undefined
    inicializarAuth().then((fn) => { cancelar = fn })
    return () => cancelar?.()
  }, [inicializarAuth])

  return (
    <Routes>
      {/* Pública */}
      <Route path="/login" element={<Login />} />

      {/* Protegidas — usan el layout con Sidebar / BottomNav */}
      <Route element={<LayoutAutenticado />}>
        <Route index element={<Navigate to="/agenda" replace />} />
        <Route path="/agenda"    element={<Agenda />} />
        <Route path="/pacientes" element={<Pacientes />} />
        <Route path="/pacientes/:id" element={<DetallePaciente />} />
        <Route path="/caja"      element={<Caja />} />
        <Route path="/configuracion" element={
          <RutaAdmin><Configuracion /></RutaAdmin>
        } />
        <Route path="/usuarios" element={
          <RutaAdmin><Usuarios /></RutaAdmin>
        } />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/agenda" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Rutas />
      <Toaster richColors position="top-right" />
    </BrowserRouter>
  )
}

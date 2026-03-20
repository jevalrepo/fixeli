import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Perfil, Rol } from '../types/database'

export function usePerfiles() {
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [cargando, setCargando] = useState(true)

  async function cargar() {
    setCargando(true)
    const { data } = await supabase
      .from('perfiles')
      .select('*')
      .order('nombre_completo')
    setPerfiles(data ?? [])
    setCargando(false)
  }

  useEffect(() => { cargar() }, [])

  async function crear(datos: {
    email: string
    password: string
    nombre_completo: string
    rol: Rol
    especialidad: string | null
    telefono: string | null
    color: string
    porcentaje_comision: number
  }) {
    // Guarda la sesión activa del admin antes de crear el nuevo usuario
    const { data: { session: sesionAdmin } } = await supabase.auth.getSession()

    // Crea el usuario de auth (signUp reemplaza la sesión activa automáticamente)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: datos.email,
      password: datos.password,
    })
    if (authError) throw authError
    const userId = authData.user?.id
    if (!userId) throw new Error('No se pudo obtener el ID del usuario')

    // Inserta o actualiza el perfil (puede haber sido creado por un trigger)
    const { error: perfilError } = await supabase
      .from('perfiles')
      .upsert({
        id:                  userId,
        nombre_completo:     datos.nombre_completo,
        rol:                 datos.rol,
        especialidad:        datos.especialidad,
        telefono:            datos.telefono,
        color:               datos.color,
        porcentaje_comision: datos.porcentaje_comision,
        activo:              true,
      })
    if (perfilError) throw perfilError

    // Restaura la sesión del admin para que no se loguee como el usuario creado
    if (sesionAdmin) {
      await supabase.auth.setSession({
        access_token:  sesionAdmin.access_token,
        refresh_token: sesionAdmin.refresh_token,
      })
    }

    await cargar()
  }

  async function actualizar(id: string, datos: {
    nombre_completo: string
    rol: Rol
    especialidad: string | null
    telefono: string | null
    color: string
    porcentaje_comision: number
    activo: boolean
  }) {
    const { error } = await supabase
      .from('perfiles')
      .update(datos)
      .eq('id', id)
    if (error) throw error
    setPerfiles(prev => prev.map(p => p.id === id ? { ...p, ...datos } : p))
  }

  async function eliminar(id: string) {
    const { error } = await supabase.from('perfiles').delete().eq('id', id)
    if (error) throw error
    setPerfiles(prev => prev.filter(p => p.id !== id))
  }

  return { perfiles, cargando, crear, actualizar, eliminar }
}

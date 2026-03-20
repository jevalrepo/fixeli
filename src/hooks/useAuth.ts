import { useCallback } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import type { Perfil } from '../types/database'

async function obtenerPerfil(uid: string): Promise<Perfil | null> {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', uid)
    .single()

  if (error) {
    console.error('Error al cargar perfil:', error.message)
    return null
  }
  return data
}

export function useAuth() {
  const { usuario, perfil, cargando, setUsuario, setPerfil, setCargando, limpiar } =
    useAuthStore()

  const inicializarAuth = useCallback(async () => {
    setCargando(true)

    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      setUsuario(session.user)
      const p = await obtenerPerfil(session.user.id)
      setPerfil(p)
    }

    setCargando(false)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_evento, session) => {
        if (session?.user) {
          setUsuario(session.user)
          const p = await obtenerPerfil(session.user.id)
          setPerfil(p)
        } else {
          limpiar()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [setCargando, setUsuario, setPerfil, limpiar])

  const iniciarSesion = async (email: string, clave: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: clave,
    })
    if (error) throw error
  }

  const cerrarSesion = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Error al cerrar sesión')
      return
    }
    limpiar()
  }

  const actualizarPerfil = async (datos: {
    nombre_completo: string
    telefono: string | null
    nueva_clave?: string
  }) => {
    if (!usuario) throw new Error('No autenticado')

    const { error: errorPerfil } = await supabase
      .from('perfiles')
      .update({ nombre_completo: datos.nombre_completo, telefono: datos.telefono })
      .eq('id', usuario.id)
    if (errorPerfil) throw errorPerfil

    if (datos.nueva_clave) {
      const { error: errorClave } = await supabase.auth.updateUser({ password: datos.nueva_clave })
      if (errorClave) throw errorClave
    }

    // Refrescar perfil en el store
    const p = await obtenerPerfil(usuario.id)
    setPerfil(p)
  }

  return {
    usuario,
    perfil,
    cargando,
    esAdmin: perfil?.rol === 'admin',
    inicializarAuth,
    iniciarSesion,
    cerrarSesion,
    actualizarPerfil,
  }
}

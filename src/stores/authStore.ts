import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Perfil } from '../types/database'

interface EstadoAuth {
  usuario: User | null
  perfil: Perfil | null
  cargando: boolean
  setUsuario: (usuario: User | null) => void
  setPerfil: (perfil: Perfil | null) => void
  setCargando: (v: boolean) => void
  limpiar: () => void
}

export const useAuthStore = create<EstadoAuth>((set) => ({
  usuario: null,
  perfil: null,
  cargando: true,
  setUsuario: (usuario) => set({ usuario }),
  setPerfil: (perfil) => set({ perfil }),
  setCargando: (cargando) => set({ cargando }),
  limpiar: () => set({ usuario: null, perfil: null, cargando: false }),
}))

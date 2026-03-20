import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Paciente } from '../types/database'

export function usePacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('activo', true)
        .order('creado_en', { ascending: false })
      if (error) console.error('Error cargando pacientes:', error)
      setPacientes(data ?? [])
    } finally {
      setCargando(false)
    }
  }, [])

  async function crear(datos: Omit<Paciente, 'id' | 'creado_en' | 'actualizado_en' | 'activo' | 'creado_por' | 'url_foto' | 'doctor_principal_id'>) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('pacientes')
      .insert({ ...datos, activo: true, creado_por: user?.id ?? null })
      .select()
      .single()
    if (error) throw error
    setPacientes(prev => [data, ...prev])
    return data
  }

  async function actualizar(id: string, datos: Partial<Paciente>) {
    const { data, error } = await supabase
      .from('pacientes')
      .update(datos)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setPacientes(prev => prev.map(p => p.id === id ? data : p))
    return data
  }

  async function archivar(id: string) {
    const { error } = await supabase
      .from('pacientes')
      .update({ activo: false })
      .eq('id', id)
    if (error) throw error
    setPacientes(prev => prev.filter(p => p.id !== id))
  }

  useEffect(() => { cargar() }, [cargar])

  return { pacientes, cargando, crear, actualizar, archivar, recargar: cargar }
}

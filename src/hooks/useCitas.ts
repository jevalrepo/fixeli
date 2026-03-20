import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Cita } from '../types/database'

export interface CitaConRelaciones extends Cita {
  paciente: { nombre: string; apellido: string } | null
  doctor:   { nombre_completo: string; color: string } | null
}

export function useCitas(semanaInicio: Date) {
  const [citas, setCitas] = useState<CitaConRelaciones[]>([])
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    setCargando(true)
    const inicio = new Date(semanaInicio)
    inicio.setHours(0, 0, 0, 0)
    const fin = new Date(inicio)
    fin.setDate(fin.getDate() + 7)

    try {
      const { data, error } = await supabase
        .from('citas')
        .select(`
          *,
          paciente:pacientes(nombre, apellido),
          doctor:perfiles!citas_doctor_id_fkey(nombre_completo, color)
        `)
        .gte('inicia_en', inicio.toISOString())
        .lt('inicia_en', fin.toISOString())
        .order('inicia_en')

      if (error) console.error('Error cargando citas:', error)
      setCitas((data as CitaConRelaciones[]) ?? [])
    } finally {
      setCargando(false)
    }
  }, [semanaInicio])

  async function crear(datos: {
    paciente_id: string
    doctor_id: string
    inicia_en: string
    termina_en: string
    motivo?: string | null
    notas?: string | null
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('citas')
      .insert({ ...datos, estado: 'pendiente', creado_por: user?.id ?? null })
      .select(`*, paciente:pacientes(nombre, apellido), doctor:perfiles!citas_doctor_id_fkey(nombre_completo, color)`)
      .single()
    if (error) throw error
    setCitas(prev => [...prev, data as CitaConRelaciones])
    return data
  }

  async function actualizar(id: string, datos: Partial<Cita>) {
    const { data, error } = await supabase
      .from('citas')
      .update(datos)
      .eq('id', id)
      .select(`*, paciente:pacientes(nombre, apellido), doctor:perfiles!citas_doctor_id_fkey(nombre_completo, color)`)
      .single()
    if (error) throw error
    setCitas(prev => prev.map(c => c.id === id ? data as CitaConRelaciones : c))
    return data
  }

  async function eliminar(id: string) {
    const { error } = await supabase.from('citas').delete().eq('id', id)
    if (error) throw error
    setCitas(prev => prev.filter(c => c.id !== id))
  }

  useEffect(() => { cargar() }, [cargar])

  return { citas, cargando, crear, actualizar, eliminar, recargar: cargar }
}

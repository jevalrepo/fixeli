import { useState, useEffect, useCallback, useRef } from 'react'
import { startOfMonth, endOfMonth, addDays } from 'date-fns'
import { supabase } from '../lib/supabase'
import type { CitaConRelaciones } from './useCitas'
import type { Cita } from '../types/database'

export function useCitasMes(mes: Date) {
  const [citas, setCitas] = useState<CitaConRelaciones[]>([])
  const [cargando, setCargando] = useState(true)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const cargar = useCallback(async () => {
    setCargando(true)
    const inicio = startOfMonth(mes)
    const fin    = addDays(endOfMonth(mes), 1)

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

      if (!mounted.current) return
      if (error) console.error('Error cargando citas:', error)
      setCitas((data as CitaConRelaciones[]) ?? [])
    } catch {
      // error de red
    } finally {
      if (mounted.current) setCargando(false)
    }
  }, [mes])

  useEffect(() => { cargar() }, [cargar])

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
    setCitas(prev => [...prev, data as CitaConRelaciones].sort(
      (a, b) => a.inicia_en.localeCompare(b.inicia_en)
    ))
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

  return { citas, cargando, crear, actualizar, eliminar, recargar: cargar }
}

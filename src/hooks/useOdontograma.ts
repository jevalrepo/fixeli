import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useRecargarAlEnfocar } from './useRecargarAlEnfocar'
import type { EntradaOdontograma, SuperficieOdontograma, CondicionOdontograma } from '../types/database'

export function useOdontograma(pacienteId: string) {
  const [entradas, setEntradas] = useState<EntradaOdontograma[]>([])
  const [cargando, setCargando] = useState(true)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const { data, error } = await supabase
        .from('entradas_odontograma')
        .select('*')
        .eq('paciente_id', pacienteId)
      if (!mounted.current) return
      if (error) console.error('Error cargando odontograma:', error)
      setEntradas(data ?? [])
    } catch {
      // error de red
    } finally {
      if (mounted.current) setCargando(false)
    }
  }, [pacienteId])

  async function guardar(
    numeroDiente: number,
    superficie: SuperficieOdontograma,
    condicion: CondicionOdontograma,
    notas?: string,
  ) {
    const existente = entradas.find(
      e => e.numero_diente === numeroDiente && e.superficie === superficie,
    )

    if (condicion === 'sano') {
      if (existente) {
        await supabase.from('entradas_odontograma').delete().eq('id', existente.id)
        setEntradas(prev => prev.filter(e => e.id !== existente.id))
      }
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const uid = user?.id ?? null

    if (existente) {
      const { data, error } = await supabase
        .from('entradas_odontograma')
        .update({ condicion, notas: notas ?? null })
        .eq('id', existente.id)
        .select()
        .single()
      if (error) throw error
      setEntradas(prev => prev.map(e => e.id === existente.id ? data : e))
    } else {
      const { data, error } = await supabase
        .from('entradas_odontograma')
        .insert({ paciente_id: pacienteId, numero_diente: numeroDiente, superficie, condicion, notas: notas ?? null, registrado_por: uid })
        .select()
        .single()
      if (error) throw error
      setEntradas(prev => [...prev, data])
    }
  }

  function condicionDe(numeroDiente: number, superficie: SuperficieOdontograma): CondicionOdontograma {
    return entradas.find(
      e => e.numero_diente === numeroDiente && e.superficie === superficie,
    )?.condicion ?? 'sano'
  }

  function dieneteTieneCondicion(numeroDiente: number): boolean {
    return entradas.some(e => e.numero_diente === numeroDiente)
  }

  useEffect(() => { cargar() }, [cargar])
  useRecargarAlEnfocar(cargar)

  return { entradas, cargando, guardar, condicionDe, dieneteTieneCondicion }
}

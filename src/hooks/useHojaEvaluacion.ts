import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Procedimiento, Pago } from '../types/database'

export interface EntradaEvaluacion {
  tipo: 'procedimiento' | 'pago'
  fecha: string
  descripcion: string
  monto: number | null
  id: string
}

export function useHojaEvaluacion(pacienteId: string) {
  const [entradas, setEntradas] = useState<EntradaEvaluacion[]>([])
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const [{ data: procs }, { data: pagos }] = await Promise.all([
        supabase
          .from('procedimientos')
          .select('*, planes_tratamiento!inner(paciente_id)')
          .eq('planes_tratamiento.paciente_id', pacienteId)
          .order('creado_en', { ascending: false }),
        supabase
          .from('pagos')
          .select('*')
          .eq('paciente_id', pacienteId)
          .order('pagado_en', { ascending: false }),
      ])

      const filas: EntradaEvaluacion[] = [
        ...(procs ?? []).map((p: Procedimiento) => ({
          tipo: 'procedimiento' as const,
          fecha: p.creado_en,
          descripcion: p.descripcion,
          monto: p.costo_estimado,
          id: p.id,
        })),
        ...(pagos ?? []).map((p: Pago) => ({
          tipo: 'pago' as const,
          fecha: p.pagado_en,
          descripcion: p.concepto ?? 'Pago',
          monto: p.monto,
          id: p.id,
        })),
      ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

      setEntradas(filas)
    } finally {
      setCargando(false)
    }
  }, [pacienteId])

  useEffect(() => { cargar() }, [cargar])

  return { entradas, cargando, recargar: cargar }
}

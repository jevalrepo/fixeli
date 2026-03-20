import { useState, useEffect, useCallback, useRef } from 'react'
import { startOfMonth, endOfMonth } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useRecargarAlEnfocar } from './useRecargarAlEnfocar'

interface Stats {
  totalPacientes: number
  citasMes: number
  doctoresActivos: number
  citasHoy: number
}

export function useStats() {
  const [stats, setStats] = useState<Stats>({
    totalPacientes: 0,
    citasMes: 0,
    doctoresActivos: 0,
    citasHoy: 0,
  })
  const [cargando, setCargando] = useState(true)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const hoy   = new Date()
      const inicio = startOfMonth(hoy)
      const fin    = endOfMonth(hoy)
      const inicioHoy = new Date(hoy); inicioHoy.setHours(0, 0, 0, 0)
      const finHoy    = new Date(hoy); finHoy.setHours(23, 59, 59, 999)

      const [pacientes, citasMes, doctores, citasHoy] = await Promise.all([
        supabase.from('pacientes').select('id', { count: 'exact', head: true }).eq('activo', true),
        supabase.from('citas').select('id', { count: 'exact', head: true })
          .gte('inicia_en', inicio.toISOString())
          .lte('inicia_en', fin.toISOString()),
        supabase.from('perfiles').select('id', { count: 'exact', head: true }).eq('activo', true),
        supabase.from('citas').select('id', { count: 'exact', head: true })
          .gte('inicia_en', inicioHoy.toISOString())
          .lte('inicia_en', finHoy.toISOString()),
      ])

      if (!mounted.current) return
      setStats({
        totalPacientes:  pacientes.count  ?? 0,
        citasMes:        citasMes.count   ?? 0,
        doctoresActivos: doctores.count   ?? 0,
        citasHoy:        citasHoy.count   ?? 0,
      })
    } catch {
      // error de red — los stats quedan en 0
    } finally {
      if (mounted.current) setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])
  useRecargarAlEnfocar(cargar)

  return { stats, cargando }
}

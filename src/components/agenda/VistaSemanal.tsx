import { useMemo } from 'react'
import { format, addDays, isSameDay, parseISO, differenceInMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
import type { CitaConRelaciones } from '../../hooks/useCitas'
import type { EstadoCita } from '../../types/database'

// ─── Configuración ────────────────────────────────────────────────────────────

const HORA_INICIO = 8   // 8am
const HORA_FIN    = 20  // 8pm
const HORAS       = Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => HORA_INICIO + i)
const ALTURA_HORA = 64  // px por hora

// ─── Colores por estado ───────────────────────────────────────────────────────

const ESTADO_ESTILOS: Record<EstadoCita, string> = {
  pendiente:   'border-l-amber-400  bg-amber-50  text-amber-800',
  confirmada:  'border-l-indigo-400 bg-indigo-50 text-indigo-800',
  completada:  'border-l-green-400  bg-green-50  text-green-800',
  cancelada:   'border-l-gray-300   bg-gray-50   text-gray-400 line-through',
  no_asistio:  'border-l-red-300    bg-red-50    text-red-700',
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  semanaInicio: Date
  citas: CitaConRelaciones[]
  onClickCita: (cita: CitaConRelaciones) => void
  onClickHueco: (fecha: Date, hora: number) => void
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function VistaSemanal({ semanaInicio, citas, onClickCita, onClickHueco }: Props) {
  const dias = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(semanaInicio, i)),
    [semanaInicio],
  )

  // Agrupa citas por día
  const citasPorDia = useMemo(() => {
    const mapa: Record<string, CitaConRelaciones[]> = {}
    dias.forEach(d => { mapa[format(d, 'yyyy-MM-dd')] = [] })
    citas.forEach(c => {
      const key = format(parseISO(c.inicia_en), 'yyyy-MM-dd')
      if (mapa[key]) mapa[key].push(c)
    })
    return mapa
  }, [citas, dias])

  const hoy = new Date()

  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* Cabecera de días */}
      <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-gray-200 bg-white shrink-0">
        <div /> {/* espacio para columna de horas */}
        {dias.map(dia => {
          const esHoy = isSameDay(dia, hoy)
          return (
            <div key={dia.toISOString()} className="text-center py-3 border-l border-gray-100">
              <p className={`text-[11px] font-medium uppercase tracking-wide
                ${esHoy ? 'text-indigo-500' : 'text-gray-400'}`}>
                {format(dia, 'EEE', { locale: es })}
              </p>
              <p className={`text-lg font-bold mt-0.5
                ${esHoy
                  ? 'w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center mx-auto'
                  : 'text-slate-700'}`}>
                {format(dia, 'd')}
              </p>
            </div>
          )
        })}
      </div>

      {/* Grilla de horas */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[56px_repeat(7,1fr)] relative">

          {/* Columna de horas */}
          <div className="sticky left-0 bg-white z-10">
            {HORAS.map(h => (
              <div
                key={h}
                className="flex items-start justify-end pr-2 text-[10px] text-gray-400"
                style={{ height: ALTURA_HORA }}
              >
                <span className="-mt-2">{h}:00</span>
              </div>
            ))}
          </div>

          {/* Columnas de días */}
          {dias.map(dia => {
            const key = format(dia, 'yyyy-MM-dd')
            const citasDia = citasPorDia[key] ?? []
            const esHoy = isSameDay(dia, hoy)

            return (
              <div
                key={key}
                className={`relative border-l border-gray-100 ${esHoy ? 'bg-indigo-50/20' : ''}`}
                style={{ height: ALTURA_HORA * HORAS.length }}
              >
                {/* Líneas de horas */}
                {HORAS.map(h => (
                  <div
                    key={h}
                    className="absolute w-full border-t border-gray-100 cursor-pointer
                      hover:bg-indigo-50/40 transition-colors"
                    style={{ top: (h - HORA_INICIO) * ALTURA_HORA, height: ALTURA_HORA }}
                    onClick={() => onClickHueco(dia, h)}
                  />
                ))}

                {/* Citas */}
                {citasDia.map(cita => {
                  const inicio = parseISO(cita.inicia_en)
                  const fin    = parseISO(cita.termina_en)
                  const topMin = (inicio.getHours() - HORA_INICIO) * 60 + inicio.getMinutes()
                  const durMin = differenceInMinutes(fin, inicio)
                  const top    = (topMin / 60) * ALTURA_HORA
                  const height = Math.max((durMin / 60) * ALTURA_HORA, 24)

                  return (
                    <div
                      key={cita.id}
                      onClick={e => { e.stopPropagation(); onClickCita(cita) }}
                      className={`absolute left-0.5 right-0.5 rounded-lg border-l-4 px-2 py-1
                        cursor-pointer hover:brightness-95 transition-all overflow-hidden z-10
                        ${ESTADO_ESTILOS[cita.estado]}`}
                      style={{ top, height }}
                    >
                      <p className="text-[11px] font-semibold leading-tight truncate">
                        {cita.paciente
                          ? `${cita.paciente.nombre} ${cita.paciente.apellido}`
                          : 'Paciente'}
                      </p>
                      {height > 32 && (
                        <p className="text-[10px] leading-tight truncate opacity-70 mt-0.5">
                          {format(inicio, 'HH:mm')} · {cita.motivo ?? 'Sin motivo'}
                        </p>
                      )}
                      {height > 48 && cita.doctor && (
                        <span
                          className="inline-block mt-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: cita.doctor.color }}
                        >
                          {cita.doctor.nombre_completo.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

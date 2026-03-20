import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, isSameMonth, isSameDay, isToday,
} from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  mes: Date
  diaSeleccionado: Date
  diasConCitas: Date[]
  onCambiarMes: (dir: 1 | -1) => void
  onSeleccionarDia: (dia: Date) => void
}

const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function CalendarioMensual({ mes, diaSeleccionado, diasConCitas, onCambiarMes, onSeleccionarDia }: Props) {
  // Build grid: start on Monday of the first week, end on Sunday of the last
  const primerDia  = startOfWeek(startOfMonth(mes), { weekStartsOn: 1 })
  const ultimoDia  = endOfWeek(endOfMonth(mes), { weekStartsOn: 1 })

  const dias: Date[] = []
  let cur = primerDia
  while (cur <= ultimoDia) {
    dias.push(cur)
    cur = addDays(cur, 1)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 w-72 shrink-0">

      {/* Cabecera mes */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onCambiarMes(-1)}
          className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-slate-800 capitalize">
          {format(mes, 'MMMM yyyy', { locale: es })}
        </span>
        <button
          onClick={() => onCambiarMes(1)}
          className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Encabezado días semana */}
      <div className="grid grid-cols-7 mb-1">
        {DIAS_SEMANA.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {dias.map((dia) => {
          const esHoy        = isToday(dia)
          const esSelec      = isSameDay(dia, diaSeleccionado)
          const esMesActual  = isSameMonth(dia, mes)
          const tieneCitas   = diasConCitas.some(d => isSameDay(d, dia))

          return (
            <button
              key={dia.toISOString()}
              onClick={() => onSeleccionarDia(dia)}
              className={`
                relative flex flex-col items-center justify-center h-8 w-8 mx-auto rounded-full
                text-xs font-medium transition-colors
                ${esSelec
                  ? 'bg-indigo-600 text-white'
                  : esHoy
                  ? 'bg-indigo-50 text-indigo-600'
                  : esMesActual
                  ? 'text-slate-700 hover:bg-gray-100'
                  : 'text-gray-300 hover:bg-gray-50'
                }
              `}
            >
              {format(dia, 'd')}
              {tieneCitas && !esSelec && (
                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full
                  ${esHoy ? 'bg-indigo-400' : 'bg-indigo-300'}`}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

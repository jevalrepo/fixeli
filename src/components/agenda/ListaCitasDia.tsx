import { Plus, CalendarDays } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { CitaConRelaciones } from '../../hooks/useCitas'
import type { EstadoCita } from '../../types/database'

const ESTADO_BADGE: Record<EstadoCita, { label: string; cls: string }> = {
  pendiente:         { label: 'Pendiente',   cls: 'bg-amber-50 text-amber-600'   },
  confirmada:        { label: 'Confirmada',  cls: 'bg-green-50 text-green-600'   },
  completada:        { label: 'Completada',  cls: 'bg-indigo-50 text-indigo-600' },
  cancelada:         { label: 'Cancelada',   cls: 'bg-red-50 text-red-500'       },
  no_asistio:        { label: 'No asistió',  cls: 'bg-gray-100 text-gray-500'    },
}

function iniciales(nombre: string, apellido: string) {
  return `${nombre[0] ?? ''}${apellido[0] ?? ''}`.toUpperCase()
}

interface Props {
  dia: Date
  citas: CitaConRelaciones[]
  onNuevaCita: (dia: Date) => void
  onClickCita: (cita: CitaConRelaciones) => void
}

export function ListaCitasDia({ dia, citas, onNuevaCita, onClickCita }: Props) {
  const titulo = format(dia, "EEEE, d 'de' MMMM yyyy", { locale: es })

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white rounded-2xl border border-gray-100 overflow-hidden">

      {/* Cabecera */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
        <h2 className="text-sm font-semibold text-slate-800 capitalize">{titulo}</h2>
        <button
          onClick={() => onNuevaCita(dia)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white
            px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
        >
          <Plus size={14} strokeWidth={2.5} />
          Nueva cita
        </button>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {citas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 py-16">
            <CalendarDays size={36} strokeWidth={1.25} className="text-gray-200" />
            <p className="text-sm">No hay citas para este día</p>
          </div>
        ) : (
          citas.map(cita => {
            const ini = parseISO(cita.inicia_en)
            const fin = parseISO(cita.termina_en)
            const badge = ESTADO_BADGE[cita.estado]
            const nombre   = cita.paciente?.nombre   ?? '?'
            const apellido = cita.paciente?.apellido  ?? ''
            const doctorColor = cita.doctor?.color ?? '#6366f1'

            return (
              <button
                key={cita.id}
                onClick={() => onClickCita(cita)}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl border border-gray-100
                  hover:border-indigo-100 hover:bg-indigo-50/40 transition-all text-left group"
              >
                {/* Color dot del doctor */}
                <div
                  className="w-1 self-stretch rounded-full shrink-0"
                  style={{ backgroundColor: doctorColor }}
                />

                {/* Avatar iniciales */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                  style={{ backgroundColor: doctorColor }}
                >
                  {iniciales(nombre, apellido)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {nombre} {apellido}
                  </p>
                  {cita.motivo && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{cita.motivo}</p>
                  )}
                  {cita.doctor && (
                    <p className="text-xs text-gray-400 truncate">Dr. {cita.doctor.nombre_completo}</p>
                  )}
                </div>

                {/* Hora + estado */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs font-medium text-slate-600">
                    {format(ini, 'h:mm a')} – {format(fin, 'h:mm a')}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

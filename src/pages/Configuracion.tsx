import { Users, CalendarDays, UserCheck, CalendarCheck } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useStats } from '../hooks/useStats'

function StatCard({ label, value, Icono, color }: {
  label: string; value: number | string; Icono: React.ElementType; color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icono size={20} strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{label}</p>
      </div>
    </div>
  )
}

export default function Configuracion() {
  const { stats, cargando } = useStats()
  const mesActual = format(new Date(), "MMMM yyyy", { locale: es })

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl">

      <div>
        <h1 className="text-xl font-bold text-slate-800">Panel</h1>
        <p className="text-sm text-gray-400 mt-0.5 capitalize">{mesActual}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pacientes activos"  value={cargando ? '—' : stats.totalPacientes}  Icono={Users}         color="bg-indigo-50 text-indigo-500" />
        <StatCard label="Citas este mes"     value={cargando ? '—' : stats.citasMes}        Icono={CalendarDays}  color="bg-emerald-50 text-emerald-500" />
        <StatCard label="Citas hoy"          value={cargando ? '—' : stats.citasHoy}        Icono={CalendarCheck} color="bg-amber-50 text-amber-500" />
        <StatCard label="Doctores activos"   value={cargando ? '—' : stats.doctoresActivos} Icono={UserCheck}     color="bg-violet-50 text-violet-500" />
      </div>

    </div>
  )
}

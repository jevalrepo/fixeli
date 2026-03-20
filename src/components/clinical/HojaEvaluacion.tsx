import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ClipboardList } from 'lucide-react'
import { useHojaEvaluacion } from '../../hooks/useHojaEvaluacion'

export function HojaEvaluacion({ pacienteId }: { pacienteId: string }) {
  const { entradas, cargando } = useHojaEvaluacion(pacienteId)

  if (cargando) {
    return <div className="p-8 text-center text-sm text-gray-400">Cargando…</div>
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-slate-700">Hoja de evaluación</h3>
        <p className="text-xs text-gray-400 mt-0.5">Historial de tratamientos y abonos</p>
      </div>

      {entradas.length === 0 ? (
        <div className="p-12 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <ClipboardList size={18} className="text-gray-300" />
          </div>
          <p className="text-sm text-gray-400">Sin tratamientos registrados</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/60 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide w-32">
                Fecha
              </th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                Tratamiento realizado
              </th>
              <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide w-32">
                Abono paciente
              </th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide w-24">
                Tipo
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {entradas.map(entrada => (
              <tr key={entrada.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                  {format(parseISO(entrada.fecha), "d MMM yyyy", { locale: es })}
                </td>
                <td className="px-5 py-3.5 text-slate-700">
                  {entrada.descripcion}
                </td>
                <td className="px-5 py-3.5 text-right font-medium text-slate-700">
                  {entrada.monto != null
                    ? `$${entrada.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                    : '—'}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium
                    ${entrada.tipo === 'pago'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-indigo-50 text-indigo-600'}`}>
                    {entrada.tipo === 'pago' ? 'Pago' : 'Procedimiento'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

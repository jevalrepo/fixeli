import { useState } from 'react'
import { useOdontograma } from '../../hooks/useOdontograma'
import type { SuperficieOdontograma, CondicionOdontograma } from '../../types/database'
import { toast } from 'sonner'

// ─── Datos FDI ────────────────────────────────────────────────────────────────

const ADULTO_SUPERIOR_DER = [18, 17, 16, 15, 14, 13, 12, 11]
const ADULTO_SUPERIOR_IZQ = [21, 22, 23, 24, 25, 26, 27, 28]
const ADULTO_INFERIOR_DER = [48, 47, 46, 45, 44, 43, 42, 41]
const ADULTO_INFERIOR_IZQ = [31, 32, 33, 34, 35, 36, 37, 38]

const TEMP_SUPERIOR_DER = [55, 54, 53, 52, 51]
const TEMP_SUPERIOR_IZQ = [61, 62, 63, 64, 65]
const TEMP_INFERIOR_DER = [85, 84, 83, 82, 81]
const TEMP_INFERIOR_IZQ = [71, 72, 73, 74, 75]

// ─── Condiciones ──────────────────────────────────────────────────────────────

const CONDICIONES: { value: CondicionOdontograma; label: string; color: string }[] = [
  { value: 'sano',                   label: 'Sano',                    color: '#ffffff' },
  { value: 'caries',                 label: 'Caries',                  color: '#EF4444' },
  { value: 'obturacion',             label: 'Obturación en resina',    color: '#3B82F6' },
  { value: 'obturacion_amalgama',    label: 'Obturación en amalgama',  color: '#6B7280' },
  { value: 'corona',                 label: 'Corona',                  color: '#F59E0B' },
  { value: 'implante',               label: 'Implante',                color: '#8B5CF6' },
  { value: 'endodoncia',             label: 'Endodoncia',              color: '#EC4899' },
  { value: 'fractura',               label: 'Fractura',                color: '#22C55E' },
  { value: 'desgaste_degenerativo',  label: 'Desgaste degenerativo',   color: '#F97316' },
  { value: 'ausente',                label: 'Ausente',                 color: '#9CA3AF' },
  { value: 'extraccion_indicada',    label: 'Extracción indicada',     color: '#DC2626' },
]

function colorCondicion(c: CondicionOdontograma): string {
  return CONDICIONES.find(x => x.value === c)?.color ?? '#ffffff'
}

// ─── Tipo popover ─────────────────────────────────────────────────────────────

interface Seleccion {
  numeroDiente: number
  superficie: SuperficieOdontograma
  clientX: number
  clientY: number
}

// ─── Diente SVG ───────────────────────────────────────────────────────────────

const S = 28  // tamaño del cuadrado de cada diente
const G = 4   // gap

interface DienteSVGProps {
  numero: number
  condicionDe: (n: number, s: SuperficieOdontograma) => CondicionOdontograma
  onClickSuperficie: (n: number, s: SuperficieOdontograma, e: React.MouseEvent) => void
}

function DienteSVG({ numero, condicionDe, onClickSuperficie }: DienteSVGProps) {
  const t = 7  // tamaño zona triangular
  const c = S / 2

  const zonas: { superficie: SuperficieOdontograma; path: string }[] = [
    { superficie: 'oclusal',     path: `M${t},${t} L${S - t},${t} L${S - t},${S - t} L${t},${S - t} Z` },
    { superficie: 'vestibular',  path: `M0,0 L${S},0 L${S - t},${t} L${t},${t} Z` },
    { superficie: 'lingual',     path: `M${t},${S - t} L${S - t},${S - t} L${S},${S} L0,${S} Z` },
    { superficie: 'mesial',      path: `M0,0 L${t},${t} L${t},${S - t} L0,${S} Z` },
    { superficie: 'distal',      path: `M${S},0 L${S},${S} L${S - t},${S - t} L${S - t},${t} Z` },
  ]

  return (
    <g>
      {zonas.map(({ superficie, path }) => {
        const cond = condicionDe(numero, superficie)
        const fill = cond === 'sano' ? '#f9fafb' : colorCondicion(cond)
        const stroke = cond === 'ausente' ? '#9CA3AF' : '#d1d5db'
        return (
          <path
            key={superficie}
            d={path}
            fill={fill}
            stroke={stroke}
            strokeWidth={0.75}
            className="cursor-pointer hover:brightness-90 transition-all"
            onClick={e => {
              e.stopPropagation()
              onClickSuperficie(numero, superficie, e as unknown as React.MouseEvent)
            }}
          />
        )
      })}
      {/* Número */}
      <text
        x={c}
        y={S + 9}
        textAnchor="middle"
        fontSize={7}
        fill="#9ca3af"
        fontFamily="system-ui"
      >
        {numero}
      </text>
    </g>
  )
}

// ─── Fila de dientes ──────────────────────────────────────────────────────────

function FilaDientes({
  dientes, offsetX = 0, offsetY = 0, condicionDe, onClickSuperficie,
}: {
  dientes: number[]
  offsetX?: number
  offsetY?: number
  condicionDe: (n: number, s: SuperficieOdontograma) => CondicionOdontograma
  onClickSuperficie: (n: number, s: SuperficieOdontograma, e: React.MouseEvent) => void
}) {
  return (
    <>
      {dientes.map((num, i) => (
        <g key={num} transform={`translate(${offsetX + i * (S + G)}, ${offsetY})`}>
          <DienteSVG
            numero={num}
            condicionDe={condicionDe}
            onClickSuperficie={onClickSuperficie}
          />
        </g>
      ))}
    </>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function Odontograma({ pacienteId }: { pacienteId: string }) {
  const { condicionDe, guardar, cargando } = useOdontograma(pacienteId)
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null)
  const [guardando, setGuardando] = useState(false)

  function handleClickSuperficie(
    numeroDiente: number,
    superficie: SuperficieOdontograma,
    e: React.MouseEvent,
  ) {
    setSeleccion({
      numeroDiente,
      superficie,
      clientX: e.clientX,
      clientY: e.clientY,
    })
  }

  async function handleSeleccionCondicion(condicion: CondicionOdontograma) {
    if (!seleccion || guardando) return
    setGuardando(true)
    try {
      await guardar(seleccion.numeroDiente, seleccion.superficie, condicion)
    } catch {
      toast.error('Error al guardar')
    } finally {
      setGuardando(false)
      setSeleccion(null)
    }
  }

  // Layout SVG
  const SEP = 10   // separador centro
  const LABEL_H = 14
  const ROW_H = S + LABEL_H + 4

  // Coordenadas de grupos adultos
  const adultoDerAncho = ADULTO_SUPERIOR_DER.length * (S + G) - G
  const adultoIzqAncho = ADULTO_SUPERIOR_IZQ.length * (S + G) - G
  const totalAdulto = adultoDerAncho + SEP + adultoIzqAncho

  const tempDerAncho  = TEMP_SUPERIOR_DER.length * (S + G) - G
  const tempIzqAncho  = TEMP_SUPERIOR_IZQ.length * (S + G) - G
  const totalTemp     = tempDerAncho + SEP + tempIzqAncho
  const tempOffsetX   = (totalAdulto - totalTemp) / 2

  const rowSup     = 0
  const rowInf     = ROW_H + 16
  const rowTempSup = rowInf + ROW_H + 20
  const rowTempInf = rowTempSup + ROW_H + 6

  const svgW = totalAdulto
  const svgH = rowTempInf + ROW_H + LABEL_H + 8

  if (cargando) {
    return <div className="p-8 text-center text-sm text-gray-400">Cargando odontograma…</div>
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="flex gap-20 items-start w-fit">

      {/* ── Columna 1: Odontograma ── */}
      <div className="overflow-x-auto shrink-0">
        {/* Label Derecha/Izquierda: mismo ancho que el SVG */}
        <div
          className="flex items-center gap-2 mb-1 text-[10px] text-gray-400 font-medium"
          style={{ width: svgW }}
        >
          <span className="shrink-0">Derecha</span>
          <span className="flex-1 border-t border-dashed border-gray-200" />
          <span className="shrink-0">Izquierda</span>
        </div>

        <svg
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="overflow-visible"
        >
          {/* ── Adultos superiores ── */}
          <FilaDientes dientes={ADULTO_SUPERIOR_DER} offsetY={rowSup}                                  condicionDe={condicionDe} onClickSuperficie={handleClickSuperficie} />
          <FilaDientes dientes={ADULTO_SUPERIOR_IZQ} offsetX={adultoDerAncho + SEP} offsetY={rowSup}  condicionDe={condicionDe} onClickSuperficie={handleClickSuperficie} />

          {/* Línea central superior */}
          <line x1={svgW / 2} y1={rowSup - 2} x2={svgW / 2} y2={rowSup + S + 2} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="3 2" />

          {/* ── Adultos inferiores ── */}
          <FilaDientes dientes={ADULTO_INFERIOR_DER} offsetY={rowInf}                                  condicionDe={condicionDe} onClickSuperficie={handleClickSuperficie} />
          <FilaDientes dientes={ADULTO_INFERIOR_IZQ} offsetX={adultoDerAncho + SEP} offsetY={rowInf}  condicionDe={condicionDe} onClickSuperficie={handleClickSuperficie} />
          <line x1={svgW / 2} y1={rowInf - 2} x2={svgW / 2} y2={rowInf + S + 2} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="3 2" />

          {/* Separador adulto/temporal */}
          <line x1={0} y1={rowTempSup - 10} x2={svgW} y2={rowTempSup - 10} stroke="#f3f4f6" strokeWidth={1} />
          <text x={svgW / 2} y={rowTempSup - 3} textAnchor="middle" fontSize={7} fill="#d1d5db">Dientes temporales</text>

          {/* ── Temporales superiores ── */}
          <FilaDientes dientes={TEMP_SUPERIOR_DER} offsetX={tempOffsetX}                                      offsetY={rowTempSup} condicionDe={condicionDe} onClickSuperficie={handleClickSuperficie} />
          <FilaDientes dientes={TEMP_SUPERIOR_IZQ} offsetX={tempOffsetX + tempDerAncho + SEP}                 offsetY={rowTempSup} condicionDe={condicionDe} onClickSuperficie={handleClickSuperficie} />

          {/* ── Temporales inferiores ── */}
          <FilaDientes dientes={TEMP_INFERIOR_DER} offsetX={tempOffsetX}                                      offsetY={rowTempInf} condicionDe={condicionDe} onClickSuperficie={handleClickSuperficie} />
          <FilaDientes dientes={TEMP_INFERIOR_IZQ} offsetX={tempOffsetX + tempDerAncho + SEP}                 offsetY={rowTempInf} condicionDe={condicionDe} onClickSuperficie={handleClickSuperficie} />
        </svg>
      </div>

      {/* ── Columna 2: Leyenda ── */}
      <div className="flex flex-col gap-2 shrink-0 pt-6">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Referencias
          </p>
          {CONDICIONES.filter(c => c.value !== 'sano').map(c => (
            <span key={c.value} className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-3.5 h-3.5 rounded border border-gray-200 shrink-0" style={{ backgroundColor: c.color }} />
              {c.label}
            </span>
          ))}
      </div>

      </div>{/* fin grid */}

      {/* Popover de condiciones — fixed para evitar problemas de posicionamiento */}
      {seleccion && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setSeleccion(null)} />
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-2 w-48"
            style={{ left: seleccion.clientX + 8, top: seleccion.clientY + 8 }}
            onClick={e => e.stopPropagation()}
          >
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 px-1">
            Diente {seleccion.numeroDiente} · {seleccion.superficie}
          </p>
          {CONDICIONES.map(c => (
            <button
              key={c.value}
              onClick={() => handleSeleccionCondicion(c.value)}
              disabled={guardando}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm text-slate-700
                hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
            >
              <span
                className="w-3 h-3 rounded-sm border border-gray-200 shrink-0"
                style={{ backgroundColor: c.color }}
              />
              {c.label}
            </button>
          ))}
          </div>
        </>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Phone, Mail, MapPin, AlertTriangle,
  FileText, Pencil, CheckCircle, XCircle,
} from 'lucide-react'
import { differenceInYears, parseISO, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { ModalPaciente } from '../components/pacientes/ModalPaciente'
import { Odontograma } from '../components/odontogram/Odontograma'
import { HojaEvaluacion } from '../components/clinical/HojaEvaluacion'
import type { Paciente, CondicionesMedicas } from '../types/database'
import { toast } from 'sonner'

// ─── Tabs ────────────────────────────────────────────────────────────────────

const TABS = ['Información', 'Odontograma', 'Hoja de evaluación', 'Notas clínicas'] as const
type Tab = typeof TABS[number]

// ─── Condiciones médicas para mostrar ────────────────────────────────────────

const CONDICIONES_LABELS: { key: keyof CondicionesMedicas; label: string }[] = [
  { key: 'cardiaca',            label: 'Problemas cardiacos' },
  { key: 'presion',             label: 'Alta o baja presión' },
  { key: 'diabetes',            label: 'Diabetes' },
  { key: 'hepatitis',           label: 'Hepatitis' },
  { key: 'tuberculosis',        label: 'Tuberculosis' },
  { key: 'nerviosos',           label: 'Problemas nerviosos' },
  { key: 'respiratorio',        label: 'Enfermedades respiratorias' },
  { key: 'hemofilia',           label: 'Hemofilia' },
  { key: 'hemorragias',         label: 'Tendencias a hemorragias' },
  { key: 'alergia_medicamento', label: 'Alérgico a medicamento' },
  { key: 'embarazada',          label: 'Embarazada' },
]

// ─── Componente ───────────────────────────────────────────────────────────────

export default function DetallePaciente() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [cargando, setCargando] = useState(true)
  const [tabActiva, setTabActiva] = useState<Tab>('Información')
  const [modalAbierto, setModalAbierto] = useState(false)

  useEffect(() => {
    if (!id) return
    supabase
      .from('pacientes')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setPaciente(data)
        setCargando(false)
      })
  }, [id])

  async function guardar(datos: Partial<Paciente>) {
    if (!paciente) return
    const { data, error } = await supabase
      .from('pacientes')
      .update(datos)
      .eq('id', paciente.id)
      .select()
      .single()
    if (error) { toast.error('Error al actualizar'); return }
    setPaciente(data)
    setModalAbierto(false)
    toast.success('Paciente actualizado')
  }

  if (cargando) {
    return <div className="flex items-center justify-center h-64 text-sm text-gray-400">Cargando…</div>
  }
  if (!paciente) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-gray-400">Paciente no encontrado</p>
        <button onClick={() => navigate('/pacientes')} className="text-sm text-indigo-600 font-medium">
          Volver a Pacientes
        </button>
      </div>
    )
  }

  const iniciales = `${paciente.nombre[0]}${paciente.apellido[0]}`.toUpperCase()
  const edad = paciente.fecha_nacimiento
    ? differenceInYears(new Date(), parseISO(paciente.fecha_nacimiento))
    : null
  const cm = paciente.condiciones_medicas ?? {}
  const condicionesActivas = CONDICIONES_LABELS.filter(c => cm[c.key] === true)

  return (
    <div className="max-w-5xl mx-auto p-6">

      {/* Volver */}
      <button
        onClick={() => navigate('/pacientes')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-slate-700 transition-colors mb-5"
      >
        <ArrowLeft size={15} /> Pacientes
      </button>

      {/* Cabecera */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold shrink-0">
            {iniciales}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {paciente.nombre} {paciente.apellido}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {edad != null ? `${edad} años` : 'Edad no registrada'}
              {paciente.fecha_nacimiento && (
                <> · {format(parseISO(paciente.fecha_nacimiento), "d 'de' MMMM 'de' yyyy", { locale: es })}</>
              )}
            </p>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {paciente.telefono && (
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Phone size={13} className="text-gray-400" /> {paciente.telefono}
                </span>
              )}
              {paciente.email && (
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Mail size={13} className="text-gray-400" /> {paciente.email}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <Pencil size={14} /> Editar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-4 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setTabActiva(tab)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors -mb-px border-b-2
              ${tabActiva === tab
                ? 'text-indigo-600 border-indigo-600'
                : 'text-gray-400 border-transparent hover:text-slate-600'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab: Información ── */}
      {tabActiva === 'Información' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Contacto */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Contacto</h3>
              <div className="space-y-3">
                <InfoFila icono={<Phone size={15} />}   label="Teléfono"   valor={paciente.telefono} />
                <InfoFila icono={<Mail size={15} />}    label="Email"      valor={paciente.email} />
                <InfoFila icono={<MapPin size={15} />}  label="Dirección"  valor={paciente.direccion} />
                <InfoFila icono={<FileText size={15} />} label="Recomendado por" valor={paciente.recomendado_por} />
                <InfoFila icono={<FileText size={15} />} label="Última visita dental" valor={paciente.ultima_visita_dental} />
              </div>
            </div>

            {/* Anestesia */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Anestesia</h3>
              <div className="space-y-2">
                <CondBool label="Ha recibido anestesia local" valor={paciente.anestesia_previa} />
                {paciente.anestesia_previa && (
                  <CondBool label="Tuvo reacción anormal" valor={paciente.reaccion_anestesia} />
                )}
                {paciente.reaccion_anestesia && paciente.tipo_reaccion && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <p className="text-xs font-medium text-amber-700">Tipo de reacción</p>
                    <p className="text-sm text-amber-800 mt-0.5">{paciente.tipo_reaccion}</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Condiciones médicas */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Condiciones médicas</h3>
            {condicionesActivas.length === 0 && !cm.otras ? (
              <p className="text-sm text-gray-300">Sin condiciones registradas</p>
            ) : (
              <div className="space-y-2">
                {condicionesActivas.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {condicionesActivas.map(c => (
                      <span key={c.key} className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">
                        <AlertTriangle size={11} />
                        {c.label}
                      </span>
                    ))}
                  </div>
                )}
                {cm.otras && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-400">Otras enfermedades</p>
                    <p className="text-sm text-slate-700 mt-0.5">{cm.otras}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Odontograma ── */}
      {tabActiva === 'Odontograma' && (
        <div className="relative">
          <Odontograma pacienteId={paciente.id} />
        </div>
      )}

      {/* ── Tab: Hoja de evaluación ── */}
      {tabActiva === 'Hoja de evaluación' && (
        <HojaEvaluacion pacienteId={paciente.id} />
      )}

      {/* ── Tab: Notas clínicas ── */}
      {tabActiva === 'Notas clínicas' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 flex items-center justify-center">
          <p className="text-sm text-gray-300">Próximamente</p>
        </div>
      )}

      <ModalPaciente
        abierto={modalAbierto}
        paciente={paciente}
        onGuardar={guardar}
        onCerrar={() => setModalAbierto(false)}
      />
    </div>
  )
}

// ─── Helpers de visualización ─────────────────────────────────────────────────

function InfoFila({ icono, label, valor }: { icono: React.ReactNode; label: string; valor: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-gray-400 mt-0.5 shrink-0">{icono}</span>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-slate-700 mt-0.5">
          {valor || <span className="text-gray-300">—</span>}
        </p>
      </div>
    </div>
  )
}

function CondBool({ label, valor }: { label: string; valor: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {valor
        ? <CheckCircle size={15} className="text-green-500 shrink-0" />
        : <XCircle size={15} className="text-gray-300 shrink-0" />}
      <span className={valor ? 'text-slate-700' : 'text-gray-400'}>{label}</span>
    </div>
  )
}

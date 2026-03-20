import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Users, ChevronRight } from 'lucide-react'
import { differenceInYears, parseISO, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { usePacientes } from '../hooks/usePacientes'
import { ModalPaciente } from '../components/pacientes/ModalPaciente'
import type { Paciente } from '../types/database'

export default function Pacientes() {
  const { pacientes, cargando, crear, actualizar } = usePacientes()
  const navigate = useNavigate()

  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [pacienteEditar, setPacienteEditar] = useState<Paciente | null>(null)

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim()
    if (!q) return pacientes
    return pacientes.filter(p =>
      `${p.nombre} ${p.apellido}`.toLowerCase().includes(q) ||
      p.telefono?.includes(q) ||
      p.email?.toLowerCase().includes(q)
    )
  }, [pacientes, busqueda])

  function abrirNuevo() {
    setPacienteEditar(null)
    setModalAbierto(true)
  }

  function abrirEditar(p: Paciente, e: React.MouseEvent) {
    e.stopPropagation()
    setPacienteEditar(p)
    setModalAbierto(true)
  }

  async function guardar(datos: Partial<Paciente> & { nombre: string; apellido: string }) {
    if (pacienteEditar) {
      await actualizar(pacienteEditar.id, datos)
    } else {
      await crear(datos as Parameters<typeof crear>[0])
    }
    setModalAbierto(false)
  }

  const vacio = (
    <div className="p-12 lg:p-16 flex flex-col items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
        <Users size={22} className="text-gray-300" />
      </div>
      <p className="text-sm text-gray-400">
        {busqueda ? 'Sin resultados para esa búsqueda' : 'Aún no hay pacientes registrados'}
      </p>
      {!busqueda && (
        <button onClick={abrirNuevo} className="text-sm text-indigo-600 font-medium hover:underline">
          Registrar primer paciente
        </button>
      )}
    </div>
  )

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <div>
          <h1 className="text-lg lg:text-xl font-bold text-slate-800">Pacientes</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {cargando ? 'Cargando…' : `${pacientes.length} registrados`}
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-1.5 lg:gap-2 bg-indigo-600 hover:bg-indigo-700
            text-white px-3 lg:px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span className="hidden sm:inline">Nuevo paciente</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl
        px-3.5 h-10 mb-4 focus-within:border-indigo-400 transition-colors">
        <Search size={15} className="text-gray-400 shrink-0" strokeWidth={2} />
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, teléfono…"
          className="flex-1 text-sm text-slate-700 placeholder-gray-400 outline-none bg-transparent"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">

        {cargando ? (
          <div className="p-12 text-center text-sm text-gray-400">Cargando pacientes…</div>
        ) : filtrados.length === 0 ? vacio : (
          <>
            {/* ── Móvil: lista de tarjetas ── */}
            <div className="md:hidden divide-y divide-gray-50">
              {filtrados.map(p => {
                const iniciales = `${p.nombre[0]}${p.apellido[0]}`.toUpperCase()
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/pacientes/${p.id}`)}
                    className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600
                      flex items-center justify-center text-xs font-bold shrink-0">
                      {iniciales}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {p.nombre} {p.apellido}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {p.telefono ?? p.email ?? '—'}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  </div>
                )
              })}
            </div>

            {/* ── Desktop: tabla ── */}
            <table className="hidden md:table w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Paciente', 'Teléfono', 'Email', 'Edad', 'Registrado', ''].map(col => (
                    <th
                      key={col}
                      className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.map(p => {
                  const iniciales = `${p.nombre[0]}${p.apellido[0]}`.toUpperCase()
                  const edad = p.fecha_nacimiento
                    ? differenceInYears(new Date(), parseISO(p.fecha_nacimiento))
                    : null
                  return (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/pacientes/${p.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600
                            flex items-center justify-center text-xs font-bold shrink-0">
                            {iniciales}
                          </div>
                          <span className="font-medium text-slate-800">{p.nombre} {p.apellido}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{p.telefono ?? '—'}</td>
                      <td className="px-5 py-3.5 text-gray-500">{p.email ?? '—'}</td>
                      <td className="px-5 py-3.5 text-gray-500">{edad != null ? `${edad} años` : '—'}</td>
                      <td className="px-5 py-3.5 text-gray-400">
                        {format(parseISO(p.creado_en), "d MMM yyyy", { locale: es })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={e => abrirEditar(p, e)}
                          className="opacity-0 group-hover:opacity-100 text-xs text-gray-400
                            hover:text-indigo-600 font-medium transition-all px-2 py-1
                            rounded-lg hover:bg-indigo-50"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </>
        )}
      </div>

      <ModalPaciente
        abierto={modalAbierto}
        paciente={pacienteEditar}
        onGuardar={guardar}
        onCerrar={() => setModalAbierto(false)}
      />
    </div>
  )
}

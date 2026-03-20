import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { usePerfiles } from '../hooks/usePerfiles'
import { ModalDoctor } from '../components/admin/ModalDoctor'
import type { Perfil } from '../types/database'

export default function Usuarios() {
  const { perfiles, cargando, crear, actualizar, eliminar } = usePerfiles()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [doctorEditar, setDoctorEditar] = useState<Perfil | null>(null)

  function abrirCrear() {
    setDoctorEditar(null)
    setModalAbierto(true)
  }

  function abrirEditar(doctor: Perfil) {
    setDoctorEditar(doctor)
    setModalAbierto(true)
  }

  async function handleGuardar(datos: Parameters<typeof crear>[0] & Parameters<typeof actualizar>[1]) {
    try {
      if (doctorEditar) {
        await actualizar(doctorEditar.id, {
          nombre_completo:     datos.nombre_completo,
          rol:                 datos.rol,
          especialidad:        datos.especialidad,
          telefono:            datos.telefono,
          color:               datos.color,
          porcentaje_comision: datos.porcentaje_comision,
          activo:              datos.activo,
        })
        toast.success('Usuario actualizado')
      } else {
        await crear({
          email:               datos.email,
          password:            datos.password,
          nombre_completo:     datos.nombre_completo,
          rol:                 datos.rol,
          especialidad:        datos.especialidad,
          telefono:            datos.telefono,
          color:               datos.color,
          porcentaje_comision: datos.porcentaje_comision,
        })
        toast.success('Usuario creado — se enviará un correo de confirmación')
      }
      setModalAbierto(false)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido'
      toast.error(`Error: ${msg}`)
    }
  }

  async function handleEliminar(doctor: Perfil) {
    if (!confirm(`¿Eliminar a ${doctor.nombre_completo}? Esta acción no se puede deshacer.`)) return
    try {
      await eliminar(doctor.id)
      toast.success('Usuario eliminado')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Usuarios</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gestión del equipo médico</p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} />
          Nuevo usuario
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {cargando ? (
          <div className="p-8 text-center text-sm text-gray-400">Cargando…</div>
        ) : perfiles.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No hay usuarios registrados</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-50">
                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Usuario</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Especialidad</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Teléfono</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Comisión</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Rol</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {perfiles.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/60 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.nombre_completo.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-800">{p.nombre_completo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{p.especialidad ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{p.telefono ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{p.porcentaje_comision}%</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full
                      ${p.rol === 'admin' ? 'bg-violet-50 text-violet-600' : 'bg-indigo-50 text-indigo-600'}`}>
                      {p.rol === 'admin' ? 'Admin' : 'Doctor'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full
                      ${p.activo ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => abrirEditar(p)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleEliminar(p)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ModalDoctor
        abierto={modalAbierto}
        doctor={doctorEditar}
        onGuardar={handleGuardar as never}
        onCerrar={() => setModalAbierto(false)}
      />

    </div>
  )
}

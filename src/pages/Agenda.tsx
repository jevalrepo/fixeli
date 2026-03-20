import { useState } from 'react'
import { addMonths, subMonths, isSameDay, parseISO, startOfMonth } from 'date-fns'
import { useCitasMes } from '../hooks/useCitasMes'
import { type CitaConRelaciones } from '../hooks/useCitas'
import { usePerfiles } from '../hooks/usePerfiles'
import { usePacientes } from '../hooks/usePacientes'
import { CalendarioMensual } from '../components/agenda/CalendarioMensual'
import { ListaCitasDia } from '../components/agenda/ListaCitasDia'
import { ModalCita } from '../components/agenda/ModalCita'
import type { EstadoCita } from '../types/database'

export default function Agenda() {
  const [mes, setMes]                           = useState(() => startOfMonth(new Date()))
  const [diaSeleccionado, setDiaSeleccionado]   = useState(new Date())
  const [modalAbierto, setModalAbierto]         = useState(false)
  const [citaSeleccionada, setCitaSeleccionada] = useState<CitaConRelaciones | null>(null)
  const [fechaInicial, setFechaInicial]         = useState<Date | undefined>()

  const { citas, crear, actualizar, eliminar } = useCitasMes(mes)
  const { perfiles: doctores } = usePerfiles()
  const { pacientes } = usePacientes()

  const diasConCitas  = citas.map(c => parseISO(c.inicia_en))
  const citasDelDia   = citas.filter(c => isSameDay(parseISO(c.inicia_en), diaSeleccionado))

  function handleCambiarMes(dir: 1 | -1) {
    setMes(m => dir === 1 ? addMonths(m, 1) : subMonths(m, 1))
  }

  function abrirNueva(dia: Date) {
    setCitaSeleccionada(null)
    setFechaInicial(dia)
    setModalAbierto(true)
  }

  function abrirEditar(cita: CitaConRelaciones) {
    setCitaSeleccionada(cita)
    setFechaInicial(undefined)
    setModalAbierto(true)
  }

  async function guardar(datos: {
    paciente_id: string
    doctor_id: string
    inicia_en: string
    termina_en: string
    motivo: string | null
    notas: string | null
    estado: EstadoCita
  }) {
    if (citaSeleccionada) {
      await actualizar(citaSeleccionada.id, datos)
    } else {
      await crear(datos)
    }
    setModalAbierto(false)
  }

  return (
    <div className="flex gap-5 p-6 h-full">

      {/* Mini calendario mensual */}
      <CalendarioMensual
        mes={mes}
        diaSeleccionado={diaSeleccionado}
        diasConCitas={diasConCitas}
        onCambiarMes={handleCambiarMes}
        onSeleccionarDia={setDiaSeleccionado}
      />

      {/* Lista de citas del día seleccionado */}
      <ListaCitasDia
        dia={diaSeleccionado}
        citas={citasDelDia}
        onNuevaCita={abrirNueva}
        onClickCita={abrirEditar}
      />

      {/* Modal crear/editar cita */}
      <ModalCita
        abierto={modalAbierto}
        cita={citaSeleccionada}
        fechaInicial={fechaInicial}
        pacientes={pacientes}
        doctores={doctores}
        onGuardar={guardar}
        onEliminar={eliminar}
        onCerrar={() => setModalAbierto(false)}
      />
    </div>
  )
}

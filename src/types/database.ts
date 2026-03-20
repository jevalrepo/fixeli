// ─── Tipos auxiliares ─────────────────────────────────────────────────────────

export interface CondicionesMedicas {
  cardiaca?:           boolean
  presion?:            boolean
  diabetes?:           boolean
  hepatitis?:          boolean
  tuberculosis?:       boolean
  nerviosos?:          boolean
  respiratorio?:       boolean
  hemofilia?:          boolean
  hemorragias?:        boolean
  otras?:              string
  alergia_medicamento?: boolean
  embarazada?:         boolean
}

// ─── Enums ───────────────────────────────────────────────────────────────────

export type Rol = 'admin' | 'doctor'

export type EstadoCita =
  | 'pendiente'
  | 'confirmada'
  | 'completada'
  | 'cancelada'
  | 'no_asistio'

export type SuperficieOdontograma =
  | 'mesial'
  | 'distal'
  | 'oclusal'
  | 'vestibular'
  | 'lingual'
  | 'general'

export type CondicionOdontograma =
  | 'sano'
  | 'caries'
  | 'obturacion'
  | 'obturacion_amalgama'
  | 'corona'
  | 'implante'
  | 'endodoncia'
  | 'fractura'
  | 'desgaste_degenerativo'
  | 'ausente'
  | 'extraccion_indicada'

export type EstadoPlanTratamiento = 'activo' | 'completado' | 'cancelado'

export type EstadoProcedimiento = 'pendiente' | 'en_proceso' | 'completado'

export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'otro'

export type EstadoPago = 'pagado' | 'pendiente' | 'cancelado'

export type TipoAdjunto = 'imagen' | 'pdf' | 'radiografia' | 'otro'

export type EstadoConversacion = 'abierta' | 'resuelta' | 'bot'

// ─── Tablas ───────────────────────────────────────────────────────────────────

export interface Perfil {
  id: string
  nombre_completo: string
  rol: Rol
  especialidad: string | null
  telefono: string | null
  color: string
  porcentaje_comision: number
  activo: boolean
  url_avatar: string | null
  creado_en: string
}

export interface Paciente {
  id: string
  nombre: string
  apellido: string
  fecha_nacimiento: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  alergias: string | null
  notas_medicas: string | null
  url_foto: string | null
  doctor_principal_id: string | null
  activo: boolean
  creado_por: string | null
  creado_en: string
  actualizado_en: string
  // Historia clínica
  recomendado_por:      string | null
  ultima_visita_dental: string | null
  anestesia_previa:     boolean
  reaccion_anestesia:   boolean
  tipo_reaccion:        string | null
  condiciones_medicas:  CondicionesMedicas
}

export interface Cita {
  id: string
  paciente_id: string
  doctor_id: string
  inicia_en: string
  termina_en: string
  motivo: string | null
  estado: EstadoCita
  notas: string | null
  creado_por: string | null
  creado_en: string
  actualizado_en: string
}

export interface HorarioBloqueado {
  id: string
  doctor_id: string
  inicia_en: string
  termina_en: string
  motivo: string | null
  creado_en: string
}

export interface EntradaOdontograma {
  id: string
  paciente_id: string
  numero_diente: number
  superficie: SuperficieOdontograma
  condicion: CondicionOdontograma
  notas: string | null
  registrado_por: string | null
  registrado_en: string
}

export interface NotaClinica {
  id: string
  paciente_id: string
  cita_id: string | null
  doctor_id: string
  motivo_consulta: string | null
  diagnostico: string | null
  tratamiento_realizado: string | null
  proximos_pasos: string | null
  confirmado: boolean
  confirmado_en: string | null
  creado_en: string
  actualizado_en: string
}

export interface Adjunto {
  id: string
  nota_clinica_id: string
  paciente_id: string
  nombre_archivo: string
  url_archivo: string
  tipo_archivo: TipoAdjunto | null
  subido_por: string | null
  subido_en: string
}

export interface PlanTratamiento {
  id: string
  paciente_id: string
  doctor_id: string
  titulo: string
  estado: EstadoPlanTratamiento
  notas: string | null
  creado_en: string
  actualizado_en: string
}

export interface Procedimiento {
  id: string
  plan_id: string
  cita_id: string | null
  descripcion: string
  numero_diente: number | null
  costo_estimado: number
  estado: EstadoProcedimiento
  completado_en: string | null
  creado_en: string
}

export interface Pago {
  id: string
  paciente_id: string
  cita_id: string | null
  procedimiento_id: string | null
  doctor_id: string
  monto: number
  metodo: MetodoPago
  concepto: string | null
  estado: EstadoPago
  porcentaje_doctor: number
  monto_doctor: number
  monto_clinica: number
  registrado_por: string | null
  pagado_en: string
  creado_en: string
}

export interface ConversacionWhatsapp {
  id: string
  paciente_id: string | null
  telefono: string
  estado: EstadoConversacion
  ultimo_mensaje: string | null
  ultimo_mensaje_en: string | null
  metadatos: Record<string, unknown>
  creado_en: string
}

// ─── Tipo Database para el cliente de Supabase tipado ────────────────────────

export interface Database {
  public: {
    Tables: {
      perfiles: {
        Row: Perfil
        Insert: Omit<Perfil, 'creado_en'> & { creado_en?: string }
        Update: Partial<Omit<Perfil, 'id'>>
      }
      pacientes: {
        Row: Paciente
        Insert: Omit<Paciente, 'id' | 'creado_en' | 'actualizado_en'> & {
          id?: string
          creado_en?: string
          actualizado_en?: string
        }
        Update: Partial<Omit<Paciente, 'id'>>
      }
      citas: {
        Row: Cita
        Insert: Omit<Cita, 'id' | 'creado_en' | 'actualizado_en'> & {
          id?: string
          creado_en?: string
          actualizado_en?: string
        }
        Update: Partial<Omit<Cita, 'id'>>
      }
      horarios_bloqueados: {
        Row: HorarioBloqueado
        Insert: Omit<HorarioBloqueado, 'id' | 'creado_en'> & {
          id?: string
          creado_en?: string
        }
        Update: Partial<Omit<HorarioBloqueado, 'id'>>
      }
      entradas_odontograma: {
        Row: EntradaOdontograma
        Insert: Omit<EntradaOdontograma, 'id' | 'registrado_en'> & {
          id?: string
          registrado_en?: string
        }
        Update: Partial<Omit<EntradaOdontograma, 'id'>>
      }
      notas_clinicas: {
        Row: NotaClinica
        Insert: Omit<NotaClinica, 'id' | 'creado_en' | 'actualizado_en'> & {
          id?: string
          creado_en?: string
          actualizado_en?: string
        }
        Update: Partial<Omit<NotaClinica, 'id'>>
      }
      adjuntos: {
        Row: Adjunto
        Insert: Omit<Adjunto, 'id' | 'subido_en'> & {
          id?: string
          subido_en?: string
        }
        Update: Partial<Omit<Adjunto, 'id'>>
      }
      planes_tratamiento: {
        Row: PlanTratamiento
        Insert: Omit<PlanTratamiento, 'id' | 'creado_en' | 'actualizado_en'> & {
          id?: string
          creado_en?: string
          actualizado_en?: string
        }
        Update: Partial<Omit<PlanTratamiento, 'id'>>
      }
      procedimientos: {
        Row: Procedimiento
        Insert: Omit<Procedimiento, 'id' | 'creado_en'> & {
          id?: string
          creado_en?: string
        }
        Update: Partial<Omit<Procedimiento, 'id'>>
      }
      pagos: {
        Row: Pago
        Insert: Omit<Pago, 'id' | 'creado_en'> & {
          id?: string
          creado_en?: string
        }
        Update: Partial<Omit<Pago, 'id'>>
      }
      conversaciones_whatsapp: {
        Row: ConversacionWhatsapp
        Insert: Omit<ConversacionWhatsapp, 'id' | 'creado_en'> & {
          id?: string
          creado_en?: string
        }
        Update: Partial<Omit<ConversacionWhatsapp, 'id'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

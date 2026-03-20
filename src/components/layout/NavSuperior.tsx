import { useState, useRef, useEffect } from 'react'
import { Search, User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { ModalPerfil } from './ModalPerfil'
import logoClaro from '../../assets/logo-claro.png'

export function NavSuperior() {
  const { perfil, cerrarSesion } = useAuth()
  const [modalPerfil, setModalPerfil] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleMiCuenta() {
    setMenuAbierto(false)
    setModalPerfil(true)
  }

  async function handleCerrarSesion() {
    setMenuAbierto(false)
    await cerrarSesion()
  }

  return (
    <>
      <header className="flex items-stretch h-14 bg-white border-b border-gray-100 shrink-0 z-50">

        {/* Logo */}
        <div className="flex items-center px-5 w-56 shrink-0 border-r border-gray-100">
          <img src={logoClaro} alt="FIXELI" className="w-[90%] h-auto object-contain" />
        </div>

        {/* Derecha: buscador + usuario */}
        <div className="flex items-center flex-1 px-5 gap-4">

          {/* Buscador */}
          <div className="flex items-center gap-2.5 flex-1 max-w-md bg-gray-50 border border-gray-200 rounded-xl px-3.5 h-9 focus-within:border-indigo-400 focus-within:bg-white transition-colors">
            <Search size={15} className="text-gray-400 shrink-0" strokeWidth={2} />
            <input
              type="text"
              placeholder="Buscar paciente, cita…"
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder-gray-400 outline-none"
            />
          </div>

          <div className="flex-1" />

          {/* Usuario con dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuAbierto(v => !v)}
              className="flex items-center gap-2.5 rounded-xl px-2 py-1 hover:bg-gray-50 transition-colors"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: perfil?.color ?? '#6366f1' }}
              >
                {perfil?.nombre_completo?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <div className="leading-tight min-w-32 text-left">
                <p className="text-sm font-semibold text-slate-800 leading-none">
                  {perfil?.nombre_completo ?? '—'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {perfil?.rol === 'admin' ? 'Administrador' : 'Doctor'}
                </p>
              </div>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform shrink-0 ${menuAbierto ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown */}
            {menuAbierto && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-50">

                <button
                  onClick={handleMiCuenta}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-gray-50 transition-colors"
                >
                  <User size={15} className="text-gray-400" />
                  Mi cuenta
                </button>

                <button
                  disabled
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
                >
                  <Settings size={15} className="text-gray-300" />
                  Preferencias
                  <span className="ml-auto text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">Pronto</span>
                </button>


                <div className="my-1.5 border-t border-gray-100" />

                <button
                  onClick={handleCerrarSesion}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} />
                  Cerrar sesión
                </button>

              </div>
            )}
          </div>

        </div>
      </header>

      <ModalPerfil abierto={modalPerfil} onCerrar={() => setModalPerfil(false)} />
    </>
  )
}

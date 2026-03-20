interface Props {
  className?: string
}

export function Spinner({ className = 'w-8 h-8' }: Props) {
  return (
    <div
      className={`${className} border-4 border-blue-500 border-t-transparent rounded-full animate-spin`}
      role="status"
      aria-label="Cargando"
    />
  )
}

export function PantallaCarga() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Spinner />
    </div>
  )
}

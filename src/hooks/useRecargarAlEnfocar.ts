import { useEffect } from 'react'

export function useRecargarAlEnfocar(callback: () => void) {
  useEffect(() => {
    function handler() {
      if (document.visibilityState === 'visible') callback()
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [callback])
}

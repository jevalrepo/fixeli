/**
 * Logo vectorial FIXELI — SVG path-based.
 *
 * Letras con trazo geométrico uniforme y remates redondeados:
 *   F  I  X  E(=Ξ tres barras)  L  I  + molar
 *
 * El diente usa curvas cúbicas y cuadráticas para replicar la forma
 * orgánica del logo: corona rectangular con esquinas suaves, dos raíces
 * simétricas con puntas redondeadas y valle entre ellas.
 *
 * Props:
 *   variant          'oscuro' | 'claro'        default: 'oscuro'
 *   mostrarSubtitulo  agrega "ODONTOLOGÍA…"     default: false
 *   className        dimensionar con Tailwind   ej. "h-10 w-auto"
 */

interface Props {
  variant?: 'oscuro' | 'claro'
  mostrarSubtitulo?: boolean
  className?: string
}

export function LogoFixeli({
  variant = 'oscuro',
  mostrarSubtitulo = false,
  className = '',
}: Props) {
  const color = variant === 'claro' ? '#ffffff' : '#000000'
  const sw = 6

  return (
    <svg
      viewBox={mostrarSubtitulo ? '0 0 262 94' : '0 0 262 74'}
      className={className}
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="FIXELI Odontología Integral & Estética"
    >
      {/* ── F ─────────────────────────────────── */}
      <line x1="5"   y1="5"  x2="5"   y2="62" />
      <line x1="5"   y1="5"  x2="31"  y2="5"  />
      <line x1="5"   y1="31" x2="25"  y2="31" />

      {/* ── I ─────────────────────────────────── */}
      <line x1="42"  y1="5"  x2="42"  y2="62" />

      {/* ── X ─────────────────────────────────── */}
      <line x1="54"  y1="5"  x2="84"  y2="62" />
      <line x1="84"  y1="5"  x2="54"  y2="62" />

      {/* ── E  (Ξ — tres barras horizontales) ──── */}
      <line x1="96"  y1="5"  x2="126" y2="5"  />
      <line x1="96"  y1="33" x2="126" y2="33" />
      <line x1="96"  y1="62" x2="126" y2="62" />

      {/* ── L ─────────────────────────────────── */}
      <line x1="138" y1="5"  x2="138" y2="62" />
      <line x1="138" y1="62" x2="168" y2="62" />

      {/* ── I ─────────────────────────────────── */}
      <line x1="179" y1="5"  x2="179" y2="62" />

      {/* ── Molar ─────────────────────────────────────────────────────────
           Sistema de coordenadas local (origen 0,0):
             Corona:    x 0-65,  y 0-40   (65 × 40 u.)
             Raíz izq:  x 0-22,  y 40-68  (22 u. ancho, redondeada)
             Raíz der:  x 43-65, y 40-68  (22 u. ancho, redondeada)
             Valle:     x 22-43, y 40-46  (profundidad 6 u.)
           Traducido en el SVG a: translate(192, 2)
      ─────────────────────────────────────────────────────────────────── */}
      <g transform="translate(192,2)">
        <path d="
          M 7,0
          L 58,0
          Q 65,0 65,7
          L 65,40
          C 65,51 61,61 57,65
          C 54,68 51,68 48,65
          C 45,62 43,56 43,50
          V 46
          H 22
          V 50
          C 22,56 20,62 17,65
          C 14,68 11,68 8,65
          C 4,61 0,51 0,40
          L 0,7
          Q 0,0 7,0
          Z
        " />
      </g>

      {/* ── Subtítulo opcional ──────────────────── */}
      {mostrarSubtitulo && (
        <text
          x="131"
          y="87"
          textAnchor="middle"
          fontSize="9"
          fontFamily="system-ui, 'Segoe UI', sans-serif"
          fontWeight="500"
          letterSpacing="2.8"
          stroke="none"
          fill={color}
        >
          ODONTOLOGÍA INTEGRAL &amp; ESTÉTICA
        </text>
      )}
    </svg>
  )
}

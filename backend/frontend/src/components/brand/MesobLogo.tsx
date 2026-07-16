import { motion } from 'framer-motion'

interface MesobLogoProps {
  size?: number
  className?: string
  /** When true the logo has a subtle continuous slow rotation. Default: true */
  animate?: boolean
}

export default function MesobLogo({ size = 48, className = '', animate = true }: MesobLogoProps) {
  const img = (
    <img
      src="https://mesobcenter.et/Companies/Logo.png"
      alt="MESOB Center Logo"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain' }}
      draggable={false}
    />
  )

  if (!animate) return img

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: 20,       // slow gentle spin
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{ display: 'inline-flex', willChange: 'transform' }}
      aria-hidden
    >
      {img}
    </motion.div>
  )
}

export function EthiopiaEmblem({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Ethiopian Government Emblem"
      role="img"
    >
      <circle cx="40" cy="40" r="38" fill="#1565C0" />
      <g transform="translate(40,40)">
        <polygon
          points="0,-22 5.1,-15.8 13,-15.8 7.9,-9.8 9.9,-1.6 0,-6.5 -9.9,-1.6 -7.9,-9.8 -13,-15.8 -5.1,-15.8"
          fill="#C8961E"
          stroke="#C8961E"
          strokeWidth="0.5"
        />
        {[0, 51.4, 102.8, 154.2, 205.6, 257, 308.4].map((angle, i) => (
          <line
            key={i}
            x1="0" y1="-16"
            x2="0" y2="-28"
            stroke="#C8961E"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${angle})`}
          />
        ))}
      </g>
      <circle cx="40" cy="40" r="38" fill="none" stroke="#C8961E" strokeWidth="2" />
    </svg>
  )
}

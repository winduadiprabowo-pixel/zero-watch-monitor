/**
 * ZERØ WATCH — SplashScreen v1
 * ==============================
 * Full screen splash on first load.
 * Logo gede di tengah → fade in → hold 1.2s → fade out → masuk dashboard
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useEffect, useState } from 'react'

interface SplashScreenProps {
  onDone: () => void
}

const SplashScreen = memo(({ onDone }: SplashScreenProps) => {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in')

  useEffect(() => {
    // fade in 0.6s → hold 1.0s → fade out 0.5s
    const t1 = setTimeout(() => setPhase('hold'), 600)
    const t2 = setTimeout(() => setPhase('out'), 1600)
    const t3 = setTimeout(() => onDone(), 2100)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         9999,
        background:     'rgba(4, 4, 10, 1)',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '24px',
        opacity:        phase === 'out' ? 0 : 1,
        transition:     phase === 'out' ? 'opacity 0.5s ease' : phase === 'in' ? 'opacity 0.6s ease' : 'none',
        pointerEvents:  phase === 'out' ? 'none' : 'all',
      }}
    >
      {/* Ambient glow behind logo */}
      <div
        style={{
          position:   'absolute',
          width:      '300px',
          height:     '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 212, 255, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          animation:  'splash-pulse 2s ease-in-out infinite',
        }}
      />

      {/* Logo */}
      <div
        style={{
          position:   'relative',
          transform:  phase === 'in' ? 'scale(0.88)' : 'scale(1)',
          transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <img
          src="/icon-192.png"
          alt="ZERØ WATCH"
          style={{
            width:        '96px',
            height:       '96px',
            borderRadius: '28px',
            boxShadow:    '0 0 40px rgba(0, 212, 255, 0.25), 0 0 80px rgba(0, 212, 255, 0.10)',
          }}
        />
      </div>

      {/* Brand text */}
      <div
        style={{
          textAlign:  'center',
          opacity:    phase === 'in' ? 0 : 1,
          transform:  phase === 'in' ? 'translateY(8px)' : 'translateY(0)',
          transition: 'opacity 0.4s ease 0.3s, transform 0.4s ease 0.3s',
        }}
      >
        <div
          style={{
            fontFamily:    "'IBM Plex Mono', monospace",
            fontSize:      '10px',
            fontWeight:    600,
            letterSpacing: '0.28em',
            color:         'rgba(255,255,255,0.25)',
            textTransform: 'uppercase',
          }}
        >
          ZERØ BUILD LAB
        </div>
        <div
          style={{
            fontFamily:    "'IBM Plex Mono', monospace",
            fontSize:      '9px',
            letterSpacing: '0.20em',
            color:         'rgba(0, 212, 255, 0.4)',
            textTransform: 'uppercase',
            marginTop:     '4px',
          }}
        >
          Smart Money Tracker
        </div>
      </div>

      {/* Loading dots */}
      <div
        style={{
          display:    'flex',
          gap:        '6px',
          opacity:    phase === 'in' ? 0 : 1,
          transition: 'opacity 0.4s ease 0.5s',
        }}
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width:        '4px',
              height:       '4px',
              borderRadius: '50%',
              background:   'rgba(0, 212, 255, 0.5)',
              animation:    `splash-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes splash-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
        }
        @keyframes splash-dot {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
})

SplashScreen.displayName = 'SplashScreen'
export default SplashScreen

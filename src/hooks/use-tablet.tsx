/**
 * ZERØ WATCH — use-tablet v13
 * =============================
 * Pakai matchMedia bukan resize event — lebih efisien, konsisten dengan use-mobile.
 */

import * as React from 'react'

const TABLET_MIN = 768
const TABLET_MAX = 1024

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia(
      `(min-width: ${TABLET_MIN}px) and (max-width: ${TABLET_MAX}px)`
    )
    const onChange = () => setIsTablet(mql.matches)
    mql.addEventListener('change', onChange)
    setIsTablet(mql.matches)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isTablet
}

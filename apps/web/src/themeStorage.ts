export type ColorMode = 'light' | 'dark' | 'system'

const KEY = 'mustream.theme.v1'

export function loadColorMode(): ColorMode {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  } catch {
    /* ignore */
  }
  return 'system'
}

export function saveColorMode(mode: ColorMode): void {
  try {
    localStorage.setItem(KEY, mode)
  } catch {
    /* ignore */
  }
}

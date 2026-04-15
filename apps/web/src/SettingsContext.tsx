import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loadServerSettings, saveServerSettings } from './settingsStorage'
import type { ServerSettings } from './subsonic/types'

type Ctx = {
  settings: ServerSettings
  updateSettings: (s: ServerSettings) => void
  configured: boolean
}

const SettingsContext = createContext<Ctx | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ServerSettings>(() => loadServerSettings())

  const updateSettings = useCallback((s: ServerSettings) => {
    saveServerSettings(s)
    setSettings(s)
  }, [])

  const configured = Boolean(settings.username.trim() && settings.password.trim())

  const value = useMemo(
    () => ({ settings, updateSettings, configured }),
    [settings, updateSettings, configured],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useServerSettings(): Ctx {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useServerSettings outside SettingsProvider')
  return ctx
}

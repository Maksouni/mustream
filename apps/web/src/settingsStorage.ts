import type { ServerSettings } from './subsonic/types'

const KEY = 'mustream.server.v1'

export function loadServerSettings(): ServerSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      return { baseUrl: '', username: '', password: '' }
    }
    const p = JSON.parse(raw) as Partial<ServerSettings>
    return {
      baseUrl: typeof p.baseUrl === 'string' ? p.baseUrl : '',
      username: typeof p.username === 'string' ? p.username : '',
      password: typeof p.password === 'string' ? p.password : '',
    }
  } catch {
    return { baseUrl: '', username: '', password: '' }
  }
}

export function saveServerSettings(s: ServerSettings): void {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      baseUrl: s.baseUrl,
      username: s.username,
      password: s.password,
    }),
  )
}

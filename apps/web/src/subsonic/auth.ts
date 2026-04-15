import md5 from 'md5'

export function tokenAuthParams(username: string, password: string): Record<string, string> {
  const s = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '')
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const t = md5(password + s)
  return { u: username, t, s }
}

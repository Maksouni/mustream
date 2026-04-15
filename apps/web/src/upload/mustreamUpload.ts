import { tokenAuthParams } from '../subsonic/auth'

export type UploadResult =
  | { ok: true; saved: string[]; count: number }
  | { ok: false; error: string }

function uploadUrl(): string {
  return '/api/upload'
}

/** POST audio files; auth uses same token scheme as Subsonic (verified against Navidrome). */
export async function uploadTracks(
  username: string,
  password: string,
  files: File[],
  onProgress?: (loaded: number, total: number) => void,
): Promise<UploadResult> {
  if (files.length === 0) {
    return { ok: false, error: 'No files selected' }
  }
  const auth = tokenAuthParams(username, password)
  const form = new FormData()
  for (const f of files) {
    form.append('files', f, f.name)
  }

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', uploadUrl())
    xhr.setRequestHeader('X-Mustream-User', username)
    xhr.setRequestHeader('X-Mustream-Salt', auth.s)
    xhr.setRequestHeader('X-Mustream-Token', auth.t)

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && onProgress) {
        onProgress(ev.loaded, ev.total)
      }
    }

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || '{}') as Record<string, unknown>
        if (xhr.status >= 200 && xhr.status < 300 && data.ok === true) {
          resolve({
            ok: true,
            saved: (data.saved as string[]) ?? [],
            count: Number(data.count ?? 0),
          })
          return
        }
        resolve({
          ok: false,
          error: (data.error as string) || `HTTP ${xhr.status}`,
        })
      } catch {
        resolve({ ok: false, error: xhr.responseText || `HTTP ${xhr.status}` })
      }
    }

    xhr.onerror = () => resolve({ ok: false, error: 'Network error' })
    xhr.send(form)
  })
}

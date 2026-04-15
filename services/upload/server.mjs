import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'

const PORT = Number(process.env.PORT ?? 3000)
const MUSIC_DIR = process.env.MUSIC_DIR ?? '/music'
const NAVIDROME_URL = (process.env.NAVIDROME_URL ?? 'http://navidrome:4533').replace(/\/+$/, '')
const UPLOAD_SUBDIR = 'uploads'
const API_VERSION = '1.16.1'
const CLIENT_ID = 'mustream'

const ALLOWED_EXT = new Set([
  '.mp3',
  '.flac',
  '.m4a',
  '.aac',
  '.ogg',
  '.opus',
  '.wav',
  '.wma',
  '.mpc',
  '.aiff',
  '.aif',
  '.caf',
])

function safeBaseName(name) {
  const base = path.basename(name)
  const cleaned = base.replace(/[^\w.\- \u0400-\u04FF()]/g, '_')
  if (!cleaned || cleaned === '.' || cleaned === '..') return null
  return cleaned.slice(0, 220)
}

function uniquePath(dir, original) {
  const safe = safeBaseName(original)
  if (!safe) return `track-${Date.now()}.upload`
  let base = safe
  let ext = path.extname(base)
  let stem = ext ? base.slice(0, -ext.length) : base
  if (!ext) ext = ''
  let candidate = path.join(dir, base)
  let n = 0
  while (fs.existsSync(candidate)) {
    n += 1
    candidate = path.join(dir, `${stem}-${n}${ext}`)
  }
  return path.basename(candidate)
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    const dir = path.join(MUSIC_DIR, UPLOAD_SUBDIR)
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename(_req, file, cb) {
    const dir = path.join(MUSIC_DIR, UPLOAD_SUBDIR)
    cb(null, uniquePath(dir, file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 250 * 1024 * 1024, files: 80 },
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ALLOWED_EXT.has(ext)) cb(null, true)
    else cb(new Error(`Unsupported file type: ${ext || '(none)'}`))
  },
})

async function pingNavidrome(username, salt, token) {
  const params = new URLSearchParams({
    u: username,
    s: salt,
    t: token,
    v: API_VERSION,
    c: CLIENT_ID,
    f: 'json',
  })
  const url = `${NAVIDROME_URL}/rest/ping.view?${params}`
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
  if (!res.ok) return false
  const data = await res.json()
  const sr = data['subsonic-response']
  return sr?.status === 'ok'
}

async function verifyNavidromeAuth(req, res, next) {
  const user = req.headers['x-mustream-user']
  const salt = req.headers['x-mustream-salt']
  const token = req.headers['x-mustream-token']
  if (typeof user !== 'string' || typeof salt !== 'string' || typeof token !== 'string') {
    res.status(401).json({ error: 'Missing X-Mustream-User, X-Mustream-Salt, or X-Mustream-Token' })
    return
  }
  try {
    const ok = await pingNavidrome(user, salt, token)
    if (!ok) {
      res.status(401).json({ error: 'Invalid Subsonic / Navidrome credentials' })
      return
    }
    next()
  } catch (e) {
    console.error('Auth check failed', e)
    res.status(502).json({ error: 'Cannot reach Navidrome for auth check' })
  }
}

const app = express()

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post(
  '/api/upload',
  verifyNavidromeAuth,
  upload.array('files', 80),
  (req, res) => {
    const files = req.files ?? []
    if (files.length === 0) {
      res.status(400).json({ error: 'No files in request (use field name "files")' })
      return
    }
    res.json({
      ok: true,
      saved: files.map((f) => path.join(UPLOAD_SUBDIR, f.filename)),
      count: files.length,
    })
  },
)

app.use((err, _req, res, _next) => {
  console.error('Upload error', err)
  const msg = err?.message ?? 'Upload failed'
  const code = /Unsupported|LIMIT_/.test(String(err?.code ?? msg)) ? 400 : 500
  res.status(code).json({ error: msg })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`mustream-upload listening on ${PORT}, music dir=${MUSIC_DIR}, navidrome=${NAVIDROME_URL}`)
})

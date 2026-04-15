import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useCallback, useRef, useState } from 'react'
import { startLibraryScan } from '../subsonic/client'
import { useServerSettings } from '../SettingsContext'
import { uploadTracks } from '../upload/mustreamUpload'

const ACCEPT = 'audio/*,.mp3,.flac,.m4a,.aac,.ogg,.opus,.wav,.wma,.mpc,.aiff,.caf'

export function UploadPage() {
  const { settings, configured } = useServerSettings()
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((incoming: FileList | File[] | null) => {
    if (!incoming || incoming.length === 0) return
    setFiles((prev) => {
      const next = [...prev]
      for (const f of Array.from(incoming)) {
        next.push(f)
      }
      return next
    })
    setMessage(null)
    setError(null)
  }, [])

  const removeAt = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i))
  }

  const onUpload = async () => {
    if (!configured || files.length === 0) return
    setBusy(true)
    setError(null)
    setMessage(null)
    setProgress(0)
    try {
      const res = await uploadTracks(
        settings.username,
        settings.password,
        files,
        (loaded, total) => setProgress(total > 0 ? Math.round((100 * loaded) / total) : null),
      )
      if (!res.ok) {
        setError(res.error)
        setProgress(null)
        return
      }
      setMessage(`Saved ${res.count} file(s) to library folder uploads/.`)
      setFiles([])
      setProgress(100)
      try {
        await startLibraryScan(settings)
        setMessage((m) => `${m ?? ''} Library scan started — new tracks will appear shortly.`)
      } catch {
        setMessage((m) => `${m ?? ''} (Scan could not be triggered automatically; use Navidrome to scan.)`)
      }
    } finally {
      setBusy(false)
      setTimeout(() => setProgress(null), 800)
    }
  }

  if (!configured) {
    return (
      <Typography color="text.secondary">
        Open <strong>Settings</strong> and sign in to upload tracks.
      </Typography>
    )
  }

  return (
    <Box sx={{ maxWidth: 720, width: 1, minWidth: 0 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
        <CloudUploadIcon color="primary" />
        <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          Upload
        </Typography>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
        Files are stored under <code>music/uploads/</code> on the server. Supported: MP3, FLAC, M4A, AAC,
        OGG, Opus, WAV, and common lossless/lossy formats. Maximum ~250&nbsp;MB per file. A library scan runs
        after a successful upload.
      </Typography>

      <Box
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          addFiles(e.dataTransfer.files)
        }}
        sx={{
          border: 2,
          borderStyle: 'dashed',
          borderColor: 'divider',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: 'action.hover',
          transition: 'border-color 0.2s, background-color 0.2s',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: (t) => (t.palette.mode === 'dark' ? 'action.selected' : 'action.hover'),
          },
        }}
      >
        <LibraryMusicIcon sx={{ fontSize: 40, opacity: 0.5, mb: 1 }} />
        <Typography sx={{ fontWeight: 600 }}>Drop files here or click to choose</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          You can add multiple audio files
        </Typography>
        <input
          ref={inputRef}
          multiple
          type="file"
          accept={ACCEPT}
          style={{ display: 'none' }}
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </Box>

      {files.length > 0 ? (
        <Stack spacing={1} sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Selected ({files.length})
          </Typography>
          <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap' }}>
            {files.map((f, i) => (
              <Chip
                key={`${i}-${f.name}-${f.size}-${f.lastModified}`}
                label={`${f.name} (${Math.round(f.size / 1024)} KB)`}
                onDelete={() => removeAt(i)}
                deleteIcon={<DeleteOutlineOutlinedIcon />}
                variant="outlined"
              />
            ))}
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<CloudUploadIcon />}
              disabled={busy}
              onClick={() => void onUpload()}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              {busy ? 'Uploading…' : 'Upload to server'}
            </Button>
            <Button color="inherit" disabled={busy} onClick={() => setFiles([])} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              Clear list
            </Button>
          </Stack>
        </Stack>
      ) : null}

      {progress != null ? (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant={progress >= 100 ? 'determinate' : 'indeterminate'} value={progress} />
        </Box>
      ) : null}

      {error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : null}
      {message ? (
        <Alert severity="success" sx={{ mt: 2 }}>
          {message}
        </Alert>
      ) : null}
    </Box>
  )
}

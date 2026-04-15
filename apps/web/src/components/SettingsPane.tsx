import CloudDoneIcon from '@mui/icons-material/CloudDone'
import WifiTetheringIcon from '@mui/icons-material/WifiTethering'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { ping } from '../subsonic/client'
import { useServerSettings } from '../SettingsContext'

export function SettingsPane() {
  const { settings, updateSettings } = useServerSettings()
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl)
  const [username, setUsername] = useState(settings.username)
  const [password, setPassword] = useState(settings.password)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const save = () => {
    updateSettings({ baseUrl, username, password })
    setStatus('Saved.')
  }

  const test = async () => {
    setBusy(true)
    setStatus(null)
    try {
      await ping({ baseUrl, username, password })
      setStatus('Connection OK.')
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Connection failed.')
    } finally {
      setBusy(false)
    }
  }

  const statusErr = status && !status.startsWith('Saved') && status !== 'Connection OK.'

  return (
    <Box sx={{ maxWidth: 560 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
        Leave base URL empty when the app and Subsonic API share the same origin (Docker web on port 8080, or{' '}
        <Box component="code" sx={{ typography: 'body2', fontFamily: 'monospace', px: 0.5, bgcolor: 'action.hover', borderRadius: 0.5 }}>
          npm run dev
        </Box>{' '}
        with Vite proxy). Otherwise set your Navidrome URL (no trailing slash), e.g.{' '}
        <Box component="code" sx={{ typography: 'body2', fontFamily: 'monospace', px: 0.5, bgcolor: 'action.hover', borderRadius: 0.5 }}>
          http://localhost:4533
        </Box>
        .
      </Typography>
      <Stack spacing={2}>
        <TextField
          label="Base URL"
          name="baseUrl"
          type="url"
          autoComplete="off"
          placeholder="e.g. http://localhost:4533"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          fullWidth
        />
        <TextField
          label="Username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          fullWidth
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
        />
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={save} startIcon={<CloudDoneIcon />}>
            Save
          </Button>
          <Button
            variant="outlined"
            onClick={() => void test()}
            disabled={busy}
            startIcon={busy ? <CircularProgress size={18} /> : <WifiTetheringIcon />}
          >
            {busy ? 'Testing…' : 'Test connection'}
          </Button>
        </Stack>
      </Stack>
      {status ? (
        <Alert severity={statusErr ? 'error' : 'success'} sx={{ mt: 2 }}>
          {status}
        </Alert>
      ) : null}
    </Box>
  )
}

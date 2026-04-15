import AddIcon from '@mui/icons-material/Add'
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createPlaylist, listPlaylists } from '../subsonic/client'
import { useAppTheme } from '../AppThemeProvider'
import { useServerSettings } from '../SettingsContext'
import type { PlaylistSummary } from '../subsonic/types'

const rowMotion = (reduced: boolean) =>
  reduced
    ? {}
    : {
        transition: 'background-color 0.2s ease, transform 0.2s ease',
        '&:hover': { transform: 'translateX(4px)' },
      }

export function PlaylistsPage() {
  const navigate = useNavigate()
  const { reducedMotion } = useAppTheme()
  const { settings, configured } = useServerSettings()
  const [list, setList] = useState<PlaylistSummary[] | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!configured) return
    setBusy(true)
    setError(null)
    try {
      setList(await listPlaylists(settings))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load playlists.')
    } finally {
      setBusy(false)
    }
  }, [configured, settings])

  useEffect(() => {
    void load()
  }, [load])

  const onCreate = async () => {
    const n = name.trim()
    if (!n || !configured) return
    setBusy(true)
    setError(null)
    try {
      await createPlaylist(settings, n)
      setName('')
      const next = await listPlaylists(settings)
      setList(next)
      const match = next.filter((p) => p.name === n).sort((a, b) => b.id.localeCompare(a.id))[0]
      if (match) navigate(`/playlists/${match.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create playlist.')
    } finally {
      setBusy(false)
    }
  }

  if (!configured) {
    return (
      <Typography color="text.secondary">Sign in under Settings to manage playlists.</Typography>
    )
  }

  return (
    <Box sx={{ maxWidth: 720, width: 1, minWidth: 0 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
        <PlaylistPlayIcon color="primary" />
        <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          Playlists
        </Typography>
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="New playlist"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />
        <Button
          variant="contained"
          disabled={busy || !name.trim()}
          onClick={() => void onCreate()}
          startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <AddIcon />}
          sx={{ minWidth: { sm: 140 }, width: { xs: '100%', sm: 'auto' }, alignSelf: { xs: 'stretch', sm: 'center' } }}
        >
          Create
        </Button>
      </Stack>
      {error ? (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      ) : null}
      {busy && !list?.length ? (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Loading…
        </Typography>
      ) : null}
      <List disablePadding>
        {(list ?? []).map((p, i) => (
          <Box key={p.id}>
            {i > 0 ? <Divider component="li" /> : null}
            <ListItemButton
              component={Link}
              to={`/playlists/${p.id}`}
              sx={{
                borderRadius: 1,
                py: 1.5,
                ...rowMotion(reducedMotion),
              }}
            >
              <ListItemText
                primary={<Typography sx={{ fontWeight: 700 }}>{p.name}</Typography>}
                secondary={`${p.songCount ?? 0} tracks`}
              />
            </ListItemButton>
          </Box>
        ))}
      </List>
    </Box>
  )
}

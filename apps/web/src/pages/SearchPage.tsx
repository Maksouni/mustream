import AlbumIcon from '@mui/icons-material/Album'
import SearchIcon from '@mui/icons-material/Search'
import PersonIcon from '@mui/icons-material/Person'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { buildCoverArtUrl, getAlbumWithSongs, searchLibrary } from '../subsonic/client'
import { TrackActions } from '../components/TrackActions'
import { useAppTheme } from '../AppThemeProvider'
import { usePlayer } from '../PlayerContext'
import { useServerSettings } from '../SettingsContext'
import { toPlaybackTrack } from '../trackUtils'

const cardMotion = (reduced: boolean) =>
  reduced
    ? {}
    : {
        transition: 'transform 0.22s ease, box-shadow 0.22s ease',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: 6 },
      }

export function SearchPage() {
  const { reducedMotion } = useAppTheme()
  const { settings, configured } = useServerSettings()
  const { playNow, playAlbum, addToQueue, addToQueueNext } = usePlayer()
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Awaited<ReturnType<typeof searchLibrary>> | null>(null)

  const run = async () => {
    if (!configured) return
    setBusy(true)
    setError(null)
    try {
      const r = await searchLibrary(settings, q)
      setResult(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed.')
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  if (!configured) {
    return (
      <Typography color="text.secondary">Configure the server in Settings to use search.</Typography>
    )
  }

  return (
    <Box>
      <Typography
        variant="h4"
        sx={{ fontWeight: 800, mb: 2, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
      >
        Search
      </Typography>
      <Box component="form" onSubmit={(e) => { e.preventDefault(); void run(); }} sx={{ mb: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            fullWidth
            placeholder="Artists, albums, tracks…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoComplete="off"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={busy || !q.trim()}
            startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
            sx={{ minWidth: { sm: 140 }, width: { xs: '100%', sm: 'auto' }, alignSelf: { xs: 'stretch', sm: 'center' } }}
          >
            Search
          </Button>
        </Stack>
      </Box>
      {error ? (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      ) : null}

      {result ? (
        <Stack spacing={4}>
          <Box>
            <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
              <PersonIcon color="primary" />
              <Typography variant="h6">Artists</Typography>
            </Stack>
            <Stack spacing={0.5}>
              {result.artists.map((a) => (
                <Typography key={a.id} sx={{ py: 0.75, px: 1, borderRadius: 1, bgcolor: 'action.hover' }}>
                  {a.name}
                </Typography>
              ))}
            </Stack>
            {result.artists.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                No artists.
              </Typography>
            ) : null}
          </Box>
          <Box>
            <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
              <AlbumIcon color="primary" />
              <Typography variant="h6">Albums</Typography>
            </Stack>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 2,
              }}
            >
              {result.albums.map((al) => (
                <Card key={al.id} sx={{ ...cardMotion(reducedMotion) }}>
                  <CardActionArea
                    onClick={() => {
                      void (async () => {
                        const { album, songs } = await getAlbumWithSongs(settings, al.id)
                        const tracks = songs.map((s) => toPlaybackTrack(s, album.artist, album.name))
                        playAlbum(tracks, 0)
                      })()
                    }}
                  >
                    {al.coverArt ? (
                      <CardMedia component="img" height="120" image={buildCoverArtUrl(settings, al.coverArt, 240)} sx={{ objectFit: 'cover' }} />
                    ) : (
                      <Box sx={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover' }}>
                        <AlbumIcon sx={{ opacity: 0.35, fontSize: 48 }} />
                      </Box>
                    )}
                    <CardContent>
                      <Typography noWrap sx={{ fontWeight: 700 }}>
                        {al.name}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
            {result.albums.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                No albums.
              </Typography>
            ) : null}
          </Box>
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Tracks
            </Typography>
            <Stack spacing={1}>
              {result.songs.map((s) => {
                const pb = toPlaybackTrack(s)
                return (
                  <Card key={s.id} variant="outlined" sx={{ ...cardMotion(reducedMotion) }}>
                    <Stack direction="row" spacing={1} sx={{ p: 1.5, alignItems: 'center' }}>
                      <Box
                        component="button"
                        type="button"
                        onClick={() => playNow(pb)}
                        sx={{
                          flex: 1,
                          textAlign: 'left',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          font: 'inherit',
                          color: 'inherit',
                          minWidth: 0,
                        }}
                      >
                        <Typography noWrap sx={{ fontWeight: 600 }}>
                          {s.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                          {[s.artist, s.album].filter(Boolean).join(' · ')}
                        </Typography>
                      </Box>
                      <TrackActions
                        onPlay={() => playNow(pb)}
                        onPlayNext={() => addToQueueNext(pb)}
                        onAddQueue={() => addToQueue(pb)}
                      />
                    </Stack>
                  </Card>
                )
              })}
            </Stack>
            {result.songs.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                No tracks.
              </Typography>
            ) : null}
          </Box>
        </Stack>
      ) : null}
    </Box>
  )
}

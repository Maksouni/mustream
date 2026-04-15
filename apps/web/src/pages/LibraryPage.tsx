import AlbumIcon from '@mui/icons-material/Album'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined'
import RefreshIcon from '@mui/icons-material/Refresh'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useCallback, useEffect, useState } from 'react'
import {
  buildCoverArtUrl,
  getAlbumWithSongs,
  getArtistList,
  getArtistWithAlbums,
} from '../subsonic/client'
import { TrackActions } from '../components/TrackActions'
import { useAppTheme } from '../AppThemeProvider'
import { usePlayer } from '../PlayerContext'
import { useServerSettings } from '../SettingsContext'
import { toPlaybackTrack } from '../trackUtils'
import type { AlbumRef, ArtistRef, SongRef } from '../subsonic/types'

function formatDuration(sec?: number): string {
  if (sec == null || Number.isNaN(sec)) return '—'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const cardMotion = (reduced: boolean) =>
  reduced
    ? {}
    : {
        transition: 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.22s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }

export function LibraryPage() {
  const { reducedMotion } = useAppTheme()
  const { settings, configured } = useServerSettings()
  const { playNow, playAlbum, addToQueue, addToQueueNext } = usePlayer()
  const [error, setError] = useState<string | null>(null)
  const [artists, setArtists] = useState<ArtistRef[] | null>(null)
  const [artistDetail, setArtistDetail] = useState<{ artist: ArtistRef; albums: AlbumRef[] } | null>(
    null,
  )
  const [albumDetail, setAlbumDetail] = useState<{
    album: AlbumRef
    songs: SongRef[]
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const loadArtists = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await getArtistList(settings)
      setArtists(list)
      setArtistDetail(null)
      setAlbumDetail(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load library.')
      setArtists(null)
    } finally {
      setLoading(false)
    }
  }, [settings])

  useEffect(() => {
    if (configured) void loadArtists()
  }, [configured, loadArtists])

  const openArtist = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const detail = await getArtistWithAlbums(settings, id)
      setArtistDetail(detail)
      setAlbumDetail(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load artist.')
    } finally {
      setLoading(false)
    }
  }

  const openAlbum = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const detail = await getAlbumWithSongs(settings, id)
      setAlbumDetail(detail)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load album.')
    } finally {
      setLoading(false)
    }
  }

  const backToArtists = () => {
    setArtistDetail(null)
    setAlbumDetail(null)
    setError(null)
  }

  const backToArtist = () => {
    setAlbumDetail(null)
    setError(null)
  }

  if (!configured) {
    return (
      <Box sx={{ maxWidth: 720 }}>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Open <strong>Settings</strong> and enter your Navidrome credentials.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          With Docker, open the app on port <strong>8080</strong> and leave base URL empty. For local dev, empty
          base uses the Vite proxy.
        </Typography>
      </Box>
    )
  }

  if (albumDetail) {
    const { album, songs } = albumDetail
    const tracks = songs.map((s) => toPlaybackTrack(s, album.artist, album.name))
    return (
      <Box>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{ mb: 3, flexWrap: 'wrap', alignItems: { xs: 'stretch', sm: 'flex-start' } }}
        >
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={backToArtist}
            color="inherit"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Albums
          </Button>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={backToArtists}
            color="inherit"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            All artists
          </Button>
          <Button
            variant="contained"
            startIcon={<PlayCircleOutlinedIcon />}
            disabled={tracks.length === 0}
            onClick={() => playAlbum(tracks, 0)}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Play all
          </Button>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 3, alignItems: { sm: 'flex-end' } }}>
          <Box
            sx={{
              width: { xs: 160, sm: 200 },
              height: { xs: 160, sm: 200 },
              alignSelf: { xs: 'center', sm: 'auto' },
              borderRadius: 3,
              overflow: 'hidden',
              flexShrink: 0,
              bgcolor: 'action.hover',
              boxShadow: 4,
              ...cardMotion(reducedMotion),
            }}
          >
            {album.coverArt ? (
              <Box
                component="img"
                src={buildCoverArtUrl(settings, album.coverArt, 400)}
                alt=""
                sx={{ width: 1, height: 1, objectFit: 'cover' }}
              />
            ) : (
              <Stack sx={{ height: 1, alignItems: 'center', justifyContent: 'center' }}>
                <AlbumIcon sx={{ fontSize: 72, opacity: 0.4 }} />
              </Stack>
            )}
          </Box>
          <Box>
            <Typography variant="overline" color="primary">
              Album
            </Typography>
            <Typography
              component="h1"
              sx={{
                fontWeight: 800,
                mb: 1,
                fontSize: { xs: '1.45rem', sm: '2.125rem' },
                lineHeight: { xs: 1.25, sm: 1.167 },
              }}
            >
              {album.name}
            </Typography>
            <Typography color="text.secondary">{album.artist}</Typography>
          </Box>
        </Stack>
        <Stack spacing={1}>
          {songs.map((s, idx) => {
            const pb = tracks[idx]
            return (
              <Card key={s.id} variant="outlined" sx={{ ...cardMotion(reducedMotion) }}>
                <Stack
                  direction="row"
                  sx={{
                    pl: { xs: 1, sm: 2 },
                    pr: { xs: 0.5, sm: 1 },
                    py: { xs: 1, sm: 0.5 },
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: { xs: 0.5, sm: 0 },
                    rowGap: 0.5,
                  }}
                >
                  <Typography variant="caption" sx={{ width: 28, fontFamily: 'monospace', color: 'text.secondary' }}>
                    {idx + 1}
                  </Typography>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => playAlbum(tracks, idx)}
                    sx={{
                      flex: 1,
                      textAlign: 'left',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      py: 1,
                      font: 'inherit',
                      color: 'inherit',
                      minWidth: 0,
                    }}
                  >
                    <Typography noWrap sx={{ fontWeight: 600 }}>
                      {s.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ width: 48, textAlign: 'right' }}>
                    {formatDuration(s.duration)}
                  </Typography>
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
      </Box>
    )
  }

  if (artistDetail) {
    const { artist, albums } = artistDetail
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={backToArtists}
          sx={{ mb: 3, width: { xs: '100%', sm: 'auto' } }}
          color="inherit"
        >
          Artists
        </Button>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 4, alignItems: { sm: 'flex-end' } }}>
          <Box
            sx={{
              width: { xs: 160, sm: 200 },
              height: { xs: 160, sm: 200 },
              alignSelf: { xs: 'center', sm: 'auto' },
              borderRadius: '50%',
              overflow: 'hidden',
              bgcolor: 'action.hover',
              boxShadow: 4,
              ...cardMotion(reducedMotion),
            }}
          >
            {artist.coverArt ? (
              <Box
                component="img"
                src={buildCoverArtUrl(settings, artist.coverArt, 400)}
                alt=""
                sx={{ width: 1, height: 1, objectFit: 'cover' }}
              />
            ) : null}
          </Box>
          <Box>
            <Typography variant="overline" color="primary">
              Artist
            </Typography>
            <Typography
              component="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.45rem', sm: '2.125rem' },
                lineHeight: { xs: 1.25, sm: 1.167 },
              }}
            >
              {artist.name}
            </Typography>
          </Box>
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2,
          }}
        >
          {albums.map((al) => (
            <Card key={al.id} sx={{ ...cardMotion(reducedMotion) }}>
              <CardActionArea onClick={() => void openAlbum(al.id)}>
                {al.coverArt ? (
                  <CardMedia
                    component="img"
                    image={buildCoverArtUrl(settings, al.coverArt, 320)}
                    alt=""
                    sx={{ objectFit: 'cover', height: { xs: 140, sm: 160 } }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: { xs: 140, sm: 160 },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'action.hover',
                    }}
                  >
                    <AlbumIcon sx={{ fontSize: 56, opacity: 0.35 }} />
                  </Box>
                )}
                <CardContent>
                  <Typography noWrap sx={{ fontWeight: 700 }}>
                    {al.name}
                  </Typography>
                  {al.year ? (
                    <Typography variant="caption" color="text.secondary">
                      {al.year}
                    </Typography>
                  ) : null}
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 1.5, sm: 0 }}
        sx={{ mb: 2, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' } }}
      >
        <Typography
          variant="h4"
          sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
        >
          Library
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={() => void loadArtists()}
          disabled={loading}
          variant="outlined"
          sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
        >
          Refresh
        </Button>
      </Stack>
      {error ? (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      ) : null}
      {loading && !artists?.length ? (
        <Stack sx={{ py: 6, alignItems: 'center' }}>
          <CircularProgress />
        </Stack>
      ) : null}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, minmax(0,1fr))',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(4, 1fr)',
            lg: 'repeat(5, 1fr)',
          },
          gap: 2,
        }}
      >
        {(artists ?? []).map((a) => (
          <Card key={a.id} sx={{ ...cardMotion(reducedMotion) }}>
            <CardActionArea
              onClick={() => void openArtist(a.id)}
              sx={{ p: { xs: 1.5, sm: 2 }, flexDirection: 'column' }}
            >
              <Box
                sx={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  mb: 1.5,
                  bgcolor: 'action.hover',
                }}
              >
                {a.coverArt ? (
                  <Box
                    component="img"
                    src={buildCoverArtUrl(settings, a.coverArt, 320)}
                    alt=""
                    sx={{ width: 1, height: 1, objectFit: 'cover' }}
                  />
                ) : null}
              </Box>
              <Typography noWrap sx={{ textAlign: 'center', fontWeight: 700, width: '100%' }}>
                {a.name}
              </Typography>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  )
}

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import ListItemButton from '@mui/material/ListItemButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  deletePlaylist,
  getPlaylist,
  syncPlaylistSongOrder,
  updatePlaylist,
} from '../subsonic/client'
import { TrackActions } from '../components/TrackActions'
import { useAppTheme } from '../AppThemeProvider'
import { usePlayer } from '../PlayerContext'
import { useServerSettings } from '../SettingsContext'
import { toPlaybackTrack } from '../trackUtils'
import type { PlaylistEntry, PlaylistSummary } from '../subsonic/types'

const trackRowMotion = (reduced: boolean) =>
  reduced
    ? {}
    : {
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 1,
          transform: 'translateY(-1px)',
        },
      }

function SortablePlaylistRow({
  entry,
  reducedMotion,
  children,
}: {
  entry: PlaylistEntry
  reducedMotion: boolean
  children: ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <Box
      component="li"
      ref={setNodeRef}
      style={style}
      sx={{
        display: 'flex',
        flexWrap: { xs: 'wrap', sm: 'nowrap' },
        alignItems: 'center',
        alignContent: 'center',
        rowGap: 1,
        columnGap: 0.5,
        py: 0.75,
        px: 1,
        borderRadius: 1,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        opacity: isDragging ? 0.88 : 1,
        listStyle: 'none',
        touchAction: 'pan-y',
        ...trackRowMotion(reducedMotion),
      }}
    >
      <IconButton
        size="small"
        aria-label="Reorder"
        sx={{
          cursor: 'grab',
          flexShrink: 0,
          touchAction: 'none',
          '@media (pointer: coarse)': { minWidth: 44, minHeight: 44 },
        }}
        {...attributes}
        {...listeners}
      >
        <DragIndicatorIcon fontSize="small" />
      </IconButton>
      {children}
    </Box>
  )
}

export function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { reducedMotion } = useAppTheme()
  const { settings, configured } = useServerSettings()
  const { playNow, playAlbum, addToQueue, addToQueueNext } = usePlayer()
  const [summary, setSummary] = useState<PlaylistSummary | null>(null)
  const [entries, setEntries] = useState<PlaylistEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [syncBusy, setSyncBusy] = useState(false)

  const load = useCallback(async () => {
    if (!configured || !id) return
    setBusy(true)
    setError(null)
    try {
      const data = await getPlaylist(settings, id)
      setSummary(data.summary)
      setEntries(data.entries)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load playlist.')
    } finally {
      setBusy(false)
    }
  }, [configured, id, settings])

  useEffect(() => {
    void load()
  }, [load])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = async (e: DragEndEvent) => {
    if (!id || !configured) return
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = entries.findIndex((x) => x.id === active.id)
    const newIndex = entries.findIndex((x) => x.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const ordered = arrayMove(entries, oldIndex, newIndex)
    const prev = entries
    setEntries(ordered)
    setSyncBusy(true)
    setError(null)
    try {
      await syncPlaylistSongOrder(
        settings,
        id,
        ordered.map((x) => x.id),
      )
    } catch (err) {
      setEntries(prev)
      setError(err instanceof Error ? err.message : 'Could not save order.')
    } finally {
      setSyncBusy(false)
    }
  }

  const onDeletePlaylist = async () => {
    if (!id || !configured || !confirm('Delete this playlist?')) return
    try {
      await deletePlaylist(settings, id)
      navigate('/playlists')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed.')
    }
  }

  const onRemoveTrack = async (songIndex: number) => {
    if (!id || !configured) return
    try {
      await updatePlaylist(settings, { playlistId: id, songIndexToRemove: [songIndex] })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Remove failed.')
    }
  }

  if (!configured || !id) {
    return <Typography color="text.secondary">Not available.</Typography>
  }

  const tracks = entries.map((en) => toPlaybackTrack(en))

  return (
    <Box sx={{ maxWidth: 920, width: 1, minWidth: 0 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ mb: 2, alignItems: { xs: 'stretch', sm: 'center' } }}
      >
        <Button
          component={Link}
          to="/playlists"
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Playlists
        </Button>
        {summary ? (
          <Button
            color="error"
            variant="outlined"
            onClick={() => void onDeletePlaylist()}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Delete playlist
          </Button>
        ) : null}
      </Stack>
      {syncBusy ? (
        <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
          Saving order…
        </Typography>
      ) : null}
      {error ? (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      ) : null}
      {busy && !summary ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : null}
      {summary ? (
        <>
          <Stack spacing={0.5} sx={{ mb: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Playlist
            </Typography>
            <Typography
              component="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.45rem', sm: '2.125rem' },
                lineHeight: { xs: 1.25, sm: 1.167 },
              }}
            >
              {summary.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {entries.length} tracks
            </Typography>
          </Stack>
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            disabled={tracks.length === 0}
            onClick={() => playAlbum(tracks, 0)}
            sx={{ mb: 3, width: { xs: '100%', sm: 'auto' } }}
          >
            Play all
          </Button>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(ev) => void onDragEnd(ev)}>
            <SortableContext items={entries.map((en) => en.id)} strategy={verticalListSortingStrategy}>
              <Stack component="ul" spacing={1} sx={{ m: 0, p: 0 }}>
                {entries.map((en, idx) => {
                  const pb = tracks[idx]
                  return (
                    <SortablePlaylistRow key={en.id} entry={en} reducedMotion={reducedMotion}>
                      <ListItemButton
                        onClick={() => playAlbum(tracks, idx)}
                        sx={{
                          flex: { xs: '1 1 100%', sm: '1 1 auto' },
                          minWidth: 0,
                          borderRadius: 1,
                          py: { xs: 1, sm: 0.75 },
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 1.5, mr: 1 }}>
                          {idx + 1}
                        </Typography>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography noWrap sx={{ fontWeight: 600 }}>
                            {en.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {en.artist}
                          </Typography>
                        </Box>
                      </ListItemButton>
                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{
                          alignItems: 'center',
                          justifyContent: { xs: 'flex-end', sm: 'flex-start' },
                          width: { xs: '100%', sm: 'auto' },
                        }}
                      >
                        <TrackActions
                          onPlay={() => playNow(pb)}
                          onPlayNext={() => addToQueueNext(pb)}
                          onAddQueue={() => addToQueue(pb)}
                        />
                        <IconButton
                          aria-label="Remove from playlist"
                          size="small"
                          onClick={() => void onRemoveTrack(idx)}
                          color="default"
                          sx={{ '@media (pointer: coarse)': { minWidth: 44, minHeight: 44 } }}
                        >
                          <DeleteOutlineOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </SortablePlaylistRow>
                  )
                })}
              </Stack>
            </SortableContext>
          </DndContext>
        </>
      ) : null}
    </Box>
  )
}

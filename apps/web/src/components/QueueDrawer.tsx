import CloseIcon from '@mui/icons-material/Close'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
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
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import Zoom from '@mui/material/Zoom'
import { usePlayer } from '../PlayerContext'
import type { QueuedTrack } from '../subsonic/types'

function SortableRow({
  track,
  index,
  active,
  onPlay,
  onRemove,
}: {
  track: QueuedTrack
  index: number
  active: boolean
  onPlay: () => void
  onRemove: () => void
}) {
  const theme = useTheme()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: track.key,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? theme.zIndex.modal : undefined,
  }
  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        mb: 1,
        borderRadius: 2,
        border: 1,
        borderColor: isDragging ? 'primary.main' : 'divider',
        bgcolor: active ? 'action.selected' : 'action.hover',
        boxShadow: isDragging ? 4 : 0,
        overflow: 'hidden',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
      }}
    >
      <IconButton size="small" aria-label="Reorder" sx={{ cursor: 'grab' }} {...attributes} {...listeners}>
        <DragIndicatorIcon fontSize="small" />
      </IconButton>
      <Box
        component="button"
        type="button"
        onClick={onPlay}
        sx={{
          flex: 1,
          minWidth: 0,
          textAlign: 'left',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          p: 1,
          font: 'inherit',
          color: 'inherit',
          '&:hover': {
            bgcolor: 'action.selected',
          },
        }}
      >
        <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
          {index + 1}. {track.title}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
          {track.artist}
        </Typography>
      </Box>
      <IconButton aria-label="Remove from queue" onClick={onRemove} size="small" sx={{ mr: 0.5 }}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  )
}

export function QueueDrawer() {
  const theme = useTheme()
  const {
    queueOpen,
    setQueueOpen,
    queue,
    currentIndex,
    reorderQueue,
    removeFromQueue,
    playIndex,
    clearQueue,
  } = usePlayer()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = queue.findIndex((t) => t.key === active.id)
    const newIndex = queue.findIndex((t) => t.key === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    reorderQueue(arrayMove(queue, oldIndex, newIndex).map((t) => t.key))
  }

  return (
    <Drawer
      anchor="right"
      open={queueOpen}
      onClose={() => setQueueOpen(false)}
      transitionDuration={theme.transitions.duration.standard}
      slotProps={{
        backdrop: {
          sx: { backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.35)' },
        },
        paper: {
          sx: {
            width: { xs: '100%', sm: 400 },
            maxWidth: '100vw',
            borderLeft: 1,
            borderColor: 'divider',
          },
        },
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', gap: 2 }}>
        <Typography variant="h6" component="h2">
          Queue
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            size="small"
            startIcon={<DeleteSweepIcon />}
            onClick={clearQueue}
            disabled={queue.length === 0}
            color="inherit"
          >
            Clear
          </Button>
          <IconButton aria-label="Close queue" onClick={() => setQueueOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Toolbar>
      <Divider />
      <Box sx={{ p: 2, overflow: 'auto', height: 'calc(100% - 64px)' }}>
        {queue.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            Queue is empty. Add tracks from the library or search.
          </Typography>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={queue.map((t) => t.key)} strategy={verticalListSortingStrategy}>
              <List disablePadding>
                {queue.map((t, i) => (
                  <Zoom
                    in
                    key={t.key}
                    timeout={Math.min(320, 120 + i * 28)}
                    style={{ transformOrigin: 'top center' }}
                  >
                    <Box>
                      <SortableRow
                        track={t}
                        index={i}
                        active={i === currentIndex}
                        onPlay={() => playIndex(i)}
                        onRemove={() => removeFromQueue(t.key)}
                      />
                    </Box>
                  </Zoom>
                ))}
              </List>
            </SortableContext>
          </DndContext>
        )}
      </Box>
    </Drawer>
  )
}

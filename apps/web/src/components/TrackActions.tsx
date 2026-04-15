import AddIcon from '@mui/icons-material/Add'
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

type Props = {
  variant?: 'compact' | 'inline'
  onPlay: () => void
  onPlayNext: () => void
  onAddQueue: () => void
}

export function TrackActions({ onPlay, onPlayNext, onAddQueue }: Props) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        gap: 0.25,
        alignItems: 'center',
      }}
    >
      <Tooltip title="Play">
        <IconButton
          size="small"
          aria-label="Play"
          onClick={onPlay}
          color="primary"
          sx={{ '@media (pointer: coarse)': { minWidth: 44, minHeight: 44 } }}
        >
          <PlayArrowIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Play next">
        <IconButton
          size="small"
          aria-label="Play next"
          onClick={onPlayNext}
          sx={{ '@media (pointer: coarse)': { minWidth: 44, minHeight: 44 } }}
        >
          <PlaylistPlayIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Add to queue">
        <IconButton
          size="small"
          aria-label="Add to queue"
          onClick={onAddQueue}
          sx={{ '@media (pointer: coarse)': { minWidth: 44, minHeight: 44 } }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  )
}

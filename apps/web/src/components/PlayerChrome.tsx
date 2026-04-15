import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import QueueMusicIcon from '@mui/icons-material/QueueMusic'
import RepeatIcon from '@mui/icons-material/Repeat'
import RepeatOneIcon from '@mui/icons-material/RepeatOne'
import ShuffleIcon from '@mui/icons-material/Shuffle'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious'
import VolumeDownIcon from '@mui/icons-material/VolumeDown'
import VolumeMuteIcon from '@mui/icons-material/VolumeMute'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Slider from '@mui/material/Slider'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { buildCoverArtUrl } from '../subsonic/client'
import { usePlayer } from '../PlayerContext'
import { useServerSettings } from '../SettingsContext'

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function VolumeIcon({ v }: { v: number }) {
  if (v === 0) return <VolumeMuteIcon fontSize="small" />
  if (v < 0.45) return <VolumeDownIcon fontSize="small" />
  return <VolumeUpIcon fontSize="small" />
}

const transportIconSx = {
  '@media (pointer: coarse)': {
    minWidth: 44,
    minHeight: 44,
    p: 1,
  },
} as const

/** Compact queue control in the volume strip (mobile). */
const queueCompactIconSx = {
  flexShrink: 0,
  p: 0.5,
  '@media (pointer: coarse)': {
    minWidth: 40,
    minHeight: 40,
    p: 0.75,
  },
} as const

export function PlayerChrome({ barHeight }: { barHeight: number }) {
  const theme = useTheme()
  const isStacked = useMediaQuery(theme.breakpoints.down('md'))
  const { settings } = useServerSettings()
  const {
    current,
    playing,
    togglePlay,
    skipNext,
    skipPrevious,
    queueOpen,
    setQueueOpen,
    currentTime,
    duration,
    seek,
    volume,
    setVolume,
    repeat,
    cycleRepeat,
    shuffle,
    setShuffle,
    queue,
  } = usePlayer()

  const dur = duration > 0 ? duration : current?.duration ?? 0

  const repeatLabel =
    repeat === 'off' ? 'Repeat off' : repeat === 'all' ? 'Repeat queue' : 'Repeat one'

  return (
    <Paper
      component="footer"
      square
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        minHeight: barHeight,
        height: isStacked ? 'auto' : barHeight,
        zIndex: (t) => t.zIndex.drawer + 2,
        borderTop: 1,
        borderColor: 'divider',
        borderRadius: 0,
        pl: { xs: 1.25, sm: 2 },
        pr: { xs: 3, sm: 3.5, md: 4 },
        py: { xs: 1, sm: 1 },
        bgcolor: (t) =>
          t.palette.mode === 'dark'
            ? alpha(t.palette.background.paper, 0.92)
            : alpha(t.palette.background.paper, 0.97),
        backdropFilter: 'blur(14px)',
        transition: 'box-shadow 0.3s ease',
        boxSizing: 'border-box',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={{ xs: 1, md: 1.5 }}
        sx={{
          maxWidth: 1400,
          mx: 'auto',
          minHeight: isStacked ? undefined : '100%',
          height: isStacked ? 'auto' : '100%',
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ minWidth: 0, flex: { md: '0 1 220px' }, alignItems: 'center', width: { xs: '100%', md: 'auto' } }}
        >
          <Box
            sx={{
              width: { xs: 48, sm: 56 },
              height: { xs: 48, sm: 56 },
              borderRadius: 1.5,
              overflow: 'hidden',
              flexShrink: 0,
              bgcolor: 'action.hover',
              boxShadow: 2,
              transition: 'transform 0.25s ease',
              '&:hover': { transform: 'scale(1.04)' },
              '@media (prefers-reduced-motion: reduce)': { '&:hover': { transform: 'none' } },
            }}
          >
            {current?.coverArt ? (
              <Box
                component="img"
                src={buildCoverArtUrl(settings, current.coverArt, 160)}
                alt=""
                sx={{ width: 1, height: 1, objectFit: 'cover', display: 'block' }}
              />
            ) : null}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                display: '-webkit-box',
                WebkitLineClamp: { xs: 2, md: 1 },
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {current?.title ?? 'Nothing playing'}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: { xs: 2, md: 1 },
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {current
                ? [current.artist, current.album].filter(Boolean).join(' · ')
                : 'Pick a track or open your queue'}
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={0.5} sx={{ flex: { md: '1 1 360px' }, width: '100%', maxWidth: { xs: '100%', md: 520 } }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'center', flexWrap: 'nowrap' }}>
            <Tooltip title="Shuffle">
              <IconButton
                color={shuffle ? 'primary' : 'default'}
                aria-pressed={shuffle}
                onClick={() => setShuffle(!shuffle)}
                size="small"
                sx={transportIconSx}
              >
                <ShuffleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Previous">
              <IconButton aria-label="Previous track" onClick={skipPrevious} size="medium" sx={transportIconSx}>
                <SkipPreviousIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={playing ? 'Pause' : 'Play'}>
              <IconButton
                color="primary"
                aria-label={playing ? 'Pause' : 'Play'}
                onClick={togglePlay}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  width: { xs: 52, sm: 48 },
                  height: { xs: 52, sm: 48 },
                  ...transportIconSx,
                  transition: 'transform 0.2s ease',
                  '&:hover': { bgcolor: 'primary.dark', transform: 'scale(1.06)' },
                  '@media (prefers-reduced-motion: reduce)': {
                    '&:hover': { transform: 'none' },
                  },
                }}
              >
                {playing ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Next">
              <IconButton aria-label="Next track" onClick={skipNext} size="medium" sx={transportIconSx}>
                <SkipNextIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={repeatLabel}>
              <IconButton
                color={repeat !== 'off' ? 'primary' : 'default'}
                aria-label={repeatLabel}
                onClick={cycleRepeat}
                size="small"
                sx={transportIconSx}
              >
                {repeat === 'one' ? <RepeatOneIcon fontSize="small" /> : <RepeatIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ px: 0.5, alignItems: 'center' }}>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', width: 40 }} component="span">
              {formatTime(currentTime)}
            </Typography>
            <Slider
              size={isStacked ? 'medium' : 'small'}
              value={dur > 0 ? (currentTime / dur) * 100 : 0}
              onChange={(_, v) => {
                const n = Array.isArray(v) ? v[0] : v
                if (dur > 0) seek((n / 100) * dur)
              }}
              disabled={!current || dur <= 0}
              sx={{
                flex: 1,
                py: { xs: 1, md: 0 },
                '& .MuiSlider-thumb': {
                  transition: 'transform 0.15s ease',
                  width: { xs: 14, sm: 12 },
                  height: { xs: 14, sm: 12 },
                  '&:hover': { transform: 'scale(1.15)' },
                },
              }}
              aria-label="Progress"
            />
            <Typography
              variant="caption"
              sx={{ fontFamily: 'monospace', width: 40, textAlign: 'right' }}
              component="span"
            >
              {formatTime(dur)}
            </Typography>
          </Stack>
        </Stack>

        {isStacked ? (
          <Stack
            direction="row"
            spacing={0.75}
            sx={{ width: 1, minWidth: 0, py: 0, alignItems: 'center' }}
          >
            <Tooltip title={`Queue${queue.length ? ` (${queue.length})` : ''}`}>
              <IconButton
                size="small"
                color={queueOpen ? 'primary' : 'default'}
                aria-expanded={queueOpen}
                onClick={() => setQueueOpen(!queueOpen)}
                sx={queueCompactIconSx}
              >
                <QueueMusicIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Box
              aria-hidden
              sx={{
                alignSelf: 'stretch',
                width: '1px',
                minHeight: 20,
                my: 0.25,
                flexShrink: 0,
                bgcolor: 'divider',
                opacity: 0.6,
              }}
            />
            <Box
              aria-hidden
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: 'text.primary',
                flexShrink: 0,
                opacity: 0.9,
              }}
            >
              <VolumeIcon v={volume} />
            </Box>
            <Slider
              color="primary"
              size="small"
              value={volume}
              min={0}
              max={1}
              step={0.01}
              onChange={(_, v) => setVolume(Array.isArray(v) ? v[0] : v)}
              sx={{
                flex: '1 1 auto',
                minWidth: 0,
                py: { xs: 0.75, sm: 0.5 },
                '& .MuiSlider-rail': {
                  height: 4,
                  borderRadius: 2,
                  opacity: 1,
                  bgcolor: (t) =>
                    t.palette.mode === 'dark' ? alpha(t.palette.common.white, 0.12) : alpha(t.palette.common.black, 0.12),
                },
                '& .MuiSlider-track': { height: 4, borderRadius: 2 },
                '& .MuiSlider-thumb': {
                  width: 14,
                  height: 14,
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  '@media (pointer: coarse)': {
                    width: 16,
                    height: 16,
                  },
                  '&:hover, &.Mui-focusVisible, &.Mui-active': {
                    boxShadow: (t) => `0 0 0 6px ${alpha(t.palette.primary.main, 0.14)}`,
                  },
                },
              }}
              aria-label="Volume"
            />
          </Stack>
        ) : (
          <Stack
            direction="row"
            spacing={0.75}
            sx={{
              flex: '0 1 auto',
              width: 'auto',
              alignItems: 'center',
              minWidth: { md: 140, lg: 160 },
              maxWidth: { md: 260, lg: 300 },
            }}
          >
            <Tooltip title={`Queue${queue.length ? ` (${queue.length})` : ''}`}>
              <IconButton
                color={queueOpen ? 'primary' : 'default'}
                aria-expanded={queueOpen}
                onClick={() => setQueueOpen(!queueOpen)}
                sx={{ ...transportIconSx, flexShrink: 0 }}
                size="small"
              >
                <QueueMusicIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Box
              aria-hidden
              sx={{ display: 'flex', alignItems: 'center', color: 'text.primary', opacity: 0.9, flexShrink: 0 }}
            >
              <VolumeIcon v={volume} />
            </Box>
            <Slider
              color="primary"
              size="small"
              value={volume}
              min={0}
              max={1}
              step={0.01}
              onChange={(_, v) => setVolume(Array.isArray(v) ? v[0] : v)}
              sx={{
                flex: 1,
                minWidth: 72,
                py: 0.35,
                '& .MuiSlider-rail': {
                  height: 3,
                  borderRadius: 1.5,
                  opacity: 1,
                  bgcolor: (t) =>
                    t.palette.mode === 'dark' ? alpha(t.palette.common.white, 0.12) : alpha(t.palette.common.black, 0.12),
                },
                '& .MuiSlider-track': { height: 3, borderRadius: 1.5 },
                '& .MuiSlider-thumb': {
                  width: 12,
                  height: 12,
                  '&:hover, &.Mui-focusVisible, &.Mui-active': {
                    boxShadow: (t) => `0 0 0 5px ${alpha(t.palette.primary.main, 0.12)}`,
                  },
                },
              }}
              aria-label="Volume"
            />
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}

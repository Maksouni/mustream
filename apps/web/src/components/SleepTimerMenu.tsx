import BedtimeIcon from '@mui/icons-material/Bedtime'
import CloseIcon from '@mui/icons-material/Close'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Zoom from '@mui/material/Zoom'
import { useState } from 'react'
import { useSleepTimer } from '../SleepTimerContext'

const PRESETS = [
  { label: '15m', ms: 15 * 60_000 },
  { label: '30m', ms: 30 * 60_000 },
  { label: '45m', ms: 45 * 60_000 },
  { label: '60m', ms: 60 * 60_000 },
]

function formatRemain(ms: number): string {
  const m = Math.ceil(ms / 60_000)
  return `${m} min left`
}

export type SleepTimerMenuVariant = 'inline' | 'panel'

export function SleepTimerMenu({ variant = 'inline' }: { variant?: SleepTimerMenuVariant }) {
  const { remainingMs, endAt, startTimer, cancelTimer } = useSleepTimer()
  const [custom, setCustom] = useState('')
  const isPanel = variant === 'panel'

  const header = (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
      <BedtimeIcon color="action" fontSize="small" />
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        Sleep
      </Typography>
    </Stack>
  )

  const presets = (
    <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
      {PRESETS.map((p) => (
        <Zoom in key={p.label} timeout={180}>
          <span>
            <Button size="small" variant="outlined" onClick={() => startTimer(p.ms)} sx={{ minWidth: 52 }}>
              {p.label}
            </Button>
          </span>
        </Zoom>
      ))}
    </Stack>
  )

  const customRow = (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
      <TextField
        size="small"
        type="number"
        placeholder="min"
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
        slotProps={{
          htmlInput: { min: 1, max: 300, 'aria-label': 'Custom minutes' },
        }}
        sx={isPanel ? { flex: '1 1 80px', minWidth: 72 } : { width: 72 }}
      />
      <Button
        size="small"
        variant="contained"
        onClick={() => {
          const n = Number(custom)
          if (Number.isFinite(n) && n > 0) startTimer(n * 60_000)
        }}
      >
        Set
      </Button>
      <Tooltip title="Cancel timer">
        <span>
          <Button
            size="small"
            color="inherit"
            startIcon={<CloseIcon />}
            onClick={cancelTimer}
            disabled={endAt == null}
          >
            Cancel
          </Button>
        </span>
      </Tooltip>
    </Stack>
  )

  const chip =
    endAt != null && remainingMs != null ? (
      <Zoom in>
        <Chip
          icon={<BedtimeIcon />}
          label={formatRemain(remainingMs)}
          color="primary"
          variant="outlined"
          onDelete={cancelTimer}
          sx={{ transition: 'transform 0.2s ease', ...(isPanel ? { alignSelf: 'center', maxWidth: '100%' } : {}) }}
        />
      </Zoom>
    ) : null

  if (isPanel) {
    return (
      <Stack spacing={2} sx={{ alignItems: 'stretch', minWidth: { xs: 260, sm: 300 } }}>
        {header}
        {presets}
        {customRow}
        {chip}
      </Stack>
    )
  }

  return (
    <Stack direction="row" spacing={1.5} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
      {header}
      {presets}
      {customRow}
      {chip}
    </Stack>
  )
}

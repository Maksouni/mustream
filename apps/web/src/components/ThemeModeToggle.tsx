import BrightnessAutoIcon from '@mui/icons-material/BrightnessAuto'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Tooltip from '@mui/material/Tooltip'
import { useAppTheme } from '../AppThemeProvider'
import type { ColorMode } from '../themeStorage'

export function ThemeModeToggle({ fullWidth }: { fullWidth?: boolean }) {
  const { colorMode, setColorMode, reducedMotion } = useAppTheme()

  const onChange = (_: React.MouseEvent<HTMLElement>, v: ColorMode | null) => {
    if (v != null) setColorMode(v)
  }

  return (
    <ToggleButtonGroup
      value={colorMode}
      exclusive
      onChange={onChange}
      size="small"
      aria-label="Theme"
      sx={{
        ...(fullWidth ? { width: 1 } : {}),
        '& .MuiToggleButton-root': {
          px: 1,
          py: 0.5,
          ...(fullWidth ? { flex: 1 } : {}),
          ...(!reducedMotion && {
            transition: 'transform 0.18s ease',
            '&:hover': { transform: 'scale(1.05)' },
          }),
        },
      }}
    >
      <Tooltip title="Light theme">
        <span>
          <ToggleButton value="light" aria-label="Light theme">
            <LightModeIcon fontSize="small" />
          </ToggleButton>
        </span>
      </Tooltip>
      <Tooltip title="Dark theme">
        <span>
          <ToggleButton value="dark" aria-label="Dark theme">
            <DarkModeIcon fontSize="small" />
          </ToggleButton>
        </span>
      </Tooltip>
      <Tooltip title="Match system">
        <span>
          <ToggleButton value="system" aria-label="Match system">
            <BrightnessAutoIcon fontSize="small" />
          </ToggleButton>
        </span>
      </Tooltip>
    </ToggleButtonGroup>
  )
}

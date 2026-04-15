import MenuIcon from '@mui/icons-material/Menu'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import AppBar from '@mui/material/AppBar'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import Fade from '@mui/material/Fade'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { PlayerChrome } from '../components/PlayerChrome'
import { QueueDrawer } from '../components/QueueDrawer'
import { SleepTimerMenu } from '../components/SleepTimerMenu'
import { ThemeModeToggle } from '../components/ThemeModeToggle'
import { usePlayer } from '../PlayerContext'
import { useSleepTimer } from '../SleepTimerContext'
import { DrawerContent, DRAWER_WIDTH } from './Sidebar'
import { usePlayerFooterReservePx } from './playerFooter'

export function AppShell() {
  const theme = useTheme()
  const isMd = useMediaQuery(theme.breakpoints.up('md'))
  const playerReservePx = usePlayerFooterReservePx()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [extrasAnchor, setExtrasAnchor] = useState<null | HTMLElement>(null)
  const location = useLocation()
  const { togglePlay } = usePlayer()
  const { endAt: sleepTimerActive } = useSleepTimer()
  const extrasOpen = Boolean(extrasAnchor)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) {
        return
      }
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePlay])

  const drawerPaper = {
    width: DRAWER_WIDTH,
    boxSizing: 'border-box' as const,
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            ...drawerPaper,
            borderRight: 1,
            borderColor: 'divider',
          },
        }}
      >
        <DrawerContent onNavigate={() => setMobileOpen(false)} />
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            ...drawerPaper,
            borderRight: 1,
            borderColor: 'divider',
          },
        }}
      >
        <DrawerContent />
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          pb: {
            xs: `calc(${playerReservePx}px + env(safe-area-inset-bottom, 0px))`,
            md: `${playerReservePx}px`,
          },
        }}
      >
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            backdropFilter: 'blur(12px)',
            bgcolor: (t) =>
              t.palette.mode === 'dark' ? 'rgba(18,16,28,0.78)' : 'rgba(255,255,255,0.85)',
          }}
        >
          <Toolbar
            variant="dense"
            sx={{
              gap: { xs: 1, sm: 2 },
              justifyContent: 'flex-end',
              minHeight: { xs: 48, sm: 52 },
              pt: 'env(safe-area-inset-top, 0px)',
            }}
          >
            {!isMd ? (
              <IconButton
                color="inherit"
                edge="start"
                aria-label="Open menu"
                onClick={() => setMobileOpen(true)}
                sx={{ mr: 'auto' }}
              >
                <MenuIcon />
              </IconButton>
            ) : null}
            <Tooltip title="Sleep timer, theme">
              <Badge
                variant="dot"
                color="primary"
                invisible={sleepTimerActive == null}
                overlap="circular"
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                sx={{ '& .MuiBadge-badge': { right: 6, top: 6 } }}
              >
                <IconButton
                  color="inherit"
                  edge="end"
                  aria-label="More options: sleep timer and theme"
                  aria-haspopup="true"
                  aria-expanded={extrasOpen ? 'true' : undefined}
                  onClick={(e) => setExtrasAnchor(e.currentTarget)}
                >
                  <MoreVertIcon />
                </IconButton>
              </Badge>
            </Tooltip>
            <Popover
              open={extrasOpen}
              anchorEl={extrasAnchor}
              onClose={() => setExtrasAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{
                paper: {
                  sx: {
                    mt: 1,
                    maxWidth: 400,
                    width: { xs: 'min(calc(100vw - 16px), 400px)' },
                    maxHeight: { xs: 'min(70vh, 520px)' },
                    overflow: 'auto',
                  },
                },
              }}
            >
              <Box sx={{ p: 2 }}>
                <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  Sleep timer
                </Typography>
                <SleepTimerMenu variant="panel" />
                <Divider sx={{ my: 2 }} />
                <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  Theme
                </Typography>
                <ThemeModeToggle fullWidth />
              </Box>
            </Popover>
          </Toolbar>
        </AppBar>
        <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1.25, sm: 2 } }}>
          <Fade key={location.pathname} in appear timeout={theme.transitions.duration.standard}>
            <Box>
              <Outlet />
            </Box>
          </Fade>
        </Box>
      </Box>
      <PlayerChrome barHeight={playerReservePx} />
      <QueueDrawer />
    </Box>
  )
}

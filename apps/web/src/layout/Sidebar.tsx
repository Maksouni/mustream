import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic'
import ListIcon from '@mui/icons-material/List'
import SearchIcon from '@mui/icons-material/Search'
import SettingsIcon from '@mui/icons-material/Settings'
import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { Link, useLocation } from 'react-router-dom'

export const DRAWER_WIDTH = 240

const navItems: {
  to: string
  label: string
  icon: ReactNode
  match?: 'exact' | 'prefix'
}[] = [
  { to: '/', label: 'Library', icon: <LibraryMusicIcon />, match: 'exact' },
  { to: '/upload', label: 'Upload', icon: <CloudUploadIcon />, match: 'exact' },
  { to: '/search', label: 'Search', icon: <SearchIcon />, match: 'exact' },
  { to: '/playlists', label: 'Playlists', icon: <ListIcon />, match: 'prefix' },
  { to: '/settings', label: 'Settings', icon: <SettingsIcon />, match: 'exact' },
]

function pathSelected(pathname: string, item: (typeof navItems)[number]): boolean {
  if (item.match === 'prefix') return pathname.startsWith(item.to)
  return pathname === item.to
}

export function DrawerContent({
  onNavigate,
}: {
  onNavigate?: () => void
}) {
  const location = useLocation()
  const pathname = location.pathname

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        sx={{
          background: (t) =>
            t.palette.mode === 'dark'
              ? 'linear-gradient(90deg, rgba(179,157,219,0.15), transparent)'
              : 'linear-gradient(90deg, rgba(94,53,177,0.12), transparent)',
        }}
      >
        <Typography variant="h6" noWrap sx={{ fontWeight: 800, letterSpacing: '-0.03em' }}>
          mustream
        </Typography>
      </Toolbar>
      <List sx={{ flex: 1, px: 1, py: 0.5 }} component="nav" aria-label="Main">
        {navItems.map((item) => (
          <ListItem key={item.to} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              to={item.to}
              selected={pathSelected(pathname, item)}
              onClick={onNavigate}
              sx={{
                borderRadius: 2,
                py: { xs: 1.25, md: 1 },
                minHeight: { xs: 48, md: 'auto' },
                transition: 'transform 0.18s ease, background-color 0.18s ease',
                '&:hover': { transform: 'translateX(4px)' },
                '@media (prefers-reduced-motion: reduce)': {
                  '&:hover': { transform: 'none' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 42, color: 'primary.main' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: 500 } } }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}

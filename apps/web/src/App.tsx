import SettingsIcon from '@mui/icons-material/Settings'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './layout/AppShell'
import { LibraryPage } from './pages/LibraryPage'
import { PlaylistDetailPage } from './pages/PlaylistDetailPage'
import { PlaylistsPage } from './pages/PlaylistsPage'
import { SearchPage } from './pages/SearchPage'
import { UploadPage } from './pages/UploadPage'
import { SettingsPane } from './components/SettingsPane'

function SettingsPage() {
  return (
    <Box sx={{ maxWidth: 960, width: 1, minWidth: 0 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 3, alignItems: 'center' }}>
        <SettingsIcon color="primary" />
        <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          Settings
        </Typography>
      </Stack>
      <SettingsPane />
    </Box>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<LibraryPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="playlists" element={<PlaylistsPage />} />
          <Route path="playlists/:id" element={<PlaylistDetailPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

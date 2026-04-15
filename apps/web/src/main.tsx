import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { AppThemeProvider } from './AppThemeProvider'
import { PlayerProvider } from './PlayerContext'
import { SettingsProvider } from './SettingsContext'
import { SleepTimerBridge } from './SleepTimerBridge'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppThemeProvider>
      <SettingsProvider>
        <PlayerProvider>
          <SleepTimerBridge>
            <App />
          </SleepTimerBridge>
        </PlayerProvider>
      </SettingsProvider>
    </AppThemeProvider>
  </StrictMode>,
)

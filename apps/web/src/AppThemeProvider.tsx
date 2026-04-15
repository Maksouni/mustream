import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { loadColorMode, saveColorMode, type ColorMode } from './themeStorage'

type ThemeCtx = {
  colorMode: ColorMode
  setColorMode: (m: ColorMode) => void
  resolvedMode: 'light' | 'dark'
  reducedMotion: boolean
}

const ThemeModeContext = createContext<ThemeCtx | null>(null)

export function useAppTheme(): ThemeCtx {
  const ctx = useContext(ThemeModeContext)
  if (!ctx) throw new Error('useAppTheme outside AppThemeProvider')
  return ctx
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [colorMode, setColorModeState] = useState<ColorMode>(() => loadColorMode())
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const resolvedMode: 'light' | 'dark' =
    colorMode === 'system' ? (prefersDark ? 'dark' : 'light') : colorMode

  const setColorMode = (m: ColorMode) => {
    setColorModeState(m)
    saveColorMode(m)
  }

  const theme = useMemo(() => {
    const motionOff = prefersReducedMotion
    return createTheme({
      palette: {
        mode: resolvedMode,
        primary: { main: resolvedMode === 'dark' ? '#b39ddb' : '#5e35b1' },
        secondary: { main: resolvedMode === 'dark' ? '#80cbc4' : '#00796b' },
      },
      typography: {
        fontFamily: '"DM Sans", "Roboto", "Helvetica", "Arial", sans-serif',
      },
      shape: { borderRadius: 12 },
      transitions: {
        duration: {
          shortest: motionOff ? 0 : 150,
          shorter: motionOff ? 0 : 200,
          short: motionOff ? 0 : 240,
          standard: motionOff ? 0 : 280,
          complex: motionOff ? 0 : 340,
          enteringScreen: motionOff ? 0 : 240,
          leavingScreen: motionOff ? 0 : 200,
        },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            html: { height: '100%' },
            body: {
              height: '100%',
              margin: 0,
              paddingLeft: 'env(safe-area-inset-left, 0px)',
              paddingRight: 'env(safe-area-inset-right, 0px)',
            },
            '#root': { height: '100%', minHeight: '100svh' },
          },
        },
        MuiButton: {
          defaultProps: { disableElevation: true },
        },
        MuiIconButton: {
          styleOverrides: {
            root: {
              transition: motionOff
                ? 'none'
                : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s',
            },
          },
        },
      },
    })
  }, [resolvedMode, prefersReducedMotion])

  const value = useMemo(
    () => ({ colorMode, setColorMode, resolvedMode, reducedMotion: prefersReducedMotion }),
    [colorMode, resolvedMode, prefersReducedMotion],
  )

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  )
}

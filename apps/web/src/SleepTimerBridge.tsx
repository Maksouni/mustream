import { useCallback, useRef, type ReactNode } from 'react'
import { usePlayer } from './PlayerContext'
import { SleepTimerProvider } from './SleepTimerContext'

export function SleepTimerBridge({ children }: { children: ReactNode }) {
  const { pause } = usePlayer()
  const pauseRef = useRef(pause)
  pauseRef.current = pause
  const onFire = useCallback(() => {
    pauseRef.current()
  }, [])
  return <SleepTimerProvider onFire={onFire}>{children}</SleepTimerProvider>
}

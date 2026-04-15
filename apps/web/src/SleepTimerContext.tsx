import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type Ctx = {
  remainingMs: number | null
  endAt: number | null
  startTimer: (durationMs: number) => void
  cancelTimer: () => void
}

const SleepTimerContext = createContext<Ctx | null>(null)

export function SleepTimerProvider({
  children,
  onFire,
}: {
  children: ReactNode
  onFire: () => void
}) {
  const [endAt, setEndAt] = useState<number | null>(null)
  const [tick, setTick] = useState(0)
  const firedRef = useRef(false)

  const remainingMs = endAt == null ? null : Math.max(0, endAt - Date.now())

  useEffect(() => {
    if (endAt == null) return
    const iv = setInterval(() => setTick((t) => t + 1), 500)
    return () => clearInterval(iv)
  }, [endAt])

  useEffect(() => {
    if (endAt == null || remainingMs == null || remainingMs > 0) return
    if (firedRef.current) return
    firedRef.current = true
    onFire()
    setEndAt(null)
  }, [endAt, remainingMs, onFire])

  const startTimer = useCallback((durationMs: number) => {
    firedRef.current = false
    setEndAt(Date.now() + Math.max(1000, durationMs))
  }, [])

  const cancelTimer = useCallback(() => {
    setEndAt(null)
    firedRef.current = false
  }, [])

  const value = useMemo(
    () => ({
      remainingMs: endAt == null ? null : Math.max(0, endAt - Date.now()),
      endAt,
      startTimer,
      cancelTimer,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tick drives remainingMs display
    [endAt, startTimer, cancelTimer, tick],
  )

  return <SleepTimerContext.Provider value={value}>{children}</SleepTimerContext.Provider>
}

export function useSleepTimer(): Ctx {
  const ctx = useContext(SleepTimerContext)
  if (!ctx) throw new Error('useSleepTimer outside SleepTimerProvider')
  return ctx
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { buildCoverArtUrl, buildStreamUrl } from './subsonic/client'
import { useServerSettings } from './SettingsContext'
import type { PlaybackTrack, QueuedTrack, RepeatMode } from './subsonic/types'

type PlaybackState = {
  queue: QueuedTrack[]
  currentIndex: number
  repeat: RepeatMode
  shuffle: boolean
  volume: number
}

const initialPlayback: PlaybackState = {
  queue: [],
  currentIndex: 0,
  repeat: 'off',
  shuffle: false,
  volume: 1,
}

function newQueueKey(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function toQueued(t: PlaybackTrack): QueuedTrack {
  return { ...t, key: newQueueKey() }
}

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type PlaybackAction =
  | { type: 'PLAY_NOW'; track: PlaybackTrack }
  | { type: 'PLAY_ALBUM'; tracks: PlaybackTrack[]; startIndex: number }
  | { type: 'ADD_END'; track: PlaybackTrack }
  | { type: 'ADD_NEXT'; track: PlaybackTrack; afterIndex: number }
  | { type: 'REMOVE'; key: string }
  | { type: 'REORDER'; orderedKeys: string[] }
  | { type: 'CLEAR' }
  | { type: 'SET_REPEAT'; mode: RepeatMode }
  | { type: 'SET_SHUFFLE'; on: boolean }
  | { type: 'SET_VOLUME'; v: number }
  | { type: 'NEXT' }
  | { type: 'PREV_INDEX' }
  | { type: 'SET_INDEX'; index: number }

function playbackReducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  switch (action.type) {
    case 'PLAY_NOW':
      return { ...state, queue: [toQueued(action.track)], currentIndex: 0 }
    case 'PLAY_ALBUM': {
      const q = action.tracks.map(toQueued)
      if (q.length === 0) return { ...state, queue: [], currentIndex: 0 }
      const idx = Math.max(0, Math.min(action.startIndex, q.length - 1))
      return { ...state, queue: q, currentIndex: idx }
    }
    case 'ADD_END':
      return { ...state, queue: [...state.queue, toQueued(action.track)] }
    case 'ADD_NEXT': {
      const i = Math.max(-1, Math.min(action.afterIndex, state.queue.length - 1))
      const next = [...state.queue]
      next.splice(i + 1, 0, toQueued(action.track))
      let ci = state.currentIndex
      if (i < state.currentIndex) ci++
      return { ...state, queue: next, currentIndex: ci }
    }
    case 'REMOVE': {
      const i = state.queue.findIndex((t) => t.key === action.key)
      if (i < 0) return state
      const queue = state.queue.filter((t) => t.key !== action.key)
      let currentIndex = state.currentIndex
      if (i < currentIndex) currentIndex--
      else if (i === currentIndex) currentIndex = Math.min(currentIndex, queue.length - 1)
      if (queue.length === 0) return { ...state, queue: [], currentIndex: 0 }
      return { ...state, queue, currentIndex: Math.max(0, currentIndex) }
    }
    case 'REORDER': {
      const map = new Map(state.queue.map((t) => [t.key, t]))
      const queue = action.orderedKeys.map((k) => map.get(k)).filter(Boolean) as QueuedTrack[]
      if (queue.length !== state.queue.length) return state
      const curKey = state.queue[state.currentIndex]?.key
      const newIndex = curKey ? queue.findIndex((t) => t.key === curKey) : 0
      return { ...state, queue, currentIndex: Math.max(0, newIndex) }
    }
    case 'CLEAR':
      return { ...state, queue: [], currentIndex: 0 }
    case 'SET_REPEAT':
      return { ...state, repeat: action.mode }
    case 'SET_SHUFFLE': {
      if (!action.on) return { ...state, shuffle: false }
      const { queue, currentIndex } = state
      if (queue.length <= 1) return { ...state, shuffle: true }
      const head = queue.slice(0, currentIndex + 1)
      const tail = fisherYates(queue.slice(currentIndex + 1))
      return { ...state, shuffle: true, queue: [...head, ...tail] }
    }
    case 'SET_VOLUME':
      return { ...state, volume: Math.max(0, Math.min(1, action.v)) }
    case 'NEXT': {
      const { queue, currentIndex, repeat } = state
      if (queue.length === 0) return state
      if (currentIndex + 1 < queue.length) {
        return { ...state, currentIndex: currentIndex + 1 }
      }
      if (repeat === 'all') {
        return { ...state, currentIndex: 0 }
      }
      return state
    }
    case 'PREV_INDEX': {
      const { queue, currentIndex, repeat } = state
      if (queue.length === 0) return state
      if (currentIndex > 0) {
        return { ...state, currentIndex: currentIndex - 1 }
      }
      if (repeat === 'all') {
        return { ...state, currentIndex: queue.length - 1 }
      }
      return state
    }
    case 'SET_INDEX': {
      const idx = Math.max(0, Math.min(action.index, state.queue.length - 1))
      return { ...state, currentIndex: idx }
    }
    default:
      return state
  }
}

export type PlayerCtx = {
  queue: QueuedTrack[]
  currentIndex: number
  current: QueuedTrack | null
  playing: boolean
  repeat: RepeatMode
  shuffle: boolean
  volume: number
  currentTime: number
  duration: number
  queueOpen: boolean
  setQueueOpen: (v: boolean) => void
  playNow: (t: PlaybackTrack) => void
  playAlbum: (tracks: PlaybackTrack[], startIndex: number) => void
  addToQueue: (t: PlaybackTrack) => void
  addToQueueNext: (t: PlaybackTrack) => void
  removeFromQueue: (key: string) => void
  reorderQueue: (orderedKeys: string[]) => void
  clearQueue: () => void
  skipNext: () => void
  skipPrevious: () => void
  togglePlay: () => void
  pause: () => void
  setRepeat: (m: RepeatMode) => void
  cycleRepeat: () => void
  setShuffle: (on: boolean) => void
  setVolume: (v: number) => void
  seek: (t: number) => void
  playIndex: (index: number) => void
  audioRef: React.RefObject<HTMLAudioElement | null>
}

const PlayerContext = createContext<PlayerCtx | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { settings, configured } = useServerSettings()
  const [playback, dispatch] = useReducer(playbackReducer, initialPlayback)
  const dispatchRef = useRef(dispatch)
  dispatchRef.current = dispatch
  const repeatRef = useRef(playback.repeat)
  repeatRef.current = playback.repeat
  const playbackRef = useRef(playback)
  playbackRef.current = playback

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastSrcRef = useRef<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [queueOpen, setQueueOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const current = playback.queue[playback.currentIndex] ?? null

  const loadCurrentTrack = useCallback(
    (force = false) => {
      const t = playback.queue[playback.currentIndex]
      const el = audioRef.current
      if (!t || !el) return
      const url = buildStreamUrl(settings, t.streamId)
      if (force || lastSrcRef.current !== url) {
        lastSrcRef.current = url
        el.src = url
        void el.play().then(
          () => setPlaying(true),
          () => setPlaying(false),
        )
      }
    },
    [playback.queue, playback.currentIndex, settings],
  )

  useEffect(() => {
    if (playback.queue.length === 0) {
      lastSrcRef.current = null
      const el = audioRef.current
      if (el) {
        el.pause()
        el.removeAttribute('src')
      }
      setPlaying(false)
      setCurrentTime(0)
      setDuration(0)
      return
    }
    loadCurrentTrack(false)
  }, [playback.queue, playback.currentIndex, loadCurrentTrack, settings])

  useEffect(() => {
    const el = audioRef.current
    if (el) el.volume = playback.volume
  }, [playback.volume])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTimeUpdate = () => {
      setCurrentTime(el.currentTime)
      setDuration(Number.isFinite(el.duration) ? el.duration : 0)
    }
    const onLoadedMeta = () => {
      setDuration(Number.isFinite(el.duration) ? el.duration : 0)
    }
    const onEnded = () => {
      if (repeatRef.current === 'one') {
        el.currentTime = 0
        void el.play()
        return
      }
      const prevIdx = playbackRef.current.currentIndex
      const len = playbackRef.current.queue.length
      dispatchRef.current({ type: 'NEXT' })
      lastSrcRef.current = null
      queueMicrotask(() => {
        const p = playbackRef.current
        if (
          len > 0 &&
          p.currentIndex === prevIdx &&
          p.currentIndex === len - 1 &&
          repeatRef.current === 'off'
        ) {
          el.pause()
        }
      })
    }
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('timeupdate', onTimeUpdate)
    el.addEventListener('loadedmetadata', onLoadedMeta)
    el.addEventListener('ended', onEnded)
    return () => {
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('timeupdate', onTimeUpdate)
      el.removeEventListener('loadedmetadata', onLoadedMeta)
      el.removeEventListener('ended', onEnded)
    }
  }, [])

  const playNow = useCallback((t: PlaybackTrack) => {
    dispatch({ type: 'PLAY_NOW', track: t })
    lastSrcRef.current = null
  }, [])

  const playAlbum = useCallback((tracks: PlaybackTrack[], startIndex: number) => {
    dispatch({ type: 'PLAY_ALBUM', tracks, startIndex })
    lastSrcRef.current = null
  }, [])

  const addToQueue = useCallback((t: PlaybackTrack) => {
    dispatch({ type: 'ADD_END', track: t })
  }, [])

  const addToQueueNext = useCallback(
    (t: PlaybackTrack) => {
      dispatch({ type: 'ADD_NEXT', track: t, afterIndex: playback.currentIndex })
    },
    [playback.currentIndex],
  )

  const removeFromQueue = useCallback((key: string) => {
    dispatch({ type: 'REMOVE', key })
  }, [])

  const reorderQueue = useCallback((orderedKeys: string[]) => {
    dispatch({ type: 'REORDER', orderedKeys })
  }, [])

  const clearQueue = useCallback(() => {
    dispatch({ type: 'CLEAR' })
    lastSrcRef.current = null
  }, [])

  const skipNext = useCallback(() => {
    dispatch({ type: 'NEXT' })
    lastSrcRef.current = null
  }, [])

  const skipPrevious = useCallback(() => {
    const el = audioRef.current
    if (el && el.currentTime > 3) {
      el.currentTime = 0
      return
    }
    dispatch({ type: 'PREV_INDEX' })
    lastSrcRef.current = null
  }, [])

  const pause = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    el.pause()
    setPlaying(false)
  }, [])

  const togglePlay = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    if (playback.queue.length === 0) return
    if (el.paused) {
      void el.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      )
    } else {
      el.pause()
      setPlaying(false)
    }
  }, [playback.queue.length])

  const setRepeat = useCallback((m: RepeatMode) => dispatch({ type: 'SET_REPEAT', mode: m }), [])

  const cycleRepeat = useCallback(() => {
    const order: RepeatMode[] = ['off', 'all', 'one']
    const i = order.indexOf(playback.repeat)
    dispatch({ type: 'SET_REPEAT', mode: order[(i + 1) % order.length] })
  }, [playback.repeat])

  const setShuffle = useCallback((on: boolean) => dispatch({ type: 'SET_SHUFFLE', on }), [])

  const setVolume = useCallback((v: number) => dispatch({ type: 'SET_VOLUME', v }), [])

  const seek = useCallback((t: number) => {
    const el = audioRef.current
    if (el && Number.isFinite(t)) {
      el.currentTime = t
      setCurrentTime(t)
    }
  }, [])

  const playIndex = useCallback((index: number) => {
    dispatch({ type: 'SET_INDEX', index })
    lastSrcRef.current = null
  }, [])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !configured) {
      return
    }
    const ms = navigator.mediaSession
    if (!current) {
      ms.metadata = null
      return
    }
    const artwork: MediaImage[] = current.coverArt
      ? [{ src: buildCoverArtUrl(settings, current.coverArt, 512), sizes: '512x512', type: 'image/jpeg' }]
      : []
    ms.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist ?? '',
      album: current.album ?? '',
      artwork,
    })
    try {
      ms.setActionHandler('play', () => {
        void audioRef.current?.play()
      })
      ms.setActionHandler('pause', () => {
        audioRef.current?.pause()
      })
      ms.setActionHandler('previoustrack', () => {
        skipPrevious()
      })
      ms.setActionHandler('nexttrack', () => {
        skipNext()
      })
    } catch {
      /* unsupported */
    }
    return () => {
      try {
        ms.setActionHandler('play', null)
        ms.setActionHandler('pause', null)
        ms.setActionHandler('previoustrack', null)
        ms.setActionHandler('nexttrack', null)
      } catch {
        /* noop */
      }
    }
  }, [configured, current, settings, skipNext, skipPrevious])

  const value = useMemo(
    () => ({
      queue: playback.queue,
      currentIndex: playback.currentIndex,
      current,
      playing,
      repeat: playback.repeat,
      shuffle: playback.shuffle,
      volume: playback.volume,
      currentTime,
      duration,
      queueOpen,
      setQueueOpen,
      playNow,
      playAlbum,
      addToQueue,
      addToQueueNext,
      removeFromQueue,
      reorderQueue,
      clearQueue,
      skipNext,
      skipPrevious,
      togglePlay,
      pause,
      setRepeat,
      cycleRepeat,
      setShuffle,
      setVolume,
      seek,
      playIndex,
      audioRef,
    }),
    [
      playback.queue,
      playback.currentIndex,
      playback.repeat,
      playback.shuffle,
      playback.volume,
      current,
      playing,
      currentTime,
      duration,
      queueOpen,
      playNow,
      playAlbum,
      addToQueue,
      addToQueueNext,
      removeFromQueue,
      reorderQueue,
      clearQueue,
      skipNext,
      skipPrevious,
      togglePlay,
      pause,
      setRepeat,
      cycleRepeat,
      setShuffle,
      setVolume,
      seek,
      playIndex,
    ],
  )

  return (
    <PlayerContext.Provider value={value}>
      <audio ref={audioRef} preload="metadata" className="sr-only" aria-hidden />
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer(): PlayerCtx {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer outside PlayerProvider')
  return ctx
}

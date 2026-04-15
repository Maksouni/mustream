export interface ServerSettings {
  baseUrl: string
  username: string
  password: string
}

export interface ArtistRef {
  id: string
  name: string
  coverArt?: string
}

export interface AlbumRef {
  id: string
  name: string
  artist?: string
  coverArt?: string
  year?: number
}

export interface SongRef {
  id: string
  title: string
  artist?: string
  album?: string
  duration?: number
  coverArt?: string
}

export interface PlaybackTrack extends SongRef {
  streamId: string
}

/** Unique row in the play queue (same song may appear twice). */
export type QueuedTrack = PlaybackTrack & { key: string }

export type RepeatMode = 'off' | 'all' | 'one'

export interface PlaylistSummary {
  id: string
  name: string
  songCount?: number
  owner?: string
  public?: boolean
}

export interface PlaylistEntry extends SongRef {
  streamId: string
}

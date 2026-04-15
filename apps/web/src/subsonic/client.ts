import { tokenAuthParams } from './auth'
import type {
  AlbumRef,
  ArtistRef,
  PlaylistEntry,
  PlaylistSummary,
  ServerSettings,
  SongRef,
} from './types'

const API_VERSION = '1.16.1'
const CLIENT_ID = 'mustream'

/** Trimmed base URL; empty = same-origin `/rest` (Vite proxy or Docker nginx). */
export function normalizeServerBase(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '')
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

type SubsonicEnvelope = {
  status: string
  error?: { code: number; message: string }
  [key: string]: unknown
}

type ParamVal = string | number | boolean | undefined | string[] | number[]

function appendParam(params: URLSearchParams, key: string, val: ParamVal) {
  if (val === undefined) return
  if (Array.isArray(val)) {
    for (const v of val) params.append(key, String(v as string | number))
    return
  }
  params.set(key, String(val))
}

async function subsonicFetchJson(
  settings: ServerSettings,
  endpoint: string,
  extra: Record<string, ParamVal> = {},
): Promise<SubsonicEnvelope> {
  const base = normalizeServerBase(settings.baseUrl)
  const auth = tokenAuthParams(settings.username, settings.password)
  const params = new URLSearchParams({
    v: API_VERSION,
    c: CLIENT_ID,
    f: 'json',
    ...auth,
  })
  for (const [k, v] of Object.entries(extra)) appendParam(params, k, v)
  const path = `/rest/${endpoint}.view?${params}`
  const url = base === '' ? path : `${base}${path}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  const data = (await res.json()) as {
    'subsonic-response': SubsonicEnvelope
  }
  const sr = data['subsonic-response']
  if (!sr || sr.status !== 'ok') {
    const msg = sr?.error?.message ?? 'Subsonic request failed'
    throw new Error(msg)
  }
  return sr
}

export async function ping(settings: ServerSettings): Promise<void> {
  await subsonicFetchJson(settings, 'ping')
}

/** Ask server to rescan media folders (Navidrome picks up new files under the music library). */
export async function startLibraryScan(settings: ServerSettings): Promise<void> {
  await subsonicFetchJson(settings, 'startScan')
}

export async function getArtistList(settings: ServerSettings): Promise<ArtistRef[]> {
  const sr = await subsonicFetchJson(settings, 'getArtists')
  const artistsRoot = sr.artists as
    | { index?: { name?: string; artist?: unknown }[] }
    | undefined
  const indexes = asArray(artistsRoot?.index)
  const out: ArtistRef[] = []
  for (const idx of indexes) {
    for (const a of asArray(idx?.artist as Record<string, unknown> | undefined)) {
      const id = String((a as { id?: string }).id ?? '')
      const name = String((a as { name?: string }).name ?? '')
      if (id && name) {
        out.push({
          id,
          name,
          coverArt: (a as { coverArt?: string }).coverArt,
        })
      }
    }
  }
  return out.sort((x, y) => x.name.localeCompare(y.name))
}

export async function getArtistWithAlbums(
  settings: ServerSettings,
  artistId: string,
): Promise<{ artist: ArtistRef; albums: AlbumRef[] }> {
  const sr = await subsonicFetchJson(settings, 'getArtist', { id: artistId })
  const raw = sr.artist as Record<string, unknown> | undefined
  if (!raw) throw new Error('Missing artist in response')
  const artist: ArtistRef = {
    id: String(raw.id ?? artistId),
    name: String(raw.name ?? ''),
    coverArt: raw.coverArt as string | undefined,
  }
  const albums: AlbumRef[] = []
  const rawAlbums = raw.album as Record<string, unknown> | Record<string, unknown>[] | undefined
  for (const al of asArray<Record<string, unknown>>(rawAlbums)) {
    const id = String(al.id ?? '')
    const name = String(al.name ?? '')
    if (id && name) {
      albums.push({
        id,
        name,
        artist: al.artist as string | undefined,
        coverArt: al.coverArt as string | undefined,
      })
    }
  }
  albums.sort((a, b) => a.name.localeCompare(b.name))
  return { artist, albums }
}

export async function getAlbumWithSongs(
  settings: ServerSettings,
  albumId: string,
): Promise<{ album: AlbumRef; songs: SongRef[] }> {
  const sr = await subsonicFetchJson(settings, 'getAlbum', { id: albumId })
  const raw = sr.album as Record<string, unknown> | undefined
  if (!raw) throw new Error('Missing album in response')
  const album: AlbumRef = {
    id: String(raw.id ?? albumId),
    name: String(raw.name ?? ''),
    artist: raw.artist as string | undefined,
    coverArt: raw.coverArt as string | undefined,
  }
  const songs: SongRef[] = []
  const rawSongs = raw.song as Record<string, unknown> | Record<string, unknown>[] | undefined
  for (const s of asArray<Record<string, unknown>>(rawSongs)) {
    const id = String(s.id ?? '')
    const title = String(s.title ?? '')
    if (id && title) {
      songs.push({
        id,
        title,
        artist: s.artist as string | undefined,
        album: s.album as string | undefined,
        duration: typeof s.duration === 'number' ? s.duration : Number(s.duration) || undefined,
        coverArt: s.coverArt as string | undefined,
      })
    }
  }
  return { album, songs }
}

function streamAuthQuery(username: string, password: string): string {
  const p = tokenAuthParams(username, password)
  return new URLSearchParams({
    ...p,
    v: API_VERSION,
    c: CLIENT_ID,
  }).toString()
}

export function buildStreamUrl(settings: ServerSettings, songId: string): string {
  const base = normalizeServerBase(settings.baseUrl)
  const q = streamAuthQuery(settings.username, settings.password)
  const path = `/rest/stream.view?id=${encodeURIComponent(songId)}&${q}`
  return base === '' ? path : `${base}${path}`
}

export function buildCoverArtUrl(settings: ServerSettings, coverArtId: string, size = 320): string {
  const base = normalizeServerBase(settings.baseUrl)
  const q = streamAuthQuery(settings.username, settings.password)
  const path = `/rest/getCoverArt.view?id=${encodeURIComponent(coverArtId)}&size=${size}&${q}`
  return base === '' ? path : `${base}${path}`
}

function parseSong(raw: Record<string, unknown>): SongRef | null {
  const id = String(raw.id ?? '')
  const title = String(raw.title ?? '')
  if (!id || !title) return null
  return {
    id,
    title,
    artist: raw.artist as string | undefined,
    album: raw.album as string | undefined,
    duration: typeof raw.duration === 'number' ? raw.duration : Number(raw.duration) || undefined,
    coverArt: raw.coverArt as string | undefined,
  }
}

export interface SearchResults {
  artists: ArtistRef[]
  albums: AlbumRef[]
  songs: SongRef[]
}

export async function searchLibrary(settings: ServerSettings, query: string): Promise<SearchResults> {
  const q = query.trim()
  if (!q) return { artists: [], albums: [], songs: [] }
  const sr = await subsonicFetchJson(settings, 'search3', {
    query: q,
    artistCount: 20,
    albumCount: 20,
    songCount: 50,
  })
  const res = sr.searchResult3 as
    | { artist?: unknown; album?: unknown; song?: unknown }
    | undefined
  const artists: ArtistRef[] = []
  for (const a of asArray<Record<string, unknown>>(res?.artist as Record<string, unknown> | undefined)) {
    const id = String(a.id ?? '')
    const name = String(a.name ?? '')
    if (id && name) artists.push({ id, name, coverArt: a.coverArt as string | undefined })
  }
  const albums: AlbumRef[] = []
  for (const al of asArray<Record<string, unknown>>(res?.album as Record<string, unknown> | undefined)) {
    const id = String(al.id ?? '')
    const name = String(al.name ?? '')
    if (id && name) {
      albums.push({
        id,
        name,
        artist: al.artist as string | undefined,
        coverArt: al.coverArt as string | undefined,
        year: typeof al.year === 'number' ? al.year : Number(al.year) || undefined,
      })
    }
  }
  const songs: SongRef[] = []
  for (const s of asArray<Record<string, unknown>>(res?.song as Record<string, unknown> | undefined)) {
    const p = parseSong(s)
    if (p) songs.push(p)
  }
  return { artists, albums, songs }
}

export async function listPlaylists(settings: ServerSettings): Promise<PlaylistSummary[]> {
  const sr = await subsonicFetchJson(settings, 'getPlaylists')
  const root = sr.playlists as { playlist?: unknown } | undefined
  const out: PlaylistSummary[] = []
  for (const p of asArray<Record<string, unknown>>(root?.playlist as Record<string, unknown> | undefined)) {
    const id = String(p.id ?? '')
    const name = String(p.name ?? '')
    if (id && name) {
      out.push({
        id,
        name,
        songCount: typeof p.songCount === 'number' ? p.songCount : Number(p.songCount) || undefined,
        owner: p.owner as string | undefined,
        public: typeof p.public === 'boolean' ? p.public : p.public === 'true',
      })
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

export async function getPlaylist(
  settings: ServerSettings,
  playlistId: string,
): Promise<{ summary: PlaylistSummary; entries: PlaylistEntry[] }> {
  const sr = await subsonicFetchJson(settings, 'getPlaylist', { id: playlistId })
  const raw = sr.playlist as Record<string, unknown> | undefined
  if (!raw) throw new Error('Missing playlist')
  const summary: PlaylistSummary = {
    id: String(raw.id ?? playlistId),
    name: String(raw.name ?? ''),
    songCount: typeof raw.songCount === 'number' ? raw.songCount : Number(raw.songCount) || undefined,
    owner: raw.owner as string | undefined,
    public: typeof raw.public === 'boolean' ? raw.public : raw.public === 'true',
  }
  const entries: PlaylistEntry[] = []
  for (const e of asArray<Record<string, unknown>>(raw.entry as Record<string, unknown> | undefined)) {
    const song = parseSong(e)
    if (song) entries.push({ ...song, streamId: song.id })
  }
  return { summary, entries }
}

export async function createPlaylist(
  settings: ServerSettings,
  name: string,
  songIds: string[] = [],
): Promise<void> {
  const extra: Record<string, ParamVal> = { name }
  if (songIds.length) extra.songId = songIds
  await subsonicFetchJson(settings, 'createPlaylist', extra)
}

export async function deletePlaylist(settings: ServerSettings, playlistId: string): Promise<void> {
  await subsonicFetchJson(settings, 'deletePlaylist', { id: playlistId })
}

type UpdatePlaylistArgs = {
  playlistId: string
  name?: string
  songIdToAdd?: string[]
  songIndexToRemove?: number[]
}

export async function updatePlaylist(settings: ServerSettings, args: UpdatePlaylistArgs): Promise<void> {
  const extra: Record<string, ParamVal> = { playlistId: args.playlistId }
  if (args.name !== undefined) extra.name = args.name
  if (args.songIdToAdd?.length) extra.songIdToAdd = args.songIdToAdd
  if (args.songIndexToRemove?.length) extra.songIndexToRemove = args.songIndexToRemove
  await subsonicFetchJson(settings, 'updatePlaylist', extra)
}

/** Reorder by clearing via index removes (high→low) then adding IDs in order. */
export async function syncPlaylistSongOrder(
  settings: ServerSettings,
  playlistId: string,
  orderedSongIds: string[],
): Promise<void> {
  const { entries } = await getPlaylist(settings, playlistId)
  const currentIds = entries.map((e) => e.id)
  if (
    currentIds.length === orderedSongIds.length &&
    currentIds.every((id, i) => id === orderedSongIds[i])
  ) {
    return
  }
  for (let i = currentIds.length - 1; i >= 0; i--) {
    await updatePlaylist(settings, { playlistId, songIndexToRemove: [i] })
  }
  for (const id of orderedSongIds) {
    await updatePlaylist(settings, { playlistId, songIdToAdd: [id] })
  }
}

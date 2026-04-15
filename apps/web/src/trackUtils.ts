import type { PlaybackTrack, SongRef } from './subsonic/types'

export function toPlaybackTrack(
  s: SongRef,
  fallbackArtist?: string,
  fallbackAlbum?: string,
): PlaybackTrack {
  return {
    ...s,
    streamId: s.id,
    artist: s.artist ?? fallbackArtist,
    album: s.album ?? fallbackAlbum,
  }
}

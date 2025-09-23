// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import {runCommand, canRunCommand} from './exec.ts'

export type Captions = {
  [language: string]: {
    ext: string
    url: string
    name: string
  }[]
}

export type Chapter = {
  start_time: number
  title: string
  end_time: number
}

export type Thumbnail = {
  url: string
  preference: number
  id: string
}

export type ChannelThumbnail = {
  url: string
  id: string
  preference: number
  width?: number
  height?: number
  resolution?: string
}

export type Format = {
  asr?: number
  filesize?: number
  filesize_approx: number | null,
  format: string
  format_id: string
  format_note: string
  ext: string
  protocol: string
  acodec: string
  vcodec: string
  url: string,
  manifest_url?: string
  width: number,
  height: number,
  fps: number
  rows: number,
  columns: number
  fragments: {
    url: string
    duration: number
  }[],
  audio_ext: string,
  video_ext: string,
  vbr: number
  abr: number,
  tbr: number | null,
  resolution: string,
  aspect_ratio: number,
  http_headers: {
    [key: string]: string
  },
}

export type YtDlpVideoResult = {
  id: string
  title: string
  formats: Format[]
  thumbnails: Thumbnail[]
  thumbnail: string
  description: string
  channel_id: string
  channel_url: string
  duration: number
  view_count: number
  average_rating: number | null
  age_limit: number
  webpage_url: string
  categories: string[]
  tags: string[]
  playable_in_embed: boolean
  live_status: string
  release_timestamp: string | null
  _format_sort_fields: string[]
  automatic_captions: Captions
  subtitles: Captions
  comment_count: number | null
  chapters: Chapter[]
  heatmap: null // unknown
  like_count: number
  channel: string
  channel_follower_count: number
  uploader: string
  uploader_id: string
  uploader_url: string
  upload_date: string
  timestamp: number
  availability: string
  original_url: string
  webpage_url_basename: string
  webpage_url_domain: string
  extractor: string
  extractor_key: string
  playlist: null // unknown
  playlist_index: null // unknown
  display_id: string
  fulltitle: string
  duration_string: string
  release_year: null // unknown
  is_live: boolean
  was_live: boolean
  requested_subtitles: null // unknown
  _has_drm: null // unknown
  epoch: number
  requested_formats: Format[]
  format: string
  format_id: string
  ext: string
  protocol: string
  language: string | null // unknown
  format_note: string
  filesize_approx: number
  tbr: number
  width: number
  height: number
  resolution: string
  fps: number
  dynamic_range: string
  vcodec: string
  vbr: number
  stretched_ratio: number | null
  aspect_ratio: number
  acodec: string
  abr: number
  asr: number
  audio_channels: number
  _filename: string
  filename: string
  _type: string
  _version: {
    version: string
    current_git_head: string | null,
    release_git_head: string | null,
    repository: string | null
  }
}

export type YtDlpChannelResult = {
  id: string
  channel: string
  channel_id: string
  title: string
  channel_follower_count: number
  description: string
  tags: string[]
  thumbnails: ChannelThumbnail[]
  uploader_id: string
  uploader_url: string
  uploader: string
  channel_url: string
  webpage_url: string
  original_url: string
  webpage_url_basename: string
  webpage_url_domain: string
  epoch: number
}

// Simplified Youtube channel data.
export interface YoutubeChannel {
  id: string
  title: string
  username: string
  thumbnail: string | null
  url: string
  canonicalUrl: string
}

// Simplified Youtube video data.
export interface YoutubeVideo {
  id: string
  title: string
  thumbnail: string
  description: string
  link: string
  date: Date
  duration: number
  comments: number
  likes: number
  channel: {
    name: string
    url: string
    followers: number
    canonicalUrl: string
  }
}

/**
 * Runs yt-dlp on a given video id and returns its data.
 */
export async function getYtDlpVideoData(id: string, ytDlpPath: string = 'yt-dlp'): Promise<YtDlpVideoResult> {
  if (!canRunCommand(ytDlpPath)) {
    throw new Error(`could not find yt-dlp at given path: ${ytDlpPath}`)
  }
  const res = await runCommand([ytDlpPath, '--dump-single-json', `https://www.youtube.com/watch?v=${id}`])
  if (res.exitCode !== 0) {
    throw new Error(`yt-dlp returned error code: ${res.exitCode} (id=${id})`)
  }
  try {
    return JSON.parse(res.stdout) as YtDlpVideoResult
  }
  catch (err) {
    if (err instanceof SyntaxError && err.message.includes('not valid JSON')) {
      throw new Error(`yt-dlp did not return valid JSON: ${String(res.stdout).slice(0, 50)}[...] (id=${id})`)
    }
    throw err
  }
}

/**
 * Runs yt-dlp on a given video id and returns its data.
 */
export async function getYtDlpChannelData(channelId: string, ytDlpPath: string = 'yt-dlp'): Promise<YtDlpChannelResult> {
  if (!canRunCommand(ytDlpPath)) {
    throw new Error(`could not find yt-dlp at given path: ${ytDlpPath}`)
  }
  const url = channelId.startsWith('@') ? `https://www.youtube.com/${channelId}` : `https://www.youtube.com/channel/${channelId}`
  const res = await runCommand([ytDlpPath, '-J', '-I', '0:0', url])
  if (res.exitCode !== 0) {
    throw new Error(`yt-dlp returned error code: ${res.exitCode} (channelId=${channelId})`)
  }
  try {
    return JSON.parse(res.stdout) as YtDlpChannelResult
  }
  catch (err) {
    if (err instanceof SyntaxError && err.message.includes('not valid JSON')) {
      throw new Error(`yt-dlp did not return valid JSON: ${String(res.stdout).slice(0, 50)}[...] (channelId=${channelId})`)
    }
    throw err
  }
}

/**
 * Returns only basic information about a channel.
 */
export function getBasicChannelData(data: YtDlpChannelResult): YoutubeChannel {
  const thumbnail = data.thumbnails.find(item => item.id === 'avatar_uncropped')
  return {
    id: data.channel_id,
    title: data.title,
    username: data.uploader_id,
    thumbnail: thumbnail ? thumbnail.url : null,
    canonicalUrl: data.uploader_url,
    url: data.channel_url,
  }
}

/**
 * Returns only the most pertinent information for a video.
 */
export function getBasicVideoData(data: YtDlpVideoResult): YoutubeVideo {
  return {
    id: data.id,
    title: data.title,
    thumbnail: data.thumbnail,
    description: data.description,
    link: data.webpage_url,
    date: new Date(data.timestamp * 1000),
    duration: Number(data.duration) * 1000,
    comments: Number(data.comment_count),
    likes: Number(data.like_count),
    channel: {
      name: data.channel,
      url: data.channel_url,
      followers: Number(data.channel_follower_count),
      canonicalUrl: data.uploader_url,
    }
  }
}

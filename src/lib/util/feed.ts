// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import {PassThrough} from 'node:stream'
import FeedParser from 'feedparser'
import type {Item} from 'feedparser'
import {fetchBrowser} from './fetch.ts'

export interface FetchFeedOptions {
  feedparserOptions?: object
  silentlyFail?: boolean
}

/**
 * Parses an Atom/rss feed and returns its items.
 */
export function parseFeed(xml: string, options: object = {}): Promise<Item[]> {
  return new Promise((resolve, reject) => {
    const contentStream = new PassThrough()
    contentStream.write(xml)
    contentStream.end()

    const feed = new FeedParser(options)
    contentStream.pipe(feed)

    const items: Item[] = []

    // Reject on any parsing error.
    feed.on('error', (err: Error) => {
      reject(err)
    })

    // Wait for all items to be collected, then resolve.
    feed.on('readable', function readItems(this: FeedParser) {
      let item
      while (item = this.read()) {
        items.push(item)
      }
      resolve(items)
    })
  })
}

/**
 * Fetches a feed by url and parses it.
 */
export async function fetchFeed(url: string, options: FetchFeedOptions = {}) {
  const res = await fetchBrowser(url)
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Feed does not exist', {cause: res})
    }
    throw new Error('Could not fetch feed xml', {cause: res})
  }
  const xml = await res.text()
  try {
    const items = await parseFeed(xml, options.feedparserOptions ?? {})
    return items
  }
  catch (err) {
    if (!(err instanceof Error)) {
      throw err
    }
    if (err.message === 'Feed does not exist' && options.silentlyFail) {
      // This occasionally happens with Youtube feeds. Probably a rate limit.
      // In this case we just silently fail.
      return []
    }
    throw err
  }
}

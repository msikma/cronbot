// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import {omit, keyBy} from 'lodash-es'
import {eq, ne, and, inArray} from 'drizzle-orm'
import {cache, message, cacheToMessage} from './schema.ts'
import type {DrizzleClient} from './index.ts'
import {isSerializedEqual} from '../util/index.ts'
import type {FeedItem, FeedItemUpdate} from '../../types.ts'

/**
 * Returns an array of actionable items as a map.
 */
function createGuidMap<T extends {guid: string}>(items: T[]): Map<string, T> {
  return new Map<string, T>(Object.entries(keyBy(items, 'guid')));
}

/**
 * Filters out feed items that have already been posted to Discord.
 * 
 * It does this by checking for the unique "guid" in the cache table.
 * If the item doesn't exist, this means we need to post it to Discord.
 * If the item is already found, we check the "data" value to see if it's different,
 * and if it is, it means we have an existing post on Discord that we need to edit.
 */
export async function filterFeedItems(db: DrizzleClient, taskId: string, subtask: string, items: FeedItem[]): Promise<FeedItemUpdate[]> {
  if (items.length === 0) {
    return []
  }

  // We'll collect items to post to Discord here.
  const postableItems: FeedItemUpdate[] = []

  // Items we've received from the task.
  const itemsMap = createGuidMap(items)

  // Fetch existing entries from the database.
  const existingItems = await db.query.cache.findMany({
    with: {
      message: true
    },
    where: and(
      inArray(cache.guid, [...itemsMap.keys()]),
      eq(cache.task, taskId)
    )
  })
  
  const existingItemsMap = createGuidMap(existingItems)
  
  for (const item of itemsMap.values()) {
    const existingItem = existingItemsMap.get(item.guid)
    const existingMessageId = existingItem?.message[0]?.id || null
    
    if (existingItem && existingItem.status === 'errored') {
      // If the item exists but its status is set to "errored", we'll skip it.
      continue
    }
    else if (existingItem === undefined || (existingItem && existingMessageId === null)) {
      // If we have no existing item yet, we can send a new post to Discord.
      // In the rare case that we have an item, but we haven't posted it yet, treat it as a new post.
      postableItems.push({data: item, action: 'insert', messageId: null})
    }
    else if (existingItem && !isSerializedEqual(item.data, existingItem.data) && existingMessageId !== null) {
      // If the existing item exists, but the data is different, we can update an existing Discord post.
      postableItems.push({data: item, action: 'update', messageId: existingMessageId})
    }
    else {
      // If the item already exists and the data is the same, that means
      // the item is already posted and the post is still up to date.
      continue
    }
  }
  
  return postableItems
}

/**
 * Marks an item with a given status.
 * 
 * This is used to set an item to "errored", which causes it to be skipped next time.
 */
export async function markFeedItemStatus(db: DrizzleClient, status: string, guid: string, taskId: string, subtask: string): Promise<void> {
  const values = {
    guid,
    task: taskId,
    subtask,
    status,
    data: null,
  }
  await db
    .insert(cache)
    .values({
      ...values,
      createdAt: new Date()
    })
    .onConflictDoUpdate({
      target: [cache.guid, cache.task],
      set: {
        ...omit(values, ['guid', 'data']),
        updatedAt: new Date()
      }
    })
    .returning()
}

/**
 * Upserts a cache item.
 */
export async function upsertCache(db: DrizzleClient, guid: string, taskId: string, subtask: string, data: any): Promise<void> {
  const values = {
    guid,
    task: taskId,
    subtask,
    data,
  }
  await db
    .insert(cache)
    .values({
      ...values,
      createdAt: new Date()
    })
    .onConflictDoUpdate({
      target: [cache.guid, cache.task],
      set: {
        ...omit(values, ['guid', 'task']),
        updatedAt: new Date()
      }
    })
    .returning()
}

/**
 * Upserts a Discord message.
 */
export async function upsertMessage(db: DrizzleClient, messageId: string, guildId: string, channelId: string): Promise<void> {
  const values = {
    id: messageId,
    guildId,
    channelId,
  }
  await db
    .insert(message)
    .values({
      ...values,
      createdAt: new Date()
    })
    .onConflictDoUpdate({
      target: [message.id],
      set: {
        ...values,
        updatedAt: new Date()
      }
    })
    .returning()
}

/**
 * Connects a cache item and a Discord message in the database.
 */
export async function connectCacheAndMessage(db: DrizzleClient, guid: string, taskId: string, messageId: string): Promise<void> {
  await db
    .delete(cacheToMessage)
    .where(and(
      eq(cacheToMessage.guid, guid),
      ne(cacheToMessage.id, messageId)
    ))
  await db
    .insert(cacheToMessage)
    .values({
      guid: guid,
      task: taskId,
      id: messageId,
    })
    .onConflictDoNothing()
    .returning()
}


/**
 * Inserts a feed item into the database, creating cache and message rows.
 * 
 * This combines upsertCache(), upsertMessage() and connectCacheAndMessage() in one transaction.
 */
export async function insertFeedItem(db: DrizzleClient, guid: string, taskId: string, subtask: string, data: any, messageId: string, guildId: string, channelId: string): Promise<void> {
  await db.transaction(async tx => {
    await upsertCache(tx, guid, taskId, subtask, data)
    await upsertMessage(tx, messageId, guildId, channelId)
    await connectCacheAndMessage(tx, guid, taskId, messageId)
  })
}

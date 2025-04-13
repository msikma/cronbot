// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

// Task config should, at least, contain a "channel" string.
type TaskConfigBase = {channel: string | null}

// Feed items are simple one-to-one items that can be posted to Discord.
// They must have a guid, which serves as a unique identifier, and data, which is used to construct the post.
export type FeedItem<T = any, U extends TaskConfigBase = TaskConfigBase> = {
  guid: string
  data: T
  taskChannel: string
  taskConfig: U
}

// A feed item item update object. This indicates that a given feed object can be either
// inserted newly into the database, or updated; and at the same time the Discord post
// can be posted or updated as well.
export type FeedItemUpdate<T = any, U extends TaskConfigBase = TaskConfigBase> =
  {data: FeedItem<T, U>} &
  (
    {action: 'insert', messageId: null} |
    {action: 'update', messageId: string}
  )

// Optional update metadata for feed items. This allows us to forcibly run an update for a feed item
// even if it hasn't changed (for when you know the payload will be different even with the same data).
// If an item is null or undefined, the determination is not altered from the default logic.
export type FeedItemUpdateMeta = {
  shouldUpdate?: boolean | null
}

// Wrapped version of FeedItemUpdateMeta with the item's guid.
export type FeedItemUpdateMetaItem = {
  guid: string
  data: FeedItemUpdateMeta
}

// After posting feed items to Discord, we receive back the post's message, guild and channel ids.
// This allows the bot to update the database so we know which items have been successfully posted.
export type FeedItemUpdateResult = {
  messageId: string
  guildId: string
  channelId: string
}

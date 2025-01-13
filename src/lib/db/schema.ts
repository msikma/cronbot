// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import {InferSelectModel, InferInsertModel, relations} from 'drizzle-orm'
import {sqliteTable, text, integer, primaryKey, foreignKey} from 'drizzle-orm/sqlite-core'
import {snowflake} from './util/index.ts'

// Cache items for remote data. When we fetch remote data, we process it and save the processed data.
export const cache = sqliteTable('cache', {
  // This application uses "guid" in the sense that rss/atom uses it: typically it will be a canonical url.
  guid: text('guid').notNull(),
  // The task that generated this cache value.
  task: text('task').notNull(),
  // A "subtask", which is any value the task can set to better manage its own data.
  // e.g. for Youtube, this could be the name of a channel.
  subtask: text('subtask'),
  // The data is raw json in any format.
  data: text('data', {mode: 'json'}).notNull(),
  // The status of this item (normally null, but can be "error").
  status: text('status'),
  // Timestamps.
  createdAt: integer('created_at', {mode: 'timestamp_ms'}).notNull(),
  updatedAt: integer('updated_at', {mode: 'timestamp_ms'}),
}, table => [
  primaryKey({columns: [table.guid, table.task]})
])

export const cacheRelations = relations(cache, ({many}) => ({
  message: many(cacheToMessage),
}))

export type SelectCache = InferSelectModel<typeof cache>
export type InsertCache = Omit<InferInsertModel<typeof cache>, 'createdAt' | 'updatedAt'>

// Represents a single Discord post that has been posted for a given cache item.
// Note that no message content is saved here. We use this purely to indicate that a message exists.
export const message = sqliteTable('message', {
  // Message id snowflake.
  id: snowflake('id').primaryKey(),
  // Guild id/channel id identifiers, both snowflakes.
  guildId: snowflake('guild_id'),
  channelId: snowflake('channel_id').notNull(),
  // Timestamps.
  createdAt: integer('created_at', {mode: 'timestamp_ms'}).notNull(),
  updatedAt: integer('updated_at', {mode: 'timestamp_ms'}),
})

export const messageRelations = relations(message, ({many}) => ({
  cache: many(cacheToMessage),
}))

export type SelectMessage = InferSelectModel<typeof message>
export type InsertMessage = Omit<InferInsertModel<typeof message>, 'createdAt' | 'updatedAt'>

// Table connecting cache items to messages.
export const cacheToMessage = sqliteTable('cache_to_message', {
  guid: text('guid').notNull(),
  task: text('task').notNull(),
  id: snowflake('id').notNull(),
}, table => [
  primaryKey({columns: [table.guid, table.task, table.id]}),
  foreignKey({columns: [table.guid, table.task], foreignColumns: [cache.guid, cache.task]}),
  foreignKey({columns: [table.id], foreignColumns: [message.id]})
])

export const cacheToMessageRelations = relations(cacheToMessage, ({one}) => ({
  cache: one(cache, {
    fields: [cacheToMessage.guid, cacheToMessage.task],
    references: [cache.guid, cache.task],
  }),
  message: one(message, {
    fields: [cacheToMessage.id],
    references: [message.id],
  }),
}))

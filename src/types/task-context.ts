// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import {Client} from 'discord.js'
import {EmbedBuilder} from 'discord.js'
import {BotDatabase} from '../lib/db/index.ts'
import type {BotTask, BotTaskAction} from './task.ts'
import type {BotTaskActionConfig} from './config.ts'
import type {LogFunction} from './logger.ts'
import type {FeedItem, FeedItemUpdate} from './task-type.ts'

// List of ORM functions provided to a task action.
export type TaskActionDatabaseFunctions = {
  markFeedItemStatus: (status: string, guid: string, taskId: string, subtask: string) => Promise<void>
  filterFeedItems: (items: FeedItem[]) => Promise<FeedItemUpdate[]>
  insertFeedItem: (guid: string, taskId: string, subtask: string, data: any, messageId: string, guildId: string, channelId: string) => Promise<void>
  upsertCache: (guid: string, taskId: string, subtask: string, data: any) => Promise<void>
  upsertMessage: (messageId: string, guildId: string, channelId: string) => Promise<void>
  connectCacheAndMessage: (guid: string, taskId: string, messageId: string) => Promise<void>
}

// List of logging functions provided to a task action.
export type TaskActionLoggingFunction = {
  info: LogFunction
  error: LogFunction
}

// An "action" is a single call of a task's function.
// It's called with a context object that includes everything needed for it to easily run.
// Each task function is called once for each guild it's configured for, with a config object
// for that specific guild.
export interface TaskActionContext {
  // Reference to its own task.
  task: BotTask
  // The subtask is the currently running function name.
  subtask: string
  // The given action that's being executed.
  action: BotTaskAction
  // Config for a specific guild for this task from the config.js file.
  config: BotTaskActionConfig
  // Guild id that's relevant to this task iteration.
  guildId: string
  // Reference to the Discord.js client.
  client: Client
  // Direct reference to the bot database instance.
  db: BotDatabase
  // Database ORM functions provided to the task action.
  orm: TaskActionDatabaseFunctions
  // Logger functions provided to the task action.
  log: TaskActionLoggingFunction
  // Creates an embed specific to this task.
  TaskEmbed: typeof EmbedBuilder
}

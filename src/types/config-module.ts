// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import type {PlainValue} from './util.ts'

// Configuration consists of two parts: the system config, and task specific config.
// Almost all config is per-guild, and at the moment only the bot token is global config.
// All config is in one file, with the task config being a separate export.
// This file contains types for the plain config modules. User facing types are in config.ts.
//
// Note: the types in this file are not externally available.

// Global configuration that applies to the bot client itself.
export type BotGlobalSystemConfig = {
  BOT_TOKEN: string
}
// Per-guild bot config. Each guild has a log and error channel configured.
export type BotGuildSystemConfig = {
  log: {
    infoChannel: string
    errorChannel: string
  }
}
// Full bot system config object.
export type BotSystemConfig = BotGlobalSystemConfig & PerGuildConfigObject<BotGuildSystemConfig>

// Task config can be an object with any kind of data.
// The only thing we require is that the config starts with an object.
// So the config can't be just e.g. one string or number.
export type BotTaskBaseConfig = {
  [key: string]: PlainValue
}

// The task config consists of task ids, each containing per-guild config.
export type BotTaskConfig = PerTaskConfigObject<PerGuildConfigObject<BotTaskBaseConfig>>

// The config module (i.e. import() result of the config.js file).
export type BotConfigModule = {
  systemConfig: BotSystemConfig
  taskConfig: BotTaskConfig
}

// Per-guild config is an object consisting of "guilds", where each key is a guild id.
export type PerGuildConfigObject<T> = {
  guilds: {
    [guildId: string]: T
  }
}
// Per-task config is an object where each key is a task id.
export type PerTaskConfigObject<T> = {
  [taskId: string]: T
}

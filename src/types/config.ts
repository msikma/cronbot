// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import type {BotGlobalSystemConfig, BotGuildSystemConfig, BotTaskBaseConfig} from './config-module.ts'
import type {PlainValue} from './util.ts'

// This file contains user facing types for config.
// Config is per-task and per-guild specific. After loading the config data, we convert
// plain objects to Map objects for guilds and tasks.

// Map consisting of guildId -> config.
export type PerGuildConfig<T> = {guilds: Map<string, T>}
// Map consisting of taskId -> config.
export type PerTaskConfig<T> = Map<string, T>

// System config data.
export type BotSystemConfig = BotGlobalSystemConfig & PerGuildConfig<BotGuildSystemConfig>

// The task config consists of task ids, each containing per-guild config.
export type BotTaskGuildConfig = PerGuildConfig<BotTaskBaseConfig>
export type BotTaskConfig = PerTaskConfig<BotTaskGuildConfig>

// When a task function is called (an "action"), it will receive a config object specific to one guild.
// The action config can be any plain value.
export type BotTaskActionConfig = PlainValue

// The complete bot config.
export type BotConfig = {
  systemConfig: BotSystemConfig,
  taskConfig: BotTaskConfig
}

// Export the per-guild system config from the module types.
export type {BotGuildSystemConfig}

// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import type {EnvPaths} from '@dada78641/env-paths'
import * as path from 'node:path'
import type {BotConfig, BotSystemConfig, BotTaskConfig, BotGuildSystemConfig} from '../types.ts'
import type {BotConfigModule} from '../types/config-module.ts'

/**
 * Imports the config file.
 * 
 * If the config file does not contain both a systemConfig and taskConfig export, this will throw.
 * Similarly, a file not found error will be thrown if the config file is not found.
 */
async function loadConfigModule(filepath: string): Promise<BotConfigModule> {
  try {
    const module = await import(filepath) as BotConfigModule
    if (!module.systemConfig || !module.taskConfig) {
      throw new Error(`Config file must export botConfig and taskConfig properties: ${filepath}`)
    }
    return module
  }
  catch (err) {
    if (err instanceof Error && 'code' in err && err.code === 'ERR_MODULE_NOT_FOUND') {
      throw new Error(`Config file not found: ${filepath}`)
    }
    throw err
  }
}

/**
 * Processes the task config from the config.js file into a proper BotTaskConfig typed object.
 * 
 * This involves creating maps by task id with maps by guild id inside of them.
 */
function processTaskConfig(rawTaskConfig: BotConfigModule['taskConfig']): BotTaskConfig {
  const taskConfigPerTask = new Map()
  for (const [taskId, taskConfigObject] of Object.entries(rawTaskConfig)) {
    const taskConfigPerGuild = new Map(Object.entries(taskConfigObject.guilds))
    taskConfigPerTask.set(taskId, {guilds: taskConfigPerGuild})
  }
  return taskConfigPerTask
}

/**
 * Processes the system config from the config.js file into a proper BotSystemConfig typed object.
 * 
 * This really just involves converting the systemConfig.guilds object into a map by guild id.
 */
function processSystemConfig(rawSystemConfig: BotConfigModule['systemConfig']): BotSystemConfig {
  const systemGuildConfig = new Map<string, BotGuildSystemConfig>(Object.entries(rawSystemConfig.guilds))
  return {
    ...rawSystemConfig,
    guilds: systemGuildConfig,
  }
}

/**
 * Returns the full bot configuration.
 * 
 * The bot configuration is stored in a .js file, do we'll import it and process its data.
 * We'll do a quick sanity check, but it's mostly assumed that the config file is structured properly.
 * If something is not structured properly, the bot will eventually throw an error.
 */
export async function getBotConfig(envPaths: EnvPaths): Promise<BotConfig> {
  const configModule = await loadConfigModule(path.join(envPaths.config, 'config.js'))
  const systemConfig = processSystemConfig(configModule.systemConfig)
  const taskConfig = processTaskConfig(configModule.taskConfig)
  return {
    systemConfig,
    taskConfig,
  }
}

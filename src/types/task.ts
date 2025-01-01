// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import type {TaskActionContext} from './task-context.ts'
import {FeedTask} from '../index.ts'

// Bot task.
export interface BotTask<Config = any> {
  // Unique string id used for matching the config.
  id: string
  // Human readable name.
  name: string
  // Design used for generating task embeds.
  design: BotTaskDesign
  // The function that the task runs.
  actions?: BotTaskAction<Config>[]
  // True if this is the system task (CronBot itself).
  isSystemTask?: boolean
}

// The design of a task.
export type BotTaskDesign = {
  // Color and icon used for embeds.
  color: number
  icon: string
}

// The actual function called for a task.
export type BotTaskAction<Config = any> = {
  // Class that gets instantiated and called.
  action: new (context: TaskActionContext & { config: Config }) => FeedTask<Config>
  // Simple one-line description of this function does.
  description: string
  // Interval at which this function is called.
  interval: number
  // Whether to wait one interval upon starting the bot, or run immediately.
  deferred: boolean
}

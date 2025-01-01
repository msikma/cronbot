// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import type {BotTask} from './task.ts'

// When tasks are scheduled, the scheduler creates objects to keep track of their status.
export interface ScheduledTaskData {
  // Task id.
  id: string
  // Full task object.
  task: BotTask,
  // Whether the task has started yet. Tasks start after the bot successfully connects.
  isStarted: boolean
  // Whether the task is paused.
  isPaused: boolean
  // Whether the task has been canceled.
  isCanceled: boolean
  // Generator function that calls the task at its configured interval.
  action: AsyncGenerator<void> | null
  // Function that loops forever and calls the generator until the task is canceled.
  loop: Promise<void> | null
}

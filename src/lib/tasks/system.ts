// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import type {BotTask} from '../../types.ts'

export const systemTask: BotTask = {
  id: 'cronbot',
  name: 'CronBot',
  design: {
    color: 0xbe7031,
    icon: 'https://i.imgur.com/wyE8fNL.png',
  },
  isSystemTask: true,
}

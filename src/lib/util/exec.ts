// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import {spawn} from 'child_process'
import commandExists from 'command-exists'

export interface CommandResult {
  stdout: string
  stderr: string
  exitCode: number | null
  abortSignal: AbortSignal | null
}

/**
 * Returns whether we are able to run a given command or not.
 */
export async function canRunCommand(commandPath: string): Promise<boolean> {
  try {
    await commandExists(commandPath)
    return true
  }
  catch {
    return false
  }
}

/**
 * Spawns a child process, captures its output, and returns the result.
 * 
 * This is equivalent to using a command on the command line and capturing its result.
 * If something goes wrong spawning the process, such as the command not being found,
 * or the correct rights to run the command not being present, an error is thrown.
 */
export function runCommand(command: string[], inputData?: Buffer): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    if (command.length === 0) {
      return reject(new Error('No command was provided'))
    }

    const [cmd, ...args] = command
    const child = spawn(cmd, args, {stdio: ['pipe', 'pipe', 'pipe']})

    const stdout: Buffer[] = []
    const stderr: Buffer[] = []

    child.stdout.on('data', data => stdout.push(data))
    child.stderr.on('data', data => stderr.push(data))

    if (inputData) {
      child.stdin.write(inputData)
      child.stdin.end()
    }

    child.on('close', (exitCode, abortSignal) => {
      if (abortSignal) {
        return reject(new Error(`Child process was terminated abnormally: ${String(abortSignal)}`))
      }
      resolve({
        stdout: Buffer.concat(stdout).toString(),
        stderr: Buffer.concat(stderr).toString(),
        exitCode,
        abortSignal
      })
    })

    child.on('error', (err) => {
      reject(err)
    })
  })
}

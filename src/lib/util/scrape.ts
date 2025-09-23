// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import * as vm from 'node:vm'
import * as cheerio from 'cheerio'

// Function that checks if a given <script> tag content matches.
export type ScriptSearchFunction = (content: string) => boolean

// Data extracted from a <script> tag via a sandbox.
export type ScriptData = {
  value: any
  sandbox: {
    window: {[key: string]: any}
    [key: string]: any
  }
}

/**
 * Finds a <script> tag on an html page.
 */
export function findScriptTag($: cheerio.CheerioAPI, searchFunction: ScriptSearchFunction) {
  const scripts = $('script').get()
  return scripts.find(script => {
    const content = $(script).text()
    return searchFunction(content)
  })
}

/**
 * Runs a script inside of a sandboxed VM to extract its data.
 */
export function findScriptData(scriptContent: string): ScriptData {
  try {
    const sandbox = {window: {}}
    const script = new vm.Script(scriptContent)
    const ctx = vm.createContext(sandbox) // eslint-disable-line new-cap
    const value = script.runInContext(ctx)
    return {
      value,
      sandbox
    }
  }
  catch (err) {
    throw new Error(`Could not extract script data: ${err}`)
  }
}

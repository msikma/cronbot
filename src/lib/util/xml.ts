// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import * as fs from 'node:fs/promises'
import xml2js from 'xml2js'

/**
 * Parses an RSS feed from an XML string.
 */
export async function parseXml<T = any>(xml: string): Promise<T> {
  const parsed = await xml2js.parseStringPromise(xml, {
    trim: true,
    async: true,
    explicitCharkey: false,
    explicitArray: false,
  })
  return parsed
}

/**
 * Requests a feed URL and returns its parsed contents.
 */
export async function parseXmlFile<T = any>(filepath: string): Promise<T> {
  const xml = await fs.readFile(filepath, 'utf8')
  return parseXml<T>(xml)
}

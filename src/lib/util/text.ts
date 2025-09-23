// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import TurndownService from 'turndown'

const ELLIPSIS = `[...]`

/**
 * Converts HTML to Markdown.
 */
export function htmlToMarkdown(htmlText: string): string {
  const tds = new TurndownService()
  const md = tds.turndown(htmlText)
  // There's an issue with Markdown in Discord, which is that [ ] brackets inside of named links
  // are supposed to be escapable, but they aren't in Discord. The escape \ slashes are shown literally.
  // To get around this, we do one pass where we get rid of these extra slashes.
  const mdFixed = md.replace(/\[(.+?)\]\((.+?)\)/, (_, ...args) => {
    return `[${args[0].replaceAll('\\[', '[').replaceAll('\\]', ']')}](${args[1]})`
  })
  return mdFixed
}

/**
 * Strips a {{Ruby|A|B}} template.
 * 
 * For example, in the following title of a One Piece episode:
 * 最後の教え！受け継がれた{{Ruby|拳骨|インパクト}}
 * We probably want to keep A, as B is the furigana.
 */
export function stripRubyTemplate(wikiCode: string, take: 'a' | 'b' = 'a') {
  return wikiCode.replace(/{{(.+?)\|(.+?)\|(.+?)}}/gm, take === 'a' ? '$2' : '$3')
}

/**
 * Converts wikicode to Markdown.
 * 
 * This is a very naive method and doesn't work for all types of syntax.
 */
export function wikiToMarkdown(wikiCode: string): string {
  let md = wikiCode
  // Bold and italic
  md = md.replace(/'''''(.+?)'''''/g, (_, text) => `***${text}***`)
  // Bold
  md = md.replace(/'''(.+?)'''/g, (_, text) => `**${text}**`)
  // Italic
  md = md.replace(/''(.+?)''/g, (_, text) => `*${text}*`)
  // External links
  md = md.replace(/\[http(.+?)\s+(.+?)\]/g, (_, url, text) => `[${text}](http${url})`)
  // Internal links (note: this just removes the link altogether)
  md = md.replace(/\[\[(.+?)\]\]/g, (_, content) => {
    const parts = content.split('|')
    const text = parts.slice(-1)[0]
    return `${text.replace(/_/g, ' ')}`
  })
  return md.trim()
}

/**
 * Removes the last sentence from a line.
 */
function removeLastSentence(line: string): string {
  const sentences = line.split('. ')
  return sentences.slice(0, -1).join('. ')
}

/**
 * Limits a description to a max number of lines.
 * 
 * Sometimes descriptions will be within the limit, but have a large number of newlines.
 * This is also undesirable, so this function removes lines if it's past a limit.
 */
export function limitDescriptionLines(description: string, maxLines: number = 15, addEllipsis: boolean = false) {
  const lines = description.split('\n')
  if (lines.length <= maxLines) {
    return description.trim()
  }
  return `${lines.slice(0, maxLines).join('\n').trim()}${addEllipsis ? ` ${ELLIPSIS}` : ''}`
}

/**
 * Cuts a long description down to size.
 * 
 * This first cuts a description to a given size limit, and then cleans up the result a bit.
 */
export function limitDescription(_description: string, maxLength: number = 700, addEllipsis: boolean = true) {
  const description = _description.trim()
  if (description.length < maxLength) {
    return limitDescriptionLines(description.trim(), undefined, addEllipsis)
  }

  // Hard cut the description to the given maximum length.
  const limited = description.slice(0, maxLength)
  // Remote the last line, or last sentence of the last line.
  const lines = limited.split('\n')

  if (lines.length === 1) {
    return `${limitDescriptionLines(removeLastSentence(lines[0]).trim())}${addEllipsis ? ` ${ELLIPSIS}` : ''}`
  }

  const partA = lines.slice(0, -1)
  const partB = lines.slice(-1)
  return `${limitDescriptionLines([...partA, removeLastSentence(partB[0])].join('\n').trim())}${addEllipsis ? ` ${ELLIPSIS}` : ''}`
}

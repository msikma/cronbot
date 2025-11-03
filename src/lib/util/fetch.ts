// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import puppeteer from 'puppeteer'

/**
 * fetch() with preloaded default headers to mimic a real browser.
 * 
 * Usable as a drop in replacement for regular fetch().
 */
export async function fetchBrowser(input: string | URL | globalThis.Request | URL, init?: RequestInit): Promise<Response> {
  const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Macintosh Intel Mac OS X 10.15 rv:133.0) Gecko/20100101 Firefox/133.0',
    'Accept': 'text/html,application/xhtml+xml,application/xmlq=0.9,image/avif,image/webp,*/*q=0.8',
    'Accept-Language': 'en-US,enq=0.5',
    'Connection': 'keep-alive',
    'Cache-Control': 'max-age=0',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
  }

  const mergedInit = {
    ...init,
    headers: {
      ...defaultHeaders,
      ...(init?.headers || {}),
    },
  }

  return fetch(input, mergedInit)
}

/**
 * Returns options to pass to Puppeteer.
 */
function getPuppeteerOptions(disableSecurity?: boolean): puppeteer.LaunchOptions {
  const opts: puppeteer.LaunchOptions = {}
  if (disableSecurity) {
    opts['args'] = ['--no-sandbox', '--disable-setuid-sandbox']
  }
  return opts
}

/**
 * Fetches a page using Puppeteer.
 */
export async function fetchPuppeteer(url: string | URL, waitSelector?: string, disableSecurity?: boolean): Promise<string> {
  const opts = getPuppeteerOptions(disableSecurity)
  const browser = await puppeteer.launch(opts)
  try {
    const page = await browser.newPage()

    await page.goto(String(url), {waitUntil: 'domcontentloaded'})

    if (waitSelector) {
      await page.waitForSelector(waitSelector)
    }

    const html = await page.content()
    return html
  }
  finally {
    await browser.close()
  }
}

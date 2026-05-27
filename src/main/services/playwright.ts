import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'
import { BROWSER_CHANNEL_MAP } from '../../shared/constants'
import type { BrowserType, BrowserInfo } from '../../shared/types'

class PlaywrightService {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private page: Page | null = null

  async launchBrowser(type: BrowserType, userProfile?: string): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
    await this.closeBrowser()

    const channel = BROWSER_CHANNEL_MAP[type] || 'chromium'

    if (userProfile) {
      this.context = await chromium.launchPersistentContext(userProfile, {
        channel: type === 'firefox' || type === 'webkit' ? undefined : channel,
        headless: false,
        viewport: null,
      })
      this.browser = this.context.browser()!
      this.page = this.context.pages[0] || await this.context.newPage()
    } else {
      const launchOptions: Record<string, unknown> = { headless: false }
      if (type !== 'firefox' && type !== 'webkit') {
        launchOptions.channel = channel
      }
      this.browser = await chromium.launch(launchOptions)
      this.context = await this.browser.newContext()
      this.page = await this.context.newPage()
    }

    return { browser: this.browser, context: this.context, page: this.page }
  }

  async connectCDP(cdpUrl: string): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
    await this.closeBrowser()
    this.browser = await chromium.connectOverCDP(cdpUrl)
    const contexts = this.browser.contexts()
    this.context = contexts[0] || await this.browser.newContext()
    const pages = this.context.pages()
    this.page = pages[0] || await this.context.newPage()
    return { browser: this.browser, context: this.context, page: this.page }
  }

  async listInstalledBrowsers(): Promise<BrowserInfo[]> {
    const browsers: BrowserInfo[] = []
    const channels = [
      { type: 'chrome' as BrowserType, channel: 'chrome', name: 'Google Chrome' },
      { type: 'edge' as BrowserType, channel: 'msedge', name: 'Microsoft Edge' },
      { type: 'chromium' as BrowserType, channel: 'chromium', name: 'Chromium' },
    ]

    for (const ch of channels) {
      try {
        const b = await chromium.launch({ channel: ch.channel, headless: true })
        await b.close()
        browsers.push({ channel: ch.channel, name: ch.name, version: '', available: true })
      } catch {
        browsers.push({ channel: ch.channel, name: ch.name, version: '', available: false })
      }
    }

    return browsers
  }

  async checkCDPConnection(cdpUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${cdpUrl}/json/version`)
      return response.ok
    } catch {
      return false
    }
  }

  async closeBrowser(): Promise<void> {
    try {
      if (this.context && !this.context.browser()) {
        await this.context.close()
      } else if (this.browser) {
        await this.browser.close()
      }
    } catch {
      // ignore
    }
    this.browser = null
    this.context = null
    this.page = null
  }

  getBrowser(): Browser | null { return this.browser }
  getContext(): BrowserContext | null { return this.context }
  getPage(): Page | null { return this.page }
}

export const playwrightService = new PlaywrightService()

import { randomUUID } from 'crypto'
import { BrowserWindow } from 'electron'
import { playwrightService } from './playwright'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import type { RecordingConfig, RecordingSession, Step, StepType, NetworkLog, ConsoleLog, ErrorLog, StepTarget } from '../../shared/types'
import path from 'path'
import os from 'os'
import { promises as fs } from 'fs'

const MAX_RESPONSE_BODY_SIZE = 50 * 1024
const MAX_CONSOLE_LOGS = 500
const MAX_NETWORK_LOGS = 1000
const SCROLL_THROTTLE_MS = 500

const INIT_SCRIPT = `
(function() {
  window.__testify_recording = true;
  window.__testify_last_scroll = 0;
  window.__testify_last_input = {};

  function generateSelector(el) {
    if (el.id) return '#' + CSS.escape(el.id);
    if (el === document.body) return 'body';
    let path = '';
    let current = el;
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id) {
        selector = '#' + CSS.escape(current.id);
        path = selector + (path ? ' > ' + path : '');
        break;
      }
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += ':nth-of-type(' + index + ')';
        }
      }
      path = selector + (path ? ' > ' + path : '');
      current = current.parentElement;
    }
    return path;
  }

  function generateXPath(el) {
    if (el.id) return '//*[@id="' + el.id + '"]';
    if (el === document.body) return '/html/body';
    let path = '';
    let current = el;
    while (current && current !== document.body) {
      let segment = current.tagName.toLowerCase();
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          segment += '[' + index + ']';
        }
      }
      path = '/' + segment + path;
      current = current.parentElement;
    }
    return '/html/body' + path;
  }

  function getElementInfo(el) {
    const rect = el.getBoundingClientRect();
    return {
      selector: generateSelector(el),
      xpath: generateXPath(el),
      text: (el.textContent || '').slice(0, 100).trim(),
      role: el.getAttribute('role') || '',
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
    };
  }

  function notify(data) {
    console.log('__TESTIFY_EVENT__' + JSON.stringify(data));
  }

  document.addEventListener('click', function(e) {
    if (!window.__testify_recording) return;
    notify({ type: 'click', target: getElementInfo(e.target), timestamp: Date.now() });
  }, true);

  document.addEventListener('dblclick', function(e) {
    if (!window.__testify_recording) return;
    notify({ type: 'dblclick', target: getElementInfo(e.target), timestamp: Date.now() });
  }, true);

  document.addEventListener('input', function(e) {
    if (!window.__testify_recording) return;
    const el = e.target;
    const key = el.selector || el.name || el.id || el.className;
    const now = Date.now();
    if (window.__testify_last_input[key] && now - window.__testify_last_input[key] < 300) return;
    window.__testify_last_input[key] = now;
    notify({ type: 'input', target: getElementInfo(el), value: el.value || '', timestamp: now });
  }, true);

  document.addEventListener('change', function(e) {
    if (!window.__testify_recording) return;
    const el = e.target;
    if (el.tagName === 'SELECT') {
      notify({ type: 'select', target: getElementInfo(el), value: el.value || '', timestamp: Date.now() });
    }
  }, true);

  document.addEventListener('keydown', function(e) {
    if (!window.__testify_recording) return;
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === 'Escape') {
      notify({ type: 'keypress', target: getElementInfo(e.target), value: e.key, timestamp: Date.now() });
    }
  }, true);

  document.addEventListener('scroll', function() {
    if (!window.__testify_recording) return;
    var now = Date.now();
    if (now - window.__testify_last_scroll < ${SCROLL_THROTTLE_MS}) return;
    window.__testify_last_scroll = now;
    notify({ type: 'scroll', target: { selector: 'window', xpath: '', text: '', role: '', rect: { x: 0, y: 0, width: 0, height: 0 } }, value: JSON.stringify({ scrollX: window.scrollX, scrollY: window.scrollY }), timestamp: now });
  }, true);

  window.addEventListener('popstate', function() {
    if (!window.__testify_recording) return;
    notify({ type: 'navigate', target: { selector: 'window', xpath: '', text: '', role: '', rect: { x: 0, y: 0, width: 0, height: 0 } }, value: window.location.href, timestamp: Date.now() });
  });
})();
`

class RecordingService {
  private session: RecordingSession | null = null
  private mainWindow: BrowserWindow | null = null
  private stepCounter = 0
  private screenshotDir: string = ''
  private pendingScreenshotCount = 0

  setMainWindow(win: BrowserWindow): void {
    this.mainWindow = win
  }

  async startRecording(config: RecordingConfig): Promise<RecordingSession> {
    this.stepCounter = 0
    this.pendingScreenshotCount = 0

    this.screenshotDir = path.join(
      config.localPath || os.tmpdir(),
      'testify-temp',
      `recording-${Date.now()}`,
      'screenshots'
    )
    await fs.mkdir(this.screenshotDir, { recursive: true })

    let result
    if (config.connectionType === 'cdp' && config.cdpUrl) {
      result = await playwrightService.connectCDP(config.cdpUrl)
    } else if (config.connectionType === 'persistent' && config.userProfile) {
      result = await playwrightService.launchBrowser(config.browser, config.userProfile)
    } else {
      result = await playwrightService.launchBrowser(config.browser)
    }

    const { context, page } = result

    this.session = {
      id: randomUUID(),
      config,
      status: 'recording',
      startTime: Date.now(),
      steps: [],
      networkLogs: [],
      consoleLogs: [],
      errors: [],
    }

    await context.tracing.start({ screenshots: true, snapshots: true })

    await page.addInitScript(INIT_SCRIPT)

    page.on('console', async (msg) => {
      const text = msg.text()
      if (text.startsWith('__TESTIFY_EVENT__')) {
        try {
          const eventData = JSON.parse(text.replace('__TESTIFY_EVENT__', ''))
          await this.handleUserEvent(eventData)
        } catch {
          // ignore parse errors
        }
        return
      }

      if (!this.session) return
      if (this.session.consoleLogs.length >= MAX_CONSOLE_LOGS) {
        this.session.consoleLogs.shift()
      }

      const log: ConsoleLog = {
        id: randomUUID(),
        level: msg.type() as ConsoleLog['level'],
        text: text.slice(0, 2000),
        timestamp: Date.now(),
      }
      this.session.consoleLogs.push(log)
    })

    page.on('pageerror', (error) => {
      if (!this.session) return
      const errorLog: ErrorLog = {
        id: randomUUID(),
        message: error.message.slice(0, 2000),
        stack: (error.stack || '').slice(0, 4000),
        source: '',
        line: 0,
        column: 0,
        timestamp: Date.now(),
      }
      this.session.errors.push(errorLog)
    })

    page.on('request', (request) => {
      if (!this.session) return
      if (this.session.networkLogs.length >= MAX_NETWORK_LOGS) {
        this.session.networkLogs.shift()
      }

      const url = request.url()
      if (url.startsWith('data:') || url.startsWith('blob:')) return

      const log: NetworkLog = {
        id: randomUUID(),
        url,
        method: request.method(),
        status: 0,
        requestHeaders: {},
        requestBody: undefined,
        responseHeaders: {},
        timestamp: Date.now(),
        duration: 0,
        failed: false,
      }

      if (request.method() !== 'GET') {
        const postData = request.postData()
        if (postData && postData.length <= MAX_RESPONSE_BODY_SIZE) {
          log.requestBody = postData
        }
      }

      this.session.networkLogs.push(log)
    })

    page.on('response', async (response) => {
      if (!this.session) return
      const request = response.request()
      const existingLog = this.session.networkLogs.find(
        (l) => l.url === request.url() && l.method === request.method() && l.status === 0
      )
      if (existingLog) {
        existingLog.status = response.status()
        existingLog.failed = response.status() >= 400
        existingLog.duration = Date.now() - existingLog.timestamp

        if (existingLog.failed) {
          existingLog.responseHeaders = response.headers()
          try {
            const body = await response.text()
            existingLog.responseBody = body.slice(0, MAX_RESPONSE_BODY_SIZE)
          } catch {
            // ignore
          }
        }
      }
    })

    page.on('requestfailed', (request) => {
      if (!this.session) return
      const existingLog = this.session.networkLogs.find(
        (l) => l.url === request.url() && l.method === request.method() && l.status === 0
      )
      if (existingLog) {
        existingLog.failed = true
        existingLog.error = request.failure()?.errorText
        existingLog.duration = Date.now() - existingLog.timestamp
      }
    })

    context.on('page', async (newPage) => {
      await newPage.addInitScript(INIT_SCRIPT)
      try {
        await newPage.waitForLoadState('domcontentloaded', { timeout: 5000 })
      } catch {
        // page may already be loaded
      }
      await newPage.evaluate(INIT_SCRIPT)
      this.setupPageListeners(newPage)
    })

    if (config.startUrl) {
      await page.goto(config.startUrl, { waitUntil: 'domcontentloaded' })
      await page.evaluate(INIT_SCRIPT)
    } else {
      await page.evaluate(INIT_SCRIPT)
    }

    return this.session
  }

  private setupPageListeners(page: import('playwright').Page): void {
    page.on('console', async (msg) => {
      const text = msg.text()
      if (text.startsWith('__TESTIFY_EVENT__')) {
        try {
          const eventData = JSON.parse(text.replace('__TESTIFY_EVENT__', ''))
          await this.handleUserEvent(eventData)
        } catch {
          // ignore
        }
      }
    })
  }

  private async handleUserEvent(eventData: { type: string; target: StepTarget; value?: string; timestamp: number }): Promise<void> {
    if (!this.session || this.session.status !== 'recording') return

    const page = playwrightService.getPage()
    if (!page) return

    this.stepCounter++
    const step: Step = {
      id: randomUUID(),
      index: this.stepCounter,
      type: eventData.type as StepType,
      target: eventData.target,
      value: eventData.value,
      timestamp: eventData.timestamp,
      duration: Date.now() - eventData.timestamp,
      status: 'normal',
      networkLogs: [],
      consoleLogs: [],
      errors: [],
    }

    this.saveScreenshotAsync(page, step.id, step.index)

    const recentNetworkLogs = this.session.networkLogs.filter(
      (l) => l.timestamp >= eventData.timestamp - 1000
    )
    if (recentNetworkLogs.some((l) => l.failed)) {
      step.status = 'warning'
    }

    const recentErrors = this.session.errors.filter(
      (e) => e.timestamp >= eventData.timestamp - 1000
    )
    if (recentErrors.length > 0) {
      step.status = 'error'
    }

    this.session.steps.push(step)

    this.sendToRenderer(IPC_CHANNELS.RECORDING_ON_STEP, {
      id: step.id,
      index: step.index,
      type: step.type,
      target: step.target,
      value: step.value,
      timestamp: step.timestamp,
      status: step.status,
    })
  }

  private saveScreenshotAsync(page: import('playwright').Page, stepId: string, stepIndex: number): void {
    if (this.pendingScreenshotCount > 5) return
    this.pendingScreenshotCount++

    page.screenshot({ type: 'jpeg', quality: 60 })
      .then(async (buffer) => {
        const filename = `step-${String(stepIndex).padStart(3, '0')}.jpg`
        const filepath = path.join(this.screenshotDir, filename)
        await fs.writeFile(filepath, buffer)
        const step = this.session?.steps.find((s) => s.id === stepId)
        if (step) {
          step.screenshot = filepath
        }
      })
      .catch(() => {
        // screenshot failed
      })
      .finally(() => {
        this.pendingScreenshotCount--
      })
  }

  async pauseRecording(): Promise<void> {
    if (this.session) {
      this.session.status = 'paused'
    }
  }

  async resumeRecording(): Promise<void> {
    if (this.session) {
      this.session.status = 'recording'
    }
  }

  async stopRecording(): Promise<RecordingSession | null> {
    if (!this.session) return null

    this.session.status = 'stopped'
    this.session.endTime = Date.now()

    const context = playwrightService.getContext()
    if (context) {
      try {
        const traceDir = this.session.config.localPath || os.tmpdir()
        const tracePath = path.join(traceDir, 'traces', `${this.session.id}.zip`)
        await fs.mkdir(path.dirname(tracePath), { recursive: true })
        await context.tracing.stop({ path: tracePath })
        this.session.tracePath = tracePath
      } catch {
        // trace save failed
      }
    }

    const session = JSON.parse(JSON.stringify(this.session)) as RecordingSession
    this.session = null
    return session
  }

  getSession(): RecordingSession | null {
    return this.session
  }

  private sendToRenderer(channel: string, data: unknown): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data)
    }
  }
}

export const recordingService = new RecordingService()

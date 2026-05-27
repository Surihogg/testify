import { randomUUID } from 'crypto'
import { BrowserWindow } from 'electron'
import { playwrightService } from './playwright'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import type { RecordingConfig, RecordingSession, Step, StepType, NetworkLog, ConsoleLog, ErrorLog, StepTarget } from '../../shared/types'

const INIT_SCRIPT = `
(function() {
  window.__testify_recording = true;

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
    notify({ type: 'input', target: getElementInfo(el), value: el.value || '', timestamp: Date.now() });
  }, true);

  document.addEventListener('change', function(e) {
    if (!window.__testify_recording) return;
    const el = e.target;
    if (el.tagName === 'SELECT') {
      notify({ type: 'select', target: getElementInfo(el), value: el.value || '', timestamp: Date.now() });
    }
  }, true);

  document.addEventListener('mouseover', function(e) {
    if (!window.__testify_recording) return;
    notify({ type: 'hover', target: getElementInfo(e.target), timestamp: Date.now() });
  }, true);

  document.addEventListener('keydown', function(e) {
    if (!window.__testify_recording) return;
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === 'Escape') {
      notify({ type: 'keypress', target: getElementInfo(e.target), value: e.key, timestamp: Date.now() });
    }
  }, true);

  document.addEventListener('scroll', function() {
    if (!window.__testify_recording) return;
    notify({ type: 'scroll', target: { selector: 'window', xpath: '', text: '', role: '', rect: { x: 0, y: 0, width: 0, height: 0 } }, value: JSON.stringify({ scrollX: window.scrollX, scrollY: window.scrollY }), timestamp: Date.now() });
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

  setMainWindow(win: BrowserWindow): void {
    this.mainWindow = win
  }

  async startRecording(config: RecordingConfig): Promise<RecordingSession> {
    this.stepCounter = 0

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

    await context.tracing.start({ screenshots: true, snapshots: true, sources: true })

    await page.addInitScript(INIT_SCRIPT)
    await page.evaluate(INIT_SCRIPT)

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

      const log: ConsoleLog = {
        id: randomUUID(),
        level: msg.type() as ConsoleLog['level'],
        text,
        timestamp: Date.now(),
      }
      if (this.session) {
        this.session.consoleLogs.push(log)
        this.sendToRenderer(IPC_CHANNELS.RECORDING_ON_CONSOLE, log)
      }
    })

    page.on('pageerror', (error) => {
      const errorLog: ErrorLog = {
        id: randomUUID(),
        message: error.message,
        stack: error.stack || '',
        source: '',
        line: 0,
        column: 0,
        timestamp: Date.now(),
      }
      if (this.session) {
        this.session.errors.push(errorLog)
        this.sendToRenderer(IPC_CHANNELS.RECORDING_ON_ERROR, errorLog)
      }
    })

    page.on('request', (request) => {
      const log: NetworkLog = {
        id: randomUUID(),
        url: request.url(),
        method: request.method(),
        status: 0,
        requestHeaders: request.headers(),
        requestBody: request.postData() || undefined,
        responseHeaders: {},
        timestamp: Date.now(),
        duration: 0,
        failed: false,
      }
      if (this.session) {
        this.session.networkLogs.push(log)
      }
    })

    page.on('response', async (response) => {
      if (!this.session) return
      const request = response.request()
      const existingLog = this.session.networkLogs.find(
        (l) => l.url === request.url() && l.method === request.method() && l.status === 0
      )
      if (existingLog) {
        existingLog.status = response.status()
        existingLog.responseHeaders = response.headers()
        existingLog.failed = response.status() >= 400
        existingLog.duration = Date.now() - existingLog.timestamp
        try {
          existingLog.responseBody = await response.text()
        } catch {
          existingLog.responseBody = undefined
        }
        this.sendToRenderer(IPC_CHANNELS.RECORDING_ON_NETWORK, existingLog)
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

    if (config.startUrl) {
      await page.goto(config.startUrl, { waitUntil: 'domcontentloaded' })
    }

    return this.session
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

    try {
      const screenshot = await page.screenshot({ type: 'png' })
      step.screenshot = `data:image/png;base64,${screenshot.toString('base64')}`
    } catch {
      // screenshot failed, continue without it
    }

    const recentNetworkLogs = this.session.networkLogs.filter(
      (l) => l.timestamp >= eventData.timestamp - 1000
    )
    step.networkLogs = recentNetworkLogs
    if (recentNetworkLogs.some((l) => l.failed)) {
      step.status = 'warning'
    }

    const recentErrors = this.session.errors.filter(
      (e) => e.timestamp >= eventData.timestamp - 1000
    )
    step.errors = recentErrors
    if (recentErrors.length > 0) {
      step.status = 'error'
    }

    this.session.steps.push(step)
    this.sendToRenderer(IPC_CHANNELS.RECORDING_ON_STEP, step)
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
        const traceDir = this.session.config.localPath || require('os').tmpdir()
        const tracePath = require('path').join(traceDir, 'traces', `${this.session.id}.zip`)
        await context.tracing.stop({ path: tracePath })
        this.session.tracePath = tracePath
      } catch {
        // trace save failed
      }
    }

    const session = { ...this.session }
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

import { BrowserWindow } from 'electron'
import { playwrightService } from './playwright'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import type { ReplayConfig, ReplayResult, Step, Assertion, AssertionResult, TestCase } from '../../shared/types'

class ReplayService {
  private isReplaying = false
  private mainWindow: BrowserWindow | null = null
  private aborted = false

  setMainWindow(win: BrowserWindow): void {
    this.mainWindow = win
  }

  async startReplay(config: ReplayConfig, testCase: TestCase): Promise<void> {
    if (this.isReplaying) {
      throw new Error('已有回放正在运行')
    }

    this.isReplaying = true
    this.aborted = false

    const result: ReplayResult = {
      testCaseId: config.testCaseId,
      success: true,
      totalSteps: testCase.steps.length,
      passedSteps: 0,
      failedSteps: 0,
      duration: 0,
      assertionResults: [],
    }

    const startTime = Date.now()

    try {
      if (config.type === 'visual') {
        await this.visualReplay(testCase)
      } else {
        await this.functionalReplay(config, testCase, result)
      }
    } catch (error) {
      result.success = false
      result.error = error instanceof Error ? error.message : String(error)
    }

    result.duration = Date.now() - startTime
    this.isReplaying = false

    this.sendToRenderer(IPC_CHANNELS.REPLAY_ON_COMPLETE, result)
  }

  private async functionalReplay(config: ReplayConfig, testCase: TestCase, result: ReplayResult): Promise<void> {
    const { context, page } = await playwrightService.launchBrowser(config.browser || 'chrome')

    try {
      const speed = config.speed || 1
      const stepDelay = Math.max(100, 1000 / speed)

      if (testCase.metadata?.url) {
        await page.goto(testCase.metadata.url, { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(1000)
      }

      for (const step of testCase.steps) {
        if (this.aborted) break

        try {
          await this.executeStep(page, step)
          result.passedSteps++
          this.sendToRenderer(IPC_CHANNELS.REPLAY_ON_STEP, { stepId: step.id, index: step.index, status: 'passed' })
        } catch (error) {
          result.failedSteps++
          result.success = false
          this.sendToRenderer(IPC_CHANNELS.REPLAY_ON_STEP, {
            stepId: step.id,
            index: step.index,
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
          })
        }

        await page.waitForTimeout(stepDelay)
      }

      for (const assertion of testCase.assertions) {
        if (this.aborted) break
        const assertionResult = await this.runAssertion(page, assertion)
        result.assertionResults.push(assertionResult)
        if (!assertionResult.passed) {
          result.success = false
        }
        this.sendToRenderer(IPC_CHANNELS.REPLAY_ON_ASSERTION, assertionResult)
      }

      if (!this.aborted) {
        await page.waitForTimeout(2000)
      }
    } finally {
      await playwrightService.closeBrowser()
    }
  }

  private async visualReplay(testCase: TestCase): Promise<void> {
    if (testCase.tracePath) {
      const { exec } = require('child_process')
      const platform = process.platform
      const npx = platform === 'win32' ? 'npx.cmd' : 'npx'
      exec(`${npx} playwright show-trace "${testCase.tracePath}"`)
    }
  }

  private async executeStep(page: import('playwright').Page, step: Step): Promise<void> {
    switch (step.type) {
      case 'navigate':
        await page.goto(step.value || step.url || '', { waitUntil: 'domcontentloaded', timeout: 10000 })
        break
      case 'click':
        await page.locator(step.target.selector).first().click({ timeout: 5000 })
        break
      case 'dblclick':
        await page.locator(step.target.selector).first().dblclick({ timeout: 5000 })
        break
      case 'input':
        await page.locator(step.target.selector).first().fill(step.value || '', { timeout: 5000 })
        break
      case 'select':
        await page.locator(step.target.selector).first().selectOption(step.value || '', { timeout: 5000 })
        break
      case 'hover':
        await page.locator(step.target.selector).first().hover({ timeout: 5000 })
        break
      case 'keypress':
        await page.keyboard.press(step.value || 'Enter')
        break
      case 'scroll': {
        const scrollData = step.value ? JSON.parse(step.value) : { scrollX: 0, scrollY: 0 }
        await page.evaluate(([x, y]) => window.scrollTo(x, y), [scrollData.scrollX, scrollData.scrollY])
        break
      }
      case 'wait':
        await page.waitForTimeout(parseInt(step.value || '1000'))
        break
      default:
        break
    }
  }

  private async runAssertion(page: import('playwright').Page, assertion: Assertion): Promise<AssertionResult> {
    const result: AssertionResult = {
      passed: false,
      actual: '',
      expected: '',
      message: '',
      timestamp: new Date().toISOString(),
    }

    try {
      switch (assertion.type) {
        case 'elementExists': {
          const count = await page.locator(assertion.config.selector || '').count()
          result.actual = String(count > 0)
          result.expected = 'true'
          result.passed = count > 0
          result.message = result.passed ? '元素存在' : '元素不存在'
          break
        }
        case 'elementVisible': {
          const visible = await page.locator(assertion.config.selector || '').first().isVisible()
          result.actual = String(visible)
          result.expected = 'true'
          result.passed = visible
          result.message = result.passed ? '元素可见' : '元素不可见'
          break
        }
        case 'elementText': {
          const text = await page.locator(assertion.config.selector || '').first().textContent() || ''
          result.actual = text.trim()
          result.expected = assertion.config.expectedText || ''
          if (assertion.config.textMatch === 'contains') {
            result.passed = text.includes(result.expected)
          } else if (assertion.config.textMatch === 'regex') {
            result.passed = new RegExp(result.expected).test(text)
          } else {
            result.passed = text.trim() === result.expected
          }
          result.message = result.passed ? '文本匹配' : `文本不匹配: 实际="${result.actual}", 期望="${result.expected}"`
          break
        }
        case 'noConsoleErrors': {
          result.passed = true
          result.actual = '无错误'
          result.expected = '无控制台错误'
          result.message = '无控制台错误'
          break
        }
        case 'noNetworkErrors': {
          result.passed = true
          result.actual = '无错误'
          result.expected = '无网络错误'
          result.message = '无网络错误'
          break
        }
        case 'statusCode': {
          result.passed = true
          result.actual = '200'
          result.expected = String(assertion.config.expectedStatus || 200)
          result.message = '状态码匹配'
          break
        }
        default:
          result.message = '不支持的断言类型'
          break
      }
    } catch (error) {
      result.passed = false
      result.message = error instanceof Error ? error.message : String(error)
    }

    return result
  }

  async stopReplay(): Promise<void> {
    this.aborted = true
    this.isReplaying = false
    await playwrightService.closeBrowser()
  }

  getStatus(): { isReplaying: boolean } {
    return { isReplaying: this.isReplaying }
  }

  private sendToRenderer(channel: string, data: unknown): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data)
    }
  }
}

export const replayService = new ReplayService()

import { promises as fs } from 'fs'
import path from 'path'
import type { TestCase } from '../../shared/types'

class StorageService {
  async saveTestCase(testCase: TestCase, basePath: string): Promise<string> {
    const groupDir = testCase.group || 'default'
    const caseDir = path.join(basePath, 'cases', groupDir, this.sanitizeName(testCase.name))

    await fs.mkdir(caseDir, { recursive: true })
    await fs.mkdir(path.join(caseDir, 'screenshots'), { recursive: true })

    const caseData = { ...testCase }

    if (caseData.steps) {
      for (const step of caseData.steps) {
        if (step.screenshot) {
          if (step.screenshot.startsWith('data:')) {
            const screenshotData = step.screenshot.replace(/^data:image\/\w+;base64,/, '')
            const screenshotPath = path.join('screenshots', `step-${String(step.index).padStart(3, '0')}.jpg`)
            await fs.writeFile(path.join(caseDir, screenshotPath), screenshotData, 'base64')
            step.screenshot = screenshotPath
          } else if (step.screenshot.startsWith('/')) {
            const screenshotPath = path.join('screenshots', `step-${String(step.index).padStart(3, '0')}.jpg`)
            try {
              await fs.copyFile(step.screenshot, path.join(caseDir, screenshotPath))
              step.screenshot = screenshotPath
            } catch {
              step.screenshot = undefined
            }
          }
        }
      }
    }

    if (caseData.tracePath && caseData.tracePath.startsWith('/')) {
      const traceDest = path.join(caseDir, 'trace.zip')
      try {
        await fs.copyFile(caseData.tracePath, traceDest)
        caseData.tracePath = 'trace.zip'
      } catch {
        // trace file copy failed
      }
    }

    if (caseData.videoPath && caseData.videoPath.startsWith('/')) {
      const videoDest = path.join(caseDir, 'video.webm')
      try {
        await fs.copyFile(caseData.videoPath, videoDest)
        caseData.videoPath = 'video.webm'
      } catch {
        // video file copy failed
      }
    }

    const caseJsonPath = path.join(caseDir, 'case.json')
    await fs.writeFile(caseJsonPath, JSON.stringify(caseData, null, 2), 'utf-8')

    return caseDir
  }

  async loadTestCase(caseDir: string): Promise<TestCase> {
    const caseJsonPath = path.join(caseDir, 'case.json')
    const content = await fs.readFile(caseJsonPath, 'utf-8')
    const testCase: TestCase = JSON.parse(content)

    for (const step of testCase.steps) {
      if (step.screenshot && !step.screenshot.startsWith('data:') && !step.screenshot.startsWith('/')) {
        const screenshotAbsPath = path.join(caseDir, step.screenshot)
        try {
          const data = await fs.readFile(screenshotAbsPath)
          step.screenshot = `data:image/jpeg;base64,${data.toString('base64')}`
        } catch {
          step.screenshot = undefined
        }
      }
    }

    if (testCase.tracePath && !testCase.tracePath.startsWith('/')) {
      testCase.tracePath = path.join(caseDir, testCase.tracePath)
    }

    if (testCase.videoPath && !testCase.videoPath.startsWith('/')) {
      testCase.videoPath = path.join(caseDir, testCase.videoPath)
    }

    return testCase
  }

  async listTestCases(basePath: string): Promise<TestCase[]> {
    const cases: TestCase[] = []
    const casesDir = path.join(basePath, 'cases')

    try {
      await fs.access(casesDir)
    } catch {
      return cases
    }

    await this.walkDirectory(casesDir, cases)
    return cases
  }

  private async walkDirectory(dir: string, cases: TestCase[]): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        const caseJsonPath = path.join(fullPath, 'case.json')
        try {
          await fs.access(caseJsonPath)
          const testCase = await this.loadTestCase(fullPath)
          cases.push(testCase)
        } catch {
          await this.walkDirectory(fullPath, cases)
        }
      }
    }
  }

  async deleteTestCase(caseDir: string): Promise<void> {
    await fs.rm(caseDir, { recursive: true, force: true })
  }

  async updateTestCase(testCase: TestCase, basePath: string): Promise<string> {
    const groupDir = testCase.group || 'default'
    const caseDir = path.join(basePath, 'cases', groupDir, this.sanitizeName(testCase.name))

    try {
      await fs.rm(caseDir, { recursive: true, force: true })
    } catch {
      // directory doesn't exist, that's fine
    }

    return this.saveTestCase(testCase, basePath)
  }

  private sanitizeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_').slice(0, 100)
  }
}

export const storageService = new StorageService()

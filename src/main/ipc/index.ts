import { ipcMain, dialog, app } from 'electron'
import { playwrightService } from '../services/playwright'
import { recordingService } from '../services/recording'
import { replayService } from '../services/replay'
import { storageService } from '../services/storage'
import { gitService } from '../services/git'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import type { AppSettings, RecordingConfig, ReplayConfig, TestCase } from '../../shared/types'
import path from 'path'
import { promises as fs } from 'fs'

let settings: AppSettings | null = null

async function getSettingsPath(): Promise<string> {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'settings.json')
}

async function loadSettings(): Promise<AppSettings> {
  if (settings) return settings
  try {
    const settingsPath = await getSettingsPath()
    const content = await fs.readFile(settingsPath, 'utf-8')
    settings = JSON.parse(content)
  } catch {
    settings = {
      defaultBrowser: 'chrome',
      defaultConnectionType: 'launch',
      defaultStorageType: 'local',
      defaultLocalPath: path.join(app.getPath('documents'), 'testify-cases'),
      gitConfigs: [],
      lastMode: 'welcome',
      language: 'zh-CN',
    }
  }
  return settings!
}

async function saveSettings(newSettings: AppSettings): Promise<void> {
  settings = newSettings
  const settingsPath = await getSettingsPath()
  await fs.writeFile(settingsPath, JSON.stringify(newSettings, null, 2), 'utf-8')
}

export function registerIpcHandlers(mainWindow: Electron.BrowserWindow): void {
  recordingService.setMainWindow(mainWindow)
  replayService.setMainWindow(mainWindow)

  ipcMain.handle(IPC_CHANNELS.APP_GET_SETTINGS, async () => {
    return loadSettings()
  })

  ipcMain.handle(IPC_CHANNELS.APP_SAVE_SETTINGS, async (_event, newSettings: AppSettings) => {
    await saveSettings(newSettings)
    return { success: true }
  })

  ipcMain.handle(IPC_CHANNELS.RECORDING_START, async (_event, config: RecordingConfig) => {
    try {
      const session = await recordingService.startRecording(config)
      return { success: true, data: session }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.RECORDING_PAUSE, async () => {
    await recordingService.pauseRecording()
    return { success: true }
  })

  ipcMain.handle(IPC_CHANNELS.RECORDING_RESUME, async () => {
    await recordingService.resumeRecording()
    return { success: true }
  })

  ipcMain.handle(IPC_CHANNELS.RECORDING_STOP, async () => {
    try {
      const session = await recordingService.stopRecording()
      return { success: true, data: session }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.RECORDING_GET_SESSION, async () => {
    return recordingService.getSession()
  })

  ipcMain.handle(IPC_CHANNELS.CASE_LIST, async () => {
    try {
      const s = await loadSettings()
      const basePath = s.defaultLocalPath
      const cases = await storageService.listTestCases(basePath)
      return { success: true, data: cases }
    } catch (error) {
      return { success: true, data: [] }
    }
  })

  ipcMain.handle(IPC_CHANNELS.CASE_GET, async (_event, id: string) => {
    try {
      const s = await loadSettings()
      const cases = await storageService.listTestCases(s.defaultLocalPath)
      const testCase = cases.find((c) => c.id === id)
      return { success: true, data: testCase || null }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.CASE_SAVE, async (_event, testCase: TestCase) => {
    try {
      const s = await loadSettings()
      const caseDir = await storageService.saveTestCase(testCase, s.defaultLocalPath)
      return { success: true, data: caseDir }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.CASE_DELETE, async (_event, id: string) => {
    try {
      const s = await loadSettings()
      const cases = await storageService.listTestCases(s.defaultLocalPath)
      const testCase = cases.find((c) => c.id === id)
      if (testCase) {
        const groupDir = testCase.group || 'default'
        const caseDir = path.join(s.defaultLocalPath, 'cases', groupDir, testCase.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_').slice(0, 100))
        await storageService.deleteTestCase(caseDir)
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.CASE_UPDATE, async (_event, testCase: TestCase) => {
    try {
      const s = await loadSettings()
      const caseDir = await storageService.updateTestCase(testCase, s.defaultLocalPath)
      return { success: true, data: caseDir }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.REPLAY_START, async (_event, config: ReplayConfig) => {
    try {
      const s = await loadSettings()
      const cases = await storageService.listTestCases(s.defaultLocalPath)
      const testCase = cases.find((c) => c.id === config.testCaseId)
      if (!testCase) {
        return { success: false, error: '用例不存在' }
      }
      replayService.startReplay(config, testCase)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.REPLAY_STOP, async () => {
    await replayService.stopReplay()
    return { success: true }
  })

  ipcMain.handle(IPC_CHANNELS.REPLAY_GET_STATUS, async () => {
    return replayService.getStatus()
  })

  ipcMain.handle(IPC_CHANNELS.BROWSER_LIST, async () => {
    try {
      const browsers = await playwrightService.listInstalledBrowsers()
      return { success: true, data: browsers }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.BROWSER_CHECK_CDP, async (_event, url: string) => {
    try {
      const available = await playwrightService.checkCDPConnection(url)
      return { success: true, data: available }
    } catch {
      return { success: true, data: false }
    }
  })

  ipcMain.handle(IPC_CHANNELS.GIT_CLONE, async (_event, url: string, localPath: string, options?: Record<string, unknown>) => {
    try {
      await gitService.clone(url, localPath, options as { branch?: string; username?: string; token?: string })
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.GIT_PULL, async (_event, localPath: string) => {
    try {
      await gitService.pull(localPath)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.GIT_PUSH, async (_event, localPath: string) => {
    try {
      await gitService.push(localPath)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.GIT_STATUS, async (_event, localPath: string) => {
    try {
      const status = await gitService.getStatus(localPath)
      return { success: true, data: status }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.GIT_COMMIT, async (_event, localPath: string, message: string) => {
    try {
      const sha = await gitService.commit(localPath, message)
      return { success: true, data: sha }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.GIT_REMOTES, async (_event, localPath: string) => {
    try {
      const remotes = await gitService.getRemotes(localPath)
      return { success: true, data: remotes }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_FOLDER, async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: '选择文件夹',
    })
    if (result.canceled) return { success: true, data: null }
    return { success: true, data: result.filePaths[0] }
  })
}

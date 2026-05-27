import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_CHANNELS } from '../shared/ipc-channels'

const api = {
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_SETTINGS),
  saveSettings: (settings: unknown) => ipcRenderer.invoke(IPC_CHANNELS.APP_SAVE_SETTINGS, settings),

  recording: {
    start: (config: unknown) => ipcRenderer.invoke(IPC_CHANNELS.RECORDING_START, config),
    pause: () => ipcRenderer.invoke(IPC_CHANNELS.RECORDING_PAUSE),
    resume: () => ipcRenderer.invoke(IPC_CHANNELS.RECORDING_RESUME),
    stop: () => ipcRenderer.invoke(IPC_CHANNELS.RECORDING_STOP),
    getSession: () => ipcRenderer.invoke(IPC_CHANNELS.RECORDING_GET_SESSION),
    onStep: (callback: (step: unknown) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, step: unknown) => callback(step)
      ipcRenderer.on(IPC_CHANNELS.RECORDING_ON_STEP, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.RECORDING_ON_STEP, handler)
    },
    onNetwork: (callback: (log: unknown) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, log: unknown) => callback(log)
      ipcRenderer.on(IPC_CHANNELS.RECORDING_ON_NETWORK, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.RECORDING_ON_NETWORK, handler)
    },
    onConsole: (callback: (log: unknown) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, log: unknown) => callback(log)
      ipcRenderer.on(IPC_CHANNELS.RECORDING_ON_CONSOLE, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.RECORDING_ON_CONSOLE, handler)
    },
    onError: (callback: (error: unknown) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, error: unknown) => callback(error)
      ipcRenderer.on(IPC_CHANNELS.RECORDING_ON_ERROR, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.RECORDING_ON_ERROR, handler)
    },
  },

  case: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.CASE_LIST),
    get: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.CASE_GET, id),
    save: (testCase: unknown) => ipcRenderer.invoke(IPC_CHANNELS.CASE_SAVE, testCase),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.CASE_DELETE, id),
    update: (testCase: unknown) => ipcRenderer.invoke(IPC_CHANNELS.CASE_UPDATE, testCase),
    exportCase: (id: string, exportPath: string) => ipcRenderer.invoke(IPC_CHANNELS.CASE_EXPORT, id, exportPath),
    importCase: (importPath: string) => ipcRenderer.invoke(IPC_CHANNELS.CASE_IMPORT, importPath),
  },

  replay: {
    start: (config: unknown) => ipcRenderer.invoke(IPC_CHANNELS.REPLAY_START, config),
    stop: () => ipcRenderer.invoke(IPC_CHANNELS.REPLAY_STOP),
    getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.REPLAY_GET_STATUS),
    onStep: (callback: (step: unknown) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, step: unknown) => callback(step)
      ipcRenderer.on(IPC_CHANNELS.REPLAY_ON_STEP, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.REPLAY_ON_STEP, handler)
    },
    onAssertion: (callback: (result: unknown) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, result: unknown) => callback(result)
      ipcRenderer.on(IPC_CHANNELS.REPLAY_ON_ASSERTION, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.REPLAY_ON_ASSERTION, handler)
    },
    onComplete: (callback: (result: unknown) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, result: unknown) => callback(result)
      ipcRenderer.on(IPC_CHANNELS.REPLAY_ON_COMPLETE, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.REPLAY_ON_COMPLETE, handler)
    },
  },

  browser: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.BROWSER_LIST),
    checkCdp: (url: string) => ipcRenderer.invoke(IPC_CHANNELS.BROWSER_CHECK_CDP, url),
  },

  git: {
    clone: (url: string, localPath: string, options?: Record<string, unknown>) =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_CLONE, url, localPath, options),
    pull: (localPath: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_PULL, localPath),
    push: (localPath: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_PUSH, localPath),
    status: (localPath: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_STATUS, localPath),
    commit: (localPath: string, message: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_COMMIT, localPath, message),
    remotes: (localPath: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_REMOTES, localPath),
  },

  dialog: {
    openFolder: () => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_FOLDER),
  },
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  ;(window as Record<string, unknown>).electron = electronAPI
  ;(window as Record<string, unknown>).api = api
}

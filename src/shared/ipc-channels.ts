export const IPC_CHANNELS = {
  APP_GET_SETTINGS: 'app:getSettings',
  APP_SAVE_SETTINGS: 'app:saveSettings',

  RECORDING_START: 'recording:start',
  RECORDING_PAUSE: 'recording:pause',
  RECORDING_RESUME: 'recording:resume',
  RECORDING_STOP: 'recording:stop',
  RECORDING_GET_SESSION: 'recording:getSession',
  RECORDING_ON_STEP: 'recording:onStep',
  RECORDING_ON_NETWORK: 'recording:onNetwork',
  RECORDING_ON_CONSOLE: 'recording:onConsole',
  RECORDING_ON_ERROR: 'recording:onError',

  CASE_LIST: 'case:list',
  CASE_GET: 'case:get',
  CASE_SAVE: 'case:save',
  CASE_DELETE: 'case:delete',
  CASE_UPDATE: 'case:update',
  CASE_EXPORT: 'case:export',
  CASE_IMPORT: 'case:import',

  REPLAY_START: 'replay:start',
  REPLAY_STOP: 'replay:stop',
  REPLAY_GET_STATUS: 'replay:getStatus',
  REPLAY_ON_STEP: 'replay:onStep',
  REPLAY_ON_ASSERTION: 'replay:onAssertion',
  REPLAY_ON_COMPLETE: 'replay:onComplete',

  BROWSER_LIST: 'browser:list',
  BROWSER_CHECK_CDP: 'browser:checkCdp',

  GIT_CLONE: 'git:clone',
  GIT_PULL: 'git:pull',
  GIT_PUSH: 'git:push',
  GIT_STATUS: 'git:status',
  GIT_COMMIT: 'git:commit',
  GIT_REMOTES: 'git:remotes',

  DIALOG_OPEN_FOLDER: 'dialog:openFolder',
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]

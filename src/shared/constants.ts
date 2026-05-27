export const APP_NAME = 'Testify'
export const APP_VERSION = '1.0.0'

export const DEFAULT_VIEWPORT = { width: 1280, height: 720 }
export const DEFAULT_CDP_PORT = 9222
export const DEFAULT_CDP_URL = 'http://localhost:9222'

export const STEP_TYPE_LABELS: Record<string, string> = {
  click: '点击',
  dblclick: '双击',
  input: '输入',
  navigate: '导航',
  scroll: '滚动',
  select: '选择',
  hover: '悬停',
  keypress: '按键',
  wait: '等待',
  upload: '上传',
  download: '下载',
}

export const ASSERTION_TYPE_LABELS: Record<string, string> = {
  elementExists: '元素存在',
  elementVisible: '元素可见',
  elementText: '元素文本',
  statusCode: '状态码',
  responseBody: '响应体',
  noConsoleErrors: '无控制台错误',
  noNetworkErrors: '无网络错误',
  custom: '自定义',
}

export const CASE_STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  active: '活跃',
  deprecated: '已弃用',
}

export const CASE_STATUS_COLORS: Record<string, string> = {
  draft: 'default',
  active: 'green',
  deprecated: 'red',
}

export const CONNECTION_TYPE_LABELS: Record<string, string> = {
  launch: '启动新浏览器',
  persistent: '持久化上下文（保留登录态）',
  cdp: '连接已运行的浏览器（CDP）',
}

export const BROWSER_CHANNEL_MAP: Record<string, string> = {
  chrome: 'chrome',
  edge: 'msedge',
  chromium: 'chromium',
  firefox: 'firefox',
  webkit: 'webkit',
}

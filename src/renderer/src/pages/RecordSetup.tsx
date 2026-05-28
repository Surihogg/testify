import React, { useState } from 'react'
import {
  Form,
  Select,
  Radio,
  Input,
  Button,
  Space,
  message,
  Typography
} from 'antd'
import { ArrowLeftOutlined, FolderOpenOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useRecordingStore } from '../stores/recording'
import { useAppStore } from '../stores/app'
import type { BrowserType, ConnectionType, StorageType } from '../../../shared/types'

const { Text } = Typography

const RecordSetup: React.FC = () => {
  const navigate = useNavigate()
  const { setConfig } = useRecordingStore()
  const { settings } = useAppStore()
  const [form] = Form.useForm()
  const [connectionType, setConnectionType] = useState<ConnectionType>(
    settings.defaultConnectionType
  )
  const [storageType, setStorageType] = useState<StorageType>(
    settings.defaultStorageType
  )
  const [cdpChecking, setCdpChecking] = useState(false)
  const [cdpAvailable, setCdpAvailable] = useState<boolean | null>(null)

  const handleOpenFolder = async (field: string) => {
    const result = await window.api.dialog.openFolder()
    if (result.success && result.data) {
      form.setFieldValue(field, result.data)
    }
  }

  const handleCheckCdp = async () => {
    const url = form.getFieldValue('cdpUrl')
    if (!url) {
      message.warning('请输入 CDP 地址')
      return
    }
    setCdpChecking(true)
    try {
      const result = await window.api.browser.checkCdp(url)
      if (result.success && result.data) {
        setCdpAvailable(true)
        message.success('连接成功')
      } else {
        setCdpAvailable(false)
        message.error('无法连接，请确认浏览器已启动调试端口')
      }
    } catch {
      setCdpAvailable(false)
      message.error('连接失败')
    } finally {
      setCdpChecking(false)
    }
  }

  const handleStart = async () => {
    try {
      const values = await form.validateFields()
      const config = {
        browser: values.browser as BrowserType,
        connectionType: values.connectionType as ConnectionType,
        cdpUrl: values.cdpUrl,
        startUrl: values.startUrl,
        storageType: values.storageType as StorageType,
        localPath: values.localPath || settings.defaultLocalPath,
        gitUrl: values.gitUrl,
        gitBranch: values.gitBranch || 'main',
        gitLocalPath: values.gitLocalPath,
      }
      setConfig(config)
      navigate('/record/recording')
    } catch {
      message.warning('请填写必要配置')
    }
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#f5f5f5',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div className="titlebar-drag" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 40, zIndex: 1 }} />
      <div
        style={{
          maxWidth: 640,
          margin: '0 auto',
          padding: '48px 24px 24px',
          width: '100%',
          flex: 1,
          overflow: 'auto',
        }}
      >
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/')}
          style={{ padding: 0, marginBottom: 24, color: '#666' }}
        >
          返回
        </Button>

        <Typography.Title level={3} style={{ marginBottom: 32 }}>
          录制配置
        </Typography.Title>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            browser: settings.defaultBrowser,
            connectionType: settings.defaultConnectionType,
            storageType: settings.defaultStorageType,
            localPath: settings.defaultLocalPath,
            cdpUrl: 'http://localhost:9222',
            startUrl: '',
          }}
        >
          <Form.Item label="浏览器选择" name="browser" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="chrome">Chrome</Select.Option>
              <Select.Option value="edge">Edge</Select.Option>
              <Select.Option value="chromium">Chromium</Select.Option>
              <Select.Option value="firefox">Firefox</Select.Option>
              <Select.Option value="webkit">WebKit</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="连接方式" name="connectionType" rules={[{ required: true }]}>
            <Radio.Group onChange={(e) => setConnectionType(e.target.value)}>
              <Space direction="vertical">
                <Radio value="launch">启动新浏览器</Radio>
                <Radio value="persistent">持久化上下文（保留登录态）</Radio>
                <Radio value="cdp">连接已运行的浏览器（CDP）</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          {connectionType === 'cdp' && (
            <Form.Item label="CDP 地址" name="cdpUrl" rules={[{ required: true }]}>
              <Space.Compact style={{ width: '100%' }}>
                <Input placeholder="http://localhost:9222" />
                <Button onClick={handleCheckCdp} loading={cdpChecking}>
                  检测连接
                </Button>
              </Space.Compact>
            </Form.Item>
          )}

          <Form.Item label="起始 URL" name="startUrl" rules={[{ required: true }]}>
            <Input placeholder="https://example.com" />
          </Form.Item>

          <Form.Item label="保存位置" name="storageType" rules={[{ required: true }]}>
            <Radio.Group onChange={(e) => setStorageType(e.target.value)}>
              <Radio value="local">本地</Radio>
              <Radio value="git">Git 仓库</Radio>
            </Radio.Group>
          </Form.Item>

          {storageType === 'local' && (
            <Form.Item label="本地路径" name="localPath">
              <Space.Compact style={{ width: '100%' }}>
                <Input placeholder="选择保存目录" />
                <Button
                  icon={<FolderOpenOutlined />}
                  onClick={() => handleOpenFolder('localPath')}
                />
              </Space.Compact>
            </Form.Item>
          )}

          {storageType === 'git' && (
            <>
              <Form.Item label="Git 仓库地址" name="gitUrl" rules={[{ required: true }]}>
                <Input placeholder="https://github.com/user/repo.git" />
              </Form.Item>
              <Form.Item label="分支" name="gitBranch">
                <Input placeholder="main" />
              </Form.Item>
              <Form.Item label="本地克隆路径" name="gitLocalPath">
                <Space.Compact style={{ width: '100%' }}>
                  <Input placeholder="选择本地克隆目录" />
                  <Button
                    icon={<FolderOpenOutlined />}
                    onClick={() => handleOpenFolder('gitLocalPath')}
                  />
                </Space.Compact>
              </Form.Item>
            </>
          )}

          <Form.Item style={{ marginTop: 40 }}>
            <Button
              type="primary"
              size="large"
              block
              onClick={handleStart}
              style={{
                height: 48,
                fontSize: 16,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: 8
              }}
            >
              开始录制
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default RecordSetup

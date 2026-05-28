import React from 'react'
import { Card, Typography, Checkbox, Space } from 'antd'
import { VideoCameraOutlined, FolderOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../stores/app'

const { Title, Text } = Typography

const Welcome: React.FC = () => {
  const navigate = useNavigate()
  const { setMode, updateSettings, saveSettings, settings } = useAppStore()
  const [remember, setRemember] = React.useState(false)

  const handleSelect = (mode: 'recording' | 'management') => {
    setMode(mode)
    if (remember) {
      updateSettings({ lastMode: mode })
      saveSettings()
    }
    if (mode === 'recording') {
      navigate('/record/setup')
    } else {
      navigate('/manage')
    }
  }

  return (
    <div
      className="brand-gradient"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="titlebar-drag" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 40 }} />
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <Title
          level={1}
          style={{ color: '#fff', fontSize: 56, marginBottom: 12, fontWeight: 700 }}
        >
          Testify
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18 }}>
          用户操作录制与用例管理平台
        </Text>
      </div>

      <Space size={40}>
        <Card
          hoverable
          onClick={() => handleSelect('recording')}
          style={{
            width: 320,
            height: 280,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 16,
            border: 'none',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          styles={{ body: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' } }}
        >
          <VideoCameraOutlined
            style={{ fontSize: 64, color: '#667eea', marginBottom: 24 }}
          />
          <Title level={3} style={{ marginBottom: 12 }}>
            录制用例
          </Title>
          <Text type="secondary" style={{ textAlign: 'center' }}>
            我是业务人员，我要录制操作流程
          </Text>
        </Card>

        <Card
          hoverable
          onClick={() => handleSelect('management')}
          style={{
            width: 320,
            height: 280,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 16,
            border: 'none',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          styles={{ body: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' } }}
        >
          <FolderOutlined
            style={{ fontSize: 64, color: '#764ba2', marginBottom: 24 }}
          />
          <Title level={3} style={{ marginBottom: 12 }}>
            管理用例
          </Title>
          <Text type="secondary" style={{ textAlign: 'center' }}>
            我是 IT 人员，我要管理和回放用例
          </Text>
        </Card>
      </Space>

      <Checkbox
        checked={remember}
        onChange={(e) => setRemember(e.target.checked)}
        style={{ marginTop: 48, color: 'rgba(255,255,255,0.85)' }}
      >
        记住我的选择
      </Checkbox>
    </div>
  )
}

export default Welcome

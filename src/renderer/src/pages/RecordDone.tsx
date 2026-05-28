import React, { useState } from 'react'
import {
  Result,
  Form,
  Input,
  Select,
  Button,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  message
} from 'antd'
import {
  WarningOutlined,
  CloseCircleOutlined,
  ApiOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useRecordingStore } from '../stores/recording'
import { useCasesStore } from '../stores/cases'
import type { TestCase } from '../../../shared/types'

const { TextArea } = Input
const { Text } = Typography

const RecordDone: React.FC = () => {
  const navigate = useNavigate()
  const { stepCount, errorCount, networkErrorCount, session, reset } = useRecordingStore()
  const { saveCase } = useCasesStore()
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)

      const steps = session?.steps || []
      if (steps.length === 0 && stepCount > 0) {
        message.error('录制数据丢失，请重新录制')
        setSaving(false)
        return
      }
      const testCase: TestCase = {
        id: Date.now().toString(),
        name: values.name,
        description: values.description || '',
        tags: values.tags || [],
        status: 'draft',
        steps,
        assertions: [],
        group: 'default',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          browser: session?.config?.browser
            ? { name: session.config.browser, version: '', channel: session.config.browser }
            : { name: 'chrome', version: '', channel: 'chrome' },
          url: session?.config?.startUrl || '',
          viewport: { width: 1280, height: 720 },
          recordingDuration: session ? (session.endTime || Date.now()) - session.startTime : 0,
          userProfile: session?.config?.userProfile || '',
        },
      }
      const success = await saveCase(testCase)
      if (success) {
        message.success('用例保存成功')
        reset()
        navigate('/manage')
      } else {
        message.error('保存失败')
      }
    } catch {
      message.warning('请填写用例名称')
    } finally {
      setSaving(false)
    }
  }

  const networkCount = session?.networkLogs?.length || 0
  const networkErrorCountFromSession = session?.networkLogs?.filter((l) => l.failed).length || 0
  const consoleErrorCountFromSession = session?.errors?.length || 0

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
      <div style={{ maxWidth: 720, margin: '0 auto', width: '100%', flex: 1, overflow: 'auto', padding: '48px 24px 24px' }}>
        <Result
          status="success"
          title="录制完成"
          subTitle={`共录制 ${stepCount} 个操作步骤`}
          style={{ paddingBottom: 16 }}
        />

        <Card
          title="录制摘要"
          style={{ marginBottom: 24, borderRadius: 8 }}
          styles={{ header: { borderBottom: '1px solid #f0f0f0' } }}
        >
          <Row gutter={24}>
            <Col span={6}>
              <Statistic
                title="操作步骤数"
                value={stepCount}
                prefix={<ThunderboltOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="接口请求数"
                value={networkCount}
                prefix={<ApiOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="接口异常数"
                value={networkErrorCountFromSession}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="控制台错误数"
                value={consoleErrorCountFromSession}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Col>
          </Row>
        </Card>

        <Card
          title="用例信息"
          style={{ marginBottom: 24, borderRadius: 8 }}
          styles={{ header: { borderBottom: '1px solid #f0f0f0' } }}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="用例名称"
              name="name"
              rules={[{ required: true, message: '请输入用例名称' }]}
            >
              <Input placeholder="请输入用例名称" />
            </Form.Item>
            <Form.Item label="描述" name="description">
              <TextArea rows={3} placeholder="请输入用例描述" />
            </Form.Item>
            <Form.Item label="标签" name="tags">
              <Select mode="tags" placeholder="输入标签后按回车" />
            </Form.Item>
          </Form>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          <Button
            size="large"
            onClick={() => {
              reset()
              navigate('/manage')
            }}
            style={{ borderRadius: 8, minWidth: 140 }}
          >
            查看详情
          </Button>
          <Button
            type="primary"
            size="large"
            loading={saving}
            onClick={handleSave}
            style={{
              borderRadius: 8,
              minWidth: 140,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            保存用例
          </Button>
        </div>
      </div>
    </div>
  )
}

export default RecordDone

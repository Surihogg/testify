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
  Space,
  Typography,
  message
} from 'antd'
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ApiOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useRecordingStore } from '../stores/recording'
import { useCasesStore } from '../stores/cases'
import type { TestCase, NetworkRequest, ConsoleMessage } from '../../../shared/types'

const { TextArea } = Input
const { Text } = Typography

const RecordDone: React.FC = () => {
  const navigate = useNavigate()
  const { steps, reset } = useRecordingStore()
  const { saveCase } = useCasesStore()
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)

  const stepCount = steps.length
  const networkCount = steps.reduce((acc, s) => acc + s.networkRequests.length, 0)
  const networkErrorCount = steps.reduce(
    (acc, s) => acc + s.networkRequests.filter((r) => r.status >= 400).length,
    0
  )
  const consoleErrorCount = steps.reduce(
    (acc, s) => acc + s.consoleMessages.filter((m) => m.level === 'error').length,
    0
  )

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      const testCase: TestCase = {
        id: Date.now().toString(),
        name: values.name,
        description: values.description || '',
        tags: values.tags || [],
        status: 'draft',
        steps,
        assertions: [],
        networkLogs: steps.reduce<NetworkRequest[]>((acc, s) => [...acc, ...s.networkRequests], []),
        logs: steps.reduce<ConsoleMessage[]>((acc, s) => [...acc, ...s.consoleMessages], []),
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      await saveCase(testCase)
      message.success('用例保存成功')
      reset()
      navigate('/manage')
    } catch {
      message.warning('请填写用例名称')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        overflow: 'auto',
        background: '#f5f5f5',
        padding: '40px 24px'
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
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
                value={networkErrorCount}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="控制台错误数"
                value={consoleErrorCount}
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

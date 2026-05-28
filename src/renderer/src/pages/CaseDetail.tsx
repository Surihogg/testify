import React, { useEffect, useState } from 'react'
import {
  Tabs,
  Table,
  Tag,
  Button,
  Space,
  Radio,
  Select,
  Typography,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Spin,
  Row,
  Col,
  Empty
} from 'antd'
import {
  PlayCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  BugOutlined,
  CodeOutlined,
  CameraOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { useCasesStore } from '../stores/cases'
import type { Step, Assertion, AssertionType } from '../../../shared/types'
import { STEP_TYPE_LABELS, ASSERTION_TYPE_LABELS, CASE_STATUS_LABELS, CASE_STATUS_COLORS } from '../../../shared/constants'

const { Text, Title } = Typography

const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentCase, selectCase, startReplay, stopReplay, isReplaying, replayResult } =
    useCasesStore()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [replayType, setReplayType] = useState<'functional' | 'visual'>('functional')
  const [replaySpeed, setReplaySpeed] = useState(1)
  const [assertions, setAssertions] = useState<Assertion[]>([])
  const [assertionModalOpen, setAssertionModalOpen] = useState(false)
  const [editingAssertion, setEditingAssertion] = useState<Assertion | null>(null)
  const [assertionForm] = Form.useForm()

  useEffect(() => {
    if (id) selectCase(id)
  }, [id])

  if (!currentCase) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" />
      </div>
    )
  }

  const currentStep: Step | null = currentCase.steps[currentStepIndex] || null

  const handleAddAssertion = () => {
    setEditingAssertion(null)
    assertionForm.resetFields()
    setAssertionModalOpen(true)
  }

  const handleEditAssertion = (assertion: Assertion) => {
    setEditingAssertion(assertion)
    assertionForm.setFieldsValue({
      type: assertion.type,
      stepIndex: assertion.stepIndex,
      ...assertion.config
    })
    setAssertionModalOpen(true)
  }

  const handleDeleteAssertion = (assertionId: string) => {
    setAssertions((prev) => prev.filter((a) => a.id !== assertionId))
  }

  const handleSaveAssertion = async () => {
    try {
      const values = await assertionForm.validateFields()
      const { type, stepIndex, ...config } = values
      const assertion: Assertion = {
        id: editingAssertion?.id || Date.now().toString(),
        stepIndex: stepIndex || 0,
        type,
        config
      }
      if (editingAssertion) {
        setAssertions((prev) => prev.map((a) => (a.id === assertion.id ? assertion : a)))
      } else {
        setAssertions((prev) => [...prev, assertion])
      }
      setAssertionModalOpen(false)
      message.success(editingAssertion ? '断言已更新' : '断言已添加')
    } catch {
      message.warning('请填写必要字段')
    }
  }

  const handleStartReplay = async () => {
    if (!currentCase) return
    message.loading({ content: '正在启动回放...', key: 'replay', duration: 0 })
    await startReplay({
      testCaseId: currentCase.id,
      type: replayType,
      speed: replaySpeed,
      browser: 'chrome',
    })
    message.destroy('replay')
  }

  const networkColumns = [
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (method: string) => <Tag>{method}</Tag>
    },
    { title: 'URL', dataIndex: 'url', key: 'url', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: number) => (
        <Tag color={status >= 400 ? 'error' : status >= 300 ? 'warning' : 'success'}>
          {status || '...'}
        </Tag>
      )
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (d: number) => d ? `${d}ms` : '-'
    }
  ]

  const consoleLevelIcons: Record<string, React.ReactNode> = {
    log: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
    warn: <WarningOutlined style={{ color: '#faad14' }} />,
    error: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
    info: <InfoCircleOutlined style={{ color: '#52c41a' }} />
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div
        style={{
          padding: '16px 24px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space size={12} align="center">
            <Button type="link" onClick={() => navigate('/manage')} style={{ padding: 0 }}>
              ← 返回
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              {currentCase.name}
            </Title>
            <Tag color={CASE_STATUS_COLORS[currentCase.status] || 'default'}>
              {CASE_STATUS_LABELS[currentCase.status] || currentCase.status}
            </Tag>
            {currentCase.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
          <Space size={16}>
            <Text type="secondary">
              创建: {(() => { try { return new Date(currentCase.createdAt).toLocaleString('zh-CN') } catch { return currentCase.createdAt } })()}
            </Text>
          </Space>
        </div>
      </div>

      <div style={{ padding: '12px 24px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {currentCase.steps.map((step, idx) => (
            <div
              key={step.id}
              onClick={() => setCurrentStepIndex(idx)}
              style={{
                minWidth: 120,
                padding: '8px 12px',
                background: idx === currentStepIndex ? '#fff' : '#f5f5f5',
                border: idx === currentStepIndex ? '2px solid #667eea' : '1px solid #e8e8e8',
                borderRadius: 6,
                cursor: 'pointer',
                flexShrink: 0,
                borderLeft: step.status === 'error' ? '3px solid #ff4d4f' : step.status === 'warning' ? '3px solid #faad14' : undefined,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Tag color={step.status === 'error' ? 'error' : step.status === 'warning' ? 'warning' : 'processing'} style={{ margin: 0, fontSize: 11 }}>
                  {idx + 1}
                </Tag>
                <Text style={{ fontSize: 12 }}>
                  {STEP_TYPE_LABELS[step.type] || step.type}
                </Text>
              </div>
              <Text ellipsis style={{ fontSize: 11, color: '#666', display: 'block' }}>
                {step.target?.text || step.target?.selector || '-'}
              </Text>
            </div>
          ))}
          {currentCase.steps.length === 0 && (
            <Empty description="无步骤数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
        <Tabs
          defaultActiveKey="network"
          items={[
            {
              key: 'network',
              label: '网络请求',
              icon: <CodeOutlined />,
              children: currentStep ? (
                <Table
                  columns={networkColumns}
                  dataSource={currentStep.networkLogs || []}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  expandable={{
                    expandedRowRender: (record) => (
                      <div style={{ padding: 12 }}>
                        <Row gutter={24}>
                          {record.requestBody && (
                            <Col span={12}>
                              <Text strong>请求体</Text>
                              <pre style={{ fontSize: 12, background: '#f5f5f5', padding: 8, borderRadius: 4, marginTop: 4, maxHeight: 200, overflow: 'auto' }}>
                                {record.requestBody}
                              </pre>
                            </Col>
                          )}
                          {record.responseBody && (
                            <Col span={12}>
                              <Text strong>响应体</Text>
                              <pre style={{ fontSize: 12, background: '#f5f5f5', padding: 8, borderRadius: 4, marginTop: 4, maxHeight: 200, overflow: 'auto' }}>
                                {record.responseBody}
                              </pre>
                            </Col>
                          )}
                        </Row>
                        {record.error && (
                          <div style={{ marginTop: 8 }}>
                            <Text type="danger">错误: {record.error}</Text>
                          </div>
                        )}
                      </div>
                    )
                  }}
                />
              ) : (
                <Text type="secondary">请选择一个步骤查看网络请求</Text>
              )
            },
            {
              key: 'console',
              label: '控制台',
              icon: <BugOutlined />,
              children: currentStep ? (
                (currentStep.consoleLogs || []).length > 0 ? (
                  <div>
                    {(currentStep.consoleLogs || []).map((msg) => (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          padding: '8px 12px',
                          borderBottom: '1px solid #f5f5f5',
                          background: msg.level === 'error' ? '#fff2f0' : msg.level === 'warn' ? '#fffbe6' : '#fff'
                        }}
                      >
                        <span style={{ marginRight: 8, marginTop: 2 }}>
                          {consoleLevelIcons[msg.level]}
                        </span>
                        <Text style={{ flex: 1 }}>{msg.text}</Text>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Text type="secondary">该步骤无控制台输出</Text>
                )
              ) : (
                <Text type="secondary">请选择一个步骤查看控制台</Text>
              )
            },
            {
              key: 'errors',
              label: '错误',
              icon: <CloseCircleOutlined />,
              children: currentStep ? (
                (currentStep.errors || []).length > 0 ? (
                  <div>
                    {(currentStep.errors || []).map((err) => (
                      <div
                        key={err.id}
                        style={{
                          padding: 12,
                          background: '#fff2f0',
                          borderRadius: 6,
                          marginBottom: 8,
                          border: '1px solid #ffccc7'
                        }}
                      >
                        <Text type="danger" strong>
                          {err.message}
                        </Text>
                        {err.stack && (
                          <pre
                            style={{
                              fontSize: 12,
                              marginTop: 8,
                              background: '#fff',
                              padding: 8,
                              borderRadius: 4,
                              maxHeight: 150,
                              overflow: 'auto'
                            }}
                          >
                            {err.stack}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <Text type="secondary">该步骤无错误</Text>
                )
              ) : (
                <Text type="secondary">请选择一个步骤查看错误</Text>
              )
            },
            {
              key: 'screenshot',
              label: '截图',
              icon: <CameraOutlined />,
              children: currentStep?.screenshot ? (
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={currentStep.screenshot}
                    alt={`步骤 ${currentStepIndex + 1}`}
                    style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8, border: '1px solid #f0f0f0' }}
                  />
                </div>
              ) : (
                <Text type="secondary">
                  {currentStep ? '该步骤无截图' : '请选择一个步骤查看截图'}
                </Text>
              )
            }
          ]}
        />
      </div>

      <div
        style={{
          padding: '16px 24px',
          background: '#fff',
          borderTop: '1px solid #f0f0f0',
          flexShrink: 0,
          maxHeight: 200,
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <Text strong style={{ marginRight: 16 }}>
                断言规则
              </Text>
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={handleAddAssertion}
              >
                添加断言
              </Button>
            </div>
            {assertions.length > 0 ? (
              <div>
                {assertions.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '6px 12px',
                      background: '#fafafa',
                      borderRadius: 4,
                      marginBottom: 4
                    }}
                  >
                    <Tag>{ASSERTION_TYPE_LABELS[a.type] || a.type}</Tag>
                    <Text type="secondary" style={{ marginRight: 8 }}>
                      步骤: {a.stepIndex + 1}
                    </Text>
                    {a.result && (
                      <Tag color={a.result.passed ? 'success' : 'error'}>
                        {a.result.passed ? '通过' : '失败'}
                      </Tag>
                    )}
                    <Space style={{ marginLeft: 'auto' }}>
                      <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditAssertion(a)}
                      />
                      <Button
                        type="link"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteAssertion(a.id)}
                      />
                    </Space>
                  </div>
                ))}
              </div>
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>
                暂无断言规则
              </Text>
            )}
          </div>

          <div style={{ marginLeft: 40, paddingLeft: 24, borderLeft: '1px solid #f0f0f0' }}>
            <Text strong style={{ display: 'block', marginBottom: 12 }}>
              回放控制
            </Text>
            <Space direction="vertical" size={12}>
              <Radio.Group
                value={replayType}
                onChange={(e) => setReplayType(e.target.value)}
                size="small"
              >
                <Radio.Button value="functional">功能回放</Radio.Button>
                <Radio.Button value="visual">视觉回放</Radio.Button>
              </Radio.Group>
              <Select
                value={replaySpeed}
                onChange={setReplaySpeed}
                style={{ width: 120 }}
                size="small"
              >
                <Select.Option value={0.5}>0.5x</Select.Option>
                <Select.Option value={1}>1x</Select.Option>
                <Select.Option value={2}>2x</Select.Option>
              </Select>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleStartReplay}
                loading={isReplaying}
                size="small"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                开始回放
              </Button>
              {replayResult && (
                <div style={{ fontSize: 12 }}>
                  <Tag color={replayResult.success ? 'success' : 'error'}>
                    {replayResult.success ? '回放通过' : '回放失败'}
                  </Tag>
                  <Text type="secondary">
                    {replayResult.passedSteps}/{replayResult.totalSteps} 步通过
                  </Text>
                </div>
              )}
            </Space>
          </div>
        </div>
      </div>

      <Modal
        title={editingAssertion ? '编辑断言' : '添加断言'}
        open={assertionModalOpen}
        onOk={handleSaveAssertion}
        onCancel={() => setAssertionModalOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={assertionForm} layout="vertical">
          <Form.Item label="断言类型" name="type" rules={[{ required: true }]}>
            <Select placeholder="选择断言类型">
              {Object.entries(ASSERTION_TYPE_LABELS).map(([key, label]) => (
                <Select.Option key={key} value={key}>{label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="步骤" name="stepIndex" rules={[{ required: true }]}>
            <Select placeholder="选择步骤">
              {currentCase.steps.map((step, idx) => (
                <Select.Option key={step.id} value={idx}>
                  步骤 {idx + 1}: {STEP_TYPE_LABELS[step.type] || step.type} - {step.target?.text || step.target?.selector || ''}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="选择器" name="selector">
            <Input placeholder="CSS 选择器" />
          </Form.Item>
          <Form.Item label="期望值" name="expectedText">
            <Input placeholder="期望值" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CaseDetail

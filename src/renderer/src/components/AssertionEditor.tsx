import React, { useState } from 'react'
import { Button, Modal, Form, Select, Input, Switch, Tag, Space, Typography, List } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { Assertion, Step, AssertionType } from '../../../shared/types'

const { Text } = Typography

const assertionTypeLabels: Record<AssertionType, string> = {
  text: '文本断言',
  visible: '可见性断言',
  attribute: '属性断言',
  url: 'URL 断言',
  status: '状态码断言',
  count: '计数断言',
  value: '值断言',
  screenshot: '截图对比断言'
}

interface AssertionEditorProps {
  assertions: Assertion[]
  onAdd: (assertion: Assertion) => void
  onUpdate: (assertion: Assertion) => void
  onDelete: (id: string) => void
  steps: Step[]
}

const AssertionEditor: React.FC<AssertionEditorProps> = ({
  assertions,
  onAdd,
  onUpdate,
  onDelete,
  steps
}) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Assertion | null>(null)
  const [form] = Form.useForm()

  const handleOpen = (assertion?: Assertion) => {
    if (assertion) {
      setEditing(assertion)
      form.setFieldsValue({
        type: assertion.type,
        stepId: assertion.stepId,
        ...assertion.config
      })
    } else {
      setEditing(null)
      form.resetFields()
    }
    setModalOpen(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const { type, stepId, ...config } = values
      const assertion: Assertion = {
        id: editing?.id || Date.now().toString(),
        type,
        stepId,
        config
      }
      if (editing) {
        onUpdate(assertion)
      } else {
        onAdd(assertion)
      }
      setModalOpen(false)
    } catch {}
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <Text strong style={{ marginRight: 12 }}>断言规则</Text>
        <Button
          type="dashed"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => handleOpen()}
        >
          添加断言
        </Button>
      </div>

      {assertions.length > 0 ? (
        <List
          size="small"
          dataSource={assertions}
          renderItem={(assertion) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleOpen(assertion)}
                />,
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onDelete(assertion.id)}
                />
              ]}
            >
              <Space size={8}>
                <Tag>{assertionTypeLabels[assertion.type]}</Tag>
                <Text type="secondary">
                  步骤: {steps.findIndex((s) => s.id === assertion.stepId) + 1 || assertion.stepId}
                </Text>
                {assertion.result && (
                  <Tag color={assertion.result.passed ? 'success' : 'error'}>
                    {assertion.result.passed ? '通过' : '失败'}
                  </Tag>
                )}
              </Space>
            </List.Item>
          )}
        />
      ) : (
        <Text type="secondary" style={{ fontSize: 12 }}>暂无断言规则</Text>
      )}

      <Modal
        title={editing ? '编辑断言' : '添加断言'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="断言类型" name="type" rules={[{ required: true, message: '请选择断言类型' }]}>
            <Select placeholder="选择断言类型">
              {(Object.entries(assertionTypeLabels) as [AssertionType, string][]).map(([key, label]) => (
                <Select.Option key={key} value={key}>{label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="步骤" name="stepId" rules={[{ required: true, message: '请选择步骤' }]}>
            <Select placeholder="选择步骤">
              {steps.map((step, idx) => (
                <Select.Option key={step.id} value={step.id}>
                  步骤 {idx + 1}: {step.target}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="选择器" name="selector">
            <Input placeholder="CSS 选择器" />
          </Form.Item>
          <Form.Item label="期望值" name="expected">
            <Input placeholder="期望值" />
          </Form.Item>
          <Form.Item label="是否启用" name="enabled" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AssertionEditor

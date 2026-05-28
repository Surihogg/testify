import React, { useEffect } from 'react'
import { Form, Select, Input, Button, Radio, Divider, Typography, Card, message, Space, List, Popconfirm } from 'antd'
import { DeleteOutlined, PlusOutlined, FolderOpenOutlined } from '@ant-design/icons'
import { useAppStore } from '../stores/app'
import type { BrowserType, ConnectionType, StorageType, GitConfig } from '../../../shared/types'
import { CONNECTION_TYPE_LABELS } from '../../../shared/constants'

const { Title } = Typography

const Settings: React.FC = () => {
  const { settings, updateSettings, saveSettings } = useAppStore()
  const [form] = Form.useForm()

  useEffect(() => {
    form.setFieldsValue(settings)
  }, [settings])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      updateSettings(values)
      await saveSettings()
      message.success('设置已保存')
    } catch {
      message.warning('请检查设置项')
    }
  }

  const handleOpenFolder = async (field: string) => {
    const result = await window.api.dialog.openFolder()
    if (result.success && result.data) {
      form.setFieldValue(field, result.data)
    }
  }

  const handleAddGitConfig = () => {
    const gitConfigs = form.getFieldValue('gitConfigs') || []
    const newConfig: GitConfig = {
      id: Date.now().toString(),
      name: '新仓库',
      url: '',
      branch: 'main',
      localPath: '',
    }
    form.setFieldValue('gitConfigs', [...gitConfigs, newConfig])
  }

  const handleRemoveGitConfig = (index: number) => {
    const gitConfigs = form.getFieldValue('gitConfigs') || []
    form.setFieldValue('gitConfigs', gitConfigs.filter((_: unknown, i: number) => i !== index))
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>设置</Title>
      </div>
      <div className="page-body">

      <Form
        form={form}
        layout="vertical"
        initialValues={settings}
      >
        <Card title="浏览器设置" style={{ marginBottom: 24 }}>
          <Form.Item label="默认浏览器" name="defaultBrowser">
            <Select>
              <Select.Option value="chrome">Chrome</Select.Option>
              <Select.Option value="edge">Edge</Select.Option>
              <Select.Option value="chromium">Chromium</Select.Option>
              <Select.Option value="firefox">Firefox</Select.Option>
              <Select.Option value="webkit">WebKit</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="默认连接方式" name="defaultConnectionType">
            <Radio.Group>
              {(Object.entries(CONNECTION_TYPE_LABELS) as [string, string][]).map(([key, label]) => (
                <Radio key={key} value={key}>{label}</Radio>
              ))}
            </Radio.Group>
          </Form.Item>
        </Card>

        <Card title="存储设置" style={{ marginBottom: 24 }}>
          <Form.Item label="默认存储方式" name="defaultStorageType">
            <Radio.Group>
              <Radio value="local">本地</Radio>
              <Radio value="git">Git 仓库</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="默认本地路径" name="defaultLocalPath">
            <Space.Compact style={{ width: '100%' }}>
              <Input placeholder="选择默认保存目录" />
              <Button icon={<FolderOpenOutlined />} onClick={() => handleOpenFolder('defaultLocalPath')} />
            </Space.Compact>
          </Form.Item>
        </Card>

        <Card
          title="Git 仓库配置"
          style={{ marginBottom: 24 }}
          extra={
            <Button icon={<PlusOutlined />} onClick={handleAddGitConfig} size="small">
              添加仓库
            </Button>
          }
        >
          <Form.List name="gitConfigs">
            {(fields) => fields.length === 0 ? (
              <div style={{ color: '#999', textAlign: 'center', padding: 24 }}>
                暂无 Git 仓库配置，点击上方"添加仓库"按钮添加
              </div>
            ) : (
              fields.map(({ key, name, ...restField }) => (
                <div key={key} style={{ marginBottom: 16, padding: 16, background: '#fafafa', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontWeight: 500 }}>仓库 #{name + 1}</span>
                    <Popconfirm title="确定删除？" onConfirm={() => handleRemoveGitConfig(name)}>
                      <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                    </Popconfirm>
                  </div>
                  <Form.Item {...restField} name={[name, 'name']} label="名称" style={{ marginBottom: 8 }}>
                    <Input placeholder="仓库名称" />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'url']} label="仓库地址" style={{ marginBottom: 8 }}>
                    <Input placeholder="https://github.com/user/repo.git" />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'branch']} label="分支" style={{ marginBottom: 8 }}>
                    <Input placeholder="main" />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'token']} label="访问令牌" style={{ marginBottom: 8 }}>
                    <Input.Password placeholder="Personal Access Token（可选）" />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'localPath']} label="本地路径" style={{ marginBottom: 0 }}>
                    <Space.Compact style={{ width: '100%' }}>
                      <Input placeholder="本地克隆路径" />
                      <Button icon={<FolderOpenOutlined />} onClick={() => handleOpenFolder(['gitConfigs', name, 'localPath'].join('.'))} />
                    </Space.Compact>
                  </Form.Item>
                </div>
              ))
            )}
          </Form.List>
        </Card>

        <Divider />

        <Form.Item>
          <Button type="primary" size="large" onClick={handleSave}>
            保存设置
          </Button>
        </Form.Item>
      </Form>
      </div>
    </div>
  )
}

export default Settings

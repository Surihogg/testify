import React, { useEffect, useState } from 'react'
import {
  Input,
  Tree,
  Tag,
  Table,
  Button,
  Space,
  Statistic,
  Row,
  Col,
  Typography,
  message,
  Popconfirm,
  Select
} from 'antd'
import {
  SearchOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  FolderOutlined,
  TagOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useCasesStore } from '../stores/cases'
import type { TestCase } from '../../../shared/types'
import { CASE_STATUS_LABELS, CASE_STATUS_COLORS } from '../../../shared/constants'

const { Text } = Typography

const CaseLibrary: React.FC = () => {
  const navigate = useNavigate()
  const { cases, loading, loadCases, deleteCase, startReplay, isReplaying } = useCasesStore()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [tagFilter, setTagFilter] = useState<string | undefined>()

  useEffect(() => {
    loadCases()
  }, [])

  const allTags = Array.from(new Set(cases.flatMap((c) => c.tags)))

  const filteredCases = cases.filter((c) => {
    if (searchText && !c.name.includes(searchText) && !c.description.includes(searchText))
      return false
    if (statusFilter && c.status !== statusFilter) return false
    if (tagFilter && !c.tags.includes(tagFilter)) return false
    return true
  })

  const passedCount = cases.filter((c) => c.status === 'active').length
  const failedCount = cases.filter((c) => c.status === 'deprecated').length

  const treeData = [
    {
      title: '全部用例',
      key: 'all',
      icon: <FolderOutlined />,
      children: [
        { title: '未分组', key: 'ungrouped', icon: <FolderOutlined /> }
      ]
    }
  ]

  const handleReplay = async (record: TestCase) => {
    message.loading({ content: '正在启动回放...', key: 'replay', duration: 0 })
    await startReplay({
      testCaseId: record.id,
      type: 'functional',
      speed: 1,
      browser: 'chrome',
    })
    message.destroy('replay')
  }

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (name: string, record: TestCase) => (
        <Button type="link" onClick={() => navigate(`/manage/case/${record.id}`)} style={{ padding: 0 }}>
          {name}
        </Button>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={CASE_STATUS_COLORS[status] || 'default'}>
          {CASE_STATUS_LABELS[status] || status}
        </Tag>
      )
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[]) =>
        tags.map((tag) => <Tag key={tag}>{tag}</Tag>)
    },
    {
      title: '步骤数',
      dataIndex: 'steps',
      key: 'steps',
      width: 80,
      render: (steps: unknown[]) => steps?.length || 0
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (ts: string) => {
        try { return new Date(ts).toLocaleString('zh-CN') } catch { return ts }
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: TestCase) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/manage/case/${record.id}`)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handleReplay(record)}
            loading={isReplaying}
          >
            回放
          </Button>
          <Popconfirm
            title="确定删除该用例？"
            onConfirm={() => {
              deleteCase(record.id)
              message.success('删除成功')
            }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div style={{ height: '100%', display: 'flex', background: '#fff', overflow: 'hidden' }}>
      <div
        style={{
          width: 240,
          background: '#fafafa',
          borderRight: '1px solid #f0f0f0',
          padding: '16px 12px',
          overflow: 'auto',
          flexShrink: 0,
        }}
      >
        <Input
          placeholder="搜索用例"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ marginBottom: 16 }}
          allowClear
        />

        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            用例分组
          </Text>
          <Tree
            showIcon
            defaultExpandAll
            treeData={treeData}
            style={{ background: 'transparent' }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            <TagOutlined style={{ marginRight: 4 }} />
            标签
          </Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {allTags.map((tag) => (
              <Tag
                key={tag}
                color={tag === tagFilter ? '#667eea' : undefined}
                style={{ cursor: 'pointer' }}
                onClick={() => setTagFilter(tag === tagFilter ? undefined : tag)}
              >
                {tag}
              </Tag>
            ))}
            {allTags.length === 0 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                暂无标签
              </Text>
            )}
          </div>
        </div>

        <div>
          <Text strong style={{ display: 'block', marginBottom: 12 }}>
            统计
          </Text>
          <Row gutter={[8, 8]}>
            <Col span={8}>
              <Statistic title="总计" value={cases.length} valueStyle={{ fontSize: 18 }} />
            </Col>
            <Col span={8}>
              <Statistic
                title="活跃"
                value={passedCount}
                valueStyle={{ fontSize: 18, color: '#52c41a' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="弃用"
                value={failedCount}
                valueStyle={{ fontSize: 18, color: '#ff4d4f' }}
              />
            </Col>
          </Row>
        </div>
      </div>

      <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 140 }}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
          >
            {Object.entries(CASE_STATUS_LABELS).map(([key, label]) => (
              <Select.Option key={key} value={key}>
                {label}
              </Select.Option>
            ))}
          </Select>
          {tagFilter && (
            <Tag
              closable
              onClose={() => setTagFilter(undefined)}
              color="#667eea"
            >
              {tagFilter}
            </Tag>
          )}
          <Text type="secondary" style={{ marginLeft: 'auto' }}>
            共 {filteredCases.length} 条用例
          </Text>
        </div>

        <Table
          columns={columns}
          dataSource={filteredCases}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
          size="middle"
        />
      </div>
    </div>
  )
}

export default CaseLibrary

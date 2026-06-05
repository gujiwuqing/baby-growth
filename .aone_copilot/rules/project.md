# 项目配置文件

本文件包含项目的配置信息，用于指导后续开发。

## 数据库表结构

所有表都已创建，包含以下字段：

### feeds（喂奶记录）
- id: 主键
- unique_id: 唯一标识
- type: 类型（breast/formula/mixed）
- amount: 喂奶量
- unit: 单位（默认ml）
- note: 备注
- timestamp: 时间戳
- device_id: 设备ID
- created_at: 创建时间

### diapers（纸尿裤记录）
- id: 主键
- unique_id: 唯一标识
- type: 类型（pee/poo/both）
- note: 备注
- timestamp: 时间戳
- device_id: 设备ID
- created_at: 创建时间

## 去重策略

使用 `时间戳_类型_设备ID` 生成唯一标识，导入数据时检查 unique_id 是否已存在。

## 下一步开发

1. 完善统计图表页面
2. 实现相册管理功能
3. 添加本地通知提醒
4. 实现数据导入导出
5. 优化 UI 细节

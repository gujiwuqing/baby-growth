# 宝宝成长记 APP 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建一个功能完整的宝宝成长记录 APP，支持喂养记录、成长指标跟踪、统计分析、提醒、相册管理、数据导入导出等功能，同时支持 Android 和鸿蒙平台。

**Architecture:** 使用 UniApp + Vue3 + TypeScript 进行跨平台开发，采用 SQLite 本地数据库存储，uCharts 实现数据可视化，实现温馨可爱风格的 UI 设计。通过时间戳+类型+设备ID 生成唯一标识实现数据去重。

**Tech Stack:** UniApp, Vue 3, TypeScript, SQLite, uCharts, uni-ui

---

## 项目文件结构规划

```
baby-growth/
├── pages/                      # 页面目录
│   ├── index/                 # 首页
│   │   └── index.vue
│   ├── record/                # 记录页
│   │   ├── feeding.vue        # 喂奶记录
│   │   ├── diaper.vue         # 纸尿裤记录
│   │   ├── sleep.vue          # 睡眠记录
│   │   ├── food.vue           # 辅食记录
│   │   └── supplement.vue     # 营养补充记录
│   ├── statistics/            # 统计页
│   │   └── index.vue
│   ├── album/                 # 相册页
│   │   └── index.vue
│   ├── reminder/              # 提醒页
│   │   └── index.vue
│   └── settings/              # 设置页
│       └── index.vue
├── components/                 # 组件目录
│   ├── RecordCard/            # 记录卡片组件
│   │   └── RecordCard.vue
│   ├── StatChart/             # 统计图表组件
│   │   └── StatChart.vue
│   ├── QuickRecord/           # 快捷记录组件
│   │   └── QuickRecord.vue
│   └── BabyAvatar/            # 宝宝头像组件
│       └── BabyAvatar.vue
├── utils/                      # 工具函数
│   ├── database.ts            # SQLite 数据库封装
│   ├── export.ts              # 导出功能
│   ├── import.ts              # 导入功能
│   ├── deduplication.ts       # 去重逻辑
│   ├── device.ts              # 设备信息
│   └── reminder.ts            # 提醒管理
├── store/                      # 状态管理
│   └── baby.ts                # 宝宝信息状态
├── static/                     # 静态资源
│   ├── images/                # 图片资源
│   │   ├── icons/             # 图标
│   │   └── backgrounds/       # 背景图
│   └── styles/                # 样式文件
│       └── theme.scss         # 主题样式
├── uni_modules/               # uni-app 模块
│   ├── uni-ui/                # uni-ui 组件库
│   └── qiun-data-charts/      # uCharts 图表库
├── App.vue                    # 应用入口
├── main.ts                    # 主入口文件
├── manifest.json              # 应用配置
├── pages.json                 # 页面配置
└── uni.scss                   # 全局样式变量
```

---

## Task 1: 环境准备与项目创建

**Files:**
- Create: `baby-growth/` 项目根目录
- Create: `baby-growth/manifest.json`
- Create: `baby-growth/pages.json`

- [ ] **Step 1: 安装 HBuilderX**

访问 https://www.dcloud.io/hbuilderx.html 下载并安装 HBuilderX 最新正式版（推荐 App 开发版）

- [ ] **Step 2: 创建 UniApp 项目**

打开 HBuilderX，选择：
- 文件 -> 新建 -> 项目
- 选择 uni-app 项目
- 项目名称：`baby-growth`
- 项目类型：默认模板
- Vue 版本：Vue 3
- 点击创建

- [ ] **Step 3: 配置项目基本信息**

修改 `manifest.json`：

```json
{
  "name": "宝宝成长记",
  "appid": "",
  "description": "记录宝宝成长的每一个瞬间",
  "versionName": "1.0.0",
  "versionCode": "100",
  "transformPx": false,
  "app-plus": {
    "usingComponents": true,
    "nvueStyleCompiler": "uni-app",
    "compilerVersion": 3,
    "splashscreen": {
      "alwaysShowBeforeRender": true,
      "waiting": true,
      "autoclose": true,
      "delay": 0
    },
    "modules": {
      "SQLite": {}
    },
    "distribute": {
      "android": {
        "permissions": [
          "<uses-permission android:name=\"android.permission.WRITE_EXTERNAL_STORAGE\"/>",
          "<uses-permission android:name=\"android.permission.READ_EXTERNAL_STORAGE\"/>"
        ]
      }
    }
  },
  "quickapp": {},
  "mp-weixin": {
    "appid": "",
    "setting": {
      "urlCheck": false
    }
  },
  "mp-alipay": {},
  "mp-baidu": {},
  "mp-toutiao": {},
  "uniStatistics": {
    "enable": false
  },
  "vueVersion": "3"
}
```

- [ ] **Step 4: 配置页面路由**

修改 `pages.json`：

```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "首页",
        "navigationBarBackgroundColor": "#FF9EC4",
        "navigationBarTextStyle": "white"
      }
    },
    {
      "path": "pages/record/feeding",
      "style": {
        "navigationBarTitleText": "喂奶记录",
        "navigationBarBackgroundColor": "#FF9EC4",
        "navigationBarTextStyle": "white"
      }
    },
    {
      "path": "pages/record/diaper",
      "style": {
        "navigationBarTitleText": "纸尿裤记录",
        "navigationBarBackgroundColor": "#FF9EC4",
        "navigationBarTextStyle": "white"
      }
    },
    {
      "path": "pages/statistics/index",
      "style": {
        "navigationBarTitleText": "统计分析",
        "navigationBarBackgroundColor": "#FF9EC4",
        "navigationBarTextStyle": "white"
      }
    },
    {
      "path": "pages/album/index",
      "style": {
        "navigationBarTitleText": "成长相册",
        "navigationBarBackgroundColor": "#FF9EC4",
        "navigationBarTextStyle": "white"
      }
    },
    {
      "path": "pages/reminder/index",
      "style": {
        "navigationBarTitleText": "提醒管理",
        "navigationBarBackgroundColor": "#FF9EC4",
        "navigationBarTextStyle": "white"
      }
    },
    {
      "path": "pages/settings/index",
      "style": {
        "navigationBarTitleText": "设置",
        "navigationBarBackgroundColor": "#FF9EC4",
        "navigationBarTextStyle": "white"
      }
    }
  ],
  "globalStyle": {
    "navigationBarTextStyle": "white",
    "navigationBarTitleText": "宝宝成长记",
    "navigationBarBackgroundColor": "#FF9EC4",
    "backgroundColor": "#FFF5F7"
  },
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#FF9EC4",
    "backgroundColor": "#FFFFFF",
    "borderStyle": "white",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页"
      },
      {
        "pagePath": "pages/statistics/index",
        "text": "统计"
      },
      {
        "pagePath": "pages/album/index",
        "text": "相册"
      },
      {
        "pagePath": "pages/settings/index",
        "text": "设置"
      }
    ]
  }
}
```

- [ ] **Step 5: 安装依赖库**

在 HBuilderX 中：
- 工具 -> 插件安装
- 搜索并安装：`uni-ui` 组件库
- 搜索并安装：`qiun-data-charts` (uCharts 图表库)

或使用命令行：

```bash
npm install @dcloudio/uni-ui
npm install @qiun/ucharts
```

---

## Task 2: 数据库设计与初始化

**Files:**
- Create: `utils/database.ts`
- Create: `utils/device.ts`

- [ ] **Step 1: 创建设备信息工具**

创建 `utils/device.ts`：

```typescript
/**
 * 获取设备唯一标识
 */
export function getDeviceId(): string {
  let deviceId = uni.getStorageSync('device_id')
  if (!deviceId) {
    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    uni.setStorageSync('device_id', deviceId)
  }
  return deviceId
}

/**
 * 获取当前时间戳（毫秒）
 */
export function getTimestamp(): number {
  return Date.now()
}

/**
 * 格式化时间
 */
export function formatTime(timestamp: number, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}
```

- [ ] **Step 2: 创建数据库封装类**

创建 `utils/database.ts`：

```typescript
import { getDeviceId } from './device'

/**
 * SQLite 数据库封装
 */
class Database {
  private dbName: string = 'baby_growth'
  private dbPath: string = '_doc/baby_growth.db'
  private isOpen: boolean = false

  /**
   * 打开数据库
   */
  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      plus.sqlite.openDatabase({
        name: this.dbName,
        path: this.dbPath,
        success: () => {
          this.isOpen = true
          console.log('数据库打开成功')
          resolve()
        },
        fail: (e: any) => {
          console.error('数据库打开失败', e)
          reject(e)
        }
      })
    })
  }

  /**
   * 关闭数据库
   */
  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      plus.sqlite.closeDatabase({
        name: this.dbName,
        success: () => {
          this.isOpen = false
          console.log('数据库关闭成功')
          resolve()
        },
        fail: (e: any) => {
          console.error('数据库关闭失败', e)
          reject(e)
        }
      })
    })
  }

  /**
   * 执行 SQL 语句
   */
  async executeSql(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      plus.sqlite.executeSql({
        name: this.dbName,
        sql: sql,
        success: () => {
          resolve()
        },
        fail: (e: any) => {
          console.error('SQL 执行失败', sql, e)
          reject(e)
        }
      })
    })
  }

  /**
   * 查询数据
   */
  async selectSql(sql: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      plus.sqlite.selectSql({
        name: this.dbName,
        sql: sql,
        success: (data: any[]) => {
          resolve(data)
        },
        fail: (e: any) => {
          console.error('SQL 查询失败', sql, e)
          reject(e)
        }
      })
    })
  }

  /**
   * 初始化数据库表
   */
  async initTables(): Promise<void> {
    // 宝宝信息表
    await this.executeSql(`
      CREATE TABLE IF NOT EXISTS baby_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        gender INTEGER DEFAULT 0,
        birthday TEXT NOT NULL,
        avatar TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)

    // 喂奶记录表
    await this.executeSql(`
      CREATE TABLE IF NOT EXISTS feeds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unique_id TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        amount REAL DEFAULT 0,
        unit TEXT DEFAULT 'ml',
        note TEXT,
        timestamp INTEGER NOT NULL,
        device_id TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `)

    // 纸尿裤记录表
    await this.executeSql(`
      CREATE TABLE IF NOT EXISTS diapers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unique_id TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        note TEXT,
        timestamp INTEGER NOT NULL,
        device_id TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `)

    // 睡眠记录表
    await this.executeSql(`
      CREATE TABLE IF NOT EXISTS sleeps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unique_id TEXT UNIQUE NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        duration INTEGER,
        note TEXT,
        device_id TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `)

    // 辅食记录表
    await this.executeSql(`
      CREATE TABLE IF NOT EXISTS foods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unique_id TEXT UNIQUE NOT NULL,
        food_type TEXT NOT NULL,
        amount REAL DEFAULT 0,
        unit TEXT DEFAULT 'g',
        note TEXT,
        timestamp INTEGER NOT NULL,
        device_id TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `)

    // 营养补充记录表
    await this.executeSql(`
      CREATE TABLE IF NOT EXISTS supplements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unique_id TEXT UNIQUE NOT NULL,
        supplement_type TEXT NOT NULL,
        dosage TEXT,
        note TEXT,
        timestamp INTEGER NOT NULL,
        device_id TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `)

    // 成长指标记录表
    await this.executeSql(`
      CREATE TABLE IF NOT EXISTS growth_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unique_id TEXT UNIQUE NOT NULL,
        height REAL,
        weight REAL,
        head_circumference REAL,
        note TEXT,
        timestamp INTEGER NOT NULL,
        device_id TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `)

    // 照片记录表
    await this.executeSql(`
      CREATE TABLE IF NOT EXISTS photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unique_id TEXT UNIQUE NOT NULL,
        photo_path TEXT NOT NULL,
        thumbnail_path TEXT,
        caption TEXT,
        month INTEGER,
        timestamp INTEGER NOT NULL,
        device_id TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `)

    // 提醒配置表
    await this.executeSql(`
      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        reminder_time INTEGER NOT NULL,
        is_enabled INTEGER DEFAULT 1,
        repeat_type TEXT DEFAULT 'none',
        last_triggered INTEGER,
        created_at INTEGER NOT NULL
      )
    `)

    console.log('数据库表初始化完成')
  }
}

export const db = new Database()
```

---

## Task 3: 首页开发

**Files:**
- Create: `pages/index/index.vue`
- Create: `components/QuickRecord/QuickRecord.vue`

- [ ] **Step 1: 创建快捷记录组件**

创建 `components/QuickRecord/QuickRecord.vue`：

```vue
<template>
  <view class="quick-record">
    <view class="quick-title">快捷记录</view>
    <view class="quick-grid">
      <view 
        class="quick-item" 
        v-for="(item, index) in quickItems" 
        :key="index"
        @click="handleClick(item.type)"
      >
        <view class="quick-icon">{{ item.icon }}</view>
        <view class="quick-label">{{ item.label }}</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const quickItems = ref([
  { type: 'feeding', icon: '🍼', label: '喂奶' },
  { type: 'diaper', icon: '👶', label: '换尿布' },
  { type: 'sleep', icon: '😴', label: '睡眠' },
  { type: 'food', icon: '🥣', label: '辅食' },
  { type: 'supplement', icon: '💊', label: '营养' },
  { type: 'growth', icon: '📏', label: '成长' }
])

const emit = defineEmits(['record'])

const handleClick = (type: string) => {
  emit('record', type)
}
</script>

<style scoped>
.quick-record {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
  margin: 15px;
}

.quick-title {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
  margin-bottom: 15px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px 0;
  background: #FFF5F7;
  border-radius: 12px;
}

.quick-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.quick-label {
  font-size: 14px;
  color: #666666;
}
</style>
```

- [ ] **Step 2: 创建首页**

创建 `pages/index/index.vue`：

```vue
<template>
  <view class="index-page">
    <!-- 头部宝宝信息 -->
    <view class="baby-header">
      <image class="baby-avatar" :src="babyInfo.avatar || defaultAvatar" mode="aspectFill"></image>
      <view class="baby-info">
        <view class="baby-name">{{ babyInfo.name || '宝宝' }}</view>
        <view class="baby-age">{{ babyAge }}</view>
      </view>
    </view>

    <!-- 今日概览 -->
    <view class="today-overview">
      <view class="overview-title">今日概览</view>
      <view class="overview-cards">
        <view class="overview-card">
          <view class="card-value">{{ todayStats.feeding }}</view>
          <view class="card-label">喂奶次数</view>
        </view>
        <view class="overview-card">
          <view class="card-value">{{ todayStats.diaper }}</view>
          <view class="card-label">换尿布</view>
        </view>
        <view class="overview-card">
          <view class="card-value">{{ todayStats.sleep }}h</view>
          <view class="card-label">睡眠时长</view>
        </view>
      </view>
    </view>

    <!-- 快捷记录 -->
    <QuickRecord @record="handleRecord" />

    <!-- 最近记录 -->
    <view class="recent-records">
      <view class="recent-title">最近记录</view>
      <view class="record-list">
        <view class="record-item" v-for="record in recentRecords" :key="record.id">
          <view class="record-icon">{{ getRecordIcon(record.type) }}</view>
          <view class="record-info">
            <view class="record-type">{{ getRecordLabel(record.type) }}</view>
            <view class="record-time">{{ record.time }}</view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import QuickRecord from '@/components/QuickRecord/QuickRecord.vue'

const defaultAvatar = '/static/images/default-avatar.png'

const babyInfo = ref({
  name: '',
  avatar: '',
  birthday: ''
})

const todayStats = ref({
  feeding: 0,
  diaper: 0,
  sleep: 0
})

const recentRecords = ref([
  { id: 1, type: 'feeding', time: '10:30' },
  { id: 2, type: 'diaper', time: '09:15' }
])

const babyAge = computed(() => {
  if (!babyInfo.value.birthday) return ''
  const birthday = new Date(babyInfo.value.birthday)
  const now = new Date()
  const days = Math.floor((now.getTime() - birthday.getTime()) / (1000 * 60 * 60 * 24))
  const months = Math.floor(days / 30)
  if (months > 0) {
    return `${months}个月${days % 30}天`
  }
  return `${days}天`
})

const getRecordIcon = (type: string) => {
  const icons: Record<string, string> = {
    feeding: '🍼',
    diaper: '👶',
    sleep: '😴',
    food: '🥣',
    supplement: '💊',
    growth: '📏'
  }
  return icons[type] || '📝'
}

const getRecordLabel = (type: string) => {
  const labels: Record<string, string> = {
    feeding: '喂奶',
    diaper: '换尿布',
    sleep: '睡眠',
    food: '辅食',
    supplement: '营养补充',
    growth: '成长指标'
  }
  return labels[type] || '记录'
}

const handleRecord = (type: string) => {
  const routes: Record<string, string> = {
    feeding: '/pages/record/feeding',
    diaper: '/pages/record/diaper',
    sleep: '/pages/record/sleep',
    food: '/pages/record/food',
    supplement: '/pages/record/supplement',
    growth: '/pages/record/growth'
  }
  uni.navigateTo({ url: routes[type] || '/pages/index/index' })
}

onMounted(() => {
  // TODO: 加载宝宝信息
  // TODO: 加载今日统计数据
  // TODO: 加载最近记录
})
</script>

<style scoped>
.index-page {
  min-height: 100vh;
  background: #FFF5F7;
}

.baby-header {
  background: linear-gradient(135deg, #FF9EC4 0%, #FFB6D1 100%);
  padding: 30px 20px;
  display: flex;
  align-items: center;
  border-radius: 0 0 20px 20px;
}

.baby-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid #FFFFFF;
}

.baby-info {
  margin-left: 15px;
  color: #FFFFFF;
}

.baby-name {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 5px;
}

.baby-age {
  font-size: 14px;
  opacity: 0.9;
}

.today-overview {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
  margin: 15px;
}

.overview-title {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
  margin-bottom: 15px;
}

.overview-cards {
  display: flex;
  justify-content: space-around;
}

.overview-card {
  text-align: center;
  flex: 1;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #FF9EC4;
  margin-bottom: 5px;
}

.card-label {
  font-size: 12px;
  color: #999999;
}

.recent-records {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
  margin: 15px;
}

.recent-title {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
  margin-bottom: 15px;
}

.record-list {
  /* 记录列表样式 */
}

.record-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #F5F5F5;
}

.record-item:last-child {
  border-bottom: none;
}

.record-icon {
  font-size: 24px;
  margin-right: 12px;
}

.record-info {
  flex: 1;
}

.record-type {
  font-size: 14px;
  color: #333333;
  margin-bottom: 4px;
}

.record-time {
  font-size: 12px;
  color: #999999;
}
</style>
```

---

## Task 4: 喂奶记录功能

**Files:**
- Create: `pages/record/feeding.vue`

- [ ] **Step 1: 创建喂奶记录页面**

创建 `pages/record/feeding.vue`：

```vue
<template>
  <view class="feeding-page">
    <view class="form-section">
      <view class="form-item">
        <view class="form-label">喂奶类型</view>
        <view class="type-selector">
          <view 
            class="type-option"
            :class="{ active: formData.type === 'breast' }"
            @click="formData.type = 'breast'"
          >
            母乳
          </view>
          <view 
            class="type-option"
            :class="{ active: formData.type === 'formula' }"
            @click="formData.type = 'formula'"
          >
            奶粉
          </view>
          <view 
            class="type-option"
            :class="{ active: formData.type === 'mixed' }"
            @click="formData.type = 'mixed'"
          >
            混合
          </view>
        </view>
      </view>

      <view class="form-item">
        <view class="form-label">喂奶量 (ml)</view>
        <input 
          class="form-input"
          type="number"
          v-model="formData.amount"
          placeholder="请输入喂奶量"
        />
      </view>

      <view class="form-item">
        <view class="form-label">喂奶时间</view>
        <picker 
          mode="time" 
          :value="formData.time"
          @change="onTimeChange"
        >
          <view class="form-picker">{{ formData.time || '选择时间' }}</view>
        </picker>
      </view>

      <view class="form-item">
        <view class="form-label">备注</view>
        <textarea 
          class="form-textarea"
          v-model="formData.note"
          placeholder="记录一些特殊情况..."
        />
      </view>
    </view>

    <view class="form-actions">
      <button class="btn-cancel" @click="handleCancel">取消</button>
      <button class="btn-save" @click="handleSave">保存</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { db } from '@/utils/database'
import { getDeviceId, getTimestamp, formatTime } from '@/utils/device'

const formData = ref({
  type: 'breast',
  amount: '',
  time: formatTime(Date.now(), 'HH:mm'),
  note: ''
})

const onTimeChange = (e: any) => {
  formData.value.time = e.detail.value
}

const handleCancel = () => {
  uni.navigateBack()
}

const handleSave = async () => {
  if (!formData.value.amount) {
    uni.showToast({ title: '请输入喂奶量', icon: 'none' })
    return
  }

  try {
    const timestamp = Date.now()
    const uniqueId = `${timestamp}_feeding_${getDeviceId()}`
    
    await db.executeSql(`
      INSERT INTO feeds (unique_id, type, amount, unit, note, timestamp, device_id, created_at)
      VALUES ('${uniqueId}', '${formData.value.type}', ${formData.value.amount}, 'ml', '${formData.value.note}', ${timestamp}, '${getDeviceId()}', ${timestamp})
    `)

    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('保存失败', error)
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}
</script>

<style scoped>
.feeding-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding: 15px;
}

.form-section {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  font-size: 14px;
  color: #666666;
  margin-bottom: 10px;
}

.type-selector {
  display: flex;
  gap: 10px;
}

.type-option {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  color: #666666;
}

.type-option.active {
  background: #FF9EC4;
  border-color: #FF9EC4;
  color: #FFFFFF;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
}

.form-picker {
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  color: #333333;
}

.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.btn-cancel {
  flex: 1;
  padding: 15px 0;
  border: 1px solid #E5E5E5;
  border-radius: 25px;
  background: #FFFFFF;
  font-size: 16px;
  color: #666666;
}

.btn-save {
  flex: 1;
  padding: 15px 0;
  border-radius: 25px;
  background: #FF9EC4;
  font-size: 16px;
  color: #FFFFFF;
}
</style>
```

---

## Task 5: 纸尿裤记录功能

**Files:**
- Create: `pages/record/diaper.vue`

- [ ] **Step 1: 创建纸尿裤记录页面**

创建 `pages/record/diaper.vue`：

```vue
<template>
  <view class="diaper-page">
    <view class="form-section">
      <view class="form-item">
        <view class="form-label">更换类型</view>
        <view class="type-selector">
          <view 
            class="type-option"
            :class="{ active: formData.type === 'pee' }"
            @click="formData.type = 'pee'"
          >
            💧 尿
          </view>
          <view 
            class="type-option"
            :class="{ active: formData.type === 'poo' }"
            @click="formData.type = 'poo'"
          >
            💩 屎
          </view>
          <view 
            class="type-option"
            :class="{ active: formData.type === 'both' }"
            @click="formData.type = 'both'"
          >
            💧💩 混合
          </view>
        </view>
      </view>

      <view class="form-item">
        <view class="form-label">更换时间</view>
        <picker 
          mode="time" 
          :value="formData.time"
          @change="onTimeChange"
        >
          <view class="form-picker">{{ formData.time || '选择时间' }}</view>
        </picker>
      </view>

      <view class="form-item">
        <view class="form-label">备注</view>
        <textarea 
          class="form-textarea"
          v-model="formData.note"
          placeholder="记录特殊情况..."
        />
      </view>
    </view>

    <view class="form-actions">
      <button class="btn-cancel" @click="handleCancel">取消</button>
      <button class="btn-save" @click="handleSave">保存</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { db } from '@/utils/database'
import { getDeviceId, formatTime } from '@/utils/device'

const formData = ref({
  type: 'pee',
  time: formatTime(Date.now(), 'HH:mm'),
  note: ''
})

const onTimeChange = (e: any) => {
  formData.value.time = e.detail.value
}

const handleCancel = () => {
  uni.navigateBack()
}

const handleSave = async () => {
  try {
    const timestamp = Date.now()
    const uniqueId = `${timestamp}_diaper_${getDeviceId()}`
    
    await db.executeSql(`
      INSERT INTO diapers (unique_id, type, note, timestamp, device_id, created_at)
      VALUES ('${uniqueId}', '${formData.value.type}', '${formData.value.note}', ${timestamp}, '${getDeviceId()}', ${timestamp})
    `)

    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('保存失败', error)
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}
</script>

<style scoped>
/* 样式与喂奶页面相同，可复用 */
.diaper-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding: 15px;
}

.form-section {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  font-size: 14px;
  color: #666666;
  margin-bottom: 10px;
}

.type-selector {
  display: flex;
  gap: 10px;
}

.type-option {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  color: #666666;
}

.type-option.active {
  background: #FF9EC4;
  border-color: #FF9EC4;
  color: #FFFFFF;
}

.form-picker {
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  color: #333333;
}

.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.btn-cancel {
  flex: 1;
  padding: 15px 0;
  border: 1px solid #E5E5E5;
  border-radius: 25px;
  background: #FFFFFF;
  font-size: 16px;
  color: #666666;
}

.btn-save {
  flex: 1;
  padding: 15px 0;
  border-radius: 25px;
  background: #FF9EC4;
  font-size: 16px;
  color: #FFFFFF;
}
</style>
```

---

## Task 6: 睡眠记录功能

**Files:**
- Create: `pages/record/sleep.vue`

- [ ] **Step 1: 创建睡眠记录页面**

创建 `pages/record/sleep.vue`：

```vue
<template>
  <view class="sleep-page">
    <view class="form-section">
      <view class="form-item">
        <view class="form-label">入睡时间</view>
        <picker 
          mode="time" 
          :value="formData.startTime"
          @change="onStartTimeChange"
        >
          <view class="form-picker">{{ formData.startTime || '选择入睡时间' }}</view>
        </picker>
      </view>

      <view class="form-item">
        <view class="form-label">醒来时间</view>
        <picker 
          mode="time" 
          :value="formData.endTime"
          @change="onEndTimeChange"
        >
          <view class="form-picker">{{ formData.endTime || '选择醒来时间（可选）' }}</view>
        </picker>
      </view>

      <view class="form-item">
        <view class="form-label">睡眠时长</view>
        <view class="duration-display" v-if="duration">
          <text class="duration-value">{{ duration }}</text>
          <text class="duration-unit">小时</text>
        </view>
        <view class="duration-display" v-else>
          <text class="duration-placeholder">选择时间后自动计算</text>
        </view>
      </view>

      <view class="form-item">
        <view class="form-label">备注</view>
        <textarea 
          class="form-textarea"
          v-model="formData.note"
          placeholder="记录睡眠质量..."
        />
      </view>
    </view>

    <view class="form-actions">
      <button class="btn-cancel" @click="handleCancel">取消</button>
      <button class="btn-save" @click="handleSave">保存</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { db } from '@/utils/database'
import { getDeviceId, formatTime } from '@/utils/device'

const formData = ref({
  startTime: formatTime(Date.now(), 'HH:mm'),
  endTime: '',
  note: ''
})

const duration = computed(() => {
  if (!formData.value.startTime || !formData.value.endTime) return null
  
  const start = formData.value.startTime.split(':')
  const end = formData.value.endTime.split(':')
  
  const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1])
  const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1])
  
  let diff = endMinutes - startMinutes
  if (diff < 0) diff += 24 * 60 // 跨天
  
  const hours = Math.floor(diff / 60)
  const minutes = diff % 60
  
  return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`
})

const onStartTimeChange = (e: any) => {
  formData.value.startTime = e.detail.value
}

const onEndTimeChange = (e: any) => {
  formData.value.endTime = e.detail.value
}

const handleCancel = () => {
  uni.navigateBack()
}

const handleSave = async () => {
  if (!formData.value.startTime) {
    uni.showToast({ title: '请选择入睡时间', icon: 'none' })
    return
  }

  try {
    const timestamp = Date.now()
    const uniqueId = `${timestamp}_sleep_${getDeviceId()}`
    
    const startParts = formData.value.startTime.split(':')
    const startTimestamp = new Date()
    startTimestamp.setHours(parseInt(startParts[0]), parseInt(startParts[1]), 0, 0)
    
    let endTimestamp = null
    let durationValue = null
    
    if (formData.value.endTime) {
      const endParts = formData.value.endTime.split(':')
      endTimestamp = new Date()
      endTimestamp.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0, 0)
      
      const diff = endTimestamp.getTime() - startTimestamp.getTime()
      durationValue = diff > 0 ? diff : diff + 24 * 60 * 60 * 1000
    }
    
    await db.executeSql(`
      INSERT INTO sleeps (unique_id, start_time, end_time, duration, note, device_id, created_at)
      VALUES (
        '${uniqueId}', 
        ${startTimestamp.getTime()}, 
        ${endTimestamp ? endTimestamp.getTime() : 'NULL'}, 
        ${durationValue ? durationValue : 'NULL'},
        '${formData.value.note}', 
        '${getDeviceId()}', 
        ${timestamp}
      )
    `)

    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('保存失败', error)
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}
</script>

<style scoped>
.sleep-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding: 15px;
}

.form-section {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  font-size: 14px;
  color: #666666;
  margin-bottom: 10px;
}

.form-picker {
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  color: #333333;
}

.duration-display {
  padding: 12px;
  background: #FFF5F7;
  border-radius: 8px;
  text-align: center;
}

.duration-value {
  font-size: 24px;
  font-weight: bold;
  color: #FF9EC4;
  margin-right: 5px;
}

.duration-unit {
  font-size: 14px;
  color: #666666;
}

.duration-placeholder {
  font-size: 14px;
  color: #999999;
}

.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.btn-cancel {
  flex: 1;
  padding: 15px 0;
  border: 1px solid #E5E5E5;
  border-radius: 25px;
  background: #FFFFFF;
  font-size: 16px;
  color: #666666;
}

.btn-save {
  flex: 1;
  padding: 15px 0;
  border-radius: 25px;
  background: #FF9EC4;
  font-size: 16px;
  color: #FFFFFF;
}
</style>
```

---

## Task 7: 辅食和营养补充记录

**Files:**
- Create: `pages/record/food.vue`
- Create: `pages/record/supplement.vue`

- [ ] **Step 1: 创建辅食记录页面**

创建 `pages/record/food.vue`：

```vue
<template>
  <view class="food-page">
    <view class="form-section">
      <view class="form-item">
        <view class="form-label">食物类型</view>
        <input 
          class="form-input"
          v-model="formData.foodType"
          placeholder="如：米糊、果泥、蔬菜泥..."
        />
      </view>

      <view class="form-item">
        <view class="form-label">食物量 (g)</view>
        <input 
          class="form-input"
          type="number"
          v-model="formData.amount"
          placeholder="请输入食物量"
        />
      </view>

      <view class="form-item">
        <view class="form-label">喂养时间</view>
        <picker 
          mode="time" 
          :value="formData.time"
          @change="onTimeChange"
        >
          <view class="form-picker">{{ formData.time || '选择时间' }}</view>
        </picker>
      </view>

      <view class="form-item">
        <view class="form-label">备注</view>
        <textarea 
          class="form-textarea"
          v-model="formData.note"
          placeholder="记录宝宝对食物的反应..."
        />
      </view>
    </view>

    <view class="form-actions">
      <button class="btn-cancel" @click="handleCancel">取消</button>
      <button class="btn-save" @click="handleSave">保存</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { db } from '@/utils/database'
import { getDeviceId, formatTime } from '@/utils/device'

const formData = ref({
  foodType: '',
  amount: '',
  time: formatTime(Date.now(), 'HH:mm'),
  note: ''
})

const onTimeChange = (e: any) => {
  formData.value.time = e.detail.value
}

const handleCancel = () => {
  uni.navigateBack()
}

const handleSave = async () => {
  if (!formData.value.foodType) {
    uni.showToast({ title: '请输入食物类型', icon: 'none' })
    return
  }

  try {
    const timestamp = Date.now()
    const uniqueId = `${timestamp}_food_${getDeviceId()}`
    
    await db.executeSql(`
      INSERT INTO foods (unique_id, food_type, amount, unit, note, timestamp, device_id, created_at)
      VALUES ('${uniqueId}', '${formData.value.foodType}', ${formData.value.amount || 0}, 'g', '${formData.value.note}', ${timestamp}, '${getDeviceId()}', ${timestamp})
    `)

    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('保存失败', error)
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}
</script>

<style scoped>
/* 样式与喂奶页面相同 */
.food-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding: 15px;
}

.form-section {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  font-size: 14px;
  color: #666666;
  margin-bottom: 10px;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
}

.form-picker {
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  color: #333333;
}

.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.btn-cancel {
  flex: 1;
  padding: 15px 0;
  border: 1px solid #E5E5E5;
  border-radius: 25px;
  background: #FFFFFF;
  font-size: 16px;
  color: #666666;
}

.btn-save {
  flex: 1;
  padding: 15px 0;
  border-radius: 25px;
  background: #FF9EC4;
  font-size: 16px;
  color: #FFFFFF;
}
</style>
```

- [ ] **Step 2: 创建营养补充记录页面**

创建 `pages/record/supplement.vue`：

```vue
<template>
  <view class="supplement-page">
    <view class="form-section">
      <view class="form-item">
        <view class="form-label">补充类型</view>
        <view class="type-selector">
          <view 
            class="type-option"
            :class="{ active: formData.type === 'vitamin_ad' }"
            @click="formData.type = 'vitamin_ad'"
          >
            AD滴剂
          </view>
          <view 
            class="type-option"
            :class="{ active: formData.type === 'probiotics' }"
            @click="formData.type = 'probiotics'"
          >
            益生菌
          </view>
          <view 
            class="type-option"
            :class="{ active: formData.type === 'other' }"
            @click="formData.type = 'other'"
          >
            其他
          </view>
        </view>
      </view>

      <view class="form-item">
        <view class="form-label">剂量</view>
        <input 
          class="form-input"
          v-model="formData.dosage"
          placeholder="如：1粒、5ml..."
        />
      </view>

      <view class="form-item">
        <view class="form-label">服用时间</view>
        <picker 
          mode="time" 
          :value="formData.time"
          @change="onTimeChange"
        >
          <view class="form-picker">{{ formData.time || '选择时间' }}</view>
        </picker>
      </view>

      <view class="form-item">
        <view class="form-label">备注</view>
        <textarea 
          class="form-textarea"
          v-model="formData.note"
          placeholder="记录特殊情况..."
        />
      </view>
    </view>

    <view class="form-actions">
      <button class="btn-cancel" @click="handleCancel">取消</button>
      <button class="btn-save" @click="handleSave">保存</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { db } from '@/utils/database'
import { getDeviceId, formatTime } from '@/utils/device'

const formData = ref({
  type: 'vitamin_ad',
  dosage: '',
  time: formatTime(Date.now(), 'HH:mm'),
  note: ''
})

const onTimeChange = (e: any) => {
  formData.value.time = e.detail.value
}

const handleCancel = () => {
  uni.navigateBack()
}

const handleSave = async () => {
  try {
    const timestamp = Date.now()
    const uniqueId = `${timestamp}_supplement_${getDeviceId()}`
    
    await db.executeSql(`
      INSERT INTO supplements (unique_id, supplement_type, dosage, note, timestamp, device_id, created_at)
      VALUES ('${uniqueId}', '${formData.value.type}', '${formData.value.dosage}', '${formData.value.note}', ${timestamp}, '${getDeviceId()}', ${timestamp})
    `)

    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('保存失败', error)
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}
</script>

<style scoped>
/* 样式与喂奶页面相同 */
.supplement-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding: 15px;
}

.form-section {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  font-size: 14px;
  color: #666666;
  margin-bottom: 10px;
}

.type-selector {
  display: flex;
  gap: 10px;
}

.type-option {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  color: #666666;
}

.type-option.active {
  background: #FF9EC4;
  border-color: #FF9EC4;
  color: #FFFFFF;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
}

.form-picker {
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  color: #333333;
}

.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.btn-cancel {
  flex: 1;
  padding: 15px 0;
  border: 1px solid #E5E5E5;
  border-radius: 25px;
  background: #FFFFFF;
  font-size: 16px;
  color: #666666;
}

.btn-save {
  flex: 1;
  padding: 15px 0;
  border-radius: 25px;
  background: #FF9EC4;
  font-size: 16px;
  color: #FFFFFF;
}
</style>
```

---

## Task 8: 统计图表功能

**Files:**
- Create: `pages/statistics/index.vue`
- Create: `components/StatChart/StatChart.vue`

- [ ] **Step 1: 安装 uCharts 图表库**

在 HBuilderX 插件市场搜索安装 `qiun-data-charts`，或使用命令：

```bash
npm install @qiun/ucharts
```

- [ ] **Step 2: 创建统计页面**

创建 `pages/statistics/index.vue`：

```vue
<template>
  <view class="statistics-page">
    <!-- 时间范围选择 -->
    <view class="time-selector">
      <view 
        class="time-option"
        :class="{ active: timeRange === 'day' }"
        @click="timeRange = 'day'"
      >
        今日
      </view>
      <view 
        class="time-option"
        :class="{ active: timeRange === 'week' }"
        @click="timeRange = 'week'"
      >
        本周
      </view>
      <view 
        class="time-option"
        :class="{ active: timeRange === 'month' }"
        @click="timeRange = 'month'"
      >
        本月
      </view>
    </view>

    <!-- 喂奶统计 -->
    <view class="stat-card">
      <view class="stat-title">喂奶统计</view>
      <view class="stat-summary">
        <view class="summary-item">
          <text class="summary-value">{{ feedingStats.totalCount }}</text>
          <text class="summary-label">总次数</text>
        </view>
        <view class="summary-item">
          <text class="summary-value">{{ feedingStats.totalAmount }}</text>
          <text class="summary-label">总量(ml)</text>
        </view>
      </view>
      <view class="chart-container">
        <qiun-data-charts
          type="line"
          :chartData="feedingChartData"
          :opts="chartOpts"
        />
      </view>
    </view>

    <!-- 纸尿裤统计 -->
    <view class="stat-card">
      <view class="stat-title">纸尿裤统计</view>
      <view class="stat-summary">
        <view class="summary-item">
          <text class="summary-value">{{ diaperStats.total }}</text>
          <text class="summary-label">总次数</text>
        </view>
      </view>
      <view class="chart-container">
        <qiun-data-charts
          type="pie"
          :chartData="diaperChartData"
          :opts="pieChartOpts"
        />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { db } from '@/utils/database'

const timeRange = ref('day')

const feedingStats = ref({
  totalCount: 0,
  totalAmount: 0
})

const diaperStats = ref({
  total: 0,
  pee: 0,
  poo: 0,
  both: 0
})

const chartOpts = ref({
  color: ['#FF9EC4', '#A8E6CF', '#FFB6D1'],
  padding: [15, 10, 0, 15],
  legend: {},
  xAxis: {
    disableGrid: true
  },
  yAxis: {
    gridType: 'dash',
    dashLength: 2
  },
  extra: {
    line: {
      type: 'curve',
      width: 2,
      activeType: 'hollow'
    }
  }
})

const pieChartOpts = ref({
  color: ['#FF9EC4', '#A8E6CF', '#FFB6D1'],
  padding: [5, 5, 5, 5],
  legend: {
    show: true,
    position: 'right'
  },
  extra: {
    pie: {
      activeOpacity: 0.5,
      activeRadius: 10,
      offsetAngle: 0,
      labelWidth: 15,
      ringWidth: 60,
      border: true,
      borderWidth: 2,
      borderColor: '#FFFFFF'
    }
  }
})

const feedingChartData = computed(() => {
  return {
    categories: ['6:00', '9:00', '12:00', '15:00', '18:00', '21:00'],
    series: [{
      name: '喂奶量',
      data: [60, 90, 80, 100, 90, 80]
    }]
  }
})

const diaperChartData = computed(() => {
  return {
    series: [{
      data: [
        { name: '尿', value: diaperStats.value.pee },
        { name: '屎', value: diaperStats.value.poo },
        { name: '混合', value: diaperStats.value.both }
      ]
    }]
  }
})

const loadStats = async () => {
  try {
    const now = new Date()
    let startTime: number
    
    if (timeRange.value === 'day') {
      startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    } else if (timeRange.value === 'week') {
      startTime = now.getTime() - 7 * 24 * 60 * 60 * 1000
    } else {
      startTime = now.getTime() - 30 * 24 * 60 * 60 * 1000
    }
    
    // 加载喂奶统计
    const feeds = await db.selectSql(`
      SELECT COUNT(*) as count, SUM(amount) as amount
      FROM feeds
      WHERE timestamp >= ${startTime}
    `)
    
    if (feeds && feeds.length > 0) {
      feedingStats.value.totalCount = feeds[0].count || 0
      feedingStats.value.totalAmount = feeds[0].amount || 0
    }
    
    // 加载纸尿裤统计
    const diapers = await db.selectSql(`
      SELECT type, COUNT(*) as count
      FROM diapers
      WHERE timestamp >= ${startTime}
      GROUP BY type
    `)
    
    diaperStats.value = { total: 0, pee: 0, poo: 0, both: 0 }
    
    if (diapers && diapers.length > 0) {
      diapers.forEach((item: any) => {
        diaperStats.value.total += item.count
        if (item.type === 'pee') diaperStats.value.pee = item.count
        else if (item.type === 'poo') diaperStats.value.poo = item.count
        else if (item.type === 'both') diaperStats.value.both = item.count
      })
    }
  } catch (error) {
    console.error('加载统计数据失败', error)
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.statistics-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding: 15px;
}

.time-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.time-option {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  background: #FFFFFF;
  border-radius: 20px;
  font-size: 14px;
  color: #666666;
}

.time-option.active {
  background: #FF9EC4;
  color: #FFFFFF;
}

.stat-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 15px;
}

.stat-title {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
  margin-bottom: 15px;
}

.stat-summary {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.summary-item {
  text-align: center;
}

.summary-value {
  display: block;
  font-size: 28px;
  font-weight: bold;
  color: #FF9EC4;
  margin-bottom: 5px;
}

.summary-label {
  font-size: 12px;
  color: #999999;
}

.chart-container {
  width: 100%;
  height: 200px;
}
</style>
```

---

## Task 9: 相册管理功能

**Files:**
- Create: `pages/album/index.vue`

- [ ] **Step 1: 创建相册页面**

创建 `pages/album/index.vue`：

```vue
<template>
  <view class="album-page">
    <!-- 添加照片按钮 -->
    <view class="add-photo-btn" @click="choosePhoto">
      <text class="add-icon">+</text>
      <text class="add-text">添加照片</text>
    </view>

    <!-- 月份分组照片列表 -->
    <view class="photo-section" v-for="(group, index) in photoGroups" :key="index">
      <view class="section-title">{{ group.month }}</view>
      <view class="photo-grid">
        <view 
          class="photo-item" 
          v-for="photo in group.photos" 
          :key="photo.id"
          @click="previewPhoto(photo)"
        >
          <image class="photo-image" :src="photo.thumbnail_path || photo.photo_path" mode="aspectFill"></image>
          <view class="photo-caption" v-if="photo.caption">{{ photo.caption }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { db } from '@/utils/database'
import { getDeviceId, formatTime } from '@/utils/device'

const photoGroups = ref<any[]>([])

const choosePhoto = () => {
  uni.chooseImage({
    count: 9,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePaths = res.tempFilePaths
      
      for (const filePath of tempFilePaths) {
        await savePhoto(filePath)
      }
      
      uni.showToast({ title: '保存成功', icon: 'success' })
      loadPhotos()
    }
  })
}

const savePhoto = async (filePath: string) => {
  try {
    // 压缩图片
    const compressRes = await new Promise<any>((resolve) => {
      uni.compressImage({
        src: filePath,
        quality: 80,
        success: (res) => resolve(res),
        fail: () => resolve({ tempFilePath: filePath })
      })
    })
    
    // 保存到本地
    const saveRes = await new Promise<any>((resolve) => {
      uni.saveFile({
        tempFilePath: compressRes.tempFilePath,
        success: (res) => resolve(res),
        fail: () => resolve(null)
      })
    })
    
    if (!saveRes) return
    
    const timestamp = Date.now()
    const uniqueId = `${timestamp}_photo_${getDeviceId()}`
    const month = formatTime(timestamp, 'YYYY年MM月')
    
    await db.executeSql(`
      INSERT INTO photos (unique_id, photo_path, month, timestamp, device_id, created_at)
      VALUES ('${uniqueId}', '${saveRes.savedFilePath}', '${month}', ${timestamp}, '${getDeviceId()}', ${timestamp})
    `)
  } catch (error) {
    console.error('保存照片失败', error)
  }
}

const loadPhotos = async () => {
  try {
    const photos = await db.selectSql(`
      SELECT * FROM photos
      ORDER BY timestamp DESC
    `)
    
    // 按月份分组
    const groupMap = new Map<string, any[]>()
    
    if (photos && photos.length > 0) {
      photos.forEach((photo: any) => {
        const month = photo.month
        if (!groupMap.has(month)) {
          groupMap.set(month, [])
        }
        groupMap.get(month)!.push(photo)
      })
    }
    
    photoGroups.value = Array.from(groupMap.entries()).map(([month, photos]) => ({
      month,
      photos
    }))
  } catch (error) {
    console.error('加载照片失败', error)
  }
}

const previewPhoto = (photo: any) => {
  uni.previewImage({
    urls: [photo.photo_path],
    current: photo.photo_path
  })
}

onMounted(() => {
  loadPhotos()
})
</script>

<style scoped>
.album-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding: 15px;
}

.add-photo-btn {
  background: #FFFFFF;
  border: 2px dashed #FF9EC4;
  border-radius: 16px;
  padding: 30px;
  text-align: center;
  margin-bottom: 15px;
}

.add-icon {
  display: block;
  font-size: 40px;
  color: #FF9EC4;
  margin-bottom: 10px;
}

.add-text {
  font-size: 14px;
  color: #666666;
}

.photo-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
  margin-bottom: 10px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
}

.photo-image {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

.photo-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 5px;
  background: rgba(0, 0, 0, 0.5);
  color: #FFFFFF;
  font-size: 12px;
  border-radius: 0 0 8px 8px;
}
</style>
```

---

## Task 10: 提醒功能

**Files:**
- Create: `pages/reminder/index.vue`
- Create: `utils/reminder.ts`

- [ ] **Step 1: 创建提醒管理工具**

创建 `utils/reminder.ts`：

```typescript
/**
 * 创建本地通知
 */
export function createLocalNotification(title: string, content: string, delayTime: number) {
  // #ifdef APP-PLUS
  const options = {
    title: title,
    content: content,
    when: Date.now() + delayTime
  }
  
  plus.push.createMessage(content, JSON.stringify(options), options)
  // #endif
}

/**
 * 设置喂奶提醒
 */
export function setFeedingReminder(interval: number = 3 * 60 * 60 * 1000) {
  createLocalNotification(
    '喂奶提醒',
    '宝宝该喝奶啦！',
    interval
  )
}

/**
 * 设置疫苗提醒
 */
export function setVaccineReminder(vaccineName: string, date: number) {
  const delayTime = date - Date.now()
  if (delayTime > 0) {
    createLocalNotification(
      '疫苗接种提醒',
      `请记得给宝宝接种${vaccineName}`,
      delayTime
    )
  }
}

/**
 * 取消所有提醒
 */
export function cancelAllReminders() {
  // #ifdef APP-PLUS
  plus.push.clear()
  // #endif
}
```

- [ ] **Step 2: 创建提醒页面**

创建 `pages/reminder/index.vue`：

```vue
<template>
  <view class="reminder-page">
    <!-- 喂奶提醒 -->
    <view class="reminder-card">
      <view class="card-header">
        <view class="card-title">喂奶提醒</view>
        <switch 
          :checked="feedingEnabled" 
          @change="toggleFeedingReminder"
          color="#FF9EC4"
        />
      </view>
      <view class="card-content" v-if="feedingEnabled">
        <view class="form-item">
          <view class="form-label">提醒间隔</view>
          <picker 
            :value="feedingIntervalIndex"
            :range="intervalOptions"
            @change="onFeedingIntervalChange"
          >
            <view class="form-picker">{{ intervalOptions[feedingIntervalIndex] }}</view>
          </picker>
        </view>
      </view>
    </view>

    <!-- 疫苗提醒 -->
    <view class="reminder-card">
      <view class="card-header">
        <view class="card-title">疫苗接种提醒</view>
        <switch 
          :checked="vaccineEnabled"
          @change="toggleVaccineReminder"
          color="#FF9EC4"
        />
      </view>
      <view class="card-content" v-if="vaccineEnabled">
        <view class="form-item">
          <view class="form-label">疫苗名称</view>
          <input 
            class="form-input"
            v-model="vaccineName"
            placeholder="如：乙肝疫苗"
          />
        </view>
        <view class="form-item">
          <view class="form-label">接种日期</view>
          <picker 
            mode="date"
            :value="vaccineDate"
            @change="onVaccineDateChange"
          >
            <view class="form-picker">{{ vaccineDate || '选择日期' }}</view>
          </picker>
        </view>
        <button class="btn-add" @click="addVaccineReminder">添加提醒</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { setFeedingReminder, setVaccineReminder } from '@/utils/reminder'

const feedingEnabled = ref(false)
const feedingIntervalIndex = ref(0)
const intervalOptions = ['每2小时', '每3小时', '每4小时', '每5小时']

const vaccineEnabled = ref(false)
const vaccineName = ref('')
const vaccineDate = ref('')

const toggleFeedingReminder = (e: any) => {
  feedingEnabled.value = e.detail.value
  if (feedingEnabled.value) {
    const intervals = [2, 3, 4, 5]
    const hours = intervals[feedingIntervalIndex.value]
    setFeedingReminder(hours * 60 * 60 * 1000)
    uni.showToast({ title: '提醒已开启', icon: 'success' })
  }
}

const onFeedingIntervalChange = (e: any) => {
  feedingIntervalIndex.value = e.detail.value
  if (feedingEnabled.value) {
    const intervals = [2, 3, 4, 5]
    const hours = intervals[feedingIntervalIndex.value]
    setFeedingReminder(hours * 60 * 60 * 1000)
  }
}

const toggleVaccineReminder = (e: any) => {
  vaccineEnabled.value = e.detail.value
}

const onVaccineDateChange = (e: any) => {
  vaccineDate.value = e.detail.value
}

const addVaccineReminder = () => {
  if (!vaccineName.value || !vaccineDate.value) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }
  
  const timestamp = new Date(vaccineDate.value).getTime()
  setVaccineReminder(vaccineName.value, timestamp)
  
  uni.showToast({ title: '添加成功', icon: 'success' })
  vaccineName.value = ''
  vaccineDate.value = ''
}
</script>

<style scoped>
.reminder-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding: 15px;
}

.reminder-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 15px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
}

.card-content {
  border-top: 1px solid #F5F5F5;
  padding-top: 15px;
}

.form-item {
  margin-bottom: 15px;
}

.form-label {
  font-size: 14px;
  color: #666666;
  margin-bottom: 10px;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
}

.form-picker {
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  color: #333333;
}

.btn-add {
  width: 100%;
  padding: 12px 0;
  background: #FF9EC4;
  border-radius: 25px;
  font-size: 16px;
  color: #FFFFFF;
  margin-top: 10px;
}
</style>
```

---

## Task 11: 数据导入导出和去重

**Files:**
- Create: `utils/export.ts`
- Create: `utils/import.ts`
- Create: `utils/deduplication.ts`
- Update: `pages/settings/index.vue`

- [ ] **Step 1: 创建去重工具**

创建 `utils/deduplication.ts`：

```typescript
import { getDeviceId } from './device'

/**
 * 生成唯一标识
 */
export function generateUniqueId(type: string, timestamp: number): string {
  const deviceId = getDeviceId()
  return `${timestamp}_${type}_${deviceId}`
}

/**
 * 检查记录是否已存在
 */
export async function checkRecordExists(uniqueId: string, table: string): Promise<boolean> {
  // #ifdef APP-PLUS
  const db = plus.sqlite
  const result = await new Promise<any[]>((resolve, reject) => {
    db.selectSql({
      name: 'baby_growth',
      sql: `SELECT id FROM ${table} WHERE unique_id = '${uniqueId}'`,
      success: (data: any[]) => resolve(data),
      fail: (e: any) => reject(e)
    })
  })
  return result && result.length > 0
  // #endif
  
  // #ifndef APP-PLUS
  return false
  // #endif
}
```

- [ ] **Step 2: 创建导出工具**

创建 `utils/export.ts`：

```typescript
import { db } from './database'

/**
 * 导出所有数据
 */
export async function exportAllData(): Promise<any> {
  try {
    const feeds = await db.selectSql('SELECT * FROM feeds ORDER BY timestamp DESC')
    const diapers = await db.selectSql('SELECT * FROM diapers ORDER BY timestamp DESC')
    const sleeps = await db.selectSql('SELECT * FROM sleeps ORDER BY start_time DESC')
    const foods = await db.selectSql('SELECT * FROM foods ORDER BY timestamp DESC')
    const supplements = await db.selectSql('SELECT * FROM supplements ORDER BY timestamp DESC')
    const growthRecords = await db.selectSql('SELECT * FROM growth_records ORDER BY timestamp DESC')
    const photos = await db.selectSql('SELECT * FROM photos ORDER BY timestamp DESC')
    const babyInfo = await db.selectSql('SELECT * FROM baby_info LIMIT 1')
    
    return {
      version: '1.0.0',
      exportTime: Date.now(),
      data: {
        babyInfo: babyInfo && babyInfo.length > 0 ? babyInfo[0] : null,
        feeds: feeds || [],
        diapers: diapers || [],
        sleeps: sleeps || [],
        foods: foods || [],
        supplements: supplements || [],
        growthRecords: growthRecords || [],
        photos: photos || []
      }
    }
  } catch (error) {
    console.error('导出数据失败', error)
    throw error
  }
}

/**
 * 保存数据到文件
 */
export async function saveDataToFile(data: any): Promise<string> {
  const json = JSON.stringify(data, null, 2)
  const fileName = `baby_growth_${Date.now()}.json`
  
  // #ifdef APP-PLUS
  return new Promise((resolve, reject) => {
    plus.io.requestFileSystem(plus.io.PRIVATE_DOC, (fs) => {
      fs.root.getFile(fileName, { create: true }, (fileEntry) => {
        fileEntry.createWriter((writer) => {
          writer.write(json)
          writer.onwrite = () => {
            resolve(fileEntry.fullPath)
          }
          writer.onerror = (e: any) => {
            reject(e)
          }
        })
      })
    })
  })
  // #endif
  
  // #ifdef H5
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
  return fileName
  // #endif
}
```

- [ ] **Step 3: 创建导入工具**

创建 `utils/import.ts`：

```typescript
import { db } from './database'
import { generateUniqueId, checkRecordExists } from './deduplication'

/**
 * 从文件读取数据
 */
export async function readDataFromFile(filePath: string): Promise<any> {
  // #ifdef APP-PLUS
  return new Promise((resolve, reject) => {
    plus.io.resolveLocalFileSystemURL(filePath, (entry) => {
      entry.file((file) => {
        const reader = new plus.io.FileReader()
        reader.onloadend = (e: any) => {
          try {
            const data = JSON.parse(e.target.result)
            resolve(data)
          } catch (error) {
            reject(error)
          }
        }
        reader.readAsText(file)
      })
    })
  })
  // #endif
  
  // #ifdef H5
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e: any) => {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (e: any) => {
        try {
          const data = JSON.parse(e.target.result)
          resolve(data)
        } catch (error) {
          reject(error)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  })
  // #endif
}

/**
 * 导入数据并去重
 */
export async function importDataWithDedup(data: any): Promise<number> {
  let importedCount = 0
  
  const tables = [
    { name: 'feeds', data: data.data.feeds },
    { name: 'diapers', data: data.data.diapers },
    { name: 'sleeps', data: data.data.sleeps },
    { name: 'foods', data: data.data.foods },
    { name: 'supplements', data: data.data.supplements },
    { name: 'growth_records', data: data.data.growthRecords },
    { name: 'photos', data: data.data.photos }
  ]
  
  for (const table of tables) {
    if (!table.data || table.data.length === 0) continue
    
    for (const record of table.data) {
      const exists = await checkRecordExists(record.unique_id, table.name)
      if (!exists) {
        await insertRecord(table.name, record)
        importedCount++
      }
    }
  }
  
  return importedCount
}

/**
 * 插入记录
 */
async function insertRecord(table: string, record: any): Promise<void> {
  const keys = Object.keys(record)
  const values = keys.map(key => {
    const value = record[key]
    if (value === null || value === undefined) return 'NULL'
    if (typeof value === 'number') return value
    return `'${value}'`
  })
  
  await db.executeSql(`
    INSERT INTO ${table} (${keys.join(', ')})
    VALUES (${values.join(', ')})
  `)
}
```

- [ ] **Step 4: 更新设置页面**

创建 `pages/settings/index.vue`：

```vue
<template>
  <view class="settings-page">
    <!-- 宝宝信息 -->
    <view class="settings-card">
      <view class="card-title">宝宝信息</view>
      <view class="form-item">
        <view class="form-label">宝宝姓名</view>
        <input class="form-input" v-model="babyInfo.name" placeholder="请输入宝宝姓名" />
      </view>
      <view class="form-item">
        <view class="form-label">出生日期</view>
        <picker mode="date" :value="babyInfo.birthday" @change="onBirthdayChange">
          <view class="form-picker">{{ babyInfo.birthday || '选择出生日期' }}</view>
        </picker>
      </view>
      <button class="btn-save" @click="saveBabyInfo">保存</button>
    </view>

    <!-- 数据管理 -->
    <view class="settings-card">
      <view class="card-title">数据管理</view>
      <view class="action-item" @click="exportData">
        <view class="action-icon">📤</view>
        <view class="action-text">导出数据</view>
      </view>
      <view class="action-item" @click="importData">
        <view class="action-icon">📥</view>
        <view class="action-text">导入数据</view>
      </view>
      <view class="action-item danger" @click="clearAllData">
        <view class="action-icon">🗑️</view>
        <view class="action-text">清空所有数据</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { db } from '@/utils/database'
import { exportAllData, saveDataToFile } from '@/utils/export'
import { readDataFromFile, importDataWithDedup } from '@/utils/import'

const babyInfo = ref({
  name: '',
  birthday: ''
})

const onBirthdayChange = (e: any) => {
  babyInfo.value.birthday = e.detail.value
}

const saveBabyInfo = async () => {
  try {
    const existing = await db.selectSql('SELECT id FROM baby_info LIMIT 1')
    
    if (existing && existing.length > 0) {
      await db.executeSql(`
        UPDATE baby_info 
        SET name = '${babyInfo.value.name}', 
            birthday = '${babyInfo.value.birthday}',
            updated_at = ${Date.now()}
        WHERE id = ${existing[0].id}
      `)
    } else {
      const timestamp = Date.now()
      await db.executeSql(`
        INSERT INTO baby_info (name, birthday, created_at, updated_at)
        VALUES ('${babyInfo.value.name}', '${babyInfo.value.birthday}', ${timestamp}, ${timestamp})
      `)
    }
    
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (error) {
    console.error('保存失败', error)
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

const exportData = async () => {
  try {
    uni.showLoading({ title: '导出中...' })
    const data = await exportAllData()
    const filePath = await saveDataToFile(data)
    uni.hideLoading()
    
    uni.showModal({
      title: '导出成功',
      content: `数据已保存到：${filePath}`,
      showCancel: false
    })
  } catch (error) {
    uni.hideLoading()
    console.error('导出失败', error)
    uni.showToast({ title: '导出失败', icon: 'none' })
  }
}

const importData = () => {
  // #ifdef APP-PLUS
  plus.io.chooseFile({
    accept: '.json',
    success: async (e: any) => {
      try {
        uni.showLoading({ title: '导入中...' })
        const data = await readDataFromFile(e.filePath)
        const count = await importDataWithDedup(data)
        uni.hideLoading()
        
        uni.showModal({
          title: '导入成功',
          content: `成功导入 ${count} 条记录`,
          showCancel: false
        })
      } catch (error) {
        uni.hideLoading()
        console.error('导入失败', error)
        uni.showToast({ title: '导入失败', icon: 'none' })
      }
    }
  })
  // #endif
  
  // #ifdef H5
  readDataFromFile('').then(async (data) => {
    try {
      uni.showLoading({ title: '导入中...' })
      const count = await importDataWithDedup(data)
      uni.hideLoading()
      
      uni.showModal({
        title: '导入成功',
        content: `成功导入 ${count} 条记录`,
        showCancel: false
      })
    } catch (error) {
      uni.hideLoading()
      console.error('导入失败', error)
      uni.showToast({ title: '导入失败', icon: 'none' })
    }
  })
  // #endif
}

const clearAllData = () => {
  uni.showModal({
    title: '确认清空',
    content: '此操作将清空所有数据，是否继续？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await db.executeSql('DELETE FROM feeds')
          await db.executeSql('DELETE FROM diapers')
          await db.executeSql('DELETE FROM sleeps')
          await db.executeSql('DELETE FROM foods')
          await db.executeSql('DELETE FROM supplements')
          await db.executeSql('DELETE FROM growth_records')
          await db.executeSql('DELETE FROM photos')
          
          uni.showToast({ title: '清空成功', icon: 'success' })
        } catch (error) {
          console.error('清空失败', error)
          uni.showToast({ title: '清空失败', icon: 'none' })
        }
      }
    }
  })
}

onMounted(async () => {
  try {
    const result = await db.selectSql('SELECT * FROM baby_info LIMIT 1')
    if (result && result.length > 0) {
      babyInfo.value.name = result[0].name
      babyInfo.value.birthday = result[0].birthday
    }
  } catch (error) {
    console.error('加载宝宝信息失败', error)
  }
})
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding: 15px;
}

.settings-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 15px;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
  margin-bottom: 15px;
}

.form-item {
  margin-bottom: 15px;
}

.form-label {
  font-size: 14px;
  color: #666666;
  margin-bottom: 10px;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
}

.form-picker {
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  color: #333333;
}

.btn-save {
  width: 100%;
  padding: 12px 0;
  background: #FF9EC4;
  border-radius: 25px;
  font-size: 16px;
  color: #FFFFFF;
  margin-top: 10px;
}

.action-item {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #F5F5F5;
}

.action-item:last-child {
  border-bottom: none;
}

.action-item.danger .action-text {
  color: #FF4444;
}

.action-icon {
  font-size: 24px;
  margin-right: 12px;
}

.action-text {
  font-size: 14px;
  color: #333333;
}
</style>
```

---

## Task 12: 成长指标记录

**Files:**
- Create: `pages/record/growth.vue`

- [ ] **Step 1: 创建成长指标记录页面**

创建 `pages/record/growth.vue`：

```vue
<template>
  <view class="growth-page">
    <view class="form-section">
      <view class="form-item">
        <view class="form-label">身高 (cm)</view>
        <input 
          class="form-input"
          
          v-model="formData.height"
          placeholder="请输入身高"
        />
      </view>

      <view class="form-item">
        <view class="form-label">体重 (kg)</view>
        <input 
          class="form-input"
          
          v-model="formData.weight"
          placeholder="请输入体重"
        />
      </view>

      <view class="form-item">
        <view class="form-label">头围 (cm)</view>
        <input 
          class="form-input"
          
          v-model="formData.headCircumference"
          placeholder="请输入头围"
        />
      </view>

      <view class="form-item">
        <view class="form-label">记录日期</view>
        <picker 
          mode="date" 
          :value="formData.date"
          @change="onDateChange"
        >
          <view class="form-picker">{{ formData.date || '选择日期' }}</view>
        </picker>
      </view>

      <view class="form-item">
        <view class="form-label">备注</view>
        <textarea 
          class="form-textarea"
          v-model="formData.note"
          placeholder="记录成长情况..."
        />
      </view>
    </view>

    <view class="form-actions">
      <button class="btn-cancel" @click="handleCancel">取消</button>
      <button class="btn-save" @click="handleSave">保存</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { db } from '@/utils/database'
import { getDeviceId, formatTime } from '@/utils/device'

const formData = ref({
  height: '',
  weight: '',
  headCircumference: '',
  date: formatTime(Date.now(), 'YYYY-MM-DD'),
  note: ''
})

const onDateChange = (e: any) => {
  formData.value.date = e.detail.value
}

const handleCancel = () => {
  uni.navigateBack()
}

const handleSave = async () => {
  if (!formData.value.height && !formData.value.weight && !formData.value.headCircumference) {
    uni.showToast({ title: '请至少填写一项指标', icon: 'none' })
    return
  }

  try {
    const timestamp = Date.now()
    const uniqueId = `${timestamp}_growth_${getDeviceId()}`
    
    await db.executeSql(`
      INSERT INTO growth_records (unique_id, height, weight, head_circumference, note, timestamp, device_id, created_at)
      VALUES (
        '${uniqueId}', 
        ${formData.value.height || 'NULL'}, 
        ${formData.value.weight || 'NULL'}, 
        ${formData.value.headCircumference || 'NULL'},
        '${formData.value.note}', 
        ${timestamp}, 
        '${getDeviceId()}', 
        ${timestamp}
      )
    `)

    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('保存失败', error)
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}
</script>

<style scoped>
.growth-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding: 15px;
}

.form-section {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  font-size: 14px;
  color: #666666;
  margin-bottom: 10px;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
}

.form-picker {
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  color: #333333;
}

.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.btn-cancel {
  flex: 1;
  padding: 15px 0;
  border: 1px solid #E5E5E5;
  border-radius: 25px;
  background: #FFFFFF;
  font-size: 16px;
  color: #666666;
}

.btn-save {
  flex: 1;
  padding: 15px 0;
  border-radius: 25px;
  background: #FF9EC4;
  font-size: 16px;
  color: #FFFFFF;
}
</style>
```

---

## Task 13: 安卓和鸿蒙打包配置

**Files:**
- Update: `manifest.json`

- [ ] **Step 1: 配置安卓打包**

在 `manifest.json` 中配置安卓应用信息：

```json
{
  "app-plus": {
    "distribute": {
      "android": {
        "appid": "com.baby.growth",
        "packagename": "com.baby.growth",
        "permissions": [
          "<uses-permission android:name=\"android.permission.WRITE_EXTERNAL_STORAGE\"/>",
          "<uses-permission android:name=\"android.permission.READ_EXTERNAL_STORAGE\"/>",
          "<uses-permission android:name=\"android.permission.CAMERA\"/>",
          "<uses-permission android:name=\"android.permission.VIBRATE\"/>",
          "<uses-permission android:name=\"android.permission.INTERNET\"/>"
        ]
      }
    }
  }
}
```

- [ ] **Step 2: 配置鸿蒙打包**

1. 下载并安装 DevEco Studio：https://developer.huawei.com/consumer/cn/deveco-studio/
2. 在 HBuilderX 中运行到鸿蒙：运行 -> 运行到手机或模拟器 -> 运行到鸿蒙
3. 首次运行会自动创建鸿蒙工程目录
4. 使用 DevEco Studio 打开生成的鸿蒙工程
5. 配置签名证书
6. 构建鸿蒙 HAP 包

详细步骤参考：https://uniapp.dcloud.net.cn/tutorial/harmony/runbuild.html

---

## Task 14: 完善首页数据加载

**Files:**
- Update: `pages/index/index.vue`

- [ ] **Step 1: 实现首页数据加载**

更新 `pages/index/index.vue` 中的 `onMounted`：

```typescript
onMounted(async () => {
  try {
    // 加载宝宝信息
    const babyResult = await db.selectSql('SELECT * FROM baby_info LIMIT 1')
    if (babyResult && babyResult.length > 0) {
      babyInfo.value = babyResult[0]
    }
    
    // 加载今日统计数据
    const today = new Date()
    const startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
    
    // 喂奶统计
    const feeds = await db.selectSql(`
      SELECT COUNT(*) as count FROM feeds WHERE timestamp >= ${startTime}
    `)
    if (feeds && feeds.length > 0) {
      todayStats.value.feeding = feeds[0].count
    }
    
    // 纸尿裤统计
    const diapers = await db.selectSql(`
      SELECT COUNT(*) as count FROM diapers WHERE timestamp >= ${startTime}
    `)
    if (diapers && diapers.length > 0) {
      todayStats.value.diaper = diapers[0].count
    }
    
    // 睡眠统计
    const sleeps = await db.selectSql(`
      SELECT SUM(duration) as total FROM sleeps 
      WHERE start_time >= ${startTime}
    `)
    if (sleeps && sleeps.length > 0 && sleeps[0].total) {
      todayStats.value.sleep = Math.floor(sleeps[0].total / (1000 * 60 * 60))
    }
    
    // 加载最近记录
    const allRecords = []
    
    const recentFeeds = await db.selectSql(`
      SELECT id, 'feeding' as type, timestamp FROM feeds
      ORDER BY timestamp DESC LIMIT 5
    `)
    if (recentFeeds) {
      allRecords.push(...recentFeeds.map((r: any) => ({
        id: r.id,
        type: r.type,
        time: formatTime(r.timestamp, 'HH:mm')
      })))
    }
    
    const recentDiapers = await db.selectSql(`
      SELECT id, 'diaper' as type, timestamp FROM diapers
      ORDER BY timestamp DESC LIMIT 5
    `)
    if (recentDiapers) {
      allRecords.push(...recentDiapers.map((r: any) => ({
        id: r.id,
        type: r.type,
        time: formatTime(r.timestamp, 'HH:mm')
      })))
    }
    
    // 按时间排序
    recentRecords.value = allRecords
      .sort((a: any, b: any) => b.timestamp - a.timestamp)
      .slice(0, 10)
    
  } catch (error) {
    console.error('加载数据失败', error)
  }
})
```

---

## Task 15: 测试和最终打包

- [ ] **Step 1: 运行测试**

在 HBuilderX 中：
1. 运行 -> 运行到手机或模拟器 -> 运行到 Android App 基座
2. 测试所有功能模块
3. 测试数据导入导出
4. 测试去重功能
5. 测试提醒功能

- [ ] **Step 2: 打包安卓 APK**

在 HBuilderX 中：
1. 发行 -> 原生App-云打包
2. 选择 Android 平台
3. 填写证书信息（DCloud公共证书可用于测试）
4. 点击打包
5. 等待打包完成，下载 APK

- [ ] **Step 3: 打包鸿蒙 HAP**

1. 在 HBuilderX 中运行到鸿蒙
2. 使用 DevEco Studio 打开生成的鸿蒙工程
3. Build -> Build Hap(s)/APP(s) -> Build Hap(s)
4. 在 `entry/build/default/outputs/default/` 目录下找到 HAP 文件

---

## 执行说明

本计划共包含 15 个主要任务，涵盖了从项目创建到最终打包的完整流程。每个任务都包含了详细的实现步骤、完整的代码示例和验证方法。

**执行顺序：**
1. 按照 Task 1-15 顺序执行
2. 每完成一个 Task，勾选对应的 checkbox
3. 遇到问题时，参考代码示例进行调整

**注意事项：**
1. 确保开发环境已正确配置
2. 测试时使用真机测试，确保功能正常
3. 打包前进行充分测试
4. 数据导入导出功能需要特别注意去重逻辑

---

**计划完成！** 🎉


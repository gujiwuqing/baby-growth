# 宝宝成长记录 App - 优化设计计划 v2.1

## 📋 项目概述

一个基于 uni-app 的宝宝成长记录应用,支持安卓、iOS、鸿蒙三端。核心功能为三大模块:
1. **喂养记录** - 喂奶、辅食、零食、水分摄入（含统计功能）
2. **身高体重** - 成长指标记录与曲线分析
3. **疫苗接种** - 接种计划、进度跟踪、提醒

---

## 🎯 核心设计原则

### 1. 功能完整性
- ✅ 每个核心功能都有:查看入口、记录入口、历史数据
- ✅ 数据可视化(曲线图、进度条、统计卡片)
- ✅ 完整的用户闭环(记录→查看→分析→提醒)

### 2. 首页设计理念
- 喂养记录为主要功能入口
- 首页展示今日时间轴，快速记录
- 其他功能通过TabBar独立访问

### 3. 数据持久化
- 本地 SQLite 数据库
- 支持数据导入导出(JSON)
- 智能去重机制

---

## 🏗️ 整体架构

```
TabBar导航架构
├─ 首页
│  ├─ 喂养记录入口（宫格）
│  ├─ 今日时间轴
│  └─ 快速记录按钮
│
├─ 身高体重（独立Tab）
│  ├─ 最新数据展示
│  ├─ 成长曲线图
│  └─ 历史记录
│
├─ 疫苗接种（独立Tab）
│  ├─ 接种进度
│  ├─ 接种计划
│  └─ 记录接种
│
└─ 设置
   ├─ 宝宝信息
   ├─ 数据管理
   └─ 其他设置
```

---

## 📱 页面结构

```
pages/
├─ index/                    # 首页
│  └─ index.vue             # 喂养入口 + 今日时间轴
│
├─ feeding/                  # 喂养记录模块
│  ├─ index.vue             # 喂养详情页(今日/本周/本月统计)
│  └─ record.vue            # 快速记录页
│
├─ growth/                   # 身高体重模块（TabBar）
│  ├─ index.vue             # 成长详情页(曲线+历史)
│  └─ record.vue            # 记录新数据
│
├─ vaccine/                  # 疫苗接种模块（TabBar）
│  ├─ index.vue             # 疫苗详情页(计划+进度)
│  └─ record.vue            # 记录接种
│
├─ record/                   # 其他记录
│  ├─ sleep.vue             # 睡眠记录
│  └─ diaper.vue            # 排泄记录
│
└─ settings/                 # 设置页（TabBar）
   └─ index.vue             # 宝宝信息+数据管理
```

---

## 🗄️ 数据库设计

### 表结构优化

```sql
-- 宝宝信息表
CREATE TABLE baby_info (
  id INTEGER PRIMARY KEY,
  name TEXT,
  birthday TEXT,
  avatar TEXT,
  gender TEXT,
  created_at INTEGER,
  updated_at INTEGER
)

-- 喂养记录表
CREATE TABLE feeds (
  id INTEGER PRIMARY KEY,
  unique_id TEXT UNIQUE,
  type TEXT,              -- 'milk' | 'food' | 'snack' | 'water'
  amount REAL,
  food_name TEXT,
  timestamp INTEGER,
  note TEXT,
  device_id TEXT,
  created_at INTEGER
)

-- 成长指标表
CREATE TABLE growth_records (
  id INTEGER PRIMARY KEY,
  unique_id TEXT UNIQUE,
  height REAL,
  weight REAL,
  head_circumference REAL,
  timestamp INTEGER,
  note TEXT,
  device_id TEXT,
  created_at INTEGER
)

-- 疫苗接种表
CREATE TABLE vaccines (
  id INTEGER PRIMARY KEY,
  unique_id TEXT UNIQUE,
  vaccine_name TEXT,
  vaccine_type TEXT,      -- 'free' | 'paid'
  scheduled_date INTEGER,
  actual_date INTEGER,
  status TEXT,            -- 'pending' | 'done' | 'missed'
  note TEXT,
  device_id TEXT,
  created_at INTEGER
)

-- 照片记录表
CREATE TABLE photos (
  id INTEGER PRIMARY KEY,
  unique_id TEXT UNIQUE,
  photo_path TEXT,
  thumbnail_path TEXT,
  milestone TEXT,
  timestamp INTEGER,
  note TEXT,
  device_id TEXT,
  created_at INTEGER
)

-- 睡眠记录表
CREATE TABLE sleeps (
  id INTEGER PRIMARY KEY,
  unique_id TEXT UNIQUE,
  start_time INTEGER,
  end_time INTEGER,
  duration INTEGER,
  quality TEXT,
  note TEXT,
  device_id TEXT,
  created_at INTEGER
)

-- 排泄记录表
CREATE TABLE diapers (
  id INTEGER PRIMARY KEY,
  unique_id TEXT UNIQUE,
  type TEXT,              -- 'pee' | 'poop' | 'both'
  timestamp INTEGER,
  note TEXT,
  device_id TEXT,
  created_at INTEGER
)
```

---

## 🎨 UI 设计规范

### 色彩方案
- 主色调: `#FF9EC4` (粉色)
- 辅助色: `#FFD4E5` (浅粉)
- 背景色: `#FFF5F7` (淡粉背景)
- 文字色: `#333333` (深灰)
- 辅助文字: `#666666` (中灰)
- 边框色: `#E5E5E5` (浅灰)

### 组件规范
- 圆角: 16px (卡片) / 8px (按钮) / 25px (大按钮)
- 间距: 15px (模块) / 10px (内部元素)
- 字号: 16px (标题) / 14px (正文) / 12px (辅助)

---

## ✅ Task 清单

### Task 1: 项目初始化

**目标:** 创建 uni-app 项目,配置开发环境

- [ ] 使用 HBuilderX 创建 uni-app 项目
- [ ] 配置 Vue 3 + TypeScript
- [ ] 安装必要的依赖
- [ ] 配置 SQLite 数据库

### Task 2: 数据库初始化

**目标:** 创建数据库工具类和表结构

**Files:**
- Create: `utils/database.ts`

- [ ] 创建数据库连接工具类
- [ ] 实现表结构创建
- [ ] 实现基本 CRUD 操作

### Task 3: 设备信息工具

**目标:** 获取设备唯一标识,用于数据去重

**Files:**
- Create: `utils/device.ts`

- [ ] 获取设备 UUID
- [ ] 格式化时间工具
- [ ] 生成唯一 ID 方法

### Task 4: 重构首页

**目标:** 四大核心功能宫格布局 + 今日时间轴

**Files:**
- Update: `pages/index/index.vue`

- [ ] 宝宝信息卡片
- [ ] 四大功能宫格布局
- [ ] 今日记录时间轴
- [ ] 数据加载逻辑

### Task 5: 喂养记录模块

**目标:** 统计 + 历史 + 快速记录

**Files:**
- Create: `pages/feeding/index.vue`
- Create: `pages/feeding/record.vue`

- [ ] 喂养详情页(今日统计)
- [ ] 历史记录列表
- [ ] 快速记录页

### Task 6: 身高体重模块

**目标:** 成长曲线 + 历史记录 + WHO 标准

**Files:**
- Create: `pages/growth/index.vue`
- Create: `pages/growth/record.vue`

- [ ] 成长详情页
- [ ] 成长曲线图(使用 uCharts)
- [ ] 记录新数据

### Task 7: 疫苗接种模块

**目标:** 接种计划 + 进度跟踪 + 提醒

**Files:**
- Create: `pages/vaccine/index.vue`
- Create: `pages/vaccine/record.vue`

- [ ] 疫苗详情页(接种进度)
- [ ] 接种计划列表
- [ ] 记录接种页
- [ ] 接种提醒功能

### Task 8: 成长相册模块

**目标:** 时间轴展示 + 照片管理

**Files:**
- Create: `pages/album/index.vue`
- Create: `pages/album/detail.vue`

- [ ] 相册时间轴页
- [ ] 照片详情页
- [ ] 照片上传逻辑

### Task 9: 其他记录功能

**目标:** 睡眠、排泄记录

**Files:**
- Create: `pages/record/sleep.vue`
- Create: `pages/record/diaper.vue`

- [ ] 睡眠记录页
- [ ] 排泄记录页

### Task 10: 设置页面

**目标:** 宝宝信息管理 + 数据导入导出

**Files:**
- Create: `pages/settings/index.vue`

- [ ] 宝宝信息编辑
- [ ] 数据导出功能
- [ ] 数据导入功能(带去重)
- [ ] 清空数据功能

### Task 11: 数据导入导出

**目标:** 完善数据管理功能

**Files:**
- Create: `utils/export.ts`
- Create: `utils/import.ts`

- [ ] 导出所有数据为 JSON
- [ ] 导入数据并去重
- [ ] 文件读写工具

### Task 12: 国际化疫苗计划

**目标:** 预置国家免疫规划疫苗

**Files:**
- Create: `utils/vaccinePlan.ts`

- [ ] 0-6岁免疫规划疫苗列表
- [ ] 根据宝宝生日生成计划
- [ ] 接种提醒计算

### Task 13: 成长曲线算法

**目标:** WHO 儿童生长标准曲线

**Files:**
- Create: `utils/growthCurve.ts`

- [ ] WHO 身高标准数据
- [ ] WHO 体重标准数据
- [ ] 百分位数计算
- [ ] 曲线绘制算法

### Task 14: 配置和打包

**目标:** 安卓、鸿蒙打包配置

**Files:**
- Update: `manifest.json`
- Update: `pages.json`

- [ ] 安卓打包配置
- [ ] 鸿蒙打包配置
- [ ] 页面路由配置

### Task 15: 测试和优化

- [ ] 功能测试
- [ ] UI 优化
- [ ] 性能优化
- [ ] 打包发布

---

## 📊 核心功能详细设计

### 1. 首页设计

```vue
<!-- pages/index/index.vue -->
<template>
  <view class="home-page">
    <!-- 宝宝信息卡片 -->
    <view class="baby-card">
      <image class="baby-avatar" :src="babyInfo.avatar" />
      <view class="baby-info">
        <text class="baby-name">{{ babyInfo.name }}</text>
        <text class="baby-age">{{ babyAge }}个月</text>
      </view>
      <view class="baby-stats">
        <text class="stat-item">身高 {{ latestGrowth.height }}cm</text>
        <text class="stat-item">体重 {{ latestGrowth.weight }}kg</text>
      </view>
    </view>

    <!-- 四大核心功能 -->
    <view class="core-functions">
      <view class="function-grid">
        <!-- 喂养记录 -->
        <view class="function-item" @click="goToFeeding">
          <view class="function-icon">🍼</view>
          <view class="function-name">喂养记录</view>
          <view class="function-data">今日{{ todayStats.feeding }}次</view>
        </view>

        <!-- 身高体重 -->
        <view class="function-item" @click="goToGrowth">
          <view class="function-icon">📏</view>
          <view class="function-name">身高体重</view>
          <view class="function-data">{{ latestGrowth.height }}cm / {{ latestGrowth.weight }}kg</view>
        </view>

        <!-- 疫苗接种 -->
        <view class="function-item" @click="goToVaccine">
          <view class="function-icon">💉</view>
          <view class="function-name">疫苗接种</view>
          <view class="function-data">已接种{{ vaccineProgress.done }}/{{ vaccineProgress.total }}针</view>
        </view>

        <!-- 成长相册 -->
        <view class="function-item" @click="goToAlbum">
          <view class="function-icon">📸</view>
          <view class="function-name">成长相册</view>
          <view class="function-data">{{ photoCount }}张照片</view>
        </view>
      </view>
    </view>

    <!-- 今日时间轴 -->
    <view class="today-timeline">
      <view class="timeline-title">今日记录</view>
      <view class="timeline-list">
        <view v-for="record in todayRecords" :key="record.id" class="timeline-item">
          <text class="record-time">{{ record.time }}</text>
          <text class="record-type">{{ record.typeName }}</text>
          <text class="record-detail">{{ record.detail }}</text>
        </view>
      </view>
    </view>

    <!-- 快速记录浮动按钮 -->
    <view class="quick-record" @click="showQuickRecord">
      <text class="quick-icon">+</text>
    </view>
  </view>
</template>
```

### 2. 身高体重详情页设计

```vue
<!-- pages/growth/index.vue -->
<template>
  <view class="growth-page">
    <!-- 最新数据卡片 -->
    <view class="latest-card">
      <view class="card-title">最新数据</view>
      <view class="data-grid">
        <view class="data-item">
          <text class="data-label">身高</text>
          <text class="data-value">{{ latestData.height }}cm</text>
          <text class="data-percentile">P{{ heightPercentile }}</text>
        </view>
        <view class="data-item">
          <text class="data-label">体重</text>
          <text class="data-value">{{ latestData.weight }}kg</text>
          <text class="data-percentile">P{{ weightPercentile }}</text>
        </view>
        <view class="data-item">
          <text class="data-label">头围</text>
          <text class="data-value">{{ latestData.headCircumference }}cm</text>
          <text class="data-percentile">P{{ headPercentile }}</text>
        </view>
      </view>
      <text class="data-date">测量日期: {{ latestData.date }}</text>
    </view>

    <!-- 成长曲线 -->
    <view class="growth-curve">
      <view class="curve-title">成长曲线</view>
      <view class="curve-tabs">
        <text :class="['tab', activeCurve === 'height' ? 'active' : '']" @click="switchCurve('height')">身高</text>
        <text :class="['tab', activeCurve === 'weight' ? 'active' : '']" @click="switchCurve('weight')">体重</text>
      </view>
      <qiun-ucharts type="line" :opts="curveOpts" :chartData="curveData" />
    </view>

    <!-- 记录按钮 -->
    <button class="record-btn" @click="goToRecord">添加记录</button>

    <!-- 历史记录 -->
    <view class="history-list">
      <view class="history-title">历史记录</view>
      <view v-for="record in historyRecords" :key="record.id" class="history-item">
        <text class="record-date">{{ record.date }}</text>
        <text class="record-data">{{ record.height }}cm / {{ record.weight }}kg</text>
      </view>
    </view>
  </view>
</template>
```

### 3. 疫苗接种详情页设计

```vue
<!-- pages/vaccine/index.vue -->
<template>
  <view class="vaccine-page">
    <!-- 接种进度 -->
    <view class="progress-card">
      <view class="progress-title">接种进度</view>
      <text class="progress-text">已完成 {{ doneCount }}/{{ totalCount }} 针</text>
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
      </view>
    </view>

    <!-- 即将接种提醒 -->
    <view v-if="upcomingVaccine" class="upcoming-card">
      <view class="upcoming-icon">⏰</view>
      <view class="upcoming-info">
        <text class="upcoming-name">{{ upcomingVaccine.name }}</text>
        <text class="upcoming-date">{{ upcomingVaccine.date }}</text>
        <text class="upcoming-days">还有 {{ upcomingVaccine.days }} 天</text>
      </view>
    </view>

    <!-- 接种计划 -->
    <view class="plan-list">
      <view class="plan-tabs">
        <text :class="['tab', activeTab === 'free' ? 'active' : '']" @click="switchTab('free')">免费疫苗</text>
        <text :class="['tab', activeTab === 'paid' ? 'active' : '']" @click="switchTab('paid')">自费疫苗</text>
      </view>

      <view v-for="vaccine in vaccineList" :key="vaccine.id" class="plan-item">
        <view class="vaccine-status">
          <text v-if="vaccine.status === 'done'" class="status-done">✓</text>
          <text v-else-if="vaccine.status === 'pending'" class="status-pending">⏳</text>
          <text v-else class="status-missed">○</text>
        </view>
        <view class="vaccine-info">
          <text class="vaccine-name">{{ vaccine.name }}</text>
          <text class="vaccine-age">{{ vaccine.ageRange }}</text>
        </view>
        <view class="vaccine-action">
          <text v-if="vaccine.status === 'pending'" @click="recordVaccine(vaccine)">记录</text>
        </view>
      </view>
    </view>
  </view>
</template>
```

---

## 🔧 技术栈

- **框架:** uni-app + Vue 3 + TypeScript
- **数据库:** SQLite (uni-app 内置)
- **图表:** qiun-ucharts (uni-app 图表库)
- **存储:** 本地文件系统
- **UI 组件:** 自定义组件 + uni-app 内置组件

---

## 📝 实现优先级

### 第一优先级 (MVP)
1. 数据库初始化 ✅
2. 首页四大功能入口 ✅
3. 喂养记录完整功能 ✅
4. 身高体重详情页 ✅

### 第二优先级
5. 疫苗接种详情页 ✅
6. 成长相册时间轴 ✅
7. 数据导入导出 ✅

### 第三优先级
8. 成长曲线 WHO 标准 ✅
9. 疫苗接种提醒 ✅
10. 其他记录功能 ✅

---

## 🚀 执行计划

按照 Task 1-15 顺序执行:
1. 每完成一个 Task,勾选 checkbox
2. 每个功能完成后进行测试
3. 所有功能完成后进行打包测试

---

**计划版本:** v2.0
**更新时间:** 2026-06-05
**优化重点:** 四大核心功能完整闭环 + 首页清晰入口
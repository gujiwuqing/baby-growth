# 宝宝成长记 APP

> 记录宝宝成长的每一个瞬间 💕

## 📱 项目简介

这是一款专为新手爸妈设计的宝宝成长记录应用，支持记录喂奶、换尿布、睡眠、辅食、成长指标等数据，并提供统计分析、相册管理、智能提醒等功能。

## ✨ 核心功能

### 已实现功能 ✅

- **📊 首页仪表盘**
  - 宝宝信息展示
  - 今日统计概览（喂奶次数、换尿布、睡眠时长）
  - 快捷记录入口
  - 最近记录列表

- **📝 记录功能**
  - ✅ 喂奶记录（母乳/奶粉/混合，记录量和时间）
  - ✅ 纸尿裤记录（尿/屎/混合）
  - 🚧 睡眠记录（开发中）
  - 🚧 辅食记录（开发中）
  - 🚧 营养补充记录（开发中）
  - 🚧 成长指标记录（开发中）

- **⚙️ 设置功能**
  - 宝宝信息管理
  - 数据管理（清空数据）

### 开发中功能 🚧

- 📈 统计分析（使用 uCharts 图表）
- 📸 成长相册
- ⏰ 提醒功能（喂奶、疫苗提醒）
- 📥 数据导入导出（支持去重）

## 🛠️ 技术栈

- **框架**: UniApp + Vue 3 + TypeScript
- **数据库**: SQLite（本地持久化存储）
- **图表**: uCharts（跨端图表库）
- **UI风格**: 温馨可爱风（粉色系）

## 📦 项目结构

```
baby-growth/
├── pages/                  # 页面目录
│   ├── index/             # 首页
│   ├── record/            # 记录页面
│   │   ├── feeding.vue    # 喂奶记录
│   │   ├── diaper.vue     # 纸尿裤记录
│   │   ├── sleep.vue      # 睡眠记录
│   │   ├── food.vue       # 辅食记录
│   │   ├── supplement.vue # 营养补充
│   │   └── growth.vue     # 成长指标
│   ├── statistics/        # 统计分析
│   ├── album/             # 成长相册
│   ├── reminder/          # 提醒管理
│   └── settings/          # 设置
├── components/            # 组件目录
│   └── QuickRecord/      # 快捷记录组件
├── utils/                 # 工具函数
│   ├── database.ts       # SQLite 数据库封装
│   └── device.ts         # 设备信息工具
├── static/                # 静态资源
├── App.vue               # 应用入口
├── main.ts               # 主入口文件
├── manifest.json         # 应用配置
├── pages.json            # 页面配置
└── package.json          # 项目依赖

```

## 🚀 快速开始

### 方式一：使用 HBuilderX（推荐）

1. **下载安装 HBuilderX**
   - 访问：https://www.dcloud.io/hbuilderx.html
   - 下载 App 开发版

2. **导入项目**
   - 打开 HBuilderX
   - 文件 -> 导入 -> 从本地目录导入
   - 选择 `baby-growth` 文件夹

3. **运行项目**
   - 运行 -> 运行到手机或模拟器
   - 选择 Android/iOS 基座运行
   - 或运行到浏览器（H5模式）

4. **安装依赖**（如需要）
   ```bash
   npm install
   ```

### 方式二：命令行运行

```bash
# 进入项目目录
cd baby-growth

# 安装依赖
npm install

# 运行开发模式
npm run dev
```

## 📱 打包发布

### Android 打包

1. 在 HBuilderX 中：发行 -> 原生App-云打包
2. 选择 Android 平台
3. 填写证书信息（可使用 DCloud 公共证书测试）
4. 点击打包，等待完成

### 鸿蒙打包

1. 安装 DevEco Studio：https://developer.huawei.com/consumer/cn/deveco-studio/
2. 在 HBuilderX 中运行到鸿蒙
3. 使用 DevEco Studio 打开生成的鸿蒙工程
4. Build -> Build Hap(s)

详细步骤：https://uniapp.dcloud.net.cn/tutorial/harmony/runbuild.html

## 🗄️ 数据库设计

### 核心数据表

- `baby_info` - 宝宝信息表
- `feeds` - 喂奶记录表
- `diapers` - 纸尿裤记录表
- `sleeps` - 睡眠记录表
- `foods` - 辅食记录表
- `supplements` - 营养补充表
- `growth_records` - 成长指标表
- `photos` - 照片记录表
- `reminders` - 提醒配置表

## 🔒 数据安全

- 所有数据存储在本地 SQLite 数据库中
- 支持数据导出备份（JSON 格式）
- 智能去重机制（基于时间戳+类型+设备ID）
- 无需网络，保护隐私

## 🎨 UI 设计

### 配色方案

- 主色：`#FF9EC4`（温馨粉）
- 辅色：`#A8E6CF`（薄荷绿）
- 背景：`#FFF5F7`（淡粉背景）
- 文字：`#333333`（深灰主文字）

### 设计理念

- 温馨可爱的视觉风格
- 圆角卡片设计
- 简洁直观的交互
- 适合新手爸妈使用

## 📊 功能路线图

### v1.0（当前）
- ✅ 基础框架搭建
- ✅ 数据库设计
- ✅ 首页功能
- ✅ 喂奶、纸尿裤记录

### v1.1（计划中）
- 📈 统计图表功能
- 😴 睡眠记录功能
- 🥣 辅食、营养补充记录
- 📸 相册管理

### v1.2（计划中）
- ⏰ 智能提醒功能
- 📥 数据导入导出
- 📋 成长报告生成

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 💝 致谢

感谢所有为这个项目做出贡献的开发者！

---

**Made with ❤️ for new parents**

# 宝宝成长记 - 运行指南

## 🚀 快速开始

### 方式一：使用 HBuilderX（推荐）⭐️

1. **下载安装 HBuilderX**
   - 访问：https://www.dcloud.io/hbuilderx.html
   - 下载 **App 开发版**（自带 UniApp 编译器）

2. **导入项目**
   ```
   文件 -> 导入 -> 从本地目录导入
   选择：/Users/feng/Desktop/meiyou/baby-growth
   ```

3. **运行项目**
   - **H5 模式**：右键项目 -> 运行 -> 运行到内置浏览器
   - **APP 模式**：右键项目 -> 运行 -> 运行到手机或模拟器 -> 运行到 Android/iOS 基座

4. **打包项目**
   - 右键项目 -> 发行 -> 原生App-云打包（安卓/iOS）
   - 右键项目 -> 发行 -> 网站-H5手机版

---

### 方式二：命令行运行（仅 H5）

如果您已全局安装 UniApp CLI：

```bash
# 安装依赖
npm install -g @dcloudio/uvm

# 运行 H5
uni

# 构建
uni build
```

---

## 📱 项目功能

### 已完成功能 ✅

- ✅ **喂奶记录** - 母乳计时/手动输入、配方奶、瓶喂母乳
- ✅ **纸尿裤记录** - 尿/屎/混合类型
- ✅ **睡眠记录** - 自动计算时长
- ✅ **辅食记录** - 食物类型和量
- ✅ **营养补充** - AD滴剂/益生菌
- ✅ **成长指标** - 身高/体重/头围
- ✅ **统计分析** - 今日/本周/本月统计
- ✅ **成长相册** - 照片上传/压缩/分组
- ✅ **提醒功能** - 喂奶提醒/疫苗提醒
- ✅ **数据管理** - 导入/导出/去重

---

## 🎨 技术栈

- **前端框架**：Vue 3 + TypeScript
- **跨平台**：UniApp
- **数据库**：SQLite（本地存储）
- **UI 风格**：温馨可爱风（粉色系 #FF9EC4）

---

## 📁 项目结构

```
baby-growth/
├── pages/              # 页面目录（11个页面）
│   ├── index/         # 首页
│   ├── record/        # 记录页面
│   ├── statistics/    # 统计分析
│   ├── album/         # 成长相册
│   ├── reminder/      # 提醒管理
│   └── settings/      # 设置
├── components/        # 组件目录
├── utils/             # 工具模块
│   ├── database.ts   # SQLite 数据库
│   ├── device.ts     # 设备工具
│   ├── export.ts     # 导出功能
│   ├── import.ts     # 导入功能
│   └── reminder.ts   # 提醒管理
├── static/            # 静态资源
│   └── images/       # 图标、图片
├── App.vue           # 应用入口
├── main.ts           # 主入口
├── manifest.json     # 应用配置
└── pages.json        # 页面配置
```

---

## ⚙️ 配置说明

### manifest.json

- 应用名称：宝宝成长记
- 应用版本：1.0.0
- 支持平台：Android、iOS、H5
- 权限配置：存储、相机、振动

### pages.json

- 页面路由配置
- TabBar 配置（首页、统计、相册、设置）
- 导航栏配置

---

## 🐛 常见问题

### 1. HBuilderX 运行报错？

- 确保使用的是 **App 开发版** HBuilderX
- 检查 Node.js 版本（建议 16.x+）
- 尝试：工具 -> 插件安装 -> 安装所需插件

### 2. SQLite 无法使用？

- SQLite 仅在 APP 端可用
- H5 端使用 localStorage 模拟
- 真机调试时确保已添加 SQLite 模块

### 3. 照片上传失败？

- 检查相机和存储权限
- 真机调试需要授权
- H5 端使用浏览器原生能力

### 4. 数据导入导出失败？

- 确保有存储权限
- APP 端需要授权文件读写
- H5 端使用浏览器下载

---

## 📞 技术支持

- UniApp 官方文档：https://uniapp.dcloud.net.cn
- Vue3 文档：https://vuejs.org
- SQLite 文档：https://www.sqlite.org

---

## 📝 更新日志

### v1.0.0 (2026-06-05)

- ✅ 完成所有核心功能开发
- ✅ 11个页面完整实现
- ✅ SQLite 数据库集成
- ✅ 温馨可爱粉色系 UI
- ✅ 数据导入导出去重
- ✅ 照片上传压缩
- ✅ 本地提醒通知

---

**Made with ❤️ for new parents**

祝您的宝宝健康成长！🍼👶💕

### 项目查漏补缺全面优化 ###
对宝宝成长记项目进行全面查漏补缺，重点重构记录总览页（增加日/周/月汇总切换），提取重复的记录加载逻辑为公共 composable，修复 MonthCalendar 数据模型缺陷，清理冗余页面，并补齐记录删除等核心缺失功能。

# 宝宝成长记 - 全面查漏补缺优化方案

本次优化旨在解决项目中存在的设计缺陷、代码重复、功能缺失等问题，做到一步到位的完善。

## User Review Required

> [!IMPORTANT]
> `pages/feeding/index.vue`（喂养记录页）当前展示的内容和记录总览页高度重复（月历+月汇总+今日时间轴），建议将其定位改为"纯喂养视角"，只展示喂养相关的统计和记录，或直接废弃该页面，由记录总览页 Tab 筛选替代。

> [!WARNING]
> MonthCalendar 组件的 `DayData` 接口将新增字段（sleepCount、diaperCount、recordCount），使用该组件的页面（records/index.vue、feeding/index.vue）需要同步适配传入数据。

## Proposed Changes

### 1. 公共数据加载层 — 提取 composable

当前首页、记录总览、喂养记录、两个详情页中，加载各类记录的代码几乎完全复制粘贴（每个页面都有 6 段 SQL + forEach 映射），维护成本极高。

#### [NEW] [useRecordLoader.ts](file:///Users/feng/Desktop/meiyou/baby-growth/composables/useRecordLoader.ts)

提取公共 composable `useRecordLoader`，统一封装：
- `loadRecordsByRange(startTime, endTime, types?)` → 返回标准 `RecordItem[]`
- `loadDayDataByMonth(monthTimestamp)` → 返回月历所需的 `Record<number, DayData>`
- `computeRangeStats(records)` → 计算指定记录集的汇总统计（总记录数、喂奶次数、总奶量、总睡眠时长、换尿布次数等）

所有页面统一调用此 composable，消除 6 处重复代码。

---

### 2. 记录总览页重构 — 日/周/月汇总

这是用户最关心的部分。当前记录总览页只有"今日时间轴"，缺少日/周/月维度的汇总切换。

#### [MODIFY] [index.vue](file:///Users/feng/Desktop/meiyou/baby-growth/pages/records/index.vue)

**核心改动：**

1. **新增汇总维度切换**：在页面顶部增加"日 / 周 / 月"三个 Tab 切换
   - **日汇总**：选定日期的详细统计卡片 + 当天时间轴
   - **周汇总**：本周（周一~周日）的聚合统计 + 每日对比柱状图（简易版）+ 周内记录列表
   - **月汇总**：整月统计 + 月历热力图 + 日均数据

2. **汇总统计卡片增强**：根据汇总维度展示不同的统计指标
   - 喂奶次数 / 总奶量 / 日均奶量
   - 睡眠总时长 / 日均睡眠
   - 换尿布次数
   - 辅食次数
   - 营养补剂次数

3. **日期导航**：支持左右切换日期/周/月，并显示对应的日期范围标签

4. **记录类型筛选 Tab 保留**：在汇总维度内部，仍可按记录类型（全部/喂养/睡眠/尿布/辅食/补剂/成长）筛选

5. **调用 `useRecordLoader`** 替代当前内联的 6 段重复 SQL

---

### 3. MonthCalendar 组件数据模型修复

#### [MODIFY] [MonthCalendar.vue](file:///Users/feng/Desktop/meiyou/baby-growth/components/MonthCalendar/MonthCalendar.vue)

**问题**：当前 `DayData` 接口只有 `feedCount / milkTotal / hasFood`，睡眠、尿布等记录完全无法在日历上体现。

**改动**：
- 扩展 `DayData` 接口，增加 `sleepCount`、`diaperCount`、`supplementCount`、`recordCount` 字段
- 日历格子的微型数据展示增加更多类型的图标指示（如 😴 表示有睡眠记录、👶 表示有换尿布）
- `hasData` 判断逻辑改为基于 `recordCount > 0`

---

### 4. 记录详情页增强

#### [MODIFY] [detail.vue](file:///Users/feng/Desktop/meiyou/baby-growth/pages/records/detail.vue)

**问题**：当前详情页只有简单时间轴，没有当天的汇总统计。

**改动**：
- 顶部新增当天汇总统计卡片（喂奶次数/总奶量/睡眠时长/换尿布次数）
- 支持左右滑动/箭头切换日期（当前只能通过月历点击进入）
- 调用 `useRecordLoader` 替代内联重复代码

---

### 5. 记录删除功能

#### [MODIFY] [detail.vue](file:///Users/feng/Desktop/meiyou/baby-growth/pages/records/detail.vue)

**问题**：所有记录只能新增，无法删除错误记录。

**改动**：
- 时间轴每条记录增加长按或左滑删除操作
- 删除前弹出确认对话框
- 删除后自动刷新列表和统计

#### [NEW] [useRecordDelete.ts](file:///Users/feng/Desktop/meiyou/baby-growth/composables/useRecordDelete.ts)

封装通用删除逻辑：根据 `RecordItem.id`（格式 `feed_123` / `diaper_456`）解析出表名和主键 ID，执行删除 SQL。

---

### 6. 首页代码精简

#### [MODIFY] [index.vue](file:///Users/feng/Desktop/meiyou/baby-growth/pages/index/index.vue)

**问题**：首页的今日记录加载逻辑与记录总览页完全重复（约 150 行）。

**改动**：
- 调用 `useRecordLoader.loadRecordsByRange` 替代内联代码
- 保留首页的展示结构不变，仅替换数据获取逻辑

---

### 7. 喂养记录页定位调整

#### [MODIFY] [index.vue](file:///Users/feng/Desktop/meiyou/baby-growth/pages/feeding/index.vue)

**问题**：当前内容和记录总览页高度重复（月历+月汇总+今日时间轴），页面定位模糊。

**改动**：
- 聚焦"喂养"视角，只展示喂养相关数据（母乳/配方奶/瓶喂）
- 月汇总只统计喂养维度（喂奶次数/总奶量/日均奶量/左右侧母乳时长等）
- 今日记录只展示喂养类记录
- 调用 `useRecordLoader` 并传入 `types` 过滤参数

---

### 8. 喂养详情页增强

#### [MODIFY] [detail.vue](file:///Users/feng/Desktop/meiyou/baby-growth/pages/feeding/detail.vue)

**问题**：当天统计卡片不错，但缺少日期左右切换，且数据加载逻辑重复。

**改动**：
- 调用 `useRecordLoader` 替代内联重复代码
- 统一使用公共的 `RecordItem` 类型

---

### 9. 公共类型定义整理

#### [NEW] [types/record.ts](file:///Users/feng/Desktop/meiyou/baby-growth/types/record.ts)

将 `RecordItem`、`DayData`、`RangeStats` 等在多个文件中重复定义的接口，统一提取到公共类型文件。

---

### 10. 睡眠记录跨天问题修复

#### [MODIFY] [sleep.vue](file:///Users/feng/Desktop/meiyou/baby-growth/pages/record/sleep.vue)

**问题**：当前睡眠记录只能选 HH:mm，无法处理跨天场景（如 22:00 入睡 → 次日 06:00 醒来），计算逻辑虽做了 `+24h` 兜底，但用户无法区分"今天 06:00" 和 "明天 06:00"。

**改动**：
- 醒来时间增加"次日"标记选项
- 入睡时间支持选择日期+时间（而非仅 HH:mm），以正确处理补录历史记录的场景

## Verification Plan

### Automated Tests
- 暂无自动化测试框架，跳过

### Manual Verification
- 在 H5 开发模式下验证记录总览页的日/周/月汇总切换功能
- 验证新增记录后，各汇总维度的数据正确更新
- 验证月历组件能正确展示各类型记录的标记
- 验证记录详情页的日期切换和汇总统计
- 验证记录删除功能的流程和数据一致性
- 验证首页、喂养记录页在替换为公共 composable 后功能不退化

updateAtTime: 2026/6/7 21:36:56

planId: 3a45b72d-38ec-4f22-b1a6-7c804733820a
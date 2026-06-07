### 项目查漏补缺全面优化 ###
# 任务清单

## 阶段一：公共基础设施
- [x] 新建 `types/record.ts`，提取 `RecordItem`、`DayData`、`RangeStats` 等公共类型定义
- [x] 新建 `composables/useRecordLoader.ts`，封装 `loadRecordsByRange`、`loadDayDataByMonth`、`computeRangeStats` 三个核心方法
- [x] 新建 `composables/useRecordDelete.ts`，封装通用记录删除逻辑

## 阶段二：记录总览页重构（核心需求）
- [x] 改造 `pages/records/index.vue`：新增日/周/月汇总维度切换 Tab
- [x] 改造 `pages/records/index.vue`：实现日汇总视图（当天统计卡片 + 时间轴）
- [x] 改造 `pages/records/index.vue`：实现周汇总视图（本周统计 + 每日对比 + 记录列表）
- [x] 改造 `pages/records/index.vue`：实现月汇总视图（整月统计 + 月历热力图 + 日均数据）
- [x] 改造 `pages/records/index.vue`：新增日期导航（左右切换日/周/月）
- [x] 改造 `pages/records/index.vue`：接入 `useRecordLoader` 替代内联 SQL

## 阶段三：MonthCalendar 组件修复
- [x] 改造 `components/MonthCalendar/MonthCalendar.vue`：扩展 `DayData` 接口，增加 sleepCount、diaperCount、supplementCount、recordCount
- [x] 改造 `components/MonthCalendar/MonthCalendar.vue`：日历格子微型数据增加更多类型图标指示
- [x] 改造 `components/MonthCalendar/MonthCalendar.vue`：修复 `hasData` 判断逻辑为基于 recordCount

## 阶段四：记录详情页增强
- [x] 改造 `pages/records/detail.vue`：顶部新增当天汇总统计卡片
- [x] 改造 `pages/records/detail.vue`：新增日期左右切换导航
- [x] 改造 `pages/records/detail.vue`：接入 `useRecordLoader` 替代内联代码
- [x] 改造 `pages/records/detail.vue`：每条记录增加长按删除功能，接入 `useRecordDelete`

## 阶段五：首页和喂养记录页精简
- [x] 改造 `pages/index/index.vue`：用 `useRecordLoader` 替代内联的记录加载代码
- [x] 改造 `pages/feeding/index.vue`：聚焦喂养视角，只展示喂养相关数据和统计
- [x] 改造 `pages/feeding/index.vue`：接入 `useRecordLoader` 并传入 types 过滤
- [x] 改造 `pages/feeding/detail.vue`：接入 `useRecordLoader` 替代内联重复代码

## 阶段六：睡眠记录跨天修复
- [x] 改造 `pages/record/sleep.vue`：醒来时间增加"次日"标记选项
- [x] 改造 `pages/record/sleep.vue`：入睡时间支持选择日期+时间

## 阶段七：验证
- [ ] [manual] H5 开发模式下验证记录总览页日/周/月汇总切换
- [ ] [manual] 验证新增记录后各维度数据正确更新
- [ ] [manual] 验证月历组件多类型记录标记显示正确
- [ ] [manual] 验证记录删除功能流程和数据一致性
- [ ] [manual] 验证首页和喂养记录页替换 composable 后功能无退化

updateAtTime: 2026/6/7 21:36:56

planId: 3a45b72d-38ec-4f22-b1a6-7c804733820a
<template>
  <view class="records-page">
    <!-- 汇总维度切换：日 / 周 / 月 -->
    <view class="dimension-bar">
      <view
        v-for="dim in dimensions"
        :key="dim.key"
        class="dim-item"
        :class="{ active: activeDimension === dim.key }"
        @click="activeDimension = dim.key"
      >{{ dim.label }}</view>
    </view>

    <!-- 日期导航 -->
    <view class="date-nav">
      <view class="nav-arrow" @click="navigateDate(-1)">‹</view>
      <text class="nav-label">{{ dateLabel }}</text>
      <view class="nav-arrow" @click="navigateDate(1)">›</view>
      <text class="nav-today" v-if="!isToday" @click="goToday">今天</text>
    </view>

    <!-- 记录类型筛选 Tab -->
    <scroll-view scroll-x class="tab-scroll">
      <view class="tab-bar">
        <view
          v-for="tab in typeTabs"
          :key="tab.key"
          class="tab-item"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >{{ tab.label }}</view>
      </view>
    </scroll-view>

    <!-- 月历（仅月汇总视图显示） -->
    <MonthCalendar
      v-if="activeDimension === 'month'"
      :month-timestamp="monthTimestamp"
      :selected-timestamp="0"
      :day-data="dayData"
      @change-month="onCalendarChangeMonth"
      @select-day="onSelectDay"
    />

    <!-- 汇总统计卡片 -->
    <view class="summary-card">
      <view class="summary-title">{{ summaryTitle }}</view>
      <view class="summary-grid">
        <view class="summary-item">
          <text class="summary-value">{{ currentStats.recordCount }}</text>
          <text class="summary-label">记录总数</text>
        </view>
        <view class="summary-item" v-if="currentStats.feedCount > 0">
          <text class="summary-value">{{ currentStats.feedCount }}</text>
          <text class="summary-label">喂奶次数</text>
        </view>
        <view class="summary-item" v-if="currentStats.diaperCount > 0">
          <text class="summary-value">{{ currentStats.diaperCount }}</text>
          <text class="summary-label">换尿布</text>
        </view>
        <view class="summary-item" v-if="currentStats.sleepCount > 0">
          <text class="summary-value">{{ currentStats.totalSleepHours.toFixed(1) }}</text>
          <text class="summary-label">睡眠(h)</text>
        </view>
        <view class="summary-item" v-if="currentStats.foodCount > 0">
          <text class="summary-value">{{ currentStats.foodCount }}</text>
          <text class="summary-label">辅食</text>
        </view>
        <view class="summary-item" v-if="currentStats.growthCount > 0">
          <text class="summary-value">{{ currentStats.growthCount }}</text>
          <text class="summary-label">成长记录</text>
        </view>
      </view>
      <view class="summary-avg">
        <text class="avg-text">
          日均 {{ avgDailyRecords }} 条记录
          <text v-if="currentStats.feedCount > 0"> · 均奶量{{ currentStats.avgMilk }}ml/次</text>
          <text v-if="currentStats.sleepCount > 0"> · 日均睡{{ currentStats.avgSleepHours }}h</text>
        </text>
      </view>
      
      <!-- 睡眠建议提示 -->
      <view class="sleep-advice" v-if="sleepEvaluation">
        <view class="advice-header">
          <text class="advice-icon">😴</text>
          <text class="advice-title">睡眠建议</text>
        </view>
        <view class="advice-content">
          <text class="advice-status" :class="sleepEvaluation.status">
            {{ sleepEvaluation.message }}
          </text>
          <text class="advice-text">{{ sleepEvaluation.advice.recommendation }}</text>
          <text class="advice-warning" v-if="sleepEvaluation.advice.warning">
            ⚠️ {{ sleepEvaluation.advice.warning }}
          </text>
        </view>
      </view>
    </view>

    <!-- 周每日对比（仅周汇总视图） -->
    <view class="week-chart" v-if="activeDimension === 'week'">
      <view class="chart-title">每日记录数</view>
      <view class="chart-bars">
        <view v-for="(bar, idx) in weekBars" :key="idx" class="bar-col">
          <view class="bar-value">{{ bar.count }}</view>
          <view class="bar-fill" :style="{ height: bar.height + 'rpx' }"></view>
          <text class="bar-label">{{ bar.label }}</text>
        </view>
      </view>
    </view>

    <!-- 记录时间轴 -->
    <view class="timeline-section">
      <view class="section-header">
        <text class="section-title">{{ timelineTitle }}</text>
        <text class="section-count">共 {{ filteredRecords.length }} 条</text>
      </view>
      <scroll-view class="timeline-scroll" scroll-y>
        <view class="empty-tip" v-if="filteredRecords.length === 0">
          {{ emptyTip }}
        </view>
        <view
          v-for="record in filteredRecords"
          :key="record.id"
          class="timeline-item"
          @longpress="onLongPress(record)"
        >
          <text class="timeline-time">{{ record.time }}</text>
          <view class="timeline-dot" :style="{ background: record.color }"></view>
          <view class="timeline-content">
            <view class="timeline-row">
              <text class="timeline-icon">{{ record.icon }}</text>
              <text class="timeline-type">{{ record.label }}</text>
              <text class="timeline-detail">{{ record.detail }}</text>
            </view>
            <!-- 日期标签（周/月模式下显示） -->
            <text class="timeline-date" v-if="activeDimension !== 'day'">{{ formatRecordDate(record.timestamp) }}</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { db } from '@/utils/database'
import { formatTime } from '@/utils/device'
import MonthCalendar from '@/components/MonthCalendar/MonthCalendar.vue'
import QuickRecord from '@/components/QuickRecord/QuickRecord.vue'
import { FEEDING_TYPES } from '@/types/record'
import type { RecordItem, DayData, RangeStats } from '@/types/record'
import {
  loadRecordsByRange,
  loadDayDataByMonth,
  computeRangeStats,
  getDayRange,
  getWeekRange,
  getMonthRange
} from '@/composables/useRecordLoader'
import { deleteRecord } from '@/composables/useRecordDelete'
import { getSleepAdvice, evaluateSleep } from '@/utils/sleepAdvice'

const DAY_MS = 24 * 60 * 60 * 1000

// ===== 维度切换 =====
const dimensions = [
  { key: 'day', label: '日' },
  { key: 'week', label: '周' },
  { key: 'month', label: '月' }
]
const activeDimension = ref('day')

// ===== 记录类型筛选 =====
const typeTabs = [
  { key: 'all', label: '全部' },
  { key: 'feeding', label: '喂养' },
  { key: 'sleep', label: '睡眠' },
  { key: 'diaper', label: '换尿布' },
  { key: 'food', label: '辅食' },
  { key: 'supplement', label: '补剂' },
  { key: 'growth', label: '成长' }
]
const activeTab = ref('all')

// ===== 日期状态 =====
const currentDate = ref(new Date())
const monthTimestamp = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime())

// ===== 数据 =====
const dbReady = ref(false)
const allRecords = ref<RecordItem[]>([])
const currentStats = ref<RangeStats>({
  recordCount: 0, feedCount: 0, totalMilk: 0, avgMilk: 0,
  sleepCount: 0, totalSleepHours: 0, avgSleepHours: 0,
  diaperCount: 0, foodCount: 0, supplementCount: 0, growthCount: 0, recordDays: 0
})
const dayData = ref<Record<number, DayData>>({})
const weekDayCounts = ref<number[]>([0, 0, 0, 0, 0, 0, 0])
const babyBirthday = ref('') // 宝宝生日，用于计算月龄

// ===== 计算属性 =====
const isToday = computed(() => {
  const now = new Date()
  const d = currentDate.value
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
})

const dateLabel = computed(() => {
  const d = currentDate.value
  if (activeDimension.value === 'day') {
    const prefix = isToday.value ? '今天 · ' : ''
    return `${prefix}${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }
  if (activeDimension.value === 'week') {
    const { label } = getWeekRange(d)
    return label
  }
  return `${d.getFullYear()}年${d.getMonth() + 1}月`
})

const summaryTitle = computed(() => {
  const labels: Record<string, string> = { day: '今日汇总', week: '本周汇总', month: '本月汇总' }
  if (activeDimension.value === 'day' && !isToday.value) return '当天汇总'
  return labels[activeDimension.value] || '汇总'
})

const timelineTitle = computed(() => {
  const tabLabel = typeTabs.find(t => t.key === activeTab.value)?.label || '记录'
  if (activeDimension.value === 'day') return `当天${tabLabel}`
  if (activeDimension.value === 'week') return `本周${tabLabel}`
  return `本月${tabLabel}`
})

const emptyTip = computed(() => {
  return `该时间范围内暂无记录，快来记录宝宝的成长吧~`
})

const avgDailyRecords = computed(() => {
  const days = currentStats.value.recordDays
  if (days === 0) return 0
  return Math.round(currentStats.value.recordCount / days * 10) / 10
})

const filteredRecords = computed(() => {
  if (activeTab.value === 'all') return allRecords.value
  if (activeTab.value === 'feeding') {
    return allRecords.value.filter(r => FEEDING_TYPES.includes(r.type as any))
  }
  return allRecords.value.filter(r => r.type === activeTab.value)
})

// ===== 周每日对比柱状图 =====
const weekBars = computed(() => {
  const labels = ['一', '二', '三', '四', '五', '六', '日']
  const maxCount = Math.max(...weekDayCounts.value, 1)
  return weekDayCounts.value.map((count, idx) => ({
    label: labels[idx],
    count,
    height: Math.round((count / maxCount) * 160)
  }))
})

// ===== 日期导航 =====
const navigateDate = (direction: number) => {
  const d = new Date(currentDate.value)
  if (activeDimension.value === 'day') {
    d.setDate(d.getDate() + direction)
  } else if (activeDimension.value === 'week') {
    d.setDate(d.getDate() + direction * 7)
  } else {
    d.setMonth(d.getMonth() + direction)
  }
  currentDate.value = d
  if (activeDimension.value === 'month') {
    monthTimestamp.value = new Date(d.getFullYear(), d.getMonth(), 1).getTime()
  }
}

const goToday = () => {
  currentDate.value = new Date()
  if (activeDimension.value === 'month') {
    const now = new Date()
    monthTimestamp.value = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  }
}

const onCalendarChangeMonth = (ts: number) => {
  monthTimestamp.value = ts
  currentDate.value = new Date(ts)
}

const onSelectDay = (ts: number) => {
  currentDate.value = new Date(ts)
  activeDimension.value = 'day'
}

const formatRecordDate = (timestamp: number): string => {
  return formatTime(timestamp, 'MM-DD')
}

// ===== 数据加载 =====
const loadData = async () => {
  const d = currentDate.value
  let startTime: number
  let endTime: number
  let rangeDays = 1

  if (activeDimension.value === 'day') {
    const range = getDayRange(d)
    startTime = range.startTime
    endTime = range.endTime
    rangeDays = 1
  } else if (activeDimension.value === 'week') {
    const range = getWeekRange(d)
    startTime = range.startTime
    endTime = range.endTime
    rangeDays = 7
  } else {
    const range = getMonthRange(d)
    startTime = range.startTime
    endTime = range.endTime
    rangeDays = Math.round((endTime - startTime) / DAY_MS)
  }

  const records = await loadRecordsByRange(startTime, endTime)
  allRecords.value = records
  currentStats.value = computeRangeStats(records, rangeDays)

  // 周模式：计算每日记录数
  if (activeDimension.value === 'week') {
    const counts = [0, 0, 0, 0, 0, 0, 0]
    const weekStart = getWeekRange(d).startTime
    records.forEach(r => {
      const dayIdx = Math.floor((r.timestamp - weekStart) / DAY_MS)
      if (dayIdx >= 0 && dayIdx < 7) counts[dayIdx]++
    })
    weekDayCounts.value = counts
  }

  // 月模式：加载日历数据
  if (activeDimension.value === 'month') {
    dayData.value = await loadDayDataByMonth(monthTimestamp.value)
  }
}

// 计算睡眠建议
const sleepEvaluation = computed(() => {
  if (!babyBirthday.value || currentStats.value.sleepCount === 0) return null
  
  // 计算宝宝月龄
  const birthday = new Date(babyBirthday.value).getTime()
  const now = Date.now()
  const months = Math.floor((now - birthday) / (1000 * 60 * 60 * 24 * 30))
  
  // 评估睡眠时长
  return evaluateSleep(currentStats.value.avgSleepHours, months)
})

// ===== 记录操作 =====
const onLongPress = (record: RecordItem) => {
  deleteRecord(record.id, () => {
    loadData()
  })
}

const handleRecord = (type: string) => {
  if (FEEDING_TYPES.includes(type as any)) {
    uni.navigateTo({ url: `/pages/record/feeding?type=${type}` })
    return
  }
  const routes: Record<string, string> = {
    diaper: '/pages/record/diaper',
    sleep: '/pages/record/sleep',
    supplement: '/pages/record/supplement',
    food: '/pages/record/food',
    growth: '/pages/record/growth'
  }
  uni.navigateTo({ url: routes[type] || '/pages/index/index' })
}

// ===== 监听维度/日期变化（仅数据库就绪后才触发加载） =====
watch([activeDimension, currentDate], () => {
  if (dbReady.value) loadData()
})

onShow(async () => {
  try {
    await db.open()
    await db.initTables()
    
    // 加载宝宝信息
    try {
      const babyResult = await db.selectSql('SELECT birthday FROM baby_info LIMIT 1')
      if (babyResult && babyResult.length > 0) {
        babyBirthday.value = babyResult[0].birthday
      }
    } catch (error) {
      console.error('加载宝宝信息失败', error)
    }
    
    dbReady.value = true
    await loadData()
  } catch (error) {
    console.error('加载数据失败', error)
    uni.showToast({ 
      title: '数据加载失败，请重启应用', 
      icon: 'none',
      duration: 3000
    })
  }
})
</script>

<style scoped>
.records-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding-bottom: 320rpx;
}

/* 维度切换 */
.dimension-bar {
  display: flex;
  background: #FFFFFF;
  margin: 20rpx 30rpx 0;
  border-radius: 40rpx;
  padding: 8rpx;
  box-shadow: 0 4rpx 16rpx rgba(255, 158, 196, 0.08);
}

.dim-item {
  flex: 1;
  text-align: center;
  padding: 18rpx 0;
  font-size: 28rpx;
  color: #999999;
  border-radius: 36rpx;
  transition: all 0.2s;
}

.dim-item.active {
  background: linear-gradient(135deg, #FF9EC4 0%, #FFB8D9 100%);
  color: #FFFFFF;
  font-weight: bold;
  box-shadow: 0 4rpx 12rpx rgba(255, 158, 196, 0.3);
}

/* 日期导航 */
.date-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx 30rpx 16rpx;
  gap: 24rpx;
}

.nav-arrow {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: #FF9EC4;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.nav-label {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
  min-width: 280rpx;
  text-align: center;
}

.nav-today {
  font-size: 24rpx;
  color: #FF9EC4;
  padding: 8rpx 20rpx;
  border: 1px solid #FF9EC4;
  border-radius: 24rpx;
}

/* 类型筛选 Tab */
.tab-scroll {
  white-space: nowrap;
  margin: 0 30rpx 20rpx;
}

.tab-bar {
  display: inline-flex;
  background: #FFFFFF;
  padding: 12rpx 16rpx;
  border-radius: 32rpx;
  gap: 12rpx;
  box-shadow: 0 4rpx 16rpx rgba(255, 158, 196, 0.08);
}

.tab-item {
  padding: 14rpx 24rpx;
  font-size: 24rpx;
  color: #666666;
  border-radius: 20rpx;
  white-space: nowrap;
  transition: all 0.2s;
}

.tab-item.active {
  background: #FF9EC4;
  color: #FFFFFF;
  font-weight: bold;
}

/* 汇总统计卡片 */
.summary-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx;
  margin: 0 30rpx 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(255, 158, 196, 0.08);
}

.summary-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 24rpx;
}

.summary-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  justify-content: space-around;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120rpx;
}

.summary-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #FF6BA8;
}

.summary-label {
  font-size: 22rpx;
  color: #999999;
  margin-top: 8rpx;
}

.summary-avg {
  margin-top: 24rpx;
  padding-top: 20rpx;
  border-top: 1px solid #FFF0F5;
  text-align: center;
}

.avg-text {
  font-size: 22rpx;
  color: #AAAAAA;
  line-height: 1.6;
}

/* 睡眠建议样式 */
.sleep-advice {
  margin-top: 24rpx;
  padding: 20rpx;
  background: #F0F8FF;
  border-radius: 16rpx;
  border-left: 4rpx solid #4A90E2;
}

.advice-header {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 12rpx;
}

.advice-icon {
  font-size: 24rpx;
}

.advice-title {
  font-size: 26rpx;
  font-weight: bold;
  color: #4A90E2;
}

.advice-content {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.advice-status {
  font-size: 24rpx;
  font-weight: bold;
  padding: 8rpx 12rpx;
  border-radius: 8rpx;
  display: inline-block;
  width: fit-content;
}

.advice-status.insufficient {
  background: #FFE0E0;
  color: #D32F2F;
}

.advice-status.normal {
  background: #E0F2E0;
  color: #2E7D32;
}

.advice-status.excessive {
  background: #FFF0E0;
  color: #E65100;
}

.advice-text {
  font-size: 24rpx;
  color: #666666;
  line-height: 1.5;
}

.advice-warning {
  font-size: 22rpx;
  color: #E65100;
  margin-top: 8rpx;
}

/* 周每日对比柱状图 */
.week-chart {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx;
  margin: 0 30rpx 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(255, 158, 196, 0.08);
}

.chart-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 24rpx;
}

.chart-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 220rpx;
  padding-top: 20rpx;
}

.bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.bar-value {
  font-size: 22rpx;
  color: #FF6BA8;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.bar-fill {
  width: 48rpx;
  background: linear-gradient(180deg, #FF9EC4 0%, #FFD0E2 100%);
  border-radius: 12rpx 12rpx 0 0;
  min-height: 8rpx;
  transition: height 0.3s;
}

.bar-label {
  font-size: 22rpx;
  color: #999999;
  margin-top: 12rpx;
}

/* 记录时间轴 */
.timeline-section {
  margin: 0 30rpx 30rpx;
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(255, 158, 196, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
}

.section-count {
  font-size: 24rpx;
  color: #999999;
}

.timeline-scroll {
  max-height: 900rpx;
}

.empty-tip {
  text-align: center;
  color: #BBBBBB;
  font-size: 28rpx;
  padding: 80rpx 40rpx;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  position: relative;
  padding: 16rpx 0;
}

.timeline-time {
  width: 80rpx;
  font-size: 24rpx;
  color: #999999;
  padding-top: 12rpx;
  flex-shrink: 0;
  font-weight: 500;
}

.timeline-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  margin: 16rpx 16rpx 0 8rpx;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  box-shadow: 0 0 0 4rpx rgba(255, 107, 168, 0.15);
}

.timeline-content {
  flex: 1;
  background: #FAFAFA;
  border-radius: 20rpx;
  padding: 16rpx 20rpx;
  margin-left: -4rpx;
}

.timeline-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.timeline-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.timeline-type {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.timeline-detail {
  font-size: 24rpx;
  color: #666666;
  white-space: pre-line;
  line-height: 1.5;
  flex: 1;
  min-width: 0;
}

.timeline-date {
  font-size: 22rpx;
  color: #BBBBBB;
  margin-top: 8rpx;
  display: block;
}
</style>

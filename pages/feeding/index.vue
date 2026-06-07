<template>
  <view class="feeding-page">
    <!-- 月历概览 -->
    <MonthCalendar
      :month-timestamp="monthTimestamp"
      :selected-timestamp="0"
      :day-data="dayData"
      @change-month="onChangeMonth"
      @select-day="onSelectDay"
    />

    <!-- 月喂养汇总卡片 -->
    <view class="month-summary">
      <view class="summary-title">{{ monthLabel }} 喂养汇总</view>
      <view class="summary-grid">
        <view class="summary-item">
          <text class="summary-value">{{ monthStats.recordDays }}</text>
          <text class="summary-label">记录天数</text>
        </view>
        <view class="summary-item">
          <text class="summary-value">{{ monthStats.feedCount }}</text>
          <text class="summary-label">喂奶次数</text>
        </view>
        <view class="summary-item">
          <text class="summary-value">{{ monthStats.totalMilk }}</text>
          <text class="summary-label">总奶量(ml)</text>
        </view>
        <view class="summary-item">
          <text class="summary-value">{{ monthStats.avgMilk }}</text>
          <text class="summary-label">均奶量(ml)</text>
        </view>
      </view>
      <view class="summary-row" v-if="monthStats.feedCount > 0">
        <text class="summary-avg">日均喂奶 {{ avgDailyFeeds }} 次 · 仅统计喂养类记录</text>
      </view>
    </view>

    <!-- 今日喂养时间轴 -->
    <view class="today-section">
      <view class="section-header">
        <text class="section-title">今日喂养</text>
        <text class="section-count">共 {{ todayRecords.length }} 条</text>
      </view>
      <scroll-view class="today-scroll" scroll-y>
        <view class="empty-tip" v-if="todayRecords.length === 0">
          今天还没有喂养记录~
        </view>
        <view v-for="record in todayRecords" :key="record.id" class="timeline-item">
          <text class="timeline-time">{{ record.time }}</text>
          <view class="timeline-dot" :style="{ background: record.color }"></view>
          <view class="timeline-content">
            <view class="timeline-row">
              <text class="timeline-icon">{{ record.icon }}</text>
              <text class="timeline-type">{{ record.label }}</text>
              <text class="timeline-detail">{{ record.detail }}</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { db } from '@/utils/database'
import MonthCalendar from '@/components/MonthCalendar/MonthCalendar.vue'
import type { RecordItem, DayData, RangeStats } from '@/types/record'
import { FEEDING_TYPES, EMPTY_RANGE_STATS } from '@/types/record'
import {
  loadRecordsByRange,
  loadDayDataByMonth,
  computeRangeStats,
  getDayRange,
  getMonthRange
} from '@/composables/useRecordLoader'

const feedingTypes = [...FEEDING_TYPES] as string[]

const monthTimestamp = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime())
const dayData = ref<Record<number, DayData>>({})
const monthStats = ref<RangeStats>({ ...EMPTY_RANGE_STATS })
const todayRecords = ref<RecordItem[]>([])

const monthLabel = computed(() => {
  const d = new Date(monthTimestamp.value)
  return `${d.getFullYear()}年${d.getMonth() + 1}月`
})

const avgDailyFeeds = computed(() => {
  const days = monthStats.value.recordDays
  if (days === 0) return 0
  return Math.round(monthStats.value.feedCount / days * 10) / 10
})

const onChangeMonth = (ts: number) => {
  monthTimestamp.value = ts
  loadMonthData()
}

const onSelectDay = (ts: number) => {
  const d = new Date(ts)
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  uni.navigateTo({ url: `/pages/feeding/detail?date=${dateStr}` })
}

const loadMonthData = async () => {
  // 加载月历数据
  dayData.value = await loadDayDataByMonth(monthTimestamp.value)

  // 加载月喂养汇总（仅喂养类型）
  const d = new Date(monthTimestamp.value)
  const { startTime, endTime } = getMonthRange(d)
  const feedRecords = await loadRecordsByRange(startTime, endTime, feedingTypes)
  const daysInMonth = Math.round((endTime - startTime) / (24 * 60 * 60 * 1000))
  monthStats.value = computeRangeStats(feedRecords, daysInMonth)
}

const loadTodayRecords = async () => {
  const { startTime, endTime } = getDayRange(new Date())
  todayRecords.value = await loadRecordsByRange(startTime, endTime, feedingTypes)
}

onShow(async () => {
  try {
    await db.open()
    await db.initTables()
    await Promise.all([
      loadMonthData(),
      loadTodayRecords()
    ])
  } catch (error) {
    console.error('加载数据失败', error)
  }
})
</script>

<style scoped>
.feeding-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding: 30rpx;
  padding-bottom: 60rpx;
}

.month-summary {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 36rpx;
  margin-top: 30rpx;
}

.summary-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 28rpx;
}

.summary-grid {
  display: flex;
  justify-content: space-around;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.summary-value {
  font-size: 44rpx;
  font-weight: bold;
  color: #FF6BA8;
}

.summary-label {
  font-size: 22rpx;
  color: #999999;
  margin-top: 8rpx;
}

.summary-row {
  margin-top: 28rpx;
  padding-top: 24rpx;
  border-top: 1px solid #FFF0F5;
  text-align: center;
}

.summary-avg {
  font-size: 24rpx;
  color: #AAAAAA;
}

.today-section {
  margin-top: 30rpx;
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
  padding-left: 8rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.section-count {
  font-size: 24rpx;
  color: #999999;
}

.today-scroll {
  max-height: 800rpx;
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
</style>

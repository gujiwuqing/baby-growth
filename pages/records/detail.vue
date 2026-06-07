<template>
  <view class="detail-page">
    <!-- 日期导航 -->
    <view class="date-nav">
      <view class="nav-arrow" @click="changeDate(-1)">‹</view>
      <view class="date-header">
        <text class="date-title">{{ dateTitle }}</text>
        <text class="date-weekday">{{ dateWeekday }}</text>
      </view>
      <view class="nav-arrow" @click="changeDate(1)">›</view>
    </view>

    <!-- 当天汇总统计卡片 -->
    <view class="summary-card" v-if="dayRecords.length > 0">
      <view class="summary-grid">
        <view class="summary-item" v-if="stats.feedCount > 0">
          <text class="summary-value">{{ stats.feedCount }}</text>
          <text class="summary-label">喂奶</text>
        </view>
        <view class="summary-item" v-if="stats.totalMilk > 0">
          <text class="summary-value">{{ stats.totalMilk }}</text>
          <text class="summary-label">奶量ml</text>
        </view>
        <view class="summary-item" v-if="stats.totalSleepHours > 0">
          <text class="summary-value">{{ stats.totalSleepHours }}</text>
          <text class="summary-label">睡眠h</text>
        </view>
        <view class="summary-item" v-if="stats.diaperCount > 0">
          <text class="summary-value">{{ stats.diaperCount }}</text>
          <text class="summary-label">换尿布</text>
        </view>
        <view class="summary-item" v-if="stats.foodCount > 0">
          <text class="summary-value">{{ stats.foodCount }}</text>
          <text class="summary-label">辅食</text>
        </view>
        <view class="summary-item" v-if="stats.supplementCount > 0">
          <text class="summary-value">{{ stats.supplementCount }}</text>
          <text class="summary-label">补剂</text>
        </view>
      </view>
    </view>

    <!-- 时间轴 -->
    <view class="timeline-section">
      <view class="empty-tip" v-if="dayRecords.length === 0">
        这一天还没有记录
      </view>
      <view
        v-for="record in dayRecords"
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
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { db } from '@/utils/database'
import type { RecordItem, RangeStats } from '@/types/record'
import { EMPTY_RANGE_STATS } from '@/types/record'
import { loadRecordsByRange, computeRangeStats, getDayRange } from '@/composables/useRecordLoader'
import { deleteRecord } from '@/composables/useRecordDelete'

const DAY_MS = 24 * 60 * 60 * 1000

const selectedDate = ref('')
const dayRecords = ref<RecordItem[]>([])
const stats = ref<RangeStats>({ ...EMPTY_RANGE_STATS })

const dateTitle = computed(() => {
  if (!selectedDate.value) return ''
  const d = new Date(selectedDate.value)
  return `${d.getMonth() + 1}月${d.getDate()}日`
})

const dateWeekday = computed(() => {
  if (!selectedDate.value) return ''
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const d = new Date(selectedDate.value)
  return weekdays[d.getDay()]
})

const changeDate = (direction: number) => {
  if (!selectedDate.value) return
  const d = new Date(selectedDate.value)
  d.setDate(d.getDate() + direction)
  selectedDate.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  loadDayRecords()
}

const loadDayRecords = async () => {
  if (!selectedDate.value) return
  const d = new Date(selectedDate.value)
  const { startTime, endTime } = getDayRange(d)

  const records = await loadRecordsByRange(startTime, endTime)
  dayRecords.value = records
  stats.value = computeRangeStats(records, 1)
}

const onLongPress = (record: RecordItem) => {
  deleteRecord(record.id, () => {
    loadDayRecords()
  })
}

onLoad(async (options: any) => {
  try {
    await db.open()
    await db.initTables()
    if (options && options.date) {
      selectedDate.value = options.date
      await loadDayRecords()
    }
  } catch (error) {
    console.error('加载数据失败', error)
  }
})
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding: 30rpx;
}

/* 日期导航 */
.date-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32rpx;
  margin-bottom: 30rpx;
}

.nav-arrow {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: #FF9EC4;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.date-header {
  text-align: center;
}

.date-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333333;
  display: block;
  margin-bottom: 8rpx;
}

.date-weekday {
  font-size: 26rpx;
  color: #999999;
}

/* 汇总卡片 */
.summary-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(255, 158, 196, 0.08);
}

.summary-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  gap: 16rpx;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100rpx;
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

/* 时间轴 */
.timeline-section {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 30rpx;
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

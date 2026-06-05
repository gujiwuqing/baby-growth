<template>
  <view class="detail-page">
    <!-- 日期导航 -->
    <view class="date-nav">
      <text class="date-arrow" @click="shiftDay(-1)">‹</text>
      <text class="date-title">{{ dateLabel }}</text>
      <text class="date-arrow" @click="shiftDay(1)">›</text>
    </view>

    <!-- 当天统计 -->
    <view class="day-stats">
      <view class="stat-row">
        <view class="stat-card pink">
          <text class="stat-num">{{ stats.feedCount }}</text>
          <text class="stat-name">喂奶次数</text>
        </view>
        <view class="stat-card orange">
          <text class="stat-num">{{ stats.foodCount }}</text>
          <text class="stat-name">辅食次数</text>
        </view>
      </view>
      <view class="stat-row">
        <view class="stat-card blue">
          <text class="stat-num">{{ stats.totalMilk }}</text>
          <text class="stat-name">总奶量(ml)</text>
        </view>
        <view class="stat-card purple">
          <text class="stat-num">{{ stats.avgMilk }}</text>
          <text class="stat-name">平均奶量(ml)</text>
        </view>
      </view>
    </view>

    <!-- 时间线记录列表 -->
    <view class="timeline-section">
      <view class="timeline-title">记录详情</view>

      <view class="empty-tip" v-if="records.length === 0">
        <text class="empty-icon">📝</text>
        <text class="empty-text">当天暂无记录</text>
      </view>

      <view class="timeline" v-else>
        <view class="timeline-item" v-for="record in records" :key="record.id">
          <view class="timeline-dot" :style="{ background: record.color }"></view>
          <view class="timeline-line"></view>
          <view class="timeline-card">
            <view class="card-header">
              <text class="card-icon">{{ record.icon }}</text>
              <text class="card-type">{{ record.typeName }}</text>
              <text class="card-time">{{ record.time }}</text>
            </view>
            <text class="card-detail">{{ record.detail }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { db } from '@/utils/database'
import { formatTime } from '@/utils/device'
import { RECORD_TYPE_META } from '@/utils/recordTypes'

const DAY_MS = 24 * 60 * 60 * 1000

interface TimelineRecord {
  id: string
  icon: string
  typeName: string
  color: string
  time: string
  detail: string
  timestamp: number
}

const currentDate = ref('')
const dateLabel = ref('')

const stats = ref({
  feedCount: 0,
  foodCount: 0,
  totalMilk: 0,
  avgMilk: 0
})

const records = ref<TimelineRecord[]>([])

const parseDate = (dateStr: string): Date => {
  const parts = dateStr.split('-')
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
}

const formatDateStr = (d: Date): string => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const updateLabel = () => {
  const d = parseDate(currentDate.value)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  dateLabel.value = `${currentDate.value} ${weekdays[d.getDay()]}`
}

const shiftDay = (direction: number) => {
  const d = parseDate(currentDate.value)
  d.setDate(d.getDate() + direction)
  currentDate.value = formatDateStr(d)
  updateLabel()
  loadDayData()
}

const loadDayData = async () => {
  const d = parseDate(currentDate.value)
  const dayStart = d.getTime()
  const dayEnd = dayStart + DAY_MS

  const items: TimelineRecord[] = []
  let feedCount = 0
  let totalMilk = 0
  let foodCount = 0

  // 喂奶记录
  const feeds = await db.selectSql(`
    SELECT * FROM feeds
    WHERE timestamp >= ${dayStart} AND timestamp < ${dayEnd}
    ORDER BY timestamp ASC
  `)
  if (feeds && feeds.length > 0) {
    feeds.forEach((r: any) => {
      feedCount++
      const meta = RECORD_TYPE_META[r.type] || RECORD_TYPE_META['formula']
      let detail = ''
      if (r.type === 'breast') {
        const left = r.left_duration || 0
        const right = r.right_duration || 0
        const fmtSec = (sec: number) => sec < 60 ? `${sec}秒` : `${Math.floor(sec / 60)}分钟`
        detail = `左${fmtSec(left)} 右${fmtSec(right)}`
      } else {
        detail = `${r.amount || 0}ml`
        totalMilk += (r.amount || 0)
      }

      items.push({
        id: `feed_${r.id}`,
        icon: meta.icon,
        typeName: meta.label,
        color: meta.color,
        time: formatTime(r.timestamp, 'HH:mm'),
        detail,
        timestamp: r.timestamp
      })
    })
  }

  // 辅食记录
  const foods = await db.selectSql(`
    SELECT * FROM foods
    WHERE timestamp >= ${dayStart} AND timestamp < ${dayEnd}
    ORDER BY timestamp ASC
  `)
  if (foods && foods.length > 0) {
    foods.forEach((r: any) => {
      foodCount++
      const meta = RECORD_TYPE_META['food']
      const amount = r.amount ? `${r.amount}${r.unit || 'g'}` : ''
      const detail = [r.food_type, amount].filter(Boolean).join(' · ')

      items.push({
        id: `food_${r.id}`,
        icon: meta.icon,
        typeName: meta.label,
        color: meta.color,
        time: formatTime(r.timestamp, 'HH:mm'),
        detail: detail || '辅食',
        timestamp: r.timestamp
      })
    })
  }

  // 按时间排序
  items.sort((a, b) => a.timestamp - b.timestamp)
  records.value = items

  const milkFeeds = feedCount > 0 ? feeds!.filter((r: any) => r.type !== 'breast').length : 0
  stats.value = {
    feedCount,
    foodCount,
    totalMilk,
    avgMilk: milkFeeds > 0 ? Math.round(totalMilk / milkFeeds) : 0
  }
}

onLoad((options: any) => {
  if (options && options.date) {
    currentDate.value = options.date
  } else {
    currentDate.value = formatDateStr(new Date())
  }
  updateLabel()
  loadDayData()
})
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding: 15px;
  padding-bottom: 30px;
}

/* 日期导航 */
.date-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #FFFFFF;
  border-radius: 14px;
  padding: 10px 16px;
  margin-bottom: 15px;
}

.date-title {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
}

.date-arrow {
  width: 40px;
  height: 36px;
  line-height: 32px;
  text-align: center;
  font-size: 26px;
  color: #FF6BA8;
}

.date-arrow:active {
  opacity: 0.6;
}

/* 统计卡片 */
.day-stats {
  margin-bottom: 15px;
}

.stat-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.stat-card {
  flex: 1;
  padding: 16px;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-card.pink { background: linear-gradient(135deg, #FFE0EC, #FFF0F5); }
.stat-card.orange { background: linear-gradient(135deg, #FFF0DB, #FFF8EE); }
.stat-card.blue { background: linear-gradient(135deg, #E0F0FF, #F0F7FF); }
.stat-card.purple { background: linear-gradient(135deg, #F0E0FF, #F8F0FF); }

.stat-num {
  font-size: 28px;
  font-weight: bold;
  color: #333333;
}

.stat-name {
  font-size: 12px;
  color: #999999;
  margin-top: 4px;
}

/* 时间线 */
.timeline-section {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 18px;
}

.timeline-title {
  font-size: 15px;
  font-weight: bold;
  color: #333333;
  margin-bottom: 16px;
}

.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.empty-text {
  font-size: 14px;
  color: #CCCCCC;
}

.timeline {
  position: relative;
}

.timeline-item {
  display: flex;
  position: relative;
  margin-bottom: 16px;
  padding-left: 24px;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: 0;
  top: 8px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  z-index: 1;
}

.timeline-line {
  position: absolute;
  left: 5px;
  top: 22px;
  bottom: -16px;
  width: 2px;
  background: #F0F0F0;
}

.timeline-item:last-child .timeline-line {
  display: none;
}

.timeline-card {
  flex: 1;
  background: #FAFAFA;
  border-radius: 10px;
  padding: 12px 14px;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.card-icon {
  font-size: 16px;
  margin-right: 6px;
}

.card-type {
  font-size: 14px;
  font-weight: 500;
  color: #333333;
  flex: 1;
}

.card-time {
  font-size: 12px;
  color: #AAAAAA;
}

.card-detail {
  font-size: 13px;
  color: #777777;
}
</style>

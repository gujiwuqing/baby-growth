<template>
  <view class="home-page">
    <!-- 喂养记录入口 -->
    <view class="feeding-entry" @click="goToFeeding">
      <view class="entry-icon">🍼</view>
      <view class="entry-content">
        <view class="entry-title">喂养记录</view>
        <view class="entry-stats">
          <text class="stat-text">今日 {{ todayStats.feeding }} 次</text>
          <text class="stat-divider">|</text>
          <text class="stat-text">总奶量 {{ todayStats.totalMilk }}ml</text>
        </view>
      </view>
      <view class="entry-arrow">→</view>
    </view>

    <!-- 今日时间轴 -->
    <view class="today-section">
      <view class="section-title">今日记录</view>
      <scroll-view class="today-scroll" scroll-y>
        <view class="empty-tip" v-if="todayRecords.length === 0">
          今天还没有记录，快来记录宝宝的成长吧~
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

    <!-- 快捷记录 -->
    <QuickRecord @record="handleRecord" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import QuickRecord from '@/components/QuickRecord/QuickRecord.vue'
import { db } from '@/utils/database'
import { formatTime } from '@/utils/device'
import { RECORD_TYPE_META } from '@/utils/recordTypes'

interface RecordItem {
  id: string
  type: string
  label: string
  icon: string
  color: string
  detail: string
  time: string
  timestamp: number
}

// 今日统计
const todayStats = ref({
  feeding: 0,
  totalMilk: 0
})

// 今日记录
const todayRecords = ref<RecordItem[]>([])

// 类型元信息（统一引用公共常量）
const typeMeta = RECORD_TYPE_META

const formatMin = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  return `${m}min`
}

// 母乳详情
const buildBreastDetail = (r: any): string => {
  const left = r.left_duration || 0
  const right = r.right_duration || 0
  const parts: string[] = []
  if (left > 0) parts.push(`左${formatMin(left)}`)
  if (right > 0) parts.push(`右${formatMin(right)}`)
  let detail = parts.join(' ') || `${formatMin(left + right)}`
  if (r.start_time && r.end_time) {
    detail += ` ${formatTime(r.start_time, 'HH:mm')}-${formatTime(r.end_time, 'HH:mm')}`
  }
  return detail
}

// 加载今日数据
const loadTodayData = async () => {
  const today = new Date()
  const startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const endTime = startTime + 24 * 60 * 60 * 1000
  
  // 今日喂养统计
  const feeds = await db.selectSql(`
    SELECT COUNT(*) as count, SUM(amount) as total
    FROM feeds 
    WHERE timestamp >= ${startTime} AND timestamp < ${endTime}
  `)
  
  if (feeds && feeds.length > 0) {
    todayStats.value.feeding = feeds[0].count
    todayStats.value.totalMilk = feeds[0].total || 0
  }
}

// 加载今日记录时间轴
const loadTodayRecords = async () => {
  const records: RecordItem[] = []
  const today = new Date()
  const startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const endTime = startTime + 24 * 60 * 60 * 1000
  
  // 喂养记录
  const feeds = await db.selectSql(`
    SELECT * FROM feeds 
    WHERE timestamp >= ${startTime} AND timestamp < ${endTime}
    ORDER BY timestamp DESC
  `)
  if (feeds && feeds.length > 0) {
    feeds.forEach((r: any) => {
      const meta = typeMeta[r.type] || typeMeta.formula
      let detail = ''
      if (r.type === 'breast') {
        detail = buildBreastDetail(r)
      } else {
        detail = `${r.amount || 0}ml`
      }
      records.push({
        id: `feed_${r.id}`,
        type: r.type,
        label: meta.label,
        icon: meta.icon,
        color: meta.color,
        detail,
        time: formatTime(r.timestamp, 'HH:mm'),
        timestamp: r.timestamp
      })
    })
  }
  
  // 换尿布
  const diapers = await db.selectSql(`
    SELECT * FROM diapers 
    WHERE timestamp >= ${startTime} AND timestamp < ${endTime}
    ORDER BY timestamp DESC
  `)
  if (diapers && diapers.length > 0) {
    const diaperLabels: Record<string, string> = { pee: '小便', poo: '大便', both: '混合' }
    diapers.forEach((r: any) => {
      const meta = typeMeta.diaper
      let detail = diaperLabels[r.type] || ''
      if (r.has_rash === 1) detail += '，有红屁屁'
      if (r.note) detail += ` ${r.note}`
      
      records.push({
        id: `diaper_${r.id}`,
        type: 'diaper',
        label: meta.label,
        icon: meta.icon,
        color: meta.color,
        detail,
        time: formatTime(r.timestamp, 'HH:mm'),
        timestamp: r.timestamp
      })
    })
  }
  
  // 睡眠
  const sleeps = await db.selectSql(`
    SELECT * FROM sleeps 
    WHERE start_time >= ${startTime} AND start_time < ${endTime}
    ORDER BY start_time DESC
  `)
  if (sleeps && sleeps.length > 0) {
    sleeps.forEach((r: any) => {
      const meta = typeMeta.sleep
      let detail = ''
      if (r.duration) {
        const h = Math.floor(r.duration / (1000 * 60 * 60))
        const m = Math.floor((r.duration % (1000 * 60 * 60)) / (1000 * 60))
        detail = h > 0 ? `${h}小时${m}分钟` : `${m}分钟`
      }
      records.push({
        id: `sleep_${r.id}`,
        type: 'sleep',
        label: meta.label,
        icon: meta.icon,
        color: meta.color,
        detail,
        time: formatTime(r.start_time, 'HH:mm'),
        timestamp: r.start_time
      })
    })
  }
  
  // 按时间排序
  todayRecords.value = records.sort((a, b) => b.timestamp - a.timestamp)
}

// 页面导航
const goToFeeding = () => {
  uni.navigateTo({ url: '/pages/feeding/index' })
}

// ===== 快捷记录跳转 =====
const handleRecord = (type: string) => {
  const feedTypes = ['breast', 'formula', 'bottle']
  if (feedTypes.includes(type)) {
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

onShow(async () => {
  try {
    await db.open()
    await db.initTables()

    // 并行加载所有数据
    await Promise.all([
      loadTodayData(),
      loadTodayRecords()
    ])
  } catch (error) {
    console.error('加载数据失败', error)
  }
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding-bottom: 160px;
}

/* 喂养记录入口 */
.feeding-entry {
  background: linear-gradient(135deg, #FF9EC4 0%, #FFB8D9 100%);
  margin: 15px;
  border-radius: 20px;
  padding: 25px 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 12px rgba(255, 158, 196, 0.3);
  transition: transform 0.2s;
}

.feeding-entry:active {
  transform: scale(0.98);
}

.entry-icon {
  font-size: 48px;
  margin-right: 15px;
}

.entry-content {
  flex: 1;
}

.entry-title {
  font-size: 20px;
  font-weight: bold;
  color: #FFFFFF;
  margin-bottom: 8px;
}

.entry-stats {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.stat-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.95);
}

.stat-divider {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 4px;
}

.entry-arrow {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.8);
  margin-left: 10px;
}

/* 今日记录 */
.today-section {
  margin: 15px;
  background: #FFFFFF;
  border-radius: 16px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(255, 158, 196, 0.08);
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
  margin-bottom: 12px;
  padding-left: 4px;
}

.today-scroll {
  max-height: 400px;
}

.empty-tip {
  text-align: center;
  color: #BBBBBB;
  font-size: 14px;
  padding: 40px 20px;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  position: relative;
  padding: 8px 0;
}

.timeline-time {
  width: 40px;
  font-size: 12px;
  color: #999999;
  padding-top: 6px;
  flex-shrink: 0;
  font-weight: 500;
}

.timeline-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin: 8px 8px 0 4px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  box-shadow: 0 0 0 2px rgba(255, 107, 168, 0.15);
}

.timeline-content {
  flex: 1;
  background: #FAFAFA;
  border-radius: 10px;
  padding: 8px 10px;
  margin-left: -2px;
}

.timeline-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.timeline-icon {
  font-size: 16px;
  margin-right: 6px;
}

.timeline-type {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
  margin-right: 8px;
  flex-shrink: 0;
}

.timeline-detail {
  font-size: 12px;
  color: #666666;
  white-space: pre-line;
  line-height: 1.5;
  flex: 1;
  min-width: 0;
}
</style>

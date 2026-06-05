<template>
  <view class="statistics-page">
    <!-- 时间范围选择 -->
    <view class="time-selector">
      <view 
        class="time-option"
        :class="{ active: timeRange === 'day' }"
        @click="changeTimeRange('day')"
      >
        今日
      </view>
      <view 
        class="time-option"
        :class="{ active: timeRange === 'week' }"
        @click="changeTimeRange('week')"
      >
        本周
      </view>
      <view 
        class="time-option"
        :class="{ active: timeRange === 'month' }"
        @click="changeTimeRange('month')"
      >
        本月
      </view>
    </view>

    <!-- 喂奶统计 -->
    <view class="stat-card">
      <view class="stat-title">🍼 喂奶统计</view>
      <view class="stat-summary">
        <view class="summary-item">
          <text class="summary-value">{{ feedingStats.totalCount }}</text>
          <text class="summary-label">总次数</text>
        </view>
        <view class="summary-item">
          <text class="summary-value">{{ feedingStats.totalAmount }}</text>
          <text class="summary-label">总量(ml)</text>
        </view>
        <view class="summary-item">
          <text class="summary-value">{{ feedingStats.avgAmount }}</text>
          <text class="summary-label">平均(ml)</text>
        </view>
      </view>
      <view class="chart-placeholder">
        <view class="chart-bars">
          <view 
            v-for="(item, index) in feedingChartData" 
            :key="index"
            class="chart-bar"
            :style="{ height: (item.value / maxFeedingValue * 100) + '%' }"
          >
            <view class="bar-label">{{ item.label }}</view>
            <view class="bar-value">{{ item.value }}</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 纸尿裤统计 -->
    <view class="stat-card">
      <view class="stat-title">👶 纸尿裤统计</view>
      <view class="stat-summary">
        <view class="summary-item">
          <text class="summary-value">{{ diaperStats.total }}</text>
          <text class="summary-label">总次数</text>
        </view>
      </view>
      <view class="diaper-stats">
        <view class="diaper-item">
          <view class="diaper-icon">💧</view>
          <view class="diaper-label">尿</view>
          <view class="diaper-value">{{ diaperStats.pee }}</view>
        </view>
        <view class="diaper-item">
          <view class="diaper-icon">💩</view>
          <view class="diaper-label">屎</view>
          <view class="diaper-value">{{ diaperStats.poo }}</view>
        </view>
        <view class="diaper-item">
          <view class="diaper-icon">💧💩</view>
          <view class="diaper-label">混合</view>
          <view class="diaper-value">{{ diaperStats.both }}</view>
        </view>
      </view>
    </view>

    <!-- 睡眠统计 -->
    <view class="stat-card">
      <view class="stat-title">😴 睡眠统计</view>
      <view class="stat-summary">
        <view class="summary-item">
          <text class="summary-value">{{ sleepStats.totalHours }}</text>
          <text class="summary-label">总时长(h)</text>
        </view>
        <view class="summary-item">
          <text class="summary-value">{{ sleepStats.avgHours }}</text>
          <text class="summary-label">平均(h)</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { db } from '@/utils/database'

const timeRange = ref('day')

const feedingStats = ref({
  totalCount: 0,
  totalAmount: 0,
  avgAmount: 0
})

const diaperStats = ref({
  total: 0,
  pee: 0,
  poo: 0,
  both: 0
})

const sleepStats = ref({
  totalHours: 0,
  avgHours: 0
})

const feedingChartData = ref<any[]>([])

const maxFeedingValue = computed(() => {
  if (feedingChartData.value.length === 0) return 100
  return Math.max(...feedingChartData.value.map(item => item.value))
})

const changeTimeRange = (range: string) => {
  timeRange.value = range
  loadStats()
}

const loadStats = async () => {
  try {
    const now = new Date()
    let startTime: number
    
    if (timeRange.value === 'day') {
      startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    } else if (timeRange.value === 'week') {
      startTime = now.getTime() - 7 * 24 * 60 * 60 * 1000
    } else {
      startTime = now.getTime() - 30 * 24 * 60 * 60 * 1000
    }
    
    // 加载喂奶统计
    const feeds = await db.selectSql(`
      SELECT COUNT(*) as count, SUM(amount) as amount
      FROM feeds
      WHERE timestamp >= ${startTime}
    `)
    
    if (feeds && feeds.length > 0) {
      feedingStats.value.totalCount = feeds[0].count || 0
      feedingStats.value.totalAmount = feeds[0].amount || 0
      feedingStats.value.avgAmount = feedingStats.value.totalCount > 0 
        ? Math.round(feedingStats.value.totalAmount / feedingStats.value.totalCount)
        : 0
    }
    
    // 加载喂奶时间分布（简化版柱状图）
    const feedsByHour = await db.selectSql(`
      SELECT strftime('%H', datetime(timestamp/1000, 'unixepoch')) as hour, COUNT(*) as count
      FROM feeds
      WHERE timestamp >= ${startTime}
      GROUP BY hour
      ORDER BY hour
    `)
    
    feedingChartData.value = []
    if (feedsByHour && feedsByHour.length > 0) {
      feedsByHour.forEach((item: any) => {
        feedingChartData.value.push({
          label: `${item.hour}:00`,
          value: item.count
        })
      })
    }
    
    // 加载纸尿裤统计
    const diapers = await db.selectSql(`
      SELECT type, COUNT(*) as count
      FROM diapers
      WHERE timestamp >= ${startTime}
      GROUP BY type
    `)
    
    diaperStats.value = { total: 0, pee: 0, poo: 0, both: 0 }
    
    if (diapers && diapers.length > 0) {
      diapers.forEach((item: any) => {
        diaperStats.value.total += item.count
        if (item.type === 'pee') diaperStats.value.pee = item.count
        else if (item.type === 'poo') diaperStats.value.poo = item.count
        else if (item.type === 'both') diaperStats.value.both = item.count
      })
    }
    
    // 加载睡眠统计
    const sleeps = await db.selectSql(`
      SELECT SUM(duration) as total, COUNT(*) as count
      FROM sleeps
      WHERE start_time >= ${startTime}
    `)
    
    if (sleeps && sleeps.length > 0) {
      const totalMs = sleeps[0].total || 0
      const count = sleeps[0].count || 0
      sleepStats.value.totalHours = Math.round(totalMs / (1000 * 60 * 60) * 10) / 10
      sleepStats.value.avgHours = count > 0 
        ? Math.round(totalMs / count / (1000 * 60 * 60) * 10) / 10
        : 0
    }
    
  } catch (error) {
    console.error('加载统计数据失败', error)
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.statistics-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding: 15px;
}

.time-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.time-option {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  background: #FFFFFF;
  border-radius: 20px;
  font-size: 14px;
  color: #666666;
}

.time-option.active {
  background: #FF9EC4;
  color: #FFFFFF;
}

.stat-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 15px;
}

.stat-title {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
  margin-bottom: 15px;
}

.stat-summary {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.summary-item {
  text-align: center;
}

.summary-value {
  display: block;
  font-size: 28px;
  font-weight: bold;
  color: #FF9EC4;
  margin-bottom: 5px;
}

.summary-label {
  font-size: 12px;
  color: #999999;
}

.chart-placeholder {
  margin-top: 15px;
}

.chart-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 120px;
  gap: 5px;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(to top, #FF9EC4, #FFB6D1);
  border-radius: 4px 4px 0 0;
  position: relative;
  min-height: 20px;
}

.bar-label {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: #999999;
  white-space: nowrap;
}

.bar-value {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: #666666;
}

.diaper-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 15px;
}

.diaper-item {
  text-align: center;
  flex: 1;
}

.diaper-icon {
  font-size: 24px;
  margin-bottom: 5px;
}

.diaper-label {
  font-size: 12px;
  color: #666666;
  margin-bottom: 5px;
}

.diaper-value {
  font-size: 20px;
  font-weight: bold;
  color: #FF9EC4;
}
</style>

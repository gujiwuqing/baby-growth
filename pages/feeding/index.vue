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

    <!-- 月汇总卡片 -->
    <view class="month-summary">
      <view class="summary-title">{{ monthLabel }} 汇总</view>
      <view class="summary-grid">
        <view class="summary-item">
          <text class="summary-value">{{ monthStats.feedDays }}</text>
          <text class="summary-label">记录天数</text>
        </view>
        <view class="summary-item">
          <text class="summary-value">{{ monthStats.totalFeeds }}</text>
          <text class="summary-label">喂奶次数</text>
        </view>
        <view class="summary-item">
          <text class="summary-value">{{ monthStats.totalFoods }}</text>
          <text class="summary-label">辅食次数</text>
        </view>
        <view class="summary-item">
          <text class="summary-value">{{ monthStats.totalMilk }}</text>
          <text class="summary-label">总奶量(ml)</text>
        </view>
      </view>
      <view class="summary-row" v-if="monthStats.totalFeeds > 0">
        <text class="summary-avg">日均奶量 {{ monthStats.avgDailyMilk }} ml · 日均喂奶 {{ monthStats.avgDailyFeeds }} 次</text>
      </view>
    </view>

    <!-- 快速记录 -->
    <view class="quick-actions">
      <button class="action-btn milk-btn" @click="goRecord('formula')">🍼 记录喂奶</button>
      <button class="action-btn food-btn" @click="goRecord('food')">🥣 记录辅食</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { db } from '@/utils/database'
import MonthCalendar from '@/components/MonthCalendar/MonthCalendar.vue'

interface DayData {
  feedCount: number
  milkTotal: number
  hasFood: boolean
}

const DAY_MS = 24 * 60 * 60 * 1000

const startOfDay = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

const monthTimestamp = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime())
const dayData = ref<Record<number, DayData>>({})

const monthStats = ref({
  feedDays: 0,
  totalFeeds: 0,
  totalFoods: 0,
  totalMilk: 0,
  avgDailyMilk: 0,
  avgDailyFeeds: 0
})

const monthLabel = computed(() => {
  const d = new Date(monthTimestamp.value)
  return `${d.getFullYear()}年${d.getMonth() + 1}月`
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

const goRecord = (type: string) => {
  if (type === 'food') {
    uni.navigateTo({ url: '/pages/record/food' })
  } else {
    uni.navigateTo({ url: `/pages/record/feeding?type=${type}` })
  }
}

const loadMonthData = async () => {
  const d = new Date(monthTimestamp.value)
  const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime()
  const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime()

  const data: Record<number, DayData> = {}

  // 喂奶记录
  const feeds = await db.selectSql(`
    SELECT timestamp, amount, type FROM feeds
    WHERE timestamp >= ${monthStart} AND timestamp < ${monthEnd}
  `)
  if (feeds && feeds.length > 0) {
    feeds.forEach((r: any) => {
      const dayStart = startOfDay(new Date(r.timestamp))
      if (!data[dayStart]) data[dayStart] = { feedCount: 0, milkTotal: 0, hasFood: false }
      data[dayStart].feedCount++
      if (r.type !== 'breast') {
        data[dayStart].milkTotal += (r.amount || 0)
      }
    })
  }

  // 辅食记录
  const foods = await db.selectSql(`
    SELECT timestamp FROM foods
    WHERE timestamp >= ${monthStart} AND timestamp < ${monthEnd}
  `)
  if (foods && foods.length > 0) {
    foods.forEach((r: any) => {
      const dayStart = startOfDay(new Date(r.timestamp))
      if (!data[dayStart]) data[dayStart] = { feedCount: 0, milkTotal: 0, hasFood: false }
      data[dayStart].hasFood = true
    })
  }

  dayData.value = data

  // 月汇总
  const days = Object.keys(data)
  const feedDays = days.filter(k => data[Number(k)].feedCount > 0 || data[Number(k)].hasFood).length
  let totalFeeds = 0
  let totalMilk = 0
  let totalFoods = 0
  days.forEach(k => {
    totalFeeds += data[Number(k)].feedCount
    totalMilk += data[Number(k)].milkTotal
    if (data[Number(k)].hasFood) totalFoods++
  })

  monthStats.value = {
    feedDays,
    totalFeeds,
    totalFoods,
    totalMilk,
    avgDailyMilk: feedDays > 0 ? Math.round(totalMilk / feedDays) : 0,
    avgDailyFeeds: feedDays > 0 ? Math.round(totalFeeds / feedDays * 10) / 10 : 0
  }
}

onShow(() => {
  loadMonthData()
})
</script>

<style scoped>
.feeding-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding: 15px;
  padding-bottom: 30px;
}

/* 月汇总 */
.month-summary {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 18px;
  margin-top: 15px;
}

.summary-title {
  font-size: 15px;
  font-weight: bold;
  color: #333333;
  margin-bottom: 14px;
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
  font-size: 22px;
  font-weight: bold;
  color: #FF6BA8;
}

.summary-label {
  font-size: 11px;
  color: #999999;
  margin-top: 4px;
}

.summary-row {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #FFF0F5;
  text-align: center;
}

.summary-avg {
  font-size: 12px;
  color: #AAAAAA;
}

/* 快速记录 */
.quick-actions {
  display: flex;
  gap: 12px;
  margin-top: 15px;
}

.action-btn {
  flex: 1;
  padding: 14px 0;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 500;
  text-align: center;
  border: none;
}

.milk-btn {
  background: linear-gradient(135deg, #FF9EC4, #FFB8D9);
  color: #FFFFFF;
}

.food-btn {
  background: linear-gradient(135deg, #FFB347, #FFCC80);
  color: #FFFFFF;
}

.action-btn:active {
  opacity: 0.8;
}
</style>

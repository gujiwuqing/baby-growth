<template>
  <view class="home-page" :style="themeVars">
    <!-- 今日异常提示 -->
    <view class="alert-section" v-if="todayAlerts.length > 0">
      <view class="alert-item" v-for="(alert, index) in todayAlerts" :key="index" :class="alert.type">
        <view class="alert-icon">{{ alert.icon }}</view>
        <view class="alert-content">
          <text class="alert-title">{{ alert.title }}</text>
          <text class="alert-message">{{ alert.message }}</text>
        </view>
      </view>
    </view>

    <!-- 记录总览入口 -->
    <view class="feeding-entry" @click="goToRecords">
      <view class="entry-icon">📊</view>
      <view class="entry-content">
        <view class="entry-title">记录总览</view>
        <view class="entry-stats">
          <text class="stat-text">今日 {{ todayStats.totalRecords }} 条</text>
          <text class="stat-divider">|</text>
          <text class="stat-text">包含喂养/睡眠/换尿布等</text>
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

    <!-- 自定义 TabBar -->
    <CustomTabBar :current="0" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import QuickRecord from '@/components/QuickRecord/QuickRecord.vue'
import CustomTabBar from '@/components/CustomTabBar/CustomTabBar.vue'
import { useTheme } from '@/composables/useTheme'

const { themeVars, activeTheme, initTheme } = useTheme()
import { db } from '@/utils/database'
import type { RecordItem } from '@/types/record'
import { FEEDING_TYPES } from '@/types/record'
import { loadRecordsByRange, getDayRange } from '@/composables/useRecordLoader'

// 今日统计
const todayStats = ref({
  totalRecords: 0,
  feedCount: 0,
  sleepCount: 0,
  diaperCount: 0
})

// 今日记录
const todayRecords = ref<RecordItem[]>([])

// 宝宝月龄
const babyMonths = ref(0)

// 今日异常提示
interface AlertItem {
  type: 'warning' | 'info' | 'success'
  icon: string
  title: string
  message: string
}

const todayAlerts = computed<AlertItem[]>(() => {
  const alerts: AlertItem[] = []
  
  // 喂奶次数过少（建议每天 6-8 次）
  if (todayStats.value.feedCount > 0 && todayStats.value.feedCount < 6) {
    alerts.push({
      type: 'warning',
      icon: '⚠️',
      title: '喂奶次数偏少',
      message: `今日已喂奶 ${todayStats.value.feedCount} 次，建议增加至 6-8 次`
    })
  }
  
  // 换尿布次数过多（可能皮肤不适）
  if (todayStats.value.diaperCount > 10) {
    alerts.push({
      type: 'info',
      icon: '💡',
      title: '换尿布频繁',
      message: `今日已换 ${todayStats.value.diaperCount} 次尿布，注意观察宝宝皮肤状况`
    })
  }
  
  // 换尿布次数过少
  if (todayStats.value.diaperCount > 0 && todayStats.value.diaperCount < 4) {
    alerts.push({
      type: 'warning',
      icon: '⚠️',
      title: '换尿布次数偏少',
      message: `今日仅换了 ${todayStats.value.diaperCount} 次尿布，建议增加检查频率`
    })
  }
  
  // 睡眠记录为空
  if (todayStats.value.totalRecords > 0 && todayStats.value.sleepCount === 0 && babyMonths.value < 12) {
    alerts.push({
      type: 'info',
      icon: '😴',
      title: '缺少睡眠记录',
      message: '建议记录宝宝睡眠时间，帮助建立规律作息'
    })
  }
  
  // 今天还没有任何记录
  if (todayStats.value.totalRecords === 0) {
    alerts.push({
      type: 'info',
      icon: '📝',
      title: '开始记录吧',
      message: '记录宝宝的每一个成长瞬间'
    })
  }
  
  return alerts
})

// 加载今日数据（统计 + 时间轴记录）
const loadTodayData = async () => {
  try {
    const { startTime, endTime } = getDayRange(new Date())
    const records = await loadRecordsByRange(startTime, endTime)
    todayRecords.value = records
    todayStats.value.totalRecords = records.length
    
    // 分类统计
    todayStats.value.feedCount = records.filter(r => FEEDING_TYPES.includes(r.type as any)).length
    todayStats.value.sleepCount = records.filter(r => r.type === 'sleep').length
    todayStats.value.diaperCount = records.filter(r => r.type === 'diaper').length
  } catch (error) {
    console.error('加载今日数据失败', error)
    // 失败时使用默认值
    todayRecords.value = []
    todayStats.value = {
      totalRecords: 0,
      feedCount: 0,
      sleepCount: 0,
      diaperCount: 0
    }
  }
}

// 加载宝宝信息
const loadBabyInfo = async () => {
  try {
    const result = await db.selectSql('SELECT birthday FROM baby_info LIMIT 1')
    if (result && result.length > 0) {
      const birthday = new Date(result[0].birthday).getTime()
      const now = Date.now()
      babyMonths.value = Math.floor((now - birthday) / (1000 * 60 * 60 * 24 * 30))
    }
  } catch (error) {
    // 数据库可能未初始化，静默失败
    console.error('加载宝宝信息失败', error)
    babyMonths.value = 0
  }
}

// 页面导航
const goToRecords = () => {
  uni.navigateTo({ url: '/pages/records/index' })
}

// ===== 快捷记录跳转 =====
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

onShow(async () => {
  initTheme()
  try {
    await db.open()
    await db.initTables()

    // 并行加载数据，但捕获各自错误，避免单个失败影响整体
    await Promise.allSettled([
      loadBabyInfo(),
      loadTodayData()
    ])
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
.home-page {
  min-height: 100vh;
  background: var(--background-color, #F5F5F5);
  padding-bottom: 320rpx;
}

/* ===== 异常提示区域 ===== */
.alert-section {
  margin: 24rpx 24rpx 0;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  padding: 24rpx;
  border-radius: var(--card-radius, 16rpx);
  margin-bottom: 12rpx;
  backdrop-filter: blur(12px);
  position: relative;
  overflow: hidden;
}

.alert-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6rpx;
  border-radius: 3rpx;
}

.alert-item.warning {
  background: linear-gradient(135deg, rgba(245, 197, 163, 0.25) 0%, rgba(253, 246, 240, 0.6) 100%);
}

.alert-item.warning::before {
  background: linear-gradient(180deg, #E8857A, #F2A89E);
}

.alert-item.info {
  background: linear-gradient(135deg, rgba(184, 169, 212, 0.15) 0%, rgba(253, 246, 240, 0.6) 100%);
}

.alert-item.info::before {
  background: linear-gradient(180deg, #B8A9D4, #D0C5E6);
}

.alert-item.success {
  background: linear-gradient(135deg, rgba(140, 201, 176, 0.15) 0%, rgba(253, 246, 240, 0.6) 100%);
}

.alert-item.success::before {
  background: linear-gradient(180deg, #8CC9B0, #A8DBC5);
}

.alert-icon {
  font-size: 36rpx;
  margin-top: 2rpx;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.alert-title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--text-color, #3D3036);
  letter-spacing: 0.5rpx;
}

.alert-message {
  font-size: 24rpx;
  color: var(--text-secondary, #8A7E84);
  line-height: 1.6;
}

/* ===== 记录总览入口 ===== */
.feeding-entry {
  background: var(--primary-gradient, linear-gradient(135deg, #E8857A 0%, #F2A89E 50%, #F7C4BA 100%));
  margin: 24rpx 24rpx;
  border-radius: 20rpx;
  padding: 36rpx 28rpx;
  display: flex;
  align-items: center;
  box-shadow: var(--card-shadow, 0 2rpx 12rpx rgba(0,0,0,0.06));
  transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.25s;
  position: relative;
  overflow: hidden;
}

.feeding-entry::after {
  content: '';
  position: absolute;
  top: -40%;
  right: -20%;
  width: 280rpx;
  height: 280rpx;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
  border-radius: 50%;
}

.feeding-entry:active {
  transform: scale(0.97);
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}

.entry-icon {
  font-size: 72rpx;
  margin-right: 24rpx;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 4rpx 8rpx rgba(0, 0, 0, 0.1));
}

.entry-content {
  flex: 1;
  position: relative;
  z-index: 1;
}

.entry-title {
  font-size: 36rpx;
  font-weight: 800;
  color: #FFFFFF;
  margin-bottom: 12rpx;
  letter-spacing: 1rpx;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.entry-stats {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12rpx;
}

.stat-text {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.92);
  font-weight: 500;
}

.stat-divider {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.45);
  margin: 0 4rpx;
}

.entry-arrow {
  font-size: 44rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-left: 16rpx;
  position: relative;
  z-index: 1;
  font-weight: 300;
}

/* ===== 今日记录 ===== */
.today-section {
  margin: 24rpx 24rpx;
  background: var(--card-color, #FFFFFF);
  border-radius: var(--card-radius, 16rpx);
  padding: 24rpx;
  box-shadow: var(--card-shadow, 0 2rpx 12rpx rgba(0,0,0,0.06));
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--text-color, #1A1A1A);
  margin-bottom: 24rpx;
  padding-left: 4rpx;
  letter-spacing: 0.5rpx;
}

.today-scroll {
  max-height: 800rpx;
}

.empty-tip {
  text-align: center;
  color: var(--text-tertiary, #BDB2B7);
  font-size: 28rpx;
  padding: 80rpx 40rpx;
  line-height: 1.8;
}

/* ===== 时间轴 ===== */
.timeline-item {
  display: flex;
  align-items: flex-start;
  position: relative;
  padding: 14rpx 0;
}

.timeline-time {
  width: 84rpx;
  font-size: 24rpx;
  color: var(--text-tertiary, #BDB2B7);
  padding-top: 14rpx;
  flex-shrink: 0;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.timeline-dot {
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  margin: 16rpx 16rpx 0 8rpx;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  box-shadow: 0 0 0 6rpx rgba(232, 133, 122, 0.12);
}

.timeline-content {
  flex: 1;
  background: var(--divider-color, #F5F5F5);
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  margin-left: -4rpx;
  border: 1rpx solid var(--border-color, #EEEEEE);
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
  font-weight: 700;
  color: var(--text-color, #3D3036);
  margin-right: 16rpx;
  flex-shrink: 0;
}

.timeline-detail {
  font-size: 24rpx;
  color: var(--text-secondary, #8A7E84);
  white-space: pre-line;
  line-height: 1.6;
  flex: 1;
  min-width: 0;
}
</style>

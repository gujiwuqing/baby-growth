<template>
  <view class="home-page" :style="themeVars">
    <!-- 今日数据概览 -->
    <view class="stats-section">
      <view class="stats-row">
        <view class="stat-card" @click="goToRecords">
          <view class="stat-icon-wrap" style="background: rgba(232, 133, 122, 0.1);">
            <text class="stat-icon">🍼</text>
          </view>
          <view class="stat-info">
            <text class="stat-num">{{ todayStats.feedCount }}</text>
            <text class="stat-label">喂奶</text>
          </view>
        </view>
        <view class="stat-card">
          <view class="stat-icon-wrap" style="background: rgba(184, 169, 212, 0.12);">
            <text class="stat-icon">😴</text>
          </view>
          <view class="stat-info">
            <text class="stat-num">{{ todayStats.sleepCount }}</text>
            <text class="stat-label">睡眠</text>
          </view>
        </view>
        <view class="stat-card">
          <view class="stat-icon-wrap" style="background: rgba(140, 201, 176, 0.12);">
            <text class="stat-icon">👶</text>
          </view>
          <view class="stat-info">
            <text class="stat-num">{{ todayStats.diaperCount }}</text>
            <text class="stat-label">换尿布</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 快捷记录 -->
    <QuickRecord @record="handleRecord" />

    <!-- 今日时间轴 -->
    <view class="today-section">
      <view class="section-header">
        <text class="section-title">今日记录</text>
        <text class="section-action" @click="goToRecords" v-if="todayRecords.length > 0">查看全部 ›</text>
      </view>
      <scroll-view class="today-scroll" scroll-y>
        <view class="empty-tip" v-if="todayRecords.length === 0">
          <text class="empty-icon">📝</text>
          <text class="empty-text">今天还没有记录</text>
          <text class="empty-sub">快来记录宝宝的成长吧~</text>
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

    <!-- 自定义 TabBar -->
    <CustomTabBar :current="0" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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

// 宝宝月龄（用于数据加载）
const babyMonths = ref(0)

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

// 加载宝宝信息（月龄）
const loadBabyInfo = async () => {
  try {
    const result = await db.selectSql('SELECT birthday FROM baby_info LIMIT 1')
    if (result && result.length > 0 && result[0].birthday) {
      const birthday = new Date(result[0].birthday).getTime()
      babyMonths.value = Math.floor((Date.now() - birthday) / (1000 * 60 * 60 * 24 * 30))
    }
  } catch (error) {
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
  // 隐藏原生 tabbar，使用自定义 CustomTabBar
  uni.hideTabBar({ animation: false })
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

/* ===== 今日数据概览 ===== */
.stats-section {
  margin: 20rpx 24rpx 0;
}

.stats-row {
  display: flex;
  gap: 16rpx;
}

.stat-card {
  flex: 1;
  background: var(--card-color, #FFFFFF);
  border-radius: 20rpx;
  padding: 28rpx 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  box-shadow: var(--card-shadow, 0 2rpx 12rpx rgba(0, 0, 0, 0.06));
  transition: transform 0.15s;
}

.stat-card:active {
  transform: scale(0.96);
}

.stat-icon-wrap {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon {
  font-size: 38rpx;
}

.stat-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.stat-num {
  font-size: 36rpx;
  font-weight: 800;
  color: var(--text-color, #1A1A1A);
}

.stat-label {
  font-size: 22rpx;
  color: var(--text-tertiary, #999999);
  font-weight: 500;
}


/* ===== 今日记录 ===== */
.today-section {
  margin: 24rpx 24rpx;
  background: var(--card-color, #FFFFFF);
  border-radius: var(--card-radius, 16rpx);
  padding: 24rpx;
  box-shadow: var(--card-shadow, 0 2rpx 12rpx rgba(0,0,0,0.06));
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--text-color, #1A1A1A);
  padding-left: 4rpx;
  letter-spacing: 0.5rpx;
}

.section-action {
  font-size: 26rpx;
  color: var(--primary-color, #E8857A);
  font-weight: 500;
}

.today-scroll {
  max-height: 800rpx;
}

.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 40rpx;
  gap: 12rpx;
}

.empty-icon {
  font-size: 64rpx;
  margin-bottom: 8rpx;
}

.empty-text {
  font-size: 30rpx;
  color: var(--text-secondary, #666666);
  font-weight: 600;
}

.empty-sub {
  font-size: 24rpx;
  color: var(--text-tertiary, #999999);
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

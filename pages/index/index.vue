<template>
  <view class="home-page">
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
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import QuickRecord from '@/components/QuickRecord/QuickRecord.vue'
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
  const { startTime, endTime } = getDayRange(new Date())
  const records = await loadRecordsByRange(startTime, endTime)
  todayRecords.value = records
  todayStats.value.totalRecords = records.length
  
  // 分类统计
  todayStats.value.feedCount = records.filter(r => FEEDING_TYPES.includes(r.type as any)).length
  todayStats.value.sleepCount = records.filter(r => r.type === 'sleep').length
  todayStats.value.diaperCount = records.filter(r => r.type === 'diaper').length
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
    console.error('加载宝宝信息失败', error)
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
  try {
    await db.open()
    await db.initTables()
    
    await Promise.all([
      loadBabyInfo(),
      loadTodayData()
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
  padding-bottom: 320rpx;
}

/* 异常提示区域 */
.alert-section {
  margin: 30rpx;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 24rpx;
  border-radius: 20rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.alert-item.warning {
  background: linear-gradient(135deg, #FFE5E5 0%, #FFF0F0 100%);
  border-left: 6rpx solid #FF6B6B;
}

.alert-item.info {
  background: linear-gradient(135deg, #E3F2FD 0%, #F0F8FF 100%);
  border-left: 6rpx solid #4A90E2;
}

.alert-item.success {
  background: linear-gradient(135deg, #E8F5E9 0%, #F1F8E9 100%);
  border-left: 6rpx solid #66BB6A;
}

.alert-icon {
  font-size: 32rpx;
  margin-top: 4rpx;
}

.alert-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.alert-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
}

.alert-message {
  font-size: 24rpx;
  color: #666666;
  line-height: 1.5;
}

/* 喂养记录入口 */
.feeding-entry {
  background: linear-gradient(135deg, #FF9EC4 0%, #FFB8D9 100%);
  margin: 30rpx;
  border-radius: 40rpx;
  padding: 50rpx 40rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 8rpx 24rpx rgba(255, 158, 196, 0.3);
  transition: transform 0.2s;
}

.feeding-entry:active {
  transform: scale(0.98);
}

.entry-icon {
  font-size: 96rpx;
  margin-right: 30rpx;
}

.entry-content {
  flex: 1;
}

.entry-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #FFFFFF;
  margin-bottom: 16rpx;
}

.entry-stats {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16rpx;
}

.stat-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.95);
}

.stat-divider {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 8rpx;
}

.entry-arrow {
  font-size: 48rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-left: 20rpx;
}

/* 今日记录 */
.today-section {
  margin: 30rpx;
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(255, 158, 196, 0.08);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 24rpx;
  padding-left: 8rpx;
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

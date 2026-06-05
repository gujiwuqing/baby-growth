<template>
  <view class="feeding-page">
    <!-- 时间维度切换 -->
    <view class="time-tabs">
      <text 
        :class="['tab', activeTimeTab === 'today' ? 'active' : '']" 
        @click="switchTimeTab('today')"
      >今日</text>
      <text 
        :class="['tab', activeTimeTab === 'week' ? 'active' : '']" 
        @click="switchTimeTab('week')"
      >本周</text>
      <text 
        :class="['tab', activeTimeTab === 'month' ? 'active' : '']" 
        @click="switchTimeTab('month')"
      >本月</text>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-card">
      <view class="stats-title">{{ timeTabLabel }}统计</view>
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-value">{{ currentStats.feeding }}</text>
          <text class="stat-label">喂奶次数</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ currentStats.food }}</text>
          <text class="stat-label">辅食次数</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ currentStats.totalMilk }}</text>
          <text class="stat-label">总奶量(ml)</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ currentStats.avgMilk }}</text>
          <text class="stat-label">平均奶量(ml)</text>
        </view>
      </view>
    </view>

    <!-- 快速记录按钮 -->
    <view class="quick-actions">
      <button class="action-btn milk" @click="recordMilk">🍼 喂奶</button>
      <button class="action-btn food" @click="recordFood">🥣 辅食</button>
    </view>

    <!-- 历史记录 -->
    <view class="history-section">
      <view class="section-header">
        <text class="section-title">历史记录</text>
        <view class="filter-tabs">
          <text 
            :class="['tab', activeTypeTab === 'all' ? 'active' : '']" 
            @click="switchTypeTab('all')"
          >全部</text>
          <text 
            :class="['tab', activeTypeTab === 'milk' ? 'active' : '']" 
            @click="switchTypeTab('milk')"
          >喂奶</text>
          <text 
            :class="['tab', activeTypeTab === 'food' ? 'active' : '']" 
            @click="switchTypeTab('food')"
          >辅食</text>
        </view>
      </view>

      <scroll-view class="history-scroll" scroll-y>
        <view class="empty-tip" v-if="filteredRecords.length === 0">
          暂无记录
        </view>
        
        <view 
          v-for="record in filteredRecords" 
          :key="record.id" 
          class="record-item"
        >
          <view class="record-left">
            <text class="record-icon">{{ record.icon }}</text>
            <view class="record-info">
              <text class="record-type">{{ record.typeName }}</text>
              <text class="record-time">{{ record.time }}</text>
            </view>
          </view>
          <view class="record-right">
            <text class="record-amount">{{ record.amount }}</text>
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
import { formatTime } from '@/utils/device'

const activeTimeTab = ref('today')
const activeTypeTab = ref('all')

const timeTabLabel = computed(() => {
  const labels = { today: '今日', week: '本周', month: '本月' }
  return labels[activeTimeTab.value]
})

const currentStats = ref({
  feeding: 0,
  food: 0,
  totalMilk: 0,
  avgMilk: 0
})

const allRecords = ref<any[]>([])

const typeNames: Record<string, string> = {
  breast: '母乳',
  formula: '配方奶',
  bottle: '瓶喂母乳',
  food: '辅食'
}

const typeIcons: Record<string, string> = {
  breast: '🤱',
  formula: '🍼',
  bottle: '🍼',
  food: '🥣'
}

const filteredRecords = computed(() => {
  if (activeTypeTab.value === 'all') return allRecords.value
  if (activeTypeTab.value === 'milk') {
    return allRecords.value.filter(r => ['breast', 'formula', 'bottle'].includes(r.type))
  }
  return allRecords.value.filter(r => r.type === 'food')
})

const switchTimeTab = (tab: string) => {
  activeTimeTab.value = tab
  loadData()
}

const switchTypeTab = (tab: string) => {
  activeTypeTab.value = tab
}

const recordMilk = () => {
  uni.navigateTo({ url: '/pages/record/feeding?type=formula' })
}

const recordFood = () => {
  uni.navigateTo({ url: '/pages/record/food' })
}

const loadData = async () => {
  await Promise.all([
    loadStats(),
    loadHistory()
  ])
}

const loadStats = async () => {
  const now = new Date()
  let startTime: number
  let endTime: number
  
  if (activeTimeTab.value === 'today') {
    startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    endTime = startTime + 24 * 60 * 60 * 1000
  } else if (activeTimeTab.value === 'week') {
    const day = now.getDay() || 7
    startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1).getTime()
    endTime = startTime + 7 * 24 * 60 * 60 * 1000
  } else {
    startTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    endTime = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime()
  }

  // 喂奶统计
  const feeds = await db.selectSql(`
    SELECT COUNT(*) as count, SUM(amount) as total
    FROM feeds 
    WHERE timestamp >= ${startTime} AND timestamp < ${endTime}
  `)
  
  if (feeds && feeds.length > 0) {
    currentStats.value.feeding = feeds[0].count
    currentStats.value.totalMilk = feeds[0].total || 0
    currentStats.value.avgMilk = feeds[0].count > 0 
      ? Math.round((feeds[0].total || 0) / feeds[0].count)
      : 0
  }

  // 辅食统计
  const foods = await db.selectSql(`
    SELECT COUNT(*) as count FROM foods
    WHERE timestamp >= ${startTime} AND timestamp < ${endTime}
  `)
  
  if (foods && foods.length > 0) {
    currentStats.value.food = foods[0].count
  }
}

const loadHistory = async () => {
  const records: any[] = []
  
  // 喂养记录
  const feeds = await db.selectSql(`
    SELECT * FROM feeds ORDER BY timestamp DESC LIMIT 50
  `)
  
  if (feeds && feeds.length > 0) {
    feeds.forEach((r: any) => {
      let amount = ''
      if (r.type === 'breast') {
        const left = r.left_duration || 0
        const right = r.right_duration || 0
        const leftMin = Math.floor(left / 60)
        const rightMin = Math.floor(right / 60)
        amount = `左${leftMin}分钟 右${rightMin}分钟`
      } else {
        amount = `${r.amount || 0}ml`
      }
      
      records.push({
        id: `feed_${r.id}`,
        type: r.type,
        typeName: typeNames[r.type] || '喂奶',
        icon: typeIcons[r.type] || '🍼',
        time: formatTime(r.timestamp, 'MM-DD HH:mm'),
        amount,
        timestamp: r.timestamp
      })
    })
  }
  
  // 辅食记录
  const foods = await db.selectSql(`
    SELECT * FROM foods ORDER BY timestamp DESC LIMIT 50
  `)
  
  if (foods && foods.length > 0) {
    foods.forEach((r: any) => {
      records.push({
        id: `food_${r.id}`,
        type: 'food',
        typeName: '辅食',
        icon: '🥣',
        time: formatTime(r.timestamp, 'MM-DD HH:mm'),
        amount: r.food_type ? `${r.food_type} ${r.amount || 0}${r.unit || 'g'}` : '',
        timestamp: r.timestamp
      })
    })
  }
  
  allRecords.value = records.sort((a, b) => b.timestamp - a.timestamp)
}

onShow(async () => {
  try {
    await db.open()
    await loadData()
  } catch (error) {
    console.error('加载数据失败', error)
  }
})
</script>

<style scoped>
.feeding-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding: 15px;
  padding-bottom: 20px;
}

/* 时间维度切换 */
.time-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 15px;
  background: #FFFFFF;
  border-radius: 16px;
  padding: 8px;
}

.time-tabs .tab {
  flex: 1;
  text-align: center;
  font-size: 14px;
  color: #666666;
  padding: 8px 0;
  border-radius: 12px;
}

.time-tabs .tab.active {
  color: #FFFFFF;
  background: #FF9EC4;
  font-weight: bold;
}

/* 统计卡片 */
.stats-card {
  background: linear-gradient(135deg, #FF9EC4 0%, #FFB8D9 100%);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 4px 12px rgba(255, 158, 196, 0.3);
}

.stats-title {
  font-size: 16px;
  font-weight: bold;
  color: #FFFFFF;
  margin-bottom: 15px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #FFFFFF;
  display: block;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  display: block;
}

/* 快速记录 */
.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 15px;
}

.action-btn {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 15px;
  font-size: 16px;
  font-weight: bold;
  color: #333333;
  border: none;
  box-shadow: 0 2px 8px rgba(255, 158, 196, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.action-btn:active {
  transform: scale(0.98);
}

.action-btn.milk {
  color: #FF6BA8;
}

.action-btn.food {
  color: #F59E0B;
}

/* 历史记录 */
.history-section {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(255, 158, 196, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
}

.filter-tabs {
  display: flex;
  gap: 12px;
}

.tab {
  font-size: 13px;
  color: #999999;
  padding: 4px 10px;
  border-radius: 12px;
  background: #F5F5F5;
}

.tab.active {
  color: #FFFFFF;
  background: #FF9EC4;
}

.history-scroll {
  max-height: 500px;
}

.empty-tip {
  text-align: center;
  color: #BBBBBB;
  font-size: 14px;
  padding: 40px 20px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #F8F8F8;
}

.record-item:last-child {
  border-bottom: none;
}

.record-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.record-icon {
  font-size: 24px;
  margin-right: 10px;
}

.record-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.record-type {
  font-size: 14px;
  font-weight: bold;
  color: #333333;
}

.record-time {
  font-size: 12px;
  color: #999999;
}

.record-right {
  text-align: right;
}

.record-amount {
  font-size: 14px;
  color: #666666;
}
</style>

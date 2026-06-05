<template>
  <view class="growth-page">
    <!-- 最新数据卡片 -->
    <view class="latest-card">
      <view class="card-title">最新数据</view>
      <view class="data-grid">
        <view class="data-item">
          <text class="data-label">身高</text>
          <text class="data-value">{{ latestData.height || '--' }}</text>
          <text class="data-unit">cm</text>
          <text class="data-percentile" v-if="heightPercentile">P{{ heightPercentile }}</text>
        </view>
        <view class="data-item">
          <text class="data-label">体重</text>
          <text class="data-value">{{ latestData.weight || '--' }}</text>
          <text class="data-unit">kg</text>
          <text class="data-percentile" v-if="weightPercentile">P{{ weightPercentile }}</text>
        </view>
        <view class="data-item">
          <text class="data-label">头围</text>
          <text class="data-value">{{ latestData.headCircumference || '--' }}</text>
          <text class="data-unit">cm</text>
          <text class="data-percentile" v-if="headPercentile">P{{ headPercentile }}</text>
        </view>
      </view>
      <text class="data-date" v-if="latestData.date">测量日期: {{ latestData.date }}</text>
    </view>

    <!-- 成长曲线 -->
    <view class="curve-section">
      <view class="section-header">
        <text class="section-title">成长曲线</text>
        <view class="curve-tabs">
          <text 
            :class="['tab', activeCurve === 'height' ? 'active' : '']" 
            @click="switchCurve('height')"
          >身高</text>
          <text 
            :class="['tab', activeCurve === 'weight' ? 'active' : '']" 
            @click="switchCurve('weight')"
          >体重</text>
        </view>
      </view>
      
      <view class="chart-container">
        <view class="chart-placeholder" v-if="!hasData">
          <text class="placeholder-icon">📊</text>
          <text class="placeholder-text">暂无数据，记录宝宝成长吧~</text>
        </view>
        <qiun-ucharts 
          v-else
          type="line" 
          :opts="chartOpts" 
          :chartData="chartData" 
          :canvas2d="true"
        />
      </view>
    </view>

    <!-- 记录按钮 -->
    <button class="record-btn" @click="goToRecord">
      <text class="btn-icon">📏</text>
      <text class="btn-text">添加记录</text>
    </button>

    <!-- 历史记录 -->
    <view class="history-section">
      <view class="section-title">历史记录</view>
      <scroll-view class="history-scroll" scroll-y>
        <view class="empty-tip" v-if="historyRecords.length === 0">
          暂无记录
        </view>
        
        <view 
          v-for="record in historyRecords" 
          :key="record.id" 
          class="history-item"
        >
          <view class="history-date">
            <text class="date-text">{{ record.date }}</text>
            <text class="age-text">{{ record.age }}</text>
          </view>
          <view class="history-data">
            <text class="data-text" v-if="record.height">身高 {{ record.height }}cm</text>
            <text class="data-text" v-if="record.weight">体重 {{ record.weight }}kg</text>
            <text class="data-text" v-if="record.headCircumference">头围 {{ record.headCircumference }}cm</text>
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
import { calculatePercentile, getPercentileDesc } from '@/utils/growthCurve'

const latestData = ref({
  height: 0,
  weight: 0,
  headCircumference: 0,
  date: ''
})

const heightPercentile = ref('')
const weightPercentile = ref('')
const headPercentile = ref('')

const activeCurve = ref('height')
const historyRecords = ref<any[]>([])
const babyBirthday = ref('')
const babyGender = ref<'male' | 'female'>('male')

const hasData = computed(() => {
  return historyRecords.value.length > 0
})

// 图表配置
const chartOpts = ref({
  color: ['#FF9EC4', '#FFD4E5'],
  padding: [15, 15, 0, 5],
  enableScroll: false,
  legend: {
    show: false
  },
  xAxis: {
    disableGrid: true,
    axisLine: false,
    fontSize: 10,
    fontColor: '#999999'
  },
  yAxis: {
    gridType: 'dash',
    dashLength: 4,
    gridColor: '#F0F0F0',
    fontSize: 10,
    fontColor: '#999999'
  },
  extra: {
    line: {
      type: 'curve',
      width: 2,
      activeType: 'hollow'
    }
  }
})

const chartData = ref({
  categories: [] as string[],
  series: [{
    name: '身高',
    data: [] as number[]
  }]
})

const switchCurve = (type: string) => {
  activeCurve.value = type
  updateChart()
}

const goToRecord = () => {
  uni.navigateTo({ url: '/pages/record/growth' })
}

// 计算月龄
const calculateAge = (timestamp: number): string => {
  if (!babyBirthday.value) return ''
  const birthday = new Date(babyBirthday.value).getTime()
  const months = Math.floor((timestamp - birthday) / (1000 * 60 * 60 * 24 * 30))
  if (months < 1) return '新生儿'
  return `${months}个月`
}

// 计算月龄（数值）
const calculateMonths = (timestamp: number): number => {
  if (!babyBirthday.value) return 0
  const birthday = new Date(babyBirthday.value).getTime()
  return Math.floor((timestamp - birthday) / (1000 * 60 * 60 * 24 * 30))
}

// 加载最新数据
const loadLatestData = async () => {
  const result = await db.selectSql(`
    SELECT * FROM growth_records 
    ORDER BY timestamp DESC LIMIT 1
  `)
  
  if (result && result.length > 0) {
    latestData.value = {
      height: result[0].height || 0,
      weight: result[0].weight || 0,
      headCircumference: result[0].head_circumference || 0,
      date: formatTime(result[0].timestamp, 'YYYY-MM-DD')
    }
    
    // 计算百分位数
    const months = calculateMonths(result[0].timestamp)
    const gender = babyGender.value
    
    if (latestData.value.height > 0) {
      const p = calculatePercentile('height', latestData.value.height, months, gender)
      heightPercentile.value = `${p} (${getPercentileDesc(p)})`
    }
    
    if (latestData.value.weight > 0) {
      const p = calculatePercentile('weight', latestData.value.weight, months, gender)
      weightPercentile.value = `${p} (${getPercentileDesc(p)})`
    }
    
    if (latestData.value.headCircumference > 0) {
      const p = calculatePercentile('head', latestData.value.headCircumference, months, gender)
      headPercentile.value = `${p} (${getPercentileDesc(p)})`
    }
  }
}

// 加载历史记录
const loadHistory = async () => {
  const result = await db.selectSql(`
    SELECT * FROM growth_records 
    ORDER BY timestamp DESC
  `)
  
  if (result && result.length > 0) {
    historyRecords.value = result.map((r: any) => ({
      id: r.id,
      date: formatTime(r.timestamp, 'YYYY-MM-DD'),
      age: calculateAge(r.timestamp),
      height: r.height,
      weight: r.weight,
      headCircumference: r.head_circumference,
      timestamp: r.timestamp
    }))
  }
}

// 更新图表
const updateChart = () => {
  if (historyRecords.value.length === 0) return
  
  const sortedRecords = [...historyRecords.value].sort((a, b) => a.timestamp - b.timestamp)
  
  chartData.value = {
    categories: sortedRecords.map(r => formatTime(r.timestamp, 'MM-DD')),
    series: [{
      name: activeCurve.value === 'height' ? '身高' : '体重',
      data: sortedRecords.map(r => 
        activeCurve.value === 'height' ? r.height : r.weight
      ).filter(v => v > 0)
    }]
  }
}

onShow(async () => {
  try {
    await db.open()
    
    // 加载宝宝信息
    const babyResult = await db.selectSql('SELECT birthday, gender FROM baby_info LIMIT 1')
    if (babyResult && babyResult.length > 0) {
      babyBirthday.value = babyResult[0].birthday
      babyGender.value = babyResult[0].gender === 1 ? 'male' : 'female'
    }
    
    await Promise.all([
      loadLatestData(),
      loadHistory()
    ])
    
    updateChart()
  } catch (error) {
    console.error('加载数据失败', error)
  }
})
</script>

<style scoped>
.growth-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding: 15px;
  padding-bottom: 100px;
}

/* 最新数据卡片 */
.latest-card {
  background: linear-gradient(135deg, #FF9EC4 0%, #FFB8D9 100%);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 4px 12px rgba(255, 158, 196, 0.3);
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #FFFFFF;
  margin-bottom: 15px;
}

.data-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
}

.data-item {
  text-align: center;
  position: relative;
}

.data-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  display: block;
  margin-bottom: 6px;
}

.data-value {
  font-size: 24px;
  font-weight: bold;
  color: #FFFFFF;
  display: inline;
}

.data-unit {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  display: inline;
  margin-left: 2px;
}

.data-percentile {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 10px;
  color: #FFFFFF;
  background: rgba(255, 255, 255, 0.3);
  padding: 2px 6px;
  border-radius: 8px;
}

.data-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  display: block;
  text-align: center;
  margin-top: 10px;
}

/* 成长曲线 */
.curve-section {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 15px;
  margin-bottom: 15px;
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

.curve-tabs {
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

.chart-container {
  width: 100%;
  height: 200px;
  position: relative;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.placeholder-text {
  font-size: 14px;
  color: #BBBBBB;
}

/* 记录按钮 */
.record-btn {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #FF9EC4 0%, #FFB8D9 100%);
  border-radius: 25px;
  padding: 12px 30px;
  border: none;
  box-shadow: 0 4px 12px rgba(255, 158, 196, 0.4);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 10;
}

.btn-icon {
  font-size: 18px;
}

.btn-text {
  font-size: 16px;
  font-weight: bold;
  color: #FFFFFF;
}

/* 历史记录 */
.history-section {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(255, 158, 196, 0.08);
}

.history-scroll {
  max-height: 400px;
}

.empty-tip {
  text-align: center;
  color: #BBBBBB;
  font-size: 14px;
  padding: 40px 20px;
}

.history-item {
  padding: 12px 0;
  border-bottom: 1px solid #F8F8F8;
}

.history-item:last-child {
  border-bottom: none;
}

.history-date {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.date-text {
  font-size: 14px;
  font-weight: bold;
  color: #333333;
}

.age-text {
  font-size: 12px;
  color: #FF9EC4;
  background: #FFF0F5;
  padding: 2px 8px;
  border-radius: 8px;
}

.history-data {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.data-text {
  font-size: 13px;
  color: #666666;
}
</style>

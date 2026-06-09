<template>
  <view class="growth-page" :style="themeVars">
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
        <canvas 
          v-else
          canvas-id="growthChart"
          class="growth-chart-canvas"
          @click="onChartClick"
        ></canvas>
        
        <!-- WHO 标准参考线说明 -->
        <view class="chart-legend" v-if="hasData">
          <view class="legend-item">
            <view class="legend-line p3"></view>
            <text class="legend-text">P3（偏低参考线）</text>
          </view>
          <view class="legend-item">
            <view class="legend-line p50"></view>
            <text class="legend-text">P50（标准参考线）</text>
          </view>
          <view class="legend-item">
            <view class="legend-line p97"></view>
            <text class="legend-text">P97（偏高参考线）</text>
          </view>
        </view>
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

    <!-- 自定义 TabBar -->
    <CustomTabBar :current="1" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { db } from '@/utils/database'
import { formatTime } from '@/utils/device'
import { calculatePercentile, getPercentileDesc } from '@/utils/growthCurve'
import CustomTabBar from '@/components/CustomTabBar/CustomTabBar.vue'
import { useTheme } from '@/composables/useTheme'

const { themeVars, initTheme } = useTheme()

// WHO 标准数据（P3、P50、P97）用于绘制参考线
const WHO_STANDARDS = {
  height: {
    male: { p3: [46.3, 50.8, 54.4, 57.3, 59.7, 61.7, 63.3, 64.8, 66.2, 67.5, 68.7, 69.9, 71.0], p50: [49.9, 54.7, 58.4, 61.4, 63.9, 65.9, 67.6, 69.2, 70.6, 72.0, 73.3, 74.5, 75.7], p97: [53.7, 58.6, 62.4, 65.5, 68.0, 70.1, 71.9, 73.5, 75.0, 76.5, 77.9, 79.2, 80.5] },
    female: { p3: [45.6, 49.8, 53.0, 55.6, 57.8, 59.6, 61.2, 62.7, 64.0, 65.3, 66.5, 67.7, 68.9], p50: [49.1, 53.7, 57.1, 59.8, 62.1, 64.0, 65.7, 67.3, 68.7, 70.1, 71.3, 72.6, 73.8], p97: [52.9, 57.6, 61.1, 63.9, 66.2, 68.1, 69.8, 71.4, 72.9, 74.3, 75.6, 76.9, 78.1] }
  },
  weight: {
    male: { p3: [2.5, 3.4, 4.3, 5.0, 5.6, 6.0, 6.4, 6.7, 7.0, 7.2, 7.5, 7.7, 7.9], p50: [3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6], p97: [4.4, 5.8, 7.1, 8.0, 8.7, 9.3, 9.8, 10.3, 10.7, 11.0, 11.4, 11.7, 12.0] },
    female: { p3: [2.4, 3.2, 3.9, 4.5, 5.0, 5.4, 5.7, 6.0, 6.3, 6.5, 6.7, 6.9, 7.0], p50: [3.2, 4.2, 5.1, 5.8, 6.4, 6.9, 7.3, 7.6, 7.9, 8.2, 8.5, 8.7, 8.9], p97: [4.2, 5.5, 6.6, 7.5, 8.2, 8.8, 9.3, 9.8, 10.2, 10.6, 11.0, 11.3, 11.6] }
  }
}

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

const recentData = computed(() => {
  if (!hasData.value) return []
  
  const sortedRecords = [...historyRecords.value].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5)
  
  return sortedRecords.map(record => ({
    label: record.date,
    value: activeCurve.value === 'height' 
      ? `${record.height}cm` 
      : `${record.weight}kg`
  }))
})

const switchCurve = (type: string) => {
  activeCurve.value = type
  // 切换曲线后重新绘制图表
  nextTick(() => {
    if (hasData.value) {
      drawGrowthChart()
    }
  })
}

// 绘制成长曲线图表
const drawGrowthChart = () => {
  const ctx = uni.createCanvasContext('growthChart')
  const canvasWidth = 320
  const canvasHeight = 200
  
  // 清空画布
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  
  // 准备数据：取最近12个月的记录
  const sortedRecords = [...historyRecords.value]
    .filter(r => activeCurve.value === 'height' ? r.height > 0 : r.weight > 0)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(0, 12)
  
  if (sortedRecords.length === 0) return
  
  // 计算数据范围
  const values = sortedRecords.map(r => activeCurve.value === 'height' ? r.height : r.weight)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const months = sortedRecords.map(r => calculateMonths(r.timestamp))
  const minMonth = Math.min(...months)
  const maxMonth = Math.max(...months)
  
  // 绘制背景网格
  ctx.setStrokeStyle('#F0F0F0')
  ctx.setLineWidth(1)
  for (let i = 0; i <= 4; i++) {
    const y = 40 + i * 32
    ctx.beginPath()
    ctx.moveTo(40, y)
    ctx.lineTo(canvasWidth - 20, y)
    ctx.stroke()
  }
  
  // 绘制 WHO 标准参考线
  const gender = babyGender.value
  const standardData = WHO_STANDARDS[activeCurve.value][gender]
  const maxMonthIndex = Math.min(Math.floor(maxMonth), 12)
  
  // P3 线（红色）
  ctx.setStrokeStyle('#FFB3BA')
  ctx.setLineWidth(2)
  ctx.beginPath()
  for (let i = 0; i <= maxMonthIndex; i++) {
    const x = 40 + (i / 12) * (canvasWidth - 60)
    const y = canvasHeight - 20 - ((standardData.p3[i] - minVal) / (maxVal - minVal + 5)) * 160
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  
  // P50 线（绿色）
  ctx.setStrokeStyle('#BAE1FF')
  ctx.setLineWidth(2)
  ctx.beginPath()
  for (let i = 0; i <= maxMonthIndex; i++) {
    const x = 40 + (i / 12) * (canvasWidth - 60)
    const y = canvasHeight - 20 - ((standardData.p50[i] - minVal) / (maxVal - minVal + 5)) * 160
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  
  // P97 线（橙色）
  ctx.setStrokeStyle('#FFFFBA')
  ctx.setLineWidth(2)
  ctx.beginPath()
  for (let i = 0; i <= maxMonthIndex; i++) {
    const x = 40 + (i / 12) * (canvasWidth - 60)
    const y = canvasHeight - 20 - ((standardData.p97[i] - minVal) / (maxVal - minVal + 5)) * 160
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  
  // 绘制实际数据曲线（粉色）
  ctx.setStrokeStyle('#FF9EC4')
  ctx.setLineWidth(3)
  ctx.beginPath()
  sortedRecords.forEach((record, index) => {
    const month = calculateMonths(record.timestamp)
    const value = activeCurve.value === 'height' ? record.height : record.weight
    const x = 40 + ((month - minMonth) / (maxMonth - minMonth + 1)) * (canvasWidth - 60)
    const y = canvasHeight - 20 - ((value - minVal) / (maxVal - minVal + 5)) * 160
    if (index === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()
  
  // 绘制数据点
  ctx.setFillStyle('#FF6BA8')
  sortedRecords.forEach((record) => {
    const month = calculateMonths(record.timestamp)
    const value = activeCurve.value === 'height' ? record.height : record.weight
    const x = 40 + ((month - minMonth) / (maxMonth - minMonth + 1)) * (canvasWidth - 60)
    const y = canvasHeight - 20 - ((value - minVal) / (maxVal - minVal + 5)) * 160
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, 2 * Math.PI)
    ctx.fill()
  })
  
  // 绘制坐标轴标签
  ctx.setFillStyle('#666666')
  ctx.setFontSize(10)
  ctx.fillText('月龄', 10, canvasHeight - 10)
  ctx.fillText(activeCurve.value === 'height' ? 'cm' : 'kg', canvasWidth - 15, 20)
  
  ctx.draw()
}

// 点击图表查看详情
const onChartClick = () => {
  uni.showToast({ title: '点击数据点查看详情', icon: 'none' })
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
  try {
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
  } catch (error) {
    console.error('加载最新数据失败', error)
  }
}

// 加载历史记录
const loadHistory = async () => {
  try {
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
  } catch (error) {
    console.error('加载历史记录失败', error)
  }
}

// 加载宝宝信息
const loadBabyInfo = async () => {
  try {
    const babyResult = await db.selectSql('SELECT birthday, gender FROM baby_info LIMIT 1')
    if (babyResult && babyResult.length > 0) {
      babyBirthday.value = babyResult[0].birthday
      babyGender.value = babyResult[0].gender === 1 ? 'male' : 'female'
    }
  } catch (error) {
    console.error('加载宝宝信息失败', error)
    // 使用默认值
    babyBirthday.value = ''
    babyGender.value = 'male'
  }
}

onShow(async () => {
  initTheme()
  try {
    await db.open()
    await db.initTables()
    
    // 并行加载数据，捕获各自错误
    await Promise.allSettled([
      loadBabyInfo(),
      loadLatestData(),
      loadHistory()
    ])
    
    // 加载完成后绘制图表
    nextTick(() => {
      if (hasData.value) {
        drawGrowthChart()
      }
    })
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
.growth-page {
  min-height: 100vh;
  background: var(--background-color, #FDF6F0);
  padding: 30rpx;
  padding-bottom: 200rpx;
}

/* 最新数据卡片 */
.latest-card {
  background: var(--primary-gradient, linear-gradient(135deg, #E8857A 0%, #F2A89E 50%, #F7C4BA 100%));
  border-radius: 36rpx;
  padding: 40rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 12rpx 40rpx rgba(232, 133, 122, 0.25), 0 4rpx 12rpx rgba(232, 133, 122, 0.1);
  position: relative;
  overflow: hidden;
}

.latest-card::after {
  content: '';
  position: absolute;
  top: -30%;
  right: -15%;
  width: 240rpx;
  height: 240rpx;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, transparent 70%);
  border-radius: 50%;
}

.card-title {
  font-size: 32rpx;
  font-weight: 800;
  color: #FFFFFF;
  margin-bottom: 30rpx;
  letter-spacing: 0.5rpx;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.data-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.data-item {
  text-align: center;
  position: relative;
}

.data-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  display: block;
  margin-bottom: 12rpx;
}

.data-value {
  font-size: 48rpx;
  font-weight: bold;
  color: #FFFFFF;
  display: inline;
}

.data-unit {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  display: inline;
  margin-left: 4rpx;
}

.data-percentile {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 20rpx;
  color: #FFFFFF;
  background: rgba(255, 255, 255, 0.3);
  padding: 4rpx 12rpx;
  border-radius: 16rpx;
}

.data-date {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
  display: block;
  text-align: center;
  margin-top: 20rpx;
}

/* 成长曲线 */
.curve-section {
  background: var(--card-color, #FFFFFF);
  border-radius: var(--card-radius, 28rpx);
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: var(--card-shadow, 0 4rpx 24rpx rgba(232, 133, 122, 0.08));
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 800;
  color: var(--text-color, #3D3036);
  letter-spacing: 0.5rpx;
}

.curve-tabs {
  display: flex;
  gap: 24rpx;
}

.tab {
  font-size: 26rpx;
  color: var(--text-tertiary, #BDB2B7);
  padding: 10rpx 24rpx;
  border-radius: 24rpx;
  background: var(--divider-color, #F8F0EC);
  font-weight: 600;
  transition: all 0.2s;
}

.tab.active {
  color: #FFFFFF;
  background: var(--primary-color, #E8857A);
  box-shadow: 0 4rpx 12rpx rgba(232, 133, 122, 0.3);
}

.chart-container {
  width: 100%;
  position: relative;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400rpx;
}

.placeholder-icon {
  font-size: 96rpx;
  margin-bottom: 20rpx;
}

.placeholder-text {
  font-size: 28rpx;
  color: #BBBBBB;
}

/* 成长曲线 Canvas */
.growth-chart-canvas {
  width: 640rpx;
  height: 400rpx;
  margin: 20rpx auto;
  background: #FFFFFF;
  border-radius: 20rpx;
  border: 1px solid #F5F5F5;
}

/* 图表图例 */
.chart-legend {
  display: flex;
  justify-content: center;
  gap: 24rpx;
  margin-top: 20rpx;
  padding: 20rpx;
  background: var(--divider-color, #F8F0EC);
  border-radius: 20rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.legend-line {
  width: 32rpx;
  height: 4rpx;
  border-radius: 2rpx;
}

.legend-line.p3 {
  background: #FFB3BA;
}

.legend-line.p50 {
  background: #BAE1FF;
}

.legend-line.p97 {
  background: #FFFFBA;
}

.legend-text {
  font-size: 24rpx;
  color: var(--text-secondary, #8A7E84);
}

/* 记录按钮 */
.record-btn {
  position: fixed;
  bottom: 160rpx;
  left: 50%;
  transform: translateX(-50%);
  background: var(--primary-gradient, linear-gradient(135deg, #E8857A 0%, #F2A89E 50%, #F7C4BA 100%));
  border-radius: 50rpx;
  padding: 0 50rpx;
  border: none;
  box-shadow: 0 12rpx 32rpx rgba(232, 133, 122, 0.35);
  display: flex;
  align-items: center;
  gap: 16rpx;
  z-index: 10;
  transition: transform 0.2s, box-shadow 0.2s;
}

.record-btn:active {
  transform: translateX(-50%) scale(0.95);
  box-shadow: 0 6rpx 16rpx rgba(232, 133, 122, 0.25);
}

.btn-icon {
  font-size: 28rpx;
}

.btn-text {
  font-size: 22rpx;
  font-weight: bold;
  color: #FFFFFF;
}

/* 历史记录 */
.history-section {
  background: var(--card-color, #FFFFFF);
  border-radius: var(--card-radius, 28rpx);
  padding: 30rpx;
  box-shadow: var(--card-shadow, 0 4rpx 24rpx rgba(232, 133, 122, 0.08));
}

.history-scroll {
  max-height: 800rpx;
}

.empty-tip {
  text-align: center;
  color: var(--text-tertiary, #BDB2B7);
  font-size: 28rpx;
  padding: 80rpx 40rpx;
  line-height: 1.8;
}

.history-item {
  padding: 24rpx 0;
  border-bottom: 1px solid var(--divider-color, #F8F0EC);
}

.history-item:last-child {
  border-bottom: none;
}

.history-date {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.date-text {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--text-color, #3D3036);
}

.age-text {
  font-size: 24rpx;
  color: var(--primary-color, #E8857A);
  background: rgba(232, 133, 122, 0.1);
  padding: 6rpx 18rpx;
  border-radius: 16rpx;
  font-weight: 600;
}

.history-data {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
}

.data-text {
  font-size: 26rpx;
  color: var(--text-secondary, #8A7E84);
}
</style>

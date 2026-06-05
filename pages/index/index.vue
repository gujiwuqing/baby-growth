<template>
  <view class="index-page">
    <!-- 筛选栏 -->
    <view class="filter-bar">
      <view class="filter-type" @click="showTypeFilter = !showTypeFilter">
        <text>{{ currentTypeLabel }}</text>
        <text class="filter-arrow">{{ showTypeFilter ? '▲' : '▼' }}</text>
      </view>
      <view class="filter-date" @click="resetDate" v-if="filterDate">
        {{ filterDate }} ✕
      </view>
      <picker mode="date" :value="filterDate" @change="onDateChange" v-else>
        <view class="filter-date">筛选日期</view>
      </picker>
    </view>

    <!-- 类型下拉 -->
    <view class="type-dropdown" v-if="showTypeFilter">
      <view
        class="dropdown-item"
        v-for="opt in typeOptions"
        :key="opt.value"
        :class="{ active: filterType === opt.value }"
        @click="selectType(opt.value)"
      >{{ opt.label }}</view>
    </view>

    <!-- 时间轴（按天分组） -->
    <scroll-view scroll-y class="timeline-scroll">
      <view v-if="groupedRecords.length === 0" class="empty-tip">暂无记录，点击下方快捷记录开始吧～</view>

      <view class="day-group" v-for="group in groupedRecords" :key="group.dateKey">
        <view class="day-header">
          <text class="day-label">{{ group.dayLabel }}</text>
          <text class="day-sub">{{ group.babyDay }}</text>
        </view>

        <view class="day-card">
          <!-- 当日汇总 -->
          <view class="day-summary">{{ group.summary }}</view>

          <!-- 记录项 -->
          <view class="timeline">
            <view class="timeline-item" v-for="record in group.items" :key="record.id">
              <view class="timeline-time">{{ record.time }}</view>
              <view class="timeline-dot" :style="{ background: record.color }"></view>
              <view class="timeline-content">
                <view class="timeline-row">
                  <text class="timeline-icon">{{ record.icon }}</text>
                  <text class="timeline-type">{{ record.label }}</text>
                  <text class="timeline-detail">{{ record.detail }}</text>
                </view>
                <view class="timeline-ago" v-if="record.ago">{{ record.ago }}</view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 快捷记录 -->
    <QuickRecord @record="handleRecord" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import QuickRecord from '@/components/QuickRecord/QuickRecord.vue'
import { db } from '@/utils/database'
import { formatTime } from '@/utils/device'

interface RecordItem {
  id: string
  type: string
  label: string
  icon: string
  color: string
  detail: string
  ago: string
  time: string
  timestamp: number
}

const babyInfo = ref({
  name: '',
  avatar: '',
  birthday: ''
})

// ===== 筛选 =====
const showTypeFilter = ref(false)
const filterType = ref('all')
const filterDate = ref('')

const typeOptions = [
  { value: 'all', label: '全部' },
  { value: 'breast', label: '母乳' },
  { value: 'formula', label: '配方奶' },
  { value: 'bottle', label: '瓶喂母乳' },
  { value: 'diaper', label: '换尿布' },
  { value: 'sleep', label: '睡眠' },
  { value: 'food', label: '辅食' },
  { value: 'supplement', label: '营养补剂' },
  { value: 'growth', label: '成长指标' }
]

const currentTypeLabel = computed(() => {
  const opt = typeOptions.find((o) => o.value === filterType.value)
  return opt ? opt.label : '全部'
})

const selectType = (value: string) => {
  filterType.value = value
  showTypeFilter.value = false
}

const onDateChange = (e: any) => {
  filterDate.value = e.detail.value
}

const resetDate = () => {
  filterDate.value = ''
}

// ===== 元信息 =====
const typeMeta: Record<string, { label: string; icon: string; color: string }> = {
  breast: { label: '母乳', icon: '🤱', color: '#FF6BA8' },
  formula: { label: '配方奶', icon: '🍼', color: '#FFA94D' },
  bottle: { label: '瓶喂母乳', icon: '🍼', color: '#FF8FB8' },
  diaper: { label: '换尿布', icon: '👶', color: '#FFC93C' },
  sleep: { label: '睡眠', icon: '😴', color: '#A78BFA' },
  food: { label: '辅食', icon: '🥣', color: '#F59E0B' },
  supplement: { label: '营养补剂', icon: '💊', color: '#34D399' },
  growth: { label: '成长指标', icon: '📏', color: '#3B82F6' }
}

const allRecords = ref<RecordItem[]>([])

const formatAgo = (timestamp: number): string => {
  const diff = Date.now() - timestamp
  if (diff < 0) return ''
  const minutes = Math.floor(diff / (1000 * 60))
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时${minutes % 60}分钟前`
  return ''
}

const formatMin = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  return `${m}min`
}

// 母乳详情：右14分钟 08:24-08:38
const buildBreastDetail = (r: any): string => {
  const left = r.left_duration || 0
  const right = r.right_duration || 0
  const parts: string[] = []
  if (left > 0) parts.push(`左${formatMin(left)}`)
  if (right > 0) parts.push(`右${formatMin(right)}`)
  let detail = parts.join(' ') || `${formatMin(left + right)}`
  if (r.start_time && r.end_time) {
    detail += `\n${formatTime(r.start_time, 'HH:mm')}-${formatTime(r.end_time, 'HH:mm')}`
  }
  return detail
}

const loadRecords = async () => {
  const records: RecordItem[] = []

  // 喂养记录
  const feeds = await db.selectSql('SELECT * FROM feeds ORDER BY timestamp DESC')
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
        ago: formatAgo(r.timestamp),
        time: formatTime(r.timestamp, 'HH:mm'),
        timestamp: r.timestamp
      })
    })
  }

  // 换尿布
  const diapers = await db.selectSql('SELECT * FROM diapers ORDER BY timestamp DESC')
  if (diapers && diapers.length > 0) {
    const diaperLabels: Record<string, string> = { pee: '小便', poo: '大便', both: '混合' }
    diapers.forEach((r: any) => {
      const meta = typeMeta.diaper
      let detail = diaperLabels[r.type] || ''
      
      // 显示红屁屁状态
      if (r.has_rash === 1) {
        detail += '，🔴有红屁屁'
      }
      
      // 显示大便颜色和形状
      if ((r.type === 'poo' || r.type === 'both') && r.poo_color) {
        detail += `，${r.poo_color}`
      }
      if ((r.type === 'poo' || r.type === 'both') && r.poo_shape) {
        detail += `，${r.poo_shape}`
      }
      
      if (r.note) detail += ` ${r.note}`
      records.push({
        id: `diaper_${r.id}`,
        type: 'diaper',
        label: meta.label,
        icon: meta.icon,
        color: meta.color,
        detail,
        ago: formatAgo(r.timestamp),
        time: formatTime(r.timestamp, 'HH:mm'),
        timestamp: r.timestamp
      })
    })
  }

  // 睡眠
  const sleeps = await db.selectSql('SELECT * FROM sleeps ORDER BY start_time DESC')
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
        ago: formatAgo(r.start_time),
        time: formatTime(r.start_time, 'HH:mm'),
        timestamp: r.start_time
      })
    })
  }

  // 营养补剂
  const supplements = await db.selectSql('SELECT * FROM supplements ORDER BY timestamp DESC')
  if (supplements && supplements.length > 0) {
    const supLabels: Record<string, string> = { vitamin_ad: 'AD滴剂', probiotics: '益生菌', other: '其他' }
    supplements.forEach((r: any) => {
      const meta = typeMeta.supplement
      let detail = supLabels[r.supplement_type] || ''
      if (r.dosage) detail += `，${r.dosage}`
      records.push({
        id: `sup_${r.id}`,
        type: 'supplement',
        label: meta.label,
        icon: meta.icon,
        color: meta.color,
        detail,
        ago: formatAgo(r.timestamp),
        time: formatTime(r.timestamp, 'HH:mm'),
        timestamp: r.timestamp
      })
    })
  }

  // 辅食记录
  const foods = await db.selectSql('SELECT * FROM foods ORDER BY timestamp DESC')
  if (foods && foods.length > 0) {
    foods.forEach((r: any) => {
      const meta = typeMeta.food
      let detail = r.food_type || ''
      if (r.amount) detail += `，${r.amount}${r.unit || 'g'}`
      records.push({
        id: `food_${r.id}`,
        type: 'food',
        label: meta.label,
        icon: meta.icon,
        color: meta.color,
        detail,
        ago: formatAgo(r.timestamp),
        time: formatTime(r.timestamp, 'HH:mm'),
        timestamp: r.timestamp
      })
    })
  }

  // 成长指标
  const growthRecords = await db.selectSql('SELECT * FROM growth_records ORDER BY timestamp DESC')
  if (growthRecords && growthRecords.length > 0) {
    growthRecords.forEach((r: any) => {
      const meta = typeMeta.growth
      const parts: string[] = []
      if (r.height) parts.push(`身高${r.height}cm`)
      if (r.weight) parts.push(`体重${r.weight}kg`)
      if (r.head_circumference) parts.push(`头围${r.head_circumference}cm`)
      records.push({
        id: `growth_${r.id}`,
        type: 'growth',
        label: meta.label,
        icon: meta.icon,
        color: meta.color,
        detail: parts.join('，'),
        ago: formatAgo(r.timestamp),
        time: formatTime(r.timestamp, 'HH:mm'),
        timestamp: r.timestamp
      })
    })
  }

  allRecords.value = records.sort((a, b) => b.timestamp - a.timestamp)
}

// ===== 筛选 + 分组 =====
const dayLabelOf = (timestamp: number): string => {
  const d = new Date(timestamp)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const dayDiff = Math.round((today - target) / (1000 * 60 * 60 * 24))
  if (dayDiff === 0) return '今天'
  if (dayDiff === 1) return '昨天'
  return formatTime(timestamp, 'MM月DD日')
}

const babyDayOf = (timestamp: number): string => {
  if (!babyInfo.value.birthday) return ''
  const birthday = new Date(babyInfo.value.birthday).getTime()
  const days = Math.floor((timestamp - birthday) / (1000 * 60 * 60 * 24)) + 1
  return days > 0 ? `第${days}天` : ''
}

const buildSummary = (items: RecordItem[]): string => {
  const counter: Record<string, number> = {}
  items.forEach((it) => {
    counter[it.type] = (counter[it.type] || 0) + 1
  })
  const parts: string[] = []
  typeOptions.forEach((opt) => {
    if (opt.value !== 'all' && counter[opt.value]) {
      parts.push(`${opt.label} ${counter[opt.value]}次`)
    }
  })
  return parts.join('  ·  ')
}

const groupedRecords = computed(() => {
  let list = allRecords.value

  if (filterType.value !== 'all') {
    list = list.filter((r) => r.type === filterType.value)
  }

  if (filterDate.value) {
    list = list.filter((r) => formatTime(r.timestamp, 'YYYY-MM-DD') === filterDate.value)
  }

  const map: Record<string, RecordItem[]> = {}
  list.forEach((r) => {
    const key = formatTime(r.timestamp, 'YYYY-MM-DD')
    if (!map[key]) map[key] = []
    map[key].push(r)
  })

  return Object.keys(map)
    .sort((a, b) => (a < b ? 1 : -1))
    .map((dateKey) => {
      const items = map[dateKey]
      return {
        dateKey,
        dayLabel: dayLabelOf(items[0].timestamp),
        babyDay: babyDayOf(items[0].timestamp),
        summary: buildSummary(items),
        items
      }
    })
})

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

    const babyResult = await db.selectSql('SELECT * FROM baby_info LIMIT 1')
    if (babyResult && babyResult.length > 0) {
      babyInfo.value = babyResult[0]
    }

    await loadRecords()
  } catch (error) {
    console.error('加载数据失败', error)
  }
})
</script>

<style scoped>
.index-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding-bottom: 160px;
}

/* ===== 筛选栏 ===== */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #FFF5F7;
}

.filter-type {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
  color: #333333;
}

.filter-arrow {
  font-size: 10px;
  margin-left: 6px;
  color: #999999;
}

.filter-date {
  font-size: 13px;
  color: #FF6BA8;
  background: #FFEEF4;
  border-radius: 16px;
  padding: 6px 12px;
}

.type-dropdown {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 20px 16px;
  background: #FFFFFF;
  border-radius: 0 0 16px 16px;
  margin: 0 12px;
}

.dropdown-item {
  padding: 6px 14px;
  font-size: 13px;
  color: #666666;
  background: #F7F7F7;
  border-radius: 16px;
}

.dropdown-item.active {
  background: #FF9EC4;
  color: #FFFFFF;
}

/* ===== 时间轴 ===== */
.timeline-scroll {
  height: auto;
}

.empty-tip {
  text-align: center;
  color: #BBBBBB;
  font-size: 14px;
  padding: 60px 20px;
}

.day-group {
  margin: 15px 12px 0;
}

.day-header {
  display: flex;
  align-items: baseline;
  margin-bottom: 8px;
  padding-left: 4px;
}

.day-label {
  font-size: 17px;
  font-weight: bold;
  color: #333333;
}

.day-sub {
  font-size: 13px;
  color: #999999;
  margin-left: 8px;
}

.day-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 16px;
}

.day-summary {
  font-size: 13px;
  color: #FF6BA8;
  padding-bottom: 12px;
  margin-bottom: 4px;
  border-bottom: 1px solid #F5F5F5;
  line-height: 1.6;
}

.timeline {
  position: relative;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  position: relative;
  padding: 10px 0;
}

.timeline-time {
  width: 48px;
  font-size: 13px;
  color: #999999;
  padding-top: 2px;
  flex-shrink: 0;
}

.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin: 6px 12px 0 4px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.timeline-content {
  flex: 1;
}

.timeline-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.timeline-icon {
  font-size: 18px;
  margin-right: 6px;
}

.timeline-type {
  font-size: 15px;
  font-weight: bold;
  color: #333333;
  margin-right: 10px;
}

.timeline-detail {
  font-size: 14px;
  color: #666666;
  white-space: pre-line;
}

.timeline-ago {
  display: inline-block;
  margin-top: 6px;
  font-size: 12px;
  color: #FF6BA8;
  background: #FFEEF4;
  border-radius: 12px;
  padding: 2px 10px;
}
</style>

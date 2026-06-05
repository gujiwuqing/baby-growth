<template>
  <view class="calendar">
    <!-- 月份导航 -->
    <view class="calendar-header">
      <text class="nav-btn" @click="prevMonth">‹</text>
      <text class="calendar-title">{{ titleText }}</text>
      <text class="nav-btn" @click="nextMonth">›</text>
    </view>

    <!-- 星期表头 -->
    <view class="weekday-row">
      <text class="weekday" v-for="w in weekdays" :key="w">{{ w }}</text>
    </view>

    <!-- 日期网格 -->
    <view class="days-grid">
      <view
        v-for="(cell, index) in calendarCells"
        :key="index"
        :class="[
          'day-cell',
          cell.inMonth ? '' : 'other-month',
          cell.isToday ? 'today' : '',
          isSelected(cell) ? 'selected' : '',
          hasData(cell) ? 'has-data' : ''
        ]"
        @click="onSelectDay(cell)"
      >
        <text class="day-number">{{ cell.day }}</text>
        <!-- 微型数据展示 -->
        <view class="day-mini" v-if="cell.inMonth && hasData(cell)">
          <text class="mini-feed">🍼{{ getCellData(cell).feedCount }}</text>
          <text class="mini-milk" v-if="getCellData(cell).milkTotal > 0">{{ getCellData(cell).milkTotal }}ml</text>
          <text class="mini-food" v-if="getCellData(cell).hasFood">🥣</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface CalendarCell {
  day: number
  inMonth: boolean
  isToday: boolean
  timestamp: number
}

export interface DayData {
  feedCount: number
  milkTotal: number
  hasFood: boolean
}

const props = defineProps<{
  monthTimestamp: number
  selectedTimestamp: number
  dayData: Record<number, DayData>
}>()

const emit = defineEmits<{
  (event: 'change-month', monthTimestamp: number): void
  (event: 'select-day', dayTimestamp: number): void
}>()

const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const current = ref(new Date(props.monthTimestamp))

watch(() => props.monthTimestamp, (val) => {
  current.value = new Date(val)
})

const titleText = computed(() => {
  return `${current.value.getFullYear()}年${current.value.getMonth() + 1}月`
})

const startOfDay = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

const todayStart = startOfDay(new Date())

const calendarCells = computed<CalendarCell[]>(() => {
  const year = current.value.getFullYear()
  const month = current.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const startWeekday = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: CalendarCell[] = []

  // 上月补白
  const prevMonthDays = new Date(year, month, 0).getDate()
  for (let i = startWeekday - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    const date = new Date(year, month - 1, day)
    cells.push({ day, inMonth: false, isToday: false, timestamp: startOfDay(date) })
  }

  // 本月
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const ts = startOfDay(date)
    cells.push({ day, inMonth: true, isToday: ts === todayStart, timestamp: ts })
  }

  // 下月补白（最少补到能展示完整行，最多 42 格）
  const totalRows = Math.ceil(cells.length / 7)
  const targetCells = Math.max(totalRows, Math.ceil((startWeekday + daysInMonth) / 7)) * 7
  let nextDay = 1
  while (cells.length < targetCells) {
    const date = new Date(year, month + 1, nextDay)
    cells.push({ day: nextDay, inMonth: false, isToday: false, timestamp: startOfDay(date) })
    nextDay++
  }

  return cells
})

const emptyData: DayData = { feedCount: 0, milkTotal: 0, hasFood: false }

const getCellData = (cell: CalendarCell): DayData => {
  return props.dayData[cell.timestamp] || emptyData
}

const hasData = (cell: CalendarCell): boolean => {
  const data = getCellData(cell)
  return data.feedCount > 0 || data.hasFood
}

const isSelected = (cell: CalendarCell): boolean => {
  return cell.inMonth && cell.timestamp === props.selectedTimestamp
}

const prevMonth = () => {
  const d = new Date(current.value.getFullYear(), current.value.getMonth() - 1, 1)
  current.value = d
  emit('change-month', d.getTime())
}

const nextMonth = () => {
  const d = new Date(current.value.getFullYear(), current.value.getMonth() + 1, 1)
  current.value = d
  emit('change-month', d.getTime())
}

const onSelectDay = (cell: CalendarCell) => {
  if (!cell.inMonth) return
  emit('select-day', cell.timestamp)
}
</script>

<style scoped>
.calendar {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 24rpx;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.calendar-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333333;
}

.nav-btn {
  width: 80rpx;
  height: 80rpx;
  line-height: 72rpx;
  text-align: center;
  font-size: 52rpx;
  color: #FF6BA8;
  border-radius: 50%;
}

.nav-btn:active {
  background: #FFF0F5;
}

.weekday-row {
  display: flex;
  margin-bottom: 8rpx;
  padding-bottom: 12rpx;
  border-bottom: 1px solid #FFF0F5;
}

.weekday {
  flex: 1;
  text-align: center;
  font-size: 24rpx;
  color: #AAAAAA;
  font-weight: 500;
}

.days-grid {
  display: flex;
  flex-wrap: wrap;
}

.day-cell {
  width: 14.28%;
  min-height: 116rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8rpx 0 4rpx;
  position: relative;
  border-radius: 16rpx;
}

.day-cell:active {
  background: #FFF5F8;
}

.day-number {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
}

.day-cell.other-month .day-number {
  color: #D5D5D5;
}

.day-cell.other-month:active {
  background: transparent;
}

.day-cell.today {
  background: #FFF0F5;
}

.day-cell.today .day-number {
  color: #FF6BA8;
  font-weight: bold;
}

.day-cell.selected {
  background: #FF6BA8;
}

.day-cell.selected .day-number {
  color: #FFFFFF;
  font-weight: bold;
}

/* 微型数据 */
.day-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 1px;
  gap: 1px;
}

.mini-feed {
  font-size: 18rpx;
  color: #FF9EC4;
  line-height: 1.2;
}

.mini-milk {
  font-size: 16rpx;
  color: #BBBBBB;
  line-height: 1.2;
}

.mini-food {
  font-size: 18rpx;
  line-height: 1.2;
}

.day-cell.selected .mini-feed,
.day-cell.selected .mini-milk {
  color: rgba(255, 255, 255, 0.85);
}

.day-cell.has-data {
  background: #FFFAFE;
}

.day-cell.has-data.today {
  background: #FFF0F5;
}

.day-cell.has-data.selected {
  background: #FF6BA8;
}
</style>

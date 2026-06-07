/**
 * 公共记录类型定义
 * 统一各页面中重复定义的接口，确保一致性
 */

/** 单条记录展示项 */
export interface RecordItem {
  id: string
  type: string
  label: string
  icon: string
  color: string
  detail: string
  time: string
  timestamp: number
}

/** 月历日格数据 */
export interface DayData {
  feedCount: number
  milkTotal: number
  sleepCount: number
  diaperCount: number
  foodCount: number
  supplementCount: number
  growthCount: number
  recordCount: number
}

/** 范围汇总统计 */
export interface RangeStats {
  recordCount: number
  feedCount: number
  totalMilk: number
  avgMilk: number
  sleepCount: number
  totalSleepHours: number
  avgSleepHours: number
  diaperCount: number
  foodCount: number
  supplementCount: number
  growthCount: number
  recordDays: number
}

/** 空的 DayData 常量，避免重复创建 */
export const EMPTY_DAY_DATA: DayData = {
  feedCount: 0,
  milkTotal: 0,
  sleepCount: 0,
  diaperCount: 0,
  foodCount: 0,
  supplementCount: 0,
  growthCount: 0,
  recordCount: 0
}

/** 空的 RangeStats 常量 */
export const EMPTY_RANGE_STATS: RangeStats = {
  recordCount: 0,
  feedCount: 0,
  totalMilk: 0,
  avgMilk: 0,
  sleepCount: 0,
  totalSleepHours: 0,
  avgSleepHours: 0,
  diaperCount: 0,
  foodCount: 0,
  supplementCount: 0,
  growthCount: 0,
  recordDays: 0
}

/** 喂养子类型集合 */
export const FEEDING_TYPES = ['breast', 'formula', 'bottle'] as const

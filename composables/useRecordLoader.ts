/**
 * 公共记录加载 composable
 * 统一封装各页面重复的记录查询、映射、统计逻辑
 */
import { db } from '@/utils/database'
import { formatTime } from '@/utils/device'
import { RECORD_TYPE_META } from '@/utils/recordTypes'
import type { RecordItem, DayData, RangeStats } from '@/types/record'
import { EMPTY_DAY_DATA, EMPTY_RANGE_STATS, FEEDING_TYPES } from '@/types/record'

const DAY_MS = 24 * 60 * 60 * 1000

const startOfDay = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

const formatMin = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  return `${m}min`
}

const buildBreastDetail = (r: any): string => {
  const left = r.left_duration || 0
  const right = r.right_duration || 0
  const parts: string[] = []
  if (left > 0) parts.push(`左${formatMin(left)}`)
  if (right > 0) parts.push(`右${formatMin(right)}`)
  let detail = parts.join(' ') || `${formatMin(left + right)}`
  if (r.start_time && r.end_time) {
    detail += ` ${formatTime(r.start_time, 'HH:mm')}-${formatTime(r.end_time, 'HH:mm')}`
  }
  return detail
}

const diaperLabels: Record<string, string> = { pee: '小便', poo: '大便', both: '混合' }
const supplementLabels: Record<string, string> = {
  vitamin_ad: 'AD滴剂',
  probiotics: '益生菌',
  other: '其他'
}

/**
 * 加载指定时间范围内的所有记录，返回标准 RecordItem[]
 * @param startTime 起始时间戳（含）
 * @param endTime 结束时间戳（不含）
 * @param types 可选，按记录类型过滤（如 ['breast','formula','bottle'] 只看喂养）
 */
export async function loadRecordsByRange(
  startTime: number,
  endTime: number,
  types?: string[]
): Promise<RecordItem[]> {
  const records: RecordItem[] = []
  const typeMeta = RECORD_TYPE_META

  const shouldLoad = (recordTypes: string[]): boolean => {
    if (!types || types.length === 0) return true
    return recordTypes.some(t => types.includes(t))
  }

  // 喂养记录
  if (shouldLoad(['breast', 'formula', 'bottle'])) {
    const feeds = await db.selectSql(`
      SELECT * FROM feeds WHERE timestamp >= ${startTime} AND timestamp < ${endTime}
      ORDER BY timestamp DESC
    `)
    if (feeds && feeds.length > 0) {
      feeds.forEach((r: any) => {
        if (types && types.length > 0 && !types.includes(r.type)) return
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
          time: formatTime(r.timestamp, 'HH:mm'),
          timestamp: r.timestamp
        })
      })
    }
  }

  // 换尿布
  if (shouldLoad(['diaper'])) {
    const diapers = await db.selectSql(`
      SELECT * FROM diapers WHERE timestamp >= ${startTime} AND timestamp < ${endTime}
      ORDER BY timestamp DESC
    `)
    if (diapers && diapers.length > 0) {
      diapers.forEach((r: any) => {
        const meta = typeMeta.diaper
        let detail = diaperLabels[r.type] || ''
        if (r.has_rash === 1) detail += '，有红屁屁'
        if (r.note) detail += ` ${r.note}`
        records.push({
          id: `diaper_${r.id}`,
          type: 'diaper',
          label: meta.label,
          icon: meta.icon,
          color: meta.color,
          detail,
          time: formatTime(r.timestamp, 'HH:mm'),
          timestamp: r.timestamp
        })
      })
    }
  }

  // 睡眠
  if (shouldLoad(['sleep'])) {
    const sleeps = await db.selectSql(`
      SELECT * FROM sleeps WHERE start_time >= ${startTime} AND start_time < ${endTime}
      ORDER BY start_time DESC
    `)
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
          time: formatTime(r.start_time, 'HH:mm'),
          timestamp: r.start_time
        })
      })
    }
  }

  // 辅食
  if (shouldLoad(['food'])) {
    const foods = await db.selectSql(`
      SELECT * FROM foods WHERE timestamp >= ${startTime} AND timestamp < ${endTime}
      ORDER BY timestamp DESC
    `)
    if (foods && foods.length > 0) {
      foods.forEach((r: any) => {
        const meta = typeMeta.food
        let detail = r.food_type || ''
        if (r.amount) detail += ` ${r.amount}g`
        if (r.note) detail += ` ${r.note}`
        records.push({
          id: `food_${r.id}`,
          type: 'food',
          label: meta.label,
          icon: meta.icon,
          color: meta.color,
          detail,
          time: formatTime(r.timestamp, 'HH:mm'),
          timestamp: r.timestamp
        })
      })
    }
  }

  // 营养补剂
  if (shouldLoad(['supplement'])) {
    const supplements = await db.selectSql(`
      SELECT * FROM supplements WHERE timestamp >= ${startTime} AND timestamp < ${endTime}
      ORDER BY timestamp DESC
    `)
    if (supplements && supplements.length > 0) {
      supplements.forEach((r: any) => {
        const meta = typeMeta.supplement
        let detail = supplementLabels[r.supplement_type] || r.supplement_type
        if (r.dosage) detail += ` ${r.dosage}`
        if (r.note) detail += ` ${r.note}`
        records.push({
          id: `supplement_${r.id}`,
          type: 'supplement',
          label: meta.label,
          icon: meta.icon,
          color: meta.color,
          detail,
          time: formatTime(r.timestamp, 'HH:mm'),
          timestamp: r.timestamp
        })
      })
    }
  }

  // 成长记录
  if (shouldLoad(['growth'])) {
    const growthRecords = await db.selectSql(`
      SELECT * FROM growth_records WHERE timestamp >= ${startTime} AND timestamp < ${endTime}
      ORDER BY timestamp DESC
    `)
    if (growthRecords && growthRecords.length > 0) {
      growthRecords.forEach((r: any) => {
        const meta = typeMeta.growth
        const parts: string[] = []
        if (r.height) parts.push(`身高${r.height}cm`)
        if (r.weight) parts.push(`体重${r.weight}kg`)
        if (r.head_circumference) parts.push(`头围${r.head_circumference}cm`)
        const detail = parts.join(' ')
        records.push({
          id: `growth_${r.id}`,
          type: 'growth',
          label: meta.label,
          icon: meta.icon,
          color: meta.color,
          detail,
          time: formatTime(r.timestamp, 'HH:mm'),
          timestamp: r.timestamp
        })
      })
    }
  }

  return records.sort((a, b) => b.timestamp - a.timestamp)
}

/**
 * 加载指定月份的日历格数据
 * @param monthTimestamp 月份第一天的时间戳
 */
export async function loadDayDataByMonth(monthTimestamp: number): Promise<Record<number, DayData>> {
  const d = new Date(monthTimestamp)
  const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime()
  const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime()

  const data: Record<number, DayData> = {}

  const ensureDay = (ts: number): DayData => {
    const dayStart = startOfDay(new Date(ts))
    if (!data[dayStart]) {
      data[dayStart] = { ...EMPTY_DAY_DATA }
    }
    return data[dayStart]
  }

  // 喂养记录
  const feeds = await db.selectSql(`
    SELECT timestamp, amount, type FROM feeds
    WHERE timestamp >= ${monthStart} AND timestamp < ${monthEnd}
  `)
  if (feeds && feeds.length > 0) {
    feeds.forEach((r: any) => {
      const day = ensureDay(r.timestamp)
      day.feedCount++
      day.recordCount++
      if (r.type !== 'breast') {
        day.milkTotal += (r.amount || 0)
      }
    })
  }

  // 辅食
  const foods = await db.selectSql(`
    SELECT timestamp FROM foods
    WHERE timestamp >= ${monthStart} AND timestamp < ${monthEnd}
  `)
  if (foods && foods.length > 0) {
    foods.forEach((r: any) => {
      const day = ensureDay(r.timestamp)
      day.foodCount++
      day.recordCount++
    })
  }

  // 营养补剂
  const supplements = await db.selectSql(`
    SELECT timestamp FROM supplements
    WHERE timestamp >= ${monthStart} AND timestamp < ${monthEnd}
  `)
  if (supplements && supplements.length > 0) {
    supplements.forEach((r: any) => {
      const day = ensureDay(r.timestamp)
      day.supplementCount++
      day.recordCount++
    })
  }

  // 换尿布
  const diapers = await db.selectSql(`
    SELECT timestamp FROM diapers
    WHERE timestamp >= ${monthStart} AND timestamp < ${monthEnd}
  `)
  if (diapers && diapers.length > 0) {
    diapers.forEach((r: any) => {
      const day = ensureDay(r.timestamp)
      day.diaperCount++
      day.recordCount++
    })
  }

  // 睡眠
  const sleeps = await db.selectSql(`
    SELECT start_time FROM sleeps
    WHERE start_time >= ${monthStart} AND start_time < ${monthEnd}
  `)
  if (sleeps && sleeps.length > 0) {
    sleeps.forEach((r: any) => {
      const day = ensureDay(r.start_time)
      day.sleepCount++
      day.recordCount++
    })
  }

  // 成长记录
  const growthRecords = await db.selectSql(`
    SELECT timestamp FROM growth_records
    WHERE timestamp >= ${monthStart} AND timestamp < ${monthEnd}
  `)
  if (growthRecords && growthRecords.length > 0) {
    growthRecords.forEach((r: any) => {
      const day = ensureDay(r.timestamp)
      day.growthCount++
      day.recordCount++
    })
  }

  return data
}

/**
 * 根据 RecordItem[] 计算范围汇总统计
 */
export function computeRangeStats(records: RecordItem[], days: number = 1): RangeStats {
  const stats: RangeStats = { ...EMPTY_RANGE_STATS }

  const daySet = new Set<string>()

  records.forEach(r => {
    const dateKey = formatTime(r.timestamp, 'YYYY-MM-DD')
    daySet.add(dateKey)
    stats.recordCount++

    if (FEEDING_TYPES.includes(r.type as any)) {
      stats.feedCount++
      const mlMatch = r.detail.match(/(\d+)ml/)
      if (mlMatch) stats.totalMilk += parseInt(mlMatch[1])
    }

    if (r.type === 'sleep') {
      stats.sleepCount++
      const hMatch = r.detail.match(/(\d+)小时(\d+)分钟/)
      if (hMatch) {
        stats.totalSleepHours += parseInt(hMatch[1]) + parseInt(hMatch[2]) / 60
      } else {
        const mMatch = r.detail.match(/(\d+)分钟/)
        if (mMatch) stats.totalSleepHours += parseInt(mMatch[1]) / 60
      }
    }

    if (r.type === 'diaper') stats.diaperCount++
    if (r.type === 'food') stats.foodCount++
    if (r.type === 'supplement') stats.supplementCount++
    if (r.type === 'growth') stats.growthCount++
  })

  stats.recordDays = daySet.size
  stats.totalSleepHours = Math.round(stats.totalSleepHours * 10) / 10

  const effectiveDays = Math.max(days, 1)
  stats.avgMilk = stats.feedCount > 0 ? Math.round(stats.totalMilk / stats.feedCount) : 0
  stats.avgSleepHours = stats.sleepCount > 0
    ? Math.round(stats.totalSleepHours / effectiveDays * 10) / 10
    : 0

  return stats
}

/**
 * 获取一天的起止时间戳
 */
export function getDayRange(date: Date): { startTime: number; endTime: number } {
  const startTime = startOfDay(date)
  return { startTime, endTime: startTime + DAY_MS }
}

/**
 * 获取一周的起止时间戳（周一 ~ 周日）
 */
export function getWeekRange(date: Date): { startTime: number; endTime: number; label: string } {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayOfWeek = d.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(d)
  monday.setDate(d.getDate() + mondayOffset)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 7)

  const label = `${formatTime(monday.getTime(), 'MM.DD')} - ${formatTime(sunday.getTime() - DAY_MS, 'MM.DD')}`

  return {
    startTime: startOfDay(monday),
    endTime: startOfDay(sunday),
    label
  }
}

/**
 * 获取一个月的起止时间戳
 */
export function getMonthRange(date: Date): { startTime: number; endTime: number; label: string } {
  const startTime = new Date(date.getFullYear(), date.getMonth(), 1).getTime()
  const endTime = new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime()
  const label = `${date.getFullYear()}年${date.getMonth() + 1}月`
  return { startTime, endTime, label }
}

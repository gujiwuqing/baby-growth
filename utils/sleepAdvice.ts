/**
 * 美国儿科学会（AAP）睡眠时长建议
 * 根据宝宝月龄提供睡眠时长参考范围
 */

export interface SleepAdvice {
  minHours: number
  maxHours: number
  recommendation: string
  warning?: string
}

// AAP 睡眠标准（小时/天）
const SLEEP_STANDARDS: Record<number, SleepAdvice> = {
  0: { minHours: 14, maxHours: 17, recommendation: '新生儿每天需要 14-17 小时睡眠', warning: '睡眠过少可能影响生长发育' },
  1: { minHours: 12, maxHours: 16, recommendation: '1月龄宝宝每天需要 12-16 小时睡眠', warning: '注意观察宝宝精神状态' },
  2: { minHours: 12, maxHours: 16, recommendation: '2月龄宝宝每天需要 12-16 小时睡眠', warning: '夜间睡眠逐渐增加' },
  3: { minHours: 12, maxHours: 15, recommendation: '3月龄宝宝每天需要 12-15 小时睡眠' },
  4: { minHours: 12, maxHours: 15, recommendation: '4月龄宝宝每天需要 12-15 小时睡眠' },
  5: { minHours: 11, maxHours: 15, recommendation: '5月龄宝宝每天需要 11-15 小时睡眠' },
  6: { minHours: 10, maxHours: 14, recommendation: '6月龄宝宝每天需要 10-14 小时睡眠', warning: '开始建立规律作息' },
  7: { minHours: 10, maxHours: 14, recommendation: '7月龄宝宝每天需要 10-14 小时睡眠' },
  8: { minHours: 10, maxHours: 14, recommendation: '8月龄宝宝每天需要 10-14 小时睡眠' },
  9: { minHours: 10, maxHours: 14, recommendation: '9月龄宝宝每天需要 10-14 小时睡眠' },
  10: { minHours: 10, maxHours: 13, recommendation: '10月龄宝宝每天需要 10-13 小时睡眠' },
  11: { minHours: 10, maxHours: 13, recommendation: '11月龄宝宝每天需要 10-13 小时睡眠' },
  12: { minHours: 9, maxHours: 12, recommendation: '1岁宝宝每天需要 9-12 小时睡眠', warning: '白天午睡 1-2 次' },
  18: { minHours: 11, maxHours: 14, recommendation: '1.5岁宝宝每天需要 11-14 小时睡眠' },
  24: { minHours: 11, maxHours: 14, recommendation: '2岁宝宝每天需要 11-14 小时睡眠', warning: '白天午睡 1 次' },
  30: { minHours: 10, maxHours: 13, recommendation: '2.5岁宝宝每天需要 10-13 小时睡眠' },
  36: { minHours: 10, maxHours: 13, recommendation: '3岁宝宝每天需要 10-13 小时睡眠' }
}

/**
 * 根据月龄获取睡眠建议
 */
export function getSleepAdvice(months: number): SleepAdvice {
  // 如果月龄超出范围，使用最近的边界值
  const keys = Object.keys(SLEEP_STANDARDS).map(Number).sort((a, b) => a - b)
  
  if (months <= keys[0]) return SLEEP_STANDARDS[keys[0]]
  if (months >= keys[keys.length - 1]) return SLEEP_STANDARDS[keys[keys.length - 1]]
  
  // 找到最近的月龄标准
  let nearestKey = keys[0]
  for (const key of keys) {
    if (Math.abs(key - months) <= Math.abs(nearestKey - months)) {
      nearestKey = key
    }
  }
  
  return SLEEP_STANDARDS[nearestKey]
}

/**
 * 评估睡眠时长是否达标
 */
export function evaluateSleep(hours: number, months: number): {
  status: 'insufficient' | 'normal' | 'excessive'
  message: string
  advice: SleepAdvice
} {
  const advice = getSleepAdvice(months)
  
  if (hours < advice.minHours) {
    return {
      status: 'insufficient',
      message: `睡眠不足（低于${advice.minHours}小时）`,
      advice
    }
  }
  
  if (hours > advice.maxHours) {
    return {
      status: 'excessive',
      message: `睡眠过多（超过${advice.maxHours}小时）`,
      advice
    }
  }
  
  return {
    status: 'normal',
    message: `睡眠正常（${advice.minHours}-${advice.maxHours}小时）`,
    advice
  }
}
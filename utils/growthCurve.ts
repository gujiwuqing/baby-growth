/**
 * WHO 儿童生长标准数据
 * 用于计算身高、体重、头围的百分位数
 * 数据来源：WHO Child Growth Standards
 */

// 男童身高标准（cm）- 0-36个月
const BOY_HEIGHT: Record<number, { p3: number; p50: number; p97: number }> = {
  0: { p3: 46.3, p50: 49.9, p97: 53.7 },
  1: { p3: 50.8, p50: 54.7, p97: 58.6 },
  2: { p3: 54.4, p50: 58.4, p97: 62.4 },
  3: { p3: 57.3, p50: 61.4, p97: 65.5 },
  4: { p3: 59.7, p50: 63.9, p97: 68.0 },
  5: { p3: 61.7, p50: 65.9, p97: 70.1 },
  6: { p3: 63.3, p50: 67.6, p97: 71.9 },
  7: { p3: 64.8, p50: 69.2, p97: 73.5 },
  8: { p3: 66.2, p50: 70.6, p97: 75.0 },
  9: { p3: 67.5, p50: 72.0, p97: 76.5 },
  10: { p3: 68.7, p50: 73.3, p97: 77.9 },
  11: { p3: 69.9, p50: 74.5, p97: 79.2 },
  12: { p3: 71.0, p50: 75.7, p97: 80.5 },
  15: { p3: 74.1, p50: 79.0, p97: 84.0 },
  18: { p3: 76.9, p50: 82.0, p97: 87.3 },
  21: { p3: 79.4, p50: 84.7, p97: 90.3 },
  24: { p3: 81.7, p50: 87.1, p97: 92.9 },
  30: { p3: 85.7, p50: 91.3, p97: 97.5 },
  36: { p3: 89.1, p50: 95.1, p97: 101.6 }
}

// 女童身高标准（cm）- 0-36个月
const GIRL_HEIGHT: Record<number, { p3: number; p50: number; p97: number }> = {
  0: { p3: 45.6, p50: 49.1, p97: 52.9 },
  1: { p3: 49.8, p50: 53.7, p97: 57.6 },
  2: { p3: 53.0, p50: 57.1, p97: 61.1 },
  3: { p3: 55.6, p50: 59.8, p97: 63.9 },
  4: { p3: 57.8, p50: 62.1, p97: 66.2 },
  5: { p3: 59.6, p50: 64.0, p97: 68.1 },
  6: { p3: 61.2, p50: 65.7, p97: 69.8 },
  7: { p3: 62.7, p50: 67.3, p97: 71.4 },
  8: { p3: 64.0, p50: 68.7, p97: 72.9 },
  9: { p3: 65.3, p50: 70.1, p97: 74.3 },
  10: { p3: 66.5, p50: 71.3, p97: 75.6 },
  11: { p3: 67.7, p50: 72.6, p97: 76.9 },
  12: { p3: 68.9, p50: 73.8, p97: 78.1 },
  15: { p3: 72.0, p50: 77.1, p97: 81.6 },
  18: { p3: 74.9, p50: 80.2, p97: 85.0 },
  21: { p3: 77.5, p50: 83.0, p97: 88.1 },
  24: { p3: 80.0, p50: 85.6, p97: 91.0 },
  30: { p3: 84.1, p50: 90.0, p97: 95.8 },
  36: { p3: 87.6, p50: 93.7, p97: 99.8 }
}

// 男童体重标准（kg）- 0-36个月
const BOY_WEIGHT: Record<number, { p3: number; p50: number; p97: number }> = {
  0: { p3: 2.5, p50: 3.3, p97: 4.4 },
  1: { p3: 3.4, p50: 4.5, p97: 5.8 },
  2: { p3: 4.3, p50: 5.6, p97: 7.1 },
  3: { p3: 5.0, p50: 6.4, p97: 8.0 },
  4: { p3: 5.6, p50: 7.0, p97: 8.7 },
  5: { p3: 6.0, p50: 7.5, p97: 9.3 },
  6: { p3: 6.4, p50: 7.9, p97: 9.8 },
  7: { p3: 6.7, p50: 8.3, p97: 10.3 },
  8: { p3: 7.0, p50: 8.6, p97: 10.7 },
  9: { p3: 7.2, p50: 8.9, p97: 11.0 },
  10: { p3: 7.5, p50: 9.2, p97: 11.4 },
  11: { p3: 7.7, p50: 9.4, p97: 11.7 },
  12: { p3: 7.9, p50: 9.6, p97: 12.0 },
  15: { p3: 8.3, p50: 10.2, p97: 12.8 },
  18: { p3: 8.8, p50: 10.7, p97: 13.5 },
  21: { p3: 9.2, p50: 11.2, p97: 14.2 },
  24: { p3: 9.7, p50: 11.7, p97: 14.9 },
  30: { p3: 10.5, p50: 12.7, p97: 16.2 },
  36: { p3: 11.3, p50: 13.7, p97: 17.5 }
}

// 女童体重标准（kg）- 0-36个月
const GIRL_WEIGHT: Record<number, { p3: number; p50: number; p97: number }> = {
  0: { p3: 2.4, p50: 3.2, p97: 4.2 },
  1: { p3: 3.2, p50: 4.2, p97: 5.5 },
  2: { p3: 3.9, p50: 5.1, p97: 6.6 },
  3: { p3: 4.5, p50: 5.8, p97: 7.5 },
  4: { p3: 5.0, p50: 6.4, p97: 8.2 },
  5: { p3: 5.4, p50: 6.9, p97: 8.8 },
  6: { p3: 5.7, p50: 7.3, p97: 9.3 },
  7: { p3: 6.0, p50: 7.6, p97: 9.8 },
  8: { p3: 6.3, p50: 7.9, p97: 10.2 },
  9: { p3: 6.5, p50: 8.2, p97: 10.6 },
  10: { p3: 6.7, p50: 8.5, p97: 11.0 },
  11: { p3: 6.9, p50: 8.7, p97: 11.3 },
  12: { p3: 7.0, p50: 8.9, p97: 11.6 },
  15: { p3: 7.6, p50: 9.6, p97: 12.5 },
  18: { p3: 8.1, p50: 10.2, p97: 13.3 },
  21: { p3: 8.6, p50: 10.8, p97: 14.1 },
  24: { p3: 9.0, p50: 11.3, p97: 14.8 },
  30: { p3: 9.8, p50: 12.4, p97: 16.2 },
  36: { p3: 10.6, p50: 13.4, p97: 17.6 }
}

// 男童头围标准（cm）- 0-36个月
const BOY_HEAD: Record<number, { p3: number; p50: number; p97: number }> = {
  0: { p3: 32.1, p50: 34.5, p97: 37.0 },
  3: { p3: 38.1, p50: 40.5, p97: 43.0 },
  6: { p3: 41.0, p50: 43.3, p97: 45.7 },
  9: { p3: 42.9, p50: 45.2, p97: 47.6 },
  12: { p3: 44.2, p50: 46.5, p97: 48.9 },
  18: { p3: 45.7, p50: 48.0, p97: 50.4 },
  24: { p3: 46.9, p50: 49.2, p97: 51.6 },
  36: { p3: 48.1, p50: 50.5, p97: 52.9 }
}

// 女童头围标准（cm）- 0-36个月
const GIRL_HEAD: Record<number, { p3: number; p50: number; p97: number }> = {
  0: { p3: 31.5, p50: 33.9, p97: 36.2 },
  3: { p3: 37.1, p50: 39.5, p97: 41.9 },
  6: { p3: 39.9, p50: 42.2, p97: 44.5 },
  9: { p3: 41.7, p50: 44.0, p97: 46.3 },
  12: { p3: 43.0, p50: 45.3, p97: 47.6 },
  18: { p3: 44.5, p50: 46.8, p97: 49.1 },
  24: { p3: 45.6, p50: 47.9, p97: 50.2 },
  36: { p3: 46.8, p50: 49.1, p97: 51.5 }
}

/**
 * 线性插值计算
 */
function linearInterpolate(
  x: number,
  x0: number,
  x1: number,
  y0: number,
  y1: number
): number {
  return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0)
}

/**
 * 根据月龄获取最近的标准数据键
 */
function getNearestMonth(months: number, dataKeys: number[]): number {
  if (months <= dataKeys[0]) return dataKeys[0]
  if (months >= dataKeys[dataKeys.length - 1]) return dataKeys[dataKeys.length - 1]
  
  for (let i = 0; i < dataKeys.length - 1; i++) {
    if (months >= dataKeys[i] && months <= dataKeys[i + 1]) {
      // 返回较近的那个
      const diff1 = months - dataKeys[i]
      const diff2 = dataKeys[i + 1] - months
      return diff1 < diff2 ? dataKeys[i] : dataKeys[i + 1]
    }
  }
  
  return dataKeys[dataKeys.length - 1]
}

/**
 * 计算百分位数
 * @param type 'height' | 'weight' | 'head'
 * @param value 测量值
 * @param months 月龄
 * @param gender 性别 'male' | 'female'
 * @returns 百分位数（3-97）
 */
export function calculatePercentile(
  type: 'height' | 'weight' | 'head',
  value: number,
  months: number,
  gender: 'male' | 'female'
): number {
  let data: Record<number, { p3: number; p50: number; p97: number }>
  
  if (type === 'height') {
    data = gender === 'male' ? BOY_HEIGHT : GIRL_HEIGHT
  } else if (type === 'weight') {
    data = gender === 'male' ? BOY_WEIGHT : GIRL_WEIGHT
  } else {
    data = gender === 'male' ? BOY_HEAD : GIRL_HEAD
  }
  
  const keys = Object.keys(data).map(Number).sort((a, b) => a - b)
  
  // 如果月龄超出范围，使用最近的边界值
  if (months <= keys[0]) {
    const standard = data[keys[0]]
    return estimatePercentile(value, standard.p3, standard.p50, standard.p97)
  }
  
  if (months >= keys[keys.length - 1]) {
    const standard = data[keys[keys.length - 1]]
    return estimatePercentile(value, standard.p3, standard.p50, standard.p97)
  }
  
  // 找到插值区间
  for (let i = 0; i < keys.length - 1; i++) {
    if (months >= keys[i] && months <= keys[i + 1]) {
      const std1 = data[keys[i]]
      const std2 = data[keys[i + 1]]
      
      // 插值计算P3, P50, P97
      const p3 = linearInterpolate(months, keys[i], keys[i + 1], std1.p3, std2.p3)
      const p50 = linearInterpolate(months, keys[i], keys[i + 1], std1.p50, std2.p50)
      const p97 = linearInterpolate(months, keys[i], keys[i + 1], std1.p97, std2.p97)
      
      return estimatePercentile(value, p3, p50, p97)
    }
  }
  
  return 50
}

/**
 * 根据测量值和标准值估算百分位数
 */
function estimatePercentile(
  value: number,
  p3: number,
  p50: number,
  p97: number
): number {
  if (value <= p3) return 3
  if (value >= p97) return 97
  if (value === p50) return 50
  
  // 简化计算：假设正态分布
  // P3到P50对应3到50百分位
  // P50到P97对应50到97百分位
  if (value < p50) {
    return Math.round(3 + ((value - p3) / (p50 - p3)) * 47)
  } else {
    return Math.round(50 + ((value - p50) / (p97 - p50)) * 47)
  }
}

/**
 * 获取百分位数描述
 */
export function getPercentileDesc(percentile: number): string {
  if (percentile < 10) return '偏低'
  if (percentile > 90) return '偏高'
  if (percentile >= 45 && percentile <= 55) return '中等'
  return '正常'
}

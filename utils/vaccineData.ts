/**
 * 中国儿童免疫规划疫苗数据
 * 数据来源：国家免疫规划疫苗儿童免疫程序及说明（2021年版）
 */

export interface VaccineData {
  name: string
  type: 'free' | 'paid' // 免费/自费
  ageMonths: number // 推荐接种月龄
  dose: string // 剂次描述
  description: string // 疫苗说明
  diseases: string // 预防疾病
  injectionSite: string[] // 接种部位选项
  manufacturer?: string // 生产厂家（可选）
}

/**
 * 免疫规划疫苗（一类疫苗，免费）
 */
export const FREE_VACCINES: VaccineData[] = [
  {
    name: '乙肝疫苗',
    type: 'free',
    ageMonths: 0,
    dose: '第1剂',
    description: '出生后24小时内接种',
    diseases: '乙型病毒性肝炎',
    injectionSite: ['上臂外侧三角肌', '大腿前外侧中部']
  },
  {
    name: '卡介苗',
    type: 'free',
    ageMonths: 0,
    dose: '第1剂',
    description: '出生后24小时内接种',
    diseases: '结核病',
    injectionSite: ['上臂外侧三角肌中部附着处', '皮内注射']
  },
  {
    name: '乙肝疫苗',
    type: 'free',
    ageMonths: 1,
    dose: '第2剂',
    description: '1月龄接种',
    diseases: '乙型病毒性肝炎',
    injectionSite: ['上臂外侧三角肌', '大腿前外侧中部']
  },
  {
    name: '脊灰灭活疫苗(IPV)',
    type: 'free',
    ageMonths: 2,
    dose: '第1剂',
    description: '2月龄接种',
    diseases: '脊髓灰质炎',
    injectionSite: ['大腿前外侧中部', '上臂外侧三角肌']
  },
  {
    name: '百白破疫苗',
    type: 'free',
    ageMonths: 3,
    dose: '第1剂',
    description: '3月龄接种',
    diseases: '白喉、破伤风、百日咳',
    injectionSite: ['上臂外侧三角肌', '大腿前外侧中部']
  },
  {
    name: '脊灰减毒活疫苗(OPV)',
    type: 'free',
    ageMonths: 3,
    dose: '第2剂',
    description: '3月龄接种，口服',
    diseases: '脊髓灰质炎',
    injectionSite: ['口服']
  },
  {
    name: '脊灰灭活疫苗(IPV)',
    type: 'free',
    ageMonths: 4,
    dose: '第3剂',
    description: '4月龄接种',
    diseases: '脊髓灰质炎',
    injectionSite: ['大腿前外侧中部', '上臂外侧三角肌']
  },
  {
    name: '百白破疫苗',
    type: 'free',
    ageMonths: 4,
    dose: '第2剂',
    description: '4月龄接种',
    diseases: '白喉、破伤风、百日咳',
    injectionSite: ['上臂外侧三角肌', '大腿前外侧中部']
  },
  {
    name: '脊灰减毒活疫苗(OPV)',
    type: 'free',
    ageMonths: 4,
    dose: '第3剂',
    description: '4月龄接种，口服',
    diseases: '脊髓灰质炎',
    injectionSite: ['口服']
  },
  {
    name: '百白破疫苗',
    type: 'free',
    ageMonths: 5,
    dose: '第3剂',
    description: '5月龄接种',
    diseases: '白喉、破伤风、百日咳',
    injectionSite: ['上臂外侧三角肌', '大腿前外侧中部']
  },
  {
    name: '乙肝疫苗',
    type: 'free',
    ageMonths: 6,
    dose: '第3剂',
    description: '6月龄接种',
    diseases: '乙型病毒性肝炎',
    injectionSite: ['上臂外侧三角肌', '大腿前外侧中部']
  },
  {
    name: '流脑A群疫苗',
    type: 'free',
    ageMonths: 6,
    dose: '第1剂',
    description: '6月龄接种',
    diseases: 'A群脑膜炎球菌引起的流行性脑脊髓膜炎',
    injectionSite: ['上臂外侧三角肌附着处']
  },
  {
    name: '麻腮风疫苗',
    type: 'free',
    ageMonths: 8,
    dose: '第1剂',
    description: '8月龄接种',
    diseases: '麻疹、流行性腮腺炎、风疹',
    injectionSite: ['上臂外侧三角肌下缘附着处']
  },
  {
    name: '乙脑减毒活疫苗',
    type: 'free',
    ageMonths: 8,
    dose: '第1剂',
    description: '8月龄接种',
    diseases: '流行性乙型脑炎',
    injectionSite: ['上臂外侧三角肌下缘附着处']
  },
  {
    name: '流脑A群疫苗',
    type: 'free',
    ageMonths: 9,
    dose: '第2剂',
    description: '9月龄接种，间隔3个月',
    diseases: 'A群脑膜炎球菌引起的流行性脑脊髓膜炎',
    injectionSite: ['上臂外侧三角肌附着处']
  },
  {
    name: '乙脑减毒活疫苗',
    type: 'free',
    ageMonths: 24,
    dose: '第2剂',
    description: '2周岁接种',
    diseases: '流行性乙型脑炎',
    injectionSite: ['上臂外侧三角肌下缘附着处']
  },
  {
    name: '甲肝减毒活疫苗',
    type: 'free',
    ageMonths: 18,
    dose: '第1剂',
    description: '18月龄接种',
    diseases: '甲型病毒性肝炎',
    injectionSite: ['上臂外侧三角肌附着处']
  },
  {
    name: '百白破疫苗',
    type: 'free',
    ageMonths: 18,
    dose: '第4剂',
    description: '18月龄接种',
    diseases: '白喉、破伤风、百日咳',
    injectionSite: ['上臂外侧三角肌', '大腿前外侧中部']
  },
  {
    name: '麻腮风疫苗',
    type: 'free',
    ageMonths: 18,
    dose: '第2剂',
    description: '18月龄接种',
    diseases: '麻疹、流行性腮腺炎、风疹',
    injectionSite: ['上臂外侧三角肌下缘附着处']
  },
  {
    name: '甲肝灭活疫苗',
    type: 'free',
    ageMonths: 18,
    dose: '第1剂',
    description: '18月龄接种（部分地区使用）',
    diseases: '甲型病毒性肝炎',
    injectionSite: ['上臂外侧三角肌附着处']
  },
  {
    name: '甲肝灭活疫苗',
    type: 'free',
    ageMonths: 24,
    dose: '第2剂',
    description: '24月龄接种，间隔6个月',
    diseases: '甲型病毒性肝炎',
    injectionSite: ['上臂外侧三角肌附着处']
  },
  {
    name: '流脑A+C群疫苗',
    type: 'free',
    ageMonths: 36,
    dose: '第1剂',
    description: '3周岁接种',
    diseases: 'A群和C群脑膜炎球菌引起的流行性脑脊髓膜炎',
    injectionSite: ['上臂外侧三角肌附着处']
  },
  {
    name: '脊灰减毒活疫苗(OPV)',
    type: 'free',
    ageMonths: 48,
    dose: '第4剂',
    description: '4周岁接种，口服',
    diseases: '脊髓灰质炎',
    injectionSite: ['口服']
  },
  {
    name: '流脑A+C群疫苗',
    type: 'free',
    ageMonths: 72,
    dose: '第2剂',
    description: '6周岁接种，间隔3年',
    diseases: 'A群和C群脑膜炎球菌引起的流行性脑脊髓膜炎',
    injectionSite: ['上臂外侧三角肌附着处']
  },
  {
    name: '白破疫苗',
    type: 'free',
    ageMonths: 72,
    dose: '第1剂',
    description: '6周岁接种',
    diseases: '白喉、破伤风',
    injectionSite: ['上臂外侧三角肌']
  }
]

/**
 * 非免疫规划疫苗（二类疫苗，自费）
 */
export const PAID_VACCINES: VaccineData[] = [
  {
    name: '13价肺炎疫苗',
    type: 'paid',
    ageMonths: 2,
    dose: '第1剂',
    description: '2、4、6月龄各接种1剂，12-15月龄加强1剂',
    diseases: '肺炎球菌性疾病',
    injectionSite: ['大腿前外侧中部', '上臂外侧三角肌']
  },
  {
    name: '五联疫苗',
    type: 'paid',
    ageMonths: 2,
    dose: '第1剂',
    description: '可替代百白破+脊灰+Hib，2、3、4、18月龄各1剂',
    diseases: '白喉、破伤风、百日咳、脊髓灰质炎、b型流感嗜血杆菌',
    injectionSite: ['大腿前外侧中部', '上臂外侧三角肌']
  },
  {
    name: 'Hib疫苗',
    type: 'paid',
    ageMonths: 2,
    dose: '第1剂',
    description: '2、4、6月龄各接种1剂，18月龄加强1剂',
    diseases: 'b型流感嗜血杆菌引起的侵袭性疾病',
    injectionSite: ['大腿前外侧中部', '上臂外侧三角肌']
  },
  {
    name: '轮状病毒疫苗',
    type: 'paid',
    ageMonths: 2,
    dose: '第1剂',
    description: '口服，2、4、6月龄各接种1剂',
    diseases: '轮状病毒引起的腹泻',
    injectionSite: ['口服']
  },
  {
    name: '流感疫苗',
    type: 'paid',
    ageMonths: 6,
    dose: '每年1剂',
    description: '每年接种，6月龄以上',
    diseases: '流行性感冒',
    injectionSite: ['上臂外侧三角肌', '大腿前外侧中部']
  },
  {
    name: 'EV71手足口疫苗',
    type: 'paid',
    ageMonths: 6,
    dose: '第1剂',
    description: '6月龄-5岁，接种2剂，间隔1个月',
    diseases: '肠道病毒71型引起的手足口病',
    injectionSite: ['上臂外侧三角肌', '大腿前外侧中部']
  },
  {
    name: '水痘疫苗',
    type: 'paid',
    ageMonths: 12,
    dose: '第1剂',
    description: '12月龄接种，4周岁加强1剂',
    diseases: '水痘',
    injectionSite: ['上臂外侧三角肌下缘附着处']
  },
  {
    name: '23价肺炎疫苗',
    type: 'paid',
    ageMonths: 24,
    dose: '第1剂',
    description: '2周岁以上高危人群接种',
    diseases: '肺炎球菌性疾病',
    injectionSite: ['上臂外侧三角肌']
  },
  {
    name: '流感嗜血杆菌疫苗',
    type: 'paid',
    ageMonths: 2,
    dose: '第1剂',
    description: '2、4、6月龄各接种1剂',
    diseases: '流感嗜血杆菌引起的侵袭性疾病',
    injectionSite: ['大腿前外侧中部', '上臂外侧三角肌']
  },
  {
    name: '狂犬病疫苗',
    type: 'paid',
    ageMonths: -1,
    dose: '暴露后接种',
    description: '被动物咬伤后接种，按暴露后程序接种',
    diseases: '狂犬病',
    injectionSite: ['上臂外侧三角肌']
  }
]

/**
 * 根据月龄获取推荐疫苗列表
 */
export function getVaccinesByAge(months: number): VaccineData[] {
  const vaccines = [...FREE_VACCINES, ...PAID_VACCINES]
  // ageMonths < 0 为暴露后接种等特殊疫苗，不按常规月龄推荐
  return vaccines.filter(v => v.ageMonths >= 0 && v.ageMonths === months)
}

/**
 * 获取疫苗完整名称（包含剂次）
 */
export function getVaccineFullName(vaccine: VaccineData): string {
  return `${vaccine.name}${vaccine.dose}`
}
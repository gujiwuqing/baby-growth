/**
 * 记录类型元信息（公共常量）
 * 首页时间轴、喂养页历史列表、快捷记录组件共享，避免多处重复维护导致不一致
 */
export interface RecordTypeMeta {
  label: string
  icon: string
  color: string
}

export const RECORD_TYPE_META: Record<string, RecordTypeMeta> = {
  breast: { label: '母乳', icon: '🤱', color: '#FF6BA8' },
  formula: { label: '配方奶', icon: '🍼', color: '#FFA94D' },
  bottle: { label: '瓶喂母乳', icon: '🍼', color: '#FF8FB8' },
  diaper: { label: '换尿布', icon: '👶', color: '#FFC93C' },
  sleep: { label: '睡眠', icon: '😴', color: '#A78BFA' },
  food: { label: '辅食', icon: '🥣', color: '#F59E0B' },
  supplement: { label: '营养补剂', icon: '💊', color: '#34D399' },
  growth: { label: '成长指标', icon: '📏', color: '#3B82F6' }
}

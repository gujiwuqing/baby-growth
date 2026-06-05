import { getDeviceId } from '@/utils/device'

/**
 * 记录页保存通用逻辑
 * 统一处理：HH:mm 转时间戳、唯一 ID 生成、保存的 toast 反馈与返回、取消导航
 */
export function useRecordSave(recordType: string) {
  /**
   * 将 HH:mm 转换为今天对应的时间戳，空值回退当前时间
   */
  const timeStrToTimestamp = (timeStr: string): number => {
    if (!timeStr) return Date.now()
    const parts = timeStr.split(':')
    const date = new Date()
    date.setHours(parseInt(parts[0]) || 0, parseInt(parts[1]) || 0, 0, 0)
    return date.getTime()
  }

  /**
   * 将 YYYY-MM-DD 转换为当天 0 点时间戳，空值回退当前时间
   */
  const dateStrToTimestamp = (dateStr: string): number => {
    if (!dateStr) return Date.now()
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? Date.now() : date.getTime()
  }

  /**
   * 生成跨设备稳定唯一 ID
   */
  const makeUniqueId = (createdAt: number): string => {
    return `${createdAt}_${recordType}_${getDeviceId()}`
  }

  /**
   * 取消并返回首页
   */
  const cancel = () => {
    uni.reLaunch({ url: '/pages/index/index' })
  }

  /**
   * 执行保存：统一 try/catch + 成功提示 + 自动返回
   * @param executor 实际的 INSERT 执行函数，接收 { createdAt, uniqueId }
   */
  const save = async (
    executor: (ctx: { createdAt: number; uniqueId: string }) => Promise<void>
  ): Promise<boolean> => {
    try {
      const createdAt = Date.now()
      const uniqueId = makeUniqueId(createdAt)
      await executor({ createdAt, uniqueId })

      uni.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
      return true
    } catch (error) {
      console.error('保存失败', error)
      uni.showToast({ title: '保存失败', icon: 'none' })
      return false
    }
  }

  return {
    timeStrToTimestamp,
    dateStrToTimestamp,
    makeUniqueId,
    cancel,
    save
  }
}

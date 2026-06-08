/**
 * 提醒管理工具
 */

const FEEDING_REMINDER_KEY = 'feeding_reminder_enabled'
const FEEDING_REMINDER_INTERVAL_KEY = 'feeding_reminder_interval'

/**
 * 创建本地通知
 */
export function createLocalNotification(title: string, content: string, delayTime: number): boolean {
  // #ifdef APP-PLUS
  const options = {
    title: title,
    content: content,
    when: Date.now() + delayTime
  }
  
  const push: any = plus.push
  push.createMessage(content, JSON.stringify(options), options)
  return true
  // #endif

  // #ifndef APP-PLUS
  // H5/小程序无本地推送能力，降级为提示，避免静默无反馈
  uni.showToast({ title: '提醒功能仅支持 APP 端', icon: 'none' })
  return false
  // #endif
}

/**
 * 设置喂奶提醒（周期循环，触发后自动续期）
 * @param interval 提醒间隔（毫秒），默认 3 小时
 */
export function setFeedingReminder(interval: number = 3 * 60 * 60 * 1000) {
  // 保存提醒配置
  uni.setStorageSync(FEEDING_REMINDER_KEY, true)
  uni.setStorageSync(FEEDING_REMINDER_INTERVAL_KEY, interval)
  
  const ok = createLocalNotification(
    '喂奶提醒',
    '宝宝该喝奶啦！',
    interval
  )

  // #ifdef APP-PLUS
  // 单次本地通知触发后不会自动重复，这里用定时器在到点后续期下一轮
  if (ok) {
    setTimeout(() => {
      // 检查用户是否仍然启用提醒
      if (isFeedingReminderEnabled()) {
        setFeedingReminder(interval)
      }
    }, interval)
  }
  // #endif
  
  return ok
}

/**
 * 取消喂奶提醒
 */
export function cancelFeedingReminder() {
  uni.setStorageSync(FEEDING_REMINDER_KEY, false)
  // #ifdef APP-PLUS
  const push: any = plus.push
  push.clear()
  // #endif
}

/**
 * 检查喂奶提醒是否启用
 */
export function isFeedingReminderEnabled(): boolean {
  return uni.getStorageSync(FEEDING_REMINDER_KEY) === true
}

/**
 * 获取喂奶提醒间隔
 */
export function getFeedingReminderInterval(): number {
  return uni.getStorageSync(FEEDING_REMINDER_INTERVAL_KEY) || 3 * 60 * 60 * 1000
}

/**
 * 设置疫苗提醒
 */
export function setVaccineReminder(vaccineName: string, date: number) {
  const delayTime = date - Date.now()
  if (delayTime > 0) {
    createLocalNotification(
      '疫苗接种提醒',
      `请记得给宝宝接种${vaccineName}`,
      delayTime
    )
  }
}

/**
 * 取消所有提醒
 */
export function cancelAllReminders() {
  cancelFeedingReminder()
  // #ifdef APP-PLUS
  const push: any = plus.push
  push.clear()
  // #endif
}

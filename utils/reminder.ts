/**
 * 提醒管理工具
 */

/**
 * 创建本地通知
 */
export function createLocalNotification(title: string, content: string, delayTime: number) {
  // #ifdef APP-PLUS
  const options = {
    title: title,
    content: content,
    when: Date.now() + delayTime
  }
  
  plus.push.createMessage(content, JSON.stringify(options), options)
  // #endif
}

/**
 * 设置喂奶提醒
 */
export function setFeedingReminder(interval: number = 3 * 60 * 60 * 1000) {
  createLocalNotification(
    '喂奶提醒',
    '宝宝该喝奶啦！',
    interval
  )
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
  // #ifdef APP-PLUS
  plus.push.clear()
  // #endif
}

/**
 * 设备信息工具
 */

/**
 * 获取设备唯一标识
 */
export function getDeviceId(): string {
  let deviceId = uni.getStorageSync('device_id')
  if (!deviceId) {
    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    uni.setStorageSync('device_id', deviceId)
  }
  return deviceId
}

/**
 * 获取当前时间戳（毫秒）
 */
export function getTimestamp(): number {
  return Date.now()
}

/**
 * 格式化时间
 */
export function formatTime(timestamp: number, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

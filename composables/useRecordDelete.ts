/**
 * 通用记录删除 composable
 * 根据 RecordItem.id（格式 feed_123 / diaper_456）解析表名和主键，执行删除
 */
import { db } from '@/utils/database'

/** RecordItem.id 前缀 → 数据库表名映射 */
const prefixToTable: Record<string, string> = {
  feed: 'feeds',
  diaper: 'diapers',
  sleep: 'sleeps',
  food: 'foods',
  supplement: 'supplements',
  growth: 'growth_records'
}

/**
 * 解析 RecordItem.id 为表名和主键
 * @param recordId 格式如 "feed_12" / "diaper_5"
 */
function parseRecordId(recordId: string): { table: string; id: number } | null {
  const underscoreIndex = recordId.indexOf('_')
  if (underscoreIndex === -1) return null

  const prefix = recordId.substring(0, underscoreIndex)
  const idStr = recordId.substring(underscoreIndex + 1)
  const table = prefixToTable[prefix]
  const id = Number(idStr)

  if (!table || isNaN(id)) return null
  return { table, id }
}

/**
 * 删除单条记录（带确认弹窗）
 * @param recordId RecordItem.id
 * @param onSuccess 删除成功后的回调
 */
export function deleteRecord(recordId: string, onSuccess?: () => void): void {
  const parsed = parseRecordId(recordId)
  if (!parsed) {
    uni.showToast({ title: '无法识别记录类型', icon: 'none' })
    return
  }

  uni.showModal({
    title: '确认删除',
    content: '删除后不可恢复，确定要删除这条记录吗？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await db.executeSql(`DELETE FROM ${parsed.table} WHERE id = ${parsed.id}`)
        uni.showToast({ title: '已删除', icon: 'success' })
        onSuccess?.()
      } catch (error) {
        console.error('删除记录失败', error)
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  })
}

/**
 * 静默删除（无确认弹窗，用于批量场景）
 */
export async function deleteRecordSilent(recordId: string): Promise<boolean> {
  const parsed = parseRecordId(recordId)
  if (!parsed) return false

  try {
    await db.executeSql(`DELETE FROM ${parsed.table} WHERE id = ${parsed.id}`)
    return true
  } catch (error) {
    console.error('删除记录失败', error)
    return false
  }
}

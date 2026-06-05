import { db, escapeSqlValue } from './database'

/**
 * 从文件读取数据
 */
export async function readDataFromFile(filePath: string): Promise<any> {
  // #ifdef APP-PLUS
  return new Promise((resolve, reject) => {
    plus.io.resolveLocalFileSystemURL(filePath, (entry) => {
      entry.file((file) => {
        const reader = new plus.io.FileReader()
        reader.onloadend = (e: any) => {
          try {
            const data = JSON.parse(e.target.result)
            resolve(data)
          } catch (error) {
            reject(error)
          }
        }
        reader.readAsText(file)
      })
    })
  })
  // #endif
  
  // #ifdef H5
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e: any) => {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (e: any) => {
        try {
          const data = JSON.parse(e.target.result)
          resolve(data)
        } catch (error) {
          reject(error)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  })
  // #endif
  
  // #ifndef APP-PLUS || H5
  return null
  // #endif
}

/**
 * 导入数据并去重
 */
export async function importDataWithDedup(data: any): Promise<number> {
  if (!data || !data.data) {
    throw new Error('导入数据格式错误：缺少 data 字段')
  }

  let importedCount = 0

  const tables = [
    { name: 'feeds', data: data.data.feeds },
    { name: 'diapers', data: data.data.diapers },
    { name: 'sleeps', data: data.data.sleeps },
    { name: 'foods', data: data.data.foods },
    { name: 'supplements', data: data.data.supplements },
    { name: 'growth_records', data: data.data.growthRecords },
    { name: 'photos', data: data.data.photos }
  ]

  for (const table of tables) {
    if (!table.data || table.data.length === 0) continue

    // 批量拉取已有 unique_id 集合，避免逐条查询的全表扫描
    const existingIds = await fetchExistingUniqueIds(table.name)

    for (const record of table.data) {
      if (record.unique_id && existingIds.has(record.unique_id)) continue
      await insertRecord(table.name, record)
      if (record.unique_id) existingIds.add(record.unique_id)
      importedCount++
    }
  }

  // 宝宝信息：单对象，无 unique_id，存在则跳过
  const babyInfo = data.data.babyInfo
  if (babyInfo) {
    const existing = await db.selectSql('SELECT id FROM baby_info LIMIT 1')
    if (!existing || existing.length === 0) {
      await insertRecord('baby_info', babyInfo)
      importedCount++
    }
  }

  return importedCount
}

/**
 * 批量获取某表已有的 unique_id 集合
 */
async function fetchExistingUniqueIds(table: string): Promise<Set<string>> {
  try {
    const rows = await db.selectSql(`SELECT unique_id FROM ${table}`)
    return new Set((rows || []).map((row: any) => row.unique_id))
  } catch (error) {
    console.error(`获取 ${table} 已有记录失败`, error)
    return new Set()
  }
}

/**
 * 插入记录（字符串值统一转义，防止单引号破坏 SQL）
 */
async function insertRecord(table: string, record: any): Promise<void> {
  const keys = Object.keys(record).filter(key => key !== 'id')
  const values = keys.map(key => {
    const value = record[key]
    if (value === null || value === undefined) return 'NULL'
    if (typeof value === 'number') return value
    return `'${escapeSqlValue(value)}'`
  })

  await db.executeSql(`
    INSERT INTO ${table} (${keys.join(', ')})
    VALUES (${values.join(', ')})
  `)
}

import { db } from './database'

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
    
    for (const record of table.data) {
      const exists = await checkRecordExists(record.unique_id, table.name)
      if (!exists) {
        await insertRecord(table.name, record)
        importedCount++
      }
    }
  }
  
  return importedCount
}

/**
 * 检查记录是否已存在
 */
async function checkRecordExists(uniqueId: string, table: string): Promise<boolean> {
  try {
    const result = await db.selectSql(`
      SELECT id FROM ${table} WHERE unique_id = '${uniqueId}'
    `)
    return result && result.length > 0
  } catch (error) {
    return false
  }
}

/**
 * 插入记录
 */
async function insertRecord(table: string, record: any): Promise<void> {
  const keys = Object.keys(record)
  const values = keys.map(key => {
    const value = record[key]
    if (value === null || value === undefined) return 'NULL'
    if (typeof value === 'number') return value
    return `'${value}'`
  })
  
  await db.executeSql(`
    INSERT INTO ${table} (${keys.join(', ')})
    VALUES (${values.join(', ')})
  `)
}

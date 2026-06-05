import { db } from './database'

/**
 * 导出所有数据
 */
export async function exportAllData(): Promise<any> {
  try {
    const feeds = await db.selectSql('SELECT * FROM feeds ORDER BY timestamp DESC')
    const diapers = await db.selectSql('SELECT * FROM diapers ORDER BY timestamp DESC')
    const sleeps = await db.selectSql('SELECT * FROM sleeps ORDER BY start_time DESC')
    const foods = await db.selectSql('SELECT * FROM foods ORDER BY timestamp DESC')
    const supplements = await db.selectSql('SELECT * FROM supplements ORDER BY timestamp DESC')
    const growthRecords = await db.selectSql('SELECT * FROM growth_records ORDER BY timestamp DESC')
    const photos = await db.selectSql('SELECT * FROM photos ORDER BY timestamp DESC')
    const babyInfo = await db.selectSql('SELECT * FROM baby_info LIMIT 1')
    
    return {
      version: '1.0.0',
      exportTime: Date.now(),
      data: {
        babyInfo: babyInfo && babyInfo.length > 0 ? babyInfo[0] : null,
        feeds: feeds || [],
        diapers: diapers || [],
        sleeps: sleeps || [],
        foods: foods || [],
        supplements: supplements || [],
        growthRecords: growthRecords || [],
        photos: photos || []
      }
    }
  } catch (error) {
    console.error('导出数据失败', error)
    throw error
  }
}

/**
 * 保存数据到文件
 */
export async function saveDataToFile(data: any): Promise<string> {
  const json = JSON.stringify(data, null, 2)
  const fileName = `baby_growth_${Date.now()}.json`
  
  // #ifdef APP-PLUS
  return new Promise((resolve, reject) => {
    plus.io.requestFileSystem(plus.io.PRIVATE_DOC, (fs) => {
      fs.root.getFile(fileName, { create: true }, (fileEntry) => {
        fileEntry.createWriter((writer) => {
          writer.write(json)
          writer.onwrite = () => {
            resolve(fileEntry.fullPath)
          }
          writer.onerror = (e: any) => {
            reject(e)
          }
        })
      })
    })
  })
  // #endif
  
  // #ifdef H5
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
  return fileName
  // #endif
  
  // #ifndef APP-PLUS || H5
  return fileName
  // #endif
}

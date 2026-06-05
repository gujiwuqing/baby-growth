import { getDeviceId } from './device'

/**
 * SQLite 数据库封装
 * APP环境使用SQLite，H5环境使用localStorage模拟
 */
class Database {
  private dbName: string = 'baby_growth'
  private dbPath: string = '_doc/baby_growth.db'
  private isOpen: boolean = false
  private localStorageKey: string = 'baby_growth_db'
  private data: Record<string, any[]> = {}

  /**
   * 打开数据库
   */
  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      // #ifdef APP-PLUS
      plus.sqlite.openDatabase({
        name: this.dbName,
        path: this.dbPath,
        success: () => {
          this.isOpen = true
          console.log('数据库打开成功')
          resolve()
        },
        fail: (e: any) => {
          console.error('数据库打开失败', e)
          reject(e)
        }
      })
      // #endif
      
      // #ifndef APP-PLUS
      console.log('非APP环境，使用本地存储')
      this.isOpen = true
      // 从localStorage加载数据
      try {
        const stored = localStorage.getItem(this.localStorageKey)
        if (stored) {
          this.data = JSON.parse(stored)
        }
      } catch (e) {
        console.error('加载本地存储失败', e)
        this.data = {}
      }
      resolve()
      // #endif
    })
  }

  /**
   * 关闭数据库
   */
  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      // #ifdef APP-PLUS
      plus.sqlite.closeDatabase({
        name: this.dbName,
        success: () => {
          this.isOpen = false
          console.log('数据库关闭成功')
          resolve()
        },
        fail: (e: any) => {
          console.error('数据库关闭失败', e)
          reject(e)
        }
      })
      // #endif
      
      // #ifndef APP-PLUS
      this.isOpen = false
      // 保存数据到localStorage
      try {
        localStorage.setItem(this.localStorageKey, JSON.stringify(this.data))
      } catch (e) {
        console.error('保存本地存储失败', e)
      }
      resolve()
      // #endif
    })
  }

  /**
   * 执行 SQL 语句（INSERT/UPDATE/DELETE）
   */
  async executeSql(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // #ifdef APP-PLUS
      plus.sqlite.executeSql({
        name: this.dbName,
        sql: sql,
        success: () => {
          resolve()
        },
        fail: (e: any) => {
          console.error('SQL 执行失败', sql, e)
          reject(e)
        }
      })
      // #endif
      
      // #ifndef APP-PLUS
      console.log('非APP环境，SQL:', sql)
      // 解析SQL语句并执行操作
      this.executeLocalSql(sql)
      resolve()
      // #endif
    })
  }

  /**
   * 查询数据
   */
  async selectSql(sql: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      // #ifdef APP-PLUS
      plus.sqlite.selectSql({
        name: this.dbName,
        sql: sql,
        success: (data: any[]) => {
          resolve(data)
        },
        fail: (e: any) => {
          console.error('SQL 查询失败', sql, e)
          reject(e)
        }
      })
      // #endif
      
      // #ifndef APP-PLUS
      console.log('非APP环境，查询SQL:', sql)
      // 解析SQL查询并返回数据
      const result = this.selectLocalSql(sql)
      resolve(result)
      // #endif
    })
  }

  /**
   * H5环境：解析并执行SQL
   */
  private executeLocalSql(sql: string): void {
    const upperSql = sql.trim().toUpperCase()
    
    // INSERT 语句
    if (upperSql.startsWith('INSERT INTO')) {
      const match = sql.match(/INSERT INTO (\w+)\s+\([^)]+\)\s+VALUES\s+\((.+)\)/i)
      if (match) {
        const table = match[1]
        const valuesStr = match[2]
        
        // 解析值（简化处理）
        const values = this.parseInsertValues(valuesStr)
        
        // 确保表存在
        if (!this.data[table]) {
          this.data[table] = []
        }
        
        // 生成ID
        const row: any = { id: this.data[table].length + 1 }
        
        // 根据表结构映射字段
        const columns = this.getTableColumns(table)
        columns.forEach((col, index) => {
          if (index < values.length) {
            row[col] = values[index]
          }
        })
        
        this.data[table].push(row)
        this.saveToStorage()
      }
    }
    
    // UPDATE 语句
    const updateMatch = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(.+)/i)
    if (updateMatch) {
      const table = updateMatch[1]
      const setClause = updateMatch[2]
      const whereClause = updateMatch[3]
      
      if (this.data[table]) {
        // 解析 SET 子句
        const setParts = setClause.split(',').map(s => s.trim())
        const updates: Record<string, any> = {}
        
        setParts.forEach(part => {
          const [field, value] = part.split('=').map(s => s.trim())
          updates[field] = this.parseValue(value)
        })
        
        // 解析 WHERE 条件
        const whereParts = whereClause.split('AND').map(s => s.trim())
        
        this.data[table].forEach(row => {
          let matches = true
          whereParts.forEach(cond => {
            const [field, value] = cond.split('=').map(s => s.trim())
            if (row[field] != this.parseValue(value)) {
              matches = false
            }
          })
          if (matches) {
            Object.assign(row, updates)
          }
        })
        
        this.saveToStorage()
      }
    }
    
    // DELETE 语句
    const deleteMatch = sql.match(/DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?/i)
    if (deleteMatch) {
      const table = deleteMatch[1]
      const whereClause = deleteMatch[2]
      
      if (this.data[table]) {
        if (!whereClause) {
          // 没有 WHERE，清空表
          this.data[table] = []
        } else {
          // 有 WHERE，删除匹配的行
          const whereParts = whereClause.split('AND').map(s => s.trim())
          this.data[table] = this.data[table].filter(row => {
            let matches = true
            whereParts.forEach(cond => {
              const [field, value] = cond.split('=').map(s => s.trim())
              if (row[field] == this.parseValue(value)) {
                matches = false
              }
            })
            return matches
          })
        }
        
        this.saveToStorage()
      }
    }
  }

  /**
   * H5环境：解析INSERT VALUES
   */
  private parseInsertValues(valuesStr: string): any[] {
    const values: any[] = []
    let current = ''
    let inString = false
    let stringChar = ''
    
    for (let i = 0; i < valuesStr.length; i++) {
      const char = valuesStr[i]
      
      if ((char === "'" || char === '"') && !inString) {
        inString = true
        stringChar = char
      } else if (char === stringChar && inString) {
        inString = false
        stringChar = ''
      } else if (char === ',' && !inString) {
        values.push(this.parseValue(current.trim()))
        current = ''
      } else {
        current += char
      }
    }
    
    if (current.trim()) {
      values.push(this.parseValue(current.trim()))
    }
    
    return values
  }

  /**
   * H5环境：解析单个值
   */
  private parseValue(val: string): any {
    if (val === 'NULL') return null
    if (val === 'true' || val === 'false') return val === 'true'
    if (!isNaN(Number(val))) return Number(val)
    return val
  }

  /**
   * H5环境：获取表字段
   */
  private getTableColumns(table: string): string[] {
    const schemas: Record<string, string[]> = {
      baby_info: ['name', 'gender', 'birthday', 'avatar', 'created_at', 'updated_at'],
      feeds: ['unique_id', 'type', 'amount', 'unit', 'left_duration', 'right_duration', 'start_time', 'end_time', 'note', 'timestamp', 'device_id', 'created_at'],
      diapers: ['unique_id', 'type', 'has_rash', 'poo_color', 'poo_shape', 'note', 'timestamp', 'device_id', 'created_at'],
      sleeps: ['unique_id', 'start_time', 'end_time', 'duration', 'note', 'device_id', 'created_at'],
      foods: ['unique_id', 'food_type', 'amount', 'unit', 'note', 'timestamp', 'device_id', 'created_at'],
      supplements: ['unique_id', 'supplement_type', 'dosage', 'note', 'timestamp', 'device_id', 'created_at'],
      growth_records: ['unique_id', 'height', 'weight', 'head_circumference', 'note', 'timestamp', 'device_id', 'created_at'],
      photos: ['unique_id', 'photo_path', 'thumbnail_path', 'caption', 'month', 'timestamp', 'device_id', 'created_at'],
      reminders: ['type', 'title', 'content', 'reminder_time', 'is_enabled', 'repeat_type', 'last_triggered', 'created_at']
    }
    return schemas[table] || []
  }

  /**
   * H5环境：解析SQL查询
   */
  private selectLocalSql(sql: string): any[] {
    const upperSql = sql.trim().toUpperCase()
    
    // SELECT * FROM table
    const match = sql.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)/i)
    if (match) {
      const fields = match[1]
      const table = match[2]
      
      let data = this.data[table] || []
      
      // WHERE 条件（完整实现）
      const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+GROUP|\s+LIMIT|$)/i)
      if (whereMatch) {
        const condition = whereMatch[1].trim()
        
        // 处理 COUNT(*)
        if (condition.includes('COUNT(*)')) {
          return [{ count: data.length }]
        }
        
        // 解析所有 AND 连接的条件
        const conditions = condition.split('AND').map(c => c.trim())
        
        data = data.filter(row => {
          return conditions.every(cond => {
            // 处理 timestamp >= value
            const gteMatch = cond.match(/(\w+)\s*>=\s*(\d+)/)
            if (gteMatch) {
              const field = gteMatch[1]
              const value = Number(gteMatch[2])
              return row[field] >= value
            }
            
            // 处理 field = value
            const eqMatch = cond.match(/(\w+)\s*=\s*(?:'([^']+)'|(\d+))/)
            if (eqMatch) {
              const field = eqMatch[1]
              const value = eqMatch[2] || Number(eqMatch[3])
              return row[field] == value
            }
            
            return true
          })
        })
      }
      
      // GROUP BY
      const groupMatch = sql.match(/GROUP BY\s+(\w+)/i)
      if (groupMatch) {
        const field = groupMatch[1]
        const groups: Record<string, any[]> = {}
        
        data.forEach(row => {
          const key = row[field]
          if (!groups[key]) groups[key] = []
          groups[key].push(row)
        })
        
        // 返回分组统计结果
        return Object.keys(groups).map(key => ({
          [field]: key,
          count: groups[key].length
        }))
      }
      
      // ORDER BY
      const orderMatch = sql.match(/ORDER BY\s+(\w+)(?:\s+(ASC|DESC))?/i)
      if (orderMatch) {
        const field = orderMatch[1]
        const order = (orderMatch[2] || 'ASC').toUpperCase()
        data.sort((a, b) => {
          if (order === 'DESC') {
            return (b[field] || 0) - (a[field] || 0)
          }
          return (a[field] || 0) - (b[field] || 0)
        })
      }
      
      // LIMIT
      const limitMatch = sql.match(/LIMIT\s+(\d+)/i)
      if (limitMatch) {
        const limit = Number(limitMatch[1])
        data = data.slice(0, limit)
      }
      
      return data
    }
    
    return []
  }

  /**
   * 保存到localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(this.data))
    } catch (e) {
      console.error('保存本地存储失败', e)
    }
  }

  /**
   * 安全地为已存在的表添加列（列已存在时忽略错误）
   */
  async addColumnIfNotExists(table: string, columnDefinition: string): Promise<void> {
    try {
      await this.executeSql(`ALTER TABLE ${table} ADD COLUMN ${columnDefinition}`)
    } catch (error) {
      // 列已存在时 SQLite 会报错，这里忽略即可，保证幂等
      console.log(`列可能已存在，跳过: ${table} ${columnDefinition}`)
    }
  }

  /**
   * 初始化数据库表
   */
  async initTables(): Promise<void> {
    // 宝宝信息表
    await this.executeSql(`
      CREATE TABLE IF NOT EXISTS baby_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        gender INTEGER DEFAULT 0,
        birthday TEXT NOT NULL,
        avatar TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)

    // 喂奶记录表
    // type: breast(母乳-计时) / formula(配方奶-ml) / bottle(瓶喂母乳-ml)
    // 母乳计时使用 left_duration/right_duration(单位:秒) + start_time/end_time(时间戳)
    // 瓶喂/配方奶使用 amount(ml)
    await this.executeSql(`
      CREATE TABLE IF NOT EXISTS feeds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unique_id TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        amount REAL DEFAULT 0,
        unit TEXT DEFAULT 'ml',
        left_duration INTEGER DEFAULT 0,
        right_duration INTEGER DEFAULT 0,
        start_time INTEGER,
        end_time INTEGER,
        note TEXT,
        timestamp INTEGER NOT NULL,
        device_id TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `)

    // 纸尿裤记录表
    await this.executeSql(`
      CREATE TABLE IF NOT EXISTS diapers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unique_id TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        has_rash INTEGER DEFAULT 0,
        poo_color TEXT,
        poo_shape TEXT,
        note TEXT,
        timestamp INTEGER NOT NULL,
        device_id TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `)

    // 睡眠记录表
    await this.executeSql(`
      CREATE TABLE IF NOT EXISTS sleeps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unique_id TEXT UNIQUE NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        duration INTEGER,
        note TEXT,
        device_id TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `)

    // 辅食记录表
    await this.executeSql(`
      CREATE TABLE IF NOT EXISTS foods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unique_id TEXT UNIQUE NOT NULL,
        food_type TEXT NOT NULL,
        amount REAL DEFAULT 0,
        unit TEXT DEFAULT 'g',
        note TEXT,
        timestamp INTEGER NOT NULL,
        device_id TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `)

    // 营养补充记录表
    await this.executeSql(`
      CREATE TABLE IF NOT EXISTS supplements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unique_id TEXT UNIQUE NOT NULL,
        supplement_type TEXT NOT NULL,
        dosage TEXT,
        note TEXT,
        timestamp INTEGER NOT NULL,
        device_id TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `)

    // 成长指标记录表
    await this.executeSql(`
      CREATE TABLE IF NOT EXISTS growth_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unique_id TEXT UNIQUE NOT NULL,
        height REAL,
        weight REAL,
        head_circumference REAL,
        note TEXT,
        timestamp INTEGER NOT NULL,
        device_id TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `)

    // 照片记录表
    await this.executeSql(`
      CREATE TABLE IF NOT EXISTS photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unique_id TEXT UNIQUE NOT NULL,
        photo_path TEXT NOT NULL,
        thumbnail_path TEXT,
        caption TEXT,
        month TEXT,
        timestamp INTEGER NOT NULL,
        device_id TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `)

    // 提醒配置表
    await this.executeSql(`
      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        reminder_time INTEGER NOT NULL,
        is_enabled INTEGER DEFAULT 1,
        repeat_type TEXT DEFAULT 'none',
        last_triggered INTEGER,
        created_at INTEGER NOT NULL
      )
    `)

    // 旧库升级：为已存在的 feeds 表补齐母乳计时相关字段（保留旧数据）
    await this.addColumnIfNotExists('feeds', 'left_duration INTEGER DEFAULT 0')
    await this.addColumnIfNotExists('feeds', 'right_duration INTEGER DEFAULT 0')
    await this.addColumnIfNotExists('feeds', 'start_time INTEGER')
    await this.addColumnIfNotExists('feeds', 'end_time INTEGER')

    console.log('数据库表初始化完成')
  }
}

export const db = new Database()

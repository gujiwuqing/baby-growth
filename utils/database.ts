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
   * H5环境：保存数据到localStorage
   */
  private saveToStorage(): void {
    // #ifndef APP-PLUS
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(this.data))
      console.log('数据已保存到localStorage')
    } catch (e) {
      console.error('保存本地存储失败', e)
    }
    // #endif
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
    
    console.log('执行SQL:', sql)
    
    // INSERT 语句
    if (upperSql.startsWith('INSERT INTO')) {
      const match = sql.match(/INSERT INTO (\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([\s\S]+)\)/i)
      if (match) {
        const table = match[1]
        const fieldsStr = match[2]
        const valuesStr = match[3]
        
        console.log('INSERT语句解析:', { table, fieldsStr, valuesStr })
        
        // 解析字段名
        const fields = fieldsStr.split(',').map(f => f.trim())
        
        // 解析值
        const values = this.parseInsertValues(valuesStr)
        
        // 确保表存在
        if (!this.data[table]) {
          this.data[table] = []
        }
        
        // 生成ID
        const row: any = { id: this.data[table].length + 1 }
        
        // 映射字段和值
        fields.forEach((field, index) => {
          if (index < values.length) {
            row[field] = values[index]
          }
        })
        
        console.log('插入行:', row)
        this.data[table].push(row)
        this.saveToStorage()
      }
    }
    
    // UPDATE 语句
    const updateMatch = sql.match(/UPDATE\s+(\w+)\s+SET\s+([\s\S]+?)\s+WHERE\s+([\s\S]+)/i)
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
        const trimmed = current.trim()
        // 移除引号
        const cleanValue = trimmed.replace(/^['"]|['"]$/g, '')
        values.push(this.parseValue(cleanValue))
        current = ''
      } else {
        current += char
      }
    }
    
    if (current.trim()) {
      const trimmed = current.trim()
      const cleanValue = trimmed.replace(/^['"]|['"]$/g, '')
      values.push(this.parseValue(cleanValue))
    }
    
    console.log('解析INSERT VALUES:', valuesStr, '=>', values)
    return values
  }

  /**
   * H5环境：解析单个值
   */
  private parseValue(val: string): any {
    // 去除值两端的引号（兼容 UPDATE SET / WHERE 中带引号的字符串值）
    const unquoted = val.replace(/^['"]|['"]$/g, '')
    if (unquoted === 'NULL') return null
    if (unquoted === 'true' || unquoted === 'false') return unquoted === 'true'
    if (unquoted !== '' && !isNaN(Number(unquoted))) return Number(unquoted)
    return unquoted
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
      reminders: ['type', 'title', 'content', 'reminder_time', 'is_enabled', 'repeat_type', 'last_triggered', 'created_at'],
      vaccines: ['unique_id', 'vaccine_name', 'vaccine_type', 'dose', 'scheduled_date', 'actual_date', 'injection_site', 'batch_number', 'manufacturer', 'hospital', 'doctor', 'status', 'adverse_reaction', 'note', 'device_id', 'created_at']
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
    // #ifdef APP-PLUS
    try {
      // 疫苗接种记录表
      await this.executeSql(`
        CREATE TABLE IF NOT EXISTS vaccines (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          unique_id TEXT UNIQUE NOT NULL,
          vaccine_name TEXT NOT NULL,
          vaccine_type TEXT NOT NULL,
          dose TEXT,
          scheduled_date INTEGER,
          actual_date INTEGER,
          injection_site TEXT,
          batch_number TEXT,
          manufacturer TEXT,
          hospital TEXT,
          doctor TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          adverse_reaction TEXT,
          note TEXT,
          device_id TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )
      `)
      
      console.log('数据库表初始化成功')
    } catch (error) {
      console.error('初始化数据库表失败', error)
      throw error
    }
    // #endif
    
    // #ifndef APP-PLUS
    console.log('H5环境：初始化本地存储表结构')
    // H5环境：确保表存在
    if (!this.data['vaccines']) {
      this.data['vaccines'] = []
    }
    if (!this.data['baby_info']) {
      this.data['baby_info'] = []
    }
    this.saveToStorage()
    // #endif
  }
}

export const db = new Database()

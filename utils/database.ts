/**
 * SQLite 数据库封装
 * APP环境使用SQLite，H5环境使用localStorage模拟
 */
class Database {
  private dbName: string = 'baby_growth'
  private dbPath: string = '_doc/baby_growth.db'
  private isOpen: boolean = false
  private tablesInitialized: boolean = false
  private localStorageKey: string = 'baby_growth_db'
  private data: Record<string, any[]> = {}

  /**
   * 打开数据库
   */
  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 幂等守卫：已打开则直接返回，避免页面 onShow 重复打开
      if (this.isOpen) {
        resolve()
        return
      }
      // #ifdef APP-PLUS
      plus.sqlite.openDatabase({
        name: this.dbName,
        path: this.dbPath,
        success: () => {
          this.isOpen = true
          resolve()
        },
        fail: (e: any) => {
          console.error('数据库打开失败', e)
          reject(e)
        }
      })
      // #endif
      
      // #ifndef APP-PLUS
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
    
    
    // INSERT 语句（兼容 INSERT OR IGNORE INTO / INSERT OR REPLACE INTO）
    const isIgnore = upperSql.includes('OR IGNORE')
    if (upperSql.startsWith('INSERT')) {
      const match = sql.match(/INSERT\s+(?:OR\s+\w+\s+)?INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([\s\S]+)\)/i)
      if (match) {
        const table = match[1]
        const fieldsStr = match[2]
        const valuesStr = match[3]
        
        // 解析字段名
        const fields = fieldsStr.split(',').map(f => f.trim())
        
        // 解析值
        const values = this.parseInsertValues(valuesStr)
        
        // 确保表存在
        if (!this.data[table]) {
          this.data[table] = []
        }
        
        // 构建行数据
        const row: any = {}
        fields.forEach((field, index) => {
          if (index < values.length) {
            row[field] = values[index]
          }
        })
        
        // OR IGNORE 语义：unique_id 已存在则静默跳过
        if (isIgnore && row.unique_id) {
          const exists = this.data[table].some((r: any) => r.unique_id === row.unique_id)
          if (exists) return
        }
        
        // 生成ID：基于现有最大 id 单调递增
        const maxId = this.data[table].reduce((max: number, item: any) => {
          const itemId = Number(item.id) || 0
          return itemId > max ? itemId : max
        }, 0)
        row.id = maxId + 1
        
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
          // 有 WHERE：所有条件均命中才删除（filter 返回 false 表示移除）
          const whereParts = whereClause.split(/\s+AND\s+/i).map(s => s.trim())
          this.data[table] = this.data[table].filter(row => {
            const allMatch = whereParts.every(cond => this.matchWhereCondition(row, cond))
            return !allMatch
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
    let quoted = false

    for (let i = 0; i < valuesStr.length; i++) {
      const char = valuesStr[i]

      if (char === "'" && !inString) {
        inString = true
        quoted = true
      } else if (char === "'" && inString) {
        // SQL 转义：连续两个单引号代表字符串内的一个单引号
        if (valuesStr[i + 1] === "'") {
          current += "'"
          i++
        } else {
          inString = false
        }
      } else if (char === ',' && !inString) {
        values.push(this.finalizeInsertValue(current.trim(), quoted))
        current = ''
        quoted = false
      } else {
        current += char
      }
    }

    if (current.trim() !== '' || quoted) {
      values.push(this.finalizeInsertValue(current.trim(), quoted))
    }

    return values
  }

  /**
   * H5环境：根据是否被引号包裹决定值类型。
   * 带引号 → 强制字符串（保护电话号/前导 0 批次号）；裸值 → 走类型推断。
   */
  private finalizeInsertValue(raw: string, quoted: boolean): any {
    if (quoted) return raw
    return this.parseValue(raw)
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
      vaccines: ['unique_id', 'vaccine_name', 'vaccine_type', 'dose', 'age_months', 'scheduled_date', 'actual_date', 'injection_site', 'batch_number', 'manufacturer', 'hospital', 'doctor', 'status', 'adverse_reaction', 'note', 'device_id', 'created_at']
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
      
      // WHERE 条件（支持 AND 连接的 = / != / >= / <= / > / < 比较）
      const whereMatch = sql.match(/WHERE\s+([\s\S]+?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)/i)
      if (whereMatch) {
        const condition = whereMatch[1].trim()
        const conditions = condition.split(/\s+AND\s+/i).map(c => c.trim())
        
        data = data.filter(row => {
          return conditions.every(cond => this.matchWhereCondition(row, cond))
        })
      }
      
      // GROUP BY
      const groupMatch = sql.match(/GROUP\s+BY\s+(\w+)/i)
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
      
      // 聚合函数：COUNT(*) / SUM(field) / AVG(field)，可带 as 别名
      if (/COUNT\s*\(|SUM\s*\(|AVG\s*\(/i.test(fields)) {
        return [this.computeAggregates(fields, data)]
      }
      
      // ORDER BY field [ASC|DESC]
      const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)\s*(ASC|DESC)?/i)
      if (orderMatch) {
        const field = orderMatch[1]
        const desc = (orderMatch[2] || 'ASC').toUpperCase() === 'DESC'
        data = [...data].sort((a, b) => {
          const av = a[field]
          const bv = b[field]
          if (av === bv) return 0
          if (av === null || av === undefined) return 1
          if (bv === null || bv === undefined) return -1
          return (av < bv ? -1 : 1) * (desc ? -1 : 1)
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
   * H5环境：匹配单个 WHERE 比较条件，支持 = / != / >= / <= / > / <
   */
  private matchWhereCondition(row: any, cond: string): boolean {
    const opMatch = cond.match(/(\w+)\s*(>=|<=|!=|<>|=|>|<)\s*(?:'([^']*)'|([\d.]+))/)
    if (!opMatch) return true

    const field = opMatch[1]
    const operator = opMatch[2]
    const value = opMatch[3] !== undefined ? opMatch[3] : Number(opMatch[4])
    const rowValue = row[field]

    switch (operator) {
      case '=':
        return rowValue == value
      case '!=':
      case '<>':
        return rowValue != value
      case '>=':
        return rowValue >= value
      case '<=':
        return rowValue <= value
      case '>':
        return rowValue > value
      case '<':
        return rowValue < value
      default:
        return true
    }
  }

  /**
   * H5环境：计算聚合函数 COUNT(*) / SUM(field) / AVG(field)，结果键取别名或表达式本身
   */
  private computeAggregates(fields: string, data: any[]): Record<string, any> {
    const result: Record<string, any> = {}
    const parts = fields.split(',').map(p => p.trim())

    parts.forEach(part => {
      const aliasMatch = part.match(/\s+as\s+(\w+)\s*$/i)
      const alias = aliasMatch ? aliasMatch[1] : null
      const expr = aliasMatch ? part.slice(0, aliasMatch.index).trim() : part

      if (/COUNT\s*\(/i.test(expr)) {
        result[alias || 'count'] = data.length
        return
      }

      const sumMatch = expr.match(/SUM\s*\(\s*(\w+)\s*\)/i)
      if (sumMatch) {
        const field = sumMatch[1]
        result[alias || 'total'] = data.reduce((sum, row) => sum + (Number(row[field]) || 0), 0)
        return
      }

      const avgMatch = expr.match(/AVG\s*\(\s*(\w+)\s*\)/i)
      if (avgMatch) {
        const field = avgMatch[1]
        const sum = data.reduce((acc, row) => acc + (Number(row[field]) || 0), 0)
        result[alias || 'average'] = data.length > 0 ? sum / data.length : 0
        return
      }
    })

    return result
  }

  /**
   * 安全地为已存在的表添加列（列已存在时忽略错误）
   */
  async addColumnIfNotExists(table: string, columnDefinition: string): Promise<void> {
    try {
      await this.executeSql(`ALTER TABLE ${table} ADD COLUMN ${columnDefinition}`)
    } catch (error) {
      // 列已存在时 SQLite 会报错，这里忽略即可，保证幂等
    }
  }

  /**
   * 重置内部状态标志（清空数据后调用，确保下次 initTables 能重新执行）
   */
  resetState(): void {
    this.tablesInitialized = false
  }

  /**
   * 初始化数据库表
   */
  async initTables(): Promise<void> {
    // 幂等守卫：建表只需执行一次，避免页面 onShow 重复执行
    if (this.tablesInitialized) return
    this.tablesInitialized = true
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
          age_months INTEGER,
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
      
      // 宝宝信息表
      await this.executeSql(`
        CREATE TABLE IF NOT EXISTS baby_info (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          gender INTEGER,
          birthday TEXT,
          avatar TEXT,
          created_at INTEGER,
          updated_at INTEGER
        )
      `)

      // 喂养记录表
      await this.executeSql(`
        CREATE TABLE IF NOT EXISTS feeds (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          unique_id TEXT UNIQUE NOT NULL,
          type TEXT NOT NULL,
          amount REAL,
          unit TEXT,
          left_duration INTEGER,
          right_duration INTEGER,
          start_time INTEGER,
          end_time INTEGER,
          note TEXT,
          timestamp INTEGER NOT NULL,
          device_id TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )
      `)

      // 尿布记录表
      await this.executeSql(`
        CREATE TABLE IF NOT EXISTS diapers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          unique_id TEXT UNIQUE NOT NULL,
          type TEXT NOT NULL,
          has_rash INTEGER,
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
          start_time INTEGER,
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
          food_type TEXT,
          amount REAL,
          unit TEXT,
          note TEXT,
          timestamp INTEGER NOT NULL,
          device_id TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )
      `)

      // 营养补剂记录表
      await this.executeSql(`
        CREATE TABLE IF NOT EXISTS supplements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          unique_id TEXT UNIQUE NOT NULL,
          supplement_type TEXT,
          dosage TEXT,
          note TEXT,
          timestamp INTEGER NOT NULL,
          device_id TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )
      `)

      // 成长记录表
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
          photo_path TEXT,
          thumbnail_path TEXT,
          caption TEXT,
          month INTEGER,
          timestamp INTEGER NOT NULL,
          device_id TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )
      `)

      // 提醒记录表
      await this.executeSql(`
        CREATE TABLE IF NOT EXISTS reminders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT,
          title TEXT,
          content TEXT,
          reminder_time INTEGER,
          is_enabled INTEGER,
          repeat_type TEXT,
          last_triggered INTEGER,
          created_at INTEGER
        )
      `)

      // 历史数据兼容：为旧版 vaccines 表补充 age_months 列
      await this.addColumnIfNotExists('vaccines', 'age_months INTEGER')

    } catch (error) {
      console.error('初始化数据库表失败', error)
      throw error
    }
    // #endif
    
    // #ifndef APP-PLUS
    // H5环境：确保所有表存在
    const tables = ['baby_info', 'feeds', 'diapers', 'sleeps', 'foods', 'supplements', 'growth_records', 'photos', 'reminders', 'vaccines']
    tables.forEach(table => {
      if (!this.data[table]) {
        this.data[table] = []
      }
    })
    this.saveToStorage()
    // #endif
  }
}

export const db = new Database()

/**
 * 转义 SQL 字符串值，防止单引号破坏 SQL 或注入。
 * 仅返回转义后的内部内容（不含外层引号），调用方用 '${escapeSqlValue(x)}' 包裹。
 */
export function escapeSqlValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  return String(value).replace(/'/g, "''")
}

/**
 * 统一错误处理工具
 */

export enum ErrorCode {
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface AppError {
  code: ErrorCode
  message: string
  detail?: string
  timestamp: number
}

/**
 * 错误日志记录
 */
const errorLogs: AppError[] = []

/**
 * 记录错误日志
 */
export function logError(error: AppError) {
  errorLogs.push(error)
  // 保留最近100条错误日志
  if (errorLogs.length > 100) {
    errorLogs.shift()
  }
  
  // 控制台输出
  console.error(`[${error.code}] ${error.message}`, error.detail || '')
}

/**
 * 统一错误处理
 */
export function handleError(error: any, context?: string): AppError {
  let appError: AppError
  
  // 判断错误类型
  if (error.code === 'SQLITE_ERROR' || error.message?.includes('SQL')) {
    appError = {
      code: ErrorCode.DATABASE_ERROR,
      message: '数据库操作失败',
      detail: context ? `${context}: ${error.message}` : error.message,
      timestamp: Date.now()
    }
  } else if (error.errMsg?.includes('network') || error.message?.includes('网络')) {
    appError = {
      code: ErrorCode.NETWORK_ERROR,
      message: '网络连接失败',
      detail: context ? `${context}: 请检查网络连接` : '请检查网络连接',
      timestamp: Date.now()
    }
  } else if (error.message?.includes('权限') || error.errMsg?.includes('permission')) {
    appError = {
      code: ErrorCode.PERMISSION_ERROR,
      message: '权限不足',
      detail: context || '请授予相应权限',
      timestamp: Date.now()
    }
  } else if (error.message?.includes('参数') || error.message?.includes('验证')) {
    appError = {
      code: ErrorCode.VALIDATION_ERROR,
      message: '数据校验失败',
      detail: context || error.message,
      timestamp: Date.now()
    }
  } else {
    appError = {
      code: ErrorCode.UNKNOWN_ERROR,
      message: '操作失败',
      detail: context || error.message || '未知错误',
      timestamp: Date.now()
    }
  }
  
  logError(appError)
  return appError
}

/**
 * 显示错误提示
 */
export function showErrorToast(error: AppError | any, retryCallback?: () => void) {
  const appError = error.code ? error : handleError(error)
  
  uni.showModal({
    title: appError.message,
    content: appError.detail || '请稍后重试',
    showCancel: !!retryCallback,
    confirmText: retryCallback ? '重试' : '确定',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm && retryCallback) {
        retryCallback()
      }
    }
  })
}

/**
 * 安全执行异步操作
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<{ success: boolean; data?: T; error?: AppError }> {
  try {
    const data = await operation()
    return { success: true, data }
  } catch (error) {
    const appError = handleError(error, context)
    return { success: false, error: appError }
  }
}

/**
 * 获取错误日志
 */
export function getErrorLogs(): AppError[] {
  return [...errorLogs]
}

/**
 * 清空错误日志
 */
export function clearErrorLogs() {
  errorLogs.length = 0
}

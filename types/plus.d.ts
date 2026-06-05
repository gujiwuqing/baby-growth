/**
 * uni-app plus 对象类型声明
 * 仅在 APP-PLUS 环境下可用
 */

declare const plus: {
  sqlite: {
    openDatabase: (options: {
      name: string
      path: string
      success?: () => void
      fail?: (error: any) => void
    }) => void
    closeDatabase: (options: {
      name: string
      success?: () => void
      fail?: (error: any) => void
    }) => void
    executeSql: (options: {
      name: string
      sql: string
      success?: () => void
      fail?: (error: any) => void
    }) => void
    selectSql: (options: {
      name: string
      sql: string
      success?: (data: any[]) => void
      fail?: (error: any) => void
    }) => void
  }
  push: {
    createMessage: (options: {
      content: string
      payload?: string
      cover?: boolean
      success?: () => void
      fail?: (error: any) => void
    }) => void
    addEventListener: (options: {
      type: string
      success?: (event: any) => void
      fail?: (error: any) => void
    }) => void
    getAllMessage: () => any[]
    removeMessage: (options: {
      id: string
      success?: () => void
      fail?: (error: any) => void
    }) => void
    setAutoNotification: (auto: boolean) => void
  }
  io: {
    resolveLocalFileSystemURL: (url: string, success: (entry: any) => void, fail?: (error: any) => void) => void
  }
  gallery: {
    save: (options: {
      path: string
      success?: () => void
      fail?: (error: any) => void
    }) => void
  }
  camera: {
    captureImage: (options: {
      success?: (event: any) => void
      fail?: (error: any) => void
    }) => void
  }
  runtime: {
    getArguments: () => string
  }
  storage: {
    getItem: (key: string) => string | null
    setItem: (key: string, value: string) => void
    removeItem: (key: string) => void
    clear: () => void
    getLength: () => number
    key: (index: number) => string | null
  }
  nativeUI: {
    showWaiting: (title?: string, options?: any) => void
    closeWaiting: () => void
    toast: (options: {
      message: string
      duration?: string
    }) => void
  }
}

declare const uni: {
  navigateTo: (options: { url: string }) => void
  navigateBack: (options?: { delta?: number }) => void
  redirectTo: (options: { url: string }) => void
  reLaunch: (options: { url: string }) => void
  switchTab: (options: { url: string }) => void
  showToast: (options: { title: string; icon?: string; duration?: number }) => void
  hideToast: () => void
  showLoading: (options: { title: string }) => void
  hideLoading: () => void
  showModal: (options: {
    title?: string
    content: string
    showCancel?: boolean
    cancelText?: string
    confirmText?: string
    success?: (res: { confirm: boolean; cancel: boolean }) => void
  }) => void
  setNavigationBarTitle: (options: { title: string }) => void
  getStorageSync: (key: string) => any
  setStorageSync: (key: string, data: any) => void
  removeStorageSync: (key: string) => void
  clearStorageSync: () => void
}

declare module '@dcloudio/uni-app' {
  export function onLoad(callback: (options?: any) => void): void
  export function onShow(callback: () => void): void
  export function onReady(callback: () => void): void
  export function onHide(callback: () => void): void
  export function onUnload(callback: () => void): void
  export function onBackPress(callback: () => boolean): void
}

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $scope: any
  }
}
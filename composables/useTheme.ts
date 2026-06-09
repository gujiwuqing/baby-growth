import { ref, computed, watch } from 'vue'

/** 主题色定义 */
export interface ThemePreset {
  key: string
  name: string
  /** 主色 */
  primary: string
  /** 浅色（渐变终点） */
  primaryLight: string
  /** 极浅色（渐变终点2） */
  primaryLighter: string
  /** 导航栏背景色 */
  navBg: string
}

/** 6 种预设主题 */
export const THEME_PRESETS: ThemePreset[] = [
  {
    key: 'coral',
    name: '珊瑚粉',
    primary: '#E8857A',
    primaryLight: '#F2A89E',
    primaryLighter: '#F7C4BA',
    navBg: '#E8857A'
  },
  {
    key: 'lavender',
    name: '薰衣草紫',
    primary: '#9B8EC4',
    primaryLight: '#B5AAD6',
    primaryLighter: '#D0C8E6',
    navBg: '#9B8EC4'
  },
  {
    key: 'mint',
    name: '薄荷绿',
    primary: '#6BAF92',
    primaryLight: '#8CC5AA',
    primaryLighter: '#B0D9C6',
    navBg: '#6BAF92'
  },
  {
    key: 'sky',
    name: '天空蓝',
    primary: '#6BA3C9',
    primaryLight: '#8DBAD8',
    primaryLighter: '#B3D2E6',
    navBg: '#6BA3C9'
  },
  {
    key: 'sunset',
    name: '暖阳橙',
    primary: '#D4956B',
    primaryLight: '#E0B08E',
    primaryLighter: '#EBC9B0',
    navBg: '#D4956B'
  },
  {
    key: 'sakura',
    name: '樱花粉',
    primary: '#D4849B',
    primaryLight: '#E0A0B3',
    primaryLighter: '#EBC0CD',
    navBg: '#D4849B'
  }
]

const STORAGE_KEY = 'baby_growth_theme'
const DEFAULT_THEME_KEY = 'coral'

/** 当前激活的主题 key */
const activeThemeKey = ref<string>(DEFAULT_THEME_KEY)

/** 当前主题对象 */
const activeTheme = computed<ThemePreset>(() => {
  return THEME_PRESETS.find(t => t.key === activeThemeKey.value) || THEME_PRESETS[0]
})

/** 将主题色注入到页面 CSS 变量 */
const applyThemeToPage = (theme: ThemePreset) => {
  // 设置导航栏颜色
  uni.setNavigationBarColor({
    frontColor: '#ffffff',
    backgroundColor: theme.navBg,
    animation: { duration: 200, timingFunc: 'easeIn' }
  })
}

/** 加载已保存的主题 */
const loadTheme = () => {
  try {
    const saved = uni.getStorageSync(STORAGE_KEY)
    if (saved && THEME_PRESETS.some(t => t.key === saved)) {
      activeThemeKey.value = saved
    }
  } catch {
    activeThemeKey.value = DEFAULT_THEME_KEY
  }
}

/** 切换主题 */
const setTheme = (themeKey: string) => {
  const preset = THEME_PRESETS.find(t => t.key === themeKey)
  if (!preset) return

  activeThemeKey.value = themeKey
  uni.setStorageSync(STORAGE_KEY, themeKey)
  applyThemeToPage(preset)
}

/** 获取当前主题的 CSS 内联变量（用于动态绑定 :style） */
const themeVars = computed(() => {
  const t = activeTheme.value
  return {
    '--primary-color': t.primary,
    '--primary-light': t.primaryLight,
    '--primary-gradient': `linear-gradient(135deg, ${t.primary} 0%, ${t.primaryLight} 50%, ${t.primaryLighter} 100%)`,
    '--primary-gradient-h': `linear-gradient(90deg, ${t.primary} 0%, ${t.primaryLight} 100%)`,
    '--primary-shadow': hexToRgba(t.primary, 0.25),
    '--primary-shadow-light': hexToRgba(t.primary, 0.1),
    '--primary-bg': hexToRgba(t.primary, 0.08),
    '--card-shadow': `0 4rpx 24rpx ${hexToRgba(t.primary, 0.08)}`
  }
})

/** hex 转 rgba */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** 初始化（App.vue 调用） */
const initTheme = () => {
  loadTheme()
  applyThemeToPage(activeTheme.value)
}

export function useTheme() {
  return {
    activeThemeKey,
    activeTheme,
    themeVars,
    setTheme,
    initTheme,
    THEME_PRESETS
  }
}

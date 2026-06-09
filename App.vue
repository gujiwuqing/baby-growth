<script lang="ts">
import { db } from './utils/database'
import { useTheme } from './composables/useTheme'

export default {
  onLaunch: async function() {
    console.log('App Launch')
    
    // 初始化主题
    const { initTheme } = useTheme()
    initTheme()
    
    // 初始化数据库
    try {
      console.log('开始初始化数据库...')
      await db.open()
      await db.initTables()
      console.log('数据库初始化完成')
    } catch (error) {
      console.error('数据库初始化失败:', error)
      uni.showToast({
        title: '数据库初始化失败',
        icon: 'none',
        duration: 3000
      })
    }
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  }
}
</script>

<style>
/* 全局样式 */
page {
  background-color: #FDF6F0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 隐藏原生 tabbar，使用自定义 CustomTabBar */
.uni-tabbar-bottom {
  display: none !important;
}

/* 全局颜色变量 — Soft Cream 体系 */
:root {
  --primary-color: #E8857A;
  --primary-light: #F2A89E;
  --primary-gradient: linear-gradient(135deg, #E8857A 0%, #F2A89E 50%, #F7C4BA 100%);
  --accent-lavender: #B8A9D4;
  --accent-mint: #8CC9B0;
  --accent-peach: #F5C5A3;
  --accent-sky: #9DC4E0;
  --background-color: #FDF6F0;
  --card-color: #FFFFFF;
  --card-shadow: 0 4rpx 24rpx rgba(232, 133, 122, 0.08);
  --card-shadow-hover: 0 8rpx 32rpx rgba(232, 133, 122, 0.15);
  --card-radius: 28rpx;
  --text-color: #3D3036;
  --text-secondary: #8A7E84;
  --text-tertiary: #BDB2B7;
  --border-color: #F0E6E0;
  --divider-color: #F8F0EC;
}
</style>

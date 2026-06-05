<script lang="ts">
import { db } from './utils/database'

export default {
  onLaunch: async function() {
    console.log('App Launch')
    
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
  background-color: #FFF5F7;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 全局颜色变量 */
:root {
  --primary-color: #FF9EC4;
  --secondary-color: #A8E6CF;
  --background-color: #FFF5F7;
  --text-color: #333333;
  --text-secondary: #666666;
  --border-color: #E5E5E5;
}
</style>

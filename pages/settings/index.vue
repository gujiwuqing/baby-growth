<template>
  <view class="mine-page" :style="themeVars">
    <!-- 自定义顶部导航栏 -->
    <view class="custom-nav" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content">
        <text class="nav-title">我的</text>
      </view>
    </view>

    <!-- 宝宝信息头部卡片 -->
    <view class="profile-header" :style="{ paddingTop: (statusBarHeight + 44) + 'px' }">
      <view class="profile-card" @click="goProfile">
        <view class="profile-avatar">
          <text class="avatar-emoji">{{ babyInfo.gender === 0 ? '👧' : '👦' }}</text>
        </view>
        <view class="profile-info">
          <text class="profile-name">{{ babyInfo.name || '点击设置宝宝信息' }}</text>
          <text class="profile-detail" v-if="babyInfo.birthday">{{ monthAge }} · {{ babyInfo.gender === 1 ? '男宝' : '女宝' }}</text>
          <text class="profile-detail" v-else>尚未设置出生日期</text>
        </view>
        <text class="profile-arrow">›</text>
      </view>
    </view>

    <!-- 功能列表 -->
    <view class="section-group">
      <view class="section-title">数据管理</view>
      <view class="menu-card">
        <view class="menu-item" @click="exportData">
          <view class="menu-icon-wrap" style="background: rgba(140, 201, 176, 0.12);">
            <text class="menu-icon">📤</text>
          </view>
          <text class="menu-text">导出数据</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="importData">
          <view class="menu-icon-wrap" style="background: rgba(157, 196, 224, 0.12);">
            <text class="menu-icon">📥</text>
          </view>
          <text class="menu-text">导入数据</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item danger" @click="clearAllData">
          <view class="menu-icon-wrap" style="background: rgba(224, 85, 85, 0.08);">
            <text class="menu-icon">🗑️</text>
          </view>
          <text class="menu-text">清空所有数据</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <view class="section-group">
      <view class="section-title">个性化</view>
      <view class="menu-card">
        <view class="menu-item" @click="showThemePicker = true">
          <view class="menu-icon-wrap" style="background: rgba(184, 169, 212, 0.12);">
            <text class="menu-icon">🎨</text>
          </view>
          <text class="menu-text">主题色</text>
          <view class="menu-right">
            <view class="theme-dot" :style="{ background: activeTheme.primary }"></view>
            <text class="menu-arrow">›</text>
          </view>
        </view>
      </view>
    </view>

    <view class="section-group">
      <view class="section-title">关于</view>
      <view class="menu-card">
        <view class="menu-item">
          <view class="menu-icon-wrap" style="background: rgba(245, 197, 163, 0.12);">
            <text class="menu-icon">📱</text>
          </view>
          <text class="menu-text">当前版本</text>
          <view class="menu-right">
            <text class="menu-value">1.0.0</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 主题色弹窗 -->
    <view class="theme-modal" v-if="showThemePicker" @click.self="showThemePicker = false">
      <view class="theme-modal-content" @click.stop>
        <view class="theme-modal-header">
          <text class="theme-modal-title">选择主题色</text>
          <text class="theme-modal-close" @click="showThemePicker = false">✕</text>
        </view>
        <view class="theme-grid">
          <view
            v-for="preset in THEME_PRESETS"
            :key="preset.key"
            class="theme-item"
            :class="{ active: activeThemeKey === preset.key }"
            @click="onSelectTheme(preset.key)"
          >
            <view class="theme-color" :style="{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.primaryLight})` }">
              <text v-if="activeThemeKey === preset.key" class="theme-check">✓</text>
            </view>
            <text class="theme-name">{{ preset.name }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 自定义 TabBar -->
    <CustomTabBar :current="3" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { db } from '@/utils/database'
import { exportAllData, saveDataToFile } from '@/utils/export'
import { readDataFromFile, importDataWithDedup } from '@/utils/import'
import CustomTabBar from '@/components/CustomTabBar/CustomTabBar.vue'
import { useTheme, THEME_PRESETS } from '@/composables/useTheme'

const { themeVars, activeTheme, activeThemeKey, setTheme, initTheme } = useTheme()

const showThemePicker = ref(false)

const onSelectTheme = (key: string) => {
  setTheme(key)
  showThemePicker.value = false
}

/** 将 uni.showModal 包装为 Promise，兼容 App 端 */
const showConfirm = (title: string, content: string): Promise<boolean> => {
  return new Promise((resolve) => {
    uni.showModal({
      title,
      content,
      success: (res) => resolve(!!res.confirm),
      fail: () => resolve(false)
    })
  })
}

// 状态栏高度
const statusBarHeight = ref(0)

const babyInfo = ref({
  name: '',
  gender: 1,
  birthday: ''
})

const monthAge = computed(() => {
  if (!babyInfo.value.birthday) return ''
  const birth = new Date(babyInfo.value.birthday).getTime()
  const now = Date.now()
  const months = Math.floor((now - birth) / (1000 * 60 * 60 * 24 * 30))
  if (months < 1) return '不足1个月'
  return `${months}个月`
})

const goProfile = () => {
  uni.navigateTo({ url: '/pages/profile/index' })
}

const exportData = async () => {
  try {
    uni.showLoading({ title: '导出中...' })
    const data = await exportAllData()
    const filePath = await saveDataToFile(data)
    uni.hideLoading()
    
    uni.showModal({
      title: '导出成功',
      content: `数据已保存到：${filePath}`,
      showCancel: false
    })
  } catch (error) {
    uni.hideLoading()
    console.error('导出失败', error)
    uni.showToast({ title: '导出失败', icon: 'none' })
  }
}

const importData = () => {
  // #ifdef APP-PLUS
  uni.chooseFile({
    count: 1,
    extension: ['.json'],
    success: async (res) => {
      try {
        uni.showLoading({ title: '导入中...' })
        const data = await readDataFromFile(res.tempFilePaths[0])
        if (!data) {
          uni.hideLoading()
          uni.showToast({ title: '文件格式错误', icon: 'none' })
          return
        }
        const count = await importDataWithDedup(data)
        uni.hideLoading()
        
        uni.showModal({
          title: '导入成功',
          content: `成功导入 ${count} 条记录`,
          showCancel: false
        })
      } catch (error) {
        uni.hideLoading()
        console.error('导入失败', error)
        uni.showToast({ title: '导入失败', icon: 'none' })
      }
    },
    fail: () => {
      uni.showToast({ title: '取消选择', icon: 'none' })
    }
  })
  // #endif
  
  // #ifndef APP-PLUS
  uni.showToast({ title: '此功能仅支持APP端', icon: 'none' })
  // #endif
}

const clearAllData = async () => {
  const confirmed = await showConfirm('确认清空', '此操作将清空所有数据，是否继续？')
  if (!confirmed) return
  
  try {
    await db.executeSql('DELETE FROM feeds')
    await db.executeSql('DELETE FROM diapers')
    await db.executeSql('DELETE FROM sleeps')
    await db.executeSql('DELETE FROM foods')
    await db.executeSql('DELETE FROM supplements')
    await db.executeSql('DELETE FROM growth_records')
    await db.executeSql('DELETE FROM photos')
    await db.executeSql('DELETE FROM vaccines')
    await db.executeSql('DELETE FROM reminders')
    await db.executeSql('DELETE FROM baby_info')
    
    // 重置数据库内部状态，确保下次 initTables 能重新初始化表结构
    db.resetState()
    // 清除疫苗排期同步标记，下次进入疫苗页会重新初始化
    uni.removeStorageSync('vaccine_synced_birthday')
    
    // 重置当前页面表单
    babyInfo.value.name = ''
    babyInfo.value.gender = 1
    babyInfo.value.birthday = ''
    
    uni.showToast({ title: '清空成功', icon: 'success' })
  } catch (error) {
    console.error('清空失败', error)
    uni.showToast({ title: '清空失败', icon: 'none' })
  }
}

onShow(async () => {
  uni.hideTabBar({ animation: false })
  initTheme()

  // 获取状态栏高度
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 0

  try {
    await db.open()
    const result = await db.selectSql('SELECT * FROM baby_info LIMIT 1')
    if (result && result.length > 0) {
      babyInfo.value.name = result[0].name || ''
      babyInfo.value.birthday = result[0].birthday || ''
      if (result[0].gender !== null && result[0].gender !== undefined) {
        babyInfo.value.gender = Number(result[0].gender)
      }
    }
  } catch (error) {
    console.error('加载宝宝信息失败', error)
  }
})
</script>

<style scoped>
.mine-page {
  min-height: 100vh;
  background: var(--background-color, #F5F5F5);
  padding-bottom: 240rpx;
}

/* 自定义导航栏 */
.custom-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--primary-color, #E8857A);
}

.nav-content {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: 1rpx;
}

/* 顶部个人信息卡片 */
.profile-header {
  background: var(--primary-gradient, linear-gradient(135deg, #E8857A 0%, #F2A89E 50%, #F7C4BA 100%));
  padding-bottom: 48rpx;
  position: relative;
}

.profile-header::after {
  content: '';
  position: absolute;
  bottom: -2rpx;
  left: 0;
  right: 0;
  height: 32rpx;
  background: var(--background-color, #F5F5F5);
  border-radius: 32rpx 32rpx 0 0;
}

.profile-card {
  display: flex;
  align-items: center;
  padding: 32rpx 32rpx;
  margin: 0 24rpx;
  transition: opacity 0.15s;
}

.profile-card:active {
  opacity: 0.85;
}

.profile-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  flex-shrink: 0;
  border: 4rpx solid rgba(255, 255, 255, 0.5);
}

.avatar-emoji {
  font-size: 64rpx;
}

.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.profile-name {
  font-size: 36rpx;
  font-weight: 800;
  color: #FFFFFF;
  letter-spacing: 1rpx;
}

.profile-detail {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
}

.profile-arrow {
  font-size: 44rpx;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 300;
}

/* 功能列表分组 */
.section-group {
  margin: 24rpx 24rpx 0;
}

.section-title {
  font-size: 26rpx;
  color: var(--text-tertiary, #999999);
  margin-bottom: 12rpx;
  padding-left: 8rpx;
  font-weight: 500;
}

.menu-card {
  background: var(--card-color, #FFFFFF);
  border-radius: var(--card-radius, 16rpx);
  overflow: hidden;
  box-shadow: var(--card-shadow, 0 2rpx 12rpx rgba(0, 0, 0, 0.06));
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 28rpx 28rpx;
  border-bottom: 1rpx solid var(--divider-color, #F5F5F5);
  transition: background 0.15s;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background: rgba(0, 0, 0, 0.02);
}

.menu-icon-wrap {
  width: 72rpx;
  height: 72rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.menu-icon {
  font-size: 36rpx;
}

.menu-text {
  flex: 1;
  font-size: 30rpx;
  color: var(--text-color, #1A1A1A);
  font-weight: 500;
}

.menu-item.danger .menu-text {
  color: #E05555;
}

.menu-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.menu-value {
  font-size: 28rpx;
  color: var(--text-tertiary, #999999);
}

.menu-arrow {
  font-size: 36rpx;
  color: var(--text-tertiary, #CCCCCC);
  font-weight: 300;
}

.theme-dot {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

/* 主题色弹窗 */
.theme-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.theme-modal-content {
  width: 100%;
  background: var(--card-color, #FFFFFF);
  border-radius: 28rpx 28rpx 0 0;
  padding: 32rpx 32rpx 64rpx;
  padding-bottom: calc(64rpx + env(safe-area-inset-bottom));
}

.theme-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32rpx;
}

.theme-modal-title {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--text-color, #1A1A1A);
}

.theme-modal-close {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: var(--text-tertiary, #999999);
  background: var(--divider-color, #F5F5F5);
  border-radius: 50%;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24rpx;
}

.theme-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 0;
  border-radius: 16rpx;
  transition: all 0.2s;
}

.theme-item.active {
  background: var(--divider-color, #F5F5F5);
}

.theme-color {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  border: 4rpx solid transparent;
}

.theme-item.active .theme-color {
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.8);
}

.theme-check {
  color: #FFFFFF;
  font-size: 32rpx;
  font-weight: 800;
}

.theme-name {
  font-size: 22rpx;
  color: var(--text-secondary, #666666);
  font-weight: 600;
}

.theme-item.active .theme-name {
  color: var(--text-color, #1A1A1A);
  font-weight: 700;
}
</style>

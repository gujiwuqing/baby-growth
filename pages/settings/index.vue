<template>
  <view class="settings-page" :style="themeVars">
    <!-- 宝宝信息 -->
    <view class="settings-card">
      <view class="card-title">宝宝信息</view>
      <view class="form-item">
        <view class="form-label">宝宝姓名</view>
        <input class="form-input" v-model="babyInfo.name" placeholder="请输入宝宝姓名" />
      </view>
      <view class="form-item">
        <view class="form-label">性别</view>
        <view class="gender-selector">
          <view
            class="gender-option"
            :class="{ active: babyInfo.gender === 1 }"
            @click="babyInfo.gender = 1"
          >
            👦 男宝
          </view>
          <view
            class="gender-option"
            :class="{ active: babyInfo.gender === 0 }"
            @click="babyInfo.gender = 0"
          >
            👧 女宝
          </view>
        </view>
      </view>
      <view class="form-item">
        <view class="form-label">出生日期</view>
        <picker mode="date" :value="babyInfo.birthday" @change="onBirthdayChange">
          <view class="form-picker">{{ babyInfo.birthday || '选择出生日期' }}</view>
        </picker>
      </view>
      <button class="btn-save" @click="saveBabyInfo">保存</button>
    </view>

    <!-- 数据管理 -->
    <view class="settings-card">
      <view class="card-title">数据管理</view>
      <view class="action-item" @click="exportData">
        <view class="action-icon">📤</view>
        <view class="action-text">导出数据</view>
      </view>
      <view class="action-item" @click="importData">
        <view class="action-icon">📥</view>
        <view class="action-text">导入数据</view>
      </view>
      <view class="action-item danger" @click="clearAllData">
        <view class="action-icon">🗑️</view>
        <view class="action-text">清空所有数据</view>
      </view>
    </view>

    <!-- 主题色选择 -->
    <view class="settings-card">
      <view class="card-title">主题色</view>
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

    <!-- 自定义 TabBar -->
    <CustomTabBar :current="3" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { db, escapeSqlValue } from '@/utils/database'
import { exportAllData, saveDataToFile } from '@/utils/export'
import { readDataFromFile, importDataWithDedup } from '@/utils/import'
import CustomTabBar from '@/components/CustomTabBar/CustomTabBar.vue'
import { useTheme, THEME_PRESETS } from '@/composables/useTheme'

const { themeVars, activeThemeKey, setTheme, initTheme } = useTheme()

const onSelectTheme = (key: string) => {
  setTheme(key)
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

const babyInfo = ref({
  name: '',
  gender: 1,
  birthday: ''
})

const onBirthdayChange = (e: any) => {
  babyInfo.value.birthday = e.detail.value
}

const saveBabyInfo = async () => {
  if (!babyInfo.value.name || !babyInfo.value.name.trim()) {
    uni.showToast({ title: '请输入宝宝姓名', icon: 'none' })
    return
  }
  if (!babyInfo.value.birthday) {
    uni.showToast({ title: '请选择出生日期', icon: 'none' })
    return
  }

  try {
    const existing = await db.selectSql('SELECT id FROM baby_info LIMIT 1')
    
    if (existing && existing.length > 0) {
      await db.executeSql(`
        UPDATE baby_info 
        SET name = '${escapeSqlValue(babyInfo.value.name)}', 
            gender = ${babyInfo.value.gender},
            birthday = '${escapeSqlValue(babyInfo.value.birthday)}',
            updated_at = ${Date.now()}
        WHERE id = ${existing[0].id}
      `)
    } else {
      const timestamp = Date.now()
      await db.executeSql(`
        INSERT INTO baby_info (name, gender, birthday, created_at, updated_at)
        VALUES ('${escapeSqlValue(babyInfo.value.name)}', ${babyInfo.value.gender}, '${escapeSqlValue(babyInfo.value.birthday)}', ${timestamp}, ${timestamp})
      `)
    }
    
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (error) {
    console.error('保存失败', error)
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
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
  initTheme()
  try {
    await db.open()
    const result = await db.selectSql('SELECT * FROM baby_info LIMIT 1')
    if (result && result.length > 0) {
      babyInfo.value.name = result[0].name
      babyInfo.value.birthday = result[0].birthday
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
.settings-page {
  min-height: 100vh;
  background: var(--background-color, #FDF6F0);
  padding: 30rpx;
}

.settings-card {
  background: var(--card-color, #FFFFFF);
  border-radius: var(--card-radius, 28rpx);
  padding: 36rpx;
  margin-bottom: 24rpx;
  box-shadow: var(--card-shadow, 0 4rpx 24rpx rgba(232, 133, 122, 0.08));
}

.card-title {
  font-size: 32rpx;
  font-weight: 800;
  color: var(--text-color, #3D3036);
  margin-bottom: 30rpx;
  letter-spacing: 0.5rpx;
  position: relative;
  padding-left: 4rpx;
}

.card-title::after {
  content: '';
  position: absolute;
  left: 4rpx;
  bottom: -8rpx;
  width: 48rpx;
  height: 6rpx;
  background: var(--primary-gradient, linear-gradient(90deg, #E8857A, #F2A89E));
  border-radius: 3rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  font-size: 28rpx;
  color: var(--text-secondary, #8A7E84);
  margin-bottom: 16rpx;
  font-weight: 600;
}

.form-input {
  width: 100%;
  padding: 24rpx;
  border: 2rpx solid var(--border-color, #F0E6E0);
  border-radius: 20rpx;
  font-size: 28rpx;
  color: var(--text-color, #3D3036);
  background: linear-gradient(135deg, #FEFCFA 0%, #FDF6F0 100%);
  transition: border-color 0.2s;
}

.form-picker {
  padding: 24rpx;
  border: 2rpx solid var(--border-color, #F0E6E0);
  border-radius: 20rpx;
  font-size: 28rpx;
  color: var(--text-color, #3D3036);
  background: linear-gradient(135deg, #FEFCFA 0%, #FDF6F0 100%);
}

.gender-selector {
  display: flex;
  gap: 20rpx;
}

.gender-option {
  flex: 1;
  padding: 24rpx;
  text-align: center;
  border: 2rpx solid var(--border-color, #F0E6E0);
  border-radius: 20rpx;
  font-size: 28rpx;
  color: var(--text-secondary, #8A7E84);
  background: linear-gradient(135deg, #FEFCFA 0%, #FDF6F0 100%);
  transition: all 0.25s;
  font-weight: 600;
}

.gender-option.active {
  background: linear-gradient(135deg, rgba(232, 133, 122, 0.08) 0%, rgba(242, 168, 158, 0.12) 100%);
  border-color: var(--primary-color, #E8857A);
  color: var(--primary-color, #E8857A);
  box-shadow: 0 4rpx 16rpx rgba(232, 133, 122, 0.12);
}

.btn-save {
  width: 100%;
  padding: 26rpx 0;
  background: var(--primary-gradient, linear-gradient(135deg, #E8857A 0%, #F2A89E 50%, #F7C4BA 100%));
  border-radius: 50rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #FFFFFF;
  margin-top: 24rpx;
  border: none;
  box-shadow: 0 8rpx 28rpx rgba(232, 133, 122, 0.3);
  letter-spacing: 1rpx;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-save:active {
  transform: scale(0.97);
  box-shadow: 0 4rpx 16rpx rgba(232, 133, 122, 0.2);
}

.action-item {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1px solid var(--divider-color, #F8F0EC);
  transition: background 0.2s;
}

.action-item:last-child {
  border-bottom: none;
}

.action-item:active {
  background: rgba(253, 246, 240, 0.6);
  border-radius: 16rpx;
}

.action-item.danger .action-text {
  color: #E05555;
}

.action-icon {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  margin-right: 20rpx;
  background: var(--divider-color, #F8F0EC);
  border-radius: 20rpx;
  flex-shrink: 0;
}

.action-text {
  font-size: 28rpx;
  color: var(--text-color, #3D3036);
  font-weight: 600;
}

/* 主题色选择器 */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24rpx;
}

.theme-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 0;
  border-radius: 20rpx;
  transition: all 0.25s;
}

.theme-item.active {
  background: var(--divider-color, #F8F0EC);
}

.theme-color {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  border: 4rpx solid transparent;
}

.theme-item.active .theme-color {
  transform: scale(1.1);
  box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.15);
  border-color: rgba(255, 255, 255, 0.8);
}

.theme-item:active .theme-color {
  transform: scale(0.92);
}

.theme-check {
  color: #FFFFFF;
  font-size: 32rpx;
  font-weight: 800;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
}

.theme-name {
  font-size: 22rpx;
  color: var(--text-secondary, #8A7E84);
  font-weight: 600;
}

.theme-item.active .theme-name {
  color: var(--text-color, #3D3036);
  font-weight: 700;
}
</style>

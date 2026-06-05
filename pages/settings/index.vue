<template>
  <view class="settings-page">
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
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { db, escapeSqlValue } from '@/utils/database'
import { exportAllData, saveDataToFile } from '@/utils/export'
import { readDataFromFile, importDataWithDedup } from '@/utils/import'

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

const clearAllData = () => {
  uni.showModal({
    title: '确认清空',
    content: '此操作将清空所有数据，是否继续？',
    success: async (res) => {
      if (res.confirm) {
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
    }
  })
}

onShow(async () => {
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
  background: #FFF5F7;
  padding: 30rpx;
}

.settings-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 30rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  font-size: 28rpx;
  color: #666666;
  margin-bottom: 20rpx;
}

.form-input {
  width: 100%;
  padding: 24rpx;
  border: 1px solid #E5E5E5;
  border-radius: 16rpx;
  font-size: 28rpx;
}

.form-picker {
  padding: 24rpx;
  border: 1px solid #E5E5E5;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #333333;
}

.gender-selector {
  display: flex;
  gap: 20rpx;
}

.gender-option {
  flex: 1;
  padding: 24rpx;
  text-align: center;
  border: 1px solid #E5E5E5;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #666666;
}

.gender-option.active {
  background: #FFF0F5;
  border-color: #FF9EC4;
  color: #FF4D88;
}

.btn-save {
  width: 100%;
  padding: 24rpx 0;
  background: #FF9EC4;
  border-radius: 50rpx;
  font-size: 32rpx;
  color: #FFFFFF;
  margin-top: 20rpx;
}

.action-item {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1px solid #F5F5F5;
}

.action-item:last-child {
  border-bottom: none;
}

.action-item.danger .action-text {
  color: #FF4444;
}

.action-icon {
  font-size: 48rpx;
  margin-right: 24rpx;
}

.action-text {
  font-size: 28rpx;
  color: #333333;
}
</style>

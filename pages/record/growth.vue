<template>
  <view class="growth-page">
    <view class="form-section">
      <view class="form-item">
        <view class="form-label">身高 (cm)</view>
        <input 
          class="form-input"
          
          v-model="formData.height"
          placeholder="请输入身高"
        />
      </view>

      <view class="form-item">
        <view class="form-label">体重 (kg)</view>
        <input 
          class="form-input"
          
          v-model="formData.weight"
          placeholder="请输入体重"
        />
      </view>

      <view class="form-item">
        <view class="form-label">头围 (cm)</view>
        <input 
          class="form-input"
          
          v-model="formData.headCircumference"
          placeholder="请输入头围"
        />
      </view>

      <view class="form-item">
        <view class="form-label">记录日期</view>
        <picker 
          mode="date" 
          :value="formData.date"
          @change="onDateChange"
        >
          <view class="form-picker">{{ formData.date || '选择日期' }}</view>
        </picker>
      </view>

      <view class="form-item">
        <view class="form-label">备注</view>
        <textarea 
          class="form-textarea"
          v-model="formData.note"
          placeholder="记录成长情况..."
        />
      </view>
    </view>

    <view class="form-actions">
      <button class="btn-cancel" @click="handleCancel">取消</button>
      <button class="btn-save" @click="handleSave">保存</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { db } from '@/utils/database'
import { getDeviceId, formatTime } from '@/utils/device'

const formData = ref({
  height: '',
  weight: '',
  headCircumference: '',
  date: formatTime(Date.now(), 'YYYY-MM-DD'),
  note: ''
})

const onDateChange = (e: any) => {
  formData.value.date = e.detail.value
}

const handleCancel = () => {
  uni.reLaunch({ url: '/pages/index/index' })
}

const handleSave = async () => {
  if (!formData.value.height && !formData.value.weight && !formData.value.headCircumference) {
    uni.showToast({ title: '请至少填写一项指标', icon: 'none' })
    return
  }

  try {
    const timestamp = Date.now()
    const uniqueId = `${timestamp}_growth_${getDeviceId()}`
    
    await db.executeSql(`
      INSERT INTO growth_records (unique_id, height, weight, head_circumference, note, timestamp, device_id, created_at)
      VALUES (
        '${uniqueId}', 
        ${formData.value.height || 'NULL'}, 
        ${formData.value.weight || 'NULL'}, 
        ${formData.value.headCircumference || 'NULL'},
        '${formData.value.note}', 
        ${timestamp}, 
        '${getDeviceId()}', 
        ${timestamp}
      )
    `)

    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('保存失败', error)
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}
</script>

<style scoped>
.growth-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding: 15px;
}

.form-section {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  font-size: 14px;
  color: #666666;
  margin-bottom: 10px;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
}

.form-picker {
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  color: #333333;
}

.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-cancel {
  flex: 1;
  padding: 10px 0;
  border: 1px solid #E5E5E5;
  border-radius: 20px;
  background: #FFFFFF;
  font-size: 14px;
  color: #666666;
}

.btn-save {
  flex: 1;
  padding: 10px 0;
  border-radius: 20px;
  background: #FF9EC4;
  font-size: 14px;
  color: #FFFFFF;
}
</style>

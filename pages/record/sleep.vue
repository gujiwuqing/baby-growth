<template>
  <view class="sleep-page">
    <view class="form-section">
      <view class="form-item">
        <view class="form-label">入睡时间</view>
        <picker 
          mode="time" 
          :value="formData.startTime"
          @change="onStartTimeChange"
        >
          <view class="form-picker">{{ formData.startTime || '选择入睡时间' }}</view>
        </picker>
      </view>

      <view class="form-item">
        <view class="form-label">醒来时间</view>
        <picker 
          mode="time" 
          :value="formData.endTime"
          @change="onEndTimeChange"
        >
          <view class="form-picker">{{ formData.endTime || '选择醒来时间（可选）' }}</view>
        </picker>
      </view>

      <view class="form-item" v-if="duration">
        <view class="form-label">睡眠时长</view>
        <view class="duration-display">
          <text class="duration-value">{{ duration }}</text>
        </view>
      </view>

      <view class="form-item">
        <view class="form-label">备注</view>
        <textarea 
          class="form-textarea"
          v-model="formData.note"
          placeholder="记录睡眠质量..."
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
import { ref, computed } from 'vue'
import { db } from '@/utils/database'
import { getDeviceId, formatTime } from '@/utils/device'

const formData = ref({
  startTime: formatTime(Date.now(), 'HH:mm'),
  endTime: '',
  note: ''
})

const duration = computed(() => {
  if (!formData.value.startTime || !formData.value.endTime) return null
  
  const start = formData.value.startTime.split(':')
  const end = formData.value.endTime.split(':')
  
  const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1])
  const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1])
  
  let diff = endMinutes - startMinutes
  if (diff < 0) diff += 24 * 60
  
  const hours = Math.floor(diff / 60)
  const minutes = diff % 60
  
  return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`
})

const onStartTimeChange = (e: any) => {
  formData.value.startTime = e.detail.value
}

const onEndTimeChange = (e: any) => {
  formData.value.endTime = e.detail.value
}

const handleCancel = () => {
  uni.reLaunch({ url: '/pages/index/index' })
}

const handleSave = async () => {
  if (!formData.value.startTime) {
    uni.showToast({ title: '请选择入睡时间', icon: 'none' })
    return
  }

  try {
    const timestamp = Date.now()
    const uniqueId = `${timestamp}_sleep_${getDeviceId()}`
    
    const startParts = formData.value.startTime.split(':')
    const startTimestamp = new Date()
    startTimestamp.setHours(parseInt(startParts[0]), parseInt(startParts[1]), 0, 0)
    
    let endTimestamp = null
    let durationValue = null
    
    if (formData.value.endTime) {
      const endParts = formData.value.endTime.split(':')
      endTimestamp = new Date()
      endTimestamp.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0, 0)
      
      const diff = endTimestamp.getTime() - startTimestamp.getTime()
      durationValue = diff > 0 ? diff : diff + 24 * 60 * 60 * 1000
    }
    
    await db.executeSql(`
      INSERT INTO sleeps (unique_id, start_time, end_time, duration, note, device_id, created_at)
      VALUES (
        '${uniqueId}', 
        ${startTimestamp.getTime()}, 
        ${endTimestamp ? endTimestamp.getTime() : 'NULL'}, 
        ${durationValue ? durationValue : 'NULL'},
        '${formData.value.note}', 
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
.sleep-page {
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

.form-picker {
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  color: #333333;
}

.duration-display {
  padding: 15px;
  background: #FFF5F7;
  border-radius: 8px;
  text-align: center;
}

.duration-value {
  font-size: 24px;
  font-weight: bold;
  color: #FF9EC4;
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

<template>
  <view class="supplement-page">
    <view class="form-section">
      <view class="form-item">
        <view class="form-label">补充类型</view>
        <view class="type-selector">
          <view 
            class="type-option"
            :class="{ active: formData.type === 'vitamin_ad' }"
            @click="formData.type = 'vitamin_ad'"
          >
            AD滴剂
          </view>
          <view 
            class="type-option"
            :class="{ active: formData.type === 'probiotics' }"
            @click="formData.type = 'probiotics'"
          >
            益生菌
          </view>
          <view 
            class="type-option"
            :class="{ active: formData.type === 'other' }"
            @click="formData.type = 'other'"
          >
            其他
          </view>
        </view>
      </view>

      <view class="form-item">
        <view class="form-label">剂量</view>
        <input 
          class="form-input"
          v-model="formData.dosage"
          placeholder="如：1粒、5ml..."
        />
      </view>

      <view class="form-item">
        <view class="form-label">服用时间</view>
        <picker 
          mode="time" 
          :value="formData.time"
          @change="onTimeChange"
        >
          <view class="form-picker">{{ formData.time || '选择时间' }}</view>
        </picker>
      </view>

      <view class="form-item">
        <view class="form-label">备注</view>
        <textarea 
          class="form-textarea"
          v-model="formData.note"
          placeholder="记录特殊情况..."
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
  type: 'vitamin_ad',
  dosage: '',
  time: formatTime(Date.now(), 'HH:mm'),
  note: ''
})

const onTimeChange = (e: any) => {
  formData.value.time = e.detail.value
}

const handleCancel = () => {
  uni.reLaunch({ url: '/pages/index/index' })
}

const handleSave = async () => {
  try {
    const timestamp = Date.now()
    const uniqueId = `${timestamp}_supplement_${getDeviceId()}`
    
    await db.executeSql(`
      INSERT INTO supplements (unique_id, supplement_type, dosage, note, timestamp, device_id, created_at)
      VALUES ('${uniqueId}', '${formData.value.type}', '${formData.value.dosage}', '${formData.value.note}', ${timestamp}, '${getDeviceId()}', ${timestamp})
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
.supplement-page {
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

.type-selector {
  display: flex;
  gap: 10px;
}

.type-option {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  color: #666666;
}

.type-option.active {
  background: #FF9EC4;
  border-color: #FF9EC4;
  color: #FFFFFF;
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

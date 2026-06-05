<template>
  <view class="food-page">
    <view class="form-section">
      <view class="form-item">
        <view class="form-label">食物类型</view>
        <input 
          class="form-input"
          v-model="formData.foodType"
          placeholder="如：米糊、果泥、蔬菜泥..."
        />
      </view>

      <view class="form-item">
        <view class="form-label">食物量 (g)</view>
        <input 
          class="form-input"
          type="number"
          v-model="formData.amount"
          placeholder="请输入食物量"
        />
      </view>

      <view class="form-item">
        <view class="form-label">喂养时间</view>
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
          placeholder="记录宝宝对食物的反应..."
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
  foodType: '',
  amount: '',
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
  if (!formData.value.foodType) {
    uni.showToast({ title: '请输入食物类型', icon: 'none' })
    return
  }

  try {
    const timestamp = Date.now()
    const uniqueId = `${timestamp}_food_${getDeviceId()}`
    
    await db.executeSql(`
      INSERT INTO foods (unique_id, food_type, amount, unit, note, timestamp, device_id, created_at)
      VALUES ('${uniqueId}', '${formData.value.foodType}', ${formData.value.amount || 0}, 'g', '${formData.value.note}', ${timestamp}, '${getDeviceId()}', ${timestamp})
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
.food-page {
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

<template>
  <RecordFormShell @save="handleSave" @cancel="cancel">
    <view class="form-item">
      <view class="form-label">食物类型</view>
      <view class="input-wrapper">
        <input 
          class="form-input"
          type="text"
          :value="formData.foodType"
          @input="formData.foodType = $event.detail.value"
          placeholder="如：米糊、果泥、蔬菜泥..."
          :adjust-position="true"
          :always-embed="true"
        />
      </view>
    </view>

    <view class="form-item">
      <view class="form-label">食物量 (g)</view>
      <view class="input-wrapper">
        <input 
          class="form-input"
          type="number"
          :value="formData.amount"
          @input="formData.amount = $event.detail.value"
          placeholder="请输入食物量"
          :adjust-position="true"
          :always-embed="true"
        />
      </view>
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
  </RecordFormShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { db, escapeSqlValue } from '@/utils/database'
import { getDeviceId, formatTime } from '@/utils/device'
import RecordFormShell from '@/components/RecordFormShell/RecordFormShell.vue'
import { useRecordSave } from '@/composables/useRecordSave'

const { timeStrToTimestamp, cancel, save } = useRecordSave('food')

const formData = ref({
  foodType: '',
  amount: '',
  time: formatTime(Date.now(), 'HH:mm'),
  note: ''
})

const onTimeChange = (e: any) => {
  formData.value.time = e.detail.value
}

const handleSave = async () => {
  if (!formData.value.foodType) {
    uni.showToast({ title: '请输入食物类型', icon: 'none' })
    return
  }

  const timestamp = timeStrToTimestamp(formData.value.time)
  const amount = Number(formData.value.amount) || 0

  await save(async ({ createdAt, uniqueId }) => {
    await db.executeSql(`
      INSERT INTO foods (unique_id, food_type, amount, unit, note, timestamp, device_id, created_at)
      VALUES ('${escapeSqlValue(uniqueId)}', '${escapeSqlValue(formData.value.foodType)}', ${amount}, 'g', '${escapeSqlValue(formData.value.note)}', ${timestamp}, '${escapeSqlValue(getDeviceId())}', ${createdAt})
    `)
  })
}
</script>

<style scoped>
.form-item {
  margin-bottom: 40rpx;
  position: relative;
  z-index: 1;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: 28rpx;
  color: #666666;
  margin-bottom: 20rpx;
}

/* 输入框容器 - 确保可交互 */
.input-wrapper {
  position: relative;
  width: 100%;
}

.form-input {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  padding: 0 24rpx;
  border: 1px solid #E5E5E5;
  border-radius: 16rpx;
  font-size: 28rpx;
  background: #FFFFFF;
  box-sizing: border-box;
}
</style>

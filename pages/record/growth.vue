<template>
  <RecordFormShell @save="handleSave" @cancel="cancel">
    <view class="form-item">
      <view class="form-label">身高 (cm)</view>
      <view class="input-wrapper">
        <input 
          class="form-input"
          type="digit"
          :value="formData.height"
          @input="formData.height = $event.detail.value"
          placeholder="请输入身高"
          :adjust-position="true"
          :always-embed="true"
        />
      </view>
    </view>

    <view class="form-item">
      <view class="form-label">体重 (kg)</view>
      <view class="input-wrapper">
        <input 
          class="form-input"
          type="digit"
          :value="formData.weight"
          @input="formData.weight = $event.detail.value"
          placeholder="请输入体重"
          :adjust-position="true"
          :always-embed="true"
        />
      </view>
    </view>

    <view class="form-item">
      <view class="form-label">头围 (cm)</view>
      <view class="input-wrapper">
        <input 
          class="form-input"
          type="digit"
          :value="formData.headCircumference"
          @input="formData.headCircumference = $event.detail.value"
          placeholder="请输入头围"
          :adjust-position="true"
          :always-embed="true"
        />
      </view>
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
  </RecordFormShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { db, escapeSqlValue } from '@/utils/database'
import { getDeviceId, formatTime } from '@/utils/device'
import { useRecordSave } from '@/composables/useRecordSave'
import RecordFormShell from '@/components/RecordFormShell/RecordFormShell.vue'

const { dateStrToTimestamp, cancel, save } = useRecordSave('growth')

// 校验数值字段：为空返回 null（存 NULL），非法返回 NaN（拦截）
const parseNumberField = (val: string, min: number, max: number): number | null => {
  if (val === '' || val === null || val === undefined) return null
  const num = Number(val)
  if (isNaN(num) || num < min || num > max) return NaN
  return num
}

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

const handleSave = () => {
  if (!formData.value.height && !formData.value.weight && !formData.value.headCircumference) {
    uni.showToast({ title: '请至少填写一项指标', icon: 'none' })
    return
  }

  const height = parseNumberField(formData.value.height, 0, 150)
  const weight = parseNumberField(formData.value.weight, 0, 50)
  const headCircumference = parseNumberField(formData.value.headCircumference, 0, 80)

  if (isNaN(height as number) || isNaN(weight as number) || isNaN(headCircumference as number)) {
    uni.showToast({ title: '请输入合理的数值', icon: 'none' })
    return
  }

  save(async ({ createdAt, uniqueId }) => {
    const timestamp = dateStrToTimestamp(formData.value.date)
    
    await db.executeSql(`
      INSERT INTO growth_records (unique_id, height, weight, head_circumference, note, timestamp, device_id, created_at)
      VALUES (
        '${escapeSqlValue(uniqueId)}', 
        ${height === null ? 'NULL' : height}, 
        ${weight === null ? 'NULL' : weight}, 
        ${headCircumference === null ? 'NULL' : headCircumference},
        '${escapeSqlValue(formData.value.note)}', 
        ${timestamp}, 
        '${escapeSqlValue(getDeviceId())}', 
        ${createdAt}
      )
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

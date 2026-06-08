<template>
  <RecordFormShell @save="handleSave" @cancel="cancel">
    <view class="form-item">
      <view class="form-label">身高 (cm)</view>
      <view class="input-wrapper">
        <input 
          class="form-input"
          :class="{ 'input-error': heightError }"
          type="digit"
          :value="formData.height"
          @input="onHeightInput"
          placeholder="请输入身高 (正常范围: 30-120cm)"
          :adjust-position="true"
          :always-embed="true"
        />
        <text v-if="heightError" class="error-tip">{{ heightError }}</text>
      </view>
    </view>

    <view class="form-item">
      <view class="form-label">体重 (kg)</view>
      <view class="input-wrapper">
        <input 
          class="form-input"
          :class="{ 'input-error': weightError }"
          type="digit"
          :value="formData.weight"
          @input="onWeightInput"
          placeholder="请输入体重 (正常范围: 2-25kg)"
          :adjust-position="true"
          :always-embed="true"
        />
        <text v-if="weightError" class="error-tip">{{ weightError }}</text>
      </view>
    </view>

    <view class="form-item">
      <view class="form-label">头围 (cm)</view>
      <view class="input-wrapper">
        <input 
          class="form-input"
          :class="{ 'input-error': headError }"
          type="digit"
          :value="formData.headCircumference"
          @input="onHeadInput"
          placeholder="请输入头围 (正常范围: 30-55cm)"
          :adjust-position="true"
          :always-embed="true"
        />
        <text v-if="headError" class="error-tip">{{ headError }}</text>
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
import { ref, computed } from 'vue'
import { db, escapeSqlValue } from '@/utils/database'
import { getDeviceId, formatTime } from '@/utils/device'
import { useRecordSave } from '@/composables/useRecordSave'
import RecordFormShell from '@/components/RecordFormShell/RecordFormShell.vue'

const { dateStrToTimestamp, cancel, save } = useRecordSave('growth')

const formData = ref({
  height: '',
  weight: '',
  headCircumference: '',
  date: formatTime(Date.now(), 'YYYY-MM-DD'),
  note: ''
})

// 实时校验错误提示
const heightError = ref('')
const weightError = ref('')
const headError = ref('')

// 实时校验身高（正常范围: 30-120cm）
const onHeightInput = (e: any) => {
  formData.value.height = e.detail.value
  const val = e.detail.value
  if (!val) {
    heightError.value = ''
    return
  }
  const num = Number(val)
  if (isNaN(num) || num <= 0) {
    heightError.value = '请输入有效的数值'
  } else if (num < 30) {
    heightError.value = '身高过低，请检查输入'
  } else if (num > 120) {
    heightError.value = '身高过高，请检查输入'
  } else {
    heightError.value = ''
  }
}

// 实时校验体重（正常范围: 2-25kg）
const onWeightInput = (e: any) => {
  formData.value.weight = e.detail.value
  const val = e.detail.value
  if (!val) {
    weightError.value = ''
    return
  }
  const num = Number(val)
  if (isNaN(num) || num <= 0) {
    weightError.value = '请输入有效的数值'
  } else if (num < 2) {
    weightError.value = '体重过低，请检查输入'
  } else if (num > 25) {
    weightError.value = '体重过高，请检查输入'
  } else {
    weightError.value = ''
  }
}

// 实时校验头围（正常范围: 30-55cm）
const onHeadInput = (e: any) => {
  formData.value.headCircumference = e.detail.value
  const val = e.detail.value
  if (!val) {
    headError.value = ''
    return
  }
  const num = Number(val)
  if (isNaN(num) || num <= 0) {
    headError.value = '请输入有效的数值'
  } else if (num < 30) {
    headError.value = '头围过小，请检查输入'
  } else if (num > 55) {
    headError.value = '头围过大，请检查输入'
  } else {
    headError.value = ''
  }
}

// 安全解析数值：空值返回 null，非法值返回 null 并提示
const parseNumberField = (val: string, min: number, max: number): number | null => {
  if (val === '' || val === null || val === undefined) return null
  const num = Number(val)
  if (isNaN(num) || num < min || num > max) return null
  return num
}

const onDateChange = (e: any) => {
  formData.value.date = e.detail.value
}

const handleSave = () => {
  // 检查是否有校验错误
  if (heightError.value || weightError.value || headError.value) {
    uni.showToast({ title: '请修正输入错误', icon: 'none' })
    return
  }

  // 至少填写一项
  if (!formData.value.height && !formData.value.weight && !formData.value.headCircumference) {
    uni.showToast({ title: '请至少填写一项指标', icon: 'none' })
    return
  }

  // 解析数值（空值存为 null，有效值直接存储）
  const height = parseNumberField(formData.value.height, 30, 120)
  const weight = parseNumberField(formData.value.weight, 2, 25)
  const headCircumference = parseNumberField(formData.value.headCircumference, 30, 55)

  // 如果有输入但解析失败，提示错误
  if (formData.value.height && height === null) {
    uni.showToast({ title: '身高数值异常', icon: 'none' })
    return
  }
  if (formData.value.weight && weight === null) {
    uni.showToast({ title: '体重数值异常', icon: 'none' })
    return
  }
  if (formData.value.headCircumference && headCircumference === null) {
    uni.showToast({ title: '头围数值异常', icon: 'none' })
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
  transition: border-color 0.2s;
}

.form-input.input-error {
  border-color: #FF4444;
  background: #FFF5F5;
}

.error-tip {
  display: block;
  font-size: 24rpx;
  color: #FF4444;
  margin-top: 8rpx;
  padding-left: 8rpx;
}
</style>

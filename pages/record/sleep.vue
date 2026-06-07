<template>
  <RecordFormShell @save="handleSave" @cancel="cancel">
    <view class="form-item">
      <view class="form-label">入睡日期</view>
      <picker
        mode="date"
        :value="formData.startDate"
        @change="onStartDateChange"
      >
        <view class="form-picker">{{ formData.startDate || '选择日期' }}</view>
      </picker>
    </view>

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
      <view class="end-time-row">
        <picker 
          mode="time" 
          :value="formData.endTime"
          @change="onEndTimeChange"
          class="end-time-picker"
        >
          <view class="form-picker">{{ formData.endTime || '选择醒来时间（可选）' }}</view>
        </picker>
        <view
          v-if="formData.endTime"
          class="next-day-tag"
          :class="{ active: formData.isNextDay }"
          @click="formData.isNextDay = !formData.isNextDay"
        >次日</view>
      </view>
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
  </RecordFormShell>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { db, escapeSqlValue } from '@/utils/database'
import { getDeviceId, formatTime } from '@/utils/device'
import RecordFormShell from '@/components/RecordFormShell/RecordFormShell.vue'
import { useRecordSave } from '@/composables/useRecordSave'

const { cancel, save } = useRecordSave('sleep')

const formData = ref({
  startDate: formatTime(Date.now(), 'YYYY-MM-DD'),
  startTime: formatTime(Date.now(), 'HH:mm'),
  endTime: '',
  isNextDay: false,
  note: ''
})

const duration = computed(() => {
  if (!formData.value.startTime || !formData.value.endTime) return null
  
  const start = formData.value.startTime.split(':')
  const end = formData.value.endTime.split(':')
  
  const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1])
  const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1])
  
  let diff = endMinutes - startMinutes
  if (formData.value.isNextDay) {
    diff += 24 * 60
  } else if (diff < 0) {
    diff += 24 * 60
  }
  
  const hours = Math.floor(diff / 60)
  const minutes = diff % 60
  
  return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`
})

const onStartDateChange = (e: any) => {
  formData.value.startDate = e.detail.value
}

const onStartTimeChange = (e: any) => {
  formData.value.startTime = e.detail.value
}

const onEndTimeChange = (e: any) => {
  formData.value.endTime = e.detail.value
  // 自动判断是否跨天：如果醒来时间早于入睡时间，默认标记为次日
  if (formData.value.startTime && formData.value.endTime) {
    const startMinutes = parseInt(formData.value.startTime.split(':')[0]) * 60 + parseInt(formData.value.startTime.split(':')[1])
    const endMinutes = parseInt(formData.value.endTime.split(':')[0]) * 60 + parseInt(formData.value.endTime.split(':')[1])
    formData.value.isNextDay = endMinutes < startMinutes
  }
}

const handleSave = async () => {
  if (!formData.value.startTime) {
    uni.showToast({ title: '请选择入睡时间', icon: 'none' })
    return
  }

  await save(async ({ createdAt, uniqueId }) => {
    const dateParts = formData.value.startDate.split('-')
    const startParts = formData.value.startTime.split(':')
    const startTimestamp = new Date(
      parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]),
      parseInt(startParts[0]), parseInt(startParts[1]), 0, 0
    )
    
    let endTimestamp = null
    let durationValue = null
    
    if (formData.value.endTime) {
      const endParts = formData.value.endTime.split(':')
      const endDate = new Date(startTimestamp)
      if (formData.value.isNextDay) {
        endDate.setDate(endDate.getDate() + 1)
      }
      endDate.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0, 0)
      endTimestamp = endDate
      
      const diff = endTimestamp.getTime() - startTimestamp.getTime()
      durationValue = diff > 0 ? diff : diff + 24 * 60 * 60 * 1000
    }
    
    await db.executeSql(`
      INSERT INTO sleeps (unique_id, start_time, end_time, duration, note, device_id, created_at)
      VALUES (
        '${escapeSqlValue(uniqueId)}', 
        ${startTimestamp.getTime()}, 
        ${endTimestamp ? endTimestamp.getTime() : 'NULL'}, 
        ${durationValue ? durationValue : 'NULL'},
        '${escapeSqlValue(formData.value.note)}', 
        '${escapeSqlValue(getDeviceId())}', 
        ${createdAt}
      )
    `)
  })
}
</script>

<style scoped>
.end-time-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.end-time-picker {
  flex: 1;
}

.next-day-tag {
  padding: 12rpx 24rpx;
  border: 1px solid #E5E5E5;
  border-radius: 24rpx;
  font-size: 24rpx;
  color: #999999;
  white-space: nowrap;
  flex-shrink: 0;
}

.next-day-tag.active {
  background: #FF9EC4;
  border-color: #FF9EC4;
  color: #FFFFFF;
  font-weight: bold;
}

.duration-display {
  padding: 30rpx;
  background: #FFF5F7;
  border-radius: 16rpx;
  text-align: center;
}

.duration-value {
  font-size: 48rpx;
  font-weight: bold;
  color: #FF9EC4;
}
</style>

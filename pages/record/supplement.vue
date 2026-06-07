<template>
  <RecordFormShell @save="handleSave" @cancel="cancel">
    <view class="form-item">
      <view class="form-label">补充类型</view>
      <view class="option-row">
        <view 
          class="option-item"
          :class="{ active: formData.type === 'vitamin_ad' }"
          @click="formData.type = 'vitamin_ad'"
        >
          AD滴剂
        </view>
        <view 
          class="option-item"
          :class="{ active: formData.type === 'probiotics' }"
          @click="formData.type = 'probiotics'"
        >
          益生菌
        </view>
        <view 
          class="option-item"
          :class="{ active: formData.type === 'other' }"
          @click="formData.type = 'other'"
        >
          其他
        </view>
      </view>
    </view>

    <view class="form-item">
      <view class="form-label">剂量</view>
      <view class="input-wrapper">
        <input 
          class="form-input"
          type="text"
          :value="formData.dosage"
          @input="formData.dosage = $event.detail.value"
          placeholder="如：1粒、5ml..."
          :adjust-position="true"
          :always-embed="true"
        />
      </view>
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
  </RecordFormShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { db, escapeSqlValue } from '@/utils/database'
import { getDeviceId, formatTime } from '@/utils/device'
import RecordFormShell from '@/components/RecordFormShell/RecordFormShell.vue'
import { useRecordSave } from '@/composables/useRecordSave'

const { timeStrToTimestamp, cancel, save } = useRecordSave('supplement')

const formData = ref({
  type: 'vitamin_ad',
  dosage: '',
  time: formatTime(Date.now(), 'HH:mm'),
  note: ''
})

const onTimeChange = (e: any) => {
  formData.value.time = e.detail.value
}

const handleSave = async () => {
  if (!formData.value.dosage) {
    uni.showToast({ title: '请输入剂量', icon: 'none' })
    return
  }

  await save(async ({ createdAt, uniqueId }) => {
    const timestamp = timeStrToTimestamp(formData.value.time)

    await db.executeSql(`
      INSERT INTO supplements (unique_id, supplement_type, dosage, note, timestamp, device_id, created_at)
      VALUES ('${escapeSqlValue(uniqueId)}', '${escapeSqlValue(formData.value.type)}', '${escapeSqlValue(formData.value.dosage)}', '${escapeSqlValue(formData.value.note)}', ${timestamp}, '${escapeSqlValue(getDeviceId())}', ${createdAt})
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

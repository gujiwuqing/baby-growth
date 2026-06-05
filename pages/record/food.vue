<template>
  <RecordFormShell @save="handleSave" @cancel="cancel">
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
</style>

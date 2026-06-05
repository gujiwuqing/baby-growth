<template>
  <view class="reminder-page">
    <!-- 喂奶提醒 -->
    <view class="reminder-card">
      <view class="card-header">
        <view class="card-title">🍼 喂奶提醒</view>
        <switch 
          :checked="feedingEnabled" 
          @change="toggleFeedingReminder"
          color="#FF9EC4"
        />
      </view>
      <view class="card-content" v-if="feedingEnabled">
        <view class="form-item">
          <view class="form-label">提醒间隔</view>
          <picker 
            :value="feedingIntervalIndex"
            :range="intervalOptions"
            @change="onFeedingIntervalChange"
          >
            <view class="form-picker">{{ intervalOptions[feedingIntervalIndex] }}</view>
          </picker>
        </view>
      </view>
    </view>

    <!-- 疫苗提醒 -->
    <view class="reminder-card">
      <view class="card-header">
        <view class="card-title">💉 疫苗接种提醒</view>
        <switch 
          :checked="vaccineEnabled"
          @change="toggleVaccineReminder"
          color="#FF9EC4"
        />
      </view>
      <view class="card-content" v-if="vaccineEnabled">
        <view class="form-item">
          <view class="form-label">疫苗名称</view>
          <input 
            class="form-input"
            v-model="vaccineName"
            placeholder="如：乙肝疫苗"
          />
        </view>
        <view class="form-item">
          <view class="form-label">接种日期</view>
          <picker 
            mode="date"
            :value="vaccineDate"
            @change="onVaccineDateChange"
          >
            <view class="form-picker">{{ vaccineDate || '选择日期' }}</view>
          </picker>
        </view>
        <button class="btn-add" @click="addVaccineReminder">添加提醒</button>
      </view>
    </view>

    <!-- 提示信息 -->
    <view class="tip-card">
      <view class="tip-title">💡 提示</view>
      <view class="tip-text">提醒功能需要在APP运行时才能生效，建议保持应用后台运行以接收提醒通知。</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { setFeedingReminder, setVaccineReminder } from '@/utils/reminder'

const feedingEnabled = ref(false)
const feedingIntervalIndex = ref(0)
const intervalOptions = ['每2小时', '每3小时', '每4小时', '每5小时']

const vaccineEnabled = ref(false)
const vaccineName = ref('')
const vaccineDate = ref('')

const toggleFeedingReminder = (e: any) => {
  feedingEnabled.value = e.detail.value
  if (feedingEnabled.value) {
    const intervals = [2, 3, 4, 5]
    const hours = intervals[feedingIntervalIndex.value]
    setFeedingReminder(hours * 60 * 60 * 1000)
    uni.showToast({ title: '提醒已开启', icon: 'success' })
  } else {
    uni.showToast({ title: '提醒已关闭', icon: 'none' })
  }
}

const onFeedingIntervalChange = (e: any) => {
  feedingIntervalIndex.value = e.detail.value
  if (feedingEnabled.value) {
    const intervals = [2, 3, 4, 5]
    const hours = intervals[feedingIntervalIndex.value]
    setFeedingReminder(hours * 60 * 60 * 1000)
  }
}

const toggleVaccineReminder = (e: any) => {
  vaccineEnabled.value = e.detail.value
}

const onVaccineDateChange = (e: any) => {
  vaccineDate.value = e.detail.value
}

const addVaccineReminder = () => {
  if (!vaccineName.value || !vaccineDate.value) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }
  
  const timestamp = new Date(vaccineDate.value).getTime()
  setVaccineReminder(vaccineName.value, timestamp)
  
  uni.showToast({ title: '添加成功', icon: 'success' })
  vaccineName.value = ''
  vaccineDate.value = ''
}
</script>

<style scoped>
.reminder-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding: 15px;
}

.reminder-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 15px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
}

.card-content {
  border-top: 1px solid #F5F5F5;
  padding-top: 15px;
}

.form-item {
  margin-bottom: 15px;
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

.btn-add {
  width: 100%;
  padding: 12px 0;
  background: #FF9EC4;
  border-radius: 25px;
  font-size: 16px;
  color: #FFFFFF;
  margin-top: 10px;
}

.tip-card {
  background: #FFF0F5;
  border-radius: 16px;
  padding: 20px;
  border-left: 4px solid #FF9EC4;
}

.tip-title {
  font-size: 14px;
  font-weight: bold;
  color: #FF9EC4;
  margin-bottom: 10px;
}

.tip-text {
  font-size: 12px;
  color: #666666;
  line-height: 1.6;
}
</style>

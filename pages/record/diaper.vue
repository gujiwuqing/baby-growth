<template>
  <RecordFormShell @save="handleSave" @cancel="cancel">
    <view class="form-item">
      <view class="form-label">更换类型</view>
      <view class="option-row">
        <view class="option-item" :class="{ active: formData.type === 'pee' }" @click="formData.type = 'pee'">💧 小便</view>
        <view class="option-item" :class="{ active: formData.type === 'poo' }" @click="formData.type = 'poo'">💩 大便</view>
        <view class="option-item" :class="{ active: formData.type === 'both' }" @click="formData.type = 'both'">💧💩 混合</view>
      </view>
    </view>

    <!-- 是否红屁屁 -->
    <view class="form-item">
      <view class="form-label">是否红屁屁</view>
      <view class="option-row">
        <view class="option-item" :class="{ active: formData.hasRash === false }" @click="formData.hasRash = false">✅ 正常</view>
        <view class="option-item" :class="{ active: formData.hasRash === true }" @click="formData.hasRash = true">🔴 有红屁屁</view>
      </view>
    </view>

    <!-- 大便颜色（仅大便和混合时显示） -->
    <view class="form-item" v-if="formData.type === 'poo' || formData.type === 'both'">
      <view class="form-label">大便颜色</view>
      <scroll-view scroll-x class="color-scroll">
        <view class="color-grid">
          <view
            class="color-option"
            :class="{ active: formData.pooColor === color }"
            v-for="color in pooColors"
            :key="color"
            @click="formData.pooColor = color"
          >{{ color }}</view>
        </view>
      </scroll-view>
    </view>

    <!-- 大便形状（仅大便和混合时显示） -->
    <view class="form-item" v-if="formData.type === 'poo' || formData.type === 'both'">
      <view class="form-label">大便形状</view>
      <scroll-view scroll-y class="shape-scroll">
        <view class="shape-grid">
          <view
            class="shape-option"
            :class="{ active: formData.pooShape === shape }"
            v-for="shape in pooShapes"
            :key="shape"
            @click="formData.pooShape = shape"
          >{{ shape }}</view>
        </view>
      </scroll-view>
    </view>

    <view class="form-item">
      <view class="form-label">更换时间</view>
      <picker mode="time" :value="formData.time" @change="onTimeChange">
        <view class="form-picker">{{ formData.time || '选择时间' }}</view>
      </picker>
    </view>

    <view class="form-item">
      <view class="form-label">备注</view>
      <textarea class="form-textarea" v-model="formData.note" placeholder="记录特殊情况..." />
    </view>
  </RecordFormShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { db, escapeSqlValue } from '@/utils/database'
import { getDeviceId, formatTime } from '@/utils/device'
import { useRecordSave } from '@/composables/useRecordSave'
import RecordFormShell from '@/components/RecordFormShell/RecordFormShell.vue'

const { timeStrToTimestamp, cancel, save } = useRecordSave('diaper')

const formData = ref({
  type: 'pee',
  hasRash: false,
  pooColor: '',
  pooShape: '',
  time: formatTime(Date.now(), 'HH:mm'),
  note: ''
})

const pooColors = [
  '黄色', '黄绿色', '墨绿色', '绿褐色', '淡黄色',
  '暗褐色', '黑色', '绿色', '灰白色', '暗红色',
  '红色', '粉红色'
]

const pooShapes = [
  '糊状', '干稠', '膏状', '奶瓣', '稀水样',
  '泡沫状', '泥土状', '颗粒状', '柏油状', '果酱状',
  '豆腐渣', '蛋花汤样', '鼻涕样黏液', '粘稠像沥青', '粉状'
]

const onTimeChange = (e: any) => {
  formData.value.time = e.detail.value
}

const handleSave = () => {
  const isPoo = formData.value.type === 'poo' || formData.value.type === 'both'
  if (isPoo && !formData.value.pooColor) {
    uni.showToast({ title: '请选择大便颜色', icon: 'none' })
    return
  }
  if (isPoo && !formData.value.pooShape) {
    uni.showToast({ title: '请选择大便形状', icon: 'none' })
    return
  }

  save(async ({ createdAt, uniqueId }) => {
    const timestamp = timeStrToTimestamp(formData.value.time)
    const hasRash = formData.value.hasRash ? 1 : 0
    await db.executeSql(`
      INSERT INTO diapers (unique_id, type, has_rash, poo_color, poo_shape, note, timestamp, device_id, created_at)
      VALUES ('${escapeSqlValue(uniqueId)}', '${escapeSqlValue(formData.value.type)}', ${hasRash}, '${escapeSqlValue(formData.value.pooColor)}', '${escapeSqlValue(formData.value.pooShape)}', '${escapeSqlValue(formData.value.note)}', ${timestamp}, '${escapeSqlValue(getDeviceId())}', ${createdAt})
    `)
  })
}
</script>

<style scoped>
/* 颜色选择器 */
.color-scroll {
  width: 100%;
  white-space: nowrap;
}

.color-grid {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 16rpx;
  padding: 8rpx 0;
}

.color-option {
  display: inline-block;
  padding: 16rpx 28rpx;
  border: 1px solid #E5E5E5;
  border-radius: 40rpx;
  font-size: 26rpx;
  color: #666666;
  background: #FFFFFF;
}

.color-option.active {
  background: #FF9EC4;
  border-color: #FF9EC4;
  color: #FFFFFF;
}

/* 形状选择器 */
.shape-scroll {
  width: 100%;
  max-height: 400rpx;
}

.shape-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.shape-option {
  padding: 16rpx 28rpx;
  border: 1px solid #E5E5E5;
  border-radius: 40rpx;
  font-size: 26rpx;
  color: #666666;
  background: #FFFFFF;
}

.shape-option.active {
  background: #FF9EC4;
  border-color: #FF9EC4;
  color: #FFFFFF;
}
</style>

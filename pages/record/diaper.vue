<template>
  <view class="diaper-page">
    <view class="form-section">
      <view class="form-item">
        <view class="form-label">更换类型</view>
        <view class="type-selector">
          <view 
            class="type-option"
            :class="{ active: formData.type === 'pee' }"
            @click="formData.type = 'pee'"
          >
            💧 小便
          </view>
          <view 
            class="type-option"
            :class="{ active: formData.type === 'poo' }"
            @click="formData.type = 'poo'"
          >
            💩 大便
          </view>
          <view 
            class="type-option"
            :class="{ active: formData.type === 'both' }"
            @click="formData.type = 'both'"
          >
            💧💩 混合
          </view>
        </view>
      </view>

      <!-- 是否红屁屁 -->
      <view class="form-item">
        <view class="form-label">是否红屁屁</view>
        <view class="rash-selector">
          <view 
            class="rash-option"
            :class="{ active: formData.hasRash === false }"
            @click="formData.hasRash = false"
          >
            ✅ 正常
          </view>
          <view 
            class="rash-option"
            :class="{ active: formData.hasRash === true }"
            @click="formData.hasRash = true"
          >
            🔴 有红屁屁
          </view>
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
            >
              {{ color }}
            </view>
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
            >
              {{ shape }}
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="form-item">
        <view class="form-label">更换时间</view>
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
  type: 'pee',
  hasRash: false,
  pooColor: '',
  pooShape: '',
  time: formatTime(Date.now(), 'HH:mm'),
  note: ''
})

// 大便颜色选项
const pooColors = [
  '黄色', '黄绿色', '墨绿色', '绿褐色', '淡黄色', 
  '暗褐色', '黑色', '绿色', '灰白色', '暗红色', 
  '红色', '粉红色'
]

// 大便形状选项
const pooShapes = [
  '糊状', '干稠', '膏状', '奶瓣', '稀水样', 
  '泡沫状', '泥土状', '颗粒状', '柏油状', '果酱状', 
  '豆腐渣', '蛋花汤样', '鼻涕样黏液', '粘稠像沥青', '粉状'
]

const onTimeChange = (e: any) => {
  formData.value.time = e.detail.value
}

const handleCancel = () => {
  uni.reLaunch({ url: '/pages/index/index' })
}

const handleSave = async () => {
  try {
    // 验证
    if ((formData.value.type === 'poo' || formData.value.type === 'both') && !formData.value.pooColor) {
      uni.showToast({ title: '请选择大便颜色', icon: 'none' })
      return
    }
    
    if ((formData.value.type === 'poo' || formData.value.type === 'both') && !formData.value.pooShape) {
      uni.showToast({ title: '请选择大便形状', icon: 'none' })
      return
    }

    const timestamp = Date.now()
    const uniqueId = `${timestamp}_diaper_${getDeviceId()}`
    const hasRash = formData.value.hasRash ? 1 : 0
    const pooColor = formData.value.pooColor || ''
    const pooShape = formData.value.pooShape || ''
    
    await db.executeSql(`
      INSERT INTO diapers (unique_id, type, has_rash, poo_color, poo_shape, note, timestamp, device_id, created_at)
      VALUES ('${uniqueId}', '${formData.value.type}', ${hasRash}, '${pooColor}', '${pooShape}', '${formData.value.note}', ${timestamp}, '${getDeviceId()}', ${timestamp})
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
.diaper-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding: 15px;
  padding-bottom: 30px;
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

/* 红屁屁选择器 */
.rash-selector {
  display: flex;
  gap: 10px;
}

.rash-option {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  color: #666666;
}

.rash-option.active {
  background: #FF9EC4;
  border-color: #FF9EC4;
  color: #FFFFFF;
}

/* 颜色选择器 */
.color-scroll {
  width: 100%;
  white-space: nowrap;
}

.color-grid {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 0;
}

.color-option {
  display: inline-block;
  padding: 8px 14px;
  border: 1px solid #E5E5E5;
  border-radius: 20px;
  font-size: 13px;
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
  max-height: 200px;
}

.shape-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.shape-option {
  padding: 8px 14px;
  border: 1px solid #E5E5E5;
  border-radius: 20px;
  font-size: 13px;
  color: #666666;
  background: #FFFFFF;
}

.shape-option.active {
  background: #FF9EC4;
  border-color: #FF9EC4;
  color: #FFFFFF;
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

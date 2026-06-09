<template>
  <view class="record-page" :style="themeVars">
    <view class="form-section">
      <slot />
    </view>

    <view class="form-actions">
      <button class="btn-cancel" @click="onCancel">{{ cancelText }}</button>
      <button class="btn-save" @click="onSave">{{ saveText }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const { themeVars } = useTheme()

withDefaults(
  defineProps<{
    saveText?: string
    cancelText?: string
  }>(),
  {
    saveText: '保存',
    cancelText: '取消'
  }
)

const emit = defineEmits<{
  (event: 'save'): void
  (event: 'cancel'): void
}>()

const onSave = () => emit('save')
const onCancel = () => emit('cancel')
</script>

<style scoped>
.record-page {
  min-height: 100vh;
  background: var(--background-color, #FDF6F0);
  padding: 30rpx;
  padding-bottom: 60rpx;
}

.form-section {
  background: var(--card-color, #FFFFFF);
  border-radius: var(--card-radius, 28rpx);
  padding: 36rpx;
  box-shadow: var(--card-shadow, 0 4rpx 24rpx rgba(232, 133, 122, 0.08));
}

.form-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 40rpx;
}

.btn-cancel {
  flex: 1;
  padding: 22rpx 0;
  border: 2rpx solid var(--border-color, #F0E6E0);
  border-radius: 40rpx;
  background: var(--card-color, #FFFFFF);
  font-size: 28rpx;
  color: var(--text-secondary, #8A7E84);
  font-weight: 600;
  transition: all 0.2s;
}

.btn-cancel:active {
  background: var(--divider-color, #F8F0EC);
}

.btn-save {
  flex: 1;
  padding: 22rpx 0;
  border-radius: 40rpx;
  background: var(--primary-gradient, linear-gradient(135deg, #E8857A 0%, #F2A89E 50%, #F7C4BA 100%));
  font-size: 28rpx;
  color: #FFFFFF;
  font-weight: 700;
  border: none;
  box-shadow: 0 6rpx 20rpx rgba(232, 133, 122, 0.25);
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-save:active {
  transform: scale(0.97);
  box-shadow: 0 4rpx 12rpx rgba(232, 133, 122, 0.18);
}

/* 使用 :deep() 穿透选择器，确保样式应用到 slot 内容 */
.record-page :deep(.form-item) {
  margin-bottom: 40rpx;
}

.record-page :deep(.form-label) {
  font-size: 28rpx;
  color: var(--text-secondary, #8A7E84);
  margin-bottom: 16rpx;
  display: block;
  font-weight: 600;
}

.record-page :deep(.form-picker) {
  padding: 24rpx;
  border: 2rpx solid var(--border-color, #F0E6E0);
  border-radius: 20rpx;
  font-size: 28rpx;
  color: var(--text-color, #3D3036);
  background: linear-gradient(135deg, #FEFCFA 0%, #FDF6F0 100%);
}

.record-page :deep(.form-input) {
  width: 100%;
  padding: 24rpx;
  border: 2rpx solid var(--border-color, #F0E6E0);
  border-radius: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  color: var(--text-color, #3D3036);
  background: linear-gradient(135deg, #FEFCFA 0%, #FDF6F0 100%);
  transition: border-color 0.2s;
}

.record-page :deep(.form-textarea) {
  width: 100%;
  padding: 24rpx;
  border: 2rpx solid var(--border-color, #F0E6E0);
  border-radius: 20rpx;
  font-size: 28rpx;
  min-height: 160rpx;
  box-sizing: border-box;
  color: var(--text-color, #3D3036);
  background: linear-gradient(135deg, #FEFCFA 0%, #FDF6F0 100%);
}

/* 通用选项按钮组（类型/状态等多选一） */
.record-page :deep(.option-row) {
  display: flex;
  gap: 20rpx;
  flex-wrap: wrap;
}

.record-page :deep(.option-item) {
  flex: 1;
  min-width: 160rpx;
  text-align: center;
  padding: 24rpx 0;
  border: 2rpx solid var(--border-color, #F0E6E0);
  border-radius: 20rpx;
  font-size: 28rpx;
  color: var(--text-secondary, #8A7E84);
  background: linear-gradient(135deg, #FEFCFA 0%, #FDF6F0 100%);
  font-weight: 600;
  transition: all 0.25s;
}

.record-page :deep(.option-item.active) {
  background: var(--primary-gradient, linear-gradient(135deg, #E8857A 0%, #F2A89E 50%, #F7C4BA 100%));
  border-color: var(--primary-color, #E8857A);
  color: #FFFFFF;
  font-weight: 700;
  box-shadow: 0 4rpx 16rpx rgba(232, 133, 122, 0.25);
}
</style>

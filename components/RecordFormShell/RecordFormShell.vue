<template>
  <view class="record-page">
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
  background: #FFF5F7;
  padding: 30rpx;
  padding-bottom: 60rpx;
}

.form-section {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 40rpx;
}

.form-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 40rpx;
}

.btn-cancel {
  flex: 1;
  padding: 20rpx 0;
  border: 1px solid #E5E5E5;
  border-radius: 40rpx;
  background: #FFFFFF;
  font-size: 28rpx;
  color: #666666;
}

.btn-save {
  flex: 1;
  padding: 20rpx 0;
  border-radius: 40rpx;
  background: #FF9EC4;
  font-size: 28rpx;
  color: #FFFFFF;
}

/* 使用 :deep() 穿透选择器，确保样式应用到 slot 内容 */
.record-page :deep(.form-item) {
  margin-bottom: 40rpx;
}

.record-page :deep(.form-label) {
  font-size: 28rpx;
  color: #666666;
  margin-bottom: 20rpx;
  display: block;
}

.record-page :deep(.form-picker) {
  padding: 24rpx;
  border: 1px solid #E5E5E5;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #333333;
}

.record-page :deep(.form-input) {
  width: 100%;
  padding: 24rpx;
  border: 1px solid #E5E5E5;
  border-radius: 16rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.record-page :deep(.form-textarea) {
  width: 100%;
  padding: 24rpx;
  border: 1px solid #E5E5E5;
  border-radius: 16rpx;
  font-size: 28rpx;
  min-height: 160rpx;
  box-sizing: border-box;
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
  border: 1px solid #E5E5E5;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #666666;
}

.record-page :deep(.option-item.active) {
  background: #FF9EC4;
  border-color: #FF9EC4;
  color: #FFFFFF;
}
</style>

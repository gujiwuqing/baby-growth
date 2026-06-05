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
  padding: 15px;
  padding-bottom: 30px;
}

.form-section {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
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

/* 使用 :deep() 穿透选择器，确保样式应用到 slot 内容 */
.record-page :deep(.form-item) {
  margin-bottom: 20px;
}

.record-page :deep(.form-label) {
  font-size: 14px;
  color: #666666;
  margin-bottom: 10px;
  display: block;
}

.record-page :deep(.form-picker) {
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  color: #333333;
}

.record-page :deep(.form-input) {
  width: 100%;
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.record-page :deep(.form-textarea) {
  width: 100%;
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  min-height: 80px;
  box-sizing: border-box;
}

/* 通用选项按钮组（类型/状态等多选一） */
.record-page :deep(.option-row) {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.record-page :deep(.option-item) {
  flex: 1;
  min-width: 80px;
  text-align: center;
  padding: 12px 0;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  color: #666666;
}

.record-page :deep(.option-item.active) {
  background: #FF9EC4;
  border-color: #FF9EC4;
  color: #FFFFFF;
}
</style>

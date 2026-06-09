<template>
  <view class="quick-record">
    <view class="quick-title">快捷记录</view>
    <view class="quick-grid">
      <view 
        class="quick-item" 
        v-for="item in quickItems" 
        :key="item.type"
        @click="handleClick(item.type)"
      >
        <view class="quick-icon">{{ item.icon }}</view>
        <view class="quick-label">{{ item.label }}</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const quickItems = [
  { type: 'breast', icon: '🤱', label: '母乳' },
  { type: 'diaper', icon: '👶', label: '换尿布' },
  { type: 'supplement', icon: '💊', label: '营养补剂' },
  { type: 'formula', icon: '🍼', label: '配方奶' },
  { type: 'bottle', icon: '🍼', label: '瓶喂母乳' },
  { type: 'sleep', icon: '😴', label: '睡眠' },
  { type: 'food', icon: '🥣', label: '辅食' },
  { type: 'growth', icon: '📏', label: '成长指标' }
]

const emit = defineEmits<{
  (event: 'record', type: string): void
}>()

const handleClick = (type: string) => {
  emit('record', type)
}
</script>

<style scoped>
.quick-record {
  background: var(--card-color, #FFFFFF);
  border-radius: var(--card-radius, 16rpx);
  padding: 24rpx;
  margin: 24rpx 24rpx 200rpx;
  box-shadow: var(--card-shadow, 0 2rpx 12rpx rgba(0,0,0,0.06));
}

.quick-title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--text-color, #1A1A1A);
  margin-bottom: 20rpx;
  padding-left: 4rpx;
  letter-spacing: 0.5rpx;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 0 18rpx;
  background: var(--divider-color, #F5F5F5);
  border-radius: 12rpx;
  transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.quick-item:active {
  transform: scale(0.93);
}

.quick-icon {
  width: 76rpx;
  height: 76rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  margin-bottom: 10rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
}

.quick-label {
  font-size: 24rpx;
  color: var(--text-secondary, #666666);
  font-weight: 600;
  letter-spacing: 0.3rpx;
}
</style>

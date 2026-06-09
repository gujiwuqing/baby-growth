<template>
  <view class="quick-record">
    <view class="quick-header">
      <text class="quick-title">快捷记录</text>
    </view>
    <view class="quick-grid">
      <view 
        class="quick-item" 
        v-for="item in quickItems" 
        :key="item.type"
        @click="handleClick(item.type)"
      >
        <view class="quick-icon-circle" :style="{ background: item.bgColor }">
          <text class="quick-icon">{{ item.icon }}</text>
        </view>
        <text class="quick-label">{{ item.label }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const quickItems = [
  { type: 'breast', icon: '🤱', label: '母乳', bgColor: 'rgba(232, 133, 122, 0.1)' },
  { type: 'formula', icon: '🍼', label: '配方奶', bgColor: 'rgba(157, 196, 224, 0.12)' },
  { type: 'bottle', icon: '🍼', label: '瓶喂母乳', bgColor: 'rgba(184, 169, 212, 0.12)' },
  { type: 'food', icon: '🥣', label: '辅食', bgColor: 'rgba(245, 197, 163, 0.15)' },
  { type: 'diaper', icon: '👶', label: '换尿布', bgColor: 'rgba(140, 201, 176, 0.12)' },
  { type: 'sleep', icon: '😴', label: '睡眠', bgColor: 'rgba(184, 169, 212, 0.12)' },
  { type: 'supplement', icon: '💊', label: '营养补剂', bgColor: 'rgba(232, 133, 122, 0.1)' },
  { type: 'growth', icon: '📏', label: '成长指标', bgColor: 'rgba(157, 196, 224, 0.12)' }
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
  padding: 24rpx 24rpx 16rpx;
  margin: 24rpx 24rpx 0;
  box-shadow: var(--card-shadow, 0 2rpx 12rpx rgba(0,0,0,0.06));
}

.quick-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.quick-title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--text-color, #1A1A1A);
  padding-left: 4rpx;
  letter-spacing: 0.5rpx;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8rpx;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 0;
  border-radius: 16rpx;
  transition: transform 0.15s ease, background 0.15s;
}

.quick-item:active {
  transform: scale(0.92);
  background: rgba(0, 0, 0, 0.02);
}

.quick-icon-circle {
  width: 96rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-bottom: 10rpx;
}

.quick-icon {
  font-size: 44rpx;
}

.quick-label {
  font-size: 22rpx;
  color: var(--text-secondary, #666666);
  font-weight: 500;
  letter-spacing: 0.3rpx;
}
</style>

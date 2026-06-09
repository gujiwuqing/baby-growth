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
  border-radius: var(--card-radius, 28rpx);
  padding: 32rpx 30rpx;
  margin: 24rpx 30rpx;
  box-shadow: var(--card-shadow, 0 4rpx 24rpx rgba(232, 133, 122, 0.08));
}

.quick-title {
  font-size: 32rpx;
  font-weight: 800;
  color: var(--text-color, #3D3036);
  margin-bottom: 28rpx;
  padding-left: 4rpx;
  letter-spacing: 0.5rpx;
  position: relative;
}

.quick-title::after {
  content: '';
  position: absolute;
  left: 4rpx;
  bottom: -8rpx;
  width: 48rpx;
  height: 6rpx;
  background: linear-gradient(90deg, #B8A9D4, #D0C5E6);
  border-radius: 3rpx;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28rpx 0 22rpx;
  background: linear-gradient(160deg, #FDF6F0 0%, #FAF0EA 100%);
  border-radius: 24rpx;
  border: 1rpx solid rgba(240, 230, 224, 0.5);
  transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.2s;
  position: relative;
  overflow: hidden;
}

.quick-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3rpx;
  border-radius: 3rpx 3rpx 0 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.quick-item:nth-child(1)::before { background: linear-gradient(90deg, #E8857A, #F2A89E); }
.quick-item:nth-child(2)::before { background: linear-gradient(90deg, #B8A9D4, #D0C5E6); }
.quick-item:nth-child(3)::before { background: linear-gradient(90deg, #F5C5A3, #F7D5BD); }
.quick-item:nth-child(4)::before { background: linear-gradient(90deg, #9DC4E0, #B5D4EC); }
.quick-item:nth-child(5)::before { background: linear-gradient(90deg, #8CC9B0, #A8DBC5); }
.quick-item:nth-child(6)::before { background: linear-gradient(90deg, #D4A9C9, #E0C1D9); }
.quick-item:nth-child(7)::before { background: linear-gradient(90deg, #E8C87A, #F0D99E); }
.quick-item:nth-child(8)::before { background: linear-gradient(90deg, #A9D4B8, #C1E0CE); }

.quick-item:active {
  transform: scale(0.93);
}

.quick-item:active::before {
  opacity: 1;
}

.quick-icon {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  margin-bottom: 12rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 4rpx 12rpx rgba(232, 133, 122, 0.08);
}

.quick-label {
  font-size: 24rpx;
  color: var(--text-secondary, #8A7E84);
  font-weight: 600;
  letter-spacing: 0.3rpx;
}
</style>

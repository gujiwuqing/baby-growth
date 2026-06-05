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
  { type: 'formula', icon: '🍼', label: '配方奶' },
  { type: 'bottle', icon: '🍼', label: '瓶喂母乳' },
  { type: 'diaper', icon: '👶', label: '换尿布' },
  { type: 'sleep', icon: '😴', label: '睡眠' },
  { type: 'food', icon: '🥣', label: '辅食' },
  { type: 'supplement', icon: '💊', label: '营养补剂' },
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
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
  margin: 15px;
}

.quick-title {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
  margin-bottom: 15px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  background: #FFF5F7;
  border-radius: 12px;
}

.quick-icon {
  font-size: 28px;
  margin-bottom: 6px;
}

.quick-label {
  font-size: 13px;
  color: #666666;
}
</style>

<template>
  <view class="profile-page">
    <!-- 头像区域 -->
    <view class="avatar-section">
      <view class="avatar-wrapper" @click="editField('avatar')">
        <view class="avatar-circle">
          <text class="avatar-emoji">{{ babyInfo.gender === 0 ? '👧' : '👦' }}</text>
        </view>
        <text class="avatar-tip">点击更换头像</text>
      </view>
    </view>

    <!-- 信息列表 -->
    <view class="info-card">
      <view class="info-item" @click="editField('name')">
        <text class="info-label">姓名</text>
        <view class="info-right">
          <text class="info-value">{{ babyInfo.name || '未设置' }}</text>
          <text class="info-arrow">›</text>
        </view>
      </view>
      <view class="info-item" @click="editField('gender')">
        <text class="info-label">性别</text>
        <view class="info-right">
          <text class="info-value">{{ babyInfo.gender === 1 ? '男宝' : babyInfo.gender === 0 ? '女宝' : '未设置' }}</text>
          <text class="info-arrow">›</text>
        </view>
      </view>
      <view class="info-item" @click="editField('birthday')">
        <text class="info-label">出生日期</text>
        <view class="info-right">
          <text class="info-value">{{ babyInfo.birthday || '未设置' }}</text>
          <text class="info-arrow">›</text>
        </view>
      </view>
      <view class="info-item">
        <text class="info-label">月龄</text>
        <view class="info-right">
          <text class="info-value info-value-readonly">{{ monthAge }}</text>
        </view>
      </view>
      <view class="info-item">
        <text class="info-label">天数</text>
        <view class="info-right">
          <text class="info-value info-value-readonly">{{ dayAge }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { db } from '@/utils/database'

const babyInfo = ref({
  name: '',
  gender: 1,
  birthday: ''
})

const monthAge = computed(() => {
  if (!babyInfo.value.birthday) return '—'
  const birth = new Date(babyInfo.value.birthday).getTime()
  const now = Date.now()
  const months = Math.floor((now - birth) / (1000 * 60 * 60 * 24 * 30))
  if (months < 1) return '不足1个月'
  return `${months}个月`
})

const dayAge = computed(() => {
  if (!babyInfo.value.birthday) return '—'
  const birth = new Date(babyInfo.value.birthday).getTime()
  const now = Date.now()
  const days = Math.floor((now - birth) / (1000 * 60 * 60 * 24))
  return `${days}天`
})

const editField = (field: string) => {
  uni.navigateTo({ url: `/pages/profile/edit?field=${field}` })
}

const loadBabyInfo = async () => {
  try {
    await db.open()
    const result = await db.selectSql('SELECT * FROM baby_info LIMIT 1')
    if (result && result.length > 0) {
      babyInfo.value.name = result[0].name || ''
      babyInfo.value.birthday = result[0].birthday || ''
      if (result[0].gender !== null && result[0].gender !== undefined) {
        babyInfo.value.gender = Number(result[0].gender)
      }
    }
  } catch (error) {
    console.error('加载宝宝信息失败', error)
  }
}

onShow(() => {
  loadBabyInfo()
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: var(--background-color, #F5F5F5);
}

/* 头像区域 */
.avatar-section {
  display: flex;
  justify-content: center;
  padding: 48rpx 0 32rpx;
  background: var(--card-color, #FFFFFF);
}

.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.avatar-circle {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: var(--primary-gradient, linear-gradient(135deg, #E8857A 0%, #F2A89E 50%, #F7C4BA 100%));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx var(--primary-shadow, rgba(232, 133, 122, 0.25));
}

.avatar-emoji {
  font-size: 80rpx;
}

.avatar-tip {
  font-size: 22rpx;
  color: var(--text-tertiary, #999999);
}

/* 信息列表卡片 */
.info-card {
  margin: 24rpx;
  background: var(--card-color, #FFFFFF);
  border-radius: var(--card-radius, 16rpx);
  overflow: hidden;
  box-shadow: var(--card-shadow, 0 2rpx 12rpx rgba(0, 0, 0, 0.06));
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 32rpx;
  border-bottom: 1rpx solid var(--divider-color, #F5F5F5);
  transition: background 0.15s;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item:active {
  background: rgba(0, 0, 0, 0.02);
}

.info-label {
  font-size: 30rpx;
  color: var(--text-color, #1A1A1A);
  font-weight: 500;
}

.info-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.info-value {
  font-size: 30rpx;
  color: var(--text-secondary, #666666);
}

.info-value-readonly {
  color: var(--text-tertiary, #999999);
}

.info-arrow {
  font-size: 36rpx;
  color: var(--text-tertiary, #CCCCCC);
  font-weight: 300;
}
</style>

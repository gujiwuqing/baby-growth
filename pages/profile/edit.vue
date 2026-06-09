<template>
  <view class="edit-page">
    <!-- 编辑姓名 -->
    <view class="edit-card" v-if="field === 'name'">
      <view class="edit-title">修改宝宝姓名</view>
      <input
        class="edit-input"
        v-model="formData.name"
        placeholder="请输入宝宝姓名"
        maxlength="20"
        focus
      />
      <view class="edit-tip">最多20个字符</view>
    </view>

    <!-- 编辑性别 -->
    <view class="edit-card" v-if="field === 'gender'">
      <view class="edit-title">选择宝宝性别</view>
      <view class="gender-list">
        <view
          class="gender-item"
          :class="{ active: formData.gender === 1 }"
          @click="formData.gender = 1"
        >
          <view class="gender-icon-wrap">
            <text class="gender-icon">👦</text>
          </view>
          <text class="gender-text">男宝</text>
          <view class="gender-check" v-if="formData.gender === 1">✓</view>
        </view>
        <view
          class="gender-item"
          :class="{ active: formData.gender === 0 }"
          @click="formData.gender = 0"
        >
          <view class="gender-icon-wrap">
            <text class="gender-icon">👧</text>
          </view>
          <text class="gender-text">女宝</text>
          <view class="gender-check" v-if="formData.gender === 0">✓</view>
        </view>
      </view>
    </view>

    <!-- 编辑出生日期 -->
    <view class="edit-card" v-if="field === 'birthday'">
      <view class="edit-title">选择出生日期</view>
      <picker mode="date" :value="formData.birthday" @change="onDateChange">
        <view class="date-picker-display">
          <text class="date-value">{{ formData.birthday || '请选择日期' }}</text>
          <text class="date-arrow">›</text>
        </view>
      </picker>
    </view>

    <!-- 头像选择（占位） -->
    <view class="edit-card" v-if="field === 'avatar'">
      <view class="edit-title">选择宝宝头像</view>
      <view class="avatar-grid">
        <view
          v-for="(emoji, idx) in avatarOptions"
          :key="idx"
          class="avatar-option"
          :class="{ active: formData.avatar === emoji }"
          @click="formData.avatar = emoji"
        >
          <text class="avatar-emoji">{{ emoji }}</text>
        </view>
      </view>
    </view>

    <!-- 保存按钮 -->
    <view class="save-bar">
      <button class="save-btn" @click="handleSave">保存</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { db, escapeSqlValue } from '@/utils/database'

const field = ref('')
const formData = ref({
  name: '',
  gender: 1,
  birthday: '',
  avatar: '👦'
})

const avatarOptions = ['👦', '👧', '👶', '🧒', '😊', '🥰', '😎', '🤗']

const onDateChange = (e: any) => {
  formData.value.birthday = e.detail.value
}

const loadBabyInfo = async () => {
  try {
    await db.open()
    const result = await db.selectSql('SELECT * FROM baby_info LIMIT 1')
    if (result && result.length > 0) {
      formData.value.name = result[0].name || ''
      formData.value.birthday = result[0].birthday || ''
      if (result[0].gender !== null && result[0].gender !== undefined) {
        formData.value.gender = Number(result[0].gender)
      }
    }
  } catch (error) {
    console.error('加载宝宝信息失败', error)
  }
}

const handleSave = async () => {
  try {
    // 根据字段做校验
    if (field.value === 'name' && !formData.value.name.trim()) {
      uni.showToast({ title: '请输入宝宝姓名', icon: 'none' })
      return
    }
    if (field.value === 'birthday' && !formData.value.birthday) {
      uni.showToast({ title: '请选择出生日期', icon: 'none' })
      return
    }

    const existing = await db.selectSql('SELECT id FROM baby_info LIMIT 1')
    const timestamp = Date.now()

    if (existing && existing.length > 0) {
      let updateSql = ''
      switch (field.value) {
        case 'name':
          updateSql = `UPDATE baby_info SET name = '${escapeSqlValue(formData.value.name)}', updated_at = ${timestamp} WHERE id = ${existing[0].id}`
          break
        case 'gender':
          updateSql = `UPDATE baby_info SET gender = ${formData.value.gender}, updated_at = ${timestamp} WHERE id = ${existing[0].id}`
          break
        case 'birthday':
          updateSql = `UPDATE baby_info SET birthday = '${escapeSqlValue(formData.value.birthday)}', updated_at = ${timestamp} WHERE id = ${existing[0].id}`
          break
        default:
          updateSql = `UPDATE baby_info SET updated_at = ${timestamp} WHERE id = ${existing[0].id}`
      }
      await db.executeSql(updateSql)
    } else {
      await db.executeSql(`
        INSERT INTO baby_info (name, gender, birthday, created_at, updated_at)
        VALUES ('${escapeSqlValue(formData.value.name)}', ${formData.value.gender}, '${escapeSqlValue(formData.value.birthday)}', ${timestamp}, ${timestamp})
      `)
    }

    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 800)
  } catch (error) {
    console.error('保存失败', error)
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.$page?.options || currentPage.options || {}
  field.value = options.field || 'name'

  // 根据 field 设置页面标题
  const titleMap: Record<string, string> = {
    name: '修改姓名',
    gender: '选择性别',
    birthday: '出生日期',
    avatar: '选择头像'
  }
  uni.setNavigationBarTitle({ title: titleMap[field.value] || '编辑信息' })

  loadBabyInfo()
})
</script>

<style scoped>
.edit-page {
  min-height: 100vh;
  background: var(--background-color, #F5F5F5);
  padding-bottom: 160rpx;
}

.edit-card {
  margin: 24rpx;
  background: var(--card-color, #FFFFFF);
  border-radius: var(--card-radius, 16rpx);
  padding: 32rpx;
  box-shadow: var(--card-shadow, 0 2rpx 12rpx rgba(0, 0, 0, 0.06));
}

.edit-title {
  font-size: 28rpx;
  color: var(--text-secondary, #666666);
  margin-bottom: 24rpx;
  font-weight: 500;
}

/* 输入框 */
.edit-input {
  width: 100%;
  padding: 28rpx 24rpx;
  border: 2rpx solid var(--border-color, #EEEEEE);
  border-radius: 12rpx;
  font-size: 32rpx;
  color: var(--text-color, #1A1A1A);
  background: #FAFAFA;
  transition: border-color 0.2s;
}

.edit-tip {
  font-size: 24rpx;
  color: var(--text-tertiary, #999999);
  margin-top: 12rpx;
}

/* 性别选择 */
.gender-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.gender-item {
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
  border: 2rpx solid var(--border-color, #EEEEEE);
  border-radius: 16rpx;
  background: #FAFAFA;
  transition: all 0.2s;
}

.gender-item.active {
  border-color: var(--primary-color, #E8857A);
  background: var(--primary-bg, rgba(232, 133, 122, 0.08));
}

.gender-icon-wrap {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.gender-icon {
  font-size: 44rpx;
}

.gender-text {
  flex: 1;
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-color, #1A1A1A);
}

.gender-check {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: var(--primary-color, #E8857A);
  color: #FFFFFF;
  font-size: 28rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 日期选择器 */
.date-picker-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 24rpx;
  border: 2rpx solid var(--border-color, #EEEEEE);
  border-radius: 12rpx;
  background: #FAFAFA;
}

.date-value {
  font-size: 32rpx;
  color: var(--text-color, #1A1A1A);
}

.date-arrow {
  font-size: 36rpx;
  color: var(--text-tertiary, #CCCCCC);
}

/* 头像选择网格 */
.avatar-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx;
}

.avatar-option {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid var(--border-color, #EEEEEE);
  border-radius: 16rpx;
  background: #FAFAFA;
  transition: all 0.2s;
}

.avatar-option.active {
  border-color: var(--primary-color, #E8857A);
  background: var(--primary-bg, rgba(232, 133, 122, 0.08));
  box-shadow: 0 4rpx 16rpx var(--primary-shadow-light, rgba(232, 133, 122, 0.1));
}

.avatar-option .avatar-emoji {
  font-size: 56rpx;
}

/* 底部保存栏 */
.save-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: var(--card-color, #FFFFFF);
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.save-btn {
  width: 100%;
  padding: 28rpx 0;
  background: var(--primary-gradient, linear-gradient(135deg, #E8857A 0%, #F2A89E 50%, #F7C4BA 100%));
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #FFFFFF;
  border: none;
  box-shadow: 0 8rpx 24rpx var(--primary-shadow, rgba(232, 133, 122, 0.25));
  letter-spacing: 2rpx;
}

.save-btn:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 12rpx var(--primary-shadow, rgba(232, 133, 122, 0.15));
}
</style>

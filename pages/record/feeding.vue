<template>
  <view class="feeding-page" :style="themeVars">
    <!-- 母乳：计时 / 手动输入 切换 -->
    <view v-if="feedType === 'breast'" class="breast-wrapper">
      <view class="mode-switch">
        <view
          class="mode-tab"
          :class="{ active: breastMode === 'timer' }"
          @click="breastMode = 'timer'"
        >计时</view>
        <view
          class="mode-tab"
          :class="{ active: breastMode === 'manual' }"
          @click="breastMode = 'manual'"
        >手动输入</view>
      </view>

      <!-- 计时模式 -->
      <view v-if="breastMode === 'timer'" class="timer-area">
        <view class="last-tip" v-if="lastBreastTip">上次：{{ lastBreastTip }}</view>
        <view class="unsaved-tip" v-if="hasUnsavedTimer">
          <text class="unsaved-icon">⚠️</text>
          <text class="unsaved-text">有未保存的计时数据</text>
        </view>
        <view class="timer-circles">
          <view class="timer-side">
            <view
              class="timer-circle"
              :class="{ running: runningSide === 'left' }"
              @click="toggleTimer('left')"
            >
              <view class="side-label">左</view>
              <view class="side-icon">{{ runningSide === 'left' ? '⏸' : '▶' }}</view>
            </view>
            <view class="side-time">{{ formatDuration(leftDuration) }}</view>
          </view>
          <view class="timer-side">
            <view
              class="timer-circle"
              :class="{ running: runningSide === 'right' }"
              @click="toggleTimer('right')"
            >
              <view class="side-label">右</view>
              <view class="side-icon">{{ runningSide === 'right' ? '⏸' : '▶' }}</view>
            </view>
            <view class="side-time">{{ formatDuration(rightDuration) }}</view>
          </view>
        </view>
        <view class="timer-total">合计 {{ formatDuration(leftDuration + rightDuration) }}</view>
      </view>

      <!-- 手动输入模式 -->
      <view v-else class="manual-area">
        <view class="form-section">
          <view class="form-item">
            <view class="form-label">左侧时长（分钟）</view>
            <view class="input-wrapper">
              <input 
                class="form-input" 
                type="number"
                :value="manualLeft"
                @input="manualLeft = $event.detail.value"
                placeholder="请输入分钟数"
                :adjust-position="true"
                :always-embed="true"
              />
            </view>
          </view>
          <view class="form-item">
            <view class="form-label">右侧时长（分钟）</view>
            <view class="input-wrapper">
              <input 
                class="form-input" 
                type="number"
                :value="manualRight"
                @input="manualRight = $event.detail.value"
                placeholder="请输入分钟数"
                :adjust-position="true"
                :always-embed="true"
              />
            </view>
          </view>
          <view class="form-item">
            <view class="form-label">喂奶时间</view>
            <picker mode="time" :value="formData.time" @change="onTimeChange">
              <view class="form-picker">{{ formData.time || '选择时间' }}</view>
            </picker>
          </view>
        </view>
      </view>

      <view class="form-section note-section">
        <view class="form-item">
          <view class="form-label">备注</view>
          <textarea class="form-textarea" v-model="formData.note" placeholder="记录一些特殊情况..." />
        </view>
      </view>
    </view>

    <!-- 配方奶 / 瓶喂母乳：手动输入 ml -->
    <view v-else class="bottle-wrapper">
      <view class="form-section">
        <view class="form-item">
          <view class="form-label">喂奶时间</view>
          <picker mode="time" :value="formData.time" @change="onTimeChange">
            <view class="form-picker">{{ formData.time || '选择时间' }}</view>
          </picker>
        </view>
      </view>

      <!-- 奶瓶刻度样式 -->
      <view class="bottle-card">
        <view class="bottle-card-title">奶量</view>
        <view class="bottle-visual">
          <view class="bottle-cap"></view>
          <view class="bottle-body">
            <view class="amount-display">{{ formData.amount || 0 }}<text class="amount-unit"> ml</text></view>
            <view class="quick-amounts">
              <view
                class="quick-amount"
                v-for="ml in quickMlList"
                :key="ml"
                :class="{ active: Number(formData.amount) === ml }"
                @click="formData.amount = String(ml)"
              >{{ ml }}</view>
            </view>
          </view>
        </view>
        <view class="amount-stepper">
          <view class="stepper-btn" @click="changeAmount(-5)">－5</view>
          <input class="stepper-input" type="number" v-model="formData.amount" placeholder="自定义" />
          <view class="stepper-btn" @click="changeAmount(5)">＋5</view>
        </view>
      </view>

      <view class="form-section note-section">
        <view class="form-item">
          <view class="form-label">备注</view>
          <textarea class="form-textarea" v-model="formData.note" placeholder="记录一些特殊情况..." />
        </view>
      </view>
    </view>

    <view class="form-actions">
      <button class="btn-cancel" @click="cancel">取消</button>
      <button class="btn-save" @click="handleSave">保存</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad, onShow, onHide } from '@dcloudio/uni-app'
import { db } from '@/utils/database'
import { getDeviceId, formatTime } from '@/utils/device'
import { useRecordSave } from '@/composables/useRecordSave'
import { useTheme } from '@/composables/useTheme'

const { timeStrToTimestamp, cancel, save } = useRecordSave('feeding')
const { themeVars } = useTheme()

// 喂养类型：breast(母乳计时) / formula(配方奶) / bottle(瓶喂母乳)
const feedType = ref<'breast' | 'formula' | 'bottle'>('breast')

const titleMap: Record<string, string> = {
  breast: '母乳',
  formula: '配方奶',
  bottle: '瓶喂母乳'
}

onLoad((options: any) => {
  const t = options && options.type
  if (t === 'formula' || t === 'bottle' || t === 'breast') {
    feedType.value = t
  }
  uni.setNavigationBarTitle({ title: titleMap[feedType.value] || '喂奶记录' })
  // 在 onLoad 中恢复计时状态（页面创建/重建场景）
  if (feedType.value === 'breast' && breastMode.value === 'timer') {
    restoreTimerState()
    restoredInOnLoad = true // 标记已恢复，避免 onShow 重复恢复
  }
})

const formData = ref({
  amount: '50',
  time: formatTime(Date.now(), 'HH:mm'),
  note: ''
})

// ===== 母乳：计时 =====
const breastMode = ref<'timer' | 'manual'>('timer')
const leftDuration = ref(0) // 秒
const rightDuration = ref(0) // 秒
const runningSide = ref<'' | 'left' | 'right'>('')
// timerStart: 当前正在计时那一侧的"开始计时绝对时间点(ms)"
// 用于补算：从 timerStart 到 Date.now() 的差值就是这一侧从开始到现在的完整时长
const timerStart = ref(0)
// otherSideDuration: 当前不在计时的那一侧的累计秒数
// 比如左侧计时中，otherSideDuration 就是右侧的累计值
const otherSideDuration = ref(0)
let timerHandle: any = null
const lastBreastTip = ref('')
const hasUnsavedTimer = ref(false)
let restoredInOnLoad = false

// 手动输入（分钟）
const manualLeft = ref('')
const manualRight = ref('')

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// 保存计时状态到 Storage
const saveTimerState = () => {
  if (feedType.value !== 'breast' || breastMode.value !== 'timer') return
  uni.setStorageSync('breast_timer_state', JSON.stringify({
    runningSide: runningSide.value,
    timerStart: runningSide.value ? timerStart.value : 0,
    otherSideDuration: otherSideDuration.value,
    leftDuration: leftDuration.value,
    rightDuration: rightDuration.value
  }))
}

// 从 Storage 恢复计时状态
const restoreTimerState = () => {
  if (feedType.value !== 'breast' || breastMode.value !== 'timer') return
  try {
    const raw = uni.getStorageSync('breast_timer_state')
    if (!raw) return
    const state = JSON.parse(raw)
    
    if (state.runningSide === 'left' || state.runningSide === 'right') {
      // 正在计时 → 用 timerStart 绝对时间点精确补算
      // 从 timerStart 到现在的差值 = 这一侧从开始到现在的完整时长
      const currentSideDuration = Math.round((Date.now() - state.timerStart) / 1000)
      if (state.runningSide === 'left') {
        leftDuration.value = currentSideDuration
        rightDuration.value = state.otherSideDuration
      } else {
        leftDuration.value = state.otherSideDuration
        rightDuration.value = currentSideDuration
      }
      // 恢复计时器
      runningSide.value = state.runningSide
      timerStart.value = state.timerStart
      otherSideDuration.value = state.otherSideDuration
      startTimer()
    } else {
      // 用户主动暂停 → 只恢复时长，不补算，不恢复计时器
      leftDuration.value = state.leftDuration
      rightDuration.value = state.rightDuration
    }
  } catch (e) {
    console.error('恢复计时状态失败', e)
  }
}

const toggleTimer = (side: 'left' | 'right') => {
  if (runningSide.value === side) {
    // 暂停当前侧
    stopTimer()
    runningSide.value = ''
    otherSideDuration.value = 0
    saveTimerState()
    return
  }
  // 若另一侧在计时，先结算
  if (runningSide.value) {
    stopTimer()
  }
  // 记录非计时侧的累计值
  otherSideDuration.value = side === 'left' ? rightDuration.value : leftDuration.value
  // 关键：timerStart 倒推，让 (now - timerStart) 等于当前侧已有的累计时长
  // 这样定时器回调算出的 elapsed 会从已有时长开始累加，而不是从0开始
  const alreadyElapsed = side === 'left' ? leftDuration.value : rightDuration.value
  timerStart.value = Date.now() - alreadyElapsed * 1000
  runningSide.value = side
  startTimer()
}

const startTimer = () => {
  if (timerHandle) clearInterval(timerHandle)
  timerHandle = setInterval(() => {
    const elapsed = Math.round((Date.now() - timerStart.value) / 1000)
    if (runningSide.value === 'left') {
      leftDuration.value = elapsed
      rightDuration.value = otherSideDuration.value
    } else if (runningSide.value === 'right') {
      leftDuration.value = otherSideDuration.value
      rightDuration.value = elapsed
    }
  }, 1000)
}

const stopTimer = () => {
  if (timerHandle) {
    clearInterval(timerHandle)
    timerHandle = null
  }
}

onHide(() => {
  saveTimerState()
})

onShow(() => {
  if (!restoredInOnLoad && feedType.value === 'breast' && breastMode.value === 'timer') {
    restoreTimerState()
  }
  restoredInOnLoad = false
})

onUnmounted(() => {
  saveTimerState()
})

// ===== 配方奶 / 瓶喂母乳：ml =====
const quickMlList = [30, 60, 90, 120, 150, 180]

const changeAmount = (delta: number) => {
  const current = Number(formData.value.amount) || 0
  const next = current + delta
  formData.value.amount = String(next < 0 ? 0 : next)
}

const onTimeChange = (e: any) => {
  formData.value.time = e.detail.value
}

const handleSave = () => {
  // 母乳：计时/手动模式校验
  if (feedType.value === 'breast') {
    if (breastMode.value === 'timer') {
      stopTimer()
      if (leftDuration.value + rightDuration.value <= 0) {
        uni.showToast({ title: '请先开始计时', icon: 'none' })
        return
      }
    } else {
      const leftSec = (Number(manualLeft.value) || 0) * 60
      const rightSec = (Number(manualRight.value) || 0) * 60
      if (leftSec + rightSec <= 0) {
        uni.showToast({ title: '请输入喂奶时长', icon: 'none' })
        return
      }
    }
  } else {
    if ((Number(formData.value.amount) || 0) <= 0) {
      uni.showToast({ title: '请输入喂奶量', icon: 'none' })
      return
    }
  }

  save(async ({ createdAt, uniqueId }) => {
    const deviceId = getDeviceId()
    const note = (formData.value.note || '').replace(/'/g, "''")

    if (feedType.value === 'breast') {
      let leftSec: number
      let rightSec: number
      let startTs: number
      let endTs: number

      if (breastMode.value === 'timer') {
        leftSec = leftDuration.value
        rightSec = rightDuration.value
        endTs = createdAt
        startTs = createdAt - (leftSec + rightSec) * 1000
      } else {
        leftSec = (Number(manualLeft.value) || 0) * 60
        rightSec = (Number(manualRight.value) || 0) * 60
        startTs = timeStrToTimestamp(formData.value.time)
        endTs = startTs + (leftSec + rightSec) * 1000
      }

      await db.executeSql(`
        INSERT INTO feeds (unique_id, type, amount, unit, left_duration, right_duration, start_time, end_time, note, timestamp, device_id, created_at)
        VALUES ('${uniqueId}', 'breast', 0, 'min', ${leftSec}, ${rightSec}, ${startTs}, ${endTs}, '${note}', ${startTs}, '${deviceId}', ${createdAt})
      `)
      
      // 保存成功后清除计时状态和 ref 值
      uni.removeStorageSync('breast_timer_state')
      leftDuration.value = 0
      rightDuration.value = 0
      runningSide.value = ''
      otherSideDuration.value = 0
    } else {
      const amount = Number(formData.value.amount) || 0
      const ts = timeStrToTimestamp(formData.value.time)
      await db.executeSql(`
        INSERT INTO feeds (unique_id, type, amount, unit, left_duration, right_duration, note, timestamp, device_id, created_at)
        VALUES ('${uniqueId}', '${feedType.value}', ${amount}, 'ml', 0, 0, '${note}', ${ts}, '${deviceId}', ${createdAt})
      `)
    }
  })
}

// 加载上次母乳记录提示
onMounted(async () => {
  try {
    const rows = await db.selectSql(`
      SELECT timestamp, left_duration, right_duration FROM feeds WHERE type = 'breast' ORDER BY timestamp DESC LIMIT 1
    `)
    if (rows && rows.length > 0) {
      const record = rows[0]
      const diff = Date.now() - record.timestamp
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const timeAgo = hours > 0 ? `${hours}小时${minutes}分钟前` : `${minutes}分钟前`
      
      // 如果有左右时长数据，显示详细信息
      if (record.left_duration || record.right_duration) {
        const leftMin = Math.floor((record.left_duration || 0) / 60)
        const rightMin = Math.floor((record.right_duration || 0) / 60)
        const parts: string[] = []
        if (leftMin > 0) parts.push(`左 ${leftMin}min`)
        if (rightMin > 0) parts.push(`右 ${rightMin}min`)
        lastBreastTip.value = `${timeAgo}（${parts.join(' · ')}）`
      } else {
        lastBreastTip.value = timeAgo
      }
    }
  } catch (e) {
    console.error('加载上次记录失败', e)
  }
})
</script>

<style scoped>
.feeding-page {
  min-height: 100vh;
  background: var(--primary-bg);
  padding: 30rpx;
}

.manual-area {
  position: relative;
  z-index: 1;
}

.form-section {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 40rpx;
  position: relative;
  z-index: 1;
}

.note-section {
  margin-top: 30rpx;
}

.form-item {
  margin-bottom: 40rpx;
  position: relative;
  z-index: 1;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: 28rpx;
  color: #666666;
  margin-bottom: 20rpx;
}

/* 输入框容器 - 确保可交互 */
.input-wrapper {
  position: relative;
  width: 100%;
}

.form-input {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  padding: 0 24rpx;
  border: 1px solid #E5E5E5;
  border-radius: 16rpx;
  font-size: 28rpx;
  background: #FFFFFF;
  box-sizing: border-box;
}

.form-picker {
  padding: 24rpx;
  border: 1px solid #E5E5E5;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #333333;
}

.form-textarea {
  width: 100%;
  padding: 24rpx;
  border: 1px solid #E5E5E5;
  border-radius: 16rpx;
  font-size: 28rpx;
  min-height: 160rpx;
  box-sizing: border-box;
}

/* ===== 母乳：模式切换 ===== */
.mode-switch {
  display: flex;
  background: #FFFFFF;
  border-radius: 50rpx;
  padding: 8rpx;
  margin: 0 auto 40rpx;
  width: 440rpx;
}

.mode-tab {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  font-size: 28rpx;
  color: #999999;
  border-radius: 44rpx;
}

.mode-tab.active {
  background: var(--primary-light);
  color: #FFFFFF;
  font-weight: bold;
}

/* ===== 计时区 ===== */
.timer-area {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 60rpx 40rpx;
}

.last-tip {
  text-align: center;
  font-size: 26rpx;
  color: var(--primary-light);
  background: var(--primary-bg);
  border-radius: 40rpx;
  padding: 12rpx 0;
  margin-bottom: 30rpx;
}

.unsaved-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  background: #FFF5E1;
  border-radius: 40rpx;
  padding: 12rpx 24rpx;
  margin-bottom: 30rpx;
}

.unsaved-icon {
  font-size: 24rpx;
}

.unsaved-text {
  font-size: 24rpx;
  color: #FF9500;
}

.timer-circles {
  display: flex;
  justify-content: space-around;
}

.timer-side {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.timer-circle {
  width: 240rpx;
  height: 240rpx;
  border-radius: 50%;
  background: radial-gradient(circle, var(--primary-bg) 0%, var(--primary-lighter) 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx var(--primary-shadow);
}

.timer-circle.running {
  background: radial-gradient(circle, var(--primary-lighter) 0%, var(--primary-light) 100%);
}

.side-label {
  font-size: 32rpx;
  font-weight: bold;
  color: var(--primary-light);
  margin-bottom: 12rpx;
}

.timer-circle.running .side-label {
  color: #FFFFFF;
}

.side-icon {
  font-size: 64rpx;
  color: var(--primary-color);
}

.timer-circle.running .side-icon {
  color: #FFFFFF;
}

.side-time {
  margin-top: 24rpx;
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
}

.timer-total {
  text-align: center;
  margin-top: 48rpx;
  font-size: 28rpx;
  color: #666666;
}

/* ===== 奶瓶刻度卡片 ===== */
.bottle-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 40rpx;
  margin-top: 30rpx;
}

.bottle-card-title {
  font-size: 28rpx;
  color: #666666;
  margin-bottom: 30rpx;
}

.bottle-visual {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bottle-cap {
  width: 120rpx;
  height: 36rpx;
  background: var(--primary-light);
  border-radius: 24rpx 24rpx 8rpx 8rpx;
}

.bottle-body {
  width: 360rpx;
  background: linear-gradient(180deg, var(--primary-bg) 0%, var(--primary-lighter) 100%);
  border-radius: 0 0 80rpx 80rpx;
  border: 4rpx solid var(--primary-lighter);
  border-top: none;
  padding: 48rpx 24rpx 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.amount-display {
  font-size: 80rpx;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 32rpx;
}

.amount-unit {
  font-size: 36rpx;
  color: var(--primary-light);
}

.quick-amounts {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16rpx;
}

.quick-amount {
  width: 88rpx;
  text-align: center;
  padding: 12rpx 0;
  background: #FFFFFF;
  border-radius: 32rpx;
  font-size: 26rpx;
  color: var(--primary-light);
  border: 1px solid var(--primary-lighter);
}

.quick-amount.active {
  background: var(--primary-light);
  color: #FFFFFF;
  border-color: var(--primary-light);
}

.amount-stepper {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-top: 40rpx;
}

.stepper-btn {
  width: 100rpx;
  text-align: center;
  padding: 20rpx 0;
  background: var(--primary-bg);
  border-radius: 16rpx;
  font-size: 28rpx;
  color: var(--primary-color);
}

.stepper-input {
  flex: 1;
  padding: 20rpx;
  border: 1px solid #E5E5E5;
  border-radius: 16rpx;
  font-size: 28rpx;
  text-align: center;
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
  background: var(--primary-gradient);
  font-size: 28rpx;
  color: #FFFFFF;
  box-shadow: 0 6rpx 20rpx var(--primary-shadow);
}
</style>

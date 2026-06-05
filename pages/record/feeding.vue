<template>
  <view class="feeding-page">
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
      <button class="btn-cancel" @click="handleCancel">取消</button>
      <button class="btn-save" @click="handleSave">保存</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { db } from '@/utils/database'
import { getDeviceId, formatTime } from '@/utils/device'

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
const timerStart = ref(0)
const baseLeft = ref(0)
const baseRight = ref(0)
let timerHandle: any = null
const lastBreastTip = ref('')

// 手动输入（分钟）
const manualLeft = ref('')
const manualRight = ref('')

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const toggleTimer = (side: 'left' | 'right') => {
  if (runningSide.value === side) {
    // 暂停当前侧
    stopTimer()
    runningSide.value = ''
    return
  }
  // 若另一侧在计时，先结算
  if (runningSide.value) {
    stopTimer()
  }
  runningSide.value = side
  timerStart.value = Date.now()
  baseLeft.value = leftDuration.value
  baseRight.value = rightDuration.value
  timerHandle = setInterval(() => {
    const elapsed = Math.floor((Date.now() - timerStart.value) / 1000)
    if (runningSide.value === 'left') {
      leftDuration.value = baseLeft.value + elapsed
    } else if (runningSide.value === 'right') {
      rightDuration.value = baseRight.value + elapsed
    }
  }, 1000)
}

const stopTimer = () => {
  if (timerHandle) {
    clearInterval(timerHandle)
    timerHandle = null
  }
}

onUnmounted(() => {
  stopTimer()
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

const handleCancel = () => {
  uni.reLaunch({ url: '/pages/index/index' })
}

// 将 HH:mm 转换为今天对应的时间戳
const timeStrToTimestamp = (timeStr: string): number => {
  if (!timeStr) return Date.now()
  const parts = timeStr.split(':')
  const d = new Date()
  d.setHours(parseInt(parts[0]) || 0, parseInt(parts[1]) || 0, 0, 0)
  return d.getTime()
}

const handleSave = async () => {
  try {
    const now = Date.now()
    const uniqueId = `${now}_feeding_${getDeviceId()}`
    const deviceId = getDeviceId()
    const note = (formData.value.note || '').replace(/'/g, "''")

    if (feedType.value === 'breast') {
      let leftSec = 0
      let rightSec = 0
      let startTs = 0
      let endTs = now

      if (breastMode.value === 'timer') {
        stopTimer()
        leftSec = leftDuration.value
        rightSec = rightDuration.value
        if (leftSec + rightSec <= 0) {
          uni.showToast({ title: '请先开始计时', icon: 'none' })
          return
        }
        endTs = now
        startTs = now - (leftSec + rightSec) * 1000
      } else {
        leftSec = (Number(manualLeft.value) || 0) * 60
        rightSec = (Number(manualRight.value) || 0) * 60
        if (leftSec + rightSec <= 0) {
          uni.showToast({ title: '请输入喂奶时长', icon: 'none' })
          return
        }
        startTs = timeStrToTimestamp(formData.value.time)
        endTs = startTs + (leftSec + rightSec) * 1000
      }

      await db.executeSql(`
        INSERT INTO feeds (unique_id, type, amount, unit, left_duration, right_duration, start_time, end_time, note, timestamp, device_id, created_at)
        VALUES ('${uniqueId}', 'breast', 0, 'min', ${leftSec}, ${rightSec}, ${startTs}, ${endTs}, '${note}', ${startTs}, '${deviceId}', ${now})
      `)
    } else {
      const amount = Number(formData.value.amount) || 0
      if (amount <= 0) {
        uni.showToast({ title: '请输入喂奶量', icon: 'none' })
        return
      }
      const ts = timeStrToTimestamp(formData.value.time)
      await db.executeSql(`
        INSERT INTO feeds (unique_id, type, amount, unit, left_duration, right_duration, note, timestamp, device_id, created_at)
        VALUES ('${uniqueId}', '${feedType.value}', ${amount}, 'ml', 0, 0, '${note}', ${ts}, '${deviceId}', ${now})
      `)
    }

    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1200)
  } catch (error) {
    console.error('保存失败', error)
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

// 加载上次母乳记录提示
onMounted(async () => {
  try {
    const rows = await db.selectSql(`
      SELECT timestamp FROM feeds WHERE type = 'breast' ORDER BY timestamp DESC LIMIT 1
    `)
    if (rows && rows.length > 0) {
      const diff = Date.now() - rows[0].timestamp
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      lastBreastTip.value = hours > 0 ? `${hours}小时${minutes}分钟前` : `${minutes}分钟前`
    }
  } catch (e) {
    console.error('加载上次记录失败', e)
  }
})
</script>

<style scoped>
.feeding-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding: 15px;
}

.manual-area {
  position: relative;
  z-index: 1;
}

.form-section {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
  position: relative;
  z-index: 1;
}

.note-section {
  margin-top: 15px;
}

.form-item {
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: 14px;
  color: #666666;
  margin-bottom: 10px;
}

/* 输入框容器 - 确保可交互 */
.input-wrapper {
  position: relative;
  width: 100%;
}

.form-input {
  width: 100%;
  height: 44px;
  line-height: 44px;
  padding: 0 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  background: #FFFFFF;
  box-sizing: border-box;
}

.form-picker {
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  color: #333333;
}

.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  min-height: 80px;
  box-sizing: border-box;
}

/* ===== 母乳：模式切换 ===== */
.mode-switch {
  display: flex;
  background: #FFFFFF;
  border-radius: 25px;
  padding: 4px;
  margin: 0 auto 20px;
  width: 220px;
}

.mode-tab {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: 14px;
  color: #999999;
  border-radius: 22px;
}

.mode-tab.active {
  background: #FF9EC4;
  color: #FFFFFF;
  font-weight: bold;
}

/* ===== 计时区 ===== */
.timer-area {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 30px 20px;
}

.last-tip {
  text-align: center;
  font-size: 13px;
  color: #FF9EC4;
  background: #FFEEF4;
  border-radius: 20px;
  padding: 6px 0;
  margin-bottom: 30px;
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
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, #FFF5F7 0%, #FFE0EC 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(255, 158, 196, 0.25);
}

.timer-circle.running {
  background: radial-gradient(circle, #FFE0EC 0%, #FF9EC4 100%);
}

.side-label {
  font-size: 16px;
  font-weight: bold;
  color: #FF9EC4;
  margin-bottom: 6px;
}

.timer-circle.running .side-label {
  color: #FFFFFF;
}

.side-icon {
  font-size: 32px;
  color: #FF6BA8;
}

.timer-circle.running .side-icon {
  color: #FFFFFF;
}

.side-time {
  margin-top: 12px;
  font-size: 18px;
  font-weight: bold;
  color: #333333;
}

.timer-total {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #666666;
}

/* ===== 奶瓶刻度卡片 ===== */
.bottle-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
  margin-top: 15px;
}

.bottle-card-title {
  font-size: 14px;
  color: #666666;
  margin-bottom: 15px;
}

.bottle-visual {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bottle-cap {
  width: 60px;
  height: 18px;
  background: #FF9EC4;
  border-radius: 12px 12px 4px 4px;
}

.bottle-body {
  width: 180px;
  background: linear-gradient(180deg, #FFF5F7 0%, #FFE0EC 100%);
  border-radius: 0 0 40px 40px;
  border: 2px solid #FFD0E2;
  border-top: none;
  padding: 24px 12px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.amount-display {
  font-size: 40px;
  font-weight: bold;
  color: #FF6BA8;
  margin-bottom: 16px;
}

.amount-unit {
  font-size: 18px;
  color: #FF9EC4;
}

.quick-amounts {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.quick-amount {
  width: 44px;
  text-align: center;
  padding: 6px 0;
  background: #FFFFFF;
  border-radius: 16px;
  font-size: 13px;
  color: #FF9EC4;
  border: 1px solid #FFD0E2;
}

.quick-amount.active {
  background: #FF9EC4;
  color: #FFFFFF;
  border-color: #FF9EC4;
}

.amount-stepper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
}

.stepper-btn {
  width: 50px;
  text-align: center;
  padding: 10px 0;
  background: #FFEEF4;
  border-radius: 8px;
  font-size: 14px;
  color: #FF6BA8;
}

.stepper-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
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
</style>

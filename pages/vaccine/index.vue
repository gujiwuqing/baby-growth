<template>
  <view class="vaccine-page" :style="themeVars">
    <!-- 接种进度卡片 -->
    <view class="progress-card">
      <view class="progress-title">接种进度</view>
      <text class="progress-text">已完成 {{ doneCount }}/{{ totalCount }} 针</text>
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
      </view>
      <text class="progress-percent">{{ progressPercent }}%</text>
    </view>

    <!-- 即将接种提醒 -->
    <view v-if="upcomingVaccine" class="upcoming-card">
      <view class="upcoming-icon">⏰</view>
      <view class="upcoming-info">
        <text class="upcoming-name">{{ upcomingVaccine.name }}</text>
        <text class="upcoming-date">{{ upcomingVaccine.date }}</text>
        <text class="upcoming-days">还有 {{ upcomingVaccine.days }} 天</text>
      </view>
    </view>

    <!-- 接种计划 -->
    <view class="plan-section">
      <view class="section-header">
        <text class="section-title">接种计划</text>
        <view class="plan-tabs">
          <text 
            :class="['tab', activeTab === 'free' ? 'active' : '']" 
            @click="switchTab('free')"
          >免费疫苗</text>
          <text 
            :class="['tab', activeTab === 'paid' ? 'active' : '']" 
            @click="switchTab('paid')"
          >自费疫苗</text>
        </view>
      </view>

      <scroll-view class="plan-scroll" scroll-y>
        <view class="empty-tip" v-if="filteredVaccines.length === 0">
          暂无疫苗计划
        </view>
        
        <view 
          v-for="vaccine in filteredVaccines" 
          :key="vaccine.id" 
          class="plan-item"
          @click="showVaccineDetail(vaccine)"
        >
          <view class="vaccine-status">
            <text v-if="vaccine.status === 'done'" class="status-done">✓</text>
            <text v-else-if="vaccine.status === 'pending'" class="status-pending">⏳</text>
            <text v-else class="status-missed">○</text>
          </view>
          <view class="vaccine-info">
            <text class="vaccine-name">{{ vaccine.name }}</text>
            <text class="vaccine-age">{{ vaccine.ageRange }}</text>
          </view>
          <view class="vaccine-action">
            <text 
              v-if="vaccine.status === 'pending'" 
              class="action-btn"
              @click.stop="recordVaccine(vaccine)"
            >记录</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 自定义 TabBar -->
    <CustomTabBar :current="2" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { db, escapeSqlValue } from '@/utils/database'
import { formatTime, getDeviceId } from '@/utils/device'
import { FREE_VACCINES, PAID_VACCINES, getVaccineFullName } from '@/utils/vaccineData'
import CustomTabBar from '@/components/CustomTabBar/CustomTabBar.vue'
import { useTheme } from '@/composables/useTheme'

const { themeVars, initTheme } = useTheme()

/** 将 uni.showModal 包装为 Promise，兼容 App 端 */
const showConfirm = (title: string, content: string): Promise<boolean> => {
  return new Promise((resolve) => {
    uni.showModal({
      title,
      content,
      success: (res) => resolve(!!res.confirm),
      fail: () => resolve(false)
    })
  })
}

const activeTab = ref('free')
const allVaccines = ref<any[]>([])
let isInitializing = false

const doneCount = computed(() => {
  return allVaccines.value.filter(v => v.status === 'done').length
})

const totalCount = computed(() => {
  return allVaccines.value.length
})

const progressPercent = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((doneCount.value / totalCount.value) * 100)
})

const upcomingVaccine = computed(() => {
  const pending = allVaccines.value
    .filter(v => v.status === 'pending' && v.scheduledDate > Date.now())
    .sort((a, b) => a.scheduledDate - b.scheduledDate)
  
  if (pending.length === 0) return null
  
  const vaccine = pending[0]
  const days = Math.ceil((vaccine.scheduledDate - Date.now()) / (1000 * 60 * 60 * 24))
  
  return {
    name: vaccine.name,
    date: formatTime(vaccine.scheduledDate, 'YYYY-MM-DD'),
    days
  }
})

const filteredVaccines = computed(() => {
  return allVaccines.value.filter(v => v.vaccineType === activeTab.value)
})

const switchTab = (tab: string) => {
  activeTab.value = tab
}

const showVaccineDetail = (vaccine: any) => {
  uni.showModal({
    title: vaccine.name,
    content: `接种时间：${vaccine.ageRange}\n状态：${vaccine.status === 'done' ? '已接种' : '待接种'}\n${vaccine.note || ''}`,
    showCancel: false
  })
}

const recordVaccine = async (vaccine: any) => {
  // 获取疫苗详细信息
  const allVaccineList = [...FREE_VACCINES, ...PAID_VACCINES]
  const vaccineInfo = allVaccineList.find(v => 
    `${v.name}${v.dose}` === vaccine.name || v.name === vaccine.name
  )
  
  const confirmed = await showConfirm(
    '确认接种',
    `确认已接种 ${vaccine.name}？\n\n接种部位：${vaccineInfo?.injectionSite?.join('/') || '请选择'}\n预防疾病：${vaccineInfo?.diseases || ''}`
  )
  if (!confirmed) return
  
  try {
    await db.executeSql(`
      UPDATE vaccines 
      SET status = 'done', 
          actual_date = ${Date.now()},
          injection_site = '${escapeSqlValue(vaccineInfo?.injectionSite?.[0] || '')}'
      WHERE id = ${vaccine.id}
    `)
    uni.showToast({ title: '记录成功', icon: 'success' })
    await loadVaccines()
  } catch (error) {
    console.error('记录失败', error)
    uni.showToast({ title: '记录失败', icon: 'none' })
  }
}

const babyBirthday = ref('')

const loadVaccines = async (allowInit = true) => {
  try {
    const result = await db.selectSql(`
      SELECT * FROM vaccines ORDER BY scheduled_date ASC
    `)
    
    if (result && result.length > 0) {
      allVaccines.value = result.map((v: any) => ({
        id: v.id,
        name: v.vaccine_name,
        vaccineType: v.vaccine_type,
        status: v.status,
        scheduledDate: v.scheduled_date,
        actualDate: v.actual_date,
        ageRange: calculateAgeRange(v.scheduled_date),
        note: v.note
      }))
    } else if (allowInit) {
      // 仅在首次允许时初始化，避免与 onShow 多路径重复触发
      await initDefaultVaccines()
    }
  } catch (error) {
    console.error('查询疫苗数据失败', error)
  }
}

const calculateAgeRange = (timestamp: number): string => {
  // 根据宝宝生日计算月龄
  if (!babyBirthday.value) return '未知'
  
  const birthday = new Date(babyBirthday.value).getTime()
  const months = Math.floor((timestamp - birthday) / (1000 * 60 * 60 * 24 * 30))
  
  if (months <= 0) return '出生时'
  if (months === 1) return '1月龄'
  return `${months}月龄`
}

/**
 * 精确计算生日 + N个月后的日期时间戳
 * 处理月末边界情况（如 1月31日 + 1月 = 2月28/29日）
 */
const addMonthsToBirthday = (birthdayStr: string, months: number): number => {
  const birthday = new Date(birthdayStr)
  const result = new Date(birthday)
  result.setMonth(result.getMonth() + months)
  
  // 处理月末边界：如果目标月份没有该日期，自动调整到月末
  // 例如：1月31日 + 1月 = 2月28/29日（而非3月2/3日）
  if (result.getDate() !== birthday.getDate()) {
    result.setDate(0) // 设置为上月最后一天
  }
  
  return result.getTime()
}

/**
 * 生日变更后重算所有未接种疫苗的排期。
 * 已接种(done)的保留实际接种日期不动；pending 的按 生日 + age_months 重算。
 */
const recalcScheduledDates = async (): Promise<boolean> => {
  if (!babyBirthday.value) return false

  const birthdayTime = new Date(babyBirthday.value).getTime()
  if (isNaN(birthdayTime)) return false

  const rows = await db.selectSql(`
    SELECT id, vaccine_name, age_months, scheduled_date FROM vaccines WHERE status = 'pending'
  `)
  if (!rows || rows.length === 0) return false

  let updatedCount = 0
  for (const row of rows) {
    const ageMonths = await resolveAgeMonths(row)
    if (ageMonths === null) continue

    // 使用精确月龄计算
    const newScheduled = addMonthsToBirthday(babyBirthday.value, ageMonths)
    if (newScheduled === row.scheduled_date) continue

    await db.executeSql(`
      UPDATE vaccines SET scheduled_date = ${newScheduled}, age_months = ${ageMonths} WHERE id = ${row.id}
    `)
    updatedCount++
  }

  return updatedCount > 0
}

/**
 * 解析某条疫苗记录的接种月龄：优先取库中 age_months，
 * 旧数据为空时从 vaccineData 静态数据按疫苗名匹配查出 ageMonths。
 */
let _vaccineDataCache: any = null
const resolveAgeMonths = async (row: any): Promise<number | null> => {
  if (row.age_months !== null && row.age_months !== undefined && row.age_months !== '') {
    return Number(row.age_months)
  }
  // 旧数据无 age_months：从静态疫苗数据按 vaccine_name 精确匹配
  if (!_vaccineDataCache) {
    _vaccineDataCache = { vaccines: [...FREE_VACCINES, ...PAID_VACCINES], getVaccineFullName }
  }
  if (row.vaccine_name) {
    const match = _vaccineDataCache.vaccines.find(
      (v: any) => _vaccineDataCache.getVaccineFullName(v) === row.vaccine_name
    )
    if (match && match.ageMonths >= 0) return match.ageMonths
  }
  return null
}

const initDefaultVaccines = async () => {
  // 并发锁：避免 onShow 与 loadVaccines 多路径重复初始化
  if (isInitializing) return
  isInitializing = true

  try {
    const vaccineList = [...FREE_VACCINES, ...PAID_VACCINES]
    
    // 必须先有宝宝生日才能正确计算接种排期
    if (!babyBirthday.value) {
      uni.showToast({ title: '请先在设置中填写宝宝生日', icon: 'none' })
      return
    }
    const now = Date.now()
    
    for (let index = 0; index < vaccineList.length; index++) {
      const vaccine = vaccineList[index]
      try {
        // 使用精确月龄计算接种日期
        const scheduledDate = addMonthsToBirthday(babyBirthday.value, vaccine.ageMonths)
        // 唯一 id 用稳定字段组合，避免毫秒内 Date.now() 冲突
        const uniqueId = `${vaccine.type}_${vaccine.name}_${vaccine.dose}_${index}_${getDeviceId()}`
        const fullName = getVaccineFullName(vaccine)
        
        await db.executeSql(`
          INSERT OR IGNORE INTO vaccines (
            unique_id, vaccine_name, vaccine_type, dose, age_months,
            scheduled_date, status, device_id, created_at
          )
          VALUES (
            '${escapeSqlValue(uniqueId)}', '${escapeSqlValue(fullName)}', '${escapeSqlValue(vaccine.type)}', '${escapeSqlValue(vaccine.dose)}', ${vaccine.ageMonths},
            ${scheduledDate}, 'pending', '${escapeSqlValue(getDeviceId())}', ${now}
          )
        `)
      } catch (error) {
        console.error(`插入疫苗数据失败: ${vaccine.name}`, error)
      }
    }
    
    // 初始化后重新加载，但不允许再次触发初始化，防止循环
    await loadVaccines(false)
  } catch (error) {
    console.error('初始化疫苗数据失败', error)
    uni.showToast({ title: '初始化疫苗数据失败', icon: 'none' })
  } finally {
    isInitializing = false
  }
}

onShow(async () => {
  initTheme()
  // 重置并发锁，防止上次异常退出或清空数据后锁残留
  isInitializing = false

  try {
    await db.open()
    await db.initTables()
    
    // 加载宝宝信息
    try {
      const babyResult = await db.selectSql('SELECT birthday FROM baby_info LIMIT 1')
      if (babyResult && babyResult.length > 0) {
        babyBirthday.value = babyResult[0].birthday
      } else {
        // 如果没有宝宝信息，创建默认信息
        const now = Date.now()
        const birthday = formatTime(now, 'YYYY-MM-DD')
        await db.executeSql(`
          INSERT INTO baby_info (name, birthday, created_at, updated_at)
          VALUES ('宝宝', '${escapeSqlValue(birthday)}', ${now}, ${now})
        `)
        babyBirthday.value = birthday
      }
    } catch (error) {
      console.error('加载宝宝信息失败', error)
    }
    
    await loadVaccines()

    // 生日变更检测：与上次同步过的生日不一致则重算未接种疫苗排期
    try {
      const syncedBirthday = uni.getStorageSync('vaccine_synced_birthday')
      if (babyBirthday.value && syncedBirthday !== babyBirthday.value) {
        const changed = await recalcScheduledDates()
        uni.setStorageSync('vaccine_synced_birthday', babyBirthday.value)
        if (changed) {
          await loadVaccines(false)
        }
      }
    } catch (error) {
      console.error('同步疫苗排期失败', error)
    }
  } catch (error) {
    console.error('加载数据失败', error)
    uni.showToast({ 
      title: '数据加载失败，请重启应用', 
      icon: 'none',
      duration: 3000
    })
  }
})
</script>

<style scoped>
.vaccine-page {
  min-height: 100vh;
  background: var(--background-color, #F5F5F5);
  padding: 30rpx;
  padding-bottom: 200rpx;
}

/* 进度卡片 */
.progress-card {
  background: linear-gradient(135deg, #8CC9B0 0%, #A8DBC5 50%, #C2E8D6 100%);
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 12rpx 40rpx rgba(140, 201, 176, 0.25), 0 4rpx 12rpx rgba(140, 201, 176, 0.1);
  position: relative;
  overflow: hidden;
}

.progress-card::after {
  display: none;
}

.progress-title {
  font-size: 32rpx;
  font-weight: 800;
  color: #FFFFFF;
  margin-bottom: 20rpx;
  letter-spacing: 0.5rpx;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.progress-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.92);
  display: block;
  margin-bottom: 24rpx;
  font-weight: 500;
}

.progress-bar {
  height: 16rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8rpx;
  overflow: hidden;
  margin-bottom: 16rpx;
}

.progress-fill {
  height: 100%;
  background: #FFFFFF;
  border-radius: 8rpx;
  transition: width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.progress-percent {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
  display: block;
  text-align: right;
  font-weight: 600;
}

/* 即将接种 */
.upcoming-card {
  background: var(--card-color, #FFFFFF);
  border-radius: var(--card-radius, 16rpx);
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: var(--card-shadow, 0 2rpx 12rpx rgba(0,0,0,0.06));
  display: flex;
  align-items: center;
  gap: 24rpx;
  border-left: 6rpx solid var(--accent-peach, #F5C5A3);
}

.upcoming-icon {
  font-size: 56rpx;
  width: 88rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(245, 197, 163, 0.15);
  border-radius: 50%;
  flex-shrink: 0;
}

.upcoming-info {
  flex: 1;
}

.upcoming-name {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--text-color, #3D3036);
  display: block;
  margin-bottom: 8rpx;
}

.upcoming-date {
  font-size: 26rpx;
  color: var(--text-secondary, #8A7E84);
  display: block;
  margin-bottom: 4rpx;
}

.upcoming-days {
  font-size: 24rpx;
  color: var(--primary-color, #E8857A);
  display: block;
  font-weight: 600;
}

/* 接种计划 */
.plan-section {
  background: var(--card-color, #FFFFFF);
  border-radius: var(--card-radius, 16rpx);
  padding: 30rpx;
  box-shadow: var(--card-shadow, 0 2rpx 12rpx rgba(0,0,0,0.06));
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 800;
  color: var(--text-color, #3D3036);
  letter-spacing: 0.5rpx;
}

.plan-tabs {
  display: flex;
  gap: 16rpx;
}

.tab {
  font-size: 26rpx;
  color: var(--text-tertiary, #BDB2B7);
  padding: 10rpx 24rpx;
  border-radius: 8rpx;
  background: var(--divider-color, #F8F0EC);
  font-weight: 600;
  transition: all 0.2s;
}

.tab.active {
  color: #FFFFFF;
  background: var(--accent-mint, #8CC9B0);
  box-shadow: 0 4rpx 12rpx rgba(140, 201, 176, 0.3);
}

.plan-scroll {
  max-height: 1000rpx;
}

.empty-tip {
  text-align: center;
  color: var(--text-tertiary, #BDB2B7);
  font-size: 28rpx;
  padding: 80rpx 40rpx;
  line-height: 1.8;
}

.plan-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1px solid var(--divider-color, #F8F0EC);
}

.plan-item:last-child {
  border-bottom: none;
}

.vaccine-status {
  width: 64rpx;
  height: 64rpx;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  font-size: 32rpx;
}

.status-done {
  background: #34D399;
  color: #FFFFFF;
  width: 64rpx;
  height: 64rpx;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-pending {
  background: #FCD34D;
  color: #FFFFFF;
  width: 64rpx;
  height: 64rpx;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-missed {
  background: #E5E7EB;
  color: #9CA3AF;
  width: 64rpx;
  height: 64rpx;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vaccine-info {
  flex: 1;
}

.vaccine-name {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--text-color, #3D3036);
  display: block;
  margin-bottom: 8rpx;
}

.vaccine-age {
  font-size: 24rpx;
  color: var(--text-tertiary, #BDB2B7);
  display: block;
}

.vaccine-action {
  margin-left: 24rpx;
}

.action-btn {
  font-size: 26rpx;
  color: #FFFFFF;
  background: var(--accent-mint, #8CC9B0);
  padding: 12rpx 28rpx;
  border-radius: 8rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(140, 201, 176, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}

.action-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 8rpx rgba(140, 201, 176, 0.2);
}
</style>

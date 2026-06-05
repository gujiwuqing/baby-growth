<template>
  <view class="vaccine-page">
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
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { db, escapeSqlValue } from '@/utils/database'
import { formatTime, getDeviceId } from '@/utils/device'

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

const recordVaccine = (vaccine: any) => {
  // 获取疫苗详细信息
  import('@/utils/vaccineData').then(({ FREE_VACCINES, PAID_VACCINES }) => {
    const allVaccines = [...FREE_VACCINES, ...PAID_VACCINES]
    const vaccineInfo = allVaccines.find(v => 
      `${v.name}${v.dose}` === vaccine.name || v.name === vaccine.name
    )
    
    uni.showModal({
      title: '确认接种',
      content: `确认已接种 ${vaccine.name}？\n\n接种部位：${vaccineInfo?.injectionSite?.join('/') || '请选择'}\n预防疾病：${vaccineInfo?.diseases || ''}`,
      success: async (res) => {
        if (res.confirm) {
          try {
            // 更新接种状态
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
      }
    })
  })
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

const MONTH_MS = 30 * 24 * 60 * 60 * 1000

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

    const newScheduled = birthdayTime + ageMonths * MONTH_MS
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
    const { FREE_VACCINES, PAID_VACCINES, getVaccineFullName } = await import('@/utils/vaccineData')
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
    // 从疫苗数据文件导入完整数据
    const { FREE_VACCINES, PAID_VACCINES, getVaccineFullName } = await import('@/utils/vaccineData')
    
    const vaccineList = [...FREE_VACCINES, ...PAID_VACCINES]
    
    // 必须先有宝宝生日才能正确计算接种排期
    if (!babyBirthday.value) {
      uni.showToast({ title: '请先在设置中填写宝宝生日', icon: 'none' })
      return
    }
    const babyBirthdayTime = new Date(babyBirthday.value).getTime()
    const now = Date.now()
    
    for (let index = 0; index < vaccineList.length; index++) {
      const vaccine = vaccineList[index]
      try {
        const scheduledDate = babyBirthdayTime + vaccine.ageMonths * 30 * 24 * 60 * 60 * 1000
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
  // 重置并发锁，防止上次异常退出或清空数据后锁残留
  isInitializing = false

  try {
    await db.open()
    await db.initTables()
    
    // 加载宝宝信息
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
    
    await loadVaccines()

    // 生日变更检测：与上次同步过的生日不一致则重算未接种疫苗排期
    const syncedBirthday = uni.getStorageSync('vaccine_synced_birthday')
    if (babyBirthday.value && syncedBirthday !== babyBirthday.value) {
      const changed = await recalcScheduledDates()
      uni.setStorageSync('vaccine_synced_birthday', babyBirthday.value)
      if (changed) {
        await loadVaccines(false)
      }
    }
  } catch (error) {
    console.error('加载数据失败', error)
    uni.showToast({ title: '加载数据失败', icon: 'none' })
  }
})
</script>

<style scoped>
.vaccine-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding: 30rpx;
  padding-bottom: 40rpx;
}

/* 进度卡片 */
.progress-card {
  background: linear-gradient(135deg, #FF9EC4 0%, #FFB8D9 100%);
  border-radius: 40rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(255, 158, 196, 0.3);
}

.progress-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #FFFFFF;
  margin-bottom: 20rpx;
}

.progress-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  display: block;
  margin-bottom: 24rpx;
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
  transition: width 0.3s;
}

.progress-percent {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
  display: block;
  text-align: right;
}

/* 即将接种 */
.upcoming-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(255, 158, 196, 0.1);
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.upcoming-icon {
  font-size: 64rpx;
}

.upcoming-info {
  flex: 1;
}

.upcoming-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  display: block;
  margin-bottom: 8rpx;
}

.upcoming-date {
  font-size: 26rpx;
  color: #666666;
  display: block;
  margin-bottom: 4rpx;
}

.upcoming-days {
  font-size: 24rpx;
  color: #FF6BA8;
  display: block;
}

/* 接种计划 */
.plan-section {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(255, 158, 196, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.plan-tabs {
  display: flex;
  gap: 24rpx;
}

.tab {
  font-size: 26rpx;
  color: #999999;
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  background: #F5F5F5;
}

.tab.active {
  color: #FFFFFF;
  background: #FF9EC4;
}

.plan-scroll {
  max-height: 1000rpx;
}

.empty-tip {
  text-align: center;
  color: #BBBBBB;
  font-size: 28rpx;
  padding: 80rpx 40rpx;
}

.plan-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1px solid #F8F8F8;
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
  font-weight: bold;
  color: #333333;
  display: block;
  margin-bottom: 8rpx;
}

.vaccine-age {
  font-size: 24rpx;
  color: #999999;
  display: block;
}

.vaccine-action {
  margin-left: 24rpx;
}

.action-btn {
  font-size: 26rpx;
  color: #FFFFFF;
  background: #FF9EC4;
  padding: 12rpx 24rpx;
  border-radius: 24rpx;
}
</style>

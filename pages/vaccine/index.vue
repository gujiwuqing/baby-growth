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
import { db } from '@/utils/database'
import { formatTime, getDeviceId } from '@/utils/device'

const activeTab = ref('free')
const allVaccines = ref<any[]>([])

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
                  injection_site = '${vaccineInfo?.injectionSite?.[0] || ''}'
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

const loadVaccines = async () => {
  try {
    console.log('开始查询疫苗数据...')
    
    const result = await db.selectSql(`
      SELECT * FROM vaccines ORDER BY scheduled_date ASC
    `)
    
    console.log('查询结果:', result)
    
    if (result && result.length > 0) {
      console.log(`找到 ${result.length} 条疫苗数据`)
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
    } else {
      console.log('疫苗数据为空，开始初始化...')
      // 如果没有数据，初始化默认疫苗计划
      await initDefaultVaccines()
    }
  } catch (error) {
    console.error('查询疫苗数据失败', error)
    // 如果查询失败，也尝试初始化
    await initDefaultVaccines()
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

const initDefaultVaccines = async () => {
  try {
    console.log('开始初始化疫苗数据...')
    
    // 从疫苗数据文件导入完整数据
    const { FREE_VACCINES, PAID_VACCINES, getVaccineFullName } = await import('@/utils/vaccineData')
    
    const allVaccines = [...FREE_VACCINES, ...PAID_VACCINES]
    console.log(`准备插入 ${allVaccines.length} 条疫苗数据`)
    
    // 如果有宝宝生日，根据生日计算接种时间
    const babyBirthdayTime = babyBirthday.value 
      ? new Date(babyBirthday.value).getTime()
      : Date.now()
    
    let successCount = 0
    let failCount = 0
    
    for (const vaccine of allVaccines) {
      try {
        const scheduledDate = babyBirthdayTime + vaccine.ageMonths * 30 * 24 * 60 * 60 * 1000
        const uniqueId = `${Date.now()}_${vaccine.name}_${vaccine.type}_${vaccine.dose}_${getDeviceId()}`
        const fullName = getVaccineFullName(vaccine)
        
        await db.executeSql(`
          INSERT INTO vaccines (
            unique_id, vaccine_name, vaccine_type, dose,
            scheduled_date, status, device_id, created_at
          )
          VALUES (
            '${uniqueId}', '${fullName}', '${vaccine.type}', '${vaccine.dose}',
            ${scheduledDate}, 'pending', '${getDeviceId()}', ${Date.now()}
          )
        `)
        
        successCount++
      } catch (error) {
        console.error(`插入疫苗数据失败: ${vaccine.name}`, error)
        failCount++
      }
    }
    
    console.log(`疫苗数据初始化完成：成功 ${successCount} 条，失败 ${failCount} 条`)
    
    // H5环境：保存数据到localStorage
    // #ifndef APP-PLUS
    db.saveToStorage()
    console.log('H5环境：数据已保存到localStorage')
    // #endif
    
    await loadVaccines()
  } catch (error) {
    console.error('初始化疫苗数据失败', error)
    uni.showToast({ title: '初始化疫苗数据失败', icon: 'none' })
  }
}

onShow(async () => {
  try {
    console.log('疫苗接种页面加载...')
    
    await db.open()
    console.log('数据库已打开')
    
    await db.initTables()
    console.log('数据库表已初始化')
    
    // 加载宝宝信息
    const babyResult = await db.selectSql('SELECT birthday FROM baby_info LIMIT 1')
    if (babyResult && babyResult.length > 0) {
      babyBirthday.value = babyResult[0].birthday
      console.log('宝宝生日:', babyBirthday.value)
    } else {
      // 如果没有宝宝信息，创建默认信息
      const now = Date.now()
      const birthday = formatTime(now, 'YYYY-MM-DD')
      await db.executeSql(`
        INSERT INTO baby_info (name, birthday, created_at, updated_at)
        VALUES ('宝宝', '${birthday}', ${now}, ${now})
      `)
      babyBirthday.value = birthday
      console.log('已创建默认宝宝信息，生日:', birthday)
      
      // H5环境：保存数据
      // #ifndef APP-PLUS
      db.saveToStorage()
      // #endif
    }
    
    await loadVaccines()
    console.log('疫苗数据加载完成')
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
  padding: 15px;
  padding-bottom: 20px;
}

/* 进度卡片 */
.progress-card {
  background: linear-gradient(135deg, #FF9EC4 0%, #FFB8D9 100%);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 4px 12px rgba(255, 158, 196, 0.3);
}

.progress-title {
  font-size: 16px;
  font-weight: bold;
  color: #FFFFFF;
  margin-bottom: 10px;
}

.progress-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  display: block;
  margin-bottom: 12px;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: #FFFFFF;
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-percent {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  display: block;
  text-align: right;
}

/* 即将接种 */
.upcoming-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(255, 158, 196, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
}

.upcoming-icon {
  font-size: 32px;
}

.upcoming-info {
  flex: 1;
}

.upcoming-name {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
  display: block;
  margin-bottom: 4px;
}

.upcoming-date {
  font-size: 13px;
  color: #666666;
  display: block;
  margin-bottom: 2px;
}

.upcoming-days {
  font-size: 12px;
  color: #FF6BA8;
  display: block;
}

/* 接种计划 */
.plan-section {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(255, 158, 196, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
}

.plan-tabs {
  display: flex;
  gap: 12px;
}

.tab {
  font-size: 13px;
  color: #999999;
  padding: 4px 10px;
  border-radius: 12px;
  background: #F5F5F5;
}

.tab.active {
  color: #FFFFFF;
  background: #FF9EC4;
}

.plan-scroll {
  max-height: 500px;
}

.empty-tip {
  text-align: center;
  color: #BBBBBB;
  font-size: 14px;
  padding: 40px 20px;
}

.plan-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #F8F8F8;
}

.plan-item:last-child {
  border-bottom: none;
}

.vaccine-status {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 16px;
}

.status-done {
  background: #34D399;
  color: #FFFFFF;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-pending {
  background: #FCD34D;
  color: #FFFFFF;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-missed {
  background: #E5E7EB;
  color: #9CA3AF;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vaccine-info {
  flex: 1;
}

.vaccine-name {
  font-size: 14px;
  font-weight: bold;
  color: #333333;
  display: block;
  margin-bottom: 4px;
}

.vaccine-age {
  font-size: 12px;
  color: #999999;
  display: block;
}

.vaccine-action {
  margin-left: 12px;
}

.action-btn {
  font-size: 13px;
  color: #FFFFFF;
  background: #FF9EC4;
  padding: 6px 12px;
  border-radius: 12px;
}
</style>

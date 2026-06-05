<template>
  <view class="album-page">
    <!-- 添加照片按钮 -->
    <view class="add-photo-btn" @click="choosePhoto">
      <text class="add-icon">+</text>
      <text class="add-text">添加照片</text>
    </view>

    <!-- 月份分组照片列表 -->
    <view class="photo-section" v-for="(group, index) in photoGroups" :key="index">
      <view class="section-title">{{ group.month }}</view>
      <view class="photo-grid">
        <view 
          class="photo-item" 
          v-for="photo in group.photos" 
          :key="photo.id"
          @click="previewPhoto(photo)"
        >
          <image class="photo-image" :src="photo.photo_path" mode="aspectFill"></image>
          <view class="photo-caption" v-if="photo.caption">{{ photo.caption }}</view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="photoGroups.length === 0">
      <view class="empty-icon">📸</view>
      <view class="empty-text">还没有照片</view>
      <view class="empty-desc">点击上方按钮添加宝宝的照片吧</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { db } from '@/utils/database'
import { getDeviceId, formatTime } from '@/utils/device'

const photoGroups = ref<any[]>([])

const choosePhoto = () => {
  uni.chooseImage({
    count: 9,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePaths = res.tempFilePaths
      
      for (const filePath of tempFilePaths) {
        await savePhoto(filePath)
      }
      
      uni.showToast({ title: '保存成功', icon: 'success' })
      loadPhotos()
    }
  })
}

const savePhoto = async (filePath: string) => {
  try {
    // #ifdef APP-PLUS
    // 压缩图片
    const compressRes = await new Promise<any>((resolve) => {
      uni.compressImage({
        src: filePath,
        quality: 80,
        success: (res) => resolve(res),
        fail: () => resolve({ tempFilePath: filePath })
      })
    })
    
    // 保存到本地
    const saveRes = await new Promise<any>((resolve) => {
      uni.saveFile({
        tempFilePath: compressRes.tempFilePath,
        success: (res) => resolve(res),
        fail: () => resolve(null)
      })
    })
    
    if (!saveRes) return
    
    const timestamp = Date.now()
    const uniqueId = `${timestamp}_photo_${getDeviceId()}`
    const month = formatTime(timestamp, 'YYYY年MM月')
    
    await db.executeSql(`
      INSERT INTO photos (unique_id, photo_path, month, timestamp, device_id, created_at)
      VALUES ('${uniqueId}', '${saveRes.savedFilePath}', '${month}', ${timestamp}, '${getDeviceId()}', ${timestamp})
    `)
    // #endif
    
    // #ifndef APP-PLUS
    // H5环境直接保存路径
    const timestamp = Date.now()
    const uniqueId = `${timestamp}_photo_${getDeviceId()}`
    const month = formatTime(timestamp, 'YYYY年MM月')
    
    await db.executeSql(`
      INSERT INTO photos (unique_id, photo_path, month, timestamp, device_id, created_at)
      VALUES ('${uniqueId}', '${filePath}', '${month}', ${timestamp}, '${getDeviceId()}', ${timestamp})
    `)
    // #endif
  } catch (error) {
    console.error('保存照片失败', error)
  }
}

const loadPhotos = async () => {
  try {
    const photos = await db.selectSql(`
      SELECT * FROM photos
      ORDER BY timestamp DESC
    `)
    
    // 按月份分组
    const groupMap = new Map<string, any[]>()
    
    if (photos && photos.length > 0) {
      photos.forEach((photo: any) => {
        const month = photo.month
        if (!groupMap.has(month)) {
          groupMap.set(month, [])
        }
        groupMap.get(month)!.push(photo)
      })
    }
    
    photoGroups.value = Array.from(groupMap.entries()).map(([month, photos]) => ({
      month,
      photos
    }))
  } catch (error) {
    console.error('加载照片失败', error)
  }
}

const previewPhoto = (photo: any) => {
  uni.previewImage({
    urls: [photo.photo_path],
    current: photo.photo_path
  })
}

onMounted(() => {
  loadPhotos()
})
</script>

<style scoped>
.album-page {
  min-height: 100vh;
  background: #FFF5F7;
  padding: 15px;
}

.add-photo-btn {
  background: #FFFFFF;
  border: 2px dashed #FF9EC4;
  border-radius: 16px;
  padding: 30px;
  text-align: center;
  margin-bottom: 15px;
}

.add-icon {
  display: block;
  font-size: 40px;
  color: #FF9EC4;
  margin-bottom: 10px;
}

.add-text {
  font-size: 14px;
  color: #666666;
}

.photo-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
  margin-bottom: 10px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
}

.photo-image {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  background: #F5F5F5;
}

.photo-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 5px;
  background: rgba(0, 0, 0, 0.5);
  color: #FFFFFF;
  font-size: 12px;
  border-radius: 0 0 8px 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  text-align: center;
  padding: 60px 40px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-text {
  font-size: 18px;
  font-weight: bold;
  color: #333333;
  margin-bottom: 10px;
}

.empty-desc {
  font-size: 14px;
  color: #999999;
}
</style>

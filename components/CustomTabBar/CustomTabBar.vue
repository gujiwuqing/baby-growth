<template>
  <view class="custom-tabbar" :style="themeVars">
    <view
      v-for="(tab, index) in tabs"
      :key="tab.pagePath"
      class="tab-item"
      :class="{ active: currentIndex === index }"
      @click="switchTab(tab, index)"
    >
      <view class="tab-icon-wrap">
        <image
          v-if="currentIndex === index"
          class="tab-icon"
          :src="tab.activeIconData"
          mode="aspectFit"
        />
        <image
          v-else
          class="tab-icon"
          :src="tab.iconData"
          mode="aspectFit"
        />
      </view>
      <text class="tab-text" :style="currentIndex === index ? { color: activeTheme.primary } : {}">
        {{ tab.text }}
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTheme } from '@/composables/useTheme'

const props = defineProps<{
  current: number
}>()

const { activeTheme, themeVars } = useTheme()
const currentIndex = ref(props.current)

watch(() => props.current, (val) => {
  currentIndex.value = val
})

/** SVG 图标 path 数据（从项目 SVG 文件提取） */
const iconPaths = {
  home: '<rect x="15" y="30" width="50" height="40" rx="6"/><polygon points="40,15 10,35 70,35"/><rect x="32" y="50" width="16" height="20" fill="white"/>',
  growth: '<circle cx="25" cy="55" r="8"/><circle cx="40" cy="40" r="8"/><circle cx="55" cy="50" r="8"/><line x1="25" y1="47" x2="25" y2="25" stroke="STROKE_COLOR" stroke-width="3"/><line x1="40" y1="32" x2="40" y2="25" stroke="STROKE_COLOR" stroke-width="3"/><line x1="55" y1="42" x2="55" y2="25" stroke="STROKE_COLOR" stroke-width="3"/>',
  vaccine: '<rect x="35" y="10" width="10" height="50" rx="3"/><rect x="30" y="22" width="20" height="6" rx="2"/><circle cx="40" cy="65" r="6"/>',
  settings: '<circle cx="40" cy="40" r="10"/><circle cx="40" cy="40" r="25" stroke="STROKE_COLOR" stroke-width="6" fill="none"/><rect x="37" y="8" width="6" height="12"/><rect x="37" y="61" width="6" height="12"/><rect x="8" y="37" width="12" height="6"/><rect x="61" y="37" width="12" height="6"/>'
}

/** 生成 SVG data URI */
function buildSvgDataUri(pathData: string, fillColor: string): string {
  const svgContent = pathData.replace(/STROKE_COLOR/g, fillColor)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="81" height="81" viewBox="0 0 81 81"><g fill="${fillColor}">${svgContent}</g></svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

const inactiveColor = '#BDB2B7'

interface TabItem {
  pagePath: string
  text: string
  iconKey: string
  iconData: string
  activeIconData: string
}

const tabs = computed<TabItem[]>(() => {
  const primaryColor = activeTheme.value.primary
  return [
    { pagePath: '/pages/index/index', text: '首页', iconKey: 'home' },
    { pagePath: '/pages/growth/index', text: '身高体重', iconKey: 'growth' },
    { pagePath: '/pages/vaccine/index', text: '疫苗接种', iconKey: 'vaccine' },
    { pagePath: '/pages/settings/index', text: '设置', iconKey: 'settings' }
  ].map(tab => ({
    ...tab,
    iconData: buildSvgDataUri(iconPaths[tab.iconKey as keyof typeof iconPaths], inactiveColor),
    activeIconData: buildSvgDataUri(iconPaths[tab.iconKey as keyof typeof iconPaths], primaryColor)
  }))
})

const switchTab = (tab: TabItem, index: number) => {
  if (currentIndex.value === index) return
  currentIndex.value = index
  uni.switchTab({ url: tab.pagePath })
}
</script>

<style scoped>
.custom-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 110rpx;
  padding-bottom: env(safe-area-inset-bottom);
  background: #FFFFFF;
  border-top: 1rpx solid rgba(240, 230, 224, 0.6);
  box-shadow: 0 -2rpx 16rpx rgba(0, 0, 0, 0.04);
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  position: relative;
  transition: transform 0.15s ease;
}

.tab-item:active {
  transform: scale(0.92);
}

.tab-icon-wrap {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4rpx;
}

.tab-icon {
  width: 48rpx;
  height: 48rpx;
}

.tab-text {
  font-size: 20rpx;
  color: #BDB2B7;
  font-weight: 600;
  letter-spacing: 0.3rpx;
  line-height: 1;
}

.tab-item.active .tab-text {
  font-weight: 700;
}
</style>

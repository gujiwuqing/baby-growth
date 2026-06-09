<template>
  <view class="custom-tabbar" :style="themeVars">
    <view
      v-for="(tab, index) in tabs"
      :key="tab.pagePath"
      class="tab-item"
      :class="{ active: current === index }"
      @click="switchTab(tab, index)"
    >
      <view class="tab-icon-wrap">
        <image
          v-if="current === index"
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
      <text class="tab-text" :style="current === index ? { color: activeTheme.primary } : {}">
        {{ tab.text }}
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

const props = defineProps<{
  current: number
}>()

const { activeTheme, themeVars } = useTheme()

/** 生成 SVG data URI — 每个图标使用独立 path，用 FILL 占位符替换颜色 */
function buildSvgDataUri(svgTemplate: string, fillColor: string): string {
  const svg = svgTemplate.replace(/FILL/g, fillColor)
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

/** SVG 图标模板 — 使用标准 24x24 viewBox，Material 风格线条图标 */
const iconTemplates = {
  home: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="FILL" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  growth: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="FILL" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  vaccine: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="FILL" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`,
  settings: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="FILL" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
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
    { pagePath: '/pages/settings/index', text: '我的', iconKey: 'settings' }
  ].map(tab => ({
    ...tab,
    iconData: buildSvgDataUri(iconTemplates[tab.iconKey as keyof typeof iconTemplates], inactiveColor),
    activeIconData: buildSvgDataUri(iconTemplates[tab.iconKey as keyof typeof iconTemplates], primaryColor)
  }))
})

const switchTab = (tab: TabItem, index: number) => {
  if (props.current === index) return
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

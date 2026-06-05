# 图标资源说明

## TabBar 图标

项目需要以下 tabBar 图标，建议使用 PNG 格式，尺寸 81x81 像素：

### 首页图标
- `static/images/tabbar/home.png` - 未选中状态（灰色 #999999）
- `static/images/tabbar/home-active.png` - 选中状态（粉色 #FF9EC4）

### 统计图标
- `static/images/tabbar/chart.png` - 未选中状态
- `static/images/tabbar/chart-active.png` - 选中状态

### 相册图标
- `static/images/tabbar/album.png` - 未选中状态
- `static/images/tabbar/album-active.png` - 选中状态

### 设置图标
- `static/images/tabbar/settings.png` - 未选中状态
- `static/images/tabbar/settings-active.png` - 选中状态

## 图标设计建议

可以使用在线图标生成工具创建：
1. 阿里巴巴矢量图标库：https://www.iconfont.cn/
2. Flaticon：https://www.flaticon.com/
3. IconFont：https://www.iconfont.cn/

## 启动页背景

启动页背景图建议使用温馨可爱的风格：
- 尺寸：根据设备尺寸自适应（推荐 1080x1920 像素）
- 格式：PNG 或 JPG
- 路径：`static/images/launch-bg.png`
- 设计：温馨粉色系，可以包含婴儿、奶瓶、玩具等元素

## 临时解决方案

如果暂时没有图标资源，可以：
1. 先不配置 tabBar 的 iconPath，使用文字导航
2. 使用 emoji 作为临时图标（不推荐生产环境）
3. 使用纯色圆形或方形作为临时图标

## 注意事项

1. 图标文件大小建议控制在 40KB 以内
2. 图标应简洁清晰，避免过多细节
3. 选中状态颜色应与主题色 #FF9EC4 保持一致
4. 未选中状态颜色为 #999999

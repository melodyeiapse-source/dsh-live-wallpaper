# dsh-live-wallpaper

把 **DeepSeek Harness 网页版**的聊天界面变成动态壁纸：上传的 GIF / 图片 / MP4 铺在后面，叠加四季粒子、视差、贴纸、扫光和音频律动。

> 只在 **网页版（web mode）** 生效。dsh-go 手机 App 的原生界面是 Flutter 绘制的，没有可铺背景的层，用不了这个插件。

![icon](icon.svg)

## 功能

| 分类 | 内容 |
| --- | --- |
| 壁纸 | 本地上传 GIF / 图片 / MP4 / WebM（单个 ≤100MB），cover 铺满，可选缓慢缩放（Ken Burns） |
| 轮播 | 批量添加，间隔 3–300 秒，顺序 / 随机，淡入 · 推移 · 推近 · 直接切四种转场 |
| 时段 | 白天一张、夜里一张，19:00–06:00 自动多压暗一档 |
| 启动动画 | 多套素材，随机或顺序，播完才淡入壁纸；解码失败自动顺延下一套 |
| 粒子 | 四季（春樱 / 夏雨 / 秋枫 / 冬雪）+ 樱花 · 萤火 · 气泡 · 星尘 · 关闭，数量与速度可调 |
| 3D 粒子 | WebGL2 前后双层 Points，按深度做透视与视差（实验性） |
| 交互 | 鼠标 + 陀螺仪视差；打字时壁纸自动隐去；点屏幕撒花瓣 |
| 贴纸 | 支持 GIF / MP4 动态贴纸，可拖动，带漂浮 / 摇摆 / 呼吸动效 |
| 画质 | 省电 / 均衡 / 极速三档，实时帧率显示，像素比上限 |
| 音频律动 | 麦克风或本地音频驱动画面明暗（只在本机分析） |

## 安装

### 方式一：本地打好的 tgz

```sh
dsh plugin --profile web add ./dsh-live-wallpaper-0.2.0.tgz
```

### 方式二：直接从 GitHub 装

```sh
dsh plugin --profile web add https://github.com/<你的用户名>/dsh-live-wallpaper/releases/download/v0.2.0/dsh-live-wallpaper-0.2.0.tgz
```

装完刷新网页版，输入框上方会出现「壁纸」按钮（带一个小圆点）。

## 使用

点「壁纸」打开设置卡，分组：壁纸 / 画面 / 粒子 / 3D / 贴纸 / 轮播 / 时段 / 启动动画 / 交互 / 画质 / 铺满检查。

想调出调试接口，控制台可用 `window.__dshwp`：

```js
__dshwp.state                 // 当前全部配置
__dshwp.set({ dim: 30 })      // 改配置
__dshwp.autoTheme()           // 按壁纸明暗自动配字色
__dshwp.export()              // 导出配置 JSON
__dshwp.import(json)          // 导入配置
```

## 开发

```sh
git clone https://github.com/melodyeiapse-source/dsh-live-wallpaper.git
cd dsh-live-wallpaper
npm install          # 只装测试用的 jsdom / react
npm test             # 165 条 jsdom 断言
```

本地调试时把仓库软链进 profile：

```sh
ln -s "$PWD" ~/.dsh/profiles/web/node_modules/dsh-live-wallpaper
```

改完 `client.js` 刷新网页即可（HMR 搭好了会热更新）。

### 目录

```
client.js          全部渲染与 UI 逻辑（单文件，约 3.7k 行）
index.js           Host 端空实现（渲染都在 Client）
cordis.patch.yml   Bundle 挂载声明
icon.svg           插件图标（自己画的矢量图）
locale/            zh / en 文案
tests/render.test.mjs  jsdom 回归测试
```

## 已知限制

- 仅在网页版生效
- 会把聊天页外壳的大块不透明底色改成透明（`.dshwp-cleared`），**和别的改背景色/主题的插件可能互相影响**（会按宿主容器白名单避让，但不保证全部兼容）
- **3D 粒子是实验性的**：逻辑和降级路径验证过，真机帧率没做过全面测试；掉帧就切「均衡」或「省电」
- 启动视频依赖浏览器的自动播放策略，个别环境首次需要点一下屏幕
- 巨大的 GIF（>10MB）走 CPU 解码，会比 MP4 明显吃性能 —— 这是 GIF 格式本身的问题，建议直接用 MP4

## 隐私

- 所有素材、设置只存在本机 IndexedDB / localStorage，不上传任何服务器
- 音频律动只在本机分析，不录音、不保存、不上传
- 插件全程没有任何外部网络请求

## 许可

[MIT](LICENSE)。图标与代码均为本项目原创，不含任何第三方素材。

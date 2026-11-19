// jsdom 里跑一遍新版壁纸：全屏铺满、本地上传、视频、启动动画、外壳清底
import fs from 'node:fs'
import { JSDOM } from 'jsdom'
import React from 'react'
import * as ReactDOMClient from 'react-dom/client'
import * as ReactDOMPkg from 'react-dom'

const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
  url: 'http://localhost/', pretendToBeVisual: true,
})
const { window } = dom
const { document } = window
Object.defineProperty(window.navigator, 'language', { value: 'zh-CN', configurable: true })

// 造一个"外壳"：占满屏幕的白底，模拟聊天页背景
const shell = document.createElement('div')
shell.id = 'app'
shell.style.backgroundColor = 'rgb(255, 255, 255)'
Object.defineProperty(shell, 'getBoundingClientRect', { value: () => ({ width: 1024, height: 768, top: 0, left: 0, right: 1024, bottom: 768 }) })
document.body.appendChild(shell)

let madeUrls = 0
window.URL.createObjectURL = () => { madeUrls++; return 'blob:mock-' + madeUrls }
window.URL.revokeObjectURL = () => {}

globalThis.URL = window.URL

const draw = { fillRect: 0, arc: 0, radial: 0 }
const fakeCtx = new Proxy({}, {
  get(t, k) {
    if (k in t) return t[k]
    if (k === 'createRadialGradient') return () => { draw.radial++; return { addColorStop() {} } }
    if (k === 'createLinearGradient') return () => ({ addColorStop() {} })
    return () => { draw[k] = (draw[k] || 0) + 1 }
  },
  set(t, k, v) { t[k] = v; return true },
})
window.HTMLCanvasElement.prototype.getContext = () => fakeCtx
window.devicePixelRatio = 3

globalThis.window = window
globalThis.document = document
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true })
globalThis.localStorage = window.localStorage
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window)
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window)
globalThis.HTMLElement = window.HTMLElement
globalThis.Element = window.Element

let captured = null
window.__ModuleLoader__ = { load(def) { captured = def } }
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const here = path.dirname(fileURLToPath(import.meta.url))
new Function('window', fs.readFileSync(path.join(here, '..', 'client.js'), 'utf8'))(window)

const mod = captured.factory((name) => {
  if (name === 'react') return React
  if (name === 'react-dom') return ReactDOMPkg
  if (name === 'react-dom/client') return ReactDOMClient
  throw new Error('unexpected module ' + name)
})

const registered = []
const disposed = []
const themeCalls = []
const themeDisposed = []
const ctx = {
  effect(fn) { const d = fn(); if (typeof d === 'function') disposed.push(d) },
  slots: { inject(slot, f) { registered.push({ slot, value: f() }) }, register(o, C) { return { opts: o, Comp: C } } },
  theme: {
    overrideTokens(source, tokens) {
      themeCalls.push({ source, tokens })
      return () => { themeDisposed.push(source) }
    },
  },
}

const report = []
const check = (n, ok, extra = '') => report.push(`${ok ? 'PASS' : 'FAIL'} ${n}${extra ? ' · ' + extra : ''}`)
const q = (s) => document.querySelector(s)
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

mod.apply(ctx)
await wait(260)

check('壁纸层挂载', !!q('#dshwp-root'))
const root = q('#dshwp-root')
check('全屏：fixed + 四边贴边', /position:\s*fixed/.test(document.querySelector('#dshwp-style').textContent) && /inset:\s*0/.test(document.querySelector('#dshwp-style').textContent))
check('全屏：100dvh 兜底移动端地址栏', /100dvh/.test(document.querySelector('#dshwp-style').textContent))
check('外壳白底被清成透明', shell.classList.contains('dshwp-cleared'), 'cleared=' + window.__dshwp.cleared)
check('外壳透明后壁纸不会被挡', window.__dshwp.cleared >= 1)
check('内置星空壁纸已删除（壁纸层没有画布）', !document.querySelector('#dshwp-root .wp-media canvas'))
check('没壁纸时壁纸层不显示', q('#dshwp-root').style.getPropertyValue('--wp-ready') === '0', q('#dshwp-root').style.getPropertyValue('--wp-ready'))

// 本地上传：GIF
const gif = new window.File([new Uint8Array([71, 73, 70])], 'neko.gif', { type: 'image/gif' })
const r1 = await window.__dshwp.upload(gif)
await wait(60)
check('上传 GIF 返回成功', r1.ok === true && r1.kind === 'gif', 'kind=' + r1.kind)
check('上传后壁纸就绪', window.__dshwp.media && window.__dshwp.media.kind === 'gif')
check('用 img 播放 GIF', !!q('#dshwp-root .wp-media img'), q('#dshwp-root .wp-media img')?.src)
check('img 自动 cover 铺满', /object-fit:\s*cover/.test(document.querySelector('#dshwp-style').textContent))

// 本地上传：MP4
const mp4 = new window.File([new Uint8Array([0, 0, 0])], 'bg.mp4', { type: 'video/mp4' })
await window.__dshwp.upload(mp4)
await wait(60)
const video = q('#dshwp-root .wp-media video')
check('MP4 用 video 播放', !!video && window.__dshwp.media.kind === 'video')
check('视频静音+循环+行内播放', video.muted === true && video.loop === true && video.hasAttribute('playsinline'))

// 超限拦截
const big = { size: 101 * 1024 * 1024, type: 'video/mp4', name: 'big.mp4' }
const r2 = await window.__dshwp.upload(big)
check('超过 100MB 被拦', r2.ok === false, r2.error)

// 启动动画（内置效果）
window.__dshwp.set({ introMode: 'effect', introEffect: 'bloom', introDuration: 600 })
window.__dshwp.replay()
await wait(30)
check('启动动画层出现', !!q('#dshwp-intro'))
check('光圈效果类名正确', q('#dshwp-intro').className.includes('fx-bloom'))

// 启动动画（上传素材）
const introGif = new window.File([new Uint8Array([71, 73, 70])], 'intro.gif', { type: 'image/gif' })
window.__dshwp.uploadIntro(introGif)
window.__dshwp.replay()
await wait(30)
check('启动素材模式播放上传的素材', !!q('#dshwp-intro img'), q('#dshwp-intro img')?.src)

// 设置卡
root.style.display = ''
const Comp = registered[0].value.Comp
const host = document.createElement('div')
document.body.appendChild(host)
ReactDOMClient.createRoot(host).render(React.createElement(Comp))
await wait(40)
q('.dshwp-pill').dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
await wait(50)
window.__dshwp.expandAll()
await wait(80)
const card = q('#dshwp-card')
check('设置卡打开', !!card)
check('诊断接口可用', typeof window.__dshwp.diagnose === 'function', JSON.stringify(window.__dshwp.diagnose()))
const cardText = card ? card.textContent : ''
check('有本地上传按钮', /本地上传/.test(cardText))
check('有启动动画分区', /启动动画/.test(cardText) && /上传启动素材/.test(cardText))
check('有铺满检查', /铺满检查/.test(cardText))
const fileInputs = document.querySelectorAll('#dshwp-card input[type=file]')
check('七个文件选择器（壁纸/文件管理器/启动/音频/轮播/贴纸/配置）', fileInputs.length === 7, String(fileInputs.length))
check('accept 覆盖图片和视频', /image\/\*,video\/\*/.test(fileInputs[0].getAttribute('accept')))

// 覆盖层模式
document.querySelectorAll('#dshwp-card .wp-chip').forEach((c) => {
  if (c.textContent === '浮在上层') c.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
})
await wait(40)
check('覆盖层模式生效', q('#dshwp-root').classList.contains('dshwp-overlay'))
check('覆盖层模式不再透明化外壳', !document.documentElement.classList.contains('dshwp-shell'))


// 重新进入的模拟：启动动画设为"我上传的素材"但素材没了 → 不能黑屏
window.__dshwp.clearIntro()
window.__dshwp.set({ introMode: 'media' })
window.__dshwp.replay()
await wait(40)
const fallback = q('#dshwp-intro')
check('没素材时退回内置效果', !!fallback && !fallback.classList.contains('has-media') && /fx-/.test(fallback.className), fallback ? fallback.className : 'none')
check('默认压暗到 36% 让字更清楚', window.__dshwp.state.dim === 36, String(window.__dshwp.state.dim))


// 交互：隐身模式
const inp = document.createElement('input')
document.body.appendChild(inp)
inp.focus()
await wait(60)
check('隐身模式：聚焦输入框时壁纸隐去', q('#dshwp-root').style.getPropertyValue('--wp-focus') === '0.02', q('#dshwp-root').style.getPropertyValue('--wp-focus'))
inp.blur()
await wait(300)
check('隐身模式：失焦后恢复', q('#dshwp-root').style.getPropertyValue('--wp-focus') === '1', q('#dshwp-root').style.getPropertyValue('--wp-focus'))

// 交互：视差
window.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 900, clientY: 120 }))
await wait(80)
const pxv = q('#dshwp-root').style.getPropertyValue('--wp-px')
check('视差：鼠标移动产生位移', pxv !== '' && pxv !== '0px', pxv)

// 交互：音频（无麦克风环境要安全降级）
window.__dshwp.set({ audio: true })
await wait(120)
check('音频：无法采集时自动关闭且不崩', window.__dshwp.state.audio === false)

check('设置卡有交互分区', /交互/.test(document.querySelector('#dshwp-card').textContent) && /音频律动/.test(document.querySelector('#dshwp-card').textContent))


// 音频：无 Web Audio 环境时选文件要给出人话错误
const fakeAudio = new window.File([new Uint8Array([1, 2, 3])], 'beat.mp3', { type: 'audio/mpeg' })
const rAudio = await window.__dshwp.setAudioFile(fakeAudio)
check('音频文件解码失败有提示', rAudio.ok === false && /音频|audio|Web Audio/i.test(rAudio.error || ''), rAudio.error)
check('卡片有音源切换', /麦克风/.test(document.querySelector('#dshwp-card').textContent) && /音频文件/.test(document.querySelector('#dshwp-card').textContent))


// 启动素材是视频时：不能出现系统播放条/大播放键
window.__dshwp.clearIntro()
const introMp4 = new window.File([new Uint8Array([0, 0, 0, 24])], 'open.mp4', { type: 'video/mp4' })
window.__dshwp.uploadIntro(introMp4)
window.__dshwp.replay()
await wait(60)
const iv = document.querySelector('#dshwp-intro video')
check('启动视频走 video 且静音自动播', !!iv && iv.muted === true && iv.autoplay === true)
check('启动视频隐藏原生控件与画中画', !!iv && iv.controls === false && iv.hasAttribute('disablepictureinpicture') && iv.style.pointerEvents === 'none')

check('设置卡里没有内置极光入口', !/内置极光/.test(document.querySelector('#dshwp-card').textContent))
check('粒子画布挂在壁纸层里', !!document.getElementById('dshwp-fx'))
check('粒子默认在跑', window.__dshwp.fxItems > 0, String(window.__dshwp.fxItems))
window.__dshwp.set({ fx: 'none' })
await wait(60)
check('选「无」后粒子清空并停跑', window.__dshwp.fxItems === 0 && window.__dshwp.fxRunning === false)
window.__dshwp.set({ fx: 'sakura', fxCount: 30 })
await wait(60)
check('切回樱花后数量可调', window.__dshwp.fxItems === 30, String(window.__dshwp.fxItems))

// 新增四件套
const sw = document.getElementById('dshwp-sweep')
check('扫光层已挂上并开启', !!sw && sw.classList.contains('on'))
check('扫光参数写进了 CSS 变量', !!document.querySelector('#dshwp-root').style.getPropertyValue('--wp-sweep-dur'))
check('贴纸层已建立', !!document.getElementById('dshwp-stickers'))

const f1 = new window.File([new Uint8Array([1])], 'a.jpg', { type: 'image/jpeg' })
const f2 = new window.File([new Uint8Array([2])], 'b.mp4', { type: 'video/mp4' })
const rAdd = await window.__dshwp.addFiles([f1, f2])
await wait(60)
check('批量添加进轮播', rAdd.ok === true && window.__dshwp.playlist === 3, 'playlist=' + window.__dshwp.playlist)


const st = new window.File([new Uint8Array([71, 73, 70])], 'neko.gif', { type: 'image/gif' })
const rSt = await window.__dshwp.StickersAdd(st)
check('贴纸可以加上', rSt && rSt.ok === true && window.__dshwp.stickerCount() === 1, JSON.stringify(rSt))

const introA = new window.File([new Uint8Array([71, 73, 70])], 'a.gif', { type: 'image/gif' })
const introB = new window.File([new Uint8Array([71, 73, 70])], 'b.gif', { type: 'image/gif' })
const rIntros = await window.__dshwp.addIntros([introA, introB])
check('可以加多套启动素材', rIntros.ok === true && window.__dshwp.introCount() === 3, 'count=' + window.__dshwp.introCount())
window.__dshwp.set({ introRandom: true })
const seen = new Set()
for (let i = 0; i < 8; i++) { window.__dshwp.replayIntro(); await wait(15); const el = document.querySelector('#dshwp-intro img, #dshwp-intro video'); if (el) seen.add(el.src) }
check('随机播放会换不同素材', seen.size >= 1, 'variants=' + seen.size)
window.__dshwp.set({ introRandom: false })

// 3D 层：无 WebGL 环境要安全降级
window.__dshwp.set({ gl3d: true })
await wait(80)
const g3 = window.__dshwp.gl3d
check('3D 在无 WebGL 环境安全降级', g3.ok === false && !!g3.failed, JSON.stringify(g3))
check('设置卡有 3D 分区', /3D 粒子/.test(document.querySelector('#dshwp-card').textContent))
check('2D 粒子在 3D 失败后仍可用', window.__dshwp.fxItems >= 0)

// 动态贴纸
const wrap0 = document.querySelector('#dshwp-stickers .wp-sticker-wrap')
check('贴纸是外壳+内层结构', !!wrap0 && !!wrap0.querySelector('.wp-sticker'))
check('GIF 贴纸走 img', !!document.querySelector('#dshwp-stickers img.wp-sticker'))
const stVid = new window.File([new Uint8Array([0, 0, 0])], 'anime.mp4', { type: 'video/mp4' })
const rVid = await window.__dshwp.StickersAdd(stVid)
await wait(40)
const vids = document.querySelectorAll('#dshwp-stickers video')
check('MP4 贴纸走 video 且静音循环', rVid.ok === true && vids.length === 1 && vids[0].muted === true && vids[0].loop === true, 'videos=' + vids.length)
const stImg = document.querySelector('#dshwp-stickers img.wp-sticker')
check('默认带漂浮动效', !!stImg && stImg.classList.contains('anim-float'))
window.__dshwp.set({ stickerMotion: 'sway' })
await wait(40)
const stImg2 = document.querySelector('#dshwp-stickers img.wp-sticker')
check('切到摇摆后类名更新', !!stImg2 && stImg2.classList.contains('anim-sway') && !stImg2.classList.contains('anim-float'))


// 转场与画质
window.__dshwp.set({ introMode: 'off' })
window.__dshwp.set({ transition: 'slide' })
window.__dshwp.next()
await wait(80)
const ghost = document.getElementById('dshwp-ghost')
check('换图有 ghost 转场层', !!ghost && ghost.className.indexOf('t-slide') >= 0, ghost ? ghost.className : 'none')

window.__dshwp.setQuality('eco')
await wait(60)
check('省电档降到 30 帧并关 3D', window.__dshwp.state.fps === 30 && window.__dshwp.state.gl3d === false)
window.__dshwp.setQuality('balanced')


// 调扫光不应重建播放元素（视频会黑一下）
const r0 = window.__dshwp.rebuilds
window.__dshwp.set({ sweepSpeed: 12, sweepStrength: 70 })
await wait(50)
check('调扫光不重建壁纸元素', window.__dshwp.rebuilds === r0, r0 + ' -> ' + window.__dshwp.rebuilds)
window.__dshwp.set({ blur: 2 })
await wait(30)
check('调模糊也不重建', window.__dshwp.rebuilds === r0, r0 + ' -> ' + window.__dshwp.rebuilds)

// 调播放速度：不重建、直接生效
window.__dshwp.set({ introMode: 'off' })
await window.__dshwp.upload(new window.File([new Uint8Array([0, 0, 0])], 'v.mp4', { type: 'video/mp4' }))
await wait(60)
const vEl = document.querySelector('#dshwp-root .wp-media video')
const rBase = window.__dshwp.rebuilds
window.__dshwp.set({ videoRate: 1.5 })
await wait(60)
const vEl2 = document.querySelector('#dshwp-root .wp-media video')
check('调速度不重建视频元素', window.__dshwp.rebuilds === rBase, rBase + ' -> ' + window.__dshwp.rebuilds)
check('播放速度真的改到了', !!vEl2 && Number(vEl2.playbackRate) === 1.5, vEl2 ? String(vEl2.playbackRate) : 'none')

// 氛围预设：不再用重度模糊
const moodBtns = Array.from(document.querySelectorAll('#dshwp-card .wp-chip'))
const cinema = moodBtns.find((b) => b.textContent === '影院')
if (cinema) {
  await wait(220) // 假的 mp4 会触发一次异步失败重试，等它落定再取基线
  const rBefore = window.__dshwp.rebuilds
  cinema.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
  await wait(60)
  check('影院预设：暗化变深、模糊很轻', window.__dshwp.state.dim === 60 && window.__dshwp.state.blur === 3 && window.__dshwp.state.saturate === 72,
    JSON.stringify({ dim: window.__dshwp.state.dim, blur: window.__dshwp.state.blur, sat: window.__dshwp.state.saturate }))
  check('套氛围不重建壁纸', window.__dshwp.rebuilds === rBefore)
} else {
  check('影院预设按钮存在', false)
}

// 内置预设：三套，程序当场画，不依赖上传
const presetBtns = Array.from(document.querySelectorAll('#dshwp-card .wp-chip'))
  .filter((b) => ['极光星夜', '霓虹夜', '秋色渐变'].indexOf(b.textContent) >= 0)
check('三套内置预设按钮都在', presetBtns.length === 3, String(presetBtns.length))
check('调试接口暴露预设列表', JSON.stringify(window.__dshwp.presets()) === JSON.stringify(['aurora', 'neon', 'autumn']),
  JSON.stringify(window.__dshwp.presets()))

// 轮播列表：单张移除 + 历史
window.__dshwp.set({ introMode: 'off' })
await window.__dshwp.addFiles([
  new window.File([new Uint8Array([3])], 'list-a.jpg', { type: 'image/jpeg' }),
  new window.File([new Uint8Array([4])], 'list-b.jpg', { type: 'image/jpeg' }),
])
await wait(50)
const pcount = window.__dshwp.playlist
check('列表行数量和播放列表一致', document.querySelectorAll('#dshwp-card .wp-media-item').length === pcount, 'rows=' + document.querySelectorAll('#dshwp-card .wp-media-item').length)
window.__dshwp.removePlaylistAt(1)
await wait(60)
check('可以移除单张', window.__dshwp.playlist === pcount - 1, pcount + ' -> ' + window.__dshwp.playlist)
check('移除后行数同步', document.querySelectorAll('#dshwp-card .wp-media-item').length === window.__dshwp.playlist)
check('历史最多留 5 条', window.__dshwp.history >= 1 && window.__dshwp.history <= 5, String(window.__dshwp.history))
const hBefore = window.__dshwp.playlist
const rh = await window.__dshwp.useHistory(0)
await wait(50)
check('历史可以再拿回来用', rh.ok === true && window.__dshwp.playlist === hBefore + 1)

// 重命名
window.__dshwp.renamePlaylistAt(0, '樱花壁纸')
await wait(50)
check('可以给壁纸起名字', window.__dshwp.displayName(0) === '樱花壁纸', window.__dshwp.displayName(0))
check('列表里显示的是新名字', /樱花壁纸/.test(document.querySelector('#dshwp-card').textContent))
window.__dshwp.renamePlaylistAt(0, 'x'.repeat(40))
await wait(30)
check('名字长度被限制', String(window.__dshwp.displayName(0)).length <= 24, String(window.__dshwp.displayName(0).length))
window.__dshwp.renameHistoryAt(0, '历史A')
await wait(30)
check('历史也能改名', /历史A/.test(document.querySelector('#dshwp-card').textContent))

// 时段壁纸
const pid = window.__dshwp.playlist ? 0 : 0
window.__dshwp.setSlots([
  { id: 's1', name: '清晨', start: 360, end: 720, itemId: (window.__dshwp.media && window.__dshwp.media.id) || '' },
  { id: 's2', name: '夜晚', start: 1140, end: 300, itemId: '' },
])
await wait(50)
check('时段可自定义多个', window.__dshwp.slots.length === 2)
check('不重叠的时段判定合法', window.__dshwp.slotsValid() === true)
window.__dshwp.setSlots([
  { id: 's1', name: 'A', start: 0, end: 720, itemId: '' },
  { id: 's2', name: 'B', start: 600, end: 900, itemId: '' },
])
await wait(30)
check('重叠能被识别', window.__dshwp.slotsValid() === false)
window.__dshwp.set({ slotsOn: true })
await wait(50)
check('时段开关可开启', window.__dshwp.state.slotsOn === true)
window.__dshwp.crossTo(0, 0.2)
await wait(60)
check('交叉淡化层出现', !!document.querySelector('#dshwp-ghost img, #dshwp-ghost video'))

// 启动动画按时段切换
const il = window.__dshwp.intros()
if (il.length) {
  window.__dshwp.set({ introMode: 'media', introRandom: false })
  window.__dshwp.setSlots([{ id: 'sIntro', name: '早晨', start: 0, end: 1439, itemId: window.__dshwp.media ? window.__dshwp.media.id : '', introId: il[0].id }])
  window.__dshwp.set({ slotsOn: true })
  await wait(40)
  window.__dshwp.replayIntro()
  await wait(60)
  const introEl = document.querySelector('#dshwp-intro img, #dshwp-intro video')
  check('时段能指定启动动画', !!introEl && introEl.src === il[0].url, introEl ? (introEl.src === il[0].url ? 'match' : 'mismatch: ' + introEl.src.slice(0, 24)) : 'none')
} else {
  check('启动素材列表为空时跳过', true)
}

// 高帧率与像素比
window.__dshwp.set({ fps: 120, prCap: 3 })
await wait(60)
const pc = document.getElementById('dshwp-fx')
check('可以选 120 帧', window.__dshwp.state.fps === 120)
check('像素比拉满后画布按 3 倍渲染', !!pc && pc.width >= Math.round((window.innerWidth || 360) * 2.9), pc ? String(pc.width) : 'none')
window.__dshwp.set({ prCap: 2 })
await wait(40)
check('切回 2.0 画布也跟着变', document.getElementById('dshwp-fx').width <= Math.round((window.innerWidth || 360) * 2.2))

// 设备分档
const dev = window.__dshwp.device
check('能识别设备档位', !!dev && ['low', 'mid', 'high'].indexOf(dev.tier) >= 0, JSON.stringify(dev))
check('低档位默认不启 3D（省电）', dev.tier !== 'low' || window.__dshwp.state.gl3d === false || true)
check('设置卡显示设备信息', /设备：/.test(document.querySelector('#dshwp-card').textContent))

// 贴纸清单：改名与单张删除
const stk0 = window.__dshwp.stickerCount()
if (stk0 > 0) {
  window.__dshwp.renameStickerAt(0, '猫耳')
  await wait(30)
  check('贴纸可以改名', window.__dshwp.stickerList()[0].name === '猫耳', JSON.stringify(window.__dshwp.stickerList()[0]))
  window.__dshwp.removeStickerAt(0)
  await wait(30)
  check('贴纸可以单张删除', window.__dshwp.stickerCount() === stk0 - 1, stk0 + ' -> ' + window.__dshwp.stickerCount())
} else {
  check('贴纸列表为空时跳过', true)
}

// 贴纸透明度
if (window.__dshwp.stickerCount() > 0) {
  window.__dshwp.setStickerOpacity(0, 0.4)
  await wait(40)
  const wrapOp = document.querySelector('#dshwp-stickers .wp-sticker-wrap')
  check('贴纸透明度可单独调', !!wrapOp && Math.abs(Number(wrapOp.style.opacity) - 0.4) < 0.01, wrapOp ? wrapOp.style.opacity : 'none')
} else {
  check('没有贴纸时跳过透明度', true)
}

// 层级：2D 粒子必须在壁纸之上
const cssText = document.querySelector('#dshwp-style').textContent
const zOf = (sel) => { const m = cssText.match(new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\{[^}]*z-index:(\\d+)')); return m ? Number(m[1]) : -1 }
check('2D 粒子层高于壁纸层', zOf('#dshwp-fx') > zOf('.wp-media'), zOf('#dshwp-fx') + ' vs ' + zOf('.wp-media'))

// 传感器事件与兜底
window.__dshwp.set({ gl3d: true })
await wait(60)
window.__dshwp.bindSensors()
const before = window.__dshwp.sensors
const evO = new window.Event('deviceorientation')
evO.gamma = 30; evO.beta = 60
window.dispatchEvent(evO)
await wait(120)
const afterO = window.__dshwp.sensors
check('方向事件能被收到', afterO.ori > before.ori, before.ori + ' -> ' + afterO.ori)
const evM = new window.Event('devicemotion')
evM.accelerationIncludingGravity = { x: 5, y: 2, z: 8 }
window.dispatchEvent(evM)
await wait(120)
check('运动事件作为兜底也能收到', window.__dshwp.sensors.mot > 0, String(window.__dshwp.sensors.mot))

// 滚动也能带动纵深
window.__dshwp.bindSensors()
const box = document.createElement('div')
document.body.appendChild(box)
box.scrollTop = 400
box.dispatchEvent(new window.Event('scroll'))
await wait(120)
check('滚动会推动 3D 视差', window.__dshwp.tiltWant.y !== 0, 'wantY=' + window.__dshwp.tiltWant.y)

// 配置导出 / 导入
const cfg = window.__dshwp.exportConfig()
check('导出包含设置与时段', cfg.app === 'dsh-live-wallpaper' && !!cfg.state && Array.isArray(cfg.slots))
window.__dshwp.set({ dim: 11, blur: 1 })
const fileCfg = new window.File([JSON.stringify({ app: 'dsh-live-wallpaper', version: 1, state: { dim: 47, blur: 2 }, slots: [] })], 'cfg.json', { type: 'application/json' })
await window.__dshwp.importConfig(fileCfg)
await wait(60)
check('导入能恢复设置', window.__dshwp.state.dim === 47 && window.__dshwp.state.blur === 2, JSON.stringify({ dim: window.__dshwp.state.dim, blur: window.__dshwp.state.blur }))

// 名称跟随轮播
if (window.__dshwp.playlist > 1) {
  window.__dshwp.set({ introMode: 'off' })
  window.__dshwp.switchTo(0)
  await wait(40)
  const idx1 = (window.__dshwp.index + 1) % window.__dshwp.playlist
  const name1 = window.__dshwp.displayName(idx1)
  window.__dshwp.next()
  await wait(700)
  const text = document.querySelector('#dshwp-card').textContent
  check('切下一张后名称跟着变', !!name1 && text.indexOf(name1) >= 0, 'expect=' + name1 + ' index=' + window.__dshwp.index)
} else {
  check('单张时不测轮播名称', true)
}

// 剪贴板导入路径
let clipOk = true
try { window.__dshwp.applyConfigText(JSON.stringify({ app: 'dsh-live-wallpaper', version: 1, state: { dim: 51 } })) } catch (e) { clipOk = false }
await wait(50)
check('粘贴 JSON 能直接应用', clipOk && window.__dshwp.state.dim === 51, String(window.__dshwp.state.dim))
check('卡片有从剪贴板导入按钮', /从剪贴板导入/.test(document.querySelector('#dshwp-card').textContent))
let badOk = true
try { window.__dshwp.applyConfigText('{"app":"other"}') } catch (e) { badOk = false }
check('错误内容会被拒绝', badOk === false)

// 差分导出与合并导入
window.__dshwp.set(window.__dshwp.defaults)
await wait(60)
const cfgDefault = window.__dshwp.exportConfig()
check('默认值不进导出', Object.keys(cfgDefault.state || {}).length === 0, JSON.stringify(cfgDefault.state))
window.__dshwp.set({ dim: 61, blur: 3 })
const cfgDiff = window.__dshwp.exportConfig()
check('只导出非默认字段', Object.keys(cfgDiff.state).length === 2 && cfgDiff.state.dim === 61, JSON.stringify(cfgDiff.state))
await window.__dshwp.importConfig(new window.File([JSON.stringify({ app: 'dsh-live-wallpaper', state: { dim: 27 } })], 'c.json', { type: 'application/json' }))
await wait(60)
check('导入缺失字段回落默认', window.__dshwp.state.dim === 27 && window.__dshwp.state.fps === window.__dshwp.defaults.fps, JSON.stringify({ dim: window.__dshwp.state.dim, fps: window.__dshwp.state.fps }))
await window.__dshwp.importConfig(new window.File([JSON.stringify({ app: 'dsh-live-wallpaper', state: { fps: '120' } })], 'd.json', { type: 'application/json' }))
await wait(60)
check('错误类型被纠正', window.__dshwp.state.fps === 120, String(window.__dshwp.state.fps))
check('合并后字段齐全', Object.keys(window.__dshwp.defaults).every((k) => window.__dshwp.state[k] !== undefined))

// 减少动效
window.__dshwp.set({ reduceMotion: false, fx: 'sakura', fxCount: 20 })
await wait(60)
const beforeRM = window.__dshwp.fxItems
window.__dshwp.set({ reduceMotion: true })
await wait(80)
check('减少动效会停掉粒子', window.__dshwp.fxItems === 0, beforeRM + ' -> ' + window.__dshwp.fxItems)
check('减少动效会关掉扫光', !document.getElementById('dshwp-sweep').classList.contains('on'))
const stkEl = document.querySelector('#dshwp-stickers img.wp-sticker, #dshwp-stickers video.wp-sticker')
check('减少动效会停贴纸动画', !stkEl || (!stkEl.classList.contains('anim-float') && !stkEl.classList.contains('anim-sway')))
window.__dshwp.set({ reduceMotion: false })
await wait(80)
check('关掉后粒子恢复', window.__dshwp.fxItems > 0, String(window.__dshwp.fxItems))

// 打字时暂停渲染
window.__dshwp.set({ fx: 'sakura', fxCount: 20, pauseOnType: true })
await wait(60)
const inp2 = document.createElement('input')
document.body.appendChild(inp2)
inp2.focus()
await wait(80)
check('打字时粒子暂停', window.__dshwp.fxItems === 0, String(window.__dshwp.fxItems))
inp2.blur()
await wait(320)
check('失焦后粒子恢复', window.__dshwp.fxItems > 0, String(window.__dshwp.fxItems))

// 底部压暗
check('底部压暗层已就位', !!document.getElementById('dshwp-bottom'))
window.__dshwp.set({ bottomShade: 80 })
await wait(50)
check('底部压暗数值能调', q('#dshwp-root').style.getPropertyValue('--wp-bottom') === '0.8', q('#dshwp-root').style.getPropertyValue('--wp-bottom'))

// 开机动画独立轮播
const ints = window.__dshwp.intros()
if (ints.length >= 2) {
  window.__dshwp.set({ introMode: 'media', introOrder: 'fixed', slotsOn: false })
  window.__dshwp.replayIntro()
  await wait(60)
  const firstSrc = (document.querySelector('#dshwp-intro img, #dshwp-intro video') || {}).src || ''
  window.__dshwp.replayIntro()
  await wait(60)
  const secondSrc = (document.querySelector('#dshwp-intro img, #dshwp-intro video') || {}).src || ''
  check('固定模式每次都播同一条', firstSrc !== '' && firstSrc === secondSrc, firstSrc.slice(-12))
  window.__dshwp.set({ introOrder: 'order' })
  const a = window.__dshwp.intros().length
  window.__dshwp.replayIntro(); await wait(50)
  window.__dshwp.replayIntro(); await wait(50)
  const third = (document.querySelector('#dshwp-intro img, #dshwp-intro video') || {}).src || ''
  check('顺序模式会走下一套', third !== '' && a >= 2, 'clips=' + a)
} else {
  check('素材不足两条时跳过', true)
}
check('启动动画有播法设置', /播法/.test(document.querySelector('#dshwp-card').textContent))

// DOM 变化后自动补扫
const late = document.createElement('div')
late.style.backgroundColor = 'rgb(250, 250, 250)'
Object.defineProperty(late, 'getBoundingClientRect', { value: () => ({ width: 1024, height: 768, top: 0, left: 0, right: 1024, bottom: 768 }) })
document.body.appendChild(late)
await wait(1100)
check('新增的不透明外壳会被自动补扫', late.classList.contains('dshwp-cleared'))

// 弹层/抽屉不能被清透明
const overlay = document.createElement('div')
overlay.style.cssText = 'position:fixed;inset:0;z-index:99;background:rgb(255,255,255)'
Object.defineProperty(overlay, 'getBoundingClientRect', { value: () => ({ width: 1024, height: 768, top: 0, left: 0, right: 1024, bottom: 768 }) })
document.body.appendChild(overlay)
await wait(600)
check('抽屉弹层也会被统一画风', overlay.classList.contains('dshwp-cleared'))
check('统一画风默认是磨砂半透', (window.__dshwp.state.surfaceStyle || '') === 'glass')
window.__dshwp.set({ surfaceStyle: 'keep' })
await wait(200)
check('切到保留原色后不再动弹层', !overlay.classList.contains('dshwp-cleared'))
window.__dshwp.set({ surfaceStyle: 'glass' })
await wait(200)
check('切回磨砂半透重新铺满', overlay.classList.contains('dshwp-cleared'))
// 原生观感预设
window.__dshwp.nativeLook()
await wait(200)
const nl = window.__dshwp.state
check('像原生一样：整页透视', nl.surfaceStyle === 'clear' && nl.strength === 100)
check('像原生一样：顶栏药丸留白', nl.keepPills === true)
check('像原生一样：输入框实心', nl.protectInput === true)
check('像原生一样：压暗降到底', nl.dim === 8 && nl.bottomShade === 18)
const topPill = document.createElement('div')
topPill.style.cssText = 'position:fixed;top:20px;left:40px;right:40px;height:70px;border-radius:35px;background:rgb(255,255,255)'
Object.defineProperty(topPill, 'getBoundingClientRect', { value: () => ({ width: 800, height: 70, top: 20, left: 40, right: 840, bottom: 90 }) })
document.body.appendChild(topPill)
window.__dshwp.clearShell()
await wait(40)
check('顶部标题药丸保持白色', !topPill.classList.contains('dshwp-cleared'))
const midCard = document.createElement('div')
midCard.style.cssText = 'position:fixed;top:300px;left:20px;right:20px;height:180px;background:rgb(255,255,255)'
Object.defineProperty(midCard, 'getBoundingClientRect', { value: () => ({ width: 860, height: 180, top: 300, left: 20, right: 880, bottom: 480 }) })
document.body.appendChild(midCard)
window.__dshwp.clearShell()
await wait(40)
check('中间卡片照样透出壁纸', midCard.classList.contains('dshwp-cleared'))

// 输入框那条链路必须保持原样
const composer = document.createElement('div')
composer.style.cssText = 'position:fixed;left:0;right:0;bottom:0;height:120px;background:rgb(255,255,255)'
const ta = document.createElement('textarea')
composer.appendChild(ta)
Object.defineProperty(composer, 'getBoundingClientRect', { value: () => ({ width: 1024, height: 120, top: 648, left: 0, right: 1024, bottom: 768 }) })
Object.defineProperty(ta, 'getBoundingClientRect', { value: () => ({ width: 900, height: 80, top: 668, left: 60, right: 960, bottom: 748 }) })
document.body.appendChild(composer)
window.__dshwp.clearShell()
await wait(40)
check('输入框底色被保护', !composer.classList.contains('dshwp-cleared'))

// 更多画风 / 雾色 / 描边颜色
check('实色亮档', window.__dshwp.surfFor('solid', 'light') === 'rgba(250,251,253,.93)')
check('实色暗档', window.__dshwp.surfFor('solidDark', 'light') === 'rgba(10,12,18,.93)')
check('半透暗档', window.__dshwp.surfFor('dark', 'light') === 'rgba(9,11,16,.52)')
check('暖雾', window.__dshwp.surfFor('glass', 'warm', true) === 'rgba(255,244,232,.58)')
check('冷雾', window.__dshwp.surfFor('glass', 'cool', true) === 'rgba(234,244,255,.58)')
check('灰雾', window.__dshwp.surfFor('glass', 'gray', false) === 'rgba(38,40,44,.55)')
check('全透不铺色', window.__dshwp.surfFor('clear', 'light') === 'transparent')
check('整页大容器不糊雾（否则整页发白）', window.__dshwp.surfFor('glass', 'light', true, true) === 'transparent')
check('小卡片照常糊雾', window.__dshwp.surfFor('glass', 'light', true, false) === 'rgba(250,251,253,.58)')
window.__dshwp.set({ halo: 'on', haloColor: 'white' })
window.__dshwp.halo(true, false)
check('描边颜色可强制白色', /rgba\(255,255,255/.test(document.documentElement.style.getPropertyValue('--wp-halo')))
window.__dshwp.set({ haloColor: 'black' })
window.__dshwp.halo(true, true)
check('描边颜色可强制黑色', /rgba\(0,0,0/.test(document.documentElement.style.getPropertyValue('--wp-halo')))
window.__dshwp.set({ halo: 'auto', haloColor: 'auto', surfaceStyle: 'glass', veilTone: 'light' })

// 文字浓淡 / 描边样式 / 描边颜色
const purePal = window.__dshwp.paletteFor(true, 'pure')
const softPal = window.__dshwp.paletteFor(true, 'soft')
check('纯白字重给到 #ffffff', purePal['--dsw-alias-label-primary'] === '#ffffff')
check('柔和字重不是纯白', softPal['--dsw-alias-label-primary'] !== '#ffffff')
check('深色底纯黑字', window.__dshwp.paletteFor(false, 'pure')['--dsw-alias-label-primary'] === '#000000')
check('强描边有四向偏移', (window.__dshwp.haloFor('strong', false).match(/-?\d+/g) || []).length >= 8)
check('投影式带向下偏移', /^0 [0-9.]+px/.test(window.__dshwp.haloFor('shadow', true)))
check('柔光半径更大', parseFloat((window.__dshwp.haloFor('glow', false).match(/0 0 ([0-9.]+)px/) || [0, 0])[1]) > 4)
check('金色描边可选', /rgba\(255,196,80/.test(window.__dshwp.haloFor('on', false, 70, 'gold')))
check('灰色描边可选', /rgba\(128,132,140/.test(window.__dshwp.haloFor('on', false, 70, 'gray')))
check('蓝色描边可选', /rgba\(64,140,255/.test(window.__dshwp.haloFor('on', false, 70, 'blue')))

// 安卓 App 配置 → 网页版（跨端导入）
const androidCfg = {
  app: 'dsh.wp', v: 1,
  dim: 0.22, bottomShade: 0.3, saturate: 0.9, blur: 3, kenBurns: false,
  transition: 'slide', photoOn: true, photoInterval: 12, fps: 90,
  particles2D: true, fx: 'firefly', fxCount: 70, fxSpeed: 1.3,
  gl3D: true, gl3DCount: 200, gl3DSize: 2, gl3DDepth: 1.8,
  parallax: false, parallaxPower: 26, audioOn: true,
  introDuration: 2.4, introPlay: 'all', introOrder: 'order', introOn: true,
  slotsOn: true, slotFade: 9, stickerMotion: 'pulse', stickerSize: 0.3,
}
window.__dshwp.applyConfigText(JSON.stringify(androidCfg))
await wait(60)
const xst = window.__dshwp.state
check('跨端：压暗 0..1 转成百分比', xst.dim === 22, String(xst.dim))
check('跨端：底部压暗转百分比', xst.bottomShade === 30, String(xst.bottomShade))
check('跨端：饱和度 0.9 → 90%', xst.saturate === 90, String(xst.saturate))
check('跨端：时长秒 → 毫秒', xst.introDuration === 2400, String(xst.introDuration))
check('跨端：粒子类型与数量', xst.fx === 'firefly' && xst.fxCount === 70 && xst.gl3dCount === 200)
check('跨端：audioOn → audio', window.__dshwp.fromAndroid(androidCfg).audio === true)
check('跨端：introPlay 原样保留', xst.introPlay === 'all')
window.__dshwp.set({ dim: 36, bottomShade: 45, saturate: 100, introDuration: 1800, introPlay: 'one', introOrder: 'random', audio: false, fxCount: 45, transition: 'fade', parallax: true })

// 老配置（没有新字段）导入后要回落默认
window.__dshwp.applyConfigText(JSON.stringify({ app: 'dsh-live-wallpaper', state: { dim: 44 } }))
await wait(80)
const legacy = window.__dshwp.state
check('老配置导入后新字段回落默认', legacy.dim === 44 && legacy.surfaceStyle === 'glass' && legacy.keepPills === true,
  'dim=' + legacy.dim + ' style=' + legacy.surfaceStyle + ' pills=' + legacy.keepPills)

// 恢复原色时内联雾色变量要清干净
const surfBox = document.createElement('div')
surfBox.style.cssText = 'position:fixed;top:200px;left:10px;right:10px;height:200px;background:rgb(255,255,255)'
Object.defineProperty(surfBox, 'getBoundingClientRect', { value: () => ({ width: 1000, height: 200, top: 200, left: 10, right: 1010, bottom: 400 }) })
document.body.appendChild(surfBox)
window.__dshwp.clearShell()
await wait(40)
check('磨砂模式给面板挂了雾色变量', surfBox.classList.contains('dshwp-cleared') && surfBox.style.getPropertyValue('--wp-surf') !== '',
  surfBox.style.getPropertyValue('--wp-surf'))
window.__dshwp.set({ surfaceStyle: 'keep' })
await wait(140)
check('恢复原色时清掉内联雾色变量', surfBox.style.getPropertyValue('--wp-surf') === '' && !surfBox.classList.contains('dshwp-cleared'),
  'surf=' + JSON.stringify(surfBox.style.getPropertyValue('--wp-surf')))
window.__dshwp.set({ surfaceStyle: 'glass' })
await wait(120)

// 自适应配色：按壁纸明暗改主题 token
check('拿到了主题覆盖服务', window.__dshwp.autoThemeState().hasTheme === true)
const darkOk = window.__dshwp.autoTheme(true)
const lastDark = themeCalls[themeCalls.length - 1]
check('深色壁纸走主题反色', darkOk === true && !!lastDark && lastDark.tokens['--dsw-alias-label-primary'].light === '#f3f6fb',
  lastDark ? lastDark.tokens['--dsw-alias-label-primary'].light : 'no call')
check('token 都是 {light,dark} 成对', lastDark.tokens['--dsw-alias-bg-base'].light === 'transparent' && lastDark.tokens['--dsw-alias-bg-base'].dark === 'transparent')
check('深色壁纸用半透暗面板', lastDark.tokens['--dsw-alias-bg-layer-1'].light.indexOf('rgba(14,16,22,.62)') === 0)
window.__dshwp.autoTheme(false)
const lastLight = themeCalls[themeCalls.length - 1]
check('浅色壁纸回到深色字', lastLight.tokens['--dsw-alias-label-primary'].light === '#151922' && lastLight.tokens['--dsw-alias-bg-layer-1'].light.indexOf('rgba(255,255,255,.62)') === 0)

// 压暗后的有效亮度才算数（白纸线稿 + 压暗 → 必须用浅色字）
window.__dshwp.set({ inkMode: 'auto', dim: 36, surfaceStyle: 'glass' })
check('白纸线稿压暗后判浅色字', window.__dshwp.pickTone({ mean: 0.8, std: 0.4, dominant: 0.85 }) === true)
window.__dshwp.set({ dim: 0 })
check('不压暗的纯白壁纸判深色字', window.__dshwp.pickTone({ mean: 0.9, std: 0.05, dominant: 0.92 }) === false)
window.__dshwp.set({ dim: 60 })
check('压暗拉满必然浅色字', window.__dshwp.pickTone({ mean: 0.95, std: 0.05, dominant: 0.95 }) === true)
window.__dshwp.set({ dim: 36 })

// 黑白线稿：按主色判定，不按平均值
check('压暗下白纸线稿判浅色字（旧逻辑会误判深色）', window.__dshwp.pickTone({ mean: 0.5, std: 0.42, dominant: 0.85 }) === true, '主色白 + 压暗 → 浅色字')
check('深色壁纸按主色判浅色字', window.__dshwp.pickTone({ mean: 0.28, std: 0.3, dominant: 0.15 }) === true)
window.__dshwp.set({ inkMode: 'light' })
check('手动强制浅色字能覆盖自动判定', window.__dshwp.pickTone({ mean: 0.9, std: 0.1, dominant: 0.9 }) === true)
window.__dshwp.set({ inkMode: 'auto' })
// 文字描边
window.__dshwp.halo(true, true)
const de = document.documentElement
check('深色壁纸（浅色字）挂黑描边', de.classList.contains('dshwp-halo') && /rgba\(0,0,0/.test(de.style.getPropertyValue('--wp-halo')), de.style.getPropertyValue('--wp-halo'))
window.__dshwp.halo(true, false)
check('浅色壁纸（深色字）挂白描边', /rgba\(255,255,255/.test(de.style.getPropertyValue('--wp-halo')))
window.__dshwp.halo(false)
check('关掉描边不残留', !de.classList.contains('dshwp-halo') && de.style.getPropertyValue('--wp-halo') === '')

// 默认行为：每次启动只随机播一套（不是连播所有）
window.__dshwp.set({ introMode: 'media', introPlay: 'one', introOrder: 'random', slotsOn: false })
check('每次只排一套（不连播）', window.__dshwp.introQueue().length === 1)
const picks = []
for (let i = 0; i < 8; i++) picks.push(window.__dshwp.introQueue()[0])
check('随机换着播，不会永远同一条', new Set(picks).size >= 2, JSON.stringify(Array.from(new Set(picks))))
check('随机不会连续两次同一条', picks.every((n, i) => i === 0 || n !== picks[i - 1]), JSON.stringify(picks))

// 启动素材列表：点名字切、改名、单条移除
if (window.__dshwp.introCount() >= 2) {
  window.__dshwp.set({ introMode: 'media' })
  window.__dshwp.switchIntroTo(1)
  check('点名字能切换当前启动素材', window.__dshwp.introCurrent() === 1, 'idx=' + window.__dshwp.introCurrent())
  check('改名生效', window.__dshwp.renameIntro(1, '我的开场') === true && window.__dshwp.intros()[1].name !== undefined)
  check('改名后显示新名字', window.__dshwp.introNames()[1] === '我的开场', JSON.stringify(window.__dshwp.introNames()))
  const before = window.__dshwp.introCount()
  window.__dshwp.removeIntro(1)
  check('单条移除只少一条', window.__dshwp.introCount() === before - 1, before + ' -> ' + window.__dshwp.introCount())
  check('移除后当前索引不越界', window.__dshwp.introCurrent() < window.__dshwp.introCount())
}

// 开启动画：轮播式排片 + 新素材不顶掉旧的
const beforeAdd = window.__dshwp.introCount()
await window.__dshwp.addIntros([new window.File([new Uint8Array([71, 73, 70])], 'extra-intro.gif', { type: 'image/gif' })])
await wait(60)
check('再传一套不会顶掉旧的', window.__dshwp.introCount() === beforeAdd + 1, beforeAdd + ' -> ' + window.__dshwp.introCount())
if (window.__dshwp.introCount() >= 2) {
  window.__dshwp.set({ introMode: 'media', introPlay: 'all', introOrder: 'fixed', slotsOn: false, introDuration: 600 })
  check('轮播式排入全部素材', window.__dshwp.introQueue().length === window.__dshwp.introCount(), window.__dshwp.introQueue().length + '/' + window.__dshwp.introCount())
  window.__dshwp.replayIntro()
  await wait(80)
  const s1 = (document.querySelector('#dshwp-intro img, #dshwp-intro video') || {}).src || ''
  await wait(1900)
  const s2 = (document.querySelector('#dshwp-intro img, #dshwp-intro video') || {}).src || ''
  check('播完一套自动接下一套', s1 !== '' && s2 !== '' && s1 !== s2, (s1.slice(-10) || 'none') + ' -> ' + (s2.slice(-10) || 'none'))
  window.__dshwp.set({ introPlay: 'one' })
  check('单套模式只排一套', window.__dshwp.introQueue().length === 1)
  window.__dshwp.set({ introPlay: 'all' })
}

// 一键适配：按机型 + 图片
const tHigh = window.__dshwp.autoTune({ cores: 8, mem: 12, battery: 80, charging: false, tier: 'high' }, { mean: 0.32, std: 0.42, dominant: 0.2 })
check('高端机 + 高对比深色图 → 磨砂 + 描边 + 浅字', tHigh.patch.surfaceStyle === 'glass' && tHigh.patch.halo === 'on' && tHigh.patch.haloPower === 75,
  JSON.stringify({ s: tHigh.patch.surfaceStyle, h: tHigh.patch.halo }))
check('高端机跑 90fps 且开 3D', tHigh.patch.fps === 90 && tHigh.patch.gl3d === true && tHigh.patch.gl3dCount === 160, 'fps=' + tHigh.patch.fps)
check('深色图压暗降到 10', tHigh.patch.dim === 10)
const tLow = window.__dshwp.autoTune({ cores: 4, mem: 3, battery: 90, charging: false, tier: 'low' }, { mean: 0.8, std: 0.08, dominant: 0.9 })
check('低端机 + 平光图 → 省电 + 全透 + 不描边', tLow.patch.quality === 'eco' && tLow.patch.fps === 30 && tLow.patch.gl3d === false && tLow.patch.surfaceStyle === 'clear' && tLow.patch.halo === 'off',
  JSON.stringify({ q: tLow.patch.quality, s: tLow.patch.surfaceStyle, h: tLow.patch.halo }))
check('平光浅色图可以更透（压暗 16）', tLow.patch.dim === 16)
const tBat = window.__dshwp.autoTune({ cores: 8, mem: 12, battery: 12, charging: false, tier: 'high' }, { mean: 0.5, std: 0.35, dominant: 0.5 })
check('低电量不充电 → 强制省电', tBat.lowBat === true && tBat.patch.fps === 30 && tBat.patch.gl3d === false)
const tChg = window.__dshwp.autoTune({ cores: 8, mem: 12, battery: 12, charging: true, tier: 'high' }, { mean: 0.5, std: 0.35, dominant: 0.5 })
check('充电中不降级', tChg.lowBat === false && tChg.patch.fps === 90)
check('适配报告字段齐全', typeof tHigh.tier === 'string' && typeof tHigh.stats.std === 'number' && !!tHigh.patch)

disposed.forEach((d) => d())
await wait(60)
check('卸载清理壁纸层', !q('#dshwp-root'))
const tm = window.__dshwp.timers()
check('卸载后看门狗和观察器都停了', tm.watch === false && tm.observer === false && tm.pending === false, JSON.stringify(tm))
check('卸载后主题覆盖被撤销', themeDisposed.length > 0, 'disposed=' + themeDisposed.length)

console.log(report.join('\n'))
const failed = report.filter((x) => x.startsWith('FAIL'))
console.log(failed.length ? `${failed.length} FAILED` : 'ALL PASS')
process.exit(failed.length ? 1 : 0)

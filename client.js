window.__ModuleLoader__.load({
  id: '@local/live-wallpaper',
  factory(require) {
    const React = require('react')
    const ReactDOM = require('react-dom')
    const h = React.createElement

    const zh = String(navigator.language || 'zh').toLowerCase().startsWith('zh')
    const T = (cn, en) => (zh ? cn : en)

    const STORE_KEY = 'dsh.live-wallpaper.v3'
    const MAX_BYTES = 100 * 1024 * 1024

    const DEFAULTS = {
      on: true,
      mode: 'backdrop',
      strength: 85,
      dim: 36,
      bottomShade: 45,
      blur: 0,
      saturate: 100,
      kenBurns: true,
      introMode: 'effect',
      introRandom: true,
      introOrder: 'random',     // random 每次随机 | order 顺序轮换 | fixed 固定第一条
      introPlay: 'one',         // one 每次随机/按顺序播一套（默认） | all 依次播完所有素材
      introEffect: 'bloom',
      introDuration: 1800,
      videoMuted: true,
      videoLoop: true,
      videoRate: 1,
      focusMode: true,
      pauseOnType: true,        // 打字时暂停粒子/3D/扫光，把主线程让给聊天
      parallax: true,
      parallaxPower: 18,
      audio: false,
      audioSource: 'mic',      // mic | file
      particles: true,
      fx: 'sakura',            // none | sakura | firefly | bubble | star
      fxCount: 45,
      fxSpeed: 1,
      fxGlow: 60,
      fps: 60,                 // 30 | 60 | 90 | 120（受屏幕刷新率限制）
      prCap: 2,                // 像素比上限 2 或 3
      powerSaver: 'auto',      // auto | off
      protectInput: true,      // 不清除底部输入区的底色
      autoClear: true,         // DOM 变化后自动补扫外壳底色
      surfaceStyle: 'glass',   // glass 磨砂半透 | clear 全透 | keep 保留原底色
      autoTheme: true,         // 按壁纸明暗自动改主题 token（字色/面板一起变）
      inkMode: 'auto',         // auto | light 浅色字 | dark 深色字
      halo: 'auto',            // auto 高对比才描边 | on | off
      haloPower: 60,           // 描边强度 0-100
      keepPills: true,         // 顶部标题药丸 / 胶囊保持白色实心（贴近原生）
      veilTone: 'light',       // light 白雾 | dark 暗雾 | warm 暖雾 | cool 冷雾 | gray 灰雾
      haloColor: 'auto',       // auto|white|black|gray|blue|gold
      inkWeight: 'normal',     // soft 柔和 | normal 标准 | pure 纯白/纯黑
      photoOn: true,
      photoInterval: 20,       // 秒
      slotsOn: false,
      slots: [],          // {id,name,start,end,itemId} 分钟制，end 可 >1440 表示跨零点
      slotFade: 18,       // 过渡秒数         // 按时段切换
      sweep: true,
      sweepSpeed: 9,
      sweepStrength: 45,
      stickerSize: 90,
      stickerOn: true,
      stickerMotion: 'float',   // none | float | sway | pulse
      stickerSpeed: 1,
      gl3d: true,
      gl3dDepth: 1.2,
      gl3dSize: 1.6,
      autoOrbit: true,
      gl3dCount: 120,
      transition: 'fade',
      quality: 'balanced',
      reduceMotion: false
    }


    const CSS = `
#dshwp-root{position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;z-index:0;pointer-events:none;
 overflow:hidden;background:transparent;transition:opacity .45s ease;transform:translateZ(0);
 opacity:calc(var(--wp-op,1) * var(--wp-focus,1) * var(--wp-ready,0))}
#dshwp-gl-back,#dshwp-gl-front{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:block}
#dshwp-gl-back{z-index:1;opacity:.95}
#dshwp-gl-front{z-index:5;opacity:1}
#dshwp-root .wp-media{position:absolute;inset:0;z-index:2;overflow:hidden;background:transparent;
 transform:translate3d(var(--wp-px,0px),var(--wp-py,0px),0) scale(1.06);
 transition:transform .3s cubic-bezier(.2,.7,.3,1)}
#dshwp-root .wp-media > img,#dshwp-root .wp-media > video{
 width:100%;height:100%;display:block;object-fit:cover;object-position:center;transform-origin:center}
#dshwp-root .wp-media.kb > img,#dshwp-root .wp-media.kb > video{animation:dshwp-kb 26s ease-in-out infinite alternate}
@keyframes dshwp-kb{0%{transform:scale(1.02)}100%{transform:scale(1.13)}}
#dshwp-sweep{position:absolute;inset:-25%;z-index:4;pointer-events:none;opacity:0;
 background:linear-gradient(105deg,rgba(255,255,255,0) 32%,rgba(255,255,255,.30) 46%,rgba(255,255,255,.52) 50%,rgba(255,255,255,.30) 54%,rgba(255,255,255,0) 68%);
 transform:translateX(-70%);will-change:transform}
#dshwp-sweep.on{opacity:var(--wp-sweep-op,.4);animation:dshwp-sweep var(--wp-sweep-dur,9s) linear infinite}
@keyframes dshwp-sweep{0%{transform:translateX(-75%)}100%{transform:translateX(75%)}}
#dshwp-bottom{position:absolute;inset:0;z-index:7;pointer-events:none;
 background:linear-gradient(to bottom,rgba(0,0,0,0) 58%,rgba(0,0,0,.35) 78%,rgba(0,0,0,.62) 100%);
 opacity:var(--wp-bottom,0);transition:opacity .3s ease}
#dshwp-stickers{position:absolute;inset:0;z-index:8;pointer-events:none}
#dshwp-stickers .wp-sticker-wrap{position:absolute;pointer-events:auto;touch-action:none;user-select:none;
 -webkit-user-select:none;cursor:grab;transform:translate(-50%,-50%);will-change:transform}
#dshwp-stickers .wp-sticker{width:100%;display:block;filter:drop-shadow(0 6px 14px rgba(0,0,0,.35));
 transform-origin:50% 60%}
#dshwp-stickers .anim-float{animation:dshwp-float var(--wp-stk-dur,6s) ease-in-out infinite alternate}
#dshwp-stickers .anim-sway{animation:dshwp-sway var(--wp-stk-dur,5s) ease-in-out infinite alternate}
#dshwp-stickers .anim-pulse{animation:dshwp-pulse var(--wp-stk-dur,2.6s) ease-in-out infinite}
@keyframes dshwp-float{0%{transform:translateY(-6px)}100%{transform:translateY(6px)}}
@keyframes dshwp-sway{0%{transform:rotate(-6deg)}100%{transform:rotate(6deg)}}
@keyframes dshwp-pulse{0%{transform:scale(1)}50%{transform:scale(1.06)}100%{transform:scale(1)}}
#dshwp-fx{position:absolute;inset:0;z-index:3;pointer-events:none;display:block;
 transform:translate3d(calc(var(--wp-px,0px) * .45),calc(var(--wp-py,0px) * .45),0);
 transition:transform .3s cubic-bezier(.2,.7,.3,1)}
#dshwp-scrim{position:absolute;inset:0;z-index:6;pointer-events:none;background:#000;opacity:0}
#dshwp-vignette{position:absolute;inset:0;z-index:7;pointer-events:none;
 background:radial-gradient(ellipse at 50% 45%,rgba(0,0,0,0) 40%,rgba(0,0,0,.45) 100%)}
#dshwp-intro{position:fixed;inset:0;z-index:2147482050;pointer-events:none;overflow:hidden;background:transparent}
#dshwp-intro.has-media{background:#000}
#dshwp-intro.hide{opacity:0;transition:opacity .6s ease}
#dshwp-intro img,#dshwp-intro video{width:100%;height:100%;object-fit:cover;display:block}
#dshwp-intro video{opacity:0;transition:opacity .35s ease}
#dshwp-intro.ready video{opacity:1}
#dshwp-intro video::-webkit-media-controls,#dshwp-intro video::-webkit-media-controls-play-button,
#dshwp-intro video::-webkit-media-controls-start-playback-button,
#dshwp-root video::-webkit-media-controls,#dshwp-root video::-webkit-media-controls-play-button,
#dshwp-root video::-webkit-media-controls-start-playback-button{
 display:none!important;-webkit-appearance:none!important;opacity:0!important}
#dshwp-intro.fx-bloom{animation:dshwp-bloom 1.6s ease-out both}
@keyframes dshwp-bloom{0%{clip-path:circle(0% at 50% 48%)}60%{clip-path:circle(85% at 50% 48%)}100%{clip-path:circle(150% at 50% 48%)}}
#dshwp-intro.fx-curtain{animation:dshwp-curtain 1.5s cubic-bezier(.6,0,.2,1) both}
@keyframes dshwp-curtain{0%{clip-path:inset(0 0 100% 0)}45%{clip-path:inset(0 0 0 0)}100%{clip-path:inset(0 0 0 0);opacity:0}}
#dshwp-intro.fx-zoom{animation:dshwp-zoom 1.5s cubic-bezier(.2,.8,.2,1) both}
@keyframes dshwp-zoom{0%{transform:scale(1.25);opacity:0;filter:blur(14px)}45%{opacity:1}100%{transform:scale(1);filter:none;opacity:0}}
#dshwp-intro.fx-flash{background:radial-gradient(circle at 50% 45%,#fff,rgba(190,240,255,.5) 40%,#000 78%);
 animation:dshwp-flash 1.3s ease-out both}
@keyframes dshwp-flash{0%{opacity:0}18%{opacity:1}100%{opacity:0}}
#dshwp-root.dshwp-overlay{z-index:2147482000;mix-blend-mode:normal}
html.dshwp-shell,html.dshwp-shell body{background:transparent!important;background-image:none!important}
.dshwp-cleared{background-color:var(--wp-surf,transparent)!important;background-image:none!important}
html.dshwp-halo body{text-shadow:var(--wp-halo,none)}
#dshwp-ghost{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden;opacity:0}
#dshwp-ghost > img,#dshwp-ghost > video{width:100%;height:100%;object-fit:cover;display:block}
.t-fade{transition:opacity .45s ease}
.t-slide{transition:transform .5s cubic-bezier(.2,.8,.2,1),opacity .5s ease}
.t-zoom{transition:transform .55s cubic-bezier(.2,.8,.2,1),opacity .55s ease}
#dshwp-ui{position:fixed;inset:0;z-index:2147482100;pointer-events:none}
#dshwp-card{position:fixed;right:10px;left:10px;bottom:calc(14px + env(safe-area-inset-bottom,0px));margin:0 auto;max-width:430px;max-height:78vh;overflow:auto;
 pointer-events:auto;border-radius:20px;padding:14px 14px 16px;box-sizing:border-box;
 background:rgba(17,20,27,.95);color:#eef2f8;border:1px solid rgba(255,255,255,.13);
 box-shadow:0 22px 60px rgba(0,0,0,.55);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);
 font:13px/1.45 system-ui,-apple-system,sans-serif;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
#dshwp-card .wp-sec{margin:6px 0}
#dshwp-card .wp-sec-h{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;
 background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;
 color:inherit;font-size:12px;font-weight:600;letter-spacing:.5px;padding:9px 11px;cursor:pointer;touch-action:manipulation}
#dshwp-card .wp-sec-i{opacity:.6;font-size:11px}
#dshwp-card h4{margin:14px 0 6px;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;opacity:.55;font-weight:600}
#dshwp-card h4:first-child{margin-top:2px}
#dshwp-card .wp-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
#dshwp-card .wp-title{font-size:16px;font-weight:650}
#dshwp-card .wp-x{border:0;background:rgba(255,255,255,.1);color:#eef2f8;border-radius:10px;width:30px;height:30px;font-size:16px;cursor:pointer}
#dshwp-card .wp-row{margin:9px 0}
#dshwp-card .wp-label{display:flex;justify-content:space-between;gap:8px;font-size:12px;opacity:.8;margin-bottom:6px}
#dshwp-card .wp-chips{display:flex;flex-wrap:wrap;gap:6px}
#dshwp-card .wp-chip{touch-action:manipulation;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#eef2f8;
 border-radius:999px;padding:5px 11px;font-size:12px;cursor:pointer;white-space:nowrap}
#dshwp-card .wp-chip.on{background:#2dd4bf;color:#04211c;border-color:transparent;font-weight:600}
#dshwp-card input[type=range]{width:100%;accent-color:#2dd4bf}
#dshwp-card .wp-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
#dshwp-card .wp-btn{touch-action:manipulation;flex:1 1 40%;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#eef2f8;
 border-radius:11px;padding:9px 6px;font-size:12px;cursor:pointer}
#dshwp-card .wp-btn.primary{background:#2dd4bf;color:#04211c;border-color:transparent;font-weight:600}
#dshwp-card .wp-note{font-size:11px;opacity:.6;margin-top:8px;line-height:1.4}
#dshwp-card .wp-file{font-size:11px;opacity:.8;margin-top:6px;word-break:break-all}
#dshwp-card .wp-list{margin:8px 0 2px;display:flex;flex-direction:column;gap:6px}
#dshwp-card .wp-item{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.05);border-radius:10px;padding:6px 8px}
#dshwp-card .wp-stk-col{flex-direction:column;align-items:stretch;gap:6px}
#dshwp-card .wp-stk-line{display:flex;align-items:center;gap:6px}
#dshwp-card .wp-stk-op{display:flex;align-items:center;gap:8px;font-size:11px;opacity:.85}
#dshwp-card .wp-stk-op input[type=range]{flex:1;min-width:0}
#dshwp-card .wp-item.on{outline:1px solid #2dd4bf;background:rgba(45,212,191,.12)}
#dshwp-card .wp-item-name{flex:1;min-width:0;text-align:left;background:none;border:0;color:inherit;font-size:12px;
 overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;padding:0}
#dshwp-card .wp-slot{display:flex;align-items:center;gap:5px;flex-wrap:wrap;background:rgba(255,255,255,.05);border-radius:10px;padding:5px 6px}
#dshwp-card .wp-slot input.wp-rename{flex:1.4}
#dshwp-card .wp-time{flex:0 0 auto;width:74px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);
 border-radius:8px;color:#eef2f8;font-size:11px;padding:4px 2px;box-sizing:border-box}
#dshwp-card .wp-select{flex:0 0 auto;max-width:96px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);
 border-radius:8px;color:#eef2f8;font-size:11px;padding:4px 2px}
#dshwp-card .wp-paste{width:100%;min-height:88px;box-sizing:border-box;margin-top:8px;border-radius:10px;
 background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);color:#eef2f8;font-size:11px;padding:8px;
 font-family:ui-monospace,monospace;resize:vertical}
#dshwp-card .wp-rename{flex:1;min-width:0;background:rgba(255,255,255,.1);border:1px solid rgba(45,212,191,.6);
 border-radius:8px;color:#eef2f8;font-size:12px;padding:5px 7px;box-sizing:border-box}
#dshwp-card .wp-item-x{flex:0 0 auto;width:26px;height:26px;border-radius:9px;border:1px solid rgba(255,255,255,.2);
 background:rgba(255,255,255,.06);color:inherit;font-size:12px;cursor:pointer;touch-action:manipulation}
.dshwp-pill{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(127,127,127,.35);
 background:transparent;color:inherit;border-radius:999px;padding:4px 11px;font-size:12px;cursor:pointer;line-height:1.2}
.dshwp-pill:hover{background:rgba(127,127,127,.12)}
.dshwp-pill-dot{width:8px;height:8px;border-radius:50%;background:#2dd4bf;box-shadow:0 0 10px #2dd4bf}
`

    const bus = { state: Object.assign({}, DEFAULTS), media: null, playlist: [], mediaIndex: 0, intro: null, introList: [], introIndex: -1, history: [], audioBlob: null, audioClip: null, audioName: '', audioList: [], audioIndex: -1, listeners: new Set() }
    let hasSavedState = false
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) hasSavedState = true
      const saved = JSON.parse(raw || '{}')
      if (saved.introRandom === false && saved.introOrder === undefined) saved.introOrder = 'order'
      for (const k of Object.keys(DEFAULTS)) if (saved[k] !== undefined) bus.state[k] = saved[k]
      if (bus.state.dim < 34) bus.state.dim = 34
      if (bus.state.audio) bus.state.audio = false // 音频要用户手势，刷新后不自动开
    } catch {}
    const emit = () => bus.listeners.forEach((fn) => fn())

    function idb() {
      return new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) return reject(new Error('no indexedDB'))
        const req = indexedDB.open('dsh-live-wallpaper', 1)
        req.onupgradeneeded = () => req.result.createObjectStore('media')
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
    }
    async function putRecord(key, rec) {
      try {
        const db = await idb()
        await new Promise((resolve, reject) => {
          const tx = db.transaction('media', 'readwrite')
          tx.objectStore('media').put(rec, key)
          tx.oncomplete = resolve
          tx.onerror = () => reject(tx.error)
        })
      } catch (e) { console.warn('[live-wallpaper] 素材没能存下来：', e && e.message) }
    }
    async function getRecord(key) {
      try {
        const db = await idb()
        return await new Promise((resolve, reject) => {
          const tx = db.transaction('media', 'readonly')
          const r = tx.objectStore('media').get(key)
          r.onsuccess = () => resolve(r.result || null)
          r.onerror = () => reject(r.error)
        })
      } catch { return null }
    }
    const saveMedia = (rec) => putRecord('current', rec)
    const saveIntro = (rec) => putRecord('intro', rec)

    let ctxRef = null
    let root = null
    let mediaBox = null
    let scrim = null
    let introPlaying = false
    let currentSrc = ''
    let nightExtra = 0
    let audioLevel = 0
    function updateScrim() {
      if (!scrim) return
      const base = Math.min(0.9, (Number(bus.state.dim) || 0) / 100)
      scrim.style.opacity = String(Math.max(0, Math.min(0.95, base + nightExtra + audioLevel * 0.05)))
    }
    const cleared = new Map()
    let shellTimer = 0
    let lastDiag = { cleared: 0, hits: 0, total: 5 }

    function syncMode() {
      const s = bus.state
      if (document.documentElement) {
        document.documentElement.classList.toggle('dshwp-shell', !!s.on && s.mode === 'backdrop')
      }
      if (root) {
        const overlay = !!s.on && s.mode === 'overlay'
        root.classList.toggle('dshwp-overlay', overlay)
        const opacity = overlay ? 0.32 + 0.6 * (s.strength / 100) : Math.max(0.05, s.strength / 100)
        root.style.setProperty('--wp-op', String(Math.min(1, opacity)))
        root.style.display = s.on ? '' : 'none'
      }
      updateScrim()
      if (root) root.style.setProperty('--wp-bottom', String(Math.max(0, Math.min(1, (Number(s.bottomShade) || 0) / 100))))
      const veil = s.surfaceStyle === 'glass'
        ? (s.veilTone === 'dark' ? 'rgba(9,11,16,.46)' : 'rgba(250,251,253,.62)')
        : 'transparent'
      if (document.documentElement) document.documentElement.style.setProperty('--wp-surf', veil)
      if (!s.on || s.mode === 'overlay') { restoreShell(); applyHalo(false) }
      else scheduleShell()
      AutoTheme.schedule()
    }

    // ---------- 把外壳的底清掉，壁纸才露得出来 ----------
    function looksOpaque(cs) {
      const bg = cs.backgroundColor
      if (!bg || bg === 'transparent') return false
      const m = bg.match(/rgba?\(([^)]+)\)/)
      if (!m) return true
      const p = m[1].split(',').map((x) => parseFloat(x))
      return p.length < 4 || p[3] > 0.55
    }
    function bigEnough(el, ratio) {
      const r = el.getBoundingClientRect()
      return r.width * r.height >= (window.innerWidth || 360) * (window.innerHeight || 640) * ratio
    }
    function surfForStyle(style, tone, light, pageLike) {
      if (pageLike && style !== 'solid' && style !== 'solidDark') return 'transparent'
      if (style === 'glass') return toneFor(tone, light)
      if (style === 'dark') return toneFor('dark', false)
      if (style === 'solid') return 'rgba(250,251,253,.93)'
      if (style === 'solidDark') return 'rgba(10,12,18,.93)'
      return 'transparent'
    }

    function toneFor(tone, light) {
      if (tone === 'dark') return 'rgba(9,11,16,.52)'
      if (tone === 'warm') return light ? 'rgba(255,244,232,.58)' : 'rgba(58,42,30,.55)'
      if (tone === 'cool') return light ? 'rgba(234,244,255,.58)' : 'rgba(24,36,52,.55)'
      if (tone === 'gray') return light ? 'rgba(240,242,245,.58)' : 'rgba(38,40,44,.55)'
      return light ? 'rgba(250,251,253,.58)' : 'rgba(9,11,16,.50)'
    }

    function luminance(bg) {
      const m = String(bg || '').match(/rgba?\(([^)]+)\)/)
      if (!m) return 1
      const p = m[1].split(',').map((x) => parseFloat(x))
      const a = p.length >= 4 ? p[3] : 1
      if (a < 0.2) return 1
      return (0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]) / 255
    }
    // 输入区（气泡+输入框）整条链路保持原样：它是唯一「有自己底色」的地方
    function composerHosts() {
      const H = window.innerHeight || 640
      const out = new Set()
      let nodes = []
      try { nodes = Array.prototype.slice.call(document.querySelectorAll('textarea,input,[contenteditable="true"]')) } catch { nodes = [] }
      for (const n of nodes) {
        if (n.closest && n.closest('#dshwp-ui')) continue
        const r = n.getBoundingClientRect ? n.getBoundingClientRect() : null
        if (!r || !r.height || r.top < H * 0.5) continue
        let p = n.parentElement
        let depth = 0
        while (p && p !== document.body && depth < 5) {
          const pr = p.getBoundingClientRect ? p.getBoundingClientRect() : null
          if (pr && pr.height > H * 0.55) break
          out.add(p)
          p = p.parentElement
          depth++
        }
      }
      return out
    }

    function clearOne(el, hosts) {
      if (!el || el === root || (el.id && el.id.indexOf('dshwp-') === 0)) return
      if (el === document.body || el === document.documentElement) return
      if (cleared.has(el)) return
      if (hosts && hosts.has(el)) return
      const W = window.innerWidth || 360
      const H = window.innerHeight || 640
      const r = el.getBoundingClientRect ? el.getBoundingClientRect() : null
      if (!r) return
      // 大块面板（含抽屉、弹层、菜单卡）统一处理；细碎按钮不碰
      const wide = r.width >= W * 0.45 && r.height >= 28
      const big = r.width * r.height >= W * H * 0.15
      if (!wide && !big) return
      // 顶部那条标题药丸/胶囊保持白色实心，别清成透明（原生就是这个样子）
      if (bus.state.keepPills && r.height <= 160 && r.width >= W * 0.3 && r.top < H * 0.2) return
      const cs = window.getComputedStyle(el)
      const hasImg = cs.backgroundImage && cs.backgroundImage !== 'none'
      if (!hasImg && !looksOpaque(cs)) return
      // 雾色跟着原底色走：原本深色的面板给暗雾，浅色给白雾，避免白字糊在白底上
      const st = bus.state.surfaceStyle
      const tone = bus.state.veilTone || 'light'
      const known = cs.backgroundColor && cs.backgroundColor !== 'transparent' && !hasImg
      const light = known ? luminance(cs.backgroundColor) >= 0.5 : tone !== 'dark'
      // 铺满整页的大容器（聊天列表、聊天区背景）不能糊雾：
      // 它一糊就是整页发白、字全糊，这正是"播完启动动画后突然变淡"的原因。
      const pageLike = r.width >= W * 0.88 && r.height >= H * 0.5
      const surf = surfForStyle(st, tone, light, pageLike)
      cleared.set(el, {
        color: el.style.getPropertyValue('background-color'),
        image: el.style.getPropertyValue('background-image'),
        surf: el.style.getPropertyValue('--wp-surf'),
      })
      if (surf) el.style.setProperty('--wp-surf', surf)
      el.classList.add('dshwp-cleared')
      if (hasImg) el.style.setProperty('background-image', 'none', 'important')
    }

    function pruneShell() {
      for (const el of Array.from(cleared.keys())) {
        if (!el.isConnected) { el.classList && el.classList.remove('dshwp-cleared'); cleared.delete(el) }
      }
    }

    function clearShell() {
      if (!bus.state.on) return
      if (bus.state.surfaceStyle === 'keep') { if (cleared.size) restoreShell(); return }
      pruneShell()
      const hosts = bus.state.protectInput ? composerHosts() : new Set()
      const W = window.innerWidth || 360
      const H = window.innerHeight || 640
      // 1) 屏幕取样：从命中的元素往上清，专治「白底是 background-image / 渐变」
      const pts = [[0.5, 0.5], [0.5, 0.12], [0.5, 0.3], [0.2, 0.4], [0.8, 0.45], [0.5, 0.62]]
      const canPick = typeof document.elementFromPoint === 'function'
      for (const [px, py] of pts) {
        if (!canPick) break
        let el = document.elementFromPoint(Math.round(W * px), Math.round(H * py))
        let depth = 0
        while (el && el !== document.body && depth < 8) {
          clearOne(el, hosts)
          el = el.parentElement
          depth++
        }
      }
      // 2) 面积兜底：抽屉、弹层、悬浮菜单卡都靠这一步统一
      const walk = (el, depth) => {
        if (depth > 4) return
        for (const c of el.children) {
          if (c.id && c.id.indexOf('dshwp-') === 0) continue
          const r = c.getBoundingClientRect ? c.getBoundingClientRect() : null
          const wide = !!r && r.width >= W * 0.45 && r.height >= 28
          const big = !!r && r.width * r.height >= W * H * 0.15
          if ((wide || big) && c.children.length < 80) clearOne(c, hosts)
          walk(c, depth + 1)
        }
      }
      walk(document.body, 0)
      clearOne(document.body, hosts)
      emitShellCount()
    }

    function restoreShell() {
      for (const [el, prev] of cleared) {
        el.classList.remove('dshwp-cleared')
        if (prev.color) el.style.setProperty('background-color', prev.color)
        if (prev.image) el.style.setProperty('background-image', prev.image)
        if (prev.surf) el.style.setProperty('--wp-surf', prev.surf)
        else el.style.removeProperty('--wp-surf')
      }
      cleared.clear()
      emitShellCount()
    }

    function diagnose() {
      const pts = [[0.5, 0.5], [0.5, 0.3], [0.5, 0.7], [0.25, 0.5], [0.75, 0.5]]
      let hits = 0
      if (typeof document.elementFromPoint !== 'function') {
        lastDiag = { cleared: cleared.size, hits: 0, total: pts.length }
        return lastDiag
      }
      for (const [x, y] of pts) {
        const el = document.elementFromPoint(Math.round((window.innerWidth || 360) * x), Math.round((window.innerHeight || 640) * y))
        if (el && root && (el === root || root.contains(el))) hits++
      }
      lastDiag = { cleared: cleared.size, hits, total: pts.length }
      return lastDiag
    }

    let shellCount = 0
    function emitShellCount() {
      shellCount = cleared.size
      bus.listeners.forEach((fn) => fn())
    }
    let observer = null
    let obsTimer = 0
    let settleTimer = 0
    let watchTimer = 0
    function startObserver() {
      const MO = window.MutationObserver
      if (!MO || observer) return
      observer = new MO((records) => {
        if (!bus.state.autoClear || bus.holdRender || document.hidden) return
        // 一次冒出很多节点＝正在流式输出/整段重绘：别立刻清（会闪），等它稳下来再补一次
        if (records && records.length > 20) {
          if (settleTimer) return
          settleTimer = setTimeout(() => { settleTimer = 0; clearShell(); diagnose() }, 600)
          return
        }
        if (obsTimer) return
        obsTimer = setTimeout(() => { obsTimer = 0; clearShell() }, 220)
      })
      observer.observe(document.body, { childList: true, subtree: true })
      startWatch()
    }
    function stopObserver() {
      if (observer) { observer.disconnect(); observer = null }
      if (obsTimer) { clearTimeout(obsTimer); obsTimer = 0 }
      if (settleTimer) { clearTimeout(settleTimer); settleTimer = 0 }
      if (watchTimer) { clearInterval(watchTimer); watchTimer = 0 }
    }
    // 看门狗：不靠 DOM 事件，定期抽查屏幕上是否又冒出不透明块（发图/切页后最容易发生）
    function startWatch() {
      if (watchTimer) return
      watchTimer = setInterval(() => {
        if (!bus.state.on || !bus.state.autoClear || document.hidden) return
        if (bus.state.surfaceStyle === 'keep') return
        if (typeof document.elementFromPoint !== 'function') return
        const W = window.innerWidth || 360
        const H = window.innerHeight || 640
        const hosts = bus.state.protectInput ? composerHosts() : new Set()
        for (const [px, py] of [[0.5, 0.5], [0.5, 0.28], [0.5, 0.6]]) {
          let el = document.elementFromPoint(Math.round(W * px), Math.round(H * py))
          let depth = 0
          while (el && el !== document.body && depth < 6) {
            if (el !== root && !cleared.has(el) && !hosts.has(el)) {
              const r = el.getBoundingClientRect ? el.getBoundingClientRect() : null
              if (r && r.width >= W * 0.45 && r.height >= 28) {
                const cs = window.getComputedStyle(el)
                if (looksOpaque(cs) || (cs.backgroundImage && cs.backgroundImage !== 'none')) { clearShell(); return }
              }
            }
            el = el.parentElement
            depth++
          }
        }
      }, 1600)
    }

    function scheduleShell() {
      if (shellTimer) clearTimeout(shellTimer)
      shellTimer = setTimeout(() => { shellTimer = 0; clearShell(); diagnose() }, 120)
    }

    // ---------- 交互效果模块：每个都能单独开关、单独卸载 ----------
    const FocusMode = {
      key: 'focusMode',
      active: false,
      timer: 0,
      handler: null,
      start() {
        if (this.active) return
        this.active = true
        this.handler = () => {
          if (document.selectionchange && window.getSelection && String(window.getSelection()).length > 0) { this.enter(); return }
          const t = document.activeElement
          const typing = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
          if (typing) this.enter()
          else this.leave()
        }
        document.addEventListener('focusin', this.handler, true)
        document.addEventListener('focusout', this.handler, true)
        document.addEventListener('selectionchange', this.handler)
      },
      onSelection() {
        const sel = window.getSelection && window.getSelection()
        if (sel && String(sel).length > 0) this.enter()
      },
      enter() {
        if (this.timer) { clearTimeout(this.timer); this.timer = 0 }
        if (root) root.style.setProperty('--wp-focus', '0.02')
        if (bus.state.pauseOnType) { bus.holdRender = true; syncEffects() }
      },
      leave() {
        if (this.timer) clearTimeout(this.timer)
        this.timer = setTimeout(() => {
          this.timer = 0
          if (root) root.style.setProperty('--wp-focus', '1')
          if (bus.holdRender) { bus.holdRender = false; syncEffects() }
        }, 200)
      },
      stop() {
        this.active = false
        if (this.handler) {
          document.removeEventListener('focusin', this.handler, true)
          document.removeEventListener('focusout', this.handler, true)
          document.removeEventListener('selectionchange', this.handler)
          this.handler = null
        }
        if (this.timer) { clearTimeout(this.timer); this.timer = 0 }
        if (root) root.style.setProperty('--wp-focus', '1')
      },
    }

    const Parallax = {
      key: 'parallax',
      active: false,
      point: null,
      raf: 0,
      move: null,
      start() {
        if (this.active) return
        this.active = true
        this.move = (e) => {
          const p = e.touches && e.touches[0] ? e.touches[0] : e
          if (p.clientX === undefined) return
          this.point = { x: p.clientX, y: p.clientY }
          if (!this.raf) this.raf = requestAnimationFrame(() => { this.raf = 0; this.apply() })
        }
        window.addEventListener('mousemove', this.move, { passive: true })
        window.addEventListener('touchmove', this.move, { passive: true })
      },
      apply() {
        if (!root || !this.point) return
        const w = window.innerWidth || 360
        const hgt = window.innerHeight || 640
        const power = Number(bus.state.parallaxPower) || 0
        const nx = (this.point.x / w - 0.5) * 2
        const ny = (this.point.y / hgt - 0.5) * 2
        root.style.setProperty('--wp-px', (nx * power).toFixed(1) + 'px')
        root.style.setProperty('--wp-py', (ny * power).toFixed(1) + 'px')
      },
      reset() {
        if (!root) return
        root.style.setProperty('--wp-px', '0px')
        root.style.setProperty('--wp-py', '0px')
      },
      stop() {
        this.active = false
        if (this.move) {
          window.removeEventListener('mousemove', this.move)
          window.removeEventListener('touchmove', this.move)
          this.move = null
        }
        if (this.raf) { cancelAnimationFrame(this.raf); this.raf = 0 }
        this.point = null
        this.reset()
      },
    }

    const AudioPulse = {
      key: 'audio',
      active: false,
      ctx: null,
      stream: null,
      node: null,
      analyser: null,
      data: null,
      raf: 0,
      level: 0,
      pending: false,
      error: '',
      emitAt: 0,
      async start() {
        if (this.active) return
        this.active = true
        this.error = ''
        try {
          if (bus.state.audioSource === 'file') await this.startFile()
          else await this.startMic()
        } catch (e) {
          this.error = (e && e.message) || T('音频律动启动失败', 'Audio pulse failed')
          this.stop()
          if (bus.state.audio) { bus.state.audio = false; try { localStorage.setItem(STORE_KEY, JSON.stringify(bus.state)) } catch {} }
          bus.listeners.forEach((fn) => fn())
        }
      },
      makeAnalyser(AC) {
        this.analyser = AC.createAnalyser()
        this.analyser.fftSize = 256
        this.analyser.smoothingTimeConstant = 0.72
        this.data = new Uint8Array(this.analyser.frequencyBinCount)
        // 接到 0 增益再进 destination，图才会被驱动，又不外放
        const silent = AC.createGain()
        silent.gain.value = 0
        this.analyser.connect(silent)
        silent.connect(AC.destination)
        this.loop()
      },
      async startMic() {
        if (!window.isSecureContext) throw new Error(T('页面不是安全上下文，WebView 不给麦克风', 'Not a secure context; the WebView blocks the microphone'))
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error(T('这个 WebView 不支持麦克风采集，换成「音频文件」', 'This WebView cannot capture audio; switch to a file'))
        this.pending = true
        bus.listeners.forEach((fn) => fn())
        try {
          this.stream = await Promise.race([
            navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }),
            new Promise((_, reject) => setTimeout(() => reject(new Error(T('麦克风没有响应（WebView 可能没给权限），用「音频文件」吧', 'No microphone response; use an audio file'))), 8000)),
          ])
        } finally {
          this.pending = false
          bus.listeners.forEach((fn) => fn())
        }
        const AC = window.AudioContext || window.webkitAudioContext
        if (!AC) throw new Error(T('不支持 Web Audio', 'Web Audio unavailable'))
        this.ctx = new AC()
        if (this.ctx.state === 'suspended' && this.ctx.resume) this.ctx.resume()
        this.node = this.ctx.createMediaStreamSource(this.stream)
        this.makeAnalyser(this.ctx)
        this.node.connect(this.analyser)
      },
      async startFile() {
        const AC = window.AudioContext || window.webkitAudioContext
        if (!AC) throw new Error(T('不支持 Web Audio', 'Web Audio unavailable'))
        if (!bus.audioClip && bus.audioBlob) {
          try {
            const tmp = new AC()
            bus.audioClip = await tmp.decodeAudioData(await bus.audioBlob.arrayBuffer())
            try { tmp.close() } catch {}
          } catch { bus.audioClip = null }
        }
        if (!bus.audioClip) throw new Error(T('先选一个音频文件（MP3 / WAV / M4A）', 'Pick an audio file first (MP3 / WAV / M4A)'))
        this.ctx = new AC()
        if (this.ctx.state === 'suspended' && this.ctx.resume) this.ctx.resume()
        this.node = this.ctx.createBufferSource()
        this.node.buffer = bus.audioClip
        this.node.loop = true
        this.makeAnalyser(this.ctx)
        this.node.connect(this.analyser)
        this.node.start(0)
      },
      loop() {
        this.raf = requestAnimationFrame(() => this.loop())
        if (!this.analyser || !this.data || !scrim) return
        if (document.hidden) return
        this.analyser.getByteFrequencyData(this.data)
        let sum = 0
        for (let i = 0; i < 8; i++) sum += this.data[i]
        const raw = sum / 8 / 255
        this.level += (raw - this.level) * 0.2
        audioLevel = this.level
        updateScrim()
        const now = Date.now()
        if (now - this.emitAt > 600) {
          this.emitAt = now
          bus.listeners.forEach((fn) => fn())
        }
      },
      stop() {
        this.active = false
        if (this.raf) { cancelAnimationFrame(this.raf); this.raf = 0 }
        if (this.node) { try { if (this.node.stop) this.node.stop() } catch {} this.node = null }
        if (this.stream) {
          try { this.stream.getTracks().forEach((t) => t.stop()) } catch {}
          this.stream = null
        }
        if (this.ctx) { try { this.ctx.close() } catch {} this.ctx = null }
        this.analyser = null
        this.data = null
        this.level = 0
        audioLevel = 0
        updateScrim()
      },
    }

    // ---- 音频列表：可以加多首、点名字切换、逐首删掉（和启动素材同一套交互）----
    let audioWriteChain = Promise.resolve()
    function persistAudioList() {
      const snapshot = {
        list: bus.audioList.map((it) => ({ id: it.id, name: it.name, blob: it.blob })),
        index: bus.audioIndex,
      }
      audioWriteChain = audioWriteChain.then(() => putRecord('audioList', snapshot)).catch(() => {})
      return audioWriteChain
    }
    async function decodeAudioFile(file) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) throw new Error(T('不支持 Web Audio', 'Web Audio unavailable'))
      const tmp = new AC()
      try {
        return await tmp.decodeAudioData(await file.arrayBuffer())
      } finally {
        try { tmp.close() } catch (e) {}
      }
    }
    function syncAudioCurrent() {
      const it = bus.audioList[bus.audioIndex]
      if (!it) {
        bus.audioClip = null
        bus.audioBlob = null
        bus.audioName = ''
        return
      }
      bus.audioClip = it.clip || null
      bus.audioBlob = it.blob
      bus.audioName = it.name
    }
    function restartPulseIfNeeded() {
      if (!AudioPulse.active) return
      AudioPulse.stop()
      if (bus.state.audio) setTimeout(() => { try { AudioPulse.start() } catch (e) {} }, 60)
    }
    async function addAudioFiles(files) {
      let n = 0
      let firstIndex = -1
      let err = ''
      const list = Array.from(files || [])
      for (const f of list) {
        if (!f) continue
        if (f.size > 40 * 1024 * 1024) { err = T('音频最大 40MB', 'Audio up to 40MB'); continue }
        try {
          const clip = await decodeAudioFile(f)
          if (firstIndex < 0) firstIndex = bus.audioList.length
          bus.audioList.push({ id: uid(), name: f.name || 'audio', size: f.size, blob: f, clip })
          n++
        } catch (e) {
          err = T('这个音频解不开，换个 MP3 试试', 'Cannot decode this audio')
        }
      }
      if (!n) return { ok: false, error: err || T('没有可用音频', 'Nothing usable') }
      bus.audioIndex = firstIndex
      syncAudioCurrent()
      await persistAudioList()
      set({ audioSource: 'file', audio: true })
      restartPulseIfNeeded()
      return { ok: true, count: n }
    }
    async function setAudioFile(file) {
      if (!file) return { ok: false, error: T('没有选到文件', 'No file picked') }
      return addAudioFiles([file])
    }
    async function switchAudioTo(i) {
      if (!bus.audioList[i]) return false
      bus.audioIndex = i
      syncAudioCurrent()
      await persistAudioList()
      restartPulseIfNeeded()
      emit()
      return true
    }
    async function removeAudioAt(i) {
      if (!bus.audioList[i]) return false
      bus.audioList.splice(i, 1)
      if (!bus.audioList.length) {
        bus.audioIndex = -1
        syncAudioCurrent()
        set({ audio: false })
      } else {
        if (bus.audioIndex > i) bus.audioIndex -= 1
        else if (bus.audioIndex >= bus.audioList.length) bus.audioIndex = bus.audioList.length - 1
        syncAudioCurrent()
      }
      await persistAudioList()
      restartPulseIfNeeded()
      emit()
      return true
    }


    // ---------- 粒子特效：樱花 / 萤火 / 气泡 / 星尘，预渲染精灵保证高帧率 ----------
    const Particles = {
      key: 'particles',
      on: false,
      canvas: null,
      ctx: null,
      raf: 0,
      last: 0,
      acc: 0,
      items: [],
      sprites: {},
      buildSprite(kind, color, size) {
        const c = document.createElement('canvas')
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        c.width = Math.ceil(size * dpr)
        c.height = Math.ceil(size * dpr)
        const g = c.getContext ? c.getContext('2d') : null
        if (!g) return c
        g.scale(dpr, dpr)
        const half = size / 2
        if (kind === 'petal') {
          g.translate(half, half)
          g.fillStyle = color
          g.beginPath()
          g.moveTo(0, -half * 0.8)
          g.bezierCurveTo(half * 0.9, -half * 0.5, half * 0.7, half * 0.6, 0, half * 0.85)
          g.bezierCurveTo(-half * 0.7, half * 0.6, -half * 0.9, -half * 0.5, 0, -half * 0.8)
          g.fill()
          g.globalAlpha = 0.5
          g.strokeStyle = '#ffffff'
          g.lineWidth = 0.8
          g.beginPath()
          g.moveTo(0, -half * 0.5)
          g.lineTo(0, half * 0.5)
          g.stroke()
        } else if (kind === 'leaf') {
          // 枫叶：和安卓端同一套五裂片极坐标轮廓，叶脉也一致
          g.translate(half, half)
          g.fillStyle = color
          const lobes = [[Math.PI / 2, 0.235, 0.97], [1.0123, 0.205, 0.80], [2.1293, 0.205, 0.80],
                         [0.4538, 0.165, 0.60], [2.6878, 0.165, 0.60], [-Math.PI / 2, 0.150, 0.34]]
          const R = half * 0.94
          const edge = (a) => {
            let e = 0.30
            for (let i = 0; i < lobes.length; i++) {
              let dd = a - lobes[i][0]
              dd = Math.atan2(Math.sin(dd), Math.cos(dd))
              e = Math.max(e, lobes[i][2] * Math.exp(-(dd * dd) / (2 * lobes[i][1] * lobes[i][1])))
            }
            return e
          }
          g.beginPath()
          for (let i = 0; i <= 96; i++) {
            const a = -Math.PI + (i / 96) * Math.PI * 2
            const e = edge(a)
            const x = Math.cos(a) * e * R
            const y = -Math.sin(a) * e * R
            if (i === 0) g.moveTo(x, y); else g.lineTo(x, y)
          }
          g.closePath()
          g.fill()
          g.strokeStyle = 'rgba(80,26,8,0.32)'
          g.lineWidth = Math.max(0.6, size * 0.028)
          for (let i = 0; i < lobes.length; i++) {
            const a0 = lobes[i][0], len = lobes[i][2]
            g.beginPath()
            g.moveTo(0, 0)
            g.lineTo(Math.cos(a0) * len * R * 0.86, -Math.sin(a0) * len * R * 0.86)
            g.stroke()
          }
        } else if (kind === 'snow') {
          g.translate(half, half)
          g.strokeStyle = color
          g.lineWidth = Math.max(0.8, size * 0.07)
          g.lineCap = 'round'
          for (let i = 0; i < 6; i++) {
            const a = (Math.PI / 3) * i
            g.beginPath()
            g.moveTo(0, 0)
            g.lineTo(Math.cos(a) * half * 0.92, Math.sin(a) * half * 0.92)
            g.moveTo(Math.cos(a) * half * 0.45 + Math.cos(a + 1.1) * half * 0.3,
                     Math.sin(a) * half * 0.45 + Math.sin(a + 1.1) * half * 0.3)
            g.lineTo(Math.cos(a) * half * 0.55, Math.sin(a) * half * 0.55)
            g.stroke()
          }
        } else if (kind === 'rain') {
          const grad = g.createLinearGradient(0, 0, 0, size)
          grad.addColorStop(0, 'rgba(180,215,255,0)')
          grad.addColorStop(0.45, color)
          grad.addColorStop(1, 'rgba(200,230,255,0)')
          g.fillStyle = grad
          const ww = Math.max(0.7, size * 0.028)
          g.fillRect(half - ww, 0, ww * 2, size)
        } else if (kind === 'streak') {
          const grad = g.createRadialGradient(half, half, 0, half, half, half)
          grad.addColorStop(0, color)
          grad.addColorStop(0.3, color)
          grad.addColorStop(1, 'rgba(0,0,0,0)')
          g.save()
          g.translate(half, half)
          g.scale(0.55, 1.6)
          g.translate(-half, -half)
          g.fillStyle = grad
          g.beginPath()
          g.arc(half, half, half, 0, Math.PI * 2)
          g.fill()
          g.restore()
        } else {
          const grad = g.createRadialGradient(half, half, 0, half, half, half)
          grad.addColorStop(0, color)
          grad.addColorStop(0.35, color)
          grad.addColorStop(1, 'rgba(0,0,0,0)')
          g.fillStyle = grad
          g.beginPath()
          g.arc(half, half, half, 0, Math.PI * 2)
          g.fill()
        }
        return c
      },
      // 枫叶：和安卓端同一份轮廓点，叶尖红→叶柄黄的线性渐变 + 叶脉
      buildLeafSprite(size, cTop, cBottom) {
        try {
          return this._buildLeafSprite(size, cTop, cBottom)
        } catch (e) {
          // 没有 canvas 2D 能力时退回一个透明 1x1，别把整个粒子系统带崩
          return this.buildSprite('glow', 'rgba(255,200,120,0.9)', 12)
        }
      },
      _buildLeafSprite(size, cTop, cBottom) {
        const c = document.createElement('canvas')
        c.width = c.height = size
        const g = c.getContext('2d')
        const half = size / 2
        const R = half * 0.94
        const pts = [[0, 1], [0.16, 0.66], [0.40, 0.80], [0.30, 0.44], [0.66, 0.44], [0.92, 0.22],
          [0.52, 0.02], [0.70, -0.18], [0.42, -0.16], [0.56, -0.66], [0.18, -0.32], [0.05, -0.92],
          [-0.05, -0.92], [-0.18, -0.32], [-0.56, -0.66], [-0.42, -0.16], [-0.70, -0.18], [-0.52, 0.02],
          [-0.92, 0.22], [-0.66, 0.44], [-0.30, 0.44], [-0.40, 0.80], [-0.16, 0.66]]
        g.save()
        g.translate(half, half)
        const grad = g.createLinearGradient(0, -R, 0, R)
        grad.addColorStop(0, cTop)
        grad.addColorStop(0.55, cTop)
        grad.addColorStop(1, cBottom)
        g.fillStyle = grad
        g.beginPath()
        for (let i = 0; i < pts.length; i++) {
          const x = pts[i][0] * R, y = -pts[i][1] * R
          if (i === 0) g.moveTo(x, y); else g.lineTo(x, y)
        }
        g.closePath()
        g.fill()
        g.strokeStyle = 'rgba(60,14,4,0.30)'
        g.lineWidth = Math.max(0.7, size * 0.012)
        const tips = [[0, 1], [0.40, 0.80], [0.92, 0.22], [0.56, -0.66], [-0.56, -0.66], [-0.92, 0.22], [-0.40, 0.80]]
        for (let i = 0; i < tips.length; i++) {
          g.beginPath()
          g.moveTo(0, 0)
          g.lineTo(tips[i][0] * R * 0.92, -tips[i][1] * R * 0.92)
          g.stroke()
        }
        g.restore()
        return c
      },
      buildSprites() {
        this.sprites = {
          petal: this.buildSprite('petal', 'rgba(255,183,210,0.95)', 22),
          petal2: this.buildSprite('petal', 'rgba(255,236,246,0.9)', 16),
          glow: this.buildSprite('glow', 'rgba(180,255,220,0.95)', 34),
          gold: this.buildSprite('glow', 'rgba(255,228,160,0.95)', 30),
          bubble: this.buildSprite('glow', 'rgba(180,230,255,0.85)', 26),
          star: this.buildSprite('glow', 'rgba(220,235,255,0.95)', 18),
          // 四季（八目迷·按意境）
          springA: this.buildSprite('petal', 'rgba(255,183,210,0.95)', 22),
          springB: this.buildSprite('petal', 'rgba(255,236,246,0.9)', 16),
          rainA: this.buildSprite('rain', 'rgba(185,218,255,0.85)', 58),
          rainB: this.buildSprite('rain', 'rgba(215,238,255,0.7)', 42),
          autumnA: null, autumnB: null, autumnC: null, autumnD: null,
          winterSnow: this.buildSprite('snow', 'rgba(180,205,235,0.85)', 18),
          winterEmber: this.buildSprite('glow', 'rgba(210,150,110,0.7)', 12),
        }
      },
      ensureLeafSprites() {
        const sp = this.sprites
        if (!sp || sp.autumnA) return
        sp.autumnA = this.buildLeafSprite(64, '#9d0d0a', '#ffd63d')
        sp.autumnB = this.buildLeafSprite(64, '#c62310', '#ffa81e')
        sp.autumnC = this.buildLeafSprite(64, '#f24712', '#ffe05a')
        sp.autumnD = this.buildLeafSprite(64, '#8c0a08', '#f08c1a')
      },
      reset() {
        const fx = bus.state.fx
        if (fx === 'autumn') this.ensureLeafSprites()
        let n = Math.max(0, Math.min(160, Number(bus.state.fxCount) || 0))
        // 雨要更密：同样数量设置下雨滴比花瓣多 1.7 倍
        if (fx === 'summer') n = Math.round(Math.min(220, n * 1.7))
        this.items = []
        if (fx === 'none') return
        for (let i = 0; i < n; i++) this.items.push(this.spawn(true))
      },
      spawn(anywhere) {
        const fx = bus.state.fx
        const w = this.w || 360
        const hgt = this.h || 640
        const rnd = (a, b) => a + Math.random() * (b - a)
        const base = {
          x: rnd(0, w),
          y: anywhere ? rnd(0, hgt) : (fx === 'bubble' ? hgt + rnd(0, 60) : rnd(-80, -10)),
          r: rnd(0.6, 1.5),
          v: rnd(0.5, 1.5),
          sway: rnd(0.4, 1.6),
          phase: rnd(0, Math.PI * 2),
          rot: rnd(-0.5, 0.5),
          spin: rnd(-0.5, 0.5),
          a: rnd(0.5, 1),
        }
        return base
      },
      resize() {
        if (!this.canvas) return
        const w = Math.max(320, window.innerWidth || 360)
        const hgt = Math.max(320, window.innerHeight || 640)
        const dpr = Math.min(window.devicePixelRatio || 1, Number(bus.state.prCap) || 2)
        this.w = w
        this.h = hgt
        this.dpr = dpr
        this.canvas.width = Math.round(w * dpr)
        this.canvas.height = Math.round(hgt * dpr)
        this.canvas.style.width = '100%'
        this.canvas.style.height = '100%'
        if (this.ctx) this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      },
      start() {
        if (this.on) return
        this.on = true
        if (!this.canvas && root) {
          this.canvas = document.createElement('canvas')
          this.canvas.id = 'dshwp-fx'
          this.ctx = this.canvas.getContext ? this.canvas.getContext('2d', { alpha: true }) : null
          if (scrim && scrim.parentNode === root) root.insertBefore(this.canvas, scrim)
          else root.appendChild(this.canvas)
        }
        this.resize()
        if (!Object.keys(this.sprites).length) this.buildSprites()
        this.reset()
        this.last = 0
        if (this.ctx) this.raf = requestAnimationFrame((ts) => this.tick(ts))
      },
      refresh() {
        if (!this.on) return
        this.buildSprites()
        this.reset()
      },
      tick(ts) {
        if (!this.on) return
        this.raf = requestAnimationFrame((next) => this.tick(next))
        const cap = Number(bus.state.fps) === 30 ? 1000 / 30 : 0
        if (cap && this.last && ts - this.last < cap - 1) return
        const dt = this.last ? Math.min(48, ts - this.last) : 16
        this.last = ts
        this.draw(dt)
      },
      draw(dt) {
        const g = this.ctx
        if (!g) return
        const fx = bus.state.fx
        const w = this.w || 360
        const hgt = this.h || 640
        g.clearRect(0, 0, w, hgt)
        if (fx === 'none') return
        const speed = Number(bus.state.fxSpeed) || 1
        const glow = (Number(bus.state.fxGlow) || 0) / 100
        const k = dt / 16.67
        for (const p of this.items) {
          p.phase += 0.02 * k
          if (fx === 'bubble') {
            p.y -= (0.5 + p.v * 0.8) * speed * k
            p.x += Math.sin(p.phase) * 0.35 * k
            if (p.y < -40) { Object.assign(p, this.spawn(false)); p.y = hgt + 20 }
          } else if (fx === 'firefly') {
            p.y -= 0.18 * p.v * speed * k
            p.x += Math.sin(p.phase) * 0.8 * k
            if (p.y < -40) Object.assign(p, this.spawn(false))
          } else if (fx === 'summer') {
            // 夏＝雨：每滴落速、风偏、摆动都不同，别像一排直线
            p.y += (1.6 + p.v * 2.6) * speed * k
            p.x += (0.25 + p.sway * 0.45) * k + Math.sin(p.phase * (0.8 + p.r)) * 0.5 * k
            if (p.y > hgt + 30) {
              Object.assign(p, this.spawn(false))
              p.y = -30 - Math.random() * 60
              p.x = Math.random() * w - 40
            }
            if (p.x > w + 40) p.x = -40
          } else if (fx === 'autumn') {
            p.y += (0.8 + p.v * 1.3) * speed * k
            p.x += Math.sin(p.phase) * p.sway * 1.3 * k
            p.rot += p.spin * 0.045 * k
            if (p.y > hgt + 40) { Object.assign(p, this.spawn(false)); p.y = -20; p.x = Math.random() * w }
          } else if (fx === 'winter') {
            p.y += (0.18 + p.v * 0.30) * speed * k
            p.x += Math.sin(p.phase * 0.6) * p.sway * 0.55 * k
            p.rot += p.spin * 0.012 * k
            if (p.y > hgt + 30) { Object.assign(p, this.spawn(false)); p.y = -20; p.x = Math.random() * w }
          } else if (fx === 'star') {
            p.y += 0.12 * p.v * speed * k
            p.x += Math.cos(p.phase * 0.7) * 0.25 * k
            if (p.y > hgt + 30) Object.assign(p, this.spawn(false))
          } else {
            p.y += (0.7 + p.v * 1.1) * speed * k
            p.x += Math.sin(p.phase) * p.sway * k
            p.rot += p.spin * 0.02 * k
            if (p.y > hgt + 40) { Object.assign(p, this.spawn(false)); p.y = -20; p.x = Math.random() * w }
            if (p.x < -30) p.x = w + 20
            if (p.x > w + 30) p.x = -20
          }
          if (fx === 'summer') {
            // 雨：直接画细线段，别用缩放精灵（那样会糊成一条脏带）
            const len = (14 + p.v * 12) * (0.7 + glow * 0.6)
            const slant = len * (0.16 + p.sway * 0.10)
            g.globalAlpha = Math.min(0.85, 0.28 + p.a * 0.45) * (0.7 + glow * 0.3)
            g.strokeStyle = 'rgba(196,224,255,1)'
            g.lineWidth = 0.9
            g.lineCap = 'round'
            g.beginPath()
            g.moveTo(p.x, p.y)
            g.lineTo(p.x - slant, p.y - len)
            g.stroke()
            // 尾巴一小段更淡，像速度拖影
            g.globalAlpha *= 0.35
            g.beginPath()
            g.moveTo(p.x, p.y)
            g.lineTo(p.x - slant * 0.4, p.y - len * 0.45)
            g.stroke()
            continue
          }
          const sp = this.sprites
          let img = sp.petal
          let size = 22
          if (fx === 'sakura') { img = p.r > 1.1 ? sp.petal : sp.petal2; size = p.r > 1.1 ? 22 : 16 }
          else if (fx === 'spring') { img = p.r > 1.1 ? sp.springA : sp.springB; size = p.r > 1.1 ? 24 : 17 }
          else if (fx === 'summer') { const big = p.r > 1.15; img = big ? sp.rainA : sp.rainB; size = (big ? 52 : 38) * (0.75 + p.sway * 0.35) }
          else if (fx === 'autumn') {
            if (!sp.autumnA) this.ensureLeafSprites()
            const pick = [sp.autumnA, sp.autumnB, sp.autumnC, sp.autumnD][Math.floor(p.r * 3.999) % 4]
            img = pick
            size = 26 + p.r * 10
          }
          else if (fx === 'winter') { img = p.a > 0.82 && p.r > 1.3 ? sp.winterEmber : sp.winterSnow; size = p.r > 1.3 ? 12 : 18 }
          else if (fx === 'firefly') { img = p.r > 1.05 ? sp.glow : sp.gold; size = p.r > 1.05 ? 30 : 24 }
          else if (fx === 'bubble') { img = sp.bubble; size = 26 }
          else if (fx === 'star') { img = sp.star; size = 18 }
          g.globalAlpha = Math.min(1, p.a * (0.55 + glow * 0.45))
          if (fx === 'firefly' || fx === 'star') {
            g.globalAlpha *= 0.45 + 0.55 * Math.abs(Math.sin(p.phase * 1.6))
          }
          if (fx === 'sakura' || fx === 'spring' || fx === 'autumn' || fx === 'winter') {
            g.save()
            g.translate(p.x, p.y)
            g.rotate(p.rot)
            if (fx === 'autumn') {
              // 枫叶翻面：横向按 cos 收窄，飘起来才有"叶子在打旋"的感觉
              const flip = Math.abs(Math.cos(p.rot * 1.9 + p.phase))
              g.scale(0.32 + 0.68 * flip, 1)
            }
            g.drawImage(img, -size / 2, -size / 2, size, size)
            g.restore()
          } else {
            g.drawImage(img, p.x - size / 2, p.y - size / 2, size, size)
          }
        }
        g.globalAlpha = 1
      },
      stop() {
        this.on = false
        if (this.raf) { cancelAnimationFrame(this.raf); this.raf = 0 }
        this.items = []
        if (this.ctx && this.canvas) this.ctx.clearRect(0, 0, this.w || 0, this.h || 0)
      },
    }



    // ---------- 设备分档与省电 ----------
    const Device = {
      info: { tier: 'mid', cores: 0, mem: 0, gpu: '', battery: null, charging: null },
      probe() {
        const cores = Number(navigator.hardwareConcurrency) || 4
        const mem = Number(navigator.deviceMemory) || 0
        let tier = 'mid'
        if (cores >= 8 && (mem === 0 || mem >= 6)) tier = 'high'
        else if (cores <= 4 && mem > 0 && mem <= 4) tier = 'low'
        else if (cores <= 4 && mem === 0) tier = 'low'
        this.info.tier = tier
        this.info.cores = cores
        this.info.mem = mem
        this.info.gpu = ''
        try {
          const c = document.createElement('canvas')
          const gl = c.getContext('webgl2') || c.getContext('webgl')
          if (gl) {
            const ext = gl.getExtension('WEBGL_debug_renderer_info')
            const r = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
            this.info.gpu = String(r || '').slice(0, 48)
          }
        } catch {}
        return this.info
      },
      applyDefaults() {
        if (this.info.tier === 'high') set({ fps: 60, prCap: 2, gl3d: true, fxCount: 45, gl3dCount: 120, quality: 'balanced' })
        else if (this.info.tier === 'mid') set({ fps: 60, prCap: 2, gl3d: false, fxCount: 30, quality: 'balanced' })
        else set({ fps: 30, prCap: 2, gl3d: false, fxCount: 15, quality: 'eco' })
      },
      async watchBattery(onLow) {
        if (!navigator.getBattery) return
        try {
          const bat = await navigator.getBattery()
          const sync = () => {
            this.info.battery = Math.round(bat.level * 100)
            this.info.charging = bat.charging
            bus.listeners.forEach((fn) => fn())
            if (bus.state.powerSaver === 'auto' && !bat.charging && bat.level <= 0.2) onLow()
          }
          bat.addEventListener('levelchange', sync)
          bat.addEventListener('chargingchange', sync)
          sync()
        } catch {}
      },
    }

    // ---------- 多图轮播 ----------
    const Slideshow = {
      key: 'photoOn',
      timer: 0,
      ms: 0,
      start() {
        const ms = Math.max(4, Number(bus.state.photoInterval) || 20) * 1000
        if (this.timer && this.ms === ms) return
        this.stop()
        this.ms = ms
        if (bus.playlist.length < 2) return
        this.timer = setInterval(() => this.next(), ms)
      },
      ensureGhost() {
        if (!root) return null
        let g = document.getElementById('dshwp-ghost')
        if (!g || g.parentNode !== root) {
          g = document.createElement('div')
          g.id = 'dshwp-ghost'
          root.appendChild(g)
        }
        return g
      },
      next() {
        if (bus.playlist.length < 2 || introPlaying) return
        let idx = (bus.mediaIndex + 1) % bus.playlist.length
        let guard = 0
        while (badMedia.has(bus.playlist[idx].id) && guard++ < bus.playlist.length) {
          idx = (idx + 1) % bus.playlist.length
        }
        const item = bus.playlist[idx]
        const mode = bus.state.transition || 'fade'
        const ghost = this.ensureGhost()
        if (!ghost) return
        ghost.innerHTML = ''
        ghost.className = 't-' + mode
        let el
        if (item.kind === 'video') {
          el = document.createElement('video')
          el.muted = true; el.defaultMuted = true; el.loop = true; el.autoplay = true
          el.playsInline = true
          el.setAttribute('playsinline', '')
          el.setAttribute('muted', '')
          const pp = el.play(); if (pp && pp.catch) pp.catch(() => {})
        } else {
          el = document.createElement('img')
          el.alt = ''
        }
        el.src = item.url
        ghost.appendChild(el)
        ghost.style.opacity = '0'
        ghost.style.transform = mode === 'slide' ? 'translateX(100%)' : mode === 'zoom' ? 'scale(1.12)' : 'none'
        requestAnimationFrame(() => {
          ghost.style.opacity = '1'
          ghost.style.transform = 'none'
        })
        setTimeout(() => {
          bus.mediaIndex = idx
          bus.media = item
          renderMedia()
          ghost.innerHTML = ''
          ghost.style.opacity = '0'
          emit()
        }, 520)
      },
      stop() {
        if (this.timer) { clearInterval(this.timer); this.timer = 0 }; this.ms = 0
      },
    }

    // ---------- 扫光 ----------
    const Sweep = {
      key: 'sweep',
      el: null,
      start() {
        if (!root) return
        if (!this.el || this.el.parentNode !== root) {
          this.el = document.createElement('div')
          this.el.id = 'dshwp-sweep'
          root.appendChild(this.el)
        }
        this.el.classList.add('on')
        this.apply()
      },
      apply() {
        if (!root) return
        root.style.setProperty('--wp-sweep-dur', (Number(bus.state.sweepSpeed) || 9) + 's')
        root.style.setProperty('--wp-sweep-op', String(Math.max(0, Math.min(1, (Number(bus.state.sweepStrength) || 0) / 100))))
      },
      stop() { if (this.el) this.el.classList.remove('on') },
    }

    // ---------- 贴纸层（可拖动、位置按比例存） ----------
    const Stickers = {
      key: 'stickerOn',
      layer: null,
      items: [],
      drag: null,
      ensure() {
        if (!root) return null
        if (!this.layer || this.layer.parentNode !== root) {
          this.layer = document.createElement('div')
          this.layer.id = 'dshwp-stickers'
          root.appendChild(this.layer)
          this.items = []
        }
        return this.layer
      },
      start() {
        const layer = this.ensure()
        if (!layer) return
        layer.style.display = ''
        if (!this.items.length) this.load()
        this.applySize()
      },
      stop() { if (this.layer) this.layer.style.display = 'none' },
      applySize() {
        const size = Number(bus.state.stickerSize) || 90
        for (const it of this.items) {
          if (it.el) it.el.style.width = size + 'px'
          if (it.media) this.applyMotion(it.media)
        }
      },
      async load() {
        try {
          const db = await idb()
          const rec = await new Promise((resolve, reject) => {
            const tx = db.transaction('media', 'readonly')
            const r = tx.objectStore('media').get('stickers')
            r.onsuccess = () => resolve(r.result || null)
            r.onerror = () => reject(r.error)
          })
          if (rec && rec.list) {
            for (const item of rec.list) this.place(item.id, URL.createObjectURL(item.blob), item.x, item.y, item.kind, item.name, item.alias, item.opacity)
            return
          }
        } catch {}
        for (const item of this.readPos()) {
          if (item.url) this.place(item.id, item.url, item.x, item.y)
        }
      },
      readPos() {
        try { return JSON.parse(localStorage.getItem('dsh.live-wallpaper.stickers') || '[]') } catch { return [] }
      },
      writePos() {
        try {
          localStorage.setItem('dsh.live-wallpaper.stickers', JSON.stringify(this.items.map((i) => ({ id: i.id, x: i.x, y: i.y }))))
        } catch {}
      },
      place(id, url, x, y, kind, name, alias, opacity) {
        const layer = this.ensure()
        if (!layer) return
        const wrap = document.createElement('div')
        wrap.className = 'wp-sticker-wrap'
        wrap.dataset.id = id
        wrap.style.left = (x * 100).toFixed(2) + '%'
        wrap.style.top = (y * 100).toFixed(2) + '%'
        wrap.style.width = (Number(bus.state.stickerSize) || 90) + 'px'
        wrap.style.opacity = String(typeof opacity === 'number' ? opacity : 1)
        let media
        const isVideo = kind === 'video' || /\.(mp4|webm|mov|m4v)$/i.test(url || '')
        if (isVideo) {
          media = document.createElement('video')
          media.src = url
          media.autoplay = true
          media.loop = true
          media.muted = true
          media.defaultMuted = true
          media.playsInline = true
          media.setAttribute('playsinline', '')
          media.setAttribute('webkit-playsinline', '')
          media.setAttribute('muted', '')
          const pp = media.play()
          if (pp && pp.catch) pp.catch(() => {})
        } else {
          media = document.createElement('img')
          media.src = url
          media.alt = ''
        }
        media.className = 'wp-sticker'
        this.applyMotion(media)
        wrap.appendChild(media)
        wrap.addEventListener('pointerdown', (e) => this.beginDrag(e, wrap), { passive: false })
        layer.appendChild(wrap)
        this.items.push({ id, x, y, url, kind: isVideo ? 'video' : 'image', el: wrap, media, name: name || 'sticker', alias: alias || '', opacity: typeof opacity === 'number' ? opacity : 1 })
      },
      applyMotion(media) {
        if (!media) return
        media.classList.remove('anim-float', 'anim-sway', 'anim-pulse')
        const m = bus.state.reduceMotion ? 'none' : bus.state.stickerMotion
        if (m && m !== 'none') media.classList.add('anim-' + m)
        const dur = (Number(bus.state.stickerSpeed) || 1)
        media.style.setProperty('--wp-stk-dur', (6 / Math.max(0.2, dur)).toFixed(2) + 's')
      },
      beginDrag(e, el) {
        if (e.preventDefault) e.preventDefault()
        this.drag = { el, id: el.dataset.id }
        el.style.cursor = 'grabbing'
        const move = (ev) => {
          if (!this.drag) return
          const p = ev.touches && ev.touches[0] ? ev.touches[0] : ev
          const x = Math.max(0.03, Math.min(0.97, p.clientX / (window.innerWidth || 360)))
          const y = Math.max(0.03, Math.min(0.97, p.clientY / (window.innerHeight || 640)))
          el.style.left = (x * 100).toFixed(2) + '%'
          el.style.top = (y * 100).toFixed(2) + '%'
          const it = this.items.find((i) => i.id === this.drag.id)
          if (it) { it.x = x; it.y = y }
        }
        const end = () => {
          this.drag = null
          el.style.cursor = 'grab'
          window.removeEventListener('pointermove', move)
          window.removeEventListener('pointerup', end)
          window.removeEventListener('pointercancel', end)
          this.writePos()
        }
        window.addEventListener('pointermove', move, { passive: true })
        window.addEventListener('pointerup', end)
        window.addEventListener('pointercancel', end)
      },
      displayName(it) {
        const a = it && it.alias ? String(it.alias).trim() : ''
        return a || (it && it.name) || T('贴纸', 'sticker')
      },
      removeAt(i) {
        const it = this.items[i]
        if (!it) return
        try { URL.revokeObjectURL(it.url) } catch {}
        if (it.el) it.el.remove()
        this.items.splice(i, 1)
        this.writePos()
        this.persist()
      },
      setOpacity(i, v) {
        const it = this.items[i]
        if (!it) return
        const o = Math.max(0.1, Math.min(1, Number(v) || 1))
        it.opacity = o
        if (it.el) it.el.style.opacity = String(o)
        this.writePos()
        this.persist()
      },
      renameAt(i, alias) {
        const it = this.items[i]
        if (!it) return
        it.alias = String(alias || '').trim().slice(0, 16)
        this.writePos()
        this.persist()
      },
      async add(file) {
        if (!file) return { ok: false, error: T('没有选到文件', 'No file picked') }
        if (file.size > 30 * 1024 * 1024) return { ok: false, error: T('贴纸最大 30MB', 'Sticker up to 30MB') }
        const id = 'st_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
        const kind = await sniffKind(file)
        const url = URL.createObjectURL(file)
        const x = 0.25 + Math.random() * 0.5
        const y = 0.25 + Math.random() * 0.5
        this.place(id, url, x, y, kind, file.name, '')
        this.writePos()
        await this.persist()
        return { ok: true }
      },
      async persist() {
        try {
          const db = await idb()
          const list = this.items.map((i) => ({ id: i.id, x: i.x, y: i.y, kind: i.kind || 'image', name: i.name, alias: i.alias, opacity: i.opacity, blob: null }))
          // 只存本来就在的 blob：先从已有记录补回来
          const prev = await new Promise((resolve) => {
            const tx = db.transaction('media', 'readonly')
            const r = tx.objectStore('media').get('stickers')
            r.onsuccess = () => resolve(r.result || { list: [] })
            r.onerror = () => resolve({ list: [] })
          })
          for (const item of list) {
            const old = (prev.list || []).find((p) => p.id === item.id)
            if (old && old.blob) item.blob = old.blob
          }
          await new Promise((resolve, reject) => {
            const tx = db.transaction('media', 'readwrite')
            tx.objectStore('media').put({ list }, 'stickers')
            tx.oncomplete = resolve
            tx.onerror = () => reject(tx.error)
          })
        } catch {}
      },
      clear() {
        for (const it of this.items) { try { URL.revokeObjectURL(it.url) } catch {} if (it.el) it.el.remove() }
        this.items = []
        this.writePos()
        this.persist()
      },
    }


    // ---------- 真 3D：原生 WebGL2 前后双层粒子（视频层夹在中间） ----------
    const GL3D = {
      key: 'gl3d',
      ok: false,
      failed: '',
      canvases: [],
      gls: [],
      progs: [],
      bufs: [],
      unis: [],
      atlas: null,
      tilt: { x: 0, y: 0 },
      want: { x: 0, y: 0 },
      raf: 0,
      last: 0,
      slow: 0,
      pr: 2,
      bound: null,
      startedAt: 0,
      initOne(zIndex, kind) {
        const canvas = document.createElement('canvas')
        canvas.id = kind === 'back' ? 'dshwp-gl-back' : 'dshwp-gl-front'
        root.appendChild(canvas)
        const opts = { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, powerPreference: 'high-performance' }
        const gl = canvas.getContext('webgl2', opts) || canvas.getContext('webgl', opts)
        if (!gl) throw new Error('no webgl')
        const vs = `
          attribute vec3 aPos;
          attribute float aSize;
          attribute float aAlpha;
          attribute float aSprite;
          attribute float aSpeed;
          uniform float uFov;
          uniform float uAspect;
          uniform vec2 uTilt;
          uniform float uZ;
          uniform float uDepth;
          uniform float uTime;
          uniform float uSize;
          varying float vAlpha;
          varying float vSprite;
          void main() {
            float y = fract(aPos.y + uTime * aSpeed * 0.03);
            vec3 p = vec3(aPos.x, (y - 0.5) * 2.0, aPos.z);
            p.xy += uTilt * uDepth * (1.0 + p.z * 0.7);
            float vz = uZ + p.z;
            gl_Position = vec4((p.x * uFov / uAspect) / -vz, (p.y * uFov) / -vz, 0.0, 1.0);
            gl_PointSize = aSize * uFov / -vz * uSize;
            vAlpha = aAlpha;
            vSprite = aSprite;
          }`
        const fs = `
          precision mediump float;
          uniform sampler2D uTex;
          varying float vAlpha;
          varying float vSprite;
          void main() {
            vec2 cell = vec2(mod(vSprite, 2.0), floor(vSprite / 2.0)) * 0.5;
            vec4 c = texture2D(uTex, cell + gl_PointCoord * 0.5);
            if (c.a < 0.02) discard;
            gl_FragColor = vec4(c.rgb, c.a * vAlpha);
          }`
        const mk = (type, src) => {
          const sh = gl.createShader(type)
          gl.shaderSource(sh, src)
          gl.compileShader(sh)
          if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error('shader: ' + gl.getShaderInfoLog(sh))
          return sh
        }
        const prog = gl.createProgram()
        gl.attachShader(prog, mk(gl.VERTEX_SHADER, vs))
        gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, fs))
        gl.linkProgram(prog)
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link failed')
        gl.useProgram(prog)
        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        const n = Math.max(8, Math.floor((Number(bus.state.gl3dCount) || 120) / 2))
        const data = new Float32Array(n * 7)
        for (let i = 0; i < n; i++) {
          const o = i * 7
          data[o] = Math.random() * 2 - 1
          data[o + 1] = Math.random()
          data[o + 2] = kind === 'back' ? -(0.6 + Math.random() * 1.6) : (0.3 + Math.random() * 1.2)
          data[o + 3] = (kind === 'back' ? 2.5 : 5) + Math.random() * 3
          data[o + 4] = 0.5 + Math.random() * 0.45
          data[o + 5] = Math.floor(Math.random() * 4)
          data[o + 6] = 0.6 + Math.random() * 1.4
        }
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
        const stride = 7 * 4
        const loc = (name) => gl.getAttribLocation(prog, name)
        const bind = (name, size, offset) => {
          const l = loc(name)
          if (l < 0) return
          gl.enableVertexAttribArray(l)
          gl.vertexAttribPointer(l, size, gl.FLOAT, false, stride, offset * 4)
        }
        bind('aPos', 3, 0); bind('aSize', 1, 3); bind('aAlpha', 1, 4); bind('aSprite', 1, 5); bind('aSpeed', 1, 6)
        const U = {
          fov: gl.getUniformLocation(prog, 'uFov'),
          aspect: gl.getUniformLocation(prog, 'uAspect'),
          tilt: gl.getUniformLocation(prog, 'uTilt'),
          z: gl.getUniformLocation(prog, 'uZ'),
          depth: gl.getUniformLocation(prog, 'uDepth'),
          time: gl.getUniformLocation(prog, 'uTime'),
          size: gl.getUniformLocation(prog, 'uSize'),
        }
        gl.uniform1f(U.size, Number(bus.state.gl3dSize) || 1)
        gl.uniform1f(U.fov, 1.6)
        gl.uniform1f(U.aspect, 1)
        gl.uniform1f(U.z, kind === 'back' ? -3.6 : -1.9)
        gl.uniform1f(U.depth, kind === 'back' ? 0.22 : 0.55)
        gl.uniform1f(U.time, 0)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE) // 加色混合：明暗背景上都更醒目
        gl.clearColor(0, 0, 0, 0)
        if (this.atlas) this.bindAtlas(gl, prog)
        this.canvases.push(canvas)
        this.gls.push(gl)
        this.progs.push(prog)
        this.bufs.push(n)
        this.unis.push(U)
      },
      buildAtlas() {
        const c = document.createElement('canvas')
        c.width = 128; c.height = 128
        const g = c.getContext('2d')
        const cell = 64
        // 花瓣
        g.save(); g.translate(32, 32)
        const grad = g.createLinearGradient(0, -24, 0, 24)
        grad.addColorStop(0, '#ffd6e6'); grad.addColorStop(1, '#ff9ec4')
        g.fillStyle = grad
        g.beginPath()
        g.moveTo(0, -22); g.bezierCurveTo(20, -8, 14, 18, 0, 24)
        g.bezierCurveTo(-14, 18, -20, -8, 0, -22)
        g.fill(); g.restore()
        // 三种光点
        const dot = (x, y, color) => {
          const rg = g.createRadialGradient(x, y, 0, x, y, 28)
          rg.addColorStop(0, color); rg.addColorStop(0.4, color); rg.addColorStop(1, 'rgba(0,0,0,0)')
          g.fillStyle = rg
          g.beginPath(); g.arc(x, y, 28, 0, Math.PI * 2); g.fill()
        }
        dot(96, 32, 'rgba(180,255,220,0.95)')
        dot(32, 96, 'rgba(255,228,160,0.95)')
        dot(96, 96, 'rgba(180,230,255,0.9)')
        return c
      },
      bindAtlas(gl, prog) {
        const tex = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.atlas)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.uniform1i(gl.getUniformLocation(prog, 'uTex'), 0)
      },
      resize() {
        const w = window.innerWidth || 360
        const hgt = window.innerHeight || 640
        const dpr = Math.min(window.devicePixelRatio || 1, Number(bus.state.prCap) || 2) * (this.pr / 2)
        for (const c of this.canvases) {
          c.width = Math.max(1, Math.round(w * dpr))
          c.height = Math.max(1, Math.round(hgt * dpr))
        }
        for (let i = 0; i < this.gls.length; i++) {
          const gl = this.gls[i]
          gl.viewport(0, 0, this.canvases[i].width, this.canvases[i].height)
          gl.uniform1f(this.unis[i].aspect, (w / hgt) || 1)
        }
      },
      start() {
        if (this.ok) return
        if (!root) return
        try {
          if (!this.atlas) this.atlas = this.buildAtlas()
          this.pr = 2
          if (!this.canvases.length) { this.initOne(1, 'back'); this.initOne(3, 'front') }
          if (this.canvases.length) { this.bindAtlas(this.gls[0], this.progs[0]); this.bindAtlas(this.gls[1], this.progs[1]) }
          this.resize()
          this.ok = true
          this.failed = ''
          Particles.stop()
          this.startedAt = performance.now()
          this.bindInput()
          this.last = 0
          this.raf = requestAnimationFrame((ts) => this.tick(ts))
        } catch (e) {
          this.failed = (e && e.message) || 'webgl failed'
          this.destroy()
        }
      },
      sensors: { ori: 0, mot: 0 },
      lastInput: 0,
      scrollAcc: 0,
      bindInput() {
        if (this.bound) return
        const tilt = (x, y) => {
          this.want.x = Math.max(-1, Math.min(1, x))
          this.want.y = Math.max(-1, Math.min(1, y))
          this.lastInput = performance.now()
        }
        const onOrient = (e) => {
          this.sensors.ori++
          if (e.gamma === null && e.beta === null) return
          tilt(((e.gamma || 0)) / 45, (((e.beta || 0)) - 45) / 45)
        }
        // 没有方向传感器时，用加速度计算姿态
        const onMotion = (e) => {
          this.sensors.mot++
          const a = e.accelerationIncludingGravity
          if (!a || (a.x === null && a.y === null)) return
          const x = Number(a.x) || 0
          const y = Number(a.y) || 0
          const z = Number(a.z) || 0
          const roll = Math.atan2(x, Math.abs(z) + 0.0001) * (180 / Math.PI)
          const pitch = Math.atan2(-y, Math.sqrt(x * x + z * z)) * (180 / Math.PI)
          tilt(roll / 45, pitch / 45)
        }
        const onMove = (e) => {
          tilt((e.clientX / (window.innerWidth || 360) - 0.5) * 2, (e.clientY / (window.innerHeight || 640) - 0.5) * 2)
        }
        window.addEventListener('deviceorientation', onOrient, true)
        window.addEventListener('devicemotion', onMotion, true)
        const onTouch = (e) => {
          const p = e.touches && e.touches[0]
          if (!p) return
          tilt((p.clientX / (window.innerWidth || 360) - 0.5) * 2, (p.clientY / (window.innerHeight || 640) - 0.5) * 2)
        }
        // 滚动聊天时也带一点纵深（不依赖传感器）
        const onScroll = (e) => {
          const el = e.target
          if (!el || typeof el.scrollTop !== 'number') return
          const delta = el.scrollTop - (this.lastTop || 0)
          if (!delta) { this.lastTop = el.scrollTop; return }
          this.lastTop = el.scrollTop
          this.scrollAcc = Math.max(-0.9, Math.min(0.9, (this.scrollAcc || 0) + delta / 400))
          this.want.y = Math.max(-1, Math.min(1, this.scrollAcc))
          this.lastInput = performance.now()
        }
        window.addEventListener('mousemove', onMove, { passive: true })
        window.addEventListener('touchmove', onTouch, { passive: true })
        document.addEventListener('scroll', onScroll, { capture: true, passive: true })
        this.bound = () => {
          window.removeEventListener('deviceorientation', onOrient, true)
          window.removeEventListener('devicemotion', onMotion, true)
          window.removeEventListener('mousemove', onMove)
          window.removeEventListener('touchmove', onTouch)
          document.removeEventListener('scroll', onScroll, true)
        }
      },
      tick(ts) {
        if (!this.ok) return
        this.raf = requestAnimationFrame((next) => this.tick(next))
        if (document.hidden) return
        const dt = this.last ? ts - this.last : 16
        this.last = ts
        // 自适应：持续掉帧就降像素比，再不行退回 2D
        if (dt > 24) this.slow++; else this.slow = Math.max(0, this.slow - 1)
        if (this.slow > 90) {
          this.slow = 0
          if (this.pr > 1) { this.pr = 1; this.resize() }
          else { this.ok = false; this.stop(); bus.state.gl3d = false; emit(); return }
        }
        if (this.scrollAcc) {
          this.scrollAcc *= 0.94
          if (Math.abs(this.scrollAcc) < 0.01) this.scrollAcc = 0
          else this.want.y = this.scrollAcc
        }
        if (bus.state.autoOrbit && !bus.state.reduceMotion && performance.now() - (this.lastInput || 0) > 2500) {
          const tt = performance.now() / 1000
          this.want.x = Math.sin(tt * 0.33) * 0.65
          this.want.y = Math.cos(tt * 0.26) * 0.45
        }
        const depth = (Number(bus.state.gl3dDepth) || 0) * 1.2
        this.tilt.x += (this.want.x - this.tilt.x) * 0.08
        this.tilt.y += (this.want.y - this.tilt.y) * 0.08
        const t = (ts - this.startedAt) / 1000
        for (let i = 0; i < this.gls.length; i++) {
          const gl = this.gls[i]
          const prog = this.progs[i]
          gl.clear(gl.COLOR_BUFFER_BIT)
          gl.useProgram(prog)
          gl.uniform2f(this.unis[i].tilt, this.tilt.x * depth, this.tilt.y * depth)
          gl.uniform1f(this.unis[i].time, t)
          gl.uniform1f(this.unis[i].size, Number(bus.state.gl3dSize) || 1)
          gl.drawArrays(gl.POINTS, 0, this.bufs[i])
        }
      },
      stop() {
        if (this.raf) { cancelAnimationFrame(this.raf); this.raf = 0 }
        this.ok = false
      },
      destroy() {
        this.stop()
        if (this.bound) { this.bound(); this.bound = null }
        for (const gl of this.gls) { const ext = gl.getExtension && gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext() }
        for (const c of this.canvases) if (c.parentNode) c.parentNode.removeChild(c)
        this.canvases = []; this.gls = []; this.progs = []; this.bufs = []; this.unis = []
      },
    }


    // ---------- 帧率探针 ----------
    const Meter = {
      fps: 0,
      frames: 0,
      last: 0,
      raf: 0,
      start() {
        if (this.raf) return
        this.last = 0; this.frames = 0
        const loop = (ts) => {
          this.raf = requestAnimationFrame(loop)
          if (document.hidden) return
          this.frames++
          if (!this.last) { this.last = ts; return }
          if (ts - this.last >= 600) {
            this.fps = Math.round((this.frames * 1000) / (ts - this.last))
            this.frames = 0
            this.last = ts
            bus.fps = this.fps
            if (!this.emitAt || ts - this.emitAt > 1500) { this.emitAt = ts; bus.listeners.forEach((fn) => fn()) }
          }
        }
        this.raf = requestAnimationFrame(loop)
      },
      stop() { if (this.raf) { cancelAnimationFrame(this.raf); this.raf = 0 } },
    }

    function applyQuality(q) {
      if (q === 'eco') set({ quality: 'eco', fps: 30, prCap: 2, gl3d: false, fxCount: 20, stickerSpeed: 0.6 })
      else if (q === 'ultra') set({ quality: 'ultra', fps: 120, prCap: 3, gl3d: true, fxCount: 100, gl3dCount: 240, particles: true })
      else set({ quality: 'balanced', fps: 60, prCap: 2, gl3d: true, fxCount: 45, gl3dCount: 120, particles: true })
    }

    // 一键贴近 dsh-go 原生观感：壁纸整页铺满、正文直接压在壁纸上、
    // 只留顶部标题药丸和底部输入框是白色实心
    function applyNativeLook() {
      set({
        on: true, mode: 'backdrop', strength: 100,
        surfaceStyle: 'clear', keepPills: true, protectInput: true,
        dim: 8, bottomShade: 18, blur: 3, saturate: 72,
      })
      restoreShell()
      setTimeout(() => { clearShell(); emit() }, 80)
    }

    // ---------- 一键适配：按机型 + 当前这张图，一次把参数调到合适 ----------
    function autoTune(env, img) {
      const d = env || {
        cores: Device.info.cores, mem: Device.info.mem,
        battery: Device.info.battery, charging: Device.info.charging, tier: Device.info.tier,
      }
      const cores = Number(d.cores) || 4
      const mem = Number(d.mem) || 0
      const tier = d.tier || (cores >= 8 && (mem === 0 || mem >= 6) ? 'high' : cores <= 4 ? 'low' : 'mid')
      const stats = img || AutoTheme.stats || { mean: 0.55, std: 0.2, dominant: 0.6 }
      const busy = stats.std > 0.3          // 细节太多 → 文字需要底气
      const flat = stats.std < 0.16         // 大片纯色 → 可以更透
      const darkImg = stats.dominant < 0.45
      const lowBat = d.battery !== null && d.battery !== undefined && Number(d.battery) <= 20 && !d.charging

      const patch = { on: true, mode: 'backdrop', strength: 100, autoTheme: true, keepPills: true, protectInput: true }
      if (tier === 'high') Object.assign(patch, { quality: 'balanced', fps: 90, prCap: 2, gl3d: true, gl3dCount: 160, fxCount: 60, particles: true, parallax: true })
      else if (tier === 'mid') Object.assign(patch, { quality: 'balanced', fps: 60, prCap: 2, gl3d: true, gl3dCount: 90, fxCount: 35, particles: true, parallax: true })
      else Object.assign(patch, { quality: 'eco', fps: 30, prCap: 2, gl3d: false, fxCount: 16, particles: true, parallax: false })
      if (lowBat) Object.assign(patch, { quality: 'eco', fps: 30, prCap: 2, gl3d: false, gl3dCount: 60, fxCount: 18, powerSaver: 'auto' })

      Object.assign(patch, {
        inkMode: 'auto',
        halo: busy ? 'on' : flat ? 'off' : 'auto',
        haloPower: busy ? 75 : 55,
        surfaceStyle: busy ? 'glass' : 'clear',
        veilTone: darkImg ? 'dark' : 'light',
        dim: darkImg ? 10 : busy ? 30 : 16,
        blur: busy && tier !== 'low' ? 2 : 0,
        saturate: busy ? 86 : 100,
        bottomShade: 28,
      })
      set(patch)
      restoreShell()
      setTimeout(() => { clearShell(); AutoTheme.schedule(); emit() }, 80)
      return {
        tier, lowBat, stats: { mean: +stats.mean.toFixed(2), std: +stats.std.toFixed(2), dominant: +stats.dominant.toFixed(2) },
        patch,
      }
    }

    // ---------- 自适应配色：按壁纸明暗改主题 token，卡片/文字一起变 ----------
    // 这是唯一能"统一画风"的正路：Harness 的所有面板都吃 --dsw-alias-* token，
    // 改 token 就等于一次性改掉卡片、抽屉、输入框和字色，不用逐个 DOM 去抠。
    function palette(dark, weight) {
      const w = weight || 'normal'
      const label = dark
        ? (w === 'pure' ? '#ffffff' : w === 'soft' ? 'rgba(236,241,250,.88)' : '#f3f6fb')
        : (w === 'pure' ? '#000000' : w === 'soft' ? 'rgba(30,36,46,.86)' : '#151922')
      const label2 = dark
        ? (w === 'pure' ? 'rgba(255,255,255,.86)' : 'rgba(236,241,250,.74)')
        : (w === 'pure' ? 'rgba(0,0,0,.82)' : 'rgba(21,25,34,.66)')
      return {
        '--dsw-alias-bg-base': 'transparent',
        '--dsw-alias-bg-layer-1': dark ? 'rgba(14,16,22,.62)' : 'rgba(255,255,255,.62)',
        '--dsw-alias-bg-layer-2': dark ? 'rgba(14,16,22,.42)' : 'rgba(255,255,255,.42)',
        '--dsw-alias-bg-overlay': dark ? 'rgba(14,16,22,.92)' : 'rgba(255,255,255,.94)',
        '--dsw-alias-border-l1': dark ? 'rgba(255,255,255,.16)' : 'rgba(10,14,20,.10)',
        '--dsw-alias-border-l2': dark ? 'rgba(255,255,255,.28)' : 'rgba(10,14,20,.18)',
        '--dsw-alias-label-primary': label,
        '--dsw-alias-label-secondary': label2,
        '--dsw-specific-sidebar-fill': dark ? 'rgba(14,16,22,.55)' : 'rgba(255,255,255,.55)',
      }
    }

    const AutoTheme = {
      dispose: null,
      dark: null,
      timer: 0,
      ok: false,
      stats: null,
      measure(el) {
        try {
          if (!el) return null
          if (el.tagName === 'VIDEO' && (el.readyState || 0) < 2) return null
          const cv = document.createElement('canvas')
          cv.width = 24
          cv.height = 24
          const g = cv.getContext && cv.getContext('2d')
          if (!g) return null
          g.drawImage(el, 0, 0, 24, 24)
          const d = g.getImageData(0, 0, 24, 24).data
          const n = d.length / 4
          const lum = new Float32Array(n)
          let sum = 0
          const hist = new Array(8).fill(0)
          for (let i = 0; i < n; i++) {
            const l = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255
            lum[i] = l
            sum += l
            hist[Math.min(7, Math.max(0, Math.floor(l * 8)))]++
          }
          const mean = sum / n
          let sq = 0
          for (let i = 0; i < n; i++) { const dv = lum[i] - mean; sq += dv * dv }
          // 主色（众数）比平均值靠谱：黑白线稿的平均值永远是灰的，但纸面其实是大片白
          let bestBin = 0, bestScore = -1
          for (let b = 0; b < 8; b++) {
            const score = hist[b] * 2 + (hist[b - 1] || 0) + (hist[b + 1] || 0)
            if (score > bestScore) { bestScore = score; bestBin = b }
          }
          const dominant = (bestBin + 0.5) / 8
          return { mean, std: Math.sqrt(sq / n), dominant }
        } catch { return null }
      },
      pickDark(m) {
        const mode = bus.state.inkMode || 'auto'
        if (mode === 'light') return true    // 浅色字
        if (mode === 'dark') return false    // 深色字
        // 关键：字是压在「压暗之后」的壁纸上的，判定必须按有效亮度算。
        // 白纸黑线的线稿压暗后其实是深色背景，只按原图会误判成"亮底"→深色字→看不清。
        const dim = Math.max(0, Math.min(0.9, (Number(bus.state.dim) || 0) / 100))
        const eff = m.dominant * (1 - dim)
        return eff < 0.55   // 压暗后偏灰就得用浅色字，否则深字糊在灰底上
      },
      apply(dark) {
        if (!ctxRef || !ctxRef.theme || typeof ctxRef.theme.overrideTokens !== 'function') { this.ok = false; return false }
        const p = palette(!!dark, bus.state.inkWeight)
        const tokens = {}
        for (const k of Object.keys(p)) tokens[k] = { light: p[k], dark: p[k] }
        this.dispose = ctxRef.theme.overrideTokens('live-wallpaper', tokens)
        this.dark = !!dark
        this.ok = true
        return true
      },
      clear() {
        if (this.dispose) { try { this.dispose() } catch {} this.dispose = null }
        this.dark = null
      },
      refresh() {
        const s = bus.state
        if (!s.autoTheme || !s.on || s.mode !== 'backdrop') { this.clear(); applyHalo(false); return }
        const el = root && root.querySelector ? root.querySelector('.wp-media > img, .wp-media > video') : null
        const m = this.measure(el)
        if (!m) return
        this.std = m.std
        this.stats = m
        const dark = this.pickDark(m)
        if (this.dark !== dark || !this.dispose) { this.apply(dark); emit() }
        const needByMode = s.halo !== 'auto' && s.halo !== 'off'
        const want = needByMode ? true : (s.halo === 'off' ? false : m.std > 0.24)
        applyHalo(want, dark)
      },
      schedule() {
        if (this.timer) clearTimeout(this.timer)
        this.timer = setTimeout(() => { this.timer = 0; this.refresh() }, 500)
      },
      stop() {
        if (this.timer) { clearTimeout(this.timer); this.timer = 0 }
        this.clear()
        applyHalo(false)
      },
    }

    // 文字描边：text-shadow 会继承，所以挂在 body 上就能一次罩住所有正文
    function haloRGB(pick, dark) {
      if (pick === 'white') return '255,255,255'
      if (pick === 'black') return '0,0,0'
      if (pick === 'gray') return '128,132,140'
      if (pick === 'blue') return '64,140,255'
      if (pick === 'gold') return '255,196,80'
      return dark ? '0,0,0' : '255,255,255'
    }

    function haloShadow(dark, power, color, style) {
      const a = Math.max(0, Math.min(1, (Number(power) || 0) / 100))
      if (a <= 0) return 'none'
      const c = haloRGB(color || bus.state.haloColor || 'auto', dark)
      const mode = style || bus.state.halo || 'auto'
      const a1 = (0.3 + 0.62 * a).toFixed(2)
      const a2 = (0.2 + 0.55 * a).toFixed(2)
      if (mode === 'shadow') {
        // 投影式：右下偏移，像字压在纸上
        return `0 ${(1 + a * 2).toFixed(1)}px ${(1 + a * 3).toFixed(1)}px rgba(${c},${a2}), 0 ${(0.5 + a).toFixed(1)}px ${(0.5 + a).toFixed(1)}px rgba(${c},${a1})`
      }
      if (mode === 'glow') {
        // 柔光：更散、更淡，适合浅色字压在花色图上
        return `0 0 ${(6 + a * 14).toFixed(1)}px rgba(${c},${(0.18 + 0.35 * a).toFixed(2)}), 0 0 ${(2 + a * 6).toFixed(1)}px rgba(${c},${(0.12 + 0.3 * a).toFixed(2)})`
      }
      if (mode === 'strong') {
        // 强描边：四向偏移，黑白线稿最扛噪
        const o = (1 + a * 1.6).toFixed(1)
        return `${o}px 0 0 rgba(${c},${a1}), -${o}px 0 0 rgba(${c},${a1}), 0 ${o}px 0 rgba(${c},${a1}), 0 -${o}px 0 rgba(${c},${a1}), 0 0 ${(2 + a * 3).toFixed(1)}px rgba(${c},${a2})`
      }
      return `0 0 ${(1 + a * 2).toFixed(1)}px rgba(${c},${a1}), 0 ${(1 + a).toFixed(1)}px ${(2 + a * 5).toFixed(1)}px rgba(${c},${a2})`
    }
    function applyHalo(on, dark) {
      const de = document.documentElement
      if (!de) return
      if (!on) { de.classList.remove('dshwp-halo'); de.style.removeProperty('--wp-halo'); return }
      const tone = dark === undefined ? AutoTheme.dark : dark
      de.style.setProperty('--wp-halo', haloShadow(!!tone, bus.state.haloPower, bus.state.haloColor, bus.state.halo))
      de.classList.add('dshwp-halo')
    }


    // ---------- 时段壁纸：任意时段 + 平滑淡入淡出 ----------
    function ensureGhostLayer() {
      if (!root) return null
      let g = document.getElementById('dshwp-ghost')
      if (!g || g.parentNode !== root) {
        g = document.createElement('div')
        g.id = 'dshwp-ghost'
        root.appendChild(g)
      }
      return g
    }

    const badMedia = new Set()

    function crossTo(item, seconds) {
      const idx = bus.playlist.findIndex((p) => p.id === item.id)
      if (idx < 0) return
      const secs = Math.max(0, Math.min(300, Number(seconds) || 0))
      if (secs === 0) { switchTo(idx); return }
      const ghost = ensureGhostLayer()
      if (!ghost) { switchTo(idx); return }
      ghost.innerHTML = ''
      ghost.style.transition = 'opacity ' + secs + 's linear'
      let el
      if (item.kind === 'video') {
        el = document.createElement('video')
        el.muted = true; el.defaultMuted = true; el.loop = true; el.autoplay = true
        el.playsInline = true
        el.setAttribute('playsinline', ''); el.setAttribute('muted', '')
        const pp = el.play(); if (pp && pp.catch) pp.catch(() => {})
      } else {
        el = document.createElement('img')
        el.alt = ''
      }
      el.src = item.url
      // 时段素材解不开就别切过去：留在当前壁纸上，别把桌面刷成黑屏
      let aborted = false
      el.onerror = () => {
        aborted = true
        badMedia.add(item.id)
        console.warn('[live-wallpaper] 时段素材加载失败，保留当前壁纸：', displayName(item))
        ghost.innerHTML = ''
        ghost.style.opacity = '0'
      }
      ghost.appendChild(el)
      ghost.style.opacity = '0'
      requestAnimationFrame(() => { ghost.style.opacity = '1' })
      setTimeout(() => {
        if (aborted || badMedia.has(item.id)) return
        switchTo(idx)
        ghost.innerHTML = ''
        ghost.style.opacity = '0'
      }, secs * 1000 + 120)
    }

    function hhmm(min) {
      const m = ((Math.round(min) % 1440) + 1440) % 1440
      const h = Math.floor(m / 60)
      return String(h).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0')
    }
    function parseHHMM(v) {
      const m = String(v || '').match(/^(\d{1,2}):(\d{2})$/)
      if (!m) return null
      const h = Number(m[1]), mm = Number(m[2])
      if (h > 23 || mm > 59) return null
      return h * 60 + mm
    }
    function normSlot(sl) {
      const start = Number(sl.start) || 0
      let end = Number(sl.end) || 0
      if (end <= start) end += 1440
      return [start, end]
    }
    function intervalsOverlap(a, b) {
      const [as, ae] = a
      const [bs, be] = b
      for (const shift of [-1440, 0, 1440]) {
        const s2 = bs + shift, e2 = be + shift
        if (as < e2 && s2 < ae) return true
      }
      return false
    }
    function slotsValid(slots) {
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          if (intervalsOverlap(normSlot(slots[i]), normSlot(slots[j]))) return false
        }
      }
      return true
    }

    const Slots = {
      key: 'slotsOn',
      timer: 0,
      current: '',
      minutesNow() { const d = new Date(); return d.getHours() * 60 + d.getMinutes() },
      resolve(m) {
        const list = (bus.state.slots || []).slice()
        for (const sl of list) {
          const [s0, e0] = normSlot(sl)
          const mm = m < s0 && e0 > 1440 ? m + 1440 : m
          if (mm >= s0 && mm < e0) return sl
        }
        return null
      },
      apply() {
        const sl = this.resolve(this.minutesNow())
        if (!sl) return
        const item = bus.playlist.find((p) => p.id === sl.itemId)
        if (!item) return
        if (this.current === sl.id) return
        const first = !this.current
        this.current = sl.id
        crossTo(item, first ? 0 : (Number(bus.state.slotFade) || 18))
      },
      start() {
        this.apply()
        if (!this.timer) this.timer = setInterval(() => this.apply(), 5000)
      },
      stop() {
        if (this.timer) { clearInterval(this.timer); this.timer = 0 }
        this.current = ''
      },
    }

    const EFFECTS = [FocusMode, Parallax, AudioPulse, Particles, Sweep, Stickers, Slideshow, GL3D, Slots]
    function syncEffects() {
      for (const fx of EFFECTS) {
        let wanted = bus.state.on && bus.state[fx.key] &&
          (fx.key !== 'particles' || bus.state.fx !== 'none')
        if (fx.key === 'photoOn' && bus.state.slotsOn) wanted = false
        if (bus.state.reduceMotion && (fx.key === 'particles' || fx.key === 'sweep')) wanted = false
        if (bus.holdRender && (fx.key === 'particles' || fx.key === 'sweep' || fx.key === 'gl3d')) wanted = false
        if (wanted) fx.start()
        else fx.stop()
      }
    }
    function stopEffects() { for (const fx of EFFECTS) fx.stop() }

    // ---------- 媒体 ----------
    function detachMedia() {
      if (mediaBox) mediaBox.innerHTML = ''
      currentSrc = ''
    }

    async function sniffKind(file) {
      const name = String(file.name || '').toLowerCase()
      const type = String(file.type || '').toLowerCase()
      if (type.indexOf('video/') === 0 || /\.(mp4|webm|mov|m4v|mkv)$/.test(name)) return 'video'
      if (type === 'image/gif' || /\.gif$/.test(name)) return 'gif'
      try {
        const head = new Uint8Array(await file.slice(0, 16).arrayBuffer())
        const sig = String.fromCharCode.apply(null, Array.from(head))
        if (sig.indexOf('GIF8') === 0) return 'gif'
        if (sig.slice(4, 8) === 'ftyp') return 'video'
        if (head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) return 'video'
      } catch {}
      return 'image'
    }

    // ---- 内置壁纸预设：全部程序生成，不需要上传、不涉及任何第三方素材 ----
    const PRESET_W = 1080
    const PRESET_H = 2400
    const PRESETS = [
      { id: 'aurora', cn: '极光星夜', en: 'Aurora night' },
      { id: 'neon', cn: '霓虹夜', en: 'Neon night' },
      { id: 'autumn', cn: '秋色渐变', en: 'Autumn glow' },
    ]
    function presetName(id) {
      const p = PRESETS.filter((x) => x.id === id)[0]
      return p ? T(p.cn, p.en) : id
    }
    function presetRnd(seed) {
      let s = seed >>> 0 || 1
      return () => {
        s ^= s << 13; s >>>= 0
        s ^= s >> 17
        s ^= s << 5; s >>>= 0
        return s / 4294967296
      }
    }
    function presetCanvas(id) {
      let cv
      try {
        cv = document.createElement('canvas')
        cv.width = PRESET_W
        cv.height = PRESET_H
      } catch (e) { return null }
      const g = cv.getContext && cv.getContext('2d')
      if (!g) return null
      const rnd = presetRnd(id === 'aurora' ? 20261119 : id === 'neon' ? 77031 : 51207)
      if (id === 'neon') drawNeonPreset(g, rnd)
      else if (id === 'autumn') drawAutumnPreset(g, rnd)
      else drawAuroraPreset(g, rnd)
      return cv
    }
    // 五裂叶剪影，给秋色渐变当飘落叶片（和粒子里的枫叶同一套意象）
    function presetLeaf(g, x, y, r, rot, fill) {
      g.save()
      g.translate(x, y)
      g.rotate(rot)
      g.beginPath()
      g.moveTo(0, r)
      g.quadraticCurveTo(r * 0.30, r * 0.42, r * 0.62, r * 0.30)
      g.quadraticCurveTo(r * 0.50, r * 0.06, r * 0.95, r * 0.10)
      g.quadraticCurveTo(r * 0.80, -r * 0.16, r * 1.00, -r * 0.30)
      g.quadraticCurveTo(r * 0.62, -r * 0.30, r * 0.40, -r * 0.52)
      g.quadraticCurveTo(r * 0.34, -r * 0.28, r * 0.10, -r * 0.72)
      g.quadraticCurveTo(0, -r * 0.42, -r * 0.10, -r * 0.72)
      g.quadraticCurveTo(-r * 0.34, -r * 0.28, -r * 0.40, -r * 0.52)
      g.quadraticCurveTo(-r * 0.62, -r * 0.30, -r * 1.00, -r * 0.30)
      g.quadraticCurveTo(-r * 0.80, -r * 0.16, -r * 0.95, r * 0.10)
      g.quadraticCurveTo(-r * 0.50, r * 0.06, -r * 0.62, r * 0.30)
      g.quadraticCurveTo(-r * 0.30, r * 0.42, 0, r)
      g.fillStyle = fill
      g.fill()
      g.restore()
    }
    function presetBlur(g, px) {
      try { g.filter = 'blur(' + px + 'px)' } catch (e) {}
      return () => { try { g.filter = 'none' } catch (e) {} }
    }
    function drawAuroraPreset(g, rnd) {
      const W = PRESET_W, H = PRESET_H
      const sky = g.createLinearGradient(W * 0.1, 0, W * 0.9, H)
      sky.addColorStop(0, '#040a1c')
      sky.addColorStop(0.42, '#0a1a3f')
      sky.addColorStop(0.74, '#071226')
      sky.addColorStop(1, '#02070f')
      g.fillStyle = sky
      g.fillRect(0, 0, W, H)
      for (let i = 0; i < 340; i++) {
        const x = rnd() * W, y = rnd() * H * 0.9, r = 0.5 + rnd() * 1.7
        g.globalAlpha = 0.12 + rnd() * 0.7
        g.fillStyle = rnd() > 0.86 ? '#cfe6ff' : '#eaf4ff'
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill()
      }
      g.globalAlpha = 1
      const resetBlur = presetBlur(g, 34)
      g.globalCompositeOperation = 'lighter'
      const bands = [
        { base: 0.19, amp: 0.05, h: 0.15, c: ['rgba(60,240,190,0)', 'rgba(70,252,205,.78)', 'rgba(70,150,255,.5)', 'rgba(150,90,255,0)'] },
        { base: 0.26, amp: 0.06, h: 0.045, c: ['rgba(160,255,240,0)', 'rgba(170,255,235,.85)', 'rgba(90,255,215,.3)', 'rgba(90,255,215,0)'] },
        { base: 0.33, amp: 0.07, h: 0.20, c: ['rgba(90,200,255,0)', 'rgba(80,255,220,.5)', 'rgba(120,90,255,.55)', 'rgba(60,20,120,0)'] },
        { base: 0.47, amp: 0.04, h: 0.11, c: ['rgba(120,255,200,0)', 'rgba(90,255,180,.38)', 'rgba(40,120,255,.26)', 'rgba(0,0,0,0)'] },
      ]
      for (let b = 0; b < bands.length; b++) {
        const bd = bands[b]
        const grd = g.createLinearGradient(0, H * (bd.base - bd.amp), 0, H * (bd.base + bd.h))
        for (let i = 0; i < bd.c.length; i++) grd.addColorStop(i / (bd.c.length - 1), bd.c[i])
        const ph = rnd() * 6.28, fr = 1.6 + rnd() * 2.4
        g.beginPath()
        g.moveTo(0, H * bd.base)
        for (let x = 0; x <= W; x += 24) {
          const t = x / W
          const y = H * (bd.base + Math.sin(ph + t * Math.PI * fr) * bd.amp + Math.sin(ph * 2 + t * Math.PI * fr * 2.3) * bd.amp * 0.4)
          g.lineTo(x, y)
        }
        for (let x = W; x >= 0; x -= 24) {
          const t = x / W
          const y = H * (bd.base + bd.h * 0.55 + Math.sin(ph + t * Math.PI * fr + 0.9) * bd.amp + Math.sin(ph * 2 + t * Math.PI * fr * 2.3) * bd.amp * 0.4)
          g.lineTo(x, y)
        }
        g.closePath()
        g.fillStyle = grd
        g.fill()
      }
      resetBlur()
      g.globalCompositeOperation = 'source-over'
      const glow = g.createLinearGradient(0, H * 0.62, 0, H)
      glow.addColorStop(0, 'rgba(10,30,60,0)')
      glow.addColorStop(1, 'rgba(4,10,22,.85)')
      g.fillStyle = glow
      g.fillRect(0, H * 0.6, W, H * 0.4)
      const vig = g.createRadialGradient(W * 0.5, H * 0.42, W * 0.25, W * 0.5, H * 0.42, H * 0.72)
      vig.addColorStop(0, 'rgba(0,0,0,0)')
      vig.addColorStop(1, 'rgba(0,0,0,.55)')
      g.fillStyle = vig
      g.fillRect(0, 0, W, H)
    }
    function drawNeonPreset(g, rnd) {
      const W = PRESET_W, H = PRESET_H
      const bg = g.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#0a0518')
      bg.addColorStop(0.5, '#1a0a36')
      bg.addColorStop(1, '#05030c')
      g.fillStyle = bg
      g.fillRect(0, 0, W, H)
      g.globalCompositeOperation = 'lighter'
      const blobs = [
        [W * 0.22, H * 0.62, W * 0.55, 'rgba(255,60,180,.32)'],
        [W * 0.80, H * 0.34, W * 0.5, 'rgba(60,200,255,.28)'],
        [W * 0.5, H * 0.15, W * 0.6, 'rgba(140,80,255,.24)'],
      ]
      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i]
        const rg = g.createRadialGradient(b[0], b[1], 0, b[0], b[1], b[2])
        rg.addColorStop(0, b[3])
        rg.addColorStop(1, 'rgba(0,0,0,0)')
        g.fillStyle = rg
        g.fillRect(0, 0, W, H)
      }
      // 地平线落日
      const horizon = H * 0.60
      const sun = g.createLinearGradient(0, horizon - H * 0.16, 0, horizon)
      sun.addColorStop(0, 'rgba(255,240,180,.85)')
      sun.addColorStop(0.5, 'rgba(255,120,90,.7)')
      sun.addColorStop(1, 'rgba(255,60,160,.15)')
      g.fillStyle = sun
      g.beginPath()
      g.arc(W * 0.5, horizon, H * 0.085, Math.PI, 0)
      g.closePath()
      g.fill()
      g.globalCompositeOperation = 'source-over'
      // 网格
      g.strokeStyle = 'rgba(110,230,255,.22)'
      g.lineWidth = 2
      for (let i = 0; i <= 18; i++) {
        const t = i / 18
        const y = horizon + Math.pow(t, 2.1) * (H - horizon) * 1.02
        g.globalAlpha = 0.10 + t * 0.5
        g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke()
      }
      for (let i = -9; i <= 9; i++) {
        g.globalAlpha = 0.30
        g.beginPath()
        g.moveTo(W * 0.5 + i * W * 0.02, horizon)
        g.lineTo(W * 0.5 + i * W * 0.30, H)
        g.stroke()
      }
      g.globalAlpha = 1
      const top = g.createLinearGradient(0, 0, 0, H)
      top.addColorStop(0, 'rgba(4,2,10,.6)')
      top.addColorStop(0.45, 'rgba(4,2,10,0)')
      g.fillStyle = top
      g.fillRect(0, 0, W, H)
    }
    function drawAutumnPreset(g, rnd) {
      const W = PRESET_W, H = PRESET_H
      const sky = g.createLinearGradient(0, 0, W * 0.35, H)
      sky.addColorStop(0, '#2a1206')
      sky.addColorStop(0.30, '#6b2a12')
      sky.addColorStop(0.56, '#b8562a')
      sky.addColorStop(0.78, '#e69a55')
      sky.addColorStop(1, '#f7cd93')
      g.fillStyle = sky
      g.fillRect(0, 0, W, H)
      g.globalCompositeOperation = 'lighter'
      const sun = g.createRadialGradient(W * 0.58, H * 0.66, 0, W * 0.58, H * 0.66, H * 0.42)
      sun.addColorStop(0, 'rgba(255,240,205,.85)')
      sun.addColorStop(0.35, 'rgba(255,190,120,.35)')
      sun.addColorStop(1, 'rgba(255,150,80,0)')
      g.fillStyle = sun
      g.fillRect(0, 0, W, H)
      g.globalCompositeOperation = 'source-over'
      const resetBlur = presetBlur(g, 26)
      for (let i = 0; i < 7; i++) {
        const y = H * (0.30 + rnd() * 0.6)
        const hgt = 30 + rnd() * 90
        const grd = g.createLinearGradient(0, y - hgt, 0, y + hgt)
        grd.addColorStop(0, 'rgba(255,220,170,0)')
        grd.addColorStop(0.5, 'rgba(255,215,160,' + (0.05 + rnd() * 0.09).toFixed(3) + ')')
        grd.addColorStop(1, 'rgba(120,50,20,0)')
        g.fillStyle = grd
        g.fillRect(0, y - hgt, W, hgt * 2)
      }
      resetBlur()
      const leaves = ['rgba(90,30,10,.28)', 'rgba(140,55,18,.24)', 'rgba(60,20,8,.22)', 'rgba(190,95,35,.20)']
      for (let i = 0; i < 26; i++) {
        presetLeaf(g, rnd() * W, rnd() * H, 26 + rnd() * 70, rnd() * 6.28, leaves[i % leaves.length])
      }
      for (let i = 0; i < 160; i++) {
        g.globalAlpha = 0.10 + rnd() * 0.45
        g.fillStyle = '#ffe4bd'
        const r = 0.6 + rnd() * 2.2
        g.beginPath(); g.arc(rnd() * W, rnd() * H, r, 0, Math.PI * 2); g.fill()
      }
      g.globalAlpha = 1
      const vig = g.createRadialGradient(W * 0.5, H * 0.55, W * 0.3, W * 0.5, H * 0.55, H * 0.75)
      vig.addColorStop(0, 'rgba(0,0,0,0)')
      vig.addColorStop(1, 'rgba(30,8,2,.55)')
      g.fillStyle = vig
      g.fillRect(0, 0, W, H)
    }
    function presetBlob(id) {
      return new Promise((resolve) => {
        const cv = presetCanvas(id)
        if (!cv) { resolve(null); return }
        const fallback = () => {
          try {
            const d = cv.toDataURL('image/jpeg', 0.92)
            const bin = atob(String(d).split(',')[1] || '')
            const arr = new Uint8Array(bin.length)
            for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
            resolve(arr.length ? new Blob([arr], { type: 'image/jpeg' }) : null)
          } catch (e) { resolve(null) }
        }
        if (typeof cv.toBlob === 'function') {
          try { cv.toBlob((b) => (b ? resolve(b) : fallback()), 'image/jpeg', 0.92) } catch (e) { fallback() }
        } else fallback()
      })
    }
    async function applyPreset(id) {
      const blob = await presetBlob(id)
      if (!blob) return { ok: false, error: T('预设生成失败', 'Preset failed') }
      let file
      try { file = new File([blob], presetName(id) + '.jpg', { type: 'image/jpeg' }) } catch (e) {
        file = blob
        file.name = presetName(id) + '.jpg'
      }
      return setLocal(file)
    }

    function buildMedia(src, kind) {
      bus.rebuilds = (bus.rebuilds || 0) + 1
      currentSrc = src
      mediaBox.dataset.kind = kind
      let retried = 0
      const builtAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
      const fallback = () => {
        if (!mediaBox) return
        // 一上来就报错 = 这个文件本身就是坏的，重试没意义；用起来一会儿才断的才值得重试
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
        const instant = (now - builtAt) < 800
        // 第一次失败先别清空元素：保持最后一帧，免得画面闪成空白（和安卓端"解码失败≠播完"同一条规矩）
        if (!instant && retried < 1) {
          retried++
          if (bus.media && bus.media.id) badMedia.add(bus.media.id)
          setTimeout(() => {
            currentSrc = ''
            if (mediaBox && bus.media) renderMedia()
          }, 500)
          return
        }
        mediaBox.innerHTML = ''
        mediaBox.classList.remove('kb')
        currentSrc = ''
        if (bus.media && bus.media.id) badMedia.add(bus.media.id)
        if (root) root.style.setProperty('--wp-ready', '0')
      }
      if (kind === 'video') {
        const v = document.createElement('video')
        v.src = src
        v.autoplay = true
        v.muted = bus.state.videoMuted
        v.loop = bus.state.videoLoop
        v.defaultMuted = true
        v.playsInline = true
        v.setAttribute('playsinline', '')
        v.setAttribute('webkit-playsinline', '')
        v.setAttribute('muted', '')
        v.setAttribute('preload', 'auto')
        v.playbackRate = bus.state.videoRate
        v.onerror = fallback
        v.onloadeddata = () => AutoTheme.schedule()
        mediaBox.appendChild(v)
        const p = v.play()
        if (p && p.catch) p.catch(() => {})
        // 有些 WebView 首次不自动播，点一下或稍后再试
        setTimeout(() => { if (v.paused) { const q = v.play(); if (q && q.catch) q.catch(() => {}) } }, 600)
        setTimeout(() => AutoTheme.schedule(), 1200)
      } else {
        const img = document.createElement('img')
        img.src = src
        img.alt = ''
        img.onerror = fallback
        img.onload = () => AutoTheme.schedule()
        mediaBox.appendChild(img)
        setTimeout(() => AutoTheme.schedule(), 800)
      }
      mediaBox.classList.toggle('kb', !!bus.state.kenBurns && !bus.state.reduceMotion)
      applyMediaFilters()
    }

    function renderMedia() {
      if (!mediaBox) return
      if (bus.media && bus.media.url === currentSrc && mediaBox.firstElementChild) {
        applyMediaFilters()
        if (root) root.style.setProperty('--wp-ready', bus.state.on && !introPlaying ? '1' : '0')
        mediaBox.classList.toggle('kb', !!bus.state.kenBurns && !bus.state.reduceMotion)
        return
      }
      detachMedia()
      mediaBox.classList.remove('kb')
      if (!bus.media) {
        if (root) root.style.setProperty('--wp-ready', '0')
        return
      }
      buildMedia(bus.media.url, bus.media.kind)
      if (root) root.style.setProperty('--wp-ready', bus.state.on && !introPlaying ? '1' : '0')
    }

    function applyMediaFilters() {
      if (!mediaBox) return
      const blur = Number(bus.state.blur) || 0
      const sat = Number(bus.state.saturate) || 100
      const f = (blur ? 'blur(' + blur + 'px) ' : '') + (sat !== 100 ? 'saturate(' + (sat / 100).toFixed(2) + ')' : '')
      const ff = f.trim()
      mediaBox.querySelectorAll('img,video').forEach((el) => { el.style.filter = ff })
      const v = mediaBox.querySelector('video')
      if (v) {
        v.muted = !!bus.state.videoMuted
        v.loop = !!bus.state.videoLoop
        const rate = Number(bus.state.videoRate) || 1
        if (v.playbackRate !== rate) { try { v.playbackRate = rate } catch {} }
        if (v.paused) { const p = v.play(); if (p && p.catch) p.catch(() => {}) }
      }
    }

    const VISUAL_KEYS = ['dim', 'blur', 'saturate', 'strength', 'mode', 'on', 'bottomShade',
      'sweep', 'sweepSpeed', 'sweepStrength', 'particles', 'fx', 'fxCount', 'fxSpeed', 'fxGlow',
      'gl3d', 'gl3dCount', 'gl3dDepth', 'fps', 'transition', 'quality',
      'stickerMotion', 'stickerSpeed', 'stickerSize', 'stickerOn',
      'focusMode', 'parallax', 'parallaxPower', 'audio', 'audioSource', 'introRandom',
      'photoOn', 'photoInterval', 'reduceMotion', 'videoRate', 'videoMuted', 'videoLoop',
      'slots', 'slotsOn', 'slotFade']
    function set(patch) {
      Object.assign(bus.state, patch)
      try { localStorage.setItem(STORE_KEY, JSON.stringify(bus.state)) } catch {}
      syncMode()
      const visualOnly = Object.keys(patch).every((k) => VISUAL_KEYS.indexOf(k) >= 0)
      if (visualOnly) applyMediaFilters()
      else renderMedia()
      if (patch.fx !== undefined || patch.fxCount !== undefined || patch.fxSpeed !== undefined || patch.fxGlow !== undefined) Particles.refresh()
      if (patch.sweepSpeed !== undefined || patch.sweepStrength !== undefined) Sweep.apply()
      if (patch.introMode === 'off') {
        introPlaying = false
        if (root && bus.media && bus.state.on) root.style.setProperty('--wp-ready', '1')
      }
      if (patch.stickerSize !== undefined) Stickers.applySize()
      if (patch.stickerMotion !== undefined || patch.stickerSpeed !== undefined) Stickers.applySize()
      if (patch.gl3dCount !== undefined) GL3D.destroy()
      if (patch.gl3dSize !== undefined && GL3D.ok) { /* 下一帧读取 */ }
      if (patch.protectInput !== undefined || patch.surfaceStyle !== undefined || patch.veilTone !== undefined) { restoreShell(); setTimeout(clearShell, 60) }
      if (patch.autoTheme !== undefined) AutoTheme.schedule()
      if (patch.inkMode !== undefined || patch.halo !== undefined || patch.haloPower !== undefined || patch.haloColor !== undefined) AutoTheme.schedule()
      if (patch.reduceMotion !== undefined) { Stickers.applySize(); applyMediaFilters() }
      if (patch.prCap !== undefined) { Particles.resize(); if (GL3D.ok) GL3D.resize() }
      syncEffects()
      emit()
    }

    async function setLocal(file) {
      if (!file) return { ok: false, error: T('没有选到文件', 'No file picked') }
      if (file.size > MAX_BYTES) return { ok: false, error: T('文件超过 100MB，换小一点的', 'Over 100MB, pick a smaller file') }
      const kind = await sniffKind(file)
      for (const it of bus.playlist) { try { URL.revokeObjectURL(it.url) } catch {} }
      const url = URL.createObjectURL(file)
      bus.playlist = [{ id: uid(), url, kind, name: file.name || kind, size: file.size, blob: file }]
      pushHistory(bus.playlist[0])
      bus.mediaIndex = 0
      bus.media = bus.playlist[0]
      try { localStorage.setItem(STORE_KEY, JSON.stringify(bus.state)) } catch {}
      syncMode()
      renderMedia()
      syncEffects()
      emit()
      scheduleShell()
      saveMedia({ blob: file, name: bus.media.name, kind, size: file.size })
      persistPlaylist()
      return { ok: true, kind }
    }

    const HISTORY_MAX = 5
    function uid() { return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }

    function pushHistory(item) {
      if (!item || !item.blob) return
      bus.history = bus.history.filter((h) => !(h.name === item.name && h.size === item.size))
      bus.history.unshift({ name: item.name, kind: item.kind, size: item.size, blob: item.blob, alias: item.alias || '' })
      bus.history = bus.history.slice(0, HISTORY_MAX)
      try {
        putRecord('history', { list: bus.history.map((h) => ({ blob: h.blob, name: h.name, kind: h.kind, size: h.size, alias: h.alias })) })
      } catch {}
    }

    function removePlaylistAt(i) {
      const it = bus.playlist[i]
      if (!it) return
      try { URL.revokeObjectURL(it.url) } catch {}
      bus.playlist.splice(i, 1)
      if (!bus.playlist.length) { bus.media = null; bus.mediaIndex = 0 }
      else { bus.mediaIndex = Math.min(bus.mediaIndex, bus.playlist.length - 1); bus.media = bus.playlist[bus.mediaIndex] }
      renderMedia()
      syncEffects()
      persistPlaylist()
      emit()
    }

    function switchTo(i) {
      if (!bus.playlist[i]) return
      bus.mediaIndex = i
      bus.media = bus.playlist[i]
      renderMedia()
      syncEffects()
      emit()
    }

    function displayName(item) {
      const a = (item && item.alias) ? String(item.alias).trim() : ''
      return a || (item && item.name) || T('未命名', 'untitled')
    }

    // ---- 启动素材（比照轮播：可切换、可改名、可单条移除）----
    function switchIntroTo(i) {
      const it = bus.introList[i]
      if (!it) return
      bus.introIndex = i
      bus.intro = it
      set({ introMode: 'media' })
      emit()
    }

    function renameIntroAt(i, alias) {
      const it = bus.introList[i]
      if (!it) return false
      it.alias = String(alias || '').trim().slice(0, 24)
      persistIntroList()
      emit()
      return true
    }

    function removeIntroAt(i) {
      const it = bus.introList[i]
      if (!it) return
      try { URL.revokeObjectURL(it.url) } catch {}
      bus.introList.splice(i, 1)
      if (!bus.introList.length) { bus.intro = null; bus.introIndex = -1 }
      else {
        bus.introIndex = Math.min(Math.max(0, bus.introIndex), bus.introList.length - 1)
        bus.intro = bus.introList[bus.introIndex]
      }
      persistIntroList()
      emit()
    }

    function renamePlaylistAt(i, alias) {
      const it = bus.playlist[i]
      if (!it) return false
      it.alias = String(alias || '').trim().slice(0, 24)
      for (const h of bus.history) {
        if (h.name === it.name && h.size === it.size) h.alias = it.alias
      }
      putRecord('history', { list: bus.history.map((x) => ({ blob: x.blob, name: x.name, kind: x.kind, size: x.size, alias: x.alias })) })
      persistPlaylist()
      emit()
      return true
    }

    function renameHistoryAt(i, alias) {
      const h = bus.history[i]
      if (!h) return false
      h.alias = String(alias || '').trim().slice(0, 24)
      putRecord('history', { list: bus.history.map((x) => ({ blob: x.blob, name: x.name, kind: x.kind, size: x.size, alias: x.alias })) })
      emit()
      return true
    }

    async function useHistory(i) {
      const h = bus.history[i]
      if (!h || !h.blob) return { ok: false, error: T('历史里没有这条', 'Not in history') }
      const url = URL.createObjectURL(h.blob)
      const item = { id: uid(), url, kind: h.kind || 'image', name: h.name || 'wallpaper', size: h.size || 0, blob: h.blob, alias: h.alias || '' }
      bus.playlist.push(item)
      switchTo(bus.playlist.length - 1)
      persistPlaylist()
      return { ok: true }
    }

    async function persistPlaylist() {
      try {
        await putRecord('playlist', { list: bus.playlist.map((i) => ({ id: i.id, blob: i.blob, name: i.name, kind: i.kind, size: i.size, alias: i.alias })) })
      } catch {}
    }

    async function addFiles(files) {
      const added = []
      for (const f of Array.from(files || [])) {
        if (!f || f.size > MAX_BYTES) continue
        const kind = await sniffKind(f)
        added.push({ id: uid(), url: URL.createObjectURL(f), kind, name: f.name || kind, size: f.size, blob: f })
      }
      if (!added.length) return { ok: false, error: T('没有可用文件，或超过 100MB', 'Nothing usable, or over 100MB') }
      bus.playlist = bus.playlist.concat(added)
      added.forEach(pushHistory)
      if (!bus.media) { bus.mediaIndex = 0; bus.media = bus.playlist[0] }
      renderMedia()
      syncEffects()
      emit()
      persistPlaylist()
      return { ok: true, count: added.length }
    }

    function setIntroFile(file) {
      if (!file) return { ok: false, error: T('没有选到文件', 'No file picked') }
      if (file.size > MAX_BYTES) return { ok: false, error: T('启动素材超过 100MB', 'Opening clip over 100MB') }
      const video = /^video\//.test(file.type || '') || /\.(mp4|webm|mov|m4v)$/i.test(file.name || '')
      const item = { id: uid(), url: URL.createObjectURL(file), kind: video ? 'video' : 'image', name: file.name || 'intro', size: file.size, blob: file, alias: '' }
      bus.introList.push(item)
      bus.introIndex = bus.introList.length - 1
      bus.intro = item
      saveIntro({ blob: file, name: item.name, kind: item.kind, size: file.size })
      persistIntroList()
      set({ introMode: 'media' })
      return { ok: true, count: bus.introList.length }
    }

    async function capturePoster(url) {
      try {
        const v = document.createElement('video')
        v.src = url
        v.muted = true
        v.defaultMuted = true
        v.playsInline = true
        v.setAttribute('playsinline', '')
        v.setAttribute('preload', 'auto')
        await new Promise((resolve, reject) => {
          v.onloadeddata = resolve
          v.onerror = reject
          setTimeout(reject, 1600)
        })
        try { v.currentTime = 0.08 } catch {}
        await new Promise((resolve) => {
          v.onseeked = resolve
          setTimeout(resolve, 700)
        })
        const c = document.createElement('canvas')
        const vw = v.videoWidth || 16
        const vh = v.videoHeight || 9
        c.width = 480
        c.height = Math.max(1, Math.round(480 * vh / vw))
        c.getContext('2d').drawImage(v, 0, 0, c.width, c.height)
        return c.toDataURL('image/jpeg', 0.72)
      } catch { return '' }
    }

    function introForNow() {
      if (!bus.state.slotsOn) return null
      const sl = Slots.resolve(Slots.minutesNow())
      if (!sl || !sl.introId) return null
      return bus.introList.find((i) => i.id === sl.introId) || null
    }

    const INTRO_LAST_KEY = 'dsh.live-wallpaper.introLast'
    function loadIntroLast() {
      try {
        const v = parseInt(localStorage.getItem(INTRO_LAST_KEY) || '-1', 10)
        return Number.isFinite(v) ? v : -1
      } catch { return -1 }
    }
    function saveIntroLast(i) {
      try { localStorage.setItem(INTRO_LAST_KEY, String(i)) } catch {}
    }

    function pickIntroClip() {
      const bySlot = introForNow()
      if (bySlot) { bus.intro = bySlot; return bySlot }
      const list = bus.introList.length ? bus.introList : (bus.intro ? [bus.intro] : [])
      if (!list.length) return null
      if (list.length === 1) { bus.intro = list[0]; bus.introIndex = 0; return list[0] }
      let idx = 0
      const order = bus.state.introOrder || (bus.state.introRandom ? 'random' : 'order')
      if (order === 'random') {
        let guard = 0
        do { idx = Math.floor(Math.random() * list.length); guard++ } while (idx === bus.introIndex && guard < 12)
      } else if (order === 'fixed') {
        idx = 0
      } else {
        idx = (bus.introIndex + 1) % list.length
      }
      bus.introIndex = idx
      bus.intro = list[idx]
      if (order === 'random') saveIntroLast(idx)
      return list[idx]
    }

    // 写库排队：连点几次上传时，后来的快照一定要最后落地，不能被先前的覆盖回去
    let introWriteChain = Promise.resolve()
    function persistIntroList() {
      const snapshot = { list: bus.introList.map((i) => ({ id: i.id, blob: i.blob, name: i.name, kind: i.kind })) }
      introWriteChain = introWriteChain.then(() => putRecord('intros', snapshot)).catch(() => {})
      return introWriteChain
    }

    async function addIntroFiles(files) {
      let n = 0
      for (const f of Array.from(files || [])) {
        if (!f || f.size > MAX_BYTES) continue
        const video = /^video\//.test(f.type || '') || /\.(mp4|webm|mov|m4v)$/i.test(f.name || '')
        bus.introList.push({ id: uid(), url: URL.createObjectURL(f), kind: video ? 'video' : 'image', name: f.name || 'intro', size: f.size, blob: f, alias: '' })
        n++
      }
      if (n) { bus.introIndex = -1; await persistIntroList(); set({ introMode: 'media' }) }
      return { ok: n > 0, count: n }
    }

    function planIntroQueue() {
      const s = bus.state
      const list = bus.introList.length ? bus.introList : (bus.intro ? [bus.intro] : [])
      if (!list.length) return []
      const bySlot = introForNow()
      if (bySlot) { bus.intro = bySlot; return [bySlot] }
      if (s.introPlay === 'one') {
        const c = pickIntroClip()
        return c ? [c] : []
      }
      // 轮播式：把全部素材排一遍；顺序按设置来，固定=永远从头，随机=换个头，顺序=接着上次
      const order = s.introOrder || 'order'
      let start = 0
      if (order === 'random') start = Math.floor(Math.random() * list.length)
      else if (order === 'order') start = list.length > 1 ? (bus.introIndex + 1) % list.length : 0
      return list.slice(start).concat(list.slice(0, start))
    }

    function playFxLayer(layer) {
      const s = bus.state
      layer.classList.add('fx-' + (s.introEffect || 'bloom'))
    }

    // 往图层里放一套素材；播完调 onEnd，出错也调 onEnd（不能卡死整段开机动画）
    function mountIntroClip(layer, clip, onEnd, onFail) {
      const s = bus.state
      layer.innerHTML = ''
      layer.classList.add('has-media')
      layer.classList.remove('ready')
      layer.style.background = ''
      let done = false
      let timer = 0
      const once = () => {
        if (done) return
        done = true
        if (timer) clearTimeout(timer)
        setTimeout(onEnd, 140)
      }
      // 解码失败 ≠ 播完：要接着试下一套，不能就此收工
      const fail = () => {
        if (done) return
        done = true
        if (timer) clearTimeout(timer)
        console.warn('[live-wallpaper] 这套启动素材播不了：', clip.name)
        if (onFail) onFail(); else once()
      }
      const cap = (ms) => { if (timer) clearTimeout(timer); timer = setTimeout(once, Math.max(600, ms)) }
      if (clip.kind === 'video') {
        const v = document.createElement('video')
        v.src = clip.url
        v.autoplay = true
        v.muted = true
        v.defaultMuted = true
        v.loop = false
        v.controls = false
        v.playsInline = true
        v.setAttribute('playsinline', '')
        v.setAttribute('webkit-playsinline', '')
        v.setAttribute('muted', '')
        v.setAttribute('preload', 'auto')
        v.setAttribute('disablepictureinpicture', '')
        v.setAttribute('controlslist', 'nodownload nofullscreen noplaybackrate')
        v.style.pointerEvents = 'none'
        const reveal = () => layer.classList.add('ready')
        v.addEventListener('loadeddata', reveal)
        v.addEventListener('playing', reveal)
        v.addEventListener('ended', once)
        v.addEventListener('loadedmetadata', () => {
          if (isFinite(v.duration) && v.duration > 0.2) cap(Math.min(v.duration * 1000 + 150, 15000))
        })
        v.onerror = fail
        layer.appendChild(v)
        capturePoster(clip.url).then((dataUrl) => {
          if (dataUrl && !done && layer.parentNode) layer.style.background = 'url(' + dataUrl + ') center/cover no-repeat'
        })
        const kick = () => { const q = v.play(); if (q && q.catch) q.catch(() => {}) }
        const p = v.play()
        if (p && p.catch) p.catch(() => {
          window.addEventListener('pointerdown', kick, { once: true, passive: true })
          window.addEventListener('touchstart', kick, { once: true, passive: true })
        })
        cap(Math.max(1500, s.introDuration))
      } else {
        const img = document.createElement('img')
        img.onerror = fail
        img.src = clip.url
        img.alt = ''
        layer.appendChild(img)
        layer.classList.add('ready')
        cap(Math.max(1200, s.introDuration))
      }
    }

    function playIntro() {
      const s = bus.state
      const old = document.getElementById('dshwp-intro')
      if (old) old.remove()
      if (!s.on || s.introMode === 'off') { introPlaying = false; return }
      introPlaying = true
      const layer = document.createElement('div')
      layer.id = 'dshwp-intro'
      document.body.appendChild(layer)
      const finish = () => {
        if (!layer.parentNode) return
        introPlaying = false
        if (root && bus.media && bus.state.on) root.style.setProperty('--wp-ready', '1')
        renderMedia()
        layer.classList.add('hide')
        setTimeout(() => layer.remove(), 650)
      }
      const oneMode = s.introPlay !== 'all'
      let queue = s.introMode === 'media' ? planIntroQueue() : []
      if (!queue.length) { playFxLayer(layer); setTimeout(finish, Math.max(800, s.introDuration)); return }
      if (oneMode) {
        // 「每次播一套」：只播一套；但把它后面的几套也排进备选，
        // 万一这类型的视频解不开，就顺延到下一套，而不是直接黑屏收工。
        const rest = bus.introList.filter((it) => !queue.some((q) => q.id === it.id))
        for (let k = rest.length - 1; k > 0; k--) {
          const j = Math.floor(Math.random() * (k + 1))
          const tmp = rest[k]; rest[k] = rest[j]; rest[j] = tmp
        }
        queue = queue.concat(rest)
      }
      const deadline = Date.now() + 24000
      let i = 0
      let played = 0
      const step = () => {
        if (!layer.parentNode) return
        if (i >= queue.length || Date.now() > deadline) { finish(); return }
        const clip = queue[i++]
        bus.intro = clip
        bus.introLastPlayed = clip.id
        if (clip.id) bus.introIndex = Math.max(0, bus.introList.findIndex((x) => x.id === clip.id))
        const onEnd = () => { played++; if (oneMode) finish(); else step() }
        mountIntroClip(layer, clip, onEnd, step)
      }
      bus.introIndex = bus.introList.findIndex((x) => x.id === queue[0].id)
      step()
    }

    let resizeTimer = 0
    function onResize() {
      if (resizeTimer) clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => { resizeTimer = 0; scheduleShell(); diagnose() }, 300)
    }

    function mount() {
      if (document.getElementById('dshwp-root')) return
      const style = document.createElement('style')
      style.id = 'dshwp-style'
      style.textContent = CSS
      document.head.appendChild(style)

      root = document.createElement('div')
      root.id = 'dshwp-root'
      mediaBox = document.createElement('div')
      mediaBox.className = 'wp-media'
      scrim = document.createElement('div')
      scrim.id = 'dshwp-scrim'
      const shade = document.createElement('div')
      shade.id = 'dshwp-bottom'
      const vig = document.createElement('div')
      vig.id = 'dshwp-vignette'
      root.appendChild(mediaBox)
      root.appendChild(scrim)
      root.appendChild(shade)
      root.appendChild(vig)
      document.body.insertBefore(root, document.body.firstChild)

      if (!document.getElementById('dshwp-ui')) {
        const ui = document.createElement('div')
        ui.id = 'dshwp-ui'
        document.body.appendChild(ui)
      }
      window.addEventListener('resize', onResize)
      Device.probe()
      if (!hasSavedState) Device.applyDefaults()
      let lowNotified = false
      Device.watchBattery(() => {
        if (lowNotified) return
        lowNotified = true
        set({ fps: 30, prCap: 2, gl3d: false, fxCount: 20, quality: 'eco' })
        try { localStorage.setItem(STORE_KEY, JSON.stringify(bus.state)) } catch {}
      })
      syncMode()
      if (bus.state.introMode !== 'off') introPlaying = true
      renderMedia()
      syncEffects()
      startObserver()
      Meter.start()
      const waitIntro = bus.state.introMode === 'media'
      // 启动素材列表任何时候都要先读回来：只读不写，才不会让下一次上传把旧的覆盖掉
      const introsReady = getRecord('intros').then(async (listRec) => {
        let list = (listRec && listRec.list) ? listRec.list : []
        if (!list.length) {
          const one = await getRecord('intro')
          if (one && one.blob) list = [one]
        }
        bus.introList = list.filter((i) => i && i.blob).map((i) => ({
          id: i.id || uid(), url: URL.createObjectURL(i.blob), kind: i.kind || 'image',
          name: i.name || 'intro', size: i.size || 0, blob: i.blob,
        }))
        if (bus.introList.length) {
          const last = loadIntroLast()
          bus.introIndex = last >= 0 && last < bus.introList.length ? last : -1
          bus.intro = bus.introList[bus.introIndex >= 0 ? bus.introIndex : 0]
        }
        emit()
      }).catch(() => {})
      if (!waitIntro) playIntro()
      // 启动素材单独先取，取到就立刻播，不等壁纸
      else introsReady.then(() => playIntro())
      getRecord('history').then((hRec) => {
        if (hRec && hRec.list) bus.history = hRec.list.filter((h) => h && h.blob).slice(0, HISTORY_MAX).map((h) => ({
          name: h.name, kind: h.kind, size: h.size, blob: h.blob, alias: h.alias || '',
        }))
      }).catch(() => {})
      Promise.all([getRecord('playlist'), getRecord('current'), getRecord('audio'), getRecord('audioList')]).then(([plRec, rec, audioRec, audioListRec]) => {
        if (audioListRec && audioListRec.list && audioListRec.list.length) {
          const items = audioListRec.list.filter((it) => it && it.blob).map((it) => ({
            id: it.id || uid(), name: it.name || 'audio', size: (it.blob && it.blob.size) || 0, blob: it.blob, clip: null,
          }))
          if (items.length) {
            bus.audioList = items
            const idx = Math.round(Number(audioListRec.index))
            bus.audioIndex = Math.max(0, Math.min(items.length - 1, isNaN(idx) ? 0 : idx))
            syncAudioCurrent()
          }
        } else if (audioRec && audioRec.blob) {
          bus.audioList = [{ id: uid(), name: audioRec.name || 'audio', size: audioRec.blob.size || 0, blob: audioRec.blob, clip: null }]
          bus.audioIndex = 0
          syncAudioCurrent()
        }
        if (plRec && plRec.list && plRec.list.length) {
          bus.playlist = plRec.list.filter((i) => i && i.blob).map((i) => ({
            id: i.id || uid(), url: URL.createObjectURL(i.blob), kind: i.kind || 'image', name: i.name || 'wallpaper',
            size: i.size || 0, blob: i.blob, alias: i.alias || '',
          }))
          if (bus.playlist.length) { bus.mediaIndex = 0; bus.media = bus.playlist[0]; renderMedia() }
        } else if (rec && rec.blob) {
          bus.media = { url: URL.createObjectURL(rec.blob), kind: rec.kind || 'image', name: rec.name || 'saved', size: rec.size || 0, blob: rec.blob }
          bus.playlist = [bus.media]
          renderMedia()
        }
        emit()
      })
    }

    function unmount() {
      stopEffects()
      AutoTheme.stop()
      if (shellTimer) clearTimeout(shellTimer)
      restoreShell()
      window.removeEventListener('resize', onResize)
      Particles.stop()
      GL3D.destroy()
      document.getElementById('dshwp-root')?.remove()
      document.getElementById('dshwp-intro')?.remove()
      document.getElementById('dshwp-ui')?.remove()
      document.getElementById('dshwp-style')?.remove()
      document.documentElement.classList.remove('dshwp-shell')
      stopObserver()
      GL3D.destroy()
      Meter.stop()
      Sweep.el = null
      Stickers.layer = null
      Stickers.items = []
      root = null; mediaBox = null; scrim = null
    }

    // ---------- 设置界面 ----------
    function Row({ label, value, children }) {
      return h('div', { className: 'wp-row' },
        h('div', { className: 'wp-label' }, h('span', null, label), value !== undefined ? h('span', null, value) : null),
        children)
    }
    function Slider({ label, field, min, max, step, fmt }) {
      const s = bus.state
      return h(Row, { label, value: fmt ? fmt(s[field]) : s[field] },
        h('input', { type: 'range', min, max, step, value: s[field], onChange: (e) => set({ [field]: Number(e.target.value) }) }))
    }
    function Chips({ label, field, items, onPick }) {
      const s = bus.state
      return h(Row, { label },
        h('div', { className: 'wp-chips' }, items.map(([value, text]) => h('button', {
          key: String(value),
          className: 'wp-chip' + (s[field] === value ? ' on' : ''),
          onClick: () => { if (onPick) onPick(value); else set({ [field]: value }) },
        }, text))))
    }

    const KB = (n) => (n > 1024 * 1024 ? (n / 1024 / 1024).toFixed(1) + 'MB' : Math.max(1, Math.round(n / 1024)) + 'KB')
    const KIND_TEXT = (kind) => (kind === 'video' ? T('🎬 视频', '🎬 video') : kind === 'gif' ? T('🌀 GIF 动图', '🌀 GIF') : T('🖼 静态图片', '🖼 image'))

    function Settings({ onClose }) {
      const [, force] = React.useState(0)
      const [msg, setMsg] = React.useState('')
      const [ren, setRen] = React.useState(null)
      const [openSec, setOpenSec] = React.useState({})
      const sec = (id, title, def, children) => {
        const isOpen = openSec[id] === undefined ? !!def : openSec[id]
        return h('div', { className: 'wp-sec' },
          h('button', {
            className: 'wp-sec-h', type: 'button',
            onClick: () => setOpenSec((prev) => {
              const cur = prev[id] === undefined ? !!def : prev[id]
              return Object.assign({}, prev, { [id]: !cur })
            }),
          }, h('span', null, title), h('span', { className: 'wp-sec-i' }, isOpen ? '▾' : '▸')),
          isOpen ? h('div', null, children) : null)
      }
      const [diag, setDiag] = React.useState(lastDiag)
      const fileRef = React.useRef(null)
      const anyRef = React.useRef(null)
      const introRef = React.useRef(null)
      const audioRef = React.useRef(null)
      const multiRef = React.useRef(null)
      const stickerRef = React.useRef(null)
      const cfgRef = React.useRef(null)
      const [cfgText, setCfgText] = React.useState('')
      const [cfgPaste, setCfgPaste] = React.useState(false)
      const fromClip = async () => {
        const t = await readClipboard()
        if (!t) { setCfgPaste(true); say(T('读不到剪贴板，手动粘贴到下面', 'Clipboard blocked, paste below')); return }
        try { applyConfigData(JSON.parse(t)); say(T('已从剪贴板导入', 'Imported from clipboard')) }
        catch (e) { say((e && e.message) || T('导入失败', 'Import failed')) }
      }
      const applyPasted = () => {
        try { applyConfigData(JSON.parse(cfgText)); say(T('已应用粘贴的配置', 'Pasted config applied')); setCfgPaste(false); setCfgText('') }
        catch (e) { say(T('这段内容不是配置', 'This text is not a config')) }
      }
      React.useEffect(() => {
        const fn = () => force((x) => x + 1)
        bus.listeners.add(fn)
        return () => bus.listeners.delete(fn)
      }, [])
      const s = bus.state
      const say = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3600) }
      const setSlots = (slots) => set({ slots })
      const addSlot = () => {
        const slots = (bus.state.slots || []).slice()
        const last = slots[slots.length - 1]
        const start = last ? (Number(last.end) || 0) % 1440 : 0
        const item = bus.playlist.length ? bus.playlist[slots.length % bus.playlist.length] : null
        slots.push({
          id: 'sl_' + Date.now().toString(36),
          name: T('时段', 'Slot') + (slots.length + 1),
          start,
          end: (start + 180) % 1440,
          itemId: item ? item.id : '',
          introId: '',
        })
        setSlots(slots)
        say(T('已加时段，点时间可以改', 'Slot added, tap the time to edit'))
      }
      const updateSlot = (i, patch) => {
        const slots = (bus.state.slots || []).slice()
        if (!slots[i]) return
        slots[i] = Object.assign({}, slots[i], patch)
        setSlots(slots)
      }
      const removeSlot = (i) => {
        const slots = (bus.state.slots || []).slice()
        slots.splice(i, 1)
        setSlots(slots)
      }
      const pickConfig = async (e) => {
        const f = e.target.files && e.target.files[0]
        e.target.value = ''
        if (!f) return
        try {
          await importConfig(f)
          say(T('配置已导入', 'Config imported'))
        } catch (err) {
          say((err && err.message) || T('导入失败', 'Import failed'))
        }
      }
      const pickMany = async (e) => {
        const files = Array.from(e.target.files || [])
        e.target.value = ''
        if (!files.length) return
        const r = await addFiles(files)
        say(r.ok ? T('已加入轮播：', 'Added: ') + r.count + T(' 张', ' items') : r.error)
      }
      const pickSticker = async (e) => {
        const f = e.target.files && e.target.files[0]
        e.target.value = ''
        if (!f) return
        const r = await Stickers.add(f)
        say(r.ok ? T('贴纸放上了，拖它挪位置', 'Sticker placed, drag it') : r.error)
      }
      const pickAudio = async (e) => {
        const files = Array.from(e.target.files || [])
        e.target.value = ''
        if (!files.length) return
        say(T('正在解码 ', 'Decoding ') + files.length + T(' 首音频…', ' audio file(s)…'))
        const r = await addAudioFiles(files)
        say(r.ok ? T('加入了 ', 'Added ') + r.count + T(' 首，律动已开', ' file(s), pulse on') : r.error)
      }
      const pick = async (e, kind) => {
        const f = e.target.files && e.target.files[0]
        e.target.value = ''
        if (!f) return
        const r = kind === 'intro' ? setIntroFile(f) : await setLocal(f)
        if (!r.ok) { say(r.error); return }
        const k = r.kind || 'image'
        say(kind === 'intro' ? T('启动素材已加入', 'Opening clip added') : T('已换上 · ', 'Applied · ') + KIND_TEXT(k))
        setDiag(diagnose())
      }
      const pickIntro = async (e) => {
        const files = Array.from(e.target.files || [])
        e.target.value = ''
        if (!files.length) return
        const r = await addIntroFiles(files)
        say(r.ok ? T('已加入 ', 'Added ') + r.count + T(' 套启动素材', ' opening clips') : T('没有可用文件', 'Nothing usable'))
      }
      return h('div', { id: 'dshwp-card', onClick: (e) => e.stopPropagation() },
        h('div', { className: 'wp-head' },
          h('div', { className: 'wp-title' }, T('壁纸引擎', 'Wallpaper engine')),
          h('button', { className: 'wp-x', onClick: onClose, 'aria-label': T('关闭', 'Close') }, '×')),

        sec('g0', T('氛围', 'Mood'), false, [
        h('div', { className: 'wp-chips' },
          [['清爽', 'Crisp', 4, 0, 100], ['沉浸', 'Immersive', 22, 1, 105], ['夜读', 'Night read', 44, 2, 88], ['影院', 'Cinema', 60, 3, 72]].map(([cn, en, dim, blur, sat]) =>
            h('button', {
              key: cn, className: 'wp-chip',
              onClick: () => { set({ dim, blur, saturate: sat }); say(T('已套用：', 'Applied: ') + T(cn, en)) },
            }, T(cn, en)))),

        ]),
        sec('g1', T('壁纸', 'Wallpaper'), true, [
        h('div', { className: 'wp-actions' },
          h('button', { className: 'wp-btn primary', onClick: () => fileRef.current && fileRef.current.click() }, T('本地上传 GIF / 图片 / MP4', 'Upload GIF / image / MP4')),
          h('input', { ref: fileRef, type: 'file', accept: 'image/*,video/*', style: { display: 'none' }, onChange: (e) => pick(e, 'wall') }),
          h('button', { className: 'wp-btn', onClick: () => anyRef.current && anyRef.current.click() }, T('从文件管理器挑（下载 / DCIM）', 'Pick from file manager (Downloads / DCIM)')),
          h('input', { ref: anyRef, type: 'file', accept: '*/*', style: { display: 'none' }, onChange: (e) => pick(e, 'wall') })),
        h('div', { className: 'wp-actions' },
          PRESETS.map((p) => h('button', {
            key: p.id, className: 'wp-chip',
            onClick: async () => {
              say(T('正在生成 ', 'Drawing ') + presetName(p.id) + ' ...')
              const r = await applyPreset(p.id)
              if (!r || !r.ok) { say(T('预设生成失败，换一个试试', 'Preset failed, try another')); return }
              say(T('已换上 · ', 'Applied · ') + presetName(p.id))
              setDiag(diagnose())
            },
          }, T(p.cn, p.en)))),
        h('div', { className: 'wp-note' }, T('内置预设由程序当场绘制：既是原图，也不含任何第三方素材。', 'Built-in presets are drawn on the spot: original art, no third-party assets.')),
        bus.media
          ? h('div', { className: 'wp-file' },
            T('正在用 ', 'Now showing ') + (bus.mediaIndex + 1) + '/' + bus.playlist.length + ' · ' +
            KIND_TEXT(bus.media.kind) + ' ' + displayName(bus.media) +
            (bus.media.size ? ' · ' + KB(bus.media.size) : ''))
          : h('div', { className: 'wp-note' }, T('还没有壁纸：点上面的按钮传一个 GIF / 图片 / MP4，最大 100MB。', 'No wallpaper yet: upload a GIF, image or MP4 (up to 100MB).')),
        msg ? h('div', { className: 'wp-note', style: { color: '#7ee7d6' } }, msg) : null,

        ]),
        sec('g2', T('画面', 'Picture'), true, [
        h(Slider, { label: T('浓度（浮在上层时越大越明显）', 'Opacity (matters in overlay)'), field: 'strength', min: 10, max: 100, step: 1, fmt: (v) => v + '%' }),
        h(Slider, { label: T('暗化（让字更清楚）', 'Dim (keeps text readable)'), field: 'dim', min: 0, max: 80, step: 1, fmt: (v) => v + '%' }),
        h(Slider, { label: T('饱和度', 'Saturation'), field: 'saturate', min: 20, max: 140, step: 5, fmt: (v) => v + '%' }),
        h(Slider, { label: T('模糊（视频上很费 GPU）', 'Blur (costly on video)'), field: 'blur', min: 0, max: 10, step: 1, fmt: (v) => v + 'px' }),
        h(Slider, { label: T('底部压暗（让输入框浮出来）', 'Bottom shade (lifts the composer)'), field: 'bottomShade', min: 0, max: 100, step: 5, fmt: (v) => v + '%' }),
        h(Chips, { label: T('铺法', 'Placement'), field: 'mode', items: [['backdrop', T('垫在聊天后面', 'Behind chat')], ['overlay', T('浮在上层', 'Over the UI')]] }),
        h(Chips, { label: T('缓慢缩放', 'Slow zoom'), field: 'kenBurns', items: [[true, T('开', 'On')], [false, T('关', 'Off')]] }),

        ]),
        sec('g3', T('3D 粒子（WebGL）', '3D particles (WebGL)'), false, [
        h(Chips, { label: T('前后景纵深', 'Depth layers'), field: 'gl3d', items: [[true, T('开', 'On')], [false, T('关', 'Off')]] }),
        GL3D.ok ? h('div', { className: 'wp-file' }, T('运行中 · 双层 Points · 像素比 ', 'Running · 2 Points layers · PR ') + GL3D.pr.toFixed(2))
          : (GL3D.failed ? h('div', { className: 'wp-note', style: { color: '#ffb4a2' } }, T('3D 不可用：', '3D unavailable: ') + GL3D.failed) : null),
        s.gl3d ? h(Slider, { label: T('视差强度', 'Depth strength'), field: 'gl3dDepth', min: 0, max: 2, step: 0.1, fmt: (v) => v.toFixed(1) }) : null,
        s.gl3d ? h(Slider, { label: T('粒子总数', 'Particle count'), field: 'gl3dCount', min: 40, max: 400, step: 20, fmt: (v) => String(v) }) : null,
        s.gl3d ? h(Slider, { label: T('粒子大小', 'Particle size'), field: 'gl3dSize', min: 0.6, max: 3, step: 0.2, fmt: (v) => v.toFixed(1) + '×' }) : null,
        s.gl3d ? h(Chips, { label: T('无传感器时自动巡游', 'Auto orbit when no sensor'), field: 'autoOrbit', items: [[true, T('开', 'On')], [false, T('关', 'Off')]] }) : null,
        s.gl3d && GL3D.ok ? h('div', { className: 'wp-file' },
          T('倾斜读数 ', 'Tilt ') + window.__dshwp.tilt.x + ', ' + window.__dshwp.tilt.y +
          T(' · 传感器 方向', ' · sensors dir') + GL3D.sensors.ori + T(' / 运动', ' / motion') + GL3D.sensors.mot) : null,
        h('div', { className: 'wp-actions' },
          h('button', { className: 'wp-btn', onClick: () => { GL3D.destroy(); syncEffects(); say(GL3D.ok ? T('3D 已重启', '3D restarted') : T('3D 初始化失败', '3D failed')) } }, T('重启 3D', 'Restart 3D')),
          h('button', { className: 'wp-btn', onClick: async () => {
            await requestGyro(say)
            if (GL3D.bound) { GL3D.bound(); GL3D.bound = null }
            GL3D.bindInput()
            say(T('已重新监听传感器', 'Sensors re-bound'))
          } }, T('重连传感器', 'Re-bind sensors'))),
        h('div', { className: 'wp-note' }, T('两层 Points 夹住视频：后层远、慢、暗，前层近、快、亮；倾斜手机或移动鼠标即可看出前后位移差。', 'Two Points layers sandwich the video: far/slow/dim behind, near/fast/bright in front.')),

        ]),
        sec('g4', T('2D 粒子（兜底）', '2D particles (fallback)'), false, [
        h(Chips, {
          label: T('类型', 'Type'), field: 'fx',
          items: [
            ['none', T('无', 'None')], ['sakura', T('樱花', 'Sakura')], ['firefly', T('萤火', 'Fireflies')],
            ['bubble', T('气泡', 'Bubbles')], ['star', T('星尘', 'Stardust')],
            ['spring', T('春', 'Spring')],
            ['summer', T('夏', 'Summer')],
            ['autumn', T('秋', 'Autumn')],
            ['winter', T('冬', 'Winter')],
          ],
        }),
        s.fx !== 'none' ? h(Slider, { label: T('数量', 'Count'), field: 'fxCount', min: 0, max: 140, step: 5, fmt: (v) => v + ' 个' }) : null,
        s.fx !== 'none' ? h(Slider, { label: T('速度', 'Speed'), field: 'fxSpeed', min: 0.3, max: 2.5, step: 0.1, fmt: (v) => v.toFixed(1) + '×' }) : null,
        s.fx !== 'none' ? h(Slider, { label: T('发光', 'Glow'), field: 'fxGlow', min: 0, max: 100, step: 1, fmt: (v) => v + '%' }) : null,
        h(Chips, { label: T('帧率上限', 'Frame cap'), field: 'fps', items: [[30, '30'], [60, '60'], [90, '90'], [120, '120']] }),
        h(Chips, { label: T('像素比上限（清晰度）', 'Pixel ratio cap'), field: 'prCap', items: [[2, T('2.0 标准', '2.0')], [3, T('3.0 拉满', '3.0')]] }),
        h('div', { className: 'wp-note' }, T('帧率只能到屏幕刷新率；手机上 90/120 要看系统是否开放给 WebView。', 'Frame rate cannot exceed the display refresh; 90/120 depends on the system allowing it for WebView.')),
        h('div', { className: 'wp-note' }, T('粒子用预渲染精灵、单个画布绘制，默认 60 帧；切到后台自动停，不空转。', 'Pre-rendered sprites on one canvas, 60fps; stops in the background.')),
        s.reduceMotion ? h('div', { className: 'wp-note' }, T('⚠ 减少动效开着：粒子/扫光/贴纸动画都会被停掉，看起来就像"点了没反应"。', 'Reduce motion is on: particles, sweep and sticker motion are paused.')) : null,

        bus.media && bus.media.kind === 'video' ? h('div', null,
          h('h4', null, T('视频', 'Video')),
          h(Chips, { label: T('声音', 'Sound'), field: 'videoMuted', items: [[true, T('静音', 'Muted')], [false, T('有声', 'Sound')]] }),
          h(Chips, { label: T('循环', 'Loop'), field: 'videoLoop', items: [[true, T('循环', 'Loop')], [false, T('播一次', 'Once')]] }),
          h(Slider, { label: T('播放速度', 'Playback speed'), field: 'videoRate', min: 0.25, max: 2, step: 0.25, fmt: (v) => v.toFixed(2) + '×' })) : null,

        ]),
        sec('g5', T('启动动画', 'Startup animation'), false, [
        h(Chips, { label: T('方式', 'Mode'), field: 'introMode', items: [['off', T('关', 'Off')], ['effect', T('内置效果', 'Built-in')], ['media', T('我上传的素材', 'My clip')]] }),
        s.introMode === 'effect' ? h(Chips, {
          label: T('效果', 'Effect'), field: 'introEffect',
          items: [['bloom', T('光圈绽开', 'Bloom')], ['curtain', T('帘幕', 'Curtain')], ['zoom', T('推近', 'Zoom')], ['flash', T('闪光', 'Flash')]],
        }) : null,
        s.introMode === 'media' ? h('div', { className: 'wp-file' },
          T('共 ', 'Total ') + bus.introList.length + T(' 套 · 点名字切过去，✎ 改名，✕ 移除', ' · tap a name to switch, ✎ rename, ✕ remove')) : null,
        s.introMode === 'media' && bus.introLastPlayed ? h('div', { className: 'wp-file' },
          T('上次播了：', 'Last played: ') + displayName(bus.introList.find((x) => x.id === bus.introLastPlayed) || {})) : null,
        s.introMode === 'media' && introForNow() ? h('div', { className: 'wp-note' },
          T('注意：当前时段被指定了启动素材「', 'Note: current slot forces clip "') + displayName(introForNow()) +
          T('」，随机播法会失效；想随机就把时段的「无启动」选回去。', '", which overrides random playback.')) : null,
        s.introMode === 'media' && bus.introList.length ? h('div', { className: 'wp-list' }, bus.introList.map((it, i) => {
          const editing = ren && ren.kind === 'intro' && ren.index === i
          const commit = () => { renameIntroAt(i, ren ? ren.text : ''); setRen(null); say(T('名字已改', 'Renamed')) }
          return h('div', { className: 'wp-item wp-media-item' + (i === bus.introIndex ? ' on' : ''), key: it.id || i },
            editing
              ? h('input', {
                className: 'wp-rename', value: ren.text, autoFocus: true, maxLength: 24,
                onChange: (e) => setRen({ kind: 'intro', index: i, text: e.target.value }),
                onKeyDown: (e) => { if (e.key === 'Enter') commit() },
              })
              : h('button', {
                className: 'wp-item-name',
                onClick: () => { switchIntroTo(i); say(T('下一套开机播：', 'Next open plays: ') + displayName(it)) },
              }, (i === bus.introIndex ? '▶ ' : '') + (it.kind === 'video' ? T('视频 ', 'Video ') : T('图片 ', 'Image ')) + displayName(it)),
            editing
              ? h('button', { className: 'wp-item-x', onClick: commit }, '✓')
              : h('button', {
                className: 'wp-item-x', 'aria-label': T('改名', 'Rename'),
                onClick: () => setRen({ kind: 'intro', index: i, text: displayName(it) }),
              }, '✎'),
            h('button', {
              className: 'wp-item-x', 'aria-label': T('移除', 'Remove'),
              onClick: () => { removeIntroAt(i); setRen(null); say(T('已移除一套启动素材', 'Removed one clip')) },
            }, '✕'))
        })) : null,
        s.introMode === 'media' ? h(Chips, {
          label: T('播法', 'Playback'),
          field: 'introPlay',
          items: [['one', T('每次播一套（默认）', 'One clip each time')], ['all', T('依次播完所有', 'Play all in turn')]],
        }) : null,
        s.introMode === 'media' ? h(Chips, {
          label: T('每次播哪一套', 'Which clip each time'), field: 'introOrder',
          items: [['random', T('随机（不重复上一条）', 'Random (not the last one)')], ['order', T('顺序轮换', 'In order')], ['fixed', T('固定第一条', 'Always first')]],
        }) : null,
        h(Slider, { label: T('时长', 'Duration'), field: 'introDuration', min: 600, max: 6000, step: 100, fmt: (v) => (v / 1000).toFixed(1) + 's' }),
        h('div', { className: 'wp-actions' },
          h('button', { className: 'wp-btn', onClick: () => introRef.current && introRef.current.click() }, T('上传启动素材', 'Upload opening clip')),
          h('input', { ref: introRef, type: 'file', accept: 'image/*,video/*', multiple: true, style: { display: 'none' }, onChange: (e) => pickIntro(e) }),
          h('button', { className: 'wp-btn', onClick: () => playIntro() }, T('预览启动', 'Preview'))),
        h('div', { className: 'wp-actions' },
          h('button', { className: 'wp-btn', onClick: () => { bus.introList = []; bus.intro = null; persistIntroList(); emit(); say(T('启动素材已清空', 'Clips cleared')) } }, T('清空启动素材', 'Clear clips'))),

        ]),
        sec('g6', T('轮播', 'Slideshow'), false, [
        h(Chips, { label: T('多张轮播', 'Rotate photos'), field: 'photoOn', items: [[true, T('开', 'On')], [false, T('关', 'Off')]] }),
        h('div', { className: 'wp-actions' },
          h('button', { className: 'wp-btn', onClick: () => multiRef.current && multiRef.current.click() }, T('批量添加图片/视频', 'Add several')),
          h('input', { ref: multiRef, type: 'file', accept: 'image/*,video/*', multiple: true, style: { display: 'none' }, onChange: (e) => pickMany(e) })),
        h('div', { className: 'wp-file' }, T('共 ', 'Total ') + bus.playlist.length + T(' 张 · 点名字切过去，点 ✕ 移除', ' · tap a name to switch, ✕ to remove')),
        h('div', { className: 'wp-list' }, bus.playlist.map((it, i) => {
          const editing = ren && ren.kind === 'list' && ren.index === i
          const commit = () => { renamePlaylistAt(i, ren ? ren.text : ''); setRen(null); say(T('名字已改', 'Renamed')) }
          return h('div', { className: 'wp-item wp-media-item' + (i === bus.mediaIndex ? ' on' : ''), key: it.id || i },
            editing
              ? h('input', {
                className: 'wp-rename', value: ren.text, autoFocus: true, maxLength: 24,
                onChange: (e) => setRen({ kind: 'list', index: i, text: e.target.value }),
                onKeyDown: (e) => { if (e.key === 'Enter') commit() },
              })
              : h('button', {
                className: 'wp-item-name',
                onClick: () => { switchTo(i); say(T('已切到：', 'Switched to: ') + displayName(it)) },
              }, (i === bus.mediaIndex ? '▶ ' : '') + KIND_TEXT(it.kind) + ' ' + displayName(it)),
            editing
              ? h('button', { className: 'wp-item-x', onClick: commit }, '✓')
              : h('button', {
                className: 'wp-item-x', 'aria-label': T('改名', 'Rename'),
                onClick: () => setRen({ kind: 'list', index: i, text: displayName(it) }),
              }, '✎'),
            h('button', {
              className: 'wp-item-x', 'aria-label': T('移除', 'Remove'),
              onClick: () => { removePlaylistAt(i); setRen(null); say(T('已移除一张', 'Removed one')) },
            }, '✕'))
        })),
        bus.history.length ? h('div', null,
          h('div', { className: 'wp-label' }, h('span', null, T('最近用过', 'Recently used')), h('span', null, bus.history.length + '/' + HISTORY_MAX)),
          h('div', { className: 'wp-chips' }, bus.history.map((h_, i) => h('button', {
            key: 'h' + i, className: 'wp-chip',
            onClick: async () => { const r = await useHistory(i); say(r.ok ? T('已加入并切过去', 'Added and switched') : r.error) },
          }, displayName(h_))))) : null,
        s.photoOn && bus.playlist.length > 1 ? h(Slider, { label: T('间隔', 'Interval'), field: 'photoInterval', min: 3, max: 300, step: 1, fmt: (v) => v + 's' }) : null,
        s.photoOn && bus.playlist.length > 1 ? h('div', { className: 'wp-chips' },
          [10, 30, 60, 120, 300].map((v) => h('button', {
            key: 'i' + v, className: 'wp-chip' + (s.photoInterval === v ? ' on' : ''),
            onClick: () => set({ photoInterval: v }),
          }, v < 60 ? v + 's' : (v / 60) + 'min'))) : null,

        ]),
        sec('g7', T('时段壁纸', 'Time slots'), false, [
        h(Chips, { label: T('按时间自动换', 'Auto switch by time'), field: 'slotsOn', items: [[true, T('开', 'On')], [false, T('关', 'Off')]] }),
        h('div', { className: 'wp-note' }, T('每个时段挑一张壁纸、写起止时间；跨零点直接写 19:00 → 05:00。换的时候是慢慢淡过去。', 'Pick a wallpaper and a time range per slot; cross-midnight works; switches crossfade.')),
        (bus.state.slots || []).length ? h('div', { className: 'wp-list' }, (bus.state.slots || []).map((sl, i) =>
          h('div', { className: 'wp-slot', key: sl.id },
            h('input', {
              className: 'wp-rename', value: sl.name, maxLength: 12, placeholder: T('名称', 'Name'),
              onChange: (e) => updateSlot(i, { name: e.target.value }),
            }),
            h('input', {
              type: 'time', className: 'wp-time', value: hhmm(sl.start),
              onChange: (e) => { const m = parseHHMM(e.target.value); if (m !== null) updateSlot(i, { start: m }) },
            }),
            h('input', {
              type: 'time', className: 'wp-time', value: hhmm(sl.end),
              onChange: (e) => { const m = parseHHMM(e.target.value); if (m !== null) updateSlot(i, { end: m }) },
            }),
            h('select', {
              className: 'wp-select', value: sl.itemId,
              onChange: (e) => updateSlot(i, { itemId: e.target.value }),
            }, bus.playlist.map((p) => h('option', { key: p.id, value: p.id }, displayName(p)))),
            h('select', {
              className: 'wp-select', value: sl.introId || '',
              title: T('这个时段用哪套启动动画', 'Startup clip for this slot'),
              onChange: (e) => updateSlot(i, { introId: e.target.value }),
            }, [h('option', { key: '__none', value: '' }, T('无启动', 'No clip'))]
              .concat(bus.introList.map((ic) => h('option', { key: ic.id, value: ic.id }, '🎞 ' + ic.name)))),
            h('button', { className: 'wp-item-x', onClick: () => removeSlot(i), 'aria-label': T('删除时段', 'Remove') }, '✕'))))
          : h('div', { className: 'wp-note' }, T('还没有时段，点下面加一个。', 'No slots yet.')),
        h('div', { className: 'wp-actions' },
          h('button', { className: 'wp-btn primary', onClick: addSlot }, T('加一个时段', 'Add slot'))),
        !slotsValid(bus.state.slots || []) ? h('div', { className: 'wp-note', style: { color: '#ffb4a2' } }, T('时间段有重叠，重叠部分不会生效。', 'Slots overlap; overlapping time is ignored.')) : null,
        s.slotsOn ? h(Slider, { label: T('过渡时长', 'Crossfade'), field: 'slotFade', min: 3, max: 120, step: 1, fmt: (v) => v + 's' }) : null,

        ]),
        sec('g8', T('扫光', 'Light sweep'), false, [
        h(Chips, { label: T('斜向高光', 'Diagonal sheen'), field: 'sweep', items: [[true, T('开', 'On')], [false, T('关', 'Off')]] }),
        s.sweep ? h(Slider, { label: T('扫过速度', 'Sweep speed'), field: 'sweepSpeed', min: 3, max: 20, step: 1, fmt: (v) => v + 's' }) : null,
        s.sweep ? h(Slider, { label: T('亮度', 'Brightness'), field: 'sweepStrength', min: 0, max: 100, step: 5, fmt: (v) => v + '%' }) : null,

        ]),
        sec('g9', T('贴纸', 'Stickers'), false, [
        h(Chips, { label: T('显示', 'Show'), field: 'stickerOn', items: [[true, T('开', 'On')], [false, T('关', 'Off')]] }),
        h('div', { className: 'wp-actions' },
          h('button', { className: 'wp-btn primary', onClick: () => stickerRef.current && stickerRef.current.click() }, T('加一张贴纸', 'Add sticker')),
          h('input', { ref: stickerRef, type: 'file', accept: 'image/*,video/*', style: { display: 'none' }, onChange: (e) => pickSticker(e) }),
          h('button', { className: 'wp-btn', onClick: () => { Stickers.clear(); say(T('贴纸已清空', 'Stickers cleared')) } }, T('清空', 'Clear'))),
        Stickers.items.length ? h('div', { className: 'wp-list' }, Stickers.items.map((it, i) => {
          const editing = ren && ren.kind === 'stk' && ren.index === i
          const commit = () => { Stickers.renameAt(i, ren ? ren.text : ''); setRen(null); say(T('贴纸名字已改', 'Renamed')) }
          const op = Math.round(((typeof it.opacity === 'number' ? it.opacity : 1)) * 100)
          return h('div', { className: 'wp-item wp-stk-item wp-stk-col', key: it.id },
            h('div', { className: 'wp-stk-line' },
              editing
                ? h('input', {
                  className: 'wp-rename', value: ren.text, autoFocus: true, maxLength: 16,
                  onChange: (e) => setRen({ kind: 'stk', index: i, text: e.target.value }),
                  onKeyDown: (e) => { if (e.key === 'Enter') commit() },
                })
                : h('div', { className: 'wp-item-name', style: { opacity: 1 } },
                  (it.kind === 'video' ? '🎬 ' : '🖼 ') + Stickers.displayName(it) + '  ·  ' + Math.round(it.x * 100) + '%,' + Math.round(it.y * 100) + '%'),
              editing
                ? h('button', { className: 'wp-item-x', onClick: commit }, '✓')
                : h('button', {
                  className: 'wp-item-x', 'aria-label': T('改名', 'Rename'),
                  onClick: () => setRen({ kind: 'stk', index: i, text: Stickers.displayName(it) }),
                }, '✎'),
              h('button', {
                className: 'wp-item-x', 'aria-label': T('删除', 'Delete'),
                onClick: () => { Stickers.removeAt(i); setRen(null); say(T('这张贴纸已删除', 'Sticker removed')) },
              }, '✕')),
            h('div', { className: 'wp-stk-op' },
              h('span', null, T('透明', 'Alpha')),
              h('input', {
                type: 'range', min: 10, max: 100, step: 5, value: op,
                onChange: (e) => { Stickers.setOpacity(i, Number(e.target.value) / 100); force((x) => x + 1) },
              }),
              h('span', null, op + '%')))
        })) : h('div', { className: 'wp-note' }, T('还没放贴纸，点上面「加一张贴纸」。', 'No stickers yet.')),
        h(Chips, {
          label: T('贴纸动效', 'Sticker motion'), field: 'stickerMotion',
          items: [['none', T('静', 'Still')], ['float', T('漂浮', 'Float')], ['sway', T('摇摆', 'Sway')], ['pulse', T('呼吸', 'Pulse')]],
        }),
        h(Slider, { label: T('大小', 'Size'), field: 'stickerSize', min: 40, max: 220, step: 10, fmt: (v) => v + 'px' }),
        s.stickerMotion !== 'none' ? h(Slider, { label: T('动效速度', 'Motion speed'), field: 'stickerSpeed', min: 0.3, max: 3, step: 0.1, fmt: (v) => v.toFixed(1) + '×' }) : null,

        ]),
        sec('g10', T('手感 & 画质', 'Feel & quality'), false, [
        h(Chips, { label: T('换图转场', 'Transition'), field: 'transition', items: [['fade', T('淡入', 'Fade')], ['slide', T('推移', 'Slide')], ['zoom', T('推近', 'Zoom')]] }),
        h(Chips, { label: T('画质档位', 'Quality'), field: 'quality', items: [['eco', T('省电', 'Eco')], ['balanced', T('均衡', 'Balanced')], ['ultra', T('极速', 'Ultra')]], onPick: (v) => applyQuality(v) }),
        h('div', { className: 'wp-file' }, T('实时帧率 ', 'FPS ') + (bus.fps || '—') + T(' · 3D 像素比 ', ' · 3D PR ') + GL3D.pr.toFixed(2)),
        h('div', { className: 'wp-file' },
          T('设备：', 'Device: ') + Device.info.cores + T(' 核 · ', ' cores · ') +
          (Device.info.mem ? Device.info.mem + 'G' : T('内存未知', 'mem n/a')) +
          (Device.info.battery !== null ? ' · ' + T('电量 ', 'battery ') + Device.info.battery + '%' + (Device.info.charging ? T('（充电中）', ' (charging)') : '') : '') +
          ' · ' + T('档位 ', 'tier ') + Device.info.tier),
        h(Chips, { label: T('低电量自动省电（≤20%）', 'Auto power save (≤20%)'), field: 'powerSaver', items: [['auto', T('开', 'On')], ['off', T('关', 'Off')]] }),

        ]),
        sec('g11', T('交互', 'Interaction'), false, [
        h(Chips, { label: T('隐身模式（打字时壁纸几乎隐去）', 'Focus mode (hide while typing)'), field: 'focusMode', items: [[true, T('开', 'On')], [false, T('关', 'Off')]] }),
        h(Chips, { label: T('减少动效（停粒子/扫光/贴纸动画）', 'Reduce motion'), field: 'reduceMotion', items: [[false, T('关', 'Off')], [true, T('开', 'On')]] }),
        h(Chips, { label: T('打字时暂停背景渲染（更跟手）', 'Pause rendering while typing'), field: 'pauseOnType', items: [[true, T('开', 'On')], [false, T('关', 'Off')]] }),
        h(Chips, { label: T('2D 视差', 'Parallax'), field: 'parallax', items: [[true, T('开', 'On')], [false, T('关', 'Off')]] }),
        s.parallax ? h(Slider, { label: T('视差强度', 'Parallax strength'), field: 'parallaxPower', min: 0, max: 40, step: 2, fmt: (v) => v + 'px' }) : null,
        h(Chips, { label: T('音频律动', 'Audio pulse'), field: 'audioSource', items: [['mic', T('麦克风', 'Microphone')], ['file', T('音频文件（免麦克风）', 'Audio file')]] }),
        h('div', { className: 'wp-chips' },
          h('button', { className: 'wp-chip' + (s.audio ? ' on' : ''), onClick: () => set({ audio: !s.audio }) }, s.audio ? T('律动：开', 'Pulse: on') : T('律动：关', 'Pulse: off')),
          h('button', { className: 'wp-chip', onClick: () => audioRef.current && audioRef.current.click() }, T('加音频', 'Add audio')),
          h('input', { ref: audioRef, type: 'file', accept: 'audio/*', multiple: true, style: { display: 'none' }, onChange: (e) => pickAudio(e) })),
        bus.audioList.length ? h('div', { className: 'wp-file' },
          T('共 ', 'Total ') + bus.audioList.length + T(' 首 · 点名字切过去，✕ 移除，可以一次加多首', ' · tap to switch, ✕ removes, multi-select allowed')) : null,
        bus.audioList.length ? h('div', { className: 'wp-list' }, bus.audioList.map((it, i) => h('div', {
          className: 'wp-item wp-media-item' + (i === bus.audioIndex ? ' on' : ''), key: it.id || i,
        },
          h('button', {
            className: 'wp-item-name',
            onClick: () => { switchAudioTo(i); say(T('现在放：', 'Now playing: ') + it.name) },
          }, (i === bus.audioIndex ? '▶ ' : '') + T('音乐 ', 'Audio ') + it.name),
          h('button', {
            className: 'wp-item-x', 'aria-label': T('移除', 'Remove'),
            onClick: () => { removeAudioAt(i); say(T('已移除一首音频', 'Removed one audio')) },
          }, '✕')))) : h('div', { className: 'wp-note' },
          T('还没有音频：点「加音频」可以一次选多首 MP3 / WAV / M4A，列表里能切、能删。', 'No audio yet: add MP3 / WAV / M4A, switch and delete from the list.')),
        AudioPulse.pending ? h('div', { className: 'wp-note' }, T('正在申请麦克风…（系统可能弹权限）', 'Asking for the microphone…')) : null,
        s.audio ? h('div', { className: 'wp-note' }, T('电平 ', 'Level ') + Math.round(AudioPulse.level * 100) + '%') : null,
        AudioPulse.error ? h('div', { className: 'wp-note', style: { color: '#ffb4a2' } }, AudioPulse.error) : null,
        h('div', { className: 'wp-note' }, T('音频律动只在本机分析低频，不录音、不保存、不上传。', 'Low frequencies are analysed on device only; nothing is recorded or uploaded.')),

        ]),
        sec('g12', T('铺满检查', 'Full-bleed check'), false, [
        h(Chips, {
          label: T('面板画风（卡片/抽屉/弹层）', 'Panel style'), field: 'surfaceStyle',
          items: [
            ['glass', T('磨砂半透', 'Glass')], ['clear', T('全透', 'Clear')], ['keep', T('保留原色', 'Keep')],
            ['dark', T('半透暗', 'Dim glass')], ['solid', T('实色亮', 'Solid light')], ['solidDark', T('实色暗', 'Solid dark')],
          ],
        }),
        h(Chips, { label: T('自适应配色（按壁纸明暗翻字色）', 'Adaptive colors'), field: 'autoTheme', items: [[true, T('开', 'On')], [false, T('关', 'Off')]] }),
        h(Chips, { label: T('文字明暗', 'Text tone'), field: 'inkMode', items: [['auto', T('自动', 'Auto')], ['light', T('浅色字', 'Light')], ['dark', T('深色字', 'Dark')]] }),
        h(Chips, {
          label: T('文字浓淡', 'Text weight'), field: 'inkWeight',
          items: [['soft', T('柔和', 'Soft')], ['normal', T('标准', 'Normal')], ['pure', T('纯白/纯黑', 'Pure')]],
        }),
        h(Chips, {
          label: T('文字描边', 'Text halo'), field: 'halo',
          items: [
            ['auto', T('自动', 'Auto')], ['off', T('关', 'Off')], ['on', T('普通', 'Normal')],
            ['strong', T('强描边', 'Strong')], ['shadow', T('投影', 'Shadow')], ['glow', T('柔光', 'Glow')],
          ],
        }),
        s.halo !== 'off' ? h(Chips, {
          label: T('描边颜色', 'Halo color'), field: 'haloColor',
          items: [
            ['auto', T('跟随字色', 'Auto')], ['white', T('白', 'White')], ['black', T('黑', 'Black')],
            ['gray', T('灰', 'Gray')], ['blue', T('蓝', 'Blue')], ['gold', T('金', 'Gold')],
          ],
        }) : null,
        s.halo !== 'off' ? h(Slider, { label: T('描边强度', 'Halo strength'), field: 'haloPower', min: 0, max: 100, step: 5, fmt: (v) => v + '%' }) : null,
        s.autoTheme ? h('div', { className: 'wp-file' },
          AutoTheme.ok ? (AutoTheme.dark ? T('壁纸偏暗 → 用浅色字', 'Dark wallpaper → light text') : T('壁纸偏亮 → 用深色字', 'Light wallpaper → dark text'))
            : T('还没采到壁纸颜色（换张图或等一秒）', 'No wallpaper sample yet')) : null,
        (s.surfaceStyle === 'glass' || s.surfaceStyle === 'dark') ? h(Chips, {
          label: T('雾色（影响面板底色倾向）', 'Veil tone'), field: 'veilTone',
          items: [
            ['light', T('白雾', 'Light')], ['dark', T('暗雾', 'Dark')],
            ['warm', T('暖雾', 'Warm')], ['cool', T('冷雾', 'Cool')], ['gray', T('灰雾', 'Gray')],
          ],
        }) : null,
        h('div', { className: 'wp-chips', style: { marginBottom: '6px' } },
          h('button', {
            className: 'wp-chip' + (bus.state.protectInput ? ' on' : ''),
            onClick: () => set({ protectInput: !bus.state.protectInput }),
          }, T('保护输入框底色', 'Protect composer'))),
        h('div', { className: 'wp-note' },
          T('已清掉 ', 'Cleared ') + diag.cleared + T(' 层外壳底色；当前铺法下中心命中 ', ' shell layers; centre hit ') + diag.hits + '/' + diag.total +
          T('（只有「浮在上层」时这个数才有意义）。', ' (only meaningful in overlay mode).')),
        h('div', { className: 'wp-actions' },
          h('button', {
            className: 'wp-btn primary',
            onClick: () => {
              const r = autoTune()
              say(T(
                '已适配：' + r.tier + ' 档 · ' + r.patch.fps + 'fps · ' + (r.patch.surfaceStyle === 'glass' ? '磨砂面板' : '整页全透') + ' · 描边 ' + (r.patch.halo === 'off' ? '关' : r.patch.haloPower + '%'),
                'Tuned: ' + r.tier + ' · ' + r.patch.fps + 'fps',
              ))
            },
          }, T('一键适配（按机型 + 这张图）', 'Auto-tune'))),
        h('div', { className: 'wp-actions' },
          h('button', { className: 'wp-btn', onClick: () => { applyNativeLook(); say(T('已切换成原生观感：整页透 + 白色药丸', 'Native-like look applied')) } }, T('像原生一样', 'Native-like'))),
        h(Chips, { label: T('顶部药丸保持白色', 'Keep top pill solid'), field: 'keepPills', items: [[true, T('开', 'On')], [false, T('关', 'Off')]] }),
        h('div', { className: 'wp-actions' },
          h('button', { className: 'wp-btn', onClick: () => { restoreShell(); setTimeout(() => { clearShell(); setDiag(diagnose()) }, 80); say(T('已按当前页面重新铺满', 'Re-applied full bleed')) } }, T('重新铺满', 'Re-apply')),
          h('button', { className: 'wp-btn', onClick: () => { set({ ...DEFAULTS }); say(T('已恢复默认', 'Defaults restored')) } }, T('恢复默认', 'Reset'))),
        h('div', { className: 'wp-actions' },
          h('button', { className: 'wp-btn', onClick: () => { setDiag(diagnose()); say(T('诊断已刷新', 'Diagnosis refreshed')) } }, T('刷新诊断', 'Refresh check')),
          h('button', { className: 'wp-btn', onClick: () => set({ on: !s.on }) }, s.on ? T('暂时关闭', 'Turn off') : T('打开壁纸', 'Turn on'))),
        h('div', { className: 'wp-note' }, T('设置与素材都只存在这台设备（IndexedDB），不上传任何服务器。', 'Settings and uploads stay on this device.')),
        ]),
        sec('g13', T('配置备份', 'Config backup'), false, [
        h('div', { className: 'wp-actions' },
          h('button', { className: 'wp-btn primary', onClick: () => {
            exportConfig()
            say(T('已下载，并复制到剪贴板', 'Downloaded and copied to clipboard'))
          } }, T('导出（下载 + 复制）', 'Export')),
          h('button', { className: 'wp-btn', onClick: fromClip }, T('从剪贴板导入', 'From clipboard'))),
        h('div', { className: 'wp-actions' },
          h('button', { className: 'wp-btn', onClick: () => cfgRef.current && cfgRef.current.click() }, T('从文件导入', 'From file')),
          h('input', { ref: cfgRef, type: 'file', accept: 'application/json,.json', style: { display: 'none' }, onChange: (e) => pickConfig(e) })),
        h('div', { className: 'wp-actions' },
          h('button', { className: 'wp-btn', onClick: () => setCfgPaste((v) => !v) }, T('手动粘贴配置', 'Paste manually'))),
        cfgPaste ? h('div', null,
          h('textarea', {
            className: 'wp-paste', value: cfgText, placeholder: T('把导出的 JSON 粘到这里', 'Paste the exported JSON here'),
            onChange: (e) => setCfgText(e.target.value),
          }),
          h('div', { className: 'wp-actions' },
            h('button', { className: 'wp-btn primary', onClick: applyPasted }, T('应用', 'Apply')))) : null,
        h('div', { className: 'wp-note' }, T('只备份设置、时段与贴纸位置，不含图片视频素材。', 'Settings, slots and sticker layout only; media is not included.')),
        ]),
      )
    }

    async function requestGyro(say) {
      try {
        const D = window.DeviceOrientationEvent
        if (D && typeof D.requestPermission === 'function') {
          const r = await D.requestPermission()
          say(r === 'granted' ? T('陀螺仪已授权', 'Gyro allowed') : T('陀螺仪被拒绝', 'Gyro denied'))
        } else {
          say(T('这个环境不需要单独授权', 'No permission needed here'))
        }
      } catch (e) {
        say(T('陀螺仪授权失败', 'Gyro request failed'))
      }
    }

    // 只导出与默认值不同的字段，粘贴串更短
    function diffState(state) {
      const out = {}
      for (const k of Object.keys(DEFAULTS)) {
        if (k === 'slots') continue
        const cur = state[k]
        const def = DEFAULTS[k]
        const same = typeof cur === 'object' ? JSON.stringify(cur) === JSON.stringify(def) : cur === def
        if (!same) out[k] = cur
      }
      return out
    }

    // 以 DEFAULTS 为底，逐字段覆盖；缺失自动回落默认值
    function mergeState(partial) {
      const out = {}
      for (const k of Object.keys(DEFAULTS)) {
        const def = DEFAULTS[k]
        const v = partial && partial[k] !== undefined ? partial[k] : def
        if (Array.isArray(def)) out[k] = Array.isArray(v) ? v : def
        else if (typeof def === 'number') out[k] = Number.isFinite(Number(v)) ? Number(v) : def
        else if (typeof def === 'boolean') out[k] = typeof v === 'boolean' ? v : def
        else if (typeof def === 'string') out[k] = typeof v === 'string' ? v : def
        else out[k] = v
      }
      return out
    }

    function validateState(st) {
      const missing = []
      for (const k of Object.keys(DEFAULTS)) {
        if (st[k] === undefined) missing.push(k)
        else if (Array.isArray(DEFAULTS[k]) && !Array.isArray(st[k])) missing.push(k)
        else if (typeof DEFAULTS[k] === 'number' && typeof st[k] !== 'number') missing.push(k)
        else if (typeof DEFAULTS[k] === 'boolean' && typeof st[k] !== 'boolean') missing.push(k)
        else if (typeof DEFAULTS[k] === 'string' && typeof st[k] !== 'string') missing.push(k)
      }
      return { ok: missing.length === 0, missing }
    }

    function exportConfig() {
      const payload = {
        app: 'dsh-live-wallpaper',
        version: 2,
        at: new Date().toISOString(),
        state: diffState(bus.state),
        slots: bus.state.slots || [],
        stickers: Stickers.items.map((i) => ({ name: i.name, alias: i.alias, x: i.x, y: i.y, opacity: i.opacity })),
      }
      try {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'dsh-wallpaper-' + new Date().toISOString().slice(0, 10) + '.json'
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => { try { URL.revokeObjectURL(url) } catch {} }, 3000)
      } catch {}
      const text = JSON.stringify(payload)
      copyText(text).then((ok) => { if (ok) bus.listeners.forEach((fn) => fn()) })
      return payload
    }

    async function copyText(text) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text)
          return true
        }
      } catch {}
      try {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        const ok = document.execCommand && document.execCommand('copy')
        ta.remove()
        return !!ok
      } catch { return false }
    }

    async function readClipboard() {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) return await navigator.clipboard.readText()
      } catch {}
      return ''
    }

    // 安卓壁纸 App 的配置 → 网页状态。单位不同：压暗/底部压暗是 0..1，饱和度 1.0=100%，时长是秒。
    function fromAndroidState(a) {
      const st = {}
      const num = (v) => typeof v === 'number' && isFinite(v)
      const cl01 = (v) => Math.max(0, Math.min(1, v))
      if (num(a.dim)) st.dim = Math.round(cl01(a.dim) * 100)
      if (num(a.bottomShade)) st.bottomShade = Math.round(cl01(a.bottomShade) * 100)
      if (num(a.saturate)) st.saturate = Math.round(a.saturate * 100)
      if (num(a.blur)) st.blur = Math.round(a.blur)
      if (typeof a.kenBurns === 'boolean') st.kenBurns = a.kenBurns
      if (typeof a.transition === 'string') st.transition = a.transition === 'none' ? 'fade' : a.transition
      if (typeof a.photoOn === 'boolean') st.photoOn = a.photoOn
      if (num(a.photoInterval)) st.photoInterval = a.photoInterval
      if (num(a.fps)) st.fps = a.fps
      if (typeof a.particles2D === 'boolean') st.particles = a.particles2D
      if (typeof a.fx === 'string') { st.fx = a.fx; if (a.fx === 'none') st.particles = false }
      if (num(a.fxCount)) st.fxCount = a.fxCount
      if (num(a.fxSpeed)) st.fxSpeed = a.fxSpeed
      if (typeof a.gl3D === 'boolean') st.gl3d = a.gl3D
      if (num(a.gl3DCount)) st.gl3dCount = a.gl3DCount
      if (num(a.gl3DSize)) st.gl3dSize = a.gl3DSize
      if (num(a.gl3DDepth)) st.gl3dDepth = a.gl3DDepth
      if (typeof a.parallax === 'boolean') st.parallax = a.parallax
      if (num(a.parallaxPower)) st.parallaxPower = Math.max(0, Math.round(a.parallaxPower))
      if (typeof a.audioOn === 'boolean') st.audio = a.audioOn
      if (num(a.introDuration)) st.introDuration = Math.max(600, Math.min(6000, Math.round(a.introDuration * 1000)))
      if (typeof a.introPlay === 'string') st.introPlay = a.introPlay === 'all' ? 'all' : 'one'
      if (typeof a.introOrder === 'string' && ['random', 'order', 'fixed'].indexOf(a.introOrder) >= 0) st.introOrder = a.introOrder
      if (typeof a.introOn === 'boolean') st.introMode = a.introOn ? 'media' : 'off'
      if (typeof a.slotsOn === 'boolean') st.slotsOn = a.slotsOn
      if (num(a.slotFade)) st.slotFade = a.slotFade
      if (typeof a.stickerMotion === 'string') st.stickerMotion = a.stickerMotion === 'none' ? 'none' : a.stickerMotion
      if (num(a.stickerSize)) st.stickerSize = Math.max(40, Math.min(220, Math.round(a.stickerSize * 400)))
      return st
    }

    function applyConfigData(data) {
      if (!data || (data.app !== 'dsh-live-wallpaper' && data.app !== 'dsh.wp')) {
        throw new Error(T('这不是壁纸插件的配置', 'Not a wallpaper config'))
      }
      if (data.app === 'dsh.wp') {
        // 安卓 App 的配置：字段名/单位不同，走映射
        const mergedA = mergeState(fromAndroidState(data))
        const chk = validateState(mergedA)
        if (!chk.ok) throw new Error(T('配置字段不完整：', 'Broken config fields: ') + chk.missing.slice(0, 4).join(','))
        set(mergedA)
        const slotsA = Array.isArray(data.slots) ? data.slots.map((s) => ({
          id: 'sl_' + Math.random().toString(36).slice(2, 8),
          name: s.name || T('时段', 'Slot'), start: Number(s.start) || 0,
          end: Number(s.end) || 0, itemId: '', introId: '',
        })) : []
        if (slotsA.length && slotsValid(slotsA)) set({ slots: slotsA })
        return true
      }
      const merged = mergeState(data.state || {})
      const check = validateState(merged)
      if (!check.ok) throw new Error(T('配置字段不完整：', 'Broken config fields: ') + check.missing.slice(0, 4).join(','))
      set(merged)
      if (Array.isArray(data.slots) && slotsValid(data.slots)) set({ slots: data.slots })
      if (Array.isArray(data.stickers)) {
        data.stickers.forEach((st, i) => {
          const it = Stickers.items[i]
          if (!it) return
          if (typeof st.opacity === 'number') Stickers.setOpacity(i, st.opacity)
          if (st.alias) Stickers.renameAt(i, st.alias)
        })
      }
      return true
    }

    async function importConfig(file) {
      const text = typeof file.text === 'function'
        ? await file.text()
        : await new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsText(file) })
      return applyConfigData(JSON.parse(text))
    }

    function ensureUiHost() {
      let ui = document.getElementById('dshwp-ui')
      if (!ui) {
        ui = document.createElement('div')
        ui.id = 'dshwp-ui'
        document.body.appendChild(ui)
      }
      return ui
    }

    function Pill() {
      const [open, setOpen] = React.useState(false)
      return h(React.Fragment, null,
        h('button', {
          className: 'dshwp-pill', type: 'button',
          title: T('壁纸引擎设置', 'Wallpaper engine settings'),
          onClick: () => setOpen((v) => !v),
        }, h('span', { className: 'dshwp-pill-dot' }), T('壁纸', 'Wall')),
        open ? ReactDOM.createPortal(h(Settings, { onClose: () => setOpen(false) }), ensureUiHost()) : null)
    }

    window.__dshwp = {
      state: bus.state,
      set,
      nativeLook: applyNativeLook,
      replay: playIntro,
      upload: (file) => setLocal(file),
      applyPreset: (id) => applyPreset(id),
      presets: () => PRESETS.map((p) => p.id),
      uploadIntro: (file) => setIntroFile(file),
      addIntros: (files) => addIntroFiles(files),
      introCount: () => bus.introList.length,
      intros: () => bus.introList.map((i) => ({ id: i.id, name: i.name, url: i.url })),
      introQueue: () => planIntroQueue().map((i) => i.name),
      introCurrent: () => bus.introIndex,
      introNames: () => bus.introList.map((i) => displayName(i)),
      switchIntroTo: (i) => switchIntroTo(i),
      renameIntro: (i, n) => renameIntroAt(i, n),
      removeIntro: (i) => removeIntroAt(i),
      replayIntro: () => playIntro(),
      setAudioFile: (f) => setAudioFile(f),
      addAudio: (files) => addAudioFiles(files),
      audioList: () => bus.audioList.map((it) => it.name),
      audioIndex: () => bus.audioIndex,
      switchAudioTo: (i) => switchAudioTo(i),
      removeAudio: (i) => removeAudioAt(i),
      clearIntro: () => {
        for (const i of bus.introList) { try { URL.revokeObjectURL(i.url) } catch {} }
        bus.introList = []; bus.intro = null; bus.introIndex = -1
        persistIntroList(); emit()
      },
      clearShell: () => { restoreShell(); clearShell() },
      autoTheme: (dark) => AutoTheme.apply(dark),
      autoTune: (env, img) => autoTune(env, img),
      autoThemeState: () => ({ ok: AutoTheme.ok, dark: AutoTheme.dark, hasTheme: !!(ctxRef && ctxRef.theme) }),
      pickTone: (m) => AutoTheme.pickDark(m),
      fromAndroid: (d) => fromAndroidState(d),
      surfFor: (style, tone, light, page) => surfForStyle(style, tone, light !== false, !!page),
      haloFor: (mode, dark, power, color) => haloShadow(!!dark, power === undefined ? 70 : power, color || 'auto', mode),
      paletteFor: (dark, weight) => palette(!!dark, weight || 'normal'),
      halo: (on, dark) => applyHalo(on, dark),
      timers: () => ({ watch: !!watchTimer, observer: !!observer, pending: !!obsTimer || !!settleTimer }),
      exportConfig,
      get defaults() { return Object.assign({}, DEFAULTS) },
      copyConfig: () => { const t = JSON.stringify(exportConfig()); return copyText(t) },
      readClipboard,
      applyConfigText: (t) => applyConfigData(JSON.parse(t)),
      importConfig: (f) => importConfig(f),
      get fxItems() { return Particles.items.length },
      get gl3d() { return { ok: GL3D.ok, failed: GL3D.failed, pr: GL3D.pr } },
      get device() { return Device.info },
      get tilt() { return { x: Number(GL3D.tilt.x.toFixed(2)), y: Number(GL3D.tilt.y.toFixed(2)) } },
      get sensors() { return { ori: GL3D.sensors.ori, mot: GL3D.sensors.mot } },
      get tiltWant() { return { x: Number(GL3D.want.x.toFixed(2)), y: Number(GL3D.want.y.toFixed(2)) } },
      expandAll: () => {
        document.querySelectorAll('#dshwp-card .wp-sec-h').forEach((b) => { if (/▸/.test(b.textContent)) b.click() })
      },
      bindSensors: () => { if (GL3D.bound) { GL3D.bound(); GL3D.bound = null } GL3D.bindInput() },
      get playlist() { return bus.playlist.length },
      removePlaylistAt,
      switchTo,
      useHistory,
      renamePlaylistAt,
      setSlots: (list) => set({ slots: list }),
      get slots() { return bus.state.slots || [] },
      slotsValid: (list) => slotsValid(list || bus.state.slots || []),
      crossTo: (i, secs) => crossTo(bus.playlist[i], secs),
      resolveSlot: () => { const sl = Slots.resolve(Slots.minutesNow()); return sl ? sl.name : '' },
      renameHistoryAt,
      displayName: (i) => displayName(bus.playlist[i]),
      get history() { return bus.history.length },
      get index() { return bus.mediaIndex },
      addFiles,
      stickerCount: () => Stickers.items.length,
      stickerList: () => Stickers.items.map((i) => ({ id: i.id, name: Stickers.displayName(i) })),
      removeStickerAt: (i) => Stickers.removeAt(i),
      renameStickerAt: (i, a) => Stickers.renameAt(i, a),
      setStickerOpacity: (i, v) => Stickers.setOpacity(i, v),
      clearStickers: () => Stickers.clear(),
      StickersAdd: (f) => Stickers.add(f),
      get rebuilds() { return bus.rebuilds || 0 },
      setQuality: (q) => applyQuality(q),
      get fps() { return Meter.fps },
      next: () => Slideshow.next(),
      get fxRunning() { return !!Particles.raf && Particles.on },
      diagnose,
      get cleared() { return cleared.size },
      get media() { return bus.media },
    }

    return {
      inject: ['slots', 'theme'],
      apply(ctx) {
        ctxRef = ctx
        try {
          mount()
          ctx.effect(() => {
            playIntro()
            // 补采样：素材是异步加载的，开机第一秒常常还没图，取样会落空 → 字色判定回落到默认值。
            // 这里在多个时间点重试，并顺手把外壳底色补扫一次，避免"每次登录都要手动点一键适配"。
            const timers = [120, 900, 2400, 4000, 7000].map((ms) => setTimeout(() => {
              scheduleShell()
              diagnose()
              AutoTheme.refresh()
              emit()
            }, ms))
            return () => { timers.forEach(clearTimeout); unmount() }
          })
          ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
            name: 'conversation.composer.dock', id: 'live-wallpaper', order: 40,
          }, Pill))
        } catch (err) {
          console.error('[live-wallpaper] 壁纸启动失败，已跳过：', err)
          unmount()
        }
      },
    }
  },
})

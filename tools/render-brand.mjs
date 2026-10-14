// Render the site's raster brand images from assets/brand/ae-mark.svg with headless
// Chrome: the favicon, the home-screen (touch) icon, and the 1200×630 image that link
// previews show. Run `make brand`; it needs Google Chrome (set CHROME to its binary
// when it is not in the macOS default place) and the network, for the web font.
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = 9341

const markSource = readFileSync(join(root, 'assets/brand/ae-mark.svg'), 'utf8').replace(/<!--[\s\S]*?-->\s*/g, '')
const mark = color => markSource.replace('fill="#8a6d1d"', `fill="${color}"`).replace(' width="512" height="512"', '')

const page = (size, css, body) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&display=block" rel="stylesheet">
<style>html, body { margin: 0; width: ${size[0]}px; height: ${size[1]}px; overflow: hidden; background: transparent; } ${css}</style>
</head><body>${body}</body></html>`

// A gold tile with the mark in warm white, readable at 16px in a browser tab. The
// touch icon keeps a wider margin because iOS rounds its corners.
const tile = (size, radius, scale) => page([size, size], `
  .tile { width: ${size}px; height: ${size}px; border-radius: ${radius}px; display: grid; place-items: center;
    background: radial-gradient(circle at 32% 24%, #b8923a, #8a6d1d 58%, #6f5612); }
  .tile svg { width: ${scale}%; height: ${scale}%; margin-top: -2%; }`,
`<div class="tile">${mark('#fbf6ea')}</div>`)

const share = page([1200, 630], `
  body { background: #f7f4ee; font-family: 'Cormorant Garamond', serif; color: #23222a; }
  .glow { position: absolute; inset: 0; background:
    radial-gradient(640px 360px at 50% 26%, rgba(232, 194, 76, 0.30), transparent 70%),
    radial-gradient(900px 420px at 50% 120%, rgba(184, 149, 48, 0.10), transparent 70%); }
  .ring { position: absolute; left: 600px; top: 158px; border-radius: 50%; transform: translate(-50%, -50%);
    border: 1.5px solid rgba(184, 149, 48, 0.40); }
  .mark { position: absolute; left: 600px; top: 158px; width: 250px; height: 250px; transform: translate(-50%, -50%); }
  .mark svg { width: 100%; height: 100%; }
  h1 { position: absolute; left: 0; right: 0; top: 268px; margin: 0; text-align: center;
    font-weight: 600; font-size: 104px; letter-spacing: 0.04em; line-height: 1; }
  p { position: absolute; left: 0; right: 0; margin: 0; text-align: center; }
  .tag { top: 408px; font-style: italic; font-weight: 500; font-size: 40px; color: #55524e; }
  .url { top: 532px; font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 21px;
    font-weight: 600; letter-spacing: 0.24em; text-transform: uppercase; color: #8a6d1d; }`,
`<div class="glow"></div>
<div class="ring" style="width: 210px; height: 210px"></div>
<div class="ring" style="width: 262px; height: 262px; opacity: .62"></div>
<div class="ring" style="width: 320px; height: 320px; opacity: .32"></div>
<div class="mark">${mark('#8a6d1d')}</div>
<h1>Æterni Anima</h1>
<p class="tag">Where science, art and technology converge for well-being</p>
<p class="url">aeterni.github.io</p>`)

const jobs = [
  { out: 'assets/favicon-32.png', size: [32, 32], html: tile(32, 7, 100), format: 'png' },
  { out: 'assets/apple-touch-icon.png', size: [180, 180], html: tile(180, 0, 84), format: 'png' },
  { out: 'assets/imgs/og-aeterni.jpg', size: [1200, 630], html: share, format: 'jpeg' }
]

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const work = mkdtempSync(join(tmpdir(), 'render-brand-'))
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${join(work, 'profile')}`, 'about:blank'], { stdio: 'ignore' })

try {
  let wsUrl
  for (let i = 0; i < 50 && !wsUrl; i++) {
    try { wsUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page')?.webSocketDebuggerUrl } catch { /* not listening yet */ }
    if (!wsUrl) await sleep(200)
  }
  if (!wsUrl) throw new Error(`no Chrome DevTools endpoint; is CHROME right? (${CHROME})`)
  const ws = new WebSocket(wsUrl)
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }))
  let nextId = 1
  const pending = new Map()
  ws.addEventListener('message', ev => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id) }
  })
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, msg => msg.error ? reject(new Error(`${method}: ${msg.error.message}`)) : resolve(msg.result))
    ws.send(JSON.stringify({ id, method, params }))
  })

  await send('Page.enable')
  await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } })
  for (const job of jobs) {
    const file = join(work, 'page.html')
    writeFileSync(file, job.html)
    await send('Emulation.setDeviceMetricsOverride', { width: job.size[0], height: job.size[1], deviceScaleFactor: 1, mobile: false })
    await send('Page.navigate', { url: pathToFileURL(file).href })
    await sleep(500)
    const ready = await send('Runtime.evaluate', {
      expression: "document.fonts.ready.then(() => document.fonts.check('600 104px \"Cormorant Garamond\"'))",
      awaitPromise: true,
      returnByValue: true
    })
    if (job.format === 'jpeg' && !ready.result.value) throw new Error('Cormorant Garamond did not load; check the network')
    const { data } = await send('Page.captureScreenshot', {
      format: job.format,
      ...(job.format === 'jpeg' ? { quality: 90 } : {}),
      clip: { x: 0, y: 0, width: job.size[0], height: job.size[1], scale: 1 }
    })
    writeFileSync(join(root, job.out), Buffer.from(data, 'base64'))
    console.log('wrote', job.out)
  }
  ws.close()
} finally {
  // Chrome keeps writing its profile until it has exited, so wait before removing it.
  const exited = new Promise(resolve => chrome.exitCode === null ? chrome.once('exit', resolve) : resolve())
  chrome.kill()
  await exited
  rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
}

// The Algorithmic Autoregulation page: ?aa, and its UFRJ edition, ?ufrj.
//
// AA is a method of self-transparency (R. Fabbri, arXiv:1711.04612): work in timed
// slots and leave short notes, the shouts, on what you are doing. A session is a run
// of slots; a shout is due when it starts and again at the end of each slot, which a
// chime announces. Sessions and shouts go to the `aatest` collection of the data
// function, which takes them without the admin key; the logs (?aalogs3, ?ufrj-logs2)
// list them, in the full bundle.
//
// Plain DOM, in its own small bundle (scripts/aa.js → scripts/aa.bundle.js), which the
// small bundle loads for these two routes only; the full bundle routes them too, from
// test.js. Both give it the router as wand.router, so this bundle carries neither the
// router nor the dialog again. The chime is the full bundle's Tone.js MembraneSynth
// arpeggio, voiced with the Web Audio API, and it is scheduled on the audio clock:
// browsers slow a background tab's timers to one a minute, the audio clock keeps time.
const { call } = require('./data.js')

const e = module.exports

const urlArgument = key => window.wand.router.urlArgument(key)

// the address of this same page in another language, as ui.js's langHref
const langHref = code => '?' + window.location.search.slice(1).split('&')
  .filter(p => p && !p.startsWith('lang='))
  .concat(`lang=${code}`).join('&')

const pt = () => document.documentElement.classList.contains('lang-pt')
const tr = (en, ptText) => pt() ? ptText : en
// dates and numbers in the page's language (an English reader's own variant, if any)
const locale = () => pt()
  ? 'pt-BR'
  : ((navigator.languages || []).find(l => /^en\b/i.test(l)) || 'en')

// the visitor's name, slot settings and chime, remembered in this browser
const store = {
  get (key, fallback) {
    try {
      const v = window.localStorage.getItem('aeterni.aa.' + key)
      return v === null ? fallback : JSON.parse(v)
    } catch { return fallback }
  },
  set (key, value) {
    try { window.localStorage.setItem('aeterni.aa.' + key, JSON.stringify(value)) } catch { /* storage blocked: nothing is remembered */ }
  }
}

const aaCall = (op, rest) => call({ source: 'artifacts', collection: 'aatest', op, ...rest })

const SHOW = 8 // shouts in the recent list
const RECENT_DAYS = 30 // asked for first; the whole workspace only when they are fewer than SHOW
const PIPS_UP_TO = 24 // more slots than this are drawn as a bar
const VOL_OFF = -60 // dB: the chime's volume slider at its left end silences it
const PITCH = [50, 1000] // Hz, the range of the full bundle's slider, here on a log scale

// ---------------------------------------------------------------- the chime

let audioCtx = null
const audio = () => {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    audioCtx = new Ctx()
  }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})
  return audioCtx
}

// Two rising triads, 0.1 s apart, on one sine voice that is struck for each note: it
// starts ten times higher and falls to the note in 50 ms, with a 1 ms attack, a decay
// toward 1% and a 1.4 s release. These are Tone.js's MembraneSynth defaults.
const NOTES = [0, 3, 7, 4, 8, 11] // semitones above the pitch
const chime = (ctx, when, { pitch, volume }) => {
  if (volume <= VOL_OFF) return null
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  const out = ctx.createGain()
  out.gain.value = 10 ** (volume / 20)
  env.gain.setValueAtTime(0, when)
  osc.connect(env)
  env.connect(out)
  out.connect(ctx.destination)
  NOTES.forEach((step, i) => {
    const t = when + i * 0.1
    const hz = pitch * 2 ** (step / 12)
    osc.frequency.setValueAtTime(hz * 10, t)
    osc.frequency.exponentialRampToValueAtTime(hz, t + 0.05)
    env.gain.setTargetAtTime(1, t, 0.0003)
    env.gain.setTargetAtTime(0.01, t + 0.001, 0.087)
    env.gain.setTargetAtTime(0, t + 0.05, 0.3)
  })
  osc.start(when)
  osc.stop(when + NOTES.length * 0.1 + 2)
  return { osc, out, when }
}

const silence = sound => {
  if (!sound) return
  try { sound.out.disconnect() } catch { /* already gone */ }
  try { sound.osc.stop() } catch { /* already stopped */ }
}

// ---------------------------------------------------------------- text

const num = (x, digits = 1) => new Intl.NumberFormat(locale(), { maximumFractionDigits: digits }).format(x)
const plural = (n, one, many) => n === 1 ? one : many

// a length of time, from minutes: "45 s", "15 min", "2 h", "1 h 30 min"
const span = min => {
  if (min < 1) return `${num(min * 60, 0)} s`
  if (min < 60) return `${num(min)} min`
  const h = Math.floor(min / 60)
  const rest = min - h * 60
  return rest >= 0.05 ? `${h} h ${num(rest)} min` : `${h} h`
}

// what is left of a slot: 15:00, 4:05, 1:30:00
const clock = ms => {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const p = n => String(n).padStart(2, '0')
  const h = Math.floor(s / 3600)
  const m = Math.floor(s % 3600 / 60)
  return h ? `${h}:${p(m)}:${p(s % 60)}` : `${p(m)}:${p(s % 60)}`
}

const hhmm = date => date.toLocaleTimeString(locale(), { hour: 'numeric', minute: '2-digit' })

// when a shout was given: "just now", "12 minutes ago", "3 hours ago", "6 Feb 2024, 7:11 PM"
const ago = date => {
  const s = (Date.now() - date) / 1000
  if (s < 45) return tr('just now', 'agora mesmo')
  const rtf = new Intl.RelativeTimeFormat(locale(), { numeric: 'auto' })
  if (s < 3600) return rtf.format(-Math.round(s / 60), 'minute')
  if (s < 86400) return rtf.format(-Math.round(s / 3600), 'hour')
  const year = date.getFullYear() === new Date().getFullYear() ? {} : { year: 'numeric' }
  return `${date.toLocaleDateString(locale(), { day: 'numeric', month: 'short', ...year })}, ${hhmm(date)}`
}

// a shout's text, with its web addresses as links (built as nodes: shouts are anyone's text)
const URLS = /\bhttps?:\/\/[^\s<>"']+/gi
const linkify = (node, text) => {
  let last = 0
  for (const m of text.matchAll(URLS)) {
    let url = m[0].replace(/[.,;:!?'"\]]+$/, '')
    if (url.endsWith(')') && !url.includes('(')) url = url.replace(/\)+$/, '')
    node.append(text.slice(last, m.index))
    const a = document.createElement('a')
    a.href = url
    a.textContent = url
    a.target = '_blank'
    a.rel = 'noopener nofollow ugc'
    node.append(a)
    last = m.index + url.length
  }
  node.append(text.slice(last))
}

// for addresses written into the page's HTML
const attr = text => String(text).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

const el = (tag, attrs = {}, text) => {
  const n = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null && v !== false) n.setAttribute(k, v)
  if (text !== undefined) n.textContent = text
  return n
}

// ---------------------------------------------------------------- the page

const css = `<style>
  .aa [hidden] { display: none !important; } /* over the display of the blocks below */
  .aa .apage-lead { max-width: 34em; }
  .aa-partner { margin: 1em 0 0; }
  .aa-console {
    margin: 1.6em 0 0; overflow: hidden;
    background: var(--card); border: 1px solid var(--card-border); border-radius: 18px;
    box-shadow: var(--shadow-card);
  }
  .aa-top {
    display: flex; flex-wrap: wrap; align-items: center; gap: 4px 14px;
    padding: 10px 20px; border-bottom: 1px solid var(--card-border);
    background: color-mix(in srgb, var(--accent) 5%, transparent);
    font-size: 0.92rem; color: var(--ink-soft);
  }
  .aa-top strong { color: var(--ink); font-weight: 600; }
  .aa-grow { flex: 1; }
  .acard .aa-top a { font-weight: 600; text-decoration: none; }
  .aa-linkbtn {
    padding: 0; border: 0; background: none; cursor: pointer;
    font: inherit; font-weight: 600; color: var(--link); transition: color 0.2s ease;
  }
  .aa-linkbtn:hover { color: var(--link-hover); }
  .aa-wsform { margin: 0; padding: 14px 20px 16px; border-bottom: 1px solid var(--card-border); }
  .aa-wsnote { margin-top: 8px; }
  .aa-wsnote .is-error { color: var(--alert); }

  .aa-main {
    display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: center;
    gap: 24px 32px; padding: 28px 26px 24px;
  }
  @media (max-width: 640px) { .aa-main { grid-template-columns: minmax(0, 1fr); padding: 24px 18px 20px; } }

  .aa-dialcol { display: flex; flex-direction: column; align-items: center; gap: 14px; }
  .aa-dial { position: relative; width: min(212px, 64vw); aspect-ratio: 1; }
  .aa-dial::before {
    content: ''; position: absolute; inset: 6%; border-radius: 50%;
    background: radial-gradient(closest-side, var(--glow), transparent);
  }
  .aa-dial svg { position: relative; display: block; width: 100%; height: 100%; transform: rotate(-90deg); }
  .aa-track, .aa-arc { fill: none; stroke-width: 3.6; }
  .aa-track { stroke: var(--card-border); }
  .aa-arc {
    stroke: var(--accent); stroke-linecap: round;
    stroke-dasharray: 100 100; stroke-dashoffset: 100; transition: stroke-dashoffset 0.25s linear;
  }
  .aa-arc.is-empty { opacity: 0; } /* a zero-length dash still leaves a hairline */
  .aa-dial-in { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .aa-clock {
    font-family: var(--serif); font-weight: 600; font-size: clamp(2.7rem, 10vw, 3.3rem); line-height: 1;
    font-variant-numeric: lining-nums tabular-nums; color: var(--ink);
  }
  .aa-slot {
    margin-top: 0.55em; font-size: 0.72rem; font-weight: 600;
    letter-spacing: 0.13em; text-transform: uppercase; color: var(--accent);
  }
  .acard .aa-pips { display: flex; flex-wrap: wrap; justify-content: center; gap: 7px; max-width: 232px; margin: 0; padding: 0; list-style: none; }
  .acard .aa-pips li {
    box-sizing: border-box; width: 10px; height: 10px; margin: 0;
    border-radius: 50%; border: 1.5px solid color-mix(in srgb, var(--ink-soft) 38%, transparent);
    transition: background-color 0.3s ease, border-color 0.3s ease;
  }
  .acard .aa-pips li.is-done { background: var(--accent); border-color: var(--accent); }
  .acard .aa-pips li.is-now { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent); }
  .aa-bar { width: min(220px, 70%); height: 6px; overflow: hidden; border-radius: 3px; background: var(--card-border); }
  .aa-bar span { display: block; width: 0; height: 100%; border-radius: inherit; background: var(--accent); }
  .aa-total { margin: 0; font-size: 0.88rem; color: var(--ink-soft); }

  .aa-side { display: flex; flex-direction: column; gap: 16px; }
  .aa-label {
    display: block; margin: 0 0 5px;
    font-size: 0.74rem; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; color: var(--ink-soft);
  }
  .aa input[type="text"], .aa input[type="number"] {
    box-sizing: border-box; width: 100%; margin: 0; padding: 0.62em 0.8em;
    border: 1px solid var(--card-border); border-radius: 12px;
    background: var(--field); color: var(--ink); font: 400 1rem/1.3 var(--sans);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .aa input::placeholder { color: var(--ink-soft); opacity: 0.75; }
  .aa input:focus { outline: none; border-color: var(--accent-soft); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent); }
  .aa input[aria-invalid="true"] { border-color: var(--alert); }
  .aa-pair { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px; }
  .aa-setup, .aa-run { display: flex; flex-direction: column; align-items: flex-start; gap: 14px; margin: 0; }
  .aa-setup .aa-pair { align-self: stretch; }
  .aa .abtn:disabled { opacity: 0.6; cursor: progress; transform: none; }
  .aa-note { margin: 0; font-size: 0.86rem; color: var(--ink-soft); }
  .aa-runinfo { margin: 0; line-height: 1.5; }
  .aa-due {
    display: inline-block; padding: 0.2em 0.8em; border-radius: 999px;
    background: color-mix(in srgb, var(--accent) 15%, transparent); color: var(--accent-strong);
    font-size: 0.92rem; font-weight: 600;
  }
  .aa-next { color: var(--ink-soft); font-size: 0.92rem; }
  .aa-runbtns { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 18px; }
  .acard .aa-runbtns a { font-size: 0.92rem; font-weight: 600; text-decoration: none; }

  .aa-chime { font-size: 0.92rem; }
  .aa-chime summary { width: fit-content; cursor: pointer; font-weight: 600; color: var(--ink-soft); transition: color 0.2s ease; }
  .aa-chime summary:hover { color: var(--accent); }
  .aa-chime summary:focus-visible { outline: 2px solid var(--accent-soft); outline-offset: 3px; border-radius: 4px; }
  .aa-chime-body { display: grid; grid-template-columns: auto minmax(0, 1fr) 4.6em; align-items: center; gap: 10px 12px; margin: 12px 0 14px; }
  .aa-chime-body .aa-label { margin: 0; }
  .aa input[type="range"] { width: 100%; margin: 0; accent-color: var(--accent); }
  .aa output { font-size: 0.86rem; color: var(--ink-soft); text-align: right; font-variant-numeric: tabular-nums; }
  .aa .abtn.aa-small { padding: 0.45em 1.1em; font-size: 0.88rem; }

  .aa-shout {
    margin: 0; padding: 18px 26px 14px; border-top: 1px solid var(--card-border);
    transition: background-color 0.4s ease;
  }
  .aa-hint { display: block; margin: 0 0 8px; font-weight: 600; color: var(--ink); }
  .aa-shout.is-due { background: color-mix(in srgb, var(--accent) 9%, transparent); }
  .aa-shout.is-due .aa-hint { color: var(--accent-strong); }
  .aa-row { display: flex; gap: 10px; }
  .aa-row input { flex: 1; min-width: 0; }
  .aa-status { min-height: 1.5em; margin: 8px 0 0; font-size: 0.9rem; color: var(--ink-soft); }
  .aa-status.is-error { color: var(--alert); }
  .aa-side-status { margin: -4px 0 0; }
  .aa-side-status:empty { display: none; }
  @media (max-width: 640px) { .aa-shout { padding: 16px 18px 12px; } }
  @media (max-width: 460px) {
    .aa-shout .aa-row { flex-direction: column; }
    .aa-shout .aa-row .abtn { align-self: flex-end; }
  }

  .aa-feed { margin: 2.2em 0 0; }
  .aa-feed-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 2px 16px; }
  .acard .aa-feed-head h2 { margin: 0; }
  .acard .aa-feed-head a { font-size: 0.92rem; font-weight: 600; text-decoration: none; }
  .acard .aa-list { margin: 0.9em 0 0; padding: 0; list-style: none; }
  .acard .aa-list li {
    margin: 0; padding: 12px 4px 12px 16px;
    border-top: 1px solid var(--card-border); border-left: 2px solid transparent;
  }
  .acard .aa-list li:last-child { border-bottom: 1px solid var(--card-border); }
  .acard .aa-list li.is-mine { border-left-color: var(--accent); }
  .acard .aa-list li.is-new { animation: aa-in 0.6s ease; }
  @keyframes aa-in { from { opacity: 0; transform: translateY(-4px); } }
  .aa-meta { margin: 0; font-size: 0.85rem; color: var(--ink-soft); }
  .acard .aa-meta a { font-weight: 600; color: var(--ink); text-decoration: none; }
  .acard .aa-meta a:hover { color: var(--accent); }
  .aa-text { margin: 2px 0 0; overflow-wrap: anywhere; }
  .aa-feed-msg { margin: 0.9em 0 0; color: var(--ink-soft); }
  .aa-feed-msg:empty { display: none; }
  .aa-about { max-width: 36em; margin: 2.4em auto 0.6em; text-align: center; font-size: 0.92rem; color: var(--ink-soft); }

  @media (prefers-reduced-motion: reduce) {
    .aa-arc, .aa-shout, .acard .aa-pips li { transition: none; }
    .acard .aa-list li.is-new { animation: none; }
  }
</style>`

e.aa = (opts = {}) => {
  const ufrj = Boolean(opts.ufrj)
  const route = ufrj ? 'ufrj' : 'aa'
  const logsRoute = ufrj ? 'ufrj-logs2' : 'aalogs3'
  const field = ufrj ? 'shoutFran' : 'shout' // the UFRJ edition kept its shouts apart
  const ws = urlArgument('ws') || null // a workspace: its own log; without one, the public log
  const wsPart = ws ? `&ws=${encodeURIComponent(ws)}` : ''
  const logs = extra => `?${logsRoute}${extra || ''}${wsPart}`

  const main = el('main', { class: 'acard apage aa' })
  main.innerHTML = `${pt()
    ? `<a class="alang-top" href="${attr(langHref('en'))}" lang="en" hreflang="en">English</a>`
    : `<a class="alang-top" href="${attr(langHref('pt'))}" lang="pt-BR" hreflang="pt-BR">Português</a>`}
  ${css}
  <header class="apage-head">
    <p class="amark notranslate"><a href="${pt() ? './?lang=pt' : './'}" aria-label="${tr('Æterni Anima home page', 'Página inicial da Æterni Anima')}">Æ</a></p>
    <h1>${tr('Algorithmic Autoregulation', 'Autorregulação Algorítmica')}</h1>
    <p class="apage-lead">${tr(
      'A method for focus and self-transparency, in use since 2011: work in timed slots and leave short notes, called shouts, on what you are doing. Together they form a shared log of work in progress.',
      'Um método de foco e autotransparência, em uso desde 2011: trabalhe em blocos de tempo e deixe notas curtas, os shouts, sobre o que está fazendo. Juntos, eles formam um registro compartilhado do trabalho em andamento.'
    )}</p>
    ${ufrj ? '<p class="aa-partner"><img src="assets/UFRJ-logo.png" alt="UFRJ" width="40" height="50"></p>' : ''}
  </header>

  <section class="aa-console" aria-label="${tr('Session and shouts', 'Sessão e shouts')}">
    <div class="aa-top">
      <span>${tr('Workspace', 'Espaço')} <strong id="aa-ws-name" class="notranslate"></strong></span>
      <button type="button" class="aa-linkbtn" id="aa-ws-toggle" aria-expanded="false" aria-controls="aa-ws-form">${tr('Switch', 'Trocar')}</button>
      <span class="aa-grow"></span>
      <a href="${attr(logs())}" target="_blank" rel="noopener">${tr('All shouts', 'Todos os shouts')} <span aria-hidden="true">↗</span></a>
    </div>
    <form class="aa-wsform" id="aa-ws-form" hidden novalidate>
      <label class="aa-label" for="aa-ws-input">${tr('Workspace name', 'Nome do espaço')}</label>
      <div class="aa-row">
        <input id="aa-ws-input" type="text" maxlength="40" autocomplete="off" spellcheck="false" placeholder="${tr('e.g. my-team', 'ex.: minha-equipe')}">
        <button class="abtn" type="submit">${tr('Open', 'Abrir')}</button>
      </div>
      <p class="aa-note aa-wsnote"><span id="aa-ws-note" role="status">${tr('A new name starts a new workspace, with its own log.', 'Um nome novo cria um novo espaço, com seu próprio registro.')}</span>
        ${ws ? `<a href="${attr(`?${route}${pt() ? '&lang=pt' : ''}`)}">${tr('Back to the public workspace', 'Voltar ao espaço público')}</a>` : ''}</p>
    </form>

    <div class="aa-main">
      <div class="aa-dialcol">
        <div class="aa-dial">
          <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
            <circle class="aa-track" cx="60" cy="60" r="55"/>
            <circle class="aa-arc" id="aa-arc" cx="60" cy="60" r="55" pathLength="100"/>
          </svg>
          <div class="aa-dial-in">
            <span class="aa-clock notranslate" id="aa-clock" role="timer"></span>
            <span class="aa-slot" id="aa-slot"></span>
          </div>
        </div>
        <ol class="aa-pips" id="aa-pips" aria-hidden="true"></ol>
        <div class="aa-bar" id="aa-bar" aria-hidden="true" hidden><span></span></div>
        <p class="aa-total" id="aa-total"></p>
      </div>

      <div class="aa-side">
        <div>
          <label class="aa-label" for="aa-user">${tr('Your name', 'Seu nome')}</label>
          <input id="aa-user" type="text" maxlength="60" autocomplete="nickname" spellcheck="false" placeholder="${tr('name or nickname', 'nome ou apelido')}">
        </div>
        <form class="aa-setup" id="aa-setup" novalidate>
          <div class="aa-pair">
            <div>
              <label class="aa-label" for="aa-n">${tr('Slots', 'Blocos')}</label>
              <input id="aa-n" type="number" inputmode="numeric" min="1" step="1">
            </div>
            <div>
              <label class="aa-label" for="aa-d">${tr('Minutes each', 'Minutos cada')}</label>
              <input id="aa-d" type="number" inputmode="decimal" min="0" step="any">
            </div>
          </div>
          <button class="abtn abtn--primary" type="submit" id="aa-start">${tr('Start session', 'Iniciar sessão')}</button>
          <p class="aa-note">${tr('The session runs in this tab, so keep it open. A chime marks the end of each slot.', 'A sessão acontece nesta aba, então mantenha-a aberta. Um aviso sonoro marca o fim de cada bloco.')}</p>
        </form>
        <div class="aa-run" id="aa-run" hidden>
          <p class="aa-runinfo" id="aa-runinfo"></p>
          <p class="aa-runinfo" id="aa-duenow"></p>
          <div class="aa-runbtns">
            <button class="abtn" type="button" id="aa-end">${tr('End session', 'Encerrar sessão')}</button>
            <a id="aa-sesslog" href="#" target="_blank" rel="noopener">${tr('This session’s shouts', 'Shouts desta sessão')} <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <p class="aa-status aa-side-status" id="aa-side-status" role="status"></p>
        <details class="aa-chime">
          <summary>${tr('Chime', 'Aviso sonoro')}</summary>
          <div class="aa-chime-body">
            <label class="aa-label" for="aa-pitch">${tr('Pitch', 'Altura')}</label>
            <input id="aa-pitch" type="range" min="0" max="1000" step="1">
            <output id="aa-pitch-out" for="aa-pitch"></output>
            <label class="aa-label" for="aa-vol">${tr('Volume', 'Volume')}</label>
            <input id="aa-vol" type="range" min="${VOL_OFF}" max="0" step="1">
            <output id="aa-vol-out" for="aa-vol"></output>
          </div>
          <button class="abtn aa-small" type="button" id="aa-play">${tr('Play the chime', 'Ouvir o aviso')}</button>
        </details>
      </div>
    </div>

    <form class="aa-shout" id="aa-shout" novalidate>
      <label class="aa-hint" for="aa-text" id="aa-hint"></label>
      <div class="aa-row">
        <input id="aa-text" type="text" maxlength="4000" autocomplete="off" placeholder="${tr('e.g. reviewing the draft', 'ex.: revisando o texto')}">
        <button class="abtn abtn--primary" type="submit" id="aa-send">${tr('Shout', 'Enviar')}</button>
      </div>
      <p class="aa-status" id="aa-status" role="status"></p>
      <p class="avh" id="aa-announce" role="status"></p>
    </form>
  </section>

  <section class="aa-feed" aria-labelledby="aa-feed-h">
    <div class="aa-feed-head">
      <h2 class="asub" id="aa-feed-h">${tr('Recent shouts', 'Shouts recentes')}</h2>
      <a href="${attr(logs())}" target="_blank" rel="noopener">${tr('All shouts', 'Todos os shouts')} <span aria-hidden="true">↗</span></a>
    </div>
    <ol class="aa-list" id="aa-list"></ol>
    <p class="aa-feed-msg" id="aa-feed-msg"></p>
  </section>

  <p class="aa-about">${tr('About the method:', 'Sobre o método:')} <a href="https://arxiv.org/abs/1711.04612" hreflang="en" lang="en">The Algorithmic-Autoregulation (AA) Methodology and Software: a collective focus on self-transparency</a> (Renato Fabbri, 2017).</p>
  <p class="acenter amute">:::</p>`
  document.body.appendChild(main)

  const $ = id => document.getElementById(id)
  const name = $('aa-user')
  const nIn = $('aa-n')
  const dIn = $('aa-d')
  const text = $('aa-text')
  const startBtn = $('aa-start')
  const sendBtn = $('aa-send')
  const shoutLine = $('aa-status')
  const sideLine = $('aa-side-status')
  const list = $('aa-list')
  const feedMsg = $('aa-feed-msg')
  const baseTitle = document.title
  const favicon = document.getElementById('favicon')
  const baseIcon = favicon && { href: favicon.getAttribute('href'), type: favicon.getAttribute('type') }

  $('aa-ws-name').textContent = ws || tr('public', 'público')

  // ?user= (or ?u=), ?n= and ?d= fill the form, as they always did; then what this browser remembers
  const slots = store.get('slots', {})
  name.value = urlArgument('user') || urlArgument('u') || store.get('name', '')
  nIn.value = urlArgument('n') || slots.n || 8
  dIn.value = urlArgument('d') || slots.d || 15

  // messages: the shout's under the shout, the session's in the side column
  const say = (line, msg, isError) => {
    line.textContent = msg
    line.classList.toggle('is-error', Boolean(isError))
  }
  const status = (msg, isError) => say(shoutLine, msg, isError)
  // what the hint already shows, for screen readers: the slot's end, the session's start
  const announce = msg => { $('aa-announce').textContent = msg }
  const sessionStatus = (msg, isError) => say(sideLine, msg, isError)
  const fail = (line, msg, input) => {
    say(line, msg, true)
    input.setAttribute('aria-invalid', 'true')
    input.focus()
  }
  // the tick redraws four times a second; text only changes when it differs
  const setText = (node, value) => { if (node.textContent !== value) node.textContent = value }
  ;[name, nIn, dIn, text].forEach(input => input.addEventListener('input', () => input.removeAttribute('aria-invalid')))

  // ---- the chime's settings
  const saved = store.get('chime', {})
  const chimeSet = {
    pitch: Number.isFinite(saved.pitch) ? Math.min(PITCH[1], Math.max(PITCH[0], saved.pitch)) : 120,
    volume: Number.isFinite(saved.volume) ? Math.min(0, Math.max(VOL_OFF, saved.volume)) : -25
  }
  const pitchIn = $('aa-pitch')
  const volIn = $('aa-vol')
  const toSlider = hz => Math.round(1000 * Math.log(hz / PITCH[0]) / Math.log(PITCH[1] / PITCH[0]))
  const fromSlider = v => Math.round(PITCH[0] * (PITCH[1] / PITCH[0]) ** (v / 1000))
  pitchIn.value = toSlider(chimeSet.pitch)
  volIn.value = chimeSet.volume
  const showChime = () => {
    $('aa-pitch-out').textContent = `${chimeSet.pitch} Hz`
    $('aa-vol-out').textContent = chimeSet.volume <= VOL_OFF ? tr('off', 'desligado') : `${chimeSet.volume < 0 ? '−' : ''}${Math.abs(chimeSet.volume)} dB`
  }
  showChime()
  const playNow = () => {
    const ctx = audio()
    if (ctx) chime(ctx, ctx.currentTime + 0.03, chimeSet)
  }
  pitchIn.addEventListener('input', () => { chimeSet.pitch = fromSlider(Number(pitchIn.value)); showChime() })
  volIn.addEventListener('input', () => { chimeSet.volume = Number(volIn.value); showChime() })
  ;[pitchIn, volIn].forEach(input => input.addEventListener('change', () => {
    store.set('chime', chimeSet)
    playNow()
    scheduleNext() // a session's next chime takes the new sound
  }))
  $('aa-play').addEventListener('click', playNow)

  // ---- the session
  let session = null // { id, start, slotMs, n, d, done, due }
  let ticker = null
  let pending = null // the next chime, already on the audio clock
  let lastIcon = ''

  const scheduleNext = () => {
    silence(pending)
    pending = null
    if (!session || session.done >= session.n || !audioCtx) return
    if (audioCtx.state !== 'running') {
      audioCtx.resume().then(() => { if (!pending && session) scheduleNext() }).catch(() => {})
      return
    }
    const at = session.start + (session.done + 1) * session.slotMs
    pending = chime(audioCtx, audioCtx.currentTime + Math.max(0, (at - Date.now()) / 1000), chimeSet)
  }

  // a slot is over: the chime already sounded on the audio clock, unless that clock
  // stood still (the computer slept, say) — then it sounds now
  const ring = () => {
    const sound = pending
    pending = null
    if (audioCtx && (!sound || sound.when > audioCtx.currentTime + 0.3)) {
      silence(sound)
      playNow()
    }
    scheduleNext()
  }

  const guard = ev => {
    ev.preventDefault()
    ev.returnValue = ''
  }

  // the tab's icon: the slot's progress as a ring, with a dot while a shout is due
  const drawIcon = (frac, due) => {
    if (!favicon) return
    const r = 12.5
    const c = 2 * Math.PI * r
    const key = `${Math.round(frac * 48)}${due ? 'd' : ''}`
    if (key === lastIcon) return
    lastIcon = key
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="${r}" fill="none" stroke="#b8953066" stroke-width="5"/><circle cx="16" cy="16" r="${r}" fill="none" stroke="#b89530" stroke-width="5" stroke-dasharray="${(c * frac).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 16 16)"/>${due ? '<circle cx="16" cy="16" r="5" fill="#b89530"/>' : ''}</svg>`
    favicon.setAttribute('type', 'image/svg+xml')
    favicon.setAttribute('href', 'data:image/svg+xml,' + encodeURIComponent(svg))
  }
  const resetIcon = () => {
    lastIcon = ''
    if (!favicon || !baseIcon) return
    favicon.setAttribute('type', baseIcon.type)
    favicon.setAttribute('href', baseIcon.href)
  }

  const setArc = frac => {
    const arc = $('aa-arc')
    arc.style.strokeDashoffset = String(100 - 100 * frac)
    arc.classList.toggle('is-empty', frac <= 0)
  }

  const setPips = (n, done, running) => {
    const pips = $('aa-pips')
    const bar = $('aa-bar')
    if (!(n >= 1) || n > PIPS_UP_TO) {
      pips.hidden = true
      pips.textContent = ''
      bar.hidden = !(n > PIPS_UP_TO) || !running
      bar.firstElementChild.style.width = `${n > 0 ? 100 * done / n : 0}%`
      return
    }
    pips.hidden = false
    bar.hidden = true
    if (pips.children.length !== n) {
      pips.textContent = ''
      for (let i = 0; i < n; i++) pips.appendChild(el('li'))
    }
    Array.from(pips.children).forEach((pip, i) => {
      pip.classList.toggle('is-done', i < done)
      pip.classList.toggle('is-now', running && i === done)
    })
  }

  const hint = () => {
    if (!session) return tr('What are you doing?', 'O que você está fazendo?')
    if (session.due === 0) return tr('Shout whenever you like; the next one is due when this slot ends.', 'Envie quando quiser; o próximo shout é esperado no fim deste bloco.')
    if (session.done === 0) return tr('What will you do in this session?', 'O que você vai fazer nesta sessão?')
    if (session.done >= session.n) return tr('The last slot is over: what did you do?', 'O último bloco terminou: o que você fez?')
    return tr(`Slot ${session.done} is over: what did you do?`, `O bloco ${session.done} terminou: o que você fez?`)
  }

  // draw the page from the state; called on every tick
  const render = () => {
    const shout = $('aa-shout')
    setText($('aa-hint'), hint())
    if (!session) {
      const n = Number(nIn.value)
      const d = Number(dIn.value)
      const ok = Number.isInteger(n) && n >= 1 && d > 0
      setText($('aa-clock'), d > 0 ? clock(d * 60000) : '--:--')
      setText($('aa-slot'), ok ? tr(`${n} ${plural(n, 'slot', 'slots')}`, `${n} ${plural(n, 'bloco', 'blocos')}`) : '')
      setText($('aa-total'), ok && n > 1 ? tr(`${span(n * d)} in all`, `${span(n * d)} no total`) : '')
      setArc(0)
      setPips(ok ? n : 0, 0, false)
      shout.classList.remove('is-due')
      return
    }
    const now = Date.now()
    const over = session.done >= session.n
    const slotStart = session.start + session.done * session.slotMs
    setText($('aa-clock'), over ? clock(0) : clock(slotStart + session.slotMs - now))
    setText($('aa-slot'), over
      ? tr('Slots done', 'Blocos concluídos')
      : tr(`Slot ${session.done + 1} of ${session.n}`, `Bloco ${session.done + 1} de ${session.n}`))
    setText($('aa-total'), '')
    const frac = over ? 1 : Math.min(1, Math.max(0, (now - slotStart) / session.slotMs))
    setArc(frac)
    setPips(session.n, session.done, !over)
    const due = $('aa-duenow')
    const next = hhmm(new Date(slotStart + session.slotMs))
    const dueText = session.due > 0
      ? tr(`${session.due} ${plural(session.due, 'shout due', 'shouts due')}`, `${session.due} ${plural(session.due, 'shout pendente', 'shouts pendentes')}`)
      : over ? '' : tr(`Next shout at ${next}`, `Próximo shout às ${next}`)
    if (due.textContent !== dueText) {
      due.textContent = ''
      if (dueText) due.appendChild(el('span', { class: session.due > 0 ? 'aa-due' : 'aa-next' }, dueText))
    }
    shout.classList.toggle('is-due', session.due > 0)
    const title = `${session.due > 0 ? '● ' : ''}${$('aa-clock').textContent} · ${baseTitle}`
    if (document.title !== title) document.title = title
    drawIcon(frac, session.due > 0)
  }

  const tick = () => {
    if (!session) return
    const finished = Math.min(session.n, Math.floor((Date.now() - session.start) / session.slotMs))
    if (finished > session.done) {
      session.due += finished - session.done
      session.done = finished
      ring()
      status('')
      announce(session.done >= session.n
        ? tr('The last slot is over: shout to close the session.', 'O último bloco terminou: envie um shout para fechar a sessão.')
        : tr(`Slot ${session.done} is over: time to shout.`, `O bloco ${session.done} terminou: hora do shout.`))
      if (document.activeElement === document.body) text.focus({ preventScroll: true })
    }
    render()
  }

  const showRunning = running => {
    $('aa-setup').hidden = running
    $('aa-run').hidden = !running
  }

  const stop = msg => {
    clearInterval(ticker)
    ticker = null
    silence(pending)
    pending = null
    session = null
    $('aa-duenow').textContent = ''
    window.removeEventListener('beforeunload', guard)
    document.title = baseTitle
    resetIcon()
    showRunning(false)
    render()
    sessionStatus(msg)
    // let the last chime ring out, then free the audio device
    setTimeout(() => { if (!session && audioCtx && audioCtx.state === 'running') audioCtx.suspend().catch(() => {}) }, 4000)
  }

  const complete = () => {
    const { n, d } = session
    stop(tr(`Session complete: ${n} ${plural(n, 'slot', 'slots')} of ${span(d)}.`, `Sessão concluída: ${n} ${plural(n, 'bloco', 'blocos')} de ${span(d)}.`))
  }

  $('aa-setup').addEventListener('submit', async ev => {
    ev.preventDefault()
    const uid = name.value.trim()
    const n = Number(nIn.value)
    const d = Number(dIn.value)
    if (!uid) return fail(sideLine, tr('Write your name first.', 'Escreva seu nome primeiro.'), name)
    if (!Number.isInteger(n) || n < 1) return fail(sideLine, tr('Choose how many slots: a whole number, 1 or more.', 'Escolha quantos blocos: um número inteiro, 1 ou mais.'), nIn)
    if (!(d > 0)) return fail(sideLine, tr('Choose how many minutes each slot lasts.', 'Escolha quantos minutos dura cada bloco.'), dIn)
    audio() // this click is what lets the chime play later
    sessionStatus('')
    startBtn.disabled = true
    startBtn.textContent = tr('Starting…', 'Iniciando…')
    try {
      const r = await aaCall('insertOne', { doc: { uid, sdur: d, nslots: n, date: new Date() } })
      store.set('name', uid)
      store.set('slots', { n, d })
      session = { id: String(r.insertedId), start: Date.now(), slotMs: d * 60000, n, d, done: 0, due: 1 }
      $('aa-runinfo').textContent = tr(
        `Started at ${hhmm(new Date(session.start))}, ends at ${hhmm(new Date(session.start + n * session.slotMs))}.`,
        `Começou às ${hhmm(new Date(session.start))} e termina às ${hhmm(new Date(session.start + n * session.slotMs))}.`
      )
      $('aa-sesslog').href = logs(`&session=${encodeURIComponent(session.id)}`)
      window.addEventListener('beforeunload', guard)
      showRunning(true)
      scheduleNext()
      ticker = setInterval(tick, 250)
      render()
      status('')
      announce(tr('Session started: shout what you plan to do.', 'Sessão iniciada: conte o que pretende fazer.'))
      text.focus()
    } catch {
      sessionStatus(tr('The session could not start. Try again.', 'Não foi possível iniciar a sessão. Tente de novo.'), true)
    } finally {
      startBtn.disabled = false
      startBtn.textContent = tr('Start session', 'Iniciar sessão')
    }
  })

  $('aa-end').addEventListener('click', () => {
    if (!session) return
    if (!window.confirm(tr('End this session? The timer stops; your shouts stay in the log.', 'Encerrar esta sessão? O cronômetro para; seus shouts continuam no registro.'))) return
    stop(tr('Session ended.', 'Sessão encerrada.'))
  })

  ;[nIn, dIn].forEach(input => input.addEventListener('input', () => { if (!session) render() }))
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return
    tick()
    if (Date.now() - loadedAt > 5 * 60000) loadFeed() // others may have shouted meanwhile
  })

  // ---- the recent shouts
  let feed = []
  let loadedAt = 0

  // your own shouts are marked, by the name in the form
  const item = (s, isNew, me) => {
    const li = el('li', { class: [me && s.uid === me ? 'is-mine' : '', isNew ? 'is-new' : ''].join(' ').trim() || undefined })
    const meta = el('p', { class: 'aa-meta' })
    const who = el('a', { href: logs(`&user=${encodeURIComponent(s.uid)}`), target: '_blank', rel: 'noopener', title: tr(`All shouts by ${s.uid}`, `Todos os shouts de ${s.uid}`), class: 'notranslate' }, s.uid)
    const date = s.date instanceof Date ? s.date : new Date(s.date)
    const when = el('time', { datetime: date.toISOString(), title: date.toLocaleString(locale()) }, ago(date))
    meta.append(who, ' · ', when)
    const body = el('p', { class: 'aa-text' })
    linkify(body, String(s[field] || ''))
    li.append(meta, body)
    return li
  }

  const showFeed = newest => {
    const me = name.value.trim()
    list.textContent = ''
    feed.forEach(s => list.appendChild(item(s, s === newest, me)))
    feedMsg.textContent = feed.length ? '' : tr('No shouts here yet: yours can be the first.', 'Ainda não há shouts aqui: o seu pode ser o primeiro.')
  }

  const loadFeed = async () => {
    loadedAt = Date.now()
    if (!feed.length) feedMsg.textContent = tr('Loading the shouts…', 'Carregando os shouts…')
    const base = { [field]: { $exists: true }, ws }
    const projection = { uid: 1, [field]: 1, date: 1, sessionId: 1 }
    try {
      const since = new Date(Date.now() - RECENT_DAYS * 86400000)
      let found = await aaCall('find', { query: { ...base, date: { $gte: since } }, projection })
      if (found.length < SHOW) found = await aaCall('find', { query: base, projection })
      feed = found.filter(s => s.uid && s.date).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, SHOW)
      showFeed()
    } catch {
      feedMsg.textContent = tr('The shouts could not be loaded. ', 'Não foi possível carregar os shouts. ')
      const retry = el('button', { type: 'button', class: 'aa-linkbtn' }, tr('Try again', 'Tentar de novo'))
      retry.addEventListener('click', loadFeed)
      feedMsg.appendChild(retry)
    }
  }

  name.addEventListener('change', () => showFeed()) // which shouts are yours

  // "12 minutes ago" moves on
  setInterval(() => {
    list.querySelectorAll('time').forEach(t => { t.textContent = ago(new Date(t.getAttribute('datetime'))) })
  }, 60000)

  // ---- shouting
  $('aa-shout').addEventListener('submit', async ev => {
    ev.preventDefault()
    const uid = name.value.trim()
    const said = text.value.trim()
    if (!uid) return fail(shoutLine, tr('Write your name first.', 'Escreva seu nome primeiro.'), name)
    if (!said) return fail(shoutLine, tr('Write what you are doing, then shout.', 'Escreva o que está fazendo e envie.'), text)
    sendBtn.disabled = true
    const doc = { uid, sessionId: session ? session.id : null, [field]: said, ws, date: new Date() }
    try {
      const r = await aaCall('insertOne', { doc })
      store.set('name', uid)
      text.value = ''
      const mine = { ...doc, _id: String(r.insertedId) }
      feed = [mine, ...feed].slice(0, SHOW)
      showFeed(mine)
      status(tr('Shout saved.', 'Shout registrado.'))
      if (session && doc.sessionId === session.id) {
        session.due = Math.max(0, session.due - 1)
        if (session.done >= session.n && session.due === 0) complete()
      }
    } catch {
      status(tr('The shout could not be saved. Try again.', 'Não foi possível registrar o shout. Tente de novo.'), true)
    } finally {
      sendBtn.disabled = false
      render()
    }
  })

  // ---- the workspace
  const wsToggle = $('aa-ws-toggle')
  const wsForm = $('aa-ws-form')
  const wsInput = $('aa-ws-input')
  wsToggle.addEventListener('click', () => {
    const open = wsForm.hidden
    wsForm.hidden = !open
    wsToggle.setAttribute('aria-expanded', String(open))
    if (open) wsInput.focus()
  })
  wsForm.addEventListener('submit', ev => {
    ev.preventDefault()
    // letters, digits, - _ and . only: the name travels in the address
    const wanted = wsInput.value.normalize('NFC').replace(/[^\p{L}\p{N}_.-]/gu, '')
    if (!wanted) return fail($('aa-ws-note'), tr('Give the workspace a name: letters, digits, - or _.', 'Dê um nome ao espaço: letras, números, - ou _.'), wsInput)
    window.location.href = `?${route}&ws=${encodeURIComponent(wanted)}${pt() ? '&lang=pt' : ''}`
  })

  showRunning(false)
  render()
  loadFeed()
  const veil = document.getElementById('loading')
  if (veil) veil.style.display = 'none'
}

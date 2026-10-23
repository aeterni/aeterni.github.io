/* global wand */
const ui = require('./ui.js')

const e = module.exports

// A link mangled on its way (a cut-off %-escape) cannot be decoded; read it as it came
// rather than stop every page, which would leave the visitor on the loading veil.
let u
try {
  u = new URL(decodeURIComponent(window.location.href))
} catch {
  u = new URL(window.location.href)
}

e.urlArgument = (arg, rotOrFun) => {
  const a = u.searchParams.get(arg)
  if (typeof rotOrFun === 'function' && a) {
    rotOrFun()
  } else {
    // return rotOrFun ? wand.utils.rot(a) : a
    return rotOrFun ? wand.utils.rot(a) : a
  }
}

e.urlAllArguments = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const entries = urlParams.entries()
  const keys = []
  const values = []
  const dict = {}
  for (const entry of entries) {
    keys.push(entry[0])
    values.push(entry[1])
    dict[entry[0]] = entry[1]
  }
  return { keys, values, dict }
}

e.mkFooter = () => {
  // The visitor's country only serves the older routes (sync sessions word their messages
  // by it, and the dormant visit logging), all in the full bundle: the small bundle that
  // serves the curated pages sends nobody's address to a third party.
  if (wand.transfer) {
    wand.$.get('https://ipinfo.io/?token=a1cf42d7d11976', function (response) {
      wand.country = response.country
      wand.speaksPortuguese = ['BR', 'PT', 'AO', 'ST'].includes(wand.country)
      if (window.location.href.includes('localhost')) return
      response.date = new Date()
      response.uargs = e.urlAllArguments()
      wand.transfer.fAll.wcosta(response).then(r => {
        if (!r || !r.insertedId) return // visit logging is dormant
        window.sessionL = r
        wand.unloadFuncs.unshift(e => {
          wand.transfer.fAll.ucosta({ _id: r.insertedId }, { dateLeft: new Date() })
        })
        setInterval(() => {
          wand.transfer.fAll.ucosta({ _id: r.insertedId }, { lastSeen: new Date() })
        }, 3 * 60 * 1000)
      })
    }, 'jsonp')
  }
  wand.modal = ui.mkModal()
  // plain DOM, as the small bundle has no jQuery
  const add = (parent, tag, attrs, text) => {
    const n = document.createElement(tag)
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v)
    n.textContent = text
    return parent.appendChild(n)
  }
  const ft = add(document.body, 'footer', { id: 'afooter' }, '')
  ft.style.cssText = 'display: flex; white-space: nowrap; overflow-x: auto; margin: 0 auto; padding: 8px; text-align: center; width: auto'
  // it opens the dialog, so it is a button that looks like the links beside it
  const involve = label => add(ft, 'button', { type: 'button', id: 'contribL' }, label).addEventListener('click', () => wand.modal.show())
  if (!['aeterni.github.io', 'localhost', '127.0.0.1'].includes(window.location.hostname)) {
    add(ft, 'a', { href: '?about', id: 'abouta' }, 'Regarding AV Medicine')
    involve('support this initiative')
    return
  }
  // The language is set in index.html's head (html.lang-pt); Portuguese links carry it.
  const pt = document.documentElement.classList.contains('lang-pt')
  add(ft, 'a', { href: pt ? './?lang=pt' : './', id: 'homea' }, pt ? 'Início' : 'Home')
  add(ft, 'a', { href: `?about${pt ? '&lang=pt' : ''}`, id: 'abouta' }, pt ? 'Sobre a Æterni' : 'About Æterni')
  involve(pt ? 'Envolva-se' : 'Get involved')
  // this same page in each language; the current one is plain text
  const langs = add(ft, 'span', { class: 'alangs' }, '')
  for (const [code, tag, name] of [['en', 'en', 'English'], ['pt', 'pt-BR', 'Português']]) {
    if (code === 'pt') add(langs, 'span', { 'aria-hidden': 'true' }, '·')
    if ((code === 'pt') === pt) {
      add(langs, 'span', { lang: tag, 'aria-current': 'true' }, name)
    } else {
      add(langs, 'a', { href: ui.langHref(code), lang: tag, hreflang: tag }, name)
    }
  }
  // uncomment to enable disqus
  // todo: debug to load correct discussions in each page
  // const uargs = e.urlAllArguments()
  // if (uargs.keys[0] && uargs.keys[0][0] === '_') disqus(uargs.keys[0][0].slice(1))
}

window.disqus_config = function () {
  // this.page.url = `${window.location.origin}?_${id}`
  const url = window.location.href
  this.page.url = url
  // this.page.identifier = id
  this.page.identifier = url.includes('?') ? url.split('?')[1] : '/'
}

function disqus (id) {
  wand.$('<noscript/>').html('Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript">comments powered by Disqus.</a>')
  const d = document
  const s = d.createElement('script')
  s.src = 'https://aeterni.disqus.com/embed.js'
  s.setAttribute('data-timestamp', +new Date())
  const asec = (d.head || d.body)
  asec.appendChild(s)
}
window.disqus = disqus

e.timeArgument = () => {
  const dd = new Date()
  const d_ = e.urlArgument('s')
  if (d_) {
    const d = d_.split(':')
    dd.setHours(d[0])
    dd.setMinutes(d.length > 1 ? d[1] : 0)
    dd.setSeconds(d.length > 2 ? d[2] : 0)
  } else {
    dd.setMinutes(dd.getMinutes() + 1)
    dd.setSeconds(0)
  }
  dd.setMilliseconds(0)
  return dd
}

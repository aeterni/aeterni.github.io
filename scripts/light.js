/* global wand */
// Entry of the small bundle, scripts/light.bundle.js, which is what index.html loads.
// The curated pages (the landing, About, the Manifesto and the support pages) are plain
// DOM: they need none of the jQuery, players, visualizations and libraries that the
// full bundle (scripts/main.js → scripts/bundle.js) carries for the older routes, so
// keep pages.js, ui.js and router.js free of them. Any route that is not one of these
// pages loads the full bundle, which routes exactly as before.
window.wand = {
  router: require('./modules/router.js'),
  unloadFuncs: []
}
const pages = require('./modules/pages.js')

// Social sites and newsletters add tracking parameters to shared links (?fbclid=…,
// &utm_source=…); drop them first, as main.js does, so they cannot pick the route.
const kept = window.location.search.slice(1).split('&').filter(p => p && !/^(fbclid|gclid|utm_[a-z]+)=/.test(p))
const cleanSearch = kept.length ? '?' + kept.join('&') : ''
if (cleanSearch !== window.location.search) {
  window.history.replaceState(null, '', window.location.pathname + cleanSearch + window.location.hash)
}

// The first parameter names the page (lang= only picks the language, in index.html's
// head); one with a value (key=value) is a sync session.
const [key, value = ''] = (kept.find(p => !p.startsWith('lang=')) || '').split('=')
const curated = new Map([
  ['', 'welcome2'], ['about', 'about2'], ['daimesm', 'daimesm'],
  ['angel', 'angel'], ['paypal', 'paypal'], ['bitcoin', 'bitcoin']
])
const aeterniHost = ['aeterni.github.io', 'localhost', '127.0.0.1'].includes(window.location.hostname)

if (aeterniHost && value === '' && curated.has(key)) {
  pages[curated.get(key)]()
  wand.router.mkFooter()
} else {
  const full = document.createElement('script')
  full.type = 'module'
  full.src = 'scripts/bundle.js'
  document.body.appendChild(full)
}

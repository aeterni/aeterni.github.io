(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{"./modules/pages.js":2,"./modules/router.js":3}],2:[function(require,module,exports){
/* global wand */
// The site's curated pages: the landing's wiring, About, the Daimist Science
// Manifesto, and the support, PayPal and Bitcoin pages. They are plain DOM, so the
// small bundle (scripts/light.js) serves them without jQuery or any library; test.js
// re-exports them, and the full bundle routes them as before.
const { langHref } = require('./ui.js')

const e = module.exports

// Each page is written in English and Portuguese. Which one shows is decided in
// index.html's head (html.lang-pt), from ?lang=, the visitor's earlier choice or the
// browser; Portuguese pages keep lang=pt in their links.
const pt = () => document.documentElement.classList.contains('lang-pt')
const tr = (en, ptText) => pt() ? ptText : en

const link = (text, path) => `<a href="?${path}${pt() ? '&amp;lang=pt' : ''}">${text}</a>`

// the Æ that heads each page, leading home
const mark = () => `<p class="amark notranslate"><a href="${pt() ? './?lang=pt' : './'}" aria-label="${tr('Æterni Anima home page', 'Página inicial da Æterni Anima')}">Æ</a></p>`

// the other language, at the top of every page (the footer offers both, further down);
// the address carries the visitor's own parameters, so it is escaped for the attribute
const attr = text => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const otherLang = () => pt()
  ? `<a class="alang-top" href="${attr(langHref('en'))}" lang="en" hreflang="en">English</a>`
  : `<a class="alang-top" href="${attr(langHref('pt'))}" lang="pt-BR" hreflang="pt-BR">Português</a>`

// each page is one card: the page's main content
const page = html => {
  const main = document.createElement('main')
  main.className = 'acard apage'
  main.innerHTML = otherLang() + html
  document.body.appendChild(main)
  return main
}

// the loading veil, lifted once the page is in place
const ready = () => {
  const veil = document.getElementById('loading')
  if (veil) veil.style.display = 'none'
}

// every "Get involved" button opens the dialog; its href is what a reader without
// JavaScript follows instead
const involve = () => document.querySelectorAll('.ae-involve').forEach(button => {
  button.addEventListener('click', event => {
    event.preventDefault()
    wand.modal.show()
  })
})

// The landing is static HTML in index.html (main.ae-landing, one per language), so it
// shows before this bundle arrives and without JavaScript. Here it only gains its
// dialog buttons.
e.welcome2 = () => {
  document.documentElement.classList.remove('ae-route') // e.g. after a stripped ?fbclid
  document.documentElement.classList.add('ae-home')
  involve()
  ready()
}

const aboutEn = () => `
<header class="apage-head">
  ${mark()}
  <h1>About Æterni Anima</h1>
</header>
<p class="about-lead"><strong>Æterni Anima</strong> is an initiative established in December 2020 to promote <span class="highlighted">extended longevity</span> through <span class="highlighted">non-invasive</span> improvements to health and performance. We integrate science, art and technology to foster <span class="highlighted">well-being</span> across a range of endeavors.</p>

<p>Our flagship, <a href="https://biosyncare.com/">BioSynCare</a> (formerly Audiovisual Medicine), advances <span class="highlighted">sensory stimulation</span> for non-invasive neuromodulation of health, well-being and performance, through breathing and sound: an app of carefully composed sessions for focus, relaxation, meditation and sleep preparation.</p>

<p>We also contribute to <a href="https://w3c-cg.github.io/sstim/">SSTIM</a>, the Sensory Stimulation Vocabulary: an <span class="highlighted">open, evolving reference</span> that connects research, technology and AI through citable identifiers, precise descriptions and transparent evidence. It is developed through the <a href="https://www.w3.org/groups/cg/sstim/">W3C Sensory Stimulation Vocabulary Community Group</a>, and BioSynCare adopts it. Its open reference app, <a href="https://w3c-cg.github.io/sstim/about/">SSTIM Workbench</a> (formerly BSC Lab), lets anyone build sensory-stimulation patches in Patch Studio and examine the knowledge behind them.</p>

<p>Around this work we cultivate tools for <a href="https://pypi.org/project/music/">musical synthesis</a>, for harnessing one's own social networks, and for registering insights and distilling knowledge. Within the Santo Daime community, the <a href="?daimesm">Daimist Science Manifesto</a> guides work that unites scientific rigor with spiritual wisdom, from textual analyses of the hymnals in <a href="https://da1me.github.io/">Da1me</a> to <a href="https://saoirineu.github.io/">São Irineu</a>, ICEFLU Europe's online portal.</p>

<p>Through our <strong>publishing activity</strong>, we curate and disseminate <span class="highlighted">transformative narratives</span>.</p>

<h2 class="asub">Who we are</h2>
<div class="apeople">
  <div class="aperson">
    <h3>Renato Fabbri</h3>
    <p class="arole">Physicist · Software architect · Composer</p>
    <p>Renato leads the research and the architecture of the initiative's projects. His path includes an MSc in Applied Physics on the psychophysical description of music in digital audio, a PhD in Computational Physics, open-source work such as the <a href="https://pypi.org/project/music/">Music</a> library, and more than twenty years of practice with brainwave entrainment and resonance breathing.</p>
    <p><a href="https://ttm.github.io/">ttm.github.io</a></p>
  </div>
  <div class="aperson">
    <h3>Riccardo Berti</h3>
    <p class="arole">Lead developer · Product engineering · Musician</p>
    <p>Riccardo leads much of BioSynCare's app development, its releases and the day-to-day support of its users, turning protocol ideas into a stable product and bringing a musician's ear to how the sessions sound and feel.</p>
  </div>
</div>

<h2 class="asub">Earlier communities</h2>
<p>The initiative has also gathered people in the Facebook groups <a href="https://www.facebook.com/groups/arcturianart">Arcturian Art</a> and <a href="https://www.facebook.com/groups/mentaliz">Mentaliz</a>, and in a WhatsApp group. These communities are no longer active; they remain part of our history.</p>

<p>We invite you to join us on this journey. Your participation is invaluable, and we look forward to sharing each step with you.</p>
<div class="about-cta">
  <a class="abtn abtn--primary ae-involve" href="mailto:aeterni.anima@gmail.com?subject=Getting%20involved">Get involved</a>
  <a class="abtn" href="./#projects">Explore the projects</a>
</div>`

const aboutPt = () => `
<header class="apage-head">
  ${mark()}
  <h1>Sobre a Æterni Anima</h1>
</header>
<p class="about-lead"><strong>Æterni Anima</strong> é uma iniciativa criada em dezembro de 2020 para promover a <span class="highlighted">longevidade estendida</span> por meio de melhorias <span class="highlighted">não invasivas</span> na saúde e no desempenho. Integramos ciência, arte e tecnologia para cultivar o <span class="highlighted">bem-estar</span> em diversas frentes.</p>

<p>Nosso carro-chefe, o <a href="https://biosyncare.com/">BioSynCare</a> (antes chamado Audiovisual Medicine), desenvolve a <span class="highlighted">estimulação sensorial</span> para a neuromodulação não invasiva da saúde, do bem-estar e do desempenho, por meio da respiração e do som: um aplicativo de sessões cuidadosamente compostas para foco, relaxamento, meditação e preparação para o sono.</p>

<p>Também contribuímos com o <a href="https://w3c-cg.github.io/sstim/">SSTIM</a>, o Vocabulário de Estimulação Sensorial: uma <span class="highlighted">referência aberta e em evolução</span> que conecta pesquisa, tecnologia e IA por meio de identificadores citáveis, descrições precisas e evidências transparentes. Ele é desenvolvido no <a href="https://www.w3.org/groups/cg/sstim/">W3C Sensory Stimulation Vocabulary Community Group</a>, e o BioSynCare o adota. Seu aplicativo de referência aberto, o <a href="https://w3c-cg.github.io/sstim/about/">SSTIM Workbench</a> (antes chamado BSC Lab), permite que qualquer pessoa crie patches de estimulação sensorial no Patch Studio e examine o conhecimento por trás deles.</p>

<p>Em torno desse trabalho, cultivamos ferramentas para a <a href="https://pypi.org/project/music/">síntese musical</a>, para explorar as próprias redes sociais e para registrar ideias e destilar conhecimento. Na comunidade do Santo Daime, o <a href="?daimesm&amp;lang=pt">Manifesto da Ciência Daimista</a> orienta um trabalho que une rigor científico e sabedoria espiritual, das análises textuais dos hinários no <a href="https://da1me.github.io/">Da1me</a> ao <a href="https://saoirineu.github.io/">São Irineu</a>, o portal online da ICEFLU Europa.</p>

<p>Por meio da nossa <strong>atividade editorial</strong>, selecionamos e divulgamos <span class="highlighted">narrativas transformadoras</span>.</p>

<h2 class="asub">Quem somos</h2>
<div class="apeople">
  <div class="aperson">
    <h3>Renato Fabbri</h3>
    <p class="arole">Físico · Arquiteto de software · Compositor</p>
    <p>Renato conduz a pesquisa e a arquitetura dos projetos da iniciativa. Sua trajetória inclui um mestrado em Física Aplicada sobre a descrição psicofísica da música em áudio digital, um doutorado em Física Computacional, trabalho em software livre como a biblioteca <a href="https://pypi.org/project/music/">Music</a> e mais de vinte anos de prática com sincronização de ondas cerebrais (brainwave entrainment) e respiração de ressonância.</p>
    <p><a href="https://ttm.github.io/">ttm.github.io</a></p>
  </div>
  <div class="aperson">
    <h3>Riccardo Berti</h3>
    <p class="arole">Desenvolvedor líder · Engenharia de produto · Músico</p>
    <p>Riccardo conduz grande parte do desenvolvimento do aplicativo BioSynCare, de seus lançamentos e do suporte diário aos usuários, transformando ideias de protocolo em um produto estável e trazendo um ouvido de músico para o som e a sensação das sessões.</p>
  </div>
</div>

<h2 class="asub">Comunidades anteriores</h2>
<p>A iniciativa também reuniu pessoas nos grupos do Facebook <a href="https://www.facebook.com/groups/arcturianart">Arcturian Art</a> e <a href="https://www.facebook.com/groups/mentaliz">Mentaliz</a>, e em um grupo de WhatsApp. Essas comunidades não estão mais ativas; permanecem como parte da nossa história.</p>

<p>Convidamos você a se juntar a nós nesta jornada. Sua participação é inestimável, e esperamos compartilhar cada passo com você.</p>
<div class="about-cta">
  <a class="abtn abtn--primary ae-involve" href="mailto:aeterni.anima@gmail.com?subject=Quero%20participar">Envolva-se</a>
  <a class="abtn" href="./?lang=pt#projetos">Conheça os projetos</a>
</div>`

e.about2 = () => {
  page(`
  <style>
  .highlighted {
    color: var(--accent);
    font-weight: 600;
  }
  .about-lead { font-size: 1.1rem; }
  .about-cta { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 12px; margin: 1.8em 0 1.2em; }
  .acard .apeople { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin: 0.8em 0 1.6em; }
  @media (max-width: 620px) { .acard .apeople { grid-template-columns: minmax(0, 1fr); } }
  .aperson { border: 1px solid var(--card-border); border-radius: 16px; padding: 18px 20px; background: rgba(184, 149, 48, 0.05); }
  .acard .aperson h3 { margin: 0; font-family: var(--serif); font-size: 1.45rem; font-weight: 600; line-height: 1.15; }
  .aperson .arole { margin: 0.2em 0 0.7em; font-size: 0.74rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); }
  .aperson p { margin: 0 0 0.6em; }
</style>
${pt() ? aboutPt() : aboutEn()}
<p style="text-align:center;color:var(--ink-soft)">:::</p>
  `)
  involve()
  ready()
}

e.daimesm = () => {
  // [code, label, published embed URL ('' = not yet published), commentable doc URL]
  const langs = [
    ['en', 'English', 'https://docs.google.com/document/d/e/2PACX-1vSCJqlSpPE8OyAo-I2xdEl1DhlPwf9aHd7aRsWPHxC4WNX18YgL5oUA35G4wP8Hk6VLlfBV8a5lt16O/pub?embedded=true', 'https://docs.google.com/document/d/1ycexORBC5poOGM5TrGsht8NbWv0yU_0zsGAnRzHqo_A/edit'],
    ['pt', 'Português', 'https://docs.google.com/document/d/e/2PACX-1vThmHtC_yOpTkvSU6VwNFgCxzYXlHQ8wSmjybWaO6f1IoRUaxqDORew3wuksNiYPAt7S7AKi5vyCkGU/pub?embedded=true', 'https://docs.google.com/document/d/1K3sc0B19SniNYUGnO1kqnoWfuqc1lvKdjCAxzs4OZl0/edit'],
    ['it', 'Italiano', 'https://docs.google.com/document/d/e/2PACX-1vTEYxSd69ObcqKcwcs1RgTzOna7hPZfMLOkob4D-A522TADpWKZd6BK_E6hD7YpHiVx5hJIElI3n3MI/pub?embedded=true', 'https://docs.google.com/document/d/1WrAOawnLW0FZd5-ubCo6HH5u1TiQG5TkR1O2nZPHSnQ/edit']
  ]
  const buttons = langs.map(l => `<button type="button" class="dsm-lang" data-lang="${l[0]}" lang="${l[0]}" aria-pressed="false">${l[1]}</button>`).join('')
  const title = tr('Daimist Science Manifesto', 'Manifesto da Ciência Daimista')
  page(`
  <style>
    .dsm-intro { text-align: center; color: var(--ink-soft); max-width: 34em; margin: 0.4em auto 1.4em; }
    .dsm-langs { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 1.1em; }
    .dsm-lang {
      font-family: var(--sans); font-size: 0.95rem; cursor: pointer;
      padding: 7px 16px; border-radius: 999px;
      border: 1px solid var(--card-border); background: var(--bg); color: var(--ink);
      transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
    }
    .dsm-lang:hover { border-color: var(--accent-soft); color: var(--accent); }
    .dsm-lang.is-active { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
    .dsm-frame-wrap {
      position: relative;
      border: 1px solid var(--card-border); border-radius: 12px; overflow: hidden;
      background: #fff; box-shadow: var(--shadow);
    }
    .dsm-frame-wrap iframe { position: relative; display: block; width: 100%; height: min(78vh, 900px); border: 0; }
    /* Google takes a moment to send the document: until then, say so */
    .dsm-frame-wrap::before {
      content: attr(data-loading); position: absolute; inset: 0; padding-top: 4em; text-align: center;
      font-size: 0.95rem; color: #6b675f;
    }
    .dsm-frame-wrap:not(.is-loaded) iframe { opacity: 0; }
    .dsm-frame-wrap.is-loaded::before { content: none; }
    .dsm-pending { padding: 2.6em 1.5em; text-align: center; color: var(--ink-soft); }
    .dsm-comment { text-align: center; margin-top: 1.1em; color: var(--ink-soft); }
  </style>

  <header class="apage-head">
    ${mark()}
    <h1>${title}</h1>
  </header>
  <p class="dsm-intro">${tr('Read the manifesto below, or open it in Google&nbsp;Docs to leave comments and contribute.', 'Leia o manifesto abaixo ou abra-o no Google&nbsp;Docs para deixar comentários e contribuir.')}</p>

  <div class="dsm-langs">${buttons}</div>

  <div id="dsm-view" class="dsm-frame-wrap" data-loading="${tr('Loading the manifesto…', 'Carregando o manifesto…')}"></div>

  <p class="dsm-comment"><a id="dsm-edit" href="#" target="_blank" rel="noopener">${tr('Open this version in Google Docs to comment', 'Abra esta versão no Google Docs para comentar')} &#8599;</a></p>
  <p style="text-align:center;color:var(--ink-soft)">:::</p>
  `)

  const byLang = {}
  langs.forEach(l => { byLang[l[0]] = { label: l[1], pub: l[2], edit: l[3] } })

  // The published embed keeps the document's page margins, which leave a phone a
  // column a few words wide; Google's mobile view of the same document reflows instead.
  const narrow = window.matchMedia('(max-width: 640px)')
  const view = document.getElementById('dsm-view')
  const langButtons = document.querySelectorAll('.dsm-lang')
  let current = pt() ? 'pt' : 'en'
  const show = code => {
    current = code
    const d = byLang[code]
    langButtons.forEach(button => {
      button.classList.toggle('is-active', button.dataset.lang === code)
      button.setAttribute('aria-pressed', button.dataset.lang === code)
    })
    view.classList.remove('is-loaded')
    if (d.pub) {
      const src = narrow.matches ? d.edit.replace(/\/edit.*$/, '/mobilebasic') : d.pub
      view.innerHTML = `<iframe src="${src}" title="${title} (${d.label})"></iframe>`
      view.querySelector('iframe').addEventListener('load', () => view.classList.add('is-loaded'))
    } else {
      view.innerHTML = `<div class="dsm-pending">${tr(`The ${d.label} version is open for reading and comments in Google Docs — use the link below.`, `A versão (${d.label}) está aberta para leitura e comentários no Google Docs — use o link abaixo.`)}</div>`
      view.classList.add('is-loaded')
    }
    document.getElementById('dsm-edit').href = d.edit
  }

  langButtons.forEach(button => button.addEventListener('click', () => show(button.dataset.lang)))
  narrow.addEventListener('change', () => show(current))
  show(current)

  ready()
}

const bitcoinWallet = 'bc1qjw72xa6c8c924j8aj8y737q56let8envx4j0xd'

// The wallet's address, with a button that copies it. The QR codes are SVG, sharp at any
// size; the Bitcoin one holds a bitcoin: link, which a phone's camera offers to open in
// a wallet app. They were made with `npx qrcode@1.5.4 -t svg -e M -q 2 -o <file> <text>`
// (the PayPal one encodes the form below as a link); check any new one by scanning it.
const wallet = () => `<p class="awallet"><code>${bitcoinWallet}</code><button type="button" class="acopy" aria-live="polite">${tr('Copy', 'Copiar')}</button></p>`
const qr = (name, alt) => `<img class="aqr" src="assets/donation/qr-${name}.svg" width="128" height="128" alt="${alt}">`
const qrPaypal = () => qr('paypal', tr('QR code for donating through PayPal', 'Código QR para doar pelo PayPal'))
const qrBitcoin = () => qr('bitcoin', tr('QR code of the Bitcoin wallet', 'Código QR da carteira de Bitcoin'))

const copyWallet = () => document.querySelectorAll('.acopy').forEach(button => {
  button.addEventListener('click', () => {
    const copied = () => {
      button.textContent = tr('Copied', 'Copiado')
      setTimeout(() => { button.textContent = tr('Copy', 'Copiar') }, 2400)
    }
    // without the clipboard, select the address, ready to copy by hand
    const select = () => window.getSelection().selectAllChildren(button.previousElementSibling)
    if (navigator.clipboard) navigator.clipboard.writeText(bitcoinWallet).then(copied, select)
    else select()
  })
})

e.angel = () => {
  // PagSeguro's donation button stopped working when it became PagBank
  page(`
  <style>
    .agive { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin: 1.6em 0; }
    @media (max-width: 620px) { .agive { grid-template-columns: minmax(0, 1fr); } }
    .agive-opt { border: 1px solid var(--card-border); border-radius: 16px; padding: 18px 20px; background: rgba(184, 149, 48, 0.05); }
    .agive-opt--wide { grid-column: 1 / -1; }
    .acard .agive-opt h2 { font-size: 1.4rem; margin: 0 0 0.2em; }
    .agive-opt p { margin: 0 0 0.5em; }
    .agive-opt .aqr { margin: 0.6em 0; }
    .agive-cta { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 12px; margin: 1.4em 0 1.2em; }
  </style>
  <header class="apage-head">
    ${mark()}
    <h1>${tr('Support Æterni Anima', 'Apoie a Æterni Anima')}</h1>
    <p class="apage-lead">${tr('Your support keeps these projects alive and growing. Every gift, of any size, makes a difference.', 'Seu apoio mantém estes projetos vivos e crescendo. Toda doação, de qualquer valor, faz diferença.')}</p>
  </header>

  <div class="agive">
    <div class="agive-opt">
      <h2>PayPal</h2>
      <p>${tr('Give any amount by card or through PayPal.', 'Doe qualquer valor com cartão ou pelo PayPal.')}</p>
      ${qrPaypal()}
      <p>${link(tr('Donate with PayPal', 'Doar com PayPal'), 'paypal')}</p>
    </div>
    <div class="agive-opt">
      <h2>Bitcoin</h2>
      <p>${tr('Send any amount to our wallet:', 'Envie qualquer valor para a nossa carteira:')}</p>
      ${qrBitcoin()}
      ${wallet()}
    </div>
    <div class="agive-opt agive-opt--wide">
      <h2>${tr('Bank transfer and other coins', 'Transferência bancária e outras moedas')}</h2>
      <p>${tr('Write to us for a direct bank transfer, or to give in Ethereum or another currency.', 'Escreva para nós para uma transferência bancária direta, ou para doar em Ethereum ou em outra moeda.')}</p>
      <p><a href="mailto:aeterni.anima@gmail.com">aeterni.anima@gmail.com</a></p>
    </div>
  </div>

  <h2 class="asub">${tr('Give your time and ideas', 'Doe seu tempo e suas ideias')}</h2>
  <p>${tr('Send us feedback on your experience with Æterni and ideas for enhancements or derivatives, or join the coordination, creation and tech tasks.', 'Envie-nos comentários sobre sua experiência com a Æterni e ideias de melhorias ou de novos desdobramentos, ou junte-se às tarefas de coordenação, criação e tecnologia.')}</p>
  <div class="agive-cta">
    <a class="abtn abtn--primary ae-involve" href="mailto:aeterni.anima@gmail.com">${tr('Ways to take part', 'Formas de participar')}</a>
    <a class="abtn" href="mailto:aeterni.anima@gmail.com">${tr('Write to us', 'Escreva para nós')}</a>
  </div>
  <p style="text-align:center">${tr('Thank you.', 'Obrigado.')}</p>
  `)
  involve()
  copyWallet()
  document.querySelectorAll('canvas').forEach(canvas => { canvas.style.display = 'none' })
  ready()
}

// shared by the PayPal and Bitcoin pages
const payStyle = `<style>
  .apay { text-align: center; }
  .apay form { margin: 1.2em 0 1.6em; }
  .apay .aqr { margin: 0.6em auto 1em; }
  .apay .awallet { justify-content: center; }
  .apay .aback { margin-top: 1.6em; }
</style>`

e.paypal = () => {
  // our own button, not PayPal's image and tracking pixel: nothing reaches PayPal
  // until the visitor chooses to donate
  page(`
  ${payStyle}
  <header class="apage-head">
    ${mark()}
    <h1>${tr('Donate with PayPal', 'Doe com PayPal')}</h1>
    <p class="apage-lead">${tr('Give any amount, by card or with your PayPal account.', 'Doe qualquer valor, com cartão ou com sua conta PayPal.')}</p>
  </header>
  <div class="apay">
  <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
    <input type="hidden" name="cmd" value="_donations" />
    <input type="hidden" name="business" value="CWRTXTJF9C3N6" />
    <input type="hidden" name="currency_code" value="BRL" />
    <button type="submit" class="abtn abtn--primary">${tr('Donate with PayPal', 'Doar com PayPal')}</button>
  </form>
  <p class="amute">${tr('Or scan this code with your phone:', 'Ou escaneie este código com o celular:')}</p>
  ${qrPaypal()}
  <p class="aback">${link(tr('← All the ways to support Æterni Anima', '← Todas as formas de apoiar a Æterni Anima'), 'angel')}</p>
  </div>
  `)
  ready()
}

e.bitcoin = () => {
  page(`
  ${payStyle}
  <header class="apage-head">
    ${mark()}
    <h1>${tr('Donate with Bitcoin', 'Doe com Bitcoin')}</h1>
    <p class="apage-lead">${tr('Send any amount to our wallet.', 'Envie qualquer valor para a nossa carteira.')}</p>
  </header>
  <div class="apay">
  ${wallet()}
  ${qrBitcoin()}
  <p class="aback">${link(tr('← All the ways to support Æterni Anima', '← Todas as formas de apoiar a Æterni Anima'), 'angel')}</p>
  </div>
  `)
  copyWallet()
  ready()
}

},{"./ui.js":4}],3:[function(require,module,exports){
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

},{"./ui.js":4}],4:[function(require,module,exports){
// The dialog that every "Get involved" button opens, and its texts. It is plain DOM, so
// the small bundle needs no jQuery; utils.js re-exports these for the full bundle, whose
// older routes also reach into #myModal and #mcontent directly, so the dialog keeps
// that structure.
const e = module.exports

const pt = () => document.documentElement.classList.contains('lang-pt')

// the address of this same page in another language ('en' or 'pt')
e.langHref = code => '?' + window.location.search.slice(1).split('&')
  .filter(p => p && !p.startsWith('lang='))
  .concat(`lang=${code}`).join('&')

const groups = `<a href="https://www.facebook.com/groups/arcturianart" target="_blank">AAA</a>,
<a href="https://www.facebook.com/groups/mentaliz" target="_blank">MMM</a>,
<a href="https://chat.whatsapp.com/BztLyvWDEgW3C1mjXZTTrP" target="_blank">WM</a>`

const sstimGroup = '<a href="https://www.w3.org/groups/cg/sstim/" target="_blank">W3C Sensory Stimulation Vocabulary Community Group</a>'
const sstimFix = label => `<a href="https://w3c-cg.github.io/sstim/contribute/" target="_blank">${label}</a>`

// Æterni's dialog, in the page's language (set in index.html's head as html.lang-pt).
e.stdMsg2 = () => {
  if (pt()) {
    return `
    <h2>Envolva-se com a Æterni Anima</h2>
    <p>Toda contribuição conta, e há muitas formas de participar:</p>
    <ul>
        <li><strong>Conte sua experiência:</strong> diga-nos como as sessões e as ferramentas têm afetado você, e convide outros a fazerem o mesmo.</li>
        <li><strong>Crie e compartilhe:</strong> produza artefatos audiovisuais e distribua-os, enriquecendo o que temos a oferecer.</li>
        <li><strong>Amplie o círculo:</strong> aproxime parceiros, colaboradores e pessoas afins que possam se interessar por este trabalho.</li>
        <li><strong>Reúna pessoas:</strong> leve estas práticas ao seu grupo ou à sua comunidade, e conte para nós como foi.</li>
        <li><strong>Contribua com o conhecimento aberto:</strong> participe do ${sstimGroup} ou ${sstimFix('sugira uma correção ao SSTIM')}.</li>
        <li><strong>Apoie a iniciativa:</strong> <a href="?angel&amp;lang=pt">contribua financeiramente</a> ou ofereça seu tempo e suas habilidades.</li>
        <li><strong>Mantenha contato:</strong> envie suas ideias e sugestões — elas orientam os próximos passos.</li>
    </ul>
    <p>Até o menor gesto faz diferença. Obrigado.</p>
    `
  }
  return `
  <h2>Get involved with Æterni Anima</h2>
  <p>Every contribution counts, and there are many ways to take part:</p>
  <ul>
      <li><strong>Share your experience:</strong> tell us how the sessions and tools have affected you, and invite others to do the same.</li>
      <li><strong>Create and share:</strong> make audiovisual artifacts and pass them on, enriching what we can offer.</li>
      <li><strong>Widen the circle:</strong> introduce partners, collaborators and kindred spirits who might care about this work.</li>
      <li><strong>Gather people:</strong> bring these practices to your own group or community, and tell us how it goes.</li>
      <li><strong>Shape open knowledge:</strong> join the ${sstimGroup}, or ${sstimFix('suggest a correction to SSTIM')}.</li>
      <li><strong>Support the initiative:</strong> <a href="?angel">contribute financially</a> or lend your time and skills.</li>
      <li><strong>Stay in touch:</strong> send us your thoughts and suggestions — they shape where this goes next.</li>
  </ul>
  <p>Even the smallest gesture makes a difference. Thank you.</p>
  `
}

e.stdMsg = () => {
  if (['aeterni.github.io', 'localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return e.stdMsg2()
  }
  if (window.wand.country === 'BR') {
    return `

<h2>Fortaleça o seu Corpo de Luz</h2>

algumas ideias:

<ul>
<li>escreva relatando como tem sido as sessões para você: elas tem te ajudado? De que forma?</li>
<li>Incentive outros membros a escreverem relatos das experiências deles.</li>
<li>Traga pessoas para vibrarem no Corpo de Luz.</li>
<li>Ajude a manter/gerir um dos grupos existentes (e.g. ${groups}).</li>
<li>Crie um novo grupo.</li>
<li>Crie Artefatos Audiovisuais para serem usados nas sessões.</li>
<li>Aproxime uma pessoa ou entidade que possa ter interesse especial na iniciativa.</li>
<li>Gere mídia sobre o Corpo de Luz (postagens, artigos jornalísticos...).</li>
<li>Divulgue sobre o grupo ou trabalho.</li>
<li>Doe ou ajude a arrecadar financeiramente (veja <a href="?angel" target="_blank">as formas de contribuir</a>).</li>
<li>Ore para o Corpo de Luz e para o mundo.</li>
<li>Cuide-se muito bem.</li>
<li>Sugira mudanças sobre como conduzir o Corpo de Luz.</li>
</ul>

Faça contato!<br>
Luz e Paz ~
`
  }
  return `
<div id="main-content" class="wiki-content group">
  <h1 id="Contact-nuova-Getintouch">Get in touch</h1><p>Some ways to help:</p><ul><li><p><strong>Get in touch to share ideas and ask questions:</strong> we’d love to know from you what works better and what can be improved.</p></li><li><p><strong>Share your sequences: </strong>we offer a few sequences to show how it works, but the potential of Audiovisual medicine is huge. If you’ve found a sequence you want to share, please do and we may credit you and put your sequence online for everyone to benefit.</p></li><li><p><strong>Do it together:</strong> Audiovisual Medicine works great when you’re alone, but works even better when done in group. Try it during your yoga or meditation group session, or in your study group.</p></li><li><p><strong>Share it:</strong> with someone or a group that could benefit from AM sessions. Share it online and among your friends and coworkers!</p></li><li><p><strong>Fund it:</strong> yourself or put us in contact with an organization that can fund AM.
  <li><strong>Something else:</strong> We’re always looking for new means to spread the benefits of Audiovisual Medicine</p></li></ul>
</div>
`
}

const node = (tag, props, html) => {
  const n = Object.assign(document.createElement(tag), props)
  if (html !== undefined) n.innerHTML = html
  return n
}

e.mkModal = content => {
  const ptLang = pt()
  // Escape, the close button and a click outside all close it; Tab stays inside it while
  // it is open; and focus goes back to whatever opened it, so the dialog works from a
  // keyboard as well as a mouse.
  let opener = null
  const modal = node('div', { id: 'myModal', className: 'modal' })
  modal.setAttribute('role', 'dialog')
  modal.setAttribute('aria-modal', 'true')
  modal.setAttribute('aria-labelledby', 'mtitle')
  const visible = () => modal.getClientRects().length > 0
  const hide = () => {
    modal.style.display = 'none'
    if (opener && document.contains(opener)) opener.focus()
    opener = null
  }
  const close = node('button', { type: 'button', className: 'close' }, '&times;')
  close.setAttribute('aria-label', ptLang ? 'Fechar' : 'Close')
  close.addEventListener('click', hide)
  const box = node('div', { className: 'modal-content' })
  box.append(close, node('p', { id: 'mcontent' }, content || e.stdMsg()), node('p', { id: 'mfeedback' }))
  modal.append(box)
  document.body.append(modal)
  window.onclick = function (event) {
    if (event.target === modal) hide()
  }
  document.addEventListener('keydown', event => {
    if (!visible()) return
    if (event.key === 'Escape') return hide()
    if (event.key !== 'Tab') return
    const stops = [...box.querySelectorAll('a[href], button, textarea')].filter(n => n.getClientRects().length)
    const first = stops[0]
    const last = stops[stops.length - 1]
    const inside = box.contains(document.activeElement)
    if (event.shiftKey && (!inside || document.activeElement === first)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && (!inside || document.activeElement === last)) {
      event.preventDefault()
      first.focus()
    }
  })
  // feedback is sent by email: the former database backend (mongodb stitch) is gone.
  const contactMail = 'aeterni.anima@gmail.com'
  const descArea = node('textarea', {
    maxLength: 3200,
    placeholder: ptLang ? 'Compartilhe seus comentários ou suas ideias…' : 'Share your feedback or ideas…'
  })
  descArea.setAttribute('aria-label', ptLang ? 'Seus comentários' : 'Your feedback')
  const send = node('button', { type: 'button' }, ptLang ? 'Enviar comentários' : 'Send feedback')
  send.style.margin = '1%'
  send.addEventListener('click', () => {
    const text = descArea.value.trim()
    if (!text) return descArea.focus()
    const subject = encodeURIComponent(ptLang ? 'Comentários — Æterni Anima' : 'Feedback — Æterni Anima')
    window.location.href = `mailto:${contactMail}?subject=${subject}&body=${encodeURIComponent(text)}`
  })
  const note = node('p', {}, ptLang
    ? `Isto abre o seu aplicativo de e-mail. Você também pode escrever para <a href="mailto:${contactMail}">${contactMail}</a>.`
    : `This opens your email app. You can also write to <a href="mailto:${contactMail}">${contactMail}</a>.`)
  note.style.cssText = 'font-size: 0.92rem; margin-top: 0.6em'
  document.getElementById('mfeedback').append(descArea, send, note)
  return {
    show: (ms, msg) => {
      const text = document.getElementById('mcontent')
      text.innerHTML = msg || e.stdMsg()
      const title = text.querySelector('h2')
      if (title) title.id = 'mtitle'
      opener = document.activeElement
      modal.style.display = 'block'
      // a fade, as jQuery's fadeIn gave it ('slow' was 600 ms); older routes pass their own
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (modal.animate) modal.animate([{ opacity: 0 }, { opacity: 1 }], { duration: still ? 0 : ms || 600 })
      close.focus()
    },
    hide
  }
}

},{}]},{},[1]);

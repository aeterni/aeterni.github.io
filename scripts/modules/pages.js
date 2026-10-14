/* global wand */
// The site's curated pages: the landing's wiring, About, the Daimist Science
// Manifesto, and the support, PayPal and Bitcoin pages. They need jQuery and a few
// helpers only, so the small bundle (scripts/light.js) serves them on its own; test.js
// re-exports them, and the full bundle routes them as before.
const $ = require('jquery')
const utils = require('./utils.js')

const e = module.exports

const link = (text, path) => {
  const ua = wand.router.urlArgument
  const lflag = ua('lang') ? `&lang=${ua('lang')}` : ''
  return `<a href="?${path + lflag}">${text}</a>`
}

// The landing is static HTML in index.html (main#ae-home), so it shows before this
// bundle arrives and without JavaScript. Here it only gains its dialog buttons, whose
// hrefs (#take-part, a mailto) are what a reader without JavaScript follows instead.
e.welcome2 = () => {
  document.documentElement.classList.remove('ae-route') // e.g. after a stripped ?fbclid
  document.documentElement.classList.add('ae-home')
  // #contribL is the footer's link to the same dialog; ids must not repeat
  $('#fundUsL, #joinL').on('click', () => {
    window.wand.modal.show()
    return false
  })
  $('#loading').hide()
}

e.about2 = () => {
  utils.stdDiv().html(`
  <style>
  .highlighted {
    color: var(--accent);
    font-weight: 600;
  }
  .about-lead { font-size: 1.1rem; }
  .about-cta { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 12px; margin: 1.8em 0 1.2em; }
</style>
<header class="apage-head">
  <p class="amark notranslate" aria-hidden="true">Æ</p>
  <h2>About Æterni Anima</h2>
</header>
<p class="about-lead"><strong>Æterni Anima</strong> is an initiative established in December 2020 to promote <span class="highlighted">extended longevity</span> through <span class="highlighted">non-invasive</span> improvements to health and performance. We integrate science, art and technology to foster <span class="highlighted">well-being</span> across a range of endeavors.</p>

<p>Our flagship, <a href="https://biosyncare.com/">BioSynCare</a> (formerly Audiovisual Medicine), advances <span class="highlighted">sensory stimulation</span> for non-invasive neuromodulation of health, well-being and performance, through breathing and sound: an app of carefully composed sessions for focus, relaxation, meditation and sleep preparation.</p>

<p>We also contribute to <a href="https://w3c-cg.github.io/sstim/">SSTIM</a>, the Sensory Stimulation Vocabulary: an <span class="highlighted">open, evolving reference</span> that connects research, technology and AI through citable identifiers, precise descriptions and transparent evidence. It is developed through the <a href="https://www.w3.org/groups/cg/sstim/">W3C Sensory Stimulation Vocabulary Community Group</a>, and BioSynCare adopts it. Its open reference app, <a href="https://w3c-cg.github.io/sstim/about/">SSTIM Workbench</a> (formerly BSC Lab), lets anyone build sensory-stimulation patches in Patch Studio and examine the knowledge behind them.</p>

<p>Around this work we cultivate tools for <a href="https://pypi.org/project/music/">musical synthesis</a>, for harnessing one's own social networks, and for registering insights and distilling knowledge. Within the Santo Daime community, the <a href="?daimesm">Daimist Science Manifesto</a> guides work that unites scientific rigor with spiritual wisdom, from textual analyses of the hymnals in <a href="https://da1me.github.io/">Da1me</a> to <a href="https://saoirineu.github.io/">São Irineu</a>, ICEFLU Europe's online portal.</p>

<p>Through our <strong>publishing activity</strong>, we curate and disseminate <span class="highlighted">transformative narratives</span>.</p>

<p>We invite you to join us on this journey. Your participation is invaluable, and we look forward to sharing each step with you.</p>
<div class="about-cta">
  <a class="abtn abtn--primary" id="aboutJoinL" href="">Get involved</a>
  <a class="abtn" href="./#projects">Explore the projects</a>
</div>
<p style="text-align:center;color:var(--ink-soft)">:::</p>
  `)
  $('#aboutJoinL').on('click', () => {
    window.wand.modal.show()
    return false
  })
  $('#loading').hide()
}

e.daimesm = () => {
  // [code, label, published embed URL ('' = not yet published), commentable doc URL]
  const langs = [
    ['en', 'English', 'https://docs.google.com/document/d/e/2PACX-1vSCJqlSpPE8OyAo-I2xdEl1DhlPwf9aHd7aRsWPHxC4WNX18YgL5oUA35G4wP8Hk6VLlfBV8a5lt16O/pub?embedded=true', 'https://docs.google.com/document/d/1ycexORBC5poOGM5TrGsht8NbWv0yU_0zsGAnRzHqo_A/edit'],
    ['pt', 'Português', 'https://docs.google.com/document/d/e/2PACX-1vThmHtC_yOpTkvSU6VwNFgCxzYXlHQ8wSmjybWaO6f1IoRUaxqDORew3wuksNiYPAt7S7AKi5vyCkGU/pub?embedded=true', 'https://docs.google.com/document/d/1K3sc0B19SniNYUGnO1kqnoWfuqc1lvKdjCAxzs4OZl0/edit'],
    ['it', 'Italiano', 'https://docs.google.com/document/d/e/2PACX-1vTEYxSd69ObcqKcwcs1RgTzOna7hPZfMLOkob4D-A522TADpWKZd6BK_E6hD7YpHiVx5hJIElI3n3MI/pub?embedded=true', 'https://docs.google.com/document/d/1WrAOawnLW0FZd5-ubCo6HH5u1TiQG5TkR1O2nZPHSnQ/edit']
  ]
  const buttons = langs.map(l => `<button type="button" class="dsm-lang" data-lang="${l[0]}">${l[1]}</button>`).join('')
  utils.stdDiv().html(`
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
    .dsm-lang.is-active { background: var(--accent); border-color: var(--accent); color: #fff; }
    .dsm-frame-wrap {
      border: 1px solid var(--card-border); border-radius: 12px; overflow: hidden;
      background: #fff; box-shadow: var(--shadow);
    }
    .dsm-frame-wrap iframe { display: block; width: 100%; height: min(78vh, 900px); border: 0; }
    .dsm-pending { padding: 2.6em 1.5em; text-align: center; color: var(--ink-soft); }
    .dsm-comment { text-align: center; margin-top: 1.1em; color: var(--ink-soft); }
  </style>

  <header class="apage-head">
    <p class="amark notranslate" aria-hidden="true">Æ</p>
    <h1>Daimist Science Manifesto</h1>
  </header>
  <p class="dsm-intro">Read the manifesto below, or open it in Google&nbsp;Docs to leave comments and contribute.</p>

  <div class="dsm-langs">${buttons}</div>

  <div id="dsm-view" class="dsm-frame-wrap"></div>

  <p class="dsm-comment"><a id="dsm-edit" href="#" target="_blank" rel="noopener">Open this version in Google Docs to comment &#8599;</a></p>
  <p style="text-align:center;color:var(--ink-soft)">:::</p>
  `)

  const byLang = {}
  langs.forEach(l => { byLang[l[0]] = { label: l[1], pub: l[2], edit: l[3] } })

  // The published embed keeps the document's page margins, which leave a phone a
  // column a few words wide; Google's mobile view of the same document reflows instead.
  const narrow = window.matchMedia('(max-width: 640px)')
  let current = 'en'
  const show = code => {
    current = code
    const d = byLang[code]
    $('.dsm-lang').removeClass('is-active').filter(`[data-lang="${code}"]`).addClass('is-active')
    if (d.pub) {
      const src = narrow.matches ? d.edit.replace(/\/edit.*$/, '/mobilebasic') : d.pub
      $('#dsm-view').html(`<iframe src="${src}" title="Daimist Science Manifesto (${d.label})"></iframe>`)
    } else {
      $('#dsm-view').html(`<div class="dsm-pending">The ${d.label} version is open for reading and comments in Google Docs — use the link below.</div>`)
    }
    $('#dsm-edit').attr('href', d.edit)
  }

  $('.dsm-lang').on('click', function () { show($(this).data('lang')) })
  narrow.addEventListener('change', () => show(current))
  show('en')

  $('#loading').hide()
}

const bitcoinWallet = 'bc1qjw72xa6c8c924j8aj8y737q56let8envx4j0xd'

e.angel = () => {
  // PagSeguro's donation button stopped working when it became PagBank
  utils.stdDiv().html(`
  <style>
    .agive { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin: 1.6em 0; }
    @media (max-width: 620px) { .agive { grid-template-columns: minmax(0, 1fr); } }
    .agive-opt { border: 1px solid var(--card-border); border-radius: 16px; padding: 18px 20px; background: rgba(184, 149, 48, 0.05); }
    .agive-opt--wide { grid-column: 1 / -1; }
    .acard .agive-opt h3 { font-size: 1.4rem; margin: 0 0 0.2em; }
    .agive-opt p { margin: 0 0 0.5em; }
    .agive-opt img { display: block; width: 128px; height: 128px; margin: 0.6em 0; border-radius: 10px; border: 1px solid var(--card-border); background: #fff; image-rendering: pixelated; } /* half of 256: QR modules stay crisp */
    .agive-opt code { font-size: 0.82rem; word-break: break-all; }
    .agive-cta { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 12px; margin: 1.4em 0 1.2em; }
  </style>
  <header class="apage-head">
    <p class="amark notranslate" aria-hidden="true">Æ</p>
    <h2>Support Æterni Anima</h2>
    <p class="apage-lead">Your support keeps these projects alive and growing. Every gift, of any size, makes a difference.</p>
  </header>

  <div class="agive">
    <div class="agive-opt">
      <h3>PayPal</h3>
      <p>Give any amount by card or through PayPal.</p>
      <img src="assets/donation/qrPaypal.png" alt="QR code for donating through PayPal">
      <p>${link('Donate with PayPal', 'paypal')}</p>
    </div>
    <div class="agive-opt">
      <h3>Bitcoin</h3>
      <p>Send any amount to our wallet:</p>
      <img src="assets/donation/qrBitcoin.png" alt="QR code of the Bitcoin wallet">
      <p><code>${bitcoinWallet}</code></p>
    </div>
    <div class="agive-opt agive-opt--wide">
      <h3>Bank transfer and other coins</h3>
      <p>Write to us for a direct bank transfer, or to give in Ethereum or another currency.</p>
      <p><a href="mailto:aeterni.anima@gmail.com">aeterni.anima@gmail.com</a></p>
    </div>
  </div>

  <h3>Give your time and ideas</h3>
  <p>Send us feedback on your experience with Æterni and ideas for enhancements or derivatives, or join the coordination, creation and tech tasks.</p>
  <div class="agive-cta">
    <a class="abtn abtn--primary" id="angelJoinL" href="">Ways to take part</a>
    <a class="abtn" href="mailto:aeterni.anima@gmail.com">Write to us</a>
  </div>
  <p style="text-align:center">Thank you.</p>
  `)
  $('#angelJoinL').on('click', () => {
    window.wand.modal.show()
    return false
  })
  $('canvas').hide()
  $('#loading').hide()
}

// shared by the PayPal and Bitcoin pages
const payStyle = `<style>
  .apay { text-align: center; }
  .apay form { margin: 1em 0 1.4em; }
  .apay .aqr { display: block; width: 128px; height: 128px; margin: 0.6em auto 1em; border-radius: 10px; border: 1px solid var(--card-border); background: #fff; image-rendering: pixelated; }
  .apay code { font-size: 0.9rem; word-break: break-all; }
  .apay .aback { margin-top: 1.6em; }
</style>`

e.paypal = () => {
  utils.stdDiv().html(`
  ${payStyle}
  <header class="apage-head">
    <p class="amark notranslate" aria-hidden="true">Æ</p>
    <h2>Donate with PayPal</h2>
    <p class="apage-lead">Give any amount, by card or with your PayPal account.</p>
  </header>
  <div class="apay">
  <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
    <input type="hidden" name="cmd" value="_donations" />
    <input type="hidden" name="business" value="CWRTXTJF9C3N6" />
    <input type="hidden" name="currency_code" value="BRL" />
    <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
    <img alt="" border="0" src="https://www.paypal.com/pt_BR/i/scr/pixel.gif" width="1" height="1" />
  </form>
  <p class="amute">Or scan this code with your phone:</p>
  <img class="aqr" src="assets/donation/qrPaypal.png" alt="QR code for donating through PayPal">
  <p class="aback">${link('← All the ways to support Æterni Anima', 'angel')}</p>
  </div>
  `)
  $('#loading').hide()
}

e.bitcoin = () => {
  utils.stdDiv().html(`
  ${payStyle}
  <header class="apage-head">
    <p class="amark notranslate" aria-hidden="true">Æ</p>
    <h2>Donate with Bitcoin</h2>
    <p class="apage-lead">Send any amount to our wallet.</p>
  </header>
  <div class="apay">
  <p><code>${bitcoinWallet}</code></p>
  <img class="aqr" src="assets/donation/qrBitcoin.png" alt="QR code of the Bitcoin wallet">
  <p class="aback">${link('← All the ways to support Æterni Anima', 'angel')}</p>
  </div>
  `)
  $('#loading').hide()
}

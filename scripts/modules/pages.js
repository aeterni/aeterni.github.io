/* global wand */
// The site's curated pages: the landing's wiring, About, the Daimist Science
// Manifesto, and the support, PayPal and Bitcoin pages. They need jQuery and a few
// helpers only, so the small bundle (scripts/light.js) serves them on its own; test.js
// re-exports them, and the full bundle routes them as before.
const $ = require('jquery')
const utils = require('./utils.js')

const e = module.exports

// Each page is written in English and Portuguese. Which one shows is decided in
// index.html's head (html.lang-pt), from ?lang=, the visitor's earlier choice or the
// browser; Portuguese pages keep lang=pt in their links.
const pt = () => document.documentElement.classList.contains('lang-pt')
const tr = (en, ptText) => pt() ? ptText : en

const link = (text, path) => `<a href="?${path}${pt() ? '&amp;lang=pt' : ''}">${text}</a>`

// the Æ that heads each page, leading home
const mark = () => `<p class="amark notranslate"><a href="${pt() ? './?lang=pt' : './'}" aria-label="${tr('Æterni Anima home page', 'Página inicial da Æterni Anima')}">Æ</a></p>`

// every "Get involved" button opens the dialog; its href is what a reader without
// JavaScript follows instead
const involve = () => $('.ae-involve').on('click', () => {
  wand.modal.show()
  return false
})

// The landing is static HTML in index.html (main.ae-landing, one per language), so it
// shows before this bundle arrives and without JavaScript. Here it only gains its
// dialog buttons.
e.welcome2 = () => {
  document.documentElement.classList.remove('ae-route') // e.g. after a stripped ?fbclid
  document.documentElement.classList.add('ae-home')
  involve()
  $('#loading').hide()
}

const aboutEn = () => `
<header class="apage-head">
  ${mark()}
  <h2>About Æterni Anima</h2>
</header>
<p class="about-lead"><strong>Æterni Anima</strong> is an initiative established in December 2020 to promote <span class="highlighted">extended longevity</span> through <span class="highlighted">non-invasive</span> improvements to health and performance. We integrate science, art and technology to foster <span class="highlighted">well-being</span> across a range of endeavors.</p>

<p>Our flagship, <a href="https://biosyncare.com/">BioSynCare</a> (formerly Audiovisual Medicine), advances <span class="highlighted">sensory stimulation</span> for non-invasive neuromodulation of health, well-being and performance, through breathing and sound: an app of carefully composed sessions for focus, relaxation, meditation and sleep preparation.</p>

<p>We also contribute to <a href="https://w3c-cg.github.io/sstim/">SSTIM</a>, the Sensory Stimulation Vocabulary: an <span class="highlighted">open, evolving reference</span> that connects research, technology and AI through citable identifiers, precise descriptions and transparent evidence. It is developed through the <a href="https://www.w3.org/groups/cg/sstim/">W3C Sensory Stimulation Vocabulary Community Group</a>, and BioSynCare adopts it. Its open reference app, <a href="https://w3c-cg.github.io/sstim/about/">SSTIM Workbench</a> (formerly BSC Lab), lets anyone build sensory-stimulation patches in Patch Studio and examine the knowledge behind them.</p>

<p>Around this work we cultivate tools for <a href="https://pypi.org/project/music/">musical synthesis</a>, for harnessing one's own social networks, and for registering insights and distilling knowledge. Within the Santo Daime community, the <a href="?daimesm">Daimist Science Manifesto</a> guides work that unites scientific rigor with spiritual wisdom, from textual analyses of the hymnals in <a href="https://da1me.github.io/">Da1me</a> to <a href="https://saoirineu.github.io/">São Irineu</a>, ICEFLU Europe's online portal.</p>

<p>Through our <strong>publishing activity</strong>, we curate and disseminate <span class="highlighted">transformative narratives</span>.</p>

<h3>Who we are</h3>
<div class="apeople">
  <div class="aperson">
    <h4>Renato Fabbri</h4>
    <p class="arole">Physicist · Software architect · Composer</p>
    <p>Renato leads the research and the architecture of the initiative's projects. His path includes an MSc in Applied Physics on the psychophysical description of music in digital audio, a PhD in Computational Physics, open-source work such as the <a href="https://pypi.org/project/music/">Music</a> library, and more than twenty years of practice with brainwave entrainment and resonance breathing.</p>
    <p><a href="https://ttm.github.io/">ttm.github.io</a></p>
  </div>
  <div class="aperson">
    <h4>Riccardo Berti</h4>
    <p class="arole">Lead developer · Product engineering · Musician</p>
    <p>Riccardo leads much of BioSynCare's app development, its releases and the day-to-day support of its users, turning protocol ideas into a stable product and bringing a musician's ear to how the sessions sound and feel.</p>
  </div>
</div>

<h3>Earlier communities</h3>
<p>The initiative has also gathered people in the Facebook groups <a href="https://www.facebook.com/groups/arcturianart">Arcturian Art</a> and <a href="https://www.facebook.com/groups/mentaliz">Mentaliz</a>, and in a WhatsApp group. These communities are no longer active; they remain part of our history.</p>

<p>We invite you to join us on this journey. Your participation is invaluable, and we look forward to sharing each step with you.</p>
<div class="about-cta">
  <a class="abtn abtn--primary ae-involve" href="mailto:aeterni.anima@gmail.com?subject=Getting%20involved">Get involved</a>
  <a class="abtn" href="./#projects">Explore the projects</a>
</div>`

const aboutPt = () => `
<header class="apage-head">
  ${mark()}
  <h2>Sobre a Æterni Anima</h2>
</header>
<p class="about-lead"><strong>Æterni Anima</strong> é uma iniciativa criada em dezembro de 2020 para promover a <span class="highlighted">longevidade estendida</span> por meio de melhorias <span class="highlighted">não invasivas</span> na saúde e no desempenho. Integramos ciência, arte e tecnologia para cultivar o <span class="highlighted">bem-estar</span> em diversas frentes.</p>

<p>Nosso carro-chefe, o <a href="https://biosyncare.com/">BioSynCare</a> (antes chamado Audiovisual Medicine), desenvolve a <span class="highlighted">estimulação sensorial</span> para a neuromodulação não invasiva da saúde, do bem-estar e do desempenho, por meio da respiração e do som: um aplicativo de sessões cuidadosamente compostas para foco, relaxamento, meditação e preparação para o sono.</p>

<p>Também contribuímos com o <a href="https://w3c-cg.github.io/sstim/">SSTIM</a>, o Vocabulário de Estimulação Sensorial: uma <span class="highlighted">referência aberta e em evolução</span> que conecta pesquisa, tecnologia e IA por meio de identificadores citáveis, descrições precisas e evidências transparentes. Ele é desenvolvido no <a href="https://www.w3.org/groups/cg/sstim/">W3C Sensory Stimulation Vocabulary Community Group</a>, e o BioSynCare o adota. Seu aplicativo de referência aberto, o <a href="https://w3c-cg.github.io/sstim/about/">SSTIM Workbench</a> (antes chamado BSC Lab), permite que qualquer pessoa crie patches de estimulação sensorial no Patch Studio e examine o conhecimento por trás deles.</p>

<p>Em torno desse trabalho, cultivamos ferramentas para a <a href="https://pypi.org/project/music/">síntese musical</a>, para explorar as próprias redes sociais e para registrar ideias e destilar conhecimento. Na comunidade do Santo Daime, o <a href="?daimesm&amp;lang=pt">Manifesto da Ciência Daimista</a> orienta um trabalho que une rigor científico e sabedoria espiritual, das análises textuais dos hinários no <a href="https://da1me.github.io/">Da1me</a> ao <a href="https://saoirineu.github.io/">São Irineu</a>, o portal online da ICEFLU Europa.</p>

<p>Por meio da nossa <strong>atividade editorial</strong>, selecionamos e divulgamos <span class="highlighted">narrativas transformadoras</span>.</p>

<h3>Quem somos</h3>
<div class="apeople">
  <div class="aperson">
    <h4>Renato Fabbri</h4>
    <p class="arole">Físico · Arquiteto de software · Compositor</p>
    <p>Renato conduz a pesquisa e a arquitetura dos projetos da iniciativa. Sua trajetória inclui um mestrado em Física Aplicada sobre a descrição psicofísica da música em áudio digital, um doutorado em Física Computacional, trabalho em software livre como a biblioteca <a href="https://pypi.org/project/music/">Music</a> e mais de vinte anos de prática com sincronização de ondas cerebrais (brainwave entrainment) e respiração de ressonância.</p>
    <p><a href="https://ttm.github.io/">ttm.github.io</a></p>
  </div>
  <div class="aperson">
    <h4>Riccardo Berti</h4>
    <p class="arole">Desenvolvedor líder · Engenharia de produto · Músico</p>
    <p>Riccardo conduz grande parte do desenvolvimento do aplicativo BioSynCare, de seus lançamentos e do suporte diário aos usuários, transformando ideias de protocolo em um produto estável e trazendo um ouvido de músico para o som e a sensação das sessões.</p>
  </div>
</div>

<h3>Comunidades anteriores</h3>
<p>A iniciativa também reuniu pessoas nos grupos do Facebook <a href="https://www.facebook.com/groups/arcturianart">Arcturian Art</a> e <a href="https://www.facebook.com/groups/mentaliz">Mentaliz</a>, e em um grupo de WhatsApp. Essas comunidades não estão mais ativas; permanecem como parte da nossa história.</p>

<p>Convidamos você a se juntar a nós nesta jornada. Sua participação é inestimável, e esperamos compartilhar cada passo com você.</p>
<div class="about-cta">
  <a class="abtn abtn--primary ae-involve" href="mailto:aeterni.anima@gmail.com?subject=Quero%20participar">Envolva-se</a>
  <a class="abtn" href="./?lang=pt#projetos">Conheça os projetos</a>
</div>`

e.about2 = () => {
  utils.stdDiv().html(`
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
  .acard .aperson h4 { margin: 0; font-family: var(--serif); font-size: 1.45rem; font-weight: 600; line-height: 1.15; }
  .aperson .arole { margin: 0.2em 0 0.7em; font-size: 0.74rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); }
  .aperson p { margin: 0 0 0.6em; }
</style>
${pt() ? aboutPt() : aboutEn()}
<p style="text-align:center;color:var(--ink-soft)">:::</p>
  `)
  involve()
  $('#loading').hide()
}

e.daimesm = () => {
  // [code, label, published embed URL ('' = not yet published), commentable doc URL]
  const langs = [
    ['en', 'English', 'https://docs.google.com/document/d/e/2PACX-1vSCJqlSpPE8OyAo-I2xdEl1DhlPwf9aHd7aRsWPHxC4WNX18YgL5oUA35G4wP8Hk6VLlfBV8a5lt16O/pub?embedded=true', 'https://docs.google.com/document/d/1ycexORBC5poOGM5TrGsht8NbWv0yU_0zsGAnRzHqo_A/edit'],
    ['pt', 'Português', 'https://docs.google.com/document/d/e/2PACX-1vThmHtC_yOpTkvSU6VwNFgCxzYXlHQ8wSmjybWaO6f1IoRUaxqDORew3wuksNiYPAt7S7AKi5vyCkGU/pub?embedded=true', 'https://docs.google.com/document/d/1K3sc0B19SniNYUGnO1kqnoWfuqc1lvKdjCAxzs4OZl0/edit'],
    ['it', 'Italiano', 'https://docs.google.com/document/d/e/2PACX-1vTEYxSd69ObcqKcwcs1RgTzOna7hPZfMLOkob4D-A522TADpWKZd6BK_E6hD7YpHiVx5hJIElI3n3MI/pub?embedded=true', 'https://docs.google.com/document/d/1WrAOawnLW0FZd5-ubCo6HH5u1TiQG5TkR1O2nZPHSnQ/edit']
  ]
  const buttons = langs.map(l => `<button type="button" class="dsm-lang" data-lang="${l[0]}" lang="${l[0]}">${l[1]}</button>`).join('')
  const title = tr('Daimist Science Manifesto', 'Manifesto da Ciência Daimista')
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
    ${mark()}
    <h1>${title}</h1>
  </header>
  <p class="dsm-intro">${tr('Read the manifesto below, or open it in Google&nbsp;Docs to leave comments and contribute.', 'Leia o manifesto abaixo ou abra-o no Google&nbsp;Docs para deixar comentários e contribuir.')}</p>

  <div class="dsm-langs">${buttons}</div>

  <div id="dsm-view" class="dsm-frame-wrap"></div>

  <p class="dsm-comment"><a id="dsm-edit" href="#" target="_blank" rel="noopener">${tr('Open this version in Google Docs to comment', 'Abra esta versão no Google Docs para comentar')} &#8599;</a></p>
  <p style="text-align:center;color:var(--ink-soft)">:::</p>
  `)

  const byLang = {}
  langs.forEach(l => { byLang[l[0]] = { label: l[1], pub: l[2], edit: l[3] } })

  // The published embed keeps the document's page margins, which leave a phone a
  // column a few words wide; Google's mobile view of the same document reflows instead.
  const narrow = window.matchMedia('(max-width: 640px)')
  let current = pt() ? 'pt' : 'en'
  const show = code => {
    current = code
    const d = byLang[code]
    $('.dsm-lang').removeClass('is-active').filter(`[data-lang="${code}"]`).addClass('is-active')
    if (d.pub) {
      const src = narrow.matches ? d.edit.replace(/\/edit.*$/, '/mobilebasic') : d.pub
      $('#dsm-view').html(`<iframe src="${src}" title="${title} (${d.label})"></iframe>`)
    } else {
      $('#dsm-view').html(`<div class="dsm-pending">${tr(`The ${d.label} version is open for reading and comments in Google Docs — use the link below.`, `A versão (${d.label}) está aberta para leitura e comentários no Google Docs — use o link abaixo.`)}</div>`)
    }
    $('#dsm-edit').attr('href', d.edit)
  }

  $('.dsm-lang').on('click', function () { show($(this).data('lang')) })
  narrow.addEventListener('change', () => show(current))
  show(current)

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
    ${mark()}
    <h2>${tr('Support Æterni Anima', 'Apoie a Æterni Anima')}</h2>
    <p class="apage-lead">${tr('Your support keeps these projects alive and growing. Every gift, of any size, makes a difference.', 'Seu apoio mantém estes projetos vivos e crescendo. Toda doação, de qualquer valor, faz diferença.')}</p>
  </header>

  <div class="agive">
    <div class="agive-opt">
      <h3>PayPal</h3>
      <p>${tr('Give any amount by card or through PayPal.', 'Doe qualquer valor com cartão ou pelo PayPal.')}</p>
      <img src="assets/donation/qrPaypal.png" alt="${tr('QR code for donating through PayPal', 'Código QR para doar pelo PayPal')}">
      <p>${link(tr('Donate with PayPal', 'Doar com PayPal'), 'paypal')}</p>
    </div>
    <div class="agive-opt">
      <h3>Bitcoin</h3>
      <p>${tr('Send any amount to our wallet:', 'Envie qualquer valor para a nossa carteira:')}</p>
      <img src="assets/donation/qrBitcoin.png" alt="${tr('QR code of the Bitcoin wallet', 'Código QR da carteira de Bitcoin')}">
      <p><code>${bitcoinWallet}</code></p>
    </div>
    <div class="agive-opt agive-opt--wide">
      <h3>${tr('Bank transfer and other coins', 'Transferência bancária e outras moedas')}</h3>
      <p>${tr('Write to us for a direct bank transfer, or to give in Ethereum or another currency.', 'Escreva para nós para uma transferência bancária direta, ou para doar em Ethereum ou em outra moeda.')}</p>
      <p><a href="mailto:aeterni.anima@gmail.com">aeterni.anima@gmail.com</a></p>
    </div>
  </div>

  <h3>${tr('Give your time and ideas', 'Doe seu tempo e suas ideias')}</h3>
  <p>${tr('Send us feedback on your experience with Æterni and ideas for enhancements or derivatives, or join the coordination, creation and tech tasks.', 'Envie-nos comentários sobre sua experiência com a Æterni e ideias de melhorias ou de novos desdobramentos, ou junte-se às tarefas de coordenação, criação e tecnologia.')}</p>
  <div class="agive-cta">
    <a class="abtn abtn--primary ae-involve" href="mailto:aeterni.anima@gmail.com">${tr('Ways to take part', 'Formas de participar')}</a>
    <a class="abtn" href="mailto:aeterni.anima@gmail.com">${tr('Write to us', 'Escreva para nós')}</a>
  </div>
  <p style="text-align:center">${tr('Thank you.', 'Obrigado.')}</p>
  `)
  involve()
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
    ${mark()}
    <h2>${tr('Donate with PayPal', 'Doe com PayPal')}</h2>
    <p class="apage-lead">${tr('Give any amount, by card or with your PayPal account.', 'Doe qualquer valor, com cartão ou com sua conta PayPal.')}</p>
  </header>
  <div class="apay">
  <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
    <input type="hidden" name="cmd" value="_donations" />
    <input type="hidden" name="business" value="CWRTXTJF9C3N6" />
    <input type="hidden" name="currency_code" value="BRL" />
    <input type="image" src="https://www.paypalobjects.com/${tr('en_US', 'pt_BR')}/i/btn/btn_donateCC_LG.gif" border="0" name="submit" title="${tr('PayPal - The safer, easier way to pay online!', 'PayPal - a maneira fácil e segura de pagar online!')}" alt="${tr('Donate with PayPal button', 'Botão Doar com PayPal')}" />
    <img alt="" border="0" src="https://www.paypal.com/pt_BR/i/scr/pixel.gif" width="1" height="1" />
  </form>
  <p class="amute">${tr('Or scan this code with your phone:', 'Ou escaneie este código com o celular:')}</p>
  <img class="aqr" src="assets/donation/qrPaypal.png" alt="${tr('QR code for donating through PayPal', 'Código QR para doar pelo PayPal')}">
  <p class="aback">${link(tr('← All the ways to support Æterni Anima', '← Todas as formas de apoiar a Æterni Anima'), 'angel')}</p>
  </div>
  `)
  $('#loading').hide()
}

e.bitcoin = () => {
  utils.stdDiv().html(`
  ${payStyle}
  <header class="apage-head">
    ${mark()}
    <h2>${tr('Donate with Bitcoin', 'Doe com Bitcoin')}</h2>
    <p class="apage-lead">${tr('Send any amount to our wallet.', 'Envie qualquer valor para a nossa carteira.')}</p>
  </header>
  <div class="apay">
  <p><code>${bitcoinWallet}</code></p>
  <img class="aqr" src="assets/donation/qrBitcoin.png" alt="${tr('QR code of the Bitcoin wallet', 'Código QR da carteira de Bitcoin')}">
  <p class="aback">${link(tr('← All the ways to support Æterni Anima', '← Todas as formas de apoiar a Æterni Anima'), 'angel')}</p>
  </div>
  `)
  $('#loading').hide()
}

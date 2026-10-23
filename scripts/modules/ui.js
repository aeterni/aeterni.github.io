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

const PIXI = require('pixi.js')
const forceAtlas2 = require('graphology-layout-forceatlas2')

const t = window.Tone = require('tone')
const $ = require('jquery')
window.jQuery = $
require('paginationjs')
const linkify = require('linkifyjs/html')

const m = require('./med')
const c = require('./conductor')
const monk = require('./monk')
const maestro = require('./maestro.js')
const net = require('./net.js')
const transfer = require('./transfer.js')
const utils = require('./utils.js')
const u = require('./router.js').urlArgument

const e = module.exports
const a = utils.defaultArg
require('@fortawesome/fontawesome-free/js/all.js')

e.rtest = () => console.log('router working!')
e.sytest = () => {
  const sy = new t.MembraneSynth().toDestination()
  const dat = require('dat.gui')
  // const gui = new dat.GUI({ closed: true, closeOnTop: true })
  const gui = new dat.GUI()
  const param = gui.add({ freq: 500 }, 'freq', 50, 1000).listen()
  const vol = gui.add({ vol: 0 }, 'vol', -100, 30).listen()
  window.sy = sy
  const st = 2 ** (1 / 12)
  const tt = 0.1
  const ttt = tt / 2
  vol.onFinishChange(v => {
    sy.volume.value = v
  })
  function mkSound () {
    const now = t.now()
    sy.triggerAttackRelease(vv, ttt, now)
    sy.triggerAttackRelease(vv * (st ** 3), ttt, now + tt)
    sy.triggerAttackRelease(vv * (st ** 7), ttt, now + 2 * tt)

    sy.triggerAttackRelease(vv * (st ** 4), ttt, now + 3 * tt)
    sy.triggerAttackRelease(vv * (st ** 8), ttt, now + 4 * tt)
    sy.triggerAttackRelease(vv * (st ** 11), ttt, now + 5 * tt)
  }
  let vv = 500
  param.onFinishChange(v => {
    vv = v
    // t.start(0)
    // t.Master.mute = false
    mkSound()
  })
  $('<input/>', {
    type: 'checkbox'
  }).appendTo('body').change(function () {
    if (this.checked) {
      t.start()
      t.Master.mute = false
    }
  })
  $('#loading').hide()
}
e.ttest = () => {
  const synth = maestro.mkOsc(u('l') || 400, -200, -1, 'sine')
  const synth2 = maestro.mkOsc(u('r') || 410, -200, 1, 'sine')
  // const mod = maestro.mkOsc(u('o') || 0.1, 46.02, 0, 'sine', true)
  const mod_ = maestro.mkOsc(u('o') || 0.1, 0, 0, 'sine', true)
  const mul = new t.Multiply(0)
  const mod = mod_.connect(mul)
  const add400 = new t.Add(400)
  const add410 = new t.Add(410)
  mul.connect(add400)
  mul.connect(add410)
  // mod.partials = [22]
  const met = new t.Meter()
  const met2 = new t.DCMeter()
  add400.connect(met)
  add400.connect(met2)
  add400.connect(synth.frequency)
  add410.connect(synth2.frequency)

  const grid = utils.mkGrid(2)

  const vonoff = $('<div/>', { id: 'vonoff' }).appendTo(grid).text('Stopped')

  $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid).change(function () {
    if (this.checked) {
      t.start()
      t.Master.mute = false
      synth.volume.rampTo(-40, 1)
      synth2.volume.rampTo(-40, 1)
      mod.frequency.rampTo(0.05, 120)
      // play
      vonoff.text('Playing')
    } else {
      synth.volume.rampTo(-200, 1)
      synth2.volume.rampTo(-200, 1)
      // stop
      vonoff.text('Stopped')
    }
  })
  $('<div/>').text('meter').appendTo(grid)
  const m1 = $('<div/>', { id: 'meter1' }).appendTo(grid)
  $('<div/>').text('meter DC').appendTo(grid)
  const m2 = $('<div/>', { id: 'meter2' }).appendTo(grid)
  setInterval(() => {
    m1.text(met.getValue().toFixed(3))
    m2.text(met2.getValue().toFixed(3))
  }, 100)
  window.sss = { synth, synth2, mod, mod_, met, met2, mul, add400, add410 }
  // controls:
  //    freq 1 freq 2
  //    mod depth freqmod freqmod2 duration
  //    panosc
  // display:
  //    cur freq1 freq2 freqmod
  //    countdown to start or to end
  $('#loading').hide()
}

e.ptest = () => {
  const app = new PIXI.Application()
  document.body.appendChild(app.view)
  window.ppp_ = { PIXI, app }
  const c = new PIXI.ParticleContainer(10000, {
    scale: true,
    position: true,
    rotation: true,
    uvs: true,
    alpha: true
  })
  app.stage.addChild(c)

  const c2 = new PIXI.ParticleContainer(10000, {
    scale: true,
    position: true,
    rotation: true,
    uvs: true,
    alpha: true
  })
  app.stage.addChild(c2)

  // myLine.position.set(0, 0)
  const myLine = new PIXI.Graphics()
  myLine.lineStyle(1, 0xff0000)
    .moveTo(0, 0)
    .lineTo(200, 300)
  const texture2 = app.renderer.generateTexture(myLine)
  const line = new PIXI.Sprite(texture2)
  line.x = 150
  line.y = 250
  c.addChild(line)

  const myLine2 = new PIXI.Graphics()
  myLine2.lineStyle(1, 0xff0000)
    .moveTo(0, 0)
    .lineTo(400, 400)
  const texture3 = app.renderer.generateTexture(myLine2)
  const line2 = new PIXI.Sprite(texture3)
  c.addChild(line2)

  const gr = new PIXI.Graphics()
  gr.beginFill(0xffffff)
  gr.drawCircle(30, 30, 30)
  gr.endFill()
  const texture = app.renderer.generateTexture(gr)
  const circle = new PIXI.Sprite(texture)
  c2.addChild(circle)

  // const c = PIXI.Container()
  window.ppp = { c, c2, line, circle }
}

e.lines = () => {
  const app = new PIXI.Application()
  document.body.appendChild(app.view)
  const c = new PIXI.ParticleContainer(10000, {
    scale: true,
    position: true,
    rotation: true,
    uvs: true,
    alpha: true
  })
  app.stage.addChild(c)
  const myLine = new PIXI.Graphics()
    .lineStyle(1, 0xff0000)
    .moveTo(100, 100)
    .lineTo(200, 100)
  const texture2 = app.renderer.generateTexture(myLine)
  const line = new PIXI.Sprite(texture2)
  line.x = 150
  line.y = 250
  c.addChild(line)

  const line2 = new PIXI.Sprite(texture2)
  line2.x = 250
  line2.y = 350
  c.addChild(line2)
  line2.scale.set(2, 1)
  line2.rotation = Math.PI / 3

  const myLine3 = new PIXI.Graphics()
  myLine3.lineStyle(1, 0xff0000)
    .moveTo(350, 200)
    .lineTo(350 + 200 * Math.cos(Math.PI / 3), 200 + 200 * Math.sin(Math.PI / 3))
  app.stage.addChild(myLine3)

  const myLine4 = new PIXI.Graphics()
  myLine4.lineStyle(1, 0xff0000)
    .moveTo(450, 300)
    .lineTo(450 + 100, 300)
  const texture = app.renderer.generateTexture(myLine4)
  const line3 = new PIXI.Sprite(texture)
  // line3.x = 150
  // line3.y = 250
  c.addChild(line3)

  window.lll = { line, line2 }
}

const nodes = [
  [130, 200],
  [230, 350],
  [50, 100],
  [500, 100]
]
const edges = [
  [0, 1],
  [0, 3],
  [1, 2],
  [1, 3],
  [2, 3]
]
e.net1 = () => {
  function plotNet (nodes, edges) {
    nodes.forEach(n => mkNode(n))
    edges.forEach(e => mkEdge(nodes[e[0]], nodes[e[1]]))
  }
  function mkNode (pos) {
    const circle = new PIXI.Sprite(circleTexture)
    circle.x = pos[0]
    circle.y = pos[1]
    circle.anchor.x = 0.5
    circle.anchor.y = 0.5
    nodeContainer.addChild(circle)
  }
  function mkEdge (pos1, pos2) {
    edgeContainer.ppp = pos1
    const line = new PIXI.Sprite(lineTexture)
    const dx = pos2[0] - pos1[0]
    const dy = pos2[1] - pos1[1]
    const length = (dx ** 2 + dy ** 2) ** 0.5
    line.scale.set(length / 1000, 1)
    const angle = Math.atan2(dy, dx)
    line.rotation = angle
    line.x = pos1[0]
    line.y = pos1[1]
    edgeContainer.addChild(line)
  }
  const nodeContainer = new PIXI.ParticleContainer(10000, {
    scale: true,
    position: true,
    rotation: true,
    alpha: true
  })
  const edgeContainer = new PIXI.ParticleContainer(10000, {
    scale: true,
    position: true,
    rotation: true,
    alpha: true
  })
  const myLine = new PIXI.Graphics()
    .lineStyle(1, 0xff0000)
    .moveTo(0, 0)
    .lineTo(1000, 0)

  const myCircle = new PIXI.Graphics()
    .beginFill(0xffffff)
    .drawCircle(0, 0, 5)
    .endFill()

  const app = new PIXI.Application()
  document.body.appendChild(app.view)
  const circleTexture = app.renderer.generateTexture(myCircle)
  const lineTexture = app.renderer.generateTexture(myLine)
  app.stage.addChild(edgeContainer)
  app.stage.addChild(nodeContainer)
  plotNet(nodes, edges)
}

e.net2 = () => {
  const app = new PIXI.Application()
  document.body.appendChild(app.view)
  window.___ = new net.ParticleNet(app, nodes, edges)
}

e.net3 = () => {
  const er = net.eR(100, 0.5)
  window.er = er
  const saneSettings = forceAtlas2.inferSettings(er)
  const mpos = forceAtlas2(er,
    { iterations: 150, settings: saneSettings }
  )
  window.mpos = { mpos, saneSettings }

  const mkNodes = order => {
    const bw = 0.1 * w
    const bh = 0.1 * h
    return Array(order).fill(0).map(i => [
      w * 0.8 * Math.random() + bw,
      h * 0.8 * Math.random() + bh
    ])
  }
  const mkEdges = order => {
    const edges = []
    for (let i = 0; i < order - 1; i++) {
      for (let j = i + 1; j < order; j++) {
        if (Math.random() > 0.98) {
          edges.push([i, j])
        }
      }
    }
    return edges
  }

  const app = new PIXI.Application()
  document.body.appendChild(app.view)
  const w = app.renderer.width
  const h = app.renderer.height

  console.log('start!')
  const order = 200
  const performance = window.performance
  const now1 = performance.now()
  const nodes = mkNodes(order)
  const now2 = performance.now()
  console.log('made the nodes:', now2 - now1)
  const edges = mkEdges(order)
  const now3 = performance.now()
  console.log('made the edges:', now3 - now2, edges.length)
  window.___ = new net.ParticleNet(app, nodes, edges)
  const now4 = performance.now()
  console.log('plot finished:', now4 - now3)
  $('#loading').hide()
}

e.particles1 = () => {
  const nodeContainer = new PIXI.ParticleContainer(10000, {
    scale: true,
    position: true,
    rotation: true,
    alpha: true
  })

  const myCircle = new PIXI.Graphics()
    .beginFill(0xffffff)
    .drawCircle(0, 0, 5)
    .endFill()

  const app = new PIXI.Application()
  document.body.appendChild(app.view)

  const circleTexture = app.renderer.generateTexture(myCircle)
  app.stage.addChild(nodeContainer)
  function mkNode (pos, scale) {
    const circle = new PIXI.Sprite(circleTexture)
    circle.x = pos[0]
    circle.y = pos[1]
    circle.anchor.x = 0.5
    circle.anchor.y = 0.5
    circle.scale.set(scale || 1, scale || 1)
    nodeContainer.addChild(circle)
    return circle
  }
  const [x0, y0] = [100, 200]
  const theCircle = mkNode([x0, y0])

  // to draw the sinusoid:
  const myLine = new PIXI.Graphics()
  const [x, y] = [100, 300]
  const [dx, dy] = [500, 200]
  myLine.lineStyle(1, 0xff0000)
    .moveTo(x, y)
  const segments = 100
  for (let i = 0; i < segments; i++) {
    myLine.lineTo(x + dx * i / segments, y + Math.sin(2 * Math.PI * i / segments) * dy)
  }
  const c = new PIXI.Container()
  app.stage.addChild(c)
  // c.addChild(new PIXI.Sprite(app.renderer.generateTexture(myLine)))
  c.addChild(myLine)
  c.addChild(myCircle)
  // myCircle.x = x
  // myCircle.y = y
  myCircle.position.set(x, y)
  let i = 0
  // const nodes = []
  app.ticker.add(delta => {
    const [xx, yy] = [x + dx * i / segments, y + Math.sin(2 * Math.PI * i / segments) * dy]
    i = (i + 1) % segments
    myCircle.position.set(xx, yy)
    const circ = mkNode([xx, yy], 0.3)
    nodes.push(circ)
    circ.tint = Math.random() * 0xffffff
    // const toRemove = []
    for (let ii = 0; ii < nodes.length; ii++) {
      const n = nodes[ii]
      const sx = theCircle.x - n.x
      const sy = theCircle.y - n.y
      const mag = (sx ** 2 + sy ** 2) ** 0.5
      if (mag < 5) {
        nodes.splice(ii, 1)
        n.destroy()
        window.nnn = n
      } else {
        n.x += sx / mag + (Math.random() - 0.5) * 5
        n.y += sy / mag + (Math.random() - 0.5) * 5
        n.tint = (n.tint + 0xffffff * 0.1 * Math.random()) % 0xffffff
      }
    }
    theCircle.x += (Math.random() - 0.5) * 5
    theCircle.y += (Math.random() - 0.5) * 5
  })
  window.mmm = { myCircle, app, nodes }
}

e.particles2 = () => {
  const nodeContainer = new PIXI.ParticleContainer(10000, {
    scale: true,
    // rotation: true,
    // alpha: true,
    position: true
  })

  const myCircle = new PIXI.Graphics()
    .beginFill(0xffffff)
    .drawCircle(0, 0, 5)
    .endFill()
  const myCircle_ = new PIXI.Graphics()
    .beginFill(0xffffff)
    .drawCircle(0, 0, 5)
    .endFill()

  const myCircle2 = new PIXI.Graphics()
    .beginFill(0xffff00)
    .drawCircle(0, 0, 5)
    .endFill()
  const myCircle3 = new PIXI.Graphics()
    .beginFill(0x00ff00)
    .drawCircle(0, 0, 5)
    .endFill()

  const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight * 0.85
  })
  document.body.appendChild(app.view)
  const [w, h] = [app.view.width, app.view.height]

  const circleTexture = app.renderer.generateTexture(myCircle)
  app.stage.addChild(nodeContainer)
  function mkNode (pos, scale) {
    const circle = new PIXI.Sprite(circleTexture)
    circle.x = pos[0]
    circle.y = pos[1]
    circle.anchor.x = 0.5
    circle.anchor.y = 0.5
    circle.scale.set(scale || 1, scale || 1)
    nodeContainer.addChild(circle)
    return circle
  }
  // const [x0, y0] = [100, 200]
  const [x0, y0] = [w * 0.2, h * 0.2]
  const theCircle = mkNode([x0, y0], 1)

  // to draw the sinusoid:
  const myLine = new PIXI.Graphics()
  const [x, y] = [w * 0.1, h * 0.5]
  const [dx, dy] = [w * 0.8, h * 0.4]
  myLine.lineStyle(1, 0xffffff)
    .moveTo(x, y)
  const segments = 100
  for (let i = 0; i <= segments; i++) {
    myLine.lineTo(x + dx * i / segments, y + Math.sin(2 * Math.PI * i / segments) * dy)
  }

  const c = new PIXI.Container()
  app.stage.addChild(c)
  c.addChild(myLine)
  c.addChild(myCircle)
  c.addChild(myCircle_)
  c.addChild(myCircle2)
  c.addChild(myCircle3)
  myCircle.position.set(x, y)
  myCircle_.position.set(x + dx, y)
  window.mmm = { myCircle, app }

  // sound
  const synth = maestro.mkOsc(u('l') || 400, -200, -1, 'sine') // fixme: dummy freq
  const synth2 = maestro.mkOsc(u('r') || 410, -200, 1, 'sine') // fixme: dummy freq
  // const mod = maestro.mkOsc(u('o') || 0.1, 46.02, 0, 'sine', true)
  const mod_ = maestro.mkOsc(u('o') || 0.1, 0, 0, 'sine', true)
  const oscAmp = 190
  const freqRef = 700
  const mul = new t.Multiply(oscAmp)
  const mod = mod_.connect(mul)
  const add400 = new t.Add(freqRef)
  const add410 = new t.Add(410)
  mul.connect(add400)
  mul.connect(add410)
  // mod.partials = [22]
  const met = new t.Meter()
  const met2 = new t.DCMeter()
  add400.connect(met)
  add400.connect(met2)
  add400.connect(synth.frequency)
  add410.connect(synth2.frequency)

  const grid = utils.mkGrid(2)

  const vonoff = $('<div/>', { id: 'vonoff' }).appendTo(grid).text('Stopped')

  $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid).change(function () {
    if (this.checked) {
      t.start()
      t.Master.mute = false
      synth.volume.rampTo(-40, 1)
      synth2.volume.rampTo(-40, 1)
      mod.frequency.rampTo(0.05, 120)
      // play
      vonoff.text('Playing')
    } else {
      synth.volume.rampTo(-200, 1)
      synth2.volume.rampTo(-200, 1)
      // stop
      vonoff.text('Stopped')
    }
  })

  $('<div/>').text('meter').appendTo(grid)
  const m1 = $('<div/>', { id: 'meter1' }).appendTo(grid)
  $('<div/>').text('meter DC').appendTo(grid)
  const m2 = $('<div/>', { id: 'meter2' }).appendTo(grid)
  const parts = []
  setInterval(() => {
    const dc = met2.getValue()
    m1.text(met.getValue().toFixed(3))
    m2.text(dc.toFixed(3))
    const val = (freqRef - dc) / oscAmp
    window.aval = val
    const avalr = Math.asin(val)
    const px = (avalr < 0 ? 2 * Math.PI + avalr : avalr) / (2 * Math.PI) * dx + x
    myCircle2.x = px
    myCircle2.y = val * dy + y
    const px2 = (Math.PI - avalr) / (2 * Math.PI) * dx + x
    myCircle3.x = px2
    myCircle3.y = val * dy + y

    theCircle.x += (Math.random() - 0.5)
    theCircle.y += (Math.random() - 0.5)

    const circ = mkNode([myCircle2.x, myCircle2.y], 0.3)
    parts.push(circ)
    circ.tint = 0xffff00

    const circ2 = mkNode([myCircle3.x, myCircle3.y], 0.3)
    parts.push(circ2)
    circ2.tint = 0x00ff00
    for (let ii = 0; ii < parts.length; ii++) {
      const n = parts[ii]
      const sx = theCircle.x - n.x
      const sy = theCircle.y - n.y
      const mag = (sx ** 2 + sy ** 2) ** 0.5
      if (mag < 5) {
        parts.splice(ii, 1)
        n.destroy()
        window.nnn = n
      } else {
        n.x += sx / mag + (Math.random() - 0.5) * 5
        n.y += sy / mag + (Math.random() - 0.5) * 5
        // n.tint = (n.tint + 0xffffff * 0.1 * Math.random()) % 0xffffff
      }
    }
  }, 10)
  window.sss = { synth, synth2, mod, mod_, met, met2, mul, parts }
}

e.mkMed = () => {
  $('<link/>', {
    rel: 'stylesheet',
    href: 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css'
  }).appendTo('head')
  const flatpickr = require('flatpickr')

  const grid = utils.mkGrid(2)
  const gd = () => utils.gridDivider(0, 160, 0, grid)

  const s = $('<select/>', { id: 'mselect' }).appendTo(grid)
    .append($('<option/>').val(-1).html('~ creating ~'))
    .attr('title', 'Select template to load, edit, or delete.')
    .on('change', aself => {
      // load them
      const ii = aself.currentTarget.value
      console.log(ii)
      if (ii === '-1') {
        return
      }
      const e = window.allthem2[ii]
      console.log(e)
      mdiv.val(e.meditation)
      $('#baseModel').val(e.model || '0')
      if (e.model === '1') {
        mf0.val(e.mf0)
        mf0.show()
        mf0_.show()
        waveformM.show()
        waveformM_.show()
      } else {
        mf0.hide()
        mf0_.hide()
        waveformM.hide()
        waveformM_.hide()
      }
      fl.val(e.fl)
      fr.val(e.fr)
      mp0.val(e.mp0)
      mp1.val(e.mp1)
      ma.val(e.ma)
      md.val(e.md)
      d.val(e.d)
      mfp.setDate(e.dateTime)
      ellipse.prop('checked', e.ellipse)
      obutton.attr('disabled', false).html(`Open: ${mdiv.val()}`)
      bPos.bindex = e.bPos || 0
      bPos.html(posPos[bPos.bindex])
      rainbowFlakes.prop('checked', e.rainbowFlakes)
      bgc.fromString(e.bgc)
      fgc.fromString(e.fgc)
      bcc.fromString(e.bcc)
      ccc.fromString(e.ccc)
      lcc.fromString(e.lcc)
      $('#waveformL').val(e.waveformL || 'sine')
      $('#waveformR').val(e.waveformR || 'sine')
      $('#waveformM').val(e.waveformM || 'sine')
      if (e.panOsc === undefined) e.panOsc = '0'
      $('#panOsc').val(e.panOsc)
      panOscPeriod.val(a(e.panOscPeriod, ''))
      panOscPeriod.attr('disabled', e.panOsc < 2)
      panOscTrans.val(a(e.panOscTrans, ''))
      panOscTrans.attr('disabled', e.panOsc < 3)

      e.soundSample = e.soundSample || -1
      $('#soundSample').val(e.soundSample)
      soundSampleVolume.val(a(e.soundSampleVolume, ''))
      soundSampleVolume.attr('disabled', e.soundSample < 0)
      soundSamplePeriod.val(a(e.soundSamplePeriod, ''))
      soundSamplePeriod.attr('disabled', e.soundSample < 0)
      soundSampleStart.val(a(e.soundSampleStart, ''))
      soundSampleStart.attr('disabled', e.soundSample < 0)

      lemniscate.prop('checked', e.lemniscate || false)
      vcontrol.prop('checked', e.vcontrol || false)
      communionSchedule.prop('checked', e.communionSchedule || false)

      centerC.html(e.lemniscate ? 'left circ color:' : 'center circ color:')
      lateralC.html(e.lemniscate ? 'right circ color:' : 'lateral circ color:')
    })
  transfer.findAll({ meditation: { $exists: true } }).then(r => {
    window.allthem2 = r
    r.forEach((i, ii) => {
      s.append($('<option/>', { class: 'pres' }).val(ii).html(i.meditation))
      $('#loading').hide()
    })
  })
  window.ass = s
  $('<button/>').html('Delete').appendTo(grid)
    .click(() => {
      console.log($(`option[value="${$('#mselect').val()}"].pres`))
      const moption = $(`option[value="${$('#mselect').val()}"].pres`)
      const oind = moption[0].value
      transfer.remove({ meditation: window.allthem2[oind].meditation })
      moption.remove()
      window.allthem2.splice(oind, 1)
      obutton.attr('disabled', true).html('Open')
      $('.pres').remove()
      window.allthem2.forEach((i, ii) => {
        s.append($('<option/>', { class: 'pres' }).val(ii).html(i.meditation))
      })
    })
    .attr('title', 'Delete the meditation loaded in the dropdown menu.')
  $('<span/>').html('id:').appendTo(grid)
  const mdiv = $('<input/>', {
    placeholder: 'id for the meditation'
  }).appendTo(grid)
    .attr('title', 'The ID for the meditation (will appear on the URL).')

  $('<span/>').html('when:').appendTo(grid)
  const adiv = $('<input/>', {
    placeholder: 'select date and time'
  }).appendTo(grid)
    .attr('title', 'Select a date and time for the mentalization to occur.')
  const mfp = flatpickr(adiv, {
    enableTime: true
  })

  $('<span/>').html('total duration:').appendTo(grid)
  const d = $('<input/>', {
    placeholder: 'in seconds (0 if forever)'
  }).appendTo(grid)
    .attr('title', 'Duration of the meditation in seconds.')

  $('<span/>').html('model:').appendTo(grid)
  const model = $('<select/>', { id: 'baseModel' }).appendTo(grid)
    .append($('<option/>').val(0).html('model 1 - coupled binaural and Martigli'))
    .append($('<option/>').val(1).html('model 2 - decoupled binaural and Martigli'))
    .attr('title', 'Base audiovidual model.')
    .on('change', aself => {
      const ii = aself.currentTarget.value
      console.log(ii)
      if (ii === '0') {
        mf0.hide()
        mf0_.hide()
        waveformM.hide()
        waveformM_.hide()
      } else {
        mf0.show()
        mf0_.show()
        waveformM.show()
        waveformM_.show()
      }
    })
  window.model = model

  gd()

  $('<span/>').html('freq left:').appendTo(grid)
  const fl = $('<input/>', {
    placeholder: 'freq in Herz'
  }).appendTo(grid)
    .attr('title', 'Frequency on the left channel.')

  $('<span/>').html('waveform left:').appendTo(grid)
  const waveformL = $('<select/>', { id: 'waveformL' }).appendTo(grid)
    .append($('<option/>').val('sine').html('sine'))
    .append($('<option/>').val('triangle').html('triangle'))
    .append($('<option/>').val('square').html('square'))
    .append($('<option/>').val('sawtooth').html('sawtooth'))

  $('<span/>').html('freq right:').appendTo(grid)
  const fr = $('<input/>', {
    placeholder: 'freq in Herz'
  }).appendTo(grid)
    .attr('title', 'Frequency on the right channel.')

  $('<span/>').html('waveform right:').appendTo(grid)
  const waveformR = $('<select/>', { id: 'waveformR' }).appendTo(grid)
    .append($('<option/>').val('sine').html('sine'))
    .append($('<option/>').val('triangle').html('triangle'))
    .append($('<option/>').val('square').html('square'))
    .append($('<option/>').val('sawtooth').html('sawtooth'))

  gd()

  const mf0_ = $('<span/>').html('Martigli carrier frequency:').appendTo(grid).hide()
    .css('background', '#D9FF99')
  const mf0 = $('<input/>', {
    placeholder: 'in Herz'
  }).appendTo(grid)
    .attr('title', 'carrier frequency for the Martigli Oscillation.')
    .hide()
  const waveformM_ = $('<span/>').html('Martigli carrier waveform:').appendTo(grid).hide()
    .css('background', '#D9FF99')
  const waveformM = $('<select/>', { id: 'waveformM' }).appendTo(grid)
    .append($('<option/>').val('sine').html('sine'))
    .append($('<option/>').val('triangle').html('triangle'))
    .append($('<option/>').val('square').html('square'))
    .append($('<option/>').val('sawtooth').html('sawtooth'))
    .hide()

  $('<span/>').html('Martigli amplitude:').appendTo(grid)
  const ma = $('<input/>', {
    placeholder: 'in Herz'
  }).appendTo(grid)
    .attr('title', 'Variation span of the frequency to guide breathing.')

  $('<span/>').html('Martigli initial period:').appendTo(grid)
  const mp0 = $('<input/>', {
    placeholder: 'period in seconds'
  }).appendTo(grid)
    .attr('title', 'Initial duration of the breathing cycle.')

  $('<span/>').html('Martigli final period:').appendTo(grid)
  const mp1 = $('<input/>', {
    placeholder: 'period in seconds'
  }).appendTo(grid)
    .attr('title', 'Final duration of the breathing cycle.')

  $('<span/>').html('Martigli transition:').appendTo(grid)
  const md = $('<input/>', {
    placeholder: 'duration in seconds'
  }).appendTo(grid)
    .attr('title', 'Duration of the transition from the initial to the final Martigli period.')

  gd()

  $('<span/>').html('pan oscillation:').appendTo(grid)
  const panOsc = $('<select/>', { id: 'panOsc' }).appendTo(grid)
    .append($('<option/>').val(0).html('none'))
    .append($('<option/>').val(1).html('synced with Martigli Oscillation'))
    .append($('<option/>').val(2).html('sine independent of Martigli Oscillation'))
    .append($('<option/>').val(3).html('envelope (linear transition, stable sustain)'))
    .attr('title', 'Type of pan oscillation.')
    .on('change', aself => {
      const ii = aself.currentTarget.value
      panOscPeriod.attr('disabled', ii < 2)
      panOscTrans.attr('disabled', ii < 3)
    })

  $('<span/>').html('pan oscillation period:').appendTo(grid)
  const panOscPeriod = $('<input/>', {
    placeholder: 'in seconds'
  }).appendTo(grid)
    .attr('title', 'Duration of the pan oscillation in seconds.')
    .attr('disabled', true)

  $('<span/>').html('pan oscillation crossfade:').appendTo(grid)
  const panOscTrans = $('<input/>', {
    placeholder: 'in seconds'
  }).appendTo(grid)
    .attr('title', 'Duration of the pan crossfade (half the pan oscillation period or less).')
    .attr('disabled', true)

  gd()

  $('<span/>').html('sound sample:').appendTo(grid)
  const soundSample = $('<select/>', { id: 'soundSample' }).appendTo(grid)
    .append($('<option/>').val(-1).html('none'))
    .attr('title', 'Sound sample to be played continuously.')
    .on('change', aself => {
      const ii = aself.currentTarget.value
      soundSampleVolume.attr('disabled', ii < 0)
      soundSamplePeriod.attr('disabled', ii < 0)
      soundSampleStart.attr('disabled', ii < 0)
    })

  maestro.sounds.forEach((s, ii) => {
    soundSample.append($('<option/>').val(ii).html(`${s.name}, ${s.duration}s`))
  })

  $('<span/>').html('sample volume:').appendTo(grid)
  const soundSampleVolume = $('<input/>', {
    placeholder: 'in decibels',
    value: '-6'
  }).appendTo(grid)
    .attr('title', 'relative volume of the sound sample.')
    .attr('disabled', true)

  $('<span/>').html('sample repetition period:').appendTo(grid)
  const soundSamplePeriod = $('<input/>', {
    placeholder: 'in seconds'
  }).appendTo(grid)
    .attr('title', 'period between repetitions of the sound.')
    .attr('disabled', true)

  $('<span/>').html('sample starting time:').appendTo(grid)
  const soundSampleStart = $('<input/>', {
    placeholder: 'in seconds'
  }).appendTo(grid)
    .attr('title', 'time for the first incidence of the sound.')
    .attr('disabled', true)

  gd()

  $('<span/>').html('breathing ellipse:').appendTo(grid)
  const ellipse = $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid)
    .attr('title', 'Breath-scaled circle is ellipsoid if checked.')

  $('<span/>').html('breathing position:').appendTo(grid)
  const posPos = ['Center', 'Left', 'Right']
  const bPos = $('<button/>')
    .html('Center')
    .appendTo(grid)
    .attr('title', 'Breath-scaled circle position.')
    .click(() => {
      bPos.bindex = (bPos.bindex + 1) % posPos.length
      bPos.html(posPos[bPos.bindex])
    })
  bPos.bindex = 0

  gd()

  $('<span/>').html('rainbow flakes:').appendTo(grid)
  const rainbowFlakes = $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid)
    .attr('title', 'The flakes are in all colors if checked.')

  const J = require('@eastdesire/jscolor')
  $('<span/>').html('backgroung color:').appendTo(grid)
  $('<input/>', { id: 'bgc' }).appendTo(grid)
    .attr('title', 'The color of the background.')
  const bgc = new J('#bgc', { value: '#000000' })

  $('<span/>').html('foreground color:').appendTo(grid)
  $('<input/>', { id: 'fgc' }).appendTo(grid)
    .attr('title', 'The color of main drawing (e.g. sinusoid + shaking attractive circle).')
  const fgc = new J('#fgc', { value: '#FFFFFF' })

  $('<span/>').html('breathing circ color:').appendTo(grid)
  $('<input/>', { id: 'bcc' }).appendTo(grid)
    .attr('title', 'The color of circle that expands when to inhale.')
  const bcc = new J('#bcc', { value: '#4444FF' })

  const centerC = $('<span/>').html('center circ color:').appendTo(grid)
  $('<input/>', { id: 'ccc' }).appendTo(grid)
    .attr('title', 'The color of moving circle in (or most to) the middle.')
  const ccc = new J('#ccc', { value: '#00FF00' })

  const lateralC = $('<span/>').html('lateral circ color:').appendTo(grid)
  $('<input/>', { id: 'lcc' }).appendTo(grid)
    .attr('title', 'The color of the moving circle in (or most to) the laterals.')
  const lcc = new J('#lcc', { value: '#FFFF00' })

  gd()

  $('<span/>').html('lemniscate:').appendTo(grid)
  const lemniscate = $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid)
    .attr('title', 'Visualization with lemniscate if checked, sinusoid if not checked.')
    .on('change', function () {
      if (this.checked) {
        console.log('checked L')
        centerC.html('left circ color:')
        lateralC.html('right circ color:')
      } else {
        console.log('unchecked L')
        centerC.html('center circ color:')
        lateralC.html('lateral circ color:')
      }
    })

  $('<span/>').html('volume control:').appendTo(grid)
  const vcontrol = $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid)
    .attr('title', 'Enables volume control widget if checked.')

  $('<span/>').html('<a target="_blank" href="?communion">communion schedule</a>:').appendTo(grid)
  const communionSchedule = $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid)
    .attr('title', 'Is this meeting to be put on the communion meetings table?')

  const f = v => parseFloat(v.val())
  $('<button/>')
    .attr('title', 'Create the meditation with the settings defined.')
    .html('Create')
    .click(() => {
      console.log('the date:', mfp.selectedDates[0])
      console.log('the id:', mdiv.val() === '')
      const mdict = {
        fl: f(fl),
        fr: f(fr),
        mp0: f(mp0),
        mp1: f(mp1),
        ma: f(ma),
        md: f(md),
        d: f(d)
      }
      if (model.val() === '1') {
        mdict.mf0 = f(mf0)
      }
      for (const key in mdict) {
        if (isNaN(mdict[key])) {
          window.alert(`define the value for ${key}.`)
          return
        }
      }

      if (model.val() === '0' && mdict.ma > Math.min(mdict.fl, mdict.fr)) {
        if (!window.confirm('Martigli amplitude is greater than binaural frequencies. Are you shure?')) return
      }

      mdict.model = model.val()

      mdict.waveformL = waveformL.val()
      mdict.waveformR = waveformR.val()
      if (mdict.model === '1') {
        mdict.waveformM = waveformM.val()
        if (mdict.ma > mdict.mf0) {
          if (!window.confirm('Martigli amplitude is greater than Martigli carrier frequency. Are you shure?')) return
        }
      }

      mdict.panOsc = panOsc.val()
      if (mdict.panOsc > 1) {
        const oPeriod = f(panOscPeriod)
        if (isNaN(oPeriod)) {
          window.alert('define the value for the pan oscillation period.')
          return
        }
        mdict.panOscPeriod = oPeriod
        if (mdict.panOsc === '3') {
          const oTrans = f(panOscTrans)
          if (isNaN(oTrans)) {
            window.alert('define the value for the pan crossfade.')
            return
          }
          if (oPeriod < 2 * oTrans) {
            window.alert('duration of the pan oscillation has to be at least twice that of the pan crossfade:')
            return
          }
          mdict.panOscTrans = oTrans
        }
      }
      mdict.soundSample = soundSample.val()
      if (mdict.soundSample >= 0) {
        const oVolume = f(soundSampleVolume)
        if (isNaN(oVolume)) {
          window.alert('define the volume for the sound sample.')
          return
        }
        mdict.soundSampleVolume = oVolume
        const oPeriod = f(soundSamplePeriod)
        if (isNaN(oPeriod)) {
          window.alert('define the period for the sample repetition.')
          return
        }
        if (oPeriod !== 0 && oPeriod < maestro.sounds[mdict.soundSample].duration) {
          window.alert('define a repetition period which is greater than the samples\' duration or 0 (for looping).')
        }
        mdict.soundSamplePeriod = oPeriod
        const oStart = f(soundSampleStart)
        if (isNaN(oStart) || oStart < 0) {
          window.alert('define a zero or positive starting time for the sample')
        }
        mdict.soundSampleStart = oStart
      }
      mdict.dateTime = mfp.selectedDates[0]
      if (mdict.dateTime === undefined || mdict.dateTime < new Date()) {
        if (!window.confirm('the date has passed. Are you shure?')) return
      }
      mdict.meditation = mdiv.val()
      if (mdict.meditation === '') {
        window.alert('define the meditation id.')
      }
      for (let i = 0; i < window.allthem2.length; i++) {
        if (mdict.meditation === window.allthem2[i].meditation) {
          window.alert('change the meditation id to be unique.')
          return
        }
      }
      mdict.ellipse = ellipse.prop('checked')
      mdict.bPos = bPos.bindex
      mdict.rainbowFlakes = rainbowFlakes.prop('checked')
      mdict.bgc = bgc.toString()
      mdict.fgc = fgc.toString()
      mdict.bcc = bcc.toString()
      mdict.ccc = ccc.toString()
      mdict.lcc = lcc.toString()
      mdict.vcontrol = vcontrol.prop('checked')
      mdict.lemniscate = lemniscate.prop('checked')
      mdict.communionSchedule = communionSchedule.prop('checked')
      transfer.writeAny(mdict).then(resp => console.log(resp))
      // enable button with the name
      s.append($('<option/>', { class: 'pres' }).val(window.allthem2.length).html(mdict.meditation))
      s.val(window.allthem2.length)
      window.allthem2.push(mdict)
      obutton.attr('disabled', false).html(`Open: ${mdiv.val()}`)
    }).appendTo(grid)
  const obutton = $('<button/>')
    .html('Open')
    .attr('title', 'Open URL of the meditation.')
    .click(() => {
      // open url with
      window.open(`?_${mdiv.val()}`)
    })
    .appendTo(grid)
    .attr('disabled', true)
}

e.meditation = mid => {
  transfer.findAny({ meditation: mid }).then(r => {
    if (r === null) {
      grid.css('background', 'red')
      countdown.text("don't exist")
      conoff.attr('disabled', true)
      vonoff.text('-----')
    }
    const dur = (r.dateTime.getTime() - (new Date()).getTime()) / 1000
    startTimer(dur, $('<span/>').appendTo('body'), r)
  })
  function startTimer (duration, display, settings) {
    if (duration < 0) {
      vonoff.text('Already started, maybe finished, ask team for another session.')
      conoff.attr('checked', true).attr('disabled', true)
      countdown.text('finished')
      grid.css('background', '#bbaaff')
      return
    }
    setSounds(settings, duration, display)
    // const { synth, synth2, mod } = setSounds(settings, duration, display)
    // const timer = setInterval(function () {
    // }, 100)
  }

  const nodeContainer = new PIXI.ParticleContainer(10000, {
    scale: true,
    position: true
  })

  const myCircle = new PIXI.Graphics() // left static circle
    .beginFill(0xffffff)
    .drawCircle(0, 0, 5)
    .endFill()
  const myCircle_ = new PIXI.Graphics() // right static circle
    .beginFill(0xffffff)
    .drawCircle(0, 0, 5)
    .endFill()

  const myCircle2 = new PIXI.Graphics() // moving sinusoid circle
    .beginFill(0xffff00)
    .drawCircle(0, 0, 5)
    .endFill()
  const myCircle3 = new PIXI.Graphics() // moving sinusoid circle
    .beginFill(0x00ff00)
    .drawCircle(0, 0, 5)
    .endFill()

  const myCircle4 = new PIXI.Graphics() // vertical for breathing
    .beginFill(0x4444ff)
    .drawCircle(0, 0, 5)
    .endFill()

  const app = new PIXI.Application({ // todo: make it resizable
    width: window.innerWidth,
    height: window.innerHeight * 0.85
  })
  document.body.appendChild(app.view)
  const [w, h] = [app.view.width, app.view.height]

  const circleTexture = app.renderer.generateTexture(myCircle)
  // const circleTexture = PIXI.Texture.from('assets/heart.png') // todo: integrate images
  app.stage.addChild(nodeContainer)
  function mkNode (pos, scale) {
    const circle = new PIXI.Sprite(circleTexture)
    circle.position.set(...pos)
    circle.anchor.set(0.5, 0.5)
    circle.scale.set(scale || 1, scale || 1)
    nodeContainer.addChild(circle)
    return circle
  }
  const [x0, y0] = [w * 0.2, h * 0.2]
  const theCircle = mkNode([x0, y0], 1) // moving white circle to which the flakes go

  // to draw the sinusoid:
  const myLine = new PIXI.Graphics()
  const [x, y] = [w * 0.1, h * 0.5]
  const [dx, dy] = [w * 0.8, h * 0.4]
  myLine.lineStyle(1, 0xffffff)
    .moveTo(x, y)
  const segments = 100
  for (let i = 0; i <= segments; i++) {
    myLine.lineTo(x + dx * i / segments, y + Math.sin(2 * Math.PI * i / segments) * dy)
  }

  const c = new PIXI.Container()
  app.stage.addChild(c)
  c.addChild(myLine)
  c.addChild(myCircle)
  c.addChild(myCircle_)
  c.addChild(myCircle2)
  c.addChild(myCircle3)
  c.addChild(myCircle4)
  // myCircle4.x = x + dx * 1.05 // todo: give option to use
  myCircle4.x = x + dx / 2
  myCircle.position.set(x, y)
  myCircle_.position.set(x + dx, y)

  function setSounds (s, duration, display) {
    const synth = maestro.mkOsc(0, -400, -1, 'sine') // fixme: dummy freq
    const synth2 = maestro.mkOsc(0, -400, 1, 'sine') // fixme: dummy freq
    // synth.volume.rampTo(-400, 1) // fixme: delete?
    // synth2.volume.rampTo(-400, 1)
    const oscAmp = s.ma
    const mod_ = maestro.mkOsc(1 / s.mp0, 0, 0, 'sine', true)
    const mul = new t.Multiply(oscAmp)
    const mod = mod_.connect(mul)
    const addL = new t.Add(s.fl)
    const addR = new t.Add(s.fr)
    mul.connect(addL)
    mul.connect(addR)
    addL.connect(synth.frequency)
    addR.connect(synth2.frequency)

    const met = new t.Meter()
    const met2 = new t.DCMeter()
    addL.connect(met)
    addL.connect(met2)

    const parts = []
    let prop = 1
    let propx = 1
    let propy = 1
    let rot = Math.random() * 0.1
    let okGiven, started
    const freqRef = s.fl
    const timer = setInterval(() => {
      let minutes = parseInt(duration / 60, 10)
      let seconds = parseInt(duration % 60, 10)

      // todo: hour
      minutes = minutes < 10 ? '0' + minutes : minutes
      seconds = seconds < 10 ? '0' + seconds : seconds

      // display.text('status: countdown on ' + minutes + ':' + seconds)
      countdown.text('countdown on ' + minutes + ':' + seconds)

      duration -= 0.01
      if (!okGiven) {
        if (conoff.attr('disabled')) {
          grid.css('background', 'green')
          okGiven = true
        } else {
          return
        }
      }
      if (duration < 0 && !started) { // todo: start another countdown with s.d
        duration = 0
        started = true
        // display.text('status: started')
        countdown.text('started')
        // t.start()
        t.Master.mute = false
        synth.volume.rampTo(-40, 1)
        synth2.volume.rampTo(-40, 1) // todo: synth2 => synthR
        mod.frequency.rampTo(1 / s.mp1, s.md)
        setTimeout(() => {
          clearInterval(timer)
          grid.css('background', 'blue')
          countdown.text('finished')
          synth.volume.rampTo(-400, 10)
          synth2.volume.rampTo(-400, 10)
        }, s.d * 1000)
      }

      const dc = met2.getValue()
      m1.text(met.getValue().toFixed(3))
      m2.text(dc.toFixed(3))
      const val = (freqRef - dc) / oscAmp
      const avalr = Math.asin(val)
      const px = (avalr < 0 ? 2 * Math.PI + avalr : avalr) / (2 * Math.PI) * dx + x
      const px2 = (Math.PI - avalr) / (2 * Math.PI) * dx + x

      myCircle2.x = px
      myCircle2.y = myCircle3.y = myCircle4.y = val * dy + y
      myCircle3.x = px2

      const sc = 0.3 + (-val + 1) * 3
      myCircle4.scale.set(sc * propx, sc * propy)
      myCircle4.rotation += rot

      if (s.ellipse && sc - 0.3 < 0.0005) {
        rot = Math.random() * 0.1
        prop = Math.random() * 0.6 + 0.4
        propx = prop
        propy = 1 / prop
      }

      const circ = mkNode([myCircle2.x, myCircle2.y], 0.3)
      parts.push(circ)
      circ.tint = 0xffff00

      const circ2 = mkNode([myCircle3.x, myCircle3.y], 0.3)
      parts.push(circ2)
      circ2.tint = 0x00ff00
      if (Math.random() > 0.98) {
        const circ4 = mkNode([myCircle4.x, myCircle4.y], 0.3)
        parts.push(circ4)
        circ4.tint = 0x5555ff
      }

      theCircle.x += (Math.random() - 0.5)
      theCircle.y += (Math.random() - 0.5)
      for (let ii = 0; ii < parts.length; ii++) {
        const n = parts[ii]
        const sx = theCircle.x - n.x
        const sy = theCircle.y - n.y
        const mag = (sx ** 2 + sy ** 2) ** 0.5
        if (mag < 5) {
          parts.splice(ii, 1)
          n.destroy()
        } else {
          n.x += sx / mag + (Math.random() - 0.5) * 5
          n.y += sy / mag + (Math.random() - 0.5) * 5
          // n.tint = (n.tint + 0xffffff * 0.1 * Math.random()) % 0xffffff // todo: give option
        }
      }
    }, 10)
    return { synth, synth2, mod }
  }
  // sound

  const grid = utils.mkGrid(2)
  $('<div/>').appendTo(grid).text('status:')
  const countdown = $('<div/>', { id: 'countdown' }).appendTo(grid)
  grid.css('background', 'yellow')

  const vonoff = $('<div/>', { id: 'vonoff' }).appendTo(grid).text('Check me!')

  const conoff = $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid).change(function () {
    if (this.checked) {
      t.start()
      t.Master.mute = true
      this.disabled = true
      // play
      vonoff.text('All set!')
    }
  })

  $('<div/>').text('meter').appendTo(grid)
  const m1 = $('<div/>', { id: 'meter1' }).appendTo(grid)
  $('<div/>').text('meter DC').appendTo(grid)
  const m2 = $('<div/>', { id: 'meter2' }).appendTo(grid)
}

e.atry = mid => {
  console.log(m)
  m.model1(mid)
}

e.atry2 = mid => {
  console.log(m)
  m.model2(mid)
}

e.tcolor = () => {
  console.log(window.jscolor)
  const J = require('@eastdesire/jscolor')
  console.log(J)
  $('<input/>', {
    id: 'pick'
  }).appendTo('body')
  const jj = new J('#pick', { value: '#FF0000' })
  window.j = { J, jj, PIXI }
}

e.safariOsc = () => {
  const addL = new t.Add(300)
  const mul = new t.Multiply(200)
  mul.connect(addL)
  const met = new t.Meter()
  const met2 = new t.DCMeter()
  addL.connect(met)
  addL.connect(met2)

  const mod_ = maestro.mkOsc(0.1, 0, 0, 'sine', true)
  const mod = mod_.connect(mul)
  window.deb = { addL, mul, met, met2, mod_, mod, t }

  const grid = utils.mkGrid(2)
  const vonoff = $('<div/>', { id: 'vonoff' }).appendTo(grid).text('Stopped')
  $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid).change(function () {
    if (this.checked) {
      t.context.resume()
      t.start()
      t.Master.mute = false
      vonoff.text('Playing')
    } else {
      vonoff.text('Stopped')
    }
  })
}

e.safariOsc2 = () => {
  const o = new t.Oscillator(0.1, 'sine').start()
  const met = new t.DCMeter({ channelCount: 1 })
  o.connect(met)

  const l = new t.LFO(0.1, -1, 1).start()
  const met2 = new t.DCMeter()
  l.connect(met2)

  const grid = utils.mkGrid(2)
  const vonoff = $('<div/>', { id: 'vonoff' }).appendTo(grid).text('Stopped')
  $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid).change(function () {
    if (this.checked) {
      t.context.resume()
      t.start()
      t.Master.mute = false
      vonoff.text('Playing')
    } else {
      vonoff.text('Stopped')
    }
  })
  $('<div/>').text('meter DC o').appendTo(grid)
  const m = $('<div/>').appendTo(grid)
  $('<div/>').text('meter DC l').appendTo(grid)
  const m2 = $('<div/>', { id: 'meter2' }).appendTo(grid)
  setInterval(() => {
    m.text(met.getValue().toFixed(5))
    m2.text(met2.getValue().toFixed(5))
  }, 10)
  // const app = new PIXI.Application()
  // app.ticker.add(() => {
  //   m.text(met.getValue())
  //   m2.text(met2.getValue())
  // })
  window.lll = { l, o, met, met2 }
}

e.binauralMeta = () => {
  // just as previous function
  // but has a rate for decreasing Martigli oscillation (Hz / min)
  // and for decreasing right channel freq (Hz / min)
  // + 2-3 words to be repeated with some density (words / min)
  $('canvas').hide()
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const out = ctx.destination
  window.ios = { ctx, out }

  const E = ctx.createOscillator() // Modulator
  const F = ctx.createOscillator() // Carrier
  const F2 = ctx.createOscillator() // Carrier2
  const audioContext = ctx

  window.oscs = { E, F, F2 }

  // Setting frequencies
  const a = u
  E.frequency.value = a('o') || 0.01
  F.frequency.value = a('l') || 440
  F2.frequency.value = a('r') || 455

  // Modulation depth
  const eGain = ctx.createGain()
  eGain.gain.value = a('a') || 400

  // Wiring everything up
  E.connect(eGain)
  eGain.connect(F.frequency)
  eGain.connect(F2.frequency)

  // pan:
  let pan, pan2
  if (ctx.createStereoPanner) { // chrome and firefox:
    pan = ctx.createStereoPanner()
    pan2 = ctx.createStereoPanner()
    pan.pan.value = -1
    pan2.pan.value = 1
  } else { // todo: make ok for safari:
    pan = ctx.createPanner()
    pan.panningModel = 'equalpower'
    pan.setPosition(pan, 0, 1 - Math.abs(pan))
  }

  // master gain:
  const eGain2 = ctx.createGain()
  eGain2.gain.value = a('g') || 0.01

  F.connect(pan).connect(eGain2)
  F2.connect(pan2).connect(eGain2)
  eGain2.connect(out)

  // Start making sound
  $('<span/>').html('Play/Payse').appendTo(
    $('<button/>', {
      'data-playing': 'false',
      'aria-checked': 'false',
      role: 'switch',
      id: 'mbtn'
    }).appendTo('body').click(function () {
      if (audioContext.state === 'suspended') { // autoplay policy
        audioContext.resume()
      }

      if (this.dataset.playing === 'false') {
        E.start()
        F.start()
        F2.start()
        this.dataset.playing = 'true'
        // const d = (a('d') || 0) / 600 // because it will change freq each 100ms
        const b = (a('b') || 0) / 600 // because it will change freq each 100ms
        const d = Math.pow(0.5, 1 / 600)
        setInterval(() => {
          E.frequency.value *= d
          F2.frequency.value -= b
        }, 100)
      } else {
        E.stop()
        F.stop()
        F2.stop()
        this.dataset.playing = 'false'
      }
    })
  )
  $('<div/>').html(`
  <h2>Hyper-binaural beats</h2>
  This page makes available a simple interface for binaural beats + Martigli oscillations.

  <h3>URL arguments description:</h3>
  <ul>
  <li>
  l: left frequency. Default: 440 Hz. Current: ${a('l')} Hz
  </li>
  <li>
  r: right frequency. Default: 455 Hz. Current: ${a('r')} Hz
  </li>
  <li>
  o: Martigli oscillation frequency. Default: 0.01 Hz. Current: ${a('o')} Hz
  </li>
  <li>
  a: Martigli oscillation depth. Default: 400 Hz. Current: ${a('a')} Hz
  </li>
  <li>
  g: master gain. Default: 0.01 RMS. Current: ${a('g')} RMS
  </li>
  </ul>

  Examples:
  <ul>
  <li>
  skull screening: ${linkL('?binauralMeta&l=400.1&r=400&o=2&a=200&g=0.01')}
  </li>
  <li>
  skull screening 2: ${linkL('?binauralMeta&l=400.2&r=400&o=0.5&a=50&g=0.01')}
  </li>
  <li>
  concentration sweep: ${linkL('?binauralMeta&l=400&r=415&o=0.01&a=200&g=0.01')}
  </li>
  <li>
  concentration sweep2: ${linkL('?binauralMeta&l=400&r=410&o=0.01&a=200&g=0.01')}
  </li>
  <li>
  Alpha (|l - r| in 8-13 Hz).
  </li>
  <li>
  Beta (|l - r| in 13-30 Hz).
  </li>
  <li>
  Theta (|l - r| in 1-5 Hz).
  </li>
  <li>
  Delta (|l - r| in 4-8 Hz).
  </li>
  </ul>
  <br><br>
  :::
  `).appendTo('body')
}

e.binauralMeta2 = () => {
  // just as binauralMeta but also add oscillation on the pan
}

e.binauralMeta3 = () => {
  // just as binauralMeta2 but add encoded time to start on the URL
  // and let add more than one oscillatory voice
}

const linkL = path => {
  return `<a href="${path}">${path}</a>`
}

e.communion = () => {
  // $('<div/>', {
  //   css: {
  //     margin: '0 auto',
  //     padding: '8px',
  //     width: '50%'
  //   }
  // }).appendTo('body').html(`
  const adiv = utils.stdDiv().html(`
  <h2>Communions</h2>

  <p>We have daily meetings around 6h, 12h, and 18h (GMT-3).
  In them we concentrate for Humanity's
  well-being, and by extension also for World and Cosmic well-being.
  </p>

  <p>The intended outline:
  <ul>
    <li>10 minutes to gather, talk, agree on the mentalization subject and preparations in general.</li>
    <li>15 minutes to concentrate/meditate, with breathing and brainwaves synchronized through the online gadgets linked below. Thus <b>anyone that arrives late misses the meditation</b>.</li>
    <li>5 minutes for final words and considerations and farewells.</li>
  </ul>
  </p>

  <p>Join us at <a target="_blank" href="https://meet.google.com/bkr-vzhw-zfc">our video conference</a></a>.</p>
  `)
  const l = t => `<a href="?_${t}" target="_blank">${t.replace(/^_+/, '')}</a>`
  const grid = utils.mkGrid(1, adiv, '60%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))
  $('<span/>', { css: { 'margin-left': '10%' } }).html('<b>when</b>&nbsp;&nbsp; (GMT-0)&nbsp : <b>subject</b>').appendTo(grid)
  // $('<span/>').html('<b>subject</b>').appendTo(grid)
  // $('<span/>').html('').appendTo(grid)
  utils.gridDivider(160, 160, 160, grid)
  transfer.findAll({ communionSchedule: true }).then(r => {
    window.myr = r
    r.sort((a, b) => b.dateTime - a.dateTime)
    r.forEach(e => {
      const adate = (new Date(e.dateTime - 60 * 10 * 1000)).toISOString()
        .replace(/T/, ' ')
        .replace(/:\d\d\..+/, '')
      console.log(adate)
      // $('<span/>').text(adate).appendTo(grid)
      // $('<span/>').html(l(e.meditation)).appendTo(grid)
      $('<span/>', { css: { 'margin-left': '10%' } }).html(`${adate}: ${l(e.meditation)}`).appendTo(grid)
      // $('<span/>').html(l(e.meditation)).appendTo(grid)
    })
    $('<span/>', { css: { 'margin-left': '10%' } }).html('December 1st, 6h: health (for one\'s self, loved ones, people in need, all humanity)').appendTo(grid)
    // $('<span/>').html('health (for one\'s self, loved ones,<br>people in need, all humanity)').appendTo(grid)
    $('#loading').hide()
  })
}

e.panTest2 = () => {
  const synth = maestro.mkOsc(0, -400, -1, 'sine')
  const synthR = maestro.mkOsc(0, -400, -1, 'sine')
  const mul = new t.Multiply(20)
  const mod_ = maestro.mkOsc(0.1, 0, 0, 'sine', true).connect(mul)
  const addL = new t.Add(700)
  const addR = new t.Add(200)

  mul.connect(addL)
  mul.connect(addR)
  addL.connect(synth.frequency)
  addR.connect(synthR.frequency)

  const neg = new t.Negate()
  const mul1 = new t.Multiply(1)
  mod_.connect(neg)
  mod_.connect(mul1)
  mul1.connect(synth.panner.pan) // dc
  neg.connect(synthR.panner.pan) // -dc

  const met2 = new t.DCMeter()
  const me = new t.DCMeter()
  const meN = new t.DCMeter()
  mod_.connect(met2)
  neg.connect(meN)
  setInterval(() => {
    console.log([met2, me, meN].map(i => i.getValue()))
    console.log(synth.panner.pan.value, synthR.panner.pan.value)
  }, 500)
  const grid = utils.mkGrid(2)
  const vonoff = $('<div/>', { id: 'vonoff' }).appendTo(grid).text('Stopped')
  $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid).change(function () {
    if (this.checked) {
      // t.context.resume()
      t.start()
      synth.volume.rampTo(-20, 1)
      synthR.volume.rampTo(-20, 1)
      t.Master.mute = false
      vonoff.text('Playing')
    } else {
      vonoff.text('Stopped')
    }
  })
  window.maux = { mod_, me, meN, neg, synth, synthR }
}

e.panBug = () => { // todo: post on tonejs' github
  const synth = maestro.mkOsc(0, -400, -1, 'sine')
  const synth2 = maestro.mkOsc(0, -400, -1, 'sine')
  const synth3 = maestro.mkOsc(0, -400, -1, 'sine')
  const mul = new t.Multiply(20)
  const mod_ = maestro.mkOsc(0.1, 0, 0, 'sine', true).connect(mul)
  const addL = new t.Add(700)
  const addR = new t.Add(200)

  mul.connect(addL)
  mul.connect(addR)
  addL.connect(synth.frequency)
  addR.connect(synth2.frequency)

  const neg = new t.Negate()
  const mul1 = new t.Multiply(1)
  mod_.connect(neg)
  mod_.connect(mul1)
  mul1.connect(synth.panner.pan)
  neg.connect(synth2.panner.pan)
  mod_.connect(synth3.panner.pan) // this should entail the same result as synth + mul1, no?

  setInterval(() => {
    console.log(synth.panner.pan.value, synth2.panner.pan.value, synth3.panner.pan.value)
  }, 500)
  const grid = utils.mkGrid(2)
  const vonoff = $('<div/>', { id: 'vonoff' }).appendTo(grid).text('Stopped')
  $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid).change(function () {
    if (this.checked) {
      t.start()
      synth.volume.rampTo(-20, 1)
      synth2.volume.rampTo(-20, 1)
      synth3.volume.rampTo(-20, 1)
      vonoff.text('Playing')
    } else {
      vonoff.text('Stopped')
    }
  })
  window.maux = { mod_, neg, synth, synth2, synth3 }
}

e.envPan = () => {
  const sub1 = new t.Add(-1)
  const mul = new t.Multiply(2).connect(sub1)
  const env = new t.Envelope({
    attack: 3,
    decay: 0.2,
    sustain: 1,
    release: 5
  }).connect(mul)
  const synth = maestro.mkOsc(200, -400, -1, 'sine')
  sub1.connect(synth.panner.pan) // dc

  const sub1_ = new t.Negate()
  sub1.connect(sub1_)

  const grid = utils.mkGrid(2)
  const vonoff = $('<div/>', { id: 'vonoff' }).appendTo(grid).text('Stopped')
  $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid).change(function () {
    if (this.checked) {
      t.start()
      synth.volume.rampTo(-20, 1)
      env.triggerAttackRelease(10)
      vonoff.text('Playing')
    } else {
      vonoff.text('Stopped')
    }
  })
  const met2 = new t.DCMeter()
  env.connect(met2)
  const met = new t.DCMeter()
  sub1.connect(met)
  const met3 = new t.DCMeter()
  sub1_.connect(met3)
  setInterval(() => {
    console.log('val:', met3.getValue(), met2.getValue(), met.getValue(), synth.panner.pan.value)
  }, 200)
}

e.lemniscate = () => {
  const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight * 0.85
  })
  document.body.appendChild(app.view)
  // const c = [300, 200] // center
  const c = [app.view.width / 2, app.view.height / 2] // center
  // const a = 200 // half width
  const a = app.view.width / 4
  const xy = ii => {
    const px = a * Math.cos(ii) / (1 + Math.sin(ii) ** 2)
    const py = Math.sin(ii) * px
    return [px + c[0], py + c[1]]
    // return [py + c[1], px + c[0]]
  }
  const myLine = new PIXI.Graphics()
  myLine.lineStyle(1, 0xff0000)
    .moveTo(...xy(0))
  const segments = 100
  for (let i = 1; i <= segments; i++) {
    myLine.lineTo(...xy(2 * Math.PI * i / 100))
  }
  app.stage.addChild(myLine)
  app.stage.addChild(
    new PIXI.Graphics()
      .beginFill(0xffffff)
      .drawCircle(...xy(0), 5)
      .endFill()
  )
  app.stage.addChild(
    new PIXI.Graphics()
      .beginFill(0xffffff)
      .drawCircle(...xy(Math.PI), 5)
      .endFill()
  )
  app.stage.addChild(
    new PIXI.Graphics()
      .beginFill(0xffff00)
      .drawCircle(...xy(Math.PI / 2), 5)
      .endFill()
  )
  app.stage.addChild(
    new PIXI.Graphics()
      .beginFill(0x00ff00)
      .drawCircle(...xy(Math.PI / 5), 5)
      .endFill()
  )
  app.stage.addChild(
    new PIXI.Graphics()
      .beginFill(0x00ff00)
      .drawCircle(...xy(Math.PI / 5), 5)
      .endFill()
  )
  app.stage.addChild(
    new PIXI.Graphics()
      .beginFill(0x00ff00)
      .drawCircle(...xy(4 * Math.PI / 5), 5)
      .endFill()
  )
  app.stage.addChild(
    new PIXI.Graphics()
      .beginFill(0x00ff00)
      .drawCircle(...xy(6 * Math.PI / 5), 5)
      .endFill()
  )
  app.stage.addChild(
    new PIXI.Graphics()
      .beginFill(0x00ff00)
      .drawCircle(...xy(9 * Math.PI / 5), 5)
      .endFill()
  )
}

e.aeterni = () => {
  const itemsB = [
    ['https://nypost.com/2020/11/20/scientists-reverse-human-aging-process-in-breakthrough-study/', 'hyperbaric oxygen chambers to target specific cells and DNA linked to shorter lifespans ']
  ].reduce((a, i) => a + `<li><a href="${i[0]}" target="_blank">${i[1]}</a></li>`, '')
  const items = [
    ['https://www.calicolabs.com/', 'Calico', ', a multi billion dollar company dedicated to combating aging and associated diseases.'],
    ['http://paloaltoprize.com/', 'Palo Alto Longevity Prize', ': long term initiative upholding prizes for advances in longevity.'],
    ['https://www.lifespan.io/', 'Life Extension Advocacy Foundation', ': crowdfunding longevity.'],
    ['https://www.rlecoalition.com/', 'Coalition for Radical Life Extension', ': a not-for-profit organization to galvanize a popular movement.'],
    ['https://www.longevity.vc/', 'The Longevity Fund', ': backing entrepreneurs developing therapeutics for age-related disease.']
  ].reduce((a, i) => a + `<li><a href="${i[0]}" target="_blank">${i[1]}</a>${i[2]}</li>`, '')
  const itemsW = [
    ['https://en.wikipedia.org/wiki/Life_extension', 'Life extension'],
    ['https://en.wikipedia.org/wiki/Anti-aging_movement', 'Anti-aging movement'],
    ['https://en.wikipedia.org/wiki/Aging_brain', 'Aging brain'],
    ['https://en.wikipedia.org/wiki/Ageing', 'Aging'],
    ['https://en.wikipedia.org/wiki/Compression_of_morbidity', 'Compression of morbidity'],
    ['https://en.wikipedia.org/wiki/Immortality', 'Immortality'],
    ['https://en.wikipedia.org/wiki/Futures_studies', 'Futurism'],
    ['https://en.wikipedia.org/wiki/Transhumanism', 'Transhumanism'],
    ['https://en.wikipedia.org/wiki/Maximum_life_span', 'Maximum life span'],
    ['https://en.wikipedia.org/wiki/Ray_Kurzweil', 'Ray Kurzweil'],
    ['https://en.wikipedia.org/wiki/Marios_Kyriazis', 'Marios Kyriazis'],
    ['https://en.wikipedia.org/wiki/Aubrey_de_Grey', 'Aubrey de Grey'],
    ['https://en.wikipedia.org/wiki/Extropianism', 'Extropia / Extropianism'],
    ['https://en.wikipedia.org/wiki/Self-experimentation', 'Self-experimentation'],
    ['https://en.wikipedia.org/wiki/Psychonautics', 'Psychonautics'],
    ['https://en.wikipedia.org/wiki/Mind_machine', 'Mind Machine'],
    ['https://en.wikipedia.org/wiki/Brainwave_entrainment', 'Brainwave entrainment'],
    ['https://en.wikipedia.org/wiki/Senolytic', 'Senolytics']
  ].reduce((a, i) => a + `<li><a href="${i[0]}" target="_blank">${i[1]}</a></li>`, '')
  utils.stdDiv().html(`
    <h2>Hints</h2>
  <div>
    on the probably soon-to-come immortality.
    <p>
      The approach taken here is that, through successive life extension breakthroughs,
      our bodies may reach the historical period in which technological immortality is attained.
    </p>
    <p>
      The <b>Œternum</b> initiative is dedicated to providing mechanisms for
      improving the chances of attaining immortality:
      the individual may expand s/he's lifespan and the society may be more effective in developing the technologies.
    </p>
    <p>Breakthroughs:
<ul>${itemsB}</ul>
    </p>
    <p>Initiatives (preliminary list):
<ul>${items}</ul>
    </p>
    <p>Relevant Wikipedia articles:
<ul>${itemsW}</ul>
    </p>
    <p>
    Further keywords: hallmarks of aging, rejuvenation biotechnology, 
  </div>
  `).appendTo('body')
  $('#loading').hide()
}

e.accounts = () => {
  $('body').css('background-color', '#aaaaaa')
  // $("<style type='text/css'> .rcol { border-left: 1px solid #000000 ; margin-left: 3%; padding-left: 3%; } </style>").appendTo('head')
  const grid = utils.mkGrid(2, 'body', '70%', '#ffffff')
    .append($('<span/>').html('<b>github</b>'))
    .append($('<span/>', { class: 'rcol' }).html('<b>gmail prefix</b>'))
  const items = [
    ['aeterni', 'aeterni.anima'],
    ['s1te', 'wowsitewow'],
    ['l4bs', 'entrainment.l4bs'],
    ['f466r1', 'f466r1'],
    ['extropia', 'extropia.extropia'],
    ['theopoesis', 'theopoesis.path'],
    ['divinization', 'divinization.path'],
    ['worldhealing', 'sync.aquarium'],
    ['markturian', 'markarcturian'],
    ['five-and-seven', 'five.and.seven.publishing'],
    ['litteratura', 'litteratura.publishing']
  ]
  items.forEach(i => {
    grid.append($('<span/>').html(i[0]))
    grid.append($('<span/>', { class: 'rcol' }).html(i[1]))
  })
  $('<div/>', {
    css: {
      margin: '0 auto',
      padding: '8px',
      width: '50%'
    }
  }).append('<h2>Partners</h2>')
    .append(grid)
    .appendTo('body')
}

e.sampler = () => {
  const player = new t.Player('assets/audio/boom.mp3').toDestination()
  window.ppp = player
  // play as soon as the buffer is loaded
  // player.autostart = true
  const grid = utils.mkGrid(2)
  const vonoff = $('<div/>', { id: 'vonoff' }).appendTo(grid).text('Stopped')
  // t.stop()
  $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid).change(function () {
    if (this.checked) {
      t.context.resume()
      t.start()
      player.start()
      t.Master.mute = false
      vonoff.text('Playing')
    } else {
      vonoff.text('Stopped')
    }
  })
}

e.tgui = () => {
  const dat = require('dat.gui')
  const gui = new dat.GUI({ name: 'My Banana', closed: true, closeOnTop: true })
  const master = gui.add({ master: 50 }, 'master', 0, 100).listen()
  const binaural = gui.add({ binaural: 50 }, 'binaural', 0, 100).listen()
  const sample = gui.add({ sample: 50 }, 'sample', 0, 100).listen()
  master.onChange(v => console.log(v, 'CHANGED'))
  binaural.onChange(v => console.log(v, 'CHANGED'))
  sample.onChange(v => console.log(v, 'CHANGED'))
  window.agui = gui
  $('.close-top').text('Open Volume Controls')
  let i = 0
  $('.close-top').click(function () {
    console.log(this, 'yeah2')
    this.textContent = `${i++ % 2 === 0 ? 'Close' : 'Open'} Volume Controls`
    window.ttt = this
  })
}

const link = (text, path) => {
  const ua = window.wand.router.urlArgument
  const lflag = ua('lang') ? `&lang=${ua('lang')}` : ''
  return `<a href="?${path + lflag}">${text}</a>`
}

const elink = (text, path) => {
  return `<a href="${path}">${text}</a>`
}
const elink_ = (text, path) => {
  return `<a href="?.${path}">${text}</a>`
}

e.angel = () => {
  const items = [
    '"chave Pix": <b>luz</b>; or',
    `the ${link('Paypal inlet', 'paypal')}; or`,
    `the ${link('Pagseguro inlet', 'pagseguro')}; or`,
    `the ${link('Bitcoin inlet', 'bitcoin')}.`
  ].reduce((a, t) => a + `<li>${t}</li>`, '')

  utils.stdDiv().html(`
  <h2>Aid <b>Æterni Anima</b></h2>
  <p>
  Please send us feedback on your experience with <b>Æterni</b> and ideas for enhancements or derivatives, join the coordination, creation and tech tasks, donate through:
  </p>

  ${items}
  <br/>
  <p>
  Write us for a direct bank transfer,
  to help us include other e-coins such as Ethereum,
  and whatnot.
  </p>
  <p>
  Get in touch through <a href="mailto:aeterni.anima@gmail.com" target="_blank">our email</a>.
  </p>
  <p>
  Thank you.
  </p>
    `
  ).appendTo('body')
  $('canvas').hide()
  $('#loading').hide()
}

e.sequences = () => {
  // const spheres = {
  //   culta: 'Λατρεία',
  //   mistica: 'ಅತೀಂದ್ರಿಯ',
  //   erudita: 'ልዕለ እውቀት ያለው',
  //   harmona: 'ਖੇਤਰ ਦਾ ਸੰਗੀਤ',
  //   frequentia: 'સામાજિક તાકાત'
  // }
  const arts = [
    [
      'alpha9.15',
      'Entrain brain to simple and clean 9.15Hz alpha'
    ],
    [
      'betas',
      'Low-med-high beta waves, found by some to be great for being concentrated and engaged'
    ],
    [
      'gamma40_',
      'Two simple classic 40Hz, periodic pan transitions, symmetries in 5 and 3.'
    ],
    [
      'midLowAlpha2',
      '10Hz alpha.'
    ],
    [
      '40-1_sim1-..4__',
      'Entrain to 40Hz and 1Hz with symmetries'
    ]
  ].reduce((a, i) => a + `<li><a href="?.${i[0]}" target="_blank">${i[1]}</a>.</li>`, '')
  utils.stdDiv().html(`
  <h1>Audiovisual Sequences for health enhancement</h1>

  <p>Enjoy:
  <ol>${arts}</ol>
  </p>

  In case you want instructions:
  <ol>
    <li>
      Click in one of the links above and enjoy if you manage to start the sequence by yourself.
    </li>
    <li>
      To start the sequence, you click on the "Open Controls" button on the top right, and then in the "... Start now! ..." that appears on the drop-down menu.
    </li>
    <li>
      To enjoy the session, you may just let is sound with or without earphones, you may concentrate on the sequence (maybe meditating) or do something else entirely, such as work, hobby, any task really.
    </li>
    <li>
      In any case, we advise you to breath following the slow oscillatory pattern on the sound (loosely).
      If you are looking into the screen, there is always an spinning circle going up and down, growing and getting smaller, in the same breathing rhythm.
      You will find other visual cues for breathing, but it is ok to close your eyes or do something else. The sound is effective enough.
      Of course, it is fine not to breath in the breathing pattern imprinted in the artifacts, for example if you don't find it comfortable.
    </li>
  </ol>
  <br>

  <p>You are <b>UNADVISED TO PERFORM THIS WEBSITE'S AUDIOVISUAL SESSIONS IF YOU HAVE A HISTORY OF EPILEPSY/SEIZURES</b>.
  Please refer to <a href="https://www.sciencedirect.com/science/article/pii/B9780123969880000015" target="_blank"> this writing on nonpharmacological methods of influencing the brain</a>, and <a href="https://www.sciencedirect.com/science/article/pii/B9780128037263000031" target="_blank">this about audio-visual entrainment</a> (what we are doing here).</p>

  :::
  `)
  $('#loading').hide()
}

e.guide = () => {
  utils.stdDiv().html(`
  <h1>How to use Audiovisual Medicine</h1>

  <p>Audiovisual Medicine is a powerful tool to improve your health, and it’s
      proved to work for many people.</p>
  
  <h2>The basics</h2>
  
  <p>Starting your journey is very simple. Just follow these steps:</p>
  
  <ol>
  
      <li>Pick one of our preconfigured sequences:</li>
  
      <ul>
  
          <li><a href="https://audiovisualmedicine.github.io/?.alpha9.15">Peaceful
                  Pulse</a>: a simple and clean 9.15 Hz alpha wave to cultivate a sense of
              peacefulness.</li>
  
          <li><a href="https://audiovisualmedicine.github.io/?.betas">Cognitive
                  Crescendo</a>: a sequence of low, med, and high beta waves, often the best
              choice for learning.</li>
  
          <li><a href="https://audiovisualmedicine.github.io/?.gamma40_">Genius
                  Glow</a>: two simple 40 Hz gamma waves with periodic pan transitions and
              symmetries in 5 and 3, used to enhance the creativity flow.</li>
  
          <li><a href="https://audiovisualmedicine.github.io/?.midLowAlpha2">Harmony
                  Haven</a>: a 10 Hz alpha wave to promote a feeling of harmony.</li>
  
          <li><a href="https://audiovisualmedicine.github.io/?.40-1_sim1-..4__">Expanded
                  Enlightenment</a>: a combo of gamma waves at 40 Hz and delta waves at 1Hz, with
              symmetries, to foster deep meditation and altered states of consciousness.</li>
      </ul>
  
      <li>Click “Open Controls” and then “Start now!”.</li>
  
      <li>You may use some headphones or let the sound play from a speaker.
          Meanwhile, you can work, meditate, or do anything you like.</li>
  
      <li>Pay attention to the oscillatory pattern of the sound and try to mimic
          it with your breath. If you’re looking at the screen, you’ll see a spinning
          circle moving up and down, growing and shrinking with the breathing rhythm.
          There are quite a few visual cues to sync your breathing to the sound, but it’s
          ok to just close your eyes or do something else.</li>
  
  </ol>
  
  <h2>Improve your sessions</h2>
  
  <p>To maximize the benefits of using Audiovisual Medicine, there are some tips
      you can follow:</p>
  
  <ol>
      <li><strong>Read the safety information:</strong> before you begin your
          journey with Audiovisual Medicine it’s important you read our safety notes.
          Doing this will help you understand if it’s safe for you to use and it will
          create a trusting space for you to explore all the benefits of your session.</li>
  
      <li><strong>Let your doctor know:</strong> Audiovisual Medicine can benefit
          many health issues, such as pain control, TDHA, migraines, depression, anxiety,
          insomnia, cognitive decline or impairment, bipolar or borderline disorders,
          schizophrenia, psychoses and neuroses. If you suffer from any of these and you
          use Audiovisual Medicine often or for long periods of time, please contact your
          doctor and let them know.</li>
  
      <li><strong>The environment is important:</strong> a good session starts
          with good preparation. For example, you should use Audiovisual Medicine with a
          good pair of headphones and the volume should be set on a comfortable level.
          Before you start your session, spend a few minutes just breathing.</li>
  
      <li><strong>Don’t overuse it:</strong> as with everything, it’s better to
          start slow and gradually increase your use of Audiovisual Medicine. This will
          allow your body and your brain to gently adapt.</li>
  
      <li><strong>Experiment!</strong> Audiovisual Medicine is safe for you to
          experiment and find new benefits. You can experiment with the length of your
          session and with the pattern used. Different combinations will generate
          different effects.</li>
  </ol>
  
  <h2>Advanced configurations</h2>
  
  <p>There are may ways in which you can customize your sessions. When you’re
      creating a new artifact there are many options you can choose from. You can
      usually learn the meaning and function of most parameters by hovering your
      mouse on top of the input field. A tooltip will appear to explain what that
      specific control does.</p>
  
  <p>Here we list a few things you can do.</p>
  
  <h3>Breathing</h3>
  
  <p>The most basic feature you can tweak is breathing, which is linked to
      changes in mood and general well-being. To change the parameters, you can click
      on “Open Controls” in the right top corner of your screen.</li>
  
  <p>You will usually transition from a faster breathing rhythm to a slower one.</p>
  <ul>
  
      <li><strong>Final period</strong>: this is the most important
          parameter, and it shows how many seconds it will take to do a single breath
          once the transition has ended. The default value is 20 seconds, but if you’re
          not used to breathing slowly, smokes or have a history of pulmonary diseases,
          you can lower it to a level you’re comfortable with.</li>
  
      <li><strong>Initial period</strong>: here we set how fast you’ll
          breath in the beginning of the transition. The default value is 10 seconds, but
          as for the first one, you can change it to a value you’re more comfortable
          with.</li>
  
      <li><strong>Transition</strong>: this value shows how long it will
          take to shift from the breathing rhythm set in “Initial period” to the rhythm
          set in “Final period”. The default is 600 seconds, or 10 minutes.</li>
  
      <li><strong>Duration</strong>: here we set how long the whole
          artifact will be. The default is 900 seconds, or 15 minutes.</li>
  </ul>
  
  <h3>Auditory Entrainment</h3>
  
  <p>You can add several elements to your artifact, such as Binaural, Symmetry,
      Martigli, and Sample.</p>
  <ul>
      <li><strong>Binaural</strong>: binaural beats are auditory illusions
          generated when two slightly different waves are heard separately by each ear.
          For example, if we have a wave of 450 Hz and another one of 455 Hz, the result
          will be a 5 Hz beat. For it to be binaural, you have to use headphones,
          otherwise the sound will mix before it reaches your ears.</li>
  
      <li><strong>Symmetry</strong>: a symmetry uses musical notes to
          convey a more aesthetic experience. Also, they’re argued to be essential to
          cognition and will make your session more approachable if you have just begun
          using Audiovisual Medicine.</li>
  
      <li><strong>Martigli</strong>: this oscillation is named after the
          composer Otávio Martigli and it produces an audio cue to help you sync the
          breath.</li>
  
      <li><strong>Sample</strong>: a sample is a pre-recorded sound that is
          played in the background and helps you to be in the flow. Also, sounds such as
          those produced by the ocean waves help you to feel relaxed and focus on the
          session.</li>
  </ul>

  <p>You are <b>UNADVISED TO PERFORM THIS WEBSITE'S AUDIOVISUAL SESSIONS IF YOU HAVE A HISTORY OF EPILEPSY/SEIZURES</b>.
  Please refer to <a href="https://www.sciencedirect.com/science/article/pii/B9780123969880000015" target="_blank"> this writing on nonpharmacological methods of influencing the brain</a>, and <a href="https://www.sciencedirect.com/science/article/pii/B9780128037263000031" target="_blank">this about audio-visual entrainment</a> (what we are doing here).</p>
  <p>:::</p>
        </div>
  `)
  $('#loading').hide()
}

e.welcome2 = () => {
  utils.stdDiv().html(`
  <style>
    .ahero { text-align: center; padding: 0.2em 0 0.4em; }
    .ahero .amark {
      font-family: var(--serif);
      font-size: clamp(3.4rem, 10vw, 5rem);
      line-height: 1;
      color: var(--accent);
      margin: 0;
    }
    .ahero h1 {
      font-family: var(--serif);
      font-weight: 600;
      font-size: clamp(2rem, 6vw, 2.9rem);
      letter-spacing: 0.04em;
      margin: 0.15em 0 0.25em;
    }
    .ahero .atag {
      color: var(--ink-soft);
      font-size: 1.1rem;
      max-width: 30em;
      margin: 0 auto;
    }
    .ahr {
      border: none; height: 1px; margin: 1.7em auto; width: 76%;
      background: linear-gradient(to right, transparent, var(--accent-soft), transparent);
    }
    .aprojects {
      display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
      padding: 0; margin: 1.3em 0;
    }
    .aproj {
      list-style: none; margin: 0; box-sizing: border-box;
      border: 1px solid var(--card-border); border-radius: 14px;
      padding: 15px 18px;
      background: rgba(184, 149, 48, 0.05);
    }
    .aproj--wide { grid-column: 1 / -1; }
    @media (max-width: 620px) { .aprojects { grid-template-columns: 1fr; } }
    .aproj > strong { font-family: var(--serif); font-size: 1.2rem; letter-spacing: 0.01em; }
    .aproj .asub { margin: 0.6em 0 0; padding-left: 1.15em; font-size: 0.97rem; }
    .aproj--feature {
      background: rgba(184, 149, 48, 0.12);
      border-color: var(--accent-soft);
      padding: 20px 22px;
    }
    .aproj--feature > strong { font-size: 1.6rem; }
    .aeyebrow {
      display: block; margin-bottom: 0.35em;
      font-family: var(--sans); font-size: 0.72rem; font-weight: 600;
      letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent);
    }
    .acenter { text-align: center; }
    .amute { color: var(--ink-soft); }
  </style>

  <header class="ahero">
    <p class="amark notranslate">Æ</p>
    <h1 class="notranslate">Æterni Anima</h1>
    <p class="atag">Where science, art and technology converge for well-being — extending and enriching life.</p>
  </header>

  <hr class="ahr"/>

  <p>Welcome. You can learn more <a href="?about">about this initiative</a>, <span id="fund-us"></span>, or explore our projects:</p>

  <ul class="aprojects">
    <li class="aproj aproj--wide aproj--feature"><span class="aeyebrow">Flagship</span><strong><a href="https://biosyncare.com/">BioSynCare</a>:</strong> audiovisual medicine — neuromodulation for well-being through breathing and sound waves produced by <a href="?artifacts">audiovisual artifacts</a>.</li>
    <li class="aproj aproj--wide"><strong><a href="?daimesm">Daime Science Manifesto</a>:</strong> integrating scientific knowledge and spiritual wisdom within the Santo Daime community.
      <ul class="asub">
        <li><strong><a href="https://da1me.github.io/">Da1me</a>:</strong> textual analyses of Santo Daime hymnals.</li>
        <li><strong>QR:</strong> a system for tracking and documenting Daime batches.</li>
        <li><strong>Daimists' Wellness Monitoring:</strong> tracking and analysis of daimists' health before and after the works.</li>
      </ul>
    </li>
    <li class="aproj"><strong>OurAquarium:</strong> navigating and harnessing your own social networks through audiovisual art — for example, making personalized music to share with your contacts and spread custom messages.</li>
    <li class="aproj"><strong><a href="https://github.com/ttm/music">Music</a>:</strong> a Python library for the synthesis of mathematically precise sounds and musical structures.</li>
    <li class="aproj aproj--wide"><strong>Hubs:</strong> establishing cultural exchange hubs worldwide.</li>
  </ul>

  <p>Explore these initiatives aimed at extending and enriching life, fostered for the benefit of every individual, group, and the Cosmos.</p>

  <p class="acenter">Thank you for visiting.</p>
  <p class="acenter amute">:::</p>
  `)
  const wand = window.wand
  const fundUs = document.getElementById('fund-us')
  wand.$('<a/>', {
    href: '',
    id: 'contribL'
  }).html('fund us').appendTo(fundUs).click(() => {
    wand.modal.show()
    return false
  })
  $('#loading').hide()
}

e.welcome = () => {
  if (['aeterni.github.io', 'localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return e.welcome2()
  }
  utils.stdDiv().html(`
  <style>
  .highlighted {
    font-size: 108%;
    color: darkred;
  }
</style>
  <h2 style="text-align:center">Audiovisual Medicine</h2>
  <p>
    This website offers evidence-based, science-backed, audiovisual techniques for mental health enhancement.
  </p>

  <p>
    You can start right away <a href="?guide">with our sequences</a>, each made for a specific use, or build your own. Read the <a href="?guide">Usage Guidelines</a> to understand how to maximize the beneficial effects of your session. Please <a href="" class="contactThing">contact us</a> to share how Audiovisual Medicine impacted your general wellbeing or for any other feedback.
  </p>

  <p id="createme">
    <button id="createbutton">
      Create Your Audiovisual Artifacts
    </button>
  </p>

  <b style="color:red">DISCLAIMER</b>
  <p>
    Audiovisual Medicine is safe and provides great benefits. Even so, <span class="highlighted">it can be dangerous if you have a history of epilepsy or seizures</span>, a case in which we advise you to contact your doctor before harnessing its sessions. <a href="" class="contactThing">Contact us</a> if you need more information. Please remember that this is a Nonprofit and Open Source initiative, thus the responsibility of its usage lies with the user. Be responsible.
  </p>

  :::
  `)
  $('#createme')
    .css('text-align', 'center')
    .css('text-align', 'center')
  $('#createbutton')
    .css('font-size', 'larger')
    .css('padding', '5%')
    .css('box-shadow', '0 8px 16px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19)')
    .css('cursor', 'pointer')
    .on('click', () => {
      window.location.href = '?doc'
    })
  $('.contactThing').click(() => {
    window.wand.modal.show()
    return false
  })

  $('#loading').hide()
}

e.welcomeOLD = () => {
  if (['aeterni.github.io', 'localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return e.welcome2()
  }
  utils.stdDiv().html(`
  <h2 style="text-align:center">Evidence-Based Audiovisual Medicine</h2>

  <p id="createme">
    <button id="createbutton">
      Create Your Audiovisual Artifacts
    </button>
  </p>

  <p id="uconstruction">
  *** Disclaimer ***
  </p>

  <p>
  This website makes available evidence-based, science-backed, audiovisual techniques
  for mental health enhancement.
  </p>

  <p>
  You may promptly estart enjoying <a href="?sequences">the diverse sequences available</a>, which have specific use and benefit highlights. You are encouraged to check <a href="?guidelines">The AVHEALTH Usage Guidelines</a> to better understand how to harness each session.
  </p>


    <h4>Our hypothesis:</h4>
    <p>
      <ul>
        <li>
          Using AVE neuromodulation techiques is healty. In our oppinion, the scientific and practical evidence that
          AVE is healthy in large spectrums (of cases, populations, settings) is evident.
        </li>
        <li>
          Because you understand and use these techniques, you are in a healthy state of mind and
          we of course believe in your good sense. 
        </li>
        <li>
          Example good sense procedures: read the <b style="color:red">IMPORTANT FOR YOUR SAFETY</b> notes below.
          Don't overuse it.
          If you are using it for pain control, ADTH, migraines, etc, let your doctor know about it, specially if you
          use it often and/or for long periods.
        </li>
        <li> If you stay hooked to it for work, meditation, 16h per day for a month, you will get help.
        </li>
        <li>
          If you are using it for pain control, TDHA, migraines, depression, anxiety, insomnina, cognitive decline or impairment, bipolar or borderline disorders, esquisofreny, psychoses or neuroses, you will let your doctor know about it, specially if you
          use it often and/or for long periods or you perceive any dependence.
        </li>
        <li>
          You will read the <b style="color:red">IMPORTANT FOR YOUR SAFETY</b> notes below.
        </li>
        <li>
          You will ask someone to help you learn to use it if you need to.
          For example, it is good to know that you may breathe with the audiovisual cues until
          you only need the audio cue to breath. Then you can do other things, such as read, write,
          work, employ problem-solving skills, meditate, or what be it, untill you turn it off. 
        </li>
        <li>You will use it in a comfortable volume.
        </li>
        <li>
          You understand that the preparation and attention you employ result in better harnessing of the resources. For example: try to have good headphones, take some moments to concentrate on the breathing and think. Learn how to set long and short versions, and how to set the sounds for your linking and appreciate/experiment the neuromodulation effects.
        </li>
        <li>
          You understand the preparation and attention you employ result in better harnessing of these resources. For example: try to have good headphones, take some moments to concentrate on the breathing.
        </li>
      </ul>
    </p>

    <h4> historical note:</h4>
    <p>
      The <b>AVHEALTH</b> initiative was born when we noticed <a href="?benefits">compelling wellness benefits from specific audiovisual stimulation techniques</a> which are poorly available to the general population.
      We invite you to skim through the <a href="?selected-articles">selected scientific articles</a> to grasp the reality of the benefits broadcasted and the technicalities.
    </p>

  <p>
  <b style="color:red">IMPORTANT FOR YOUR SAFETY</b>:
  you are <b>UNADVISED TO PERFORM THIS WEBSITE'S AUDIOVISUAL SESSIONS IF YOU HAVE A HISTORY OF EPILEPSY/SEIZURES</b> (it might ignate episodes).
  The techniques are considered completely safe otherwise, nevertheless if you are unsure about using the AVHEALTH resources, please contact a doctor and/or <a href="?contact">get in touch with the AVHEALTH team</a>. We remind you that the AVHEALTH initiative is not a company and not profit-oriented, and the responsability for the outcome of using it is of the user itself.
  Also, you are invited to send us reports on how AVHEALTH has impacted your general wellbeing.
  </p>

  :::
  `)
  $('#uconstruction')
    .css('color', 'red')
    .css('font-size', '150%')
    .css('text-align', 'center')
    // .fadeOut(1000).fadeIn(1000).fadeOut(1000).fadeIn(1000)
  $('#createme')
    // .css('color', 'black')
    // .css('backgroundColor', 'yellow')
    // .css('backgroundColor', 'rgba(255,255,0,0.5)')
    .css('text-align', 'center')
    // .css('margin', '5%')
    .css('text-align', 'center')
    // .css('border-radius', '5%')
    // .fadeOut(1000).fadeIn(1000).fadeOut(1000).fadeIn(1000)
  $('#createbutton')
    .css('font-size', 'larger')
    .css('padding', '5%')
    .css('box-shadow', '0 8px 16px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19)')
    .css('cursor', 'pointer')
    .on('click', () => {
      window.location.href = '?doc'
    })

  $('#loading').hide()
}

e.daimesm = () => {
  // [code, label, published embed URL ('' = not yet published), commentable doc URL]
  const langs = [
    ['en', 'English', 'https://docs.google.com/document/d/e/2PACX-1vSCJqlSpPE8OyAo-I2xdEl1DhlPwf9aHd7aRsWPHxC4WNX18YgL5oUA35G4wP8Hk6VLlfBV8a5lt16O/pub?embedded=true', 'https://docs.google.com/document/d/1ycexORBC5poOGM5TrGsht8NbWv0yU_0zsGAnRzHqo_A/edit'],
    ['pt', 'Português', '', 'https://docs.google.com/document/d/1K3sc0B19SniNYUGnO1kqnoWfuqc1lvKdjCAxzs4OZl0/edit'],
    ['it', 'Italiano', 'https://docs.google.com/document/d/e/2PACX-1vTEYxSd69ObcqKcwcs1RgTzOna7hPZfMLOkob4D-A522TADpWKZd6BK_E6hD7YpHiVx5hJIElI3n3MI/pub?embedded=true', 'https://docs.google.com/document/d/1WrAOawnLW0FZd5-ubCo6HH5u1TiQG5TkR1O2nZPHSnQ/edit']
  ]
  const buttons = langs.map(l => `<button type="button" class="dsm-lang" data-lang="${l[0]}">${l[1]}</button>`).join('')
  utils.stdDiv().html(`
  <style>
    .dsm-head { text-align: center; margin-bottom: 0.2em; }
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

  <h1 class="dsm-head">Daimist Science Manifesto</h1>
  <p class="dsm-intro">Read the manifesto below, or open it in Google&nbsp;Docs to leave comments and contribute.</p>

  <div class="dsm-langs">${buttons}</div>

  <div id="dsm-view" class="dsm-frame-wrap"></div>

  <p class="dsm-comment"><a id="dsm-edit" href="#" target="_blank" rel="noopener">Open this version in Google Docs to comment &#8599;</a></p>
  <p style="text-align:center;color:var(--ink-soft)">:::</p>
  `)

  const byLang = {}
  langs.forEach(l => { byLang[l[0]] = { label: l[1], pub: l[2], edit: l[3] } })

  const show = code => {
    const d = byLang[code]
    $('.dsm-lang').removeClass('is-active').filter(`[data-lang="${code}"]`).addClass('is-active')
    if (d.pub) {
      $('#dsm-view').html(`<iframe src="${d.pub}" title="Daimist Science Manifesto (${d.label})"></iframe>`)
    } else {
      $('#dsm-view').html(`<div class="dsm-pending">The ${d.label} version is open for reading and comments in Google Docs — use the link below.</div>`)
    }
    $('#dsm-edit').attr('href', d.edit)
  }

  $('.dsm-lang').on('click', function () { show($(this).data('lang')) })
  show('en')

  $('#loading').hide()
}

e.about2 = () => {
  utils.stdDiv().html(`
  <style>
  .highlighted {
    font-size: 108%;
    color: darkred;
  }
</style>
<h2>About Æterni Anima</h2>
<p><strong>Æterni Anima</strong> is an initiative established in December 2020 to promote <span class="highlighted">longevity</span> and <span class="highlighted">advance humanity towards immortality</span>. We integrate science, art and technology and foster <span class="highlighted">wellbeing</span> within various endeavors, from developing and providing <a href="https://audiovisualmedicine.github.io">Audiovisual Stimulation gadgets</a> to enabling one's social networks harnessing. Through our <strong>publishing activity</strong>, we curate and disseminate <span class="highlighted">transformative narratives</span>.</p>

<p>We invite you to join us on this journey. Your participation is invaluable, and we look forward to sharing each step with you.</p>
<p>:::</p>
  `)
  $('#loading').hide()
}

e.about = () => {
  if (['aeterni.github.io', 'localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return e.about2()
  }
  utils.stdDiv().html(`
  <h2>About</h2>

  <p>Audiovisual Medicine is a tool to improve your wellbeing through finely tuned audio and visual sequences.</p>

  <p>This initiative was born because we noticed that the compelling wellness benefits from
      specific audiovisual stimulation techniques are poorly available to the general population.</p>

  <p>Our technology is backed by evidence-based scientific studies. If you want to learn more about it, you can read
      the following papers:</p>

  <ul>
      <li>Dave Siever, Tom Collura, &quot;Chapter 3 - Audio–Visual Entrainment: Physiological Mechanisms and Clinical Outcomes&quot;
          in <em>Rhythmic Stimulation Procedures in Neuromodulation</em>, Academic Press, 2017, <a
              href="https://doi.org/10.1016/B978-0-12-803726-3.00003-1">doi:10.1016/B978-0-12-803726-3.00003-1</a></li>
      <li>D.Corydon Hammond, &quot;Chapter One - Definitions, Standard of Careand Ethical Considerations&quot; in Clinical
          Neurotherapy, Academic Press, 2014, <a
              href="https://doi.org/10.1016/B978-0-12-396988-0.00001-5">doi:10.1016/B978-0-12-396988-0.00001-5</a></li>
      <li>Pino, Olimpia, Roberta Crespi, and Giuliano Giucastro.&quot;L’influenza della mindfulness e del benessere
          generale nel trattamento clinico dei fumatori di tabacco in un programma di disassuefazione: una valutazione a
          breve e lungo termine.&quot; (2020): 849-870, <a
              href="https://doi.org/10.3280/RIP2020-003004">doi:10.3280/RIP2020-003004</a>.</li>
      <li>Pino, Olimpia, and Francesco La Ragione. &quot;A Brain Computer Interface for audio-visual entrainment in
          emotional regulation: preliminary evidence of its effects.&quot; Online International Interdisciplinary
          Journal(2016): 1-12.</li>
      <li>Pino, Olimpia. &quot;Neuro-Upper, a Novel Technology for Audio-Visual Entrainment. A Randomized Controlled Trial
          on Individuals with Anxiety and Depressive Disorders.&quot; BAOJ Med Nursing 3 (2017): 041, <a
              href="http://dx.doi.org/10.24947/baojmn/3/2/141">doi:10.24947/baojmn/3/2/141</a>.</li>
      <li>Tang, Hsin-Yi Jean, et al. &quot;Open-loop audio-visual stimulation (AVS): A useful tool for management of
          insomnia?&quot; Applied psychophysiology and biofeedback 41.1 (2016): 39-46, <a
              href="http://dx.doi.org/10.1007/s10484-015-9308-7">doi:10.1007/s10484-015-9308-7</a>.</li>
      <li>Tang, Hsin-Yi Jean, et al. &quot;Open-loop Audio-Visual Stimulation for sleep promotion in older adults with
          comorbid insomnia and osteoarthritis pain: results of a pilot randomized controlled trial.&quot; Sleep Medicine 82
          (2021): 37-42, <a href="https://doi.org/10.1016/j.sleep.2021.03.025">doi:10.1016/j.sleep.2021.03.025</a>.</li>
      <li>Schmid, Werner, et al. &quot;Brainwave entrainment to minimisesedative drug doses in paediatric surgery: a
          randomised controlled trial.&quot; British Journal of Anaesthesia 125.3 (2020): 330-335, <a
              href="https://doi.org/10.1016/j.bja.2020.05.050">doi:10.1016/j.bja.2020.05.050</a>.</li>
      <li>Lagarrigue, Yannick, Céline Cappe, and Jessica Tallet.&quot;Regular rhythmic and audio-visual stimulations
          enhance procedural learning of a perceptual-motor sequence in healthy adults: A pilot study.&quot; PloS one 16.11
          (2021): e0259081, <a href="https://doi.org/10.1371/journal.pone.0259081">doi:10.1371/journal.pone.0259081</a>.
      </li>
      <li>Basu, Sandhya, and Bidisha Banerjee. &quot;Prospect of Brainwave Entrainment to Promote Well-Being in
          Individuals: A Brief Review.&quot; Psychological Studies (2020): 1-11, <a
              href="http://dx.doi.org/10.1007/s12646-020-00555-x">doi:10.1007/s12646-020-00555-x</a>.</li>
      <li>Clements-Cortes, Amy. &quot;Sound stimulation in patients withA lzheimer’s disease.&quot; (2015).</li>
      <li>Roberts, Brooke M et al. &quot;Entrainment enhances theta oscillations and improves episodic memory.&quot; Cognitive neuroscience vol. 9,3-4 (2018):181-193. <a
              href="https://doi.org/10.1080/17588928.2018.1521386">doi:10.1080/17588928.2018.1521386</a></li>
      <li>David S. Cantor and Emily Stevens, &quot;QEEG Correlates of Auditory-Visual Entrainment Treatment Efficacy of
          Refractory Depression.&quot; Journal of Neurotherapy, (2009), <a
              href="https://doi.org/10.1080/10874200902887130">doi:10.1080/10874200902887130</a>.</li>
      <li>da Silva, Vernon Furtado et al. &quot;Stimulation by Light and Sound: Therapeutics Effects in Humans. Systematic
          Review.&quot; Clinical practice and epidemiology in mental health : CP &amp; EMH vol. 11 150-4.(2015), <a
              href="https://doi.org/10.2174/1745017901511010150">doi:10.2174/1745017901511010150</a></li>
      <li>Zaccaro, Andrea et al. &quot;How Breath-Control Can Change Your Life:A Systematic Review on Psycho-Physiological
          Correlates of Slow Breathing.&quot; Frontiers in human neuroscience vol. 12 353. 7 Sep. 2018, <a
              href="https://doi.org/10.3389/fnhum.2018.00353">doi:10.3389/fnhum.2018.00353</a></li>
  </ul>
<p>:::</p>
  `)
  $('#uconstruction')
    .css('color', 'red')
    .css('font-size', '150%')
    .css('text-align', 'center')
    .fadeOut(1000).fadeIn(1000).fadeOut(1000).fadeIn(1000)
  $('#loading').hide()
}

e.monk = () => {
  const adiv = $('<div/>', {
    css: {
      'background-color': '#c2F6c3',
      padding: '20%',
      margin: '0 auto',
      width: '30%'
    }
  }).appendTo('body')
  const grid = utils.mkGrid(2, adiv, '60%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))

  let tossed = false
  let el
  const but = $('<button/>').html('toss').click(() => {
    if (!tossed) {
      el = utils.chooseUnique(monk.biblePt, 1)[0]
      div.html(`<b>${el.ref}</b>`)
      div2.html('')
      but.html('show')
      tossed = true
    } else {
      div2.html(el.text)
      but.html('toss again')
      tossed = false
    }
  }).appendTo(grid).attr('disabled', true)
  $('<button/>').html('portal').click(() => {
    div.html('')
    div2.html(`
    O que tenho, isto lhe dou:
    Corpo de Luz, em nome de Jesus, o Nazareno, brilhe!
    Em nome de Jesus, o Nazareno, desperte!
    Em  nome de Jesus, o Nazareno, ame!
    Em  nome de Jesus, o Nazareno, ande!
    Em  nome de Jesus, o Nazareno, cresça!
    Em  nome de Jesus, o Nazareno, abençoe e salve todo o planeta!
    
    :::`.replace(/\n/g, '<br>')
    )
  }).appendTo(grid)
  $('<button/>').html('temas').click(() => {
    div.html('')
    div2.html(`
    Temas principais: cura, saúde, silêncio, Espírito Santo, Paz, Luz, rejuvenescimento, imortalidade, ressureição.
    `)
  }).appendTo(grid)
  $('<button/>').html('segunda').click(() => {
    div.html('')
    div2.html(`
    Segunda-feira é dia de experimentação: fazer sessão com leitura ou escrita, com copo de água, com vela, sem ritmo de respiração, sessão mais longa ou extra, etc.
    `)
  }).appendTo(grid)
  $('<button/>').html('terça').click(() => {
    div.html('')
    div2.html(`
    Terça-feira é o dia em que assumimos as lutas e caminhamos para as conquistas. O principal é orarmos para termos nitidez de nossas batalhas e para termos auxílio nelas. Também o momento de manifestarmos atitudes: escrevermos para amigos, buscarmos novas pessoas/expandir o corpo de Luz, mudarmos nossas atitudes. Por exemplo, podemos reassumir o compromisso de exortarmos as pessoas no nosso entorno, ou visitarmos amigos em nossas redes sociais para reagirmos a algumas fotos e mandarmos um oi.
    `)
  }).appendTo(grid)
  $('<button/>').html('quarta').click(() => {
    div.html('')
    div2.html(`
    Quarta-feira é o dia em que nos avaliamos e relatoriamos. Como tem sido sua experiência com as sessões? O que você planeja conseguir com as sessões? Escreva um depoimento se estiver já usufruindo. Peça o suporte dos colegas se ainda não estiver vibrando no Corpo de Luz. Paz. Direções para mentoria, tutoriais, canais (do whats, por exemplo) para suporte.
    `)
  }).appendTo(grid)
  $('<button/>').html('quinta').click(() => {
    div.html('')
    div2.html(`
    Quinta-feira é o dia em que lembramos dos que não estão conosco. Convidem-os para estar com vocês ou este grupo. Paz.
    `)
  }).appendTo(grid)
  $('<button/>').html('sexta').click(() => {
    div.html('')
    div2.html(`
    Sexta é dia de confraternização. Alguma mensagem mais descontraída, agradecendo pela companhia durante a semana, e avisando que paramos durante o final de semana mas voltamos com as 4 sessões na segunda-feira.
    Tentar também fazer algum encontro online ou ficar em uma sala aberta ou fazer uma ocasião de alguma forma.
    `.replace(/\n/g, '<br>')
    )
  }).appendTo(grid)
  $('<button/>').html('relato').click(() => {
    div.html('')
    div2.html(`
É um bom momento p ter um relato, mesmo q pequeno, sobre como tem sido as sessões para você:
se tem ajudado e de que forma.
Se vc quiser/puder escrever, pode mandar no grupo (tanto do facebook quanto do whatsapp) ou aqui no chat.
Lógico, não se preocupe com isso, é apenas se vc quiser e é uma super boa contribuição que dá à iniciativa.
    `.replace(/\n/g, '<br>')
    )
  }).appendTo(grid)
  $('<button/>').html('cores').click(() => {
    div.html('')
    div2.html(`
Segunda.Lua: Branco, prata e creme.
Terça. Marte: vermelho e laranjas.
Quarta. Mercurio:  violetas, cinzas e laranjas
Quinta. Jupiter: azul royal, azul e roxos.
Sexta. Venus: verde, rosa, tons pasteis.
    `.replace(/\n/g, '<br>')
    )
  }).appendTo(grid)
  const div = $('<div/>').appendTo(adiv)
  const div2 = $('<div/>').appendTo(adiv)
  $('#loading').hide()
  monk.verses().then(() => {
    but.attr('disabled', false)
  })
}

e.paypal = () => {
  utils.stdDiv().html(`
  <h2>Donate using Paypal</h2>

  <p>
  To transfer any amount, click on the following image:
  <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
    <input type="hidden" name="cmd" value="_donations" />
    <input type="hidden" name="business" value="CWRTXTJF9C3N6" />
    <input type="hidden" name="currency_code" value="BRL" />
    <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
    <img alt="" border="0" src="https://www.paypal.com/pt_BR/i/scr/pixel.gif" width="1" height="1" />
  </form>
  </p>

  <p>
  Or use the following QR code:
  <p>
  <img src="assets/donation/qrPaypal.png" alt="QR Code for donating through Paypal">
  </p>
  </p>

  <br>
  `)
  $('#loading').hide()
}

e.pagseguro = () => {
  utils.stdDiv().html(`
  <h2>Donate using Pagseguro</h2>

  <p>
  Click on the following image to transfer any amount:
  <!-- INICIO FORMULARIO BOTAO PAGSEGURO -->
  <form action="https://pagseguro.uol.com.br/checkout/v2/donation.html" method="post">
  <!-- NÃO EDITE OS COMANDOS DAS LINHAS ABAIXO -->
  <input type="hidden" name="currency" value="BRL" />
  <input type="hidden" name="receiverEmail" value="renato.fabbri@gmail.com" />
  <input type="hidden" name="iot" value="button" />
  <input type="image" src="https://stc.pagseguro.uol.com.br/public/img/botoes/doacoes/209x48-doar-assina.gif" name="submit" alt="Pague com PagSeguro - é rápido, grátis e seguro!" />
  </form>
  <!-- FINAL FORMULARIO BOTAO PAGSEGURO -->
  </p>

  <br>
  `)
  $('#loading').hide()
}

e.bitcoin = () => {
  utils.stdDiv().html(`
  <h2>Donate using Bitcoins</h2>

  <p>Transfer any amount of bitcoins to the wallet in the address:
  <b>bc1qjw72xa6c8c924j8aj8y737q56let8envx4j0xd</b>
  </p>

  <p>
  <p>
  Or use the QR Code:
  </p>
  <img src="assets/donation/qrBitcoin.png" alt="QR Code for donating using the Bitcoin Wallet">
  </p>

  <br>
  `)
  $('#loading').hide()
}

e.bitcoin = () => {
  utils.stdDiv().html(`
  <h2>Donate using Bitcoins</h2>

  <p>Transfer any amount of bitcoins to the wallet in the address:
  <b>bc1qjw72xa6c8c924j8aj8y737q56let8envx4j0xd</b>
  </p>

  <p>
  <p>
  Or use the QR Code:
  </p>
  <img src="assets/donation/qrBitcoin.png" alt="QR Code for donating using the Bitcoin Wallet">
  </p>

  <br>
  `)
  $('#loading').hide()
}

e['000-preparation'] = () => {
  utils.stdDiv().html(`
  <h2>on the consequences of longevity</h2>

  <p>
  Among 2020's highlights are some advances in anti-aging.
  In fact, it is now somewhat more reasonable to expect that at least a fraction of the population
  that survive the next few decades will live to at least a few hundred years.
  </p>

  <p>
  But what does that mean for Humanity?
  Does that imply that soon we will be a bit alleviated from the harsh ephemerality of life?
  Or will the near future bring extreme inequality and sectarianism?
  </p>

  <p>
  It probably depends on how well we are to prepare for such extended lifespan advent.
  If we do enhance our ability to collaborate, employ our capacities and time wisely,
  bring the disabled into better conditions, preserve and restore Nature,
  we might see the brightest of the possibilities.
  On the other hand...
  </p>

  <p>
Thu Dec 31 11:17:02 -03 2020
  </p>
  <br>
  `)
  $('#loading').hide()
}

e['001-first-week'] = () => {
  utils.stdDiv().html(`
  <h2>Primeira semana de MMM</h2>

  <p>
  Esta foi a primeira semana em que abrimos a participação no MMM para pessoas além das iniciadoras (Renato e Otávio).
  </p>

  <p>
  Começamos na segunda-feira com 4 novas pessoas agendadas, para experimentarmos nós e elas a prática e ver o que aconteceria.
  Uma delas estava de fato em uma situação complicada, já as outras 3 marcaram uma segunda sessão para o dia seguinte, quando tivemos 2 novas pessoas.
  </p>

  <p>
  Este ritmo de novas pessoas e adesão se seguiu pela semana toda,
  o que resultou diariamente em jornadas longas e muitos novos entendimentos
  que recebemos em cada sessão.
  </p>

  <p>
  No geral, as pessoas relataram gostar da prática e proveito quanto ao bem-estar e obtenção de novos entendimentos.
  Percebemos que cuidar desta linha de ação requeriu e irá requerer dedicação contínua e praticamente exclusiva.
  Portanto, consideramos importante para manter a linha de ação:
  <ul>
  <li>
    minimizar o tempo das sessões. Tanto para que os iniciados quando os novatos possam manter as sessões com continuidade.
  </li>
  <li>
    formar novos participantes capazes de conduzir as sessões.
  </li>
  <li>
    estabelecer os períodos diários em que estaremos disponíveis para as sessões.
  </li>
  </ul>
  </p>

  <p>
    Considerações finais de balanço:
    <ul>
    <li>
      Finalizamos a semana com 5 reuniões, mais do que começamos, embora não tivéssemos buscado novas pessoas durante a semana.
    </li>
    <li>
     A última reunião teve 8 pessoas, sobre o tema "verdade", foi fortíssima (no melhor dos sentidos).
    </li>
    <li>
      Uma participante foi considerada já em condições de receber um material mais aprofundado sobre os procedimentos da prática e poderá atuar já como condutora.
    </li>
    <li>
      A condução da sessão ficou já definida e talvez permaneça como está por algum tempo.
    </li>
    <li>
      Recebemos novos entendimentos a cada sessão e tivemos melhoras de bem-estar.
    </li>
    <li>
      Iniciaremos a próxima semana já com participantes embora não tenhamos buscado novas pessoas.
    </li>
    </ul>
  </p>
  <p>
Thu Dec 31 11:17:02 -03 2020
  </p>
  <br>
  `)
  $('#loading').hide()
}

e['t018-Marcos'] = () => {
  utils.stdDiv().html(`
  <h2>Marcos, após 1-2 meses</h2>
 Quero agradecer aos administadores dos artefatos de luz, que tenho acompanhado todas sessões desde quando entrei no grupo, está me fazendo muito bem, tudo que tenho pensado em realizar meus projetos em minha vida está se realizando, com muita fé e meditações diarias, estou alcançando meus objetivos em minha trajetória de trabalho e saúde, e se me previnindo de possiveis contra tempo, e obstacúlos que encontro pelo caminho, fica aqui minha experiência de alcançar o sonhos de ser alguem melhor e serei sempre melhor que ontem e assim por diante obrigado a todos.

  <b>Marcos Pino Arroyo, 28/Abril/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t017-Helnice'] = () => {
  utils.stdDiv().html(`
  <h2>Helnice, após as primeiras semanas</h2>
 Eu consegui mesmo o dia do corpo de luz emando paz, sim foi fantástico! Realmente o exercício de respiração, nos induzindo a iluminar expandir a consciência, iluminar a Anima, logo ela iluminada reverberá em seu redor e sucessivamente o planeta!!! Genial... Ferramenta evoluída de ponta... Só agradecimentos e agora e compartilhar certo, todos poderão de alguma forma contribuir. Gratidão a vcs o grupo ao universo ao planeta e a quem iluminou a sua sabedoria para aqui na Terra fazer a materialização desse feito maior, de seu propósito que eu creio e tenho fé que é de ajudar pessoas, o máximo que puder claro!

  <b>Helnice P Vitor, 24/Abril/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t016-Brianna-Mauricio'] = () => {
  utils.stdDiv().html(`
  <h2>Brianna, após as primeiras semanas</h2>
Antes das sessões eu estava muito ansiosa.
Hoje em dia, eu acredito mais em mim.
É como se eu tivesse uma força interior que eu não sabia que tinha.
Agora não estava conseguindo dormi bem.
Estava tendo sono partido, acordava de hora em hora, já fazendo as sessões.
Agora está melhorando mais.
  
  <b>Brianna Mauricio, 22/Abril/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t015-Marcus-Vinicius'] = () => {
  utils.stdDiv().html(`
  <h2>Marcus, após os primeiros dias</h2>

  Desde que iniciei as sessões,
  estou conseguindo aos poucos largar o tabagismo
  e também não estou mais tomando remédios para conseguir dormir.

  Namastê
  
  <b>Marcus Vinicius Ferraz, 22/Abril/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t014-Janira-Karoline'] = () => {
  utils.stdDiv().html(`
  <h2>Janira, após as primeiras sessões</h2>
  A sessão de ontem Espírito Santo eu senti muita felicidade.
  1 hora depois da sessão minha família me ligou, meu sobrinho,
  minha mãe, pai, irmã e tivemos conversas super edificante.
  Parecia que todos estavam envoltos  pela Luz do Espírito Santo.

  Parecia que a minha mente estava em busca de coisas belas.
  Por conseguinte, eu encontrei uma melodia linda e compartilhei com meu pai.
  
  <b>Janira Karoline, 21/Abril/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t013-Renato-Huss'] = () => {
  utils.stdDiv().html(`
  <h2>Renato, após primeira ou primeiras semanas</h2>
  Tenho sentido uma melhora no meu estado psicólogo, no sentido da atenção, do foco e principalmente no aspecto emocional.
  Simplesmente minha ansiedade desapareceu.
  Não tive mais vontade de beber.

  Ainda não sei do que se trata, mas tenho gostado de verdade.

  Sinto que estou as conectado, como se conduzido por uma energia positiva.

  <b>Renato S'Huss, 15/abril/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t012-Marcos'] = () => {
  utils.stdDiv().html(`
  <h2>Marcos, após aprox. 3 semanas</h2>
Estou vivendo uma experiência nova fazendo meditações através e um artefato visual e sons relaxante,
está me fazendo muito bem, tenho controlado mais minhas ansiedades e respiração mantendo meu corpo saudável,
tenho feito todos os dias, a diferença que eu senti foi significante para minha saúde,
e poder a cada dia me sentir melhor para prosseguir com as tarefas cotidianas,
a cada dia que passa me sinto capaz de realizar conquistas em minha vida graças a meditação.

<b>Marcos Pino Arroyo, 12/abril/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t011-Mariel'] = () => {
  utils.stdDiv().html(`
  <h2>Mariel, após quase 1 mês e meio</h2>
  Cumpro quarenta dias fazendo as sessões  com o Artefato,
  o tempo todo Renato e Otavio me acolheram e seguiram minha evolução
  (melhora na saúde física, estabilidade psicológica e participação  no grupo AAA e Corpo de Luz).
  Para minha completa cura e crescimento espiritual, estou tentando participar ativamente,  ajudar nas sessões,
  conversar com as pessoas de maneira tímida ainda pela limitação do idioma.
  Meu atuar na elaboração das sessões me esta ajudando com a pratica da ortografia da língua portuguesa,
  além de sentir que estou seguindo no rumo de minha vocação existencial.
  Reitero minha gratitude Renato e Otavio pela paciência e dedicação comigo.
  Não tenho duvida que pela Graça  Divina me guio até vosso Projeto de Luz.

<b>Mariel Elizabeth, 05/Abril/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t010-Otavio'] = () => {
  utils.stdDiv().html(`
  <h2>Otávio, após 4 meses</h2>
Antes de começar a meditar, sentia uma necessidade muito grande de cobrar da vida:
cobrar atenção de namorados amigos e familiares, cobrar da comida que fosse gostosa,
cobrar das diversões que fossem divertidas, cobrar dos meus superiores que não fossem chatos,
e cobrar de mim certas conquistas.
Mas nem sempre obtinha sucesso, e às vezes a angústia era forte, e eu ficava sem recursos para me ajudar.
Depois, com a meditação, passei a cobrar menos de vida, e a enxergá-la com mais abertura.
Passei a encarar meus objetivos com mais alegria e menos gravidade.
Quando necessário, ficou mais fácil transformar meus planos.
E ganhei mais objetividade para encará-los.

<b>Otávio Martigli, 05/Abril/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t009-rfabbri'] = () => {
  const desafios = [
    'escrever as mensagens antes sobre o tema e depois relatando',
    'Manutenção: colher depoimentos, convidar pessoas para os grupos, responder às mensagens nos grupos',
    'formar pessoas para cuidarem dos grupos (criar sessões, dar suporte)'
  ].reduce((a, i) => a + `<li>${i}</li>`, '')
  const dep = [
    ['Lola', 't007-Lola'],
    ['Renato S\'Huss', 't008-Renato-Huss'],
    ['Edu', 't006-Edu'],
    ['Lisiane', 't005-Lisiane']
  ].map(i => `<a href="?${i[1]}">${i[0]}</a>`).join(', ')
  const feitos = [
    'criamos perguntas e regras para entrarem no grupo',
    'tivemos criação consistente das sessões utilizando templates sonoros e uma interface que comporta usuários criados (mkLight)',
    'tivemos a participação substancial de uma nova pessoa (a Mariel) na manutenção das sessões',
    'foi feito <a href="https://www.youtube.com/watch?v=LxpS1aVcofI">vídeo explicativo para participação das sessões</a> (pelo Otávio)',
    'criamos e populamos o <a href="https://chat.whatsapp.com/BztLyvWDEgW3C1mjXZTTrP">grupo para suporte no Whatsapp</a>',
    `colhemos diversos depoimentos novos (${dep})`
  ].reduce((a, i) => a + `<li>${i}</li>`, '')
  utils.stdDiv().html(`
  <h2>Renato, 3 meses depois</h2>
Tenho tido bastante revelação nas sessões e estabilidade na motivação e dedicação.
Tenho também recebido relatos generalizados de melhoras de quadros de saúde física e mental: ansiedade, depressão, dores musculares, dor de cabeça e enxaqueca, respiração melhorada. Também vários relatos de experiências místicas: extracorpóreas, sonhos com parentes falescidos, visões, etc.

Tivemos uma semana bem boa. Além de crescimento de mais de 25% do grupo AAA,  finalmente:
<ul>${feitos}</ul>
Estive toda semana ficando doente na quarta ou quinta-feira.
Esta semana não fiquei doente (acho que graças ao reforço da Mariel na criação das sessões), mas dormi muito na quinta e sexta.
Entendi que estou passando dos limites do meu corpo, portanto ficarei atento e tentarei coisas novas para garantir que eu não esteja me desgastando
e para que eu consiga me dedicar a semana toda de forma mais apropriada.
Desafios atuais:
<ul>${desafios}</ul>
Consegui desenvolver e estabilizar a interface para criação dos artefatos e dos templates, e fiz uma pesquisa sobre potenciais parceiros do ponto de vista acadêmico.

Por fim, acho que seria importante fazermos os relatos semanais de como estamos indo, como estamos entendendo nossas práticas; e tenho concebido fazer vídeos curtos para comunicação com algumas pessoas, em especial com os que estão fazendo acontecer.

<b>Renato Fabbri, 03/Abril/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t008-Renato-Huss'] = () => {
  utils.stdDiv().html(`
  <h2>Renato, após poucos dias</h2>
Fantástico, em poucos dias, alcancei uma harmonia e uma paz, que não imaginava conseguir.
Anos de estudo esotérico, não trouxe este resultado.
Grato aos idealizadores e participantes.

<b>Renato S'Huss, 03/Abril/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t007-Lola'] = () => {
  utils.stdDiv().html(`
  <h2>Lola, após pouco mais de 1 mês</h2>

  Vou aproveitar p falar do qto sou cética...ver p crer sempre,  fazer o que?

Não busco perfeição,  sou humana, totalmente passiva de erros...quero melhorar, crescer em têrmos de ser.
Bom, tenho feito sessões com os artefatos e com temas variados e, de repente estou conseguindo respirar melhor,
não esse oxigênio que se conhece, mas aquele oxigênio que revigora e renova a alma.
Tenho um temperamento muito forte e ultimamente me pego meio surpresa com a minha "calmaria" ao viver certas situações, sou grata.

Como disse, não busco perfeição e sim aprimoramento e de verdade me sinto confortável aqui.
Desculpa o textão, não consigo ser diferente.
Gratidão Renato,  Adalberto e Otávio por estarem aqui.

<b>Lola Quinto, 02/Abril/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t006-Edu'] = () => {
  utils.stdDiv().html(`
  <h2>Edu, após 2-3 sessões</h2>
As sessões tem me deixado mais calmo, sem a menor dúvida. Espero continuar e melhorar mais.

<b>Edu Viellas, Abril/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t005-Lisiane'] = () => {
  utils.stdDiv().html(`
  <h2>Lisiane, após ~ 3 meses</h2>
Venho aqui fazer um relato sobre a minha experiência com esse lindo trabalho do Renato e Otávio. Comecei a participar desse projeto no mês de janeiro, fazendo diariamente a atividade. Sempre sofri de enxaqueca, mas desde então, curiosamente, não tive mais nenhuma crise 😍.

Esse trabalho está sendo maravilhoso na minha vida, apesar de as vezes eu ter dificuldade de parar para meditar porque tenho um filha de 2 anos e trabalho também em um hospital de Pronto Socorro, devido esse momento de caos na saúde, não está sendo fácil me organizar na vida, além de todo sofrimento emocional por tudo que estou vendo dentro do hospital... mas enfim, procuro tirar ao menos 1x ao dia para realizar a tarefa é quando posso, faço as 4 meditações 💞

Tive mudanças na minha saúde física conforme relatei no início,  além de ter também experiências extra corpórea, contato com antepassados, e também contato com seres que ainda não sei dizer o que são.

Acredite... tenha fé em você, na sua capacidade de se entregar ao trabalho proposto, ppis uma certeza eu tenho: é real, é possível!

Como um pequeno mimo, compartilho com vocês <a href="https://www.facebook.com/lisianefortescanabarro/videos/10216072030674065" target="_blank">essa linda canção das fadas 🦋💐🧚‍♀️🧚‍♂️</a> para que possa tocar o coração e a alma de cada um que aqui se dispõe a fazer a Grande Obra, a verdadeira Arte Real , a mudança interior 💜💙❤.


<b>Lisiane Canabarro, 31/Março/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t004-Ivone'] = () => {
  utils.stdDiv().html(`
  <h2>Ivonne, após ~1 mês</h2>
... eu estou em tremenda gratidao por vcs tem mellhorado muito meu irmao minha respiracao muito mesmo a gratidao eh imensa.
<b>Ivone Nunes, Março/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t003-melisabeth'] = () => {
  utils.stdDiv().html(`
  <h2>Mariel, após 2-3 semanas</h2>
Nesta vida tenho muito a agradecer, como sou afortunada. Acredito nos milagres!

Há apenas alguns dias, estava de noite observando as estrelas e clamei por ajuda,
minha vida havia se complicado com problemas e eu não via saída.
Além disso minha saúde física e mental estava deteriorada, estive três vezes no hospital em uma semana.
Recebi uma mensagem de uma pessoa perguntando: "como eu estava?".
Essa pessoa me convidou para participar de um projeto: “formar um corpo de luz” para nos ajudarmos e ajudar a mundo todo.

Eu aceitei, nesses dias minha vida mudou. Minha saúde melhorou notavelmente.
Minha mente não está mais confusa. Meus problemas estão solucionando-se.
Hoje agradeço a Deus pelos seres de luz que chegaram em minha vida, Renato e Otavio, pelo projeto,
pelos tempos e dedicações dos participantes.
Agradeço por todo o bem recebido e a possibilidade de participar ajudando a levar luz e energia positiva a minha família, amigos e a toda a criação.
Agradeço pelo grupo seres maravilhosos que conheci.
Eternamente grata Renato por enxergar minha dor no meio da multidão do Facebook.

<b>Mariel Elisabeth, 07/Março/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t002-omartigli'] = () => {
  utils.stdDiv().html(`
  <h2>Otavio, primeira semana</h2>

  <p>
  mais energia, mais pé no chão, certo cansaço, perspectivas positivas, inseguranças, organização da vida, solidez na vida, boas responsabilidades, amor, fé, sutileza, malabarismos de tempo, sono confuso, mais contato, menos silêncio, novos desafios, velhas questões,
  </p>

  <p>
Otavio Martigli,
Sun Jan 10 11:09:40 -03 2021
  </p>
  <br>
  `)
  $('#loading').hide()
}
e['t001-rfabbri'] = () => {
  utils.stdDiv().html(`
  <h2>Renato, primeira semana</h2>

  <p>
  Sendo nossa primeira semana, começamos a desbravar a prática do MMM, as sessões:
  como nos comunicar com os novatos, como conduzir as atividades, quais parametrizações ficam melhor, etc..
  </p>

  <p>
  Logo ao final do primeiro dia ficou nítida a necessidade de (ao menos um pouco de) convenções para os procedimentos, portanto fiquei acordado até de madrugada concebendo o que ficou registrado como nossa liturgia.
  </p>

  <p>
  As sessões todas renderam novos entendimentos profundos, eu os recebia durante a concentração de 15 minutos com o audiovisual.
  Portanto estou ainda mais convicto de que o caminho que estamos trilhando e propondo é excelente e será útil para muitos.
  </p>

  <p>
  Ao final da semana, na última sessão, sobre o tema "verdade", apareceu-me nitidamente 3 recursos básicos para eu manter em uso constantemente:
  <ul>
  <li>
    Deus/Jesus está à minha direita, como me foi revelado há muitos anos.
  </li>
  <li>
    Eu sou mesmo uma antena, sempre captando de tudo à minha volta e emanando.
    Cada pessoa também é assim.
    Ao menos no meu caso, devo estar atento para o que estou captando, de preferência mantendo a coluna ereta e atenção às posições do corpo, contrações musculares, pensamentos e respiração.
  </li>
  <li>
    Arte em todos os aspectos da vida como uma forma de manter esmero e obter resultados trancendentais ("tirar leite de pedra"): em cada coisa que eu fizer, no meu tratamento comigo mesmo, com os outros e com Deus, e na minha vida mental (cada pensamento e o que me propor a absorver/desenvolver).
  </li>
  </p>
  <p>

Renato Fabbri,
Sat Jan  9 19:25:16 -03 2021
  </p>
  <br>
  `)
  $('#loading').hide()
}

function pattern (str, type) {
  const types = {
    pub: /^\d\d\d/, // publication
    tes: /^t\d\d\d/,
    members: /^m\d\d\d/
  }
  if (type in types) {
    return types[type].test(str)
  } else if (type === 'infra') {
    for (const t in types) {
      if (types[t].test(str)) {
        return false
      }
    }
    return true
  }
  return false
}

window.ppp = pattern

e.publications = () => {
  const pub = []
  for (const i in e) {
    if (pattern(i, 'pub')) {
      console.log(i)
      pub.push(i)
    }
  }
  utils.stdDiv().html(`
  <h2>Publications</h2>
  <ul>
  ${pub.map(i => `<li><a href="?${i}">${i}</a></li>`).join('')}
  </ul>
  `)
  $('#loading').hide()
}

e.testimonials = () => {
  const pub = []
  for (const i in e) {
    if (pattern(i, 'tes')) {
      console.log(i)
      pub.push(i)
    }
  }
  utils.stdDiv().html(`
  <h2>Testimonials</h2>
  <ul>
  ${pub.map(i => `<li><a href="?${i}">${i}</a></li>`).join('')}
  </ul>
  `)
  $('#loading').hide()
}

e.infra = () => {
  const pub = []
  for (const i in e) {
    if (pattern(i, 'infra')) {
      console.log(i)
      pub.push(i)
    }
  }
  utils.stdDiv().html(`
  <h2>Infra pages</h2>
  <ul>
  ${pub.map(i => `<li><a href="?${i}">${i}</a></li>`).join('')}
  </ul>
  `)
  $('#loading').hide()
}

e.liturgy101 = () => {
  const sentinela = [
    'mantém-se em silêncio e em oração para abençoar a sessão e para proteger os participantes.',
    'observa e anota os pontos positivos e negativos da sessão e condução feita pelo procurador.',
    'complementa a condução quando estritamente necessário e solicita a Deus quando quiser que algo aconteça.'
  ].reduce((a, i) => a + `<li>${i}</li>`, '')

  const procurador = [
    'escuta atentamente o que o neófito disser e fala o mínimo possível.',
    'apresenta a atividade para o neófito e tira dúvidas.',
    'conduz o neófito na atividade, decidindo o tema, criando a sessão, e ajudando a iniciar o artefato audiovisual.',
    'colhe comentários posteriores e finaliza a sessão.',
    'acompanha o tempo para não exceder 30 min de conversa e 30 min de sessão.'
  ].reduce((a, i) => a + `<li>${i}</li>`, '')

  const deveres = [
    'manter um ritmo constante de oração. Orar ao menos ao acordar e ao dormir, agradecendo pelo dia, pedindo proteção e louvando a Vida, o Criador, e a Oportunidade (do MMM).',
    'zelar pela limpeza e organização de seus corpos e ambiente.',
    'observar cotidianamente a si própri@ para se certificar de que o cerne de seu trabalho é o bem da Humanidade, e não a vaidade e a cobiça ou mesmo a indiferença.'
  ].reduce((a, i) => a + `<li>${i}</li>`, '')

  const sugestoes = [
    'observar o dia, o clima, a temperatura, e visitar os significados de cada dia: se é dedicado a algum santo, profissão ou aspecto da existência. Também o dia da semana, o dia do mês (número), estação do ano, etc.',
    'adorar e orar apenas para Deus. Já a comunicação pode ser feita com todos os seres viventes, humanos ou não.',
    'realizar cotidianamente a leitura de escrituras sagradas: Bíblia, Alcorão, Mahabharata/Ramáiana, etc.',
    'sempre convidar novas pessoas para o MMM. Idealmente iniciar 4 pessoas por dia. Caso esteja já responável por muitas pessoas, convidar ao menos 1 nova pessoa por semana.'
  ].reduce((a, i) => a + `<li>${i}</li>`, '')

  utils.stdDiv().html(`
  <h1>Liturgia MMM 101</h1>

  Para estarmos lúcidos e cientes da atividade sendo
  desempenhada.
  Em especial, para acentuar nossa atenção aos detalhes, nossa concentração/foco, e nossa nitidez sobre o todo.

  Para isso, ficam aqui propostas 2 incumbências básicas e uma optativa, orações para início e fim de sessão, e algumas observações adicionais.

  <h2>1. Incumbências</h2>

  <h4>Sentinela</h4>
  É o encargo mais importante. A sentinela zela pela proteção do grupo e pela consagração da sessão, além de avaliar os participantes, a condução e proporcionar ajustes finos.
  
  Em resumo, a sentinela:
  <ol>${sentinela}</ol>

  <h4>Interventor, articulador, delegado ou procurador</h4>
  É quem conduz a sessão, i.e. quem articula os conteúdos e os participantes. É praticamente o único que fala com o neófito e garante a progressão da sessão pelos passos necessários.

  Em resumo, o procurador:
  <ol>${procurador}</ol>

  Quando não há neófito, o papel do procurador fica bastante descansado, variando entre totalmente diluído entre as sentinelas e a condução constante (principalmente quando há vários participantes).

  <h4>Neófito</h4>
  O neófito é alguém novo no MMM, sendo iniciado pelas sentinelas e procurador. Em geral deve haver no máximo 1 neófito por sessão. Prefencialmente, ele deve ditar o tema da sessão e deve ser ouvido constantemente. Recomendamos que o neófito passe ao menos 2, e preferencialmente 7, sessões como neófito.

  <h4>Resumo</h4>
  <h5>2 participantes iniciados:</h5>
  Ficam um pouco mais livres os papéis de sentinela e procurador. Preferencialmente conduz quem criou a sessão, assumindo assim o papel de procurador, mas tudo neste caso fica a critério dos 2 participantes.
  É o único caso em que as orações inicial e final são optativas embora ainda assim recomendadas.

  <h5>3 participantes ou mais, todos iniciados:</h5>
  Cada um faz a oração, após isso 1 pessoa fica como procuradora.
  As outras concentram-se como sentinelas.

  <h5>3 participantes ou mais, 1 deles é neófito:</h5>
  Cada iniciado faz a oração, após isso 1 pessoa fica como procuradora.
  As outras concentram-se como sentinelas e então o neófito é convidado.

  <h5>2 participantes, 1 deles é neófito (<b>contraindicado</b>):</h5>
  Faltará foco na função mais importante (a de sentinela).
  Em caso de necessidade, o procurador deverá manter-se atento para realizar também a função de sentinela, fazendo intervalos de silêncio para concentração, limpeza e oração.
  De qualquer forma, fazer um minuto de silêncio antes de convidar o neófito para especial atenção pelo iniciado que será ambos procurador e sentinela.

  <h5>3 participantes ou mais, mais de 1 deles é neófito (<b>contraindicado</b>):</h5>
  A sessão tenderá a não atender aos neófitos.
  Se possível, partir a sessão em mais grupos ou fazer mais sessões.
  De qualquer forma, manter um único procurador, e fazer um minuto de silêncio antes de convidar os neófitos para especial atenção pelo procurador e sentinelas.

  <h2>2. Orações</h2>
  As orações devem ser feitas em todas as sessões,
  se possível em voz alta.
  Deve-se iniciar com a Oração de Abertura e terminar com a Oração de Fechamento.

  <h4>Oração de Abertura</h4>
  Deve ser feita antes do começo da sessão e da entrada do neófito e com as mãos juntas em frente ao rosto, ao peito ou ao abdomem, com o propósito de invocar o Senhor, seus Anjos e demais protetores dos envolvidos:

  <i><pre>
        ${monk.prayers.abertura}
  </pre></i>

  <h4>Oração de Fechamento</h3>
  Deve ser feita ao final da sessão e após o neófito sair e com as mãos abertas e voltadas para cima, com o propósito de agradecer, realizar petições finais, e banir essências não desejadas:

  <i><pre>
        ${monk.prayers.fechamento}
  </pre></i>

  Sopra-se as palmas das mãos ao final da oração.

  <h2>3. Demais observações</h2>
  Deveres do praticamente:
  <ul>${deveres}</ul>

  Sugestões:
  <ul>${sugestoes}</ul>

  Pode haver uso de velas, preferencialmente brancas, principalmente em ocasiões especiais. Também pode haver o uso de túnicas, prefencialmente franciscanas pela simplicidade e fácil acesso.

  <br><br>:::
  `)
  $('#loading').hide()
}

e.aa = ufrj => {
  $('#favicon').attr('href', 'assets/aafav2.png')
  const ws = u('ws')
  const logsLink = (ufrj ? 'ufrj-logs2' : 'aalogs3') + (ws ? '&ws=' + ws : '')
  const adiv = utils.stdDiv().html(`
  ${ufrj ? '<img alt="" border="0" src="assets/UFRJ-logo.png" width="7%" style="float:right" />' : ''}
  <span id="new-ws"></span>
  <h2>AA is Algorithmic Autoregulation</h2>
  Check the <a href="?${logsLink}" target="_blank">logs</a>.
  `)
  if (!ws) {
    $('<div/>').appendTo('#new-ws').html('<span id="new-ws-btn"></span> or use the public workspace below.')
    $('<button/>').html('Create a new workspace').appendTo('#new-ws-btn').on('click', () => {
      const ws = window.prompt('Name the Workspace')
      console.log({ ws })
      const ws_ = ws.replaceAll(' ', '')
      window.location.href = `?aa&ws=${ws_}`
      // open aa url with ws=somwthing
    })
  } else {
    $('#new-ws').html(`Workspace: <b>${ws}</b>.`)
      // .css('background', '#ffdddd')
      .css('padding', '3px')
      .css('box-shadow', '0 30px 40px rgba(0,0,0,.4)')
      .css('border-radius', '5%')
  }
  let grid = utils.mkGrid(2, adiv, '60%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))
  $('<span/>').html('user id:').appendTo(grid)
  const uid = $('<input/>', {
    placeholder: 'id for user'
  }).appendTo(grid)
    .attr('title', 'The ID for the user (name, nick, etc).')
    .val(u('user') || u('u'))

  $('<span/>').html('shout message:').appendTo(grid)
  const shout = $('<input/>', {
    placeholder: utils.chooseUnique(['learning AA', 'developing X', 'doing Y', 'talking to Z', 'writing W', 'some description'], 1)[0]
  }).appendTo(grid)
    .attr('title', 'The shout description (what have you done or are you doing).')
    .on('keyup', e => {
      if (e.key === 'Enter' || e.keyCode === 13) {
        submitShout.click()
      }
    })

  const shoutStr = ufrj ? 'shoutFran' : 'shout'
  const submitShout = $('<button/>')
    .html('Submit shout')
    .appendTo(grid)
    .attr('title', 'Register the shout message given.')
    .click(() => {
      submitShout.prop('disabled', true)
      // get current date and time, user, session ID and submit
      const data = { uid: uid.val(), sessionId: sessionData ? sessionData.sessionId : undefined }
      data[shoutStr] = shout.val()
      data.ws = u('ws')
      console.log(data)
      if (!data.uid) {
        window.alert('please insert a user identification string.')
      } else if (!data[shoutStr]) {
        window.alert('please insert shout message.')
      } else {
        data.date = new Date()
        transfer.writeAny(data, true)
          .then(resp => {
            if (shoutsExpected !== undefined && shoutsExpected > 0) {
              shoutsExp.html(--shoutsExpected)
            }
            if (sessionData && (slotsFinished === sessionData.nslots)) {
              if (shoutsExpected <= 0) { // finish session routine:
                ssBtn.attr('disabled', false)
                sdur.attr('disabled', false)
                nslots.attr('disabled', false)
                grid.hide()
                sessionData = undefined
                shoutsExpected = undefined
              }
            }
            shout.val('')
          })
          .catch(error => {
            window.alert('error in registering the shout', error, 'more details in the console')
            console.log('error in registering the shout', error)
          })
          .finally(() => submitShout.prop('disabled', false))
      }
    })

  grid = utils.mkGrid(2, adiv, '60%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))
  $('<span/>').html('slot duration:').appendTo(grid)
  const sdur = $('<input/>', {
    placeholder: '15'
  }).appendTo(grid)
    .attr('title', 'In minutes.')
    .val(u('d') || 15)

  $('<span/>').html('number of slots:').appendTo(grid)
  const nslots = $('<input/>', {
    placeholder: '8'
  }).appendTo(grid)
    .attr('title', 'Slots to be dedicated and reported on.')
    .val(u('n') || 8)

  const f = e => e.val() === '' ? '' : parseFloat(e.val())
  let sessionData
  const ssBtn = $('<button/>')
    .html('Start session')
    .appendTo(grid)
    .attr('title', 'Start an AA session (sequence of slots with shouts).')
    .click(() => {
      // get current date and time, user, create session ID and submit
      console.log(sdur, nslots)
      window.sss = [sdur, nslots]
      const data = { uid: uid.val(), sdur: f(sdur), nslots: f(nslots) }
      if (!data.uid) {
        window.alert('please insert a user identification string.')
      } else if (isNaN(data.sdur)) {
        // window.alert('type a numeric slot duration (minutes).')
        data.sdur = 15
      } else if (!Number.isInteger(data.nslots)) {
        // window.alert('type an integer number of slots.')
        data.nslots = 8
      } else {
        data.date = new Date()
        transfer.writeAny(data, true).then(resp => {
          data.sessionId = resp.insertedId.toString()
          sessionData = data
          startSession()
        })
      }
    })

  let tLeft
  let slotsFinished
  let shoutsExpected
  grid = utils.mkGrid(2, adiv, '60%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee'])).hide()

  $('<span/>').html('session started at:').appendTo(grid)
  const sStarted = $('<span/>').appendTo(grid)
  $('<span/>').html('slots finished:').appendTo(grid)
  const slotsFin = $('<span/>').appendTo(grid)
  $('<span/>').html('shouts expected:').appendTo(grid)
  const shoutsExp = $('<span/>').appendTo(grid)
  $('<span/>').html('time left in current slot:').appendTo(grid)
  const tLeft2 = $('<span/>', { class: 'notranslate' }).appendTo(grid)

  function startSession () {
    ssBtn.attr('disabled', true)
    sdur.attr('disabled', true)
    nslots.attr('disabled', true)

    sStarted.html(sessionData.date.toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'
    }).replace(/ /, '/').replace(/ /, '/'))
    shoutsExpected = 1
    shoutsExp.html(1)
    grid.show()

    window.ddd = { slotsFin, shoutsExp, tLeft, tLeft2 }

    slotsFinished = 0
    slotsFin.html(0)
    setCountdown(sessionData.sdur, sFun)
  }
  function setCountdown (dur, fun) {
    const duration = dur * 60
    const targetTime = (new Date()).getTime() / 1000 + duration
    setTimeout(() => {
      fun()
      clearInterval(timer)
    }, duration * 1000)
    const reduce = dur => [Math.floor(dur / 60), Math.floor(dur % 60)]
    const p = num => num < 10 ? '0' + num : num
    const timer = setInterval(() => {
      const moment = targetTime - (new Date()).getTime() / 1000
      let [minutes, seconds] = reduce(moment)
      let hours = ''
      if (minutes > 59) {
        [hours, minutes] = reduce(minutes)
        hours += ':'
      }
      tLeft2.text(`${hours}${p(minutes)}:${p(seconds)}`)
    }, 100)
  }
  function sFun () {
    mkSound()
    shoutsExp.html(++shoutsExpected)
    if (++slotsFinished !== sessionData.nslots) { // spork new slot:
      setCountdown(sessionData.sdur, sFun)
    }
    slotsFin.html(slotsFinished)
  }

  const dat = require('dat.gui')
  const gui = new dat.GUI()
  let vv = 120
  gui.add({ freq: vv }, 'freq', 50, 1000).onFinishChange(v => {
    vv = v
    vv = v
    mkSound()
  }).listen()

  const sy = new t.MembraneSynth().toDestination()
  sy.volume.value = -25
  gui.add({ vol: sy.volume.value }, 'vol', -100, 30).onFinishChange(v => {
    sy.volume.value = v
    mkSound()
  }).listen()

  const st = 2 ** (1 / 12)
  const tt = 0.1
  const ttt = tt / 2
  function mkSound () {
    const now = t.now()
    sy.triggerAttackRelease(vv, ttt, now)
    sy.triggerAttackRelease(vv * (st ** 3), ttt, now + tt)
    sy.triggerAttackRelease(vv * (st ** 7), ttt, now + 2 * tt)

    sy.triggerAttackRelease(vv * (st ** 4), ttt, now + 3 * tt)
    sy.triggerAttackRelease(vv * (st ** 8), ttt, now + 4 * tt)
    sy.triggerAttackRelease(vv * (st ** 11), ttt, now + 5 * tt)
  }
  utils.confirmExit()
  $('#loading').hide()
}

e.aalogs3 = ufrj => {
  const ws = u('ws')
  const url = ufrj ? 'ufrj-logs2' : 'aalogs3'
  const url2 = (ufrj ? 'ufrj' : 'aa') + (ws ? `&ws=${ws}` : '')
  const field = ufrj ? 'shoutFran' : 'shout'

  $('<link/>', { // todo: download to get from repo
    rel: 'stylesheet',
    href: 'https://cdnjs.cloudflare.com/ajax/libs/paginationjs/2.1.5/pagination.css'
  }).appendTo('head')

  let cod__ = {}
  function cod_ (id) {
    if (id in cod__) return cod__[id]
    const r = window.rrr.filter(i => i.sessionId === id)
    const dur = (r[0].date - r[r.length - 1].date) / (60 * 60 * 1000)
    const h = Math.floor(dur)
    const min = dur - h
    const min_ = String(Math.round(min * 60)).padStart(2, '0')
    cod__[id] = `${h}h${min_}`
    return cod__[id]
  }
  function cod (id) {
    return '(' + String(id.match(/.{1,2}/g).reduce((a, i) => a + parseInt(i, 16), 0)) + ') ' + cod_(id)
  }
  function simpleTemplating2 (data) {
    const grid = utils.mkGrid(4, adiv, '100%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))
    $('<span/>', { css: { 'margin-left': '10%' } }).html('<b>user</b>').appendTo(grid)
    $('<span/>', { css: { 'margin-left': '10%' } }).html('<b>shout</b>').appendTo(grid)
    const tz = (new Date()).getTimezoneOffset()
    const tz_ = (tz > 0 ? '-' : '+') + Math.floor(tz / 60)
    $('<span/>', { css: { 'margin-left': '10%' } }).html(`<b>when (GMT${tz_})</b>`).appendTo(grid)
    $('<span/>', { css: { 'margin-left': '10%' } }).html('<b>session</b>').appendTo(grid)
    utils.gridDivider(160, 160, 160, grid, 1)
    utils.gridDivider(160, 160, 160, grid, 1)
    utils.gridDivider(160, 160, 160, grid, 1)
    utils.gridDivider(160, 160, 160, grid, 1)

    const func = 'appendTo'
    const r = data
    r.forEach(s => {
      $('<span/>', { css: { 'margin-left': '10%' }, title: `see shouts by user ${s.uid}` }).html(`<a href="?${url}&user=${s.uid}", target="_blank">${s.uid}</a>`)[func](grid)
      const shout = $('<span/>', { css: { 'margin-left': '10%' }, title: s[field] }).html(linkify(s[field]))[func](grid)
      const adate = (new Date(s.date - tzoffset)).toISOString()
        .replace(/T/, ' ')
        .replace(/:\d\d\..+/, '')
      $('<span/>', { css: { 'margin-left': '10%' }, title: adate }).html(adate)[func](grid)
      const css = { 'margin-left': '10%' }
      if (s.sessionId) {
        const c = utils.mongoIdToRGB(s.sessionId)
        css.background = `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0.5)`
      }
      // $('<span/>', { css, title: `see shouts in session ${s.sessionId}` }).html(s.sessionId ? `<a href="?${url}&session=${s.sessionId}" target="_blank">${s.sessionId.slice(-10)}</a>` : '')[func](grid)
      $('<span/>', { css, title: `see shouts in session ${s.sessionId}` }).html(s.sessionId ? `<a href="?${url}&session=${s.sessionId}" target="_blank">${cod(s.sessionId)}</a>` : '')[func](grid)
      if (u('admin')) { // todo: remove the shout correctly
        shout.click(() => {
          console.log(s)
          transfer.remove({ _id: s._id }, true)
          window.rrr = window.rrr.filter(s_ => s_._id !== s._id)
          window.rrrBack = window.rrrBack.filter(s_ => s_._id !== s._id)
          cod__ = {}
          mkPag()
        })
      }
      utils.gridDivider(190, 190, 190, grid, 1)
      utils.gridDivider(190, 190, 190, grid, 1)
    })
    return grid
  }

  const data = []
  for (let i = 0; i < 1000; i++) {
    data.push(`${i} YEAH MAN`)
  }
  const user = u('user')
  const session = u('session')
  const adiv = utils.centerDiv('90%', undefined, utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee'], 1)[0], 3, 2).html(`
  <h2>AA is Algorithmic Autoregulation</h2>
  <p>This is the logs page ${user ? 'for user <b>' + user + '</b>' : ''}${session ? 'for session <b>' + session.slice(-10) + '</b><span id="sessionDur"></span>' : ''}. Check the <a href="?${url2}" target="_blank">AA interface</a>.</p>
  `)
  $('<button/>', { id: 'rbutton', title: 'retrieve shouts given after last load' }).html('update').appendTo(adiv)
  const sbut = $('<button/>', { id: 'sbutton', title: 'search string in the shouts' }).html('search').appendTo(adiv)
    .click(() => {
      const res = window.prompt('enter search string (empty string to restore all messages):')
      console.log('search me', res, res === '', res === null)
      if (res !== '' && res !== null) {
        const res_ = res.toUpperCase()
        window.rrr = window.rrrBack.filter(i => i[field].toUpperCase().indexOf(res_) !== -1)
        mkPag()
        sbut.html(`search (${res})`)
      } else if (res === '') { // restore shouts:
        window.rrr = window.rrrBack.slice()
        mkPag()
        sbut.html('search')
      }
    })
  $('<div/>', { id: 'apid' }).appendTo(adiv)
  $('<div/>', { id: 'data-container' }).appendTo(adiv)
  const query = {}
  query[field] = { $exists: true }
  if (user) {
    query.uid = user
  }
  if (session) {
    query.sessionId = session
  }
  query.ws = ws || null
  const tzoffset = (new Date()).getTimezoneOffset() * 60000 // offset in milliseconds
  function updateDuration () {
    const r = window.rrr
    const dur = (r[0].date - r[r.length - 1].date) / (60 * 60 * 1000)
    const h = Math.floor(dur)
    const min = dur - h
    const min_ = String(Math.round(min * 60)).padStart(2, '0')
    // const dstr = `${h}:${min_}`
    const dstr = `${h}h${min_}m`
    $('#sessionDur').html(` (total duration: <b>${dstr}</b>)`)
  }
  function mkPag (data) {
    if (window.apag !== undefined) window.apag.pagination('destroy')
    window.apag = $('#apid').pagination({
      dataSource: window.rrr,
      pageSize: u('l') || 25,
      // autoHidePrevious: true,
      // autoHideNext: true,
      callback: function (data, pagination) {
        const html = simpleTemplating2(data)
        $('#data-container').html(html)
      }
    })
    if (session) updateDuration()
  }
  console.log({ query })
  transfer.findAll(query, true).then(r => {
    console.log(r)
    window.rrr = r
    r.sort((a, b) => b.date - a.date)
    window.rrrBack = window.rrr.slice()
    mkPag()
    $('#rbutton').click(() => {
      console.log('click')
      query._id = { $nin: window.rrrBack.map(s => s._id) }
      transfer.findAll(query, true).then(r_ => {
        r_.sort((a, b) => b.date - a.date)
        window.rrrBack.unshift(...r_)
        window.rrr = window.rrrBack.slice()
        sbut.html('search')
        mkPag()
      })
    })
  })
  $('#loading').hide()
}

e.aalogs = () => {
  const user = u('user')
  const session = u('session')
  // const adiv = utils.stdDiv().html(`
  const adiv = utils.centerDiv('90%', undefined, utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee'], 1)[0], 3, 2).html(`
  <h2>AA is Algorithmic Autoregulation</h2>
  <p>This is the logs page ${user ? 'for user <b>' + user + '</b>' : ''}${session ? 'for session <b>' + session.slice(-10) + '</b><span id="sessionDur"></span>' : ''}. Check the <a href="?ufrj" target="_blank">AA interface</a>.</p>
  `)
  // const grid = utils.mkGrid(4, adiv, '60%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))
  $('<button/>', { id: 'rbutton' }).html('update').appendTo(adiv)
  const grid = utils.mkGrid(4, adiv, '100%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))
  $('<span/>', { css: { 'margin-left': '10%' } }).html('<b>user</b>').appendTo(grid)
  $('<span/>', { css: { 'margin-left': '10%' } }).html('<b>shout</b>').appendTo(grid)
  const tz = (new Date()).getTimezoneOffset()
  const tz_ = (tz > 0 ? '-' : '+') + Math.floor(tz / 60)
  $('<span/>', { css: { 'margin-left': '10%' } }).html(`<b>when (GMT${tz_})</b>`).appendTo(grid)
  $('<span/>', { css: { 'margin-left': '10%' } }).html('<b>session</b>').appendTo(grid)
  utils.gridDivider(160, 160, 160, grid, 1)
  utils.gridDivider(160, 160, 160, grid, 1)
  utils.gridDivider(160, 160, 160, grid, 1)
  const lastSep = utils.gridDivider(160, 160, 160, grid, 1)
  const query = { shout: { $exists: true } }
  if (user) {
    query.uid = user
  }
  if (session) {
    query.sessionId = session
  }
  const ids = []
  const tzoffset = (new Date()).getTimezoneOffset() * 60000 // offset in milliseconds
  function addShout (r, updated) {
    const func = 'appendTo'
    r.sort((a, b) => b.date - a.date)
    r.forEach(s => {
      ids.push(s._id)
      const user = $('<span/>', { css: { 'margin-left': '10%' }, title: `see shouts by user ${s.uid}` }).html(`<a href="?ufrj-logs&user=${s.uid}", target="_blank">${s.uid}</a>`)[func](grid)
      const shout = $('<span/>', { css: { 'margin-left': '10%' }, title: s.shout }).html(linkify(s.shout))[func](grid)
      const adate = (new Date(s.date - tzoffset)).toISOString()
        .replace(/T/, ' ')
        .replace(/:\d\d\..+/, '')
      const date = $('<span/>', { css: { 'margin-left': '10%' }, title: adate }).html(adate)[func](grid)
      const session = $('<span/>', { css: { 'margin-left': '10%' }, title: `see shouts in session ${s.sessionId}` }).html(s.sessionId ? `<a href="?ufrj-logs&session=${s.sessionId}" target="_blank">${s.sessionId.slice(-10)}</a>` : '')[func](grid)
      if (u('admin')) {
        shout.click(() => {
          console.log(s)
          transfer.remove({ _id: s._id }, true)
          user.hide()
          shout.hide()
          date.hide()
          session.hide()
        })
      }
      utils.gridDivider(190, 190, 190, grid, 1)
      utils.gridDivider(190, 190, 190, grid, 1)
    })
  }
  function insertShout (r) {
    r.sort((a, b) => a.date - b.date)
    r.forEach(s => {
      ids.push(s._id)
      const adate = (new Date(s.date)).toISOString()
        .replace(/T/, ' ')
        .replace(/:\d\d\..+/, '')
      utils.gridDivider(190, 190, 190, grid, 1, lastSep)
      utils.gridDivider(190, 190, 190, grid, 1, lastSep)
      const session = $('<span/>', { css: { 'margin-left': '10%' }, title: `see shouts in session ${s.sessionId}` }).html(s.sessionId ? `<a href="?ufrj-logs&session=${s.sessionId}" target="_blank">${s.sessionId.slice(-10)}</a>` : '').insertAfter(lastSep)
      const date = $('<span/>', { css: { 'margin-left': '10%' }, title: adate }).html(adate).insertAfter(lastSep)
      const shout = $('<span/>', { css: { 'margin-left': '10%' }, title: s.shout }).html(linkify(s.shout)).insertAfter(lastSep)
      const user = $('<span/>', { css: { 'margin-left': '10%' }, title: `see shouts by user ${s.uid}` }).html(`<a href="?ufrj-logs&user=${s.uid}", target="_blank">${s.uid}</a>`).insertAfter(lastSep)
      if (u('admin')) {
        shout.click(() => {
          console.log(s)
          transfer.remove({ _id: s._id }, true)
          user.hide()
          shout.hide()
          date.hide()
          session.hide()
        })
      }
    })
  }
  function updateDuration () {
    const r = window.rrr
    const dur = (r[0].date - r[r.length - 1].date) / (60 * 60 * 1000)
    const h = Math.floor(dur)
    const min = dur - h
    const min_ = Math.round(min * 60)
    // const dstr = `${h}:${min_}`
    const dstr = `${h}h${min_}m`
    $('#sessionDur').html(` (total duration: <b>${dstr}</b>)`)
  }
  transfer.findAll(query, true).then(r => {
    console.log(r)
    window.rrr = r
    window.ids = ids
    addShout(r)
    if (session) {
      updateDuration()
    }
    $('#rbutton').click(() => {
      console.log('click')
      query._id = { $nin: ids }
      transfer.findAll(query, true).then(r_ => {
        window.R_ = r_
        insertShout(r_)
        r_.push(...window.rrr)
        window.rrr = r_
        updateDuration()
      })
    })
  })
  $('#loading').hide()
}

e.losd = () => {
  const adiv = utils.stdDiv().html(`
  <h2>LOSD is Linked Open Social Data</h2>
  <b>Æterni Anima</b> artifact for social mobilization.
  `)
  const grid = utils.mkGrid(1, adiv, '60%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))
  $('<span/>', { css: { 'margin-left': '10%' } }).html('<b>source</b>').appendTo(grid)
  utils.gridDivider(160, 160, 160, grid, 1)
  utils.gridDivider(160, 160, 160, grid, 1)
  transfer.losdCall('0', r => {
    console.log(r)
    r.forEach(n => {
      $('<span/>', { css: { 'margin-left': '10%' }, title: `navigate and increment network by ${n.n.value}` }).html(`<a href="?net&s=${n.s.value.split('#')[1]}", target="_blank">${n.n.value}</a>`).appendTo(grid)
      utils.gridDivider(160, 160, 160, grid, 1)
    })
    $('#loading').hide()
  })
}

e.net = () => {
  const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    // transparent: true
    backgroundColor: 0x000000
  })
  app.stage.sortableChildren = true
  document.body.appendChild(app.view)
  window.wand.app = app
  transfer.getNetMembersLinks(u('s'), r => {
    console.log(r)
    const pfs = net.plotFromSparql(r.members, r.friendships)
    window.nnn = pfs
    const dn = new net.ParticleNet2(app, pfs.net, pfs.atlas)
    window.nnn.dn = dn
    $('#loading').hide()
  })
}

e.netMongo = () => {
  const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    // transparent: true
    backgroundColor: 0x000000
  })
  app.stage.sortableChildren = true
  document.body.appendChild(app.view)
  window.wand.app = app
  transfer.fAll.ttm({ sid: 'renato.fabbri.125' }, {}, 'test').then(r => {
    const anet = JSON.parse(r[0].text)
    const pfm = net.plotFromMongo(anet)
    window.nnn = pfm
    const dn = new net.ParticleNet2(app, pfm.net, pfm.atlas)
    pfm.dn = dn
    $('#loading').hide()
  })
}

e.heritage = () => {
  const w = u('w')
  const adiv = utils.stdDiv().html(`
  <h2>Æterni Anima <b>${w}</b> heritage</h2>
  `)
  if (w === 'f') {
    transfer.fAll.mark({ 'userData.id': { $exists: true } }, { 'userData.id': true }).then(r => {
      console.log(r)
      window.rr = r
    })
  } else if (w === 'w') {
    transfer.fAll.ttm({ marker: { $exists: true } }, { marker: 1, date: 1, groupTitle: 1 }).then(r => {
      console.log(r)
      window.rr = r
    })
  }
  window.rr = adiv
}

e.you = () => {
  window.you = new c.You()
}

e.prayer = () => {
  const onome = u('p')
  const oracao = monk.prayers[onome]

  const adiv = utils.stdDiv().html(`
  <h2>Æterni Anima prayer</h2>
  <p>id da oração: <b title="URL argument p=X where X can be any among: ${Object.keys(monk.prayers).join(', ')}." style="background-color:#ffffaa;cursor:context-menu;padding:1%">${onome}</b></p>
  <i><pre>
${oracao}
  </pre></i>
  `)

  const dd = window.wand.router.timeArgument()
  setCountdown(dd - new Date(), () => {
    if (check.prop('checked')) {
      maestro.speaker.synth.cancel()
      maestro.speaker.play(oracao, 'pt')
    }
  })
  const grid = utils.mkGrid(2, adiv, '60%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))
  $('<span/>').html('countdown to start prayer:').appendTo(grid)
  const tLeft2 = $('<span/>', { css: { 'background-color': '#ffffaa', cursor: 'context-menu' }, title: 'URL argument s=HH:MM:SS. MM and SS and HH are optional. If &s= is not given, prayer starts on next minute.' }).appendTo(grid)
  $('<span/>').html('participate:').appendTo(grid)
  const check = $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid)

  function setCountdown (dur, fun) {
    const duration = dur / 1000
    const targetTime = (new Date()).getTime() / 1000 + duration
    setTimeout(() => {
      fun()
      clearInterval(timer)
      tLeft2.text('already started')
    }, duration * 1000)
    const reduce = dur => [Math.floor(dur / 60), Math.floor(dur % 60)]
    const p = num => num < 10 ? '0' + num : num
    const timer = setInterval(() => {
      const moment = targetTime - (new Date()).getTime() / 1000
      let [minutes, seconds] = reduce(moment)
      let hours = ''
      if (minutes > 59) {
        [hours, minutes] = reduce(minutes)
        hours += ':'
      }
      tLeft2.text(`${hours}${p(minutes)}:${p(seconds)}`)
    }, 100)
  }
  utils.vocalize(oracao, adiv)

  $('#loading').hide()
}

e.tper = () => {
  const percom = require('percom')
  const a = ['asd', 2, 'tre']
  const adiv = utils.stdDiv().html(`
  <h2>Æterni Anima permutation test</h2>
  ${percom.per(a)}
  `)
  console.log(percom.per(a, 3))
  // number of notes (int)
  // f0 (lowest note, float Hz)
  // number of octaves (float)
  // duration of iteration (float seconds)
  const grid = utils.mkGrid(2, adiv, '60%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))

  $('<span/>').html('number of notes.').appendTo(grid)
  const nnotes = $('<input/>').appendTo(grid)
    .val(3)

  $('<span/>').html('number of octaves.').appendTo(grid)
  const noctaves = $('<input/>').appendTo(grid)
    .val(1)

  $('<span/>').html('lowest frequency.').appendTo(grid)
  const f0 = $('<input/>').appendTo(grid)
    .val(200)

  $('<span/>').html('duration of the iteration on all notes.').appendTo(grid)
  const d = $('<input/>').appendTo(grid)
    .val(1.5)

  const f = v => parseFloat(v.val())
  $('<button/>').html('Play').appendTo(grid)
    .click(() => {
      console.log(nnotes.val(), noctaves.val(), f0.val(), d.val())
      const freqSpan = noctaves.val() * 2
      console.log('freq span:', freqSpan)
      const freqFact = freqSpan ** (1 / nnotes.val())
      console.log('freq fact:', freqFact)
      const notes = [f(f0)]
      for (let i = 1; i < f(nnotes); i++) {
        notes.push(f(f0) * (freqFact ** i))
      }
      console.log('notes: ', notes)
      mkSound(notes)
    })
  const sy = new t.MembraneSynth().toDestination()
  function mkSound (notes) {
    const tt = f(d) / notes.length
    const ttt = tt / 2
    const now = t.now()
    for (const note in notes) {
      console.log(notes[note])
      sy.triggerAttackRelease(notes[note], ttt, now + tt * note)
    }
  }

  $('#loading').hide()
}

e.mkMed2 = () => {
  const mk = new m.Mk(false)
  window.mk = mk
}

e.icons = () => {
  const adiv = utils.stdDiv().html(`
  <h2>testing icons</h2>
  `)
  const iclass = 'fa-play'
  $('<i/>', { class: 'fa ' + iclass, css: { background: '#ff00ee' } }).appendTo(
    adiv
  )
  $('#loading').hide()
}

e.transportTest = () => {
  window.wand.tone = t
}

e.ufrj = () => e.aa(true)

e['ufrj-logs2'] = () => {
  e.aalogs3(true)
}

e.trefoil = () => {
  const app = new PIXI.Application({ // todo: make it resizable
    width: window.innerWidth,
    height: window.innerHeight * 0.80
  })
  $('body').append(app.view)
  const [w, h] = [app.view.width, app.view.height]
  const c = [w / 2, h / 2] // center
  const a = w * 0.1
  const a_ = h * 0.1

  function xy (angle, torus, vertical) { // lemniscate x, y given angle
    // const px = a * Math.cos(angle) / (1 + Math.sin(angle) ** 2)
    // const py = Math.sin(angle) * px
    // return vertical ? [py + c[1], px + c[0]] : [px + c[0], py + c[1]]
    const px = a * (Math.sin(angle) + 2 * Math.sin(2 * angle))
    const py = a_ * (Math.cos(angle) - 2 * Math.cos(2 * angle))
    return [px + c[0], py + c[1]]
  }
  const myLine = new PIXI.Graphics()
  myLine.lineStyle(1, 0xffffff)
    .moveTo(...xy(0, false, u('v')))
  const segments = 1000
  for (let i = 0; i <= segments; i++) {
    myLine.lineTo(...xy(2 * Math.PI * i / 100, false, u('v')))
  }
  app.stage.addChild(myLine)
  if (u('v')) {
    myLine.pivot.x = c[0]
    myLine.pivot.y = c[1]
    myLine.position.set(...c)
    myLine.rotation = Math.PI
  }
  window.lll = myLine
  window.ccc = c
  $('#loading').hide()
}

e.hexagram = () => {
  const app = new PIXI.Application({ // todo: make it resizable
    width: window.innerWidth,
    height: window.innerHeight * 0.80
  })
  $('body').append(app.view)
  const [w, h] = [app.view.width, app.view.height]
  const c = [w / 2, h / 2] // center
  const a = w * 0.7
  const a_ = h * 0.7
  const r = (a + a_) / 2

  function xy (angle, torus, vertical) {
    if (angle < Math.PI / 8) {
      const dx = Math.sin(angle) * r
      return [dx + c[0], c[1] + r]
    } else if (angle < Math.PI) {
      const an = Math.PI / 8
      const [vx, vy] = [c[0] + Math.sin(an) * r, c[1] + r]
      return [vx - 1, vy - 1] // continue here TTM, -1 dummy
    } else if (angle > 7 * Math.PI / 8) {
      const dx = Math.sin(angle) * r
      return [c[0] - dx, c[1] - r]
    }
  }
  const myLine = new PIXI.Graphics()
  myLine.lineStyle(1, 0xffffff)
    .moveTo(...xy(0, false, u('v')))
  const segments = 1000
  for (let i = 0; i <= segments; i++) {
    myLine.lineTo(...xy(2 * Math.PI * i / 100, false, u('v')))
  }
  app.stage.addChild(myLine)
  window.lll = myLine
  window.ccc = c
  $('#loading').hide()
}

e.calendar = () => {
  const l1 = [
    'Respiração diafragmática (pela barriga, peito parado), lenta.',
    'Postura livre mas de preferência com coluna ereta, seja deitada ou sentada ou de pé.',
    'Garantir que ela tenha entendido como ativar o artefato, porque usá-lo e o que esperar das sessões de MMM.' // todo: descrever
  ].reduce((a, i) => a + `<li>${i}</li>`, '')
  const l2 = [
    'Aquietar a mente.',
    'Concentrar somente no tema.',
    'Mesmo durante os dias, quanto menos o pensamento estiver solto, mais energia (e recursos, vitaminas) sobra para o corpo se curar e rejuvenescer.',
    'Quanto menos os pensamentos estiverem desvairados, mais permissões e responsabilidades espirituais são concedidas a nós.'
  ].reduce((a, i) => a + `<li>${i}</li>`, '')
  const l3 = [
    'Curar e manifestar melhoras para si, nossas famílias e mundo todo.',
    'Harmonizar a respiração e o sistema nervoso.',
    'Vibrar no corpo de Luz.',
    'Caridade.',
    'As sessões devem sempre ser feitar em conjuntos, mínimo de 3. A pessoa deve ir agora pensando no objetivo das próximas 3 sessões dela.'
  ].reduce((a, i) => a + `<li>${i}</li>`, '')
  const novato = [
    `Na primeira sessão, tratar de: <ul>${l1}</ul>`,
    `Na segunda sessão, tratar dos pensamentos: <ul>${l2}</ul>`,
    `Na terceira sessão, tratar dos propósitos de estar na sessão: <ul>${l3}</ul>`
  ].reduce((a, i) => a + `<li>${i}</li>`, '')
  const temas = [
    'Anjo da Guarda',
    'Anjos',
    'Luz',
    'Consciência da Presença do Criador',
    'Caminho Crístico',
    'Contato com E.T.s',
    'Força',
    'Concentração',
    'Pureza',
    'Regeneração'
  ].reduce((a, i) => a + `<li>${i}</li>`, '')

  utils.stdDiv().html(`
  <h1>Calendário</h1>

  No calendário ficam marcadas as sessões:
  quem e em que nível estão.

  Os níveis atuais estão divididos como a seguir.

  <h2>Nível 0</h2>
  Com marcações 1, 2, 3, para primeira, segunda e terceira sessão.
  É o momento de receber a pessoa, escutá-la, avaliar se ela tem condições de estar com
  outras pessoas nas práticas diárias.

  É de primeira importancia garantir que ela tenha as bases para trabalhar nas sessões:
  <ol>${novato}</ol>

  <h2>Nível 1</h2>
  A pessoa fará dois conjuntos de 3 sessões (marcados com A e B no calendário).

  Cada conjunto de 3 sessões é dedicado para algo que ela escolher. A pessoa pode escolher contar ou não o tema para os outros participantes.

  Ao final do primeiro conjunto, contar a ela a distinção entre trabalho maior e menor (horário bem definido para começar ou não).

  Exemplos de temas para sugerir para a pessoa:
  <ul>${temas}</ul>

  <h2>Nível 2</h2>
  Podemos introduzir práticas com leituras ou mais longas ou com dinâmicas de pergunta e resposta, etc.
  A pessoa pode também ficar responsável por algum horário fixo (abrir uma sala, receber as pessoas, repassar o link do artefato, etc).

  <br><br>:::
  `)
  $('#loading').hide()
}

e.fig8 = () => {
  const app = new PIXI.Application({ // todo: make it resizable
    width: window.innerWidth,
    height: window.innerHeight * 0.80
  })
  $('body').append(app.view)
  const [w, h] = [app.view.width, app.view.height]
  const c = [w / 2, h / 2] // center
  const a = w * 0.1
  const a_ = h * 0.1

  function xy (angle, torus, vertical) { // lemniscate x, y given angle
    const foo = 2 + Math.cos(2 * angle)
    return [c[0] + a * foo * Math.cos(3 * angle), c[1] + a_ * foo * Math.sin(3 * angle)]
  }
  const myLine = new PIXI.Graphics()
  myLine.lineStyle(1, 0xffffff)
    .moveTo(...xy(0, false, u('v')))
  const segments = 1000
  for (let i = 0; i <= segments; i++) {
    myLine.lineTo(...xy(2 * Math.PI * i / 100, false, u('v')))
  }
  app.stage.addChild(myLine)
  if (u('v')) {
    myLine.pivot.x = c[0]
    myLine.pivot.y = c[1]
    myLine.position.set(...c)
    myLine.rotation = Math.PI
  }
  window.lll = myLine
  window.ccc = c
  $('#loading').hide()
}

e['003-pequeno-historico'] = () => {
  // não consigo estabelecer relações entre vc, o Otávio e o "arcturianos"
  //
  // Gostaria que vc me contasse a "história" de quando surgiu o artefato,
  // como surgiu a ideia de usá-lo em meditação,
  // como chegou à conclusão que ajudaria pessoas tristes ou com prolemas

  const parags = [
  `
  Em oração constante e estudando diariamente a Palavra, procurei com diligência
  saber a vontade dA Fonte (dO Criador) para meus dias.
  Ele mostrou o que talvez seja a incumbência de todos. Entendi que ao menos minha ela é. 
  Devemos ter uma vida mais funcional, confortável
  e apta a ajudar outras pessoas, a sociedade e o planeta.
  `,
  `
  Mantive-me, então, alternando oração e leitura da Palavra com modelagem,
  escrita de códigos computacionais e pesquisa científica.
  Uma constante busca de orientação divina para influenciar na Terra da melhor forma
  o que nos fosse dada permissão para influenciar.
  `,
  `
  Contei com os Martelos do Recomeço
  ao aplicar MMM (meditação, mentalização e manifestação), com o suporte do audiovisual,
  para a obtenção de entendimentos, revelações e para harmonizar corpo e mente, individual e social.
  `,
  `
  As explorações duraram cerca de duas décadas,
  mas este percurso final em que empregamos conscientemente nossos entendimentos
  levou poucos meses até o momento.
  `,
  `
  Encontrei grande orientação vinculada à alcunha de "Arcturianos".
  As vias pelas quais eram disponibilizadas as mensagens não existem mais e tenho esperança de que estabeleçam novamente
  contato tão luminoso.
  Diz-se que eles tem a missão aqui na Terra de unir espiritualidade e tecnologia e que são mestres
  do balanço (no sentido de equilíbrio, harmonia e proporção).
  Com recorrência associei os Arcturianos ao corpo de Luz que estamos ativando por meio dos
  Artefatos Audiovisuais (a.k.a. Artefatos Arcturianos).
  `,
  `
  -- Ferreiros Renascidos, 01/Mar/2021
  `
  ].reduce((a, i) => a + `<p>${i}</p>`, '')
  utils.stdDiv().html(`
  <h1>Caminho</h1>

  ${parags}

:::
  `)
  $('#loading').hide()
}
e['002-caminho'] = () => {
  // não consigo estabelecer relações entre vc, o Otávio e o "arcturianos"
  //
  // Gostaria que vc me contasse a "história" de quando surgiu o artefato,
  // como surgiu a ideia de usá-lo em meditação,
  // como chegou à conclusão que ajudaria pessoas tristes ou com prolemas

  const parags = [
  `A história do surgimento do artefato,
  de como surgiu a ideia de usá-lo para meditação,
  e como chegamos à conclusão de que é uma panaceia.`,
  `A Verdadeira Luz da Dedicação pediu para eu lhe contar.
  `,
  `Conto aqui nestas linhas.
  Em oração constante e estudando diariamente a Palavra, procurei com diligência
  saber a vontade dA Fonte (dO Criador) para meus dias.
  `,
  `Ele mostrou minha preparação, meu contexto, e então minha incumbência.
  De fato, "os ouvidos que ouvem e os olhos que veem foram feitos pelo Senhor" (Provérbios 20:12)
  e bastava olhar. 
  `,
  `Devemos ter uma vida mais funcional, confortável
  e apta a ajudar outras pessoas, a sociedade e o planeta.
  `,
  `
  Nem sempre é fácil resistir ao dinheiro imediato.
  Seduz a ideia de alcançar melhores condições materiais, mas sei por experiência que
  obedecer a Deus é o melhor que a vida tem para nos oferecer, e além disso
  "Deleite-se no Senhor, e Ele atenderá aos desejos do seu coração" (Salmos 37:4).
  `,
  `
  Assim, apliquei os amadurecimentos que tínhamos, eu e Os Martelos do Recomeço,
  sobre meditação, mentalização e manifestação, sobre os usos do audiovisual
  para obtenção de entendimentos, revelações e para harmonizar o corpo e a mente.
  `,
  `
  O processo durou muitos anos se levados em conta nossas explorações,
  mas este percurso final em que aplicamos conscientemente nossos entendimentos
  levou poucos meses.
  `,
  `
  Foi um processo permeado de oração e leitura da Palavra alternado com modelagem,
  contas e escrita de códigos computacionais.
  Uma constante busca de orientação divina para influenciar na Terra da melhor forma
  o que nos fosse dada permissão.
  `,
  `
  "Não consigo estabelecer relações entre você, os Martelos do Recomeço, e o 'arcturianos'",
  a Verdadeira Luz da Dedicação lembrou.
  Nas dificuldades que enfrentei encontrei grande orientação em mensagens
  transmitidas em nome destes nossos irmãos.
  Diz-se que eles tem a missão aqui na Terra de unir espiritualidade e tecnologia.
  `,
  `
  -- Ferreiros Renascidos, 01/Mar/2021
  `
  ].reduce((a, i) => a + `<p>${i}</p>`, '')
  utils.stdDiv().html(`
  <h1>Caminho</h1>

  ${parags}

:::
  `)
  $('#loading').hide()
}

e.cdraw = () => {
  const app = new PIXI.Application({ // todo: make it resizable
    width: window.innerWidth,
    height: window.innerHeight * 0.80
  })
  $('body').append(app.view)
  const [w, h] = [app.view.width, app.view.height]
  const c = [w / 2, h / 2] // center
  const a = w * 0.1
  const a_ = h * 0.1

  function xy (angle, torus, vertical) { // lemniscate x, y given angle
    const x = 2.5 * (Math.sin(-5 * angle) ** 2) * (2 ** (Math.cos(Math.cos(4.28 * 2.3 * angle))))
    const y = 2.5 * Math.sin(Math.sin(-5 * angle)) * (Math.cos(4.28 * 2.3 * angle) ** 2)
    return [c[0] + a * x, c[1] + a_ * y]
    // const foo = 2 + Math.cos(2 * angle)
    // return [c[0] + a * foo * Math.cos(3 * angle), c[1] + a_ * foo * Math.sin(3 * angle)]
  }
  const myLine = new PIXI.Graphics()
  myLine.lineStyle(1, 0xffffff)
    .moveTo(...xy(0, false, u('v')))
  const segments = 10000
  for (let i = 0; i <= segments; i++) {
    myLine.lineTo(...xy(-6 + 12 * i / 10000, false, u('v')))
  }
  app.stage.addChild(myLine)
  if (u('v')) {
    myLine.pivot.x = c[0]
    myLine.pivot.y = c[1]
    myLine.position.set(...c)
    myLine.rotation = Math.PI
  }
  window.lll = myLine
  window.ccc = c
  $('#loading').hide()
}

e.torus = () => {
  const app = new PIXI.Application({ // todo: make it resizable
    width: window.innerWidth,
    height: window.innerHeight * 0.80
  })
  $('body').append(app.view)
  const [w, h] = [app.view.width, app.view.height]
  const c = [w / 2, h / 2] // center
  const a = w * 0.1
  const a_ = h * 0.1

  function xy (angle, torus, vertical) { // lemniscate x, y given angle
    const foo = 3 + Math.cos(4 * angle)
    return [c[0] + a * foo * Math.cos(3 * angle), c[1] + a_ * foo * Math.sin(3 * angle)]
  }
  const myLine = new PIXI.Graphics()
  myLine.lineStyle(1, 0xffffff)
    .moveTo(...xy(0, false, u('v')))
  const segments = 1000
  for (let i = 0; i <= segments; i++) {
    myLine.lineTo(...xy(2 * Math.PI * i / segments, false, u('v')))
  }
  app.stage.addChild(myLine)
  if (u('v')) {
    myLine.pivot.x = c[0]
    myLine.pivot.y = c[1]
    myLine.position.set(...c)
    myLine.rotation = Math.PI
  }
  window.lll = myLine
  window.ccc = c
  $('#loading').hide()
}

e.cinq = () => {
  const app = new PIXI.Application({ // todo: make it resizable
    width: window.innerWidth,
    height: window.innerHeight * 0.80
  })
  $('body').append(app.view)
  const [w, h] = [app.view.width, app.view.height]
  const c = [w / 2, h / 2] // center
  const a = w * 0.1
  const a_ = h * 0.1

  function xy (angle, torus, vertical) { // lemniscate x, y given angle
    const foo = 3 + Math.cos(5 * angle)
    return [c[0] + a * foo * Math.cos(2 * angle), c[1] + a_ * foo * Math.sin(2 * angle)]
  }
  const myLine = new PIXI.Graphics()
  myLine.lineStyle(1, 0xffffff)
    .moveTo(...xy(0, false, u('v')))
  const segments = 1000
  for (let i = 0; i <= segments; i++) {
    myLine.lineTo(...xy(2 * Math.PI * i / segments, false, u('v')))
  }
  app.stage.addChild(myLine)
  if (u('v')) {
    myLine.pivot.x = c[0]
    myLine.pivot.y = c[1]
    myLine.position.set(...c)
    myLine.rotation = Math.PI
  }
  window.lll = myLine
  window.ccc = c
  $('#loading').hide()
}

e.torusDec = () => {
  const app = new PIXI.Application({ // todo: make it resizable
    width: window.innerWidth,
    height: window.innerHeight * 0.80
  })
  $('body').append(app.view)
  const [w, h] = [app.view.width, app.view.height]
  const c = [w / 2, h / 2] // center
  const a = w * 0.1
  const a_ = h * 0.1

  function xy (angle, torus, vertical) { // lemniscate x, y given angle
    const foo = 1 + 0.45 * Math.cos(3 * angle) + 0.4 * Math.cos(9 * angle)
    return [c[0] + a * foo * Math.sin(2 * angle), c[1] + a_ * foo * Math.cos(2 * angle)]
  }
  const myLine = new PIXI.Graphics()
  myLine.lineStyle(1, 0xffffff)
    .moveTo(...xy(0, false, u('v')))
  const segments = 1000
  for (let i = 0; i <= segments; i++) {
    myLine.lineTo(...xy(2 * Math.PI * i / segments, false, u('v')))
  }
  app.stage.addChild(myLine)
  if (u('v')) {
    myLine.pivot.x = c[0]
    myLine.pivot.y = c[1]
    myLine.position.set(...c)
    myLine.rotation = Math.PI
  }
  window.lll = myLine
  window.ccc = c
  $('#loading').hide()
}

e.testRecord = () => {
  // const blob = new Blob(chunks, { type: 'audio/wav' })
  const context = new t.OfflineContext(1, 0.5, 44100)
  const dest = context.createMediaStreamDestination()
  const recorder = new window.MediaRecorder(dest.stream, { mimeType: 'audio/wav' })
  const chunks = []
  recorder.ondataavailable = evt => chunks.push(evt.data)
  const osc = new t.Oscillator({ context }).connect(dest)
  context.render().then(buffer => {
    console.log(buffer.numberOfChannels, buffer.duration, osc)
    window.bbb = buffer
    const blob = new window.Blob(chunks, { type: 'audio/wav' })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    document.body.appendChild(a)
    a.style = 'display: none'
    a.href = url
    a.download = (this.filename || 'test') + '.wav'
    a.click()
  })
}

e.testRecord2 = () => {
  const wavefile = require('wavefile')
  t.Offline(() => {
    const oscillator = new t.Oscillator().toDestination().start(0)
    window.osc = oscillator
  }, 2).then((buffer) => {
    console.log(buffer.numberOfChannels, buffer.duration)
    window.bbb = buffer
    const wav = new wavefile.WaveFile()
    // wav.fromScratch(2, 44100, '32f', buffer.toArray()) // works
    const bar = buffer.toArray()
    const bar_ = []
    bar.forEach(chan => {
      const [max, min] = chan.reduce((mm, i) => {
        if (i > mm[0]) mm[0] = i
        if (i < mm[1]) mm[1] = i
        return mm
      }, [-Infinity, Infinity])
      const chan_ = chan.map(i => Math.floor((2 ** 15 - 1) * (2 * (i - min) / (max - min) - 1)))
      bar_.push(chan_)
    })
    wav.fromScratch(2, 44100, '16', bar_) // works

    // const blob = new window.Blob(buffer.toArray(), { type: 'audio/wav' })
    // const blob = new window.Blob(buffer.toArray(), { type: 'audio/ogg' })
    // // const blob = new window.Blob(buffer.toArray())

    // const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    document.body.appendChild(a)
    a.style = 'display: none'
    // a.href = url
    a.href = wav.toDataURI()
    a.download = (this.filename || 'test') + '.wav'
    a.click()
  })
}

e['004-groups-e-paginas'] = () => {
  const grupos = [ // nossos:
    'https://www.facebook.com/groups/luz.e.graca',
    'https://www.facebook.com/groups/arcturianart',
    'https://www.facebook.com/groups/onchrist',
    'https://www.facebook.com/groups/avmeditation',
    'https://www.facebook.com/groups/avatarheal',
    'https://www.facebook.com/groups/mentaliz',
    'https://www.facebook.com/groups/imortalidade',
    'https://www.facebook.com/groups/brainentrainment'
  ].reduce((a, i) => a + `<li><a href="${i}">${i}</a></li>`, '')

  const grupos2 = [ // de terceiros:
    'https://www.facebook.com/groups/arcturiuno',
    'https://www.facebook.com/groups/mentesdespertas'
  ].reduce((a, i) => a + `<li><a href="${i}">${i}</a></li>`, '')
  utils.stdDiv().html(`
  <h1>Grupos</h1>
  
  De nossa administração:
  <ul>${grupos}</ul>

  De administração de terceiros:
  <ul>${grupos2}</ul>

  :::
  `
  )
  $('#loading').hide()
}

e['005-sprint-2021-04-21'] = () => {
  utils.stdDiv().html(`
  <h1>Sprint 21/Abril/2021</h1>
  
  <pre>
Renato
  refatorei e consolidei o código do mkMed2 e mkLight
  melhorei o AA (inicialização do som e cores das sessões)
  requisitei depoimentos p Luis Henrique, Janira, Marcus Vinícius
  Publicação de contribuição
  Encaminhadas pessoas dos grupos para auxílio no whats, com vídeo do Otávio ou pessoalmente 
  Vídeo inicial de criação sonora nos artefatos (13 minutos).

Otávio
  Reunião com Janira explicando os fundamentos. Possibilidade de diálogo com linha do Grabovoi.
  Participando das sessões e postando sobre os temas e sessões.
  Meditação com 10 min resp ritmada e caminhando x 5 min respiração livre e parado.
  Template novo!

Mariel
  Aprendendo/aprimorando sobre criação sonora nos artefatos.
  Criando artefatos do zero (som e visual e temas/eixos).
  Ensinando o Renato S'Huss.
  Criando as sessões todas.
</pre>

  :::
  `
  )
  $('#loading').hide()
}

e['006-reiki'] = () => {
  const en = [
    'segue a intuição',
    'foca no presente',
    'foca em cada chácra, um por vez',
    'tenta achar onde talvez tenha problema',
    'foca nele, se não tiver retorno/eco, fica nele até ter eco',
    'conversa (antes e depois e durante)'
  ]
  const perm = [
    'os Mestres iluminados do Reiki',
    'e Jesus Cristo e Deus Pai',
    'e para iniciar a pessoa'
  ]
  const ini2 = [
    'Cho Ku Rei',
    'Sei He Ki',
    '-> Corpo de Luz, dilui, quebra <-',
    'mantras (Kodoish Kodoish Kodoish, Adonai Tsebaiosh. Refuá Christus, Refuá Elohim)'
  ]
  const ini = [
    'inicia uma sessão com artefato',
    `iniciamos uma sessão de reiki pedindo assistência e permissão para ${a(perm)}`,
    'iniciamos falando o nome de quem está sendo iniciado e do iniciador',
    `e falando qual iniciação está sendo feita ${a(ini2)}`,
    'e mantalizamos durante a sessão que estamos abrindo um canal no iniciado para aquela energia específica e para comunicação espiritual específica',
    'fechar a sessão soprando as mãos e dizendo "eu entrego em suas mãos" (direcionado aos mestres iluminados do Reiki e a Jesus e a Deus pai)'
  ]
  const ap2 = [
    'os Mestres iluminados do Reiki',
    'e Jesus Cristo e Deus Pai',
    'e para iniciar a pessoa'
  ]
  const ap3 = [
    'pode concentrar chácra por chácra',
    'pode concentrar no ambiente da pessoa',
    'pode usar a sonda'
  ]
  const ap = [
    'Hon Sha Ze Sho Nem ao início da sessão',
    `iniciamos uma sessão de reiki pedindo assistência e permissão para ${a(ap2)}`,
    'iniciamos falando o nome de quem está aplicando e do paciênte',
    `faz símbolos, concentra na energia saindo da mão ${a(ap3)}`,
    'fechar a sessão soprando as mãos e dizendo "eu entrego em suas mãos" (direcionado aos mestres iluminados do Reiki e a Jesus e a Deus pai)'
  ]
  function a (l) {
    const ll = l.reduce((a, i) => a + `<li>${i}</li>`, '')
    return `<ul>${ll}</ul>`
  }
  utils.stdDiv().html(`
  <h1>Iniciando o Reiki no MMM/AAA</h1>
  
<h2>Energização indígena (com as mãos, vinda do Fernando)</h2>
${a(en)}

<h2>Iniciações</h2>
${a(ini)}

<h2>Aplicações</h2>
${a(ap)}
  :::
  `
  )
  $('#loading').hide()
}

e['007-meses'] = () => {
  const meses = `janeiro (já, né, rô!): já é hora de conceber o que se quer com o ano, no que vai colocar suas forças/energias.
  fevereiro (fé vê rei, rô!): pela fé e esperança, vê-se algo especial ou soberano.
  março (marco): algum grande acontecimento ou feito, alguma observação ou mudança de postura/entendimento.
  abril (abriu): uma abertura, não necessariamente um começo, por exemplo uma repercussão do marco.
  maio (maiô): colocamos roupas de banho: tanto para a imersão quanto para conceber nascimento.
  junho (júnior): nasce um (ou o) filho da saga.
  julho (juro): há um firmamento, um comprometimento, de criar o filho, de completar a trajetória.
  agosto (a gosto): fase de temperar e dosar elementos externos ou imprevistos e/ou os ingredientes internos.
  setembro (você tem bro): note ou busque um companheiro firme. Conte consigo mesmo somente, mas uma companhia é valiosa.
  outubro (outro bro): expansão do círculo social.
  novembro (nove, hein, bro): abertura do círculo social. Também o momento do 9, (3x3: divino feito do divino, ou divino confirmado).
  dezembro (dez, hein, bro): esmero nos arremates, no polimento, no que deixará de legado para o ano que vem e/ou para os outros.`.split('\n').reduce((a, i) => a + `<li>${i}</li>`, '')
  utils.stdDiv().html(`
  <h1>Meses do ano, 09/05/2021</h1>

  Mensagem da Vó Jussara:

  <p>O ano tem 12 partes, é completo. Cada mês é típico para algo e está nos nomes, sempre nos nomes, e feliz quem escuta e pensa.</p>
  <ol>${meses}</ol>

  :::
  `
  )
  $('#loading').hide()
}

e['008-fabbri-relato-antes-da-transicao'] = () => {
  utils.stdDiv().html(`
  <h1>Sobre o último período e o próximo, 04/06/2021</h1>

  Criamos o Grupo AAA (e MMM), os quais tem agora centenas de pessoas.
  Neste processo, em especial, o Otávio manteve algumas dinâmicas individuais,
  a Mariel criou a enorme maioria das sessões (e dos artefatos), eu mantive-me desenvolvendo
  os artefatos, colocando novas visualizações/formas, melhorando as interfaces de criação.
  Investi também bastante tempo falando com os novos integrantes.
  Eles estavam sempre falando comigo devido às postagens ou algum outro motivo.

  Pudemos também iniciar o Reiki do Corpo de Luz e esperar um pouco as coisas assentarem.
  Em especial, pude desenvolver as frentes de redes complexas, integrar aos artefatos,
  fazer difusões e interfaces de visualização.
  Estão contemplados os Facebook, o Whatsapp e o Telegram.
  Está consideravelmente fácil integrar outras redes sociais.

  Por fim, começamos a "Cura do Mundo Novo" e acabamos de acabar a segunda semana.
  Na semana que começará, devemos mudar os artefatos para "artefatos eternos" (permanentes)
  que começam nas horas angelicais.
  Isso nos permitirá caprichar bastante nos artefatos e postagens e aproveitar o grupo para manter
  mais diálogo.

  Deixamos bastante de lado a articulação com grupos, pessoas e instituições potencialmente interessadas.
  Tanto a Cura quando esta nova dinâmica devem facilitar esta linha de ação.

  :::
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e.getPhrase = () => {
  utils.getPhrase().then(r => console.log('HERE MAN', r))
}

e['009-atendimento'] = () => {
  utils.stdDiv().html(`
  <h1>Atendimentos</h1>


<h3>Estimad@s Senhoræs,</h3>

<p>
Estamos abrindo atendimentos de fronteira (com recursos audiovisuais, científicos, web, remotos e cognitivos) para:
<ul>
<li>tratamento individual, familiar ou de grupo para cura física (ex: dores musculares, enxaquecas), mentais (ex: ansiedade, depressão, memória) e espiritual.</li>
<li>aprendizado sobre os Artefatos Audiovisuais: como utilizar, quais as técnicas e benefícios, como aproveitá-los e criá-los para sua própria atividade como terapeuta.</li>
<li>Reiki de Luz: formação.</li>
</ul>
</p>

<p>
Contribuição sugerida: o valor que você achar apropriado. Pode também contribuir ajudando a iniciar outras pessoas, chamando pessoas para o Corpo de Luz, criando artefatos, etc.<br>
Mais detalhes nos comentários.<br>
Entre em contato pela Cura sua, de sua Família e do Mundo.<br>
</p>

<p>
Paz e Luz.
</p>

<p>
Dr. Renato Fabbri<br>
Maestro Otávio Martigli<br>
Dra. Mariel Elizabeth<br>
</p>

<i>14/Julho/2021</i>

<br>
<br>
:::

  `
  )
  $('#loading').hide()
}

e.gstat = () => {
  // const St = window.FooBar // fixme
  const St = require('stats-js')
  const stats = new St()
  stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom)
  this.tasks = [] // list of routines to execute
  this.executing = true
  this.animate = () => {
    stats.begin()
    // monitored code goes here
    for (let i = 0; i < this.tasks.length; i++) {
      this.tasks[i]()
    }
    stats.end()
    if (this.executing) {
      window.requestAnimationFrame(this.animate)
    }
  }
  this.animate()
}

e.mkLight = () => {
  const mk = new m.Mk(true)
  window.mk = mk
}

e.fp = () => {
  const fp = 'banana' // require('get-browser-fingerprint')
  window.fffppp = fp
  const fp_ = fp()
  console.log(fp_)
}

e.lis = () => {
  const app = new PIXI.Application({ // todo: make it resizable
    width: window.innerWidth,
    height: window.innerHeight * 0.80
  })
  $('body').append(app.view)
  const [w, h] = [app.view.width, app.view.height]
  const c = [w / 2, h / 2] // center
  const a = w * 0.4
  const a_ = h * 0.4

  const kx = u('kx')
  const ky = u('ky')
  function xy (angle) { // lemniscate x, y given angle
    const x = a * Math.cos(kx * angle)
    const y = a_ * Math.sin(ky * angle)
    return [c[0] + x, c[1] + y]
  }
  const myLine = new PIXI.Graphics()
  myLine.lineStyle(1, 0xffffff)
    .moveTo(...xy(0))
  const segments = 1000
  const fact = parseFloat(u('f')) || 1
  for (let i = 0; i <= segments * fact; i++) {
    myLine.lineTo(...xy(2 * Math.PI * i / segments))
  }
  app.stage.addChild(myLine)
  if (u('v')) {
    myLine.pivot.x = c[0]
    myLine.pivot.y = c[1]
    myLine.position.set(...c)
    myLine.rotation = Math.PI
  }
  window.lll = myLine
  window.ccc = c
  $('#loading').hide()
}

e.jantunes = () => {
  const url = 'https://jorge-de-freitas-antunes.github.io/assets/leva1/'
  const bio = [
    'Bio em PORTUGUÊS.doc',
    'Bio em FRANCÊS.doc',
    'Bio em INGLÊS.doc'
  ]
  const listagens = [
    'Música de Câmara de Jorge Antunes.doc',
    'CDs e DVDs de Jorge Antunes.doc',
    'OBRAS SINFÔNICAS de Jorge Antunes.doc'
  ]
  const docs = [
    'GEMUNB.doc',
    'Texto de Gerson Valle.doc'
  ]
  const fotos = [
    '1961-O precursor em seu estúdio caseiro,Rua-Orestes, Rio de Janeiro.png',
    'Theremin construído por Jorge Antunes em 1962 (1º).JPG',
    '1967-No Instituto Villa-Lobos.jpg',
    'Em 1971 Antunes ganhou concurso de composição empatado com seu mestre Guerra Peixe.jpg',
    'UTRECHT 1972.jpg',
    '1974-GEMUNB (Grupo de Experimentação Musical da Universidade de Brasília).jpg',
    '1984-Jorge Antunes ensaiando  Sinfonia das Buzinas.jpg',
    '1995 - Xenakis e Antunes.jpg',
    '2006-Cena da ópera OLGA- Prisão da Rua Frei Caneca.jpg'
  ]

  const url2 = 'https://jorge-de-freitas-antunes.github.io/assets/leva2/'
  const notas = [ // imprensa
    'Ambiente I.jpg',
    'D.N.1971 (filho e prêmio).jpg',
    'Premio Angelicum 1971.jpg',
    'O Globo 1972.jpg',
    'JB 1972.jpg',
    'SINFONIA DAS DIRETAS-jornal 6.jpg',
    'SINFONIA DAS DIRETAS-jornal 1.jpg',
    'SINFONIA DAS DIRETAS-jornal 2.jpg',
    'SINFONIA DAS DIRETAS-jornal 3.jpg',
    'SINFONIA DAS DIRETAS-jornal 4.jpg',
    'SINFONIA DAS DIRETAS-jornal 5.jpg',
    'SINFONIA DAS DIRETAS-jornal 7.jpg',
    'SINFONIA DAS DIRETAS-jornal 8.jpg',
    'Sinfonia dosDireitos (C.Braz).jpg',
    'Coli-CONCERTO).nov.2020 2.jpg'
  ]

  const links = [
    ['2009: esnsaio de Carlos Eduardo Amaral, "Ativismo sinfônico – O protesto político nas obras orquestrais de Jorge Antunes"', 'https://ativismosinfonico.wordpress.com/'],
    ['2010: MSc de J.M da Rocha, "Os sons e as cores: propostas de correlação em experiências composicionais"', 'https://repositorio.ufba.br/ri/handle/ri/9170'],
    ['2016: review do álbum "Música Electrónica” [MENT007]"', 'https://avantmusicnews.com/2016/10/05/jorge-antunes-musica-electronica-ment007/'],
    ['2017: sobre a ópera O Espelho (com Coli)', 'https://glosas.mpmp.pt/opera-o-espelho'],
    ['2017: IVL 50 Anos tem texto "IVL 1967-1968: um depoimento" do J. Antunes', 'http://www2.unirio.br/unirio/cla/ivl/publicacoes/ivl_50_anos_edicao_comemorativa_unirio.pdf'], // IVL 1967-1968: um depoimento
    ['2017: entrevista', 'https://www.vice.com/pt/article/d7b54x/jorge-antunes-entrevista'],
    ['2020: sobre a ópera Olga', 'https://operawire.com/baltic-opera-2020-21-review-olga'],
    ['2021: homepage', 'http://jorgeantunes.com.br']
  ].reduce((a, i) => `${a} <li><a href="${i[1]}" target="_blank">${i[0]}</a></li>`, '')

  const dicio = [ // notas de dicionário
    'Aurélio-dicionário.jpg',
    'dicionário.jpg' // como que chama esse dicionário?
  ]

  const texta = [ // textos acadêmicos
    'BORGES_GilbertoAndre_jorgeantunes 2.pdf',
    'Cor_Musica_Andre_Rangel.pdf',
    'Musica_Teatro_Musica-Teatro_e_Percussao.pdf',
    'Performance no teatro instrumental - Daniel Serale 2.pdf',
    'Volpe.pdf',
    'Sinestesia2015_Paper-Basbaum _1_ 3.pdf'
  ]

  const a = l => '<ul>' + l.reduce((a, i) => `${a}<li><a href="${url}${i}" target="_blank">${i}</a></li>`, '') + '</ul>'
  const b = l => '<ul>' + l.reduce((a, i) => `${a}<li><a href="${url2}${i}" target="_blank">${i}</a></li>`, '') + '</ul>'
  const h = t => `<h3>${t}</h3>`

  utils.stdDiv().html(`
  <h1>Jorge Antunes</h1>
  ${h('Biografias')}
  ${a(bio)}

  ${h('Listagens de gravações e obras')}
  ${a(listagens)}

  ${h('Demais textos')}
  Sobre o GEMUNB (Grupo de Experimentação Musical da Universidade de Brasília) e sobre o percurso do compositor (escrito por volta de 2012):
  ${a(docs)}

  ${h('Fotos')}
  ${a(fotos)}

  ${h('Notas na imprensa')}
  ${b(notas)}

  ${h('Entradas em dicionários')}
  ${b(dicio)}

  ${h('Textos acadêmicos')}
  ${b(texta)}

  ${h('Links')}
  <ul>${links}</ul>

  :::
  `)
  $('#loading').hide()
}

e.wiki = () => {
  const itens = [
    `sugira compositores, obras, técnicas, eventos, grupos, etc.
    para serem representados na Wikipédia.
    `,
    `
    Escreva novos artigos na Wikipédia ou melhore os existentes.
    Mesmo que não seja sobre compositores ou sobre música, estas contribuições serão consideradas.
    `,
    `
    Ajude na tradução dos artigos para outras línguas além de português e inglês.
    `,
    `
    Repasse este link para pessoas e entidades potencialmente interessadas na iniciativa.
    `,
    `
    Entre em contato para quaisquer outros assuntos, inclusive se precisar de outra forma, que <b>não a chave Pix</b>, para fazer uma transferência financeira.
    `
  ].reduce((a, i) => a + `<li>${i}</li>`, '')
  const comp = [
    'Jorge Antunes',
    'Victor Lazarini',
    'Edson Zampronha',
    'Ricardo Tacuchian'
  ].reduce((a, i) => a + `<li>${i}</li>`, '')
  const cont = [
    `O Brasil é agraciado com diversos <b>compositores</b>,
    expressivos tanto para a apreciação quanto pela importância na história da música.
    `,
    `A <b>Wikipédia</b>
    talvez seja a principal referência sobre um determinado assunto e sua importância, em especial os artigos em inglês.
    Muitos compositores brasileiros estão na Wikipédia.
    Muitos não estão, e dentre os que estão, todos os que visitei merecem artigos mais completos e melhor escritos.
    Além disso, muitos possuem páginas apenas em português ou apenas em inglês, ou receberam apenas pequenos rascunhos.
    `,
    `
    As instabilidades da vida e a dedicação aos trabalhos impossibilitaram, nos anos anteriores, que eu criasse mais novos artigos e melhorasse mais os existentes.
    De fato, contribuir para a Wikipédia é gratificante, mas nem sempre fácil. É necessário escrever com esmero e referenciar fontes estrategicamente.
    Além disso, é comum os supervisores não confiarem em autores que não fizeram já várias contribuições, principalmente quando o artigo trata de alguém, algum grupo ou instituição, pois várias vezes a edição não é idônea.
    `,
    `
    Assim, criei esta página para registrar este andamento, conseguir incentivos, colaboradores, e firmar o passo.
    `
  ].reduce((a, i) => a + `<p>${i}</p>`, '')
  const pars = [
    `
    Caso você queira incentivar financeiramente esta dedicação, transfira uma quantia pela chave Pix <b>compowiki</b>. Há outras formas de contribuir:
    <ul>${itens}</ul>
    `,
    `Você pode entrar em contato pelo email <b>renato [Ponto] fabbri (arroba) gmail PONTO com</b>
    `
  ].reduce((a, i) => a + `<p>${i}</p>`, '')
  utils.stdDiv().html(`
  <h1>Compositores brasileiros na Wikipédia</h1>
  <h2>Andamento</h2>
    <p>
    Alguns dos compositores já em consideração:
    <ul>${comp}</ul>
    </p>
    <p>
    Se você é um compositor e quer que seus artigos (em português e inglês) sejam melhorados ou mesmo criados, sugiro enviar esta página para dois ou mais compositores.
    A contribuição financeira é bem-vinda e é também importante acionar os outros compositores até para mantermos este trabalho ético.
    </p>
  <h2>Contexto</h2>
  ${cont}
  <h2>Incentivo</h2>
  ${pars}

  :::
  `)
  $('#loading').hide()
}

e.colors = () => {
  // tinycolor2:
  //  convert to representations
  //  color transformation
  //  readability
  //
  // color-scheme:
  //  create colorschemes
  //  triad, tetrad, mono, contrast, analogic
  //  pastel, soft, light, hard, pale
  //
  // distinct-colors:
  //  coloschemes customizáveis, não entendi ainda
}

e.mongoUtil = () => {
  const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    // transparent: true
    backgroundColor: 0x000000
  })
  app.stage.sortableChildren = true
  document.body.appendChild(app.view)
  window.wand.app = app
  if (u('n')) {
    return transfer.fAll.aeterni({ 'network.nodes.attributes.name': u('n') }).then(r => console.log(r))
  } else if (u('u')) {
    return transfer.fAll.aeterni({ 'network.nodes.key': u('u') }, { comName: 1 }).then(r => console.log(r))
  } else if (u('d')) {
    // return transfer.fAll.dmark({ 'userData.id': 'charlesa.anderson.338' }).then(r => {
    console.log('yeah, in "d"')
    // return transfer.fAll.dttm({ marker: { $exists: true } }).then(r => {
    transfer.fAll.df4b({ syncId: u('dd') }).then(r => {
      window.rr = r
      $('#loading').hide()
    })
  } else if (u('s')) {
    transfer.fAll.f4b({ syncId: { $exists: true } }, { syncId: 1 }).then(r => {
      window.rr = r
      $('#loading').hide()
    })
  } else {
    transfer.findAll({ meditation: { $exists: true } }).then(r => { // 177
      window.rr = r
      $('#loading').hide()
    })
  }
  // transfer.fAll.mark({ 'userData.id': 'charlesa.anderson.338', 'net.edges.10': { $exists: false } }).then(r => {
  // transfer.fAll.mark({ 'userData.id': 'charlesa.anderson.338' }).then(r => { // 1008, 3362
  // transfer.fAll.mark({ 'userData.id': 'renato.fabbri' }).then(r => { // 1008, 3362
  // transfer.findAll({ 'header.med2': { $exists: true } }).then(r => { // 742 itens at 03/Jun/2021
}

e.mongoTranslator = () => { // utility to get data somewhere and translate it
  const o = u('o')
  const res = window.res = []
  function ss (query, projection) {
    return (db, col) => transfer.fAll[db](query, projection || { sid: 1, nid: 1, date: 1 }, col).then(r => {
      console.log(`db: ${db}, col: ${col}, data:`, r)
      res.push(r)
    })
  }
  if (o === 'ls') {
    const query = { sid: { $exists: true } }
    const s = ss(query)
    s('mark')
    s('tokisona')
    s('tokisona', 'aatest')
    s('ttm')
    s('ttm', 'test')
    s('ttm', 'test2')
    s('ttm', 'nets')
    // transfer.fAll.mark(query, { sid: 1, nid: 1, date: 1 }).then(r => {
    //   window.mark = r
    //   transfer.fAll.ttm(query, { sid: 1, nid: 1, date: 1 }).then(r => {
    //     window.ttm = r
    //     transfer.fAll.tokisona(query, { sid: 1, nid: 1, date: 1 }).then(r => {
    //       window.tokisona = r
    //       $('#loading').hide()
    //     })
    //   })
    // })
    // ttm -, ttm test, mark -
  } else if (u('i')) {
    const query = { sid: u('i') }
    const s = ss(query, {})
    s('mark')
    s('tokisona')
    s('tokisona', 'aatest')
    s('ttm')
    s('ttm', 'test')
    s('ttm', 'test2')
    s('ttm', 'nets')
  } else if (u('ii')) { // 3659
    const query = { sid: u('ii') }
    const s = ss(query, {})
    s('mark')
    const s2 = ss({ 'userData.id': 'renato.fabbri' }, {})
    s2('mark')
  } else if (u('iii')) {
    const sid = u('iii')
    transfer.fAll.mark({ sid }).then(old => {
      const oldNet = JSON.parse(old[0].text)
      const userData = {}
      userData.id = old[0].id
      userData.sid = old[0].sid
      userData.nid = old[0].nid
      userData.name = oldNet.attributes.userData.name
      // add to oldNet: anonString, preclude []
      oldNet.attributes = {
        preclude: [],
        anonString: 'unnactive-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + '-'
      }
      const date = new Date(old[0].date)
      const toBeWritten = {
        userData,
        date,
        origDate: date,
        net: oldNet
      }
      console.log('toBeWritten:', toBeWritten)
      console.log('old:', old)
      transfer.fAll.wmark(toBeWritten).then(wr => console.log('write resp:', wr))
      // transfer.fAll.mark({ 'userData.id': sid }).then(now => {
      //   console.log('new:', now)
      // })
    })
  } else if (u('u')) {
    const sid = u('u')
    transfer.fAll.omark({ 'userData.id': sid, origDate: { $exists: true } }).then(item => {
      console.log('titem', item)
      window.yo = item
    })
  } else if (u('ud')) {
    const sid = u('ud')
    transfer.fAll.dmark({ 'userData.id': sid }).then(item => {
      console.log('titem', item)
      window.yo = item
    })
  }
}

e.testLoc = () => {
  // const geoip = require('geoip-country')
  // $.getJSON('https://api.ipify.org?format=json', function (data) {
  //   console.log(data.ip)
  //   console.log(data)
  //   // const geo = geoip.lookup(data.ip)
  //   // console.log(geo)
  //   $.get(`https://ipinfo.io/${data.ip}/?token=a1cf42d7d11976`, function (response) {
  //     console.log(response.city, response.country, response)
  //   }, 'jsonp')
  // })
  // window.fetch('https://ipinfo.io/json?token=a1cf42d7d11976', { mode: 'no-cors' }).then(
  //   response => {
  //     console.log(response)
  //     console.log(response.json())
  //   }
  // )
  //   (response) => { return response.json() }
  // ).then(
  //   (jsonResponse) => console.log(jsonResponse.ip, jsonResponse.country)
  // )

  $.get('https://ipinfo.io/?token=a1cf42d7d11976', function (response) {
  // $.get('https://ipinfo.io/', function (response) {
    console.log(response.city, response.country, response, 'BBBB')
  }, 'jsonp')
  console.log('yey man')
}

e.freeD = () => {
  const app = new PIXI.Application({ // todo: make it resizable
    width: window.innerWidth,
    height: window.innerHeight * 0.80
  })
  $('body').append(app.view)
  const [w, h] = [app.view.width, app.view.height]
  const c = [w / 2, h / 2] // center
  let a = w * 0.4
  let a_ = h * 0.4
  a /= 15
  a_ /= 15

  // const kx = u('kx')
  // const ky = u('ky')
  function xy (angle) { // lemniscate x, y given angle
    // const x = a * Math.cos(kx * angle)
    // const y = a_ * Math.sin(ky * angle)
    // const foo = Math.cos(angle)
    // const x = a * Math.cos(kx * angle * foo) * foo ** 3
    // const y = a_ * Math.sin(ky * angle * foo) * foo ** 2
    const foo = 2 * angle + 1 / angle
    const x = a * (foo + 2 * Math.cos(14 * angle))
    const y = a_ * (foo + 2 * Math.sin(15 * angle))
    // return [c[0] + x, c[1] + y]
    return [c[0] / 6 + x, c[1] / 6 + y]
  }
  const myLine = new PIXI.Graphics()
  myLine.lineStyle(1, 0xffffff)
    .moveTo(...xy(1))
  const segments = 1000
  const fact = parseFloat(u('f')) || 1
  for (let i = 0; i <= segments * fact; i++) {
    myLine.lineStyle(1, 0x00ffff + 0xff0000 * i / segments)
    // myLine.lineTo(...xy(2 * Math.PI * i / segments))
    const res = xy(1 + 13 * i / segments)
    console.log(res)
    myLine.lineTo(...res)
  }
  app.stage.addChild(myLine)
  if (u('v')) {
    myLine.pivot.x = c[0]
    myLine.pivot.y = c[1]
    myLine.position.set(...c)
    myLine.rotation = Math.PI
  }
  window.lll = myLine
  window.ccc = c
  window.eq = xy
  $('#loading').hide()
}

e.vmapT = () => {
  const tzoffset = (new Date()).getTimezoneOffset() * 60000 // offset in milliseconds
  let header = ['country', 'city', 'region', 'timezone', 'postal', 'loc', 'ip', 'hostname', 'org', 'date', 'dateLeft', 'started', 'finishedSession', 'feedback']
  if (!u('full')) header = ['country', 'city', 'region', 'timezone', 'postal', 'ip', 'org', 'date', 'dateLeft', 'started', 'finishedSession', 'feedback']
  const grid = utils.mkGrid(header.length + 1, 'body', '100%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee'])[0])
  function addItems (ar, isHeader) {
    if (isHeader) {
      ar.forEach(i => $('<span/>').html(`<b>${i}</b>`).appendTo(grid))
      $('<span/>').html('<b>page</b>').appendTo(grid)
    } else {
      header.forEach(i => {
        let val = `${ar[i]}`
        if (i.includes('date')) {
          if (!ar[i]) val = ''
          else val = (new Date(ar[i] - tzoffset)).toISOString().replace(/T/, ' ').replace(/:\d\d\..+/, '')
        }
        $('<span/>').html(val).appendTo(grid)
      })
      $('<span/>').html(ar.uargs.keys[0]).appendTo(grid)
    }
  }
  addItems(header, true)
  const query = {}
  if (!u('all')) {
    const d = new Date()
    if (u('today')) {
      d.setHours(0, 0, 0, 0)
    } else if (u('h')) {
      d.setHours(d.getHours() - u('h'))
    } else { // 24h
      d.setHours(d.getHours() - 24)
    }
    query.date = { $gte: d }
  }
  if (u('finished')) {
    query.finishedSession = { $exists: true }
  } else if (u('started')) {
    query.started = { $exists: true }
  } else if (u('ev')) {
    query.$or = [
      { started: { $exists: true } },
      { finishedSession: { $exists: true } }
    ]
  }
  transfer.fAll.costa(query).then(r => {
    r.sort((a, b) => b.date - a.date)
    window.visits = r
    r.forEach(rr => addItems(rr))
  })
  $('#loading').hide()
}

e.tithorea = () => {
  window.wand.tithorea = new c.Tithorea()
}

e.bezier = () => {
  const app = window.wand.app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight * 0.9,
    // transparent: true
    backgroundColor: 0x000000
  })
  app.stage.sortableChildren = true
  document.body.appendChild(app.view)

  const bezier = new PIXI.Graphics()
  bezier.lineStyle(4, 0xAA0000, 1)
  bezier.position.x = u('x1') || 167
  bezier.position.y = u('y1') || 409
  const dest = {
    x: u('x2') || 819,
    y: u('y2') || 321
  }
  const localDest = {
    x: dest.x - bezier.position.x,
    y: dest.y - bezier.position.y
  }
  const cp1 = {
    x: localDest.x * (u('dx1') || 0.25),
    y: u('dy1') || -400
  }
  const cp2 = {
    x: localDest.x * (u('dx2') || 0.75),
    y: u('dy2') || -400
  }
  bezier.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, localDest.x, localDest.y)
  app.stage.addChild(bezier)
  $('#loading').hide()
}

e.song0 = () => {
  const Tone = t
  utils.mkBtn('play', 'play mysic', async () => {
    if (Tone.Transport.state !== 'stopped') {
      await Tone.Transport.stop()
    } else {
      await Tone.start()
      await Tone.Transport.start('+1')
    }
  })
  function mkSong () {
    Tone.Transport.bpm.value = 140
    const msy = new Tone.MembraneSynth().toDestination()
    const nsy = new Tone.NoiseSynth().toDestination()
    const isy = new Tone.MetalSynth().toDestination()
    const isy2 = new Tone.MetalSynth().toDestination()
    isy.volume.value = -3
    isy2.volume.value = -16
    const part = new Tone.Part((time, note) => {
      msy.triggerAttackRelease(note, '8n', time)
    }, [[0, 'C1'], ['0:1:2', 'C1'], ['0:3', 'G1']]).start('+2')
    part.loop = true
    const pat = new Tone.Pattern((time, note) => {
      nsy.triggerAttackRelease('2n', time)
    }, ['C4', 'G4', 'B4', 'C4']).start('+2')
    pat.interval = '8n'
    const seq = new Tone.Sequence((time, note) => {
      if (Math.random() > 0.6) isy.triggerAttackRelease(note, '8n', time)
    }, [[null, 'C6'], ['C4', null], ['C3', 'C5'], [null, 'G5']], '4n').start('+2')
    const seq2 = new Tone.Sequence((time, note) => {
      isy2.triggerAttackRelease(note, '8n', time)
    }, ['C8', 'G8'], '4n').start('+2')
    window.all = {
      nsy, msy, pat, seq, isy, seq2
    }
    $('#loading').hide()
  }
  mkSong()
  // mk very nice song for the first time
}

e.artifacts = () => {
  // const spheres = {
  //   culta: 'Λατρεία',
  //   mistica: 'ಅತೀಂದ್ರಿಯ',
  //   erudita: 'ልዕለ እውቀት ያለው',
  //   harmona: 'ਖੇਤਰ ਦਾ ਸੰਗੀਤ',
  //   frequentia: 'સામાજિક તાકાત'
  // }
  const d = (i, n) => `<a href="?.${i[1]}-${i[n][0]}" target="_blank">${i[n][0]}</a> (<a href="https://www.facebook.com/photo?fbid=${i[n][1]}&set=a.10159444830109430" target="_blank">fleet</a>)`
  const dd = artifact => artifact.slice(2).map((a, i) => d(artifact, i + 2)).join(', ')
  const arts = [
    [
      ['Silence', '938265920357554'],
      'silencio',
      ['culta', '10159473462314430'],
      ['mistica', '10159473520194430']
    ],
    [
      ['Protection', '939221233595356'],
      'protecao',
      ['erudita', '10159475692744430'],
      ['harmona', '10159475914119430']
    ],
    [
      ['Consecration', '940268410157305'],
      'consagracao',
      ['frequentia', '10159478521694430'],
      ['culta', '10159479979579430']
    ],
    [
      ['Creation', '942039879980158'],
      'criacao',
      ['mistica', '10159483725609430'],
      ['erudita', '10159484269404430']
    ],
    [
      ['Attention', '948411796009633'],
      'atencao',
      ['culta', '10159520208934430'],
      ['mistica', '10159520694384430']
    ],
    [
      ['Transformation', '953189902198489'],
      'transformation',
      ['erudita', '10159521932799430'],
      ['harmona', '10159522575754430']
    ],
    [
      ['Paradise', '953823068801839'],
      'paradise',
      ['frequentia', '10159523575164430'],
      ['culta', '10159524089689430']
    ],
    [
      ['Firmness', '954432815407531'],
      'firmeza',
      ['mistica', '10159525347389430'],
      ['erudita', '10159526308809430']
    ],
    [
      ['Angels', '956411178543028'],
      'Anjos',
      ['harmona', '10159531289729430'],
      ['frequentia', '10159531893554430']
    ],
    [
      ['Faith', '957100145140798'],
      'fe',
      ['culta', '10159533578014430'],
      ['mistica', '10159533796419430']
    ],
    [
      ['Archangel Michael', '957808085070004'],
      'Michael',
      ['erudita', '10159535471769430'],
      ['harmona', '10159535862464430']
    ],
    [
      ['Archangel Gabriel', '958467288337417'],
      'Gabriel',
      ['frequentia', '10159537688174430'],
      ['culta', '10159538046049430']
    ],
    [
      ['Archangel Raphael', '771184126906833'],
      'Rafael',
      ['mistica', '10159539385594430'],
      ['erudita', '10159539791584430']
    ],
    [
      ['Sensibility', '959766838207462'],
      'sensibility',
      ['harmona', '10159541566339430'],
      ['frequentia', '10159542148804430']
    ],
    [
      ['Archangel Uriel', '966004090917070'],
      'Uriel',
      ['culta', '10159562603244430'],
      ['mistica', '10159563075444430']
    ],
    [
      ['Understanding', '966601247524021'],
      'understanding',
      ['culta', '10159565034239430'],
      ['mistica', '10159565356214430']
    ],
    [
      ['Excellence', '970982650419214'],
      'excellence',
      ['frequentia', '10159579400094430'],
      ['culta', '10159579908424430']
    ],
    [
      ['Courage', '970982650419214'],
      'courage',
      ['mistica', '10159581438824430'],
      ['erudita', '10159582550664430'],
      ['harmona', '10159591514599430'],
      ['frequentia', '10159592284314430']
    ]
  ].reduce((a, i) => a + `<li>Matrix: <a href="?.${i[1]}" target="_blank">${i[0][0]}</a> (<a href="https://www.facebook.com/groups/arcturianart/permalink/${i[0][1]}" target="_blank">publication</a>), and derivatives ${dd(i)}.</li>`, '')
  utils.stdDiv().html(`
  <h1>Audiovisual Artifacts</h1>
  <p>Audiovisual Medicine utilizes cutting-edge technology and scientific principles to promote rejuvenation and longevity. Although some aspects of it may sound mystical, its practices are grounded in scientific research, aiming to spread well-being, cure humanity, and prepare individuals for physical immortality.</p>
  <p>These sessions harness the power of <a href="https://en.wikipedia.org/wiki/Brainwave_entrainment" target="_blank">Brainwave Entrainment</a> and <a href="https://en.wikipedia.org/wiki/Biofeedback" target="_blank">Biofeedback</a> to harmonize the body and nervous system. Concentration and the use of headphones are recommended for optimal results.</p>
  <p>Sessions start every day at: 0h, 1h11, 2h22, 3h33, 4h44, 5h55, 6h30, 7h07, 8h08, 9h09, 10h10, 11h11, 12h12, 13h13, 14h14, 15h15, 16h16, 17h17, 18h18, 19h19, 20h20, 21h21, 22h22, 23h23, and take 15 minutes to finish.</p>
  <p>You might want to check the <a href="https://youtu.be/1ocFeA7iR5M" target="_blank">2 minutes of instructions on how to participate</a>. Current publicly available artifacts are here (click to open):
  <ol>${arts}</ol>
  </p>
  <p>For more advanced considerations on the usage of the Audiovisual Artifacts, mainly on the parametrization of the durations, check <a href="https://youtu.be/e45N612A2o8" target="_blank">this video</a>.</p>
  <br>
  :::
  `)
  $('#loading').hide()
}

e.jira = () => {
  const JiraApi = require('jira-client')
  const jira = new JiraApi({
    protocol: 'https',
    host: 'junto.atlassian.net',
    username: 'renato@junto.space',
    password: 'KeXLbj8g5PqBdhyf1hZq4C38',
    apiVersion: '2'
  })
  jira.findIssue('JODJ-110')
    .then(issue => {
      console.log(`Status: ${issue.fields.status.name}`)
    })
    .catch(err => {
      console.error(err)
    })
}

e.indexes = () => {
  const items = [
    `${elink('Infra', '?infra')}`,
    `${elink('Testimonials', '?testimonials')}`,
    `${elink('Publications', '?publications')}`
  ].reduce((a, i) => a + `<li>${i}</li>`, '')
  utils.stdDiv().html(`
  <h1>Internal static pages</h1>
  the following listing includes all static pages (not artifacts, networks, and diffusions, for example):

  <ul>${items}</ul>

  <p>
    <b>Beware</b>: there are pages in these listings which are not curated, and other that were created only to develop a certain feature, thus some of them may be (or seem) useless.
  </p>

  :::
  `)
  $('#loading').hide()
}

e.step1 = () => {
  const items = [
    `Slow and regular ${elink('diaphragmatic breathing', 'https://www.health.harvard.edu/healthbeat/learning-diaphragmatic-breathing')} (using the belly, without moving the chest).`,
    `Free posture, relaxed, give ${elink('preference to a straigh/upright spine', 'https://davidvago.bwh.harvard.edu/wp-content/uploads/2015/04/POSTURE-for-MEDITATION-2014%C2%A9.pdf')}, whether you are sitting, standing, or lying down.`,
    'How to activate the artifact, why to use it and what to expect from the sessions.'
  ].reduce((a, i) => a + `<li>${i}</li>`, '')
  utils.stdDiv().html(`
  <h1>Step 1</h1>
  This is a private resource, please keep it to you and come again to see if it has been updated. You should know:

  <ul>${items}</ul>

  :::
  `)
  $('#loading').hide()
}

e.step2 = () => {
  const items = [
    `Quiet/${elink('silence the mind', 'https://hbr.org/2021/07/dont-underestimate-the-power-of-silence')}.`,
    `If not silencing the mind, try and ${elink('focus solely on breathing and on the meditation topic', 'https://www.health.harvard.edu/mind-and-mood/breath-meditation-a-great-way-to-relieve-stress')}.`,
    'During the days (and the meditation sessions), the less thinking is running loose, the more energy (and resources, vitamins) is left fot the body to act, heal, and rejuvenate.',
    'The less our thoughts are out of whack, the more social and personal (spiritual?) permissions and responsibilities are granted to us.'
  ].reduce((a, i) => a + `<li>${i}</li>`, '')
  utils.stdDiv().html(`
  <h1>Step 2</h1>
  This is a private resource, please keep it to you and come again to see if it has been updated. You should know:

  <ul>${items}</ul>

  :::
  `)
  $('#loading').hide()
}

e.step3 = () => {
  const items = [
    'Cure and manifest enhancements to our selves, our families, and eveyone.',
    'Harmonize breathing and nervous system.',
    'Take part in the community.',
    'Charity.',
    'The sessions are preferably done in bundles of at least 3 sessions. From now on the member should think on the goals of her/his next 3 sessions.'
  ].reduce((a, i) => a + `<li>${i}</li>`, '')
  utils.stdDiv().html(`
  <h1>Step 3</h1>
  This is a private resource, please keep it to you and come again to see if it has been updated. You should know:

  <ul>${items}</ul>

  :::
  `)
  $('#loading').hide()
}

e['m001-elisa'] = () => {
  const mkListing = list => list.reduce((a, i) => a + `<li>${i}</li>`, '')
  const items = [
    `${elink('Step 1', '?step1')} on 17th July 2023. Artifact: ${elink('peace', '?.paz')} (delta + medium alpha; slow symmetry in 7).`,
    `${elink('Step 2', '?step2')} on 18th July 2023. Artifact: ${elink('relaxing', '?.relaxamento')} (delta + low alpha; slow symmetry in 5).`,
    `${elink('Step 3', '?step3')} on 20th July 2023. Artifact: ${elink('cure', '?.cura_')} (delta + gamma; symmetry in 3 and 5).`
  ]

  const theme = 'love'
  const items2 = [
    `24th July 2023. Artifact: ${elink('love', '?.amor')}.`,
    `26th July 2023. Artifact: ${elink('union', '?.union')}.`,
    `28th July 2023. Artifact: ${elink('providence', '?.providence')}.`
  ]
  utils.stdDiv().html(`
  <h1>Elisa</h1>
  Completed the three instruction sessions:
  <ul>${mkListing(items)}</ul>

  The three sessions dedicated to the chosen theme (${theme}):
  <ul>${mkListing(items2)}</ul>

  <p>
    <b>Tone</b>: Healer, Pathfinder. Medium/Sensitive, Mediator.
  </p>

  <p>
    <b>Notes</b>: she reopened the works in 2023.
  </p>

  :::
  `)
  $('#loading').hide()
}

function mkMembers () {
  const people = [
    {
      name: 'elisa',
      tone: 'Healer, Pathfinder. Medium/Sensitive, Mediator.',
      notes: 'she reopened the works in 2023.',
      step1: {
        when: '17th July 2023',
        name: 'peace',
        session: 'paz',
        exp: 'delta + medium alpha; slow symmetry in 7'
      },
      step2: {
        when: '18th July 2023',
        name: 'relaxing',
        session: 'relaxamento',
        exp: 'delta + low alpha; slow symmetry in 5'
      },
      step3: {
        when: '20th July 2023',
        name: 'cure',
        session: 'cura_',
        exp: 'delta + gamma; symmetry in 3 and 5'
      },
      next3: {
        sessions: [{
          when: '24th July 2023',
          name: 'love',
          session: 'amor_',
          exp: 'medium alpha + low delta; symmetry in 4 and 5'
        }, {
          when: '26th July 2023',
          name: 'union',
          exp: 'med-high alpha + theta++; slow symettry in 12'
        }, {
          when: '28th July 2023',
          name: 'providence',
          exp: 'medium alpha + high delta; fast symmetry in 30'
        }],
        theme: 'love'
      }
    }
  ]
  people.forEach(p => mkMember(p))
}
mkMembers()

function mkMember (p) {
  const items = []
  for (let i = 1; i <= 3; i++) {
    const s_ = 'step' + i
    const s = p[s_]
    console.log({ p, s, s_, w: s.when })
    items.push(
      `${elink('Step ' + i, '?' + s_)} on ${s.when}. Artifact: ${elink_(s.name, s.session || s.name)} (${s.exp}).`
    )
  }
  const items2 = []
  for (let i = 0; i <= 2; i++) {
    const s = p.next3.sessions[i]
    items2.push(
      `${s.when}. Artifact: ${elink_(s.name, s.session || s.name)} (${s.exp}).`
    )
  }
  const mkListing = list => list.reduce((a, i) => a + `<li>${i}</li>`, '')
  e[`m003-${p.name}`] = () => {
    utils.stdDiv().html(`
      <h1>${utils.formatTheme(p.name)}</h1>
      Completed the three instruction sessions:
      <ul>${mkListing(items)}</ul>

      The three sessions dedicated to the chosen theme (${p.next3.theme}):
      <ul>${mkListing(items2)}</ul>

      <p>
        <b>Tone</b>: Healer, Pathfinder. Medium/Sensitive, Mediator.
      </p>

      <p>
        <b>Notes</b>: she reopened the works in 2023.
      </p>

      :::
    `)
    $('#loading').hide()
  }
}

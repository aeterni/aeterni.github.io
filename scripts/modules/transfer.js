// Data access.
//
// This used to talk to MongoDB Stitch directly from the browser. Stitch (later
// Atlas App Services) reached end of life and its endpoints now answer 410, so
// requests go through our own small serverless function instead — see
// netlify/functions/data.mjs. The promise-returning shape of the calls below is
// unchanged, so callers (the artifact player included) did not have to change.
const e = module.exports

// Override in the page with window.AETERNI_API to point somewhere else (a
// staging deploy, say). Served from localhost, it expects the data function to
// be running locally on port 8788.
e.apiUrl = () => {
  if (typeof window === 'undefined') return 'https://aeterni-data.netlify.app/api/data'
  if (window.AETERNI_API) return window.AETERNI_API
  if (['localhost', '127.0.0.1'].includes(window.location.hostname)) return 'http://localhost:8788/api/data'
  return 'https://aeterni-data.netlify.app/api/data'
}

// JSON carries no dates, and the artifact player needs real Date objects (it
// calls header.datetime.getTime()). Dates travel as {$date: <iso>} in both
// directions; the function rebuilds them on its side.
const pack = (value, depth = 0) => {
  if (depth > 12) return value
  if (value instanceof Date) return { $date: value.toISOString() }
  if (Array.isArray(value)) return value.map(v => pack(v, depth + 1))
  if (value && typeof value === 'object') {
    const out = {}
    for (const k in value) out[k] = pack(value[k], depth + 1)
    return out
  }
  return value
}

const unpack = (value, depth = 0) => {
  if (depth > 12) return value
  if (Array.isArray(value)) return value.map(v => unpack(v, depth + 1))
  if (value && typeof value === 'object') {
    if (typeof value.$date === 'string' && Object.keys(value).length === 1) return new Date(value.$date)
    const out = {}
    for (const k in value) out[k] = unpack(value[k], depth + 1)
    return out
  }
  return value
}

const call = body =>
  window.fetch(e.apiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pack(body))
  }).then(async res => {
    const payload = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(payload.error || `data request failed (${res.status})`)
    return unpack(payload.result)
  })

e.call = call

const creds = {}
const regName = (name, app, url, db, coll) => {
  creds[name] = {
    cluster: 'mongodb-atlas', // always
    app,
    url,
    db: db || 'anydb',
    collections: { test: coll || 'anycollection' }
  }
}

regName('ttm', 'freene-gui-fzgxa', 'https://ttm.github.io/oa/', 'freenet-all', 'test3') // renato.fabbri@, also cols: test, test2, nets
// regName('ttm', 'freene-gui-fzgxa', 'https://ttm.github.io/oa/', 'freenet-all', 'nets') // dummy
regName('tokisona', 'aplicationcreated-mkwpm', 'https://tokisona.github.io/oa/', 'adbcreated', 'acolectioncreated') // sync.aquarium@ and aeterni, also col aatest
regName('f4b', 'application-0-bcham', '', 'fdb', 'fcol') // f466r1@
regName('costa', 'application-0-izpfj', '', 'adbb', 'acoll') // rcostafabbri@
regName('aeterni', 'application-0-knxbk', '', 'adb', 'acol') // aeterni.anima@
regName('mark', 'anyapplication-faajz', 'https://markturian.github.io/ouraquarium/', 'anydb', 'anycollection') // markarcturian@
// regName('sync', 'anyapplication-faajz', 'https://worldhealing.github.io/ouraquarium/', 'anydb', 'anycollection') // markarcturian@

const auth = creds.tokisona
// const auth = creds.mark
// const auth = creds.ttm
// const auth = creds.sync

// auth.url = 'http://localhost:8080/'

const collectionOf = (aa, col) => (aa ? 'aatest' : (col || auth.collections.test))

e.writeAny = (data, aa) => call({ op: 'insertOne', collection: collectionOf(aa), doc: data })

e.findAny = (data, aa) => call({ op: 'findOne', collection: collectionOf(aa), query: data })

e.findAll = (query, aa, projection, col) =>
  call({ op: 'find', collection: collectionOf(aa, col), query, projection })

e.remove = (query, aa) => call({ op: 'deleteMany', collection: collectionOf(aa), query })

// sparql:
const losdheaders = require('./losdheaders.js')
const superagent = require('superagent')

e.getNetMembersLinks = (netid, call = console.log) => {
  const qmembers = `SELECT DISTINCT ?p ?n WHERE {
    ?s po:snapshotID '${netid}' .
    ?p a po:Participant .
    ?p po:snapshot ?s .
    ?p po:observation ?o .
    ?o po:name ?n .
  }`
  const qfriendships = `SELECT DISTINCT ?p1 ?p2 WHERE {
    ?f a po:Friendship .
    ?f po:snapshot ?s .
    ?s po:snapshotID '${netid}' .
    ?f po:member ?p1, ?p2 .
    FILTER(?p1 != ?p2)
  }`
  e.losdCall(qmembers, (members) => {
    e.losdCall(qfriendships, (friendships) => {
      call({ members, friendships })
    })
  })
}

const dummyQueries = {
  0: [
    'SELECT ?s ?n WHERE {',
    '?s a po:Snapshot .',
    '?s po:name ?n .',
    '}'
  ].join(' '),
  1: `PREFIX : <https://rfabbri.linked.data.world/d/linked-open-social-data/>
      PREFIX po: <http://purl.org/socialparticipation/po/>
      SELECT (COUNT(DISTINCT ?author) as ?c) WHERE {
        ?author a po:Participant . 
    }`
}

e.losdCall = (query, callback) => {
  if (typeof query === 'object') {
    query = query.join(' ')
  }
  if (Object.keys(dummyQueries).includes(String(query))) {
    query = dummyQueries[query]
  }
  const query_ = [
    'PREFIX : <https://rfabbri.linked.data.world/d/linked-open-social-data/>',
    'PREFIX po: <http://purl.org/socialparticipation/po/>',
    query
  ]
  sparqlCall(
    'https://api.data.world/v0/sparql/rfabbri/linked-open-social-data',
    query_.join(' '),
    callback,
    losdheaders.losdheaders
  )
}

const sparqlCall = (url, query, callback, headers) => {
  if (typeof query !== 'string') {
    query = query.join(' ')
  }
  superagent
    .get(url)
    .query({ query, format: 'json' })
    .set(headers)
    .then(result => {
      const mres__ = JSON.parse(result.text)
      const sparqlres = mres__.results.bindings
      callback(sparqlres)
    })
}

// ////////////// generic:
// Each name below lived in its own Atlas cluster, reached through its own Stitch
// app. Only 'tokisona' — the artifacts — is served by our data function today;
// the rest stay dormant rather than throwing, so the features that touch them
// (social network views, visit logging) simply find nothing. To bring one back,
// give the function its connection string and route the name here.
const dormant = new Set(Object.keys(creds).filter(au => au !== 'tokisona'))

class FindAll {
  constructor () {
    this.dbs = {}
    this.clients = {}
    this.auths = {}
    this.tests = {}
    for (const au of dormant) this.mkOne(au)
    this.tokisona = (query, projection, col) => e.findAll(query, false, projection, col)
  }

  mkOne (au) {
    const warn = op => {
      console.warn(`transfer: ${op} on "${au}" is dormant — that database is not served by the data function`)
    }
    this.tests[au] = () => { warn('test'); return Promise.resolve(null) }
    this[au] = () => { warn('find'); return Promise.resolve([]) }
    this['o' + au] = () => { warn('findOne'); return Promise.resolve(null) }
    this['w' + au] = () => { warn('insert'); return Promise.resolve(null) }
    this['d' + au] = () => { warn('delete'); return Promise.resolve({ deletedCount: 0 }) }
    this['u' + au] = () => { warn('update'); return Promise.resolve({ modifiedCount: 0 }) }
    this.auths[au] = creds[au]
  }
}

e.fAll = new FindAll()
// fAll.ttm({ sid: { $exists: true } }, { sid: 1 }, 'test').then(r => console.log(r.map(i => i.sid)))

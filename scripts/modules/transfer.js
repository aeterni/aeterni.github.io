// Data access.
//
// This used to talk to five MongoDB Atlas databases directly from the browser,
// through MongoDB Stitch. Stitch reached end of life and the clusters are gone,
// so requests go to our own small serverless function, which holds their data
// restored from the last backups — see netlify/functions/data.mjs and DATA.md.
// The promise-returning shape of the calls below is unchanged, so callers (the
// artifact player included) did not have to change.
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
    if (typeof value.$numberDouble === 'string' && Object.keys(value).length === 1) return Number(value.$numberDouble)
    const out = {}
    for (const k in value) out[k] = unpack(value[k], depth + 1)
    return out
  }
  return value
}

// Deleting, and writing to the network archives, takes the admin key. It is
// asked for the first time it is needed and remembered in this browser.
const KEY_ITEM = 'aeterniAdminKey'
let sessionKey = null
const adminKey = () => {
  try { return window.localStorage.getItem(KEY_ITEM) || sessionKey } catch { return sessionKey }
}
const rememberKey = key => {
  sessionKey = key
  try {
    if (key) window.localStorage.setItem(KEY_ITEM, key)
    else window.localStorage.removeItem(KEY_ITEM)
  } catch {
    // storage blocked (private mode): the key lasts for this visit only
  }
}

const call = (body, retried) => {
  const headers = { 'Content-Type': 'application/json' }
  if (!['find', 'findOne'].includes(body.op) && adminKey()) headers['X-Admin-Key'] = adminKey()
  return window.fetch(e.apiUrl(), {
    method: 'POST',
    headers,
    body: JSON.stringify(pack(body))
  }).then(async res => {
    const payload = await res.json().catch(() => ({}))
    if (res.status === 401) {
      rememberKey(null)
      const given = !retried && window.prompt('This change needs the Æterni admin key:')
      if (given) {
        rememberKey(given.trim())
        return call(body, true)
      }
    }
    if (!res.ok) throw new Error(payload.error || `data request failed (${res.status})`)
    return unpack(payload.result)
  })
}

e.call = call

// The session artifacts (and, with `aa`, the AA shouts):
const collectionOf = (aa, col) => (aa ? 'aatest' : (col || 'acolectioncreated'))
const artifacts = (op, aa, col, rest) => call({ source: 'artifacts', op, collection: collectionOf(aa, col), ...rest })

e.writeAny = (data, aa) => artifacts('insertOne', aa, null, { doc: data })

e.findAny = (data, aa) => artifacts('findOne', aa, null, { query: data })

e.findAll = (query, aa, projection, col) => artifacts('find', aa, col, { query, projection })

e.remove = (query, aa) => artifacts('deleteMany', aa, null, { query })

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
// The names the pages use for the old databases (each was its own Atlas cluster
// and Stitch app), and where each now lives in the data function. Collections
// kept their names; `collection` is the default each name had.
const routes = {
  tokisona: { source: 'artifacts', collection: 'acolectioncreated' }, // sessions (sync.aquarium@)
  mark: { source: 'aquarium', collection: 'anycollection' }, // Our Aquarium networks (markarcturian@)
  aeterni: { source: 'communities', collection: 'acol' }, // communities recorded in ?you (aeterni.anima@)
  ttm: { source: 'freenet', collection: 'test3' }, // earlier and WhatsApp networks (renato.fabbri@)
  f4b: { source: 'syncs', collection: 'fcol' } // synchronized sessions made in ?tithorea (f466r1@)
}
// Visit logging kept visitors' IP details and is not restored: it resolves empty.
const dormant = ['costa']

class FindAll {
  constructor () {
    for (const [au, { source, collection }] of Object.entries(routes)) {
      const at = col => ({ source, collection: col || collection })
      this[au] = (query, projection, col) => call({ ...at(col), op: 'find', query, projection })
      this['o' + au] = (query, projection, col) => call({ ...at(col), op: 'findOne', query, projection })
      this['w' + au] = (doc, col) => call({ ...at(col), op: 'insertOne', doc })
      this['d' + au] = (query, col) => call({ ...at(col), op: 'deleteMany', query })
      this['u' + au] = () => {
        console.warn(`transfer: updates on "${au}" are not supported by the data function`)
        return Promise.resolve({ modifiedCount: 0 })
      }
    }
    for (const au of dormant) this.mkDormant(au)
  }

  mkDormant (au) {
    const warn = op => console.warn(`transfer: ${op} on "${au}" is dormant — that database is not restored`)
    this[au] = () => { warn('find'); return Promise.resolve([]) }
    this['o' + au] = () => { warn('findOne'); return Promise.resolve(null) }
    this['w' + au] = () => { warn('insert'); return Promise.resolve(null) }
    this['d' + au] = () => { warn('delete'); return Promise.resolve({ deletedCount: 0 }) }
    this['u' + au] = () => { warn('update'); return Promise.resolve({ modifiedCount: 0 }) }
  }
}

e.fAll = new FindAll()
// fAll.ttm({ sid: { $exists: true } }, { sid: 1 }, 'test').then(r => console.log(r.map(i => i.sid)))

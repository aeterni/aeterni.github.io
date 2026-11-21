// Data access.
//
// This used to talk to five MongoDB Atlas databases directly from the browser,
// through MongoDB Stitch. Stitch reached end of life and the clusters are gone,
// so requests go to our own small serverless function, which holds their data
// restored from the last backups — see netlify/functions/data.mjs and DATA.md.
// The promise-returning shape of the calls below is unchanged, so callers (the
// artifact player included) did not have to change.
const e = module.exports

// The requests themselves (the address, dates on the wire, the admin key) are in
// data.js, which the small bundle's AA page uses too.
const api = require('./data.js')
const call = api.call

e.apiUrl = api.apiUrl
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

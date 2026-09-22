// Document storage behind the data function.
//
// The five Atlas clusters the site used are gone, so their data (restored from
// the last backups) lives here instead: one blob per document, plus one index
// blob per collection that holds every document with its bulky fields trimmed
// away. Queries are MongoDB queries, evaluated by sift against the index; only
// the documents a query returns are read in full. Asking for one Aquarium
// network therefore reads that network, not all 46 MB of them.
//
// Two backends share this interface:
//   blobsBackend()   Netlify Blobs, in production
//   fsBackend(dir)   a plain directory, for local development
import { promises as fs } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import sift from 'sift'

// ---------------------------------------------------------------- backends

export const blobsBackend = async (name = 'aeterni-data') => {
  const { getStore } = await import('@netlify/blobs')
  const store = getStore({ name, consistency: 'strong' })
  return {
    async read (key, etag) {
      const r = await store.getWithMetadata(key, { etag, type: 'text' })
      return r ? { data: r.data, etag: r.etag } : null
    },
    // cond: {} | { onlyIfNew: true } | { onlyIfMatch: etag }; resolves { modified, etag }
    write: (key, text, cond = {}) => store.set(key, text, cond),
    remove: key => store.delete(key)
  }
}

export const fsBackend = dir => {
  const file = key => path.join(dir, ...key.split('/').map(encodeURIComponent)) + '.json'
  const tag = text => '"' + crypto.createHash('sha1').update(text).digest('hex') + '"'
  const current = async key => {
    try { return await fs.readFile(file(key), 'utf8') } catch { return null }
  }
  return {
    async read (key, etag) {
      const data = await current(key)
      if (data === null) return null
      const t = tag(data)
      return { data: etag === t ? null : data, etag: t }
    },
    async write (key, text, cond = {}) {
      const now = await current(key)
      if (cond.onlyIfNew && now !== null) return { modified: false }
      if (cond.onlyIfMatch && (now === null || tag(now) !== cond.onlyIfMatch)) return { modified: false }
      const f = file(key)
      await fs.mkdir(path.dirname(f), { recursive: true })
      await fs.writeFile(f + '.tmp', text)
      await fs.rename(f + '.tmp', f)
      return { modified: true, etag: tag(text) }
    },
    remove: key => fs.rm(file(key), { force: true })
  }
}

// ---------------------------------------------------------------- values

// Stored documents and the wire use the same JSON: ObjectIds as 24 character
// hex strings, dates as {$date: iso}, and the few non-finite doubles as
// {$numberDouble: 'NaN'}. In memory, for matching, dates become Date objects.

// Mongo extended JSON, as mongoexport and bsondump write it, into that form.
export const normalize = (v, unknown = new Set()) => {
  if (Array.isArray(v)) return v.map(x => normalize(x, unknown))
  if (v && typeof v === 'object') {
    const keys = Object.keys(v)
    if (keys.length === 1 && keys[0].startsWith('$')) {
      const [k] = keys
      const x = v[k]
      if (k === '$oid') return x.toLowerCase()
      if (k === '$date') {
        const t = typeof x === 'object' ? Number(x.$numberLong) : x
        return { $date: new Date(t).toISOString() }
      }
      if (k === '$numberInt' || k === '$numberLong' || k === '$numberDecimal') return Number(x)
      if (k === '$numberDouble') return Number.isFinite(Number(x)) ? Number(x) : { $numberDouble: x }
      unknown.add(k)
    }
    const out = {}
    for (const [k, x] of Object.entries(v)) out[k] = normalize(x, unknown)
    return out
  }
  return v
}

export const revive = v => {
  if (Array.isArray(v)) return v.map(revive)
  if (v && typeof v === 'object' && !(v instanceof Date)) {
    const keys = Object.keys(v)
    if (keys.length === 1 && typeof v.$date === 'string') return new Date(v.$date)
    if (keys.length === 1 && typeof v.$numberDouble === 'string') return Number(v.$numberDouble)
    const out = {}
    for (const [k, x] of Object.entries(v)) out[k] = revive(x)
    return out
  }
  return v
}

export const plainify = v => {
  if (v instanceof Date) return { $date: v.toISOString() }
  if (typeof v === 'number' && !Number.isFinite(v)) return { $numberDouble: String(v) }
  if (Array.isArray(v)) return v.map(plainify)
  if (v && typeof v === 'object') {
    const out = {}
    for (const [k, x] of Object.entries(v)) out[k] = plainify(x)
    return out
  }
  return v
}

const isPlainObject = v =>
  v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date) && !('$date' in v)

let oidCounter = crypto.randomInt(0xffffff)
const oidProcess = crypto.randomBytes(5).toString('hex')
export const newObjectId = () => {
  oidCounter = (oidCounter + 1) % 0xffffff
  const seconds = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0')
  return seconds + oidProcess + oidCounter.toString(16).padStart(6, '0')
}

// ---------------------------------------------------------------- index entries

const INDEX_FIELD_BYTES = 2048

// The index copy of a document: every field up to INDEX_FIELD_BYTES of JSON,
// descending into larger objects, dropping larger arrays and strings. The
// dropped paths are listed so queries that touch them read the full document.
export const indexEntry = doc => {
  const trimmed = []
  const walk = (value, prefix) => {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      const p = prefix ? `${prefix}.${k}` : k
      if (!prefix && k === '_id') out[k] = v
      else if ((JSON.stringify(v)?.length ?? 0) <= INDEX_FIELD_BYTES) out[k] = v
      else if (isPlainObject(v)) out[k] = walk(v, p)
      else trimmed.push(p)
    }
    return out
  }
  const d = walk(doc, '')
  return trimmed.length ? { d, t: trimmed } : { d }
}

// field paths a query tests (descending through $and/$or/$nor)
const queryPaths = (q, out = []) => {
  if (Array.isArray(q)) q.forEach(x => queryPaths(x, out))
  else if (q && typeof q === 'object') {
    for (const [k, v] of Object.entries(q)) {
      if (k.startsWith('$')) queryPaths(v, out)
      else out.push(k)
    }
  }
  return out
}

const overlaps = (paths, trimmed) => paths.some(p => trimmed.some(t =>
  p === t || p.startsWith(t + '.') || t.startsWith(p + '.')))

// ---------------------------------------------------------------- projection

// Inclusion paths of a projection, or null when it returns whole documents
// (no projection, or an exclusion projection).
const inclusionPaths = projection => {
  if (!projection) return null
  const fields = Object.entries(projection).filter(([k]) => k !== '_id')
  if (!fields.length) return projection._id ? [] : null
  if (!fields.some(([, v]) => v)) return null
  return fields.filter(([, v]) => v).map(([k]) => k)
}

const pick = (src, parts) => {
  if (Array.isArray(src)) return src.map(x => pick(x, parts)).filter(x => x !== undefined)
  if (!isPlainObject(src) || !Object.prototype.hasOwnProperty.call(src, parts[0])) return undefined
  const [head, ...rest] = parts
  if (!rest.length) return { [head]: src[head] }
  const sub = pick(src[head], rest)
  return sub === undefined ? undefined : { [head]: sub }
}

const merge = (a, b) => {
  if (a === undefined) return b
  if (Array.isArray(a) && Array.isArray(b)) return a.map((x, i) => merge(x, b[i]))
  if (isPlainObject(a) && isPlainObject(b)) {
    const out = { ...a }
    for (const [k, v] of Object.entries(b)) out[k] = k in out ? merge(out[k], v) : v
    return out
  }
  return b
}

const omit = (src, parts) => {
  if (Array.isArray(src)) return src.map(x => omit(x, parts))
  if (!isPlainObject(src) || !(parts[0] in src)) return src
  const out = { ...src }
  if (parts.length === 1) delete out[parts[0]]
  else out[parts[0]] = omit(src[parts[0]], parts.slice(1))
  return out
}

export const project = (doc, projection) => {
  if (!projection || !Object.keys(projection).length) return doc
  const keepId = !('_id' in projection) || Boolean(projection._id)
  const include = inclusionPaths(projection)
  let out
  if (include) {
    out = {}
    for (const p of include) {
      const part = p.includes('.')
        ? pick(doc, p.split('.'))
        : (Object.prototype.hasOwnProperty.call(doc, p) ? { [p]: doc[p] } : undefined)
      if (part !== undefined) out = merge(out, part)
    }
    if (keepId && '_id' in doc) out = { _id: doc._id, ...out }
  } else {
    out = doc
    for (const [p, v] of Object.entries(projection)) if (!v && p !== '_id') out = omit(out, p.split('.'))
    if (!keepId) { out = { ...out }; delete out._id }
  }
  return out
}

// ---------------------------------------------------------------- collections

const indexCache = new Map() // collection key → { etag, raw, entries }
const docCache = new Map() // document key → { doc, size } (documents never change in place)
let docCacheBytes = 0
const DOC_CACHE_BYTES = 96 * 1024 * 1024

const pool = async (items, size, fn) => {
  const out = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker))
  return out
}

export class Collection {
  constructor (backend, source, name) {
    this.backend = backend
    this.key = `${source}/${name}`
  }

  indexKey () { return `index/${this.key}` }
  docKey (id) { return `doc/${this.key}/${encodeURIComponent(String(id))}` }

  async index () {
    const cached = indexCache.get(this.key)
    const r = await this.backend.read(this.indexKey(), cached?.etag)
    if (!r) {
      const empty = { etag: null, raw: { entries: [] }, entries: [] }
      indexCache.set(this.key, empty)
      return empty
    }
    if (r.data === null && cached) return cached
    const raw = JSON.parse(r.data)
    const idx = { etag: r.etag, raw, entries: raw.entries.map(e => ({ d: revive(e.d), t: e.t || [] })) }
    indexCache.set(this.key, idx)
    return idx
  }

  async full (id) {
    const key = this.docKey(id)
    if (docCache.has(key)) return docCache.get(key).doc
    const r = await this.backend.read(key)
    if (!r) return null
    const doc = revive(JSON.parse(r.data))
    docCache.set(key, { doc, size: r.data.length })
    docCacheBytes += r.data.length
    while (docCacheBytes > DOC_CACHE_BYTES && docCache.size > 1) {
      const [oldest] = docCache.keys()
      docCacheBytes -= docCache.get(oldest).size
      docCache.delete(oldest)
    }
    return doc
  }

  async find (query = {}, { projection, limit } = {}) {
    const { entries } = await this.index()
    const test = sift(revive(query))
    const paths = queryPaths(query)
    // documents whose index copy lacks a field the query tests are matched in full
    const needFull = entries.filter(e => e.t.length && overlaps(paths, e.t))
    const fulls = new Map()
    await pool(needFull, 8, async e => fulls.set(e, await this.full(e.d._id)))
    const matches = []
    for (const e of entries) {
      if (limit && matches.length >= limit) break
      const doc = fulls.has(e) ? fulls.get(e) : e.d
      if (doc && test(doc)) matches.push(e)
    }
    const include = inclusionPaths(projection)
    return pool(matches, 8, async e => {
      let doc = fulls.get(e) || e.d
      if (doc === e.d && e.t.length && (!include || overlaps(include, e.t))) doc = await this.full(e.d._id)
      return project(doc, projection)
    })
  }

  async findOne (query, opts = {}) {
    const [doc] = await this.find(query, { ...opts, limit: 1 })
    return doc ?? null
  }

  // Apply a change to the index blob, retrying when another writer got there first.
  async updateIndex (change) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const idx = await this.index()
      const entries = change(idx.raw.entries.slice())
      const text = JSON.stringify({ entries })
      const cond = idx.etag ? { onlyIfMatch: idx.etag } : { onlyIfNew: true }
      const res = await this.backend.write(this.indexKey(), text, cond)
      if (res.modified) {
        indexCache.set(this.key, { etag: res.etag, raw: { entries }, entries: entries.map(e => ({ d: revive(e.d), t: e.t || [] })) })
        return
      }
      indexCache.delete(this.key)
      await new Promise(resolve => setTimeout(resolve, 40 * (attempt + 1) + Math.random() * 60))
    }
    throw new Error('index is busy, try again')
  }

  async insertOne (doc) {
    const d = { ...doc, _id: doc._id === undefined ? newObjectId() : String(doc._id) }
    const res = await this.backend.write(this.docKey(d._id), JSON.stringify(d), { onlyIfNew: true })
    if (!res.modified) throw Object.assign(new Error('duplicate _id'), { status: 409 })
    try {
      await this.updateIndex(entries => entries.concat(indexEntry(d)))
    } catch (err) {
      await this.backend.remove(this.docKey(d._id))
      throw err
    }
    return { insertedId: d._id }
  }

  async deleteMany (query) {
    const ids = (await this.find(query, { projection: { _id: 1 } })).map(d => d._id)
    if (!ids.length) return { deletedCount: 0 }
    const gone = new Set(ids)
    await this.updateIndex(entries => entries.filter(e => !gone.has(e.d._id)))
    await pool(ids, 8, id => { docCache.delete(this.docKey(id)); return this.backend.remove(this.docKey(id)) })
    return { deletedCount: ids.length }
  }

  // ---- seeding (admin)

  async putDocs (docs) {
    await pool(docs, 16, d => {
      docCache.delete(this.docKey(d._id))
      return this.backend.write(this.docKey(d._id), JSON.stringify(d))
    })
    return { written: docs.length }
  }

  async putIndex (entries) {
    const res = await this.backend.write(this.indexKey(), JSON.stringify({ entries }))
    indexCache.delete(this.key)
    return { entries: entries.length, modified: res.modified }
  }

  async count () {
    return (await this.index()).entries.length
  }
}

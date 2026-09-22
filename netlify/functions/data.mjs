// Data API for Æterni Anima.
//
// The site used to reach five MongoDB Atlas databases straight from the browser
// through MongoDB Stitch. Stitch reached end of life, and later the clusters
// themselves were deleted. Their data, restored from the last backups, now lives
// in this site's Netlify Blobs (see ../lib/store.mjs), and this function is the
// only way in. See DATA.md.
//
// Configuration (environment variables, never committed):
//   ADMIN_KEY          required for deletes, for writes to the network archives,
//                      and for seeding
//   ALLOWED_ORIGINS    optional, comma separated; added to the Æterni origins
//   AETERNI_DATA_DIR   local development only: keep the data in this directory
import { gunzipSync, gzipSync } from 'node:zlib'
import { createHash, timingSafeEqual } from 'node:crypto'
import { Collection, blobsBackend, fsBackend, plainify } from '../lib/store.mjs'

// Each source is one of the old Atlas databases, and the collections keep their
// names. `open` lists what anyone may do; every other operation needs the admin key.
const READ = ['findOne', 'find']
const SOURCES = {
  artifacts: { collections: ['acolectioncreated', 'aatest'], open: [...READ, 'insertOne'] }, // sessions; AA shouts
  aquarium: { collections: ['anycollection'], open: READ }, // Our Aquarium: the networks people contributed
  communities: { collections: ['acol'], open: [...READ, 'insertOne'] }, // communities recorded in ?you
  freenet: { collections: ['test3', 'test', 'test2', 'nets'], open: READ }, // earlier and WhatsApp networks
  syncs: { collections: ['fcol'], open: [...READ, 'insertOne'] } // synchronized sessions made in ?tithorea
}
const OPS = ['findOne', 'find', 'insertOne', 'deleteMany', 'putDocs', 'putIndex', 'stats']

const DEFAULT_ORIGINS = [
  'https://aeterni.github.io',
  'http://localhost:8123',
  'http://127.0.0.1:8123'
]
const MAX_LIMIT = 20000
const MAX_BODY_BYTES = 4 * 1024 * 1024 // a recorded community runs to 1.5 MB
const MAX_WIRE_BYTES = 5.5 * 1024 * 1024 // Netlify refuses requests and responses over 6 MB
const MAX_SEED_BYTES = 64 * 1024 * 1024 // decompressed seeding batches
const COMPRESS_FROM = 64 * 1024

// Mongo operators that execute server side javascript or are otherwise unsafe
// to accept from an anonymous caller:
const FORBIDDEN = ['$where', '$function', '$accumulator', '$merge', '$out']

const allowedOrigins = () =>
  (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean).concat(DEFAULT_ORIGINS)

const corsHeaders = origin => {
  const list = allowedOrigins()
  return {
    'Access-Control-Allow-Origin': list.includes(origin) ? origin : list[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin, Accept-Encoding'
  }
}

// Large results (an Aquarium network reaches 6 MB) are gzipped, which also keeps
// them under Netlify's response limit.
const json = (status, body, req) => {
  const headers = { 'Content-Type': 'application/json', ...corsHeaders(req.headers.get('origin') || '') }
  let payload = JSON.stringify(body)
  if (payload.length > COMPRESS_FROM && /\bgzip\b/.test(req.headers.get('accept-encoding') || '')) {
    payload = gzipSync(payload)
    headers['Content-Encoding'] = 'gzip'
  }
  if (payload.length > MAX_WIRE_BYTES) {
    return json(413, { error: 'result too large; narrow the query or add a projection' }, req)
  }
  return new Response(payload, { status, headers })
}

// Walk a query/document and reject anything carrying a forbidden operator.
const assertSafe = (value, depth = 0) => {
  if (depth > 32) throw new Error('query nested too deeply')
  if (Array.isArray(value)) return value.forEach(v => assertSafe(v, depth + 1))
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (FORBIDDEN.includes(k)) throw new Error(`operator ${k} is not allowed`)
      assertSafe(v, depth + 1)
    }
  }
}

const digest = s => createHash('sha256').update(String(s)).digest()
const isAdmin = given => {
  const key = process.env.ADMIN_KEY
  return Boolean(key && given) && timingSafeEqual(digest(key), digest(given))
}

let backendPromise = null
const backend = () => {
  if (!backendPromise) {
    const dir = process.env.AETERNI_DATA_DIR
    backendPromise = dir ? Promise.resolve(fsBackend(dir)) : blobsBackend()
  }
  return backendPromise
}

const stats = async () => {
  const b = await backend()
  const out = {}
  for (const [source, { collections }] of Object.entries(SOURCES)) {
    out[source] = {}
    for (const name of collections) out[source][name] = await new Collection(b, source, name).count()
  }
  return out
}

const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v)

export default async req => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin') || '') })
  if (req.method !== 'POST') return json(405, { error: 'use POST' }, req)

  const admin = isAdmin(req.headers.get('x-admin-key'))
  let body
  try {
    let raw = Buffer.from(await req.arrayBuffer())
    // Compressed or oversized bodies are for seeding only. Seeding sends gzip as
    // application/octet-stream (Netlify mangles binary sent as JSON), so look at
    // the bytes, not the headers.
    const gzipped = raw[0] === 0x1f && raw[1] === 0x8b
    if (gzipped || raw.length > MAX_BODY_BYTES) {
      if (!admin && gzipped) return json(401, { error: 'compressed requests need the admin key' }, req)
      if (!admin) return json(413, { error: 'payload too large' }, req)
      if (gzipped) raw = gunzipSync(raw, { maxOutputLength: MAX_SEED_BYTES })
      if (raw.length > MAX_SEED_BYTES) return json(413, { error: 'payload too large' }, req)
    }
    body = JSON.parse(raw.toString('utf8') || '{}')
  } catch {
    return json(400, { error: 'invalid body' }, req)
  }

  const { source = 'artifacts', op, query = {}, projection, doc, limit } = body
  if (!OPS.includes(op)) return json(400, { error: `op must be one of ${OPS.join(', ')}` }, req)

  try {
    if (op === 'stats') return json(200, { result: await stats() }, req)

    const src = SOURCES[source]
    if (!src) return json(400, { error: 'unknown source' }, req)
    const name = body.collection || src.collections[0]
    if (!src.collections.includes(name)) return json(400, { error: 'unknown collection' }, req)
    if (!src.open.includes(op) && !admin) return json(401, { error: 'admin key required' }, req)
    if (!isObject(query)) return json(400, { error: 'query must be an object' }, req)
    if (projection !== undefined && projection !== null && !isObject(projection)) {
      return json(400, { error: 'projection must be an object' }, req)
    }
    assertSafe(query)
    if (doc !== undefined) assertSafe(doc)

    const c = new Collection(await backend(), source, name)
    let result
    if (op === 'findOne') {
      result = await c.findOne(query, { projection })
    } else if (op === 'find') {
      result = await c.find(query, { projection, limit: Math.min(Number(limit) || MAX_LIMIT, MAX_LIMIT) })
    } else if (op === 'insertOne') {
      if (!isObject(doc)) return json(400, { error: 'doc must be an object' }, req)
      result = await c.insertOne(doc)
    } else if (op === 'deleteMany') {
      // never allow an unbounded delete
      if (!Object.keys(query).length) return json(400, { error: 'refusing to delete with an empty query' }, req)
      result = await c.deleteMany(query)
    } else if (op === 'putDocs') {
      const { docs } = body
      if (!Array.isArray(docs) || !docs.every(d => isObject(d) && typeof d._id === 'string')) {
        return json(400, { error: 'docs must be objects with string _id' }, req)
      }
      result = await c.putDocs(docs)
    } else if (op === 'putIndex') {
      if (!Array.isArray(body.entries)) return json(400, { error: 'entries must be an array' }, req)
      result = await c.putIndex(body.entries)
    }
    return json(200, { result: plainify(result) }, req)
  } catch (err) {
    if (err.status) return json(err.status, { error: err.message }, req)
    if (/not allowed|nested too deeply|unsupported operation/i.test(err.message)) return json(400, { error: err.message }, req)
    console.error('data function failed:', err)
    return json(500, { error: 'data request failed' }, req)
  }
}

export const config = { path: '/api/data' }

// Data API for Æterni Anima.
//
// Replaces MongoDB Stitch / Atlas App Services, which reached end of life: the
// browser can no longer talk to Atlas directly, so this small function is the
// only thing that holds a database connection. It speaks to a single database
// and a fixed set of collections, and it is deliberately narrow — see guards
// below — rather than being a general purpose proxy.
//
// Configuration (environment variables, never committed):
//   MONGODB_URI         required, the Atlas connection string
//   MONGODB_DB          optional, defaults to adbcreated
//   ALLOWED_ORIGINS     optional, comma separated; defaults to the Æterni site
import { MongoClient, ObjectId } from 'mongodb'

const DB_NAME = process.env.MONGODB_DB || 'adbcreated'
const COLLECTIONS = ['acolectioncreated', 'aatest'] // the artifact collections
const OPS = ['findOne', 'find', 'insertOne', 'deleteMany']
const DEFAULT_ORIGINS = [
  'https://aeterni.github.io',
  'http://localhost:8123',
  'http://127.0.0.1:8123'
]
const MAX_LIMIT = 2000
const DEFAULT_LIMIT = 500
const MAX_BODY_BYTES = 512 * 1024

// Mongo operators that execute server side javascript or are otherwise unsafe
// to accept from an anonymous caller:
const FORBIDDEN = ['$where', '$function', '$accumulator', '$merge', '$out']

const allowedOrigins = () =>
  (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean).concat(DEFAULT_ORIGINS)

const corsHeaders = origin => {
  const list = allowedOrigins()
  const allow = list.includes(origin) ? origin : list[0]
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  }
}

const json = (status, body, origin) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
  })

// Walk a query/document and reject anything carrying a forbidden operator.
const assertSafe = (value, depth = 0) => {
  if (depth > 12) throw new Error('query nested too deeply')
  if (Array.isArray(value)) return value.forEach(v => assertSafe(v, depth + 1))
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (FORBIDDEN.includes(k)) throw new Error(`operator ${k} is not allowed`)
      assertSafe(v, depth + 1)
    }
  }
}

const HEX24 = /^[0-9a-fA-F]{24}$/

// JSON has neither ObjectIds nor dates, and the browser no longer carries a BSON
// library. The two are carried across as a 24 character hex string and as
// {$date: <iso>} respectively, and rebuilt on each side — the artifact player
// needs real Date objects, not strings.
const revive = (value, key = null, depth = 0) => {
  if (depth > 12) return value
  if (Array.isArray(value)) return value.map(v => revive(v, key, depth + 1))
  if (value && typeof value === 'object') {
    if (typeof value.$date === 'string' && Object.keys(value).length === 1) return new Date(value.$date)
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = revive(v, k.startsWith('$') ? key : k, depth + 1)
    }
    return out
  }
  if (key === '_id' && typeof value === 'string' && HEX24.test(value)) return new ObjectId(value)
  return value
}

const plainify = value => {
  if (Array.isArray(value)) return value.map(plainify)
  if (value instanceof ObjectId) return value.toHexString()
  if (value instanceof Date) return { $date: value.toISOString() }
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) out[k] = plainify(v)
    return out
  }
  return value
}

let clientPromise = null
const collection = async name => {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not configured')
  if (!clientPromise) {
    clientPromise = new MongoClient(uri, { maxPoolSize: 4, serverSelectionTimeoutMS: 8000 }).connect()
  }
  const client = await clientPromise
  return client.db(DB_NAME).collection(name)
}

export default async req => {
  const origin = req.headers.get('origin') || ''

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) })
  if (req.method !== 'POST') return json(405, { error: 'use POST' }, origin)

  let body
  try {
    const raw = await req.text()
    if (raw.length > MAX_BODY_BYTES) return json(413, { error: 'payload too large' }, origin)
    body = JSON.parse(raw || '{}')
  } catch {
    return json(400, { error: 'invalid json' }, origin)
  }

  const { op, collection: coll = COLLECTIONS[0], query = {}, projection, doc, limit } = body

  if (!OPS.includes(op)) return json(400, { error: `op must be one of ${OPS.join(', ')}` }, origin)
  if (!COLLECTIONS.includes(coll)) return json(400, { error: 'unknown collection' }, origin)

  try {
    assertSafe(query)
    if (doc !== undefined) assertSafe(doc)
  } catch (err) {
    return json(400, { error: err.message }, origin)
  }

  try {
    const c = await collection(coll)
    const q = revive(query)

    if (op === 'findOne') {
      const found = await c.findOne(q, { projection })
      return json(200, { result: plainify(found) }, origin)
    }

    if (op === 'find') {
      const capped = Math.min(Number(limit) || DEFAULT_LIMIT, MAX_LIMIT)
      const found = await c.find(q, { projection }).limit(capped).toArray()
      return json(200, { result: plainify(found) }, origin)
    }

    if (op === 'insertOne') {
      if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
        return json(400, { error: 'doc must be an object' }, origin)
      }
      const res = await c.insertOne(revive(doc))
      return json(200, { result: { insertedId: res.insertedId.toHexString() } }, origin)
    }

    if (op === 'deleteMany') {
      // never allow an unbounded delete
      if (!q || Object.keys(q).length === 0) return json(400, { error: 'refusing to delete with an empty query' }, origin)
      const res = await c.deleteMany(q)
      return json(200, { result: { deletedCount: res.deletedCount } }, origin)
    }
  } catch (err) {
    console.error('data function failed:', err)
    return json(500, { error: 'database request failed' }, origin)
  }
}

export const config = { path: '/api/data' }

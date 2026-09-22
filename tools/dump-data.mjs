// Copy everything out of the data function into local files (see DATA.md).
//
//   node tools/dump-data.mjs --api <url> --key-file <file> [--out <dir>]
//
// The Atlas clusters this data came from were deleted, and the 2024 exports are
// the only reason it still exists. So take a copy of the live store now and
// then: it holds everything made since — sessions, communities, syncs, shouts.
//
// Writes one JSON-lines file per collection, in the shape tools/seed-data.mjs
// reads back with --dump, so a dump restores as it stands. The files hold
// personal data: keep them where the other backups are, out of this repository.
import { mkdirSync, writeFileSync } from 'node:fs'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import os from 'node:os'
import path from 'node:path'

const SOURCES = {
  artifacts: ['acolectioncreated', 'aatest'],
  aquarium: ['anycollection'],
  communities: ['acol'],
  freenet: ['test3', 'test', 'test2', 'nets'],
  syncs: ['fcol']
}

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? fallback : process.argv[i + 1]
}
const api = arg('api', 'http://localhost:8788/api/data')
const keyFile = arg('key-file')
const adminKey = keyFile ? readFileSync(keyFile, 'utf8').trim() : process.env.ADMIN_KEY
const out = path.join(arg('out', path.join(os.homedir(), 'repos/generalDataBackup/aeterni-store')),
  new Date().toLocaleDateString('sv').replace(/-/g, '_')) // local date, as the other backups are named
if (!adminKey) throw new Error('give the admin key with --key-file <file> or ADMIN_KEY')

const post = async body => {
  // ask for compression: the largest network is 6.35 MB, which the function
  // will not send uncompressed (Netlify carries at most 6 MB)
  const res = await fetch(api, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept-Encoding': 'gzip', 'X-Admin-Key': adminKey },
    body: JSON.stringify(body)
  })
  const raw = Buffer.from(await res.arrayBuffer())
  const text = raw[0] === 0x1f && raw[1] === 0x8b ? gunzipSync(raw).toString('utf8') : raw.toString('utf8')
  let payload = {}
  try { payload = JSON.parse(text) } catch { /* an error page, reported below */ }
  if (!res.ok) throw Object.assign(new Error(payload.error || `${res.status}`), { status: res.status })
  return payload.result
}

// Documents come back a few at a time: one Aquarium network alone is 6 MB, and
// the function refuses to answer with more than Netlify will carry.
const fetchDocs = async (source, collection, ids) => {
  const docs = []
  let size = 20
  for (let i = 0; i < ids.length;) {
    const batch = ids.slice(i, i + size)
    try {
      docs.push(...await post({ source, collection, op: 'find', query: { _id: { $in: batch } }, limit: batch.length }))
      i += size
    } catch (err) {
      if (err.status !== 413 || size === 1) throw Object.assign(err, { message: `${source}/${collection} at batch size ${size}: ${err.message}` })
      size = Math.max(1, Math.floor(size / 4))
      console.log(`  ${source}/${collection}: batch too large, down to ${size}`)
    }
  }
  return docs
}

mkdirSync(out, { recursive: true })
let total = 0
for (const [source, collections] of Object.entries(SOURCES)) {
  for (const collection of collections) {
    const ids = await post({ source, collection, op: 'ids' })
    const docs = await fetchDocs(source, collection, ids)
    if (docs.length !== ids.length) throw new Error(`${source}/${collection}: got ${docs.length} of ${ids.length} documents`)
    writeFileSync(path.join(out, `${source}-${collection}.jsonl`), docs.map(d => JSON.stringify(d)).join('\n') + '\n')
    console.log(`${source}/${collection}: ${docs.length} documents`)
    total += docs.length
  }
}
console.log(`${total} documents in ${out}`)

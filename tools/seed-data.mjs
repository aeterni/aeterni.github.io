// Load the database backups into the data function (see DATA.md).
//
//   node tools/seed-data.mjs --api <url> --key-file <file> [--backups <dir>] [--only source/collection]
//
// The five Atlas clusters the site used no longer exist; their last exports
// (mongoexport JSON lines, or mongodump BSON read through bsondump) are the
// source. Documents go up in gzipped batches, then each collection's index.
// Re-running replaces what is there. The backups hold personal data: they stay
// outside this repository, and so does anything this script derives from them.
import { readFileSync, createReadStream } from 'node:fs'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { gzipSync } from 'node:zlib'
import os from 'node:os'
import path from 'node:path'
import { normalize, indexEntry } from '../netlify/lib/store.mjs'

// source, collection, backup file (relative to --backups)
const FILES = [
  ['artifacts', 'acolectioncreated', 'aeterni_2024_02_13_.json'],
  ['artifacts', 'aatest', 'aa_2024_02_13_.json'],
  ['aquarium', 'anycollection', 'anycollection_2024_02_13_.json'],
  ['communities', 'acol', 'acol_aeterni_2024_02_13_.json'],
  ['freenet', 'test', 'test_2024_02_13.json/freenet-all/test.bson'],
  ['freenet', 'test2', 'test2_2024_02_13_.json'],
  ['freenet', 'test3', 'test3_2024_02_13_.json'],
  ['freenet', 'nets', 'nets_2024_02_13_.json'],
  ['syncs', 'fcol', 'fcol_2024_02_13_.json']
]

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? fallback : process.argv[i + 1]
}
const api = arg('api', 'http://localhost:8788/api/data')
const keyFile = arg('key-file')
const adminKey = keyFile ? readFileSync(keyFile, 'utf8').trim() : process.env.ADMIN_KEY
const backups = arg('backups', path.join(os.homedir(), 'repos/generalDataBackup/backups'))
const only = arg('only')
if (!adminKey) throw new Error('give the admin key with --key-file <file> or ADMIN_KEY')

const BATCH_BYTES = 12 * 1024 * 1024 // uncompressed; gzipped, a batch stays well under 6 MB
const BATCH_DOCS = 250

const lines = file => {
  if (file.endsWith('.bson')) {
    const p = spawn('bsondump', ['--quiet', file], { stdio: ['ignore', 'pipe', 'inherit'] })
    return createInterface({ input: p.stdout, crlfDelay: Infinity })
  }
  return createInterface({ input: createReadStream(file), crlfDelay: Infinity })
}

const post = async body => {
  const res = await fetch(api, {
    method: 'POST',
    // binary, or Netlify decodes the gzipped body as text and corrupts it
    headers: { 'Content-Type': 'application/octet-stream', 'X-Admin-Key': adminKey },
    body: gzipSync(JSON.stringify(body))
  })
  const payload = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${body.op} ${body.source}/${body.collection}: ${res.status} ${payload.error || ''}`)
  return payload.result
}

for (const [source, collection, rel] of FILES) {
  if (only && only !== `${source}/${collection}`) continue
  const unknown = new Set()
  const entries = []
  let batch = []
  let batchBytes = 0
  let count = 0
  const flush = async () => {
    if (!batch.length) return
    await post({ op: 'putDocs', source, collection, docs: batch })
    batch = []
    batchBytes = 0
  }
  for await (const line of lines(path.join(backups, rel))) {
    if (!line.trim()) continue
    const doc = normalize(JSON.parse(line), unknown)
    doc._id = String(doc._id)
    const size = JSON.stringify(doc).length
    if (batch.length && (batchBytes + size > BATCH_BYTES || batch.length >= BATCH_DOCS)) await flush()
    batch.push(doc)
    batchBytes += size
    entries.push(indexEntry(doc))
    count++
  }
  await flush()
  await post({ op: 'putIndex', source, collection, entries })
  const note = unknown.size ? `  (unconverted extended JSON: ${[...unknown].join(', ')})` : ''
  console.log(`${source}/${collection}: ${count} documents${note}`)
}

console.log(JSON.stringify(await post({ op: 'stats' }), null, 1))

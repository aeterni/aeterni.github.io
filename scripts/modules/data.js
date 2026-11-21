// Requests to the site's own data function (netlify/functions/data.mjs; see DATA.md).
// Plain fetch and no libraries, so both bundles can use it: transfer.js builds the
// older routes' calls on it, and the AA page (aa.js) in the small bundle uses it directly.
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
  // the key also opens the listings the archives do not answer anonymously
  if (adminKey()) headers['X-Admin-Key'] = adminKey()
  return window.fetch(e.apiUrl(), {
    method: 'POST',
    headers,
    body: JSON.stringify(pack(body))
  }).then(async res => {
    const payload = await res.json().catch(() => ({}))
    if (res.status === 401) {
      rememberKey(null)
      const given = !retried && window.prompt('This needs the Æterni admin key:')
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

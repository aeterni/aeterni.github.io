// Run the data function locally, on the port transfer.js expects when the site
// is served from localhost (see DATA.md):
//
//   AETERNI_DATA_DIR=.data ADMIN_KEY=local node tools/data-server.mjs
//
// It serves the same handler Netlify runs, backed by a plain directory instead
// of Netlify Blobs. Seed that directory with tools/seed-data.mjs.
import http from 'node:http'
import handler from '../netlify/functions/data.mjs'

const port = Number(process.env.PORT) || 8788
if (!process.env.AETERNI_DATA_DIR) {
  console.error('set AETERNI_DATA_DIR to the directory holding the local data (e.g. .data)')
  process.exit(1)
}

http.createServer(async (req, res) => {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const body = Buffer.concat(chunks)
  const request = new Request(`http://localhost:${port}${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : body
  })
  const response = await handler(request)
  res.writeHead(response.status, Object.fromEntries(response.headers))
  res.end(Buffer.from(await response.arrayBuffer()))
}).listen(port, () => console.log(`data function on http://localhost:${port}/api/data (data in ${process.env.AETERNI_DATA_DIR})`))

# The data function

## Why this exists

The site used to talk to MongoDB straight from the browser through MongoDB
Stitch (later renamed Atlas App Services). That service reached end of life —
every request now answers `410` with:

```
{"error":"Atlas App Services and Device Sync have reached EOL"}
```

There is no newer SDK to move to: `mongodb-stitch-browser-sdk` points to
`realm-web` as its successor, and `realm-web` is deprecated as well. MongoDB
retired the whole browser-to-database product line, and browsers cannot speak
the MongoDB wire protocol themselves. So waking the cluster is not enough on its
own — something has to sit between the page and the database.

That something is `netlify/functions/data.mjs`. It is the only place that holds
a database connection.

## Shape

```
browser (scripts/modules/transfer.js)
   │  POST {op, collection, query, projection, doc, limit}
   ▼
netlify/functions/data.mjs        ← holds MONGODB_URI
   ▼
MongoDB Atlas  (database adbcreated, collection acolectioncreated)
```

`transfer.js` kept its promise-returning functions (`findAny`, `findAll`,
`writeAny`, `remove`), so the artifact player and the pages above it did not
change.

Two things need care crossing JSON:

- **ObjectIds** travel as 24 character hex strings. `utils.objectIdWithTimestamp`
  returns such a string, and the function turns it back into an `ObjectId`.
- **Dates** travel as `{"$date": "<iso>"}` in both directions. This matters: the
  player calls `header.datetime.getTime()`, so a plain string breaks playback.

## Deploying

The site itself stays on GitHub Pages. Netlify only hosts the function.

1. **Check the cluster.** Sign in to MongoDB Atlas. Free tier clusters pause
   after being idle; if it is paused, resume it. Confirm the database
   `adbcreated` and collection `acolectioncreated` still hold the artifacts.
2. **Create the Netlify site** (once), from this repository:
   ```sh
   netlify sites:create      # or: netlify link, to attach an existing site
   ```
3. **Set the connection string.** In the Netlify UI, under
   *Site settings › Environment variables*, add `MONGODB_URI` with the Atlas
   connection string. Never commit it, and never paste it into a chat or an
   issue. Optionally set `MONGODB_DB` (defaults to `adbcreated`) and
   `ALLOWED_ORIGINS`.
4. **Deploy:**
   ```sh
   netlify deploy --prod
   ```
5. **Point the site at it.** If the resulting endpoint is not
   `https://aeterni-data.netlify.app/api/data`, update the fallback in
   `scripts/modules/transfer.js` (`e.apiUrl`), then `make b` and commit.

## Running it locally

```sh
# a local database standing in for Atlas
mongod --dbpath /tmp/aeterni-db --port 27019

# restore a backup into it, e.g. from the mongodump folders
mongorestore --port 27019 --db adbcreated <dump>/adbcreated/

# the function, on the port the site expects from localhost
MONGODB_URI=mongodb://127.0.0.1:27019 MONGODB_DB=adbcreated netlify dev
```

Served from `localhost`, `transfer.js` calls `http://localhost:8788/api/data`.
Set `window.AETERNI_API` in the page to point anywhere else.

## What the function will not do

It is intentionally not a general database proxy:

- only the collections `acolectioncreated` and `aatest`
- only `findOne`, `find`, `insertOne`, `deleteMany`
- `$where`, `$function`, `$accumulator`, `$merge`, `$out` are refused
- results capped (500 by default, 2000 maximum), request bodies capped
- `deleteMany` with an empty query is refused
- CORS limited to the site origins

## Still dormant

Each of these lived in its own Atlas cluster behind its own Stitch app, so they
are not covered by this function and currently resolve empty rather than
throwing: `ttm`, `mark`, `aeterni`, `costa`, `f4b`. That leaves the social
network views and visit logging inactive. To revive one, give the function its
connection string and route the name in `transfer.js`.

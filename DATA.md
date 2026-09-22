# The data function

## Why this exists

The site used to read and write five MongoDB Atlas databases straight from the
browser, through MongoDB Stitch. Stitch (later Atlas App Services) reached end
of life, and by September 2026 the Atlas clusters themselves were gone: none of
their addresses resolve any more. What remained were the backups.

So the data now lives in this project's own storage. `netlify/functions/data.mjs`
is the only way in, and it keeps its data in Netlify Blobs on the
`aeterni-data` site (renato.fabbri@'s Netlify account, team TTM). There is no
database account to keep alive, and nothing pauses when idle.

## Shape

```
browser (scripts/modules/transfer.js)
   │  POST {source, op, collection, query, projection, doc, limit}
   ▼
https://aeterni-data.netlify.app/api/data   (netlify/functions/data.mjs)
   ▼
Netlify Blobs, store "aeterni-data"        (netlify/lib/store.mjs)
   doc/<source>/<collection>/<_id>        one blob per document
   index/<source>/<collection>            every document, bulky fields trimmed
```

Queries are MongoDB queries (evaluated by [sift](https://github.com/crcn/sift.js))
run against the index; only the documents a query returns are read in full. So
opening one Aquarium network reads that network, not all 46 MB of them.

## Sources

Each source is one of the old databases. Collections kept their names, and the
names the pages use (`wand.transfer.fAll.mark(...)` and so on) map onto them in
`transfer.js`:

| page name  | source        | collections                          | what it holds |
|------------|---------------|--------------------------------------|---------------|
| `tokisona` | `artifacts`   | `acolectioncreated`, `aatest`        | audiovisual sessions; AA shouts |
| `mark`     | `aquarium`    | `anycollection`                      | Our Aquarium: networks people contributed |
| `aeterni`  | `communities` | `acol`                               | communities recorded in `?you` |
| `ttm`      | `freenet`     | `test3` (default), `test`, `test2`, `nets` | earlier and WhatsApp networks |
| `f4b`      | `syncs`       | `fcol`                               | synchronized sessions made in `?tithorea` |

Visit logging (`costa`) is not restored: it stored visitors' IP details. It
resolves empty.

Two things need care crossing JSON:

- **ObjectIds** travel as 24 character hex strings, and new ones are made the
  way MongoDB makes them, so `_id` order is still creation order.
- **Dates** travel as `{"$date": "<iso>"}` in both directions. This matters: the
  player calls `header.datetime.getTime()`, so a plain string breaks playback.

## Who may do what

The endpoint is public and CORS restrains only browsers, so the rules are in the
function itself.

Without the admin key:

- **Sessions** can be read and listed, and **shouts** read and written (up to
  16 KB each) — those pages are public, as they were.
- **The archives** (`aquarium`, `communities`, `freenet`, `syncs`) answer a query
  that names what it wants: a network by `userData.id`, a community by
  `comName`, a sync by `syncId` (the full list is `mustMatch` in the function).
  Every link works; downloading the lot does not.
- **Creator logins** (the `luser` documents) are neither listed nor readable.

With the admin key, sent as `X-Admin-Key`, everything else: listings, deleting,
making sessions, recording communities, creating syncs, seeding and dumping. The
site asks for the key the first time a page needs it and remembers it in that
browser — the session maker does this on opening.

Also refused, always: `$where`, `$function`, `$accumulator`, `$merge`, `$out`,
deletes without a query, and bodies over 4 MB.

Not done yet: rate limiting. A query touching a trimmed field makes the function
read every full document in a collection, which is a cheap way for someone to
burn the Netlify quota.

The admin key lives in `~/.config/aeterni/admin-key` on Renato's machine and in
the site's `ADMIN_KEY` environment variable. Never commit it.

## Deploying and seeding

`~/.zshrc` exports BioSynCare's `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`. The
Makefile targets drop the token and name the Æterni site, so the Netlify CLI
falls back to its saved login (renato.fabbri@) — no logging in and out:

```sh
make data-deploy   # deploy the function to aeterni-data.netlify.app
make data-seed     # load the backups into it (replaces what is there)
```

`make data-seed` reads the February 2024 exports in
`~/repos/generalDataBackup/backups/` (see `FILES` in `tools/seed-data.mjs`).
They hold personal data and stay out of this repository.

Those exports are the only reason this data still exists, and they stop at
February 2024. Everything made since — sessions, communities, syncs, shouts —
exists only in the live store, so copy it out now and then:

```sh
make data-dump     # → ~/repos/generalDataBackup/aeterni-store/<date>/
```

To put a dump back:

```sh
node tools/seed-data.mjs --api $(DATA_API) --key-file $(ADMIN_KEY_FILE) --dump <dir>
```

(verified: a dump restored into an empty store gives the same 8,412 documents).

To change the admin key: write a new one to `~/.config/aeterni/admin-key`, then
`env -u NETLIFY_AUTH_TOKEN NETLIFY_SITE_ID=<DATA_SITE> netlify env:set ADMIN_KEY "$(cat ~/.config/aeterni/admin-key)"`
and `make data-deploy`.

## Running it locally

```sh
make data-local        # the function on :8788, data in .data/ (gitignored)
make data-seed-local   # in another terminal, once: load the backups into .data/
make serve             # the site on :8123
```

Served from `localhost`, `transfer.js` calls `http://localhost:8788/api/data`.
Set `window.AETERNI_API` in the page to point anywhere else — for example at
the deployed function, to try local page changes against the real data.

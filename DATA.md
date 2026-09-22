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

- Anyone may read, and may add sessions, shouts, communities and syncs — the
  pages that create them are public, as they were.
- Deleting, and writing to the network archives (`aquarium`, `freenet`), needs
  the admin key, sent as `X-Admin-Key`. The site asks for it the first time an
  admin action needs it and remembers it in that browser.
- `$where`, `$function`, `$accumulator`, `$merge`, `$out` are refused, deletes
  must carry a query, and bodies are capped at 4 MB.
- CORS is limited to the site origins.

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

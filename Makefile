# Æterni Anima — aeterni.github.io
# The site is fully self-contained: scripts/main.js + scripts/modules/ are the
# sources, browserify builds them into scripts/bundle.js (the file the page loads).

# install dependencies (uses package-lock.json for reproducible builds):
i:
	npm ci

# build scripts/bundle.js from the sources:
b:
	npm run build

# dev loop: rebuild on change and serve through app.js (port 8080):
d:
	npm run dev

# static preview without node (port 8123; use when 8080 is busy):
serve:
	python3 -m http.server 8123 -d .

# lint the source modules:
lint:
	npm run lint

fix:
	npm run fixme

# ---- the data function (netlify/functions/data.mjs; see DATA.md)
# ~/.zshrc exports BioSynCare's NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID. The data
# function lives on renato.fabbri@'s own Netlify account instead, which is the
# CLI's saved login, so these commands drop that token and name the Æterni site.
DATA_SITE = 38c489fa-54a9-487a-9d9c-bbbeedacde26
DATA_API = https://aeterni-data.netlify.app/api/data
NETLIFY = env -u NETLIFY_AUTH_TOKEN NETLIFY_SITE_ID=$(DATA_SITE) netlify
ADMIN_KEY_FILE = $(HOME)/.config/aeterni/admin-key
BACKUPS = $(HOME)/repos/generalDataBackup/backups

# deploy the function to aeterni-data.netlify.app:
data-deploy:
	$(NETLIFY) deploy --prod

# load the database backups into the deployed function (replaces what is there):
data-seed:
	node tools/seed-data.mjs --api $(DATA_API) --key-file $(ADMIN_KEY_FILE) --backups $(BACKUPS)

# run the function locally on port 8788, with its data in .data/ (use with make serve):
data-local:
	AETERNI_DATA_DIR=.data ADMIN_KEY=local node tools/data-server.mjs

# load the backups into the local function (while make data-local runs):
data-seed-local:
	ADMIN_KEY=local node tools/seed-data.mjs --backups $(BACKUPS)

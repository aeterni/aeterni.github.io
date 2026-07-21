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

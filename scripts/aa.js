/* global wand */
// Entry of scripts/aa.bundle.js, the Algorithmic Autoregulation page (scripts/modules/aa.js).
// The small bundle (scripts/light.js) loads it for ?aa and ?ufrj, after setting up
// wand.router and naming the edition in wand.aaOptions, and index.html's head preloads
// it, so it arrives with the small bundle rather than after it.
require('./modules/aa.js').aa(wand.aaOptions || {})
wand.router.mkFooter()

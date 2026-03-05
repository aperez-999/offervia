/**
 * Wrapper so pdf-parse is always required as a child module.
 * This prevents pdf-parse's built-in debug block (which runs when
 * !module.parent and tries to read ./test/data/05-versions-space.pdf)
 * from running in Vercel serverless.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports -- CJS wrapper required so pdf-parse has module.parent
module.exports = require("pdf-parse");

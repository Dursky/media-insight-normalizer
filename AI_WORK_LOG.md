# AI work log

- **What AI helped with:** scaffolding the project (package.json, tsconfig,
  `.gitignore`), drafting the initial `RawInsightItem`/`InsightRecord` type
  shapes and the first pass of `buildInsightRecord` (dedupe-by-id, group-by-
  label, provenance array), and generating the first draft of the three
  Vitest cases and the README's run instructions.

- **What I verified or corrected:** re-checked the dedupe logic against the
  "delayed / out-of-order" requirement (the first draft compared array
  order instead of `receivedAt`, which would have kept the wrong copy on
  reordered batches); fixed a version where missing confidence defaulted to
  `0` instead of `null`, which would have misrepresented certainty
  downstream; tightened `tsconfig.json` after `noUncheckedIndexedAccess`
  produced false-positive strictness noise, and re-ran `npm test` and
  `npx tsc --noEmit` myself to confirm both are green before writing this
  log.

- **What judgment remained mine:** the scope cuts to stay inside the
  60-minute boundary (no `supersedes`/model-generation tracking, no UI/API),
  the choice of label-normalization as the merge key instead of a fuzzier
  similarity match, and the production risk / product question /
  verification framing in the README, which reflects my own read of where
  this would actually break in Violet's product.

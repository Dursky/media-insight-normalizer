# media-insight-normalizer

Normalizes asynchronous media-analysis provider results (transcript segments,
topics, phrases, people, places, objects, sentiment) into a stable
`InsightRecord` for a downstream API and product UI. Written for the Violet
AI "From Media to Trustworthy Insight" exercise (60-minute timebox).

## What's here

- `src/types.ts` - input contract (`RawProviderResult` / `RawInsightItem`)
  and output contract (`InsightRecord` / `NormalizedInsight`).
- `src/label.ts` - label normalization (trim/lowercase/collapse whitespace)
  used as the merge key.
- `src/dedupe.ts` - collapses retried/duplicate items by id.
- `src/build-insight.ts` - turns one group of raw items sharing a
  `(kind, label)` into a single `NormalizedInsight` with provenance.
- `src/normalize.ts` - `buildInsightRecord`, the orchestrator: filters by
  conversation, dedupes, groups, builds insights, sorts deterministically.
- `src/index.ts` - public exports (`types.ts` + `normalize.ts`).
- `tests/normalize.test.ts` - 3 tests: one happy path, two boundaries
  (retried duplicates, missing confidence / partial results).
- `AI_WORK_LOG.md` - what AI helped with vs. what I verified/decided.

## How to run it

Requires Node.js 18+.

```bash
npm install
npm test        # runs the 3 tests once
npm run test:watch   # optional, watch mode while iterating
npx tsc --noEmit     # optional, strict type-check
```

There is no build step, server, or UI - this is a single normalization
function plus its tests, on purpose (see Boundary below).

## Input / output contract

**Input:** one or more `RawProviderResult` batches for the same
conversation. Each batch carries a `conversationId` and a flat list of
`RawInsightItem`s (`kind`, `label`, optional `confidence`, optional
`segmentRef`, `modelVersion`, `receivedAt`). Batches may arrive out of
order, be re-delivered (same `id` twice), or come from a newer model
version reprocessing the same conversation.

**Output:** an `InsightRecord` with one `NormalizedInsight` per distinct
`(kind, normalized label)`, each carrying:

- a best-known `confidence` (`null` + `confidenceSource: "unknown"` when
  no item ever reported one - never silently defaulted to `0`),
- `occurrences` and `segmentRefs` merged across duplicates,
- a `provenance` list (source item id, model version, timestamp,
  per-item confidence) so the UI/API can show _why_ an insight exists,
- a `warnings` array on the record itself (e.g. "N duplicate item id(s)
  collapsed") instead of throwing on messy input.

## Assumptions

- A "duplicate" is a raw item redelivered with the same `id`; the most
  recently received version wins, older provenance is dropped rather than
  chained (kept simple for the timebox - see production risk below).
- Two items are the "same" insight when `kind` matches and their labels
  are equal after trimming, lowercasing, and collapsing whitespace.
- Missing `confidence` is a first-class case, not an error: it must never
  be coerced to `0`, because that would misrepresent certainty.
- Malformed/foreign-conversation batches are dropped with a warning
  rather than throwing, since this runs against an unreliable async
  provider.

## Production risk, product question, and verification (≤200 words)

**Production risk:** reprocessing is "last write wins" per raw item id.
If a newer model reprocesses a conversation with _different_ item ids
than the original pass, old and new insights merge rather than replace,
and stale low-quality labels linger indefinitely next to corrected ones.
In production this needs an explicit `supersedes`/model-generation
concept, not implicit merging by label text.

**Product question:** when a newer model changes a person/place
identification, should the product silently update the label, or show
the previous value with a "revised" indicator? For public audio/video
about real people, silently overwriting a wrong-but-published
identification is a correction users may need visibility into, not just
the system.

**Verification:** run the normalizer against a fixture corpus of real
(anonymized) provider payloads, including deliberately adversarial ones
(duplicates, blank labels, missing confidence, out-of-order timestamps),
as regression tests. In production, track the `warnings` rate per
conversation as a health metric - a spike signals provider format drift
before it reaches users - and periodically sample low-confidence,
user-facing insights (especially `person`/`place`) for human review.

## Boundary

No UI, API, auth, persistence, or cloud infrastructure is included on
purpose - this exercise is scoped to one trustworthy function and its
tests.

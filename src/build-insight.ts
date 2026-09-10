import type {NormalizedInsight, ProvenanceEntry, RawInsightItem, SegmentRef} from "./types"
import {normalizeLabel} from "./label"

function sameSegment(a: SegmentRef, b: SegmentRef): boolean {
	return a.startMs === b.startMs && a.endMs === b.endMs
}

export function buildNormalizedInsight(group: RawInsightItem[]): NormalizedInsight {
	const sortedByTime = [...group].sort(
		(a, b) => Date.parse(a.receivedAt) - Date.parse(b.receivedAt),
	)

	const displayLabel = sortedByTime[0].label.trim()
	const label = normalizeLabel(displayLabel)

	const reportedConfidences = group
		.map((item) => item.confidence)
		.filter((confidence): confidence is number => confidence !== undefined)

	const confidence = reportedConfidences.length > 0 ? Math.max(...reportedConfidences) : null

	const segmentRefs: SegmentRef[] = []
	for (const item of group) {
		if (!item.segmentRef) continue
		const alreadyPresent = segmentRefs.some((ref) => sameSegment(ref, item.segmentRef!))
		if (!alreadyPresent) segmentRefs.push(item.segmentRef)
	}

	const provenance: ProvenanceEntry[] = sortedByTime.map((item) => ({
		itemId: item.id,
		modelVersion: item.modelVersion,
		receivedAt: item.receivedAt,
		confidence: item.confidence ?? null,
	}))

	const lastUpdatedAt = sortedByTime[sortedByTime.length - 1].receivedAt

	return {
		kind: group[0].kind,
		label,
		displayLabel,
		confidence,
		confidenceSource: confidence === null ? "unknown" : "reported",
		occurrences: group.length,
		segmentRefs,
		provenance,
		lastUpdatedAt,
	}
}

export type InsightKind = "topic" | "phrase" | "person" | "place" | "object" | "sentiment"

export interface SegmentRef {
	startMs: number
	endMs: number
}

export interface RawInsightItem {
	id: string
	conversationId: string
	kind: InsightKind
	label: string
	confidence?: number
	segmentRef?: SegmentRef
	modelVersion: string
	receivedAt: string
}

export interface RawProviderResult {
	conversationId: string
	items: RawInsightItem[]
}

export interface ProvenanceEntry {
	itemId: string
	modelVersion: string
	receivedAt: string
	confidence: number | null
}

export interface NormalizedInsight {
	kind: InsightKind
	label: string
	displayLabel: string
	confidence: number | null
	confidenceSource: "reported" | "unknown"
	occurrences: number
	segmentRefs: SegmentRef[]
	provenance: ProvenanceEntry[]
	lastUpdatedAt: string
}

export interface InsightRecord {
	conversationId: string
	generatedAt: string
	insights: NormalizedInsight[]
	warnings: string[]
}

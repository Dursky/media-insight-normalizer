import type {InsightRecord, RawInsightItem, RawProviderResult} from "./types"
import {normalizeLabel} from "./label"
import {dedupeById} from "./dedupe"
import {buildNormalizedInsight} from "./build-insight"

export function buildInsightRecord(
	conversationId: string,
	batches: RawProviderResult[],
	generatedAt: string = new Date().toISOString(),
): InsightRecord {
	const warnings: string[] = []

	const rawItems = batches
		.filter((batch) => {
			const matches = batch.conversationId === conversationId
			if (!matches) {
				warnings.push(`batch for conversation "${batch.conversationId}" ignored`)
			}
			return matches
		})
		.flatMap((batch) => batch.items)

	const uniqueItems = dedupeById(rawItems, warnings)

	let missingConfidenceCount = 0
	const groups = new Map<string, RawInsightItem[]>()

	for (const item of uniqueItems) {
		if (item.confidence === undefined) {
			missingConfidenceCount += 1
		}
		const key = `${item.kind}::${normalizeLabel(item.label)}`
		const group = groups.get(key)
		if (group) {
			group.push(item)
		} else {
			groups.set(key, [item])
		}
	}

	if (missingConfidenceCount > 0) {
		warnings.push(`${missingConfidenceCount} item(s) missing confidence`)
	}

	const insights = Array.from(groups.values()).map(buildNormalizedInsight)

	insights.sort((a, b) => {
		if (a.kind !== b.kind) return a.kind.localeCompare(b.kind)
		return a.displayLabel.localeCompare(b.displayLabel)
	})

	return {
		conversationId,
		generatedAt,
		insights,
		warnings,
	}
}

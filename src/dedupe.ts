import type {RawInsightItem} from "./types"

export function dedupeById(items: RawInsightItem[], warnings: string[]): RawInsightItem[] {
	const byId = new Map<string, RawInsightItem>()
	let duplicateCount = 0

	for (const item of items) {
		const existing = byId.get(item.id)
		if (!existing) {
			byId.set(item.id, item)
			continue
		}
		duplicateCount += 1
		const existingTime = Date.parse(existing.receivedAt)
		const itemTime = Date.parse(item.receivedAt)
		if (!Number.isNaN(itemTime) && itemTime >= existingTime) {
			byId.set(item.id, item)
		}
	}

	if (duplicateCount > 0) {
		warnings.push(`${duplicateCount} duplicate item id(s) collapsed`)
	}

	return Array.from(byId.values())
}

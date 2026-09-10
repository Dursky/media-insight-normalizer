import {describe, expect, it} from "vitest"
import {buildInsightRecord} from "../src/normalize"
import type {RawProviderResult} from "../src/types"

const CONVERSATION_ID = "conv-123"

function batch(items: RawProviderResult["items"]): RawProviderResult {
	return {conversationId: CONVERSATION_ID, items}
}

describe("buildInsightRecord", () => {
	it("normalizes a clean batch into stable, sorted insights with provenance", () => {
		const result = buildInsightRecord(CONVERSATION_ID, [
			batch([
				{
					id: "item-1",
					conversationId: CONVERSATION_ID,
					kind: "topic",
					label: "Home Security",
					confidence: 0.82,
					modelVersion: "nlp-2.0",
					receivedAt: "2026-09-01T10:00:00.000Z",
				},
				{
					id: "item-2",
					conversationId: CONVERSATION_ID,
					kind: "person",
					label: "Alex Rivera",
					confidence: 0.91,
					segmentRef: {startMs: 1000, endMs: 4000},
					modelVersion: "vision-1.4",
					receivedAt: "2026-09-01T10:00:01.000Z",
				},
			]),
		])

		expect(result.conversationId).toBe(CONVERSATION_ID)
		expect(result.warnings).toEqual([])
		expect(result.insights).toHaveLength(2)

		const person = result.insights.find((insight) => insight.kind === "person")
		expect(person?.displayLabel).toBe("Alex Rivera")
		expect(person?.confidence).toBeCloseTo(0.91)
		expect(person?.confidenceSource).toBe("reported")
		expect(person?.occurrences).toBe(1)
		expect(person?.provenance).toEqual([
			{
				itemId: "item-2",
				modelVersion: "vision-1.4",
				receivedAt: "2026-09-01T10:00:01.000Z",
				confidence: 0.91,
			},
		])
	})

	it("collapses a retried duplicate item instead of double-counting it", () => {
		const duplicateDelivery = {
			id: "item-1",
			conversationId: CONVERSATION_ID,
			kind: "topic" as const,
			label: "Home Security",
			confidence: 0.7,
			modelVersion: "nlp-2.0",
			receivedAt: "2026-09-01T10:00:00.000Z",
		}

		const result = buildInsightRecord(CONVERSATION_ID, [
			batch([duplicateDelivery]),
			batch([{...duplicateDelivery, receivedAt: "2026-09-01T10:00:05.000Z"}]),
		])

		expect(result.insights).toHaveLength(1)
		expect(result.insights[0].occurrences).toBe(1)
		expect(result.insights[0].provenance).toHaveLength(1)
		expect(result.warnings).toContain("1 duplicate item id(s) collapsed")
	})

	it("handles partial results with missing confidence without crashing or defaulting to zero", () => {
		const result = buildInsightRecord(CONVERSATION_ID, [
			batch([
				{
					id: "item-1",
					conversationId: CONVERSATION_ID,
					kind: "object",
					label: "Front Door Camera",
					modelVersion: "vision-1.4",
					receivedAt: "2026-09-01T10:00:00.000Z",
				},
				{
					id: "item-2",
					conversationId: CONVERSATION_ID,
					kind: "object",
					label: "front door camera",
					modelVersion: "vision-1.5",
					receivedAt: "2026-09-01T10:00:02.000Z",
				},
			]),
		])

		expect(result.insights).toHaveLength(1)
		const insight = result.insights[0]
		expect(insight.occurrences).toBe(2)
		expect(insight.confidence).toBeNull()
		expect(insight.confidenceSource).toBe("unknown")
		expect(result.warnings).toContain("2 item(s) missing confidence")
	})
})

export function normalizeLabel(label: string): string {
	return label.trim().toLowerCase().replace(/\s+/g, " ")
}

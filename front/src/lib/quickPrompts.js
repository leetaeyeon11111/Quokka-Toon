const MAX_PROMPTS = 5
const MAX_LABEL_LENGTH = 40
const MAX_QUERY_LENGTH = 200

export function normalizeQuickPrompts(prompts) {
  if (!Array.isArray(prompts)) return []

  const seenQueries = new Set()
  const normalized = []

  for (const prompt of prompts) {
    const label = typeof prompt?.label === 'string' ? prompt.label.trim() : ''
    const query = typeof prompt?.query === 'string' ? prompt.query.trim() : ''
    if (
      !label ||
      !query ||
      label.length > MAX_LABEL_LENGTH ||
      query.length > MAX_QUERY_LENGTH ||
      seenQueries.has(query)
    ) {
      continue
    }

    seenQueries.add(query)
    normalized.push({ ...prompt, label, query })
    if (normalized.length === MAX_PROMPTS) break
  }

  return normalized
}

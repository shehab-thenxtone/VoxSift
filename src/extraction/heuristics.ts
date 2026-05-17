/** Heuristic scoring for DOM nodes — positive signals boost, negative signals penalize. */

const POSITIVE_TAGS = new Set(['article', 'main', 'section', 'p', 'blockquote'])
const NEGATIVE_TAGS = new Set(['nav', 'header', 'footer', 'aside', 'form', 'iframe'])
const NEGATIVE_KEYWORDS = /comment|sidebar|footer|nav|menu|widget|ad|promo|banner/i

export interface HeuristicScore {
  node: Element
  score: number
}

function textDensity(el: Element): number {
  const text = el.textContent?.trim() ?? ''
  const links = el.querySelectorAll('a')
  const linkText = Array.from(links).map((a) => a.textContent ?? '').join('')
  if (text.length === 0) return 0
  return 1 - linkText.length / text.length
}

export function scoreNode(el: Element): number {
  let score = 0
  const tag = el.tagName.toLowerCase()
  const classId = `${el.className} ${el.id}`.toLowerCase()

  if (POSITIVE_TAGS.has(tag)) score += 25
  if (NEGATIVE_TAGS.has(tag)) score -= 25
  if (NEGATIVE_KEYWORDS.test(classId)) score -= 25

  const text = el.textContent?.trim() ?? ''
  const paragraphs = el.querySelectorAll('p')

  score += Math.min(text.length / 100, 10)
  score += paragraphs.length * 3
  score += textDensity(el) * 20

  const links = el.querySelectorAll('a')
  if (links.length > 10) score -= links.length * 0.5

  return score
}

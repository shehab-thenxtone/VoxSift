import DOMPurify from 'dompurify'

const ALLOWED_TAGS = [
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'pre', 'code',
  'ul', 'ol', 'li',
  'strong', 'em', 'b', 'i', 'mark',
  'a', 'br', 'hr',
  'figure', 'figcaption', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'article', 'section', 'div', 'span',
]

const ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'class', 'id']

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    RETURN_DOM: false,
  })
}

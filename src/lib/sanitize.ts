import DOMPurify from 'dompurify'

const ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'a']
const ALLOWED_ATTR = ['href', 'target', 'rel']

let hooked = false

function ensureHook() {
  if (hooked) return
  hooked = true
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (!(node instanceof Element) || node.tagName !== 'A') return
    const href = node.getAttribute('href') ?? ''
    if (!/^https:\/\/[^\s<>"']+$/i.test(href)) {
      node.removeAttribute('href')
    }
    node.setAttribute('rel', 'noopener noreferrer')
    node.setAttribute('target', '_blank')
  })
}

export function sanitizeHtml(value: string): string {
  ensureHook()
  return String(
    DOMPurify.sanitize(value, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'img', 'svg', 'math'],
      FORBID_CONTENTS: ['script', 'style'],
    }),
  )
}

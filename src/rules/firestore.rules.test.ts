import { describe, expect, it } from 'vitest'
import rules from '../../firestore.rules?raw'

const editions = rules.slice(rules.indexOf('match /editions/'), rules.indexOf('match /categories/'))

describe('firestore edition rules', () => {
  it('lets the public read published editions and nothing else', () => {
    expect(editions).toContain("allow get: if resource.data.status == 'published' || isAdmin()")
    expect(editions).toContain("allow list: if isAdmin() || resource.data.status == 'published'")
  })

  it('refuses create, update, and delete unless the caller is an admin', () => {
    expect(editions).toContain('allow create: if isAdmin()')
    expect(editions).toContain('allow update: if isAdmin()')
    expect(editions).toContain('allow delete: if isAdmin()')
    expect(editions).not.toMatch(/allow (?:create|update|delete)(?:,\s*(?:create|update|delete))*: if true/)
  })

  it('stores a short media URL instead of PDF bytes', () => {
    expect(rules).toContain('url.size() <= 2000')
    expect(rules).toContain("url.matches('^https://.+')")
    expect(rules).toContain('validMediaUrl(data.pdfUrl)')
    expect(rules).toContain('validMediaUrl(data.coverImageUrl)')
    expect(rules).toContain('data.seoTitle.size() <= 70')
    expect(rules).toContain('data.seoDescription.size() <= 160')
    expect(rules).not.toContain('firebase.storage')
  })

  it('keeps admin documents closed to client writes', () => {
    const admins = rules.slice(rules.indexOf('match /admins/'), rules.indexOf('match /settings/'))
    expect(admins).toContain('allow create, update, delete: if false')
  })
})

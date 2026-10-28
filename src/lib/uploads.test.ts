import { describe, expect, it } from 'vitest'
import { PDF_MAX_BYTES, secureUploadsConfigured, validatePdfFile } from './uploads.ts'

describe('pdf upload checks', () => {
  it('uses the external signer instead of a secret in the browser', () => {
    expect(secureUploadsConfigured()).toBe(true)
  })

  it('accepts a modest PDF and rejects other types and oversized files', () => {
    expect(validatePdfFile({ name: 'issue-1284.pdf', type: 'application/pdf', size: 1200 })).toBeNull()
    expect(validatePdfFile({ name: 'cover.jpg', type: 'image/jpeg', size: 1200 })).toBeTruthy()
    expect(validatePdfFile({ name: 'issue.pdf', type: 'text/plain', size: 1200 })).toBeTruthy()
    expect(validatePdfFile({ name: 'issue.pdf', type: 'application/pdf', size: PDF_MAX_BYTES + 1 })).toBeTruthy()
    expect(validatePdfFile({ name: 'empty.pdf', type: 'application/pdf', size: 0 })).toBeTruthy()
  })
})

import { describe, expect, it } from 'vitest'
import {
  ARCHIVE_RESOURCE_FALLBACK,
  CLOUDINARY_CLOUD_NAME,
  cloudinaryFormFields,
  cloudinaryUploadUrl,
  coverThumbnail,
  parseUploadSignature,
  validateImageFile,
  IMAGE_MAX_BYTES,
} from './cloudinary.ts'

const signaturePayload = {
  signature: 'abc123signature',
  timestamp: 1700000000,
  upload_preset: 'alshasha_images',
  api_key: '123456789012345',
  cloud_name: CLOUDINARY_CLOUD_NAME,
  params: {
    timestamp: 1700000000,
    upload_preset: 'alshasha_images',
    folder: 'articles',
  },
}

describe('cloudinary signature', () => {
  it('keeps the signed fields identical to the signer response', () => {
    const signature = parseUploadSignature(signaturePayload, 'image')
    expect(cloudinaryUploadUrl(signature)).toBe(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`)
    expect(cloudinaryFormFields(signature)).toEqual({
      timestamp: '1700000000',
      upload_preset: 'alshasha_images',
      folder: 'articles',
      api_key: '123456789012345',
      signature: 'abc123signature',
    })
  })

  it('uses a signer resource type for a PDF and otherwise keeps the original file', () => {
    const stated = parseUploadSignature(
      {
        ...signaturePayload,
        upload_preset: 'alshasha_archive',
        resource_type: 'image',
        params: { timestamp: 1700000000, upload_preset: 'alshasha_archive' },
      },
      'archive',
    )
    expect(stated.resourceType).toBe('image')
    const fallback = parseUploadSignature(
      {
        ...signaturePayload,
        upload_preset: 'alshasha_archive',
        params: { timestamp: 1700000000, upload_preset: 'alshasha_archive' },
      },
      'archive',
    )
    expect(fallback.resourceType).toBe(ARCHIVE_RESOURCE_FALLBACK)
    expect(cloudinaryUploadUrl(fallback)).toBe(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`)
  })

  it('accepts the signer fields when they use camel case', () => {
    const signature = parseUploadSignature(
      {
        signature: 'abc123signature',
        timestamp: '1700000000',
        uploadPreset: 'alshasha_archive',
        apiKey: '123456789012345',
        cloudName: CLOUDINARY_CLOUD_NAME,
        resourceType: 'raw',
      },
      'archive',
    )
    expect(cloudinaryFormFields(signature)).toEqual({
      timestamp: '1700000000',
      upload_preset: 'alshasha_archive',
      api_key: '123456789012345',
      signature: 'abc123signature',
    })
    expect(signature.resourceType).toBe('raw')
  })

  it('rejects a mismatched preset, cloud, or signed timestamp', () => {
    expect(() => parseUploadSignature({ ...signaturePayload, cloud_name: 'other-cloud' }, 'image')).toThrow()
    expect(() => parseUploadSignature({ ...signaturePayload, upload_preset: 'alshasha_archive' }, 'image')).toThrow()
    expect(() =>
      parseUploadSignature(
        {
          ...signaturePayload,
          params: { timestamp: 1700000001, upload_preset: 'alshasha_images' },
        },
        'image',
      ),
    ).toThrow()
  })
})

describe('cover thumbnails', () => {
  it('adds a limited Cloudinary transform and leaves other urls unchanged', () => {
    const original = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1/covers/issue.jpg`
    expect(coverThumbnail(original)).toBe(
      `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto,w_480,c_limit/v1/covers/issue.jpg`,
    )
    expect(coverThumbnail('/demo/covers/1284.svg')).toBe('/demo/covers/1284.svg')
    expect(coverThumbnail(`https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/raw/upload/v1/issues/paper.pdf`)).toContain('/raw/upload/')
  })
})

describe('image file checks', () => {
  it('accepts a modest jpeg and rejects other types and oversized files', () => {
    expect(validateImageFile({ name: 'cover.jpg', type: 'image/jpeg', size: 2048 })).toBeNull()
    expect(validateImageFile({ name: 'cover.webp', type: 'image/webp', size: 2048 })).toBeNull()
    expect(validateImageFile({ name: 'issue.pdf', type: 'application/pdf', size: 2048 })).toBeTruthy()
    expect(validateImageFile({ name: 'icon.svg', type: 'image/svg+xml', size: 2048 })).toBeTruthy()
    expect(validateImageFile({ name: 'cover.jpg', type: 'image/jpeg', size: IMAGE_MAX_BYTES + 1 })).toBeTruthy()
  })
})

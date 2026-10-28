import { useState } from 'react'
import { uploadCloudinaryFile, type UploadType, type UploadedAsset } from '../lib/cloudinary.ts'
import { toMessage } from '../lib/errors.ts'
import { Field, TextInput } from './ui.tsx'

export function CloudinaryUpload({
  label,
  hint,
  type,
  onUploaded,
}: {
  label: string
  hint: string
  type: UploadType
  onUploaded: (asset: UploadedAsset) => void
}) {
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <Field label={label} hint={hint} error={error ?? undefined}>
      <TextInput
        type="file"
        accept={type === 'image' ? 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp' : 'application/pdf,.pdf'}
        disabled={progress !== null}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (!file) return
          setError(null)
          setProgress(0)
          void uploadCloudinaryFile(file, type, setProgress)
            .then((asset) => {
              onUploaded(asset)
              setProgress(null)
            })
            .catch((reason: unknown) => {
              setError(toMessage(reason))
              setProgress(null)
            })
        }}
      />
      {progress !== null ? (
        <div className="mt-2">
          <p className="text-sm font-bold text-brand-green" role="status">
            جارٍ الرفع… {progress}٪
          </p>
          <div className="mt-1 h-1.5 bg-brand-line" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-brand-green" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}
    </Field>
  )
}

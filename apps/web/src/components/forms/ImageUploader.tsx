'use client'

import { ImagePlus, X } from 'lucide-react'
import { thumbUrl } from '@/lib/images'

export type ImageItem =
  | { key: string; kind: 'remote'; id: string; url: string }
  | { key: string; kind: 'local'; file: File; preview: string; status: 'queued' | 'uploading' | 'error'; progress: number; error?: string }

export function ImageUploader({
  items,
  max,
  disabled,
  error,
  onAdd,
  onRemove,
}: {
  items: ImageItem[]
  max: number
  disabled?: boolean
  error?: string | null
  onAdd: (files: File[]) => void
  onRemove: (key: string) => void
}) {
  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-slate-700">
        Photos ({items.length}/{max})
      </span>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <li key={item.key} className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.kind === 'remote' ? thumbUrl(item.url, 300) : item.preview} alt="" className="h-full w-full object-cover" />
            {item.kind === 'local' && item.status === 'uploading' ? (
              <div className="absolute inset-x-0 bottom-0 bg-white/90 p-1">
                <div className="h-1.5 rounded bg-slate-200">
                  <div className="h-1.5 rounded bg-brand-purple" style={{ width: `${item.progress}%` }} />
                </div>
              </div>
            ) : null}
            {item.kind === 'local' && item.status === 'error' ? (
              <p className="absolute inset-x-0 bottom-0 bg-red-600/90 p-1 text-xs text-white">{item.error ?? 'Upload failed'}</p>
            ) : null}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRemove(item.key)}
              aria-label="Remove photo"
              className="absolute right-1 top-1 rounded-full bg-white/90 p-1 hover:bg-white disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
        {items.length < max ? (
          <li>
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-sm text-slate-500 focus-within:ring-2 focus-within:ring-brand-purple hover:border-brand-purple">
              <ImagePlus className="h-6 w-6" aria-hidden="true" />
              Add photos
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={disabled}
                className="sr-only"
                onChange={(event) => {
                  if (event.target.files) onAdd(Array.from(event.target.files))
                  event.target.value = ''
                }}
              />
            </label>
          </li>
        ) : null}
      </ul>
      {error ? <p role="alert" className="text-xs text-red-600">{error}</p> : null}
      <p className="text-xs text-slate-500">
        JPEG, PNG or WebP. Photos are resized on your device before upload, which also removes location data.
      </p>
    </div>
  )
}
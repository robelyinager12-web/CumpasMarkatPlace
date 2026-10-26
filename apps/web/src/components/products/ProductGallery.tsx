'use client'

import { useState } from 'react'
import { thumbUrl } from '@/lib/images'
import { cn } from '@/lib/utils'
import type { ProductImage } from '@/types/product'

export function ProductGallery({ images, title }: { images: ProductImage[]; title: string }) {
  const [active, setActive] = useState(0)

  if (images.length === 0) {
    return <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-slate-100 text-slate-600">No photos yet</div>
  }

  return (
    <div className="space-y-3">
      <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumbUrl(images[active].url, 1000)} alt={title} className="h-full w-full object-contain" />
      </div>
      {images.length > 1 ? (
        <ul className="grid grid-cols-5 gap-2">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show photo ${index + 1}`}
                aria-current={index === active}
                className={cn('aspect-square w-full overflow-hidden rounded-xl border-2', index === active ? 'border-brand-purple' : 'border-transparent')}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbUrl(image.url, 200)} alt="" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
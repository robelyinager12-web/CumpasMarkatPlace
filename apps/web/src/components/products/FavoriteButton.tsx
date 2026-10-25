'use client'

import { useMutation } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { addFavorite, removeFavorite } from '@/services/favorites.service'

export function FavoriteButton({ productId, initial, className }: { productId: string; initial: boolean; className?: string }) {
  const router = useRouter()
  const { user } = useAuth()
  const [favorite, setFavorite] = useState(initial)

  const mutation = useMutation({
    mutationFn: (next: boolean) => (next ? addFavorite(productId) : removeFavorite(productId)),
    onMutate: (next) => setFavorite(next),
    onError: (_error, next) => setFavorite(!next), // roll back
  })

  function toggle() {
    if (!user) {
      router.push(`/auth/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`)
      return
    }
    mutation.mutate(!favorite)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={favorite}
      aria-label={favorite ? 'Remove from favorites' : 'Save to favorites'}
      className={cn('rounded-full bg-white/90 p-2 shadow-sm transition hover:bg-white', className)}
    >
      <Heart className={cn('h-5 w-5', favorite ? 'fill-red-500 text-red-500' : 'text-slate-600')} />
    </button>
  )
}
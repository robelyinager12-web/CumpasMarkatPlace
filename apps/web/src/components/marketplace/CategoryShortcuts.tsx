import {
  BedDouble,
  BookOpen,
  Calculator,
  Dumbbell,
  Laptop,
  Package,
  Pencil,
  Shirt,
  ShoppingBag,
  Smartphone,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import type { Category } from '@/types/product'

function iconFor(name: string): LucideIcon {
  const value = name.toLowerCase()
  if (value.includes('textbook')) return BookOpen
  if (value.includes('laptop')) return Laptop
  if (value.includes('electronic')) return Smartphone
  if (value.includes('clothing')) return Shirt
  if (value.includes('shoes') || value.includes('bags')) return ShoppingBag
  if (value.includes('stationery')) return Pencil
  if (value.includes('calculator')) return Calculator
  if (value.includes('dorm')) return BedDouble
  if (value.includes('sports')) return Dumbbell
  return Package
}

export function CategoryShortcuts({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {categories.map((category) => {
        const Icon = iconFor(category.name)
        return (
          <li key={category.id}>
            <Link
              href={`/marketplace?category=${encodeURIComponent(category.slug)}`}
              className="flex h-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium hover:border-brand-purple hover:shadow-sm"
            >
              <Icon className="h-5 w-5 shrink-0 text-brand-purple" aria-hidden="true" />
              <span>{category.name}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
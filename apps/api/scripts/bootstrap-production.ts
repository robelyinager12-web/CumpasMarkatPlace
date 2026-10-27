import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

// Creates what a brand-new production database needs: the 10 standard categories, your pilot university and its campuses.
// Safe to run twice. It never creates demo listings or accounts.
const CATEGORIES = [
  'Textbooks and educational materials',
  'Electronics and accessories',
  'Laptops and computer accessories',
  'Clothing and fashion',
  'Shoes and bags',
  'Stationery and school supplies',
  'Calculators and study equipment',
  'Dormitory and room essentials',
  'Sports and fitness equipment',
  'Other student essentials',
]

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const clean = (value: string) => value.replace(/\p{Cc}/gu, ' ').replace(/\s+/g, ' ').trim()

function usage(message?: string): never {
  if (message) console.error(`Error: ${message}\n`)
  console.error(
    'Usage: pnpm --filter @unikamp/api bootstrap --university "Name" [--city "City"] --campus "Campus name" [--campus "Another"] [--yes]',
  )
  console.error('Without --yes it only shows what it would do.')
  process.exit(1)
}

function readArgs(argv: string[]) {
  let university = ''
  let city = ''
  let confirmed = false
  const campuses: string[] = []

  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i]
    const takeValue = () => {
      const value = argv[++i]
      if (value === undefined) usage(`${flag} needs a value`)
      return clean(value)
    }
    if (flag === '--university') university = takeValue()
    else if (flag === '--city') city = takeValue()
    else if (flag === '--campus') campuses.push(takeValue())
    else if (flag === '--yes') confirmed = true
    else usage(`Unknown option ${flag}`)
  }

  if (university.length < 2 || university.length > 120) usage('--university is required (2 to 120 characters)')
  if (campuses.length === 0) usage('give at least one --campus')
  if (campuses.some((name) => name.length < 2 || name.length > 80)) usage('campus names must be 2 to 80 characters')
  if (city.length > 80) usage('--city is too long')
  return { university, city, campuses: [...new Set(campuses)], confirmed }
}

const { university, city, campuses, confirmed } = readArgs(process.argv.slice(2))

const databaseHost = (() => {
  try {
    return new URL(process.env.DATABASE_URL ?? '').host
  } catch {
    return '(DATABASE_URL is missing or not valid)'
  }
})()

console.log(`Database:   ${databaseHost}`)
console.log(`University: ${university}${city ? ` (${city})` : ''}`)
console.log(`Campuses:   ${campuses.join(', ')}`)
console.log(`Categories: the ${CATEGORIES.length} standard ones (existing ones are left exactly as they are)`)

if (!confirmed) {
  console.log('\nNothing was changed. Check the database host above, then run again with --yes to apply.')
  process.exit(0)
}

const prisma = new PrismaClient()

try {
  await prisma.$transaction(async (tx) => {
    for (const [index, name] of CATEGORIES.entries()) {
      await tx.category.upsert({
        where: { slug: slugify(name) },
        update: {}, // never overwrite what an administrator changed
        create: { name, slug: slugify(name), sortOrder: index },
      })
    }

    const record = await tx.university.upsert({
      where: { name: university },
      update: { isActive: true, ...(city ? { city } : {}) },
      create: { name: university, city: city || null, isActive: true },
    })
    for (const campusName of campuses) {
      await tx.campus.upsert({
        where: { universityId_name: { universityId: record.id, name: campusName } },
        update: {},
        create: { name: campusName, universityId: record.id },
      })
    }
  })

  const [categories, activeUniversities, totalCampuses] = await Promise.all([
    prisma.category.count({ where: { isActive: true } }),
    prisma.university.count({ where: { isActive: true } }),
    prisma.campus.count(),
  ])
  console.log(`\nDone. The database now has ${categories} active categories, ${activeUniversities} active universities and ${totalCampuses} campuses.`)
} finally {
  await prisma.$disconnect()
}
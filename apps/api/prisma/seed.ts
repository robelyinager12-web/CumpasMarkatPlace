import 'dotenv/config'
import { PrismaClient, ProductCondition } from '@prisma/client'

const prisma = new PrismaClient()

// TODO: set your pilot university and its real campuses before launch.
const PILOT_UNIVERSITY = 'Addis Ababa University'

const UNIVERSITIES = [
  { name: 'Addis Ababa University', city: 'Addis Ababa', campuses: ['Main Campus'] },
  { name: 'Bahir Dar University', city: 'Bahir Dar', campuses: ['Main Campus'] },
  { name: 'University of Gondar', city: 'Gondar', campuses: ['Main Campus'] },
  { name: 'Jimma University', city: 'Jimma', campuses: ['Main Campus'] },
  { name: 'Hawassa University', city: 'Hawassa', campuses: ['Main Campus'] },
  { name: 'Mekelle University', city: 'Mekelle', campuses: ['Main Campus'] },
]

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

const DEMO_LISTINGS = [
  { title: '[DEMO] Calculus textbook, 9th edition', price: 450, category: CATEGORIES[0], condition: ProductCondition.GOOD },
  { title: '[DEMO] Scientific calculator', price: 600, category: CATEGORIES[6], condition: ProductCondition.LIKE_NEW },
  { title: '[DEMO] Laptop backpack', price: 900, category: CATEGORIES[4], condition: ProductCondition.GOOD },
  { title: '[DEMO] Desk lamp for dorm room', price: 350, category: CATEGORIES[7], condition: ProductCondition.NEW },
  { title: '[DEMO] Wired headphones', price: 500, category: CATEGORIES[1], condition: ProductCondition.FAIR },
  { title: '[DEMO] Notebook and pen bundle', price: 150, category: CATEGORIES[5], condition: ProductCondition.NEW },
]

const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

async function seedReferenceData() {
  for (const [index, name] of CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: { name, sortOrder: index },
      create: { name, slug: slugify(name), sortOrder: index },
    })
  }

  for (const item of UNIVERSITIES) {
    const isActive = item.name === PILOT_UNIVERSITY
    const university = await prisma.university.upsert({
      where: { name: item.name },
      update: { city: item.city, isActive },
      create: { name: item.name, city: item.city, isActive },
    })
    for (const campusName of item.campuses) {
      await prisma.campus.upsert({
        where: { universityId_name: { universityId: university.id, name: campusName } },
        update: {},
        create: { name: campusName, universityId: university.id },
      })
    }
  }
}

// Demo data is clearly flagged (isDemo = true) and is NEVER seeded in production.
async function seedDemoListings() {
  const university = await prisma.university.findUnique({
    where: { name: PILOT_UNIVERSITY },
    include: { campuses: true },
  })
  if (!university) return
  const campusId = university.campuses[0]?.id

  const seller = await prisma.user.upsert({
    where: { email: 'demo.seller@example.com' },
    update: {},
    create: {
      fullName: 'Demo Seller',
      email: 'demo.seller@example.com',
      passwordHash: '!demo-account-cannot-log-in', // not a valid hash: nobody can sign in as this user
      universityId: university.id,
      campusId,
    },
  })

  for (const item of DEMO_LISTINGS) {
    const category = await prisma.category.findUnique({ where: { slug: slugify(item.category) } })
    if (!category) continue
    const exists = await prisma.product.findFirst({ where: { title: item.title, isDemo: true } })
    if (exists) continue

    await prisma.product.create({
      data: {
        title: item.title,
        description: 'Demo listing for local development only.',
        priceEtb: item.price,
        condition: item.condition,
        isDemo: true,
        sellerId: seller.id,
        categoryId: category.id,
        universityId: university.id,
        campusId,
        images: { create: [{ url: 'https://placehold.co/600x400?text=Demo', position: 0 }] },
      },
    })
  }
}

async function main() {
  await seedReferenceData()
  if (process.env.NODE_ENV !== 'production') await seedDemoListings()
  console.log('Seed complete.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
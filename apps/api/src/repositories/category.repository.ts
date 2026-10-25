import { prisma } from '../config/database.js'

export const categoryRepository = {
  listActive: () =>
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, slug: true },
    }),
  findActiveById: (id: string) => prisma.category.findFirst({ where: { id, isActive: true } }),
}
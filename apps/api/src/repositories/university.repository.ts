import { prisma } from '../config/database.js'

export const universityRepository = {
  listActive: () =>
    prisma.university.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, city: true },
    }),
  findActiveById: (id: string) => prisma.university.findFirst({ where: { id, isActive: true } }),
  listCampuses: (universityId: string) =>
    prisma.campus.findMany({
      where: { universityId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  findCampus: (id: string) => prisma.campus.findUnique({ where: { id } }),
}
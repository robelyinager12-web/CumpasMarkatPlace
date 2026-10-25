import { prisma } from '../config/database.js'
import { ApiError } from '../utils/api-error.js'
import { isUniqueViolation } from '../utils/prisma-errors.js'
import type { CreateUniversityInput, UpdateUniversityInput } from '../validators/admin.validator.js'
import { auditService } from './audit.service.js'

const universityNameTaken = () => ApiError.conflict('A university with this name already exists')
const campusNameTaken = () => ApiError.conflict('This university already has a campus with that name')

export const adminUniversitiesService = {
  async list() {
    const rows = await prisma.university.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { users: true, products: true } },
        campuses: {
          orderBy: { name: 'asc' },
          include: { _count: { select: { users: true, products: true } } },
        },
      },
    })
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      city: row.city,
      isActive: row.isActive,
      users: row._count.users,
      listings: row._count.products,
      campuses: row.campuses.map((campus) => ({
        id: campus.id,
        name: campus.name,
        users: campus._count.users,
        listings: campus._count.products,
      })),
    }))
  },

  async create(adminId: string, input: CreateUniversityInput) {
    try {
      return await prisma.$transaction(async (tx) => {
        const university = await tx.university.create({
          data: { name: input.name, city: input.city || null, isActive: input.isActive },
          select: { id: true, name: true, city: true, isActive: true },
        })
        await auditService.record(tx, {
          actorId: adminId,
          action: 'university.created',
          entityType: 'University',
          entityId: university.id,
          metadata: { name: university.name },
        })
        return { ...university, users: 0, listings: 0, campuses: [] }
      })
    } catch (error) {
      if (isUniqueViolation(error)) throw universityNameTaken()
      throw error
    }
  },

  async update(adminId: string, id: string, input: UpdateUniversityInput) {
    if (!(await prisma.university.findUnique({ where: { id }, select: { id: true } }))) {
      throw ApiError.notFound('University not found')
    }
    try {
      await prisma.$transaction([
        prisma.university.update({
          where: { id },
          data: {
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.city !== undefined ? { city: input.city || null } : {}),
            ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          },
        }),
        auditService.create({
          actorId: adminId,
          action: 'university.updated',
          entityType: 'University',
          entityId: id,
          metadata: { changes: input },
        }),
      ])
    } catch (error) {
      if (isUniqueViolation(error)) throw universityNameTaken()
      throw error
    }
    return { id }
  },

  async remove(adminId: string, id: string) {
    const university = await prisma.university.findUnique({
      where: { id },
      include: { _count: { select: { users: true, products: true } } },
    })
    if (!university) throw ApiError.notFound('University not found')
    if (university._count.users > 0 || university._count.products > 0) {
      throw ApiError.conflict(
        `This university has ${university._count.users} user(s) and ${university._count.products} listing(s). Deactivate it instead of deleting it.`,
      )
    }
    await prisma.$transaction([
      prisma.campus.deleteMany({ where: { universityId: id } }),
      prisma.university.delete({ where: { id } }),
      auditService.create({
        actorId: adminId,
        action: 'university.deleted',
        entityType: 'University',
        entityId: id,
        metadata: { name: university.name },
      }),
    ])
  },

  async addCampus(adminId: string, universityId: string, name: string) {
    if (!(await prisma.university.findUnique({ where: { id: universityId }, select: { id: true } }))) {
      throw ApiError.notFound('University not found')
    }
    try {
      return await prisma.$transaction(async (tx) => {
        const campus = await tx.campus.create({ data: { name, universityId }, select: { id: true, name: true } })
        await auditService.record(tx, {
          actorId: adminId,
          action: 'campus.created',
          entityType: 'Campus',
          entityId: campus.id,
          metadata: { name, universityId },
        })
        return { ...campus, users: 0, listings: 0 }
      })
    } catch (error) {
      if (isUniqueViolation(error)) throw campusNameTaken()
      throw error
    }
  },

  async renameCampus(adminId: string, id: string, name: string) {
    if (!(await prisma.campus.findUnique({ where: { id }, select: { id: true } }))) {
      throw ApiError.notFound('Campus not found')
    }
    try {
      await prisma.$transaction([
        prisma.campus.update({ where: { id }, data: { name } }),
        auditService.create({
          actorId: adminId,
          action: 'campus.updated',
          entityType: 'Campus',
          entityId: id,
          metadata: { name },
        }),
      ])
    } catch (error) {
      if (isUniqueViolation(error)) throw campusNameTaken()
      throw error
    }
    return { id }
  },

  async removeCampus(adminId: string, id: string) {
    const campus = await prisma.campus.findUnique({
      where: { id },
      include: { _count: { select: { users: true, products: true } } },
    })
    if (!campus) throw ApiError.notFound('Campus not found')
    if (campus._count.users > 0 || campus._count.products > 0) {
      throw ApiError.conflict('People or listings are still linked to this campus, so it cannot be deleted.')
    }
    await prisma.$transaction([
      prisma.campus.delete({ where: { id } }),
      auditService.create({
        actorId: adminId,
        action: 'campus.deleted',
        entityType: 'Campus',
        entityId: id,
        metadata: { name: campus.name },
      }),
    ])
  },
}
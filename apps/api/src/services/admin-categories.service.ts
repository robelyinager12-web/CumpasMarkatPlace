import { prisma } from '../config/database.js'
import { ApiError } from '../utils/api-error.js'
import { isForeignKeyViolation, isUniqueViolation } from '../utils/prisma-errors.js'
import { slugify } from '../utils/slug.js'
import type { CreateCategoryInput, UpdateCategoryInput } from '../validators/admin.validator.js'
import { auditService } from './audit.service.js'

const ORDER = [{ sortOrder: 'asc' as const }, { name: 'asc' as const }, { id: 'asc' as const }]

const duplicate = () => ApiError.conflict('A category with this name or slug already exists')

export const adminCategoriesService = {
  async list() {
    const rows = await prisma.category.findMany({ orderBy: ORDER, include: { _count: { select: { products: true } } } })
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      listings: row._count.products,
    }))
  },

  async create(adminId: string, input: CreateCategoryInput) {
    const slug = input.slug ?? slugify(input.name)
    if (!slug) throw ApiError.badRequest('Add a slug (letters, numbers and dashes) for this name')

    try {
      return await prisma.$transaction(async (tx) => {
        const max = await tx.category.aggregate({ _max: { sortOrder: true } })
        const category = await tx.category.create({
          data: { name: input.name, slug, sortOrder: (max._max.sortOrder ?? -1) + 1 },
          select: { id: true, name: true, slug: true, sortOrder: true, isActive: true },
        })
        await auditService.record(tx, {
          actorId: adminId,
          action: 'category.created',
          entityType: 'Category',
          entityId: category.id,
          metadata: { name: category.name, slug: category.slug },
        })
        return { ...category, listings: 0 }
      })
    } catch (error) {
      if (isUniqueViolation(error)) throw duplicate()
      throw error
    }
  },

  async update(adminId: string, id: string, input: UpdateCategoryInput) {
    if (!(await prisma.category.findUnique({ where: { id }, select: { id: true } }))) {
      throw ApiError.notFound('Category not found')
    }
    try {
      await prisma.$transaction([
        prisma.category.update({
          where: { id },
          data: {
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.slug !== undefined ? { slug: input.slug } : {}),
            ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          },
        }),
        auditService.create({
          actorId: adminId,
          action: 'category.updated',
          entityType: 'Category',
          entityId: id,
          metadata: { changes: input },
        }),
      ])
    } catch (error) {
      if (isUniqueViolation(error)) throw duplicate()
      throw error
    }
    return { id }
  },

  // Moves one step and rewrites every position, which also repairs any ties
  async move(adminId: string, id: string, direction: 'up' | 'down') {
    const all = await prisma.category.findMany({ orderBy: ORDER, select: { id: true } })
    const index = all.findIndex((category) => category.id === id)
    if (index < 0) throw ApiError.notFound('Category not found')

    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= all.length) return { moved: false }

    const ids = all.map((category) => category.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]

    await prisma.$transaction([
      ...ids.map((categoryId, position) =>
        prisma.category.update({ where: { id: categoryId }, data: { sortOrder: position } }),
      ),
      auditService.create({
        actorId: adminId,
        action: 'category.moved',
        entityType: 'Category',
        entityId: id,
        metadata: { direction },
      }),
    ])
    return { moved: true }
  },

  async remove(adminId: string, id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    })
    if (!category) throw ApiError.notFound('Category not found')
    if (category._count.products > 0) {
      throw ApiError.conflict(
        `This category has ${category._count.products} listing(s). Deactivate it instead of deleting it.`,
      )
    }
    try {
      await prisma.$transaction([
        prisma.category.delete({ where: { id } }),
        auditService.create({
          actorId: adminId,
          action: 'category.deleted',
          entityType: 'Category',
          entityId: id,
          metadata: { name: category.name, slug: category.slug },
        }),
      ])
    } catch (error) {
      if (isForeignKeyViolation(error)) throw ApiError.conflict('This category was just used by a listing. Deactivate it instead.')
      throw error
    }
  },
}
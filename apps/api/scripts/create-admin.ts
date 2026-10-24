import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const email = process.argv[2]?.trim().toLowerCase()
if (!email) {
  console.error('Usage: pnpm --filter @unikamp/api create-admin <email>')
  process.exit(1)
}

const prisma = new PrismaClient()

try {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.error(`No account found for ${email}. Register on the site first, then run this again.`)
    process.exit(1)
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN', status: 'ACTIVE' } }),
    prisma.auditLog.create({
      data: { actorId: user.id, action: 'admin.granted_via_cli', entityType: 'User', entityId: user.id },
    }),
  ])
  console.log(`${email} is now an administrator.`)
} finally {
  await prisma.$disconnect()
}
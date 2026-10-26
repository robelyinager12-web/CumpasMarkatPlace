import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const email = process.argv[2]?.trim().toLowerCase()
if (!email) {
  console.error('Usage: pnpm --filter @unikamp/api reset-2fa <email>')
  process.exit(1)
}

const prisma = new PrismaClient()

try {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.error(`No account found for ${email}.`)
    process.exit(1)
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { totpEnabled: false, totpSecret: null, recoveryCodeHashes: [] },
    }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
    prisma.auditLog.create({
      data: { actorId: user.id, action: 'two_factor.reset_via_cli', entityType: 'User', entityId: user.id },
    }),
  ])
  console.log(`Two-factor sign-in was reset for ${email}. They were signed out and can set it up again.`)
} finally {
  await prisma.$disconnect()
}
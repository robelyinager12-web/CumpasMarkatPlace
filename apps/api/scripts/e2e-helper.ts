import { PrismaClient } from '@prisma/client'

// Used only by the end-to-end tests, to do what an email link or the create-admin script would do.
const url = process.env.DATABASE_URL ?? ''
if (!/e2e/i.test(url)) {
  console.error('Refusing to run: DATABASE_URL must point at an e2e database.')
  process.exit(1)
}

const [command, email] = process.argv.slice(2)
const prisma = new PrismaClient()

try {
  if (command === 'verify-email') {
    await prisma.user.update({ where: { email }, data: { emailVerified: true } })
  } else if (command === 'make-admin') {
    await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } })
  } else {
    throw new Error(`Unknown command: ${command}`)
  }
} finally {
  await prisma.$disconnect()
}
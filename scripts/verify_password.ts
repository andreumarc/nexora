import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'marcandreuguerao@gmail.com'
  const plain = 'Admin1234!'

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) { console.log('NO USER'); return }
  if (!user.hashedPassword) { console.log('NO HASH'); return }

  const ok = await bcrypt.compare(plain, user.hashedPassword)
  console.log(`Password "${plain}" matches:`, ok)

  if (!ok) {
    const fresh = await bcrypt.hash(plain, 10)
    await prisma.user.update({ where: { id: user.id }, data: { hashedPassword: fresh } })
    console.log('Password reset to', plain)
  }
}

main().finally(() => prisma.$disconnect())

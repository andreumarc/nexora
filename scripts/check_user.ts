import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'marcandreuguerao@gmail.com' },
  })
  if (!user) { console.log('NO USER FOUND'); return }
  console.log(JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    isBlocked: user.isBlocked,
    isSuperadmin: user.isSuperadmin,
    onboardingCompleted: user.onboardingCompleted,
    role: (user as any).role,
    hashedPasswordPrefix: user.hashedPassword ? `${user.hashedPassword.slice(0,10)}...(len=${user.hashedPassword.length})` : null,
  }, null, 2))
}
main().finally(() => prisma.$disconnect())

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123', 10)

  const user = await prisma.user.upsert({
    where: { email: 'demo@cleancheck.com' },
    update: {},
    create: {
      id: 'demo-user-1',
      email: 'demo@cleancheck.com',
      password: hashedPassword,
      name: 'Demo User',
      role: 'CLIENT',
      updatedAt: new Date(),
    },
  })

  console.log('✅ Created demo user:', user.email)

  // Create demo site
  const site = await prisma.site.upsert({
    where: { qrToken: 'demo-site-token-123' },
    update: {},
    create: {
      id: 'demo-site-1',
      userId: user.id,
      name: 'Bureau Exemple',
      address: '123 Rue de la Propreté, Paris',
      pinCode: '1234',
      qrToken: 'demo-site-token-123',
      updatedAt: new Date(),
    },
  })

  console.log('✅ Created demo site:', site.name)

  // Create demo tasks
  const tasks = [
    { id: 'task-1', name: 'Nettoyage des sols', description: 'Balayer et laver les sols', orderIndex: 1 },
    { id: 'task-2', name: 'Vitres', description: 'Nettoyer les vitres et miroirs', orderIndex: 2 },
    { id: 'task-3', name: 'Poubelles', description: 'Vider et remplacer les sacs poubelles', orderIndex: 3 },
    { id: 'task-4', name: 'Surfaces', description: 'Désinfecter les surfaces de travail', orderIndex: 4 },
    { id: 'task-5', name: 'Sanitaires', description: 'Nettoyer les toilettes et lavabos', orderIndex: 5 },
  ]

  for (const task of tasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: {
        ...task,
        siteId: site.id,
        updatedAt: new Date(),
      },
    })
  }

  console.log('✅ Created', tasks.length, 'demo tasks')
  console.log('🎉 Seeding complete!')
  console.log('')
  console.log('📧 Demo credentials:')
  console.log('   Email: demo@cleancheck.com')
  console.log('   Password: demo123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

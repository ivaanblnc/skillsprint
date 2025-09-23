import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixSubmissions() {
  try {
    // Tu ID de usuario real
    const realUserId = '3a2bc268-6f9e-4211-8a7c-9522c8b59f7d'
    
    // Actualizar todas las submissions que empiezan con 'cmfx' para que apunten a tu usuario
    const result = await prisma.submission.updateMany({
      where: {
        userId: {
          startsWith: 'cmfx'
        }
      },
      data: {
        userId: realUserId
      }
    })
    
    console.log(`Updated ${result.count} submissions`)
    
    // Verificar que se actualizaron correctamente
    const userSubmissions = await prisma.submission.findMany({
      where: { userId: realUserId },
      include: {
        challenge: {
          select: {
            title: true,
            points: true
          }
        }
      }
    })
    
    console.log('User submissions after update:')
    userSubmissions.forEach(sub => {
      console.log(`- ${sub.challenge.title}: ${sub.status} (${sub.score}/100)`)
    })
    
  } catch (error) {
    console.error('Error fixing submissions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixSubmissions()

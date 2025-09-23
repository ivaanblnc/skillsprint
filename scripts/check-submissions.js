import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSubmissions() {
  try {
    // Tu ID de usuario real
    const realUserId = '3a2bc268-6f9e-4211-8a7c-9522c8b59f7d'
    
    console.log('Checking all submissions...')
    const allSubmissions = await prisma.submission.findMany({
      include: {
        challenge: {
          select: {
            title: true,
            points: true
          }
        }
      }
    })
    
    console.log('\nAll submissions:')
    allSubmissions.forEach(sub => {
      console.log(`- ID: ${sub.id}, User: ${sub.userId}, Challenge: ${sub.challenge.title}, Status: ${sub.status}`)
    })
    
    console.log(`\nSubmissions for your user (${realUserId}):`)
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
    
    userSubmissions.forEach(sub => {
      console.log(`- ${sub.challenge.title}: ${sub.status} (Score: ${sub.score})`)
    })
    
    console.log(`\nTotal submissions for your user: ${userSubmissions.length}`)
    
  } catch (error) {
    console.error('Error checking submissions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSubmissions()

import { prisma } from "@/lib/prisma"
import { DashboardNav } from "@/components/dashboard-nav"
import { ChallengesList } from "@/components/challenges-list"
import { getMessages, translate } from "@/lib/server-i18n"

// Revalidate this page every 30 seconds to show updated submission statuses
export const revalidate = 30

const CHALLENGES_PER_PAGE = 6

async function getChallenges(page: number = 1, difficulty?: string, search?: string) {
  try {
    const offset = (page - 1) * CHALLENGES_PER_PAGE
    
    // Build the where clause
    const where: any = { status: "ACTIVE" }
    
    if (difficulty) {
      where.difficulty = difficulty
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get challenges with pagination
    const [challenges, totalCount] = await Promise.all([
      prisma.challenge.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: CHALLENGES_PER_PAGE,
        include: {
          creator: {
            select: {
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              submissions: true,
            },
          },
        },
      }),
      prisma.challenge.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / CHALLENGES_PER_PAGE)

    return {
      challenges,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  } catch (error) {
    console.error("Error fetching challenges:", error)
    return {
      challenges: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNext: false,
        hasPrev: false
      }
    }
  }
}

interface ChallengesPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function ChallengesPage({ searchParams }: ChallengesPageProps) {
  const page = Number(searchParams.page) || 1
  const difficulty = typeof searchParams.difficulty === 'string' ? searchParams.difficulty : undefined
  const search = typeof searchParams.search === 'string' ? searchParams.search : undefined
  
  const { challenges, pagination } = await getChallenges(page, difficulty, search)
  const messages = await getMessages()
  const t = (key: string, params?: Record<string, string>) => translate(messages, key, params)

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">{t("challenges.title")}</h1>
          <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
            {t("challenges.allChallenges")}
          </p>
        </div>

        <ChallengesList 
          initialChallenges={challenges} 
          pagination={pagination}
          currentFilters={{ difficulty, search }}
        />
      </main>
    </div>
  )
}

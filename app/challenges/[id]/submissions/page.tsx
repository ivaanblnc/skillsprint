import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { ChallengeSubmissionsClient } from "./challenge-submissions-client"
import { ChallengeSubmissionsSkeleton } from "@/components/ui/challenge-submissions-skeleton"
import { getMessages } from "@/lib/server-i18n"

interface PageProps {
  params: { id: string }
  searchParams: { page?: string; status?: string; user?: string }
}

async function getChallengeSubmissions(challengeId: string, userId: string, page = 1, status?: string, userFilter?: string) {
  const pageSize = 6 // 6 submissions per page
  const skip = (page - 1) * pageSize

  // Verify user has access to this challenge
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId, creatorId: userId },
    select: { id: true, title: true, status: true, points: true }
  })

  if (!challenge) {
    return null
  }

  const where: any = {
    challengeId: challengeId
  }

  if (status && status !== 'ALL') {
    where.status = status
  }

  if (userFilter) {
    where.user = {
      OR: [
        { name: { contains: userFilter, mode: 'insensitive' } },
        { email: { contains: userFilter, mode: 'insensitive' } }
      ]
    }
  }

  try {
    const [submissions, totalCount] = await Promise.all([
      prisma.submission.findMany({
        where,
        select: {
          id: true,
          status: true,
          score: true,
          submittedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.submission.count({ where })
    ])

    return {
      challenge,
      submissions,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / pageSize),
      hasMore: totalCount > page * pageSize
    }
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return {
      challenge,
      submissions: [],
      totalCount: 0,
      currentPage: page,
      totalPages: 0,
      hasMore: false
    }
  }
}

export default async function ChallengeSubmissionsPage({ params, searchParams }: PageProps) {
  const supabase = await createServerClient()
  const { data: userData, error } = await supabase.auth.getUser()
  
  if (error || !userData?.user) {
    redirect('/auth/login')
  }

  // Verify user exists and is a CREATOR
  const user = await prisma.user.findUnique({
    where: { id: userData.user.id },
    select: { id: true, role: true }
  })

  if (!user || user.role !== "CREATOR") {
    notFound()
  }

  const page = parseInt(searchParams.page || '1')
  const status = searchParams.status
  const userFilter = searchParams.user

  const data = await getChallengeSubmissions(params.id, user.id, page, status, userFilter)
  
  if (!data) {
    notFound()
  }

  const translations = await getMessages()

  return (
    <Suspense fallback={<ChallengeSubmissionsSkeleton />}>
      <ChallengeSubmissionsClient
        {...data}
        submissions={data.submissions as any}
        translations={translations}
      />
    </Suspense>
  )
}

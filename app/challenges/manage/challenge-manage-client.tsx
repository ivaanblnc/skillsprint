/**
 * Challenge Manage Client Component - Refactorized
 * Client Component que maneja la gestión de challenges del usuario
 */

"use client"

import React from 'react'
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, Plus, Edit, Trash2, Eye, Users, BarChart3, Settings, 
  Clock, Trophy, Play, Loader2, CheckCircle, AlertCircle, Search
} from "lucide-react"
import { Input } from "@/components/ui/input"
import Pagination from "@/components/ui/pagination"
import { useChallengeActions } from "@/lib/hooks"
import { getBadgeVariant, formatDate, createSearchParams } from "@/lib/utils/index"
import type { ManagedChallenge, PaginationState } from "@/lib/types"
import type { User as SupabaseUser } from '@supabase/supabase-js'

// Helper function for client-side translation
function translate(translations: Record<string, any>, key: string, params?: Record<string, any>): string {
  const keys = key.split('.')
  let value: any = translations
  
  for (const k of keys) {
    value = value?.[k]
  }
  
  if (typeof value !== 'string') return key
  
  if (params) {
    return Object.entries(params).reduce(
      (str, [param, val]) => str.replace(new RegExp(`{{${param}}}`, 'g'), String(val)),
      value
    )
  }
  
  return value
}

// Component Props Interface
interface ChallengeManageClientProps {
  initialChallenges: ManagedChallenge[]
  initialPagination: PaginationState
  authUser: SupabaseUser
  translations: Record<string, any>
}

// Challenge Card Component
const ChallengeCard: React.FC<{
  challenge: ManagedChallenge
  onStatusUpdate: (id: string, status: string) => void
  onDelete: (id: string) => void
  loading: boolean
  t: (key: string, params?: Record<string, any>) => string
}> = ({ challenge, onStatusUpdate, onDelete, loading, t }) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "ACTIVE": return "default"
      case "DRAFT": return "secondary"
      case "COMPLETED": return "outline"
      case "CANCELLED": return "destructive"
      default: return "secondary"
    }
  }

  const canDelete = challenge.status === "DRAFT" && challenge._count.submissions === 0

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg truncate">{challenge.title}</CardTitle>
              <Badge variant={getBadgeVariant.difficulty(challenge.difficulty)}>
                {t(`challenges.difficulty.${challenge.difficulty.toLowerCase()}`)}
              </Badge>
            </div>
            <CardDescription className="line-clamp-2 text-sm">
              {challenge.description}
            </CardDescription>
          </div>
          <Badge variant={getStatusVariant(challenge.status)} className="shrink-0">
            {t(`challenges.status.${challenge.status.toLowerCase()}`)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground text-xs">{challenge.points}pts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground text-xs">{challenge.timeLimit}m</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground text-xs">{challenge.participantCount || 0}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground text-xs">{challenge.averageScore || 0}%</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-1.5">
          <Link href={`/challenges/${challenge.id}`}>
            <Button variant="outline" size="sm" className="h-7 px-2">
              <Eye className="h-3 w-3 mr-1" />
              <span className="text-xs">{t("challenges.view")}</span>
            </Button>
          </Link>
          
          <Link href={`/challenges/${challenge.id}/edit`}>
            <Button variant="outline" size="sm" className="h-7 px-2">
              <Edit className="h-3 w-3 mr-1" />
              <span className="text-xs">{t("challenges.edit")}</span>
            </Button>
          </Link>
          
          <Link href={`/challenges/${challenge.id}/submissions`}>
            <Button variant="outline" size="sm" className="h-7 px-2">
              <Users className="h-3 w-3 mr-1" />
              <span className="text-xs">{t("challenges.viewSubmissions")}</span>
            </Button>
          </Link>
          
          <Link href={`/challenges/${challenge.id}/settings`}>
            <Button variant="outline" size="sm" className="h-7 px-2">
              <Settings className="h-3 w-3 mr-1" />
              <span className="text-xs">{t("challenges.settings")}</span>
            </Button>
          </Link>
          
          {challenge.status === "DRAFT" && (
            <Button 
              variant="outline" 
              size="sm"
              className="h-7 px-2"
              onClick={() => onStatusUpdate(challenge.id, "ACTIVE")}
              disabled={loading}
            >
              <Play className="h-3 w-3 mr-1" />
              <span className="text-xs">{t("challenges.publish")}</span>
            </Button>
          )}
          
          {challenge.status === "ACTIVE" && (
            <Button 
              variant="outline" 
              size="sm"
              className="h-7 px-2"
              onClick={() => onStatusUpdate(challenge.id, "COMPLETED")}
              disabled={loading}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              <span className="text-xs">{t("challenges.complete")}</span>
            </Button>
          )}
          
          {canDelete && (
            <Button 
              variant="outline" 
              size="sm"
              className="h-7 px-2 text-destructive hover:text-destructive"
              onClick={() => onDelete(challenge.id)}
              disabled={loading}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              <span className="text-xs">{t("challenges.delete")}</span>
            </Button>
          )}
        </div>

        {/* Dates - More compact */}
        <div className="text-xs text-muted-foreground/70 pt-1 border-t">
          <span>Created: {formatDate.short(challenge.createdAt)}</span>
          <span className="mx-2">•</span>
          <span>Updated: {formatDate.short(challenge.updatedAt || challenge.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Main Challenge Manage Client Component
 */
export const ChallengeManageClient: React.FC<ChallengeManageClientProps> = ({
  initialChallenges,
  initialPagination,
  authUser,
  translations
}) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = (key: string, params?: Record<string, string>) => 
    translate(translations, key, params)

  // Data state
  const [challenges, setChallenges] = React.useState(initialChallenges)
  const [pagination, setPagination] = React.useState(initialPagination)

  // UI state
  const [searchQuery, setSearchQuery] = React.useState(searchParams.get('search') || '')
  const [searchLoading, setSearchLoading] = React.useState(false)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Actions
  const { loading, updateChallengeStatus, deleteChallenge } = useChallengeActions()

  // Simple search function
  const fetchChallenges = async (searchTerm: string = '', page: number = 1) => {
    setSearchLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '3'
      })
      
      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim())
      }

      const response = await fetch(`/api/challenges/manage?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch challenges')
      }

      const result = await response.json()
      
      if (result.success) {
        setChallenges(result.data.challenges)
        setPagination(result.data.pagination)
      }
    } catch (err) {
      console.error('Error fetching challenges:', err)
      setError(t("challenges.loadError") || "Error al cargar desafíos")
    } finally {
      setSearchLoading(false)
    }
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    // Simple debounce with timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      fetchChallenges(value, 1)
    }, 500)
  }

  // Clear messages after timeout
  React.useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null)
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  // Cleanup search timeout on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const handlePageChange = async (page: number) => {
    fetchChallenges(searchQuery, page)
  }

  const handleStatusUpdate = async (challengeId: string, status: string) => {
    try {
      await updateChallengeStatus(challengeId, status)
      
      // Update local state
      setChallenges(prev => prev.map(c => 
        c.id === challengeId ? { ...c, status: status as any } : c
      ))
      
      setSuccess(t("challenges.success.statusUpdated"))
    } catch (err) {
      setError(err instanceof Error ? err.message : t("challenges.errors.statusUpdateFailed"))
    }
  }

  const handleDelete = async (challengeId: string) => {
    if (!confirm(t("challenges.confirmDelete"))) {
      return
    }

    try {
      await deleteChallenge(challengeId)
      
      // Remove from local state
      setChallenges(prev => prev.filter(c => c.id !== challengeId))
      
      setSuccess(t("challenges.success.deleted"))
    } catch (err) {
      setError(err instanceof Error ? err.message : t("challenges.errors.deleteFailed"))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/challenges" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("challenges.details.back")}
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{t("challenges.manageChallenges")}</h1>
                <p className="text-muted-foreground">
                  {t("challenges.manageDescription")}
                </p>
              </div>
              
              <Link href="/challenges/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("challenges.createNew")}
                </Button>
              </Link>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  {searchLoading && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 text-muted-foreground animate-spin" />
                  )}
                  <Input
                    placeholder={t("challenges.searchPlaceholder")}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pl-10"
                    disabled={searchLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Challenges List */}
          {challenges.length > 0 ? (
            <div className="space-y-6">
              <div className="grid gap-6">
                {challenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onStatusUpdate={handleStatusUpdate}
                    onDelete={handleDelete}
                    loading={loading}
                    t={t}
                  />
                ))}
              </div>

              {/* Pagination - Siempre visible */}
              <div className="flex justify-center mt-8">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={Math.max(1, pagination.totalPages)}
                  onPageChange={handlePageChange}
                  hasNext={pagination.hasNext}
                  hasPrev={pagination.hasPrev}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardContent className="text-center py-12">
                  <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchQuery ? t("challenges.noResultsFound") : t("challenges.noChallenges")}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery 
                      ? t("challenges.tryDifferentSearch")
                      : t("challenges.createFirstChallenge")
                    }
                  </p>
                  {!searchQuery && (
                    <Link href="/challenges/create">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        {t("challenges.createNew")}
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>

              {/* Pagination - Siempre visible incluso sin challenges */}
              <div className="flex justify-center mt-8">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={Math.max(1, pagination.totalPages)}
                  onPageChange={handlePageChange}
                  hasNext={pagination.hasNext}
                  hasPrev={pagination.hasPrev}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

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
  Clock, Trophy, Play, Loader2, CheckCircle, AlertCircle, Search,
  Zap, Code, Layers, Sparkles, Flame, BookOpen, Brain, Compass
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
    <Card className="group hover:shadow-lg transition-all border-l-4 border-l-orange-500 dark:border-l-orange-400 bg-white dark:bg-slate-950">
      <CardHeader className="pb-3 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30">
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
      
      <CardContent className="space-y-3 pt-4">
        {/* Stats con iconos variados y colores */}
        <div className="grid grid-cols-4 gap-3 text-sm">
          <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
            <Flame className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-muted-foreground text-xs text-center font-medium">{challenge.points}pts</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/30">
            <Zap className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-muted-foreground text-xs text-center font-medium">{challenge.timeLimit}m</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30">
            <Brain className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <span className="text-muted-foreground text-xs text-center font-medium">{challenge.participantCount || 0}</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-lime-50 dark:bg-lime-950/30">
            <BookOpen className="h-4 w-4 text-lime-600 dark:text-lime-400" />
            <span className="text-muted-foreground text-xs text-center font-medium">{challenge.averageScore || 0}%</span>
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
          {/* Header con color */}
          <div className="mb-8 bg-white dark:bg-slate-950 rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
            <Link 
              href="/challenges" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("challenges.details.back")}
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg">
                  <Code className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{t("challenges.manageChallenges")}</h1>
                  <p className="text-muted-foreground">
                    {t("challenges.manageDescription")}
                  </p>
                </div>
              </div>
              
              <Link href="/challenges/create">
                <Button className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600">
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
          <Card className="mb-6 bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-slate-950 dark:to-slate-950 border-indigo-200 dark:border-indigo-900">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{t("challenges.searchPlaceholder")}</p>
                </div>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-indigo-400 dark:text-indigo-600" />
                  {searchLoading && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 text-indigo-500 animate-spin" />
                  )}
                  <Input
                    placeholder={t("challenges.searchPlaceholder")}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pl-10 bg-white dark:bg-slate-900 border-indigo-300 dark:border-indigo-800 focus:border-indigo-500 focus:ring-indigo-500"
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
              <Card className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 border-blue-200 dark:border-blue-900">
                <CardContent className="text-center py-12">
                  <div className="p-3 bg-blue-100 dark:bg-blue-950 rounded-lg w-fit mx-auto mb-4">
                    <Compass className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                  </div>
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
                      <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
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

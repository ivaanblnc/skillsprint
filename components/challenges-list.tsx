"use client"

import { useState, useTransition } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X, Code2, ChevronLeft, ChevronRight } from "lucide-react"
import { ChallengeCard } from "./challenge-card"
import { useTranslations } from "@/lib/i18n"

interface Challenge {
  id: string
  title: string
  description: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
  points: number
  timeLimit: number
  endDate: Date | string
  creator: {
    name: string | null
  } | null
  _count: {
    submissions: number
  }
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNext: boolean
  hasPrev: boolean
}

interface ChallengesListProps {
  initialChallenges: Challenge[]
  pagination: Pagination
  currentFilters: {
    difficulty?: string
    search?: string
  }
}

export function ChallengesList({ initialChallenges, pagination, currentFilters }: ChallengesListProps) {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [searchTerm, setSearchTerm] = useState(currentFilters.search || "")
  const [difficulty, setDifficulty] = useState(currentFilters.difficulty || "all")

  const updateSearchParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams)
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    
    // Reset to page 1 when filters change
    if (updates.difficulty || updates.search) {
      params.delete('page')
    }
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateSearchParams({ search: searchTerm.trim() })
  }

  const handleDifficultyChange = (value: string) => {
    setDifficulty(value)
    updateSearchParams({ difficulty: value })
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    if (page > 1) {
      params.set('page', page.toString())
    } else {
      params.delete('page')
    }
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const clearFilters = () => {
    setSearchTerm("")
    setDifficulty("all")
    startTransition(() => {
      router.push(pathname)
    })
  }

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="glass-card liquid-border-lg p-6 glass-elevated">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("challenges.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 liquid-border"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("")
                    updateSearchParams({ search: undefined })
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={t("common.clear")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>

          {/* Difficulty Filter */}
          <Select value={difficulty} onValueChange={handleDifficultyChange}>
            <SelectTrigger className="w-full lg:w-48 liquid-border">
              <SelectValue placeholder={t("challenges.selectDifficulty")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("challenges.allDifficulties")}</SelectItem>
              <SelectItem value="EASY">{t("challenges.difficulty.easy")}</SelectItem>
              <SelectItem value="MEDIUM">{t("challenges.difficulty.medium")}</SelectItem>
              <SelectItem value="HARD">{t("challenges.difficulty.hard")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {(searchTerm || difficulty !== "all") && (
            <Button variant="outline" onClick={clearFilters} className="liquid-border">
              <X className="h-4 w-4 mr-2" />
              {t("challenges.clearFilters")}
            </Button>
          )}
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-muted-foreground">
          {t("challenges.showingResults", { 
            count: initialChallenges.length.toString(),
            total: pagination.totalCount.toString() 
          })}
        </div>
      </div>

      {/* Challenges Grid */}
      {initialChallenges.length > 0 ? (
        <div className={`grid gap-6 ${isPending ? 'opacity-50' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 glass-card liquid-border-lg glass-elevated">
          <Code2 className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-50" />
          <h3 className="text-2xl font-semibold mb-4">{t("challenges.noChallengesFound")}</h3>
          <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">
            {currentFilters.search || currentFilters.difficulty 
              ? t("challenges.tryAdjustingFilters")
              : t("challenges.checkBackLater")
            }
          </p>
          {(currentFilters.search || currentFilters.difficulty) && (
            <Button variant="outline" onClick={clearFilters} size="lg" className="liquid-border-lg">
              {t("challenges.clearFilters")}
            </Button>
          )}
        </div>
      )}

      {/* Pagination - Always show if there are challenges */}
      {initialChallenges.length > 0 && (
        <div className="flex justify-center items-center gap-2 mt-8 glass-card liquid-border-lg p-4 glass-elevated">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrev || isPending}
            className="liquid-border"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t("common.previous")}
          </Button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum
              if (pagination.totalPages <= 5) {
                pageNum = i + 1
              } else if (pagination.currentPage <= 3) {
                pageNum = i + 1
              } else if (pagination.currentPage >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i
              } else {
                pageNum = pagination.currentPage - 2 + i
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={pagination.currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  disabled={isPending}
                  className="liquid-border w-10"
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNext || isPending}
            className="liquid-border"
          >
            {t("common.next")}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * Challenges Client Component - Refactorized
 * Client Component que maneja filtros, búsqueda y UI interactiva
 */

"use client"

import React from 'react'
import { DashboardNav } from "@/components/dashboard-nav"
import { ChallengeCard } from "@/components/challenge-card"
import { ChallengeFilters } from "@/components/challenge-filters"
import Pagination from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, X, Zap, Target, Award } from "lucide-react"
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
import { useFilters, useDebounceSearch } from "@/lib/hooks"
import { useRouter, useSearchParams } from "next/navigation"
import { createSearchParams } from "@/lib/utils/index"
import { useEffect } from "react"
import type { Challenge, PaginationState, FilterState } from "@/lib/types"

// Component Props Interface
interface ChallengesClientProps {
  initialChallenges: Challenge[]
  pagination: PaginationState
  currentFilters: FilterState
  translations: Record<string, any>
}

/**
 * Main Challenges Client Component
 * Maneja estado de filtros, búsqueda y navegación
 */
export const ChallengesClient: React.FC<ChallengesClientProps> = ({
  initialChallenges,
  pagination,
  currentFilters,
  translations
}) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Translation function
  const t = (key: string, params?: Record<string, string>) => 
    translate(translations, key, params)

  // Search and filters state
  const { value: searchValue, debouncedValue: debouncedSearch, setValue: setSearchValue } = 
    useDebounceSearch(currentFilters.search || '', 300)
    
  const { filters, updateFilter, clearFilters, hasActiveFilters } = 
    useFilters(currentFilters)

  // Update URL when filters change
  useEffect(() => {
    const newSearchParams = createSearchParams({
      page: pagination.currentPage > 1 ? pagination.currentPage : undefined,
      difficulty: filters.difficulty,
      search: debouncedSearch || undefined
    })

    const newUrl = `/challenges${newSearchParams ? `?${newSearchParams}` : ''}`
    router.push(newUrl, { scroll: false })
  }, [filters.difficulty, debouncedSearch, pagination.currentPage, router])

  // Handle filter changes
  const handleDifficultyChange = (difficulty: string | null) => {
    updateFilter('difficulty', difficulty as any)
  }

  const handleSearchChange = (search: string) => {
    setSearchValue(search)
    updateFilter('search', search)
  }

  const handlePageChange = (page: number) => {
    const newSearchParams = createSearchParams({
      page: page > 1 ? page : undefined,
      difficulty: filters.difficulty,
      search: filters.search
    })

    const newUrl = `/challenges${newSearchParams ? `?${newSearchParams}` : ''}`
    router.push(newUrl)
  }

  const handleClearFilters = () => {
    clearFilters()
    setSearchValue('')
    router.push('/challenges')
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section with Gradient Background */}
        <div className="mb-12 bg-white dark:bg-slate-950 rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold">
                {t("challenges.title")}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("challenges.allChallenges")}
            </p>
          </div>

          {/* Centered Search Bar */}
          <div className="flex justify-center mb-6">
            <div className="w-full max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary" />
                <input
                  type="text"
                  placeholder={t("challenges.searchPlaceholder") || "Search challenges..."}
                  value={searchValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 rounded-lg border-2 border-primary/20 bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                {searchValue && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Difficulty Filters - Centered with Icons */}
          <div className="flex justify-center gap-3 flex-wrap">
            <Button
              variant={!filters.difficulty ? "default" : "outline"}
              onClick={() => handleDifficultyChange(null)}
              className="rounded-full gap-2"
            >
              <Award className="h-4 w-4" />
              {t("challenges.allDifficulties") || "All"}
            </Button>
            <Button
              variant={filters.difficulty === "EASY" ? "default" : "outline"}
              onClick={() => handleDifficultyChange("EASY")}
              className="rounded-full gap-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800"
            >
              <span className="text-lg">🟢</span>
              {t("challenges.difficulty.easy") || "Easy"}
            </Button>
            <Button
              variant={filters.difficulty === "MEDIUM" ? "default" : "outline"}
              onClick={() => handleDifficultyChange("MEDIUM")}
              className="rounded-full gap-2 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800"
            >
              <span className="text-lg">🟡</span>
              {t("challenges.difficulty.medium") || "Medium"}
            </Button>
            <Button
              variant={filters.difficulty === "HARD" ? "default" : "outline"}
              onClick={() => handleDifficultyChange("HARD")}
              className="rounded-full gap-2 bg-red-50 text-red-700 hover:bg-red-100 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800"
            >
              <span className="text-lg">🔴</span>
              {t("challenges.difficulty.hard") || "Hard"}
            </Button>
          </div>
        </div>

        {/* Active Filters Display - Minimalist */}
        {hasActiveFilters && (
          <div className="mb-6 flex items-center justify-center gap-2 flex-wrap">
            {filters.difficulty && (
              <Badge variant="secondary" className="px-3 py-1">
                {t(`challenges.difficulty.${filters.difficulty.toLowerCase()}`)}
              </Badge>
            )}
            {searchValue && (
              <Badge variant="secondary" className="px-3 py-1">
                "{searchValue}"
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs"
            >
              {t("challenges.clearFilters")} ✕
            </Button>
          </div>
        )}

        {/* Challenges Grid */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialChallenges.length > 0 ? (
              initialChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  translations={translations}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">
                  {t("challenges.noResults")}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {hasActiveFilters 
                    ? t("challenges.noResultsWithFilters")
                    : t("challenges.noResultsGeneral")
                  }
                </p>
                {hasActiveFilters && (
                  <Button
                    onClick={handleClearFilters}
                    variant="outline"
                    className="mt-4"
                  >
                    {t("challenges.clearFilters")}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          hasNext={pagination.hasNext}
          hasPrev={pagination.hasPrev}
        />
      </main>
    </div>
  )
}

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

      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
            {t("challenges.title")}
          </h1>
          <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
            {t("challenges.allChallenges")}
          </p>
        </div>

        {/* Filters */}
        <ChallengeFilters
          searchValue={searchValue}
          selectedDifficulty={filters.difficulty}
          onSearchChange={handleSearchChange}
          onDifficultyChange={handleDifficultyChange}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          translations={translations}
        />

        {/* Results */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground">
            {t("challenges.showing")} {initialChallenges.length} {t("challenges.of")} {pagination.totalCount} {t("challenges.challenges")}
            {hasActiveFilters && (
              <span className="ml-2">
                • {t("challenges.filtered")}
              </span>
            )}
          </p>
        </div>

        {/* Challenges Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
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
                <button
                  onClick={handleClearFilters}
                  className="text-primary hover:underline"
                >
                  {t("challenges.clearFilters")}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            hasNext={pagination.hasNext}
            hasPrev={pagination.hasPrev}
          />
        )}
      </main>
    </div>
  )
}

/**
 * Challenge Filters Component - Refactorized
 * Componente para filtrado y búsqueda de challenges
 */

"use client"

import React from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X } from "lucide-react"
import { translate } from "@/lib/i18n-helpers"
import type { ChallengeDifficulty } from "@/lib/types"

// Component Props Interface
interface ChallengeFiltersProps {
  searchValue: string
  selectedDifficulty?: ChallengeDifficulty
  onSearchChange: (value: string) => void
  onDifficultyChange: (difficulty: ChallengeDifficulty | null) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
  translations: Record<string, any>
}

// Difficulty options
const DIFFICULTY_OPTIONS: ChallengeDifficulty[] = ['EASY', 'MEDIUM', 'HARD']

/**
 * Challenge Filters Component
 * Permite filtrar challenges por dificultad y buscar por texto
 */
export const ChallengeFilters: React.FC<ChallengeFiltersProps> = ({
  searchValue,
  selectedDifficulty,
  onSearchChange,
  onDifficultyChange,
  onClearFilters,
  hasActiveFilters,
  translations
}) => {
  const t = (key: string, params?: Record<string, string>) => 
    translate(translations, key, params)

  const getDifficultyVariant = (difficulty: ChallengeDifficulty) => {
    switch (difficulty) {
      case 'EASY': return 'default'
      case 'MEDIUM': return 'secondary'
      case 'HARD': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <div className="mb-8 space-y-4">
      {/* Search and Clear Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("challenges.searchPlaceholder")}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 liquid-border focus:liquid-border-primary"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center gap-2 liquid-border"
          >
            <Filter className="h-4 w-4" />
            {t("challenges.clearFilters")}
          </Button>
        )}
      </div>

      {/* Difficulty Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium text-muted-foreground mr-2">
          {t("challenges.filterByDifficulty")}:
        </span>
        
        {/* All button */}
        <Button
          variant={selectedDifficulty ? "outline" : "default"}
          size="sm"
          onClick={() => onDifficultyChange(null)}
          className="liquid-border"
        >
          {t("challenges.all")}
        </Button>

        {/* Difficulty buttons */}
        {DIFFICULTY_OPTIONS.map((difficulty) => (
          <Button
            key={difficulty}
            variant={selectedDifficulty === difficulty ? getDifficultyVariant(difficulty) : "outline"}
            size="sm"
            onClick={() => onDifficultyChange(difficulty)}
            className="liquid-border"
          >
            {t(`challenges.difficulty.${difficulty.toLowerCase()}`)}
          </Button>
        ))}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">
            {t("challenges.activeFilters")}:
          </span>
          
          {searchValue && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {t("challenges.search")}: "{searchValue}"
              <button
                onClick={() => onSearchChange('')}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {selectedDifficulty && (
            <Badge 
              variant={getDifficultyVariant(selectedDifficulty)} 
              className="flex items-center gap-1"
            >
              {t(`challenges.difficulty.${selectedDifficulty.toLowerCase()}`)}
              <button
                onClick={() => onDifficultyChange(null)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

// Compact version for sidebar or smaller spaces
export const ChallengeFiltersCompact: React.FC<ChallengeFiltersProps> = (props) => {
  const t = (key: string, params?: Record<string, string>) => 
    translate(props.translations, key, params)

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t("challenges.search")}
          value={props.searchValue}
          onChange={(e) => props.onSearchChange(e.target.value)}
          className="pl-10 text-sm"
        />
      </div>

      {/* Difficulty */}
      <div>
        <span className="text-xs font-medium text-muted-foreground mb-2 block">
          {t("challenges.difficulty")}
        </span>
        <div className="flex flex-wrap gap-1">
          <Button
            variant={props.selectedDifficulty ? "outline" : "default"}
            size="sm"
            onClick={() => props.onDifficultyChange(null)}
            className="text-xs h-7"
          >
            {t("challenges.all")}
          </Button>
          {DIFFICULTY_OPTIONS.map((difficulty) => (
            <Button
              key={difficulty}
              variant={props.selectedDifficulty === difficulty ? "default" : "outline"}
              size="sm"
              onClick={() => props.onDifficultyChange(difficulty)}
              className="text-xs h-7"
            >
              {t(`challenges.difficulty.${difficulty.toLowerCase()}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* Clear */}
      {props.hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={props.onClearFilters}
          className="w-full text-xs"
        >
          {t("challenges.clearFilters")}
        </Button>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X, Code2 } from "lucide-react"
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

interface ChallengesListProps {
  initialChallenges: Challenge[]
}

export function ChallengesList({ initialChallenges }: ChallengesListProps) {
  const t = useTranslations()
  const [searchTerm, setSearchTerm] = useState("")
  const [difficulty, setDifficulty] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  const filteredAndSortedChallenges = useMemo(() => {
    let filtered = initialChallenges

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(challenge => 
        challenge.title.toLowerCase().includes(searchLower) ||
        challenge.description.toLowerCase().includes(searchLower)
      )
    }

    // Apply difficulty filter
    if (difficulty !== "all") {
      filtered = filtered.filter(challenge => challenge.difficulty === difficulty)
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
        case "oldest":
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
        case "points-high":
          return b.points - a.points
        case "points-low":
          return a.points - b.points
        case "popular":
          return b._count.submissions - a._count.submissions
        default:
          return 0
      }
    })

    return filtered
  }, [initialChallenges, searchTerm, difficulty, sortBy])

  const clearFilters = () => {
    setSearchTerm("")
    setDifficulty("all")
    setSortBy("newest")
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("challenges.filters.search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("challenges.filters.all")}</SelectItem>
              <SelectItem value="EASY">{t("challenges.difficulty.easy")}</SelectItem>
              <SelectItem value="MEDIUM">{t("challenges.difficulty.medium")}</SelectItem>
              <SelectItem value="HARD">{t("challenges.difficulty.hard")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder={t("common.filter")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("challenges.filters.newest")}</SelectItem>
              <SelectItem value="oldest">{t("challenges.filters.oldest")}</SelectItem>
              <SelectItem value="points-high">{t("challenges.filters.mostPoints")}</SelectItem>
              <SelectItem value="points-low">{t("challenges.filters.leastPoints")}</SelectItem>
              <SelectItem value="popular">{t("challenges.filters.mostPopular")}</SelectItem>
            </SelectContent>
          </Select>

          {(searchTerm || difficulty !== "all" || sortBy !== "newest") && (
            <Button variant="outline" onClick={clearFilters} size="icon">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Results info */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          {t("challenges.details.showingChallenges", { 
            count: filteredAndSortedChallenges.length.toString(), 
            total: initialChallenges.length.toString() 
          })}
        </p>
      </div>

      {/* Challenge Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedChallenges.map((challenge) => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}
      </div>

      {/* Empty state */}
      {filteredAndSortedChallenges.length === 0 && (
        <div className="text-center py-12">
          <Code2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">{t("challenges.noChallengesFound")}</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || difficulty !== "all" 
              ? t("challenges.tryAdjustingFilters")
              : t("challenges.checkBackLater")
            }
          </p>
          {(searchTerm || difficulty !== "all" || sortBy !== "newest") && (
            <Button variant="outline" onClick={clearFilters}>
              {t("challenges.clearFilters")}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

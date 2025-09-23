"use client"

import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X, Code2 } from "lucide-react"
import { ChallengeCard } from "./challenge-card"

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
              placeholder="Search challenges..."
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
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="EASY">Easy</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HARD">Hard</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="points-high">Most Points</SelectItem>
              <SelectItem value="points-low">Least Points</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
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
          Showing {filteredAndSortedChallenges.length} of {initialChallenges.length} challenges
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
          <h3 className="text-lg font-semibold mb-2">No challenges found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || difficulty !== "all" 
              ? "Try adjusting your filters or search terms" 
              : "Check back later for new challenges!"
            }
          </p>
          {(searchTerm || difficulty !== "all" || sortBy !== "newest") && (
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

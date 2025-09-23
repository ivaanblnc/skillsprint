"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"

export function ChallengeFilters() {
  const [searchTerm, setSearchTerm] = useState("")
  const [difficulty, setDifficulty] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  const clearFilters = () => {
    setSearchTerm("")
    setDifficulty("all")
    setSortBy("newest")
  }

  return (
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
  )
}

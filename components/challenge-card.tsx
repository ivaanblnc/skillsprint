/**
 * Challenge Card Component - Refactorized
 * Componente reutilizable para mostrar información de challenges
 */

"use client"

import React from 'react'
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Clock, Users, ArrowRight } from "lucide-react"
import { translate } from "@/lib/i18n-helpers"
// Helper function for client-side translation
import { getBadgeVariant, formatDate } from "@/lib/utils/index"
import type { Challenge } from "@/lib/types"

// Component Props Interface
interface ChallengeCardProps {
  challenge: Challenge
  translations: Record<string, any>
  showCreator?: boolean
  size?: 'default' | 'compact'
}

/**
 * Challenge Card Component
 * Muestra información del challenge de forma consistente
 */
export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  translations,
  showCreator = true,
  size = 'default'
}) => {
  const t = (key: string, params?: Record<string, string>) => 
    translate(translations, key, params)

  const cardClassName = size === 'compact' 
    ? "glass-elevated h-auto" 
    : "glass-elevated h-[320px] hover:glass-elevated-hover transition-all duration-300"

  return (
    <Card className={cardClassName}>
      <CardHeader>
        <div className="flex items-start justify-between mb-3">
          <CardTitle className="text-lg font-bold leading-tight line-clamp-2">
            {challenge.title}
          </CardTitle>
          <Badge
            variant={getBadgeVariant.difficulty(challenge.difficulty)}
            className="liquid-border text-xs font-medium shrink-0 ml-2"
          >
            {t(`challenges.difficulty.${challenge.difficulty.toLowerCase()}`)}
          </Badge>
        </div>
        
        <CardDescription className="text-sm line-clamp-3 text-pretty">
          {challenge.description || t("challenges.noDescription")}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col justify-between flex-1">
        {/* Challenge Stats */}
        <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1" title={t("challenges.points")}>
            <Trophy className="h-4 w-4 text-primary" />
            <span className="font-medium">{challenge.points}</span>
          </div>
          
          <div className="flex items-center gap-1" title={t("challenges.timeLimit")}>
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-medium">{challenge.timeLimit}min</span>
          </div>
          
          <div className="flex items-center gap-1" title={t("challenges.participants")}>
            <Users className="h-4 w-4 text-primary" />
            <span className="font-medium">{challenge._count?.submissions || 0}</span>
          </div>
        </div>

        {/* Creator and Action */}
        <div className="flex items-center justify-between">
          {showCreator && challenge.creator && (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage 
                  src={challenge.creator.image || ""} 
                  alt={challenge.creator.name || "Creator"} 
                />
                <AvatarFallback className="text-xs">
                  {challenge.creator.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {challenge.creator.name || t("challenges.anonymous")}
              </span>
            </div>
          )}
          
          {!showCreator && (
            <div className="text-xs text-muted-foreground">
              {formatDate.short(challenge.createdAt)}
            </div>
          )}

          <Link href={`/challenges/${challenge.id}`}>
            <Button 
              size={size === 'compact' ? 'sm' : 'default'} 
              className="liquid-border group"
            >
              {size === 'compact' ? t("challenges.view") : t("challenges.startChallenge")}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

// Variant for dashboard display
export const ChallengeCardCompact: React.FC<Omit<ChallengeCardProps, 'size'>> = (props) => (
  <ChallengeCard {...props} size="compact" />
)

// Skeleton for loading state
export const ChallengeCardSkeleton: React.FC = () => (
  <Card className="glass-elevated h-[320px]">
    <CardHeader>
      <div className="flex items-start justify-between mb-3">
        <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
        <div className="h-5 w-16 bg-muted animate-pulse rounded ml-2" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-muted animate-pulse rounded" />
        <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
      </div>
    </CardHeader>
    <CardContent className="flex flex-col justify-between flex-1">
      <div className="flex items-center gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            <div className="h-4 w-8 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 bg-muted animate-pulse rounded-full" />
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-10 w-24 bg-muted animate-pulse rounded" />
      </div>
    </CardContent>
  </Card>
)

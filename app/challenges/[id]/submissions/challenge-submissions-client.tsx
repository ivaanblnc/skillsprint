"use client"

import React, { useState } from 'react'
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  ArrowLeft, Search, Filter, Download, Eye, 
  CheckCircle, XCircle, Clock, AlertCircle, User
} from "lucide-react"
import Pagination from "@/components/ui/pagination"
import { formatDate, createSearchParams } from "@/lib/utils"
import { DashboardNav } from "@/components/dashboard-nav"
import { SubmissionDetailsModal } from "@/components/ui/submission-details-modal"

interface Submission {
  id: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  score: number | null
  submittedAt: Date
  user: {
    id: string
    name?: string
    email?: string
  }
}

interface Challenge {
  id: string
  title: string
  status: string
  points?: number
}

interface ChallengeSubmissionsClientProps {
  challenge: Challenge & { points?: number }
  submissions: Submission[]
  totalCount: number
  currentPage: number
  totalPages: number
  hasMore: boolean
  translations: Record<string, any>
}

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

const SubmissionCard: React.FC<{
  submission: Submission
  t: (key: string, params?: Record<string, any>) => string
  onViewDetails: (submissionId: string) => void
  onGradeSubmission?: (submissionId: string, status: string, score: number) => void
  maxPoints?: number
}> = ({ submission, t, onViewDetails, onGradeSubmission, maxPoints = 100 }) => {
  const [isGrading, setIsGrading] = React.useState(false)
  const [gradeScore, setGradeScore] = React.useState(submission.score?.toString() || '0')
  const [gradeStatus, setGradeStatus] = React.useState<string>(submission.status)

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "ACCEPTED": return "default"
      case "REJECTED": return "destructive"
      case "PENDING": return "secondary"
      default: return "secondary"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACCEPTED": return <CheckCircle className="h-4 w-4" />
      case "REJECTED": return <XCircle className="h-4 w-4" />
      case "PENDING": return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const handleGradeSubmit = async () => {
    if (!onGradeSubmission) return
    
    const score = parseInt(gradeScore) || 0
    
    // Validar que no exceda los puntos máximos
    if (score > maxPoints) {
      return
    }
    
    setIsGrading(true)
    try {
      await onGradeSubmission(submission.id, gradeStatus, score)
    } finally {
      setIsGrading(false)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {submission.user.name || submission.user.email || t("submissions.anonymousUser")}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDate.long(submission.submittedAt)}
              </p>
            </div>
          </div>
          <Badge variant={getStatusVariant(submission.status)} className="flex items-center gap-1">
            {getStatusIcon(submission.status)}
            {t(`submissions.status.${submission.status.toLowerCase()}`)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
          <div>
            <p className="text-muted-foreground">{t("submissions.score")}</p>
            <p className="font-medium">
              {submission.score !== null ? `${submission.score}/100` : t("submissions.notGraded")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("submissions.status.label")}</p>
            <p className="font-medium">
              {t(`submissions.status.${submission.status.toLowerCase()}`)}
            </p>
          </div>
        </div>

        {/* Grading Section */}
        {onGradeSubmission && submission.status === 'PENDING' && (
          <div className="border-t pt-4 mt-4 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">{t("submissions.reviewSubmission")}</p>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Score Input */}
              <div>
                <label className="text-xs text-muted-foreground block mb-1">{t("submissions.scoreLabel")}</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max={maxPoints}
                    value={gradeScore}
                    onChange={(e) => {
                      // Solo permitir números y punto decimal
                      const inputValue = e.target.value
                      // Si está vacío, dejar que sea vacío
                      if (inputValue === '') {
                        setGradeScore('')
                        return
                      }
                      // Solo números (sin punto decimal en este caso)
                      if (/^\d+$/.test(inputValue)) {
                        const val = parseInt(inputValue)
                        if (val <= maxPoints) {
                          setGradeScore(inputValue)
                        }
                      }
                    }}
                    onKeyPress={(e) => {
                      // Solo permitir dígitos
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault()
                      }
                    }}
                    className="h-8"
                    disabled={isGrading}
                  />
                  <span className="text-xs text-muted-foreground">/{maxPoints}</span>
                </div>
              </div>

              {/* Status Select */}
              <div>
                <label className="text-xs text-muted-foreground block mb-1">{t("submissions.status.label")}</label>
                <Select value={gradeStatus} onValueChange={setGradeStatus} disabled={isGrading}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pendiente</SelectItem>
                    <SelectItem value="ACCEPTED">Aceptado</SelectItem>
                    <SelectItem value="REJECTED">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                size="sm"
                variant="default"
                className="flex-1"
                onClick={handleGradeSubmit}
                disabled={isGrading}
              >
                {isGrading ? t("common.saving") : t("submissions.acceptSubmission")}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1"
                onClick={() => onViewDetails(submission.id)}
              >
                <Eye className="h-4 w-4 mr-1" />
                {t("submissions.viewDetails")}
              </Button>
            </div>
          </div>
        )}

        {/* View Details Button (when already graded or not grading) */}
        {!onGradeSubmission || submission.status !== 'PENDING' ? (
          <div className="flex justify-end pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onViewDetails(submission.id)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {t("submissions.viewDetails")}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function ChallengeSubmissionsClient({
  challenge,
  submissions,
  totalCount,
  currentPage,
  totalPages,
  translations
}: ChallengeSubmissionsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const t = (key: string, params?: Record<string, any>) => translate(translations, key, params)

  const [userFilter, setUserFilter] = useState(searchParams.get('user') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL')
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleViewDetails = (submissionId: string) => {
    setSelectedSubmissionId(submissionId)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedSubmissionId(null)
  }

  const handleFilterChange = (type: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value && value !== 'ALL') {
      params.set(type, value)
    } else {
      params.delete(type)
    }
    
    params.delete('page') // Reset to first page
    
    router.push(`${window.location.pathname}?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`${window.location.pathname}?${params.toString()}`)
  }

  const handleGradeSubmission = async (submissionId: string, status: string, score: number) => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, score })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Error grading:', error)
        return
      }

      // Refresh the page to show updated submission
      router.refresh()
    } catch (error) {
      console.error('Error grading submission:', error)
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
              href="/challenges/manage" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("submissions.backToManage")}
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{t("submissions.title")}</h1>
                <p className="text-muted-foreground">
                  {t("submissions.challengeTitle")}: <span className="font-medium">{challenge.title}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("submissions.totalSubmissions", { count: totalCount })}
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("submissions.searchByUser")}
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleFilterChange('user', userFilter)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value)
                      handleFilterChange('status', value)
                    }}
                  >
                    <SelectTrigger className="w-[200px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">{t("submissions.allStatuses")}</SelectItem>
                      <SelectItem value="ACCEPTED">{t("submissions.status.accepted")}</SelectItem>
                      <SelectItem value="REJECTED">{t("submissions.status.rejected")}</SelectItem>
                      <SelectItem value="PENDING">{t("submissions.status.pending")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submissions List */}
          {submissions.length > 0 ? (
            <div className="space-y-6">
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <SubmissionCard
                    key={submission.id}
                    submission={submission}
                    t={t}
                    onViewDetails={handleViewDetails}
                    onGradeSubmission={handleGradeSubmission}
                    maxPoints={challenge.points || 100}
                  />
                ))}
              </div>

              {/* Pagination - Siempre visible */}
              <div className="flex justify-center mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.max(1, totalPages)}
                  onPageChange={handlePageChange}
                  hasNext={currentPage < totalPages}
                  hasPrev={currentPage > 1}
                />
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t("submissions.noSubmissions")}</h3>
                  <p className="text-muted-foreground mb-4">
                    {userFilter || statusFilter !== 'ALL' 
                      ? t("submissions.noSubmissionsFiltered")
                      : t("submissions.noSubmissionsYet")
                    }
                  </p>
                  {(userFilter || statusFilter !== 'ALL') && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setUserFilter('')
                        setStatusFilter('ALL')
                        router.push(window.location.pathname)
                      }}
                    >
                      {t("submissions.clearFilters")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Submission Details Modal */}
      <SubmissionDetailsModal
        isOpen={isModalOpen}
        onClose={closeModal}
        submissionId={selectedSubmissionId || ''}
        translations={translations}
      />
    </div>
  )
}

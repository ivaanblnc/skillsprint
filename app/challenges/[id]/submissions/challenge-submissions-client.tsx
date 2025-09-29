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
}

interface ChallengeSubmissionsClientProps {
  challenge: Challenge
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
}> = ({ submission, t, onViewDetails }) => {
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

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">{t("submissions.score")}</p>
            <p className="font-medium">
              {submission.score !== null ? `${submission.score}%` : t("submissions.notGraded")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("submissions.status.label")}</p>
            <p className="font-medium">
              {t(`submissions.status.${submission.status.toLowerCase()}`)}
            </p>
          </div>
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onViewDetails(submission.id)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {t("submissions.viewDetails")}
            </Button>
          </div>
        </div>
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
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    hasNext={currentPage < totalPages}
                    hasPrev={currentPage > 1}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
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

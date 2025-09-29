"use client"

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Eye, Code, FileText, Loader2, File } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface SubmissionDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  submissionId: string
  translations: Record<string, any>
}

interface SubmissionDetail {
  id: string
  status: string
  score: number | null
  submittedAt: Date
  code?: string
  language?: string
  fileName?: string
  fileUrl?: string
  user: {
    id: string
    name?: string
    email?: string
  }
  challenge: {
    title: string
  }
}

function translate(translations: Record<string, any>, key: string): string {
  const keys = key.split('.')
  let value: any = translations
  for (const k of keys) {
    value = value?.[k]
  }
  return typeof value === 'string' ? value : key
}

export function SubmissionDetailsModal({ 
  isOpen, 
  onClose, 
  submissionId, 
  translations 
}: SubmissionDetailsModalProps) {
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const t = (key: string) => translate(translations, key)

  useEffect(() => {
    if (isOpen && submissionId) {
      fetchSubmissionDetails()
    }
  }, [isOpen, submissionId])

  const fetchSubmissionDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/submissions/${submissionId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch submission details')
      }
      
      const data = await response.json()
      setSubmission(data)
    } catch (error) {
      console.error('Error fetching submission details:', error)
      setError(t("submissions.loadError"))
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadFile = async () => {
    if (!submission?.fileUrl) return
    
    try {
      const response = await fetch(submission.fileUrl)
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = submission.fileName || 'submission'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading file:', error)
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'default'
      case 'PENDING': return 'secondary'
      case 'WRONG_ANSWER': 
      case 'RUNTIME_ERROR': 
      case 'COMPILATION_ERROR': 
      case 'TIME_LIMIT_EXCEEDED': 
      case 'REJECTED': return 'destructive'
      default: return 'secondary'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {t("submissions.submissionDetails")}
          </DialogTitle>
          <DialogDescription>
            {submission && (
              <span>
                {t("submissions.submittedBy")} {submission.user.name || submission.user.email} 
                {t("common.on")} {formatDate.long(submission.submittedAt)}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">{t("common.loading")}</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32 text-destructive">
              {error}
            </div>
          ) : submission ? (
            <div className="space-y-4 h-full">
              {/* Status and Score */}
              <div className="flex items-center justify-between">
                <Badge variant={getStatusVariant(submission.status)}>
                  {t(`submissions.status.${submission.status.toLowerCase()}`)}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  {t("submissions.score")}: {submission.score !== null ? `${submission.score}%` : t("submissions.notGraded")}
                </div>
              </div>

              <Separator />

              {/* Content Tabs */}
              {(submission.code || submission.fileName) ? (
                <Tabs defaultValue={submission.code ? "code" : "file"} className="flex-1">
                  <TabsList className={`grid w-full ${submission.code ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {submission.code && (
                      <TabsTrigger value="code" className="flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        {t("submissions.code")}
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="file" className="flex items-center gap-2">
                      <File className="h-4 w-4" />
                      {t("submissions.file")}
                    </TabsTrigger>
                  </TabsList>

                  {submission.code && (
                    <TabsContent value="code" className="mt-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{t("submissions.submissionCode")}</span>
                          {submission.language && (
                            <Badge variant="outline">{submission.language}</Badge>
                          )}
                        </div>
                        <ScrollArea className="h-96 border rounded-md">
                          <pre className="p-4 text-sm">
                            <code>{submission.code}</code>
                          </pre>
                        </ScrollArea>
                      </div>
                    </TabsContent>
                  )}

                  <TabsContent value="file" className="mt-4">
                    {submission.fileName ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">{t("submissions.uploadedFile")}</span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleDownloadFile}
                            disabled={!submission.fileUrl}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {t("submissions.download")}
                          </Button>
                        </div>
                        
                        <div className="border rounded-md p-4 bg-muted">
                          <div className="flex items-center gap-2">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{submission.fileName}</p>
                              <p className="text-sm text-muted-foreground">
                                {t("submissions.clickDownloadToView")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-32 text-muted-foreground">
                        <div className="text-center">
                          <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>{t("submissions.noFileUploaded")}</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  {t("submissions.noContentAvailable")}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            {t("common.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

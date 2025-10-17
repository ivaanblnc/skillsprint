/**
 * Challenge Submit Client Component
 * Permite al usuario enviar soluciones mediante código o archivo
 * Arquitectura escalable con separación de responsabilidades
 */

"use client"

import React, { useState, useRef, useCallback } from 'react'
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, Upload, Code2, CheckCircle, AlertCircle, 
  Loader2, FileUp, Trash2, Clock, Target, Users, Trophy
} from "lucide-react"
import { getBadgeVariant, formatDate } from "@/lib/utils/index"
import type { ChallengeDetail } from "@/lib/types"
import { useToast } from '@/hooks/use-toast'

// Helper translation function
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

// Component Props Interface
interface ChallengeSubmitClientProps {
  challenge: ChallengeDetail
  userId: string
  translations: Record<string, any>
}

// Code Editor Component
const CodeEditor: React.FC<{
  code: string
  onChange: (code: string) => void
  language: string
  onLanguageChange: (lang: string) => void
  t: (key: string) => string
}> = ({ code, onChange, language, onLanguageChange, t }) => {
  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'typescript', label: 'TypeScript' }
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Code2 className="h-4 w-4 text-primary" />
        <label className="text-sm font-medium">{t("submit.language")}</label>
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="ml-auto px-3 py-1 text-sm border rounded-md bg-background"
        >
          {languages.map(lang => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("submit.codePlaceholder")}
        className="w-full h-96 p-4 font-mono text-sm border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
      />
      <div className="text-xs text-muted-foreground">
        {code.length} {t("submit.characters")}
      </div>
    </div>
  )
}

// File Upload Component
const FileUploadArea: React.FC<{
  file: File | null
  onFileChange: (file: File | null) => void
  uploading: boolean
  t: (key: string) => string
}> = ({ file, onFileChange, uploading, t }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      const file = droppedFiles[0]
      if (file.size <= 5 * 1024 * 1024) { // 5MB limit
        onFileChange(file)
      } else {
        alert(t("submit.fileSizeError"))
      }
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (file.size <= 5 * 1024 * 1024) {
        onFileChange(file)
      } else {
        alert(t("submit.fileSizeError"))
      }
    }
  }

  return (
    <div className="space-y-3">
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-primary/20 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <FileUp className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium mb-1">{t("submit.dragDrop")}</p>
          <p className="text-sm text-muted-foreground mb-3">
            {t("submit.orClickSelect")}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInputChange}
            className="hidden"
            accept=".js,.py,.java,.cpp,.txt,.zip"
          />
          <Button size="sm" variant="outline" disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("submit.uploading")}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {t("submit.selectFile")}
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="border-2 border-primary/20 rounded-lg p-4 bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onFileChange(null)}
              disabled={uploading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Main Challenge Submit Client Component
 */
export const ChallengeSubmitClient: React.FC<ChallengeSubmitClientProps> = ({
  challenge,
  userId,
  translations
}) => {
  const router = useRouter()
  const t = (key: string, params?: Record<string, string>) => 
    translate(translations, key, params)
  const { toast } = useToast()

  // State management
  const [submitMode, setSubmitMode] = useState<'code' | 'file'>('code')
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(challenge.timeLimit * 60) // Convert to seconds

  // Refs for tracking flags without recreating interval
  const alertedOneMinuteRef = useRef(false)
  const didAutoSubmitRef = useRef(false)
  const timeRemainingRef = useRef(challenge.timeLimit * 60)
  const codeRef = useRef('')
  const fileRef = useRef<File | null>(null)
  const submitModeRef = useRef<'code' | 'file'>('code')
  const handleSubmitCodeRef = useRef<typeof handleSubmitCode | null>(null)
  const handleSubmitFileRef = useRef<typeof handleSubmitFile | null>(null)

  // Toast effect - separate to avoid closure issues
  React.useEffect(() => {
    if (timeRemaining === 60 && !alertedOneMinuteRef.current) {
      alertedOneMinuteRef.current = true
      console.log('🔔 Toast triggered at 60 seconds')
      toast({
        title: t('submit.timeAlmostUpTitle') || 'Time nearly up',
        description: t('submit.timeAlmostUpDesc') || '1 minute remaining',
      })
    }
  }, [timeRemaining, t, toast])

  // Sync refs with state
  React.useEffect(() => {
    codeRef.current = code
  }, [code])

  React.useEffect(() => {
    fileRef.current = file
  }, [file])

  React.useEffect(() => {
    submitModeRef.current = submitMode
  }, [submitMode])

  // Validations
  const hasContent = submitMode === 'code' ? code.trim().length > 0 : file !== null

  

  /**
   * Handle code submission
   */
  const handleSubmitCode = useCallback(async () => {
    if (!code.trim()) {
      setError(t("submit.provideSolutionSubmitError"))
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          userId,
          code: code.trim(),
          language,
          submissionType: 'code'
        })
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = await response.json()
      setSuccess(t("submit.solutionSubmittedSuccess"))
      
      setTimeout(() => {
        router.refresh()
        router.push(`/challenges`)
      }, 1500)
    } catch (err) {
      setError(t("submit.submitSolutionError"))
      console.error("Submission error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }, [challenge.id, userId, code, language, router, t])

  /**
   * Handle file upload and submission
   */
  const handleSubmitFile = useCallback(async () => {
    if (!file) {
      setError(t("submit.provideSolutionSubmitError"))
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('challengeId', challenge.id)
      formData.append('userId', userId)

      const response = await fetch(`/api/submissions/upload`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = await response.json()
      setSuccess(t("submit.solutionSubmittedSuccess"))
      
      setTimeout(() => {
        router.refresh()
        router.push(`/challenges`)
      }, 1500)
    } catch (err) {
      setError(t("submit.submitSolutionError"))
      console.error("File submission error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }, [file, challenge.id, userId, router, t])

  // Store handlers in refs for use in timer effect
  React.useEffect(() => {
    handleSubmitCodeRef.current = handleSubmitCode
  }, [handleSubmitCode])

  React.useEffect(() => {
    handleSubmitFileRef.current = handleSubmitFile
  }, [handleSubmitFile])

  // Timer effect (placed after handlers to allow calling them)
  React.useEffect(() => {
    console.log('Timer effect mounted')
    
    const interval = setInterval(() => {
      timeRemainingRef.current -= 1
      const next = timeRemainingRef.current
      
      console.log('Timer tick:', next)
      
      // Update display every tick
      setTimeRemaining(next)
      
      // Toast at 60 seconds - REMOVED, now in separate effect
      
      // Stop at 0 and auto-submit
      if (next <= 0 && !didAutoSubmitRef.current) {
        didAutoSubmitRef.current = true
        console.log('⏹️ Time reached 0, attempting auto-submit')
        console.log('Submit mode:', submitModeRef.current, 'Code:', codeRef.current.length, 'File:', !!fileRef.current)
        
        // Trigger auto-submit in the next tick
        setTimeout(() => {
          if (submitModeRef.current === 'code' && codeRef.current.trim()) {
            console.log('Auto-submitting code')
            handleSubmitCodeRef.current?.()
          } else if (submitModeRef.current === 'file' && fileRef.current) {
            console.log('Auto-submitting file')
            handleSubmitFileRef.current?.()
          } else {
            console.log('No content to submit')
          }
        }, 0)
        
        clearInterval(interval) // Stop the interval at 0
      }
    }, 1000)

    return () => {
      console.log('Timer effect unmounted')
      clearInterval(interval)
    }
  }, [])

  /**
   * Handle save as draft
   */

  /**
   * Format remaining time
   */
  const formatTimeRemaining = () => {
    const now = new Date()
    const end = new Date(challenge.endDate || challenge.createdAt)
    const diff = end.getTime() - now.getTime()
    
    if (diff <= 0) return t("challenge.expired")
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  /**
   * Format timer countdown
   */
  const formatCountdown = () => {
    const hours = Math.floor(timeRemaining / 3600)
    const minutes = Math.floor((timeRemaining % 3600) / 60)
    const seconds = timeRemaining % 60
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href={`/challenges/${challenge.id}`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("challenge.back")}
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{challenge.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    {challenge.points} {t("challenge.points")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {t("submit.timeRemaining")}: {formatTimeRemaining()}
                  </div>
                </div>
              </div>
              <Badge variant={getBadgeVariant.difficulty(challenge.difficulty)}>
                {t(`difficulty.${challenge.difficulty.toLowerCase()}`)}
              </Badge>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Editor Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Alert Messages */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              {/* Submission Mode Tabs */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("submit.submitSolution")}</CardTitle>
                  <CardDescription>
                    {submitMode === 'code' 
                      ? t("submit.writeCode") + " - " + t("submit.directSubmission")
                      : t("submit.uploadFile") + " - " + t("submit.directSubmission")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={submitMode} onValueChange={(value) => setSubmitMode(value as 'code' | 'file')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="code" className="gap-2">
                        <Code2 className="h-4 w-4" />
                        {t("submit.writeCode")}
                      </TabsTrigger>
                      <TabsTrigger value="file" className="gap-2">
                        <Upload className="h-4 w-4" />
                        {t("submit.uploadFile")}
                      </TabsTrigger>
                    </TabsList>

                    {/* Code Editor Tab */}
                    <TabsContent value="code" className="mt-6">
                      <CodeEditor
                        code={code}
                        onChange={setCode}
                        language={language}
                        onLanguageChange={setLanguage}
                        t={t}
                      />
                    </TabsContent>

                    {/* File Upload Tab */}
                    <TabsContent value="file" className="mt-6">
                      <FileUploadArea
                        file={file}
                        onFileChange={setFile}
                        uploading={isSubmitting}
                        t={t}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  onClick={submitMode === 'code' ? handleSubmitCode : handleSubmitFile}
                  disabled={!hasContent || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("submit.submitting")}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t("submit.submitSolution")}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Challenge Info Sidebar */}
            <div className="space-y-6">
              {/* Challenge Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t("challenge.description")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {challenge.description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Challenge Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("submit.challengeInfo")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      {t("challenge.points")}
                    </p>
                    <p className="text-lg font-bold">{challenge.points}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      {t("submit.timeRemaining")}
                    </p>
                    <p className={`text-lg font-bold font-mono ${timeRemaining < 300 ? 'text-destructive' : ''}`}>
                      {formatCountdown()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      {t("challenge.testCases")}
                    </p>
                    <p className="text-lg font-bold">
                      {challenge.testCases.filter(tc => tc.isPublic).length}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

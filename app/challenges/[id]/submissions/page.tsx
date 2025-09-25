"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, AlertCircle, Code2, Download, ArrowLeft, Eye, FileText } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { DashboardNav } from "@/components/dashboard-nav"
import { useTranslations } from "@/lib/i18n"

interface Submission {
  id: string
  challenge: {
    id: string
    title: string
    points: number
  }
  user: {
    id: string
    name: string
    email: string | null
    avatar: string | null
  }
  submittedAt: Date
  language: string | null
  status: string
  code: string | null
  fileUrl: string | null
  hasFile: boolean
  executionTime: number | null
  memory: number | null
  score: number | null
  reviewedAt: Date | null
  feedbacks: Array<{
    id: string
    comment: string
    rating: number
    createdAt: Date
    creator: string
  }>
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" {
  switch (status) {
    case "ACCEPTED":
      return "default"
    case "PENDING":
      return "secondary"
    case "REJECTED":
    case "WRONG_ANSWER":
    case "TIME_LIMIT_EXCEEDED":
    case "RUNTIME_ERROR":
    case "COMPILATION_ERROR":
      return "destructive"
    default:
      return "secondary"
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "ACCEPTED":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case "PENDING":
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
    default:
      return <XCircle className="h-4 w-4 text-red-500" />
  }
}

export default function ChallengeSubmissionsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const t = useTranslations()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("ALL")
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [customScore, setCustomScore] = useState<number>(0)
  const [feedback, setFeedback] = useState<string>("")
  const [loadingSubmissions, setLoadingSubmissions] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const statusParam = activeTab === "ALL" ? "" : `?status=${activeTab}`
        const response = await fetch(`/api/challenges/${params.id}/submissions${statusParam}`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch submissions")
        }
        
        const data = await response.json()
        setSubmissions(data.submissions)
      } catch (error) {
        console.error("Error fetching submissions:", error)
        toast.error(t("submissions.loadError"))
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissions()
  }, [params.id, activeTab])

  const handleViewCode = (submission: Submission) => {
    setSelectedSubmission(submission)
    setShowCodeModal(true)
  }

  const handleReviewClick = (submission: Submission, action: 'ACCEPT' | 'REJECT') => {
    setSelectedSubmission(submission)
    setCustomScore(action === 'ACCEPT' ? submission.challenge.points : 0)
    setFeedback("")
    setShowReviewModal(true)
  }

  const handleConfirmReview = async () => {
    if (!selectedSubmission) return

    const action = customScore > 0 ? 'ACCEPT' : 'REJECT'
    
    setLoadingSubmissions(prev => new Set(prev).add(selectedSubmission.id))

    try {
      const response = await fetch(`/api/challenges/${params.id}/submissions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          action,
          score: customScore,
          feedback
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update submission')
      }

      // Update the submission in the list
      setSubmissions(prev => prev.map(s => 
        s.id === selectedSubmission.id 
          ? { 
              ...s, 
              status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED',
              score: customScore,
              reviewedAt: new Date()
            }
          : s
      ))

      toast.success(`Submission ${action.toLowerCase()}ed successfully!`)
      setShowReviewModal(false)
      setSelectedSubmission(null)

    } catch (error) {
      console.error('Error updating submission:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update submission')
    } finally {
      setLoadingSubmissions(prev => {
        const next = new Set(prev)
        next.delete(selectedSubmission.id)
        return next
      })
    }
  }

  const handleDownloadFile = async (submissionId: string) => {
    try {
      const response = await fetch(`/api/challenges/${params.id}/submissions/${submissionId}/download`)
      if (!response.ok) {
        throw new Error('Failed to download file')
      }
      
      // Create a blob from the response and trigger download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `submission-${submissionId}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      toast.error(t("submissions.downloadError"))
    }
  }

  const filteredSubmissions = submissions.filter(submission => {
    if (activeTab === "ALL") return true
    return submission.status === activeTab
  })

  const pendingCount = submissions.filter(s => s.status === "PENDING").length
  const acceptedCount = submissions.filter(s => s.status === "ACCEPTED").length
  const rejectedCount = submissions.filter(s => s.status === "REJECTED").length

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">{t("submissions.loading")}</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/challenges/manage" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("submissions.backToManage")}
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{t("submissions.title")}</h1>
                <p className="text-muted-foreground">{t("submissions.reviewAndEvaluate")}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("submissions.totalSubmissions")}</CardTitle>
                <FileText className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{submissions.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("submissions.pendingReview")}</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("submissions.accepted")}</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{acceptedCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("submissions.rejected")}</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rejectedCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Submissions Tabs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-primary" />
                {t("submissions.submissionsReview")}
              </CardTitle>
              <CardDescription>
                {t("submissions.reviewParticipant")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="ALL">{t("submissions.allTab")} ({submissions.length})</TabsTrigger>
                  <TabsTrigger value="PENDING">{t("submissions.pendingTab")} ({pendingCount})</TabsTrigger>
                  <TabsTrigger value="ACCEPTED">{t("submissions.acceptedTab")} ({acceptedCount})</TabsTrigger>
                  <TabsTrigger value="REJECTED">{t("submissions.rejectedTab")} ({rejectedCount})</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                  <div className="space-y-4">
                    {filteredSubmissions.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                        <p>{t("submissions.noSubmissionsFound")}</p>
                      </div>
                    ) : (
                      filteredSubmissions.map((submission) => (
                        <Card key={submission.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg">{submission.challenge.title}</h3>
                                  <Badge
                                    variant={getStatusVariant(submission.status)}
                                    className="text-xs flex items-center gap-1"
                                  >
                                    {getStatusIcon(submission.status)}
                                    {t(`submissions.status.${submission.status.toLowerCase()}`)}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {t("submissions.scoreLabel")}: {submission.score !== null ? `${submission.score}/${submission.challenge.points}` : t("submissions.notGraded")}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={submission.user.avatar || ""} />
                                      <AvatarFallback className="text-xs">
                                        {submission.user.name?.charAt(0) || "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{submission.user.name}</span> 
                                  </div>
                                  <span>{t("submissions.languageLabel")}: {submission.language || 'N/A'}</span>
                                  <span>{t("submissions.submittedLabel")}: {new Date(submission.submittedAt).toLocaleDateString()}</span>
                                  {submission.executionTime && <span>{t("submissions.runtimeLabel")}: {submission.executionTime}ms</span>}
                                  {submission.memory && <span>{t("submissions.memoryLabel")}: {submission.memory}KB</span>}
                                </div>

                                {/* Feedback */}
                                {submission.feedbacks.length > 0 && (
                                  <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 mb-4">
                                    <h4 className="text-sm font-medium mb-2">{t("submissions.feedbackLabel")}:</h4>
                                    {submission.feedbacks.map((feedback) => (
                                      <div key={feedback.id} className="text-sm">
                                        <p className="mb-1">{feedback.comment}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {t("submissions.ratingLabel")}: {feedback.rating}/5 - {t("submissions.byLabel")} {feedback.creator}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-3 flex-wrap">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleViewCode(submission)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                {t("submissions.viewCode")}
                              </Button>
                              
                              {submission.hasFile && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleDownloadFile(submission.id)}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  {t("submissions.downloadFile")}
                                </Button>
                              )}
                              
                              {submission.status === 'PENDING' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handleReviewClick(submission, 'ACCEPT')}
                                    disabled={loadingSubmissions.has(submission.id)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    {loadingSubmissions.has(submission.id) ? t("submissions.processing") : t("submissions.accept")}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => handleReviewClick(submission, 'REJECT')}
                                    disabled={loadingSubmissions.has(submission.id)}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    {loadingSubmissions.has(submission.id) ? t("submissions.processing") : t("submissions.reject")}
                                  </Button>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Code View Modal */}
      <Dialog open={showCodeModal} onOpenChange={setShowCodeModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("submissions.submissionCode")}</DialogTitle>
            <DialogDescription>
              {selectedSubmission && `${t("submissions.submittedBy")} ${selectedSubmission.user.name} ${selectedSubmission.language ? `in ${selectedSubmission.language}` : ''}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="mt-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{t("submissions.codeSubmission")}</span>
                  {selectedSubmission.hasFile && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDownloadFile(selectedSubmission.id)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      {t("submissions.downloadFile")}
                    </Button>
                  )}
                </div>
                <pre className="text-sm overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap">
                  <code>{selectedSubmission.code || t("submissions.noCodeAvailable")}</code>
                </pre>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowCodeModal(false)}>
              {t("submissions.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("submissions.reviewSubmission")}</DialogTitle>
            <DialogDescription>
              {t("submissions.setScoreFeedback")}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <h4 className="font-medium">{selectedSubmission.challenge.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("submissions.submittedBy")} {selectedSubmission.user.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("submissions.maxPoints")}: {selectedSubmission.challenge.points}
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="score">{t("submissions.scoreField")}</Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  max={selectedSubmission.challenge.points}
                  value={customScore}
                  onChange={(e) => setCustomScore(Number(e.target.value))}
                  placeholder={t("submissions.enterScore")}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="feedback">{t("submissions.feedbackField")}</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={t("submissions.provideFeedback")}
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewModal(false)}>
              {t("submissions.cancel")}
            </Button>
            <Button 
              onClick={handleConfirmReview}
              className={customScore > 0 ? "bg-green-600 hover:bg-green-700" : ""}
              variant={customScore > 0 ? "default" : "destructive"}
              disabled={!selectedSubmission || customScore < 0 || customScore > (selectedSubmission?.challenge.points || 0)}
            >
              {customScore > 0 ? t("submissions.acceptSubmission") : t("submissions.rejectSubmission")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

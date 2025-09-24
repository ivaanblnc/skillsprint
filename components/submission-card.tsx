'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  CheckCircle, 
  XCircle, 
  Code2, 
  Download, 
  AlertCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface Submission {
  id: string
  challenge: {
    id: string
    title: string
    difficulty: string
    points: number
  }
  user: {
    id: string
    name: string
    email: string
    avatar: string | null
  }
  submittedAt: Date
  language: string | null
  status: string
  code: string | null
  hasFile: boolean
  executionTime: number | null
  memory: number | null
}

interface SubmissionCardProps {
  submission: Submission
  onStatusUpdate: (submissionId: string, newStatus: string) => void
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" {
  switch (status) {
    case "ACCEPTED":
      return "default"
    case "PENDING":
      return "secondary"
    case "WRONG_ANSWER":
    case "TIME_LIMIT_EXCEEDED":
    case "RUNTIME_ERROR":
    case "COMPILATION_ERROR":
      return "destructive"
    default:
      return "secondary"
  }
}

function getDifficultyVariant(difficulty: string): "default" | "secondary" | "destructive" {
  switch (difficulty?.toUpperCase()) {
    case "EASY":
      return "secondary"
    case "MEDIUM":
      return "default"
    case "HARD":
      return "destructive"
    default:
      return "default"
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

export function SubmissionCard({ submission, onStatusUpdate }: SubmissionCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [feedbackAction, setFeedbackAction] = useState<'accept' | 'reject' | null>(null)
  const [feedback, setFeedback] = useState('')
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const { toast } = useToast()

  const handleStatusUpdate = async (status: 'ACCEPTED' | 'REJECTED') => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/judge/submissions/${submission.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          feedback: feedback.trim() || undefined
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update submission')
      }

      const result = await response.json()
      
      toast({
        title: "Success",
        description: result.message,
      })

      onStatusUpdate(submission.id, status)
      setShowFeedbackDialog(false)
      setFeedback('')
      setFeedbackAction(null)
    } catch (error) {
      console.error('Error updating submission:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update submission",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openFeedbackDialog = (action: 'accept' | 'reject') => {
    setFeedbackAction(action)
    setShowFeedbackDialog(true)
  }

  const handleFeedbackSubmit = () => {
    if (feedbackAction) {
      handleStatusUpdate(feedbackAction === 'accept' ? 'ACCEPTED' : 'REJECTED')
    }
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg">{submission.challenge.title}</h3>
                <Badge
                  variant={getDifficultyVariant(submission.challenge.difficulty)}
                  className="text-xs"
                >
                  {submission.challenge.difficulty}
                </Badge>
                <Badge
                  variant={getStatusVariant(submission.status)}
                  className="text-xs flex items-center gap-1"
                >
                  {getStatusIcon(submission.status)}
                  {submission.status}
                </Badge>
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
                {submission.language && <span>Language: {submission.language}</span>}
                <span>Points: {submission.challenge.points}</span>
                {submission.executionTime && <span>Runtime: {submission.executionTime}ms</span>}
                {submission.memory && <span>Memory: {submission.memory}KB</span>}
              </div>

              {submission.code && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Submitted Code</span>
                  </div>
                  <pre className="text-xs overflow-x-auto max-h-40 overflow-y-auto">
                    <code>{submission.code}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            {submission.hasFile && (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/api/judge/submissions/${submission.id}/download`}>
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Link>
              </Button>
            )}
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => openFeedbackDialog('accept')}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Accept
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => openFeedbackDialog('reject')}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
              Reject
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowDetailDialog(true)}
            >
              <Code2 className="h-4 w-4 mr-2" />
              Review in Detail
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/challenges/${submission.challenge.id}`}>
                View Challenge Details
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {feedbackAction === 'accept' ? 'Accept' : 'Reject'} Submission
            </DialogTitle>
            <DialogDescription>
              {feedbackAction === 'accept' 
                ? 'Provide feedback for this accepted submission (optional).'
                : 'Please provide feedback explaining why this submission is being rejected.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                placeholder={feedbackAction === 'accept' 
                  ? "Great work! Consider improving..." 
                  : "This submission needs improvement because..."
                }
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowFeedbackDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleFeedbackSubmit}
              disabled={isLoading}
              className={feedbackAction === 'accept' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={feedbackAction === 'reject' ? 'destructive' : 'default'}
            >
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {feedbackAction === 'accept' ? 'Accept' : 'Reject'} Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[600px]">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              Review the complete submission information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Challenge</Label>
                <p className="text-sm font-medium">{submission.challenge.title}</p>
              </div>
              <div>
                <Label>Participant</Label>
                <p className="text-sm font-medium">{submission.user.name}</p>
              </div>
              <div>
                <Label>Language</Label>
                <p className="text-sm">{submission.language || 'Not specified'}</p>
              </div>
              <div>
                <Label>Status</Label>
                <Badge variant={getStatusVariant(submission.status)} className="w-fit">
                  {submission.status}
                </Badge>
              </div>
              <div>
                <Label>Points</Label>
                <p className="text-sm">{submission.challenge.points}</p>
              </div>
              <div>
                <Label>Submitted</Label>
                <p className="text-sm">{new Date(submission.submittedAt).toLocaleString()}</p>
              </div>
            </div>
            
            {submission.code && (
              <div>
                <Label>Code</Label>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mt-2">
                  <pre className="text-xs overflow-x-auto max-h-80 overflow-y-auto">
                    <code>{submission.code}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowDetailDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

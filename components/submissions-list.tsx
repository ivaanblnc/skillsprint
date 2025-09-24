"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle, XCircle, AlertCircle, Code2, Download } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

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
    email: string | null
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

interface SubmissionsListProps {
  initialSubmissions: Submission[]
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

export function SubmissionsList({ initialSubmissions }: SubmissionsListProps) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions)
  const [loadingSubmissions, setLoadingSubmissions] = useState<Set<string>>(new Set())

  const handleSubmissionAction = async (submissionId: string, action: 'ACCEPT' | 'REJECT') => {
    setLoadingSubmissions(prev => new Set(prev).add(submissionId))

    try {
      const response = await fetch('/api/judge/submissions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          action
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update submission')
      }

      const { submission: updatedSubmission } = await response.json()

      // Remove the submission from the list since it's no longer pending
      setSubmissions(prev => prev.filter(s => s.id !== submissionId))

      toast.success(`Submission ${action.toLowerCase()}ed successfully!`)

    } catch (error) {
      console.error('Error updating submission:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update submission')
    } finally {
      setLoadingSubmissions(prev => {
        const next = new Set(prev)
        next.delete(submissionId)
        return next
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-primary" />
          Pending Submissions
        </CardTitle>
        <CardDescription>
          Click on any submission to review the code and provide feedback
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p>No pending submissions to review</p>
            </div>
          ) : (
            submissions.map((submission) => (
              <Card key={submission.id} className="hover:shadow-md transition-shadow">
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
                        <span>Language: {submission.language}</span>
                        <span>Points: {submission.challenge.points}</span>
                        <span>Runtime: {submission.executionTime}ms</span>
                        <span>Memory: {submission.memory}KB</span>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Submitted Code</span>
                          <Button variant="outline" size="sm">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                        <pre className="text-xs overflow-x-auto max-h-40 overflow-y-auto">
                          <code>{submission.code}</code>
                        </pre>
                      </div>
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
                      onClick={() => handleSubmissionAction(submission.id, 'ACCEPT')}
                      disabled={loadingSubmissions.has(submission.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {loadingSubmissions.has(submission.id) ? 'Processing...' : 'Accept'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleSubmissionAction(submission.id, 'REJECT')}
                      disabled={loadingSubmissions.has(submission.id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {loadingSubmissions.has(submission.id) ? 'Processing...' : 'Reject'}
                    </Button>
                    <Button size="sm" variant="outline">
                      <Code2 className="h-4 w-4 mr-2" />
                      Review in Detail
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

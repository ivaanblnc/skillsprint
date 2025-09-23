"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Play, Send, Clock, Trophy, CheckCircle, XCircle, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Challenge {
  id: string
  title: string
  description: string
  difficulty: string
  points: number
  timeLimit: number
  testCases: Array<{
    input: string
    expectedOutput: string
  }>
}

interface Submission {
  code: string
  language: string
  status: string
  score?: number
  submittedAt: Date
}

interface CodeEditorProps {
  challenge: Challenge
  existingSubmission: Submission | null
  hasEnded: boolean
  userId: string
}

export function CodeEditor({ challenge, existingSubmission, hasEnded, userId }: CodeEditorProps) {
  const router = useRouter()
  const [code, setCode] = useState(existingSubmission?.code || "")
  const [language, setLanguage] = useState(existingSubmission?.language || "javascript")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<any[]>([])
  const [timeLeft, setTimeLeft] = useState(challenge.timeLimit * 60) // Convert to seconds
  const [isTimerActive, setIsTimerActive] = useState(!existingSubmission && !hasEnded)
  const [submissionResult, setSubmissionResult] = useState<any>(null)

  // Timer effect
  useEffect(() => {
    if (!isTimerActive || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsTimerActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isTimerActive, timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getLanguageTemplate = (lang: string) => {
    const templates = {
      javascript: `// Your solution here
function solution(input) {
    // Write your code here
    return result;
}`,
      python: `# Your solution here
def solution(input):
    # Write your code here
    return result`,
      java: `// Your solution here
public class Solution {
    public static String solution(String input) {
        // Write your code here
        return result;
    }
}`,
      cpp: `// Your solution here
#include <iostream>
#include <string>
using namespace std;

string solution(string input) {
    // Write your code here
    return result;
}`,
    }
    return templates[lang as keyof typeof templates] || templates.javascript
  }

  const handleLanguageChange = (newLanguage: string) => {
    if (code === getLanguageTemplate(language) || code === "") {
      setCode(getLanguageTemplate(newLanguage))
    }
    setLanguage(newLanguage)
  }

  const runTests = async () => {
    setIsRunning(true)
    setTestResults([])

    try {
      const response = await fetch("/api/submissions/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.id,
          code,
          language,
        }),
      })

      const result = await response.json()
      setTestResults(result.testResults || [])
    } catch (error) {
      console.error("Error running tests:", error)
    } finally {
      setIsRunning(false)
    }
  }

  const submitSolution = async () => {
    setIsSubmitting(true)
    setSubmissionResult(null)

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.id,
          code,
          language,
        }),
      })

      const result = await response.json()
      setSubmissionResult(result)
      setIsTimerActive(false)

      if (result.success) {
        // Redirect to challenge page after successful submission
        setTimeout(() => {
          router.push(`/challenges/${challenge.id}`)
        }, 3000)
      }
    } catch (error) {
      console.error("Error submitting solution:", error)
      setSubmissionResult({ success: false, error: "Failed to submit solution" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const timeProgress = ((challenge.timeLimit * 60 - timeLeft) / (challenge.timeLimit * 60)) * 100

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Problem Description */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Link href={`/challenges/${challenge.id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <Badge
                variant={
                  challenge.difficulty === "EASY"
                    ? "secondary"
                    : challenge.difficulty === "MEDIUM"
                      ? "default"
                      : "destructive"
                }
              >
                {challenge.difficulty}
              </Badge>
            </div>
            <CardTitle className="text-xl text-balance">{challenge.title}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <Trophy className="h-3 w-3 mr-1" />
                {challenge.points} pts
              </Badge>
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {challenge.timeLimit} min
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-pretty whitespace-pre-wrap">{challenge.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Test Cases */}
        {challenge.testCases.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Example Test Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {challenge.testCases.map((testCase, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-semibold text-xs mb-1">Input:</h4>
                        <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                          <code>{testCase.input}</code>
                        </pre>
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs mb-1">Expected Output:</h4>
                        <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                          <code>{testCase.expectedOutput}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timer */}
        {isTimerActive && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Remaining
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-mono font-bold mb-2">{formatTime(timeLeft)}</div>
                <Progress value={timeProgress} className="mb-2" />
                <p className="text-xs text-muted-foreground">{timeLeft <= 300 ? "Hurry up!" : "Keep going!"}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Code Editor */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Code Editor</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={language} onValueChange={handleLanguageChange} disabled={!!existingSubmission}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="cpp">C++</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {existingSubmission && (
              <CardDescription>
                This is your submitted solution. Status: {existingSubmission.status.replace("_", " ")}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={getLanguageTemplate(language)}
              className="font-mono text-sm min-h-96 resize-none"
              disabled={!!existingSubmission}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        {!existingSubmission && !hasEnded && (
          <div className="flex gap-4">
            <Button onClick={runTests} disabled={isRunning || !code.trim()} variant="outline">
              <Play className="h-4 w-4 mr-2" />
              {isRunning ? "Running..." : "Run Tests"}
            </Button>
            <Button
              onClick={submitSolution}
              disabled={isSubmitting || !code.trim() || timeLeft <= 0}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? "Submitting..." : "Submit Solution"}
            </Button>
          </div>
        )}

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Test Case {index + 1}</span>
                    <div className="flex items-center gap-2">
                      {result.passed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">{result.passed ? "Passed" : "Failed"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submission Result */}
        {submissionResult && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {submissionResult.success
                ? `Solution submitted successfully! Status: ${submissionResult.status}`
                : `Error: ${submissionResult.error}`}
            </AlertDescription>
          </Alert>
        )}

        {/* Existing Submission Info */}
        {existingSubmission && (
          <Card>
            <CardHeader>
              <CardTitle>Submission Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge
                    variant={
                      existingSubmission.status === "ACCEPTED"
                        ? "default"
                        : existingSubmission.status === "PENDING"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {existingSubmission.status.replace("_", " ")}
                  </Badge>
                </div>
                {existingSubmission.score && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Score:</span>
                    <span className="text-sm font-medium">{existingSubmission.score}/100</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Submitted:</span>
                  <span className="text-sm font-medium">
                    {new Date(existingSubmission.submittedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

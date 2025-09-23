"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Upload, Code2, Save, Clock, Trophy, Target, FileText, ArrowLeft, X } from "lucide-react"
import Link from "next/link"
import { DashboardNav } from "@/components/dashboard-nav"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Mock data - Same as the challenges page
const mockChallenges = {
  "challenge-1": {
    id: "challenge-1",
    title: "Two Sum",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    difficulty: "EASY",
    points: 100,
    timeLimit: 30,
    status: "ACTIVE",
    createdAt: "2025-09-20T10:00:00Z",
    endDate: "2025-12-31T23:59:59Z",
    creator: {
      name: "John Doe",
      avatar: null
    },
    testCases: [
      {
        input: "[2,7,11,15], target = 9",
        expectedOutput: "[0,1]"
      },
      {
        input: "[3,2,4], target = 6", 
        expectedOutput: "[1,2]"
      }
    ],
    submissions: { count: 150 }
  },
  "challenge-2": {
    id: "challenge-2",
    title: "Valid Parentheses",
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    difficulty: "EASY",
    points: 120,
    timeLimit: 25,
    status: "ACTIVE",
    createdAt: "2025-09-21T10:00:00Z",
    endDate: "2025-12-31T23:59:59Z",
    creator: {
      name: "Jane Smith",
      avatar: null
    },
    testCases: [
      {
        input: '"()"',
        expectedOutput: "true"
      },
      {
        input: '"()[]{}"',
        expectedOutput: "true"
      },
      {
        input: '"(]"',
        expectedOutput: "false"
      }
    ],
    submissions: { count: 95 }
  },
  "challenge-3": {
    id: "challenge-3",
    title: "Binary Search",
    description: "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.",
    difficulty: "MEDIUM",
    points: 200,
    timeLimit: 45,
    status: "ACTIVE",
    createdAt: "2025-09-22T10:00:00Z",
    endDate: "2025-12-31T23:59:59Z",
    creator: {
      name: "Alice Johnson",
      avatar: null
    },
    testCases: [
      {
        input: "nums = [-1,0,3,5,9,12], target = 9",
        expectedOutput: "4"
      },
      {
        input: "nums = [-1,0,3,5,9,12], target = 2",
        expectedOutput: "-1"
      }
    ],
    submissions: { count: 67 }
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

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export default function ChallengeSubmitPage() {
  const params = useParams()
  const router = useRouter()
  const challengeId = params.id as string
  
  // Estado del componente
  const [timeLeft, setTimeLeft] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [language, setLanguage] = useState("javascript")
  const [code, setCode] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState("code")
  const [output, setOutput] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [showSaveDraftDialog, setShowSaveDraftDialog] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [existingSubmission, setExistingSubmission] = useState<any>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Obtener el challenge
  const challenge = mockChallenges[challengeId as keyof typeof mockChallenges]
  
  if (!challenge) {
    return <div>Challenge not found</div>
  }

  // Cargar envío existente al montar el componente
  useEffect(() => {
    const loadExistingSubmission = async () => {
      try {
        const response = await fetch(`/api/submissions?challengeId=${challengeId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.submission) {
            setExistingSubmission(data.submission)
            setCode(data.submission.code || "")
            setLanguage(data.submission.language || "javascript")
            
            // Verificar si es un envío final basado en isDraft
            // Draft = isDraft: true, Final submission = isDraft: false
            if (!data.submission.isDraft) {
              setIsSubmitted(true)
              setIsActive(false) // Detener el timer
            }
          }
        }
      } catch (error) {
        console.error("Error loading existing submission:", error)
      }
    }

    loadExistingSubmission()
  }, [challengeId])

  // Inicializar el timer cuando se monta el componente
  useEffect(() => {
    if (challenge && !isSubmitted) {
      const totalTime = challenge.timeLimit * 60 // convertir minutos a segundos
      setTimeLeft(totalTime)
      setIsActive(true)
    }
  }, [challenge, isSubmitted])

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isActive && timeLeft > 0 && !isSubmitted) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            setIsActive(false)
            // Auto-submit when time runs out
            handleAutoSubmit()
            return 0
          }
          return prevTime - 1
        })
      }, 1000)
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false)
      handleAutoSubmit()
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, timeLeft])

  // Auto-submit function when time runs out
  const handleAutoSubmit = async () => {
    if (isSubmitted || isSubmitting) return
    
    toast.error("Time's up! Auto-submitting your current solution...")
    
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId,
          code: code || "// Time's up - auto submitted",
          language,
          isDraft: false
        })
      })

      const data = await response.json()

      if (response.ok) {
        setIsSubmitted(true)
        setExistingSubmission(data.submission)
        localStorage.removeItem(`draft_${challengeId}`)
        toast.success("Solution auto-submitted due to time limit")
        
        setTimeout(() => {
          router.push("/challenges")
        }, 3000)
      }
    } catch (error) {
      console.error("Auto-submit error:", error)
      toast.error("Failed to auto-submit solution")
    }
  }

  // Plantilla inicial del código
  useEffect(() => {
    const templates = {
      javascript: `// Write your solution here
function solution() {
    // Your code here
}

// Example usage:
// console.log(solution());`,
      python: `# Write your solution here
def solution():
    # Your code here
    pass

# Example usage:
# print(solution())`,
      java: `// Write your solution here
public class Solution {
    public void solution() {
        // Your code here
    }
}`,
      cpp: `// Write your solution here
#include <iostream>
using namespace std;

void solution() {
    // Your code here
}

int main() {
    solution();
    return 0;
}`
    }
    
    if (!code) {
      setCode(templates[language as keyof typeof templates] || templates.javascript)
    }
  }, [language, code])

  // Funciones de drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const file = files[0]
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("File size must be less than 5MB")
        return
      }
      setUploadedFile(file)
      toast.success(`File "${file.name}" uploaded successfully`)
    }
  }, [])

  // Función para seleccionar archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("File size must be less than 5MB")
        return
      }
      setUploadedFile(file)
      toast.success(`File "${file.name}" uploaded successfully`)
    }
  }

  // Función para ejecutar código - removido porque implementar un compilador real es muy complejo
  // const handleRunCode = async () => {
  //   toast.info("Code execution feature will be available soon!")
  // }

  // Función para guardar como draft
  const handleSaveDraft = () => {
    if (!code.trim() && !uploadedFile) {
      toast.error("Please provide a solution before saving")
      return
    }
    setShowSaveDraftDialog(true)
  }

  const confirmSaveDraft = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId,
          code,
          language,
          isDraft: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save draft')
      }

      // Guardar también en localStorage como backup
      localStorage.setItem(`draft_${challengeId}`, JSON.stringify({
        code,
        language,
        uploadedFile: uploadedFile ? {
          name: uploadedFile.name,
          size: uploadedFile.size,
          type: uploadedFile.type
        } : null,
        timestamp: new Date().toISOString()
      }))

      toast.success(data.message || "Draft saved successfully! You can continue later.")
      setShowSaveDraftDialog(false)
      router.push("/challenges")
    } catch (error) {
      console.error("Error saving draft:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save draft. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  // Función handleSave removida - era redundante con handleSaveDraft

  // Función para enviar solución final
  const handleSubmitSolution = () => {
    if (!code.trim() && !uploadedFile) {
      toast.error("Please provide a solution before submitting")
      return
    }

    if (isSubmitted) {
      toast.error("You have already submitted a solution for this challenge")
      return
    }

    setShowSubmitDialog(true)
  }

  const confirmSubmitSolution = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId,
          code,
          language,
          isDraft: false
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit solution')
      }

      // Limpiar el draft del localStorage
      localStorage.removeItem(`draft_${challengeId}`)
      
      // Marcar como enviado
      setIsSubmitted(true)
      setExistingSubmission(data.submission)
      
      toast.success(data.message || "Solution submitted successfully! Judges will review it soon.")
      setShowSubmitDialog(false)
      
      // Redirigir después de un momento para que el usuario vea el mensaje
      setTimeout(() => {
        router.push("/challenges")
      }, 2000)
    } catch (error) {
      console.error("Error submitting solution:", error)
      toast.error(error instanceof Error ? error.message : "Failed to submit solution. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calcular progreso del tiempo
  const totalTime = challenge ? challenge.timeLimit * 60 : 0
  const timeProgress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link 
              href={`/challenges/${challengeId}`} 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Challenge
            </Link>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">{challenge.title}</h1>
                <div className="flex items-center gap-4">
                  <Badge variant={getDifficultyVariant(challenge.difficulty)}>
                    {challenge.difficulty}
                  </Badge>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    {challenge.points} points
                  </span>
                </div>
              </div>

              {/* Timer */}
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className={`h-5 w-5 ${timeLeft < 300 ? 'text-destructive' : 'text-primary'}`} />
                  <div>
                    <div className={`text-lg font-mono font-bold ${timeLeft < 300 ? 'text-destructive' : ''}`}>
                      {formatTime(timeLeft)}
                    </div>
                    <Progress 
                      value={timeProgress} 
                      className={`w-32 h-2 ${timeLeft < 300 ? '[&>div]:bg-destructive' : ''}`}
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Problem Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Problem Description
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm">
                    {challenge.description}
                  </div>
                </div>

                {/* Test Cases */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Example Test Cases</h4>
                  {challenge.testCases.map((testCase, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <div className="text-sm font-medium">Example {index + 1}</div>
                      <div className="space-y-1">
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">INPUT:</span>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                            {testCase.input}
                          </pre>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">OUTPUT:</span>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                            {testCase.expectedOutput}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Solution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-primary" />
                  Solution
                </CardTitle>
                <CardDescription>
                  Write your code or upload a file with your solution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={isSubmitted ? undefined : setActiveTab} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="code" disabled={isSubmitted}>Code Editor</TabsTrigger>
                    <TabsTrigger value="upload" disabled={isSubmitted}>File Upload</TabsTrigger>
                  </TabsList>

                  <TabsContent value="code" className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Select value={language} onValueChange={setLanguage} disabled={isSubmitted}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="javascript">JavaScript</SelectItem>
                          <SelectItem value="python">Python</SelectItem>
                          <SelectItem value="java">Java</SelectItem>
                          <SelectItem value="cpp">C++</SelectItem>
                        </SelectContent>
                      </Select>
                      {isSubmitted && (
                        <Badge variant="secondary" className="ml-2">
                          Read Only - Solution Submitted
                        </Badge>
                      )}
                    </div>

                    <div className="relative">
                      <Textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder={isSubmitted ? "Solution already submitted - read only" : "Write your solution here..."}
                        className="min-h-[300px] font-mono text-sm"
                        disabled={isSubmitted}
                        readOnly={isSubmitted}
                      />
                    </div>

                    {output && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Output:</div>
                        <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                          {output}
                        </pre>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="upload" className="space-y-4">
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isSubmitted 
                          ? 'border-muted-foreground/25 bg-muted/50' 
                          : isDragging 
                            ? 'border-primary bg-primary/5' 
                            : 'border-muted-foreground/25 hover:border-primary/50'
                      }`}
                      onDragEnter={isSubmitted ? undefined : handleDragEnter}
                      onDragLeave={isSubmitted ? undefined : handleDragLeave}
                      onDragOver={isSubmitted ? undefined : handleDragOver}
                      onDrop={isSubmitted ? undefined : handleDrop}
                    >
                      <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          {isSubmitted ? "File upload disabled - Solution already submitted" : "Drag and drop your solution file here"}
                        </p>
                        {!isSubmitted && (
                          <>
                            <p className="text-xs text-muted-foreground">
                              or click to select a file (max 5MB)
                            </p>
                            <input
                              type="file"
                              onChange={handleFileSelect}
                              className="hidden"
                              id="file-upload"
                              accept=".js,.py,.java,.cpp,.c,.h,.hpp,.txt"
                            />
                            <label htmlFor="file-upload">
                              <Button variant="outline" className="mt-2" asChild>
                                <span>Select File</span>
                              </Button>
                            </label>
                          </>
                        )}
                      </div>
                    </div>

                    {uploadedFile && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm font-medium">{uploadedFile.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(uploadedFile.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUploadedFile(null)
                            toast.success("File removed")
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  {isSubmitted && (
                    <div className="w-full p-3 bg-muted rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">
                            Solution Submitted
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Status: {existingSubmission?.status === "ACCEPTED" ? "Accepted" : 
                                   existingSubmission?.status === "WRONG_ANSWER" ? "Wrong Answer" :
                                   existingSubmission?.status === "RUNTIME_ERROR" ? "Runtime Error" :
                                   "Pending Review"}
                          </div>
                          {existingSubmission?.score && (
                            <div className="text-xs text-muted-foreground">
                              Score: {existingSubmission.score}/100
                            </div>
                          )}
                        </div>
                        <Badge 
                          variant={existingSubmission?.status === "ACCEPTED" ? "secondary" : 
                                  existingSubmission?.status === "PENDING" ? "default" : "destructive"}
                        >
                          {existingSubmission?.status === "ACCEPTED" ? "✓ Accepted" : 
                           existingSubmission?.status === "PENDING" ? "⏳ Pending" : "✗ Failed"}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {!isSubmitted && (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={handleSaveDraft}
                        disabled={(!code.trim() && !uploadedFile) || isSaving}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Draft"}
                      </Button>
                      
                      <Button 
                        onClick={handleSubmitSolution}
                        disabled={(!code.trim() && !uploadedFile) || isSubmitting}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Target className="h-4 w-4 mr-2" />
                        {isSubmitting ? "Submitting..." : "Submit Final Solution"}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Save Draft Confirmation Dialog */}
      <AlertDialog open={showSaveDraftDialog} onOpenChange={setShowSaveDraftDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Draft</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save your current progress as a draft? You can continue working on it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSaveDraft} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Draft"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit Solution Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Final Solution</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit your final solution? Once submitted, you won't be able to make any changes to this challenge submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmitSolution} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Solution"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

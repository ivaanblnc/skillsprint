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

// Types
interface Challenge {
  id: string
  title: string
  description: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
  points: number
  timeLimit: number
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED"
  createdAt: string
  endDate?: string | null
  creator: {
    id: string
    name: string
  }
  testCases: Array<{
    id: string
    input: string
    expectedOutput: string
    isPublic: boolean
  }>
  _count: {
    submissions: number
    testCases: number
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
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

  // Obtener el challenge desde el API
  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/challenges/${challengeId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Challenge no encontrado")
          } else if (response.status === 401) {
            setError("No autorizado para acceder a este challenge")
          } else {
            setError("Error al cargar el challenge")
          }
          return
        }

        const data = await response.json()
        setChallenge(data.challenge)
      } catch (err) {
        console.error("Error fetching challenge:", err)
        setError("Error al cargar el challenge")
      } finally {
        setLoading(false)
      }
    }

    if (challengeId) {
      fetchChallenge()
    }
  }, [challengeId])

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

    if (challengeId) {
      loadExistingSubmission()
    }
  }, [challengeId])

  // Inicializar el timer cuando se monta el componente
  useEffect(() => {
    if (challenge && !isSubmitted && !loading) {
      const totalTime = challenge.timeLimit * 60 // convertir minutos a segundos
      setTimeLeft(totalTime)
      setIsActive(true)
    }
  }, [challenge, isSubmitted, loading])

  // Auto-submit function when time runs out
  const handleAutoSubmit = useCallback(async () => {
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
  }, [challengeId, code, language, isSubmitted, isSubmitting, router])

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
  }, [isActive, timeLeft, isSubmitted, handleAutoSubmit])

  // Plantilla inicial del código
  useEffect(() => {
    const templates = {
      javascript: `// Write your solution here
function solution() {
    // Your code here
    return result;
}

console.log(solution());`,
      python: `# Write your solution here
def solution():
    # Your code here
    return result

print(solution())`,
      java: `// Write your solution here
public class Solution {
    public static void main(String[] args) {
        // Your code here
        System.out.println("Result: ");
    }
}`,
      cpp: `// Write your solution here
#include <iostream>
using namespace std; 

int main() {
    // Your code here
    cout << "Result: " << endl;
    return 0;
}`
    }

    if (!code && !existingSubmission) {
      setCode(templates[language as keyof typeof templates] || templates.javascript)
    }
  }, [language, code, existingSubmission])

  // Guardar borrador automáticamente cada 30 segundos
  useEffect(() => {
    if (!isSubmitted && code && challengeId) {
      const interval = setInterval(() => {
        localStorage.setItem(`draft_${challengeId}`, JSON.stringify({
          code,
          language,
          timestamp: Date.now()
        }))
      }, 30000) // 30 segundos

      return () => clearInterval(interval)
    }
  }, [code, language, challengeId, isSubmitted])

  // Cargar borrador guardado
  useEffect(() => {
    if (!existingSubmission && challengeId) {
      const savedDraft = localStorage.getItem(`draft_${challengeId}`)
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft)
          if (draft.code && !code) {
            setCode(draft.code)
            setLanguage(draft.language || "javascript")
          }
        } catch (error) {
          console.error("Error loading draft:", error)
        }
      }
    }
  }, [challengeId, existingSubmission, code])

  // Event handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [])

  const handleFileUpload = useCallback((file: File) => {
    if (isSubmitted) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setCode(content)
      setUploadedFile(file)
      setActiveTab("code")
    }
    reader.readAsText(file)
  }, [isSubmitted])

  const handleRunCode = useCallback(async () => {
    if (!code.trim()) {
      toast.error("Please write some code first")
      return
    }

    try {
      setOutput("Running your code...\n")
      
      // Simulate code execution
      setTimeout(() => {
        setOutput(`> Code executed successfully!\n> Language: ${language}\n> Output:\nYour code output would appear here...`)
      }, 1000)
      
    } catch (error) {
      setOutput(`Error: ${error}`)
    }
  }, [code, language])

  const handleSaveDraft = useCallback(async () => {
    if (isSubmitted || isSaving) return
    
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

      if (response.ok) {
        setExistingSubmission(data.submission)
        localStorage.setItem(`draft_${challengeId}`, JSON.stringify({
          code,
          language,
          timestamp: Date.now()
        }))
        toast.success(data.message || "Draft saved successfully!")
        setShowSaveDraftDialog(false)
      } else {
        throw new Error(data.message || "Failed to save draft")
      }
    } catch (error) {
      console.error("Error saving draft:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save draft. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }, [challengeId, code, language, isSubmitted, isSaving])

  const handleSubmitSolution = useCallback(async () => {
    if (isSubmitted || isSubmitting) return
    
    if (!code.trim()) {
      toast.error("Please write some code before submitting")
      return
    }
    
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
        throw new Error(data.message || "Failed to submit solution")
      }

      // Detener el timer
      setIsActive(false)
      
      // Limpiar borrador guardado
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
  }, [challengeId, code, language, isSubmitted, isSubmitting, router])

  // Returns condicionales - DESPUÉS de todos los hooks
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNav />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando challenge...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNav />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => router.push("/challenges")}>
                Volver a Challenges
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNav />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Challenge no encontrado</h2>
              <Button onClick={() => router.push("/challenges")}>
                Volver a Challenges
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Calcular progreso del tiempo
  const totalTime = challenge.timeLimit * 60
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
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    {challenge.points} points
                  </span>
                </div>
              </div>

              {/* Timer */}
              <div className="text-right">
                <div className="flex items-center gap-2 text-lg font-semibold mb-2">
                  <Clock className="h-5 w-5" />
                  <span className={timeLeft < 300 ? "text-red-500" : "text-foreground"}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <Progress 
                  value={timeProgress} 
                  className="w-32 h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(timeProgress)}% elapsed
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column - Problem Description */}
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
                  {challenge.testCases.map((testCase: any, index: number) => (
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

            {/* Right Column - Solution */}
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
                          Submitted
                        </Badge>
                      )}
                    </div>

                    <Textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Write your solution here..."
                      className="min-h-[300px] font-mono text-sm"
                      disabled={isSubmitted}
                    />

                    {/* Code Actions */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={handleRunCode}
                        disabled={isSubmitted || !code.trim()}
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Run Code
                      </Button>
                      
                      {!isSubmitted && (
                        <>
                          <Button 
                            variant="outline"
                            onClick={() => setShowSaveDraftDialog(true)}
                            disabled={isSaving || !code.trim()}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {isSaving ? "Saving..." : "Save Draft"}
                          </Button>
                          
                          <Button 
                            onClick={() => setShowSubmitDialog(true)}
                            disabled={isSubmitting || !code.trim()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {isSubmitting ? "Submitting..." : "Submit Solution"}
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Output */}
                    {output && (
                      <div className="space-y-2">
                        <h4 className="font-semibold">Output</h4>
                        <pre className="bg-muted p-3 rounded text-sm overflow-x-auto whitespace-pre-wrap">
                          {output}
                        </pre>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="upload">
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">
                        Drop your file here or{" "}
                        <label className="text-primary cursor-pointer hover:underline">
                          browse
                          <input
                            type="file"
                            className="hidden"
                            accept=".js,.py,.java,.cpp,.c,.ts"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileUpload(file)
                            }}
                            disabled={isSubmitted}
                          />
                        </label>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supported formats: .js, .py, .java, .cpp, .c, .ts
                      </p>
                      
                      {uploadedFile && (
                        <div className="mt-4 p-3 bg-muted rounded flex items-center justify-between">
                          <span className="text-sm">{uploadedFile.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setUploadedFile(null)
                              setCode("")
                            }}
                            disabled={isSubmitted}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Submission Status */}
                {existingSubmission && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {existingSubmission.isDraft ? "Draft Saved" : "Solution Submitted"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Language: {existingSubmission.language} • 
                          {existingSubmission.isDraft 
                            ? " You can continue editing and submit when ready"
                            : " Your solution is under review"
                          }
                        </p>
                      </div>
                      <Badge variant={existingSubmission.isDraft ? "secondary" : "default"}>
                        {existingSubmission.isDraft ? "Draft" : "Submitted"}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Save Draft Dialog */}
      <AlertDialog open={showSaveDraftDialog} onOpenChange={setShowSaveDraftDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Draft</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save this as a draft? You can continue editing and submit later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveDraft} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Draft"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit Solution Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Solution</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit your solution? This action cannot be undone and your submission will be sent for review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitSolution} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Solution"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

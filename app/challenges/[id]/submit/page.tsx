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
import { useTranslations } from "@/lib/i18n"
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
  const t = useTranslations()
  
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
            setError("Desafío no encontrado")
          } else if (response.status === 401) {
            setError("No autorizado para acceder a este desafío")
          } else {
            setError("Error al cargar el desafío")
          }
          return
        }

        const data = await response.json()
        setChallenge(data.challenge)
      } catch (err) {
        console.error("Error fetching challenge:", err)
        setError("Error al cargar el desafío")
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
        }        } catch (error) {
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
    if (challenge && !isSubmitted && !loading) {
      const totalTime = challenge.timeLimit * 60 // convertir minutos a segundos
      setTimeLeft(totalTime)
      setIsActive(true)
    }
  }, [challenge, isSubmitted, loading])

  // Auto-submit function when time runs out
  const handleAutoSubmit = useCallback(async () => {
    if (isSubmitted || isSubmitting) return
    
    toast.error("¡Se acabó el tiempo! Auto-enviando tu solución actual...")
    
    try {
      let fileUrl: string | undefined = undefined

      // Upload file if present
      if (uploadedFile) {
        try {
          // Get current user first
          const userResponse = await fetch('/api/user/profile')
          const userData = await userResponse.json()
          
          if (userResponse.ok && userData.id) {
            const formData = new FormData()
            formData.append('file', uploadedFile)
            formData.append('challengeId', challengeId)
            formData.append('userId', userData.id)

            const uploadResponse = await fetch('/api/submissions/upload', {
              method: 'POST',
              body: formData
            })

            const uploadData = await uploadResponse.json()

            if (uploadResponse.ok) {
              fileUrl = uploadData.fileUrl
            }
          }
        } catch (uploadError) {
          console.error('Error uploading file during auto-submit:', uploadError)
        }
      }

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId,
          code: code || "// Se acabó el tiempo - enviado automáticamente",
          language,
          fileUrl,
          isDraft: false
        })
      })

      const data = await response.json()

      if (response.ok) {
        setIsSubmitted(true)
        setExistingSubmission(data.submission)
        localStorage.removeItem(`draft_${challengeId}`)
        toast.success("Solución auto-enviada debido al límite de tiempo")
        
        setTimeout(() => {
          router.push("/challenges")
        }, 3000)
      }
    } catch (error) {
      console.error("Auto-submit error:", error)
      toast.error("Error al auto-enviar la solución")
    }
  }, [challengeId, code, language, uploadedFile, isSubmitted, isSubmitting, router])

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
        toast.error("El tamaño del archivo debe ser menor a 5MB")
        return
      }
      setUploadedFile(file)
      toast.success(`Archivo "${file.name}" subido exitosamente`)
    }
  }, [])

  // Función para seleccionar archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("El tamaño del archivo debe ser menor a 5MB")
        return
      }
      setUploadedFile(file)
      toast.success(`Archivo "${file.name}" subido exitosamente`)
    }
  }

  // Función para ejecutar código - removido porque implementar un compilador real es muy complejo
  // const handleRunCode = async () => {
  //   toast.info("Code execution feature will be available soon!")
  // }

  // Función para guardar como draft
  const handleSaveDraft = () => {
    if (!code.trim() && !uploadedFile) {
      toast.error("Por favor proporciona una solución antes de guardar")
      return
    }
    setShowSaveDraftDialog(true)
  }

  const confirmSaveDraft = async () => {
    setIsSaving(true)
    try {
      let fileUrl: string | undefined = undefined

      // Upload file if present
      if (uploadedFile) {
        // Get current user first
        const userResponse = await fetch('/api/user/profile')
        const userData = await userResponse.json()
        
        if (!userResponse.ok || !userData.id) {
          throw new Error('No se pudo obtener la información del usuario')
        }

        const formData = new FormData()
        formData.append('file', uploadedFile)
        formData.append('challengeId', challengeId)
        formData.append('userId', userData.id)

        const uploadResponse = await fetch('/api/submissions/upload', {
          method: 'POST',
          body: formData
        })

        const uploadData = await uploadResponse.json()

        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || 'Error al subir el archivo')
        }

        fileUrl = uploadData.fileUrl
      }

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId,
          code,
          language,
          fileUrl,
          isDraft: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar el borrador')
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

      toast.success(data.message || "¡Borrador guardado exitosamente! Puedes continuar más tarde.")
      setShowSaveDraftDialog(false)
      router.push("/challenges")
    } catch (error) {
      console.error("Error saving draft:", error)
      toast.error(error instanceof Error ? error.message : "Error al guardar el borrador. Inténtalo de nuevo.")
    } finally {
      setIsSaving(false)
    }
  }

  // Función handleSave removida - era redundante con handleSaveDraft

  // Función para enviar solución final
  const handleSubmitSolution = () => {
    if (!code.trim() && !uploadedFile) {
      toast.error("Por favor proporciona una solución antes de enviar")
      return
    }

    if (isSubmitted) {
      toast.error("Ya has enviado una solución para este desafío")
      return
    }

    setShowSubmitDialog(true)
  }

  const confirmSubmitSolution = async () => {
    setIsSubmitting(true)
    try {
      let fileUrl: string | undefined = undefined

      // Upload file if present
      if (uploadedFile) {
        // Get current user first
        const userResponse = await fetch('/api/user/profile')
        const userData = await userResponse.json()
        
        if (!userResponse.ok || !userData.id) {
          throw new Error('No se pudo obtener la información del usuario')
        }

        const formData = new FormData()
        formData.append('file', uploadedFile)
        formData.append('challengeId', challengeId)
        formData.append('userId', userData.id)

        const uploadResponse = await fetch('/api/submissions/upload', {
          method: 'POST',
          body: formData
        })

        const uploadData = await uploadResponse.json()

        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || 'Error al subir el archivo')
        }

        fileUrl = uploadData.fileUrl
      }

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId,
          code,
          language,
          fileUrl,
          isDraft: false
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar la solución')
      }

      // Limpiar el draft del localStorage
      localStorage.removeItem(`draft_${challengeId}`)
      
      // Marcar como enviado
      setIsSubmitted(true)
      setExistingSubmission(data.submission)
      
      toast.success(data.message || "¡Solución enviada exitosamente! Los jueces la revisarán pronto.")
      setShowSubmitDialog(false)
      
      // Redirigir después de un momento para que el usuario vea el mensaje
      setTimeout(() => {
        router.push("/challenges")
      }, 2000)
    } catch (error) {
      console.error("Error submitting solution:", error)
      toast.error(error instanceof Error ? error.message : "Error al enviar la solución. Inténtalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calcular progreso del tiempo
  const totalTime = challenge ? challenge.timeLimit * 60 : 0
  const timeProgress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0

  // Verificar que el challenge existe antes de renderizar
  if (!challenge) {
    return null // Esto nunca debería ejecutarse porque ya manejamos el loading y error states arriba
  }

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
              Volver al Desafío
            </Link>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">{challenge.title}</h1>
                <div className="flex items-center gap-4">
                  <Badge variant={getDifficultyVariant(challenge.difficulty)}>
                    {t(`challenges.difficulty.${challenge.difficulty.toLowerCase()}`)}
                  </Badge>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    {challenge.points} puntos
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
                  Descripción del Problema
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
                  <h4 className="font-semibold">Casos de Prueba de Ejemplo</h4>
                  {challenge.testCases.map((testCase: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <div className="text-sm font-medium">Ejemplo {index + 1}</div>
                      <div className="space-y-1">
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">ENTRADA:</span>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                            {testCase.input}
                          </pre>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">SALIDA:</span>
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
                  Solución
                </CardTitle>
                <CardDescription>
                  Escribe tu código o sube un archivo con tu solución
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={isSubmitted ? undefined : setActiveTab} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="code" disabled={isSubmitted}>Editor de Código</TabsTrigger>
                    <TabsTrigger value="upload" disabled={isSubmitted}>Subir Archivo</TabsTrigger>
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
                          Solo Lectura - Solución Enviada
                        </Badge>
                      )}
                    </div>

                    <div className="relative">
                      <Textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder={isSubmitted ? "Solución ya enviada - solo lectura" : "Escribe tu solución aquí..."}
                        className="min-h-[300px] font-mono text-sm"
                        disabled={isSubmitted}
                        readOnly={isSubmitted}
                      />
                    </div>

                    {output && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Resultado:</div>
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
                          {isSubmitted ? "Subida de archivos deshabilitada - Solución ya enviada" : "Arrastra y suelta tu archivo de solución aquí"}
                        </p>
                        {!isSubmitted && (
                          <>
                            <p className="text-xs text-muted-foreground">
                              o haz clic para seleccionar un archivo (máx 5MB)
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
                                <span>Seleccionar Archivo</span>
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
                            toast.success("Archivo eliminado")
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
                            Solución Enviada
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Estado: {existingSubmission?.status === "ACCEPTED" ? "Solución Aceptada" : 
                                   existingSubmission?.status === "WRONG_ANSWER" ? "Respuesta Incorrecta" :
                                   existingSubmission?.status === "RUNTIME_ERROR" ? "Error de Ejecución" :
                                   "Pendiente"}
                          </div>
                          {existingSubmission?.score && (
                            <div className="text-xs text-muted-foreground">
                              Puntuación: {existingSubmission.score}/100
                            </div>
                          )}
                        </div>
                        <Badge 
                          variant={existingSubmission?.status === "ACCEPTED" ? "secondary" : 
                                  existingSubmission?.status === "PENDING" ? "default" : "destructive"}
                        >
                          {existingSubmission?.status === "ACCEPTED" ? "✓ Solución Aceptada" : 
                           existingSubmission?.status === "PENDING" ? "⏳ Pendiente" : "✗ Solución Rechazada"}
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
                        {isSaving ? "Guardando..." : "Guardar Borrador"}
                      </Button>
                      
                      <Button 
                        onClick={handleSubmitSolution}
                        disabled={(!code.trim() && !uploadedFile) || isSubmitting}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Target className="h-4 w-4 mr-2" />
                        {isSubmitting ? "Enviando..." : "Enviar Solución Final"}
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
            <AlertDialogTitle>Guardar Borrador</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres guardar tu progreso actual como borrador? Puedes continuar trabajando en él más tarde.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSaveDraft} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar Borrador"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit Solution Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar Solución Final</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres enviar tu solución final? Una vez enviada, no podrás hacer cambios a este envío de desafío.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmitSolution} disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar Solución"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/**
 * Challenge Create Client Component - Refactorized
 * Client Component que maneja la creación de challenges
 */

"use client"

import React from 'react'
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  CalendarIcon, Plus, Trash2, Save, Eye, ArrowLeft, Loader2, 
  CheckCircle, AlertCircle, Code2, Timer, Trophy, Clock, Users, X
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useChallengeForm, useTestCases, useChallengeActions } from "@/lib/hooks"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { ChallengeDifficulty, CreateTestCase } from '@/lib/types'

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

// Component Props Interface
interface ChallengeCreateClientProps {
  authUser: SupabaseUser
  translations: Record<string, any>
}

// Test Case Form Component
const TestCaseForm: React.FC<{
  testCase: CreateTestCase
  index: number
  onUpdate: (field: keyof CreateTestCase, value: any) => void
  onRemove: () => void
  canRemove: boolean
  t: (key: string) => string
}> = ({ testCase, index, onUpdate, onRemove, canRemove, t }) => (
  <Card className="border-l-4 border-l-primary/20">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-medium">
          {t("create.testCase")} #{index + 1}
        </CardTitle>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`input-${index}`} className="text-sm font-medium">
          {t("create.input")}
        </Label>
        <Textarea
          id={`input-${index}`}
          value={testCase.input}
          onChange={(e) => onUpdate('input', e.target.value)}
          placeholder={t("create.inputPlaceholder")}
          className="font-mono text-sm min-h-[80px]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`output-${index}`} className="text-sm font-medium">
          {t("create.expectedOutput")}
        </Label>
        <Textarea
          id={`output-${index}`}
          value={testCase.expectedOutput}
          onChange={(e) => onUpdate('expectedOutput', e.target.value)}
          placeholder={t("create.outputPlaceholder")}
          className="font-mono text-sm min-h-[80px]"
        />
      </div>
    </CardContent>
  </Card>
)

// Preview Modal Component
const ChallengePreview: React.FC<{
  formData: any
  testCases: CreateTestCase[]
  t: (key: string, params?: Record<string, string>) => string
}> = ({ formData, testCases, t }) => {
  const getDifficultyBadgeVariant = (difficulty: string) => {
    switch (difficulty) {
      case "EASY": return "secondary"
      case "MEDIUM": return "default"
      case "HARD": return "destructive"
      default: return "outline"
    }
  }

  const formatTimeRemaining = () => {
    if (!formData.endDate) return "N/A"
    const days = Math.max(0, Math.floor((formData.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    return `${days} ${days === 1 ? 'día' : 'días'}`
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header compacto y atractivo */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold mb-3 line-clamp-2">
          {formData.title || "Título del desafío"}
        </h2>
        
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant={getDifficultyBadgeVariant(formData.difficulty)} className="text-xs">
            {formData.difficulty ? t(`challenges.difficulty.${formData.difficulty.toLowerCase()}`) : "Sin dificultad"}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Trophy className="h-3 w-3 mr-1" />
            {formData.points || 0} pts
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {formData.timeLimit || 0} min
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            0 participantes
          </Badge>
        </div>

        <div className="text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Timer className="h-3 w-3" />
            {formatTimeRemaining()} restantes
          </span>
        </div>
      </div>

      {/* Contenido principal - una sola columna más limpia */}
      <div className="space-y-5">
        {/* Quick stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card border rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground">Estado</div>
            <Badge variant="secondary" className="text-xs mt-1">Borrador</Badge>
          </div>
          <div className="bg-card border rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground">Puntos</div>
            <div className="font-semibold text-sm mt-1">{formData.points || 0}</div>
          </div>
          <div className="bg-card border rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground">Tiempo límite</div>
            <div className="font-semibold text-sm mt-1">{formData.timeLimit || 0} min</div>
          </div>
          <div className="bg-card border rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground">Test cases</div>
            <div className="font-semibold text-sm mt-1">{testCases.length}</div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            📋 Descripción del Problema
          </h3>
          <div className="bg-muted/50 rounded-lg p-4 border">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {formData.description || "Describe aquí tu problema..."}
            </p>
          </div>
        </div>

        {/* Test Cases mejorados */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            🧪 Casos de Prueba
          </h3>
          {testCases.length > 0 ? (
            <div className="space-y-3">
              {testCases.slice(0, 3).map((testCase, index) => (
                <div key={index} className="bg-card border rounded-lg overflow-hidden">
                  <div className="bg-muted/30 px-4 py-2 border-b">
                    <span className="text-sm font-medium">Ejemplo {index + 1}</span>
                  </div>
                  <div className="p-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-2">ENTRADA:</div>
                        <pre className="text-xs bg-muted/50 p-3 rounded border font-mono overflow-x-auto">
{testCase.input || "// Sin entrada definida"}
                        </pre>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-2">SALIDA ESPERADA:</div>
                        <pre className="text-xs bg-muted/50 p-3 rounded border font-mono overflow-x-auto">
{testCase.expectedOutput || "// Sin salida definida"}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {testCases.length > 3 && (
                <div className="text-center">
                  <Badge variant="outline" className="text-xs">
                    +{testCases.length - 3} casos más
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
              <Code2 className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No hay casos de prueba definidos</p>
            </div>
          )}
        </div>

        {/* Fechas - solo si existen */}
        {(formData.startDate || formData.endDate) && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              📅 Programación
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {formData.startDate && (
                <div className="bg-card border rounded-lg p-4">
                  <div className="text-xs text-muted-foreground">Fecha de inicio</div>
                  <div className="font-medium text-sm mt-1">
                    {format(formData.startDate, "dd/MM/yyyy")}
                  </div>
                </div>
              )}
              {formData.endDate && (
                <div className="bg-card border rounded-lg p-4">
                  <div className="text-xs text-muted-foreground">Fecha de fin</div>
                  <div className="font-medium text-sm mt-1">
                    {format(formData.endDate, "dd/MM/yyyy")}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Acciones simuladas */}
        <div className="bg-muted/20 rounded-lg p-4 border-2 border-dashed">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            🚀 Vista previa de acciones
          </h3>
          <div className="flex gap-2">
            <Button className="flex-1" disabled size="sm">
              <Code2 className="h-4 w-4 mr-2" />
              Comenzar Desafío
            </Button>
            <Button variant="outline" disabled size="sm">
              📊 Ranking
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Las acciones se habilitarán cuando el desafío se publique
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Main Challenge Create Client Component
 */
export const ChallengeCreateClient: React.FC<ChallengeCreateClientProps> = ({
  authUser,
  translations
}) => {
  const router = useRouter()
  const t = (key: string, params?: Record<string, string>) => 
    translate(translations, key, params)

  // Form management
  const {
    values: formData,
    errors,
    setValue,
    validate,
    hasErrors
  } = useChallengeForm()

  // Test cases management
  const {
    testCases,
    addTestCase,
    removeTestCase,
    updateTestCase,
    setTestCases
  } = useTestCases()

  // Actions
  const { loading, createChallenge } = useChallengeActions()

  // UI state
  const [showPreview, setShowPreview] = React.useState(false)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  // Clear messages after timeout
  React.useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null)
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  // Update form data when test cases change
  React.useEffect(() => {
    setValue('testCases', testCases)
  }, [testCases, setValue])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Form submitted!', { formData, testCases })
    console.log('Form data types:', {
      title: typeof formData.title,
      description: typeof formData.description,
      difficulty: typeof formData.difficulty,
      points: typeof formData.points,
      timeLimit: typeof formData.timeLimit,
      startDate: typeof formData.startDate,
      endDate: typeof formData.endDate,
      startDateValue: formData.startDate,
      endDateValue: formData.endDate,
      testCasesLength: testCases.length
    })
    
    // Validaciones específicas con mensajes de toast personalizados
    if (!formData.title.trim()) {
      console.log('Title validation failed')
      toast.error(t("create.titleRequired"))
      return
    }

    if (!formData.description.trim()) {
      toast.error(t("create.descriptionRequired"))
      return
    }

    if (!formData.difficulty) {
      toast.error(t("create.difficultyRequired"))
      return
    }

    if (!formData.points || formData.points <= 0) {
      toast.error(t("create.pointsRequired"))
      return
    }

    if (!formData.timeLimit || formData.timeLimit <= 0) {
      toast.error(t("create.timeLimitRequired"))
      return
    }

    if (!formData.startDate) {
      toast.error(t("create.startDateRequired"))
      return
    }

    if (!formData.endDate) {
      toast.error(t("create.endDateRequired"))
      return
    }

    if (formData.endDate <= formData.startDate) {
      toast.error(t("create.endDateAfterStart"))
      return
    }

    if (testCases.length === 0) {
      toast.error(t("create.mustHaveOneTestCase"))
      return
    }

    // Validar que todos los test cases tengan entrada y salida
    for (let i = 0; i < testCases.length; i++) {
      if (!testCases[i].input.trim()) {
        toast.error(t("create.testCaseInputRequired", { number: (i + 1).toString() }))
        return
      }
      if (!testCases[i].expectedOutput.trim()) {
        toast.error(t("create.testCaseOutputRequired", { number: (i + 1).toString() }))
        return
      }
    }

    // Si todo está bien, intentar crear el desafío
    try {
      const challengeData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        difficulty: formData.difficulty,
        points: formData.points,
        timeLimit: formData.timeLimit,
        startDate: formData.startDate, // Mantener como Date
        endDate: formData.endDate,     // Mantener como Date
        testCases: testCases.map(tc => ({
          input: tc.input.trim(),
          expectedOutput: tc.expectedOutput.trim(),
          isPublic: true // Siempre público como mencionaste
        }))
      }

      console.log('Sending data to API:', challengeData)
      const result = await createChallenge(challengeData)

      if (result?.data?.challenge?.id) {
        toast.success(t("create.createSuccess"))
        setTimeout(() => {
          router.push(`/challenges/${result.data.challenge.id}`)
        }, 2000)
      } else if (result?.challenge?.id) {
        toast.success(t("create.createSuccess"))
        setTimeout(() => {
          router.push(`/challenges/${result.challenge.id}`)
        }, 2000)
      } else {
        throw new Error(t("create.createError"))
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("create.createError")
      toast.error(errorMessage)
    }
  }

  const difficulties: ChallengeDifficulty[] = ['EASY', 'MEDIUM', 'HARD']

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/challenges/manage" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("manage.backToManage")}
            </Link>
            <h1 className="text-3xl font-bold mb-2">{t("create.title")}</h1>
            <p className="text-muted-foreground">{t("create.challengeDetailsDescription")}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-8">
              {/* Status Messages */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code2 className="h-5 w-5 text-primary" />
                    {t("create.basicInfo")}
                  </CardTitle>
                  <CardDescription>
                    {t("create.challengeDetailsDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="title">{t("create.challengeTitle")} *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setValue('title', e.target.value)}
                        placeholder={t("create.titlePlaceholder")}
                        className={errors.title ? "border-destructive" : ""}
                      />
                      {errors.title && (
                        <p className="text-sm text-destructive">{errors.title}</p>
                      )}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="description">{t("create.description")} *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setValue('description', e.target.value)}
                        placeholder={t("create.descriptionPlaceholder")}
                        className={`min-h-[120px] ${errors.description ? "border-destructive" : ""}`}
                      />
                      {errors.description && (
                        <p className="text-sm text-destructive">{errors.description}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="difficulty">{t("create.difficulty")} *</Label>
                      <Select 
                        value={formData.difficulty} 
                        onValueChange={(value) => setValue('difficulty', value as ChallengeDifficulty)}
                      >
                        <SelectTrigger className={errors.difficulty ? "border-destructive" : ""}>
                          <SelectValue placeholder={t("create.selectDifficulty")} />
                        </SelectTrigger>
                        <SelectContent>
                          {difficulties.map((diff) => (
                            <SelectItem key={diff} value={diff}>
                              {t(`challenges.difficulty.${diff.toLowerCase()}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.difficulty && (
                        <p className="text-sm text-destructive">{errors.difficulty}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="points">{t("create.points")} *</Label>
                      <div className="relative">
                        <Trophy className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="points"
                          type="number"
                          min="1"
                          max="1000"
                          value={formData.points}
                          onChange={(e) => setValue('points', parseInt(e.target.value) || 0)}
                          placeholder="100"
                          className={`pl-10 ${errors.points ? "border-destructive" : ""}`}
                        />
                      </div>
                      {errors.points && (
                        <p className="text-sm text-destructive">{errors.points}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeLimit">{t("create.timeLimit")} *</Label>
                      <div className="relative">
                        <Timer className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="timeLimit"
                          type="number"
                          min="1"
                          max="240"
                          value={formData.timeLimit}
                          onChange={(e) => setValue('timeLimit', parseInt(e.target.value) || 0)}
                          placeholder="30"
                          className={`pl-10 ${errors.timeLimit ? "border-destructive" : ""}`}
                        />
                      </div>
                      {errors.timeLimit && (
                        <p className="text-sm text-destructive">{errors.timeLimit}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>{t("create.startDate")} *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.startDate ? format(formData.startDate, "PPP") : t("create.selectDate")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.startDate}
                            onSelect={(date) => date && setValue('startDate', date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("create.endDate")} *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.endDate ? format(formData.endDate, "PPP") : t("create.selectDate")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.endDate}
                            onSelect={(date) => date && setValue('endDate', date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Test Cases */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        {t("create.testCases")} ({testCases.length})
                      </CardTitle>
                      <CardDescription>
                        {t("create.testCasesDescription")}
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addTestCase}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("create.addTestCase")}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {testCases.map((testCase, index) => (
                      <TestCaseForm
                        key={index}
                        testCase={testCase}
                        index={index}
                        onUpdate={(field, value) => updateTestCase(index, field, value)}
                        onRemove={() => removeTestCase(index)}
                        canRemove={testCases.length > 1}
                        t={t}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Dialog open={showPreview} onOpenChange={setShowPreview}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="sm:w-auto"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {t("create.preview")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-5xl w-[95vw] max-h-[85vh] overflow-y-auto p-4 sm:p-6">
                    <DialogHeader className="mb-4">
                      <DialogTitle className="text-xl">Vista Previa del Desafío</DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        Así es como se verá tu desafío para los participantes
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                      <ChallengePreview formData={formData} testCases={testCases} t={t} />
                    </div>
                  </DialogContent>
                </Dialog>
                
                <div className="flex gap-2 sm:ml-auto">
                  <Link href="/challenges/manage">
                    <Button type="button" variant="outline" disabled={loading}>
                      {t("create.cancel")}
                    </Button>
                  </Link>
                  
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {t("create.createChallenge")}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
